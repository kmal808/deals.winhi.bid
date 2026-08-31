import { z } from 'zod'

/**
 * Numeric validators for the money and dimension fields.
 *
 * Server functions are HTTP endpoints, so a `min`/`step` on an input element
 * constrains nothing. Accepting `string | number` and passing it through meant a
 * crafted request could store a negative price, a discount above 100%, or a
 * width of "abc" — none of which the UI can produce but all of which the
 * endpoint accepted.
 *
 * Forms submit strings and JSON clients submit numbers, so these take either and
 * hand back a checked number.
 */

/** Largest sensible unit dimension, in inches. A 40ft folding wall is 480. */
const MAX_DIMENSION_INCHES = 600
/** Per-line ceiling. The dearest thing in the catalogue is a door in the low thousands. */
const MAX_LINE_PRICE = 1_000_000
/** Whole-order ceiling, for a down payment. */
const MAX_ORDER_AMOUNT = 10_000_000

function bounded(min: number, max: number, label: string) {
  return z
    .union([z.string(), z.number()])
    .transform((value, ctx) => {
      const n = typeof value === 'number' ? value : Number(String(value).trim())
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: 'custom', message: `${label} must be a number` })
        return z.NEVER
      }
      return n
    })
    .refine((n) => n >= min && n <= max, {
      message: `${label} must be between ${min} and ${max}`,
    })
}

/** A unit's width or height, in inches. Zero-size units cannot be priced. */
export const dimensionInches = bounded(1, MAX_DIMENSION_INCHES, 'Dimension')

/** A price on one line item. */
export const lineAmount = bounded(0, MAX_LINE_PRICE, 'Price')

/** An amount against the whole order, such as a down payment. */
export const orderAmount = bounded(0, MAX_ORDER_AMOUNT, 'Amount')

/** A percentage. Discounts above 100 would invert the sign of a total. */
export const percent = bounded(0, 100, 'Percentage')

/**
 * A clearable amount: an empty string or null removes the value rather than
 * storing zero, which is how the price-override field signals "use the
 * calculated price again".
 */
export const clearableLineAmount = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => (value === '' || value === null ? null : value))
  .pipe(lineAmount.nullable())
  // `.optional()` must wrap the pipe rather than sit inside it: an omitted
  // field has to short-circuit before reaching a schema that only accepts a
  // number or null. Otherwise every edit that does not touch the price — a
  // location rename, a resize — fails validation.
  .optional()
