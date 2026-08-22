import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),game=read('game.js'),visuals=read('visual-engine.js'),styles=read('styles.css'),desktop=read('desktop/main.cjs'),docs=read('README.md'),pkg=JSON.parse(read('package.json'));

assert.equal(pkg.version,'0.68.0');
assert.equal(pkg.dependencies.phaser,'3.90.0');
assert.equal(pkg.description,'Top-down space survival game built with JavaScript, Phaser 3, and Electron.');
assert.match(pkg.scripts.screenshot,/--orbit-capture/,'runtime screenshot script is missing');
assert.match(pkg.scripts['screenshot:steam'],/--orbit-steam-capture/,'Steam screenshot script is missing');
assert.match(pkg.scripts['release:check'],/verify-release\.mjs/,'release verification script is missing');
assert.ok(!pkg.dependencies.three,'inactive 3D engine must not ship as a runtime dependency');
assert.match(html,/<html lang="en">/,'document language metadata is not English');
assert.match(html,/top-down space survival game built with Phaser 3 and Electron/,'runtime metadata is inaccurate');
assert.match(html,/vendor\/phaser\.min\.js[\s\S]*visual-engine\.js[\s\S]*game\.js/,'top-down renderer scripts are not active or ordered correctly');
assert.doesNotMatch(html,/game-3d\.mjs|styles-3d\.css/,'third-person build is still active');
assert.doesNotMatch(docs,/visual-direction-concept|ASSET_PROMPTS|ImageGen|OpenAI/,'documentation references non-runtime concept material');
assert.match(docs,/docs\/runtime-screenshot\.png[\s\S]*automated capture from the active Electron\/WebGL runtime/,'verified runtime screenshot is not documented accurately');
for(const token of ['--orbit-capture','--orbit-steam-capture','orbit04-capture','waitForRenderer','capturePage','runtime-screenshot.png','image.isEmpty','setPermissionRequestHandler','requestSingleInstanceLock'])assert.ok(desktop.includes(token),`missing runtime capture or desktop safeguard: ${token}`);

const vendor=path.join(root,'vendor/phaser.min.js');
assert.ok(existsSync(vendor)&&statSync(vendor).size>500000,'offline Phaser runtime is missing');
const screenshot=path.join(root,'docs/runtime-screenshot.png'),png=readFileSync(screenshot);
assert.ok(png.length>100000,'verified runtime screenshot is missing or empty');
assert.equal(png.readUInt32BE(16),1440,'runtime screenshot width must be 1440');assert.equal(png.readUInt32BE(20),810,'runtime screenshot height must be 810');
for(const token of ['tryPhaseDash','dashCooldown','damageNumber','telegraphs','audioMix','MIXES','musicDuck','SIGNAL RUSH','desiredBackground','licensed-sample-assets-v2','cinematicLayers','selectEnemyType','followWorldCamera','translateWorld','unlockSamples','played===false','testAudioOutput','WORLD_CELL_SIZE','generateWorldCell','collectWorldNode','updateWorldGeneration','NULL JAMMER','FLUX AMPLIFIER','deathFx','dampValue'])assert.ok(game.includes(token),`missing runtime integration token: ${token}`);
for(const token of ['dashEchoes','syncFloaters','settings.telegraphs','player-ship-v3','enemyTexture','fitSprite','syncEnemies','drawEnergyEffects','drawWorldSites','worldNodes','smoothValue','smoothAngle','motionScale','easeOutBack','syncDeathFx','enginePulse','spawnScale'])assert.ok(visuals.includes(token),`missing retained visual system: ${token}`);
assert.match(game,/player-interceptor-v2\.png[\s\S]*enemy-hunter-v2\.png[\s\S]*boss-carrier-v2\.png/,'matte-free ship assets are not wired into the runtime');
assert.match(visuals,/orbit-glow[^\n]*setVisible\(false\)[\s\S]*drawEnergyEffects[\s\S]*this\.fx\.fillCircle/,'vector glow fallback is not active');
for(const token of ['abilityBar','ambientDrift','panelArrival','eventImpact','rushField','data-motion','intelLayout','settingsPresets','audioCheckRow','navigationSignal'])assert.ok(styles.includes(token),`missing presentation token: ${token}`);

for(const asset of ['laserSmall_002.ogg','explosionCrunch_004.ogg','forceField_001.ogg','laserLarge_001.ogg','lowFrequency_explosion_001.ogg']){
  const full=path.join(root,'assets/audio/premium/kenney-sci-fi-sounds',asset);assert.ok(existsSync(full)&&statSync(full).size>7000,`missing licensed audio asset: ${asset}`);
}
for(const asset of ['music-exploration-spirit.mp3','music-combat-score.mp3','music-boss-xanthos.mp3']){const full=path.join(root,'assets/audio/premium',asset);assert.ok(existsSync(full)&&statSync(full).size>1000000,`missing full-length music track: ${asset}`)}
for(const id of ['abilityBar','navigationSignal','navigationSignalText','restartRunBtn','pauseSnapshot','pauseLoadoutBtn','loadoutScreen','loadoutContent','readabilityPresetBtn','cinematicPresetBtn','performancePresetBtn','damageNumbersSetting','telegraphSetting','hintsSetting','motionSetting','audioMixSetting','audioStatusText','testAudioBtn'])assert.ok(html.includes(`id="${id}"`),`missing QoL control: ${id}`);
for(const token of ['renderRunIntel','renderPauseSnapshot','applySettingsPreset','runObjective','SETTING_PRESETS'])assert.ok(game.includes(token),`missing run-intel or settings-profile token: ${token}`);

console.log('ORBIT 0.68.0 top-down runtime integration: PASS');
