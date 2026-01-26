import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const OPERATION_TYPES = [
  { value: 'X', label: 'Single Fixed', description: 'Non-operable panel' },
  { value: 'O', label: 'Single Operating', description: 'Opens/closes' },
  { value: 'XO', label: 'XO', description: 'Fixed left, operating right' },
  { value: 'OX', label: 'OX', description: 'Operating left, fixed right' },
  { value: 'XX', label: 'XX (Picture)', description: 'Both panels fixed' },
  { value: 'OO', label: 'OO', description: 'Both panels operate' },
  { value: 'XOX', label: 'XOX', description: 'Fixed-Operating-Fixed' },
  { value: 'OXO', label: 'OXO', description: 'Operating-Fixed-Operating' },
]

export function OperationStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)

  const handleSelect = (operation: string) => {
    updateConfig({ operationType: operation })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Operation"
      description="Choose how the panels operate (X = fixed, O = operating)"
      canContinue={!!currentConfig.operationType}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location Name (optional)</Label>
          <Input
            id="location"
            placeholder="e.g., Master Bedroom, Kitchen"
            value={currentConfig.location || ''}
            onChange={(e) => updateConfig({ location: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Name this window/door location for easy identification
          </p>
        </div>

        <OptionGrid columns={4}>
          {OPERATION_TYPES.map((op) => (
            <OptionCard
              key={op.value}
              label={op.label}
              description={op.description}
              isSelected={currentConfig.operationType === op.value}
              onClick={() => handleSelect(op.value)}
              size="sm"
            />
          ))}
        </OptionGrid>
      </div>
    </StepWrapper>
  )
}
