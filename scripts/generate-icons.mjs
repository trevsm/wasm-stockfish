import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const sizes = [192, 512];

async function generateIcon(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#18181b" rx="${Math.round(size * 0.125)}"/>
    <text x="${size / 2}" y="${size * 0.68}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size * 0.52)}" font-weight="bold" fill="white" text-anchor="middle">♞</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(publicDir, `pwa-${size}x${size}.png`));

  console.log(`Generated pwa-${size}x${size}.png`);
}

await Promise.all(sizes.map(generateIcon));
console.log("Done!");
