import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildObjectKey,
  createPresignedUpload,
  isStorageConfigured,
  validateUploadRequest,
} from '@/lib/storage'

const R2_ENV: Record<string, string> = {
  R2_ACCOUNT_ID: 'compte-test',
  R2_ACCESS_KEY_ID: 'cle-acces',
  R2_SECRET_ACCESS_KEY: 'cle-secrete',
  R2_BUCKET: 'otjm-test',
  R2_PUBLIC_BASE_URL: 'https://pub-test.r2.dev/',
}

function stubR2Env(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...R2_ENV, ...overrides })) {
    vi.stubEnv(key, value)
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('validateUploadRequest', () => {
  const valid = {
    kind: 'image',
    scope: 'archives',
    contentType: 'image/png',
    size: 1024,
  }

  it('accepte une image valide', () => {
    expect(validateUploadRequest(valid)).toBeNull()
  })

  it('accepte un document PDF valide', () => {
    expect(
      validateUploadRequest({
        kind: 'document',
        scope: 'archives',
        contentType: 'application/pdf',
        size: 10 * 1024 * 1024,
      }),
    ).toBeNull()
  })

  it('rejette un type de téléversement inconnu', () => {
    expect(validateUploadRequest({ ...valid, kind: 'video' })).toMatch(/inconnu/i)
  })

  it('rejette une section hors liste blanche', () => {
    expect(validateUploadRequest({ ...valid, scope: 'membres' })).toMatch(/section/i)
  })

  it('rejette un PDF déguisé en image', () => {
    expect(validateUploadRequest({ ...valid, contentType: 'application/pdf' })).toMatch(
      /format non accepté/i,
    )
  })

  it('rejette une image au-delà de 5 Mo', () => {
    expect(validateUploadRequest({ ...valid, size: 6 * 1024 * 1024 })).toMatch(/volumineux/i)
  })

  it('rejette une taille nulle ou invalide', () => {
    expect(validateUploadRequest({ ...valid, size: 0 })).toMatch(/taille/i)
    expect(validateUploadRequest({ ...valid, size: NaN })).toMatch(/taille/i)
  })
})

describe('buildObjectKey', () => {
  it('nettoie accents et espaces, groupe par mois', () => {
    const key = buildObjectKey(
      'document',
      'archives',
      'Rapport Médical 2026.pdf',
      'application/pdf',
    )
    expect(key).toMatch(/^archives\/\d{4}-\d{2}\/[0-9a-f]{8}-rapport-medical-2026\.pdf$/)
  })

  it("dérive l'extension du content-type, pas du nom de fichier", () => {
    const key = buildObjectKey('image', 'archives', 'photo.exe', 'image/png')
    expect(key.endsWith('.png')).toBe(true)
  })

  it('retombe sur « fichier » quand le nom ne contient aucun caractère utilisable', () => {
    const key = buildObjectKey('image', 'archives', 'صورة.jpg', 'image/jpeg')
    expect(key).toMatch(/-fichier\.jpg$/)
  })

  it('génère des clés distinctes pour le même fichier (pas d’écrasement)', () => {
    const a = buildObjectKey('image', 'archives', 'logo.png', 'image/png')
    const b = buildObjectKey('image', 'archives', 'logo.png', 'image/png')
    expect(a).not.toBe(b)
  })
})

describe('isStorageConfigured', () => {
  it('faux tant qu’une variable R2 manque', () => {
    stubR2Env({ R2_BUCKET: '' })
    expect(isStorageConfigured()).toBe(false)
  })

  it('vrai quand les 5 variables sont présentes', () => {
    stubR2Env()
    expect(isStorageConfigured()).toBe(true)
  })
})

describe('createPresignedUpload', () => {
  it('signe une URL PUT et construit l’URL publique sans double slash', async () => {
    stubR2Env()
    const { uploadUrl, publicUrl, key } = await createPresignedUpload({
      kind: 'document',
      scope: 'archives',
      filename: 'statuts.pdf',
      contentType: 'application/pdf',
    })

    // URL signée : bon hôte (style path — cohérent avec la CSP), bon bucket, signature présente
    expect(uploadUrl).toContain('compte-test.r2.cloudflarestorage.com/otjm-test/')
    expect(uploadUrl).toContain('X-Amz-Signature=')

    // URL publique : base sans slash final + clé
    expect(publicUrl).toBe(`https://pub-test.r2.dev/${key}`)
  })
})
