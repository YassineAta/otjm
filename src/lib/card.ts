// Personalized member-card generator.
//
// The design ships as two 300-DPI PNG templates rasterized once from the
// association's Illustrator file (src/assets/card/):
//   card-template-1.png — front (static artwork)
//   card-template-2.png — back, with a "CARTE N°" badge we personalize
//
// Personalization is composited server-side with sharp: an SVG overlay
// patches the badge interior and draws the member's number, name and
// validity. Text is converted to vector paths with opentype.js (fonts ship
// in the repo), so output is identical on any machine — no system fonts,
// no headless browser.
//
// Geometry below is in template-2 pixel space (1082×709 @ 300 DPI), measured
// from the rasterized design (see docs/CARD_GENERATOR.md).
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import * as opentype from 'opentype.js'
import { PDFDocument } from 'pdf-lib'

const ASSET_DIR = path.join(process.cwd(), 'src', 'assets', 'card')

const TEMPLATE = {
  width: 1082,
  height: 709,
  dpi: 300,
  // Interior of the distressed badge — safe to repaint with the fill color.
  badgePatch: { x: 104, y: 510, w: 278, h: 118, rx: 16, fill: '#381f21' },
  // Free white space to the right of the badge, under the Arabic subtitle
  // and ABOVE the social-media row (divider line sits at y≈573).
  nameArea: { cx: 730, cy: 512, maxWidth: 540 },
  validityArea: { cx: 730, cy: 552 },
  maroon: '#8c1f2c',
} as const

export interface CardInput {
  fullName: string
  cardNumber: number      // rendered zero-padded to 4 digits, like the design's "0162"
  validUntil: Date
}

export interface GeneratedCard {
  /** Personalized back side, PNG (flat colors — small). */
  backPng: Buffer
  /** Two-page print PDF: front + personalized back at true physical size. */
  pdf: Buffer
}

let fontsPromise: Promise<{ anton: opentype.Font; cinzel: opentype.Font }> | null = null
function loadFonts() {
  // Parsed once per process — opentype parsing is the slow part.
  fontsPromise ??= (async () => {
    const [antonBuf, cinzelBuf] = await Promise.all([
      fs.readFile(path.join(ASSET_DIR, 'fonts', 'Anton-Regular.ttf')),
      fs.readFile(path.join(ASSET_DIR, 'fonts', 'Cinzel-Variable.ttf')),
    ])
    return {
      anton: opentype.parse(antonBuf.buffer.slice(antonBuf.byteOffset, antonBuf.byteOffset + antonBuf.byteLength)),
      cinzel: opentype.parse(cinzelBuf.buffer.slice(cinzelBuf.byteOffset, cinzelBuf.byteOffset + cinzelBuf.byteLength)),
    }
  })()
  return fontsPromise
}

/** Vector path for `text`, centered horizontally on cx with the baseline at y. */
function centeredTextPath(
  font: opentype.Font, text: string, cx: number, baselineY: number,
  fontSize: number, maxWidth: number, fill: string,
): string {
  let size = fontSize
  let width = font.getAdvanceWidth(text, size)
  if (width > maxWidth) {
    size = (size * maxWidth) / width
    width = maxWidth
  }
  const p = font.getPath(text, cx - width / 2, baselineY, size)
  return `<path d="${p.toPathData(2)}" fill="${fill}"/>`
}

export function formatCardNumber(n: number): string {
  return String(n).padStart(4, '0')
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)
}

async function buildOverlaySvg(input: CardInput): Promise<string> {
  const { anton, cinzel } = await loadFonts()
  const { badgePatch: b, nameArea, validityArea, maroon } = TEMPLATE

  const number = formatCardNumber(input.cardNumber)
  // Number: heavy condensed digits filling the badge like the original "0162".
  const numberPath = centeredTextPath(
    anton, number, b.x + b.w / 2, b.y + b.h - 22, 118, b.w - 36, '#ffffff',
  )

  // Name: Trajan-style caps in the association maroon. Cinzel renders
  // lowercase as small caps, so we pass the name through unchanged except
  // for trimming — diacritics (é, ï…) are covered by the font.
  const name = input.fullName.trim()
  const namePath = centeredTextPath(
    cinzel, name, nameArea.cx, nameArea.cy, 52, nameArea.maxWidth, maroon,
  )

  const validity = `Valable jusqu'au ${String(input.validUntil.getMonth() + 1).padStart(2, '0')}/${input.validUntil.getFullYear()}`
  const validityPath = centeredTextPath(
    cinzel, validity, validityArea.cx, validityArea.cy, 26, 420, '#6d585a',
  )

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TEMPLATE.width}" height="${TEMPLATE.height}">
  <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.rx}" fill="${b.fill}"/>
  ${numberPath}
  ${namePath}
  ${validityPath}
</svg>`
}

export async function generateMemberCard(input: CardInput): Promise<GeneratedCard> {
  if (!input.fullName.trim()) throw new Error('Card needs a non-empty name')
  if (!Number.isInteger(input.cardNumber) || input.cardNumber < 1 || input.cardNumber > 9999) {
    throw new Error(`Card number out of range: ${input.cardNumber}`)
  }

  const overlay = Buffer.from(await buildOverlaySvg(input))
  const backPng = await sharp(path.join(ASSET_DIR, 'card-template-2.png'))
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer()

  // Print PDF: both sides as JPEG (photographic front compresses far better
  // than PNG) at the artwork's physical size (px / dpi * 72 points).
  const frontJpg = await sharp(path.join(ASSET_DIR, 'card-template-1.png'))
    .jpeg({ quality: 92 }).toBuffer()
  const backJpg = await sharp(backPng).flatten({ background: '#ffffff' })
    .jpeg({ quality: 92 }).toBuffer()

  const doc = await PDFDocument.create()
  const wPt = (TEMPLATE.width / TEMPLATE.dpi) * 72
  const hPt = (TEMPLATE.height / TEMPLATE.dpi) * 72
  for (const img of [frontJpg, backJpg]) {
    const embedded = await doc.embedJpg(img)
    const page = doc.addPage([wPt, hPt])
    page.drawImage(embedded, { x: 0, y: 0, width: wPt, height: hPt })
  }
  doc.setTitle(`Carte membre OTJM ${formatCardNumber(input.cardNumber)} — ${escapeXml(input.fullName)}`)

  return { backPng, pdf: Buffer.from(await doc.save()) }
}
