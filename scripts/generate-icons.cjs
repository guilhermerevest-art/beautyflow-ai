const sharp = require('sharp');

const makeSvg = (size, radius, fontSize, textY) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#be185d"/>
  <text x="${size/2}" y="${textY}" font-family="Arial" font-size="${fontSize}" font-weight="800" fill="white" text-anchor="middle">B</text>
</svg>`;

sharp(Buffer.from(makeSvg(192, 36, 120, 130)))
  .png()
  .toFile('public/icons/icon-192.png', (e) => e ? console.error('192 error:', e) : console.log('icon-192.png ok'));

sharp(Buffer.from(makeSvg(512, 96, 320, 340)))
  .png()
  .toFile('public/icons/icon-512.png', (e) => e ? console.error('512 error:', e) : console.log('icon-512.png ok'));
