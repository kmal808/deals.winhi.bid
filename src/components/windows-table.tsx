import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, GripVertical, DollarSign } from 'lucide-react'
import { updateWindow, deleteWindow } from '@/server/functions/windows'

interface Window {
  id: number
  location: string
  width: string
  height: string
  calculatedPrice: string | null
  manualPrice: string | null
  specialInstructions: string | null
  sortOrder: number | null
  brand?: { name: string } | null
  productConfig?: { name: string } | null
  frameType?: { name: string } | null
  frameColor?: { name: string; hexColor: string } | null
  glassType?: { name: string } | null
  gridStyle?: { name: string } | null
  gridSize?: { size: string } | null
}

interface WindowsTableProps {
  windows: Window[]
  session: { userId: number; role: string }
  onUpdate: () => void
}

export function WindowsTable({ windows, session, onUpdate }: WindowsTableProps) {
  const [editingWindow, setEditingWindow] = useState<Window | null>(null)
  const [priceWindow, setPriceWindow] = useState<Window | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async (window: Window) => {
    if (!confirm(`Delete "${window.location}"? This cannot be undone.`)) return

    try {
      await (deleteWindow as any)({
        data: {
          windowId: window.id,
          representativeId: session.userId,
          role: session.role,
        },
      })
      toast.success('Window deleted')
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingWindow) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await (updateWindow as any)({
        data: {
          windowId: editingWindow.id,
          data: {
            location: formData.get('location') as string,
            width: formData.get('width') as string,
            height: formData.get('height') as string,
            specialInstructions: formData.get('specialInstructions') as string,
          },
          representativeId: session.userId,
          role: session.role,
        },
      })
      toast.success('Window updated')
      setEditingWindow(null)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePriceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!priceWindow) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const manualPrice = formData.get('manualPrice') as string

    try {
      await (updateWindow as any)({
        data: {
          windowId: priceWindow.id,
          data: {
            manualPrice: manualPrice || null,
          },
          representativeId: session.userId,
          role: session.role,
        },
      })
      toast.success(manualPrice ? 'Price override saved' : 'Price override removed')
      setPriceWindow(null)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update price')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPrice = (w: Window) => {
    return parseFloat(w.manualPrice || w.calculatedPrice || '0')
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Options</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {windows.map((window) => (
            <TableRow key={window.id}>
              <TableCell>
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
              </TableCell>
              <TableCell className="font-medium">{window.location}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {window.productConfig?.name || '—'}
                  {window.brand && (
                    <span className="text-gray-500 ml-1">({window.brand.name})</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {window.width}" × {window.height}"
              </TableCell>
              <TableCell>
                <div className="text-xs text-gray-500 space-y-0.5">
                  {window.frameColor && (
                    <div className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: window.frameColor.hexColor }}
                      />
                      {window.frameColor.name}
                    </div>
                  )}
                  {window.glassType && <div>{window.glassType.name}</div>}
                  {window.gridStyle && window.gridStyle.name !== 'None' && (
                    <div>{window.gridStyle.name} Grid</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div>
                  ${getPrice(window).toFixed(2)}
                  {window.manualPrice && (
                    <span className="text-xs text-orange-500 ml-1">(manual)</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceWindow(window)}
                    title="Override Price"
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingWindow(window)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(window)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={!!editingWindow} onOpenChange={() => setEditingWindow(null)}>
        <DialogContent onClose={() => setEditingWindow(null)}>
          <DialogHeader>
            <DialogTitle>Edit Window</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingWindow?.location || ''}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    name="width"
                    type="number"
                    defaultValue={editingWindow?.width || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    defaultValue={editingWindow?.height || ''}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  rows={2}
                  defaultValue={editingWindow?.specialInstructions || ''}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingWindow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Price Override Dialog */}
      <Dialog open={!!priceWindow} onOpenChange={() => setPriceWindow(null)}>
        <DialogContent onClose={() => setPriceWindow(null)}>
          <DialogHeader>
            <DialogTitle>Override Price</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePriceSubmit}>
            <DialogBody className="space-y-4">
              <p className="text-sm text-gray-500">
                Set a manual price to override the calculated price. Leave empty to use calculated price.
              </p>
              <div className="space-y-2">
                <Label>Calculated Price</Label>
                <p className="text-lg font-medium">
                  ${parseFloat(priceWindow?.calculatedPrice || '0').toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualPrice">Manual Price Override</Label>
                <Input
                  id="manualPrice"
                  name="manualPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={priceWindow?.manualPrice || ''}
                  placeholder="Leave empty for calculated price"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPriceWindow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
