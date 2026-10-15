import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const source = path.resolve("public/icon.png");
const buildDir = path.resolve("build");
const assetsDir = path.resolve("assets");
await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(assetsDir, { recursive: true });

// Keep the provided artwork; only prepare platform-specific icon sizes.
await sharp(source)
  .resize(1024, 1024, { fit: "cover", position: "centre" })
  .png()
  .toFile(path.join(assetsDir, "icon-only.png"));

const ico = await pngToIco(source);
await fs.writeFile(path.join(buildDir, "icon.ico"), ico);
console.log("Prepared Pargar icon assets.");
