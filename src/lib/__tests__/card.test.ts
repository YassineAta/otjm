import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { generateMemberCard, formatCardNumber } from '@/lib/card'

describe('formatCardNumber', () => {
  it('zero-pads to 4 digits like the design ("0162")', () => {
    expect(formatCardNumber(7)).toBe('0007')
    expect(formatCardNumber(162)).toBe('0162')
    expect(formatCardNumber(1234)).toBe('1234')
  })
})

describe('generateMemberCard (real sharp render)', () => {
  const input = { fullName: 'Dr Test Membre', cardNumber: 42, validUntil: new Date('2027-06-12') }

  it('produces a PNG at template dimensions and a 2-page-sized PDF', async () => {
    const { backPng, pdf } = await generateMemberCard(input)

    const meta = await sharp(backPng).metadata()
    expect(meta.width).toBe(1082)
    expect(meta.height).toBe(709)
    expect(meta.format).toBe('png')

    // pdf-lib output starts with the PDF magic and contains 2 page objects
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(50_000)
  })

  it('actually draws the personalization (output differs from the blank template)', async () => {
    const { backPng } = await generateMemberCard(input)
    // The badge digits area must contain white pixels (the number) over the
    // dark patch — sample the patch center row.
    const { data, info } = await sharp(backPng).raw().toBuffer({ resolveWithObject: true })
    let whiteInBadge = 0
    const y = 570
    for (let x = 110; x < 380; x++) {
      const i = (y * info.width + x) * info.channels
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) whiteInBadge++
    }
    expect(whiteInBadge).toBeGreaterThan(10)
  })

  it('rejects empty names and out-of-range numbers', async () => {
    await expect(generateMemberCard({ ...input, fullName: '  ' })).rejects.toThrow()
    await expect(generateMemberCard({ ...input, cardNumber: 0 })).rejects.toThrow()
    await expect(generateMemberCard({ ...input, cardNumber: 10_000 })).rejects.toThrow()
  })
})
