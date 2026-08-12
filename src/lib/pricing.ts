/**
 * Single source of truth for all money math.
 *
 * Both the configurator (which quotes a price before anything is saved) and the
 * estimate/contract documents (which price what is already saved) must agree, so
 * neither side is allowed to reimplement these formulas.
 */

/** Hawaii GET, Oahu rate. */
export const TAX_RATE = 0.04712

/** Fallback down payment when the customer has no explicit amount set. */
export const DEFAULT_DOWN_PAYMENT_RATE = 0.5

/**
 * Factors are additive adjustments applied to the unit's linear inches. An
 * unselected option contributes nothing — this matches the column defaults in
 * the schema, where every factor but the brand's defaults to '0'.
 */
export interface UnitFactors {
  brand?: number | string | null
  frameType?: number | string | null
  frameColor?: number | string | null
  glassType?: number | string | null
  gridStyle?: number | string | null
}

/** Decimal columns come back from Drizzle as strings; missing means zero. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * windowPrice = (height + width) × (brand + frame + color + glass + grid)
 */
export function calculateUnitPrice(
  width: number | string | null | undefined,
  height: number | string | null | undefined,
  factors: UnitFactors
): number {
  const w = toNumber(width)
  const h = toNumber(height)
  if (w <= 0 || h <= 0) return 0

  const totalFactor =
    toNumber(factors.brand) +
    toNumber(factors.frameType) +
    toNumber(factors.frameColor) +
    toNumber(factors.glassType) +
    toNumber(factors.gridStyle)

  return roundCents((w + h) * totalFactor)
}

/** A saved window/door row, or anything else that carries the two price columns. */
export interface PricedLineItem {
  calculatedPrice?: number | string | null
  manualPrice?: number | string | null
}

/** A manually entered price always wins over the computed one. */
export function lineItemPrice(item: PricedLineItem): number {
  const manual = item.manualPrice
  if (manual !== null && manual !== undefined && manual !== '') {
    return toNumber(manual)
  }
  return toNumber(item.calculatedPrice)
}

export interface OrderTotals {
  itemsTotal: number
  discountPercent: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  total: number
  downPayment: number
  balanceDue: number
}

/**
 * Rolls a customer's line items up into the figures shown on the detail page,
 * the estimate and the contract.
 */
export function calculateOrderTotals(input: {
  items: PricedLineItem[] | null | undefined
  discountPercent?: number | string | null
  /** Explicit down payment; falls back to DEFAULT_DOWN_PAYMENT_RATE of the total. */
  downPaymentAmount?: number | string | null
}): OrderTotals {
  const itemsTotal = roundCents(
    (input.items ?? []).reduce((sum, item) => sum + lineItemPrice(item), 0)
  )

  const discountPercent = toNumber(input.discountPercent)
  const discountAmount = roundCents(itemsTotal * (discountPercent / 100))
  const subtotal = roundCents(itemsTotal - discountAmount)
  const taxAmount = roundCents(subtotal * TAX_RATE)
  const total = roundCents(subtotal + taxAmount)

  const hasExplicitDownPayment =
    input.downPaymentAmount !== null &&
    input.downPaymentAmount !== undefined &&
    input.downPaymentAmount !== ''

  const downPayment = hasExplicitDownPayment
    ? roundCents(toNumber(input.downPaymentAmount))
    : roundCents(total * DEFAULT_DOWN_PAYMENT_RATE)

  return {
    itemsTotal,
    discountPercent,
    discountAmount,
    subtotal,
    taxAmount,
    total,
    downPayment,
    balanceDue: roundCents(total - downPayment),
  }
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}
