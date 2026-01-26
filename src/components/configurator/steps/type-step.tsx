import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'

export function TypeStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const productConfigs = useConfiguratorStore((s) => s.pricingFactors.productConfigs)

  // Filter by current category
  const filteredConfigs = productConfigs.filter(
    (pc) => pc.category === currentConfig.category
  )

  const handleSelect = (config: (typeof productConfigs)[0]) => {
    updateConfig({
      productConfigId: config.id,
      productConfigName: config.name,
      operationType: config.operationType,
    })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Type"
      description={`Choose the type of ${currentConfig.category || 'product'} you want to configure`}
      canContinue={!!currentConfig.productConfigId}
    >
      {filteredConfigs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No product configurations found for this category.</p>
          <p className="text-sm mt-2">Please add product configs in the Admin section.</p>
        </div>
      ) : (
        <OptionGrid columns={3}>
          {filteredConfigs.map((config) => (
            <OptionCard
              key={config.id}
              label={config.name}
              description={config.operationType ? `Operation: ${config.operationType}` : undefined}
              imageSrc={config.imagePath}
              isSelected={currentConfig.productConfigId === config.id}
              onClick={() => handleSelect(config)}
            />
          ))}
        </OptionGrid>
      )}
    </StepWrapper>
  )
}
