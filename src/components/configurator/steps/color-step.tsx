import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'

export function ColorStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const frameColors = useConfiguratorStore((s) => s.pricingFactors.frameColors)
  const frameTypes = useConfiguratorStore((s) => s.pricingFactors.frameTypes)

  // Select frame type first if not selected
  const hasFrameType = !!currentConfig.frameTypeId

  const handleSelectFrameType = (frameType: (typeof frameTypes)[0]) => {
    updateConfig({
      frameTypeId: frameType.id,
      frameTypeName: frameType.name,
    })
  }

  const handleSelectColor = (color: (typeof frameColors)[0]) => {
    updateConfig({
      frameColorId: color.id,
      frameColorName: color.name,
      frameColorHex: color.hexColor,
    })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Frame & Color"
      description="Choose frame material and color"
      canContinue={!!currentConfig.frameTypeId && !!currentConfig.frameColorId}
    >
      <div className="space-y-6">
        {/* Frame Type Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Frame Material</h3>
          {frameTypes.length === 0 ? (
            <p className="text-gray-500 text-sm">No frame types configured.</p>
          ) : (
            <OptionGrid columns={4}>
              {frameTypes.map((type) => (
                <OptionCard
                  key={type.id}
                  label={type.name}
                  isSelected={currentConfig.frameTypeId === type.id}
                  onClick={() => handleSelectFrameType(type)}
                  size="sm"
                />
              ))}
            </OptionGrid>
          )}
        </div>

        {/* Color Selection */}
        {hasFrameType && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Frame Color</h3>
            {frameColors.length === 0 ? (
              <p className="text-gray-500 text-sm">No colors configured.</p>
            ) : (
              <OptionGrid columns={5}>
                {frameColors.map((color) => (
                  <OptionCard
                    key={color.id}
                    label={color.name}
                    colorHex={color.hexColor}
                    isSelected={currentConfig.frameColorId === color.id}
                    onClick={() => handleSelectColor(color)}
                    size="sm"
                  />
                ))}
              </OptionGrid>
            )}
          </div>
        )}
      </div>
    </StepWrapper>
  )
}
