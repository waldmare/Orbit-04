const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const requiredAssets=[
  'assets/visuals/background-dead-universe-v1.png','assets/visuals/background-alien-veil-v1.png',
  'assets/visuals/player-last-ark-v1.png','assets/visuals/enemy-void-larva-v1.png','assets/visuals/enemy-ossuary-v1.png','assets/visuals/enemy-witness-v1.png','assets/visuals/boss-conquest-leviathan-v1.png',
  'assets/audio/professional/lentikula/pulse-a.wav','assets/audio/professional/lentikula/pulse-b.wav','assets/audio/professional/lentikula/rail.wav','assets/audio/professional/lentikula/flak.wav','assets/audio/professional/lentikula/rift.wav','assets/audio/professional/lentikula/hostile-heavy.wav','assets/audio/professional/obsydianx/ui-confirm.wav','assets/audio/professional/obsydianx/ui-reward.wav','assets/audio/professional/opengameart/mechanical-explosion.wav','assets/audio/professional/opengameart/low-explosion.wav','assets/audio/sub_bass.wav','assets/audio/engine_loop.wav',
  'assets/audio/premium/music-exploration-space-city.mp3','assets/audio/premium/music-exploration-spirit.mp3','assets/audio/premium/music-combat-synth-wave.mp3','assets/audio/premium/music-combat-score.mp3','assets/audio/premium/music-boss-cybershaman.flac','assets/audio/premium/music-boss-xanthos.mp3','assets/audio/premium/music-last-human-dystopian-ambient.mp3'
];
for(const asset of requiredAssets){const full=path.join(root,asset);if(!fs.existsSync(full)||fs.statSync(full).size<44)throw new Error(`missing engine asset: ${asset}`)}
if(!html.includes('visual-engine.js'))throw new Error('sprite renderer script missing from index.html');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
class ClassList{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(x,v){if(v===undefined){this.s.has(x)?this.s.delete(x):this.s.add(x)}else v?this.s.add(x):this.s.delete(x)}contains(x){return this.s.has(x)}}
class El{constructor(id=''){this.id=id;this.classList=new ClassList();this.style={setProperty(k,v){this[k]=String(v)}};this.dataset={};this.attributes={};this.children=[];this.textContent='';this._html='';this.disabled=false;this.onclick=null}set innerHTML(v){this._html=v;if(v==='')this.children=[];else if(this.id==='reliquarySlots')this.children=Array.from({length:(v.match(/class="reliquarySlot pending"/g)||[]).length},()=>new El())}get innerHTML(){return this._html}appendChild(x){this.children.push(x);return x}setAttribute(k,v){this.attributes[k]=String(v)}remove(){this.removed=true}addEventListener(){}setPointerCapture(){}focus(){}querySelector(sel){if(sel==='button'){if(!this._btn)this._btn=new El();return this._btn}return null}get offsetWidth(){return 960}}
const els=Object.fromEntries(ids.map(id=>[id,new El(id)]));

class G{clear(){return this}fillStyle(){return this}fillPoints(){return this}lineStyle(){return this}strokePoints(){return this}beginPath(){return this}moveTo(){return this}lineTo(){return this}strokePath(){return this}fillCircle(){return this}strokeCircle(){return this}strokeEllipse(){return this}fillRect(){return this}setPosition(){return this}setBlendMode(){return this}setScale(){return this}setDepth(){return this}setVisible(){return this}}
class Point{constructor(x,y){this.x=x;this.y=y}}

