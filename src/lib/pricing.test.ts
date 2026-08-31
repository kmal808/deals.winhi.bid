import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DOWN_PAYMENT_RATE,
  TAX_RATE,
  calculateDiscountCeiling,
  calculateOrderTotals,
  calculateUnitPrice,
  formatCurrency,
  lineItemPrice,
  ratePerUnitedInch,
  unitedInches,
} from './pricing'

describe('calculateUnitPrice', () => {
  it('multiplies linear inches by the sum of the factors', () => {
    // (36 + 48) × (1.25 + 0.10 + 0.05 + 0.15 + 0.05) = 84 × 1.6 = 134.40
    expect(
      calculateUnitPrice(36, 48, {
        brand: '1.25',
        frameType: '0.10',
        frameColor: '0.05',
        glassType: '0.15',
        gridStyle: '0.05',
      })
    ).toBe(134.4)
  })

  it('treats an unselected option as adding nothing', () => {
    const withGrid = calculateUnitPrice(36, 48, { brand: '1.25', gridStyle: '0.05' })
    const withoutGrid = calculateUnitPrice(36, 48, { brand: '1.25', gridStyle: null })

    expect(withGrid).toBe(84 * 1.3)
    expect(withoutGrid).toBe(84 * 1.25)
    // The regression this guards: defaulting a missing factor to 1.0 added a
    // whole dollar per linear inch and roughly quadrupled quotes.
    expect(withoutGrid).toBeLessThan(withGrid)
  })

  it('accepts numbers and decimal strings interchangeably', () => {
    expect(calculateUnitPrice('36', '48', { brand: 1.25 })).toBe(
      calculateUnitPrice(36, 48, { brand: '1.25' })
    )
  })

  it('returns zero for a unit with no dimensions', () => {
    expect(calculateUnitPrice(0, 48, { brand: '1.25' })).toBe(0)
    expect(calculateUnitPrice(undefined, undefined, { brand: '1.25' })).toBe(0)
  })

  it('rounds to cents', () => {
    const price = calculateUnitPrice(37, 49, { brand: '1.333' })
    expect(price).toBe(114.64)
  })
})

describe('lineItemPrice', () => {
  it('prefers a manual override over the calculated price', () => {
    expect(lineItemPrice({ calculatedPrice: '134.40', manualPrice: '99.00' })).toBe(99)
  })

  it('falls back to the calculated price when there is no override', () => {
    expect(lineItemPrice({ calculatedPrice: '134.40', manualPrice: null })).toBe(134.4)
    expect(lineItemPrice({ calculatedPrice: '134.40', manualPrice: '' })).toBe(134.4)
  })

  it('honours a zero override rather than treating it as absent', () => {
    // A comped line item is a real business case: '0' must not fall through to
    // the calculated price the way a falsy check would make it.
    expect(lineItemPrice({ calculatedPrice: '134.40', manualPrice: '0' })).toBe(0)
  })

  it('is zero when neither price is set', () => {
    expect(lineItemPrice({ calculatedPrice: null, manualPrice: null })).toBe(0)
  })
})

