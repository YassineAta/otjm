import { describe, it, expect } from 'vitest'
import { paymentCreateSchema, adminMembershipCreateSchema } from '@/lib/schemas'

describe('paymentCreateSchema (public signup boundary)', () => {
  const valid = {
    fullName: 'Yassine Test',
    email: 'Yassine@Example.COM',
    tier: 'externe',
    memberStatus: 'Externe',
  }

  it('accepts a minimal valid signup and normalizes email', () => {
    const out = paymentCreateSchema.parse(valid)
    expect(out.email).toBe('yassine@example.com')
  })

  it('strips client-sent price and paymentStatus (mass-assignment guard)', () => {
    const out = paymentCreateSchema.parse({
      ...valid,
      price: 0,
      paymentStatus: 'paid',
      status: 'active',
    }) as Record<string, unknown>
    expect(out.price).toBeUndefined()
    expect(out.paymentStatus).toBeUndefined()
    expect(out.status).toBeUndefined()
  })

  it('rejects unknown tiers — pricing table keys are the only valid values', () => {
    expect(paymentCreateSchema.safeParse({ ...valid, tier: 'gratuit' }).success).toBe(false)
  })

  it('rejects garbage email', () => {
    expect(paymentCreateSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('treats empty-string optional fields as absent', () => {
    const out = paymentCreateSchema.parse({ ...valid, phone: '', cin: '' })
    expect(out.phone).toBeUndefined()
    expect(out.cin).toBeUndefined()
  })
})

describe('adminMembershipCreateSchema (admin manual entry)', () => {
  const valid = {
    fullName: 'Membre Manuel',
    email: 'manuel@example.com',
    tier: 'Externe',
    memberStatus: 'Externe',
    price: 10,
    paymentStatus: 'paid',
    paymentMethod: 'Espèces',
    startDate: '2026-06-12',
    endDate: '2027-06-12',
  }

  it('accepts a valid admin entry', () => {
    expect(adminMembershipCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invented payment statuses', () => {
    expect(adminMembershipCreateSchema.safeParse({ ...valid, paymentStatus: 'comped' }).success).toBe(false)
  })

  it('rejects absurd prices', () => {
    expect(adminMembershipCreateSchema.safeParse({ ...valid, price: 99999 }).success).toBe(false)
    expect(adminMembershipCreateSchema.safeParse({ ...valid, price: -5 }).success).toBe(false)
  })
})
