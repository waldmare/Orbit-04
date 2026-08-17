import { copyFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = path.join(root, 'vendor');
await mkdir(targetDir, { recursive: true });
const assets = [
  [path.join(root, 'node_modules', 'phaser', 'dist', 'phaser.min.js'), path.join(targetDir, 'phaser.min.js'), 'Phaser 3.90.0']
];
for (const [source,target,label] of assets) {
  await access(source, constants.R_OK);
  await copyFile(source, target);
  console.log(`Vendored ${label} -> vendor/${path.basename(target)}`);
}
