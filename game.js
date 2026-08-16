'use strict';

// ORBIT//04 — studio build. No external runtime dependencies.
const GAME_VERSION='0.10.1';
const RUN_TARGET=720;
const SUPPORT_URL='';
const BUILD_TARGET=(navigator.userAgent||'').includes('Electron')?'desktop':'web';
const TEST_MODE=new URLSearchParams(location.search).has('test');
const MONETIZATION={
  rewarded:async(_placement)=>false,
  interstitial:async(_placement)=>false
};
const PLATFORM={
  unlockAchievement:(_id)=>{},
  setStat:(_id,_value)=>{}
};

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const choice=a=>a[(Math.random()*a.length)|0];
const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const fmtTime=sec=>`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
const canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=canvas.width,H=canvas.height;ctx.imageSmoothingEnabled=false;
const screens=['titleScreen','levelScreen','pauseScreen','researchScreen','achievementsScreen','codexScreen','settingsScreen','gameOverScreen'];
const hud=$('hud'),hudLeft=$('hudLeft'),hudRight=$('hudRight'),hudSub=$('hudSub'),xpFill=$('xpfill'),xpText=$('xptext'),centerMessage=$('centerMessage');
const bossBar=$('bossBar'),bossFill=$('bossFill'),bossLabel=$('bossLabel'),toastStack=$('toastStack');
$('versionText').textContent=GAME_VERSION;

function show(id){$(id).classList.add('show')}
function hide(id){$(id).classList.remove('show')}
function hideAll(except=''){for(const id of screens)if(id!==except)hide(id)}
function message(text,ms=900){centerMessage.textContent=text;clearTimeout(message.t);message.t=setTimeout(()=>centerMessage.textContent='',ms)}
function toast(title,text=''){const d=document.createElement('div');d.className='toast';d.innerHTML=`<b>${title}</b>${text?`<br>${text}`:''}`;toastStack.appendChild(d);setTimeout(()=>d.remove(),3300)}
function weighted(items,count){const pool=[...items],out=[];while(pool.length&&out.length<count){const total=pool.reduce((a,x)=>a+x.weight,0);let r=Math.random()*total,i=0;for(;i<pool.length;i++){r-=pool[i].weight;if(r<=0)break}out.push(pool.splice(Math.min(i,pool.length-1),1)[0])}return out}
function edgePos(m=34){const e=(Math.random()*4)|0,p=Math.random();return e===0?{x:-m,y:p*H}:e===1?{x:W+m,y:p*H}:e===2?{x:p*W,y:-m}:{x:p*W,y:H+m}}

// ---------- SAVE / PROFILE ----------
const SAVE_KEY='orbit04-save-v2';
const OLD_SAVE_KEY='orbit04-save-v1';
const DEFAULT_SETTINGS={playerHp:'BOTH',enemyHp:'ELITES',xpReadout:'BOTH',mouse:'HOLD',shake:'ON',flash:'ON',particles:'HIGH',audio:'ON'};
const DEFAULT_STATS={totalDamage:0,damageTaken:0,bosses:0,highestLevel:1,bestChain:0,bestGrazeChain:0,totalGrazes:0,clears:0,hardlineClears:0,blackoutClears:0,playTime:0,caches:0,conversions:0,flawlessBosses:0,secretEvents:0};
const DEFAULT_SAVE={credits:0,bestScore:0,bestTime:0,totalKills:0,runs:0,unlocked:['striker'],selected:'striker',difficulty:'STANDARD',contract:'NONE',achievements:[],research:{},shipMastery:{},discoveredWeapons:['pulse'],discoveredEnemies:['scout'],discoveredEvolutions:[],discoveredSynergies:[],discoveredArtifacts:[],stats:{...DEFAULT_STATS},settings:{...DEFAULT_SETTINGS}};
function deepProfile(raw={}){return {...DEFAULT_SAVE,...raw,unlocked:Array.isArray(raw.unlocked)?raw.unlocked:['striker'],achievements:Array.isArray(raw.achievements)?raw.achievements:[],research:{...(raw.research||{})},shipMastery:{...(raw.shipMastery||{})},discoveredWeapons:Array.isArray(raw.discoveredWeapons)?raw.discoveredWeapons:['pulse'],discoveredEnemies:Array.isArray(raw.discoveredEnemies)?raw.discoveredEnemies:['scout'],discoveredEvolutions:Array.isArray(raw.discoveredEvolutions)?raw.discoveredEvolutions:[],discoveredSynergies:Array.isArray(raw.discoveredSynergies)?raw.discoveredSynergies:[],discoveredArtifacts:Array.isArray(raw.discoveredArtifacts)?raw.discoveredArtifacts:[],stats:{...DEFAULT_STATS,...(raw.stats||{})},settings:{...DEFAULT_SETTINGS,...(raw.settings||{})}}}
function loadSave(){
  try{const current=localStorage.getItem(SAVE_KEY);if(current)return deepProfile(JSON.parse(current));
    const old=localStorage.getItem(OLD_SAVE_KEY);if(old){const o=JSON.parse(old),m=deepProfile({...o,difficulty:'STANDARD',settings:{...DEFAULT_SETTINGS,...(o.settings||{}),audio:o.audio===false?'OFF':'ON'}});localStorage.setItem(SAVE_KEY,JSON.stringify(m));return m}
  }catch(_e){}
  return deepProfile();
}
let save=loadSave();
function persist(render=true){localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(render)renderMenu()}
function exportSave(){try{const code=btoa(JSON.stringify(save));navigator.clipboard?.writeText(code).then(()=>toast('SAVE EXPORTED','Copied to clipboard.')).catch(()=>prompt('Copy save code:',code));if(!navigator.clipboard)prompt('Copy save code:',code)}catch(_e){toast('EXPORT FAILED')}}
function importSave(){const code=prompt('Paste ORBIT//04 save code:');if(!code)return;try{save=deepProfile(JSON.parse(atob(code.trim())));persist();renderSettings();toast('SAVE IMPORTED')}catch(_e){alert('Invalid save code.')}}

// ---------- AUDIO ----------
const AUDIO=(()=>{
  let ac=null,master=null,sfxBus=null,musicBus=null,nextBeat=0,beat=0,lastKill=0,lastPickup=0,lastEnemyShot=0,lastHit=0;
  function enabled(){return save.settings.audio==='ON'}
  function ensure(){if(!enabled())return false;if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();sfxBus=ac.createGain();musicBus=ac.createGain();master.gain.value=.68;sfxBus.gain.value=.72;musicBus.gain.value=.22;sfxBus.connect(master);musicBus.connect(master);master.connect(ac.destination)}if(ac.state==='suspended')ac.resume();return true}
  function tone(freq,dur=.05,type='square',vol=.025,slide=0,delay=0,bus='sfx'){if(!ensure())return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+delay;o.type=type;o.frequency.setValueAtTime(Math.max(30,freq),t);if(slide)o.frequency.linearRampToValueAtTime(Math.max(30,freq+slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(bus==='music'?musicBus:sfxBus);o.start(t);o.stop(t+dur+.02)}
  function noise(dur=.05,vol=.016,delay=0){if(!ensure())return;const length=Math.max(1,Math.floor(ac.sampleRate*dur)),buf=ac.createBuffer(1,length,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<length;i++)d[i]=(Math.random()*2-1)*(1-i/length);const src=ac.createBufferSource(),g=ac.createGain(),t=ac.currentTime+delay;src.buffer=buf;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(g);g.connect(sfxBus);src.start(t)}
  function sfx(name,value=0){if(!enabled())return;const now=performance.now();switch(name){
    case'ui':tone(620,.035,'square',.022,100);break;case'start':tone(220,.07,'square',.04,110);tone(330,.07,'square',.035,110,.07);tone(440,.1,'square',.03,150,.14);break;
    case'pause':tone(260,.05,'triangle',.03,-60);break;case'resume':tone(340,.05,'triangle',.03,80);break;case'level':tone(523,.06,'square',.038,80);tone(659,.06,'square',.034,90,.06);tone(784,.1,'square',.034,110,.12);break;
    case'select':tone(720,.04,'square',.03,160);tone(960,.05,'square',.022,120,.04);break;case'reroll':tone(390,.05,'square',.026,-90);tone(280,.06,'square',.022,70,.05);break;
    case'evolve':[392,523,659,784].forEach((f,i)=>tone(f,.11,'square',.038,80,i*.07));break;case'achievement':[523,659,784,1047].forEach((f,i)=>tone(f,.1,'square',.035,80,i*.06));break;
    case'research':tone(300,.05,'triangle',.03,120);tone(600,.09,'square',.026,180,.05);break;case'pulse':tone(980,.025,'square',.014,-260);break;case'missile':tone(190,.07,'sawtooth',.022,-85);noise(.03,.009);break;
    case'drone':tone(1250,.022,'square',.009,-240);break;case'arc':tone(1450,.05,'triangle',.021,-950);noise(.03,.008);break;case'rail':tone(125,.09,'sawtooth',.032,-70);noise(.05,.013,.015);break;
    case'nova':tone(260,.08,'sine',.03,520);break;case'mine':tone(155,.06,'square',.02,-45);break;case'beam':tone(840,.06,'sawtooth',.018,420);break;
    case'enemyShot':if(now-lastEnemyShot>80){lastEnemyShot=now;tone(300,.035,'square',.011,-80)}break;case'kill':if(now-lastKill>28){lastKill=now;const c=Math.max(1,value||1),f=105+Math.min(520,c*5.2);tone(f,.035,'triangle',.012+Math.min(.012,c/12000),20+Math.min(140,c*1.2))}break;case'pickup':if(now-lastPickup>52){lastPickup=now;tone(880,.022,'square',.01,180)}break;
    case'hit':if(now-lastHit>90){lastHit=now;noise(.07,.03);tone(85,.07,'sawtooth',.03,-35)}break;case'convert':tone(410,.055,'square',.034,180);tone(820,.1,'square',.03,120,.055);break;
    case'elite':tone(210,.08,'triangle',.03,90);tone(420,.1,'triangle',.026,130,.06);break;case'boss':tone(92,.18,'sawtooth',.045,-20);tone(74,.18,'sawtooth',.04,25,.2);tone(92,.22,'sawtooth',.045,-18,.4);break;
    case'danger':tone(150,.07,'square',.03,-35);tone(120,.09,'square',.026,-25,.08);break;case'bounty':tone(740,.05,'square',.03,130);tone(980,.06,'square',.025,-90,.05);break;
    case'cache':tone(523,.055,'square',.034,90);tone(659,.06,'square',.03,110,.055);tone(880,.09,'square',.026,150,.12);break;case'omega':[392,523,659,784,1047].forEach((f,i)=>tone(f,.11,'square',.043,120,i*.055));noise(.13,.014,.04);break;
    case'overdrive':{const tier=Math.max(1,value||1);tone(300+tier*70,.06,'sawtooth',.03+tier*.004,240+tier*70);tone(600+tier*90,.09,'square',.025+tier*.003,300+tier*80,.055);if(tier>=4)tone(1320,.14,'triangle',.024,420,.13)}break;case'graze':tone(1180,.022,'triangle',.009,100);break;case'grazeTier':{const t=Math.max(1,value||1);tone(1050+t*170,.035,'triangle',.012+t*.003,120);if(t>=3)tone(1650,.05,'square',.012,180,.025)}break;case'streak':tone(980,.03,'square',.018,160);tone(1320,.04,'square',.015,120,.03);break;
    case'crit':tone(145,.035,'square',.025,-35);tone(1120,.045,'triangle',.022,340,.008);noise(.028,.011);break;case'phase':tone(180,.07,'sawtooth',.033,150);tone(540,.09,'square',.027,-80,.06);break;case'bossDown':tone(78,.20,'sawtooth',.05,-30);noise(.22,.025,.04);tone(440,.15,'triangle',.03,-180,.12);break;case'cacheTick':tone(440+(value||0)*130,.055,'square',.026,80);break;case'synergy':[520,780,1040].forEach((f,i)=>tone(f,.075,'square',.028,120,i*.055));break;case'artifact':tone(210,.10,'sawtooth',.034,350);tone(840,.16,'triangle',.032,420,.08);noise(.09,.012,.03);break;case'flawless':[660,880,1320].forEach((f,i)=>tone(f,.095,'triangle',.03,150,i*.065));break;case'secret':tone(280,.08,'square',.028,-120);tone(760,.13,'triangle',.025,260,.09);break;case'limit':tone(220,.07,'sawtooth',.035,420);tone(880,.12,'square',.03,520,.055);break;
    case'death':tone(220,.16,'square',.043,-120);tone(130,.24,'sawtooth',.038,-65,.12);noise(.18,.021,.07);break;case'victory':[392,494,587,784].forEach((f,i)=>tone(f,.17,'square',.04,80,i*.11));break;case'revive':tone(180,.07,'triangle',.034,180);tone(360,.09,'triangle',.034,260,.07);tone(720,.12,'square',.03,160,.15);break;
  }}
  function music(time,info={}){if(!enabled()||!ensure())return;if(typeof info==='boolean')info={boss:info};if(time+.02<nextBeat)return;const boss=!!info.boss,drive=info.drive||0,threat=info.threat||1,redline=!!info.redline;const tempo=(boss?.30:.375)*(drive>=3?.80:drive>=1?.90:1),roots=boss?[82.41,98,110,123.47]:[110,130.81,146.83,164.81],root=roots[(Math.floor(beat/4))%roots.length];if(beat%2===0)tone(root,.11,'triangle',.024+(boss?.004:0),-4,0,'music');if(beat%4===0)tone(root*2,.05,'square',.013,root*.12,0,'music');if(beat%8===6)tone(root*3,.04,'square',.008,-root*.35,0,'music');if(drive>=2&&beat%2===1)tone(root*4,.035,'square',.007+drive*.002,root*.20,0,'music');if(drive>=4&&beat%4===3)tone(root*6,.045,'triangle',.009,root*.3,0,'music');if(threat>=7&&beat%8===2)tone(root*5,.03,'square',.006,40,0,'music');if(redline&&beat%4===0)tone(55,.09,'sine',.014,-8,0,'music');beat++;nextBeat+=tempo;if(nextBeat<time-.5)nextBeat=time}
  function resetMusic(){nextBeat=0;beat=0}return{sfx,music,resetMusic,ensure};
})();

// ---------- CONTENT DATA ----------
const DIFFICULTIES={
  STANDARD:{name:'STANDARD',desc:'Intended progression. Full rewards.',hp:1,damage:1,speed:1,spawn:1,score:1,credits:1},
  HARDLINE:{name:'HARDLINE',desc:'Denser waves. +25% hostile hull, +20% damage. +35% score.',hp:1.25,damage:1.20,speed:1.07,spawn:1.20,score:1.35,credits:1.18},
  BLACKOUT:{name:'BLACKOUT',desc:'Unlocked by clearing HARDLINE. Severe scaling. +75% score.',hp:1.55,damage:1.35,speed:1.12,spawn:1.38,score:1.75,credits:1.35}
};
const CONTRACTS={
  NONE:{name:'NONE',desc:'No contract modifiers.',hp:1,damage:1,speed:1,spawn:1,score:1,credits:1,heal:1},
  HYPERDRIVE:{name:'HYPERDRIVE',desc:'Hostiles +20% speed. Frame +8% speed. +25% score / +18% credits.',hp:1,damage:1,speed:1.20,spawn:1,score:1.25,credits:1.18,heal:1,playerSpeed:1.08},
  SWARM:{name:'SWARM PROTOCOL',desc:'+35% spawn density, -8% hostile hull. +30% score / +15% credits.',hp:.92,damage:1,speed:1,spawn:1.35,score:1.30,credits:1.15,heal:1},
  DEADZONE:{name:'DEAD ZONE',desc:'Repairs disabled. Better cache rarity. +35% score / +30% credits.',hp:1,damage:1,speed:1,spawn:1,score:1.35,credits:1.30,heal:0,cacheLuck:.10},
  FRAGILE:{name:'GLASS ORBIT',desc:'Maximum hull -25%, crit +8%. +50% score / +25% credits.',hp:1,damage:1,speed:1.05,spawn:1.08,score:1.50,credits:1.25,heal:1,hull:.75,crit:.08}
};
const SHIPS={
  striker:{name:'STRIKER',cost:0,desc:'Balanced interceptor. Reliable pulse cannon.',hp:88,speed:222,armor:0,damage:1,fire:1,crit:.04,weapon:'pulse'},
  bastion:{name:'BASTION',cost:260,desc:'Heavy frame. High hull and armor. Slow turn profile.',hp:132,speed:176,armor:.12,damage:1.08,fire:.94,crit:.02,weapon:'rail'},
  wraith:{name:'WRAITH',cost:460,desc:'Fast hunter. Fragile hull. High critical chance.',hp:70,speed:258,armor:0,damage:.97,fire:1.08,crit:.12,weapon:'missile'},
  specter:{name:'SPECTER',cost:720,desc:'Extreme mobility. Arc emitter. Minimal hull.',hp:60,speed:288,armor:0,damage:.94,fire:1.13,crit:.14,weapon:'arc'},
  bulwark:{name:'BULWARK',cost:980,desc:'Drone carrier. Durable with high weapon output.',hp:116,speed:190,armor:.08,damage:1.15,fire:.96,crit:.03,weapon:'drone'},
  oracle:{name:'ORACLE',cost:1250,desc:'Signal warfare frame. Starts with IFF corruption.',hp:78,speed:228,armor:.02,damage:1.02,fire:1.02,crit:.06,weapon:'beam',startPassive:'iff'},
  vector:{name:'VECTOR',cost:1600,desc:'Glass-cannon prototype. Nova reactor and high output.',hp:54,speed:270,armor:0,damage:1.24,fire:1.10,crit:.10,weapon:'nova'}
};
const WEAPON_META={
  pulse:{name:'PULSE CANNON',evo:'PULSE ARRAY',req:'overclock',desc:'Fast direct fire at the nearest target.'},
  missile:{name:'HOMING MISSILES',evo:'HUNTER SWARM',req:'targeting',desc:'Tracking warheads with splash damage.'},
  drone:{name:'ORBIT DRONES',evo:'GUARDIAN WING',req:'armor',desc:'Autonomous platforms orbit the frame.'},
  arc:{name:'ARC EMITTER',evo:'ION WEB',req:'reactor',desc:'Instant electrical chains between nearby hostiles.'},
  rail:{name:'RAIL DRIVER',evo:'LANCE DRIVER',req:'velocity',desc:'Slow, high-damage penetrating rounds.'},
  nova:{name:'NOVA CORE',evo:'SUPERNOVA',req:'amplifier',desc:'Periodic radial burst around the frame.'},
  mine:{name:'VOID MINES',evo:'GRAVITY WELL',req:'magnet',desc:'Deploys proximity charges behind your movement.'},
  beam:{name:'PHASE BEAM',evo:'PRISM LANCE',req:'capacitor',desc:'Instant beam that pierces targets in a line.'}
};
const ENEMY_META={
  scout:{name:'SCOUT',desc:'Baseline pursuit craft.'},charger:{name:'CHARGER',desc:'Periodic high-speed rushes.'},tank:{name:'ARMORED NODE',desc:'Slow unit with heavy hull.'},gunner:{name:'GUNNER',desc:'Maintains pressure with aimed shots.'},splitter:{name:'SPLITTER',desc:'Breaks into two scouts on destruction.'},sniper:{name:'LANCER',desc:'Long-range high-velocity projectile.'},boss:{name:'SIGNATURE',desc:'Boss-class hostile with pattern fire.'}
};
const RESEARCH={
  hull:{name:'HULL MEMORY',max:5,base:70,desc:l=>`+${l*2}% maximum hull`,apply:(p,l)=>{p.baseHp*=1+l*.02}},
  output:{name:'OUTPUT MEMORY',max:5,base:85,desc:l=>`+${l*2}% weapon damage`,apply:(p,l)=>{p.baseDamageMul*=1+l*.02}},
  thrusters:{name:'THRUSTER MEMORY',max:5,base:65,desc:l=>`+${l*2}% movement speed`,apply:(p,l)=>{p.baseSpeed*=1+l*.02}},
  critical:{name:'TARGET MEMORY',max:5,base:95,desc:l=>`+${(l*.6).toFixed(1)}% critical chance`,apply:(p,l)=>{p.baseCrit+=l*.006}},
  salvage:{name:'SALVAGE MEMORY',max:5,base:80,desc:l=>`+${l*4}% run credits`,meta:true},
  learning:{name:'LEARNING MEMORY',max:5,base:75,desc:l=>`+${l*3}% XP gain`,meta:true},
  magnet:{name:'FIELD MEMORY',max:5,base:55,desc:l=>`+${l*7}% pickup radius`,apply:(p,l)=>{p.magnet*=1+l*.07}},
  reroll:{name:'DECISION MEMORY',max:3,base:180,desc:l=>`+${l} starting reroll${l===1?'':'s'}`,meta:true}
};
const ACHIEVEMENTS={
  first_blood:{name:'FIRST BLOOD',desc:'Destroy one hostile.',reward:'25 CR',credits:25},
  signal_capture:{name:'PACKET CAPTURE',desc:'Complete a Signal Window.',reward:'40 CR',credits:40},
  chain_100:{name:'NOISE FLOOR',desc:'Reach a 100 kill chain.',reward:'75 CR',credits:75},
  graze_25:{name:'NEAR MISS',desc:'Graze 25 hostile projectiles in one run.',reward:'60 CR',credits:60},
  first_boss:{name:'SIGNATURE BROKEN',desc:'Destroy a boss-class hostile.',reward:'80 CR',credits:80},
  iff_friend:{name:'FALSE FLAG',desc:'Convert a hostile into an allied craft.',reward:'ORACLE discount + 100 CR',credits:100},
  omega:{name:'WHITE BOX',desc:'Open an OMEGA DATA cache.',reward:'120 CR',credits:120},
  standard_clear:{name:'ORBIT STABLE',desc:'Clear STANDARD.',reward:'150 CR',credits:150},
  hardline_clear:{name:'HARDLINE',desc:'Clear HARDLINE.',reward:'BLACKOUT + 250 CR',credits:250},
  no_revive:{name:'ONE FRAME',desc:'Clear a run without reviving.',reward:'100 CR',credits:100},
  untouchable:{name:'CLEAN SIGNAL',desc:'Clear a run taking less than 40 damage.',reward:'180 CR',credits:180},
  collector:{name:'FRAME ARRAY',desc:'Unlock five frames.',reward:'140 CR',credits:140},
  research_12:{name:'LAB RAT',desc:'Purchase 12 research levels.',reward:'120 CR',credits:120},
  kills_2500:{name:'STATIC',desc:'Destroy 2,500 hostiles across all runs.',reward:'200 CR',credits:200},
  score_100k:{name:'SIX DIGITS',desc:'Score 100,000 in one run.',reward:'200 CR',credits:200},
  mastery_5:{name:'FRAME PERFECT',desc:'Reach mastery 5 with any frame.',reward:'250 CR',credits:250},
  flawless_3:{name:'CLEAN ROOM',desc:'Destroy three boss signatures without taking damage during the fights.',reward:'180 CR',credits:180},
  synergy_5:{name:'LINK STATE',desc:'Discover five weapon synergies.',reward:'180 CR',credits:180}
};

let state=null;

const PASSIVES={
  reactor:{name:'REACTOR',max:6,desc:l=>`Weapon damage +${l*9}%`,apply:l=>{state.p.damageMul=state.p.baseDamageMul*(1+l*.09)}},
  overclock:{name:'OVERCLOCK',max:6,desc:l=>`Weapon cooldown -${l*6}%`,apply:l=>{state.p.cooldownMul=state.p.baseCooldownMul*Math.pow(.94,l)}},
  targeting:{name:'TARGETING',max:6,desc:l=>`Critical chance +${l*2.5}%`,apply:l=>{state.p.crit=state.p.baseCrit+l*.025}},
  armor:{name:'ARMOR PLATING',max:6,desc:l=>`Damage taken -${l*3.5}% · hull +${l*6}`,apply:l=>{state.p.moduleArmor=l*.035;state.p.maxHp=state.p.baseHp+l*6;state.p.hp=Math.min(state.p.hp+6,state.p.maxHp)}},
  velocity:{name:'VELOCITY COILS',max:6,desc:l=>`Projectile speed +${l*11}%`,apply:l=>{state.p.projectileMul=1+l*.11}},
  thruster:{name:'THRUSTERS',max:6,desc:l=>`Movement speed +${l*5}%`,apply:l=>{state.p.speed=state.p.baseSpeed*(1+l*.05)}},
  magnet:{name:'SALVAGE FIELD',max:6,desc:l=>`Pickup radius +${l*24}`,apply:l=>{state.p.magnet=state.p.baseMagnet+l*24}},
  iff:{name:'IFF CORRUPTOR',max:6,desc:l=>`${(.18+l*.20).toFixed(2)}% conversion chance · ally cap ${1+Math.floor(l/2)}`,apply:l=>{state.p.convertChance=.0018+l*.002;state.p.allyCap=1+Math.floor(l/2)}},
  amplifier:{name:'FIELD AMPLIFIER',max:6,desc:l=>`Area / blast radius +${l*9}%`,apply:l=>{state.p.areaMul=1+l*.09}},
  capacitor:{name:'CAPACITOR',max:6,desc:l=>`Special weapon charge +${l*7}%`,apply:l=>{state.p.specialMul=1+l*.07}},
  loyalty:{name:'LOYALTY CORE',max:4,desc:l=>`Converted ally lifetime +${l*18}% · damage +${l*8}%`,apply:l=>{state.p.allyLifeMul=1+l*.18;state.p.allyDamageMul=1+l*.08}},
  uplink:{name:'TARGETING LINK',max:4,desc:l=>`Converted ally fire rate +${l*12}%`,apply:l=>{state.p.allyFireMul=1+l*.12}},
  scuttle:{name:'SCUTTLE CODE',max:3,desc:l=>`Expired allies detonate for ${l*35}% weapon output`,apply:l=>{state.p.allyExplosion=l*.35}}
};
const PROTOCOLS={
  glass:{name:'GLASS CORE',desc:'+38% weapon damage · -22% maximum hull',apply:()=>{state.p.baseDamageMul*=1.38;state.p.damageMul*=1.38;state.p.baseHp*=.78;state.p.maxHp*=.78;state.p.hp=Math.min(state.p.hp,state.p.maxHp)}},
  hot:{name:'HOT REACTOR',desc:'Weapon cooldown -24% · incoming damage +14%',apply:()=>{state.p.baseCooldownMul*=.76;state.p.cooldownMul*=.76;state.p.incomingMul*=1.14}},
  predator:{name:'PREDATOR LOGIC',desc:'+13% critical chance · +25% score · -10% movement speed',apply:()=>{state.p.baseCrit+=.13;state.p.crit+=.13;state.p.scoreMul*=1.25;state.p.baseSpeed*=.90;state.p.speed*=.90}},
  scavenger:{name:'BLACK SALVAGE',desc:'+45% credits · cache rarity improved · -12% weapon damage',apply:()=>{state.p.creditMul*=1.45;state.p.cacheLuck+=.14;state.p.baseDamageMul*=.88;state.p.damageMul*=.88}},
  ghost:{name:'GHOST DRIVE',desc:'+25% movement speed · graze radius +8 · maximum hull -15%',apply:()=>{state.p.baseSpeed*=1.25;state.p.speed*=1.25;state.p.grazeRadius+=8;state.p.baseHp*=.85;state.p.maxHp*=.85;state.p.hp=Math.min(state.p.hp,state.p.maxHp)}}
};
const ARTIFACTS={
  nullCore:{name:'NULL CORE',desc:'+1 projectile on compatible systems · maximum hull -30%',apply:()=>{state.p.extraProjectiles+=1;state.p.baseHp*=.70;state.p.maxHp*=.70;state.p.hp=Math.min(state.p.hp,state.p.maxHp)}},
  quantumLens:{name:'QUANTUM LENS',desc:'Critical damage +55% · incoming damage +10%',apply:()=>{state.p.critDamageBonus+=.55;state.p.incomingMul*=1.10}},
  blackBox:{name:'BLACK BOX',desc:'Greatly improves elite cache rarity. 100-chain milestones emit bonus data.',apply:()=>{state.p.cacheLuck+=.22;state.p.blackBox=true}},
  ghostProtocol:{name:'GHOST PROTOCOL',desc:'Long graze streaks accelerate all weapon timers.',apply:()=>{state.p.grazeOverclock=true}},
  deadReckoning:{name:'DEAD RECKONING',desc:'Below 25% hull: +35% weapon rate and +10% crit.',apply:()=>{state.p.deadReckoning=true}}
};
const SYNERGIES={
  hunterWing:{name:'HUNTER WING',desc:'Orbit Drones periodically launch homing micro-missiles.',condition:()=>state.weapons.drone?.level>=3&&state.weapons.missile?.level>=3},
  stormIff:{name:'STORM IFF',desc:'Converted allies arc electricity into nearby hostiles.',condition:()=>state.weapons.arc?.level>=3&&(state.passives.iff||0)>=2},
  lanceOptics:{name:'LANCE OPTICS',desc:'Rail critical hits discharge into a nearby target.',condition:()=>state.weapons.rail?.level>=3&&(state.passives.targeting||0)>=3},
  gravityPulse:{name:'GRAVITY PULSE',desc:'Void Mine detonations emit a secondary nova pulse.',condition:()=>state.weapons.mine?.level>=3&&state.weapons.nova?.level>=3},
  prismNet:{name:'PRISM NET',desc:'Phase Beam hits chain into nearby hostiles.',condition:()=>state.weapons.beam?.level>=3&&state.weapons.arc?.level>=3},
  pulseLoop:{name:'PULSE LOOP',desc:'Pulse Cannon gains an extra synchronized barrel.',condition:()=>state.weapons.pulse?.level>=4&&(state.passives.overclock||0)>=4}
};

const MASTERY_THRESHOLDS=[0,400,1200,2800,5500,9000];
function masteryLevel(id){const xp=save.shipMastery[id]||0;let level=0;for(let i=1;i<MASTERY_THRESHOLDS.length;i++)if(xp>=MASTERY_THRESHOLDS[i])level=i;return level}
function masteryColor(level){return level>=5?'#ffffff':level>=4?'#bd9cff':level>=3?'#ffd27a':level>=2?'#8dffd6':'#d9f5ff'}
function researchLevels(){return Object.values(save.research).reduce((a,b)=>a+(b||0),0)}
function researchCost(id){const r=RESEARCH[id],l=save.research[id]||0;return Math.floor(r.base*Math.pow(1.48,l))}
function difficultyUnlocked(id){return id!=='BLACKOUT'||save.stats.hardlineClears>0||save.achievements.includes('hardline_clear')}
function nextDifficulty(){const ids=Object.keys(DIFFICULTIES);let i=ids.indexOf(save.difficulty);for(let n=1;n<=ids.length;n++){const id=ids[(i+n)%ids.length];if(difficultyUnlocked(id)){save.difficulty=id;persist();return}}}
function discoverWeapon(id){if(!save.discoveredWeapons.includes(id)){save.discoveredWeapons.push(id);persist(false)}}
function discoverEnemy(id){if(!save.discoveredEnemies.includes(id)){save.discoveredEnemies.push(id);persist(false)}}
function unlockAchievement(id){
  if(!ACHIEVEMENTS[id]||save.achievements.includes(id))return false;
  const a=ACHIEVEMENTS[id];save.achievements.push(id);save.credits+=a.credits||0;PLATFORM.unlockAchievement(id);persist(false);AUDIO.sfx('achievement');toast(`ACHIEVEMENT — ${a.name}`,`${a.reward}`);if(state?.mode==='run')state.newUnlocks.push(`${a.name} — ${a.reward}`);return true;
}
function checkMetaAchievements(){
  if(save.totalKills>=2500)unlockAchievement('kills_2500');
  if(save.unlocked.length>=5)unlockAchievement('collector');
  if(researchLevels()>=12)unlockAchievement('research_12');
  if(Object.keys(SHIPS).some(id=>masteryLevel(id)>=5))unlockAchievement('mastery_5');
  if(save.stats.flawlessBosses>=3)unlockAchievement('flawless_3');
  if(save.discoveredSynergies.length>=5)unlockAchievement('synergy_5');
}

// ---------- MENU / SETTINGS ----------
function renderMenu(){
  $('saveLine').textContent=`${save.credits} CR · BEST ${Math.floor(save.bestScore)}`;
  $('researchLevelText').textContent=researchLevels();$('achievementCountText').textContent=`${save.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`;$('lifetimeKillsText').textContent=save.totalKills;
  const d=DIFFICULTIES[save.difficulty]||DIFFICULTIES.STANDARD;$('difficultyBtn').textContent=d.name;$('difficultyDesc').textContent=d.desc;const contract=CONTRACTS[save.contract]||CONTRACTS.NONE;$('contractBtn').textContent=contract.name;$('contractDesc').textContent=contract.desc;
  const grid=$('shipGrid');grid.innerHTML='';
  for(const [id,s] of Object.entries(SHIPS)){
    const unlocked=save.unlocked.includes(id),selected=save.selected===id;const b=document.createElement('button');b.className=`shipCard${selected?' selected':''}`;
    const cost=id==='oracle'&&save.achievements.includes('iff_friend')?Math.floor(s.cost*.7):s.cost;
    const mastery=masteryLevel(id);b.innerHTML=`<div><div class="shipName">${s.name}</div><div class="tiny" style="margin-top:5px">${s.desc}</div></div><div><div class="stat"><span>HULL</span><span>${s.hp}</span></div><div class="stat"><span>SPEED</span><span>${s.speed}</span></div><div class="stat"><span>START</span><span>${WEAPON_META[s.weapon].name}</span></div><div class="stat"><span>MASTERY</span><span style="color:${masteryColor(mastery)}">M${mastery}</span></div>${unlocked?'':`<div class="shipLock">UNLOCK — ${cost} CR</div>`}</div>`;
    b.onclick=()=>{AUDIO.sfx('ui');if(!unlocked){if(save.credits>=cost){save.credits-=cost;save.unlocked.push(id);save.selected=id;persist();checkMetaAchievements()}else toast('INSUFFICIENT CREDITS',`${cost-save.credits} CR required.`);return}save.selected=id;persist()};grid.appendChild(b);
  }
  $('startBtn').disabled=!save.unlocked.includes(save.selected);
  if(SUPPORT_URL&&BUILD_TARGET==='web')$('supportBtn').classList.remove('hidden');else $('supportBtn').classList.add('hidden');
}
function renderResearch(){
  $('researchCredits').textContent=save.credits;const grid=$('researchGrid');grid.innerHTML='';
  for(const [id,r] of Object.entries(RESEARCH)){const l=save.research[id]||0,cost=researchCost(id),max=l>=r.max;const card=document.createElement('div');card.className='researchCard';card.innerHTML=`<div><div class="name">${r.name}</div><div class="lvl">LV ${l}/${r.max}</div><div class="tiny" style="margin-top:6px">${r.desc(l)}</div><div class="cost">${max?'MAX':`${cost} CR`}</div></div><button ${max||save.credits<cost?'disabled':''}>${max?'MAX':'BUY'}</button>`;card.querySelector('button').onclick=()=>{if(max||save.credits<cost)return;save.credits-=cost;save.research[id]=l+1;AUDIO.sfx('research');persist(false);renderResearch();renderMenu();checkMetaAchievements()};grid.appendChild(card)}
}
function renderAchievements(){const grid=$('achievementGrid');grid.innerHTML='';for(const [id,a] of Object.entries(ACHIEVEMENTS)){const done=save.achievements.includes(id),d=document.createElement('div');d.className=`achievement ${done?'done':'locked'}`;d.innerHTML=`<div class="name">${done?'◆':'◇'} ${a.name}</div><div class="tiny" style="margin-top:5px">${a.desc}</div><div class="reward">${done?'COMPLETED':'REWARD'} · ${a.reward}</div>`;grid.appendChild(d)}$('achievementSummary').textContent=`${save.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`}
let codexTab='stats';
function renderCodex(){
  $('codexStatsTab').classList.toggle('selected',codexTab==='stats');$('codexWeaponsTab').classList.toggle('selected',codexTab==='weapons');$('codexEnemiesTab').classList.toggle('selected',codexTab==='enemies');$('codexDiscoveryTab').classList.toggle('selected',codexTab==='discoveries');const c=$('codexContent');c.innerHTML='';
  $('codexSummary').textContent=`RUNS ${save.runs} · CLEARS ${save.stats.clears}`;
  if(codexTab==='stats'){
    const rows=[['BEST SCORE',Math.floor(save.bestScore)],['BEST TIME',fmtTime(save.bestTime)],['TOTAL KILLS',save.totalKills],['TOTAL DAMAGE',Math.floor(save.stats.totalDamage)],['BOSSES',save.stats.bosses],['FLAWLESS BOSSES',save.stats.flawlessBosses],['BEST CHAIN',save.stats.bestChain],['BEST GRAZE',save.stats.bestGrazeChain],['GRAZES',save.stats.totalGrazes],['CACHES',save.stats.caches],['CONVERSIONS',save.stats.conversions],['SECRET EVENTS',save.stats.secretEvents],['HIGHEST LEVEL',save.stats.highestLevel],['PLAY TIME',fmtTime(save.stats.playTime)],['RESEARCH',researchLevels()]];
    for(const [n,v] of rows){const d=document.createElement('div');d.className='codexCard';d.innerHTML=`<b>${n}</b><span>${v}</span>`;c.appendChild(d)}
  }else if(codexTab==='weapons'){
    for(const [id,w] of Object.entries(WEAPON_META)){const known=save.discoveredWeapons.includes(id),evoKnown=save.discoveredEvolutions.includes(id),d=document.createElement('div');d.className='codexCard';d.innerHTML=`<b>${known?w.name:'UNKNOWN SYSTEM'}</b><span>${known?`${w.desc}<br>EVOLUTION: ${evoKnown?w.evo:'???'}`:'Acquire this weapon during a run.'}</span>`;c.appendChild(d)}
  }else if(codexTab==='enemies'){
    for(const [id,e] of Object.entries(ENEMY_META)){const known=save.discoveredEnemies.includes(id)||id==='boss'&&save.stats.bosses>0,d=document.createElement('div');d.className='codexCard';d.innerHTML=`<b>${known?e.name:'UNKNOWN HOSTILE'}</b><span>${known?e.desc:'No telemetry available.'}</span>`;c.appendChild(d)}
  }else{
    for(const [id,x] of Object.entries(SYNERGIES)){const known=save.discoveredSynergies.includes(id),d=document.createElement('div');d.className='codexCard';d.innerHTML=`<b>${known?x.name:'UNKNOWN LINK'}</b><span>${known?x.desc:'Combine compatible systems to reveal this link.'}</span>`;c.appendChild(d)}
    for(const [id,x] of Object.entries(ARTIFACTS)){const known=save.discoveredArtifacts.includes(id),d=document.createElement('div');d.className='codexCard';d.innerHTML=`<b>${known?x.name:'UNKNOWN ARTIFACT'}</b><span>${known?x.desc:'Rare telemetry not yet recovered.'}</span>`;c.appendChild(d)}
  }
}
const SETTING_CYCLES={playerHp:['OFF','HUD','BAR','BOTH'],enemyHp:['OFF','ELITES','ALL'],xpReadout:['OFF','VALUE','PERCENT','BOTH'],mouse:['HOLD','FOLLOW','OFF'],shake:['ON','OFF'],flash:['ON','OFF'],particles:['HIGH','LOW','OFF'],audio:['ON','OFF']};
function renderSettings(){for(const [k,id] of Object.entries({playerHp:'playerHpSetting',enemyHp:'enemyHpSetting',xpReadout:'xpSetting',mouse:'mouseSetting',shake:'shakeSetting',flash:'flashSetting',particles:'particleSetting',audio:'audioSetting'}))$(id).textContent=save.settings[k]}
function cycleSetting(key){const a=SETTING_CYCLES[key],i=Math.max(0,a.indexOf(save.settings[key]));save.settings[key]=a[(i+1)%a.length];persist(false);renderSettings();AUDIO.sfx('ui')}
function openOverlay(id){if(state?.mode==='run'&&!state.paused&&!state.choosing)pause(true);show(id);AUDIO.sfx('ui')}
function closeOverlay(id){hide(id);AUDIO.sfx('ui')}

$('difficultyBtn').onclick=()=>{AUDIO.sfx('ui');nextDifficulty()};$('contractBtn').onclick=()=>{AUDIO.sfx('ui');const ids=Object.keys(CONTRACTS),i=Math.max(0,ids.indexOf(save.contract));save.contract=ids[(i+1)%ids.length];persist()};
$('researchBtn').onclick=()=>{renderResearch();openOverlay('researchScreen')};$('achievementsBtn').onclick=()=>{renderAchievements();openOverlay('achievementsScreen')};$('codexBtn').onclick=()=>{renderCodex();openOverlay('codexScreen')};
$('settingsBtn').onclick=()=>{renderSettings();openOverlay('settingsScreen')};$('pauseSettingsBtn').onclick=()=>{renderSettings();show('settingsScreen')};$('settingsBackBtn').onclick=()=>closeOverlay('settingsScreen');
for(const [k,id] of Object.entries({playerHp:'playerHpSetting',enemyHp:'enemyHpSetting',xpReadout:'xpSetting',mouse:'mouseSetting',shake:'shakeSetting',flash:'flashSetting',particles:'particleSetting',audio:'audioSetting'}))$(id).onclick=()=>cycleSetting(k);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>closeOverlay(b.dataset.close);
$('codexStatsTab').onclick=()=>{codexTab='stats';renderCodex()};$('codexWeaponsTab').onclick=()=>{codexTab='weapons';renderCodex()};$('codexEnemiesTab').onclick=()=>{codexTab='enemies';renderCodex()};$('codexDiscoveryTab').onclick=()=>{codexTab='discoveries';renderCodex()};
$('exportSaveBtn').onclick=exportSave;$('importSaveBtn').onclick=importSave;$('resetSaveBtn').onclick=()=>{if(confirm('Reset all ORBIT//04 progress? This cannot be undone.')){save=deepProfile();persist();renderSettings();toast('SAVE RESET')}};
if(SUPPORT_URL)$('supportBtn').onclick=()=>open(SUPPORT_URL,'_blank','noopener');

// ---------- INPUT ----------
const keys={},touch={active:false,startX:0,startY:0,x:0,y:0},mouse={active:false,inside:false,x:W/2,y:H/2};let gamepadPauseLatch=false;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'&&$('settingsScreen').classList.contains('show')){hide('settingsScreen');return}if((k==='p'||k==='escape')&&state?.mode==='run'&&!state.choosing&&!$('settingsScreen').classList.contains('show'))togglePause();if(k==='f')toggleFullscreen();if(k==='m'){save.settings.audio=save.settings.audio==='ON'?'OFF':'ON';persist(false);renderSettings();AUDIO.sfx('ui')}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{mouse.active=false;if(state?.mode==='run'&&!state.paused&&!state.choosing)pause(true)});
function pointerToCanvas(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
canvas.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){mouse.inside=true;const p=pointerToCanvas(e);mouse.x=p.x;mouse.y=p.y}});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){mouse.inside=false;mouse.active=false}});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){if(e.button!==0||save.settings.mouse==='OFF')return;const p=pointerToCanvas(e);mouse.active=true;mouse.inside=true;mouse.x=p.x;mouse.y=p.y;canvas.setPointerCapture?.(e.pointerId);e.preventDefault?.();return}touch.active=true;touch.startX=touch.x=e.clientX;touch.startY=touch.y=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){const p=pointerToCanvas(e);mouse.inside=true;mouse.x=p.x;mouse.y=p.y;return}if(touch.active){touch.x=e.clientX;touch.y=e.clientY}});
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'){if(e.button===0)mouse.active=false}else touch.active=false});canvas.addEventListener('pointercancel',e=>{if(e.pointerType==='mouse')mouse.active=false;else touch.active=false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():$('wrap').requestFullscreen?.()}

function pollGamepadPause(){const gps=navigator.getGamepads?.()||[],gp=gps.find(Boolean),pressed=!!(gp&&(gp.buttons[9]?.pressed||gp.buttons[8]?.pressed));if(pressed&&!gamepadPauseLatch&&state?.mode==='run'&&!state.choosing&&!$('settingsScreen').classList.contains('show'))togglePause();gamepadPauseLatch=pressed}
function moveInput(){let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);const gps=navigator.getGamepads?.()||[];const gp=gps.find(Boolean);if(gp){const ax=Math.abs(gp.axes[0]||0)>.16?gp.axes[0]:0,ay=Math.abs(gp.axes[1]||0)>.16?gp.axes[1]:0;dx+=ax+(gp.buttons[15]?.pressed?1:0)-(gp.buttons[14]?.pressed?1:0);dy+=ay+(gp.buttons[13]?.pressed?1:0)-(gp.buttons[12]?.pressed?1:0);}if(touch.active){const tx=touch.x-touch.startX,ty=touch.y-touch.startY,l=Math.hypot(tx,ty);if(l>8){dx+=tx/Math.max(45,l);dy+=ty/Math.max(45,l)}}const mouseDriving=save.settings.mouse==='FOLLOW'&&mouse.inside||save.settings.mouse==='HOLD'&&mouse.active;if(mouseDriving&&state?.p){const tx=mouse.x-state.p.x,ty=mouse.y-state.p.y,l=Math.hypot(tx,ty);if(l>10){dx+=tx/l;dy+=ty/l}}return{dx,dy}}

// ---------- RUN HELPERS ----------
function particle(x,y,color='#b7f7ff',n=5){if(!state||save.settings.particles==='OFF')return;const mul=save.settings.particles==='LOW'?.45:1;n=Math.max(1,Math.ceil(n*mul));for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*90;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.22+Math.random()*.38,color})}}
function addShake(n){if(save.settings.shake==='ON'&&state)state.shake=Math.max(state.shake,n)}
function flashWrap(){if(save.settings.flash==='ON'){const w=$('wrap');w.classList.remove('flash');void w.offsetWidth;w.classList.add('flash');setTimeout(()=>w.classList.remove('flash'),450)}}
function nearest(from,filter=()=>true){let best=null,bd=Infinity;for(const e of state.enemies){if(e.dead||!filter(e))continue;const d=dist2(from,e);if(d<bd){bd=d;best=e}}return best}
function critDamage(base){return base}
function criticalRoll(base){const redline=state.p.hp/state.p.maxHp<=.30?.08:0,drive=(state.driveTier||0)*.018,reckon=state.p.deadReckoning&&state.p.hp/state.p.maxHp<=.25?.10:0,chance=Math.min(.72,state.p.crit+redline+drive+reckon),crit=Math.random()<chance,mult=1.85+(state.p.critDamageBonus||0);return{damage:crit?base*mult:base,crit}}
function critFeedback(e,weaponId,damage){if(!state||state.critFxCooldown>0)return;state.critFxCooldown=.055;AUDIO.sfx('crit');state.hitStop=Math.max(state.hitStop,.022);addShake(1.8);particle(e.x,e.y,'#ffffff',5);state.arcs.push({circle:true,x1:e.x,y1:e.y,r:Math.min(24,10+damage*.035),life:.065,color:'#ffffff'});if(weaponId==='rail'&&state.synergies.lanceOptics){const t=nearest(e,x=>x!==e&&dist2(e,x)<170*170);if(t)damageEnemy(t,damage*.30,false,'rail-link',false)}}
function applyResearchToPlayer(p){for(const [id,r] of Object.entries(RESEARCH)){const l=save.research[id]||0;if(l&&r.apply)r.apply(p,l)}p.maxHp=p.baseHp;p.hp=p.maxHp;p.speed=p.baseSpeed;p.damageMul=p.baseDamageMul;p.cooldownMul=p.baseCooldownMul;p.crit=p.baseCrit;p.baseMagnet=p.magnet}
function runCredit(amount){const research=1+(save.research.salvage||0)*.04;state.runCredits+=Math.max(1,Math.round(amount*state.p.creditMul*research*state.diff.credits*(state.contract?.credits||1)))}
function xpGain(amount){return amount*(1+(save.research.learning||0)*.03)}
function enqueueCeremony(title,subtitle,duration=500,onComplete=()=>{},kind='cache'){if(!state||state.gameOver){onComplete();return}const item={title,subtitle,duration,onComplete,kind};state.ceremonyQueue.push(item);processCeremony()}
function processCeremony(){if(!state||state.gameOver||state.ceremony||state.choosing||!state.ceremonyQueue.length)return;const run=state,item=state.ceremonyQueue.shift();if(TEST_MODE){item.onComplete();return processCeremony()}state.ceremony=true;state.paused=true;message(`${item.title}${item.subtitle?`\n${item.subtitle}`:''}`,item.duration+250);if(item.kind==='cache'){AUDIO.sfx('cacheTick',0);setTimeout(()=>AUDIO.sfx('cacheTick',1),Math.max(80,item.duration*.28));setTimeout(()=>AUDIO.sfx('cacheTick',2),Math.max(140,item.duration*.58))}setTimeout(()=>{if(state!==run||run.gameOver)return;item.onComplete();run.ceremony=false;run.paused=false;run.last=performance.now();processCeremony()},item.duration)}
function discoverArtifact(id){if(!save.discoveredArtifacts.includes(id)){save.discoveredArtifacts.push(id);persist(false)}}
function checkSynergies(){if(!state)return;for(const [id,m] of Object.entries(SYNERGIES)){if(state.synergies[id]||!m.condition())continue;state.synergies[id]=true;if(!save.discoveredSynergies.includes(id)){save.discoveredSynergies.push(id);persist(false)}AUDIO.sfx('synergy');toast(`SYSTEM LINK — ${m.name}`,m.desc);state.newUnlocks.push(`${m.name} synergy`)}checkMetaAchievements()}
function masteryGainForRun(){const d=state.difficulty==='BLACKOUT'?1.55:state.difficulty==='HARDLINE'?1.25:1,c=state.contract?.score||1;return Math.max(1,Math.round((state.kills+state.bossesKilled*60+(state.victory?180:0))*d*Math.min(1.35,c)))}

// ---------- WEAPONS / LEVEL SYSTEM ----------
function addWeapon(id,level=1){state.weapons[id]={level,evolved:false,timer:0,aux:0};discoverWeapon(id)}
function weaponLevelDesc(id,l){const t={pulse:['+18% damage','+1 projectile','-14% cooldown','+1 pierce','+22% damage'],missile:['+22% damage','+1 missile','-16% cooldown','+30% blast','+1 missile'],drone:['+1 drone','+18% damage','-16% cooldown','+1 drone','+25% damage'],arc:['+1 chain','+18% damage','-16% cooldown','+1 chain','+25% range'],rail:['+1 pierce','+24% damage','-16% cooldown','+1 projectile','+2 pierce'],nova:['+18% radius','+22% damage','-16% cooldown','double pulse','+24% damage'],mine:['+1 active mine','+25% damage','-16% cooldown','+22% radius','+1 active mine'],beam:['+1 pierce','+20% damage','-16% cooldown','+1 beam','+28% damage']};return t[id]?.[Math.max(0,l-2)]||'Maximum level'}
function tryEvolutions(){const evolved=[];for(const [id,w] of Object.entries(state.weapons)){const m=WEAPON_META[id];if(w.evolved||w.level<6||(state.passives[m.req]||0)<4)continue;w.evolved=true;state.evolutions++;if(!save.discoveredEvolutions.includes(id)){save.discoveredEvolutions.push(id);persist(false)}state.score+=420*state.diff.score*(state.contract?.score||1);state.newUnlocks.push(`${m.evo} evolution`);evolved.push(m.evo)}if(evolved.length){AUDIO.sfx('evolve');addShake(5);flashWrap();enqueueCeremony('SYSTEM COMPATIBILITY DETECTED',evolved.join(' / '),680,()=>{AUDIO.sfx('evolve');flashWrap()},'evolution')}checkSynergies();return evolved}
function buildOffers(){
  const offers=[];
  for(const [id,w] of Object.entries(state.weapons))if(w.level<6){const m=WEAPON_META[id];offers.push({key:`w:${id}`,weight:3.35,kind:'WEAPON',name:m.name,lvl:`LV ${w.level} → ${w.level+1}`,desc:weaponLevelDesc(id,w.level+1),evo:`Evolution: ${m.evo} + ${PASSIVES[m.req].name} LV 4`,apply:()=>w.level++})}
  if(Object.keys(state.weapons).length<5)for(const [id,m] of Object.entries(WEAPON_META))if(!state.weapons[id])offers.push({key:`new:${id}`,weight:1.65,kind:'NEW WEAPON',name:m.name,lvl:'LV 1',desc:m.desc,evo:`Evolution requires ${PASSIVES[m.req].name} LV 4`,apply:()=>addWeapon(id)});
  for(const [id,m] of Object.entries(PASSIVES)){const l=state.passives[id]||0;if(l>=m.max)continue;if(id==='iff'&&state.level<5)continue;offers.push({key:`p:${id}`,weight:id==='iff'?.58:2.05,kind:id==='iff'?'RARE SYSTEM':'MODULE',name:m.name,lvl:`LV ${l} → ${l+1}`,desc:m.desc(l+1),evo:id==='iff'?'Boss and elite signatures resist conversion.':'',apply:()=>{state.passives[id]=l+1;m.apply(l+1)}})}
  if(state.level>=9&&Object.keys(state.protocols).length<2)for(const [id,m] of Object.entries(PROTOCOLS))if(!state.protocols[id])offers.push({key:`proto:${id}`,weight:.36,kind:'VOLATILE PROTOCOL',name:m.name,lvl:'ONE-TIME',desc:m.desc,evo:'Permanent risk/reward modifier for this run.',apply:()=>{state.protocols[id]=true;m.apply();AUDIO.sfx('overdrive',2);message(`PROTOCOL INSTALLED\n${m.name}`,900)}});
  if(state.level>=12&&Object.keys(state.artifacts).length<1)for(const [id,m] of Object.entries(ARTIFACTS))if(!state.artifacts[id])offers.push({key:`artifact:${id}`,weight:.10,kind:'ARTIFACT',name:m.name,lvl:'ULTRA-RARE',desc:m.desc,evo:'One artifact maximum per run.',apply:()=>{state.artifacts[id]=true;discoverArtifact(id);m.apply();AUDIO.sfx('artifact');flashWrap();message(`ARTIFACT RECOVERED\n${m.name}`,1200)}});
  if((state.contract?.heal??1)>0)offers.push({key:'repair',weight:state.p.hp<state.p.maxHp*.48?.72:.035,kind:'UTILITY',name:'FIELD REPAIR',lvl:'INSTANT',desc:'Restore 16% maximum hull.',evo:'',apply:()=>state.p.hp=Math.min(state.p.maxHp,state.p.hp+state.p.maxHp*.16*(state.contract?.heal??1))});
  return weighted(offers,3)
}
function openLevel(){state.choosing=true;state.paused=true;AUDIO.sfx('level');show('levelScreen');renderOffers()}
function renderOffers(){const offers=buildOffers();const c=$('choices');c.innerHTML='';offers.forEach((o,i)=>{const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="kind">${o.kind}</span><span class="name">[${i+1}] ${o.name}</span> <span class="lvl">${o.lvl}</span><span class="desc">${o.desc}</span>${o.evo?`<span class="evo">${o.evo}</span>`:''}`;b.onclick=()=>selectOffer(o);c.appendChild(b)});state.currentOffers=offers;$('rerollInfo').textContent=`REROLLS ${state.rerolls} · SKIPS ${state.skips}`;$('rerollBtn').disabled=state.rerolls<=0;$('skipBtn').disabled=state.skips<=0;$('levelMeta').textContent=`LEVEL ${state.level}`}
function selectOffer(o){AUDIO.sfx('select');o.apply();tryEvolutions();checkSynergies();hide('levelScreen');state.choosing=false;state.paused=false;state.last=performance.now();processCeremony()}
$('rerollBtn').onclick=()=>{if(state.rerolls>0){state.rerolls--;AUDIO.sfx('reroll');renderOffers()}};
$('skipBtn').onclick=()=>{if(state.skips<=0)return;state.skips--;runCredit(3);state.score+=40;AUDIO.sfx('ui');hide('levelScreen');state.choosing=false;state.paused=false;state.last=performance.now();message('SALVAGE +3 CR',500)};
addEventListener('keydown',e=>{if(!state?.choosing)return;const i=Number(e.key)-1;if(i>=0&&i<state.currentOffers.length)selectOffer(state.currentOffers[i])});

