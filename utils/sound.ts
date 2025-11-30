// Advanced Arcade Synth Engine
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getCtx = () => {
  try {
    if (!ctx && AudioContextClass) {
      ctx = new AudioContextClass();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn("Audio resume failed", e));
    }
    return ctx && masterGain ? { ctx, masterGain } : null;
  } catch (e) {
    return null;
  }
};

const PENTATONIC_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00, 
  523.25, 587.33, 659.25, 783.99, 880.00, 
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00
];

const playSynthTone = (
  freq: number, 
  type: OscillatorType, 
  duration: number, 
  vol: number = 0.1, 
  startTime: number = 0,
  filterFreq: number = 2000
) => {
  const audio = getCtx();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  
  try {
    const now = ctx.currentTime + startTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = 1;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  } catch(e) {}
};

export const playSpinNote = (index: number, speedRatio: number) => {
  const noteIndex = index % PENTATONIC_SCALE.length;
  const freq = PENTATONIC_SCALE[noteIndex];
  const filterCutoff = 800 + (speedRatio * 3000);
  const duration = 0.1 + ((1 - speedRatio) * 0.1);
  
  playSynthTone(freq, 'triangle', duration, 0.15, 0, filterCutoff);
  if (speedRatio < 0.8) {
     playSynthTone(freq / 2, 'sine', duration, 0.1, 0, 400);
  }
};

export const playStopSound = () => {
  const audio = getCtx();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const now = ctx.currentTime;
  try {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.2);
  } catch(e) {}
};

export const playBetSound = () => playSynthTone(1200, 'sine', 0.08, 0.1, 0, 3000);
export const playCoinSound = () => {
  playSynthTone(1567.98, 'sine', 0.4, 0.1, 0); 
  playSynthTone(2093.00, 'sine', 0.5, 0.1, 0.05);
};

export const playWinSound = (multiplier: number) => {
  if (multiplier === 0) {
     // Special
     playSynthTone(600, 'sawtooth', 1.5, 0.2, 0, 2000);
     return;
  }
  const chordRoot = 523.25;
  if (multiplier <= 5) {
     playSynthTone(chordRoot, 'triangle', 0.3, 0.2, 0);
     playSynthTone(659.25, 'triangle', 0.3, 0.2, 0.05);
  } else {
     [523.25, 659.25, 783.99, 987.77].forEach((freq, i) => {
        playSynthTone(freq, 'sawtooth', 0.4, 0.1, i * 0.06, 1500);
     });
  }
};

export const playErrorSound = () => playSynthTone(150, 'triangle', 0.2, 0.2, 0, 300);
export const playCreditCountSound = () => playSynthTone(2000, 'square', 0.03, 0.03, 0, 1000);

// NEW SOUNDS
export const playCollectionSound = () => {
    // A nice "ding" for collecting items
    playSynthTone(1318.51, 'sine', 0.5, 0.2, 0, 3000);
};

export const playBonusSound = () => {
    // Free Spin Trigger or Collection Complete
    const audio = getCtx();
    if (!audio) return;
    const { ctx, masterGain } = audio;
    const now = ctx.currentTime;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);
        osc.frequency.linearRampToValueAtTime(440, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.6);
    } catch(e) {}
};