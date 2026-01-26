import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'
import { Button } from '@/components/ui/button'

export function GridsStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const gridStyles = useConfiguratorStore((s) => s.pricingFactors.gridStyles)
  const gridSizes = useConfiguratorStore((s) => s.pricingFactors.gridSizes)

  const handleNoGrid = () => {
    updateConfig({
      noGrid: true,
      gridStyleId: null,
      gridStyleName: null,
      gridSizeId: null,
      gridSizeName: null,
    })
    nextStep()
  }

  const handleSelectStyle = (style: (typeof gridStyles)[0]) => {
    updateConfig({
      noGrid: false,
      gridStyleId: style.id,
      gridStyleName: style.name,
    })
  }

  const handleSelectSize = (size: (typeof gridSizes)[0]) => {
    updateConfig({
      gridSizeId: size.id,
      gridSizeName: size.size,
    })
    nextStep()
  }

  const hasStyle = !!currentConfig.gridStyleId
  const canContinue = currentConfig.noGrid || (!!currentConfig.gridStyleId && !!currentConfig.gridSizeId)

  return (
    <StepWrapper
      title="Select Grid Pattern"
      description="Add decorative grids or choose no grid"
      canContinue={canContinue}
    >
      <div className="space-y-6">
        {/* No Grid Option */}
        <div>
          <Button
            variant={currentConfig.noGrid ? 'default' : 'outline'}
            onClick={handleNoGrid}
            className="w-full"
          >
            No Grid (Plain Glass)
          </Button>
        </div>

        {!currentConfig.noGrid && (
          <>
            {/* Grid Style */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Grid Style</h3>
              {gridStyles.length === 0 ? (
                <p className="text-gray-500 text-sm">No grid styles configured.</p>
              ) : (
                <OptionGrid columns={3}>
                  {gridStyles.map((style) => (
                    <OptionCard
                      key={style.id}
                      label={style.name}
                      description={`Factor: ${style.factor}`}
                      imageSrc={style.imagePath}
                      isSelected={currentConfig.gridStyleId === style.id}
                      onClick={() => handleSelectStyle(style)}
                    />
                  ))}
                </OptionGrid>
              )}
            </div>

            {/* Grid Size */}
            {hasStyle && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Grid Size</h3>
                {gridSizes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No grid sizes configured.</p>
                ) : (
                  <OptionGrid columns={4}>
                    {gridSizes.map((size) => (
                      <OptionCard
                        key={size.id}
                        label={size.size}
                        isSelected={currentConfig.gridSizeId === size.id}
                        onClick={() => handleSelectSize(size)}
                        size="sm"
                      />
                    ))}
                  </OptionGrid>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </StepWrapper>
  )
}
