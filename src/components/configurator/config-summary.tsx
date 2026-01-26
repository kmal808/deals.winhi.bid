import { useConfiguratorStore } from '@/stores/configurator-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2 } from 'lucide-react'

export function ConfigSummary() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const cart = useConfiguratorStore((s) => s.cart)
  const calculatePrice = useConfiguratorStore((s) => s.calculatePrice)
  const removeFromCart = useConfiguratorStore((s) => s.removeFromCart)
  const editCartItem = useConfiguratorStore((s) => s.editCartItem)

  const currentPrice = calculatePrice()
  const cartTotal = cart.reduce((sum, item) => sum + item.calculatedPrice, 0)

  return (
    <div className="space-y-4">
      {/* Current Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {currentConfig.category && (
            <SummaryRow label="Category" value={currentConfig.category} />
          )}
          {currentConfig.productConfigName && (
            <SummaryRow label="Type" value={currentConfig.productConfigName} />
          )}
          {currentConfig.operationType && (
            <SummaryRow label="Operation" value={currentConfig.operationType} />
          )}
          {currentConfig.width && currentConfig.height && (
            <SummaryRow label="Size" value={`${currentConfig.width}" × ${currentConfig.height}"`} />
          )}
          {currentConfig.brandName && (
            <SummaryRow label="Brand" value={currentConfig.brandName} />
          )}
          {currentConfig.frameColorName && (
            <SummaryRow
              label="Color"
              value={currentConfig.frameColorName}
              colorHex={currentConfig.frameColorHex || undefined}
            />
          )}
          {currentConfig.glassTypeName && (
            <SummaryRow label="Glass" value={currentConfig.glassTypeName} />
          )}
          {currentConfig.noGrid ? (
            <SummaryRow label="Grids" value="No Grid" />
          ) : currentConfig.gridStyleName ? (
            <SummaryRow label="Grids" value={currentConfig.gridStyleName} />
          ) : null}

          {currentPrice > 0 && (
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between font-medium">
                <span>Est. Price</span>
                <span className="text-blue-600">${currentPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-500">No items in cart</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between text-sm border-b pb-2 last:border-0"
                >
                  <div className="flex-1">
                    <button
                      onClick={() => editCartItem(item.id)}
                      className="font-medium hover:text-blue-600 text-left"
                    >
                      {item.location}
                    </button>
                    <p className="text-xs text-gray-500">
                      {item.productConfigName} • {item.width}" × {item.height}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${item.calculatedPrice.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Cart Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  colorHex,
}: {
  label: string
  value: string
  colorHex?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-2">
        {colorHex && (
          <span
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: colorHex }}
          />
        )}
        <span className="capitalize">{value}</span>
      </span>
    </div>
  )
}