describe('calculateOrderTotals', () => {
  const items = [
    { calculatedPrice: '100.00', manualPrice: null },
    { calculatedPrice: '150.00', manualPrice: null },
    { calculatedPrice: '999.00', manualPrice: '250.00' },
  ]

  it('applies the discount before tax', () => {
    const totals = calculateOrderTotals({ items, discountPercent: '10' })

    expect(totals.itemsTotal).toBe(500)
    expect(totals.discountAmount).toBe(50)
    expect(totals.subtotal).toBe(450)
    expect(totals.taxAmount).toBe(Math.round(450 * TAX_RATE * 100) / 100)
    expect(totals.total).toBe(450 + totals.taxAmount)
  })

  it('handles a missing discount as zero', () => {
    const totals = calculateOrderTotals({ items, discountPercent: null })
    expect(totals.discountAmount).toBe(0)
    expect(totals.subtotal).toBe(500)
  })

  it('defaults the down payment to half the total', () => {
    const totals = calculateOrderTotals({ items })
    expect(totals.downPayment).toBe(
      Math.round(totals.total * DEFAULT_DOWN_PAYMENT_RATE * 100) / 100
    )
    expect(totals.downPayment + totals.balanceDue).toBeCloseTo(totals.total, 2)
  })

  it('uses an explicit down payment when the customer has one', () => {
    const totals = calculateOrderTotals({ items, downPaymentAmount: '200.00' })
    expect(totals.downPayment).toBe(200)
    expect(totals.balanceDue).toBe(Math.round((totals.total - 200) * 100) / 100)
  })

  it('treats a zero down payment as deliberate', () => {
    const totals = calculateOrderTotals({ items, downPaymentAmount: '0' })
    expect(totals.downPayment).toBe(0)
    expect(totals.balanceDue).toBe(totals.total)
  })

  it('returns zeroes for a customer with no line items', () => {
    const totals = calculateOrderTotals({ items: [], discountPercent: '10' })
    expect(totals).toMatchObject({
      itemsTotal: 0,
      discountAmount: 0,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      downPayment: 0,
      balanceDue: 0,
    })
  })
})

describe('unitedInches', () => {
  it('is width plus height, the quantity a price is per', () => {
    // Straight from a competitor's agreement: 59x60 bills as 119 united inches.
    expect(unitedInches(59, 60)).toBe(119)
    expect(unitedInches('47', '60')).toBe(107)
    expect(unitedInches(34, 60)).toBe(94)
  })

  it('is zero for a unit with no dimensions', () => {
    expect(unitedInches(0, 48)).toBe(0)
    expect(unitedInches(null, undefined)).toBe(0)
  })
})

