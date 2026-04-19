import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, VALID_STATUSES, VALID_PAYMENT } from '@/lib/auth'

interface Context { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Context) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const { id } = await ctx.params
  const data = await req.json()

  try {
    const update: Record<string, unknown> = {}

    // Whitelist fields with validation
    if (data.status && VALID_STATUSES.includes(data.status)) update.status = data.status
    if (data.paymentStatus && VALID_PAYMENT.includes(data.paymentStatus)) update.paymentStatus = data.paymentStatus
    if (data.tier && ['student', 'young-doctor'].includes(data.tier)) update.tier = data.tier
    if (data.memberStatus) update.memberStatus = String(data.memberStatus).slice(0, 100)
    if (typeof data.price === 'number' && data.price >= 0) update.price = data.price

    const member = await db.membership.update({ where: { id }, data: update })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const { id } = await ctx.params

  try {
    await db.membership.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete membership' }, { status: 500 })
  }
}
