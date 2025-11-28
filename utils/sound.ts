// Advanced Arcade Synth Engine
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getCtx = () => {
  try {
    if (!ctx && AudioContextClass) {
      ctx = new AudioContextClass();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4; // Master volume to prevent clipping
      masterGain.connect(ctx.destination);
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn("Audio resume failed", e));
    }
    return ctx && masterGain ? { ctx, masterGain } : null;
  } catch (e) {
    console.warn("Audio Context initialization failed", e);
    return null;
  }
};

// --- MUSICAL CONSTANTS ---
// C Major Pentatonic Scale (C, D, E, G, A) across octaves. 
// This ensures any random sequence of notes sounds pleasant (like a wind chime).
const PENTATONIC_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00, // Octave 4
  523.25, 587.33, 659.25, 783.99, 880.00, // Octave 5
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00 // Octave 6
];

// --- SYNTHESIS HELPERS ---

/**
 * Plays a synthesized tone with a low-pass filter for warmth.
 */
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

    // Filter creates the "analog" feel by cutting harsh highs
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = 1; // Slight resonance

    // Envelope (ADSR-ish)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01); // Fast Attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay to silence

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  } catch(e) {
    // Ignore audio errors
  }
};

// --- GAME SOUNDS ---

export const playSpinNote = (index: number, speedRatio: number) => {
  // Map board index (0-23) to a note in the Pentatonic scale.
  // We use modulo to wrap around the scale array.
  const noteIndex = index % PENTATONIC_SCALE.length;
  const freq = PENTATONIC_SCALE[noteIndex];

  // Dynamic Sound Design:
  // Fast spin = Brighter sound (higher filter), shorter duration.
  // Slow spin = Warmer sound (lower filter), longer duration.
  const filterCutoff = 800 + (speedRatio * 3000); // 800Hz to 3800Hz
  const duration = 0.1 + ((1 - speedRatio) * 0.1); // Longer when slow
  
  // 'triangle' waves are softer and more flute/marimba like than 'square'
  playSynthTone(freq, 'triangle', duration, 0.15, 0, filterCutoff);
  
  // Add a very subtle lower octave "thump" for mechanical feel
  if (speedRatio < 0.8) {
     playSynthTone(freq / 2, 'sine', duration, 0.1, 0, 400);
  }
};

export const playStopSound = () => {
  // A heavy, satisfying mechanical "clunk"
  // Layering a quick pitch-drop sine with a noise burst (simulated by low saw)
  const audio = getCtx();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const now = ctx.currentTime;

  try {
    // Layer 1: Low Thud
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

    // Layer 2: Metallic Click (High filtered saw)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, now);
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.1);
  } catch(e) {}
};

export const playBetSound = () => {
  // A crisp, high-tech "blip"
  playSynthTone(1200, 'sine', 0.08, 0.1, 0, 3000);
};

export const playCoinSound = () => {
  // Classic coin shimmering sound (two high notes close together)
  playSynthTone(1567.98, 'sine', 0.4, 0.1, 0); // G6
  playSynthTone(2093.00, 'sine', 0.5, 0.1, 0.05); // C7
};

export const playWinSound = (multiplier: number) => {
  const audio = getCtx();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const now = ctx.currentTime;

  try {
    if (multiplier === 0) {
      // JACKPOT / LUCK: A Siren sequence
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      osc.frequency.linearRampToValueAtTime(600, now + 0.8);
      osc.frequency.linearRampToValueAtTime(1200, now + 1.2);
      gain.gain.value = 0.2;
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.5);
      return;
    }

    // Define a nice Major 7th Chord for wins
    const chordRoot = 523.25; // C5
    const majorThird = 659.25; // E5
    const perfectFifth = 783.99; // G5
    const majorSeventh = 987.77; // B5

    if (multiplier <= 5) {
      // Small Win: Happy Major Triad
      playSynthTone(chordRoot, 'triangle', 0.3, 0.2, 0);
      playSynthTone(majorThird, 'triangle', 0.3, 0.2, 0.05);
    } else if (multiplier <= 20) {
      // Medium Win: Upward Arpeggio with Sawtooth (brassier)
      [chordRoot, majorThird, perfectFifth, majorSeventh].forEach((freq, i) => {
          playSynthTone(freq, 'sawtooth', 0.4, 0.1, i * 0.06, 1500);
      });
    } else {
      // Big Win: The "Rave" Stabs
      // Plays the chord repeatedly in a rhythmic pattern
      const pattern = [0, 0.15, 0.3, 0.45, 0.6, 0.75]; // Rhythm
      pattern.forEach(time => {
         playSynthTone(chordRoot, 'sawtooth', 0.2, 0.15, time, 2000);
         playSynthTone(perfectFifth, 'sawtooth', 0.2, 0.15, time, 2000);
         playSynthTone(majorSeventh, 'sawtooth', 0.2, 0.15, time, 2000);
         playSynthTone(chordRoot * 2, 'sine', 0.2, 0.1, time, 4000); // High sparkle
      });
    }
  } catch(e) {}
};

export const playErrorSound = () => {
  // A soft, low "bonk" instead of a harsh buzzer
  playSynthTone(150, 'triangle', 0.2, 0.2, 0, 300);
  playSynthTone(145, 'sawtooth', 0.2, 0.1, 0, 300); // slight dissonance
};

export const playCreditCountSound = () => {
   // A very short, high "tick" for the score counter
   playSynthTone(2000, 'square', 0.03, 0.03, 0, 1000);
};