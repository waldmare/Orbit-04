import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ORBIT//04 Studio audio forge. All material is generated locally as original
// 48 kHz stereo audio with layered transients, body, sub and spatial tails.
const SR=48000,TAU=Math.PI*2,root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),outDir=path.join(root,'assets','audio');
let seed=0x50a0d10;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const noise=()=>rnd()*2-1;
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const sine=(t,f,p=0)=>Math.sin(TAU*f*t+p);
const chirp=(t,d,f0,f1,p=0)=>Math.sin(TAU*(f0*t+(f1-f0)*t*t/(2*d))+p);
const attackRelease=(t,d,a=.004,r=.18)=>Math.min(1,t/Math.max(.0001,a))*Math.min(1,(d-t)/Math.max(.0001,r));
const soft=v=>Math.tanh(v*1.22)/Math.tanh(1.22);

function stereoRender(duration,voice,{gain=.88,space=.12,loop=false,lowpass=0}={}){
  const n=Math.floor(duration*SR),l=new Float32Array(n),r=new Float32Array(n);let lpL=0,lpR=0;
  for(let i=0;i<n;i++){
    const t=i/SR,value=voice(t,i),left=Array.isArray(value)?value[0]:value,right=Array.isArray(value)?value[1]:value;
    let a=Number.isFinite(left)?left:0,b=Number.isFinite(right)?right:0;
    if(lowpass>0){lpL+=(a-lpL)*lowpass;lpR+=(b-lpR)*lowpass;a=lpL;b=lpR}
    l[i]=a;r[i]=b;
  }
  const dryL=l.slice(),dryR=r.slice(),taps=[[.037,.18],[.071,.13],[.113,.09],[.181,.055],[.263,.035]];
  for(const [delay,amount] of taps){const ds=Math.floor(delay*SR),wet=amount*space;for(let i=0;i<n;i++){
    const j=loop?(i-ds+n)%n:i-ds;if(j>=0){l[i]+=dryR[j]*wet;r[i]+=dryL[j]*wet}
  }}
  let prevInL=0,prevInR=0,prevOutL=0,prevOutR=0,peak=.001;
  for(let i=0;i<n;i++){
    const inL=l[i],inR=r[i],outL=inL-prevInL+.996*prevOutL,outR=inR-prevInR+.996*prevOutR;
    prevInL=inL;prevInR=inR;prevOutL=outL;prevOutR=outR;l[i]=outL;r[i]=outR;peak=Math.max(peak,Math.abs(outL),Math.abs(outR));
  }
  const norm=Math.min(1,gain/peak);for(let i=0;i<n;i++){l[i]=soft(l[i]*norm);r[i]=soft(r[i]*norm)}return{l,r};
}

