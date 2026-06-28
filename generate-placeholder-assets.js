// Generate minimal placeholder PNGs for Expo asset requirements
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'mobile', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent PNG base64
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buffer = Buffer.from(transparentPngBase64, 'base64');

fs.writeFileSync(path.join(assetsDir, 'icon.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), buffer);

console.log('✅ Minimal placeholder assets generated.');
