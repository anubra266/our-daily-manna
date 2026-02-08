/**
 * Generates app icons and related assets from assets/images/logo.svg.
 * Run: node scripts/generate-assets-from-logo.mjs
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'assets', 'images');
const LOGO_SVG = join(ASSETS, 'logo.svg');

const ICON_SIZE = 1024;
const SPLASH_ICON_SIZE = 200;
const FAVICON_SIZE = 48;
const ANDROID_BG_COLOR = '#E6F4FE';

async function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

async function generatePngFromSvg(svgBuffer, width, height, options = {}) {
  return sharp(svgBuffer)
    .resize(width, height)
    .png(options)
    .toBuffer();
}

async function main() {
  const svg = readFileSync(LOGO_SVG);
  const svgWhite = Buffer.from(
    svg.toString().replace(/fill="currentColor"/gi, 'fill="#ffffff"')
  );

  console.log('Generating assets from logo.svg...');

  // 1. icon.png (1024x1024) - main app icon
  const icon = await generatePngFromSvg(svg, ICON_SIZE, ICON_SIZE);
  writeFileSync(join(ASSETS, 'icon.png'), icon);
  console.log('  ✓ icon.png (1024x1024)');

  // 2. favicon.png (48x48)
  const favicon = await generatePngFromSvg(svg, FAVICON_SIZE, FAVICON_SIZE);
  writeFileSync(join(ASSETS, 'favicon.png'), favicon);
  console.log('  ✓ favicon.png (48x48)');

  // 3. splash-icon.png (200x200)
  const splashIcon = await generatePngFromSvg(svg, SPLASH_ICON_SIZE, SPLASH_ICON_SIZE);
  writeFileSync(join(ASSETS, 'splash-icon.png'), splashIcon);
  console.log('  ✓ splash-icon.png (200x200)');

  // 4. Android adaptive: foreground (1024x1024, transparent)
  const androidForeground = await generatePngFromSvg(svg, ICON_SIZE, ICON_SIZE, {
    density: 1024,
  });
  writeFileSync(join(ASSETS, 'android-icon-foreground.png'), androidForeground);
  console.log('  ✓ android-icon-foreground.png (1024x1024)');

  // 5. Android adaptive: monochrome (1024x1024, white logo)
  const androidMonochrome = await generatePngFromSvg(svgWhite, ICON_SIZE, ICON_SIZE);
  writeFileSync(join(ASSETS, 'android-icon-monochrome.png'), androidMonochrome);
  console.log('  ✓ android-icon-monochrome.png (1024x1024)');

  // 6. Android adaptive: background (1024x1024 solid color)
  const androidBackground = await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 3,
      background: ANDROID_BG_COLOR,
    },
  })
    .png()
    .toBuffer();
  writeFileSync(join(ASSETS, 'android-icon-background.png'), androidBackground);
  console.log('  ✓ android-icon-background.png (1024x1024, #E6F4FE)');

  console.log('Done. Assets written to assets/images/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