describe('ratePerUnitedInch', () => {
  it('reports the rate the line actually bills at', () => {
    // 119 united inches at $12.00 comes to $1,428.00.
    expect(ratePerUnitedInch({ calculatedPrice: '1428.00', manualPrice: null }, 59, 60)).toBe(12)
  })

  it('derives the rate from a manual override rather than the factors', () => {
    expect(ratePerUnitedInch({ calculatedPrice: '1428.00', manualPrice: '952.00' }, 59, 60)).toBe(8)
  })

  it('is zero when the unit has no size to divide by', () => {
    expect(ratePerUnitedInch({ calculatedPrice: '100', manualPrice: null }, 0, 0)).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('groups thousands', () => {
    expect(formatCurrency(1128)).toBe('$1,128.00')
    expect(formatCurrency(1234567.5)).toBe('$1,234,567.50')
  })

  it('keeps small values and negatives readable', () => {
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(999.99)).toBe('$999.99')
    expect(formatCurrency(-1128)).toBe('-$1,128.00')
  })
})

describe('per-line discounts and the tax base', () => {
  it('taxes the whole discounted subtotal, matching the live app screen', () => {
    // Reproduces a real quote: subtotal 117,497.00 less a 60,194.94 discount
    // leaves 57,302.06, and 57,302.06 x 0.04712 is 2,700.07.
    const gross = 117497
    const discount = 60194.94
    const totals = calculateOrderTotals({
      items: [{ calculatedPrice: String(gross), manualPrice: null }],
      discountPercent: (discount / gross) * 100,
    })

    expect(totals.itemsTotal).toBe(gross)
    expect(totals.discountAmount).toBeCloseTo(discount, 2)
    expect(totals.subtotal).toBeCloseTo(57302.06, 2)
    expect(totals.taxAmount).toBeCloseTo(2700.07, 2)
    expect(totals.total).toBeCloseTo(60002.13, 2)
  })

  it('discounts a door at its own rate, not the customer rate', () => {
    const totals = calculateOrderTotals({
      items: [
        { calculatedPrice: '1000.00', manualPrice: null },
        { calculatedPrice: '2000.00', manualPrice: null, isDoor: true, customDiscountPercent: '10' },
      ],
      discountPercent: '50',
    })

    // Window: 1000 less 50%. Door: 2000 less its own 10%.
    expect(totals.itemsTotal).toBe(3000)
    expect(totals.discountAmount).toBe(700)
    expect(totals.subtotal).toBe(2300)
  })

  it('honours a per-line rate on a window flagged for one', () => {
    const totals = calculateOrderTotals({
      items: [
        { calculatedPrice: '1000.00', manualPrice: null },
        {
          calculatedPrice: '1000.00',
          manualPrice: null,
          applyCustomDiscount: true,
          customDiscountPercent: '25',
        },
      ],
      discountPercent: '50',
    })
    expect(totals.discountAmount).toBe(750)
    expect(totals.subtotal).toBe(1250)
  })

  it('leaves a line with its own flag but no rate at full price', () => {
    const totals = calculateOrderTotals({
      items: [{ calculatedPrice: '1000.00', manualPrice: null, isDoor: true }],
      discountPercent: '50',
    })
    // A door is never swept into the customer's blanket discount by default.
    expect(totals.discountAmount).toBe(0)
    expect(totals.subtotal).toBe(1000)
  })

  it('is unchanged for items that carry no discount fields at all', () => {
    const totals = calculateOrderTotals({
      items: [{ calculatedPrice: '100.00', manualPrice: null }],
      discountPercent: '10',
    })
    expect(totals.discountAmount).toBe(10)
    expect(totals.subtotal).toBe(90)
  })
})

describe('calculateDiscountCeiling', () => {
  // A unit quoted at twice par: par 16 per united inch, quoted at 32.
  const line = (ui: number) => ({
    width: ui / 2,
    height: ui / 2,
    calculatedPrice: String(ui * 32),
    manualPrice: null,
    parFactor: '16',
  })

  it('allows exactly half off when a quote is written at twice par', () => {
    const ceiling = calculateDiscountCeiling([line(100)])
    expect(ceiling.listTotal).toBe(3200)
    expect(ceiling.parTotal).toBe(1600)
    expect(ceiling.maxDiscountPercent).toBe(50)
  })

  it('leaves room for the discounts reps actually give', () => {
    // 30% and 40% both sit inside a 50% ceiling; 60% would not.
    const { maxDiscountPercent } = calculateDiscountCeiling([line(94), line(119)])
    expect(maxDiscountPercent).toBe(50)
    expect(30).toBeLessThan(maxDiscountPercent)
    expect(40).toBeLessThan(maxDiscountPercent)
    expect(60).toBeGreaterThan(maxDiscountPercent)
  })

  it('tightens the ceiling when a line is quoted nearer its floor', () => {
    const thin = { width: 50, height: 50, calculatedPrice: '2000', manualPrice: null, parFactor: '16' }
    // 100 united inches at par 16 is a 1600 floor against a 2000 quote.
    expect(calculateDiscountCeiling([thin]).maxDiscountPercent).toBe(20)
  })

  it('does not let a line without a recorded par restrict the ceiling', () => {
    const ceiling = calculateDiscountCeiling([
      line(100),
      { width: 50, height: 50, calculatedPrice: '1000', manualPrice: null },
    ])
    expect(ceiling.parTotal).toBe(1600)
    expect(ceiling.maxDiscountPercent).toBeGreaterThan(50)
  })

  it('is zero-safe for an empty quote', () => {
    expect(calculateDiscountCeiling([]).maxDiscountPercent).toBe(0)
    expect(calculateDiscountCeiling(null).parTotal).toBe(0)
  })

  it('honours a manual override when measuring the room left', () => {
    const discounted = { ...line(100), manualPrice: '1800' }
    // Quoted down to 1800 against a 1600 floor leaves very little room.
    expect(calculateDiscountCeiling([discounted]).maxDiscountPercent).toBeCloseTo(11.11, 1)
  })
})
