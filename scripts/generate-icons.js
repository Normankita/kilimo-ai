// Run with: node scripts/generate-icons.js
// Requires: npm install sharp --save-dev

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outDir = path.join(__dirname, '..', 'public', 'icons')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function makeSvg(size) {
  const r = Math.round(size * 0.22)
  const pad = Math.round(size * 0.22)
  const inner = size - pad * 2

  // All coordinates are proportional so the sprout scales cleanly
  const cx = inner * 0.5
  const stemTop = inner * 0.5
  const stemBot = inner * 0.875
  const stemW = inner * 0.08
  const leafW = inner * 0.31
  const leafH = inner * 0.39
  const leafTip = inner * 0.125

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a5c3f"/>
      <stop offset="100%" stop-color="#1a3828"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <g transform="translate(${pad},${pad})">
    <!-- left leaf -->
    <path fill="white" d="
      M ${cx} ${stemTop}
      C ${cx} ${stemTop - leafH * 0.5} ${cx - leafW} ${leafTip + leafH * 0.3} ${cx - leafW} ${leafTip}
      C ${cx - leafW * 0.3} ${leafTip + leafH * 0.5} ${cx} ${stemTop - leafH * 0.15} ${cx} ${stemTop} Z
    "/>
    <!-- right leaf -->
    <path fill="white" d="
      M ${cx} ${stemTop}
      C ${cx} ${stemTop - leafH * 0.5} ${cx + leafW} ${leafTip + leafH * 0.3} ${cx + leafW} ${leafTip}
      C ${cx + leafW * 0.3} ${leafTip + leafH * 0.5} ${cx} ${stemTop - leafH * 0.15} ${cx} ${stemTop} Z
    "/>
    <!-- stem -->
    <rect fill="white"
      x="${cx - stemW / 2}" y="${stemTop}"
      width="${stemW}" height="${stemBot - stemTop}"
      rx="${stemW / 2}"/>
  </g>
</svg>`
}

async function generate() {
  for (const size of sizes) {
    const svg = makeSvg(size)
    const outPath = path.join(outDir, `icon-${size}x${size}.png`)
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath)
    console.log(`  ✓  icon-${size}x${size}.png`)
  }
  console.log('\nAll icons written to public/icons/')
}

generate().catch(err => { console.error(err); process.exit(1) })