// ---------- RUN START / SPAWNING ----------
function startRun(){
  const frame=SHIPS[save.selected],diff=DIFFICULTIES[save.difficulty]||DIFFICULTIES.STANDARD,contract=CONTRACTS[save.contract]||CONTRACTS.NONE,now=performance.now(),mastery=masteryLevel(save.selected);
  const p={x:W/2,y:H/2,r:10,baseSpeed:frame.speed,speed:frame.speed,baseHp:frame.hp,maxHp:frame.hp,hp:frame.hp,frame:save.selected,baseArmor:frame.armor,moduleArmor:0,baseDamageMul:frame.damage,damageMul:frame.damage,baseCooldownMul:1/frame.fire,cooldownMul:1/frame.fire,projectileMul:1,baseCrit:frame.crit,crit:frame.crit,critDamageBonus:0,magnet:78,baseMagnet:78,convertChance:0,allyCap:0,allyLifeMul:1,allyDamageMul:1,allyFireMul:1,allyExplosion:0,areaMul:1,specialMul:1,extraProjectiles:0,hitFlash:0,iFrames:0,incomingMul:1,scoreMul:1,creditMul:1,cacheLuck:0,grazeRadius:13,blackBox:false,grazeOverclock:false,deadReckoning:false};
  applyResearchToPlayer(p);p.baseSpeed*=contract.playerSpeed||1;p.speed=p.baseSpeed;p.baseHp*=contract.hull||1;p.maxHp=p.baseHp;p.hp=p.maxHp;p.baseCrit+=contract.crit||0;p.crit=p.baseCrit;p.cacheLuck+=contract.cacheLuck||0;
  state={mode:'run',diff,contract,contractId:save.contract,difficulty:save.difficulty,time:0,last:now,paused:false,choosing:false,ceremony:false,ceremonyQueue:[],gameOver:false,victory:false,revived:false,finalizing:false,runCredits:0,kills:0,score:0,spawnT:0,eliteT:30,bossStage:0,level:1,xp:0,xpNeed:8,rerolls:1+(save.research.reroll||0)+(mastery>=4?1:0),skips:1+(mastery>=2?1:0),currentOffers:[],runCounted:false,accountedKills:0,accountedCredits:0,threat:1,chain:0,chainBest:0,chainTimer:0,nextBounty:65,bounty:null,nextAnomaly:115,nextSecret:145+Math.random()*45,redline:false,overdrive:0,driveTier:0,grazeChain:0,grazeBest:0,grazeTimer:0,grazes:0,cachesOpened:0,conversions:0,evolutions:0,damageDealt:0,damageTaken:0,bossesKilled:0,flawlessBosses:0,secretEvents:0,weaponDamage:{},noHit:true,newUnlocks:[],protocols:{},artifacts:{},synergies:{},hitStop:0,critFxCooldown:0,surgeUntil:0,p,passives:{},weapons:{},enemies:[],bullets:[],enemyBullets:[],orbs:[],caches:[],mines:[],allies:[],particles:[],arcs:[],beams:[],shake:0,stars:Array.from({length:110},()=>({x:Math.random()*W,y:Math.random()*H,z:1+Math.random()*2}))};
  if(frame.startPassive){state.passives[frame.startPassive]=1;PASSIVES[frame.startPassive].apply(1)}
  addWeapon(frame.weapon);checkSynergies();AUDIO.ensure();AUDIO.resetMusic();AUDIO.sfx('start');hideAll();hud.classList.remove('hidden');message(`ORBIT//04\n${frame.name} · ${diff.name}${save.contract!=='NONE'?` · ${contract.name}`:''}`,1050);checkMetaAchievements();
}
$('startBtn').onclick=startRun;
function gainXp(n){state.xp+=xpGain(n);while(state.xp>=state.xpNeed&&!state.choosing){state.xp-=state.xpNeed;state.level++;state.xpNeed=Math.floor(state.xpNeed*1.22+3);save.stats.highestLevel=Math.max(save.stats.highestLevel,state.level);openLevel();break}}
function enemyBase(type){return {scout:{hp:24,speed:52,r:9,damage:13,xp:1,color:'#ee6687'},charger:{hp:42,speed:89,r:8,damage:17,xp:2,color:'#ffd06d'},tank:{hp:118,speed:31,r:15,damage:26,xp:3,color:'#ff8b67'},gunner:{hp:58,speed:39,r:11,damage:14,xp:3,color:'#b884ff'},splitter:{hp:66,speed:46,r:12,damage:18,xp:3,color:'#f59ad7'},sniper:{hp:48,speed:30,r:10,damage:12,xp:4,color:'#76a8ff'}}[type]}
function spawnEnemy(forceType=null,elite=false,at=null){
  const pos=at||edgePos(),t=state.time;let type=forceType||'scout';if(!forceType){const r=Math.random();if(t>210&&r<.12)type='sniper';else if(t>150&&r<.26)type='splitter';else if(t>100&&r<.43)type='gunner';else if(t>55&&r<.65)type='charger';else if(t>25&&r<.79)type='tank'}
  discoverEnemy(type);const b=enemyBase(type),hpScale=(1+t/250)*state.diff.hp*(state.contract?.hp||1),damageScale=(1+Math.min(.80,t/820))*state.diff.damage*(state.contract?.damage||1),speedScale=(1+Math.min(.50,t/720))*state.diff.speed*(state.contract?.speed||1);
  const e={...pos,type,hp:b.hp*hpScale*(elite?3.45:1),maxHp:b.hp*hpScale*(elite?3.45:1),speed:b.speed*speedScale,r:b.r*(elite?1.24:1),damage:b.damage*damageScale*(elite?1.28:1),xp:b.xp*(elite?5:1),color:b.color,elite,boss:false,bounty:false,dead:false,hit:0,shootT:.8+Math.random()*1.2,chargeT:.8+Math.random()*1.8,burst:0};state.enemies.push(e);return e
}
const BOSSES={1:{name:'SENTINEL',hp:2600,speed:28,damage:34,color:'#ff5266'},2:{name:'WARDEN',hp:5200,speed:31,damage:38,color:'#ff6c4d'},3:{name:'NULL CARRIER',hp:8800,speed:34,damage:42,color:'#e65cff'}};
function spawnBoss(stage){AUDIO.sfx('boss');discoverEnemy('boss');const b=BOSSES[stage],pos=edgePos(60),hp=b.hp*state.diff.hp*(state.contract?.hp||1)*(1+state.time/900);state.enemies.push({...pos,type:'boss',hp,maxHp:hp,speed:b.speed*state.diff.speed*(state.contract?.speed||1),r:29+stage*2,damage:b.damage*state.diff.damage*(state.contract?.damage||1),xp:55+stage*18,color:b.color,elite:true,boss:true,bounty:false,bossStage:stage,bossName:b.name,phase:1,dead:false,hit:0,shootT:.55,chargeT:2,pattern:0,spawnT:4,damageAtSpawn:state.damageTaken});addShake(8);message(`WARNING\n${b.name} SIGNATURE`,1500)}
function startBounty(){if(state.bounty||state.bossStage>=3)return;const e=spawnEnemy(null,true);e.bounty=true;e.color='#ffdf70';state.bounty={enemy:e,until:state.time+14};AUDIO.sfx('bounty');message('SIGNAL WINDOW\nELIMINATE TARGET — 14 SEC',1000)}
function triggerAnomaly(){const roll=Math.random();if(roll<.34){message('ANOMALY\nDENSE HOSTILE PACKET',850);for(let i=0;i<8+state.threat;i++)spawnEnemy();spawnEnemy(null,true)}else if(roll<.68){message('ANOMALY\nSALVAGE BURST',850);for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,r=80+Math.random()*100;state.orbs.push({x:clamp(state.p.x+Math.cos(a)*r,20,W-20),y:clamp(state.p.y+Math.sin(a)*r,20,H-20),r:5,val:2,dead:false})}}else{message('ANOMALY\nSIGNAL SURGE — WEAPONS ACCELERATED',900);state.surgeUntil=Math.max(state.surgeUntil,state.time+12);AUDIO.sfx('overdrive',2)}state.nextAnomaly+=105+Math.random()*35}
function triggerSecretEvent(){state.secretEvents++;save.stats.secretEvents++;AUDIO.sfx('secret');const roll=Math.random();if(roll<.25){message('UNKNOWN TRANSMISSION\nLOST ESCORT ACQUIRED',1100);state.allies.push({x:state.p.x+30,y:state.p.y,type:'gunner',elite:true,r:9,life:30,fireT:.1,baseFire:.42,damageMul:1.8,expired:false})}else if(roll<.50){message('UNKNOWN TRANSMISSION\nBLACK BOX CARRIER',1100);const e=spawnEnemy('tank',true);e.secretCache='OMEGA';e.color='#ffffff';e.hp*=1.8;e.maxHp=e.hp;e.damage*=1.25}else if(roll<.75){message('UNKNOWN TRANSMISSION\nMIRROR PACKET',1000);for(let i=0;i<14;i++)spawnEnemy(i%3===0?'charger':'scout')}else{message('UNKNOWN TRANSMISSION\nDERELICT CACHE FIELD',1000);for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2,r=90+Math.random()*120;state.caches.push({x:clamp(state.p.x+Math.cos(a)*r,20,W-20),y:clamp(state.p.y+Math.sin(a)*r,20,H-20),r:7,rarity:i===2?'RARE':'CACHE',life:35,dead:false})}}state.nextSecret+=145+Math.random()*90}
function updatePressure(){const threat=1+Math.floor(state.time/55);if(threat>state.threat){state.threat=threat;AUDIO.sfx('danger');message(`THREAT ${String(threat).padStart(2,'0')}\nHOSTILES ESCALATING`,800)}if(state.time>=state.nextBounty){startBounty();state.nextBounty+=72}if(state.time>=state.nextAnomaly)triggerAnomaly();if(state.time>=state.nextSecret)triggerSecretEvent();if(state.bounty&&state.time>state.bounty.until){const e=state.bounty.enemy;if(e&&!e.dead){e.bounty=false;e.speed*=1.35;e.damage*=1.35;e.color='#ff3f59';AUDIO.sfx('danger');message('SIGNAL LOST\nTARGET ENRAGED',750)}state.bounty=null}}
function spawnWave(dt){state.spawnT-=dt;const base=Math.max(.075,.55-state.time*.00065),interval=base/(state.diff.spawn*(state.contract?.spawn||1));if(state.spawnT<=0){state.spawnT=interval;spawnEnemy();if(state.time>75&&Math.random()<Math.min(.78,state.time/600))spawnEnemy();if(state.time>330&&Math.random()<.28)spawnEnemy()}if(state.time>=state.eliteT){spawnEnemy(null,true);state.eliteT+=30+Math.random()*12}const bossAlive=state.enemies.some(e=>e.boss&&!e.dead);if(state.bossStage===0&&state.time>=240&&!bossAlive){state.bossStage=1;spawnBoss(1)}else if(state.bossStage===1&&state.time>=480&&!bossAlive){state.bossStage=2;spawnBoss(2)}else if(state.bossStage===2&&state.time>=RUN_TARGET&&!bossAlive){state.bossStage=3;spawnBoss(3)}}

