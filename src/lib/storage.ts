// Stockage objet Cloudflare R2 (API S3) — téléversements admin par URL présignée.
// Le serveur ne fait que signer : les octets vont navigateur → R2 directement,
// ce qui évite la limite de taille du corps de requête en serverless.
// Configuration du bucket : voir docs/CONFIGURATION_R2.md
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const UPLOAD_RULES = {
  image: {
    // extension dérivée du content-type, jamais du nom de fichier
    contentTypes: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<
      string,
      string
    >,
    maxBytes: 5 * 1024 * 1024,
    label: 'image JPEG, PNG ou WebP de 5 Mo max',
  },
  document: {
    contentTypes: { 'application/pdf': 'pdf' } as Record<string, string>,
    maxBytes: 25 * 1024 * 1024,
    label: 'document PDF de 25 Mo max',
  },
} as const

export type UploadKind = keyof typeof UPLOAD_RULES

// Sections de contenu autorisées — étendre quand actualités/événements
// passeront eux aussi au téléversement direct.
export const UPLOAD_SCOPES = ['archives'] as const

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL,
  )
}

/** Retourne un message d'erreur en français, ou null si la demande est valide. */
export function validateUploadRequest(input: {
  kind: string
  scope: string
  contentType: string
  size: number
}): string | null {
  const rules = UPLOAD_RULES[input.kind as UploadKind]
  if (!rules) return 'Type de téléversement inconnu.'
  if (!(UPLOAD_SCOPES as readonly string[]).includes(input.scope)) return 'Section inconnue.'
  if (!(input.contentType in rules.contentTypes))
    return `Format non accepté — attendu : ${rules.label}.`
  if (!Number.isFinite(input.size) || input.size <= 0) return 'Taille de fichier invalide.'
  if (input.size > rules.maxBytes) return `Fichier trop volumineux — attendu : ${rules.label}.`
  return null
}

/**
 * Clé d'objet : `archives/2026-07/a1b2c3d4-mon-rapport.pdf`.
 * Préfixe aléatoire → pas de collision ni d'écrasement ; regroupement par
 * mois pour rester lisible dans le tableau de bord R2.
 */
export function buildObjectKey(
  kind: UploadKind,
  scope: string,
  filename: string,
  contentType: string,
): string {
  const ext = UPLOAD_RULES[kind].contentTypes[contentType]
  const stem =
    filename
      .replace(/\.[^.]*$/, '')
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'fichier'
  const month = new Date().toISOString().slice(0, 7)
  return `${scope}/${month}/${crypto.randomUUID().slice(0, 8)}-${stem}.${ext}`
}

export async function createPresignedUpload(input: {
  kind: UploadKind
  scope: string
  filename: string
  contentType: string
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // Style « path » : l'URL signée reste sur <compte>.r2.cloudflarestorage.com,
    // le seul hôte autorisé par la CSP connect-src.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  })

  const key = buildObjectKey(input.kind, input.scope, input.filename, input.contentType)
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: input.contentType,
    }),
    { expiresIn: 300 },
  )

  const base = (process.env.R2_PUBLIC_BASE_URL as string).replace(/\/+$/, '')
  return { uploadUrl, publicUrl: `${base}/${key}`, key }
}
