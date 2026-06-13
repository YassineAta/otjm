// Application-level encryption for PII fields (CIN = national ID, phone).
// AES-256-GCM, key from FIELD_ENCRYPTION_KEY (64 hex chars = 32 bytes).
//
// Storage format: "enc:v1:" + base64(iv[12] ‖ authTag[16] ‖ ciphertext).
// The prefix lets plaintext legacy rows coexist during migration — decrypt
// passes unprefixed values through untouched, and scripts/encrypt-pii.ts
// upgrades them in place.
//
// Failure posture:
// - No key configured → fields are stored as-is (the app must keep working
//   before ops sets the key); isEncryptionConfigured() lets callers warn.
// - Encrypted value but no/wrong key → a readable placeholder, never a crash.
import crypto from 'node:crypto'

const PREFIX = 'enc:v1:'

function getKey(): Buffer | null {
  const hex = process.env.FIELD_ENCRYPTION_KEY
  if (!hex) return null
  const key = Buffer.from(hex, 'hex')
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  return key
}

export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.FIELD_ENCRYPTION_KEY)
}

export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null
  const key = getKey()
  if (!key) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith(PREFIX)) return value // legacy plaintext row
  const key = getKey()
  if (!key) return '[chiffré — FIELD_ENCRYPTION_KEY manquante]'
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const ciphertext = raw.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    return '[chiffré — clé invalide]'
  }
}