// ---------- COMBAT ----------
function fireProjectile(x,y,target,speed,damage,opts={}){if(!target)return;const a=Math.atan2(target.y-y,target.x-x)+(opts.spread||0);state.bullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:opts.r||3,life:opts.life||2,damage,pierce:opts.pierce||0,homing:opts.homing||0,blast:opts.blast||0,color:opts.color||'#a9f4ff',weaponId:opts.weaponId||'unknown'})}
function weaponPulse(w,dt){w.timer-=dt;if(w.timer>0)return;const target=nearest(state.p);if(!target)return;const l=w.level,e=w.evolved,shots=(l>=3?2:1)+(l>=6?1:0)+(e?2:0)+(state.synergies.pulseLoop?1:0)+state.p.extraProjectiles,cd=.43*(l>=4?.86:1)*(e?.70:1)*state.p.cooldownMul,damage=16*(1+(l-1)*.18)*(e?1.38:1)*state.p.damageMul,pierce=(l>=5?1:0)+(e?2:0);w.timer=cd;AUDIO.sfx('pulse');for(let i=0;i<shots;i++)fireProjectile(state.p.x,state.p.y,target,455*state.p.projectileMul,critDamage(damage),{spread:(i-(shots-1)/2)*.105,pierce,color:'#8de9ff',weaponId:'pulse'})}
function weaponMissile(w,dt){w.timer-=dt;if(w.timer>0)return;const target=nearest(state.p);if(!target)return;const l=w.level,e=w.evolved,n=(l>=3?2:1)+(l>=6?1:0)+(e?2:0)+state.p.extraProjectiles,damage=30*(1+(l-1)*.21)*(e?1.34:1)*state.p.damageMul;w.timer=.96*(l>=4?.84:1)*(e?.70:1)*state.p.cooldownMul;AUDIO.sfx('missile');for(let i=0;i<n;i++)fireProjectile(state.p.x,state.p.y,target,265*state.p.projectileMul,critDamage(damage),{spread:(i-(n-1)/2)*.17,homing:e?5.3:3.2,blast:(l>=5?26:10)*state.p.areaMul,r:4,color:'#ffd27a',weaponId:'missile'})}
function dronePositions(w){const n=1+(w.level>=2?1:0)+(w.level>=5?1:0)+(w.evolved?2:0),arr=[];for(let i=0;i<n;i++){const a=state.time*(w.evolved?1.75:1.15)+(i/n)*Math.PI*2;arr.push({x:state.p.x+Math.cos(a)*36,y:state.p.y+Math.sin(a)*36})}return arr}
function weaponDrone(w,dt){w.timer-=dt;w.aux=(w.aux||0)-dt;if(w.timer>0)return;const target=nearest(state.p);if(!target)return;w.timer=.73*(w.level>=4?.84:1)*(w.evolved?.68:1)*state.p.cooldownMul;const dmg=10*(1+(w.level-1)*.18)*(w.evolved?1.48:1)*state.p.damageMul;AUDIO.sfx('drone');for(const d of dronePositions(w)){fireProjectile(d.x,d.y,target,395*state.p.projectileMul,critDamage(dmg),{color:'#8dffd6',weaponId:'drone'});if(state.synergies.hunterWing&&w.aux<=0)fireProjectile(d.x,d.y,target,285*state.p.projectileMul,dmg*.85,{homing:4.6,blast:14*state.p.areaMul,r:3,color:'#ffd27a',weaponId:'hunter-wing'})}if(state.synergies.hunterWing&&w.aux<=0){w.aux=1.45;AUDIO.sfx('missile')}}
function weaponArc(w,dt){w.timer-=dt;if(w.timer>0)return;const first=nearest(state.p);if(!first)return;const l=w.level,e=w.evolved;w.timer=1.06*(l>=4?.84:1)*(e?.68:1)*state.p.cooldownMul;const chains=1+(l>=2?1:0)+(l>=5?1:0)+(e?3:0),range=135*(l>=6?1.25:1)*state.p.areaMul,dmg=22*(1+(l-1)*.17)*(e?1.42:1)*state.p.damageMul;AUDIO.sfx('arc');let from={x:state.p.x,y:state.p.y},used=new Set();for(let i=0;i<chains;i++){let target=null,bd=range*range;for(const x of state.enemies){if(x.dead||used.has(x))continue;const d=dist2(from,x);if(d<bd){bd=d;target=x}}if(!target)break;used.add(target);damageEnemy(target,critDamage(dmg),false,'arc');state.arcs.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.1,color:'#9cf7ff'});from=target}}
function weaponRail(w,dt){w.timer-=dt;if(w.timer>0)return;const target=nearest(state.p);if(!target)return;const l=w.level,e=w.evolved,n=(l>=5?2:1)+(e?1:0)+state.p.extraProjectiles,dmg=57*(1+(l-1)*.23)*(e?1.48:1)*state.p.damageMul;w.timer=1.36*(l>=4?.84:1)*(e?.72:1)*state.p.cooldownMul;AUDIO.sfx('rail');for(let i=0;i<n;i++)fireProjectile(state.p.x,state.p.y,target,625*state.p.projectileMul,critDamage(dmg),{spread:(i-(n-1)/2)*.075,pierce:2+(l>=2?1:0)+(l>=6?2:0)+(e?3:0),r:3,color:'#fff',weaponId:'rail'})}
function weaponNova(w,dt){w.timer-=dt;if(w.timer>0)return;const l=w.level,e=w.evolved,radius=(90*(1+(l>=2?.18:0))*(l>=5?1.22:1)*(e?1.35:1))*state.p.areaMul,damage=26*(1+(l-1)*.21)*(e?1.55:1)*state.p.damageMul;w.timer=1.65*(l>=4?.84:1)*(e?.72:1)*state.p.cooldownMul/(state.p.specialMul||1);AUDIO.sfx('nova');const pulses=l>=5?2:1;for(let p=0;p<pulses;p++){setTimeout(()=>{if(!state||state.gameOver)return;for(const x of state.enemies)if(!x.dead&&dist2(state.p,x)<radius*radius)damageEnemy(x,critDamage(damage),false,'nova');state.arcs.push({circle:true,x1:state.p.x,y1:state.p.y,r:radius,life:.16,color:e?'#fff':'#bd9cff'});addShake(2)},p*110)}}
function weaponMine(w,dt){w.timer-=dt;if(w.timer>0)return;const l=w.level,e=w.evolved,max=2+(l>=2?1:0)+(l>=6?1:0)+(e?2:0);w.timer=1.4*(l>=4?.84:1)*(e?.72:1)*state.p.cooldownMul;AUDIO.sfx('mine');state.mines.push({x:state.p.x,y:state.p.y,r:6,life:10,damage:34*(1+(l-1)*.22)*(e?1.48:1)*state.p.damageMul,blast:70*(l>=5?1.22:1)*(e?1.38:1)*state.p.areaMul,weaponId:'mine'});while(state.mines.length>max)state.mines.shift()}
function weaponBeam(w,dt){w.timer-=dt;if(w.timer>0)return;const target=nearest(state.p);if(!target)return;const l=w.level,e=w.evolved,n=(l>=5?2:1)+(e?1:0)+state.p.extraProjectiles,range=500,dmg=38*(1+(l-1)*.20)*(e?1.42:1)*state.p.damageMul;w.timer=.92*(l>=4?.84:1)*(e?.70:1)*state.p.cooldownMul/(state.p.specialMul||1);AUDIO.sfx('beam');const base=Math.atan2(target.y-state.p.y,target.x-state.p.x);for(let q=0;q<n;q++){const a=base+(q-(n-1)/2)*.11,ex=state.p.x+Math.cos(a)*range,ey=state.p.y+Math.sin(a)*range;state.beams.push({x1:state.p.x,y1:state.p.y,x2:ex,y2:ey,life:.1,color:e?'#fff':'#78caff'});const hits=[];for(const x of state.enemies){if(x.dead)continue;const vx=x.x-state.p.x,vy=x.y-state.p.y,along=vx*Math.cos(a)+vy*Math.sin(a),perp=Math.abs(-vx*Math.sin(a)+vy*Math.cos(a));if(along>0&&along<range&&perp<x.r+6)hits.push({e:x,d:along})}hits.sort((A,B)=>A.d-B.d);const cap=2+(l>=2?1:0)+(e?3:0);for(const h of hits.slice(0,cap)){damageEnemy(h.e,critDamage(dmg),false,'beam');if(state.synergies.prismNet){const t=nearest(h.e,x=>x!==h.e&&dist2(h.e,x)<120*120);if(t){state.arcs.push({x1:h.e.x,y1:h.e.y,x2:t.x,y2:t.y,life:.09,color:'#9cf7ff'});damageEnemy(t,dmg*.32,false,'prism-net',false)}}}}}
function updateWeapons(dt){const tier=state.driveTier||0,drive=[1,1.18,1.35,1.55,1.80][tier]||1,surge=state.time<state.surgeUntil?1.25:1,reckon=state.p.deadReckoning&&state.p.hp/state.p.maxHp<=.25?1.35:1;const map={pulse:weaponPulse,missile:weaponMissile,drone:weaponDrone,arc:weaponArc,rail:weaponRail,nova:weaponNova,mine:weaponMine,beam:weaponBeam};for(const [id,w] of Object.entries(state.weapons))map[id]?.(w,dt*drive*surge*reckon)}

