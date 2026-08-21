import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  clearableLineAmount,
  dimensionInches,
  lineAmount,
  orderAmount,
  percent,
} from './validators'

/**
 * These guard the endpoints, not the forms. Every case below is something the
 * UI cannot produce but a crafted HTTP request can.
 */
describe('dimensionInches', () => {
  it('accepts a measurement as either a string or a number', () => {
    expect(dimensionInches.parse('59')).toBe(59)
    expect(dimensionInches.parse(59)).toBe(59)
    expect(dimensionInches.parse('59.5')).toBe(59.5)
  })

  it('rejects text, blanks and non-finite values', () => {
    for (const bad of ['abc', '', 'NaN', 'Infinity', {}, []]) {
      expect(() => dimensionInches.parse(bad)).toThrow()
    }
  })

  it('rejects a size that cannot be built', () => {
    expect(() => dimensionInches.parse(0)).toThrow()
    expect(() => dimensionInches.parse(-40)).toThrow()
    expect(() => dimensionInches.parse(1e9)).toThrow()
  })
})

describe('percent', () => {
  it('accepts a discount within range', () => {
    expect(percent.parse('40')).toBe(40)
    expect(percent.parse(0)).toBe(0)
    expect(percent.parse(100)).toBe(100)
  })

  it('rejects a discount that would invert a total', () => {
    // Over 100% turns a subtotal negative, and the customer is owed money.
    expect(() => percent.parse(101)).toThrow()
    expect(() => percent.parse(-5)).toThrow()
  })
})

describe('lineAmount and orderAmount', () => {
  it('reject negative money', () => {
    expect(() => lineAmount.parse(-1)).toThrow()
    expect(() => orderAmount.parse('-0.01')).toThrow()
  })

  it('reject implausibly large money', () => {
    expect(() => lineAmount.parse(2_000_000)).toThrow()
    expect(() => orderAmount.parse(20_000_000)).toThrow()
  })

  it('accept a zero, which is a comped line rather than a missing one', () => {
    expect(lineAmount.parse(0)).toBe(0)
  })
})

describe('clearableLineAmount', () => {
  it('treats an empty value as clearing the override', () => {
    expect(clearableLineAmount.parse('')).toBeNull()
    expect(clearableLineAmount.parse(null)).toBeNull()
  })

  it('still validates a value that is present', () => {
    expect(clearableLineAmount.parse('250.50')).toBe(250.5)
    expect(() => clearableLineAmount.parse('-5')).toThrow()
    expect(() => clearableLineAmount.parse('abc')).toThrow()
  })
})

describe('clearableLineAmount when the field is absent', () => {
  it('passes an omitted field through untouched', () => {
    // Most updates do not touch the price at all. An earlier version applied
    // .optional() inside the pipe, so an absent field failed validation and
    // broke every edit that was not a price override.
    expect(clearableLineAmount.parse(undefined)).toBeUndefined()
  })

  it('is still optional inside an object', () => {
    const schema = z.object({ location: z.string(), manualPrice: clearableLineAmount })
    expect(schema.parse({ location: 'Kitchen' })).toEqual({ location: 'Kitchen' })
    expect(schema.parse({ location: 'Kitchen', manualPrice: '' })).toEqual({
      location: 'Kitchen',
      manualPrice: null,
    })
  })
})
