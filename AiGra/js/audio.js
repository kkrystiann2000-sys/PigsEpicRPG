/* ============================================================
   Tiny WebAudio sound effects — no asset files needed
   ============================================================ */
const SFX = (function () {
  let ctx = null;
  let muted = false;
  let armed = false;
  try {
    muted = localStorage.getItem('piggy-epic-muted') === '1';
  } catch (e) { /* storage may be blocked */ }

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(o) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + (o.delay || 0);
    const dur = o.dur || 0.12;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.gain || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain, cutoff, delay) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 1200;
    const g = a.createGain();
    g.gain.value = gain || 0.15;
    src.connect(filter).connect(g).connect(a.destination);
    src.start(t0);
  }

  const bank = {
    click: () => tone({ freq: 700, to: 520, dur: 0.06, type: 'triangle', gain: 0.06 }),
    select: () => tone({ freq: 880, to: 1180, dur: 0.08, type: 'sine', gain: 0.07 }),
    nope: () => tone({ freq: 160, to: 110, dur: 0.16, type: 'square', gain: 0.05 }),
    attack: () => {
      noise(0.1, 0.16, 2200);
      tone({ freq: 320, to: 140, dur: 0.12, type: 'square', gain: 0.07 });
    },
    hit: () => {
      noise(0.1, 0.2, 1500);
      tone({ freq: 220, to: 90, dur: 0.1, type: 'triangle', gain: 0.09 });
    },
    hurt: () => {
      noise(0.14, 0.14, 900);
      tone({ freq: 200, to: 80, dur: 0.16, type: 'sawtooth', gain: 0.05 });
    },
    skill: () => {
      tone({ freq: 520, to: 900, dur: 0.16, type: 'triangle', gain: 0.08 });
      tone({ freq: 780, to: 1200, dur: 0.14, type: 'sine', gain: 0.05, delay: 0.06 });
    },
    ult: () => {
      tone({ freq: 240, to: 880, dur: 0.3, type: 'sawtooth', gain: 0.08 });
      noise(0.24, 0.16, 3000);
    },
    heal: () => {
      tone({ freq: 620, dur: 0.12, type: 'sine', gain: 0.09 });
      tone({ freq: 920, dur: 0.18, type: 'sine', gain: 0.07, delay: 0.09 });
    },
    shield: () => {
      tone({ freq: 1000, dur: 0.18, type: 'sine', gain: 0.06 });
      tone({ freq: 1340, dur: 0.2, type: 'sine', gain: 0.04, delay: 0.05 });
    },
    ko: () => {
      tone({ freq: 420, to: 90, dur: 0.34, type: 'sawtooth', gain: 0.08 });
      noise(0.2, 0.12, 700);
    },
    boom: () => {
      noise(0.5, 0.3, 500);
      tone({ freq: 120, to: 40, dur: 0.5, type: 'sawtooth', gain: 0.14 });
    },
    fuse: () => {
      for (let i = 0; i < 4; i++) tone({ freq: 1300, dur: 0.03, type: 'square', gain: 0.03, delay: i * 0.08 });
    },
    burn: () => {
      noise(0.16, 0.1, 2400);
      tone({ freq: 700, to: 300, dur: 0.1, type: 'triangle', gain: 0.03 });
    },
    start: () => {
      tone({ freq: 440, dur: 0.12, type: 'triangle', gain: 0.08 });
      tone({ freq: 660, dur: 0.18, type: 'triangle', gain: 0.07, delay: 0.1 });
    },
    win: () => {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.09, delay: i * 0.11 })
      );
    },
    lose: () => {
      [440, 392, 330, 262].forEach((f, i) =>
        tone({ freq: f, dur: 0.26, type: 'sine', gain: 0.08, delay: i * 0.14 })
      );
    },
    star: (i) => tone({ freq: 900 + (i || 0) * 260, dur: 0.16, type: 'sine', gain: 0.08 }),
    levelup: () => {
      [659, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, dur: 0.2, type: 'triangle', gain: 0.07, delay: i * 0.08 })
      );
    },
    coin: () => {
      tone({ freq: 1180, dur: 0.06, type: 'square', gain: 0.05 });
      tone({ freq: 1560, dur: 0.1, type: 'square', gain: 0.04, delay: 0.05 });
    },
    dice: () => {
      for (let i = 0; i < 6; i++) noise(0.04, 0.06, 3000, i * 0.06);
      tone({ freq: 300, dur: 0.1, type: 'triangle', gain: 0.05, delay: 0.4 });
    },
    tick: () => tone({ freq: 1500, dur: 0.02, type: 'square', gain: 0.025 }),
    unlock: () => {
      [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, dur: 0.24, type: 'triangle', gain: 0.08, delay: i * 0.09 }));
    },
    gate: () => {
      noise(0.16, 0.12, 500);
      tone({ freq: 180, to: 120, dur: 0.24, type: 'sawtooth', gain: 0.06 });
    },
    potion: () => {
      tone({ freq: 500, to: 900, dur: 0.18, type: 'sine', gain: 0.07 });
      noise(0.1, 0.05, 2200, 0.05);
    },
    buff: () => {
      tone({ freq: 440, to: 880, dur: 0.24, type: 'triangle', gain: 0.07 });
      tone({ freq: 660, to: 1320, dur: 0.24, type: 'sine', gain: 0.04, delay: 0.06 });
    },
    crit: () => {
      noise(0.14, 0.2, 4000);
      tone({ freq: 900, to: 300, dur: 0.16, type: 'square', gain: 0.08 });
    },
    /* A rising growl under a charged attack telegraph. */
    charge: () => {
      tone({ freq: 90, to: 260, dur: 0.5, type: 'sawtooth', gain: 0.05 });
      noise(0.4, 0.06, 700);
    },
    poison: () => {
      tone({ freq: 320, to: 140, dur: 0.22, type: 'sine', gain: 0.05 });
      noise(0.16, 0.05, 1400);
    },
    /* --- the clever flock --- */
    /* A hit bouncing off glass: two bright partials and a shiver of noise. */
    mirror: () => {
      tone({ freq: 1680, to: 2320, dur: 0.16, type: 'sine', gain: 0.05 });
      tone({ freq: 2140, to: 1420, dur: 0.24, type: 'triangle', gain: 0.035, delay: 0.04 });
      noise(0.08, 0.05, 5200, 0.01);
    },
    /* A pepper charge leaving the squad: a snatch, then a smug little chime. */
    steal: () => {
      noise(0.14, 0.1, 3200);
      tone({ freq: 860, to: 340, dur: 0.16, type: 'square', gain: 0.05 });
      tone({ freq: 1340, dur: 0.1, type: 'sine', gain: 0.045, delay: 0.11 });
    },
    /* The flock singing itself louder: a quick stacked third. */
    pack: () => {
      [523, 659, 784, 988].forEach((f, i) =>
        tone({ freq: f, dur: 0.26, type: 'triangle', gain: 0.045, delay: i * 0.045 })
      );
    },
    /* A body hitting the floor: sub thump and dust. */
    slam: () => {
      noise(0.24, 0.2, 420);
      tone({ freq: 150, to: 44, dur: 0.32, type: 'sawtooth', gain: 0.12 });
    },
    /* Wings folding into a dive: a whistle falling from above. */
    dive: () => {
      noise(0.18, 0.08, 2600, 0.04);
      tone({ freq: 1180, to: 220, dur: 0.26, type: 'triangle', gain: 0.06 });
    },
    /* A bird casting at range: it stays put and the air moves instead. */
    cast: () => {
      tone({ freq: 660, to: 1240, dur: 0.24, type: 'sine', gain: 0.05 });
      tone({ freq: 990, to: 1680, dur: 0.2, type: 'sine', gain: 0.03, delay: 0.05 });
    },
    /* A boss turning the fight around: riser, sub drop and a three-note dare. */
    phase: () => {
      noise(0.6, 0.16, 900);
      tone({ freq: 70, to: 300, dur: 0.9, type: 'sawtooth', gain: 0.1 });
      [220, 277, 330].forEach((f, i) =>
        tone({ freq: f, dur: 0.8, type: 'sine', gain: 0.04, delay: 0.22 + i * 0.03 })
      );
      tone({ freq: 110, to: 60, dur: 0.5, type: 'square', gain: 0.06, delay: 0.5 });
    },
    /* Something very heavy arriving. */
    quake: () => {
      noise(0.5, 0.22, 260);
      tone({ freq: 62, to: 28, dur: 0.62, type: 'sine', gain: 0.14 });
    },
    /* A bird losing its temper: a rising snarl. */
    berserk: () => {
      tone({ freq: 170, to: 520, dur: 0.34, type: 'sawtooth', gain: 0.09 });
      noise(0.3, 0.12, 1200);
    },
  };

  /* Cheap "voice acting": a little formant-ish babble per character. */
  const VOICES = {
    corporal: { base: 190, type: 'sawtooth', syl: 3, spread: 1.1 },
    chef: { base: 240, type: 'triangle', syl: 3, spread: 1.25 },
    king: { base: 120, type: 'sawtooth', syl: 3, spread: 0.9 },
    sapper: { base: 210, type: 'square', syl: 2, spread: 1.15 },
    scout: { base: 268, type: 'square', syl: 2, spread: 1.25 },
    wizard: { base: 300, type: 'sine', syl: 3, spread: 1.4 },
    red: { base: 420, type: 'sawtooth', syl: 2, spread: 1.5 },
    chuck: { base: 560, type: 'square', syl: 3, spread: 1.7 },
    blue: { base: 640, type: 'triangle', syl: 2, spread: 1.8 },
    bomb: { base: 150, type: 'sawtooth', syl: 2, spread: 0.8 },
    matilda: { base: 480, type: 'sine', syl: 3, spread: 1.3 },
    hal: { base: 380, type: 'triangle', syl: 2, spread: 1.3 },
    bubbles: { base: 600, type: 'sine', syl: 3, spread: 1.6 },
    stella: { base: 520, type: 'sine', syl: 3, spread: 1.45 },
    terence: { base: 110, type: 'sawtooth', syl: 2, spread: 0.7 },
    eagle: { base: 95, type: 'sawtooth', syl: 3, spread: 0.6 },
    mother: { base: 140, type: 'square', syl: 3, spread: 0.85 },
  };

  function voice(id) {
    if (muted) return;
    const v = VOICES[id] || VOICES.corporal;
    try {
      const n = v.syl;
      for (let i = 0; i < n; i++) {
        const f = v.base * (1 + (Math.random() - 0.5) * 0.18) * (i === n - 1 ? 0.82 : 1);
        tone({
          freq: f,
          to: f * v.spread * (i === n - 1 ? 0.85 : 1.08),
          dur: 0.08 + Math.random() * 0.04,
          type: v.type,
          gain: 0.05,
          delay: i * 0.085,
        });
      }
    } catch (e) { /* ignore */ }
  }

  function play(name, arg) {
    if (muted) return;
    const fn = bank[name];
    if (!fn) return;
    try {
      fn(arg);
    } catch (e) { /* audio is a nice-to-have */ }
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem('piggy-epic-muted', muted ? '1' : '0'); } catch (e) {}
    /* The soundtrack follows the sound switch. */
    try { if (Music && Music.setMuted) Music.setMuted(muted); } catch (e) { /* not built yet */ }
  }

  return { play, voice, setMuted, getCtx: ac, isMuted: () => muted };
})();


