// Zod schemas for API boundaries. Every POST/PATCH body must pass one of these
// before touching Prisma — fields not listed here never reach the database,
// which is the structural fix for mass-assignment (see docs/SECURITY_REVIEW.md S2).
import { z } from 'zod'

const email = z.string().trim().toLowerCase().email().max(254)
const shortText = z.string().trim().min(1).max(200)
const isoDate = z.coerce.date()

// Optional free-text field: empty/whitespace strings become undefined so the
// DB stores null instead of ''.
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  )

// Public signup → /api/payment/create. No price, no paymentStatus: the server
// derives the amount from the tier. Tier keys must match TIER_PRICING.
export const paymentCreateSchema = z.object({
  fullName: shortText,
  email,
  tier: z.enum(['externe', 'interne']),
  memberStatus: shortText,
  phone: optionalText(30),
  cin: optionalText(20),
  faculty: optionalText(200),
  dateOfBirth: isoDate.optional().nullable().catch(undefined),
})
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>

// Admin manual entry → POST /api/membership (admin-only route). Admins may
// record offline payments, so price/paymentStatus are accepted but constrained.
export const adminMembershipCreateSchema = z.object({
  fullName: shortText,
  email,
  tier: shortText,
  memberStatus: shortText,
  price: z.number().min(0).max(1000),
  paymentStatus: z.enum(['pending', 'paid', 'failed']),
  paymentMethod: shortText.default('Manuel/Admin'),
  startDate: isoDate,
  endDate: isoDate,
  phone: z.string().trim().max(30).optional().nullable(),
  cin: z.string().trim().max(20).optional().nullable(),
  faculty: z.string().trim().max(200).optional().nullable(),
  dateOfBirth: isoDate.optional().nullable(),
})
export type AdminMembershipCreateInput = z.infer<typeof adminMembershipCreateSchema>

// Uniform 400 for any failed parse: first issue, human-readable, no internals.
export function firstZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid request body'
}
