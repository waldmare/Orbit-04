import * as THREE from './vendor/three.module.min.js';

const TAU=Math.PI*2;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const colorValue=value=>new THREE.Color(value||'#ffffff');
const smoothValue=(current,target,response,delta)=>target+(current-target)*Math.exp(-response*delta);
const smoothAngle=(current,target,response,delta)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-response*delta));
const easeOutCubic=value=>1-Math.pow(1-clamp(value),3);
const easeOutBack=value=>{const x=clamp(value),c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};

const enemyTexture={
  scout:'assets/visuals/enemy-void-larva-v1.png',
  charger:'assets/visuals/enemy-void-larva-v1.png',
  tank:'assets/visuals/enemy-ossuary-v1.png',
  gunner:'assets/visuals/enemy-ossuary-v1.png',
  splitter:'assets/visuals/enemy-void-larva-v1.png',
  sniper:'assets/visuals/enemy-witness-v1.png',
  boss:'assets/visuals/boss-conquest-leviathan-v1.png'
};

const enemyAccent={scout:'#d8a09a',charger:'#ef985f',tank:'#c8b56d',gunner:'#df718e',splitter:'#9bc47a',sniper:'#bca0f2',boss:'#ff526d'};
const enemyBodyTint={scout:'#dccbc7',charger:'#efc0a0',tank:'#d2c698',gunner:'#e4a8b4',splitter:'#b8d39f',sniper:'#d1bce9',boss:'#efabb4'};
const markedEnemyTypes=new Set(['charger','tank','gunner','splitter','sniper']);
const projectileProfile={
  pulse:{body:27,height:7,trail:34,trailHeight:5,opacity:.96},
  missile:{body:39,height:12,trail:54,trailHeight:9,opacity:1},
  drone:{body:22,height:6,trail:28,trailHeight:4,opacity:.92},
  'hunter-wing':{body:31,height:9,trail:42,trailHeight:7,opacity:.98},
  rail:{body:62,height:9,trail:82,trailHeight:6,opacity:1},
  flak:{body:17,height:7,trail:20,trailHeight:4,opacity:.94},
  fragmentation:{body:12,height:5,trail:14,trailHeight:3,opacity:.88},
  ally:{body:23,height:6,trail:31,trailHeight:5,opacity:.91},
  unknown:{body:24,height:7,trail:30,trailHeight:5,opacity:.92}
};

function radialTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const context=canvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.12,'rgba(255,255,255,.72)');gradient.addColorStop(.42,'rgba(255,255,255,.20)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  context.fillStyle=gradient;context.fillRect(0,0,128,128);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function engineTexture(){
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=48;const context=canvas.getContext('2d'),gradient=context.createLinearGradient(0,0,160,0);
  gradient.addColorStop(0,'rgba(255,255,255,0)');gradient.addColorStop(.34,'rgba(255,255,255,.04)');gradient.addColorStop(.72,'rgba(255,255,255,.36)');gradient.addColorStop(.92,'rgba(255,255,255,.92)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  context.fillStyle=gradient;context.beginPath();context.moveTo(0,24);context.quadraticCurveTo(94,2,160,18);context.lineTo(160,30);context.quadraticCurveTo(94,46,0,24);context.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;return texture;
}

function pickupIconTexture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const context=canvas.getContext('2d');context.translate(64,64);context.lineCap='round';context.lineJoin='round';
  const path=points=>{context.beginPath();context.moveTo(points[0][0],points[0][1]);for(let index=1;index<points.length;index++)context.lineTo(points[index][0],points[index][1]);context.closePath()};
  path([[0,-55],[44,-26],[44,26],[0,55],[-44,26],[-44,-26]]);context.fillStyle='rgba(5,8,9,.88)';context.fill();context.lineWidth=4;context.strokeStyle='rgba(255,255,255,.58)';context.stroke();
  context.fillStyle='rgba(255,255,255,.18)';context.strokeStyle='rgba(255,255,255,.96)';context.lineWidth=7;
  if(kind==='orb'){
    path([[0,-31],[28,0],[0,31],[-28,0]]);context.fill();context.stroke();context.beginPath();context.arc(0,0,8,0,TAU);context.fillStyle='#fff';context.fill();
  }else if(kind==='cache'){
    context.fillRect(-31,-24,62,48);context.strokeRect(-31,-24,62,48);context.beginPath();context.moveTo(-31,-7);context.lineTo(31,-7);context.moveTo(0,-24);context.lineTo(0,24);context.stroke();context.fillStyle='#fff';context.fillRect(-7,-13,14,13);
  }else if(kind==='repair'){
    context.beginPath();context.moveTo(-9,-34);context.lineTo(9,-34);context.lineTo(9,-9);context.lineTo(34,-9);context.lineTo(34,9);context.lineTo(9,9);context.lineTo(9,34);context.lineTo(-9,34);context.lineTo(-9,9);context.lineTo(-34,9);context.lineTo(-34,-9);context.lineTo(-9,-9);context.closePath();context.fill();context.stroke();
  }else if(kind==='flux'){
    path([[8,-37],[-25,5],[-5,5],[-14,36],[27,-12],[6,-12]]);context.fill();context.stroke();
  }else if(kind==='salvage'){
    for(const [y,width] of [[-23,48],[0,62],[23,42]]){context.fillRect(-width/2,y-7,width,14);context.strokeRect(-width/2,y-7,width,14)}
  }else if(kind==='archive'){
    context.beginPath();context.moveTo(0,-27);context.quadraticCurveTo(-15,-36,-34,-29);context.lineTo(-34,28);context.quadraticCurveTo(-14,21,0,31);context.quadraticCurveTo(14,21,34,28);context.lineTo(34,-29);context.quadraticCurveTo(15,-36,0,-27);context.closePath();context.fill();context.stroke();context.beginPath();context.moveTo(0,-27);context.lineTo(0,31);context.stroke();
  }else if(kind==='relic'){
    path([[0,-38],[31,0],[0,38],[-31,0]]);context.fill();context.stroke();context.beginPath();context.arc(0,0,10,0,TAU);context.stroke();context.fillStyle='#fff';context.beginPath();context.arc(0,0,3.5,0,TAU);context.fill();
  }else{
    path([[0,-38],[36,31],[-36,31]]);context.fill();context.stroke();context.beginPath();context.moveTo(0,-18);context.lineTo(0,9);context.stroke();context.fillStyle='#fff';context.beginPath();context.arc(0,22,4.5,0,TAU);context.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.name=`pickup-${kind}`;return texture;
}

function enemyRoleTexture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const context=canvas.getContext('2d');context.translate(48,48);context.lineCap='round';context.lineJoin='round';context.fillStyle='rgba(3,5,6,.90)';context.strokeStyle='rgba(255,255,255,.96)';context.lineWidth=6;context.beginPath();context.arc(0,0,36,0,TAU);context.fill();context.lineWidth=3;context.strokeStyle='rgba(255,255,255,.55)';context.stroke();context.strokeStyle='rgba(255,255,255,.98)';context.fillStyle='rgba(255,255,255,.17)';context.lineWidth=6;
  if(kind==='charger'){
    for(const y of [-12,10]){context.beginPath();context.moveTo(-18,y-7);context.lineTo(0,y+7);context.lineTo(18,y-7);context.stroke()}
  }else if(kind==='tank'){
    context.beginPath();context.moveTo(0,-25);context.lineTo(22,-15);context.lineTo(18,10);context.quadraticCurveTo(12,23,0,29);context.quadraticCurveTo(-12,23,-18,10);context.lineTo(-22,-15);context.closePath();context.fill();context.stroke();
  }else if(kind==='gunner'){
    context.beginPath();context.moveTo(-23,0);context.lineTo(23,0);context.stroke();for(const x of [-20,0,20]){context.beginPath();context.arc(x,0,5.5,0,TAU);context.fillStyle='#fff';context.fill()}
  }else if(kind==='splitter'){
    context.beginPath();context.moveTo(0,25);context.lineTo(0,2);context.lineTo(-20,-19);context.moveTo(0,2);context.lineTo(20,-19);context.stroke();for(const [x,y] of [[0,25],[-20,-19],[20,-19]]){context.beginPath();context.arc(x,y,4.5,0,TAU);context.fillStyle='#fff';context.fill()}
  }else if(kind==='sniper'){
    context.beginPath();context.arc(0,0,16,0,TAU);context.stroke();context.beginPath();context.moveTo(-28,0);context.lineTo(-9,0);context.moveTo(9,0);context.lineTo(28,0);context.moveTo(0,-28);context.lineTo(0,-9);context.moveTo(0,9);context.lineTo(0,28);context.stroke();context.beginPath();context.arc(0,0,4,0,TAU);context.fillStyle='#fff';context.fill();
  }else{
    context.beginPath();context.moveTo(-23,13);context.lineTo(-19,-18);context.lineTo(-6,-6);context.lineTo(0,-25);context.lineTo(7,-6);context.lineTo(20,-18);context.lineTo(23,13);context.closePath();context.fill();context.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.name=`enemy-role-${kind}`;return texture;
}

function configureTexture(texture,maxAnisotropy=8){texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=Math.max(1,Math.min(16,maxAnisotropy));return texture}

export class OrbitThreeVisualEngine{
  constructor(canvas,{width=960,height=540,scale=1.5}={}){
    this.canvas=canvas;this.width=width;this.height=height;this.scale=scale;this.time=0;this.motionScale=1;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
    this.renderer.setClearColor(0x000000,0);this.maxAnisotropy=this.renderer.capabilities.getMaxAnisotropy();this.lastQuality='HIGH';this.renderResolution={width:0,height:0,pixelRatio:0};
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(0,width,0,height,.1,300);this.camera.position.set(0,0,100);this.camera.lookAt(0,0,0);
    this.loader=new THREE.TextureLoader();this.glowTexture=radialTexture();this.engineTexture=engineTexture();this.textures={
      player:this.load('assets/visuals/player-last-ark-v1.png'),muzzle:this.load('assets/visuals/weapon-muzzle-premium-v1.png'),projectile:this.load('assets/visuals/weapon-projectile-premium-v1.png')
    };
    this.pickupTextures={};for(const kind of ['orb','cache','repair','flux','salvage','archive','relic','jammer'])this.pickupTextures[kind]=pickupIconTexture(kind);
    this.enemyRoleTextures={};for(const kind of [...markedEnemyTypes,'boss'])this.enemyRoleTextures[kind]=enemyRoleTexture(kind);
    for(const [key,path] of Object.entries(enemyTexture))this.textures[`enemy-${key}`]=this.load(path);
    this.world=new THREE.Group();this.scene.add(this.world);
    this.playerGlow=this.sprite(this.glowTexture,THREE.AdditiveBlending);this.playerTrail=this.sprite(this.engineTexture,THREE.AdditiveBlending);this.playerEngineLeft=this.sprite(this.engineTexture,THREE.AdditiveBlending);this.playerEngineRight=this.sprite(this.engineTexture,THREE.AdditiveBlending);this.playerAttitudeLeft=this.sprite(this.engineTexture,THREE.AdditiveBlending);this.playerAttitudeRight=this.sprite(this.engineTexture,THREE.AdditiveBlending);this.playerRim=this.sprite(this.textures.player,THREE.AdditiveBlending);this.player=this.sprite(this.textures.player);this.playerCore=this.sprite(this.glowTexture,THREE.AdditiveBlending);this.world.add(this.playerTrail,this.playerEngineLeft,this.playerEngineRight,this.playerAttitudeLeft,this.playerAttitudeRight,this.playerGlow,this.playerRim,this.player,this.playerCore);
    this.playerMotion={ready:false,x:width*.5,y:height*.5,angle:-Math.PI/2,bank:0,strafe:0,surge:0,thrust:0,velocity:0,engineBias:0};
    this.pools={enemies:[],enemySilhouettes:[],enemyWakes:[],enemyGlows:[],enemyRings:[],enemyMarkers:[],allies:[],allyTrails:[],projectileTrails:[],bulletSilhouettes:[],bullets:[],hostileBulletOutlines:[],hostileBullets:[],loot:[],particles:[],muzzles:[],impactFlashes:[],impactGlows:[],impactRings:[],impactSparks:[],rings:[],beams:[],bars:[],echoes:[],orbitals:[],mines:[],floaters:[],deathGlows:[],deathRings:[]};
    this.lastFrame=performance.now();this.canvas.dataset.engine='three-r185-topdown';this.canvas.dataset.pipeline='aces-topdown-v2-hidpi';
    this.syncRendererResolution('HIGH',true);
    this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.syncRendererResolution(this.lastQuality,true)):null;this.resizeObserver?.observe(this.canvas);
  }

  load(path){return configureTexture(this.loader.load(path),this.maxAnisotropy)}
  sprite(texture,blending=THREE.NormalBlending){const material=new THREE.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending,toneMapped:false,alphaTest:.008});const sprite=new THREE.Sprite(material);sprite.visible=false;return sprite}
  textSprite(){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;
    const sprite=this.sprite(texture);sprite.userData={canvas,context:canvas.getContext('2d'),texture,key:''};return sprite;
  }
  updateTextSprite(sprite,text,color,critical){const key=`${text}|${color}|${critical}`;if(sprite.userData.key===key)return;sprite.userData.key=key;const {canvas,context,texture}=sprite.userData;context.clearRect(0,0,canvas.width,canvas.height);context.textAlign='center';context.textBaseline='middle';context.font=`700 ${critical?34:27}px Consolas, monospace`;context.lineJoin='round';context.strokeStyle='rgba(0,0,0,.92)';context.lineWidth=critical?9:7;context.strokeText(text,128,32);context.fillStyle=color||'#e5e8e4';context.fillText(text,128,32);texture.needsUpdate=true}
  mesh(material,geometry=new THREE.PlaneGeometry(1,1)){const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;return mesh}
  use(pool,count,factory,update){while(pool.length<count){const item=factory();pool.push(item);this.world.add(item)}for(let i=0;i<pool.length;i++){const visible=i<count;pool[i].visible=visible;if(visible)update(pool[i],i)}}
  motionFor(object,entity,x,y,angle){let motion=object.userData.motion;if(!motion||motion.entity!==entity){motion={entity,x,y,angle,bank:0,spawn:0,velocity:0,vx:0,vy:0,lastX:x,lastY:y};object.userData.motion=motion}return motion}
  movementHeading(motion,x,y,fallback){const lastX=motion.targetX??x,lastY=motion.targetY??y,dx=x-lastX,dy=y-lastY,distance=Math.hypot(dx,dy);motion.targetX=x;motion.targetY=y;if(distance>.025&&distance<120)motion.travelAngle=Math.atan2(dy,dx);return motion.travelAngle??fallback}
  smoothMotion(motion,x,y,angle,positionResponse,angleResponse){const beforeX=motion.x,beforeY=motion.y,beforeAngle=motion.angle;motion.x=smoothValue(motion.x,x,positionResponse,this.delta);motion.y=smoothValue(motion.y,y,positionResponse,this.delta);motion.angle=smoothAngle(motion.angle,angle,angleResponse,this.delta);const vx=(motion.x-beforeX)/Math.max(this.delta,.001),vy=(motion.y-beforeY)/Math.max(this.delta,.001);motion.vx=smoothValue(motion.vx||0,vx,11,this.delta);motion.vy=smoothValue(motion.vy||0,vy,11,this.delta);motion.velocity=smoothValue(motion.velocity,Math.hypot(vx,vy),9,this.delta);const turn=Math.atan2(Math.sin(motion.angle-beforeAngle),Math.cos(motion.angle-beforeAngle))/Math.max(this.delta,.001);motion.bank=smoothValue(motion.bank,clamp(turn*.015,-.14,.14)*this.motionScale,8,this.delta);return motion}
  placeSprite(sprite,x,y,width,height,rotation=0,z=1,opacity=1,color='#ffffff'){
    sprite.position.set(x,y,z);sprite.scale.set(width,height,1);sprite.material.rotation=-rotation;sprite.material.opacity=opacity;sprite.material.color.set(color);
  }
  flatMaterial(color='#ffffff',blending=THREE.NormalBlending){return new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending,toneMapped:false})}
  placeBeam(mesh,x1,y1,x2,y2,width,color,opacity,z=6){const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);mesh.position.set((x1+x2)/2,(y1+y2)/2,z);mesh.rotation.z=Math.atan2(dy,dx);mesh.scale.set(length,width,1);mesh.material.color.set(color);mesh.material.opacity=opacity}

  syncRendererResolution(quality='HIGH',force=false){
    this.lastQuality=quality;const bounds=this.canvas.getBoundingClientRect(),width=Math.max(1,Math.round(bounds.width||this.width*this.scale)),height=Math.max(1,Math.round(bounds.height||this.height*this.scale)),deviceRatio=Math.max(1,globalThis.devicePixelRatio||1),qualityCap=quality==='LOW'?1:quality==='ULTRA'?2.5:2,maxDimension=quality==='LOW'?1920:quality==='ULTRA'?5120:3840,pixelRatio=Math.min(deviceRatio,qualityCap,maxDimension/Math.max(width,height)),previous=this.renderResolution;
    if(!force&&previous.width===width&&previous.height===height&&Math.abs(previous.pixelRatio-pixelRatio)<.001)return;
    this.renderer.setPixelRatio(pixelRatio);this.renderer.setSize(width,height,false);this.renderResolution={width,height,pixelRatio};this.canvas.dataset.renderWidth=String(Math.round(width*pixelRatio));this.canvas.dataset.renderHeight=String(Math.round(height*pixelRatio));this.canvas.dataset.pixelRatio=String(pixelRatio);
  }

  sync(gameState,settings={}){
    const now=performance.now(),dt=clamp((now-this.lastFrame)/1000,1/240,.05);this.lastFrame=now;this.delta=dt;this.time=gameState?.time??now/1000;this.motionScale=settings.motion==='REDUCED'?.28:1;
    this.syncRendererResolution(settings.graphics||'HIGH');
    if(!gameState||gameState.mode!=='run'){this.syncMenu(settings);this.renderer.render(this.scene,this.camera);return}
    const state=gameState,quality=settings.graphics||'HIGH',glow=settings.glow!=='OFF';
    const shake=(state.shake||0)*this.motionScale,moveLead=state.p.moving?2.4*this.motionScale:0;this.world.position.set(Math.sin(this.time*37)*shake*.09-(state.p._lastMoveX||0)*moveLead,Math.cos(this.time*29)*shake*.07-(state.p._lastMoveY||0)*moveLead,0);
    this.syncPlayer(state,settings,glow);this.syncEnemies(state,settings,glow);this.syncAllies(state);this.syncProjectiles(state,settings);this.syncLoot(state,quality);this.syncOrbitals(state);this.syncWorldSignals(state,quality);this.syncTransientFx(state,quality,glow,settings);this.syncDeathFx(state,quality,glow);this.syncFloaters(state);this.syncHealthBars(state,settings);
    this.renderer.toneMappingExposure=quality==='ULTRA'?1.13:quality==='LOW'?1.0:1.07;this.renderer.render(this.scene,this.camera);
  }

  syncMenu(settings){
    const t=performance.now()/1000,x=this.width*.5+Math.sin(t*.35)*18,y=this.height*.56+Math.sin(t*.55)*6,pulse=.88+.08*Math.sin(t*1.5),yaw=Math.sin(t*.48)*.045;
    this.player.visible=this.playerRim.visible=this.playerCore.visible=true;this.playerGlow.visible=settings.glow!=='OFF';this.placeSprite(this.playerRim,x,y,59,88,yaw,4,.18,'#80d5c6');this.placeSprite(this.player,x,y,56,84,yaw,5,1,'#eef2eb');this.placeSprite(this.playerCore,x,y-2,18+3*pulse,18+3*pulse,0,6,.42+.13*pulse,'#9ff6df');this.placeSprite(this.playerGlow,x,y,122,122,0,3,.18*pulse,'#c3b26d');
    this.playerTrail.visible=this.playerAttitudeLeft.visible=this.playerAttitudeRight.visible=false;this.playerEngineLeft.visible=this.playerEngineRight.visible=true;this.placeSprite(this.playerEngineLeft,x-5,y+48,7,38,Math.PI/2,2,.36+.11*pulse,'#8ff4dc');this.placeSprite(this.playerEngineRight,x+5,y+48,7,36,Math.PI/2,2,.34+.10*(1-pulse),'#ffd17b');
    for(const pool of Object.values(this.pools))for(const item of pool)item.visible=false;
  }

  syncPlayer(state,settings,glow){
    const p=state.p,m=this.playerMotion,neutralAngle=-Math.PI/2,strafeTarget=p.moving?clamp(p._lastMoveX||0,-1,1):0,surgeTarget=p.moving?clamp(-(p._lastMoveY||0),-1,1):0,targetAngle=neutralAngle+strafeTarget*.22*this.motionScale;if(!m.ready){Object.assign(m,{ready:true,x:p.x,y:p.y,angle:neutralAngle,bank:0,strafe:0,surge:0,thrust:0,velocity:0,engineBias:0})}
    const beforeX=m.x,beforeY=m.y;m.x=smoothValue(m.x,p.x,22,this.delta);m.y=smoothValue(m.y,p.y,22,this.delta);m.strafe=smoothValue(m.strafe,strafeTarget,7.5,this.delta);m.surge=smoothValue(m.surge,surgeTarget,6.5,this.delta);m.angle=smoothAngle(m.angle,targetAngle,p.moving?7.2:4.4,this.delta);m.bank=smoothValue(m.bank,-m.strafe*.25*this.motionScale,p.moving?9:5.5,this.delta);m.engineBias=smoothValue(m.engineBias,m.strafe*.22,10,this.delta);m.velocity=smoothValue(m.velocity,Math.hypot(m.x-beforeX,m.y-beforeY)/Math.max(this.delta,.001),8,this.delta);m.thrust=smoothValue(m.thrust,p.moving?.98:.20,p.moving?8:3.8,this.delta);
    const kick=clamp((p.weaponKick||0)/.12),dash=clamp((p.dashFx||0)/.32),pulse=.88+.12*Math.sin(this.time*(p.hp/p.maxHp<.3?8:2.1)),motionPulse=Math.sin(this.time*(5.2+m.thrust*2.8))*.55*m.thrust*this.motionScale,hover=(Math.sin(this.time*2.1)*.42+motionPulse)*this.motionScale;
    const inertiaX=m.strafe*(1.8+dash*1.5)*this.motionScale,inertiaY=-m.surge*(2.4+dash)*this.motionScale,x=m.x+inertiaX-Math.cos(p.weaponAngle??m.angle)*kick*4.5,y=m.y+hover+inertiaY-Math.sin(p.weaponAngle??m.angle)*kick*4.5,breath=1+Math.sin(this.time*1.55)*.006*this.motionScale;
    const turnCompression=1-Math.min(.105,Math.abs(m.bank)*.48),surgeStretch=1+m.surge*.04*m.thrust,surgeCompression=1-m.surge*.022*m.thrust,visualYaw=m.angle-neutralAngle;m.visualYaw=visualYaw;this.player.visible=this.playerRim.visible=this.playerCore.visible=true;this.placeSprite(this.playerRim,x,y,58*turnCompression*surgeCompression*(1+dash*.055),86*(1+dash*.026)*surgeStretch,m.angle+Math.PI/2,4,.15+.09*Math.abs(m.bank)+dash*.08,p.hp/p.maxHp<.3?'#d95b65':'#63d8c4');this.placeSprite(this.player,x,y,54*turnCompression*surgeCompression*(1+kick*.025+dash*.05)/breath,81*(1-kick*.035+dash*.018)*breath*surgeStretch,m.angle+Math.PI/2,5,1,p.hitFlash>0?'#ffffff':'#eef1ea');const corePulse=.82+.18*Math.sin(this.time*(3.8+m.thrust*3.2));this.placeSprite(this.playerCore,x,y-2,15+corePulse*5+dash*6,15+corePulse*5+dash*6,0,6,.34+.22*corePulse+dash*.16,p.hp/p.maxHp<.3?'#ff6675':'#9ff6df');
    this.playerGlow.visible=glow;this.placeSprite(this.playerGlow,x,y,92+kick*20+dash*30,92+kick*20+dash*30,0,3,(p.hp/p.maxHp<.3?.22:.13)*pulse+(dash*.10),p.hp/p.maxHp<.3?'#d13c50':'#c8ad59');
    const backX=-Math.cos(m.angle),backY=-Math.sin(m.angle),sideX=-Math.sin(m.angle),sideY=Math.cos(m.angle),trailLength=24+m.thrust*36+m.surge*10+dash*54,trailX=x+backX*(25+trailLength*.48),trailY=y+backY*(25+trailLength*.48),enginePulse=.84+.11*Math.sin(this.time*25)+.05*Math.sin(this.time*41);
    this.playerTrail.visible=glow;this.placeSprite(this.playerTrail,trailX,trailY,trailLength*1.20,15+m.thrust*6,m.angle,2,(.13+.17*m.thrust+.14*dash)*enginePulse,'#55c7b5');
    this.playerEngineLeft.visible=this.playerEngineRight.visible=true;for(const [engine,side] of [[this.playerEngineLeft,-1],[this.playerEngineRight,1]]){const output=1-side*m.engineBias,offset=side*(5.5+Math.abs(m.bank)*3),length=trailLength*output,ex=x+backX*(25+length*.48)+sideX*offset,ey=y+backY*(25+length*.48)+sideY*offset,flutter=side<0?enginePulse:1.02-enginePulse*.10;this.placeSprite(engine,ex,ey,length,6+m.thrust*3,m.angle,3,(.40+.50*m.thrust+.20*dash)*flutter*(.92+output*.08),side<0?'#8df4dc':'#ffd078')}
    for(const [thruster,side] of [[this.playerAttitudeLeft,-1],[this.playerAttitudeRight,1]]){const demand=Math.max(0,m.strafe*-side),length=10+demand*23,angle=Math.atan2(sideY*side,sideX*side),tx=x+sideX*side*(19+length*.43),ty=y+sideY*side*(19+length*.43)+m.surge*3;thruster.visible=demand>.025;this.placeSprite(thruster,tx,ty,length,4.5+demand*2,angle,4,(.20+.62*demand)*(.88+.12*Math.sin(this.time*31+side)),'#8df4dc')}
    const echoes=p.dashFx>0?7:0;this.use(this.pools.echoes,echoes,()=>this.sprite(this.textures.player,THREE.AdditiveBlending),(sprite,i)=>{const t=(i+1)/(echoes+1),fade=1-t,eased=t*t*(3-2*t);this.placeSprite(sprite,p.x+(p.dashFromX-p.x)*eased,p.y+(p.dashFromY-p.y)*eased,54*(.9+fade*.08),81*(.9+fade*.08),m.angle+Math.PI/2,2,.24*fade*dash,'#d7c37b')});
  }

  syncEnemies(state,settings,glow){
    const enemies=state.enemies.filter(enemy=>!enemy.dead);
    this.use(this.pools.enemies,enemies.length,()=>this.sprite(this.textures['enemy-scout']),(sprite,i)=>{const enemy=enemies[i],boss=!!enemy.boss,role=boss?'boss':enemy.type,size=enemy.r*(boss?4.25:enemy.elite?3.72:3.42),aimAngle=Math.atan2(state.p.y-enemy.y,state.p.x-enemy.x),m=this.motionFor(sprite,enemy,enemy.x,enemy.y,aimAngle),targetAngle=this.movementHeading(m,enemy.x,enemy.y,aimAngle);this.smoothMotion(m,enemy.x,enemy.y,targetAngle,boss?8:enemy.type==='charger'?19:14,boss?3.8:7.5);m.spawn=clamp(m.spawn+this.delta*(boss?.55:enemy.elite?.85:1.25));const phase=this.time*(boss?.72:enemy.type==='charger'?3.4:enemy.type==='tank'?.92:enemy.type==='splitter'?2.35:1.72)+i*.73,breath=Math.sin(phase),hover=Math.sin(phase*.71)*(boss?1.8:enemy.elite?1.0:.62)*this.motionScale,charge=enemy.type==='charger'&&enemy.burst>0?.14:0,hitKick=clamp((enemy.hit||0)/.08)*4.2,fireRecoil=(['gunner','sniper'].includes(enemy.type)||boss)&&enemy.shootT>0&&enemy.shootT<.18?clamp((.18-enemy.shootT)/.18)*3.4:0,entry=easeOutBack(m.spawn),texture=this.textures[`enemy-${role}`]||this.textures['enemy-scout'],turnCompression=1-Math.min(.09,Math.abs(m.bank)*.55),speedStretch=1+clamp(m.velocity*.00065,0,.075)*this.motionScale,swayScale=boss?.045:enemy.type==='tank'?.025:enemy.type==='splitter'?.12:enemy.type==='charger'?.075:.055,organicSway=Math.sin(phase*(enemy.type==='splitter'?1.65:1.12))*enemy.r*swayScale*this.motionScale,sideX=-Math.sin(m.angle),sideY=Math.cos(m.angle),wobble=Math.sin(phase*.91)*swayScale*.42*this.motionScale,tint=enemy.hit>0?'#ffffff':enemy.nemesis?'#f2f4f1':enemy.bounty?'#efc65e':enemyBodyTint[role]||enemyBodyTint.scout;if(sprite.material.map!==texture){sprite.material.map=texture;sprite.material.needsUpdate=true}sprite.userData.enemyRole=role;this.placeSprite(sprite,m.x+sideX*organicSway-Math.cos(m.angle)*(hitKick+fireRecoil),m.y+hover+sideY*organicSway-Math.sin(m.angle)*(hitKick+fireRecoil),size*.67*turnCompression*(1+breath*.045+charge)*entry/Math.sqrt(speedStretch),size*(1-breath*.032-charge*.08)*entry*speedStretch,m.angle+Math.PI/2+wobble,4,easeOutCubic(m.spawn),tint)});
    this.use(this.pools.enemySilhouettes,enemies.length,()=>this.sprite(this.textures['enemy-scout']),(silhouette,i)=>{const body=this.pools.enemies[i],texture=body.material.map;if(silhouette.material.map!==texture){silhouette.material.map=texture;silhouette.material.needsUpdate=true}silhouette.userData.enemyRole=body.userData.enemyRole;this.placeSprite(silhouette,body.position.x,body.position.y,body.scale.x*1.16,body.scale.y*1.12,-body.material.rotation,3.7,.88,'#050304')});
    this.use(this.pools.enemyWakes,enemies.length,()=>this.sprite(this.textures['enemy-scout'],THREE.AdditiveBlending),(wake,i)=>{const enemy=enemies[i],body=this.pools.enemies[i],m=body.userData.motion,role=enemy.boss?'boss':enemy.type,texture=body.material.map,speed=clamp((m?.velocity||0)/150),distance=4+speed*(enemy.boss?13:9),vx=m?.vx||Math.cos(m?.angle||0),vy=m?.vy||Math.sin(m?.angle||0),length=Math.hypot(vx,vy)||1,color=enemy.nemesis?'#dfe9e5':enemyAccent[role]||enemyAccent.scout;if(wake.material.map!==texture){wake.material.map=texture;wake.material.needsUpdate=true}this.placeSprite(wake,body.position.x-vx/length*distance,body.position.y-vy/length*distance,body.scale.x*(1+speed*.08),body.scale.y*(1+speed*.05),-body.material.rotation,3,.035+.13*speed*this.motionScale,color);wake.visible=speed>.035&&this.motionScale>.1});
    this.use(this.pools.enemyGlows,glow?enemies.length:0,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const enemy=enemies[i],body=this.pools.enemies[i],role=enemy.boss?'boss':enemy.type,priority=enemy.boss||enemy.elite||enemy.nemesis||enemy.bounty,size=enemy.r*(enemy.boss?5.4:priority?4.35:3.25),pulse=.88+.12*Math.sin(this.time*(enemy.boss?1.2:2.1)+i),color=enemy.nemesis?'#e8eeeb':enemy.bounty?'#e0b84f':enemyAccent[role]||enemyAccent.scout;this.placeSprite(sprite,body.position.x,body.position.y,size*pulse,size*pulse,0,2,priority?.18:.10,color)});
    const clarity=settings.effectClarity||'HIGH',marked=enemies.map((enemy,index)=>({enemy,index})).filter(({enemy})=>enemy.boss||enemy.elite||enemy.nemesis||enemy.bounty||clarity==='HIGH'&&markedEnemyTypes.has(enemy.type)||clarity==='BALANCED'&&['charger','gunner','sniper'].includes(enemy.type));
    this.use(this.pools.enemyRings,marked.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending),new THREE.RingGeometry(.86,1,6)),(mesh,i)=>{const {enemy,index}=marked[i],body=this.pools.enemies[index],role=enemy.boss?'boss':enemy.type,intent=enemy.type==='charger'&&enemy.burst>0||(['gunner','sniper'].includes(enemy.type)||enemy.boss)&&enemy.shootT>0&&enemy.shootT<.65,pulse=1+(intent?.10*Math.sin(this.time*15):.025*Math.sin(this.time*3+i)),radius=enemy.r*(enemy.boss?2.65:enemy.elite?2.18:1.98)*pulse,color=enemy.nemesis?'#edf3f0':enemy.bounty?'#ffd36d':enemyAccent[role]||enemyAccent.scout;mesh.position.set(body.position.x,body.position.y,3);mesh.rotation.z=this.time*(enemy.boss?.28:.12)+i*.73;mesh.scale.set(radius,radius,1);mesh.material.color.set(color);mesh.material.opacity=intent?.52:enemy.boss?.42:enemy.elite?.34:.23;mesh.userData.enemyRole=role});
    this.use(this.pools.enemyMarkers,marked.length,()=>this.sprite(this.enemyRoleTextures.charger),(sprite,i)=>{const {enemy,index}=marked[i],body=this.pools.enemies[index],role=enemy.boss?'boss':enemy.type,texture=this.enemyRoleTextures[role]||this.enemyRoleTextures.charger,intent=enemy.type==='charger'&&enemy.burst>0||(['gunner','sniper'].includes(enemy.type)||enemy.boss)&&enemy.shootT>0&&enemy.shootT<.65,size=(enemy.boss?21:enemy.elite?18:15)*(intent?1.10+.06*Math.sin(this.time*18):1),color=enemy.nemesis?'#f4f6f3':enemy.bounty?'#ffd36d':enemyAccent[role]||enemyAccent.scout;if(sprite.material.map!==texture){sprite.material.map=texture;sprite.material.needsUpdate=true}sprite.userData.enemyRole=role;this.placeSprite(sprite,body.position.x,body.position.y-enemy.r*(enemy.boss?2.55:2.15),size,size,0,8,intent?1:.86,color)});
  }

  syncAllies(state){
    const allies=state.allies||[];this.use(this.pools.allies,allies.length,()=>this.sprite(this.textures['enemy-scout']),(sprite,i)=>{const ally=allies[i],target=state.enemies.filter(enemy=>!enemy.dead).sort((a,b)=>(a.x-ally.x)**2+(a.y-ally.y)**2-((b.x-ally.x)**2+(b.y-ally.y)**2))[0],aimAngle=target?Math.atan2(target.y-ally.y,target.x-ally.x):-Math.PI/2,size=Math.max(31,(ally.r||9)*3.42),texture=this.textures[`enemy-${ally.type}`]||this.textures['enemy-scout'],m=this.motionFor(sprite,ally,ally.x,ally.y,aimAngle),targetAngle=this.movementHeading(m,ally.x,ally.y,aimAngle);this.smoothMotion(m,ally.x,ally.y,targetAngle,16,8);m.spawn=clamp(m.spawn+this.delta*2.4);if(sprite.material.map!==texture){sprite.material.map=texture;sprite.material.needsUpdate=true}const hover=Math.sin(this.time*2+i)*.6*this.motionScale,entry=easeOutBack(m.spawn),turnCompression=1-Math.min(.08,Math.abs(m.bank)*.5);this.placeSprite(sprite,m.x,m.y+hover,size*.7*turnCompression*entry,size*entry,m.angle+Math.PI/2,4,easeOutCubic(m.spawn),'#9dbdb0')});
    this.use(this.pools.allyTrails,allies.length,()=>this.sprite(this.engineTexture,THREE.AdditiveBlending),(trail,i)=>{const body=this.pools.allies[i],m=body.userData.motion,length=18+Math.min(18,m.velocity*.08),backX=-Math.cos(m.angle),backY=-Math.sin(m.angle);this.placeSprite(trail,body.position.x+backX*(15+length*.45),body.position.y+backY*(15+length*.45),length,5,m.angle,3,.30,'#88aa9e')});
  }

  syncProjectiles(state,settings){
    const clarity=settings.effectClarity==='HIGH'?1:settings.effectClarity==='BALANCED'?.82:.62;
    this.use(this.pools.projectileTrails,state.bullets.length,()=>{const sprite=this.sprite(this.engineTexture,THREE.AdditiveBlending);sprite.center.set(.82,.5);return sprite},(trail,i)=>{const bullet=state.bullets[i],profile=projectileProfile[bullet.weaponId]||projectileProfile.unknown,speed=Math.hypot(bullet.vx||0,bullet.vy||0),angle=Math.atan2(bullet.vy??0,bullet.vx??1),dx=Math.cos(angle),dy=Math.sin(angle),age=bullet.maxLife?clamp(1-bullet.life/bullet.maxLife):1,launch=easeOutCubic(Math.min(1,age*18)),length=(profile.trail+Math.min(28,speed*.035))*launch,pulse=.90+.10*Math.sin(this.time*34+i*.77);this.placeSprite(trail,bullet.x-dx*length*.42,bullet.y-dy*length*.42,length,profile.trailHeight*pulse,angle,5.5,(bullet.weaponId==='rail'?.46:.27)*clarity*pulse,bullet.color||'#b9fff0')});
    this.use(this.pools.bullets,state.bullets.length,()=>{const sprite=this.sprite(this.textures.projectile,THREE.AdditiveBlending);sprite.center.set(.68,.5);return sprite},(sprite,i)=>{const bullet=state.bullets[i],profile=projectileProfile[bullet.weaponId]||projectileProfile.unknown,speed=Math.hypot(bullet.vx||0,bullet.vy||0),angle=Math.atan2(bullet.vy??0,bullet.vx??1),age=bullet.maxLife?clamp(1-bullet.life/bullet.maxLife):1,launch=easeOutBack(Math.min(1,age*21)),pulse=.96+.04*Math.sin(this.time*39+i),length=(profile.body+Math.min(17,speed*.022))*launch,height=profile.height*(2-launch*.98)*pulse;this.placeSprite(sprite,bullet.x,bullet.y,length,height,angle,7,profile.opacity,bullet.color||'#b9fff0')});
    this.use(this.pools.bulletSilhouettes,state.bullets.length,()=>{const sprite=this.sprite(this.textures.projectile);sprite.center.set(.68,.5);return sprite},(silhouette,i)=>{const bullet=state.bullets[i],body=this.pools.bullets[i],angle=Math.atan2(bullet.vy??0,bullet.vx??1);this.placeSprite(silhouette,body.position.x,body.position.y,body.scale.x+5,body.scale.y+4,angle,6,.76,'#020405')});
    this.use(this.pools.hostileBulletOutlines,state.enemyBullets.length,()=>this.mesh(this.flatMaterial('#050106'),new THREE.RingGeometry(.68,1,32)),(mesh,i)=>{const bullet=state.enemyBullets[i],radius=bullet.r+4.6;mesh.position.set(bullet.x,bullet.y,6);mesh.scale.set(radius,radius,1);mesh.material.opacity=settings.effectClarity==='HIGH'?.96:settings.effectClarity==='BALANCED'?.78:.54});
    this.use(this.pools.hostileBullets,state.enemyBullets.length,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const bullet=state.enemyBullets[i],pulse=.9+.1*Math.sin(this.time*27+i),size=(bullet.r+4.2)*2*pulse;this.placeSprite(sprite,bullet.x,bullet.y,size,size,0,7,1,'#ff3657')});
  }

  syncLoot(state,quality){
    const items=[...state.orbs.map(item=>({item,type:'orb'})),...state.caches.map(item=>({item,type:'cache'})),...(state.worldNodes||[]).filter(item=>item.active&&!item.collected).map(item=>({item,type:'signal'}))];
    const signalColors={repair:'#6fe09a',flux:'#61d0df',salvage:'#dbac62',archive:'#ead28e',relic:'#b88bd0',jammer:'#ed5d6e'};
    this.use(this.pools.loot,items.length,()=>this.sprite(this.pickupTextures.orb),(sprite,i)=>{const {item,type}=items[i],signal=type==='signal',cache=type==='cache',kind=signal?(item.type||'jammer'):cache?'cache':'orb',texture=this.pickupTextures[kind]||this.pickupTextures.orb,size=signal?(item.disposition==='hazard'?34:31):cache?26:item.r>4?20:16,color=signal?(signalColors[kind]||item.color):cache?(item.rarity==='PARADOX'?'#a98bc0':item.rarity==='OMEGA'?'#e5e0d3':item.rarity==='RARE'?'#c3a362':'#83a7a3'):(item.r>4?'#c1a56f':'#79aa9e'),pulse=.96+.055*Math.sin(this.time*(signal?2.1:3.2)+i),rotation=kind==='orb'?this.time*.24+i*.31:Math.sin(this.time*.72+i)*.025;if(sprite.material.map!==texture){sprite.material.map=texture;sprite.material.needsUpdate=true}sprite.userData.pickupKind=kind;this.placeSprite(sprite,item.x,item.y+Math.sin(this.time*(signal?1.45:2.2)+i)*((signal?2.2:1.0)*this.motionScale),size*pulse,size*pulse,rotation,6,.96,color)});
  }

  syncOrbitals(state){
    const orbitals=[],drone=state.weapons?.drone;if(drone){const count=1+(drone.level>=2?1:0)+(drone.level>=5?1:0)+(drone.evolved?2:0)+(state.p.droneBonus||0);for(let i=0;i<count;i++){const angle=state.time*(drone.evolved?1.75:1.15)+i*TAU/count;orbitals.push({x:state.p.x+Math.cos(angle)*36,y:state.p.y+Math.sin(angle)*36,size:drone.evolved?16:13,color:drone.evolved?'#f2eee0':'#88baa8',rotation:angle+Math.PI/4,kind:'drone'})}}
    const blade=state.weapons?.blade;if(blade){const count=2+(blade.level>=2?1:0)+(blade.level>=6?1:0)+(blade.evolved?2:0)+(state.synergies?.razorWing?1:0),radius=43*(blade.level>=5?1.18:1)*(blade.evolved?1.18:1)*state.p.areaMul;for(let i=0;i<count;i++){const angle=state.time*(blade.evolved?3:2.15)+i*TAU/count;orbitals.push({x:state.p.x+Math.cos(angle)*radius,y:state.p.y+Math.sin(angle)*radius,size:blade.evolved?19:15,color:blade.evolved?'#f3eee3':'#967e9b',rotation:angle+state.time*3.2,kind:'blade'})}}
    this.use(this.pools.orbitals,orbitals.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending),new THREE.RingGeometry(.36,1,4)),(mesh,i)=>{const item=orbitals[i];mesh.position.set(item.x,item.y,7);mesh.rotation.z=-item.rotation;mesh.scale.set(item.kind==='blade'?item.size*1.42:item.size*.78,item.kind==='blade'?3.1:item.size*.78,1);mesh.material.color.set(item.color);mesh.material.opacity=item.kind==='blade'?.82:.68});
    const mines=state.mines||[];this.use(this.pools.mines,mines.length,()=>this.mesh(this.flatMaterial('#9b7ba2',THREE.AdditiveBlending),new THREE.RingGeometry(.42,1,4)),(mesh,i)=>{const mine=mines[i],pulse=.9+.1*Math.sin(this.time*5+i);mesh.position.set(mine.x,mine.y,7);mesh.rotation.z=this.time*.7+i;mesh.scale.set(12*pulse,12*pulse,1);mesh.material.opacity=.78});
  }

  syncWorldSignals(state,quality){
    const rings=[];for(const node of state.worldNodes||[]){if(node.active&&!node.collected)rings.push({x:node.x,y:node.y,r:node.r+12+Math.sin(this.time*2+node.pulse)*4,color:node.color,alpha:.42})}for(const rift of state.rifts||[])rings.push({x:rift.x,y:rift.y,r:rift.r*(.75+.04*Math.sin(this.time*2)),color:'#8c72a3',alpha:.24});for(const site of state.worldSites||[]){if(site.active&&quality!=='LOW')rings.push({x:site.x,y:site.y,r:site.size*.55,color:site.kind==='asteroids'?'#66706a':'#778886',alpha:.08})}
    this.use(this.pools.rings,rings.length,()=>this.mesh(this.flatMaterial(),new THREE.RingGeometry(.94,1,64)),(mesh,i)=>{const ring=rings[i];mesh.position.set(ring.x,ring.y,2);mesh.scale.set(ring.r,ring.r,1);mesh.material.color.set(ring.color);mesh.material.opacity=ring.alpha});
  }

  syncTransientFx(state,quality,glow,settings){
    const muzzleFx=state.weaponFx||[];
    this.use(this.pools.muzzles,muzzleFx.length,()=>{const sprite=this.sprite(this.textures.muzzle,THREE.AdditiveBlending);sprite.center.set(.30,.5);return sprite},(sprite,i)=>{const fx=muzzleFx[i],life=clamp(fx.life/fx.maxLife),flare=Math.sin((1-life)*Math.PI),length=(fx.size||28)*(1.4+flare*.8),height=(fx.size||28)*(.62+flare*.20);this.placeSprite(sprite,fx.x,fx.y,length,height,fx.angle,9,life*(fx.kind==='hostile'?.64:.82),fx.color||'#d8c68b')});
    const impacts=state.impactFx||[],ringImpacts=impacts.filter(impact=>impact.finalHit||impact.weaponId==='rail'||impact.weaponId==='missile'),sparks=[];
    for(const impact of impacts){const count=quality==='LOW'?1:impact.finalHit?5:impact.weaponId==='rail'||impact.weaponId==='missile'?3:2;for(let index=0;index<count;index++)sparks.push({impact,index,count})}
    this.use(this.pools.impactGlows,glow?impacts.length:0,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const impact=impacts[i],life=clamp(impact.life/impact.maxLife),progress=1-life,pulse=1+Math.sin(progress*Math.PI)*.32,size=impact.size*(impact.finalHit?2.7:1.75)*pulse;this.placeSprite(sprite,impact.x,impact.y,size,size,0,8.4,life*(impact.finalHit?.38:.25),impact.finalHit?'#ffffff':impact.color)});
    this.use(this.pools.impactFlashes,impacts.length,()=>{const sprite=this.sprite(this.textures.muzzle,THREE.AdditiveBlending);sprite.center.set(.42,.5);return sprite},(sprite,i)=>{const impact=impacts[i],life=clamp(impact.life/impact.maxLife),progress=1-life,flare=Math.sin(progress*Math.PI),length=impact.size*(.65+flare*(impact.finalHit?2.1:1.4)),height=impact.size*(.42+flare*(impact.finalHit?.72:.45));this.placeSprite(sprite,impact.x,impact.y,length,height,impact.angle,9.2,life*(impact.finalHit?.98:.72),impact.finalHit?'#ffffff':impact.color)});
    this.use(this.pools.impactRings,ringImpacts.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending),new THREE.RingGeometry(.91,1,48)),(mesh,i)=>{const impact=ringImpacts[i],life=clamp(impact.life/impact.maxLife),progress=1-life,radius=impact.size*(.30+progress*(impact.finalHit?1.25:.88))+Math.min(impact.blast||0,34)*progress*.28;mesh.position.set(impact.x,impact.y,9);mesh.scale.set(radius,radius,1);mesh.material.color.set(impact.color||'#ffffff');mesh.material.opacity=life*(impact.finalHit?.70:.50)});
    this.use(this.pools.impactSparks,sparks.length,()=>{const sprite=this.sprite(this.engineTexture,THREE.AdditiveBlending);sprite.center.set(.86,.5);return sprite},(sprite,i)=>{const {impact,index,count}=sparks[i],life=clamp(impact.life/impact.maxLife),progress=1-life,spread=(index-(count-1)/2)*(.28+(impact.seed||0)*.10),angle=impact.angle+spread,length=impact.size*(.44+(index%3)*.15)*(1+progress*.72),x=impact.x-Math.cos(angle)*length*.45,y=impact.y-Math.sin(angle)*length*.45;this.placeSprite(sprite,x,y,length,impact.finalHit?3.2:2.1,angle,9.1,life*(impact.finalHit?.88:.58),impact.finalHit?'#ffffff':impact.color)});
    const telegraphs=settings.telegraphs==='OFF'?[]:state.enemies.filter(enemy=>!enemy.dead&&(enemy.type==='gunner'||enemy.type==='sniper'||enemy.boss)&&enemy.shootT>0&&enemy.shootT<.42).map(enemy=>({x1:enemy.x,y1:enemy.y,x2:state.p.x,y2:state.p.y,width:enemy.boss?1.8:1.1,alpha:clamp((.42-enemy.shootT)/.42)*.66,color:enemy.boss?'#c83e53':enemy.type==='sniper'?'#c69b59':'#ad5d68'}));
    const beamFx=[...state.beams.map(beam=>({...beam,width:beam.weaponId==='rail'?4.5:3.2,alpha:clamp(beam.life*10),color:beam.color||'#dfe8e4'})),...state.arcs.filter(arc=>!arc.circle).map(arc=>({...arc,width:2.2,alpha:clamp(arc.life*10),color:arc.color||'#b9c7c1'})),...telegraphs];
    this.use(this.pools.beams,beamFx.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending)),(mesh,i)=>{const beam=beamFx[i];this.placeBeam(mesh,beam.x1,beam.y1,beam.x2,beam.y2,beam.width,beam.color,beam.alpha*.84,8)});
    const particles=state.particles||[];this.use(this.pools.particles,particles.length,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const particle=particles[i],alpha=clamp(particle.life*2),size=quality==='LOW'?4:6;this.placeSprite(sprite,particle.x,particle.y,size,size,0,8,alpha*.55,particle.color||'#ffffff')});
  }

  syncDeathFx(state,quality,glow){
    const deaths=state.deathFx||[];this.use(this.pools.deathGlows,glow?deaths.length:0,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const death=deaths[i],life=clamp(death.life/(death.maxLife||.55)),progress=1-life,size=death.r*(death.boss?5.8:death.elite?4.2:3.2)*(1+progress*.7);this.placeSprite(sprite,death.x,death.y,size,size,0,8,life*(death.boss?.32:.20),death.color||'#c0b7ad')});
    this.use(this.pools.deathRings,deaths.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending),new THREE.RingGeometry(.92,1,48)),(mesh,i)=>{const death=deaths[i],life=clamp(death.life/(death.maxLife||.55)),progress=1-life,radius=death.r*(.8+progress*(death.boss?4.5:3));mesh.position.set(death.x,death.y,9);mesh.scale.set(radius,radius,1);mesh.material.color.set(death.color||'#c0b7ad');mesh.material.opacity=life*.72});
  }

  syncFloaters(state){
    const floaters=state.floaters||[];this.use(this.pools.floaters,floaters.length,()=>this.textSprite(),(sprite,i)=>{const floater=floaters[i],life=clamp(floater.life/floater.maxLife),critical=!!floater.crit;this.updateTextSprite(sprite,floater.text,floater.color,critical);this.placeSprite(sprite,floater.x,floater.y-(1-life)*8,critical?84:64,critical?21:16,0,12,Math.min(1,life*2.4),'#ffffff')});
  }

  syncHealthBars(state,settings){
    const active=state.enemies.filter(enemy=>!enemy.dead),bars=[];for(const [index,enemy] of active.entries()){if(!(settings.enemyHp==='ALL'||settings.enemyHp==='ELITES'&&(enemy.elite||enemy.boss||enemy.nemesis||enemy.bounty)))continue;const body=this.pools.enemies[index],x=body?.position.x??enemy.x,width=enemy.boss?76:Math.max(28,enemy.r*2.6),y=(body?.position.y??enemy.y)-enemy.r*1.9,role=enemy.boss?'boss':enemy.type,color=enemy.nemesis?'#edf3f0':enemy.bounty?'#ffd36d':enemyAccent[role]||'#d8a09a',ratio=clamp(enemy.hp/enemy.maxHp);bars.push({x,y,width:width+4,height:6,color:'#030405',alpha:.96});bars.push({x:x-width*(1-ratio)/2,y,width:width*ratio,height:3.5,color,alpha:.98})}
    this.use(this.pools.bars,bars.length,()=>this.mesh(this.flatMaterial()),(mesh,i)=>{const bar=bars[i];mesh.position.set(bar.x,bar.y,10);mesh.scale.set(bar.width,bar.height,1);mesh.material.color.set(bar.color);mesh.material.opacity=bar.alpha});
  }

  destroy(){this.resizeObserver?.disconnect();this.renderer.dispose();for(const texture of Object.values(this.textures))texture.dispose();for(const texture of Object.values(this.pickupTextures))texture.dispose();for(const texture of Object.values(this.enemyRoleTextures))texture.dispose();this.glowTexture.dispose();this.engineTexture.dispose()}
}

export const rendererName=`Three.js r${THREE.REVISION} top-down`;
