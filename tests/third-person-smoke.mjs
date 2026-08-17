import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const html=read('index.html');
const game=read('game-3d.mjs');
const pkg=JSON.parse(read('package.json'));

assert.match(html,/type="module" src="game-3d\.mjs"/,'Three.js entrypoint is not active');
assert.doesNotMatch(html,/<script[^>]+(?:phaser|visual-engine|game\.js)/i,'legacy renderer is still loaded');
assert.equal(pkg.version,'0.70.0');
assert.ok(pkg.dependencies.three,'Three.js dependency is missing');
assert.ok(!pkg.dependencies.phaser,'Phaser must not be an active dependency');

for(const file of ['vendor/three.module.min.js','vendor/three.core.min.js']){
  const full=path.join(root,file);
  assert.ok(existsSync(full)&&statSync(full).size>100000,`missing offline runtime: ${file}`);
}

for(const token of ['PerspectiveCamera','InstancedMesh','requestPointerLock','updateSpawns','openUpgrade','REACTOR FLOW','MAX_ENEMIES','adaptive-3-stem','diagnostics()']){
  assert.ok(game.includes(token),`missing 3D/gameplay system: ${token}`);
}

for(const asset of [
  'assets/visuals/deep-space-arena-v1.png','assets/visuals/space-pulsar-v1.png','assets/visuals/space-rift-v1.png','assets/visuals/space-supernova-v1.png',
  'assets/audio/music_exploration.wav','assets/audio/music_combat.wav','assets/audio/music_boss.wav','assets/audio/pulse.wav','assets/audio/explosion.wav','assets/audio/boss_warning.wav'
]){
  const full=path.join(root,asset);
  assert.ok(existsSync(full)&&statSync(full).size>44,`missing runtime asset: ${asset}`);
}

console.log('ORBIT 0.70 third-person engine smoke: PASS');
