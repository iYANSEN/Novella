#!/usr/bin/env node




// Run this once to generate placeholder assets for Expo
// npm install canvas (optional) or just use the expo default assets

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// Create minimal SVG placeholders
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0d0d14"/>
  <text x="512" y="580" font-size="500" text-anchor="middle" fill="#7c3aed">📖</text>
  <text x="512" y="900" font-size="120" text-anchor="middle" fill="#a78bfa" font-family="sans-serif" font-weight="bold">Novella</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
console.log('✓ Assets placeholder created');
console.log('');
console.log('⚠️  For production, replace assets/ with proper PNG files:');
console.log('   - icon.png (1024x1024)');
console.log('   - splash.png (1284x2778)');
console.log('   - adaptive-icon.png (1024x1024)');
console.log('   - favicon.png (48x48)');
console.log('   - notification-icon.png (96x96)');
