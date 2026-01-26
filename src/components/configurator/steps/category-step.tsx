import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { OptionGrid } from '../option-card'
import { LayoutGrid, DoorOpen } from 'lucide-react'

export function CategoryStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)
  const nextStep = useConfiguratorStore((s) => s.nextStep)

  const handleSelect = (category: 'window' | 'door') => {
    updateConfig({ category })
    nextStep()
  }

  return (
    <StepWrapper
      title="Select Category"
      description="Choose whether you're configuring a window or a door"
      canContinue={!!currentConfig.category}
    >
      <OptionGrid columns={2}>
        <button
          onClick={() => handleSelect('window')}
          className={`flex flex-col items-center p-8 rounded-lg border-2 transition-all ${
            currentConfig.category === 'window'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <LayoutGrid className="h-16 w-16 text-gray-600 mb-4" />
          <span className="text-lg font-medium">Window</span>
          <span className="text-sm text-gray-500 mt-1">
            Sliding, casement, awning, and more
          </span>
        </button>

        <button
          onClick={() => handleSelect('door')}
          className={`flex flex-col items-center p-8 rounded-lg border-2 transition-all ${
            currentConfig.category === 'door'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <DoorOpen className="h-16 w-16 text-gray-600 mb-4" />
          <span className="text-lg font-medium">Door</span>
          <span className="text-sm text-gray-500 mt-1">
            Patio doors, French doors, and more
          </span>
        </button>
      </OptionGrid>
    </StepWrapper>
  )
}
