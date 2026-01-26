import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { WizardLayout } from '@/components/configurator/wizard-layout'
import { ConfigSummary } from '@/components/configurator/config-summary'
import {
  CategoryStep,
  TypeStep,
  OperationStep,
  SizeStep,
  BrandStep,
  ColorStep,
  GlassStep,
  GridsStep,
  ReviewStep,
} from '@/components/configurator/steps'
import { loadPricingFactors, saveCartToWindows } from '@/server/functions/configurator'
import { getCustomer } from '@/server/functions/customers'
import { getSession } from '@/lib/auth'

export const Route = createFileRoute('/_protected/configurator/$customerId')({
  loader: async ({ params }) => {
    const session = await getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const customerId = parseInt(params.customerId, 10)

    const [pricingFactors, customer] = await Promise.all([
      (loadPricingFactors as any)(),
      (getCustomer as any)({
        data: {
          customerId,
          representativeId: session.userId,
          role: session.role,
        },
      }),
    ])

    return { pricingFactors, customer, session }
  },
  component: ConfiguratorPage,
})

function ConfiguratorPage() {
  const { pricingFactors, customer, session } = Route.useLoaderData()
  const navigate = useNavigate()

  const currentStep = useConfiguratorStore((s) => s.currentStep)
  const setCustomerId = useConfiguratorStore((s) => s.setCustomerId)
  const setPricingFactors = useConfiguratorStore((s) => s.setPricingFactors)
  const cart = useConfiguratorStore((s) => s.cart)
  const clearCart = useConfiguratorStore((s) => s.clearCart)

  // Initialize store with customer ID and pricing factors
  useEffect(() => {
    setCustomerId(customer.id)
    setPricingFactors(pricingFactors)
  }, [customer.id, pricingFactors, setCustomerId, setPricingFactors])

  const handleSaveCart = async () => {
    if (cart.length === 0) return

    try {
      await (saveCartToWindows as any)({
        data: {
          customerId: customer.id,
          items: cart,
          representativeId: session.userId,
          role: session.role,
        },
      })
      toast.success(`${cart.length} window${cart.length > 1 ? 's' : ''} saved`)
      clearCart()
      navigate({ to: '/customers/$customerId', params: { customerId: String(customer.id) } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'category':
        return <CategoryStep />
      case 'type':
        return <TypeStep />
      case 'operation':
        return <OperationStep />
      case 'size':
        return <SizeStep />
      case 'brand':
        return <BrandStep />
      case 'color':
        return <ColorStep />
      case 'glass':
        return <GlassStep />
      case 'grids':
        return <GridsStep />
      case 'review':
        return <ReviewStep />
      default:
        return <CategoryStep />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: '/customers/$customerId', params: { customerId: String(customer.id) } })
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customer
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Window Configurator</h1>
            <p className="text-gray-500">
              Configuring for: <span className="font-medium">{customer.name}</span>
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <Button onClick={handleSaveCart}>
            <Save className="h-4 w-4 mr-2" />
            Save Cart ({cart.length} items)
          </Button>
        )}
      </div>

      {/* Wizard */}
      <WizardLayout sidebar={<ConfigSummary />}>
        {renderStep()}
      </WizardLayout>
    </div>
  )
}
