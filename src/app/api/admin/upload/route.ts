import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  createPresignedUpload,
  isStorageConfigured,
  validateUploadRequest,
  type UploadKind,
} from '@/lib/storage'

/**
 * Prépare un téléversement direct navigateur → R2 : vérifie la session admin
 * et le fichier annoncé, puis renvoie { uploadUrl, publicUrl, key }.
 * Le client fait ensuite un PUT du fichier sur uploadUrl (valide 5 minutes).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'Stockage non configuré (variables R2 manquantes) — voir docs/CONFIGURATION_R2.md. En attendant, collez une URL externe.',
      },
      { status: 503 },
    )
  }

  try {
    const body = await request.json()
    const { kind, scope, filename, contentType } = body
    const size = Number(body.size)

    const invalid = validateUploadRequest({ kind, scope, contentType, size })
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const upload = await createPresignedUpload({
      kind: kind as UploadKind,
      scope,
      filename: typeof filename === 'string' ? filename : 'fichier',
      contentType,
    })
    return NextResponse.json(upload)
  } catch {
    return NextResponse.json(
      { error: 'Échec de la préparation du téléversement.' },
      { status: 500 },
    )
  }
}
