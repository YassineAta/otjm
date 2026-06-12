import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    membership: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    paymentEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock('@/lib/card', () => ({
  generateMemberCard: vi.fn().mockResolvedValue({ backPng: Buffer.from('png'), pdf: Buffer.from('pdf') }),
  formatCardNumber: (n: number) => String(n).padStart(4, '0'),
}))
vi.mock('@/lib/mail', () => ({
  isMailConfigured: vi.fn().mockReturnValue(true),
  sendMemberCardEmail: vi.fn().mockResolvedValue(undefined),
}))

import { deliverMemberCard } from '@/lib/card-delivery'
import { db } from '@/lib/db'
import { sendMemberCardEmail, isMailConfigured } from '@/lib/mail'

const mockedFind = vi.mocked(db.membership.findUnique)
const mockedFindFirst = vi.mocked(db.membership.findFirst)
const mockedSend = vi.mocked(sendMemberCardEmail)

const paidMember = {
  id: 'm1', name: 'Dr Test', email: 't@example.com',
  paymentStatus: 'paid', status: 'active',
  cardNumber: null, cardSentAt: null, endDate: new Date('2027-06-12'),
} as never

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isMailConfigured).mockReturnValue(true)
})

describe('deliverMemberCard', () => {
  it('sends once for a paid+active member and assigns the next card number', async () => {
    mockedFind.mockResolvedValue(paidMember)
    mockedFindFirst.mockResolvedValue({ cardNumber: 161 } as never)

    const r = await deliverMemberCard('m1', 'webhook')

    expect(r).toBe('sent')
    expect(db.membership.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { cardNumber: 162 } })
    expect(mockedSend).toHaveBeenCalledOnce()
    expect(mockedSend.mock.calls[0][0].cardNumberLabel).toBe('0162')
  })

  it('is idempotent: skips when cardSentAt is set (no double email on callback races)', async () => {
    mockedFind.mockResolvedValue({ ...(paidMember as object), cardSentAt: new Date() } as never)

    expect(await deliverMemberCard('m1', 'return')).toBe('skipped')
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('force=true resends despite cardSentAt (admin resend)', async () => {
    mockedFind.mockResolvedValue({ ...(paidMember as object), cardSentAt: new Date(), cardNumber: 9 } as never)

    expect(await deliverMemberCard('m1', 'admin', { force: true })).toBe('sent')
    expect(mockedSend.mock.calls[0][0].cardNumberLabel).toBe('0009')
  })

  it('refuses unpaid/inactive members', async () => {
    mockedFind.mockResolvedValue({ ...(paidMember as object), paymentStatus: 'pending', status: 'pending' } as never)

    expect(await deliverMemberCard('m1', 'webhook')).toBe('skipped')
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('skips quietly when SMTP is not configured', async () => {
    vi.mocked(isMailConfigured).mockReturnValue(false)
    mockedFind.mockResolvedValue(paidMember)

    expect(await deliverMemberCard('m1', 'return')).toBe('skipped')
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('never throws — send failures become "failed" + logged event', async () => {
    mockedFind.mockResolvedValue(paidMember)
    mockedFindFirst.mockResolvedValue(null)
    mockedSend.mockRejectedValue(new Error('SMTP down'))

    expect(await deliverMemberCard('m1', 'webhook')).toBe('failed')
    expect(db.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'email_failed' }) }),
    )
  })
})