function convertEnemy(e){if(e.dead)return;AUDIO.sfx('convert');if(state.bounty?.enemy===e)state.bounty=null;e.dead=true;state.conversions++;save.stats.conversions++;const iff=state.passives.iff||0,life=(14+iff*3)*state.p.allyLifeMul,baseFire=e.type==='sniper'?1.05:e.type==='tank'?.95:e.type==='charger'?.48:e.type==='splitter'?.58:.68;state.allies.push({x:e.x,y:e.y,type:e.type,elite:e.elite,r:Math.max(7,e.r*.7),life,fireT:.12+Math.random()*.25,baseFire,damageMul:e.elite?1.8:1,expired:false});particle(e.x,e.y,'#8dffd6',e.elite?20:12);state.arcs.push({circle:true,x1:e.x,y1:e.y,r:e.elite?34:22,life:.14,color:'#8dffd6'});message(`IFF OVERRIDE\n${e.elite?'ELITE ':''}${ENEMY_META[e.type]?.name||'ALLY'} ACQUIRED`,620);state.score+=30*state.diff.score*(state.contract?.score||1);unlockAchievement('iff_friend')}
function damageEnemy(e,damage,conversionEligible=true,weaponId='unknown',canCrit=true){if(e.dead)return;const iff=state.passives.iff||0,eliteEligible=e.elite&&!e.boss&&iff>=6,conversionOk=conversionEligible&&!e.boss&&(!e.elite||eliteEligible)&&state.p.convertChance>0&&state.allies.length<state.p.allyCap;if(conversionOk){const chance=e.elite?state.p.convertChance*.16:state.p.convertChance;if(Math.random()<chance){convertEnemy(e);return}}const roll=canCrit?criticalRoll(damage):{damage,crit:false},finalDamage=roll.damage,actual=Math.max(0,Math.min(e.hp,finalDamage));e.hp-=finalDamage;e.hit=.07;state.damageDealt+=actual;state.weaponDamage[weaponId]=(state.weaponDamage[weaponId]||0)+actual;particle(e.x,e.y,roll.crit?'#ffffff':'#d8fbff',roll.crit?4:2);if(roll.crit)critFeedback(e,weaponId,finalDamage);if(e.hp<=0)killEnemy(e)}
function eligibleAutoUpgrades(){const a=[];for(const [id,w] of Object.entries(state.weapons))if(w.level<6)a.push(()=>w.level++);for(const [id,m] of Object.entries(PASSIVES)){const l=state.passives[id]||0;if(l<m.max&&id!=='iff')a.push(()=>{state.passives[id]=l+1;m.apply(l+1)})}return a}
function autoUpgrade(times=1){let done=0;for(let i=0;i<times;i++){const pool=eligibleAutoUpgrades();if(!pool.length)break;choice(pool)();done++}tryEvolutions();checkSynergies();return done}
function dropCache(e){if(!e.elite&&!e.secretCache)return;const guaranteed=e.boss||e.bounty||e.secretCache;if(!guaranteed&&Math.random()>.42)return;let roll=Math.max(0,Math.random()-state.p.cacheLuck),rarity=e.secretCache||'CACHE';if(!e.secretCache){if(e.boss){if(roll<.12)rarity='OMEGA';else if(roll<.46)rarity='RARE'}else{if(roll<.025)rarity='OMEGA';else if(roll<.17)rarity='RARE'}}state.caches.push({x:e.x,y:e.y,r:7,rarity,life:28,dead:false})}
function openCache(c){if(c.dead)return;c.dead=true;state.cachesOpened++;const rarity=c.rarity,duration=rarity==='OMEGA'?820:rarity==='RARE'?560:300;enqueueCeremony(`${rarity} DATA`,`DECRYPTING${rarity==='OMEGA'?'... PRIORITY SIGNAL':''}`,duration,()=>{let upgrades=1,credits=5,rerolls=0,heal=0;if(rarity==='RARE'){upgrades=2;credits=14;rerolls=1}else if(rarity==='OMEGA'){upgrades=3;credits=30;rerolls=1;heal=.12;unlockAchievement('omega')}const gained=autoUpgrade(upgrades);runCredit(credits);state.rerolls=Math.min(6,state.rerolls+rerolls);const healMul=state.contract?.heal??1;if(heal&&healMul>0)state.p.hp=Math.min(state.p.maxHp,state.p.hp+state.p.maxHp*heal*healMul);state.score+=(rarity==='OMEGA'?850:rarity==='RARE'?360:140)*state.diff.score*(state.contract?.score||1);AUDIO.sfx(rarity==='OMEGA'?'omega':'cache');addShake(rarity==='OMEGA'?7:3);flashWrap();message(`${rarity} DATA\n${gained} UPGRADE${gained===1?'':'S'} · +${Math.round(credits*state.p.creditMul)} CR${rerolls?' · +1 REROLL':''}`,1050)},'cache')}
function splitEnemy(e){if(e.type!=='splitter'||e.elite||e.boss)return;for(let i=0;i<2;i++){const n=spawnEnemy('scout',false,{x:e.x+(i?8:-8),y:e.y+(Math.random()-.5)*12});n.hp*=.52;n.maxHp=n.hp;n.speed*=1.18;n.xp=.5}}
function enemyDeathFx(e){const n=e.boss?64:e.elite?24:e.type==='tank'?18:e.type==='splitter'?14:8;particle(e.x,e.y,e.boss?'#ffffff':e.color,n);if(e.elite||e.type==='tank')state.arcs.push({circle:true,x1:e.x,y1:e.y,r:e.boss?70:e.elite?34:24,life:e.boss?.24:.12,color:e.boss?'#ffffff':e.color});if(e.type==='tank')for(let i=0;i<3;i++)particle(e.x+(i-1)*8,e.y,e.color,5)}
function killEnemy(e){
  if(e.dead)return;e.dead=true;state.kills++;if(state.kills===1)unlockAchievement('first_blood');splitEnemy(e);
  state.chain=state.chainTimer>0?state.chain+1:1;state.chainTimer=2.15;state.chainBest=Math.max(state.chainBest,state.chain);AUDIO.sfx('kill',state.chain);if(e.elite)AUDIO.sfx('elite');if(state.chain===10||state.chain===25||state.chain%50===0)AUDIO.sfx('streak');
  let tier=0,duration=0;if(state.chain>=200){tier=4;duration=9}else if(state.chain>=100){tier=3;duration=8}else if(state.chain>=60){tier=2;duration=6}else if(state.chain>=25){tier=1;duration=4}const milestone=[25,60,100,200].includes(state.chain)||(state.chain>200&&state.chain%100===0);if(milestone&&tier){state.driveTier=Math.max(state.driveTier,tier);state.overdrive=Math.max(state.overdrive,duration);AUDIO.sfx(tier>=4?'limit':'overdrive',tier);message(`${tier>=4?'SYSTEM LIMITER RELEASED':'OVERDRIVE TIER '+tier}\n${duration} SEC`,700)}if(state.chain>=100)unlockAchievement('chain_100');
  if(state.p.blackBox&&state.chain>0&&state.chain%100===0){state.caches.push({x:e.x,y:e.y,r:7,rarity:'RARE',life:30,dead:false});message('BLACK BOX\nBONUS DATA EMITTED',600)}
  const chainMul=1+Math.min(1.6,Math.floor(state.chain/5)*.10),redlineMul=state.p.hp/state.p.maxHp<=.30?1.25:1;state.score+=(10+e.xp*8+(e.elite?70:0)+(e.boss?500:0))*chainMul*redlineMul*state.p.scoreMul*state.diff.score*(state.contract?.score||1);
  const bountyWin=state.bounty?.enemy===e&&state.time<=state.bounty.until;if(bountyWin){runCredit(14);state.rerolls=Math.min(6,state.rerolls+1);state.score+=360*state.diff.score*(state.contract?.score||1);AUDIO.sfx('bounty');message('SIGNAL CAPTURED\n+SALVAGE · +1 REROLL',780);state.bounty=null;unlockAchievement('signal_capture')}
  if(e.boss){AUDIO.sfx('bossDown');state.hitStop=Math.max(state.hitStop,.12);addShake(10);const flawless=state.damageTaken<=e.damageAtSpawn+.001;if(flawless){state.flawlessBosses++;save.stats.flawlessBosses++;runCredit(20+e.bossStage*8);state.score+=750*e.bossStage*state.diff.score*(state.contract?.score||1);AUDIO.sfx('flawless');toast('FLAWLESS SIGNATURE',`Boss ${e.bossStage} · bonus salvage`);if(e.bossStage<3)state.caches.push({x:e.x+18,y:e.y,r:7,rarity:'RARE',life:30,dead:false})}unlockAchievement('first_boss')}
  dropCache(e);state.orbs.push({x:e.x,y:e.y,r:e.boss?8:4,val:e.xp*(bountyWin?2:1),dead:false});enemyDeathFx(e);
  if(e.elite){runCredit(e.boss?38:7);if(e.boss)state.bossesKilled++}
  if(e.boss&&e.bossStage===3&&!state.finalizing){state.finalizing=true;state.p.iFrames=999;if(TEST_MODE)finishRun(true);else{message('NULL CARRIER\nSIGNATURE COLLAPSE',700);setTimeout(()=>{if(state&&!state.gameOver)finishRun(true)},650)}}
}
function updateBossPhase(e){if(!e.boss||e.dead)return;const ratio=e.hp/e.maxHp,next=ratio<=.35?3:ratio<=.70?2:1;if(next<=e.phase)return;e.phase=next;e.shootT=.18;AUDIO.sfx('phase');addShake(6);particle(e.x,e.y,'#ffffff',22);state.arcs.push({circle:true,x1:e.x,y1:e.y,r:52+next*10,life:.18,color:e.color});message(`PHASE SHIFT\n${e.bossName} — PHASE ${next}`,850);if(next===3)for(let i=0;i<2;i++)spawnEnemy(i?'charger':'gunner',false,{x:e.x+(i?45:-45),y:e.y+20})}
function enemyShoot(e){AUDIO.sfx('enemyShot');const a=Math.atan2(state.p.y-e.y,state.p.x-e.x);if(e.boss){e.pattern=(e.pattern+1)%3;const stage=e.bossStage,phase=e.phase||1;if(e.pattern===0){const n=8+stage*3+(phase-1)*2;for(let i=0;i<n;i++){const aa=(i/n)*Math.PI*2+state.time*.22;state.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*(155+stage*12),vy:Math.sin(aa)*(155+stage*12+phase*8),r:4,damage:(11+stage*2+phase)*state.diff.damage*(state.contract?.damage||1),life:4,grazed:false})}}else if(e.pattern===1){for(let i=-1-(phase>=3?1:0);i<=1+(phase>=3?1:0);i++){const aa=a+i*.16;state.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*(205+stage*15+phase*8),vy:Math.sin(aa)*(205+stage*15+phase*8),r:4,damage:(13+stage*2+phase)*state.diff.damage*(state.contract?.damage||1),life:4,grazed:false})}}else if(stage>=2||phase>=2){for(let i=0;i<6;i++){const aa=(i/6)*Math.PI*2-state.time*.15;state.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*205,vy:Math.sin(aa)*205,r:3,damage:(10+stage+phase)*state.diff.damage*(state.contract?.damage||1),life:4,grazed:false})}}return}
  const speed=(e.type==='sniper'?300:195)*(state.contract?.speed||1),damage=(e.type==='sniper'?15:10)*state.diff.damage*(state.contract?.damage||1);state.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:e.type==='sniper'?3:3,damage,life:4,grazed:false})
}
function allyShoot(a){const target=nearest(a);if(!target)return;const dmg=10*state.p.damageMul*state.p.allyDamageMul*(a.damageMul||1),type=a.type||'scout';if(type==='tank')fireProjectile(a.x,a.y,target,310,dmg*1.8,{r:4,pierce:1,color:'#8dffd6',weaponId:'ally'});else if(type==='sniper')fireProjectile(a.x,a.y,target,650,dmg*1.7,{r:2,pierce:2,color:'#ffffff',weaponId:'ally'});else if(type==='splitter'){fireProjectile(a.x,a.y,target,430,dmg*.9,{spread:-.08,color:'#8dffd6',weaponId:'ally'});fireProjectile(a.x,a.y,target,430,dmg*.9,{spread:.08,color:'#8dffd6',weaponId:'ally'})}else fireProjectile(a.x,a.y,target,type==='charger'?520:400,dmg,{color:'#8dffd6',weaponId:'ally'});if(state.synergies.stormIff){const t=nearest(target,x=>x!==target&&dist2(target,x)<125*125);if(t){state.arcs.push({x1:target.x,y1:target.y,x2:t.x,y2:t.y,life:.09,color:'#8dffd6'});damageEnemy(t,dmg*.45,false,'storm-iff',false)}}}
function hitPlayer(dmg){const p=state.p;if(p.iFrames>0)return;AUDIO.sfx('hit');const mit=clamp(p.baseArmor+p.moduleArmor,0,.45),actual=dmg*(1-mit)*p.incomingMul;p.hp-=actual;p.hitFlash=.16;p.iFrames=.36;state.damageTaken+=actual;state.noHit=false;state.chain=0;state.chainTimer=0;state.grazeChain=0;state.grazeTimer=0;state.overdrive=0;state.driveTier=0;addShake(7);if(p.hp<=0)finishRun(false)}

