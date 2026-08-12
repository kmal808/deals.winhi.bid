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
import { listBrands, createBrand, updateBrand, deleteBrand } from '@/server/functions/admin'

interface Brand {
  id: number
  name: string
  factor: string
  parFactor: string | null
}

export const Route = createFileRoute('/_protected/admin/brands')({
  loader: async () => {
    const brands = await listBrands()
    return { brands }
  },
  component: BrandsPage,
})

const columnHelper = createColumnHelper<Brand>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('factor', {
    header: 'Quoted Rate',
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),
  columnHelper.accessor('parFactor', {
    header: 'Par (floor)',
    cell: (info) => {
      const par = info.getValue()
      if (!par) return <span className="text-gray-400">—</span>
      const list = parseFloat(info.row.original.factor)
      const room = list > 0 ? Math.max(0, (1 - parseFloat(par) / list) * 100) : 0
      return (
        <span className="text-gray-600">
          {par}
          <span className="ml-2 text-xs text-gray-400">max {room.toFixed(0)}% off</span>
        </span>
      )
    },
  }),
]

function BrandsPage() {
  const { brands } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = () => {
    setEditingBrand(null)
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return

    try {
      await deleteBrand({ data: { id: brand.id } })
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
    const parFactor = (formData.get('parFactor') as string)?.trim()
    const data = {
      name: formData.get('name') as string,
      factor: formData.get('factor') as string,
      ...(parFactor ? { parFactor } : {}),
    }

    try {
      if (editingBrand) {
        await updateBrand({ data: { id: editingBrand.id, ...data } })
      } else {
        await createBrand({ data })
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
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-500">Manage window/door brands and their pricing factors</p>
        </div>
      </div>

      <DataTable
        title="All Brands"
        description="Price factors are dollars per linear inch, summed across all options"
        data={brands || []}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search brands..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
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
                  defaultValue={editingBrand?.name || ''}
                  required
                  placeholder="e.g., Milgard"
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
                  defaultValue={editingBrand?.factor || '1.0'}
                  required
                  placeholder="1.0"
                />
                <p className="text-xs text-gray-500">
                  Dollars per united inch. Added to the frame, colour, glass and grid
                  factors, then multiplied by (width + height).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parFactor">Par (floor rate)</Label>
                <Input
                  id="parFactor"
                  name="parFactor"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingBrand?.parFactor || ''}
                  placeholder="e.g. 16"
                />
                <p className="text-xs text-gray-500">
                  The lowest rate this brand is sold at. Quotes are written above par and
                  discounted back toward it, so this sets how much a rep can give away.
                  Internal only — it never appears on an estimate or contract.
                </p>
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
