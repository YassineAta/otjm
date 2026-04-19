import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Define the structure for accessing the URL parameter
interface Params {
  params: Promise<{ id: string }>
}

// Handles PATCH requests to /api/news/[id] (Update)
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'News ID is required for update' }, { status: 400 })
  }

  try {
    const body = await request.json()
    // Extract all potential fields that can be updated
    const { title, excerpt, content, category, imageUrl, published, sourceUrl } = body

    // Ensure data handles null/empty string gracefully for optional fields
    const data: any = {
      title,
      excerpt,
      content,
      category,
      published,
      // Use null if the field is empty, allowing it to be cleared in the database
      imageUrl: imageUrl === '' ? null : imageUrl,
      sourceUrl: sourceUrl === '' ? null : sourceUrl,
    }

    // Remove undefined values to avoid errors during update
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const updatedNews = await db.news.update({
      where: { id: id },
      data: data,
      include: {
        author: {
          select: { name: true, id: true, email: true }
        }
      }
    })

    return NextResponse.json(updatedNews)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    )
  }
}

// Handles DELETE requests to /api/news/[id] (Delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'News ID is required for deletion' }, { status: 400 })
  }

  try {
    await db.news.delete({
      where: { id: id },
    })

    // Return a 204 No Content status for successful deletion
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    )
  }
}