els.game.getContext=()=>({imageSmoothingEnabled:false,save(){},restore(){},fillRect(){},translate(){},rotate(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1});
const dataClose=[...html.matchAll(/data-close="([^"]+)"/g)].map(m=>{const e=new El();e.dataset.close=m[1];return e});
const document={getElementById:id=>els[id],querySelectorAll:q=>q==='[data-close]'?dataClose:[],createElement:()=>new El(),body:new El('body'),fullscreenElement:null,exitFullscreen(){}};
const store={};
const windowListeners={};
const ctx={console,document,windowListeners,G,Phaser:{Display:{Color:{HexStringToColor:()=>({color:0xffffff})}},Geom:{Point},BlendModes:{ADD:1},WEBGL:2,Scale:{NONE:0}},window:null,navigator:{userAgent:'node-test',getGamepads:()=>[]},location:{search:'?test=1'},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)},performance:{now:()=>1000},requestAnimationFrame:()=>{},setTimeout:(fn)=>{ /* suppress async visuals in smoke test */ return 1},clearTimeout:()=>{},confirm:()=>true,prompt:()=>null,alert:()=>{},open:()=>{},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),URLSearchParams,Math,JSON,Date,Array,Object,Set,Map,String,Number,Boolean,RegExp,Error,parseInt,parseFloat,isNaN,Infinity,NaN};
ctx.window=ctx;
ctx.addEventListener=(type,handler)=>{(windowListeners[type]??=[]).push(handler)};
vm.createContext(ctx);
const code=fs.readFileSync(path.join(root,'game.js'),'utf8');
vm.runInContext(code,ctx,{filename:'game.js'});
vm.runInContext(`
  if(document.body.dataset.orbitBoot!=='ok') throw new Error('boot flag missing');
  const migratedArchiveProfile=deepProfile({discoveredArchives:['bernhard_01','solaris_02']});if(!migratedArchiveProfile.discoveredArchives.includes('bridge_04a')||!migratedArchiveProfile.discoveredArchives.includes('signal_12b')) throw new Error('legacy archive IDs were not migrated');
  if(ARCHIVE_FRAGMENTS.some(entry=>/(bernhard|hamsun|solaris|haller|faulkner|dostoevsky)/i.test(entry.id+' '+entry.channel+' '+entry.note))) throw new Error('current archive records retain literary attribution');
  let rendererConfig=null;
  Phaser.Device={Features:{webGL:true}}; Phaser.WEBGL=2; Phaser.CANVAS=1;
  Phaser.Game=class{constructor(config){rendererConfig=config}};
  bootRenderer();
  if(rendererConfig?.type!==Phaser.WEBGL) throw new Error('renderer type must be explicit when using a custom canvas');
  if(!rendererConfig.render.antialiasGL||!rendererConfig.render.desynchronized||rendererConfig.fps.target!==120) throw new Error('premium renderer profile is incomplete');
  save.settings.audio='OFF';document.getElementById('difficultyPrev').onclick();if(save.difficulty!=='HARDLINE') throw new Error('previous difficulty control failed');document.getElementById('difficultyNext').onclick();if(save.difficulty!=='STANDARD') throw new Error('next difficulty control failed');document.getElementById('contractPrev').onclick();if(save.contract!=='FRAGILE') throw new Error('previous contract control failed');document.getElementById('contractNext').onclick();if(save.contract!=='NONE') throw new Error('next contract control failed');if(!document.getElementById('launchSummary').innerHTML.includes('WATCHKEEPER')||!document.getElementById('startBtn').innerHTML.includes('DEPLOY WATCHKEEPER')||!document.getElementById('startBtn').innerHTML.includes('ENTER')) throw new Error('deployment summary is incomplete');if(Number(document.getElementById('contentFrameCount').textContent)!==10||Number(document.getElementById('contentWeaponCount').textContent)!==11||Number(document.getElementById('contentEnemyCount').textContent)!==13||Number(document.getElementById('contentLinkCount').textContent)!==9||Number(document.getElementById('contentSectorCount').textContent)!==4)throw new Error('menu content proof does not match runtime data');save.difficulty='BLACKOUT';save.sector='NULL';save.contract='SWARM';if(!applyRecommendedSetup()||save.difficulty!=='STANDARD'||save.sector!=='AURORA'||save.contract!=='NONE')throw new Error('recommended first-run setup failed');save.briefingSeen=false;if(!previewPilotBriefing()||!document.getElementById('briefingScreen').classList.contains('show')||!dismissPilotBriefing()||document.getElementById('briefingScreen').classList.contains('show')||!save.briefingSeen)throw new Error('menu pilot guide preview failed');if(!document.getElementById('framePrevBtn').disabled||!document.getElementById('frameNextBtn').disabled)throw new Error('single-frame hangar navigation should be disabled');save.unlocked.push('bastion');if(!cycleUnlockedFrame(1)||save.selected!=='bastion')throw new Error('next-frame hangar shortcut failed');if(!cycleUnlockedFrame(-1)||save.selected!=='striker')throw new Error('previous-frame hangar shortcut failed');save.unlocked.pop();renderMenu();
  if(!document.getElementById('difficultyDesc').textContent.includes('BEST FIRST RUN')||!document.getElementById('sectorDesc').textContent.includes('STANDARD RESOURCES')||!document.getElementById('frameWeaponDesc').textContent.includes('RAPID FORWARD SHOTS'))throw new Error('main menu info boxes do not explain player outcomes');
  if(selectFieldDirective()!=='recovery') throw new Error('first directive rotation is incorrect');save.runs=1;if(selectFieldDirective()!=='transit') throw new Error('second directive rotation is incorrect');save.runs=2;if(selectFieldDirective()!=='attrition') throw new Error('third directive rotation is incorrect');save.runs=0;startRun();
  save.briefingSeen=false;if(!openPilotBriefing()||!state.paused||!document.getElementById('briefingScreen').classList.contains('show'))throw new Error('first-deployment briefing did not suspend the run');if(!dismissPilotBriefing()||state.paused||!save.briefingSeen||document.getElementById('briefingScreen').classList.contains('show'))throw new Error('first-deployment briefing did not persist completion');
  const exitProbe=desktopExitState();if(!exitProbe.active||exitProbe.frame!=='WATCHKEEPER')throw new Error('desktop exit state did not identify the active run');document.getElementById('briefingResetBtn').onclick();if(save.briefingSeen)throw new Error('briefing replay control did not arm the next run');save.briefingSeen=true;
  state.p.iFrames=9999;
  const openingPopulationCap=enemyPopulationCap(false,false),savedPopulation=state.enemies;if(openingPopulationCap<98||openingPopulationCap>110||openingPopulationCap>=MAX_ENEMIES)throw new Error('opening encounter population budget is invalid');state.enemies=Array.from({length:openingPopulationCap},()=>({dead:false,boss:false}));if(spawnEnemyGroup(6).length!==0)throw new Error('encounter director exceeded its active population budget');state.enemies=[];state.time=30;state.spawnT=0;const densityRandom=Math.random;Math.random=()=>0;spawnWave(.1);Math.random=densityRandom;if(state.enemies.length!==2)throw new Error('opening encounter cadence did not admit an early hostile pair');state.enemies=savedPopulation;state.time=0;state.spawnT=0;
  updateDirectiveHud();if(state.directiveId!=='recovery'||document.getElementById('directiveTracker').classList.contains('hidden')||!document.getElementById('directiveTrackerText').textContent.includes('RECOVERY ORDER')) throw new Error('field directive did not initialize');
  state.time=195;updateHudVisuals();if(document.getElementById('bossBar').classList.contains('hidden')||!document.getElementById('bossBar').classList.contains('incoming')||!document.getElementById('bossLabel').textContent.includes('15.0 SEC')||parseFloat(document.getElementById('bossFill').style.width)!==25)throw new Error('boss approach countdown is missing or inaccurate');state.time=0;updateHudVisuals();if(!document.getElementById('bossBar').classList.contains('hidden')||document.getElementById('bossBar').classList.contains('incoming'))throw new Error('boss approach countdown did not clear outside its warning window');
  if(Object.values(ENEMY_META).some(enemy=>!enemy.quick))throw new Error('hostile tactical descriptions are incomplete');save.briefedEnemies=[];state.enemyIntelQueue=[];state.enemyIntelShown=0;state.nextEnemyIntel=0;const intelTarget=spawnEnemy('warden',false,{x:state.p.x+280,y:state.p.y});state.time=1;if(!state.enemyIntelQueue.includes('warden')||!updateEnemyIntel())throw new Error('first-contact hostile briefing did not trigger');const intelToast=toastStack.children.at(-1);if(!intelToast||!intelToast.children[0].textContent.includes('PALE WARDEN')||!intelToast.children[1].textContent.includes('DESTROY FIRST')||!save.briefedEnemies.includes('warden'))throw new Error('hostile briefing did not explain the counterplay');intelTarget.dead=true;state.time=0;codexTab='enemies';renderCodex();if(!document.getElementById('codexContent').children.some(card=>card.innerHTML.includes('PROTECTS NEARBY HOSTILES')))throw new Error('enemy Codex does not preserve tactical counterplay');
  const nearTarget=spawnEnemy('scout',false,{x:state.p.x+40,y:state.p.y}),weakTarget=spawnEnemy('scout',false,{x:state.p.x+170,y:state.p.y}),eliteTarget=spawnEnemy('tank',true,{x:state.p.x+250,y:state.p.y}),targetSet=enemy=>enemy===nearTarget||enemy===weakTarget||enemy===eliteTarget;weakTarget.hp=weakTarget.maxHp*.05;
  const weaponFxBefore=state.weaponFx.length;fireProjectile(state.p.x,state.p.y,nearTarget,420,10,{weaponId:'rail',color:'#d8c68b'});if(state.weaponFx.length!==weaponFxBefore+1||state.p.weaponKick<=0||state.p.weaponAngle!==0||state.bullets.at(-1).maxLife!==state.bullets.at(-1).life) throw new Error('weapon firing presentation event failed');
  const impactFxBefore=state.impactFx.length;emitImpactFx(nearTarget.x,nearTarget.y,420,0,'rail','#d8c68b',true,18);if(state.impactFx.length!==impactFxBefore+1||!state.impactFx.at(-1).finalHit||state.impactFx.at(-1).maxLife<=0) throw new Error('directional final-impact event failed');
  save.settings.targetPriority='NEAREST'; if(nearest(state.p,targetSet)!==nearTarget) throw new Error('nearest targeting priority failed');
  save.settings.targetPriority='LOW HULL'; if(nearest(state.p,targetSet)!==weakTarget) throw new Error('low-hull targeting priority failed');
  save.settings.targetPriority='ELITES FIRST'; if(nearest(state.p,targetSet)!==eliteTarget) throw new Error('elite targeting priority failed');
  save.settings.targetPriority='NEAREST'; nearTarget.dead=weakTarget.dead=eliteTarget.dead=true;
  keys.w=true;keys.tab=true;mouse.active=true;touch.active=true;save.settings.autoPause='OFF';handleWindowBlur();if(state.paused) throw new Error('focus-loss pause ignored the disabled setting');if(keys.w||keys.tab||mouse.active||touch.active||state.p.moving)throw new Error('focus-loss input reset failed');const altTabEvent={key:'Tab',altKey:true,metaKey:false,preventDefault(){this.prevented=true},target:{}};windowListeners.keydown[0](altTabEvent);if(keys.tab||document.getElementById('loadoutScreen').classList.contains('show'))throw new Error('Alt+Tab was intercepted as a game shortcut');save.settings.autoPause='ON';handleWindowBlur();if(!state.paused) throw new Error('focus-loss pause failed');handleWindowFocus();if(keys.w||keys.tab||state.last!==performance.now())throw new Error('focus-return input recovery failed');pause(false);handleGamepadConnected({gamepad:{id:'Test Controller'}});handleGamepadDisconnected();if(!state.paused||!document.getElementById('pauseScreen').classList.contains('show'))throw new Error('controller disconnect did not protect the active run');if(!resumeRun()||state.paused)throw new Error('safe resume path failed in deterministic mode');
  if(selectEnemyType(30,.50)!=='scout'||selectEnemyType(30,.10)!=='tank'||selectEnemyType(70,.70)!=='tank') throw new Error('early heavy-ship encounter mix is incorrect');if(selectEnemyType(140,.53)!=='moth'||selectEnemyType(260,.055)!=='anchor')throw new Error('new hostile roles are absent from encounter selection');const moth=spawnEnemy('moth',false,{x:state.p.x+180,y:state.p.y}),anchor=spawnEnemy('anchor',false,{x:state.p.x+220,y:state.p.y});if(moth.speed<=anchor.speed||moth.r>=anchor.r||!ENEMY_META.moth||!ENEMY_META.anchor)throw new Error('new hostile roles do not have distinct movement profiles');moth.dead=anchor.dead=true;
  keys.d=true; const dashStart=state.p.x; state.enemyBullets.push({x:state.p.x+82,y:state.p.y,r:3,life:2,damage:1,grazed:false,vx:0,vy:0});
  if(!tryPhaseDash()||state.p.x<=dashStart||state.p.dashCooldown<=0||state.enemyBullets[0].life>0) throw new Error('PHASE DASH failed');
  const dashEnd=state.p.x; if(tryPhaseDash()||state.p.x!==dashEnd) throw new Error('PHASE DASH cooldown failed'); keys.d=false;
  const travelEnemy=spawnEnemy('scout',false,{x:state.p.x+100,y:state.p.y}); state.p.x=CAMERA_SAFE.right+25; const relativeX=travelEnemy.x-state.p.x,worldBefore=state.worldX,shift=followWorldCamera();
  if(shift.x>=0||Math.abs(state.p.x-CAMERA_SAFE.right)>.001||Math.abs((travelEnemy.x-state.p.x)-relativeX)>.001||state.worldX===worldBefore) throw new Error('continuous world camera failed');
  if(!Number.isFinite(state.worldX)||!Number.isFinite(state.worldY)) throw new Error('world travel coordinates are invalid');
  if(state.generatedCells.size<20||!state.worldSites.length||!state.worldNodes.length) throw new Error('procedural world did not initialize');
  if(worldNodeType(.99)!=='fracture'||worldNodeType(.50)==='fracture') throw new Error('rare Time Fracture distribution failed');generateWorldCell(-8,8);if(state.worldNodes.some(node=>node.type==='archive')) throw new Error('retired quote pickup still appears in the procedural field');
  const cellsBefore=state.generatedCells.size; state.worldX+=WORLD_CELL_SIZE*3; updateWorldGeneration(); if(state.generatedCells.size<=cellsBefore) throw new Error('procedural world did not expand beyond the starting view');
  state.worldX=worldBefore; updateWorldGeneration(); updateNavigationHud();const visibleSignal=nearestWorldNode();if(document.getElementById('navigationSignal').classList.contains('hidden')||!visibleSignal||!document.getElementById('navigationSignalEffect').textContent.includes(WORLD_NODE_TYPES[visibleSignal.node.type].tag)) throw new Error('exploration navigation signal is unclear or hidden');
  const fractureSignal={type:'fracture',x:state.p.x+120,y:state.p.y,wx:state.worldX+state.p.x+120,wy:state.worldY+state.p.y,r:19,color:'#8e7dff',disposition:'rare',collected:false,active:true,pulse:0};state.worldNodes.push(fractureSignal);state.signalFilter='TIME';const fractureTarget=nearestWorldNode();if(!fractureTarget||fractureTarget.node.type!=='fracture') throw new Error('Time Fracture scanner filter failed');state.signalFilter='ALL';if(!cycleSignalFilter()||state.signalFilter!=='SUPPORT') throw new Error('signal scanner cycling failed');const supportTarget=nearestWorldNode();if(supportTarget&&!['repair','flux','salvage'].includes(supportTarget.node.type)) throw new Error('support scanner filter failed');state.signalFilter='ALL';updateNavigationHud();
  const offscreenPriority=spawnEnemy('gunner',true,{x:-140,y:state.p.y}); offscreenPriority.nemesis=true; offscreenPriority.nemesisName='ECHO HUNTER'; updatePriorityHud();
  if(document.getElementById('prioritySignal').classList.contains('hidden')||!document.getElementById('prioritySignalText').textContent.includes('ECHO HUNTER')) throw new Error('off-screen priority compass failed');
  offscreenPriority.dead=true; updatePriorityHud(); if(!document.getElementById('prioritySignal').classList.contains('hidden')) throw new Error('priority compass did not clear');
  fractureSignal.collected=true;state.p.magnet=180;const magnetBoon={type:'salvage',wx:state.worldX+state.p.x+120,wy:state.worldY+state.p.y,x:state.p.x+120,y:state.p.y,r:15,color:'#8de9ff',disposition:'boon',collected:false,active:true},magnetRisk={type:'relic',wx:state.worldX+state.p.x+120,wy:state.worldY+state.p.y,x:state.p.x+120,y:state.p.y,r:15,color:'#ff6177',disposition:'risk',collected:false,active:true};state.worldNodes.push(magnetBoon,magnetRisk);updateWorldGeneration();if(!magnetBoon.collected||magnetRisk.collected)throw new Error('pickup radius did not collect safe signals or removed risk agency');state.p.magnet=state.p.baseMagnet;
  state.p.hp=state.p.maxHp*.5; const hpBefore=state.p.hp; if(!collectWorldNode({type:'repair',x:state.p.x,y:state.p.y,color:'#79f0ca',disposition:'boon',collected:false})||state.p.hp<=hpBefore) throw new Error('repair relay failed');
  state.fieldBoostUntil=0; const powerBefore=weaponPower('pulse',state.weapons.pulse); collectWorldNode({type:'flux',x:state.p.x,y:state.p.y,color:'#8de9ff',disposition:'boon',collected:false}); if(weaponPower('pulse',state.weapons.pulse)<=powerBefore) throw new Error('flux amplifier failed');
  collectWorldNode({type:'jammer',x:state.p.x,y:state.p.y,color:'#ff6177',disposition:'hazard',collected:false}); if(state.interferenceUntil<=state.time||state.hazardFinds!==1) throw new Error('world hazard failed');const directivesBefore=save.stats.directivesCompleted,rerollsBeforeDirective=state.rerolls;if(!checkFieldDirective()||!state.directiveComplete||save.stats.directivesCompleted!==directivesBefore+1||state.rerolls!==rerollsBeforeDirective+1) throw new Error('field directive completion failed');updateDirectiveHud();if(!document.getElementById('directiveTracker').classList.contains('hidden')||!document.getElementById('rewardRibbonTitle').textContent.includes('FIELD DIRECTIVE')) throw new Error('field directive completion feedback failed');
  const fracturesBefore=save.stats.timeFractures;collectWorldNode({type:'fracture',x:state.p.x,y:state.p.y,color:'#8e7dff',disposition:'rare',collected:false});if(state.timeFractureRemaining<8.9||state.timeFractures!==1||save.stats.timeFractures!==fracturesBefore+1||state.paused) throw new Error('Time Fracture activation failed');
  state.enemies=[];state.bullets=[];state.interferenceUntil=0;state.p.x=W/2;state.p.y=H/2;const timeBefore=state.time,moveBefore=state.p.x;keys.d=true;update(.1);keys.d=false;if(Math.abs((state.time-timeBefore)-.028)>.003||state.p.x-moveBefore<state.p.speed*.09) throw new Error('Time Fracture did not preserve player thrust while slowing the world');updateHudVisuals();if(document.getElementById('timeFractureHud').classList.contains('hidden')||!document.getElementById('timeFractureTime').textContent.includes('SEC')) throw new Error('Time Fracture HUD feedback failed');
  const first=spawnEnemy('scout',false,{x:state.p.x+80,y:state.p.y}),second=spawnEnemy('scout',false,{x:state.p.x+160,y:state.p.y});first.speed=second.speed=0;const testBullet={x:first.x,y:first.y,vx:0,vy:0,r:3,life:2,maxLife:2,damage:5,pierce:1,hitTargets:new Set(),homing:0,blast:0,color:'#fff',weaponId:'rail'};state.bullets=[testBullet];update(.001);const firstAfter=first.hp;testBullet.x=second.x;testBullet.y=second.y;update(.001);if(first.hp!==firstAfter||second.hp>=second.maxHp||testBullet.life>0) throw new Error('piercing projectile did not advance to a new target exactly once');
  codexTab='discoveries';renderCodex();if(document.getElementById('codexContent').children.some(card=>card.innerHTML.includes('ARK ARCHIVE'))) throw new Error('retired quote records remain in the active Codex');
  if(Object.keys(ENGINE_ASSETS.backgrounds).length!==6) throw new Error('dynamic background plates missing');
  state.time=83; if(desiredBackground()!=='pulsar') throw new Error('background director did not advance'); state.time=0;
  save.settings.uiScale='XXL'; save.settings.contrast='HIGH'; renderSettings();
  if(document.getElementById('wrap').dataset.uiScale!=='XXL'||document.getElementById('wrap').dataset.contrast!=='HIGH') throw new Error('display settings were not applied');
  if(setVolumeSetting('sfxVolume',83)!==85||save.settings.sfxVolume!=='85%'||document.getElementById('sfxVolumeSlider').value!=='85'||document.getElementById('sfxVolumeSetting').textContent!=='85%')throw new Error('continuous SFX volume control failed');save.settings.musicVolume='70%';if(nudgeVolume('musicVolume',-1)!==65||save.settings.musicVolume!=='65%'||document.getElementById('musicVolumeSlider').value!=='65')throw new Error('music volume step control failed');if(setVolumeSetting('musicVolume','OFF')!==0||save.settings.musicVolume!=='0%')throw new Error('legacy muted music volume did not normalize');setVolumeSetting('sfxVolume',100);setVolumeSetting('musicVolume',70);
  state.xp=state.xpNeed*.8; updateHudVisuals();
  if(!document.getElementById('xpbar').classList.contains('imminent')||!document.getElementById('xptext').textContent.includes('XP TO NEXT SYSTEM')||document.getElementById('xpLevelValue').textContent!==state.level||!document.getElementById('xpNextValue').textContent.includes('XP')) throw new Error('level anticipation feedback failed');
  state.p.hp=state.p.maxHp*.42;updateHudVisuals();if(document.getElementById('shipStatus').classList.contains('hidden')||document.getElementById('shipStatus').dataset.state!=='damaged'||!document.getElementById('shipHullValue').textContent.includes('/')||parseFloat(document.getElementById('shipHullFill').style.width)<41)throw new Error('player hull HUD failed');signalDamageDirection({x:state.p.x+40,y:state.p.y});if(!document.getElementById('damageDirection').classList.contains('show')||!document.getElementById('damageDirection').style['--hit-angle'])throw new Error('damage bearing feedback failed');state.p.hp=state.p.maxHp;
  const pulseLevel=state.weapons.pulse.level,overclockLevel=state.passives.overclock||0;state.weapons.pulse.level=4;state.passives.overclock=2;state.rush=0;updateEvolutionTracker();
  if(document.getElementById('evolutionTracker').classList.contains('hidden')||!document.getElementById('evolutionTrackerText').textContent.includes('4/6')||!document.getElementById('evolutionTrackerText').textContent.includes('2/4')) throw new Error('evolution tracker failed');
  state.weapons.pulse.level=pulseLevel;state.passives.overclock=overclockLevel;
  state.xp=0;
  if(!document.getElementById('audioStatusText').textContent.includes('MUTED IN GAME')) throw new Error('audio status did not report disabled output');
  let fallbackStarts=0,sampleAttempts=0;const musicRates={}; window.AudioContext=class{constructor(){this.state='running';this.sampleRate=8000;this.currentTime=0;this.destination={}}createGain(){return{gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}createOscillator(){return{frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){fallbackStarts++},stop(){}}}createBuffer(){return{getChannelData:()=>new Float32Array(800)}}createBufferSource(){return{connect(){},start(){},stop(){}}}resume(){return Promise.resolve()}};
  AUDIO.attach({sound:{locked:false,pauseOnBlur:true,context:{state:'running'},sounds:[],play(){sampleAttempts++;return false},add(key){return{isPlaying:false,isPaused:false,play(){this.isPlaying=true;return true},stop(){this.isPlaying=false},pause(){this.isPlaying=false;this.isPaused=true},resume(){this.isPlaying=true;this.isPaused=false},setRate(value){musicRates[key]=value},setVolume(){}}}},cache:{audio:{exists:()=>true}}});
  save.settings.audio='ON';AUDIO.music(state.time,{fracture:true,time:state.time});if(!musicRates['audio-music_fracture']||musicRates['audio-music_fracture']>.65||Object.values(musicRates).some(rate=>rate>.65)) throw new Error('Time Fracture did not slow the loaded soundtrack');AUDIO.music(58,{time:58,threat:2});AUDIO.music(116,{time:116,threat:3,drive:1});const musicDirector=AUDIO.status();if(musicDirector.musicPassage!==2||musicDirector.musicRotationCount<3)throw new Error('soundtrack passage rotation did not advance across the run');AUDIO.sfx('enemyShot'); const gatedSampleCount=sampleAttempts; AUDIO.sfx('enemyShot'); if(sampleAttempts!==gatedSampleCount) throw new Error('repetitive audio voice limiting failed');AUDIO.sfx('pulse');const weaponGroupCount=sampleAttempts;AUDIO.sfx('drone');if(sampleAttempts!==weaponGroupCount)throw new Error('weapon bus did not suppress same-frame routine clutter');AUDIO.sfx('rail');if(sampleAttempts<=weaponGroupCount)throw new Error('priority weapon cue was incorrectly suppressed');
  testAudioOutput(); if(save.settings.audio!=='ON'||sampleAttempts===0||fallbackStarts===0||!document.getElementById('audioStatusText').textContent.includes('OUTPUT ACTIVE')) throw new Error('audio output recovery failed'); save.settings.audio='OFF';
  if(!applySettingsPreset('READABILITY')||save.settings.enemyHp!=='ALL'||save.settings.motion!=='REDUCED'||save.settings.uiScale!=='XXL'||save.settings.effectClarity!=='HIGH') throw new Error('readability profile was not applied');
  state.weaponDamage.pulse=120; state.damageDealt=120;
  if(!recordUpgrade('CALIBRATION TEST','SYSTEM','LV 1 → LV 2')) throw new Error('install history rejected a valid upgrade');
  if(!renderRunIntel()||!document.getElementById('loadoutContent').innerHTML.includes('LAST SIGNAL')||!document.getElementById('loadoutContent').innerHTML.includes('CALIBRATION TEST')||!document.getElementById('loadoutContent').innerHTML.includes('INSTALL LOG')) throw new Error('run intel did not render the active build and install history');
  state.choosing=true;state.choiceMode='level';renderOffers();
  if(!document.getElementById('buildCompass').innerHTML.includes('NEAREST BREAKPOINT')) throw new Error('build compass did not expose the nearest evolution');
  const upgradeCards=document.getElementById('choices').children;if(upgradeCards.some(card=>card.innerHTML.includes('class="impact"')||((card.innerHTML.match(/class="desc">([^<]*)/)||[])[1]||'').length>72)) throw new Error('upgrade cards did not keep visible copy concise');
  if(!upgradeCards.every(card=>card.dataset.tone&&card.innerHTML.includes('choiceGlyph')&&card.innerHTML.includes('choiceBenefit')&&card.innerHTML.includes('choiceAction')&&card.innerHTML.includes('YOU GET'))) throw new Error('guided semantic upgrade cards are incomplete');
  if(!upgradeCards.every(card=>card.title.includes('IMPACT ·'))||state.currentOffers.some((offer,index)=>offerConnection(offer)&&!upgradeCards[index].title.includes(offerConnection(offer)))) throw new Error('upgrade cards did not preserve full scoped impact and build connection details');
  if(state.currentOffers.some(offer=>offer.lvl==='LV 0 → 1')||!state.currentOffers.filter(offer=>offer.key.startsWith('p:')&&(state.passives[offer.passiveId]||0)===0).every(offer=>offer.lvl==='NEW MODULE'))throw new Error('first-install upgrade labels remain technical or ambiguous');const rerollsBeforeSignal=state.rerolls,signalRandom=Math.random;Math.random=()=>.01;document.getElementById('signalDrawBtn').onclick();Math.random=signalRandom;if(state.rerolls!==rerollsBeforeSignal-1||!state.currentOffers.some(offer=>offer.signalTier==='RESONANT')||!document.getElementById('rerollInfo').textContent.includes('RESONANT DRAW')||!document.getElementById('choices').children.some(card=>card.dataset.signal==='resonant'&&card.innerHTML.includes('RESONANT BONUS')))throw new Error('transparent Resonance Draw result failed');
  const pinnedOffer=state.currentOffers[0];if(!togglePinnedOffer(pinnedOffer.key)||state.pinnedOfferKey!==pinnedOffer.key) throw new Error('upgrade pin control failed');
  const previousDraw=state.currentOffers.map(offer=>offer.key),previousUnpinned=previousDraw.filter(key=>key!==pinnedOffer.key).sort().join('|'),originalRandom=Math.random;Math.random=()=>0;renderOffers(previousDraw,pinnedOffer);Math.random=originalRandom;
  if(!state.currentOffers.some(offer=>offer.key===pinnedOffer.key)||!document.getElementById('offerPins').children.some(button=>button.className.includes('selected'))) throw new Error('pinned offer did not survive reroll');
  if(state.currentOffers.filter(offer=>offer.key!==pinnedOffer.key).map(offer=>offer.key).sort().join('|')===previousUnpinned) throw new Error('reroll protection returned identical unpinned cards');
  state.choosing=false;state.choiceMode='';state.pinnedOfferKey='';
  pause(true);
  if(!state.paused||!document.getElementById('pauseScreen').classList.contains('show')) throw new Error('pause screen did not open');
  if(!document.getElementById('pauseSnapshot').innerHTML.includes('NEXT OBJECTIVE')) throw new Error('pause snapshot did not render');
  if(!openRunConfirmation('abort')||!document.getElementById('confirmScreen').classList.contains('show')||!document.getElementById('confirmConsequences').innerHTML.includes('BANKED')) throw new Error('safe abort confirmation failed');
  if(!closeRunConfirmation()||document.getElementById('confirmScreen').classList.contains('show')) throw new Error('run confirmation did not close');
  if(!openRunConfirmation('restart')||!document.getElementById('confirmConsequences').innerHTML.includes('DISCARDED')||!document.getElementById('confirmAcceptBtn').textContent.includes('RESTART')) throw new Error('restart consequence summary failed');
  closeRunConfirmation();
  if(!openRunIntel()||!document.getElementById('loadoutScreen').classList.contains('show')) throw new Error('run intel did not open');
  closeRunIntel();
  if(document.getElementById('loadoutScreen').classList.contains('show')) throw new Error('run intel did not close');
  resumeRun();
  if(state.paused||document.getElementById('pauseScreen').classList.contains('show')) throw new Error('run did not resume');
  if(save.settings.mouse!=='HOLD') throw new Error('mouse default setting mismatch');
  bgG=new G(); nebulaG=new G(); glowG=new G(); worldG=new G(); overlayG=new G(); engineReady=true; draw();
  state.chain=14; state.chainTimer=1;
  const rushTarget=spawnEnemy('scout',false,{x:520,y:260}); killEnemy(rushTarget);
  if(state.rush<=0||state.rushActivations!==1||save.stats.signalRushes!==1) throw new Error('SIGNAL RUSH did not activate');
  if(!document.getElementById('rewardRibbon').classList.contains('show')||!document.getElementById('rewardRibbonTitle').textContent.includes('SIGNAL RUSH')) throw new Error('reward milestone ribbon failed');
  if(!state.deathFx.length||state.deathFx[0].maxLife<=0) throw new Error('persistent destruction animation was not created');
  state.hitStop=0;const destructionLife=state.deathFx[0].life; update(.05); if(state.deathFx[0].life>=destructionLife) throw new Error('destruction animation did not advance');
  spawnBoss(1); const sweepBoss=state.enemies.find(enemy=>enemy.boss&&!enemy.dead),installCount=state.upgradeHistory.length; killEnemy(sweepBoss); if(state.salvageSweep<=0) throw new Error('boss salvage sweep did not activate');
  const bossReliquary=state.caches.find(cache=>cache.rarity==='RELIQUARY');if(!bossReliquary) throw new Error('boss did not emit an Ark Reliquary');openCache(bossReliquary);
  if(!bossReliquary.dead||state.reliquariesOpened!==1||state.reliquaryOpen||state.ceremony||state.paused||state.upgradeHistory.length<installCount+2) throw new Error('Ark Reliquary reveal did not grant and resume correctly');state.hitStop=0;
  draw();
  if(document.getElementById('rushMeter').classList.contains('hidden')) throw new Error('SIGNAL RUSH HUD is hidden');
  state.p.x=100; state.p.y=100; mouse.active=true; mouse.inside=true; mouse.x=200; mouse.y=100;
  const mouseMove=moveInput(); if(mouseMove.dx<=0) throw new Error('mouse steering input failed');
  mouse.active=false;
  for(const id of Object.keys(WEAPON_META)){ if(!state.weapons[id]) addWeapon(id); state.weapons[id].level=6; }
  for(let i=0;i<10;i++) spawnEnemy(i%2?'charger':'scout',false,{x:500+i*8,y:240+i*6});
  updateWeapons(2);
  for(let i=0;i<120;i++) update(1/60);
  if(!state || state.mode!=='run') throw new Error('run did not remain active');
  if(Object.keys(state.weapons).length!==11) throw new Error('weapon system count mismatch');
  gainXp(100);
  if(!state.choosing) throw new Error('level-up screen did not open');
  selectOffer(state.currentOffers[0]);
  if(!state.choosing) throw new Error('pending level reward was not queued');
  let pendingPicks=0;while(state.choosing&&pendingPicks++<12)selectOffer(state.currentOffers[0]);
  if(state.choosing||state.xp>=state.xpNeed||pendingPicks<2) throw new Error('multi-level reward queue did not drain');
  renderResearch(); renderAchievements(); renderCodex(); renderSettings();
  save.credits=321; persist(false);
  save.credits=654; persist(false);
  localStorage.setItem(SAVE_KEY,'{"invalid":');
  const recovered=loadSave();
  if(recovered.credits!==321||saveRecoverySource!=='backup') throw new Error('save backup recovery failed');
  if(JSON.parse(localStorage.getItem(SAVE_KEY)).credits!==321) throw new Error('recovered save was not promoted');
  save=recovered;
`,ctx);
console.log('ORBIT smoke test: PASS');

