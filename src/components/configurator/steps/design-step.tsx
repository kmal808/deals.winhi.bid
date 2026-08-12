import { useMemo } from 'react'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { StepWrapper } from '../step-wrapper'
import { WindowDesigner } from '../window-designer'
import { designFromOperationType } from '@/lib/window-design'

/**
 * Frame designer step.
 *
 * Opens with the layout implied by the operation code chosen earlier (XOX seeds
 * three panels), which the rep can then subdivide for transoms, sidelites and
 * anything the flat codes cannot express.
 */
export function DesignStep() {
  const currentConfig = useConfiguratorStore((s) => s.currentConfig)
  const updateConfig = useConfiguratorStore((s) => s.updateConfig)

  const design = useMemo(
    () =>
      currentConfig.design ??
      designFromOperationType(currentConfig.operationType, currentConfig.category || 'window'),
    [currentConfig.design, currentConfig.operationType, currentConfig.category]
  )

  return (
    <StepWrapper
      title="Design the Frame"
      description="Split panels and set how each one operates. This drawing appears on the estimate and contract."
      canContinue
    >
      <WindowDesigner
        design={design}
        width={currentConfig.width || 36}
        height={currentConfig.height || 48}
        frameColor={currentConfig.frameColorHex}
        onChange={(next) => updateConfig({ design: next })}
      />
    </StepWrapper>
  )
}
