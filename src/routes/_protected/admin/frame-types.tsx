import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/admin/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-react'
import { listFrameTypes, createFrameType, updateFrameType, deleteFrameType } from '@/server/functions/admin'

interface FrameType {
  id: number
  name: string
  factor: string
}

export const Route = createFileRoute('/_protected/admin/frame-types')({
  loader: async () => {
    const frameTypes = await (listFrameTypes as any)()
    return { frameTypes }
  },
  component: FrameTypesPage,
})

const columnHelper = createColumnHelper<FrameType>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('factor', {
    header: 'Price Factor',
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),
]

function FrameTypesPage() {
  const { frameTypes } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FrameType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingItem(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (item: FrameType) => {
    setEditingItem(item)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: FrameType) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await (deleteFrameType as any)({ data: { id: item.id } })
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      factor: formData.get('factor') as string,
    }

    try {
      if (editingItem) {
        await (updateFrameType as any)({ data: { id: editingItem.id, ...data } })
      } else {
        await (createFrameType as any)({ data })
      }
      setIsDialogOpen(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frame Types</h1>
          <p className="text-gray-500">Manage frame materials like vinyl, aluminum, wood</p>
        </div>
      </div>

      <DataTable
        title="All Frame Types"
        description="Price factor multiplies the base price calculation"
        data={frameTypes || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search frame types..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Frame Type' : 'Add Frame Type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name || ''}
                  required
                  placeholder="e.g., Vinyl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factor">Price Factor</Label>
                <Input
                  id="factor"
                  name="factor"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingItem?.factor || '1.0'}
                  required
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
