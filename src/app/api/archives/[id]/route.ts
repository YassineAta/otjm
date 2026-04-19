import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const archive = await db.archive.findUnique({
      where: { id: id },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(archive)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch archive' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params;
    const body = await request.json()
    const { title, excerpt, content, category, documentType, imageUrl, date } = body
    
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (documentType !== undefined) updateData.documentType = documentType
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (date !== undefined) updateData.date = date ? new Date(date) : undefined
    
    const archive = await db.archive.update({
      where: { id: id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json(archive)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update archive' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { id } = await params;
    await db.archive.delete({
      where: { id: id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete archive' },
      { status: 500 }
    )
  }
}