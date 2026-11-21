// Audio: every sound is synthesised with WebAudio — no audio files, no network.
// Footsteps are soft ticks, a pickup is a short chime, the alarm is a two-tone siren,
// and winning or losing gets a small phrase of notes.
let context = null;
let muted = false;
let alarmNodes = null;

function ensureContext() {
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Call from the first user gesture so the browser lets sound play. */
export function unlockAudio() {
  ensureContext();
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarm();
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(frequency, seconds, type, gainValue, when = 0, slideTo = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.05);
}

export function playStep(running) {
  tone(running ? 150 : 110, 0.07, 'triangle', running ? 0.09 : 0.05);
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.12);
  tone(1318, 0.18, 'sine', 0.1, 0.08);
}

export function playCaught() {
  tone(220, 0.35, 'sawtooth', 0.12, 0, 110);
  tone(110, 0.5, 'sawtooth', 0.1, 0.15, 55);
}

export function playWin() {
  tone(523, 0.16, 'sine', 0.12);
  tone(659, 0.16, 'sine', 0.12, 0.14);
  tone(784, 0.3, 'sine', 0.12, 0.28);
}

export function playClick() {
  tone(660, 0.06, 'sine', 0.08);
}

/** A looping two-tone siren while any guard chases; safe to call every frame. */
export function startAlarm() {
  if (muted || alarmNodes) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 620;
  lfo.type = 'sine';
  lfo.frequency.value = 2.2;
  lfoGain.gain.value = 180;
  gain.gain.value = 0.035;
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  lfo.start();
  alarmNodes = { oscillator, lfo, gain };
}

export function stopAlarm() {
  if (!alarmNodes) return;
  try {
    alarmNodes.oscillator.stop();
    alarmNodes.lfo.stop();
  } catch {
    // Already stopped: nothing to do.
  }
  alarmNodes = null;
}
