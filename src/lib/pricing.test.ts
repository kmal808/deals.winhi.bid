import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DOWN_PAYMENT_RATE,
  TAX_RATE,
  calculateOrderTotals,
  calculateUnitPrice,
  lineItemPrice,
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
