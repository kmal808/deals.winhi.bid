import { describe, expect, it } from 'vitest'
import { cartForCustomer, type WindowConfig } from './configurator-store'

const item = (id: string, customerId: number): WindowConfig =>
  ({ id, customerId, location: id }) as WindowConfig

describe('cartForCustomer', () => {
  const cart = [item('a1', 1), item('b1', 2), item('a2', 1)]

  it('returns only the items configured for that customer', () => {
    // The regression: the cart is persisted and survives navigating between
    // customers, and saving used the route's customer for every item in it.
    expect(cartForCustomer(cart, 1).map((i) => i.id)).toEqual(['a1', 'a2'])
    expect(cartForCustomer(cart, 2).map((i) => i.id)).toEqual(['b1'])
  })

  it('leaves the other customer’s items untouched rather than discarding them', () => {
    // A rep moving between two jobs must not lose work on the first.
    expect(cartForCustomer(cart, 1)).toHaveLength(2)
    expect(cart).toHaveLength(3)
  })

  it('is empty for a customer with nothing configured', () => {
    expect(cartForCustomer(cart, 99)).toEqual([])
  })

  it('is empty before a customer is known', () => {
    expect(cartForCustomer(cart, null)).toEqual([])
  })
})
