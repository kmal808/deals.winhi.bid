import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'

export function GlassStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const glassTypes = useConfiguratorStore((s) => s.pricingFactors.glassTypes)

  const handleSelect = (glass: (typeof glassTypes)[0]) => {
    updateConfig({
      glassTypeId: glass.id,
      glassTypeName: glass.name,
    })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Glass Type"
      description="Choose the glass for your window or door"
      canContinue={!!currentConfig.glassTypeId}
    >
      {glassTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No glass types configured.</p>
          <p className="text-sm mt-2">Please add glass types in the Admin section.</p>
        </div>
      ) : (
        <OptionGrid columns={3}>
          {glassTypes.map((glass) => (
            <OptionCard
              key={glass.id}
              label={glass.name}
              description={`Factor: ${glass.factor}`}
              imageSrc={glass.imagePath}
              isSelected={currentConfig.glassTypeId === glass.id}
              onClick={() => handleSelect(glass)}
            />
          ))}
        </OptionGrid>
      )}
    </StepWrapper>
  )
}
