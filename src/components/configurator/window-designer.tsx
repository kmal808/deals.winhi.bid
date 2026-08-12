import { useEffect, useMemo, useState } from 'react'
import { Stage, Layer, Rect, Line, Path, Group } from 'react-konva'
import { Button } from '@/components/ui/button'
import {
  Columns2,
  Rows2,
  Undo2,
} from 'lucide-react'
import {
  DEFAULT_DESIGN_OPTIONS,
  isOperable,
  layoutUnit,
  mergeSection,
  setSash,
  splitSection,
  SWING_APEX,
  type LaidOutLeaf,
  type SashType,
  type UnitDesign,
} from '@/lib/window-design'

/**
 * Interactive window frame designer.
 *
 * Click a panel to select it, split it horizontally or vertically, and set how
 * that panel operates. The drawing on the estimate and contract is produced from
 * this same layout by `components/pdf/window-drawing.tsx`, so what the customer
 * receives matches what was configured here.
 */

const GLASS = '#eaf2fa'
const GLASS_SELECTED = '#dbeafe'
const GLASS_STROKE = '#9bb4cc'
const INK = '#374151'
const ACCENT = '#2563eb'

const SASH_OPTIONS: { value: SashType; label: string }[] = [
  { value: 'fixed', label: 'Fixed (O)' },
  { value: 'slider-left', label: 'Slider ←' },
  { value: 'slider-right', label: 'Slider →' },
  { value: 'casement-left', label: 'Casement L' },
  { value: 'casement-right', label: 'Casement R' },
  { value: 'awning', label: 'Awning' },
  { value: 'hopper', label: 'Hopper' },
  { value: 'hung-single', label: 'Single Hung' },
  { value: 'hung-double', label: 'Double Hung' },
]

function SashMark({ leaf }: { leaf: LaidOutLeaf }) {
  // Indicators live inside the glass, not the sash frame around it.
  const { x, y, width: w, height: h } = leaf.glass
  const { sash } = leaf
  if (!leaf.operable || w <= 2 || h <= 2) return null

  const inset = Math.min(w, h) * 0.16
  const common = { stroke: INK, strokeWidth: 1, listening: false as const }

  switch (sash) {
    case 'slider-left':
    case 'slider-right': {
      const midY = y + h / 2
      const from = sash === 'slider-left' ? x + w - inset : x + inset
      const to = sash === 'slider-left' ? x + inset : x + w - inset
      const head = sash === 'slider-left' ? 1 : -1
      return (
        <Group>
          <Line points={[from, midY, to, midY]} {...common} />
          <Line points={[to, midY, to + head * inset * 0.5, midY - inset * 0.35]} {...common} />
          <Line points={[to, midY, to + head * inset * 0.5, midY + inset * 0.35]} {...common} />
        </Group>
      )
    }
    case 'casement-left':
    case 'casement-right': {
      const hingeEdge = sash === 'casement-left' ? x : x + w
      const handleEdge = sash === 'casement-left' ? x + w : x
      const hinge = SWING_APEX === 'hinge' ? hingeEdge : handleEdge
      const far = SWING_APEX === 'hinge' ? handleEdge : hingeEdge
      return (
        <Path
          data={`M ${far} ${y + inset} L ${hinge} ${y + h / 2} L ${far} ${y + h - inset}`}
          {...common}
        />
      )
    }
    case 'awning':
    case 'hopper': {
      const hingeEdgeY = sash === 'awning' ? y : y + h
      const handleEdgeY = sash === 'awning' ? y + h : y
      const hingeY = SWING_APEX === 'hinge' ? hingeEdgeY : handleEdgeY
      const farY = SWING_APEX === 'hinge' ? handleEdgeY : hingeEdgeY
      return (
        <Path
          data={`M ${x + inset} ${farY} L ${x + w / 2} ${hingeY} L ${x + w - inset} ${farY}`}
          {...common}
        />
      )
    }
    case 'hung-single':
    case 'hung-double': {
      const midX = x + w / 2
      const arrow = (dir: 1 | -1, startY: number, key: string) => (
        <Group key={key}>
          <Line points={[midX, startY, midX, startY + dir * inset]} {...common} />
          <Line
            points={[
              midX,
              startY + dir * inset,
              midX - inset * 0.35,
              startY + dir * inset * 0.5,
            ]}
            {...common}
          />
          <Line
            points={[
              midX,
              startY + dir * inset,
              midX + inset * 0.35,
              startY + dir * inset * 0.5,
            ]}
            {...common}
          />
        </Group>
      )
      return (
        <Group>
          {arrow(1, y + h * 0.3, 'a')}
          {sash === 'hung-double' ? arrow(-1, y + h * 0.7, 'b') : null}
        </Group>
      )
    }
    default:
      return null
  }
}

