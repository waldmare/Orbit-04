import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFiles = [
  'index.html',
  'styles.css',
  'game.js',
  'visual-engine.js',
  'desktop/main.cjs'
];
const mediaExtensions = new Set(['.png', '.wav', '.ogg', '.mp3']);
const assetPattern = /assets\/[A-Za-z0-9_./-]+\.(?:png|wav|ogg|mp3)/g;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function validatePng(buffer, relative) {
  const signature = '89504e470d0a1a0a';
  assert.equal(buffer.subarray(0, 8).toString('hex'), signature, `${relative}: invalid PNG signature`);
  assert.ok(buffer.length >= 24, `${relative}: truncated PNG header`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert.ok(width > 0 && height > 0, `${relative}: invalid PNG dimensions`);
  assert.ok(width <= 8192 && height <= 8192, `${relative}: unreasonable PNG dimensions`);
}

function validateWav(buffer, relative) {
  assert.ok(buffer.length >= 44, `${relative}: truncated WAV file`);
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${relative}: invalid WAV container`);
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WAVE', `${relative}: invalid WAV format`);
}

function validateOgg(buffer, relative) {
  assert.ok(buffer.length >= 27, `${relative}: truncated OGG file`);
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'OggS', `${relative}: invalid OGG signature`);
}

function validateMp3(buffer, relative) {
  assert.ok(buffer.length >= 128, `${relative}: truncated MP3 file`);
  const hasId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3';
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  assert.ok(hasId3 || hasFrameSync, `${relative}: invalid MP3 signature`);
}

const referencedAssets = new Set();
for (const sourceFile of sourceFiles) {
  const source = await readFile(path.join(root, sourceFile), 'utf8');
  for (const match of source.matchAll(assetPattern)) referencedAssets.add(match[0]);
}
assert.ok(referencedAssets.size >= 30, 'asset audit discovered too few runtime references');

for (const relative of referencedAssets) {
  const absolute = path.resolve(root, relative);
  assert.ok(absolute.startsWith(path.join(root, 'assets') + path.sep), `${relative}: path escapes assets directory`);
  const info = await stat(absolute);
  assert.ok(info.isFile() && info.size > 0, `${relative}: referenced asset is missing or empty`);
}

const mediaFiles = (await walk(path.join(root, 'assets')))
  .filter(file => mediaExtensions.has(path.extname(file).toLowerCase()));
assert.ok(mediaFiles.length >= 100, 'runtime media set is incomplete');

let totalBytes = 0;
for (const absolute of mediaFiles) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const buffer = await readFile(absolute);
  totalBytes += buffer.length;
  switch (path.extname(absolute).toLowerCase()) {
    case '.png': validatePng(buffer, relative); break;
    case '.wav': validateWav(buffer, relative); break;
    case '.ogg': validateOgg(buffer, relative); break;
    case '.mp3': validateMp3(buffer, relative); break;
  }
}

const phaser = await stat(path.join(root, 'vendor', 'phaser.min.js'));
assert.ok(phaser.isFile() && phaser.size > 1_000_000, 'offline Phaser runtime is missing or truncated');

console.log(`ORBIT asset audit: PASS (${referencedAssets.size} runtime references, ${mediaFiles.length} media files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB)`);
