const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

function createWavBuffer(sampleRate, duration, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * duration);
  const blockAlign = 2; // 16-bit mono = 2 bytes per sample
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16)

  // 'data' Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = sampleGenerator(t, duration);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

const sampleRate = 44100;

// 1. Classic Bell (Dual harmonic warm bell strike)
const classicBell = createWavBuffer(sampleRate, 1.2, (t) => {
  const env = Math.exp(-3.5 * t);
  const f1 = Math.sin(2 * Math.PI * 880 * t);
  const f2 = 0.5 * Math.sin(2 * Math.PI * 1760 * t);
  const f3 = 0.25 * Math.sin(2 * Math.PI * 2640 * t);
  return (f1 + f2 + f3) * env * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'classic-bell.wav'), classicBell);

// 2. Digital Beep (Modern crisp double pulse)
const digitalBeep = createWavBuffer(sampleRate, 0.45, (t) => {
  let env = 0;
  let freq = 950;
  if (t < 0.12) {
    env = Math.sin((t / 0.12) * Math.PI);
    freq = 900;
  } else if (t > 0.18 && t < 0.32) {
    env = Math.sin(((t - 0.18) / 0.14) * Math.PI);
    freq = 1100;
  }
  return Math.sin(2 * Math.PI * freq * t) * env * 0.65;
});
fs.writeFileSync(path.join(soundsDir, 'digital-beep.wav'), digitalBeep);

// 3. Soft Chime (Gentle 3-note ascending chord E5, G#5, B5)
const softChime = createWavBuffer(sampleRate, 1.4, (t) => {
  let sample = 0;
  if (t >= 0) {
    const decay = Math.exp(-4 * t);
    sample += 0.5 * Math.sin(2 * Math.PI * 659.25 * t) * decay;
  }
  if (t >= 0.15) {
    const t2 = t - 0.15;
    const decay = Math.exp(-4 * t2);
    sample += 0.5 * Math.sin(2 * Math.PI * 830.61 * t2) * decay;
  }
  if (t >= 0.3) {
    const t3 = t - 0.3;
    const decay = Math.exp(-3.5 * t3);
    sample += 0.6 * Math.sin(2 * Math.PI * 987.77 * t3) * decay;
  }
  return sample * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'soft-chime.wav'), softChime);

// 4. Morning Bell (Deep resonant zen bell 523Hz C5)
const morningBell = createWavBuffer(sampleRate, 1.6, (t) => {
  const env = Math.exp(-2.2 * t);
  const tremolo = 1 + 0.1 * Math.sin(2 * Math.PI * 6 * t);
  const f1 = Math.sin(2 * Math.PI * 523.25 * t);
  const f2 = 0.35 * Math.sin(2 * Math.PI * 1046.5 * t);
  return (f1 + f2) * env * tremolo * 0.65;
});
fs.writeFileSync(path.join(soundsDir, 'morning-bell.wav'), morningBell);

// 5. Urgent Alarm (Urgent dual-tone alternating alert)
const urgentAlarm = createWavBuffer(sampleRate, 0.9, (t) => {
  const cycle = Math.floor(t / 0.12) % 2;
  const freq = cycle === 0 ? 880 : 1250;
  const env = Math.sin((t % 0.12) / 0.12 * Math.PI);
  return Math.sin(2 * Math.PI * freq * t) * env * 0.75;
});
fs.writeFileSync(path.join(soundsDir, 'urgent-alarm.wav'), urgentAlarm);

// 6. Double Beep (Quick confirmation chirp)
const doubleBeep = createWavBuffer(sampleRate, 0.35, (t) => {
  let env = 0;
  let freq = 1046.5;
  if (t < 0.1) {
    env = Math.sin((t / 0.1) * Math.PI);
  } else if (t >= 0.14 && t < 0.26) {
    env = Math.sin(((t - 0.14) / 0.12) * Math.PI);
    freq = 1318.5;
  }
  return Math.sin(2 * Math.PI * freq * t) * env * 0.65;
});
fs.writeFileSync(path.join(soundsDir, 'double-beep.wav'), doubleBeep);

// 7. Focus Alert (Rhythmic warm chime 440 -> 660)
const focusAlert = createWavBuffer(sampleRate, 1.0, (t) => {
  let sample = 0;
  if (t < 0.25) {
    const env = Math.sin((t / 0.25) * Math.PI);
    sample += Math.sin(2 * Math.PI * 440 * t) * env * 0.5;
  }
  if (t >= 0.15) {
    const t2 = t - 0.15;
    const decay = Math.exp(-3.5 * t2);
    sample += Math.sin(2 * Math.PI * 659.25 * t2) * decay * 0.7;
  }
  return sample * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'focus-alert.wav'), focusAlert);

// 8. Gentle Reminder (Ambient soft chord with smooth fade)
const gentleReminder = createWavBuffer(sampleRate, 1.5, (t) => {
  const env = Math.sin((t / 1.5) * Math.PI) * Math.exp(-1.5 * t);
  const f1 = Math.sin(2 * Math.PI * 587.33 * t);
  const f2 = 0.4 * Math.sin(2 * Math.PI * 880 * t);
  return (f1 + f2) * env * 0.6;
});
fs.writeFileSync(path.join(soundsDir, 'gentle-reminder.wav'), gentleReminder);

// 9. Task Complete (Bright uplifting triad C5 -> E5 -> G5)
const taskComplete = createWavBuffer(sampleRate, 0.9, (t) => {
  let sample = 0;
  if (t < 0.3) {
    const env = Math.sin((t / 0.3) * Math.PI);
    sample += 0.5 * Math.sin(2 * Math.PI * 523.25 * t) * env;
  }
  if (t >= 0.12 && t < 0.5) {
    const t2 = t - 0.12;
    const env = Math.sin((t2 / 0.38) * Math.PI);
    sample += 0.5 * Math.sin(2 * Math.PI * 659.25 * t2) * env;
  }
  if (t >= 0.24) {
    const t3 = t - 0.24;
    const decay = Math.exp(-4 * t3);
    sample += 0.7 * Math.sin(2 * Math.PI * 783.99 * t3) * decay;
  }
  return sample * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'task-complete.wav'), taskComplete);

console.log('Successfully generated 9 WAV sound files in client/public/sounds/');
