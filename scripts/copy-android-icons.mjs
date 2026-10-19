import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "icons", "android");
for (const folder of ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"]) {
  const source = join(sourceRoot, folder, "ic_launcher.png");
  const targetDir = join(root, "android", "app", "src", "main", "res", folder);
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, join(targetDir, "ic_launcher.png"));
  await copyFile(source, join(targetDir, "ic_launcher_round.png"));
}
console.log("Installed Pargar launcher icons into Android resources.");
