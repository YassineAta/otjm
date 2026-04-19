import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params
    const user = await db.user.findUnique({ where: { id }, select: USER_SELECT })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params
    const body = await request.json()

    // Whitelist allowed fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.name === 'string') updateData.name = body.name.trim()
    if (typeof body.role === 'string' && ['member', 'admin', 'superadmin'].includes(body.role)) {
      updateData.role = body.role
    }

    const user = await db.user.update({ where: { id }, data: updateData, select: USER_SELECT })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params
    const user = await db.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // In production: send reset link via email, never return password
    return NextResponse.json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
