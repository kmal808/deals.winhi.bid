import { describe, expect, it } from 'vitest'
import {
  countLites,
  designFromOperationType,
  layoutUnit,
  leaf,
  mergeSection,
  nextSectionId,
  operationCodeFromDesign,
  setSash,
  splitSection,
  type UnitDesign,
} from './window-design'

const OPTS = { frame: 2, mullion: 1.5, sash: 1.5 }

describe('designFromOperationType', () => {
  it('turns each character of the code into a panel, left to right', () => {
    const design = designFromOperationType('XOX')
    expect(countLites(design)).toBe(3)
    expect(operationCodeFromDesign(design)).toBe('XOX')
  })

  it('treats X as operating and O as fixed', () => {
    // The convention printed on the contract: X moves, O is stationary.
    expect(operationCodeFromDesign(designFromOperationType('XO'))).toBe('XO')

    const xx = designFromOperationType('XX')
    const oo = designFromOperationType('OO')
    expect(layoutUnit(xx, 60, 48, OPTS).leaves.every((l) => l.operable)).toBe(true)
    expect(layoutUnit(oo, 60, 48, OPTS).leaves.every((l) => !l.operable)).toBe(true)
  })

  it('models a French door (XX) as two operating leaves', () => {
    const design = designFromOperationType('XX', 'door')
    const leaves = layoutUnit(design, 72, 80, OPTS).leaves
    expect(leaves).toHaveLength(2)
    expect(leaves.map((l) => l.sash)).toEqual(['casement-left', 'casement-right'])
  })

  it('maps the canonical codes to a single sash of that type', () => {
    const sashFor = (code: string) => layoutUnit(designFromOperationType(code), 36, 24, OPTS).leaves[0].sash
    expect(sashFor('PW')).toBe('fixed')
    expect(sashFor('AWN')).toBe('awning')
    expect(sashFor('CL')).toBe('casement-left')
    expect(sashFor('CR')).toBe('casement-right')
  })

  it('still resolves the legacy codes present in seeded data', () => {
    const sashFor = (code: string) => layoutUnit(designFromOperationType(code), 36, 24, OPTS).leaves[0].sash
    expect(sashFor('PIC')).toBe('fixed')
    expect(sashFor('AW')).toBe('awning')
  })

  it('puts the casement hinge on the named side', () => {
    // CR opens like a door hinged on the right.
    const cr = layoutUnit(designFromOperationType('CR'), 36, 48, OPTS).leaves[0]
    expect(cr.sash).toBe('casement-right')
    expect(cr.operable).toBe(true)
  })

  it('falls back to a single fixed lite for unknown or empty codes', () => {
    for (const code of [null, undefined, '', 'ZZZ']) {
      const layout = layoutUnit(designFromOperationType(code), 36, 24, OPTS)
      expect(layout.leaves).toHaveLength(1)
      expect(layout.leaves[0].operable).toBe(false)
    }
  })
})