// ---------- UPDATE ----------
function update(dt){
  if(!state||state.mode!=='run'||state.paused)return;
  if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return}
  state.time+=dt;state.shake=Math.max(0,state.shake-dt*18);state.critFxCooldown=Math.max(0,state.critFxCooldown-dt);const p=state.p;state.overdrive=Math.max(0,state.overdrive-dt);if(state.overdrive<=0)state.driveTier=0;p.hitFlash=Math.max(0,p.hitFlash-dt);p.iFrames=Math.max(0,p.iFrames-dt);state.chainTimer=Math.max(0,state.chainTimer-dt);if(state.chainTimer<=0)state.chain=0;state.grazeTimer=Math.max(0,state.grazeTimer-dt);if(state.grazeTimer<=0)state.grazeChain=0;
  const redline=p.hp/p.maxHp<=.30;if(redline&&!state.redline){state.redline=true;AUDIO.sfx('danger');message('REDLINE\nCRIT +8% · SCORE +25%',700)}else if(!redline)state.redline=false;const bossActive=state.enemies.some(e=>e.boss&&!e.dead);AUDIO.music(state.time,{boss:bossActive,drive:state.driveTier,threat:state.threat,redline});
  const chainMul=1+Math.min(1.6,Math.floor(state.chain/5)*.10);state.score+=dt*(1+state.level*.10)*chainMul*(redline?1.25:1)*state.p.scoreMul*state.diff.score*(state.contract?.score||1);updatePressure();
  const input=moveInput();let dx=input.dx,dy=input.dy;if(dx||dy){const l=Math.hypot(dx,dy),driveSpeed=[1,1.08,1.12,1.16,1.20][state.driveTier]||1;p.x+=dx/l*p.speed*driveSpeed*dt;p.y+=dy/l*p.speed*driveSpeed*dt}p.x=clamp(p.x,14,W-14);p.y=clamp(p.y,14,H-14);
  spawnWave(dt);updateWeapons(dt);
  for(const s of state.stars){s.y+=7*s.z*dt;if(s.y>H){s.y=0;s.x=Math.random()*W}}
  for(const b of state.bullets){if(b.homing){const t=nearest(b);if(t){const speed=Math.hypot(b.vx,b.vy),want=Math.atan2(t.y-b.y,t.x-b.x),cur=Math.atan2(b.vy,b.vx),delta=Math.atan2(Math.sin(want-cur),Math.cos(want-cur));const aa=cur+clamp(delta,-b.homing*dt,b.homing*dt);b.vx=Math.cos(aa)*speed;b.vy=Math.sin(aa)*speed}}b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}
  for(const e of state.enemies){
    if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);if(e.boss)updateBossPhase(e);const a=Math.atan2(p.y-e.y,p.x-e.x);let speed=e.speed;
    if(e.type==='charger'){e.chargeT-=dt;if(e.chargeT<=0){e.chargeT=2.1;e.burst=.58}if(e.burst>0){e.burst-=dt;speed*=2.15}}
    if(e.type==='sniper'){const d=Math.sqrt(dist2(e,p));if(d<230)speed*=-.55;else if(d>360)speed*=1.1;else speed=0}
    if(e.boss) speed*=1+(e.phase-1)*.08;e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;
    if(e.type==='gunner'||e.type==='sniper'||e.boss){e.shootT-=dt;if(e.shootT<=0){enemyShoot(e);e.shootT=e.boss?Math.max(.28,.76-e.bossStage*.08-(e.phase-1)*.10):(e.type==='sniper'?1.9:1.45)}}
    if(e.boss&&e.bossStage===3){e.spawnT-=dt;if(e.spawnT<=0){e.spawnT=e.phase>=3?3.0:4.2;for(let i=0;i<(e.phase>=3?5:3);i++)spawnEnemy(i===0?'gunner':i===1?'charger':'scout',false,{x:e.x+(Math.random()-.5)*60,y:e.y+(Math.random()-.5)*60})}}
    if(dist2(e,p)<(e.r+p.r)*(e.r+p.r)){hitPlayer(e.damage);e.x-=Math.cos(a)*45;e.y-=Math.sin(a)*45}
  }
  for(const b of state.bullets){if(b.life<=0)continue;for(const e of state.enemies){if(e.dead)continue;if(dist2(b,e)<(b.r+e.r)*(b.r+e.r)){damageEnemy(e,b.damage,true,b.weaponId);if(b.blast>0){for(const x of state.enemies)if(!x.dead&&x!==e&&dist2(e,x)<b.blast*b.blast)damageEnemy(x,b.damage*.42,false,b.weaponId)}if(b.pierce>0)b.pierce--;else{b.life=0;break}}}}
  for(const m of state.mines){m.life-=dt;let target=null;for(const e of state.enemies){if(!e.dead&&dist2(m,e)<45*45){target=e;break}}if(target){m.life=0;AUDIO.sfx('mine');addShake(state.synergies.gravityPulse?5:3);state.arcs.push({circle:true,x1:m.x,y1:m.y,r:m.blast,life:.12,color:'#bd9cff'});for(const e of state.enemies)if(!e.dead&&dist2(m,e)<m.blast*m.blast)damageEnemy(e,critDamage(m.damage),false,'mine');if(state.synergies.gravityPulse){const r=m.blast*1.5;state.arcs.push({circle:true,x1:m.x,y1:m.y,r,life:.18,color:'#ffffff'});for(const e of state.enemies)if(!e.dead&&dist2(m,e)<r*r)damageEnemy(e,m.damage*.34,false,'gravity-pulse',false)}}}
  for(const b of state.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;const d2=dist2(b,p);if(d2<(b.r+p.r)*(b.r+p.r)){b.life=0;hitPlayer(b.damage)}else if(!b.grazed&&d2<(b.r+p.r+p.grazeRadius)*(b.r+p.r+p.grazeRadius)){b.grazed=true;state.grazes++;state.grazeChain=state.grazeTimer>0?state.grazeChain+1:1;state.grazeTimer=1.15;state.grazeBest=Math.max(state.grazeBest,state.grazeChain);const gMul=1+Math.min(2,state.grazeChain*.08);state.score+=14*gMul*state.p.scoreMul*state.diff.score*(state.contract?.score||1);state.chainTimer=Math.max(state.chainTimer,.65);AUDIO.sfx('graze');const milestone=state.grazeChain===3?1:state.grazeChain===7?2:state.grazeChain===12?3:0;if(milestone){AUDIO.sfx('grazeTier',milestone);message(milestone===1?'CLOSE':milestone===2?'DANGER':'INSANE GRAZE',420)}if(state.p.grazeOverclock&&state.grazeChain>=5)for(const w of Object.values(state.weapons))w.timer=Math.max(0,w.timer-.10);if(state.grazes>=25)unlockAchievement('graze_25')}}
  for(const o of state.orbs){const d=Math.hypot(p.x-o.x,p.y-o.y);if(d<p.magnet){const sp=135+(p.magnet-d)*4;o.x+=(p.x-o.x)/Math.max(1,d)*sp*dt;o.y+=(p.y-o.y)/Math.max(1,d)*sp*dt}if(d<p.r+o.r+5){o.dead=true;AUDIO.sfx('pickup');gainXp(o.val)}}
  for(const c of state.caches){c.life-=dt;const d=Math.hypot(p.x-c.x,p.y-c.y);if(d<p.magnet*1.3){const sp=105+(p.magnet-d)*3;c.x+=(p.x-c.x)/Math.max(1,d)*sp*dt;c.y+=(p.y-c.y)/Math.max(1,d)*sp*dt}if(d<p.r+c.r+7)openCache(c)}
  for(const a of state.allies){a.life-=dt;if(a.life<=0&&!a.expired){a.expired=true;if(state.p.allyExplosion>0){const r=65+state.p.allyExplosion*20,damage=30*state.p.damageMul*state.p.allyExplosion;AUDIO.sfx('nova');state.arcs.push({circle:true,x1:a.x,y1:a.y,r,life:.16,color:'#8dffd6'});for(const e of state.enemies)if(!e.dead&&dist2(a,e)<r*r)damageEnemy(e,damage,false,'scuttle',false)}}const target=nearest(a);if(target){const ang=Math.atan2(target.y-a.y,target.x-a.x);a.x+=Math.cos(ang)*(a.type==='charger'?72:48)*dt;a.y+=Math.sin(ang)*(a.type==='charger'?72:48)*dt}a.fireT-=dt;if(a.fireT<=0){a.fireT=(a.baseFire||.72)/state.p.allyFireMul;allyShoot(a)}}
  for(const q of state.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;q.life-=dt}for(const a of state.arcs)a.life-=dt;for(const b of state.beams)b.life-=dt;
  state.enemies=state.enemies.filter(e=>!e.dead);state.bullets=state.bullets.filter(b=>b.life>0&&b.x>-60&&b.x<W+60&&b.y>-60&&b.y<H+60);state.enemyBullets=state.enemyBullets.filter(b=>b.life>0&&b.x>-60&&b.x<W+60&&b.y>-60&&b.y<H+60);state.orbs=state.orbs.filter(o=>!o.dead);state.caches=state.caches.filter(c=>!c.dead&&c.life>0);state.mines=state.mines.filter(m=>m.life>0);state.allies=state.allies.filter(a=>a.life>0);state.particles=state.particles.filter(q=>q.life>0);state.arcs=state.arcs.filter(a=>a.life>0);state.beams=state.beams.filter(b=>b.life>0);
}

