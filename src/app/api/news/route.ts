import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/news
 * Optional query: ?published=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedParam = searchParams.get('published')

    const where: Record<string, unknown> = {}

    if (publishedParam !== null) {
      where.published = publishedParam === 'true'
    }

    const news = await db.news.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(news, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve news.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/news
 * Create a news article
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const body = await request.json()

    const {
      title,
      excerpt,
      content,
      category,
      imageUrl,
      published,
      sourceUrl
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field (title)' },
        { status: 400 }
      )
    }

    const news = await db.news.create({
      data: {
        title,
        excerpt: excerpt || null,
        content: content || null,
        category: category || null,
        imageUrl: imageUrl || null,
        sourceUrl: sourceUrl || null,
        authorId: auth.session.user.id,
        published: published ?? false
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

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    )
  }
}