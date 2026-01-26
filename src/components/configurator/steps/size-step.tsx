import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SizeStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)

  const width = currentConfig.width || 36
  const height = currentConfig.height || 48

  const canContinue = width > 0 && height > 0

  return (
    <StepWrapper
      title="Enter Dimensions"
      description="Specify the width and height in inches"
      canContinue={canContinue}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="width">Width (inches)</Label>
            <Input
              id="width"
              type="number"
              min="12"
              max="144"
              value={width}
              onChange={(e) => updateConfig({ width: parseInt(e.target.value) || 0 })}
              className="text-center text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              type="number"
              min="12"
              max="144"
              value={height}
              onChange={(e) => updateConfig({ height: parseInt(e.target.value) || 0 })}
              className="text-center text-lg"
            />
          </div>
        </div>

        {/* Visual preview */}
        <div className="flex justify-center pt-4">
          <div
            className="border-4 border-gray-400 bg-blue-50 flex items-center justify-center"
            style={{
              width: Math.min(width * 3, 300),
              height: Math.min(height * 3, 300),
            }}
          >
            <span className="text-gray-500 text-sm">
              {width}" × {height}"
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Total UI: {(width * height / 144).toFixed(2)} sq ft
        </p>
      </div>
    </StepWrapper>
  )
}