vm.runInContext(`
  toMenu();
  save.settings.audio='OFF'; save.difficulty='HARDLINE'; startRun();
  state.p.iFrames=9999;
  state.bossStage=3; spawnBoss(3);
  const finalBoss=state.enemies.find(e=>e.boss&&e.bossStage===3);
  damageEnemy(finalBoss, 999999, false, 'pulse');
  if(!state.gameOver || !state.victory) throw new Error('victory flow failed');
  if(save.stats.hardlineClears<1) throw new Error('hardline clear not recorded');
  if(!save.achievements.includes('hardline_clear')) throw new Error('hardline achievement missing');
`,ctx);
console.log('ORBIT victory test: PASS');

vm.runInContext(`
  toMenu();save.settings.audio='OFF';save.difficulty='STANDARD';save.sector='AURORA';save.contract='NONE';save.credits=500;const frameId=save.selected,base={runs:save.runs,kills:save.totalKills,credits:save.credits,damage:save.stats.totalDamage,taken:save.stats.damageTaken,time:save.stats.playTime,caches:save.stats.caches,distance:save.stats.distanceTraveled,mastery:save.shipMastery[frameId]||0};startRun();
  state.kills=10;state.runCredits=20;state.damageDealt=100;state.damageTaken=10;state.time=60;state.cachesOpened=1;state.distanceTraveled=1000;finishRun(false);
  if(document.getElementById('reviveBtn').disabled)throw new Error('restore should be available for accounting regression');document.getElementById('reviveBtn').onclick();if(state.gameOver||!state.revived)throw new Error('restore did not resume the run');
  state.kills=15;state.runCredits=25;state.damageDealt=140;state.damageTaken=14;state.time=90;state.cachesOpened=2;state.distanceTraveled=1600;finishRun(false);
  if(save.runs!==base.runs+1||save.totalKills!==base.kills+15||save.credits!==base.credits-120+25||save.stats.totalDamage!==base.damage+140||save.stats.damageTaken!==base.taken+14||save.stats.playTime!==base.time+90||save.stats.caches!==base.caches+2||save.stats.distanceTraveled!==base.distance+1600||(save.shipMastery[frameId]||0)!==base.mastery+15)throw new Error('restored run telemetry was counted more than once');
  if(state.newUnlocks.filter(item=>item.startsWith(SHIPS[frameId].name+' MASTERY +')).length!==1)throw new Error('restored run mastery summary was duplicated');
`,ctx);
console.log('ORBIT restore accounting test: PASS');


