import { Svg, Rect, Line, Path } from '@react-pdf/renderer'
import { BRAND } from '@/lib/brand'
import {
  DEFAULT_DESIGN_OPTIONS,
  layoutUnit,
  SWING_APEX,
  type LaidOutLeaf,
  type UnitDesign,
} from '@/lib/window-design'

/**
 * The line-item drawing printed on the estimate and contract.
 *
 * Drawn as vector from the same `layoutUnit` the on-screen designer uses, so the
 * customer sees the same picture the rep configured, and the PDF stays sharp at
 * any print size without storing a bitmap per window.
 */

interface WindowDrawingProps {
  design: UnitDesign
  /** Real-world dimensions in inches; used for the aspect ratio. */
  width: number
  height: number
  /** Size of the drawing on the page, in points. */
  boxWidth?: number
  boxHeight?: number
  frameColor?: string | null
}

const GLASS = '#eaf2fa'
const GLASS_STROKE = '#9bb4cc'
const INK = BRAND.black

/**
 * Sash indicators use the standard drafting shorthand: an operating panel is
 * marked with lines converging on the hinge or handle edge, a fixed panel is
 * left blank.
 */
function SashIndicator({ leaf }: { leaf: LaidOutLeaf }) {
  // Indicators live inside the glass, not the sash frame around it.
  const { x, y, width: w, height: h } = leaf.glass
  const { sash } = leaf
  if (!leaf.operable || w <= 0 || h <= 0) return null

  const inset = Math.min(w, h) * 0.16
  const stroke = INK
  const strokeWidth = 0.6

  switch (sash) {
    // Sliders: an arrow along the middle pointing the way the panel travels.
    case 'slider-left':
    case 'slider-right': {
      const midY = y + h / 2
      const from = sash === 'slider-left' ? x + w - inset : x + inset
      const to = sash === 'slider-left' ? x + inset : x + w - inset
      const head = sash === 'slider-left' ? 1 : -1
      return (
        <>
          <Line x1={from} y1={midY} x2={to} y2={midY} strokeWidth={strokeWidth} stroke={stroke} />
          <Line
            x1={to}
            y1={midY}
            x2={to + head * inset * 0.5}
            y2={midY - inset * 0.35}
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
          <Line
            x1={to}
            y1={midY}
            x2={to + head * inset * 0.5}
            y2={midY + inset * 0.35}
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
        </>
      )
    }

    // Casements hinge on one side; SWING_APEX decides which edge the point sits on.
    case 'casement-left':
    case 'casement-right': {
      const hingeEdge = sash === 'casement-left' ? x : x + w
      const handleEdge = sash === 'casement-left' ? x + w : x
      const hinge = SWING_APEX === 'hinge' ? hingeEdge : handleEdge
      const far = SWING_APEX === 'hinge' ? handleEdge : hingeEdge
      return (
        <Path
          d={`M ${far} ${y + inset} L ${hinge} ${y + h / 2} L ${far} ${y + h - inset}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
        />
      )
    }

    // Awning hinges at the top, hopper at the bottom — the same rule a quarter turn.
    case 'awning':
    case 'hopper': {
      const hingeEdgeY = sash === 'awning' ? y : y + h
      const handleEdgeY = sash === 'awning' ? y + h : y
      const hingeY = SWING_APEX === 'hinge' ? hingeEdgeY : handleEdgeY
      const farY = SWING_APEX === 'hinge' ? handleEdgeY : hingeEdgeY
      return (
        <Path
          d={`M ${x + inset} ${farY} L ${x + w / 2} ${hingeY} L ${x + w - inset} ${farY}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
        />
      )
    }

    // Hung windows slide vertically; double hung moves both sashes.
    case 'hung-single':
    case 'hung-double': {
      const midX = x + w / 2
      const arrow = (dir: 1 | -1, startY: number) => (
        <>
          <Line
            x1={midX}
            y1={startY}
            x2={midX}
            y2={startY + dir * inset}
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
          <Line
            x1={midX}
            y1={startY + dir * inset}
            x2={midX - inset * 0.35}
            y2={startY + dir * inset * 0.5}
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
          <Line
            x1={midX}
            y1={startY + dir * inset}
            x2={midX + inset * 0.35}
            y2={startY + dir * inset * 0.5}
            strokeWidth={strokeWidth}
            stroke={stroke}
          />
        </>
      )
      return (
        <>
          {arrow(1, y + h * 0.3)}
          {sash === 'hung-double' ? arrow(-1, y + h * 0.7) : null}
        </>
      )
    }

    default:
      return null
  }
}

export function WindowDrawing({
  design,
  width,
  height,
  boxWidth = 70,
  boxHeight = 70,
  frameColor,
}: WindowDrawingProps) {
  if (!design || width <= 0 || height <= 0) return null

  const layout = layoutUnit(design, width, height, DEFAULT_DESIGN_OPTIONS)

  // Fit the unit inside the box without distorting its proportions — a 96" x 24"
  // transom and a 24" x 96" sidelite must not both come out square.
  const scale = Math.min(boxWidth / layout.outer.width, boxHeight / layout.outer.height)
  const drawnWidth = layout.outer.width * scale
  const drawnHeight = layout.outer.height * scale
  const offsetX = (boxWidth - drawnWidth) / 2
  const offsetY = (boxHeight - drawnHeight) / 2

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

  return (
    <Svg width={boxWidth} height={boxHeight} viewBox={`0 0 ${boxWidth} ${boxHeight}`}>
      {/* Outer frame */}
      <Rect
        x={offsetX}
        y={offsetY}
        width={drawnWidth}
        height={drawnHeight}
        fill={frameColor || '#ffffff'}
        stroke={INK}
        strokeWidth={0.9}
      />

      {/* Sash frame around operating panels; fixed lites are glazed direct */}
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
            strokeWidth={0.5}
          />
        ))}

      {/* Glass */}
      {scaledLeaves.map((l) => (
        <Rect
          key={l.id}
          x={l.glass.x}
          y={l.glass.y}
          width={l.glass.width}
          height={l.glass.height}
          fill={GLASS}
          stroke={GLASS_STROKE}
          strokeWidth={0.5}
        />
      ))}

      {/* Dividers */}
      {layout.mullions.map((m) => (
        <Rect
          key={m.id}
          x={sx(m.x)}
          y={sy(m.y)}
          width={s(m.width)}
          height={s(m.height)}
          fill={frameColor || '#ffffff'}
          stroke={INK}
          strokeWidth={0.5}
        />
      ))}

      {scaledLeaves.map((l) => (
        <SashIndicator key={`i-${l.id}`} leaf={l} />
      ))}
    </Svg>
  )
}
