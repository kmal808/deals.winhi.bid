import { useConfiguratorStore } from '@/stores/configurator-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface StepWrapperProps {
  title: string
  description?: string
  children: React.ReactNode
  canContinue?: boolean
  onContinue?: () => void
  showBackButton?: boolean
  continueLabel?: string
}

export function StepWrapper({
  title,
  description,
  children,
  canContinue = true,
  onContinue,
  showBackButton = true,
  continueLabel = 'Continue',
}: StepWrapperProps) {
  const nextStep = useConfiguratorStore((s) => s.nextStep)
  const prevStep = useConfiguratorStore((s) => s.prevStep)
  const currentStep = useConfiguratorStore((s) => s.currentStep)

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      nextStep()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          {showBackButton && currentStep !== 'category' ? (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={handleContinue} disabled={!canContinue}>
            {continueLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
