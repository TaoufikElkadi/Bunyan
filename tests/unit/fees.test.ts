import { describe, it, expect } from 'vitest'
import { calculateCoverFee, getMethodFeeDescription } from '@/lib/fees'

describe('calculateCoverFee', () => {
  describe('iDEAL (fixed 29c, no percentage)', () => {
    it('charges 29 cents on €25', () => {
      expect(calculateCoverFee(2500, 'ideal')).toBe(29)
    })

    it('charges 29 cents on €100', () => {
      expect(calculateCoverFee(10000, 'ideal')).toBe(29)
    })
  })

  describe('card (fixed 25c + 1.8%)', () => {
    it('calculates fee on €25 → 25 + 45 = 70', () => {
      expect(calculateCoverFee(2500, 'card')).toBe(70)
    })

    it('calculates fee on €10 → 25 + 18 = 43', () => {
      expect(calculateCoverFee(1000, 'card')).toBe(43)
    })

    it('calculates fee on €1 (small amount) → 25 + 2 = 27', () => {
      expect(calculateCoverFee(100, 'card')).toBe(27)
    })

    it('charges only fixed fee on zero amount → 25', () => {
      expect(calculateCoverFee(0, 'card')).toBe(25)
    })
  })

  describe('SEPA (fixed 25c, no percentage)', () => {
    it('charges 25 cents regardless of amount', () => {
      expect(calculateCoverFee(5000, 'sepa')).toBe(25)
      expect(calculateCoverFee(100, 'sepa')).toBe(25)
    })
  })

  describe('Bancontact (fixed 39c, no percentage)', () => {
    it('charges 39 cents regardless of amount', () => {
      expect(calculateCoverFee(5000, 'bancontact')).toBe(39)
      expect(calculateCoverFee(100, 'bancontact')).toBe(39)
    })
  })

  describe('Stripe (fixed 29c, no percentage)', () => {
    it('charges 29 cents regardless of amount', () => {
      expect(calculateCoverFee(5000, 'stripe')).toBe(29)
      expect(calculateCoverFee(100, 'stripe')).toBe(29)
    })
  })
})

describe('getMethodFeeDescription', () => {
  it('returns fixed-only description for iDEAL', () => {
    expect(getMethodFeeDescription('ideal')).toBe('€0.29')
  })

  it('returns fixed + percentage description for card', () => {
    expect(getMethodFeeDescription('card')).toBe('€0.25 + 1.8%')
  })

  it('returns fixed-only description for SEPA', () => {
    expect(getMethodFeeDescription('sepa')).toBe('€0.25')
  })

  it('returns fixed-only description for Bancontact', () => {
    expect(getMethodFeeDescription('bancontact')).toBe('€0.39')
  })

  it('returns fixed-only description for Stripe', () => {
    expect(getMethodFeeDescription('stripe')).toBe('€0.29')
  })
})
