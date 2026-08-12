import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionCard, OptionGrid } from '../option-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Fenestration convention, read from the OUTSIDE, left to right:
 * X is a sash that moves, O is a sash that is stationary.
 *
 * These labels were previously inverted. The giveaway is French Door, which is
 * stored as `XX` with two lites — under the inverted reading that described a
 * french door whose panels are both fixed shut.
 */
const OPERATION_TYPES = [
  { value: 'O', label: 'Single Fixed', description: 'Non-operable panel' },
  { value: 'X', label: 'Single Operating', description: 'Opens/closes' },
  { value: 'XO', label: 'XO', description: 'Operating left, fixed right' },
  { value: 'OX', label: 'OX', description: 'Fixed left, operating right' },
  { value: 'OO', label: 'OO (Picture)', description: 'Both panels fixed' },
  { value: 'XX', label: 'XX', description: 'Both panels operate' },
  { value: 'XOX', label: 'XOX', description: 'Operating-Fixed-Operating' },
  { value: 'OXO', label: 'OXO', description: 'Fixed-Operating-Fixed' },
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
      description="Viewed from the outside, left to right (X = operating, O = fixed)"
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