vm.runInContext(`
  toMenu();
  if(Object.keys(CONTRACTS).length < 5) throw new Error('contract content missing');
  if(Object.keys(ARTIFACTS).length < 5) throw new Error('artifact content missing');
  if(Object.keys(SYNERGIES).length < 6) throw new Error('synergy content missing');
  save.settings.audio='OFF'; save.difficulty='STANDARD'; save.contract='NONE'; startRun();
  state.p.iFrames=9999;
  spawnBoss(1);
  const phaseBoss=state.enemies.find(e=>e.boss);
  phaseBoss.hp=phaseBoss.maxHp*.69; updateBossPhase(phaseBoss);
  if(phaseBoss.phase!==2) throw new Error('boss phase 2 transition failed');
  phaseBoss.hp=phaseBoss.maxHp*.34; updateBossPhase(phaseBoss);
  if(phaseBoss.phase!==3) throw new Error('boss phase 3 transition failed');
  const hostile=spawnEnemy('scout',true,{x:600,y:300});
  convertEnemy(hostile);
  if(!state.allies.length) throw new Error('IFF conversion ally missing');
  state.weapons.missile={level:3,evolved:false}; state.weapons.drone={level:3,evolved:false};
  checkSynergies();
  if(!state.synergies.hunterWing) throw new Error('synergy activation failed');
`,ctx);
console.log('ORBIT systems test: PASS');


