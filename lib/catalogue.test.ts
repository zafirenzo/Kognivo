import { test } from 'node:test'
import assert from 'node:assert/strict'
import { priceCart, buyable, getProduct, PREORDER_PRICE } from './catalogue.ts'
import { shippingFor } from './site.ts'

test('a cart is priced from the catalogue, never from what the browser says', () => {
  const c = priceCart([
    { slug: 'macropad', option: 'tactile', qty: 2 },
    { slug: 'hourglass', qty: 5 }, // digital: always one
    { slug: 'soon-3', qty: 1 },
    { slug: 'macropad', option: 'made-up', qty: 1 }, // unknown option: dropped
    { slug: 'nope', qty: 1 }, // unknown product: dropped
  ])
  assert.equal(c.rows.length, 3)
  assert.equal(c.subtotal, 4699 * 2 + 1999 + PREORDER_PRICE)
  assert.equal(c.hasPhysical, true)
  assert.equal(priceCart([{ slug: 'macropad', option: 'linear', qty: 99 }]).rows[0].qty, 10)
})

test('free, open-source, beta and sold-out things never go in the cart', () => {
  for (const s of ['inkwell', 'padlock', 'omnireach', 'beacon']) assert.equal(buyable(getProduct(s)!), false, s)
  assert.equal(buyable(getProduct('soon-2')!), true)
})

test('shipping: free in India over the threshold, flat abroad, nothing for digital', () => {
  assert.equal(shippingFor('India', 0), 0)
  assert.equal(shippingFor('india', 500), 99)
  assert.equal(shippingFor('India', 4499), 0)
  assert.equal(shippingFor('Germany', 4499), 1999)
})
