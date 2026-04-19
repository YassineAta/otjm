import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const body = await request.json()
    const { title, excerpt, content, category, documentType, imageUrl, date, linkUrl } = body

    if (!title || !excerpt || !content || !category || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const archive = await db.archive.create({
      data: {
        title,
        excerpt,
        content,
        category,
        documentType,
        imageUrl: imageUrl || null,
        authorId: auth.session.user.id,
        date: date ? new Date(date) : new Date(),
        linkUrl: linkUrl || null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    return NextResponse.json(archive, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    )
  }
}
export async function GET(request: NextRequest) {
    try {
        // Fetch all archive records
        const archives = await db.archive.findMany({
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                // Assuming you want the newest archives first
                date: 'desc',
            }
        });

        // Return a successful response with the data
        return NextResponse.json(archives, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to retrieve archives.' },
            { status: 500 }
        );
    }
}