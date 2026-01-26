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
import { ArrowLeft, Check, X } from 'lucide-react'
import { listDisclaimers, createDisclaimer, updateDisclaimer, deleteDisclaimer } from '@/server/functions/admin'

interface Disclaimer {
  id: number
  description: string
  sortOrder: number
  includeByDefault: boolean
}

export const Route = createFileRoute('/_protected/admin/disclaimers')({
  loader: async () => {
    const disclaimers = await (listDisclaimers as any)()
    return { disclaimers }
  },
  component: DisclaimersPage,
})

const columnHelper = createColumnHelper<Disclaimer>()

const columns = [
  columnHelper.accessor('sortOrder', {
    header: '#',
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: (info) => (
      <span className="text-sm line-clamp-2">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('includeByDefault', {
    header: 'Default',
    cell: (info) => (
      info.getValue() ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      )
    ),
  }),
]

function DisclaimersPage() {
  const { disclaimers } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Disclaimer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingItem(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (item: Disclaimer) => {
    setEditingItem(item)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: Disclaimer) => {
    if (!confirm('Are you sure you want to delete this disclaimer?')) return

    try {
      await (deleteDisclaimer as any)({ data: { id: item.id } })
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
      description: formData.get('description') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      includeByDefault: formData.get('includeByDefault') === 'on',
    }

    try {
      if (editingItem) {
        await (updateDisclaimer as any)({ data: { id: editingItem.id, ...data } })
      } else {
        await (createDisclaimer as any)({ data })
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
          <h1 className="text-2xl font-bold text-gray-900">Disclaimers</h1>
          <p className="text-gray-500">Manage contract terms and disclaimers</p>
        </div>
      </div>

      <DataTable
        title="All Disclaimers"
        description="Terms automatically added to new customer contracts"
        data={disclaimers || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search disclaimers..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Disclaimer' : 'Add Disclaimer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={editingItem?.description || ''}
                  required
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                  placeholder="Enter the disclaimer text..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue={editingItem?.sortOrder || 0}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Lower numbers appear first
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="includeByDefault">Include by Default</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="includeByDefault"
                      name="includeByDefault"
                      defaultChecked={editingItem?.includeByDefault ?? true}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="includeByDefault" className="text-sm text-gray-600">
                      Add to new customers automatically
                    </label>
                  </div>
                </div>
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
