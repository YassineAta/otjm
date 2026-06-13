import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptField, decryptField } from '@/lib/crypto'

const KEY = 'a'.repeat(64) // deterministic 32-byte test key

describe('PII field encryption', () => {
  const original = process.env.FIELD_ENCRYPTION_KEY
  beforeEach(() => { process.env.FIELD_ENCRYPTION_KEY = KEY })
  afterEach(() => { process.env.FIELD_ENCRYPTION_KEY = original })

  it('round-trips a value and never stores it readable', () => {
    const ct = encryptField('12345678')!
    expect(ct.startsWith('enc:v1:')).toBe(true)
    expect(ct).not.toContain('12345678')
    expect(decryptField(ct)).toBe('12345678')
  })

  it('produces a different ciphertext every call (random IV)', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'))
  })

  it('passes legacy plaintext through decrypt untouched (migration window)', () => {
    expect(decryptField('98765432')).toBe('98765432')
  })

  it('handles null/empty as null', () => {
    expect(encryptField(null)).toBeNull()
    expect(encryptField('')).toBeNull()
    expect(decryptField(null)).toBeNull()
  })

  it('stores plaintext when no key is configured (app must not break pre-ops)', () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    expect(encryptField('hello')).toBe('hello')
  })

  it('returns a safe placeholder instead of crashing on a wrong key', () => {
    const ct = encryptField('secret')!
    process.env.FIELD_ENCRYPTION_KEY = 'b'.repeat(64)
    expect(decryptField(ct)).toMatch(/chiffré/)
  })
})