// ---------- PAUSE / RUN END ----------
function pause(on=true){if(!state||state.choosing||state.ceremony||state.gameOver)return;AUDIO.sfx(on?'pause':'resume');state.paused=on;if(on)show('pauseScreen');else hide('pauseScreen');if(!on)state.last=performance.now()}
function togglePause(){pause(!state.paused)}$('resumeBtn').onclick=()=>pause(false);$('menuBtn').onclick=()=>{if(confirm('Abort this run? Current run rewards will be banked, but the run counts as a loss.'))finishRun(false,true)};
function runGrade(){const ratio=state.score/(state.difficulty==='BLACKOUT'?125000:state.difficulty==='HARDLINE'?95000:70000);if(state.victory&&ratio>=1.25)return'S';if(state.victory&&ratio>=.85)return'A';if(state.victory)return'B';if(state.time>=480)return'C';return'D'}
function finishRun(victory,aborted=false){
  if(state.gameOver)return;AUDIO.sfx(victory?'victory':'death');state.gameOver=true;state.paused=true;state.victory=victory;state.aborted=aborted;
  if(!state.runCounted){save.runs++;state.runCounted=true}save.totalKills+=Math.max(0,state.kills-state.accountedKills);state.accountedKills=state.kills;save.credits+=Math.max(0,state.runCredits-state.accountedCredits);state.accountedCredits=state.runCredits;save.bestScore=Math.max(save.bestScore,Math.floor(state.score));save.bestTime=Math.max(save.bestTime,Math.floor(state.time));save.stats.totalDamage+=state.damageDealt;save.stats.damageTaken+=state.damageTaken;save.stats.bosses+=state.bossesKilled;save.stats.bestChain=Math.max(save.stats.bestChain,state.chainBest);save.stats.bestGrazeChain=Math.max(save.stats.bestGrazeChain,state.grazeBest);save.stats.totalGrazes+=state.grazes;save.stats.playTime+=state.time;save.stats.caches+=state.cachesOpened;save.stats.highestLevel=Math.max(save.stats.highestLevel,state.level);
  const masteryBefore=masteryLevel(state.p.frame),masteryGain=masteryGainForRun();save.shipMastery[state.p.frame]=(save.shipMastery[state.p.frame]||0)+masteryGain;const masteryAfter=masteryLevel(state.p.frame);state.newUnlocks.unshift(`${SHIPS[state.p.frame].name} MASTERY +${masteryGain} · M${masteryAfter}`);if(masteryAfter>masteryBefore)state.newUnlocks.unshift(`FRAME MASTERY M${masteryAfter} REACHED${masteryAfter===2?' · +1 STARTING SKIP':masteryAfter===4?' · +1 STARTING REROLL':masteryAfter===5?' · FRAME MASTERED':''}`);
  if(victory){save.stats.clears++;if(state.difficulty==='HARDLINE')save.stats.hardlineClears++;if(state.difficulty==='BLACKOUT')save.stats.blackoutClears++;if(state.difficulty==='STANDARD')unlockAchievement('standard_clear');if(state.difficulty==='HARDLINE')unlockAchievement('hardline_clear');if(!state.revived)unlockAchievement('no_revive');if(state.damageTaken<40)unlockAchievement('untouchable')}
  if(state.score>=100000)unlockAchievement('score_100k');checkMetaAchievements();PLATFORM.setStat('best_score',save.bestScore);
  const missingEvos=Object.keys(WEAPON_META).filter(id=>!save.discoveredEvolutions.includes(id)).length;if(missingEvos)state.newUnlocks.push(`${missingEvos} EVOLUTION${missingEvos===1?'':'S'} STILL UNDISCOVERED`);const locked=Object.entries(SHIPS).filter(([id])=>!save.unlocked.includes(id)).map(([id,x])=>[id,x,id==='oracle'&&save.achievements.includes('iff_friend')?Math.floor(x.cost*.7):x.cost]).sort((a,b)=>a[2]-b[2]);if(locked.length){const [id,x,cost]=locked[0];state.newUnlocks.push(`NEXT FRAME — ${x.name} · ${Math.max(0,cost-save.credits)} CR REMAINING`)}else if(masteryAfter<5)state.newUnlocks.push(`NEXT MASTERY — ${SHIPS[state.p.frame].name} · ${Math.max(0,MASTERY_THRESHOLDS[masteryAfter+1]-(save.shipMastery[state.p.frame]||0))} XP`);persist(false);
  $('gameOverTitle').textContent=aborted?'RUN ABORTED':victory?'SIGNAL CLEARED':'FRAME LOST';$('gameOverSubtitle').textContent=victory?`${state.difficulty}${state.contractId!=='NONE'?` · ${state.contract.name}`:''} COMPLETE`:aborted?'TRANSMISSION CLOSED':'TRANSMISSION ENDED';$('gradeText').textContent=runGrade();
  const topWeapon=Object.entries(state.weaponDamage).sort((a,b)=>b[1]-a[1])[0],topName=topWeapon?(WEAPON_META[topWeapon[0]]?.name||topWeapon[0].toUpperCase()):'NONE',artifact=Object.keys(state.artifacts)[0];
  $('gameOverStats').innerHTML=`<div class="metric"><b>${fmtTime(state.time)}</b><span>TIME</span></div><div class="metric"><b>${state.level}</b><span>LEVEL</span></div><div class="metric"><b>${state.kills}</b><span>KILLS</span></div><div class="metric"><b>${state.chainBest}</b><span>BEST CHAIN</span></div><div class="metric"><b>${state.grazeBest}</b><span>GRAZE STREAK</span></div><div class="metric"><b>${Math.floor(state.damageDealt)}</b><span>DAMAGE</span></div><div class="metric"><b>${Math.floor(state.damageTaken)}</b><span>DAMAGE TAKEN</span></div><div class="metric"><b>${state.flawlessBosses}</b><span>FLAWLESS BOSSES</span></div><div class="metric"><b>${state.evolutions}</b><span>EVOLUTIONS</span></div><div class="metric"><b>${Object.keys(state.synergies).length}</b><span>SYNERGIES</span></div><div class="metric"><b>${artifact?ARTIFACTS[artifact].name:'NONE'}</b><span>ARTIFACT</span></div><div class="metric"><b>${topName}</b><span>TOP SYSTEM</span></div><div class="metric"><b>${Math.floor(state.score)}</b><span>SCORE</span></div><div class="metric"><b>+${state.runCredits}</b><span>CREDITS</span></div><div class="metric"><b>M${masteryAfter}</b><span>FRAME MASTERY</span></div><div class="metric"><b>${state.cachesOpened}</b><span>CACHES</span></div>`;
  $('runUnlocks').innerHTML=state.newUnlocks.map(x=>`<div class="unlockItem">${x}</div>`).join('');$('reviveBtn').disabled=state.revived||victory||aborted||save.credits<120;hideAll('gameOverScreen');show('gameOverScreen');hud.classList.add('hidden');renderMenu();
}
$('retryBtn').onclick=async()=>{await MONETIZATION.interstitial('retry');startRun()};$('gameOverMenuBtn').onclick=()=>toMenu();
$('reviveBtn').onclick=()=>{if(save.credits<120||state.revived||state.victory)return;save.credits-=120;state.revived=true;state.gameOver=false;state.paused=false;state.p.hp=state.p.maxHp*.32;state.p.iFrames=1.35;state.chain=0;state.chainTimer=0;state.enemies=state.enemies.filter(e=>e.boss||dist2(e,state.p)>110*110);persist(false);hide('gameOverScreen');hud.classList.remove('hidden');state.last=performance.now();AUDIO.sfx('revive');message('FRAME RESTORED\n32% HULL',850)};
function toMenu(){if(state){state.mode='menu';state.paused=true}hud.classList.add('hidden');bossBar.classList.add('hidden');hideAll('titleScreen');show('titleScreen');centerMessage.textContent='';renderMenu()}

