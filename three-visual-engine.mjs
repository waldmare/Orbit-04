import * as THREE from './vendor/three.module.min.js';

const TAU=Math.PI*2;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const colorValue=value=>new THREE.Color(value||'#ffffff');

const enemyTexture={
  scout:'assets/visuals/enemy-void-larva-v1.png',
  charger:'assets/visuals/enemy-void-larva-v1.png',
  tank:'assets/visuals/enemy-ossuary-v1.png',
  gunner:'assets/visuals/enemy-ossuary-v1.png',
  splitter:'assets/visuals/enemy-void-larva-v1.png',
  sniper:'assets/visuals/enemy-witness-v1.png',
  boss:'assets/visuals/boss-conquest-leviathan-v1.png'
};

function radialTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const context=canvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.12,'rgba(255,255,255,.72)');gradient.addColorStop(.42,'rgba(255,255,255,.20)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  context.fillStyle=gradient;context.fillRect(0,0,128,128);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function configureTexture(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=8;return texture}

export class OrbitThreeVisualEngine{
  constructor(canvas,{width=960,height=540,scale=1.5}={}){
    this.canvas=canvas;this.width=width;this.height=height;this.scale=scale;this.time=0;this.motionScale=1;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(1);this.renderer.setSize(width*scale,height*scale,false);this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(0,width,0,height,.1,300);this.camera.position.set(0,0,100);this.camera.lookAt(0,0,0);
    this.loader=new THREE.TextureLoader();this.glowTexture=radialTexture();this.textures={
      player:this.load('assets/visuals/player-last-ark-v1.png'),muzzle:this.load('assets/visuals/weapon-muzzle-premium-v1.png'),projectile:this.load('assets/visuals/weapon-projectile-premium-v1.png')
    };
    for(const [key,path] of Object.entries(enemyTexture))this.textures[`enemy-${key}`]=this.load(path);
    this.world=new THREE.Group();this.scene.add(this.world);
    this.playerGlow=this.sprite(this.glowTexture,THREE.AdditiveBlending);this.player=this.sprite(this.textures.player);this.world.add(this.playerGlow,this.player);
    this.pools={enemies:[],enemyGlows:[],allies:[],bullets:[],hostileBullets:[],loot:[],particles:[],muzzles:[],rings:[],beams:[],bars:[],echoes:[],orbitals:[],mines:[],floaters:[],deathGlows:[],deathRings:[]};
    this.lastFrame=performance.now();this.canvas.dataset.engine='three-r185-topdown';this.canvas.dataset.pipeline='aces-topdown-v1';
  }

  load(path){return configureTexture(this.loader.load(path))}
  sprite(texture,blending=THREE.NormalBlending){const material=new THREE.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending,toneMapped:false,alphaTest:.008});const sprite=new THREE.Sprite(material);sprite.visible=false;return sprite}
  textSprite(){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;
    const sprite=this.sprite(texture);sprite.userData={canvas,context:canvas.getContext('2d'),texture,key:''};return sprite;
  }
  updateTextSprite(sprite,text,color,critical){const key=`${text}|${color}|${critical}`;if(sprite.userData.key===key)return;sprite.userData.key=key;const {canvas,context,texture}=sprite.userData;context.clearRect(0,0,canvas.width,canvas.height);context.textAlign='center';context.textBaseline='middle';context.font=`700 ${critical?34:27}px Consolas, monospace`;context.lineJoin='round';context.strokeStyle='rgba(0,0,0,.92)';context.lineWidth=critical?9:7;context.strokeText(text,128,32);context.fillStyle=color||'#e5e8e4';context.fillText(text,128,32);texture.needsUpdate=true}
  mesh(material,geometry=new THREE.PlaneGeometry(1,1)){const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;return mesh}
  use(pool,count,factory,update){while(pool.length<count){const item=factory();pool.push(item);this.world.add(item)}for(let i=0;i<pool.length;i++){const visible=i<count;pool[i].visible=visible;if(visible)update(pool[i],i)}}
  placeSprite(sprite,x,y,width,height,rotation=0,z=1,opacity=1,color='#ffffff'){
    sprite.position.set(x,y,z);sprite.scale.set(width,height,1);sprite.material.rotation=-rotation;sprite.material.opacity=opacity;sprite.material.color.set(color);
  }
  flatMaterial(color='#ffffff',blending=THREE.NormalBlending){return new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending,toneMapped:false})}
  placeBeam(mesh,x1,y1,x2,y2,width,color,opacity,z=6){const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);mesh.position.set((x1+x2)/2,(y1+y2)/2,z);mesh.rotation.z=Math.atan2(dy,dx);mesh.scale.set(length,width,1);mesh.material.color.set(color);mesh.material.opacity=opacity}

  sync(gameState,settings={}){
    const now=performance.now(),dt=clamp((now-this.lastFrame)/1000,1/240,.05);this.lastFrame=now;this.time=gameState?.time||now/1000;this.motionScale=settings.motion==='REDUCED'?.28:1;
    if(!gameState||gameState.mode!=='run'){this.syncMenu(settings);this.renderer.render(this.scene,this.camera);return}
    const state=gameState,quality=settings.graphics||'HIGH',glow=settings.glow!=='OFF';
    const shake=(state.shake||0)*this.motionScale;this.world.position.set(Math.sin(this.time*37)*shake*.09,Math.cos(this.time*29)*shake*.07,0);
    this.syncPlayer(state,settings,glow);this.syncEnemies(state,settings,glow);this.syncAllies(state);this.syncProjectiles(state,settings);this.syncLoot(state,quality);this.syncOrbitals(state);this.syncWorldSignals(state,quality);this.syncTransientFx(state,quality,glow,settings);this.syncDeathFx(state,quality,glow);this.syncFloaters(state);this.syncHealthBars(state,settings);
    this.renderer.toneMappingExposure=quality==='ULTRA'?1.13:quality==='LOW'?1.0:1.07;this.renderer.render(this.scene,this.camera);
  }

  syncMenu(settings){
    const t=performance.now()/1000,x=this.width*.5+Math.sin(t*.35)*18,y=this.height*.56+Math.sin(t*.55)*6,pulse=.88+.08*Math.sin(t*1.5);
    this.player.visible=true;this.playerGlow.visible=settings.glow!=='OFF';this.placeSprite(this.player,x,y,56,84,0,4,1);this.placeSprite(this.playerGlow,x,y,122,122,0,3,.16*pulse,'#b7b18a');
    for(const pool of Object.values(this.pools))for(const item of pool)item.visible=false;
  }

  syncPlayer(state,settings,glow){
    const p=state.p,angle=p._renderAngle??Math.atan2(p._lastMoveY||-1,p._lastMoveX||0),kick=clamp((p.weaponKick||0)/.12),pulse=.88+.12*Math.sin(this.time*(p.hp/p.maxHp<.3?8:2.1));
    const x=p.x-Math.cos(p.weaponAngle??angle)*kick*4.5,y=p.y-Math.sin(p.weaponAngle??angle)*kick*4.5;
    this.player.visible=true;this.player.material.color.set(p.hitFlash>0?'#ffffff':'#d7ddd7');this.placeSprite(this.player,x,y,48*(1+kick*.025),72*(1-kick*.035),angle+Math.PI/2,5,1,p.hitFlash>0?'#ffffff':'#d7ddd7');
    this.playerGlow.visible=glow;this.placeSprite(this.playerGlow,x,y,88+kick*20,88+kick*20,0,3,(p.hp/p.maxHp<.3?.18:.10)*pulse,p.hp/p.maxHp<.3?'#b04450':'#b9ad79');
    const echoes=p.dashFx>0?7:0;this.use(this.pools.echoes,echoes,()=>this.sprite(this.textures.player,THREE.AdditiveBlending),(sprite,i)=>{const t=(i+1)/(echoes+1),fade=1-t;this.placeSprite(sprite,p.x+(p.dashFromX-p.x)*t,p.y+(p.dashFromY-p.y)*t,48*(.9+fade*.08),72*(.9+fade*.08),angle+Math.PI/2,2,.19*fade*clamp(p.dashFx/.32),'#c8bd91')});
  }

  syncEnemies(state,settings,glow){
    const enemies=state.enemies.filter(enemy=>!enemy.dead);
    this.use(this.pools.enemies,enemies.length,()=>this.sprite(this.textures['enemy-scout']),(sprite,i)=>{const enemy=enemies[i],boss=!!enemy.boss,size=enemy.r*(boss?3.8:enemy.elite?3.35:3.05),angle=Math.atan2(state.p.y-enemy.y,state.p.x-enemy.x),breath=1+Math.sin(this.time*(boss?.7:enemy.type==='charger'?3.1:1.6)+i)*.035;sprite.material.map=this.textures[`enemy-${boss?'boss':enemy.type}`]||this.textures['enemy-scout'];sprite.material.needsUpdate=true;this.placeSprite(sprite,enemy.x,enemy.y,size*.67*breath,size/breath,angle+Math.PI/2,4,1,enemy.hit>0?'#ffffff':enemy.bounty?'#d9c27b':'#c5c0b9')});
    this.use(this.pools.enemyGlows,glow?enemies.length:0,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const enemy=enemies[i],priority=enemy.boss||enemy.elite||enemy.nemesis||enemy.bounty,size=enemy.r*(enemy.boss?5.4:priority?4.2:3.1);this.placeSprite(sprite,enemy.x,enemy.y,size,size,0,2,priority?.10:.035,enemy.boss?'#a73749':enemy.bounty?'#c2a45e':'#7e666a')});
  }

  syncAllies(state){
    const allies=state.allies||[];this.use(this.pools.allies,allies.length,()=>this.sprite(this.textures['enemy-scout']),(sprite,i)=>{const ally=allies[i],angle=Math.atan2(ally.vy||-1,ally.vx||0),size=Math.max(28,(ally.r||9)*3.1),texture=this.textures[`enemy-${ally.type}`]||this.textures['enemy-scout'];sprite.material.map=texture;sprite.material.needsUpdate=true;this.placeSprite(sprite,ally.x,ally.y+Math.sin(this.time*2+i)*.6,size*.7,size,angle+Math.PI/2,4,.9,'#9dbdb0')});
  }

  syncProjectiles(state,settings){
    this.use(this.pools.bullets,state.bullets.length,()=>this.sprite(this.textures.projectile,THREE.AdditiveBlending),(sprite,i)=>{const bullet=state.bullets[i],speed=Math.hypot(bullet.vx||0,bullet.vy||0),angle=Math.atan2(bullet.vy||0,bullet.vx||1),missile=bullet.weaponId==='missile',rail=bullet.weaponId==='rail',length=(missile?34:rail?52:24)+Math.min(22,speed*.025),height=missile?11:rail?9:7;this.placeSprite(sprite,bullet.x,bullet.y,length,height,angle,7,.84,bullet.color||'#d5d9cd')});
    this.use(this.pools.hostileBullets,state.enemyBullets.length,()=>this.sprite(this.glowTexture,THREE.AdditiveBlending),(sprite,i)=>{const bullet=state.enemyBullets[i],pulse=.9+.1*Math.sin(this.time*27+i),size=(bullet.r+4.2)*2*pulse;this.placeSprite(sprite,bullet.x,bullet.y,size,size,0,7,1,'#ff3657')});
  }

  syncLoot(state,quality){
    const items=[...state.orbs.map(item=>({item,type:'orb'})),...state.caches.map(item=>({item,type:'cache'})),...(state.worldNodes||[]).filter(item=>item.active&&!item.collected).map(item=>({item,type:'signal'}))];
    this.use(this.pools.loot,items.length,()=>this.mesh(this.flatMaterial('#ffffff',THREE.AdditiveBlending)),(mesh,i)=>{const {item,type}=items[i],signal=type==='signal',cache=type==='cache',size=signal?14:cache?10:item.r>4?7:4.5,color=signal?item.color:cache?(item.rarity==='OMEGA'?'#ffffff':item.rarity==='RARE'?'#d5b46c':'#9caaa3'):(item.r>4?'#d3b36c':'#8eb5a6');mesh.position.set(item.x,item.y+Math.sin(this.time*2+i)*1.2,6);mesh.rotation.z=this.time*(signal?.45:1.1)+Math.PI/4;mesh.scale.set(size,size,1);mesh.material.color.set(color);mesh.material.opacity=.92});
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
    const enemies=state.enemies.filter(enemy=>!enemy.dead&&(settings.enemyHp==='ALL'||settings.enemyHp==='ELITES'&&enemy.elite));const bars=[];for(const enemy of enemies){const width=enemy.boss?72:Math.max(26,enemy.r*2.5),y=enemy.y-enemy.r*1.75;bars.push({x:enemy.x,y,width,height:3,color:'#17100f',alpha:.9});bars.push({x:enemy.x-width*(1-enemy.hp/enemy.maxHp)/2,y,width:width*clamp(enemy.hp/enemy.maxHp),height:3,color:enemy.boss?'#b64d5c':'#b79d64',alpha:.95})}
    this.use(this.pools.bars,bars.length,()=>this.mesh(this.flatMaterial()),(mesh,i)=>{const bar=bars[i];mesh.position.set(bar.x,bar.y,10);mesh.scale.set(bar.width,bar.height,1);mesh.material.color.set(bar.color);mesh.material.opacity=bar.alpha});
  }

  destroy(){this.renderer.dispose();for(const texture of Object.values(this.textures))texture.dispose();this.glowTexture.dispose()}
}

export const rendererName=`Three.js r${THREE.REVISION} top-down`;
