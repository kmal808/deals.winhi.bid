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
import { listFrameColors, createFrameColor, updateFrameColor, deleteFrameColor } from '@/server/functions/admin'

interface FrameColor {
  id: number
  name: string
  hexColor: string
  factor: string
}

export const Route = createFileRoute('/_protected/admin/frame-colors')({
  loader: async () => {
    const frameColors = await (listFrameColors as any)()
    return { frameColors }
  },
  component: FrameColorsPage,
})

const columnHelper = createColumnHelper<FrameColor>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('hexColor', {
    header: 'Color',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: info.getValue() }}
        />
        <span className="text-gray-600 font-mono text-sm">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('factor', {
    header: 'Price Factor',
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),
]

function FrameColorsPage() {
  const { frameColors } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FrameColor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingItem(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (item: FrameColor) => {
    setEditingItem(item)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: FrameColor) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await (deleteFrameColor as any)({ data: { id: item.id } })
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
      hexColor: formData.get('hexColor') as string,
      factor: formData.get('factor') as string,
    }

    try {
      if (editingItem) {
        await (updateFrameColor as any)({ data: { id: editingItem.id, ...data } })
      } else {
        await (createFrameColor as any)({ data })
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
          <h1 className="text-2xl font-bold text-gray-900">Frame Colors</h1>
          <p className="text-gray-500">Manage available frame colors with hex codes</p>
        </div>
      </div>

      <DataTable
        title="All Frame Colors"
        description="Colors displayed to customers during configuration"
        data={frameColors || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search colors..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Frame Color' : 'Add Frame Color'}</DialogTitle>
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
                  placeholder="e.g., White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hexColor">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="hexColor"
                    name="hexColor"
                    type="color"
                    defaultValue={editingItem?.hexColor || '#FFFFFF'}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    defaultValue={editingItem?.hexColor || '#FFFFFF'}
                    className="flex-1 font-mono"
                    placeholder="#FFFFFF"
                    onChange={(e) => {
                      const colorInput = document.getElementById('hexColor') as HTMLInputElement
                      if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        colorInput.value = e.target.value
                      }
                    }}
                  />
                </div>
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
