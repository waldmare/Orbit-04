const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const requiredAssets=[
  'assets/visuals/deep-space-arena-v1.png','assets/visuals/space-pulsar-v1.png','assets/visuals/space-rift-v1.png','assets/visuals/space-supernova-v1.png',
  'assets/visuals/player-interceptor-v3.png','assets/visuals/enemy-scout-v3.png','assets/visuals/enemy-charger-v3.png','assets/visuals/enemy-tank-v3.png','assets/visuals/enemy-gunner-v3.png','assets/visuals/enemy-splitter-v3.png','assets/visuals/enemy-sniper-v3.png','assets/visuals/boss-carrier-v3.png',
  'assets/audio/premium/kenney-sci-fi-sounds/impactMetal_000.ogg','assets/audio/premium/kenney-sci-fi-sounds/thrusterFire_004.ogg','assets/audio/premium/kenney-sci-fi-sounds/laserSmall_000.ogg','assets/audio/premium/kenney-sci-fi-sounds/laserLarge_004.ogg','assets/audio/premium/kenney-sci-fi-sounds/explosionCrunch_004.ogg','assets/audio/premium/kenney-sci-fi-sounds/lowFrequency_explosion_001.ogg',
  'assets/audio/premium/music-exploration-spirit.mp3','assets/audio/premium/music-combat-score.mp3','assets/audio/premium/music-boss-xanthos.mp3'
];
for(const asset of requiredAssets){const full=path.join(root,asset);if(!fs.existsSync(full)||fs.statSync(full).size<44)throw new Error(`missing engine asset: ${asset}`)}
if(!html.includes('visual-engine.js'))throw new Error('sprite renderer script missing from index.html');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
class ClassList{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(x,v){if(v===undefined){this.s.has(x)?this.s.delete(x):this.s.add(x)}else v?this.s.add(x):this.s.delete(x)}contains(x){return this.s.has(x)}}
class El{constructor(id=''){this.id=id;this.classList=new ClassList();this.style={};this.dataset={};this.children=[];this.textContent='';this._html='';this.disabled=false;this.onclick=null}set innerHTML(v){this._html=v}get innerHTML(){return this._html}appendChild(x){this.children.push(x);return x}remove(){this.removed=true}addEventListener(){}setPointerCapture(){}querySelector(sel){if(sel==='button'){if(!this._btn)this._btn=new El();return this._btn}return null}get offsetWidth(){return 960}}
const els=Object.fromEntries(ids.map(id=>[id,new El(id)]));

class G{clear(){return this}fillStyle(){return this}fillPoints(){return this}lineStyle(){return this}strokePoints(){return this}beginPath(){return this}moveTo(){return this}lineTo(){return this}strokePath(){return this}fillCircle(){return this}strokeCircle(){return this}strokeEllipse(){return this}fillRect(){return this}setPosition(){return this}setBlendMode(){return this}setScale(){return this}setDepth(){return this}setVisible(){return this}}
class Point{constructor(x,y){this.x=x;this.y=y}}

els.game.getContext=()=>({imageSmoothingEnabled:false,save(){},restore(){},fillRect(){},translate(){},rotate(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1});
const dataClose=[...html.matchAll(/data-close="([^"]+)"/g)].map(m=>{const e=new El();e.dataset.close=m[1];return e});
const document={getElementById:id=>els[id],querySelectorAll:q=>q==='[data-close]'?dataClose:[],createElement:()=>new El(),body:new El('body'),fullscreenElement:null,exitFullscreen(){}};
const store={};
const ctx={console,document,G,Phaser:{Display:{Color:{HexStringToColor:()=>({color:0xffffff})}},Geom:{Point},BlendModes:{ADD:1},WEBGL:2,Scale:{NONE:0}},window:null,navigator:{userAgent:'node-test',getGamepads:()=>[]},location:{search:'?test=1'},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)},performance:{now:()=>1000},requestAnimationFrame:()=>{},setTimeout:(fn)=>{ /* suppress async visuals in smoke test */ return 1},clearTimeout:()=>{},confirm:()=>true,prompt:()=>null,alert:()=>{},open:()=>{},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),URLSearchParams,Math,JSON,Date,Array,Object,Set,Map,String,Number,Boolean,RegExp,Error,parseInt,parseFloat,isNaN,Infinity,NaN};
ctx.window=ctx;
ctx.addEventListener=()=>{};
vm.createContext(ctx);
const code=fs.readFileSync(path.join(root,'game.js'),'utf8');
vm.runInContext(code,ctx,{filename:'game.js'});
vm.runInContext(`
  if(document.body.dataset.orbitBoot!=='ok') throw new Error('boot flag missing');
  let rendererConfig=null;
  Phaser.Device={Features:{webGL:true}}; Phaser.WEBGL=2; Phaser.CANVAS=1;
  Phaser.Game=class{constructor(config){rendererConfig=config}};
  bootRenderer();
  if(rendererConfig?.type!==Phaser.WEBGL) throw new Error('renderer type must be explicit when using a custom canvas');
  save.settings.audio='OFF'; startRun();
  state.p.iFrames=9999;
  keys.d=true; const dashStart=state.p.x; state.enemyBullets.push({x:state.p.x+82,y:state.p.y,r:3,life:2,damage:1,grazed:false,vx:0,vy:0});
  if(!tryPhaseDash()||state.p.x<=dashStart||state.p.dashCooldown<=0||state.enemyBullets[0].life>0) throw new Error('PHASE DASH failed');
  const dashEnd=state.p.x; if(tryPhaseDash()||state.p.x!==dashEnd) throw new Error('PHASE DASH cooldown failed'); keys.d=false;
  if(Object.keys(ENGINE_ASSETS.backgrounds).length!==4) throw new Error('dynamic background plates missing');
  state.time=106; if(desiredBackground()!=='pulsar') throw new Error('background director did not advance'); state.time=0;
  save.settings.uiScale='XXL'; save.settings.contrast='HIGH'; renderSettings();
  if(document.getElementById('wrap').dataset.uiScale!=='XXL'||document.getElementById('wrap').dataset.contrast!=='HIGH') throw new Error('display settings were not applied');
  pause(true);
  if(!state.paused||!document.getElementById('pauseScreen').classList.contains('show')) throw new Error('pause screen did not open');
  pause(false);
  if(state.paused||document.getElementById('pauseScreen').classList.contains('show')) throw new Error('run did not resume');
  if(save.settings.mouse!=='HOLD') throw new Error('mouse default setting mismatch');
  bgG=new G(); nebulaG=new G(); glowG=new G(); worldG=new G(); overlayG=new G(); engineReady=true; draw();
  state.chain=14; state.chainTimer=1;
  const rushTarget=spawnEnemy('scout',false,{x:520,y:260}); killEnemy(rushTarget);
  if(state.rush<=0||state.rushActivations!==1||save.stats.signalRushes!==1) throw new Error('SIGNAL RUSH did not activate');
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