function wav({l,r}){
  const n=l.length,dataSize=n*4,b=Buffer.alloc(44+dataSize);b.write('RIFF',0);b.writeUInt32LE(36+dataSize,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(dataSize,40);
  for(let i=0,o=44;i<n;i++,o+=4){b.writeInt16LE(Math.round(clamp(l[i])*32767),o);b.writeInt16LE(Math.round(clamp(r[i])*32767),o+2)}return b;
}

async function save(name,duration,voice,opts){const audio=stereoRender(duration,voice,opts);await writeFile(path.join(outDir,`${name}.wav`),wav(audio));console.log(`${name}.wav · ${duration.toFixed(2)}s · 48 kHz stereo`)}
await mkdir(outDir,{recursive:true});

await save('ui_click',.18,(t)=>{const e=attackRelease(t,.18,.001,.12),metal=chirp(t,.18,1780,620)*Math.exp(-t*35),body=sine(t,164)*Math.exp(-t*24),air=noise()*Math.exp(-t*52);return[e*(metal*.22+body*.22+air*.07),e*(metal*.18+body*.25-air*.05)]},{space:.08,gain:.72});
await save('run_start',2.25,(t)=>{const e=attackRelease(t,2.25,.012,.42),rise=Math.min(1,t/1.45),sub=sine(t,38+17*rise)*.28,engine=(sine(t,82)+sine(t,123,.7)*.46)*.18*rise,air=noise()*(.035+.09*rise),spark=chirp(t,2.25,92,1250)*Math.pow(rise,2)*.09;return[e*(sub+engine+air+spark),e*(sub+engine*.94-air*.72+spark*.8)]},{space:.44,gain:.86,lowpass:.16});
await save('pulse',.28,(t)=>{const e=attackRelease(t,.28,.0005,.19),snap=noise()*Math.exp(-t*78),fm=sine(t,940-690*t/.28+sine(t,92)*54)*Math.exp(-t*13),thump=sine(t,72)*Math.exp(-t*20);return[e*(snap*.20+fm*.50+thump*.34),e*(snap*.15+fm*.42+thump*.38)]},{space:.09,gain:.83});
await save('missile',.92,(t)=>{const e=attackRelease(t,.92,.002,.35),ignition=noise()*Math.exp(-t*20),motor=noise()*(.12+.08*sine(t,31))*Math.exp(-t*.9),body=sine(t,58+18*t)*.34,servo=chirp(t,.92,420,118)*.16;return[e*(ignition*.46+motor+body+servo),e*(ignition*.37-motor*.82+body*.92+servo*.8)]},{space:.16,gain:.86,lowpass:.26});
await save('rail',1.30,(t)=>{const crack=noise()*Math.exp(-t*105),sub=sine(t,34)*Math.exp(-t*4.5),coil=chirp(t,1.3,2400,82)*Math.exp(-t*8),tail=sine(t,91,.5)*Math.exp(-t*3.5);return[crack*.58+sub*.66+coil*.28+tail*.16,crack*.44+sub*.72+coil*.22-tail*.12]},{space:.38,gain:.94,lowpass:.32});
await save('arc',.68,(t)=>{const e=attackRelease(t,.68,.0004,.25),gate=sine(t,53+sine(t,7)*11)>.05?1:.18,crackle=noise()*gate*Math.exp(-t*2.6),electric=chirp(t,.68,3100,260)*.24,sub=sine(t,49)*Math.exp(-t*10);return[e*(crackle*.36+electric+sub*.2),e*(-crackle*.30+electric*.76+sub*.24)]},{space:.28,gain:.86});
await save('explosion',1.85,(t)=>{const crack=noise()*Math.exp(-t*52),debris=noise()*Math.exp(-t*5.2),sub=sine(t,31-8*Math.min(1,t))*Math.exp(-t*2.4),body=sine(t,57,.5)*Math.exp(-t*4),tail=noise()*Math.exp(-t*2.1);return[crack*.62+debris*.34+sub*.78+body*.30+tail*.11,crack*.48-debris*.31+sub*.82+body*.24-tail*.09]},{space:.52,gain:.95,lowpass:.20});
await save('player_hit',1.05,(t)=>{const armor=noise()*Math.exp(-t*42),sub=sine(t,43)*Math.exp(-t*5.2),ring=sine(t,287+sine(t,19)*22)*Math.exp(-t*7),alarm=chirp(t,1.05,510,170)*.14;return[armor*.52+sub*.65+ring*.24+alarm,armor*.40+sub*.70-ring*.20+alarm*.82]},{space:.31,gain:.91});
await save('kill',.34,(t)=>{const hit=noise()*Math.exp(-t*62),core=sine(t,88)*Math.exp(-t*17),shard=chirp(t,.34,690,1180)*Math.exp(-t*12);return[hit*.20+core*.34+shard*.18,hit*.16+core*.38-shard*.14]},{space:.12,gain:.68});
await save('pickup',.64,(t)=>{const e=attackRelease(t,.64,.002,.28),shimmer=[523.25,783.99,1046.5].reduce((sum,f,j)=>{const tt=t-j*.058;return sum+(tt>=0?sine(tt,f,.2*j)*Math.exp(-tt*9):0)},0),air=noise()*Math.exp(-t*12);return[e*(shimmer*.18+air*.025),e*(shimmer*.16-air*.02)]},{space:.48,gain:.73});
await save('level_up',2.10,(t)=>{const e=attackRelease(t,2.1,.006,.55),notes=[146.83,220,293.66,440,587.33],tones=notes.reduce((sum,f,j)=>{const tt=t-j*.18;return sum+(tt>=0?(sine(tt,f)+sine(tt,f*2,.4)*.28)*Math.exp(-tt*2.4):0)},0),sub=sine(t,36.7)*Math.exp(-t*1.7),air=noise()*Math.sin(Math.PI*t/2.1)*.035;return[e*(tones*.13+sub*.28+air),e*(tones*.12+sub*.31-air*.7)]},{space:.62,gain:.82});
await save('rush_start',2.45,(t)=>{const e=attackRelease(t,2.45,.004,.42),x=t/2.45,riser=chirp(t,2.45,46,1460)*(.08+x*.16),sub=sine(t,41+31*x)*.34,pump=Math.exp(-(t%.25)*13)*sine(t,92)*.20,air=noise()*Math.sin(Math.PI*x)*.16;return[e*(riser+sub+pump+air),e*(riser*.78+sub*.96+pump-air*.8)]},{space:.54,gain:.92,lowpass:.24});
await save('rush_end',1.35,(t)=>{const e=attackRelease(t,1.35,.002,.58),drop=chirp(t,1.35,980,44)*.32,sub=sine(t,39)*Math.exp(-t*3),air=noise()*Math.exp(-t*4.5);return[e*(drop+sub*.52+air*.10),e*(drop*.78+sub*.58-air*.08)]},{space:.38,gain:.83});
await save('boss_warning',3.60,(t)=>{const e=attackRelease(t,3.6,.008,.5),hitT=t%.9,warHorn=(sine(hitT,46.25)+sine(hitT,69.4,.3)*.42+sine(hitT,92.5,.7)*.22)*Math.exp(-hitT*2.8),sub=sine(t,28.9)*.28,metal=noise()*Math.exp(-((t%.45)*26))*.07;return[e*(warHorn*.48+sub+metal),e*(warHorn*.44+sub*.96-metal*.8)]},{space:.68,gain:.92,lowpass:.24});

await save('enemy_shot',.46,(t)=>{const e=attackRelease(t,.46,.0005,.25),snap=noise()*Math.exp(-t*92),plasma=chirp(t,.46,540,128)*Math.exp(-t*9),body=sine(t,94)*Math.exp(-t*13),warning=sine(t,1240)*Math.exp(-t*28);return[e*(snap*.16+plasma*.42+body*.30+warning*.06),e*(-snap*.12+plasma*.35+body*.34-warning*.05)]},{space:.12,gain:.77,lowpass:.31});
await save('nova',1.72,(t)=>{const e=attackRelease(t,1.72,.003,.58),charge=chirp(t,1.72,110,1380)*Math.exp(-t*4.4),wave=sine(t,48-12*Math.min(1,t))*Math.exp(-t*2.6),air=noise()*Math.exp(-t*3.4),ring=sine(t,310,.3)*Math.exp(-t*5.5);return[e*(charge*.22+wave*.68+air*.22+ring*.14),e*(charge*.17+wave*.73-air*.19-ring*.12)]},{space:.62,gain:.94,lowpass:.22});
await save('mine',1.08,(t)=>{const e=attackRelease(t,1.08,.0008,.42),click=noise()*Math.exp(-t*105),blast=noise()*Math.exp(-t*8),sub=sine(t,39)*Math.exp(-t*4),shards=chirp(t,1.08,1320,190)*Math.exp(-t*7);return[e*(click*.46+blast*.31+sub*.72+shards*.17),e*(click*.38-blast*.27+sub*.75-shards*.14)]},{space:.38,gain:.91,lowpass:.25});
await save('beam',.78,(t)=>{const e=attackRelease(t,.78,.001,.31),ignition=chirp(t,.78,260,1680)*Math.exp(-t*8),core=(sine(t,710+sine(t,37)*38)+sine(t,1420,.4)*.24)*Math.exp(-t*4),sub=sine(t,86)*Math.exp(-t*9),air=noise()*Math.exp(-t*14);return[e*(ignition*.22+core*.31+sub*.22+air*.055),e*(ignition*.18+core*.27+sub*.25-air*.045)]},{space:.28,gain:.82,lowpass:.36});
await save('drone',.31,(t)=>{const e=attackRelease(t,.31,.0004,.16),servo=chirp(t,.31,1680,720)*Math.exp(-t*18),tick=noise()*Math.exp(-t*80),body=sine(t,180)*Math.exp(-t*20);return[e*(servo*.27+tick*.10+body*.18),e*(servo*.22-tick*.08+body*.20)]},{space:.09,gain:.68});
await save('critical',.56,(t)=>{const e=attackRelease(t,.56,.0003,.28),crack=noise()*Math.exp(-t*130),snap=chirp(t,.56,2400,410)*Math.exp(-t*16),body=sine(t,67)*Math.exp(-t*9),spark=sine(t,1760)*Math.exp(-t*22);return[e*(crack*.42+snap*.32+body*.44+spark*.12),e*(crack*.34+snap*.26+body*.48-spark*.10)]},{space:.19,gain:.91,lowpass:.38});
await save('phase_dash',.92,(t)=>{const e=attackRelease(t,.92,.001,.34),sweep=chirp(t,.92,170,1780)*Math.exp(-t*5),reverse=chirp(t,.92,1260,92,.7)*Math.exp(-t*6.5),sub=sine(t,52+44*t)*Math.exp(-t*5),air=noise()*Math.sin(Math.PI*Math.min(1,t/.55))*.12*Math.exp(-t*2.8);return[e*(sweep*.25+reverse*.17+sub*.38+air),e*(sweep*.18+reverse*.23+sub*.40-air*.82)]},{space:.52,gain:.89,lowpass:.25});
await save('phase_shift',1.24,(t)=>{const e=attackRelease(t,1.24,.002,.45),fold=chirp(t,1.24,1120,140)*Math.exp(-t*4.4),answer=chirp(t,1.24,180,920,.8)*Math.exp(-t*5.6),core=(sine(t,73)+sine(t,146,.4)*.34)*Math.exp(-t*4),air=noise()*Math.exp(-t*4.5);return[e*(fold*.26+answer*.18+core*.42+air*.09),e*(fold*.20+answer*.24+core*.45-air*.075)]},{space:.61,gain:.87,lowpass:.27});
await save('elite_kill',1.16,(t)=>{const e=attackRelease(t,1.16,.0005,.48),impact=noise()*Math.exp(-t*75),body=sine(t,52)*Math.exp(-t*4.8),fracture=noise()*Math.exp(-t*7.5),rise=chirp(t,1.16,320,980)*Math.exp(-t*5);return[e*(impact*.52+body*.69+fracture*.20+rise*.16),e*(impact*.42+body*.74-fracture*.17+rise*.13)]},{space:.43,gain:.93,lowpass:.23});
await save('boss_down',3.25,(t)=>{const e=attackRelease(t,3.25,.002,.84),first=noise()*Math.exp(-t*68),sub=sine(t,29-5*Math.min(1,t))*Math.exp(-t*1.35),collapse=noise()*Math.exp(-t*2.2),metal=chirp(t,3.25,720,48)*Math.exp(-t*2.7),after=sine(t,82,.4)*Math.exp(-t*1.8),shockT=Math.max(0,t-.42),shock=noise()*Math.exp(-shockT*18)*(t>.42?1:0);return[e*(first*.70+sub*.88+collapse*.32+metal*.22+after*.23+shock*.35),e*(first*.55+sub*.92-collapse*.28-metal*.18+after*.20+shock*.29)]},{space:.78,gain:.97,lowpass:.17});

const MUSIC_DURATION=48,BEAT=.75,BAR=BEAT*4,roots=[55,49,65.406,58.27,55,43.654,49,65.406,55,73.416,65.406,49,43.654,58.27,49,55];
const harmonicPad=(t,rootHz,local)=>{const breathe=Math.sin(Math.PI*local/BAR),detune=sine(t,rootHz*1.003,.7)*.55;return breathe*(sine(t,rootHz)+sine(t,rootHz*1.5,.4)*.42+sine(t,rootHz*2,.9)*.25+detune)*.20};

await save('music_exploration',MUSIC_DURATION,(t)=>{
  const bar=Math.floor(t/BAR)%roots.length,local=t%BAR,rootHz=roots[bar],pad=harmonicPad(t,rootHz,local),sub=sine(t,rootHz*.5)*.16*Math.sin(Math.PI*local/BAR),shimmerT=t%3,
    shimmer=(sine(shimmerT,rootHz*8,.2)+sine(shimmerT,rootHz*12,.8)*.34)*Math.exp(-shimmerT*2.8)*.035,air=noise()*(.018+.010*sine(t,.083));return[pad+sub+shimmer+air,pad*.96+sub*1.04-shimmer*.72-air*.8];
},{space:.72,gain:.72,loop:true,lowpass:.10});

await save('music_combat',MUSIC_DURATION,(t)=>{
  const bar=Math.floor(t/BAR)%roots.length,barT=t%BAR,rootHz=roots[bar],beatT=t%BEAT,eighthT=t%(BEAT/2),beat=Math.floor(t/BEAT),pad=harmonicPad(t,rootHz,barT)*.55,
    kick=(sine(beatT,55-20*Math.min(1,beatT/.18))+.32*sine(beatT,110))*Math.exp(-beatT*18)*.46,tom=(beat%4===2?sine(beatT,74)*Math.exp(-beatT*13):0)*.27,
    bass=sine(beatT,rootHz)*Math.exp(-beatT*5.2)*.25,ost=(sine(eighthT,rootHz*(beat%4===3?3:2),.2)+sine(eighthT,rootHz*4,.6)*.22)*Math.exp(-eighthT*10)*.10,
    hat=noise()*Math.exp(-eighthT*34)*.025,impact=noise()*Math.exp(-beatT*48)*(beat%4===0?.10:.025);return[pad+kick+tom+bass+ost+hat+impact,pad*.94+kick*1.02+tom*.86+bass*1.04-ost*.72-hat*.8+impact*.7];
},{space:.40,gain:.78,loop:true,lowpass:.17});

await save('music_boss',MUSIC_DURATION,(t)=>{
  const bossRoots=[41.203,38.891,36.708,34.648,41.203,32.703,36.708,38.891,41.203,46.249,38.891,34.648,30.868,36.708,38.891,41.203],bar=Math.floor(t/BAR)%bossRoots.length,barT=t%BAR,rootHz=bossRoots[bar],beatT=t%BEAT,beat=Math.floor(t/BEAT),halfT=t%(BEAT/2),
    drone=(sine(t,rootHz)+sine(t,rootHz*1.49,.8)*.48+sine(t,rootHz*2.02,.3)*.25)*.20,horn=(sine(beatT,rootHz*2)+sine(beatT,rootHz*3,.4)*.34)*Math.exp(-beatT*3.4)*(beat%4===0||beat%4===3?.25:.07),
    warDrum=(sine(beatT,43-9*Math.min(1,beatT/.22))+noise()*.16)*Math.exp(-beatT*14)*(beat%2===0?.62:.34),march=sine(halfT,rootHz)*Math.exp(-halfT*8)*.17,
    metal=noise()*Math.exp(-halfT*30)*(beat%4===3?.06:.018),tension=chirp(barT,BAR,rootHz*3,rootHz*5)*Math.sin(Math.PI*barT/BAR)*.035;return[drone+horn+warDrum+march+metal+tension,drone*.98+horn*.88+warDrum*1.04+march*.96-metal*.82-tension*.7];
},{space:.58,gain:.82,loop:true,lowpass:.19});

console.log(`ORBIT//04 Reforged audio pack generated in ${outDir}`);
