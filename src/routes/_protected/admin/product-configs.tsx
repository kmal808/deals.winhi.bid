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
import { listProductConfigs, createProductConfig, updateProductConfig, deleteProductConfig } from '@/server/functions/admin'

interface ProductConfig {
  id: number
  name: string
  category: string
  operationType: string | null
  liteCount: number
  imagePath: string | null
}

export const Route = createFileRoute('/_protected/admin/product-configs')({
  loader: async () => {
    const productConfigs = await (listProductConfigs as any)()
    return { productConfigs }
  },
  component: ProductConfigsPage,
})

const columnHelper = createColumnHelper<ProductConfig>()

const columns = [
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => (
      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('operationType', {
    header: 'Operation',
    cell: (info) => (
      <span className="text-gray-600 font-mono">{info.getValue() || '—'}</span>
    ),
  }),
  columnHelper.accessor('liteCount', {
    header: 'Lites',
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),
]

function ProductConfigsPage() {
  const { productConfigs } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductConfig | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingItem(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (item: ProductConfig) => {
    setEditingItem(item)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: ProductConfig) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await (deleteProductConfig as any)({ data: { id: item.id } })
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
      category: formData.get('category') as string,
      operationType: (formData.get('operationType') as string) || null,
      liteCount: parseInt(formData.get('liteCount') as string) || 1,
      imagePath: (formData.get('imagePath') as string) || null,
    }

    try {
      if (editingItem) {
        await (updateProductConfig as any)({ data: { id: editingItem.id, ...data } })
      } else {
        await (createProductConfig as any)({ data })
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
          <h1 className="text-2xl font-bold text-gray-900">Product Configurations</h1>
          <p className="text-gray-500">Define window/door types and operation styles</p>
        </div>
      </div>

      <DataTable
        title="All Product Configs"
        description="Window and door configurations available in the wizard"
        data={productConfigs || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search products..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Product Config' : 'Add Product Config'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={editingItem?.category || 'window'}
                    required
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                  >
                    <option value="window">Window</option>
                    <option value="door">Door</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingItem?.name || ''}
                    required
                    placeholder="e.g., Horizontal Slider"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operationType">Operation Type</Label>
                  <Input
                    id="operationType"
                    name="operationType"
                    defaultValue={editingItem?.operationType || ''}
                    placeholder="e.g., XO, OX, XX"
                  />
                  <p className="text-xs text-gray-500">
                    X = operable, O = fixed. Left to right.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="liteCount">Lite Count</Label>
                  <Input
                    id="liteCount"
                    name="liteCount"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={editingItem?.liteCount || 1}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Number of glass panels
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagePath">Image Path (optional)</Label>
                <Input
                  id="imagePath"
                  name="imagePath"
                  defaultValue={editingItem?.imagePath || ''}
                  placeholder="/images/products/slider-xo.png"
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
