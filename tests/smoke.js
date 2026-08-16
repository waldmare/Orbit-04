const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
class ClassList{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(x,v){if(v===undefined){this.s.has(x)?this.s.delete(x):this.s.add(x)}else v?this.s.add(x):this.s.delete(x)}contains(x){return this.s.has(x)}}
class El{constructor(id=''){this.id=id;this.classList=new ClassList();this.style={};this.dataset={};this.children=[];this.textContent='';this._html='';this.disabled=false;this.onclick=null}set innerHTML(v){this._html=v}get innerHTML(){return this._html}appendChild(x){this.children.push(x);return x}remove(){this.removed=true}addEventListener(){}setPointerCapture(){}querySelector(sel){if(sel==='button'){if(!this._btn)this._btn=new El();return this._btn}return null}get offsetWidth(){return 960}}
const els=Object.fromEntries(ids.map(id=>[id,new El(id)]));
els.game.getContext=()=>({imageSmoothingEnabled:false,save(){},restore(){},fillRect(){},translate(){},rotate(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1});
const dataClose=[...html.matchAll(/data-close="([^"]+)"/g)].map(m=>{const e=new El();e.dataset.close=m[1];return e});
const document={getElementById:id=>els[id],querySelectorAll:q=>q==='[data-close]'?dataClose:[],createElement:()=>new El(),body:new El('body'),fullscreenElement:null,exitFullscreen(){}};
const store={};
const ctx={console,document,window:null,navigator:{userAgent:'node-test',getGamepads:()=>[]},location:{search:'?test=1'},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)},performance:{now:()=>1000},requestAnimationFrame:()=>{},setTimeout:(fn)=>{ /* suppress async visuals in smoke test */ return 1},clearTimeout:()=>{},confirm:()=>true,prompt:()=>null,alert:()=>{},open:()=>{},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),URLSearchParams,Math,JSON,Date,Array,Object,Set,Map,String,Number,Boolean,RegExp,Error,parseInt,parseFloat,isNaN,Infinity,NaN};
ctx.window=ctx;
ctx.addEventListener=()=>{};
vm.createContext(ctx);
const code=fs.readFileSync(path.join(root,'game.js'),'utf8');
vm.runInContext(code,ctx,{filename:'game.js'});
vm.runInContext(`
  if(document.body.dataset.orbitBoot!=='ok') throw new Error('boot flag missing');
  save.settings.audio='OFF'; startRun();
  state.p.iFrames=9999;
  if(save.settings.mouse!=='HOLD') throw new Error('mouse default setting mismatch');
  state.p.x=100; state.p.y=100; mouse.active=true; mouse.inside=true; mouse.x=200; mouse.y=100;
  const mouseMove=moveInput(); if(mouseMove.dx<=0) throw new Error('mouse steering input failed');
  mouse.active=false;
  for(const id of Object.keys(WEAPON_META)){ if(!state.weapons[id]) addWeapon(id); state.weapons[id].level=6; }
  for(let i=0;i<10;i++) spawnEnemy(i%2?'charger':'scout',false,{x:500+i*8,y:240+i*6});
  updateWeapons(2);
  for(let i=0;i<120;i++) update(1/60);
  if(!state || state.mode!=='run') throw new Error('run did not remain active');
  if(Object.keys(state.weapons).length!==8) throw new Error('weapon system count mismatch');
  gainXp(100);
  if(!state.choosing) throw new Error('level-up screen did not open');
  selectOffer(state.currentOffers[0]);
  renderResearch(); renderAchievements(); renderCodex(); renderSettings();
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
