/**
 * The shape of a window unit, and how to turn that shape into geometry.
 *
 * Deliberately free of React, Konva and @react-pdf: the on-screen designer and
 * the drawing printed on the estimate and contract must be the same picture, so
 * both render from the output of `layoutUnit` rather than drawing independently.
 *
 * All dimensions are in inches; callers scale to pixels or PDF points.
 */

/**
 * Read from the OUTSIDE, left to right. `X` moves, `O` is stationary — the
 * industry convention, and the one printed on the contract.
 */
export type SashType =
  | 'fixed'
  | 'slider-left'
  | 'slider-right'
  | 'casement-left'
  | 'casement-right'
  | 'awning'
  | 'hopper'
  | 'hung-single'
  | 'hung-double'

export interface LeafSection {
  id: string
  kind: 'leaf'
  sash: SashType
}

export interface SplitSection {
  id: string
  kind: 'split'
  /** 'row' lays children out left to right; 'column' top to bottom. */
  direction: 'row' | 'column'
  children: WindowSection[]
  /**
   * Relative share of the parent per child, same length as `children`.
   * Omitted means equal shares. Values are normalised, so [2,1] and [4,2] agree.
   */
  ratios?: number[]
}

export type WindowSection = LeafSection | SplitSection

export interface UnitDesign {
  /** Bumped when the shape of this structure changes, so old rows stay readable. */
  version: 1
  root: WindowSection
}

export interface DesignOptions {
  /** Outer frame thickness. */
  frame: number
  /** Divider thickness between adjacent sections. */
  mullion: number
  /**
   * Thickness of an operating panel's own sash frame.
   *
   * A fixed lite is glazed straight into the frame and has no sash, so its glass
   * fills the whole section; an operating panel carries a sash around its glass.
   * Drawing that difference is what makes an elevation readable at a glance.
   */
  sash: number
}

export const DEFAULT_DESIGN_OPTIONS: DesignOptions = { frame: 2, mullion: 1.5, sash: 1.5 }

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface LaidOutLeaf extends Rect {
  id: string
  sash: SashType
  operable: boolean
  /**
   * The glazed area. Equal to the section for a fixed lite; inset by the sash
   * thickness for an operating panel. Indicators are drawn inside this.
   */
  glass: Rect
}

export interface LaidOutMullion extends Rect {
  id: string
  orientation: 'vertical' | 'horizontal'
}

export interface UnitLayout {
  /** The overall unit, including the outer frame. */
  outer: Rect
  /** The glazed opening inside the outer frame. */
  opening: Rect
  leaves: LaidOutLeaf[]
  mullions: LaidOutMullion[]
}

const OPERABLE: Record<SashType, boolean> = {
  fixed: false,
  'slider-left': true,
  'slider-right': true,
  'casement-left': true,
  'casement-right': true,
  awning: true,
  hopper: true,
  'hung-single': true,
  'hung-double': true,
}

export function isOperable(sash: SashType): boolean {
  return OPERABLE[sash] ?? false
}

/**
 * Which edge the swing indicator's apex points at.
 *
 * Two conventions exist and they are exact mirrors of each other, so this is a
 * single switch rather than a per-sash decision: an awning is a casement rotated
 * a quarter turn, and both renderers derive every swing mark from this.
 *
 * - `'hinge'`  — apex on the hinged edge (top for an awning, left for a CL)
 * - `'handle'` — apex on the edge that moves (bottom for an awning, right for a CL)
 *
 * Flip this one value to flip casement, awning and hopper together and stay
 * internally consistent. Verify against what the shop and installers read before
 * this reaches a customer.
 */
export const SWING_APEX: 'hinge' | 'handle' = 'hinge'

/** Ids only need to be unique within one design, and stable across re-renders. */
let idCounter = 0
export function nextSectionId(prefix = 's'): string {
  idCounter += 1
  return `${prefix}${idCounter}`
}

export function leaf(sash: SashType = 'fixed', id = nextSectionId()): LeafSection {
  return { id, kind: 'leaf', sash }
}

/**
 * Builds the starting design for an operation code like `XOX`.
 *
 * Each character becomes one section in a left-to-right row. Codes that are not
 * made of X/O (a casement or awning, say) become a single sash of that type.
 */
export function designFromOperationType(
  operationType: string | null | undefined,
  category: 'window' | 'door' = 'window'
): UnitDesign {
  const code = (operationType ?? '').trim().toUpperCase()

  /**
   * Canonical codes: XO, OX, XOX, PW, CR, CL, AWN.
   * PIC/AW/HOP/SH/DH are aliases kept so rows seeded before the vocabulary was
   * settled still resolve to the right sash.
   */
  const named: Record<string, SashType> = {
    PW: 'fixed',
    AWN: 'awning',
    CL: 'casement-left',
    CR: 'casement-right',
    // Legacy aliases
    PIC: 'fixed',
    AW: 'awning',
    HOP: 'hopper',
    SH: 'hung-single',
    DH: 'hung-double',
  }

  if (named[code]) {
    return { version: 1, root: leaf(named[code]) }
  }

  if (!code || !/^[XO]+$/.test(code)) {
    return { version: 1, root: leaf('fixed') }
  }

  const panels = code.split('')
  const children = panels.map((c, index) => {
    if (c === 'O') return leaf('fixed')
    // An operating panel slides toward the nearest end of the unit; a door leaf
    // swings the same way. Left half opens left, right half opens right.
    const towardLeft = index < panels.length / 2
    if (category === 'door') {
      return leaf(towardLeft ? 'casement-left' : 'casement-right')
    }
    return leaf(towardLeft ? 'slider-left' : 'slider-right')
  })

  if (children.length === 1) return { version: 1, root: children[0] }

  return { version: 1, root: { id: nextSectionId(), kind: 'split', direction: 'row', children } }
}

