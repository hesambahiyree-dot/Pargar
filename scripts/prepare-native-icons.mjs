import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const svg = await readFile(join(root, "public/pargar-icon.svg"));
const pngPath = join(root, "public/pargar.png");
const png = await sharp(svg).resize(512, 512).png().toBuffer();
await writeFile(pngPath, png);
await writeFile(join(root, "public/pargar.ico"), await pngToIco(pngPath));
const sizes = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];
for (const [folder, size] of sizes) {
  const target = join(root, "icons", "android", folder, "ic_launcher.png");
  await mkdir(dirname(target), { recursive: true });
  await sharp(svg).resize(size, size).png().toFile(target);
}
console.log("Generated Pargar PNG, Windows ICO, and Android launcher icons.");
