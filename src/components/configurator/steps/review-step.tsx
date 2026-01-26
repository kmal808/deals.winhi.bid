import { toast } from 'sonner'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, ArrowLeft } from 'lucide-react'

export function ReviewStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const calculatePrice = useConfiguratorStore((s) => s.calculatePrice)
  const addToCart = useConfiguratorStore((s) => s.addToCart)
  const prevStep = useConfiguratorStore((s) => s.prevStep)

  const price = calculatePrice()

  const handleAddToCart = () => {
    addToCart()
    toast.success('Window added to cart')
  }

  const handleAddAnother = () => {
    addToCart()
    toast.success('Window added to cart - configure another')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <SummaryItem label="Category" value={currentConfig.category || '—'} />
          <SummaryItem label="Type" value={currentConfig.productConfigName || '—'} />
          <SummaryItem label="Operation" value={currentConfig.operationType || '—'} />
          <SummaryItem
            label="Size"
            value={`${currentConfig.width || 0}" × ${currentConfig.height || 0}"`}
          />
          <SummaryItem label="Brand" value={currentConfig.brandName || '—'} />
          <SummaryItem label="Frame Type" value={currentConfig.frameTypeName || '—'} />
          <SummaryItem
            label="Frame Color"
            value={currentConfig.frameColorName || '—'}
            colorHex={currentConfig.frameColorHex || undefined}
          />
          <SummaryItem label="Glass" value={currentConfig.glassTypeName || '—'} />
          <SummaryItem
            label="Grids"
            value={
              currentConfig.noGrid
                ? 'No Grid'
                : currentConfig.gridStyleName
                  ? `${currentConfig.gridStyleName} (${currentConfig.gridSizeName})`
                  : '—'
            }
          />
          {currentConfig.location && (
            <SummaryItem label="Location" value={currentConfig.location} className="col-span-2" />
          )}
        </div>

        {/* Price */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-blue-900">Estimated Price</span>
            <span className="text-2xl font-bold text-blue-600">${price.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleAddToCart} className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button variant="secondary" onClick={handleAddAnother} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add & Configure Another
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryItem({
  label,
  value,
  colorHex,
  className = '',
}: {
  label: string
  value: string
  colorHex?: string
  className?: string
}) {
  return (
    <div className={`border-b border-gray-100 pb-2 ${className}`}>
      <dt className="text-gray-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="font-medium flex items-center gap-2 mt-1 capitalize">
        {colorHex && (
          <span
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: colorHex }}
          />
        )}
        {value}
      </dd>
    </div>
  )
}