function normaliseRatios(count: number, ratios?: number[]): number[] {
  const usable =
    ratios && ratios.length === count && ratios.every((r) => Number.isFinite(r) && r > 0)
      ? ratios
      : new Array(count).fill(1)
  const total = usable.reduce((sum, r) => sum + r, 0)
  return usable.map((r) => r / total)
}

function layoutSection(
  section: WindowSection,
  rect: Rect,
  options: DesignOptions,
  leaves: LaidOutLeaf[],
  mullions: LaidOutMullion[]
): void {
  if (section.kind === 'leaf') {
    const operable = isOperable(section.sash)
    // Clamp so a sash thicker than the panel cannot invert the glass rect.
    const inset = operable
      ? Math.min(options.sash, rect.width / 2, rect.height / 2)
      : 0

    leaves.push({
      id: section.id,
      sash: section.sash,
      operable,
      ...rect,
      glass: {
        x: rect.x + inset,
        y: rect.y + inset,
        width: Math.max(0, rect.width - inset * 2),
        height: Math.max(0, rect.height - inset * 2),
      },
    })
    return
  }

  const count = section.children.length
  if (count === 0) return
  if (count === 1) {
    layoutSection(section.children[0], rect, options, leaves, mullions)
    return
  }

  const horizontal = section.direction === 'row'
  const span = horizontal ? rect.width : rect.height
  const dividerTotal = options.mullion * (count - 1)
  // A unit can be subdivided further than it has room for; clamp rather than
  // producing negative widths that would render inside-out.
  const usable = Math.max(0, span - dividerTotal)
  const shares = normaliseRatios(count, section.ratios).map((r) => r * usable)

  let cursor = horizontal ? rect.x : rect.y

  section.children.forEach((child, index) => {
    const size = shares[index]
    const childRect: Rect = horizontal
      ? { x: cursor, y: rect.y, width: size, height: rect.height }
      : { x: rect.x, y: cursor, width: rect.width, height: size }

    layoutSection(child, childRect, options, leaves, mullions)
    cursor += size

    if (index < count - 1) {
      mullions.push({
        id: `${section.id}-m${index}`,
        orientation: horizontal ? 'vertical' : 'horizontal',
        ...(horizontal
          ? { x: cursor, y: rect.y, width: options.mullion, height: rect.height }
          : { x: rect.x, y: cursor, width: rect.width, height: options.mullion }),
      })
      cursor += options.mullion
    }
  })
}

/**
 * Resolves a design plus outer dimensions into flat rectangles ready to draw.
 */
export function layoutUnit(
  design: UnitDesign,
  width: number,
  height: number,
  options: DesignOptions = DEFAULT_DESIGN_OPTIONS
): UnitLayout {
  const outer: Rect = { x: 0, y: 0, width: Math.max(0, width), height: Math.max(0, height) }

  const frame = Math.max(0, options.frame)
  const opening: Rect = {
    x: frame,
    y: frame,
    width: Math.max(0, outer.width - frame * 2),
    height: Math.max(0, outer.height - frame * 2),
  }

  const leaves: LaidOutLeaf[] = []
  const mullions: LaidOutMullion[] = []
  layoutSection(design.root, opening, options, leaves, mullions)

  return { outer, opening, leaves, mullions }
}

/* ---------------------------------------------------------------- editing -- */

function mapSection(
  section: WindowSection,
  id: string,
  fn: (found: WindowSection) => WindowSection
): WindowSection {
  if (section.id === id) return fn(section)
  if (section.kind === 'split') {
    return { ...section, children: section.children.map((c) => mapSection(c, id, fn)) }
  }
  return section
}

/**
 * Splits the target section in two. Splitting an existing split nests a new one,
 * which is what lets the tree express layouts a flat panel list cannot.
 */
export function splitSection(
  design: UnitDesign,
  id: string,
  direction: 'row' | 'column'
): UnitDesign {
  return {
    ...design,
    root: mapSection(design.root, id, (found) => ({
      id: nextSectionId(),
      kind: 'split',
      direction,
      // The target keeps its sash; the panel that appears beside it starts
      // fixed, so splitting never silently adds a second operating sash.
      children: [found, leaf('fixed')],
    })),
  }
}

export function setSash(design: UnitDesign, id: string, sash: SashType): UnitDesign {
  return {
    ...design,
    root: mapSection(design.root, id, (found) =>
      found.kind === 'leaf' ? { ...found, sash } : found
    ),
  }
}

/** Collapses a split back to a single leaf, discarding its children. */
export function mergeSection(design: UnitDesign, id: string): UnitDesign {
  return {
    ...design,
    root: mapSection(design.root, id, (found) =>
      found.kind === 'split' ? leaf('fixed', found.id) : found
    ),
  }
}

export function findSection(section: WindowSection, id: string): WindowSection | null {
  if (section.id === id) return section
  if (section.kind === 'split') {
    for (const child of section.children) {
      const hit = findSection(child, id)
      if (hit) return hit
    }
  }
  return null
}

/** Renders the design back to an operation code where it can be expressed as one. */
export function operationCodeFromDesign(design: UnitDesign): string | null {
  const root = design.root
  if (root.kind === 'leaf') return isOperable(root.sash) ? 'X' : 'O'
  if (root.direction !== 'row') return null
  if (!root.children.every((c) => c.kind === 'leaf')) return null
  return root.children.map((c) => (isOperable((c as LeafSection).sash) ? 'X' : 'O')).join('')
}

export function countLites(design: UnitDesign): number {
  const walk = (s: WindowSection): number =>
    s.kind === 'leaf' ? 1 : s.children.reduce((n, c) => n + walk(c), 0)
  return walk(design.root)
}
