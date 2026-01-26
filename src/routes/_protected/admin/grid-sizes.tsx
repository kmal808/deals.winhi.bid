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
import { listGridSizes, createGridSize, updateGridSize, deleteGridSize } from '@/server/functions/admin'

interface GridSize {
  id: number
  size: string
}

export const Route = createFileRoute('/_protected/admin/grid-sizes')({
  loader: async () => {
    const gridSizes = await (listGridSizes as any)()
    return { gridSizes }
  },
  component: GridSizesPage,
})

const columnHelper = createColumnHelper<GridSize>()

const columns = [
  columnHelper.accessor('size', {
    header: 'Size',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
]

function GridSizesPage() {
  const { gridSizes } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GridSize | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingItem(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (item: GridSize) => {
    setEditingItem(item)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: GridSize) => {
    if (!confirm(`Are you sure you want to delete "${item.size}"?`)) return

    try {
      await (deleteGridSize as any)({ data: { id: item.id } })
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
      size: formData.get('size') as string,
    }

    try {
      if (editingItem) {
        await (updateGridSize as any)({ data: { id: editingItem.id, ...data } })
      } else {
        await (createGridSize as any)({ data })
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
          <h1 className="text-2xl font-bold text-gray-900">Grid Sizes</h1>
          <p className="text-gray-500">Manage available grid dimensions</p>
        </div>
      </div>

      <DataTable
        title="All Grid Sizes"
        description="Size options for window grids"
        data={gridSizes || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search sizes..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Grid Size' : 'Add Grid Size'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  name="size"
                  defaultValue={editingItem?.size || ''}
                  required
                  placeholder='e.g., 3/4" or 1"'
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
