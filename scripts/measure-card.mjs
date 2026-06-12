// One-off: measure card template geometry + sample colors for the generator.
import sharp from 'sharp'

const file = 'src/assets/card/card-template-2.png'

// Crop the suspected badge region for visual inspection
await sharp(file).extract({ left: 60, top: 430, width: 420, height: 279 }).toFile('scripts/badge-crop.png')

const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
const px = (x, y) => {
  const i = (y * info.width + x) * info.channels
  return [data[i], data[i + 1], data[i + 2]]
}

// Constrained bbox scan: lower-left quadrant only, dark pixels
let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1
for (let y = 430; y < info.height; y++) {
  for (let x = 0; x < 500; x++) {
    const [r, g, b] = px(x, y)
    if (r < 90 && g < 70 && b < 70) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
}
console.log('badge bbox (x<500, y>430):', { minX, maxX, minY, maxY })
console.log('badge fill sample:', px(Math.round((minX + maxX) / 2), minY + 15))