vm.runInContext(`
  toMenu();
  if(Object.keys(SECTORS).length < 4) throw new Error('sector content missing');
  if(Object.keys(DOCTRINES).length < 6) throw new Error('doctrine content missing');
  if(Object.keys(OPERATIONS).length < 25) throw new Error('operation content missing');
  if(Object.keys(WEAPON_META).length < 11) throw new Error('expanded weapon content missing');
  if(Object.keys(SYNERGIES).length < 9) throw new Error('expanded synergy content missing');
  save.settings.audio='OFF'; save.sector='AURORA'; startRun(); state.p.iFrames=9999;
  state.level=10; openDoctrine(false);
  const doctrineId=Object.keys(DOCTRINES)[0]; selectDoctrine(doctrineId);
  if(!state.doctrines[doctrineId]) throw new Error('doctrine selection failed');
  spawnNemesis();
  const nemesis=state.enemies.find(e=>e.nemesis); if(!nemesis) throw new Error('nemesis spawn failed');
  damageEnemy(nemesis,999999,false,'pulse');
  if(save.stats.nemeses<1) throw new Error('nemesis kill not recorded');
  const paradox=state.caches.find(c=>c.rarity==='PARADOX'); if(!paradox) throw new Error('paradox cache missing');
  openCache(paradox);
  const evolved=state.weapons[state.p.frame==='striker'?'pulse':SHIPS[state.p.frame].weapon]; evolved.level=6; evolved.evolved=true; evolved.overcharge=2; const pow2=weaponPower('pulse',evolved); evolved.overcharge=3; if(weaponPower('pulse',evolved)<=pow2) throw new Error('overcharge scaling failed');
`,ctx);
console.log('ORBIT commercial systems test: PASS');