describe('layoutUnit', () => {
  it('insets the opening by the frame on every side', () => {
    const layout = layoutUnit(designFromOperationType('O'), 36, 48, OPTS)
    expect(layout.opening).toEqual({ x: 2, y: 2, width: 32, height: 44 })
  })

  it('divides the opening evenly and accounts for mullion thickness', () => {
    const layout = layoutUnit(designFromOperationType('XOX'), 36, 48, OPTS)
    // opening 32 wide, two 1.5 mullions => 29 of glass across three panels
    const widths = layout.leaves.map((l) => l.width)
    expect(widths).toEqual([29 / 3, 29 / 3, 29 / 3])
    expect(layout.mullions).toHaveLength(2)

    // Panels and mullions tile the opening with no gaps or overlap.
    const spanned = widths.reduce((a, b) => a + b, 0) + 2 * OPTS.mullion
    expect(spanned).toBeCloseTo(layout.opening.width, 10)
  })

  it('places panels in order with mullions between them', () => {
    const layout = layoutUnit(designFromOperationType('XOX'), 36, 48, OPTS)
    const xs = layout.leaves.map((l) => l.x)
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
    for (const m of layout.mullions) {
      expect(m.orientation).toBe('vertical')
      expect(m.height).toBe(layout.opening.height)
    }
  })

  it('honours uneven ratios', () => {
    const design: UnitDesign = {
      version: 1,
      root: {
        id: nextSectionId(),
        kind: 'split',
        direction: 'row',
        children: [leaf('fixed'), leaf('slider-right')],
        ratios: [3, 1],
      },
    }
    const [a, b] = layoutUnit(design, 42, 48, { frame: 1, mullion: 0, sash: 0 }).leaves
    expect(a.width / b.width).toBeCloseTo(3, 10)
  })

  it('stacks a column split top to bottom with horizontal mullions', () => {
    const design: UnitDesign = {
      version: 1,
      root: {
        id: nextSectionId(),
        kind: 'split',
        direction: 'column',
        children: [leaf('awning'), leaf('fixed')],
      },
    }
    const layout = layoutUnit(design, 36, 48, OPTS)
    expect(layout.leaves[0].y).toBeLessThan(layout.leaves[1].y)
    expect(layout.mullions[0].orientation).toBe('horizontal')
    expect(layout.mullions[0].width).toBe(layout.opening.width)
  })

  it('never produces negative geometry when subdivided beyond its size', () => {
    let design = designFromOperationType('O')
    for (let i = 0; i < 12; i++) {
      const target = layoutUnit(design, 6, 6, OPTS).leaves[0].id
      design = splitSection(design, target, 'row')
    }
    const layout = layoutUnit(design, 6, 6, OPTS)
    for (const l of layout.leaves) {
      expect(l.width).toBeGreaterThanOrEqual(0)
      expect(l.height).toBeGreaterThanOrEqual(0)
    }
  })

  it('insets the glass by the sash on an operating panel only', () => {
    const [operating, fixed] = layoutUnit(designFromOperationType('XO'), 60, 48, OPTS).leaves

    // A fixed lite is glazed straight into the frame: no sash around it.
    expect(fixed.glass).toEqual({
      x: fixed.x,
      y: fixed.y,
      width: fixed.width,
      height: fixed.height,
    })

    // An operating panel carries its own sash, so the glass is smaller.
    expect(operating.glass.x).toBeCloseTo(operating.x + OPTS.sash, 10)
    expect(operating.glass.width).toBeCloseTo(operating.width - OPTS.sash * 2, 10)
    expect(operating.glass.height).toBeCloseTo(operating.height - OPTS.sash * 2, 10)
  })

  it('never inverts the glass when the sash is thicker than the panel', () => {
    const layout = layoutUnit(designFromOperationType('XXXX'), 8, 8, {
      frame: 1,
      mullion: 1,
      sash: 40,
    })
    for (const l of layout.leaves) {
      expect(l.glass.width).toBeGreaterThanOrEqual(0)
      expect(l.glass.height).toBeGreaterThanOrEqual(0)
    }
  })

  it('clamps rather than inverting when the frame exceeds the unit', () => {
    const layout = layoutUnit(designFromOperationType('O'), 2, 2, { frame: 6, mullion: 1, sash: 1 })
    expect(layout.opening.width).toBe(0)
    expect(layout.opening.height).toBe(0)
  })
})

describe('editing', () => {
  it('splits a leaf into two, keeping the original sash on the first', () => {
    const design = designFromOperationType('X')
    const id = layoutUnit(design, 36, 48, OPTS).leaves[0].id
    const split = splitSection(design, id, 'column')

    expect(countLites(split)).toBe(2)
    const leaves = layoutUnit(split, 36, 48, OPTS).leaves
    expect(leaves[0].operable).toBe(true)
    expect(leaves[1].sash).toBe('fixed')
  })

  it('nests when splitting an already split section', () => {
    let design = designFromOperationType('XOX')
    const middle = layoutUnit(design, 60, 48, OPTS).leaves[1].id
    design = splitSection(design, middle, 'column')
    expect(countLites(design)).toBe(4)
    // No longer expressible as a flat operation code.
    expect(operationCodeFromDesign(design)).toBeNull()
  })

  it('changes the sash of one section without touching its siblings', () => {
    const design = designFromOperationType('OOO')
    const target = layoutUnit(design, 60, 48, OPTS).leaves[1].id
    const updated = setSash(design, target, 'awning')

    const leaves = layoutUnit(updated, 60, 48, OPTS).leaves
    expect(leaves.map((l) => l.sash)).toEqual(['fixed', 'awning', 'fixed'])
  })

  it('does not mutate the design it was given', () => {
    const design = designFromOperationType('XOX')
    const before = JSON.stringify(design)
    const target = layoutUnit(design, 60, 48, OPTS).leaves[0].id

    splitSection(design, target, 'row')
    setSash(design, target, 'awning')

    expect(JSON.stringify(design)).toBe(before)
  })

  it('collapses a split back to a single lite', () => {
    const design = designFromOperationType('XOX')
    const rootId = design.root.id
    const merged = mergeSection(design, rootId)
    expect(countLites(merged)).toBe(1)
  })

  it('survives a round trip through JSON, as stored on the window row', () => {
    let design = designFromOperationType('XOX')
    const middle = layoutUnit(design, 60, 48, OPTS).leaves[1].id
    design = splitSection(design, middle, 'column')

    const restored: UnitDesign = JSON.parse(JSON.stringify(design))
    expect(layoutUnit(restored, 60, 48, OPTS)).toEqual(layoutUnit(design, 60, 48, OPTS))
  })
})
