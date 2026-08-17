import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),game=read('game.js'),visuals=read('visual-engine.js'),styles=read('styles.css'),docs=read('README.md'),pkg=JSON.parse(read('package.json'));

assert.equal(pkg.version,'0.63.0');
assert.equal(pkg.dependencies.phaser,'3.90.0');
assert.equal(pkg.description,'Top-down space survival game built with JavaScript, Phaser 3, and Electron.');
assert.ok(!pkg.dependencies.three,'inactive 3D engine must not ship as a runtime dependency');
assert.match(html,/<html lang="en">/,'document language metadata is not English');
assert.match(html,/top-down space survival game built with Phaser 3 and Electron/,'runtime metadata is inaccurate');
assert.match(html,/vendor\/phaser\.min\.js[\s\S]*visual-engine\.js[\s\S]*game\.js/,'top-down renderer scripts are not active or ordered correctly');
assert.doesNotMatch(html,/game-3d\.mjs|styles-3d\.css/,'third-person build is still active');
assert.doesNotMatch(docs,/visual-direction-concept|ASSET_PROMPTS|ImageGen|OpenAI/,'documentation references non-runtime concept material');
assert.match(docs,/does not include a verified screenshot of version 0\.63\.0/,'screenshot status is not documented');

const vendor=path.join(root,'vendor/phaser.min.js');
assert.ok(existsSync(vendor)&&statSync(vendor).size>500000,'offline Phaser runtime is missing');
for(const token of ['tryPhaseDash','dashCooldown','damageNumber','telegraphs','audioMix','MIXES','musicDuck','SIGNAL RUSH','desiredBackground','licensed-sample-assets-v1','cinematicLayers'])assert.ok(game.includes(token),`missing runtime integration token: ${token}`);
for(const token of ['dashEchoes','syncFloaters','settings.telegraphs','player-ship-v3','enemyTexture','fitSprite','syncEnemies','drawEnergyEffects'])assert.ok(visuals.includes(token),`missing retained visual system: ${token}`);
for(const token of ['abilityBar','ambientDrift','panelArrival','eventImpact','rushField','data-motion'])assert.ok(styles.includes(token),`missing presentation token: ${token}`);

for(const asset of ['laserSmall_002.ogg','explosionCrunch_004.ogg','forceField_001.ogg','laserLarge_001.ogg','lowFrequency_explosion_001.ogg']){
  const full=path.join(root,'assets/audio/premium/kenney-sci-fi-sounds',asset);assert.ok(existsSync(full)&&statSync(full).size>7000,`missing licensed audio asset: ${asset}`);
}
for(const asset of ['music-exploration-spirit.mp3','music-combat-score.mp3','music-boss-xanthos.mp3']){const full=path.join(root,'assets/audio/premium',asset);assert.ok(existsSync(full)&&statSync(full).size>1000000,`missing full-length music track: ${asset}`)}
for(const id of ['abilityBar','restartRunBtn','damageNumbersSetting','telegraphSetting','hintsSetting','motionSetting','audioMixSetting'])assert.ok(html.includes(`id="${id}"`),`missing QoL control: ${id}`);

console.log('ORBIT 0.63 top-down runtime integration: PASS');
