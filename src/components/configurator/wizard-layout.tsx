import { useConfiguratorStore, STEPS, type WizardStep } from '@/stores/configurator-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface WizardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

export function WizardLayout({ children, sidebar }: WizardLayoutProps) {
  const currentStep = useConfiguratorStore((s) => s.currentStep)

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Main wizard content */}
        <div className="lg:col-span-3">
          {children}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const setStep = useConfiguratorStore((s) => s.setStep)
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <nav className="bg-white rounded-lg border border-gray-200 p-4">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = step.key === currentStep
          const isComplete = index < currentIndex
          const isClickable = index <= currentIndex

          return (
            <li key={step.key} className="flex items-center">
              <button
                onClick={() => isClickable && setStep(step.key)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isActive && 'bg-blue-600 text-white',
                    isComplete && 'bg-green-500 text-white',
                    !isActive && !isComplete && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive && 'text-blue-600',
                    isComplete && 'text-green-600',
                    !isActive && !isComplete && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-12 h-0.5 mx-1',
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
