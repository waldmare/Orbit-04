import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const game = await readFile(path.join(root, 'game.js'), 'utf8');
const platform = process.platform;
const architecture = process.arch;
const packageRoot = path.join(root, 'out', `ORBIT-04-${platform}-${architecture}`);
const steamScreenshots = [
  '01-deep-space-assault.png',
  '02-pulsar-signal-rush.png',
  '03-rift-crossfire.png',
  '04-supernova-siege.png',
  '05-carrier-boss-encounter.png'
];
const executable = platform === 'win32'
  ? path.join(packageRoot, 'ORBIT-04.exe')
  : path.join(packageRoot, platform === 'darwin' ? 'ORBIT-04.app' : 'ORBIT-04');

async function requireFile(relative, minimumBytes = 1) {
  const absolute = path.join(root, relative);
  assert.ok(existsSync(absolute), `${relative} is missing`);
  const info = await stat(absolute);
  assert.ok(info.isFile() && info.size >= minimumBytes, `${relative} is empty or truncated`);
  return { absolute, info };
}

assert.match(game, new RegExp(`GAME_VERSION=['"]${pkg.version.replaceAll('.', '\\.')}['"]`), 'game and package versions differ');
await requireFile('assets/branding/orbit-app-icon.png', 100_000);
await requireFile('assets/branding/orbit-app-icon.ico', 10_000);
await requireFile('vendor/phaser.min.js', 1_000_000);
await requireFile('steam/scripts/app_build_TEMPLATE.vdf', 100);
await requireFile('steam/scripts/depot_build_windows_TEMPLATE.vdf', 100);
for (const filename of steamScreenshots) {
  const { absolute } = await requireFile(path.join('steam', 'store', 'screenshots', filename), 100_000);
  const png = await readFile(absolute);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${filename} is not a PNG`);
  assert.equal(png.readUInt32BE(16), 1920, `${filename} must be 1920 pixels wide`);
  assert.equal(png.readUInt32BE(20), 1080, `${filename} must be 1080 pixels high`);
}

assert.ok(existsSync(packageRoot), `packaged application is missing: ${path.relative(root, packageRoot)}`);
assert.ok(existsSync(executable), `packaged executable is missing: ${path.relative(root, executable)}`);
const asar = await stat(path.join(packageRoot, 'resources', 'app.asar'));
assert.ok(asar.isFile() && asar.size > 10_000_000, 'packaged app.asar is missing or unexpectedly small');

const forbiddenLooseEntries = ['tests', 'tools', 'steam', '.github'];
for (const entry of forbiddenLooseEntries) {
  assert.ok(!existsSync(path.join(packageRoot, 'resources', 'app', entry)), `development-only directory shipped loose: ${entry}`);
}

console.log(`ORBIT release package: PASS (${pkg.version}, ${platform}-${architecture}, ${(asar.size / 1024 / 1024).toFixed(1)} MiB app.asar)`);
