import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),game=read('game.js'),visuals=read('visual-engine.js'),styles=read('styles.css'),desktop=read('desktop/main.cjs'),docs=read('README.md'),pkg=JSON.parse(read('package.json'));

assert.equal(pkg.version,'0.87.0');
assert.equal(pkg.dependencies.phaser,'3.90.0');
assert.equal(pkg.description,'Top-down survival game about the last human vessel in an alien-conquered universe.');
assert.match(pkg.scripts.screenshot,/--orbit-capture/,'runtime screenshot script is missing');
assert.match(pkg.scripts['screenshot:menu'],/--orbit-menu-capture/,'launch hangar screenshot script is missing');
assert.match(pkg.scripts['screenshot:steam'],/--orbit-steam-capture/,'Steam screenshot script is missing');
assert.match(pkg.scripts['release:check'],/verify-release\.mjs/,'release verification script is missing');
assert.ok(!pkg.dependencies.three,'inactive 3D engine must not ship as a runtime dependency');
assert.match(html,/<html lang="en">/,'document language metadata is not English');
assert.match(html,/last human vessel crossing an alien-conquered universe/,'runtime metadata is inaccurate');
assert.match(html,/vendor\/phaser\.min\.js[\s\S]*visual-engine\.js[\s\S]*game\.js/,'top-down renderer scripts are not active or ordered correctly');
assert.doesNotMatch(html,/game-3d\.mjs|styles-3d\.css/,'third-person build is still active');
assert.doesNotMatch(docs,/visual-direction-concept|ASSET_PROMPTS|ImageGen|OpenAI/,'documentation references non-runtime concept material');
assert.match(docs,/version 0\.87\.0 Last Ark runtime capture[\s\S]*captured from the active 0\.87\.0 Electron\/WebGL build/,'current runtime screenshot is not labeled accurately');
for(const token of ['--orbit-capture','--orbit-menu-capture','--orbit-steam-capture','orbit04-capture','waitForRenderer','capturePage','runtime-screenshot-v0.87.0.png','launch-hangar-v0.87.0.png','horizontalOverflow','image.isEmpty','setPermissionRequestHandler','requestSingleInstanceLock'])assert.ok(desktop.includes(token),`missing runtime capture or desktop safeguard: ${token}`);

const vendor=path.join(root,'vendor/phaser.min.js');
assert.ok(existsSync(vendor)&&statSync(vendor).size>500000,'offline Phaser runtime is missing');
const screenshot=path.join(root,'docs/runtime-screenshot-v0.87.0.png'),png=readFileSync(screenshot);
assert.ok(png.length>100000,'verified runtime screenshot is missing or empty');
assert.equal(png.readUInt32BE(16),1440,'runtime screenshot width must be 1440');assert.equal(png.readUInt32BE(20),810,'runtime screenshot height must be 810');
const menuScreenshot=path.join(root,'docs/launch-hangar-v0.87.0.png'),menuPng=readFileSync(menuScreenshot);
assert.ok(menuPng.length>100000,'verified launch hangar screenshot is missing or empty');
assert.equal(menuPng.readUInt32BE(16),1440,'launch hangar screenshot width must be 1440');assert.equal(menuPng.readUInt32BE(20),810,'launch hangar screenshot height must be 810');
for(const token of ['tryPhaseDash','dashCooldown','damageNumber','telegraphs','effectClarity','audioMix','MIXES','musicDuck','VOICE_COOLDOWNS','DUCK_LEVELS','rewardCue','SIGNAL RUSH','desiredBackground','licensed-sample-assets-v2','cinematicLayers','materialLayers','selectEnemyType','followWorldCamera','translateWorld','unlockSamples','played===false','testAudioOutput','WORLD_CELL_SIZE','generateWorldCell','collectWorldNode','openArchiveFragment','closeArchiveFragment','updateWorldGeneration','CHOIR SPORE','MOURNING FIELD','ARCHIVE_FRAGMENTS','LEGACY_ARCHIVE_ID_MAP','normalizeArchiveIds','discoveredArchives','deathFx','dampValue','THE CONQUEROR','ARK ARCHIVE','renderShipCanvas','renderFrameBrief','SYNERGY_REQUIREMENTS','renderBuildCompass','offerConnection','upgradePulse','processPendingLevel','salvageSweep','updatePriorityHud','NEW DRAW','XP TO NEXT SYSTEM','targetPriority','drawFreshOffers','togglePinnedOffer','updateEvolutionTracker','SIGNAL_FILTERS','cycleSignalFilter','recordUpgrade','handleWindowBlur','FIELD_DIRECTIVES','checkFieldDirective','directivesCompleted','cycleUnlockedOption','nextContract','cinematic-webgl-v1','antialiasGL:true','desynchronized:true','deltaHistory:20'])assert.ok(game.includes(token),`missing runtime integration token: ${token}`);
for(const name of ['Thomas Bernhard','Knut Hamsun','Stanisław Lem','Harry Haller','Hermann Hesse','William Faulkner','Fyodor Dostoevsky'])assert.ok(!game.includes(name),`archive data must not attribute original writing to ${name}`);
for(const token of ['dashEchoes','syncFloaters','settings.telegraphs','player-ship-v3','enemyTexture','fitSprite','syncEnemies','drawEnergyEffects','drawDangerReadability','dangerFx','drawWorldSites','worldNodes','smoothValue','smoothAngle','motionScale','easeOutBack','syncDeathFx','strokeFxLine','enginePulse','spawnScale','orbit-life-core','lifeCore','organicPhase','setupPremiumPipeline','updatePremiumPipeline','addColorMatrix','addBloom'])assert.ok(visuals.includes(token),`missing retained visual system: ${token}`);
assert.match(game,/player-last-ark-v1\.png[\s\S]*enemy-void-larva-v1\.png[\s\S]*enemy-ossuary-v1\.png[\s\S]*enemy-witness-v1\.png[\s\S]*boss-conquest-leviathan-v1\.png/,'transparent last-human and alien assets are not wired into the runtime');
assert.match(visuals,/orbit-glow[^\n]*setVisible\(false\)[\s\S]*drawEnergyEffects[\s\S]*this\.fx\.fillCircle/,'vector glow fallback is not active');
for(const token of ['abilityBar','ambientDrift','panelArrival','eventImpact','rushField','data-motion','intelLayout','settingsPresets','audioCheckRow','navigationSignal','archivePanel','rewardRibbon','hudMetric','directiveTracker','frameStage','frameLoadout','runOption','profileSummary','optionStepper','launchSummary','renderStatus'])assert.ok(styles.includes(token),`missing presentation token: ${token}`);

