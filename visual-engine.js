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

  class OrbitVisualEngine{
    constructor(scene,{width=960,height=540,scale=1.5}={}){
      this.scene=scene;this.width=width;this.height=height;this.scale=scale;this.time=0;this.playerAngle=-Math.PI/2;
      this.makeTextures();
      this.root=scene.add.container(0,0).setScale(scale).setDepth(3);
      this.lootLayer=scene.add.container();this.trailLayer=scene.add.container();this.enemyLayer=scene.add.container();
      this.projectileLayer=scene.add.container();this.playerLayer=scene.add.container();this.particleLayer=scene.add.container();
      this.root.add([this.lootLayer,this.trailLayer,this.enemyLayer,this.projectileLayer,this.playerLayer,this.particleLayer]);
      this.fx=scene.add.graphics().setDepth(3.5).setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
      this.player=this.createPlayer();this.playerLayer.add(this.player.root);
      this.dashEchoes=Array.from({length:4},()=>scene.add.image(0,0,'player-ship-v3').setBlendMode(Phaser.BlendModes.ADD).setTint(0x8de9ff).setVisible(false));this.trailLayer.add(this.dashEchoes);
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

    createPlayer(){
      const root=this.scene.add.container(),glow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        plumeL=this.scene.add.image(-5,17,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        plumeR=this.scene.add.image(5,17,'orbit-plume').setOrigin(.5,0).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        shadow=this.scene.add.ellipse(2,4,34,17,0x000000,0).setVisible(false),
        hullGlow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        body=this.scene.add.image(0,0,'player-ship-v3'),shield=this.scene.add.image(0,0,'orbit-ring').setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      root.add([glow,plumeL,plumeR,shadow,hullGlow,body,shield]);return{root,glow,plumeL,plumeR,shadow,hullGlow,body,shield};
    }
    createEnemy(){
      const root=this.scene.add.container(),glow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        plume=this.scene.add.image(0,0,'orbit-plume').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),shadow=this.scene.add.ellipse(2,4,30,15,0x000000,0).setVisible(false),
        body=this.scene.add.image(0,0,'enemy-scout-v3'),rank=this.scene.add.image(0,0,'orbit-rank').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        hpBg=this.scene.add.rectangle(0,0,1,3,0x12060a,.9).setOrigin(0,.5),hpFill=this.scene.add.rectangle(0,0,1,3,0xff6177,.96).setOrigin(0,.5);
      root.add([glow,plume,shadow,body,rank,hpBg,hpFill]);this.enemyLayer.add(root);return{root,glow,plume,shadow,body,rank,hpBg,hpFill};
    }
    createAlly(){
      const root=this.scene.add.container(),glow=this.scene.add.image(0,0,'orbit-glow').setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
        shadow=this.scene.add.ellipse(2,4,28,14,0x000000,0).setVisible(false),body=this.scene.add.image(0,0,'enemy-scout-v3').setTint(0x8dffd6);
      root.add([glow,shadow,body]);this.enemyLayer.add(root);return{root,glow,shadow,body};
    }
    createProjectile(texture){const root=this.scene.add.image(0,0,texture).setBlendMode(Phaser.BlendModes.ADD);this.projectileLayer.add(root);return{root}}
    createLoot(){const root=this.scene.add.image(0,0,'orbit-loot').setBlendMode(Phaser.BlendModes.ADD);this.lootLayer.add(root);return{root}}
    createParticle(){const root=this.scene.add.image(0,0,'orbit-particle').setBlendMode(Phaser.BlendModes.ADD);this.particleLayer.add(root);return{root}}
    createFloater(){const root=this.scene.add.text(0,0,'',{fontFamily:'Cascadia Mono, Consolas, monospace',fontSize:'10px',fontStyle:'700',color:'#bdefff',stroke:'#02060b',strokeThickness:3}).setOrigin(.5).setDepth(2);this.particleLayer.add(root);return{root}}
    createMarker(texture){const root=this.scene.add.image(0,0,texture).setBlendMode(Phaser.BlendModes.ADD);this.projectileLayer.add(root);return{root}}

    fitSprite(sprite,size,multiplier=1){
      const frame=sprite.frame,w=frame?.realWidth||frame?.width||1,h=frame?.realHeight||frame?.height||1,scale=size*multiplier/Math.max(w,h);
      sprite.setDisplaySize(w*scale,h*scale);return sprite;
    }

    setShip(view,x,y,size,angle,tint,hit=false){
      view.root.setPosition(x,y).setRotation(angle+Math.PI/2);
      this.fitSprite(view.body,size);
      view.shadow.setDisplaySize(size*.72,size*.34).setPosition(2,4);
      view.hullGlow.setDisplaySize(size*1.10,size*1.10).setTint(tint);
      view.glow.setDisplaySize(size*1.38,size*1.38).setTint(tint);
      view.body.clearTint();if(hit&&view.body.setTintFill)view.body.setTintFill(0xffffff);else view.body.setTint(tint);
      view.plumeL.setDisplaySize(Math.max(3.5,size*.10),size*.46);view.plumeR.setDisplaySize(Math.max(3.5,size*.10),size*.46);
      view.shield.setDisplaySize(size*1.32,size*1.32);
    }

    sync(gameState,settings={}){
      this.time=gameState?.time||performance.now()/1000;
      const quality=settings.graphics||'HIGH',glowOn=settings.glow!=='OFF',particlesOn=settings.particles!=='OFF';
      this.fx.clear();this.menuHalo.setVisible(!gameState||gameState.mode!=='run');
      if(!gameState||gameState.mode!=='run'){
        const x=this.width*.5+Math.sin(this.time*.35)*18,y=this.height*.56+Math.sin(this.time*.55)*6,size=quality==='LOW'?88:102;
        this.setShip(this.player,x,y,size,-Math.PI/2,palette[settings.selected]||palette.striker,false);
        this.player.glow.setVisible(false);this.player.hullGlow.setVisible(false);this.player.shield.setVisible(false);
        this.player.plumeL.setVisible(false);this.player.plumeR.setVisible(false);this.menuHalo.setVisible(false);
        for(const echo of this.dashEchoes)echo.setVisible(false);this.hideCombatPools();return;
      }
      const p=gameState.p,dx=p.x-(p._visualX??p.x),dy=p.y-(p._visualY??p.y);
      if(Math.hypot(dx,dy)>.12){const target=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(target-this.playerAngle),Math.cos(target-this.playerAngle));this.playerAngle+=diff*.24}
      p._visualX=p.x;p._visualY=p.y;
      this.setShip(this.player,p.x,p.y,52,this.playerAngle,palette[p.frame]||palette.striker,p.hitFlash>0);
      const dashActive=(p.dashFx||0)>0,dashPower=Math.max(0,Math.min(1,(p.dashFx||0)/.32));this.player.root.setScale(dashActive?1.06:1);
      this.player.plumeL.setVisible(false);this.player.plumeR.setVisible(false);this.player.glow.setVisible(false);this.player.hullGlow.setVisible(false);this.player.shield.setVisible(false);
      for(let i=0;i<this.dashEchoes.length;i++){const echo=this.dashEchoes[i],trail=(i+1)/(this.dashEchoes.length+1);if(dashActive){echo.setVisible(true).setPosition(p.x+(p.dashFromX-p.x)*trail,p.y+(p.dashFromY-p.y)*trail).setRotation(this.playerAngle+Math.PI/2).setDisplaySize(52,52).setAlpha(dashPower*(.34-i*.055)).setTint(i%2?0x8dffd6:0x8de9ff)}else echo.setVisible(false)}
      const shake=gameState.shake||0;this.root.setPosition(shake?(Math.random()-.5)*shake:0,shake?(Math.random()-.5)*shake:0);this.fx.setPosition(this.root.x*this.scale,this.root.y*this.scale);
      this.syncEnemies(gameState,settings,quality,glowOn);this.syncAllies(gameState);this.syncProjectiles(gameState);
      this.syncLoot(gameState);this.syncOrbitals(gameState);this.syncParticles(gameState,particlesOn);this.syncFloaters(gameState);this.drawEnergyEffects(gameState,settings,quality,glowOn);
    }

    hideCombatPools(){for(const pool of [this.enemies,this.allies,this.friendlyBullets,this.hostileBullets,this.loot,this.particles,this.floaters,this.drones,this.blades,this.mines])this.use(pool,0,()=>{})}
    syncEnemies(s,settings,quality,glowOn){
      this.use(this.enemies,s.enemies.length,(v,i)=>{
        const e=s.enemies[i],boss=!!e.boss,size=boss?e.r*3.75:e.r*(e.elite?3.35:3.0),angle=Math.atan2(s.p.y-e.y,s.p.x-e.x);
        v.root.setPosition(e.x,e.y);const texture=boss?enemyTexture.boss:(enemyTexture[e.type]||enemyTexture.scout);v.body.setTexture(texture);
        this.fitSprite(v.body,size);v.body.setRotation(angle+Math.PI/2);
        v.shadow.setPosition(2.2,3.2).setDisplaySize(size*.72,size*.34).setRotation(angle+Math.PI/2).setAlpha(.46);
        v.body.setPosition(0,0).clearTint();if(e.hit>0&&v.body.setTintFill)v.body.setTintFill(0xffffff);
        v.plume.setVisible(false);v.glow.setVisible(false);v.rank.setVisible(false);
        const hpMode=settings.enemyHp,show=hpMode==='ALL'||(hpMode==='ELITES'&&e.elite),bw=boss?72:Math.max(25,e.r*2.5),y=-size*.47;
        v.hpBg.setVisible(show).setPosition(-bw/2,y).setDisplaySize(bw,3.2);v.hpFill.setVisible(show).setPosition(-bw/2,y).setDisplaySize(bw*Math.max(0,Math.min(1,e.hp/e.maxHp)),3.2).setFillStyle(boss?0xff536b:0xffd27a,.98);
      });
    }
    syncAllies(s){
      this.use(this.allies,s.allies.length,(v,i)=>{const a=s.allies[i],target=s.enemies.find(e=>!e.dead),angle=target?Math.atan2(target.y-a.y,target.x-a.x):-Math.PI/2,size=Math.max(25,(a.r||9)*3),texture=enemyTexture[a.type]||enemyTexture.scout;v.root.setPosition(a.x,a.y);v.body.setTexture(texture).clearTint().setTint(0x8dffd6).setRotation(angle+Math.PI/2);this.fitSprite(v.body,size);v.shadow.setVisible(false);v.glow.setVisible(false)});
    }
    syncProjectiles(s){
      this.use(this.friendlyBullets,s.bullets.length,(v,i)=>{const b=s.bullets[i],speed=Math.hypot(b.vx||0,b.vy||0);v.root.setPosition(b.x,b.y).setRotation(speed?Math.atan2(b.vy,b.vx):0).setDisplaySize(Math.max(11,b.r*4.8),Math.max(3,b.r*1.7)).setTint(tintValue(b.color)).setAlpha(.95)});
      this.use(this.hostileBullets,s.enemyBullets.length,(v,i)=>{const b=s.enemyBullets[i],speed=Math.hypot(b.vx||0,b.vy||0);v.root.setPosition(b.x,b.y).setRotation(speed?Math.atan2(b.vy,b.vx):0).setDisplaySize(Math.max(10,b.r*4.2),Math.max(3.5,b.r*1.75)).setTint(0xff657b).setAlpha(.96)});
    }
    syncLoot(s){
      const items=[...s.orbs.map(x=>({x,type:'orb'})),...s.caches.map(x=>({x,type:'cache'}))];
      this.use(this.loot,items.length,(v,i)=>{const {x,type}=items[i],cache=type==='cache',col=cache?(x.rarity==='PARADOX'?0xbd9cff:x.rarity==='OMEGA'?0xffffff:x.rarity==='RARE'?0xffd27a:0x8de9ff):(x.r>4?0xffd27a:0x62f4dd),size=cache?23:(x.r>4?15:10);v.root.setPosition(x.x,x.y).setDisplaySize(size,size).setTint(col).setRotation(this.time*(cache?.75:1.25)+(x.x||0)*.01).setAlpha(.94)});
    }
    syncOrbitals(s){
      const dw=s.weapons.drone,dr=[];if(dw){const n=1+(dw.level>=2?1:0)+(dw.level>=5?1:0)+(dw.evolved?2:0)+(s.p.droneBonus||0);for(let i=0;i<n;i++){const a=s.time*(dw.evolved?1.75:1.15)+i*TAU/n;dr.push({x:s.p.x+Math.cos(a)*36,y:s.p.y+Math.sin(a)*36,evolved:dw.evolved,a})}}
      this.use(this.drones,dr.length,(v,i)=>{const d=dr[i];v.root.setPosition(d.x,d.y).setDisplaySize(d.evolved?17:14,d.evolved?17:14).setTint(d.evolved?0xffffff:0x8dffd6).setRotation(d.a+Math.PI/2).setAlpha(.96)});
      const bw=s.weapons.blade,bl=[];if(bw){const n=2+(bw.level>=2?1:0)+(bw.level>=6?1:0)+(bw.evolved?2:0)+(s.synergies.razorWing?1:0),r=43*(bw.level>=5?1.18:1)*(bw.evolved?1.18:1)*s.p.areaMul;for(let i=0;i<n;i++){const a=s.time*(bw.evolved?3:2.15)+i*TAU/n;bl.push({x:s.p.x+Math.cos(a)*r,y:s.p.y+Math.sin(a)*r,evolved:bw.evolved,a})}}
      this.use(this.blades,bl.length,(v,i)=>{const b=bl[i];v.root.setPosition(b.x,b.y).setDisplaySize(b.evolved?22:18,b.evolved?22:18).setTint(b.evolved?0xffffff:0xbd9cff).setRotation(b.a+this.time*3.2).setAlpha(.92)});
      this.use(this.mines,s.mines.length,(v,i)=>{const m=s.mines[i];v.root.setPosition(m.x,m.y).setDisplaySize(19,19).setTint(0xbd9cff).setRotation(-this.time*.8+i).setAlpha(.94)});
    }
    syncParticles(s,on){
      const source=on?s.particles:[];this.use(this.particles,source.length,(v,i)=>{const q=source[i],life=Math.max(0,Math.min(1,(q.life||0)*2));v.root.setPosition(q.x,q.y).setDisplaySize(5+life*5,5+life*5).setTint(tintValue(q.color)).setAlpha(life*.66)});
    }
    syncFloaters(s){const source=s.floaters||[];this.use(this.floaters,source.length,(v,i)=>{const f=source[i],life=Math.max(0,Math.min(1,f.life/f.maxLife));v.root.setPosition(f.x,f.y).setText(f.text).setColor(f.color).setFontSize(f.crit?14:10).setScale(f.crit?1+.18*(1-life):1).setAlpha(Math.min(1,life*1.8))})}
    drawEnergyEffects(s,settings,quality,glowOn){
      const line=(x1,y1,x2,y2,color,alpha,width)=>{this.fx.lineStyle(width,tintValue(color),alpha);this.fx.beginPath();this.fx.moveTo(x1,y1);this.fx.lineTo(x2,y2);this.fx.strokePath()};
      const p=s.p,playerColor=p.hp/p.maxHp<.30?0xff6177:0x8de9ff;
      if(glowOn){
        this.fx.fillStyle(playerColor,quality==='ULTRA'?.11:.075);this.fx.fillCircle(p.x,p.y,quality==='ULTRA'?32:27);
        const backX=p.x-Math.cos(this.playerAngle)*25,backY=p.y-Math.sin(this.playerAngle)*25;line(p.x,p.y,backX,backY,'#65e7ff',.42,p.moving?4.5:2.5);
        for(const e of s.enemies){if(e.dead)continue;const color=e.boss?0xff3159:(enemyTint[e.type]||tintValue(e.color));this.fx.fillStyle(color,e.boss?.10:e.elite?.065:.032);this.fx.fillCircle(e.x,e.y,e.r*(e.boss?2.6:e.elite?2.15:1.75))}
      }
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
    }
  }

  globalThis.OrbitVisualEngine=OrbitVisualEngine;
})();
