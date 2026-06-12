import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the two collaborators: the DB and the Flouci client. settlePayment's
// job is pure orchestration — these tests pin its invariants:
//   never activate on wrong amount, never demote a settled row,
//   never mutate state on verify errors.
vi.mock('@/lib/db', () => ({
  db: {
    membership: { findUnique: vi.fn(), update: vi.fn() },
    paymentEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock('@/lib/flouci', () => ({ verifyPayment: vi.fn() }))

import { settlePayment } from '@/lib/payment-state'
import { db } from '@/lib/db'
import { verifyPayment } from '@/lib/flouci'

const mockedVerify = vi.mocked(verifyPayment)
const mockedFind = vi.mocked(db.membership.findUnique)
const mockedUpdate = vi.mocked(db.membership.update)

const pendingMembership = {
  id: 'm1', price: 20, paymentStatus: 'pending', status: 'pending',
} as never

function flouciSays(status: string, amountMillimes: number, success = true) {
  mockedVerify.mockResolvedValue({
    success, status, amountMillimes, raw: {},
  } as never)
}

beforeEach(() => vi.clearAllMocks())

describe('settlePayment', () => {
  it('activates a pending membership on SUCCESS with the exact amount', async () => {
    mockedFind.mockResolvedValue(pendingMembership)
    flouciSays('SUCCESS', 20_000)

    const r = await settlePayment('pay1', 'return')

    expect(r.outcome).toBe('activated')
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { paymentStatus: 'paid', status: 'active' },
    })
  })

  it('REFUSES to activate on SUCCESS with a wrong amount', async () => {
    mockedFind.mockResolvedValue(pendingMembership)
    flouciSays('SUCCESS', 5_000) // paid 5 DT for a 20 DT tier

    const r = await settlePayment('pay1', 'webhook')

    expect(r.outcome).toBe('amount_mismatch')
    expect(mockedUpdate).not.toHaveBeenCalled() // row stays pending for admin review
  })

  it('marks failed on FAILURE/EXPIRED', async () => {
    mockedFind.mockResolvedValue(pendingMembership)
    flouciSays('EXPIRED', 0, false)

    const r = await settlePayment('pay1', 'return')

    expect(r.outcome).toBe('payment_failed')
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { paymentStatus: 'failed' },
    })
  })

  it('leaves a PENDING-at-Flouci payment untouched', async () => {
    mockedFind.mockResolvedValue(pendingMembership)
    flouciSays('PENDING', 20_000, false)

    const r = await settlePayment('pay1', 'webhook')

    expect(r.outcome).toBe('still_pending')
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('never touches an already-settled row (idempotent replays)', async () => {
    mockedFind.mockResolvedValue({ ...pendingMembership, paymentStatus: 'paid' } as never)
    flouciSays('SUCCESS', 20_000)

    const r = await settlePayment('pay1', 'webhook')

    expect(r.outcome).toBe('already_final')
    expect(r.paymentStatus).toBe('paid')
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('reports the settled status for already-failed rows (return page must not show success)', async () => {
    mockedFind.mockResolvedValue({ ...pendingMembership, paymentStatus: 'failed' } as never)
    flouciSays('SUCCESS', 20_000)

    const r = await settlePayment('pay1', 'return')

    expect(r.outcome).toBe('already_final')
    expect(r.paymentStatus).toBe('failed')
  })

  it('returns unknown_payment when no membership carries the id', async () => {
    mockedFind.mockResolvedValue(null)
    flouciSays('SUCCESS', 20_000)

    expect((await settlePayment('ghost', 'webhook')).outcome).toBe('unknown_payment')
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('returns verify_error and mutates nothing when Flouci is unreachable', async () => {
    mockedVerify.mockRejectedValue(new Error('ECONNREFUSED'))

    expect((await settlePayment('pay1', 'return')).outcome).toBe('verify_error')
    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedUpdate).not.toHaveBeenCalled()
  })
})
