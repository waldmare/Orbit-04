'use strict';

// ORBIT//04 sprite renderer. Gameplay owns the simulation; this module only
// presents it through retained Phaser objects so visuals are not rebuilt every frame.
(()=>{
  const TAU=Math.PI*2;
  const tintValue=value=>{
    if(typeof value==='number')return value;
    const clean=String(value||'#ffffff').replace('#','');
    const parsed=Number.parseInt(clean.length===3?clean.split('').map(x=>x+x).join(''):clean,16);
    return Number.isFinite(parsed)?parsed:0xffffff;
  };
  const palette={
    striker:0xdaf8ff,bastion:0xffd383,wraith:0xc7b8ff,specter:0x9dd8ff,bulwark:0xa0ffd9,
    oracle:0xd6c1ff,vector:0xffb4ff,talon:0xffcf8c,halo:0xc2b8ff,event:0xd49cff
  };
  const enemyTint={
    scout:0xff7893,charger:0xffc36c,tank:0xff936f,gunner:0xc49aff,splitter:0xffa8dc,sniper:0x8bb7ff,boss:0xffffff
  };
  const enemyTexture={scout:'enemy-scout-v3',charger:'enemy-charger-v3',tank:'enemy-tank-v3',gunner:'enemy-gunner-v3',splitter:'enemy-splitter-v3',sniper:'enemy-sniper-v3',boss:'boss-carrier-v3'};
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
  const smoothValue=(current,target,response,delta)=>target+(current-target)*Math.exp(-response*delta);
  const smoothAngle=(current,target,response,delta)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-response*delta));
  const easeOutCubic=value=>1-Math.pow(1-clamp(value),3);
  const easeOutBack=value=>{const x=clamp(value),c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};

  class OrbitVisualEngine{
    constructor(scene,{width=960,height=540,scale=1.5}={}){
      this.scene=scene;this.width=width;this.height=height;this.scale=scale;this.time=0;this.playerAngle=-Math.PI/2;this.lastSync=performance.now()/1000;this.motionScale=1;this.shakePhase=0;this.entityIds=new WeakMap();this.nextEntityId=1;
      this.makeTextures();
      this.root=scene.add.container(0,0).setScale(scale).setDepth(3);
      this.lootLayer=scene.add.container();this.trailLayer=scene.add.container();this.enemyLayer=scene.add.container();
      this.projectileLayer=scene.add.container();this.playerLayer=scene.add.container();this.particleLayer=scene.add.container();
      this.root.add([this.lootLayer,this.trailLayer,this.enemyLayer,this.projectileLayer,this.playerLayer,this.particleLayer]);
      this.siteFx=scene.add.graphics().setDepth(2.7).setScale(scale);
      this.fx=scene.add.graphics().setDepth(3.5).setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
      this.player=this.createPlayer();this.playerLayer.add(this.player.root);
      this.dashEchoes=Array.from({length:8},()=>scene.add.image(0,0,'player-ship-v3').setBlendMode(Phaser.BlendModes.ADD).setTint(0x8de9ff).setVisible(false));this.trailLayer.add(this.dashEchoes);
      this.enemies=this.pool(()=>this.createEnemy());
      this.allies=this.pool(()=>this.createAlly());
      this.friendlyBullets=this.pool(()=>this.createProjectile('orbit-bullet-friendly'));
      this.hostileBullets=this.pool(()=>this.createProjectile('orbit-bullet-hostile'));
      this.loot=this.pool(()=>this.createLoot());
      this.particles=this.pool(()=>this.createParticle());
      this.floaters=this.pool(()=>this.createFloater());
      this.drones=this.pool(()=>this.createMarker('orbit-drone'));
      this.blades=this.pool(()=>this.createMarker('orbit-blade'));
      this.mines=this.pool(()=>this.createMarker('orbit-mine'));
      this.menuHalo=scene.add.image(0,0,'orbit-ring').setDisplaySize(112,112).setAlpha(.18).setBlendMode(Phaser.BlendModes.ADD);
      this.playerLayer.addAt(this.menuHalo,0);
      try{scene.cameras.main.postFX?.addVignette?.(.5,.5,.92,.34)}catch(_error){}
    }

    makeTextures(){
      const texture=(key,w,h,draw)=>{
        if(this.scene.textures.exists(key))return;
        const g=this.scene.make.graphics({x:0,y:0,add:false});draw(g);g.generateTexture(key,w,h);g.destroy();
      };
      texture('orbit-glow',128,128,g=>{
        for(let i=12;i>0;i--){g.fillStyle(0xffffff,.012+(12-i)*.002);g.fillCircle(64,64,i*5)}
        g.fillStyle(0xffffff,.38);g.fillCircle(64,64,10);g.fillStyle(0xffffff,.92);g.fillCircle(64,64,3);
      });
      texture('orbit-plume',24,64,g=>{
        for(let i=0;i<12;i++){const y=4+i*4.7,r=7.5-i*.48;g.fillStyle(0x45d9ff,.22*(1-i/12));g.fillCircle(12,y,Math.max(1.3,r))}
        g.fillStyle(0xffffff,.85);g.fillCircle(12,4,3.2);
      });
      texture('orbit-bullet-friendly',48,16,g=>{
        g.fillStyle(0x65e7ff,.15);g.fillCircle(10,8,8);g.fillRect(10,1,28,14);g.fillCircle(38,8,7);
        g.fillStyle(0xbff8ff,.8);g.fillRect(8,5,31,6);g.fillCircle(39,8,3);g.fillStyle(0xffffff,1);g.fillRect(22,7,18,2);
      });
      texture('orbit-bullet-hostile',42,18,g=>{
        g.fillStyle(0xff244d,.18);g.fillCircle(9,9,9);g.fillRect(9,1,23,16);g.fillCircle(32,9,8);
        g.fillStyle(0xff5b75,.84);g.fillRect(7,5,27,8);g.fillCircle(34,9,4);g.fillStyle(0xffffff,.92);g.fillRect(22,8,13,2);
      });
      texture('orbit-loot',32,32,g=>{
        g.fillStyle(0xffffff,.15);g.fillPoints([{x:16,y:0},{x:32,y:16},{x:16,y:32},{x:0,y:16}],true);
        g.fillStyle(0xffffff,.94);g.fillPoints([{x:16,y:5},{x:27,y:16},{x:16,y:27},{x:5,y:16}],true);
        g.fillStyle(0x08131d,1);g.fillPoints([{x:16,y:10},{x:22,y:16},{x:16,y:22},{x:10,y:16}],true);g.fillStyle(0xffffff,1);g.fillCircle(16,16,2);
      });
      texture('orbit-particle',24,24,g=>{g.fillStyle(0xffffff,.12);g.fillCircle(12,12,11);g.fillStyle(0xffffff,.42);g.fillCircle(12,12,5);g.fillStyle(0xffffff,1);g.fillCircle(12,12,1.8)});
      texture('orbit-ring',128,128,g=>{for(let i=0;i<3;i++){g.lineStyle(2-i*.45,0xffffff,.36-i*.08);g.strokeCircle(64,64,46+i*8)}g.lineStyle(1,0xffffff,.8);for(let i=0;i<12;i++){const a=i*TAU/12,c=Math.cos(a),s=Math.sin(a);g.beginPath();g.moveTo(64+c*51,64+s*51);g.lineTo(64+c*58,64+s*58);g.strokePath()}});
      texture('orbit-rank',80,80,g=>{g.lineStyle(2,0xffffff,.8);g.strokeCircle(40,40,32);for(let i=0;i<4;i++){const a=i*Math.PI/2,c=Math.cos(a),s=Math.sin(a);g.beginPath();g.moveTo(40+c*28,40+s*28);g.lineTo(40+c*38,40+s*38);g.strokePath()}});
      texture('orbit-drone',28,28,g=>{g.fillStyle(0xffffff,.95);g.fillPoints([{x:14,y:1},{x:26,y:14},{x:14,y:24},{x:2,y:14}],true);g.fillStyle(0x07151a,1);g.fillPoints([{x:14,y:7},{x:20,y:14},{x:14,y:19},{x:8,y:14}],true);g.fillStyle(0xffffff,1);g.fillCircle(14,14,2)});
      texture('orbit-blade',42,42,g=>{g.fillStyle(0xffffff,.14);g.fillPoints([{x:21,y:0},{x:27,y:15},{x:42,y:21},{x:27,y:27},{x:21,y:42},{x:15,y:27},{x:0,y:21},{x:15,y:15}],true);g.fillStyle(0xffffff,.94);g.fillRect(3,19,36,4);g.fillRect(19,3,4,36);g.fillStyle(0xffffff,1);g.fillCircle(21,21,4)});
      texture('orbit-mine',36,36,g=>{g.fillStyle(0xffffff,.18);g.fillCircle(18,18,17);g.fillStyle(0xffffff,.9);g.fillPoints([{x:18,y:2},{x:33,y:18},{x:18,y:34},{x:3,y:18}],true);g.fillStyle(0x090714,1);g.fillCircle(18,18,8);g.fillStyle(0xffffff,1);g.fillCircle(18,18,3)});
    }

    pool(factory){return{factory,items:[]}}
    use(pool,count,update){
      while(pool.items.length<count)pool.items.push(pool.factory());
      for(let i=0;i<count;i++){const item=pool.items[i];item.root.setVisible(true);update(item,i)}
      for(let i=count;i<pool.items.length;i++)pool.items[i].root.setVisible(false);
    }
    addTo(layer,objects){layer.add(objects);return objects}

    motion(){return{x:0,y:0,angle:-Math.PI/2,bank:0,spawn:0,lastX:0,lastY:0,id:0,ready:false}}
    entityId(entity){let id=this.entityIds.get(entity);if(!id){id=this.nextEntityId++;this.entityIds.set(entity,id)}return id}
    resetMotion(view,entity,x,y,angle){const id=entity?this.entityId(entity):0,m=view.motion;if(m.id!==id||!m.ready){m.id=id;m.x=x;m.y=y;m.lastX=x;m.lastY=y;m.angle=angle;m.bank=0;m.spawn=0;m.ready=true;return true}return false}

    createPlayer(){
      const root=this.scene.add.container(),glow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        plumeL=this.scene.add.image(-5,17,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        plumeR=this.scene.add.image(5,17,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        shadow=this.scene.add.ellipse(2,4,34,17,0x000000,0).setVisible(false),
        hullGlow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        body=this.scene.add.image(0,0,'player-ship-v3'),shield=this.scene.add.image(0,0,'orbit-ring').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      root.add([glow,plumeL,plumeR,shadow,hullGlow,body,shield]);return{root,glow,plumeL,plumeR,shadow,hullGlow,body,shield,motion:this.motion()};
    }
    createEnemy(){
      const root=this.scene.add.container(),plume=this.scene.add.image(0,0,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        body=this.scene.add.image(0,0,'enemy-scout-v3'),
        hpBg=this.scene.add.rectangle(0,0,1,3,0x12060a,.9).setOrigin(0,.5),hpFill=this.scene.add.rectangle(0,0,1,3,0xff6177,.96).setOrigin(0,.5);
      root.add([plume,body,hpBg,hpFill]);this.enemyLayer.add(root);return{root,plume,body,hpBg,hpFill,motion:this.motion()};
    }
    createAlly(){
      const root=this.scene.add.container(),plume=this.scene.add.image(0,0,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setTint(0x8dffd6).setVisible(false),body=this.scene.add.image(0,0,'enemy-scout-v3').setTint(0x8dffd6);
      root.add([plume,body]);this.enemyLayer.add(root);return{root,plume,body,motion:this.motion()};
    }
    createProjectile(texture){const root=this.scene.add.image(0,0,texture).setBlendMode(Phaser.BlendModes.ADD);this.projectileLayer.add(root);return{root}}
    createLoot(){const root=this.scene.add.image(0,0,'orbit-loot').setBlendMode(Phaser.BlendModes.ADD);this.lootLayer.add(root);return{root,body:root,motion:this.motion()}}
    createParticle(){const root=this.scene.add.image(0,0,'orbit-particle').setBlendMode(Phaser.BlendModes.ADD);this.particleLayer.add(root);return{root}}
    createFloater(){const root=this.scene.add.text(0,0,'',{fontFamily:'Cascadia Mono, Consolas, monospace',fontSize:'10px',fontStyle:'700',color:'#bdefff',stroke:'#02060b',strokeThickness:3}).setOrigin(.5).setDepth(2);this.particleLayer.add(root);return{root}}
    createMarker(texture){const root=this.scene.add.image(0,0,texture).setBlendMode(Phaser.BlendModes.ADD);this.projectileLayer.add(root);return{root}}

    fitSprite(sprite,size,multiplier=1){
      const frame=sprite.frame,w=frame?.realWidth||frame?.width||1,h=frame?.realHeight||frame?.height||1,scale=size*multiplier/Math.max(w,h);
      sprite.setDisplaySize(w*scale,h*scale);return sprite;
    }

    setShip(view,size,tint,hit=false){
      this.fitSprite(view.body,size);
      view.shadow.setDisplaySize(size*.72,size*.34).setPosition(2,4);
      view.hullGlow.setDisplaySize(size*1.10,size*1.10).setTint(tint);
      view.glow.setDisplaySize(size*1.38,size*1.38).setTint(tint);
      view.body.clearTint();if(hit&&view.body.setTintFill)view.body.setTintFill(0xffffff);else view.body.setTint(tint);
      view.plumeL.setDisplaySize(Math.max(3.5,size*.10),size*.46);view.plumeR.setDisplaySize(Math.max(3.5,size*.10),size*.46);
      view.shield.setDisplaySize(size*1.32,size*1.32);
    }

    sync(gameState,settings={}){
      const now=performance.now()/1000,delta=clamp(now-this.lastSync,1/240,.05);this.lastSync=now;this.delta=delta;this.time=gameState?.time??now;this.motionScale=settings.motion==='REDUCED'?.28:1;
      const quality=settings.graphics||'HIGH',glowOn=settings.glow!=='OFF',particlesOn=settings.particles!=='OFF';
      this.fx.clear();this.siteFx.clear();this.menuHalo.setVisible(!gameState||gameState.mode!=='run');
      if(!gameState||gameState.mode!=='run'){
        const x=this.width*.5+Math.sin(this.time*.35)*18,y=this.height*.56+Math.sin(this.time*.55)*6,size=quality==='LOW'?88:102;
        this.resetMotion(this.player,null,x,y,-Math.PI/2);const m=this.player.motion;m.x=smoothValue(m.x,x,4,delta);m.y=smoothValue(m.y,y,4,delta);m.angle=smoothAngle(m.angle,-Math.PI/2,5,delta);this.player.root.setPosition(m.x,m.y).setRotation(m.angle+Math.PI/2);
        this.setShip(this.player,size,palette[settings.selected]||palette.striker,false);const pulse=.5+.5*Math.sin(now*1.9);this.player.glow.setVisible(false);this.player.hullGlow.setVisible(false);this.player.shield.setVisible(false);this.player.shadow.setVisible(false);
        this.player.plumeL.setVisible(true).setAlpha(.36+.10*pulse).setDisplaySize(7,30+pulse*5);this.player.plumeR.setVisible(true).setAlpha(.36+.10*(1-pulse)).setDisplaySize(7,30+(1-pulse)*5);this.menuHalo.setVisible(false);
        for(const echo of this.dashEchoes)echo.setVisible(false);this.hideCombatPools();return;
      }
      const p=gameState.p,pm=this.player.motion;this.resetMotion(this.player,p,p.x,p.y,this.playerAngle);const moving=!!p.moving,direction=moving?Math.atan2(p._lastMoveY||0,p._lastMoveX||0):pm.angle;
      pm.x=smoothValue(pm.x,p.x,28,delta);pm.y=smoothValue(pm.y,p.y,28,delta);const angleBefore=pm.angle;pm.angle=smoothAngle(pm.angle,direction,moving?13:7,delta);const turn=Math.atan2(Math.sin(pm.angle-angleBefore),Math.cos(pm.angle-angleBefore))/Math.max(delta,.001);pm.bank=smoothValue(pm.bank,clamp(turn*.017,-.13,.13)*this.motionScale,9,delta);this.playerAngle=pm.angle;
      const dashActive=(p.dashFx||0)>0,dashPower=clamp((p.dashFx||0)/.32),enginePulse=.72+.18*Math.sin(now*25)+.10*Math.sin(now*43),thrust=moving?1:.35;
      this.player.root.setPosition(pm.x,pm.y).setRotation(pm.angle+Math.PI/2+pm.bank).setScale(1+(dashActive?easeOutCubic(dashPower)*.075:0),1-(dashActive?dashPower*.025:0));
      this.setShip(this.player,52,palette[p.frame]||palette.striker,p.hitFlash>0);this.player.body.setPosition(0,Math.sin(now*3.2)*.45*this.motionScale);
      this.player.plumeL.setVisible(true).setAlpha((.28+.58*thrust)*enginePulse).setDisplaySize(5.2+thrust*2.4,18+thrust*23+dashPower*28);this.player.plumeR.setVisible(true).setAlpha((.28+.58*thrust)*(1.05-enginePulse*.18)).setDisplaySize(5.2+thrust*2.4,18+thrust*22+dashPower*26);
      this.player.glow.setVisible(false);this.player.hullGlow.setVisible(false);this.player.shadow.setVisible(false);this.player.shield.setVisible(false);
      for(let i=0;i<this.dashEchoes.length;i++){const echo=this.dashEchoes[i],trail=(i+1)/(this.dashEchoes.length+1),fade=1-trail;if(dashActive){const eased=trail*trail*(3-2*trail);echo.setVisible(true).setPosition(p.x+(p.dashFromX-p.x)*eased,p.y+(p.dashFromY-p.y)*eased).setRotation(pm.angle+Math.PI/2).setDisplaySize(52*(.92+fade*.13),52*(.92+fade*.13)).setAlpha(dashPower*fade*.31).setTint(i%2?0x8dffd6:0x8de9ff)}else echo.setVisible(false)}
      const shake=(gameState.shake||0)*this.motionScale;this.shakePhase+=delta*(20+shake*1.4);const shakeEnvelope=shake*clamp(shake/8,.25,1);this.root.setPosition(Math.sin(this.shakePhase*1.07)*shakeEnvelope*.34,Math.cos(this.shakePhase*1.43)*shakeEnvelope*.27);this.fx.setPosition(this.root.x*this.scale,this.root.y*this.scale);
      this.drawWorldSites(gameState,quality);this.syncEnemies(gameState,settings);this.syncAllies(gameState);this.syncProjectiles(gameState);
      this.syncLoot(gameState);this.syncOrbitals(gameState);this.syncParticles(gameState,particlesOn);this.syncFloaters(gameState);this.drawEnergyEffects(gameState,settings,quality,glowOn);this.syncDeathFx(gameState,quality,glowOn);
    }

    hideCombatPools(){for(const pool of [this.enemies,this.allies,this.friendlyBullets,this.hostileBullets,this.loot,this.particles,this.floaters,this.drones,this.blades,this.mines])this.use(pool,0,()=>{})}
    syncEnemies(s,settings){
      this.use(this.enemies,s.enemies.length,(v,i)=>{
        const e=s.enemies[i],boss=!!e.boss,size=boss?e.r*3.75:e.r*(e.elite?3.35:3.0),targetAngle=Math.atan2(s.p.y-e.y,s.p.x-e.x),m=v.motion,fresh=this.resetMotion(v,e,e.x,e.y,targetAngle),delta=this.delta;
        const oldAngle=m.angle;m.x=smoothValue(m.x,e.x,boss?9:17,delta);m.y=smoothValue(m.y,e.y,boss?9:17,delta);m.angle=smoothAngle(m.angle,targetAngle,boss?4.2:8.5,delta);const turn=Math.atan2(Math.sin(m.angle-oldAngle),Math.cos(m.angle-oldAngle))/Math.max(delta,.001);m.bank=smoothValue(m.bank,clamp(turn*.012,-.10,.10)*this.motionScale,7,delta);m.spawn=clamp(m.spawn+delta*(boss?.80:e.elite?1.25:2.15));
        const spawnScale=fresh?.28:easeOutBack(m.spawn),hover=Math.sin(this.time*(boss?.82:e.elite?1.3:1.8)+m.id*.71)*(boss?1.7:e.elite?.8:.3)*this.motionScale,hitKick=clamp((e.hit||0)/.07)*4.5;
        v.root.setPosition(m.x,m.y+hover).setScale(spawnScale*(1+Math.abs(m.bank)*.28),spawnScale*(1-Math.abs(m.bank)*.18)).setAlpha(easeOutCubic(m.spawn));const texture=boss?enemyTexture.boss:(enemyTexture[e.type]||enemyTexture.scout);v.body.setTexture(texture);
        this.fitSprite(v.body,size);v.body.setRotation(m.angle+Math.PI/2+m.bank).setPosition(-Math.cos(m.angle)*hitKick,-Math.sin(m.angle)*hitKick);
        v.body.clearTint();if(e.hit>0&&v.body.setTintFill)v.body.setTintFill(0xffffff);else if(e.bounty)v.body.setTint(0xffdf70);
        const thrust=.72+.18*Math.sin(this.time*19+m.id),backX=-Math.cos(m.angle)*size*.31,backY=-Math.sin(m.angle)*size*.31;
        v.plume.setVisible(!boss).setPosition(backX,backY).setRotation(m.angle+Math.PI/2).setDisplaySize(Math.max(3.4,size*.10),size*(.30+thrust*.15)).setTint(enemyTint[e.type]||0xff7893).setAlpha(.36+.28*thrust);
        const hpMode=settings.enemyHp,show=hpMode==='ALL'||(hpMode==='ELITES'&&e.elite),bw=boss?72:Math.max(25,e.r*2.5),y=-size*.47;
        v.hpBg.setVisible(show).setPosition(-bw/2,y).setDisplaySize(bw,3.2);v.hpFill.setVisible(show).setPosition(-bw/2,y).setDisplaySize(bw*Math.max(0,Math.min(1,e.hp/e.maxHp)),3.2).setFillStyle(boss?0xff536b:0xffd27a,.98);
      });
    }
    syncAllies(s){
      this.use(this.allies,s.allies.length,(v,i)=>{const a=s.allies[i],target=s.enemies.find(e=>!e.dead),targetAngle=target?Math.atan2(target.y-a.y,target.x-a.x):-Math.PI/2,size=Math.max(25,(a.r||9)*3),texture=enemyTexture[a.type]||enemyTexture.scout,m=v.motion;this.resetMotion(v,a,a.x,a.y,targetAngle);m.x=smoothValue(m.x,a.x,18,this.delta);m.y=smoothValue(m.y,a.y,18,this.delta);m.angle=smoothAngle(m.angle,targetAngle,9,this.delta);m.spawn=clamp(m.spawn+this.delta*2.4);const scale=easeOutBack(m.spawn),pulse=.5+.5*Math.sin(this.time*9+m.id);v.root.setPosition(m.x,m.y+Math.sin(this.time*2+m.id)*.45*this.motionScale).setScale(scale).setAlpha(easeOutCubic(m.spawn));v.body.setTexture(texture).clearTint().setTint(0x8dffd6).setRotation(m.angle+Math.PI/2);this.fitSprite(v.body,size);v.plume.setVisible(true).setPosition(-Math.cos(m.angle)*size*.30,-Math.sin(m.angle)*size*.30).setRotation(m.angle+Math.PI/2).setDisplaySize(Math.max(3,size*.09),size*(.34+.10*pulse)).setAlpha(.45)});
    }
    syncProjectiles(s){
      this.use(this.friendlyBullets,s.bullets.length,(v,i)=>{const b=s.bullets[i],speed=Math.hypot(b.vx||0,b.vy||0),pulse=.92+.08*Math.sin(this.time*32+i*.7);v.root.setPosition(b.x,b.y).setRotation(speed?Math.atan2(b.vy,b.vx):0).setDisplaySize((Math.max(11,b.r*4.8)+Math.min(13,speed*.018))*pulse,Math.max(3,b.r*1.7)).setTint(tintValue(b.color)).setAlpha(.90+.08*pulse)});
      this.use(this.hostileBullets,s.enemyBullets.length,(v,i)=>{const b=s.enemyBullets[i],speed=Math.hypot(b.vx||0,b.vy||0),pulse=.90+.10*Math.sin(this.time*25+i*.91);v.root.setPosition(b.x,b.y).setRotation(speed?Math.atan2(b.vy,b.vx):0).setDisplaySize((Math.max(10,b.r*4.2)+Math.min(10,speed*.016))*pulse,Math.max(3.5,b.r*1.75)).setTint(0xff657b).setAlpha(.90+.08*pulse)});
    }
    drawWorldSites(s,quality){
      const sites=(s.worldSites||[]).filter(site=>site.active);this.siteFx.setVisible(true);
      for(const site of sites){const {x,y,size,kind,seed=0}=site,pulse=.5+.5*Math.sin(this.time*.58+seed*8),drift=this.time*(.018+seed*.025)*this.motionScale;
        if(kind==='asteroids'){this.siteFx.fillStyle(0x60717d,.13);for(let i=0;i<(quality==='LOW'?4:8);i++){const a=seed*12+i*2.19+drift*(i%2?-1:1),r=size*(.18+(i%3)*.16),rr=size*(.06+(i%2)*.026)*(1+.05*Math.sin(this.time*.8+i));this.siteFx.fillCircle(x+Math.cos(a)*r,y+Math.sin(a)*r,rr);if(quality==='ULTRA'){this.siteFx.lineStyle(.8,0xb5c7cf,.08).strokeCircle(x+Math.cos(a)*r-rr*.18,y+Math.sin(a)*r-rr*.16,rr*.70)}}this.siteFx.lineStyle(1,0x8ca0aa,.10+.05*pulse).strokeCircle(x,y,size*(.57+.012*pulse))}
        else if(kind==='wreck'){const sway=Math.sin(this.time*.32+seed*11)*size*.018*this.motionScale;this.siteFx.lineStyle(3,0x738b99,.20).beginPath().moveTo(x-size*.55,y+size*.18+sway).lineTo(x+size*.48,y-size*.22-sway).strokePath();this.siteFx.lineStyle(1.2,0x9bc5d3,.15+.05*pulse).strokeCircle(x-size*.12,y,size*(.24+.012*pulse));for(let i=0;i<5;i++){const a=seed*9+i*1.55+drift*(i%2?-2:1.4);this.siteFx.fillStyle(0x8ca8b5,.13+.04*pulse).fillCircle(x+Math.cos(a)*size*.52,y+Math.sin(a)*size*.35,2+i%2)}}
        else if(kind==='ion'){this.siteFx.fillStyle(0x2d9fbd,.025+.018*pulse).fillCircle(x,y,size*(.70+.035*pulse));for(let i=0;i<4;i++){const wave=(this.time*(5+i*1.2)+seed*19+i*13)%18;this.siteFx.lineStyle(1+i*.28,0x6de5ff,.055+i*.022).strokeCircle(x,y,size*(.22+i*.15)+wave)}}
        else{this.siteFx.fillStyle(0x6c4ac5,.025+.016*pulse).fillCircle(x,y,size*(.66+.03*pulse));for(let i=0;i<5;i++){const wobble=Math.sin(this.time*.55+i+seed*7)*size*.018*this.motionScale;this.siteFx.lineStyle(1+i*.12,i%2?0x9b7cff:0x6de5ff,.05+i*.016).strokeEllipse(x+wobble,y-wobble,size*(.32+i*.13),size*(.18+i*.085))}}
      }
    }
    syncLoot(s){
      const items=[...s.orbs.map(x=>({entity:x,x,type:'orb'})),...s.caches.map(x=>({entity:x,x,type:'cache'})),...(s.worldNodes||[]).filter(x=>x.active&&!x.collected).map(x=>({entity:x,x,type:'signal'}))];
      this.use(this.loot,items.length,(v,i)=>{const {entity,x,type}=items[i],cache=type==='cache',signal=type==='signal',col=signal?tintValue(x.color):cache?(x.rarity==='PARADOX'?0xbd9cff:x.rarity==='OMEGA'?0xffffff:x.rarity==='RARE'?0xffd27a:0x8de9ff):(x.r>4?0xffd27a:0x62f4dd),size=signal?(x.disposition==='hazard'?34:29):cache?23:(x.r>4?15:10),m=v.motion;this.resetMotion(v,entity,x.x,x.y,0);m.x=smoothValue(m.x,x.x,signal?12:20,this.delta);m.y=smoothValue(m.y,x.y,signal?12:20,this.delta);m.spawn=clamp(m.spawn+this.delta*(signal?1.35:2.8));const hover=Math.sin(this.time*(signal?1.35:2.2)+m.id)*((signal?2.8:1.2)*this.motionScale),entry=easeOutBack(m.spawn),spin=this.time*(signal?.42:cache?.72:1.18)+(x.x||0)*.01;v.root.setPosition(m.x,m.y+hover).setAlpha(easeOutCubic(m.spawn)).setDisplaySize(size*entry,size*entry).setTint(col).setRotation(spin)});
    }
    syncOrbitals(s){
      const dw=s.weapons.drone,dr=[];if(dw){const n=1+(dw.level>=2?1:0)+(dw.level>=5?1:0)+(dw.evolved?2:0)+(s.p.droneBonus||0);for(let i=0;i<n;i++){const a=s.time*(dw.evolved?1.75:1.15)+i*TAU/n;dr.push({x:s.p.x+Math.cos(a)*36,y:s.p.y+Math.sin(a)*36,evolved:dw.evolved,a})}}
      this.use(this.drones,dr.length,(v,i)=>{const d=dr[i],pulse=.94+.08*Math.sin(this.time*7+i*1.7),size=(d.evolved?17:14)*pulse;v.root.setPosition(d.x,d.y+Math.sin(this.time*3+i)*.65*this.motionScale).setDisplaySize(size,size).setTint(d.evolved?0xffffff:0x8dffd6).setRotation(d.a+Math.PI/2+Math.sin(this.time*2+i)*.08*this.motionScale).setAlpha(.92+.06*pulse)});
      const bw=s.weapons.blade,bl=[];if(bw){const n=2+(bw.level>=2?1:0)+(bw.level>=6?1:0)+(bw.evolved?2:0)+(s.synergies.razorWing?1:0),r=43*(bw.level>=5?1.18:1)*(bw.evolved?1.18:1)*s.p.areaMul;for(let i=0;i<n;i++){const a=s.time*(bw.evolved?3:2.15)+i*TAU/n;bl.push({x:s.p.x+Math.cos(a)*r,y:s.p.y+Math.sin(a)*r,evolved:bw.evolved,a})}}
      this.use(this.blades,bl.length,(v,i)=>{const b=bl[i],pulse=.94+.08*Math.sin(this.time*12+i);v.root.setPosition(b.x,b.y).setDisplaySize((b.evolved?22:18)*pulse,(b.evolved?22:18)*pulse).setTint(b.evolved?0xffffff:0xbd9cff).setRotation(b.a+this.time*3.2).setAlpha(.88+.08*pulse)});
      this.use(this.mines,s.mines.length,(v,i)=>{const m=s.mines[i],pulse=.88+.12*Math.sin(this.time*4.8+i);v.root.setPosition(m.x,m.y+Math.sin(this.time*1.8+i)*.8*this.motionScale).setDisplaySize(19*pulse,19*pulse).setTint(0xbd9cff).setRotation(-this.time*.8+i).setAlpha(.88+.08*pulse)});
    }
    syncParticles(s,on){
      const source=on?s.particles:[];this.use(this.particles,source.length,(v,i)=>{const q=source[i],life=clamp((q.life||0)*2),speed=Math.hypot(q.vx||0,q.vy||0),length=5+life*5+Math.min(8,speed*.035),width=3+life*4;v.root.setPosition(q.x,q.y).setRotation(speed>2?Math.atan2(q.vy,q.vx):0).setDisplaySize(length,width).setTint(tintValue(q.color)).setAlpha(life*.66)});
    }
    syncFloaters(s){const source=s.floaters||[];this.use(this.floaters,source.length,(v,i)=>{const f=source[i],life=clamp(f.life/f.maxLife),arrival=clamp((1-life)*5),scale=f.crit?(1.32-.20*easeOutCubic(arrival)):(.82+.18*easeOutBack(arrival));v.root.setPosition(f.x,f.y-3*easeOutCubic(arrival)).setText(f.text).setColor(f.color).setFontSize(f.crit?14:10).setScale(scale).setAlpha(Math.min(1,life*2.4,arrival*2.5))})}
    drawEnergyEffects(s,settings,quality,glowOn){
      const line=(x1,y1,x2,y2,color,alpha,width)=>{this.fx.lineStyle(width,tintValue(color),alpha);this.fx.beginPath();this.fx.moveTo(x1,y1);this.fx.lineTo(x2,y2);this.fx.strokePath()};
      const p=s.p,playerColor=p.hp/p.maxHp<.30?0xff6177:0x8de9ff;
      if(glowOn){
        this.fx.fillStyle(playerColor,quality==='ULTRA'?.11:.075);this.fx.fillCircle(p.x,p.y,quality==='ULTRA'?32:27);
        const trailLength=p.moving?34:18,backX=p.x-Math.cos(this.playerAngle)*trailLength,backY=p.y-Math.sin(this.playerAngle)*trailLength;line(p.x,p.y,backX,backY,'#65e7ff',.18,p.moving?8:4);line(p.x,p.y,backX,backY,'#d9fdff',.62,p.moving?1.5:.8);
        for(const e of s.enemies){if(e.dead)continue;const color=e.boss?0xff3159:(enemyTint[e.type]||tintValue(e.color));this.fx.fillStyle(color,e.boss?.10:e.elite?.065:.032);this.fx.fillCircle(e.x,e.y,e.r*(e.boss?2.6:e.elite?2.15:1.75))}
        for(const orb of s.orbs){const color=orb.r>4?0xffd27a:0x62f4dd,pulse=.75+.25*Math.sin(this.time*4+orb.x*.02);this.fx.fillStyle(color,.055*pulse).fillCircle(orb.x,orb.y,orb.r*2.6)}
        for(const cache of s.caches){const color=cache.rarity==='PARADOX'?0xbd9cff:cache.rarity==='OMEGA'?0xffffff:cache.rarity==='RARE'?0xffd27a:0x8de9ff,pulse=.72+.28*Math.sin(this.time*3.2+cache.x*.02);this.fx.fillStyle(color,.07*pulse).fillCircle(cache.x,cache.y,18+pulse*3);this.fx.lineStyle(1.2,color,.22*pulse).strokeCircle(cache.x,cache.y,13+pulse*2)}
      }
      if(p.iFrames>0||p.dashFx>0){const shieldPower=clamp(Math.max((p.iFrames||0)*2.4,(p.dashFx||0)*3.1)),radius=29+Math.sin(this.time*9)*1.2*this.motionScale;this.fx.lineStyle(1.4,0x8de9ff,.18+.32*shieldPower).strokeCircle(p.x,p.y,radius);this.fx.lineStyle(4,0x8dffd6,.04+.07*shieldPower).strokeCircle(p.x,p.y,radius+3)}
      for(const e of s.enemies){
        if(e.dead||(!e.elite&&!e.nemesis&&!e.boss))continue;
        const color=e.bounty?0xffd27a:e.nemesis?0xffffff:e.boss?0xff536b:0xf4ba68,r=e.r*(e.boss?1.72:1.48);
        this.fx.lineStyle(e.boss?1.8:1.15,color,e.boss?.72:.55);this.fx.strokeCircle(e.x,e.y,r);
        for(let i=0;i<4;i++){const a=this.time*(e.boss?.18:.34)+i*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);line(e.x+c*(r-3),e.y+sn*(r-3),e.x+c*(r+4),e.y+sn*(r+4),color,.72,1.2)}
      }
      if(settings.telegraphs!=='OFF')for(const e of s.enemies){if(e.dead)continue;const ranged=e.type==='gunner'||e.type==='sniper'||e.boss;if(ranged&&e.shootT>0&&e.shootT<.34){const alpha=(.34-e.shootT)/.34,color=e.boss?'#ff526f':e.type==='sniper'?'#ffcf78':'#ff8ca1';if(glowOn)line(e.x,e.y,s.p.x,s.p.y,color,alpha*.18,5);line(e.x,e.y,s.p.x,s.p.y,color,alpha*.68,1)}if(e.type==='charger'&&e.burst<=0&&e.chargeT>0&&e.chargeT<.48){const alpha=(.48-e.chargeT)/.48;this.fx.lineStyle(2,0xffc36c,.35+alpha*.5);this.fx.strokeCircle(e.x,e.y,e.r+8+alpha*9)}}
      for(const a of s.arcs){const alpha=Math.max(0,Math.min(1,a.life*9));if(a.circle){this.fx.lineStyle(quality==='ULTRA'?5:3,tintValue(a.color||'#9cf7ff'),alpha*.42);this.fx.strokeCircle(a.x1,a.y1,a.r)}else{if(glowOn)line(a.x1,a.y1,a.x2,a.y2,a.color||'#9cf7ff',alpha*.22,7);line(a.x1,a.y1,a.x2,a.y2,'#e9fdff',alpha*.92,1.35)}}
      for(const b of s.beams){const alpha=Math.max(0,Math.min(1,b.life*10));if(glowOn)line(b.x1,b.y1,b.x2,b.y2,b.color,alpha*.25,11);line(b.x1,b.y1,b.x2,b.y2,'#ffffff',alpha*.94,1.5);line(b.x1,b.y1,b.x2,b.y2,b.color,alpha*.78,3.4)}
      for(const r of s.rifts){const alpha=Math.max(0,Math.min(1,r.life/r.maxLife));for(let i=0;i<(quality==='LOW'?2:4);i++){this.fx.lineStyle(1.2+i*.35,0x9e7cff,alpha*(.16+i*.045));this.fx.strokeCircle(r.x,r.y,r.r*(.45+i*.16)+Math.sin(this.time*3+i)*2)}this.fx.fillStyle(0x7d5cff,alpha*.07);this.fx.fillCircle(r.x,r.y,r.r*.44)}
      for(const node of s.worldNodes||[]){if(!node.active||node.collected)continue;const color=tintValue(node.color),pulse=.5+.5*Math.sin(this.time*2.1+(node.pulse||0)),radius=node.r+9+pulse*5;this.fx.lineStyle(node.disposition==='hazard'?2.2:1.4,color,.30+.28*pulse).strokeCircle(node.x,node.y,radius);if(glowOn){this.fx.fillStyle(color,node.disposition==='hazard'?.09:.055).fillCircle(node.x,node.y,node.r*2.2);this.fx.lineStyle(5,color,.07+.05*pulse).strokeCircle(node.x,node.y,radius+4)}for(let i=0;i<3;i++){const a=this.time*(node.disposition==='hazard'?-1.25:.85)+i*TAU/3+(node.pulse||0),rr=radius+7+i*2;this.fx.fillStyle(i===0?0xffffff:color,.48-i*.10).fillCircle(node.x+Math.cos(a)*rr,node.y+Math.sin(a)*rr,i===0?1.8:1.2)}}
    }
    syncDeathFx(s,quality,glowOn){
      for(const death of s.deathFx||[]){const duration=death.maxLife||.55,life=clamp((death.life||0)/duration),progress=1-life,color=tintValue(death.color),boss=!!death.boss,elite=!!death.elite,base=death.r*(boss?2.4:elite?1.9:1.55),flare=Math.sin(Math.min(1,progress*2.2)*Math.PI),ringRadius=base*(.35+progress*1.75),seed=death.seed||0;
        if(glowOn){this.fx.fillStyle(color,life*(boss?.16:elite?.11:.07)*flare).fillCircle(death.x,death.y,base*(.72+progress*.55));this.fx.fillStyle(0xffffff,life*(boss?.24:.16)*flare).fillCircle(death.x,death.y,Math.max(2,base*(.16-progress*.07)))}
        this.fx.lineStyle(boss?3.2:elite?2.2:1.4,color,life*(.72-progress*.22)).strokeCircle(death.x,death.y,ringRadius);if(elite||boss)this.fx.lineStyle(1.2,0xffffff,life*.42).strokeCircle(death.x,death.y,ringRadius*.72);
        const fragments=quality==='LOW'?(boss?8:4):boss?22:elite?12:7;for(let i=0;i<fragments;i++){const a=seed*TAU+i*2.399+progress*(i%2?1:-1)*.32,distance=base*(.18+progress*(.7+(i%4)*.18)),length=(boss?9:5)*(1-life*.3),x1=death.x+Math.cos(a)*distance,y1=death.y+Math.sin(a)*distance;line(x1,y1,x1-Math.cos(a)*length,y1-Math.sin(a)*length,i%3===0?'#ffffff':death.color,life*(.36+(i%3)*.13),boss?1.8:1.1)}
      }
    }
  }

  globalThis.OrbitVisualEngine=OrbitVisualEngine;
})();