/* ============================================================
   Soundtracks — synthesised, no audio files.

   One cue per world, one per boss fight and one for the dungeon.
   Every theme is the same shape: a four-bar chord loop, a bass
   line on the eighths, an arpeggio and an optional melody, with
   a drum pattern written as |k|ick, |s|nare, |h|at, dot = rest.
   Steps are sixteenth notes, sixteen to the bar.
   ============================================================ */
const Music = (function () {
  const THEMES = {
    /* --- Main theme: the title, the map, the barracks. Warm, unhurried, hummable. --- */
    menu: {
      bpm: 96, root: 261.63, scale: [0, 2, 4, 5, 7, 9, 11],
      chords: [0, 7, 9, 5, 0, 7, 5, 7],
      bass: 'x..x....x..x....',
      arp: [0, 4, 7, 12, 7, 4, 0, 7], arpEvery: 2,
      lead: ['4...5...6...5...', '4...2.......0...', '0...2...4...2...', '3...4...5.......', '4...5...7...5...', '4...2...0.......', '3...5...4...3...', '4.......2...0...'],
      drums: ['k...h...s...h...', 'k...h...s...h...', 'k...h...s...h...', 'k...h...s..hh.hh', 'k...h...s...h...', 'k...h...s...h...', 'k...h...s...h...', 'k...h...s..hh.hh'],
      pad: [0, 7, 12], padWave: 'sine', padGain: 0.014,
      bassWave: 'triangle', arpWave: 'triangle', leadWave: 'sine',
      bassGain: 0.09, arpGain: 0.022, leadGain: 0.045,
    },
    /* --- Egg World: sun on the meadow, a march you can hum while you walk. --- */
    world1: {
      bpm: 112, root: 261.63, scale: [0, 2, 4, 5, 7, 9, 11],
      chords: [0, 5, 7, 9],
      bass: 'x..x..x.x..x..x.',
      arp: [0, 4, 7, 12, 7, 4, 7, 12], arpEvery: 2,
      lead: ['4.5.6.5.4...2...', '3.4.5.4.3...5...', '2.4.5.7.5.4.2...', '4.......2.0.....'],
      drums: ['k.h.s.h.k.h.s.hh', 'k.h.s.h.k.h.s.h.', 'k.h.s.h.k.h.s.hh', 'k.h.s.h.k.hks.hh'],
      pad: [0, 7], padWave: 'triangle', padGain: 0.012,
      bassWave: 'triangle', arpWave: 'triangle', leadWave: 'sine',
      bassGain: 0.09, arpGain: 0.026, leadGain: 0.05,
    },
    /* --- Cuckoo Canyon: dry western gallop with a square-wave lead. --- */
    world2: {
      bpm: 118, root: 196.0, scale: [0, 2, 4, 5, 7, 9, 10],
      chords: [0, 5, 3, 7],
      bass: 'x.x..x..x.x..x..',
      arp: [0, 7, 3, 7, 0, 7, 10, 7], arpEvery: 2,
      lead: ['5.4.3.2.0.......', '3.5.4.3.2.......', '0.2.3.5.4.3.....', '2.......0.......'],
      drums: ['k..hs.hk..hs.s.h', 'k..hs.hk..hs.s.h', 'k..hs.hk..hs.s.h', 'k..hs.hkk.hks.hh'],
      pad: [0, 7], padWave: 'triangle', padGain: 0.01,
      bassWave: 'triangle', arpWave: 'square', leadWave: 'square',
      bassGain: 0.09, arpGain: 0.02, leadGain: 0.04,
    },
    /* --- Frost Peak: thin bells, a slow pad and a lot of air. --- */
    world3: {
      bpm: 82, root: 261.63, scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, -4, 3, 5],
      bass: 'x.......x.......',
      arp: [12, 19, 24, 19, 15, 19, 24, 19], arpEvery: 2,
      lead: ['....4.......2...', '....5.......4...', '....7...5.......', '....4...........'],
      drums: ['h...h...h...h..h', 'h...h...h...h..h', 'h...h...h...h..h', 'h...h...h..hh.hh'],
      pad: [0, 7, 12], padWave: 'sine', padGain: 0.013,
      bassWave: 'sine', arpWave: 'sine', leadWave: 'sine',
      bassGain: 0.07, arpGain: 0.02, leadGain: 0.045,
    },
    /* --- Saltwind Shore: a rolling shanty that leans on the off-beats. --- */
    world4: {
      bpm: 104, root: 246.94, scale: [0, 2, 4, 5, 7, 9, 10],
      chords: [0, 5, 7, 10],
      bass: 'x..x..x.x..x..x.',
      arp: [0, 7, 12, 7, 5, 9, 12, 9], arpEvery: 2,
      lead: ['4...2...4...7...', '5...4...2.......', '0...2...4...5...', '4.......2.......'],
      drums: ['k.h.s.h.k.h.s.hh', 'k.h.s.h.k.h.s.h.', 'k.h.s.h.k.h.s.hh', 'k.h.s.h.k.hks.hh'],
      pad: [0, 7], padWave: 'triangle', padGain: 0.011,
      bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'triangle',
      bassGain: 0.065, arpGain: 0.02, leadGain: 0.045,
    },
    /* --- Gilded Kingdom: processional pomp with bells on the top line. --- */
    world5: {
      bpm: 110, root: 174.61, scale: [0, 2, 4, 5, 7, 9, 11],
      chords: [0, 5, 7, 5],
      bass: 'x...x..xx...x...',
      arp: [0, 4, 7, 12, 11, 7, 4, 7], arpEvery: 2,
      lead: ['7...5...4...7...', '9...7...5.......', '4...5...7...4...', '5.......4.......'],
      drums: ['k.h.s.hhk.h.s.hh', 'k.h.s.hhk.h.s.h.', 'k.h.s.hhk.h.s.hh', 'k.h.s.hkk.hks.hh'],
      pad: [0, 7, 12], padWave: 'sine', padGain: 0.013,
      bassWave: 'triangle', arpWave: 'triangle', leadWave: 'sine',
      bassGain: 0.07, arpGain: 0.03, leadGain: 0.04,
    },
    /* --- Boss: low, fast, and built on a sawtooth ostinato. --- */
    boss1: {
      bpm: 142, root: 110.0, scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, 0, 3, 5],
      bass: 'xx.xxx.xxx.xxx.x',
      arp: [0, 0, 12, 0, 7, 0, 12, 7], arpEvery: 2,
      lead: ['..0..3..5..3..0.', '..0..5..7..5..3.', '..3..5..8..5..3.', '..0..3..0.......'],
      drums: ['k.hks.hkk.hks.hh', 'k.hks.hkk.hks.h.', 'k.hks.hkk.hks.hh', 'k.hks.hkk.hks.hh'],
      pad: [0, 12], padWave: 'sawtooth', padGain: 0.008,
      bassWave: 'sawtooth', arpWave: 'square', leadWave: 'square',
      bassGain: 0.075, arpGain: 0.018, leadGain: 0.045,
    },
    /* --- Boss: minor-key strut, snare pushing every bar. --- */
    boss2: {
      bpm: 128, root: 130.81, scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, 5, 3, 7],
      bass: 'x..x.x..x.x..x.x',
      arp: [0, 3, 7, 3, 12, 7, 3, 7], arpEvery: 2,
      lead: ['5...3.2...0.2.3.', '7...5.3...2.3.5.', '5...3.2...0.....', '2.......0.......'],
      drums: ['k.h.s.hhk.h.s.hs', 'k.h.s.hhk.h.s.h.', 'k.h.s.hhk.h.s.hs', 'k.hks.hkk.hks.hh'],
      pad: [0, 7], padWave: 'triangle', padGain: 0.01,
      bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'square',
      bassGain: 0.075, arpGain: 0.019, leadGain: 0.045,
    },
    /* --- Boss: relentless sixteenths, no room to breathe. --- */
    boss3: {
      bpm: 148, root: 155.56, scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, 1, 5, 3],
      bass: 'xxxxxxxxxxxxxxxx',
      arp: [0, 12, 0, 7, 0, 12, 7, 0], arpEvery: 2,
      lead: ['0.3.0.5.3.2.0...', '0.3.5.7.5.3.2...', '1.3.5.8.5.3.1...', '0.......3.......'],
      drums: ['k.hks.hkk.hks.hs', 'k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hs', 'k.hks.hkk.hks.hh'],
      pad: [0, 12], padWave: 'sawtooth', padGain: 0.007,
      bassWave: 'sawtooth', arpWave: 'square', leadWave: 'square',
      bassGain: 0.05, arpGain: 0.017, leadGain: 0.045,
    },
    /* --- Boss: harmonic minor, chromatic stabs, wide intervals. --- */
    boss4: {
      bpm: 134, root: 123.47, scale: [0, 2, 3, 5, 7, 8, 11],
      chords: [0, 1, 0, -2],
      bass: 'x.xx.x.xx.xx.x.x',
      arp: [0, 7, 1, 7, 0, 7, 12, 7], arpEvery: 2,
      lead: ['1..0..3..1..0...', '1..3..5..3..1...', '0..1..3..6..5...', '3.......0.......'],
      drums: ['k.hks.hkk.hks.hh', 'k.hks.hkk.hks.h.', 'k.hks.hkk.hks.hh', 'k.hks.hkk.hks.hh'],
      pad: [0, 12], padWave: 'triangle', padGain: 0.009,
      bassWave: 'sawtooth', arpWave: 'square', leadWave: 'square',
      bassGain: 0.075, arpGain: 0.018, leadGain: 0.045,
    },
    /* --- Final boss: the kingdom theme turned inside out. --- */
    boss5: {
      bpm: 138, root: 116.54, scale: [0, 2, 3, 5, 7, 8, 11],
      chords: [0, 3, 0, 5],
      bass: 'xx.xxx.xx.xxx.x.',
      arp: [0, 7, 12, 7, 0, 12, 7, 3], arpEvery: 2,
      lead: ['0..3..7..5..3...', '0..5..8..7..5...', '3..5..7..5..3...', '0.......3.......'],
      drums: ['k.hks.hkk.hks.hh', 'k.hks.hkk.hks.h.', 'k.hks.hkk.hks.hh', 'k.hks.hkk.hks.hh'],
      pad: [0, 12], padWave: 'sawtooth', padGain: 0.008,
      bassWave: 'sawtooth', arpWave: 'square', leadWave: 'square',
      bassGain: 0.075, arpGain: 0.018, leadGain: 0.045,
    },
    /* --- Final boss, second half: the kingdom theme at the gallop, with a
       chromatic stab on every third beat. This is the only cue that has to
       sell a losing position turning into a fight. --- */
    boss5phase: {
      bpm: 156, root: 116.54, scale: [0, 2, 3, 5, 7, 8, 11],
      chords: [0, 3, 5, 3],
      bass: 'xx.xx.xx.xx.xx.x',
      arp: [0, 7, 12, 15, 12, 7, 0, -2], arpEvery: 1,
      lead: ['0.3.5.7.5.3.0...', '3.5.8.11.8.5.3..', '5.7.8.11.8.7.5..', '3.1.0...3.......'],
      drums: ['k.hks.hkk.hks.hh', 'k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hh', 'k.hks.hkk.hksksh'],
      pad: [0, 12, 19], padWave: 'sawtooth', padGain: 0.009,
      bassWave: 'sawtooth', arpWave: 'square', leadWave: 'square',
      bassGain: 0.07, arpGain: 0.016, leadGain: 0.05,
    },
    /* --- Dungeon: slow, low and mostly empty space. --- */
    dungeon: {
      bpm: 72, root: 98.0, scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, -2, 3, -4],
      bass: 'x.......x...x...',
      arp: [0, 12, 0, 15, 0, 12, 0, 10], arpEvery: 2,
      lead: ['........0.......'],
      drums: ['k.......s.......'],
      pad: [0, 7], padWave: 'sine', padGain: 0.011,
      bassWave: 'sine', arpWave: 'sine', leadWave: 'sine',
      bassGain: 0.085, arpGain: 0.018, leadGain: 0.05,
    },
  };

  let theme = null;
  let name = '';
  let step = 0;
  let nextTime = 0;
  let timer = null;
  let out = null;
  let muted = false;
  /* 0 or 1. Set by a boss crossing into its second phase: the same cue plays
     faster with doubled hats, an extra kick and a fifth stacked on the chord. */
  let intensity = 0;

  function output() {
    const a = SFX.getCtx ? SFX.getCtx() : null;
    if (!a) return null;
    if (!out) {
      out = a.createGain();
      out.gain.value = 0.0001;
      out.connect(a.destination);
    }
    return a;
  }

  function hz(base, semis) {
    return base * Math.pow(2, semis / 12);
  }

  function note(t, freq, dur, type, gain) {
    const a = output();
    if (!a) return;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function drum(t, kind) {
    const a = output();
    if (!a) return;
    if (kind === 'k') {
      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.2);
      return;
    }
    const dur = kind === 's' ? 0.09 : 0.03;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const filter = a.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = kind === 's' ? 1400 : 6000;
    const g = a.createGain();
    g.gain.value = kind === 's' ? 0.085 : 0.026;
    src.connect(filter).connect(g).connect(out);
    src.start(t);
  }

  /* A pattern may be written once, or as an array with one entry per bar, so
     a tune can have real phrases instead of one looping bar. */
  function barOf(p, bar) {
    return Array.isArray(p) ? p[bar % p.length] : p;
  }

  function playStep(s, t) {
    if (!theme) return;
    const th = theme;
    const bar = Math.floor(s / 16) % th.chords.length;
    const rootFreq = hz(th.root, th.chords[bar]);
    const i = s % 16;

    /* Pad: the chord held under the bar, one swell per bar. */
    if (i === 0 && th.pad) {
      const barDur = 240 / th.bpm;
      for (const semi of th.pad) note(t, hz(rootFreq, semi), barDur * 0.95, th.padWave || 'sine', th.padGain || 0.016);
    }

    const bass = barOf(th.bass, bar);
    if (bass[i] === 'x') note(t, rootFreq / 2, 0.26, th.bassWave, th.bassGain || 0.09);

    const every = th.arpEvery || 2;
    if (i % every === 0) {
      const semi = th.arp[Math.floor(s / every) % th.arp.length];
      note(t, hz(rootFreq, semi), 0.22, th.arpWave, th.arpGain || 0.03);
    }

    const lead = barOf(th.lead, bar);
    const ch = lead[i];
    if (ch !== '.' && ch !== undefined) {
      const deg = Number(ch);
      if (Number.isFinite(deg)) {
        /* Degrees past the scale climb an octave instead of going silent. */
        const oct = Math.floor(deg / th.scale.length);
        note(t, hz(rootFreq, th.scale[deg % th.scale.length] + 12 + 12 * oct), 0.34, th.leadWave, th.leadGain || 0.05);
      }
    }

    const dr = barOf(th.drums, bar);
    const hit = dr[i];
    if (hit && hit !== '.') drum(t, hit);

    /* Phase two: the pulse doubles and the chord gains a fifth on top, so the
       player hears the fight get worse before the banner says so. */
    if (intensity) {
      if (i === 0) [0, 7, 12].forEach((semi) => choir(t, hz(rootFreq, semi), 240 / (th.bpm * (1 + 0.18)) * 0.92, 0.014));
      if (i % 2 === 0) drum(t, 'h');
      if (i === 6 || i === 14) drum(t, 'k');
      if (i % 4 === 0) note(t, hz(rootFreq, 19), 0.2, th.arpWave || 'square', 0.015);
    }
  }

  /* Fade the bus up once the browser actually lets us make sound. */
  /* A wordless choir under the second half: three slightly detuned voices
     opened through a lowpass, so it reads as voices rather than as the pad.
     Only the phase-two layer calls it. */
  function choir(t, freq, dur, gain) {
    const a = output();
    if (!a) return;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, t);
    filter.frequency.linearRampToValueAtTime(1650, t + Math.min(0.55, dur * 0.5));
    filter.Q.value = 0.6;
    const g = a.createGain();
    const peak = gain || 0.016;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.min(0.3, dur * 0.35));
    g.gain.linearRampToValueAtTime(peak * 0.72, t + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    filter.connect(g).connect(out);
    [1, 1.005, 0.996].forEach((k, i) => {
      const osc = a.createOscillator();
      osc.type = i === 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * k, t);
      osc.detune.value = (i - 1) * 8;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  /* The flip itself needs its own sound, not just a faster loop: a saw sweep
     rising over a pair of kicks, so the player knows the fight changed before
     the banner is even read. */
  function sting() {
    const a = output();
    if (!a || !theme || muted) return;
    const t = a.currentTime + 0.02;
    const rootFreq = hz(theme.root, (theme.chords && theme.chords[0]) || 0);
    const osc = a.createOscillator();
    const g = a.createGain();
    const filter = a.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(rootFreq, t);
    osc.frequency.exponentialRampToValueAtTime(rootFreq * 4, t + 0.44);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(560, t);
    filter.frequency.exponentialRampToValueAtTime(5600, t + 0.44);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    osc.connect(filter).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.68);
    drum(t, 'k');
    drum(t + 0.44, 'k');
  }

  function arm(a, fade) {
    if (!out) return;
    const t = a.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
    out.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.11, t + (fade || 0.9));
    armed = true;
  }

  function tick() {
    const a = output();
    if (!a || !theme) return;
    /* Autoplay rules keep the context asleep until the first tap. */
    if (a.state !== 'running') {
      nextTime = a.currentTime + 0.06;
      return;
    }
    if (!armed) {
      arm(a);
      step = 0;
      nextTime = a.currentTime + 0.08;
      return;
    }
    const stepDur = 60 / (theme.bpm * (1 + 0.18 * intensity)) / 4;
    if (nextTime < a.currentTime - 0.4) nextTime = a.currentTime + 0.06;
    while (nextTime < a.currentTime + 0.16) {
      if (!muted) playStep(step, nextTime);
      step += 1;
      nextTime += stepDur;
    }
  }

  function play(themeName) {
    const th = THEMES[themeName];
    if (!th) return;
    if (name === themeName && timer) return;
    theme = th;
    name = themeName;
    /* A fresh cue always starts calm; phase two re-arms it explicitly. */
    intensity = 0;
    step = 0;
    armed = false;
    muted = !!(SFX.isMuted && SFX.isMuted());
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 25);
    /* No context yet (before the first gesture) is not fatal: tick arms and
       starts the tune the moment audio becomes available. */
    const a = output();
    if (!a) return;
    nextTime = a.currentTime + 0.08;
    arm(a);
  }

  function stop(fade) {
    if (timer) { clearInterval(timer); timer = null; }
    name = '';
    theme = null;
    intensity = 0;
    armed = false;
    const a = output();
    if (!a || !out) return;
    out.gain.cancelScheduledValues(a.currentTime);
    out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), a.currentTime);
    out.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + (fade || 0.5));
  }

  function setMuted(v) {
    muted = !!v;
    const a = output();
    if (!a || !out) return;
    out.gain.cancelScheduledValues(a.currentTime);
    out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), a.currentTime);
    out.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.11, a.currentTime + 0.3);
  }

  /* Boss phase two, and back again when the fight ends. Restarting the loop
     makes the tempo change land immediately instead of on the next bar. */
  function setIntensity(on) {
    const next = on ? 1 : 0;
    if (next === intensity) return;
    if (next) sting();
    intensity = next;
    step = 0;
  }

  return {
    play,
    stop,
    setIntensity,
    setMuted,
    isPlaying: () => !!timer,
    current: () => name,
    names: Object.keys(THEMES),
  };
})();
