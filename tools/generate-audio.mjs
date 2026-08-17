import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SR=48000,TAU=Math.PI*2,root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),outDir=path.join(root,'assets','audio');
let seed=0x04c0ffee;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(x)=>Math.tanh(x*1.35)/Math.tanh(1.35);
const env=(t,d,a=.008,r=.22)=>Math.min(1,t/a)*Math.min(1,(d-t)/r);
const chirp=(t,d,f0,f1,phase=0)=>Math.sin(TAU*(f0*t+(f1-f0)*t*t/(2*d))+phase);
const sine=(t,f,p=0)=>Math.sin(TAU*f*t+p);

function render(duration,fn,{gain=.85,reverb=.14}={}){
  const n=Math.floor(duration*SR),l=new Float32Array(n),r=new Float32Array(n);
  for(let i=0;i<n;i++){
    const t=i/SR,v=fn(t,i),vl=Array.isArray(v)?v[0]:v,vr=Array.isArray(v)?v[1]:v;
    l[i]=vl||0;r[i]=vr||0;
  }
  const taps=[[.043,.24],[.071,.16],[.113,.10],[.167,.065]];
  for(const [delay,amount] of taps){const ds=Math.floor(delay*SR);for(let i=ds;i<n;i++){l[i]+=r[i-ds]*amount*reverb;r[i]+=l[i-ds]*amount*reverb}}
  let peak=.001;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));const norm=Math.min(1,gain/peak);
  for(let i=0;i<n;i++){l[i]=smooth(l[i]*norm);r[i]=smooth(r[i]*norm)}
  return{l,r};
}