interface WindowDesignerProps {
  design: UnitDesign
  width: number
  height: number
  onChange: (design: UnitDesign) => void
  /** Drawing area in pixels. */
  canvasWidth?: number
  canvasHeight?: number
  frameColor?: string | null
}

export function WindowDesigner({
  design,
  width,
  height,
  onChange,
  canvasWidth = 420,
  canvasHeight = 320,
  frameColor,
}: WindowDesignerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // react-konva draws to a canvas, which does not exist during SSR.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const layout = useMemo(
    () => layoutUnit(design, width, height, DEFAULT_DESIGN_OPTIONS),
    [design, width, height]
  )

  // Preserve the unit's real proportions; a 96×24 transom must not be drawn square.
  const scale = Math.min(
    canvasWidth / Math.max(layout.outer.width, 1),
    canvasHeight / Math.max(layout.outer.height, 1)
  )
  const drawnWidth = layout.outer.width * scale
  const drawnHeight = layout.outer.height * scale
  const offsetX = (canvasWidth - drawnWidth) / 2
  const offsetY = (canvasHeight - drawnHeight) / 2

  const sx = (v: number) => offsetX + v * scale
  const sy = (v: number) => offsetY + v * scale
  const s = (v: number) => v * scale

  const scaledLeaves = layout.leaves.map((l) => ({
    ...l,
    x: sx(l.x),
    y: sy(l.y),
    width: s(l.width),
    height: s(l.height),
    glass: {
      x: sx(l.glass.x),
      y: sy(l.glass.y),
      width: s(l.glass.width),
      height: s(l.glass.height),
    },
  }))

  // A section can disappear when its parent is merged; do not keep pointing at it.
  const selected = scaledLeaves.find((l) => l.id === selectedId) ?? null
  const activeId = selected?.id ?? null

  const apply = (next: UnitDesign, keepId?: string) => {
    onChange(next)
    setSelectedId(keepId ?? null)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-2">
        {mounted ? (
          <Stage width={canvasWidth} height={canvasHeight}>
            <Layer>
              <Rect
                x={offsetX}
                y={offsetY}
                width={drawnWidth}
                height={drawnHeight}
                fill={frameColor || '#ffffff'}
                stroke={INK}
                strokeWidth={1.5}
                listening={false}
              />

              {scaledLeaves
                .filter((l) => l.operable)
                .map((l) => (
                  <Rect
                    key={`s-${l.id}`}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    fill={frameColor || '#ffffff'}
                    stroke={INK}
                    strokeWidth={0.75}
                    onClick={() => setSelectedId(l.id)}
                    onTap={() => setSelectedId(l.id)}
                  />
                ))}

              {scaledLeaves.map((l) => (
                <Rect
                  key={l.id}
                  x={l.glass.x}
                  y={l.glass.y}
                  width={l.glass.width}
                  height={l.glass.height}
                  fill={l.id === activeId ? GLASS_SELECTED : GLASS}
                  stroke={l.id === activeId ? ACCENT : GLASS_STROKE}
                  strokeWidth={l.id === activeId ? 2 : 1}
                  onClick={() => setSelectedId(l.id)}
                  onTap={() => setSelectedId(l.id)}
                />
              ))}

              {layout.mullions.map((m) => (
                <Rect
                  key={m.id}
                  x={sx(m.x)}
                  y={sy(m.y)}
                  width={s(m.width)}
                  height={s(m.height)}
                  fill={frameColor || '#ffffff'}
                  stroke={INK}
                  strokeWidth={0.75}
                  listening={false}
                />
              ))}

              {scaledLeaves.map((l) => (
                <SashMark key={`m-${l.id}`} leaf={l} />
              ))}
            </Layer>
          </Stage>
        ) : (
          <div
            style={{ width: canvasWidth, height: canvasHeight }}
            className="animate-pulse rounded bg-gray-50"
          />
        )}
      </div>

      {selected ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Selected panel</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => apply(splitSection(design, selected.id, 'row'))}
            >
              <Columns2 className="mr-2 h-4 w-4" />
              Split vertically
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => apply(splitSection(design, selected.id, 'column'))}
            >
              <Rows2 className="mr-2 h-4 w-4" />
              Split horizontally
            </Button>
            {design.root.kind === 'split' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => apply(mergeSection(design, design.root.id))}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Reset to one panel
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {SASH_OPTIONS.map((option) => {
              const active = selected.sash === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => apply(setSash(design, selected.id, option.value), selected.id)}
                  className={
                    active
                      ? 'rounded-md border border-blue-500 bg-blue-50 px-3 py-1.5 text-sm text-blue-700'
                      : 'rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Click a panel to split it or change how it operates.
        </p>
      )}

      <p className="text-xs text-gray-400">
        {layout.leaves.length} panel{layout.leaves.length === 1 ? '' : 's'} ·{' '}
        {layout.leaves.filter((l) => isOperable(l.sash)).length} operating · viewed from outside
      </p>
    </div>
  )
}
