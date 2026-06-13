// One-time migration: encrypt plaintext cin/phone on existing Membership rows.
// Run on the machine that has the production env:
//   set FIELD_ENCRYPTION_KEY first, then:  node_modules\.bin\tsx scripts/encrypt-pii.ts
// Idempotent: already-encrypted values (enc:v1: prefix) are skipped.
import { db } from '../src/lib/db'
import { encryptField, isEncryptionConfigured } from '../src/lib/crypto'

async function main() {
  if (!isEncryptionConfigured()) {
    console.error('FIELD_ENCRYPTION_KEY is not set — aborting (nothing would be encrypted).')
    process.exit(1)
  }
  const rows = await db.membership.findMany({ select: { id: true, cin: true, phone: true } })
  let updated = 0
  for (const row of rows) {
    const data: Record<string, string | null> = {}
    if (row.cin && !row.cin.startsWith('enc:v1:')) data.cin = encryptField(row.cin)
    if (row.phone && !row.phone.startsWith('enc:v1:')) data.phone = encryptField(row.phone)
    if (Object.keys(data).length) {
      await db.membership.update({ where: { id: row.id }, data })
      updated++
    }
  }
  console.log(`Encrypted PII on ${updated}/${rows.length} membership rows.`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