// ---------- DRAW ----------
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawShip(x,y,color='#d9f5ff',scale=1,angle=-Math.PI/2,variant='striker'){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle+Math.PI/2);const wing=variant==='bastion'||variant==='bulwark'?11:8;px(-3*scale,-10*scale,6*scale,18*scale,color);px(-wing*scale,-2*scale,wing*2*scale,7*scale,variant==='oracle'?'#6f8ca0':'#6595a8');px((-wing-3)*scale,3*scale,5*scale,6*scale,'#355667');px((wing-2)*scale,3*scale,5*scale,6*scale,'#355667');px(-2*scale,9*scale,4*scale,4*scale,'#ffd27a');if(variant==='vector')px(-1*scale,-14*scale,2*scale,5*scale,'#bd9cff');ctx.restore()}
function drawHostile(e){ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));const ang=Math.atan2(state.p.y-e.y,state.p.x-e.x);ctx.rotate(ang);const r=e.r,c=e.hit?'#fff':e.color;if(e.type==='tank'){px(-r,-r*.55,r*2,r*1.1,c);px(-4,-r,8,r*2,'#8c4f49')}else if(e.type==='splitter'){px(-r,-4,r*2,8,c);px(-5,-r,10,r*2,c);px(-2,-2,4,4,'#fff')}else if(e.type==='sniper'){px(-r,-2,r*2+7,4,c);px(-4,-7,8,14,'#405f9a')}else{px(-r,-3,r*2,6,c);px(-4,-r,8,r*2,c)}if(e.elite){ctx.strokeStyle=e.boss?'#ff6f7d':'#ffd27a';ctx.lineWidth=1;ctx.strokeRect(-r-4,-r-4,(r+4)*2,(r+4)*2)}ctx.restore()}
function draw(){
  ctx.save();const sh=state?.shake||0;if(sh>0)ctx.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);ctx.fillStyle='#05080d';ctx.fillRect(-10,-10,W+20,H+20);const stars=state?.stars||[];for(const s of stars)px(s.x,s.y,s.z>2?2:1,s.z>2?2:1,s.z>2?'#66828e':'#293a43');ctx.globalAlpha=.05;ctx.fillStyle='#b8edff';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);ctx.globalAlpha=1;
  if(!state||state.mode!=='run'){ctx.restore();return}
  for(const o of state.orbs){px(o.x-3,o.y-3,o.r>4?9:6,o.r>4?9:6,o.r>4?'#ffd27a':'#62f4dd');if(o.r<=4)px(o.x-1,o.y-1,2,2,'#fff')}
  for(const c of state.caches){const col=c.rarity==='OMEGA'?'#fff':c.rarity==='RARE'?'#ffd27a':'#8de9ff';px(c.x-6,c.y-6,12,12,col);px(c.x-3,c.y-3,6,6,'#0a1117');px(c.x-1,c.y-1,2,2,col)}
  for(const m of state.mines){px(m.x-5,m.y-5,10,10,'#bd9cff');px(m.x-2,m.y-2,4,4,'#120a19')}
  for(const a of state.allies)drawShip(a.x,a.y,'#8dffd6',.78,-Math.PI/2,a.type==='tank'?'bastion':a.type==='sniper'?'vector':'striker');
  const dw=state.weapons.drone;if(dw)for(const d of dronePositions(dw)){px(d.x-4,d.y-4,8,8,dw.evolved?'#fff':'#8dffd6');px(d.x-1,d.y-1,2,2,'#071017')}
  for(const b of state.bullets)px(b.x-b.r,b.y-b.r,b.r*2+1,b.r*2+1,b.color);for(const b of state.enemyBullets)px(b.x-b.r,b.y-b.r,b.r*2+1,b.r*2+1,'#ff6f7d');
  for(const a of state.arcs){ctx.globalAlpha=clamp(a.life*9,0,1);ctx.strokeStyle=a.color||'#9cf7ff';ctx.lineWidth=2;ctx.beginPath();if(a.circle){ctx.arc(a.x1,a.y1,a.r,0,Math.PI*2)}else{ctx.moveTo(a.x1,a.y1);ctx.lineTo(a.x2,a.y2)}ctx.stroke()}ctx.globalAlpha=1;
  for(const b of state.beams){ctx.globalAlpha=clamp(b.life*10,0,1);ctx.strokeStyle=b.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke()}ctx.globalAlpha=1;
  for(const e of state.enemies){drawHostile(e);const hpMode=save.settings.enemyHp,show=hpMode==='ALL'||(hpMode==='ELITES'&&e.elite);if(show){const bw=e.boss?62:Math.max(22,e.r*2.2);px(e.x-bw/2,e.y-e.r-10,bw,3,'#1a1115');px(e.x-bw/2,e.y-e.r-10,bw*clamp(e.hp/e.maxHp,0,1),3,e.boss?'#ff6f7d':'#ffd27a')}}
  const p=state.p;const masteryCol=masteryColor(masteryLevel(p.frame));drawShip(p.x,p.y,p.hitFlash?'#ff9aa3':masteryCol,1,-Math.PI/2,p.frame);const php=save.settings.playerHp;if(php==='BAR'||php==='BOTH'){const bw=34;px(p.x-bw/2,p.y-20,bw,3,'#15232a');px(p.x-bw/2,p.y-20,bw*clamp(p.hp/p.maxHp,0,1),3,p.hp/p.maxHp<=.30?'#ff6f7d':'#8dffd6')}
  for(const q of state.particles){ctx.globalAlpha=clamp(q.life*2,0,1);px(q.x,q.y,2,2,q.color)}ctx.globalAlpha=1;ctx.restore();
  const showHudHp=save.settings.playerHp==='HUD'||save.settings.playerHp==='BOTH';hudLeft.textContent=`LV ${state.level}${showHudHp?` | HULL ${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`:''} | KILLS ${state.kills} | THREAT ${state.threat}`;
  const chainMul=1+Math.min(1.6,Math.floor(state.chain/5)*.10),bounty=state.bounty?` | SIGNAL ${Math.max(0,state.bounty.until-state.time).toFixed(1)}s`:'';const contractHud=state.contractId!=='NONE'?` | ${state.contract.name}`:'';const grazeHud=state.grazeChain>0?` | GRAZE ${state.grazeChain}`:'';hudRight.textContent=`${state.difficulty}${contractHud} | ${fmtTime(state.time)} | CHAIN ${state.chain} x${chainMul.toFixed(1)}${grazeHud}${state.overdrive>0?` | DRIVE T${state.driveTier} ${state.overdrive.toFixed(1)}s`:''} | ${Math.floor(state.score)} | +${state.runCredits} CR${bounty}`;
  hudSub.textContent=Object.entries(state.weapons).map(([id,w])=>`${w.evolved?WEAPON_META[id].evo:WEAPON_META[id].name} ${w.evolved?'EVO':'L'+w.level}`).join(' · ');
  const xpPct=Math.min(100,state.xp/state.xpNeed*100);xpFill.style.width=`${xpPct}%`;const xr=save.settings.xpReadout;xpText.textContent=xr==='OFF'?'':xr==='VALUE'?`${Math.floor(state.xp)} / ${state.xpNeed} XP`:xr==='PERCENT'?`${Math.floor(xpPct)}%`:`${Math.floor(state.xp)} / ${state.xpNeed} XP · ${Math.floor(xpPct)}%`;
  const boss=state.enemies.find(e=>e.boss&&!e.dead);if(boss){bossBar.classList.remove('hidden');bossLabel.textContent=`${boss.bossName} · PHASE ${boss.phase||1}`;bossFill.style.width=`${clamp(boss.hp/boss.maxHp,0,1)*100}%`}else bossBar.classList.add('hidden');
}
function loop(now){pollGamepadPause();if(state){const dt=Math.min(.033,(now-state.last)/1000);state.last=now;update(dt)}draw();requestAnimationFrame(loop)}

renderSettings();renderMenu();if(TEST_MODE){draw();document.body.dataset.orbitBoot='ok'}else requestAnimationFrame(loop);
