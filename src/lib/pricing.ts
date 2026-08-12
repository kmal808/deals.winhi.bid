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

/**
 * United inches — width plus height, the trade's unit of size.
 *
 * It is the quantity every price here is really per: `(w + h) × Σfactors` is
 * united inches times a rate. Documents show it so the customer can check the
 * arithmetic instead of being handed a number.
 */
export function unitedInches(
  width: number | string | null | undefined,
  height: number | string | null | undefined
): number {
  const w = toNumber(width)
  const h = toNumber(height)
  if (w <= 0 || h <= 0) return 0
  return roundCents(w + h)
}

/**
 * The effective rate per united inch for a line, derived from what it actually
 * costs — so a manual override reports the rate it implies rather than the rate
 * the factors would have produced.
 */
export function ratePerUnitedInch(
  item: PricedLineItem,
  width: number | string | null | undefined,
  height: number | string | null | undefined
): number {
  const ui = unitedInches(width, height)
  if (ui <= 0) return 0
  return Math.round((lineItemPrice(item) / ui) * 100) / 100
}

/** A saved window/door row, or anything else that carries the two price columns. */
export interface PricedLineItem {
  calculatedPrice?: number | string | null
  manualPrice?: number | string | null
  /**
   * Doors, and any line flagged with its own rate, are discounted individually
   * rather than at the customer's blanket rate — a door is quoted by hand and
   * carries whatever deal was struck on it.
   */
  isDoor?: boolean | null
  applyCustomDiscount?: boolean | null
  customDiscountPercent?: number | string | null
}

/** True when the line carries its own discount instead of the customer's. */
function hasOwnDiscount(item: PricedLineItem): boolean {
  return Boolean(item.isDoor) || Boolean(item.applyCustomDiscount)
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
  const items = input.items ?? []
  const discountPercent = toNumber(input.discountPercent)

  // Lines split into two buckets, as the PHP app does: those discounted at the
  // customer's blanket rate, and those carrying a rate of their own.
  let atCustomerRate = 0
  let ownGross = 0
  let ownDiscount = 0

  for (const item of items) {
    const price = lineItemPrice(item)
    if (hasOwnDiscount(item)) {
      ownGross += price
      ownDiscount += price * (toNumber(item.customDiscountPercent) / 100)
    } else {
      atCustomerRate += price
    }
  }

  const itemsTotal = roundCents(atCustomerRate + ownGross)
  const discountAmount = roundCents(atCustomerRate * (discountPercent / 100) + ownDiscount)
  const subtotal = roundCents(itemsTotal - discountAmount)

  // Tax is charged on the whole discounted subtotal, doors included. The PHP
  // app taxed only the windows bucket, before the discount, which both
  // undercharged tax and disagreed with the figure its own screen displayed.
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
  // Grouped, because a contract total is read by a customer, not a machine.
  const [whole, cents] = Math.abs(value).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${value < 0 ? '-' : ''}$${grouped}.${cents}`
}
