import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normEmail, normPhone } from './validate.ts'

test('emails are trimmed, lower-cased, and checked', () => {
  assert.equal(normEmail('  Asha@Studio.IN '), 'asha@studio.in')
  assert.equal(normEmail('asha@studio'), null)
  assert.equal(normEmail(''), null)
})

test('phones accept +91 and 0 prefixes, reject the rest', () => {
  assert.equal(normPhone('+91 98765 43210'), '9876543210')
  assert.equal(normPhone('09876543210'), '9876543210')
  assert.equal(normPhone('5876543210'), null)
  assert.equal(normPhone('98765'), null)
})