for(const asset of ['laserSmall_002.ogg','explosionCrunch_004.ogg','forceField_001.ogg','laserLarge_001.ogg','lowFrequency_explosion_001.ogg']){
  const full=path.join(root,'assets/audio/premium/kenney-sci-fi-sounds',asset);assert.ok(existsSync(full)&&statSync(full).size>7000,`missing licensed audio asset: ${asset}`);
}
for(const asset of ['music-last-human-dystopian-ambient.mp3','music-hostile-choir-dystopian-thriller.mp3','music-leviathan-blood-red-sky.mp3']){const full=path.join(root,'assets/audio/premium',asset);assert.ok(existsSync(full)&&statSync(full).size>1000000,`missing full-length music track: ${asset}`)}
for(const id of ['abilityBar','navigationSignal','navigationSignalLabel','navigationSignalText','prioritySignal','prioritySignalArrow','prioritySignalText','directiveTracker','directiveTrackerText','directiveTrackerReward','evolutionTracker','evolutionTrackerText','rewardRibbon','rewardRibbonTitle','archiveScreen','archiveQuote','archiveContinueBtn','frameStage','framePreview','frameName','frameRole','frameWeapon','frameTrait','frameRosterCount','restartRunBtn','pauseSnapshot','pauseLoadoutBtn','loadoutScreen','loadoutContent','buildCompass','offerPins','readabilityPresetBtn','cinematicPresetBtn','performancePresetBtn','damageNumbersSetting','telegraphSetting','hintsSetting','targetPrioritySetting','autoPauseSetting','motionSetting','effectClaritySetting','audioMixSetting','audioStatusText','testAudioBtn','difficultyPrev','difficultyNext','sectorPrev','sectorNext','contractPrev','contractNext','launchSummary','rendererStatusText'])assert.ok(html.includes(`id="${id}"`),`missing QoL control: ${id}`);
for(const token of ['renderRunIntel','renderPauseSnapshot','applySettingsPreset','runObjective','SETTING_PRESETS'])assert.ok(game.includes(token),`missing run-intel or settings-profile token: ${token}`);

await import(pathToFileURL(path.join(root,'visual-engine.js')).href);
const fx={fillStyle(){return this},fillCircle(){return this},lineStyle(){return this},strokeCircle(){return this},beginPath(){return this},moveTo(){return this},lineTo(){return this},strokePath(){return this}};
const renderer=Object.create(globalThis.OrbitVisualEngine.prototype);renderer.fx=fx;renderer.dangerFx=fx;renderer.time=1;renderer.motionScale=1;
assert.doesNotThrow(()=>renderer.syncDeathFx({deathFx:[{x:40,y:30,r:9,color:'#ff7893',life:.3,maxLife:.55,seed:.2}]},'HIGH',true),'destruction renderer must not reference a method-local line helper');
assert.doesNotThrow(()=>renderer.drawDangerReadability({p:{x:60,y:60},enemyBullets:[{x:80,y:70,r:3}],enemies:[{x:120,y:80,r:9,type:'sniper',shootT:.2,dead:false}]},{effectClarity:'HIGH',telegraphs:'ON'}),'danger readability layer must render projectiles and telegraphs');

console.log('ORBIT 0.87.0 studio interface and render pipeline: PASS');
