import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngToIco from 'png-to-ico';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets', 'branding', 'orbit-app-icon.png');
const destination = path.join(root, 'assets', 'branding', 'orbit-app-icon.ico');
const png = await readFile(source);

assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'branding source is not a PNG');
assert.equal(png.readUInt32BE(16), png.readUInt32BE(20), 'branding source must be square');
assert.ok(png.readUInt32BE(16) >= 512, 'branding source must be at least 512 × 512');

const ico = await pngToIco(source);
assert.equal(ico.subarray(0, 4).toString('hex'), '00000100', 'generated Windows icon is invalid');
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, ico);

console.log(`ORBIT branding: PASS (${path.relative(root, destination)}, ${(ico.length / 1024).toFixed(0)} KiB)`);
