const SCALE=[146.83,164.81,185,220,246.94];
const MOTIFS={
  city:[0,2,3,2,4,3,1,-1,2,3,4,2,1,0,-1,2],
  yard:[0,-1,2,-1,3,2,-1,0],
  temple:[4,-1,-1,2,-1,0,-1,-1],
  fair:[0,2,3,4,3,2,1,2],
  fields:[0,-1,2,-1,3,-1,1,-1],
};
export const soundRegion=x=>x<5000?'city':x<8000?'yard':x<10700?'fields':x<13000?'temple':x<15300?'fair':'fields';

export class AudioActivation {
  constructor({preferred=false,createContext,onChange}){
    this.preferred=preferred;this.createContext=createContext;this.onChange=onChange;this.context=null;this.active=false;
  }
  set(enabled){
    this.preferred=enabled;
    if(!enabled){this.active=false;this.onChange(false,this.context);return Promise.resolve(false);}
    return this.resume();
  }
  async resume(){
    if(!this.preferred)return false;
    try{
      this.context??=this.createContext();
      if(this.context.state!=='running')await this.context.resume();
    }catch{}
    this.active=this.preferred&&this.context?.state==='running';
    this.onChange(Boolean(this.active),this.context);
    return Boolean(this.active);
  }
}

export class Soundscape {
  constructor(context){
    this.context=context;this.step=0;this.next=0;this.nextBird=0;this.enabled=false;
    this.output=context.createGain();this.output.gain.value=0;this.output.connect(context.destination);
    this.music=context.createGain();this.music.gain.value=0;this.music.connect(this.output);
    const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),samples=buffer.getChannelData(0);
    let last=0,seed=73;for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;last=last*.94+(seed/4294967296-.5)*.06;samples[i]=last;}
    const water=context.createBufferSource(),filter=context.createBiquadFilter();water.buffer=buffer;water.loop=true;filter.type='lowpass';filter.frequency.value=650;
    this.water=context.createGain();this.water.gain.value=.45;water.connect(filter);filter.connect(this.water);this.water.connect(this.music);water.start();
  }
  note(frequency,time,duration=1,volume=.07,type='triangle',output=this.music){
    const c=this.context,o=c.createOscillator(),g=c.createGain(),filter=c.createBiquadFilter();
    o.type=type;o.frequency.setValueAtTime(frequency,time);filter.type='lowpass';filter.frequency.setValueAtTime(frequency*5,time);filter.frequency.exponentialRampToValueAtTime(frequency*1.2,time+duration);
    g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(volume,time+.012);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(filter);filter.connect(g);g.connect(output);o.onended=()=>{o.disconnect();filter.disconnect();g.disconnect();};o.start(time);o.stop(time+duration+.02);
  }
  update(x,active,enabled){
    const now=this.context.currentTime,region=soundRegion(x);this.enabled=enabled;
    this.output.gain.value=enabled?.65:0;this.music.gain.value=active&&enabled?1:0;
    if(!active||!enabled){this.next=now;this.nextBird=now+3;return;}
    this.water.gain.value=region==='fields'?.65:region==='temple'?.2:.4;
    if(now>=this.next){
      const motif=MOTIFS[region],degree=motif[this.step%motif.length];
      if(degree>=0){const f=SCALE[(degree+Math.floor(this.step/32))%5];this.note(f*2,now,region==='temple'?1.8:.9,.07,region==='temple'?'sine':'triangle');if(region==='temple')this.note(f*5.54,now,1.1,.025,'sine');}
      if(this.step%4===0)this.note(SCALE[Math.floor(this.step/16)%5],now,1.3,.05);
      if(region==='yard'&&this.step%2===0)this.note(94,now,.08,.1,'triangle');
      this.step++;this.next=now+(region==='temple'?.85:region==='fair'?.33:.52);
    }
    if(now>=this.nextBird){
      if(region==='fields'||region==='temple')for(const [delay,f] of [[0,1175],[.15,1568]])this.note(f,now+delay,.12,.025,'sine');
      this.nextBird=now+6+(this.step%4);
    }
  }
  cue(degree){
    if(!this.enabled)return;const now=this.context.currentTime;
    if(Number.isInteger(degree)){this.note(SCALE[degree%5]*4,now,.9,.1,'sine',this.output);return;}
    for(const [i,f] of [523.25,659.25,783.99].entries())this.note(f,now+i*.08,.65,.06,'sine',this.output);
  }
}
