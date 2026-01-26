import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'

export function BrandStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const brands = useConfiguratorStore((s) => s.pricingFactors.brands)

  const handleSelect = (brand: (typeof brands)[0]) => {
    updateConfig({
      brandId: brand.id,
      brandName: brand.name,
    })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Brand"
      description="Choose the manufacturer for your window or door"
      canContinue={!!currentConfig.brandId}
    >
      {brands.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No brands configured.</p>
          <p className="text-sm mt-2">Please add brands in the Admin section.</p>
        </div>
      ) : (
        <OptionGrid columns={3}>
          {brands.map((brand) => (
            <OptionCard
              key={brand.id}
              label={brand.name}
              description={`Factor: ${brand.factor}`}
              isSelected={currentConfig.brandId === brand.id}
              onClick={() => handleSelect(brand)}
            />
          ))}
        </OptionGrid>
      )}
    </StepWrapper>
  )
}