function wav({l,r}){
  const n=l.length,dataSize=n*4,b=Buffer.alloc(44+dataSize);b.write('RIFF',0);b.writeUInt32LE(36+dataSize,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(dataSize,40);
  for(let i=0,o=44;i<n;i++,o+=4){b.writeInt16LE(Math.round(clamp(l[i]) *32767),o);b.writeInt16LE(Math.round(clamp(r[i])*32767),o+2)}return b;
}

async function save(name,duration,fn,opts){const audio=render(duration,fn,opts);await writeFile(path.join(outDir,`${name}.wav`),wav(audio));console.log(`${name}.wav ${(duration).toFixed(2)}s`)}

await mkdir(outDir,{recursive:true});

await save('ui_click',.13,(t,i)=>{const e=env(t,.13,.002,.08),n=(rnd()*2-1)*Math.exp(-t*55);return e*(chirp(t,.13,520,1180)*.46+sine(t,1800)*.12)+n*.10},{reverb:.04});
await save('run_start',1.35,(t)=>{const e=env(t,1.35,.012,.32),rise=Math.min(1,t/.75),pad=(sine(t,110)+sine(t,165,.4)*.7+sine(t,220,.8)*.45)*.22,whoosh=(rnd()*2-1)*Math.sin(Math.PI*Math.min(1,t/.8))*.11;return e*(pad*rise+chirp(t,1.35,75,620)*.18+whoosh)},{reverb:.42});
await save('pulse',.16,(t)=>{const e=env(t,.16,.001,.12),body=chirp(t,.16,1500,150)*.48+sine(t,82)*Math.exp(-t*24)*.42,air=(rnd()*2-1)*Math.exp(-t*42)*.18;return e*(body+air)},{reverb:.05});
await save('missile',.58,(t)=>{const e=env(t,.58,.004,.28),motor=(rnd()*2-1)*(.26+.16*Math.sin(TAU*34*t)),low=sine(t,68+22*t)*.34,whine=chirp(t,.58,240,92)*.16;return e*(motor+low+whine)},{reverb:.11});
await save('rail',.72,(t)=>{const crack=(rnd()*2-1)*Math.exp(-t*85)*.72,body=sine(t,46)*Math.exp(-t*7)*.62+chirp(t,.72,980,70)*Math.exp(-t*14)*.28;return (crack+body)*env(t,.72,.001,.42)},{reverb:.22,gain:.92});
await save('arc',.38,(t)=>{const gate=(Math.sin(TAU*47*t)>-.15?1:.15),electric=(rnd()*2-1)*gate*Math.exp(-t*4.8),tone=chirp(t,.38,2100,330)*.28;return env(t,.38,.001,.18)*(electric*.38+tone)},{reverb:.18});
await save('explosion',1.05,(t)=>{const decay=Math.exp(-t*3.8),boom=sine(t,42-10*t)*decay*.72,rumble=(rnd()*2-1)*decay*.46,crack=(rnd()*2-1)*Math.exp(-t*34)*.75;return env(t,1.05,.001,.5)*(boom+rumble+crack)},{reverb:.30,gain:.94});
await save('player_hit',.62,(t)=>{const impact=(rnd()*2-1)*Math.exp(-t*32)*.72,body=sine(t,55)*Math.exp(-t*8)*.62,metal=chirp(t,.62,740,170)*Math.exp(-t*11)*.2;return env(t,.62,.001,.34)*(impact+body+metal)},{reverb:.17});
await save('kill',.22,(t)=>{const e=env(t,.22,.001,.13),pop=(rnd()*2-1)*Math.exp(-t*40)*.26,tonal=chirp(t,.22,180,720)*.34+sine(t,90)*Math.exp(-t*18)*.26;return e*(pop+tonal)},{reverb:.08});
await save('pickup',.42,(t)=>{const e=env(t,.42,.004,.2),notes=[660,880,1320],v=notes.reduce((a,f,j)=>a+sine(Math.max(0,t-j*.045),f)*Math.exp(-Math.max(0,t-j*.045)*12)*(t>=j*.045?1:0),0);return e*v*.25},{reverb:.32});
await save('level_up',1.32,(t)=>{const e=env(t,1.32,.008,.36),notes=[261.63,329.63,392,523.25,659.25],v=notes.reduce((a,f,j)=>{const tt=t-j*.115;return a+(tt>=0?sine(tt,f)*Math.exp(-tt*2.6):0)},0);return e*(v*.17+sine(t,65)*Math.exp(-t*3)*.25)},{reverb:.48});
await save('rush_start',1.62,(t)=>{const e=env(t,1.62,.005,.34),riser=chirp(t,1.62,68,980)*(.12+.18*t/1.62),bass=sine(t,55)*.34,noise=(rnd()*2-1)*Math.sin(Math.PI*t/1.62)*.16,pulse=sine(t,110)*(.5+.5*Math.sin(TAU*8*t))*.18;return e*(riser+bass+noise+pulse)},{reverb:.42,gain:.92});
await save('rush_end',.88,(t)=>env(t,.88,.003,.44)*(chirp(t,.88,620,75)*.38+sine(t,52)*Math.exp(-t*5)*.38+(rnd()*2-1)*Math.exp(-t*7)*.12),{reverb:.24});
await save('boss_warning',2.35,(t)=>{const e=env(t,2.35,.01,.3),beat=Math.floor(t/.52),local=t% .52,alarm=sine(local,beat%2?82:73.4)*Math.exp(-local*5)*.48,sub=sine(t,36.7)*.25,air=(rnd()*2-1)*.08;return e*(alarm+sub+air)},{reverb:.36,gain:.90});

await save('combat_loop',16,(t)=>{
  const beatDur=.5,beat=Math.floor(t/beatDur),local=t%beatDur,bar=Math.floor(t/4)%4,roots=[55,65.41,49,73.42],rootHz=roots[bar];
  const barT=t%4,padEnv=Math.sin(Math.PI*barT/4)*.55+.45,pad=(sine(t,rootHz)+sine(t,rootHz*1.5,.7)*.65+sine(t,rootHz*2,.2)*.36)*.12*padEnv;
  const bass=sine(local,rootHz)*Math.exp(-local*5.5)*.34;
  const kick=sine(local,58-22*Math.min(1,local/.18))*Math.exp(-local*18)*.52;
  const hat=((rnd()*2-1))*Math.exp(-((t+.25)% .5)*34)*.065;
  const arpIndex=Math.floor(t/.25)%8,arpNotes=[1,1.5,2,2.5,3,2,1.5,2],arpLocal=t%.25,arp=sine(arpLocal,rootHz*arpNotes[arpIndex]*4)*Math.exp(-arpLocal*11)*.10;
  const side=beat%2?-.018:.018;const mono=pad+bass+kick+hat+arp;return[mono*(1-side)+arp*.18,mono*(1+side)-arp*.12]
},{reverb:.26,gain:.82});

console.log(`Generated premium audio pack in ${outDir}`);
