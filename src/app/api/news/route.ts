import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/news
 * Optional query: ?published=true|false (admin only — public callers always
 * get published articles only, so drafts never leak).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedParam = searchParams.get('published')
    const isAdmin = !(await requireAdmin()).error

    const where: Record<string, unknown> = isAdmin
      ? publishedParam !== null
        ? { published: publishedParam === 'true' }
        : {}
      : { published: true }

    const news = await db.news.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(news, {
      status: 200,
      // Public content changes a few times a week — let browsers reuse it
      // briefly instead of hitting MongoDB on every navigation.
      headers: isAdmin
        ? {}
        : { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=900' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve news.' }, { status: 500 })
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

    const { title, excerpt, content, category, imageUrl, published, sourceUrl } = body

    if (!title) {
      return NextResponse.json({ error: 'Missing required field (title)' }, { status: 400 })
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
        published: published ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 })
  }
}
