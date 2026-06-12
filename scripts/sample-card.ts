// Visual check: node_modules\.bin\tsx scripts/sample-card.ts → scripts/sample-card.png|pdf
import fs from 'node:fs/promises'
import { generateMemberCard } from '../src/lib/card'

async function main() {
  const { backPng, pdf } = await generateMemberCard({
    fullName: 'Dr Yassine Ben Meftah',
    cardNumber: 7,
    validUntil: new Date('2027-06-12'),
  })
  await fs.writeFile('scripts/sample-card.png', backPng)
  await fs.writeFile('scripts/sample-card.pdf', pdf)
  console.log('png', backPng.length, 'bytes · pdf', pdf.length, 'bytes')
}
main().catch((e) => { console.error(e); process.exit(1) })
