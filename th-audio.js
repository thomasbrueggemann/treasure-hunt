/* ============================================================
   Treasure Hunt — tiny WebAudio SFX engine. window.THA
   ============================================================ */
(function () {
  let ctx = null, master = null, muted = false;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function env(node, t, a, d, peak) {
    const g = node;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(freq, t, dur, type, peak, slideTo) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, 0.01, dur, peak == null ? 0.3 : peak);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(t, dur, peak, lp) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 800;
    const g = ctx.createGain(); env(g, t, 0.005, dur, peak || 0.4);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  const A = {
    init, resume,
    get muted() { return muted; },
    setMuted(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.5; },
    dig() { if (!ctx || muted) return; const t = ctx.currentTime; noise(t, 0.18, 0.5, 600); tone(120, t, 0.12, 'square', 0.18, 70); },
    step() { if (!ctx || muted) return; const t = ctx.currentTime; noise(t, 0.05, 0.08, 1200); },
    ding() { if (!ctx || muted) return; const t = ctx.currentTime; tone(880, t, 0.09, 'square', 0.25); tone(1320, t + 0.08, 0.14, 'square', 0.22); },
    clue() { if (!ctx || muted) return; const t = ctx.currentTime; noise(t, 0.22, 0.25, 2500); tone(660, t + 0.02, 0.1, 'triangle', 0.12); },
    fanfare() {
      if (!ctx || muted) return; const t = ctx.currentTime;
      const seq = [523, 659, 784, 1047, 1319];
      seq.forEach((f, i) => tone(f, t + i * 0.12, 0.18, 'square', 0.28));
      tone(1568, t + seq.length * 0.12, 0.5, 'square', 0.3);
      tone(784, t + seq.length * 0.12, 0.5, 'triangle', 0.18);
    },
  };
  window.THA = A;
})();