vm.runInContext(`
  toMenu(); save.settings.audio='OFF'; save.difficulty='STANDARD'; save.sector='AURORA'; startRun(); state.p.iFrames=9999;
  state.clearedBase=true; state.endless=true; state.ascension=1; state.nextEndlessBoss=0; state.time=900;
  spawnWave(1);
  const ab=state.enemies.find(e=>e.boss&&e.bossStage>=4); if(!ab) throw new Error('ascension boss spawn failed');
  damageEnemy(ab,999999,false,'pulse');
  if(state.ascension<2) throw new Error('ascension progression failed');
`,ctx);
console.log('ORBIT ascension test: PASS');

vm.runInContext(`
  toMenu(); save.settings.audio='OFF'; save.difficulty='STANDARD'; save.sector='AURORA'; save.contract='NONE'; startRun(); state.p.iFrames=999999;
  state.time=240.05; spawnWave(.1); let b=state.enemies.find(e=>e.boss&&e.bossStage===1); if(!b) throw new Error('boss 1 timeline failed'); damageEnemy(b,999999,false,'pulse');
  state.time=480.05; spawnWave(.1); b=state.enemies.find(e=>e.boss&&e.bossStage===2); if(!b) throw new Error('boss 2 timeline failed'); damageEnemy(b,999999,false,'pulse');
  state.time=720.05; spawnWave(.1); b=state.enemies.find(e=>e.boss&&e.bossStage===3); if(!b) throw new Error('boss 3 timeline failed'); damageEnemy(b,999999,false,'pulse');
  if(!state.gameOver || !state.victory || state.bossesKilled<3) throw new Error('full run timeline failed');
`,ctx);
console.log('ORBIT full-run timeline: PASS');
