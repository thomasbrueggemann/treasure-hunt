/* ============================================================
   Treasure Hunt — main game (window.THG)
   Depends: THS (sprites), THW (world), THA (audio)
   ============================================================ */
(function () {
  const W = THW, S = THS, AU = THA;
  const TILE = W.TILE;

  // ---------- canvas / scaling ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let DPR = 1, zoom = 3, viewArtW = 0, viewArtH = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = Math.floor(cw * DPR);
    canvas.height = Math.floor(ch * DPR);
    ctx.imageSmoothingEnabled = false;
    const minDev = Math.min(canvas.width, canvas.height);
    // aim for ~13 tiles across the short edge; clamp zoom
    zoom = Math.max(2, Math.min(7, Math.round(minDev / (13 * TILE))));
    viewArtW = canvas.width / zoom;
    viewArtH = canvas.height / zoom;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- pre-render static world (filled after THW.generate in boot) ----------
  const worldCanvas = document.createElement('canvas');
  worldCanvas.width = W.W; worldCanvas.height = W.H;
  const wg = worldCanvas.getContext('2d');
  function buildWorldCanvas() {
    wg.clearRect(0, 0, W.W, W.H);
    W.paintTerrain(wg);
    W.paintLandmarks(wg);
  }

  // ---------- game state ----------
  const state = {
    px: 0, py: 0,
    seed: 0,
    dir: 'down', frame: 0, animT: 0,
    targetIndex: 0,        // landmark we're currently seeking
    diamonds: 0,
    diaDug: [],
    digging: 0,            // remaining dig anim time
    digResolved: false,
    digSpot: null,         // {kind, ...}
    paused: true,          // paused while a note/intro/win is up
    seenIntro: false,
    won: false,
  };
  const particles = [];
  const floats = [];

  // ---------- persistence ----------
  const KEY = 'th-save-v2';
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        seed: state.seed,
        px: state.px, py: state.py, targetIndex: state.targetIndex,
        diamonds: state.diamonds, diaDug: state.diaDug,
        seenIntro: state.seenIntro, won: state.won,
      }));
    } catch (e) {}
  }
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function resetSave() { try { localStorage.removeItem(KEY); } catch (e) {} }

  // ---------- input ----------
  const keys = {};
  const joy = { active: false, dx: 0, dy: 0 };
  let inputX = 0, inputY = 0;

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    AU.init(); AU.resume();
    if (e.key === ' ' || e.key === 'Enter') tryDig();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  function readKeyboard() {
    let x = 0, y = 0;
    if (keys['arrowleft'] || keys['a']) x -= 1;
    if (keys['arrowright'] || keys['d']) x += 1;
    if (keys['arrowup'] || keys['w']) y -= 1;
    if (keys['arrowdown'] || keys['s']) y += 1;
    return { x, y };
  }

  // joystick
  const joyEl = document.getElementById('joy');
  const knobEl = document.getElementById('joy-knob');
  const JOY_R = 62;
  function joyStart(e) {
    joy.active = true; joyEl.classList.add('on');
    AU.init(); AU.resume();
    joyMove(e);
  }
  function joyMove(e) {
    if (!joy.active) return;
    const rect = joyEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const p = e.touches ? e.touches[0] : e;
    let dx = p.clientX - cx, dy = p.clientY - cy;
    const d = Math.hypot(dx, dy) || 1;
    const cl = Math.min(d, JOY_R);
    dx = dx / d * cl; dy = dy / d * cl;
    knobEl.style.transform = `translate(${dx}px,${dy}px)`;
    joy.dx = dx / JOY_R; joy.dy = dy / JOY_R;
  }
  function joyEnd() {
    joy.active = false; joy.dx = 0; joy.dy = 0;
    joyEl.classList.remove('on');
    knobEl.style.transform = 'translate(0,0)';
  }
  joyEl.addEventListener('pointerdown', (e) => { joyEl.setPointerCapture(e.pointerId); joyStart(e); });
  joyEl.addEventListener('pointermove', joyMove);
  joyEl.addEventListener('pointerup', joyEnd);
  joyEl.addEventListener('pointercancel', joyEnd);

  const digBtn = document.getElementById('dig');
  digBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); AU.init(); AU.resume(); tryDig(); });

  // ---------- collision ----------
  function feetSolid(x, y) {
    const half = 4;
    const pts = [[x - half, y - 5], [x + half, y - 5], [x - half, y - 1], [x + half, y - 1]];
    for (const [ax, ay] of pts) {
      if (W.isSolid(Math.floor(ax / TILE), Math.floor(ay / TILE))) return true;
    }
    return false;
  }

  // ---------- dig ----------
  function digTileCenter(c, r) { return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; }

  function activeStorySpot() {
    if (state.targetIndex >= W.LM.length) return null;
    const lm = W.LM[state.targetIndex];
    const c = lm.dig[0], r = lm.dig[1];
    return { c, r, ...digTileCenter(c, r) };
  }
  function nearestDiaSpot() {
    let best = null, bd = 1e9;
    W.DIA_SPOTS.forEach((s, i) => {
      if (state.diaDug[i]) return;
      const ce = digTileCenter(s[0], s[1]);
      const d = Math.hypot(ce.x - state.px, ce.y - state.py);
      if (d < bd) { bd = d; best = { i, amount: s[2], ...ce }; }
    });
    return best ? { ...best, d: bd } : null;
  }

  const RANGE = 16;
  function tryDig() {
    if (state.paused || state.digging > 0) return;
    // story spot priority if in range
    const st = activeStorySpot();
    if (st) {
      const d = Math.hypot(st.x - state.px, st.y - state.py);
      if (d <= RANGE) { startDig({ kind: 'story' }); return; }
    }
    const di = nearestDiaSpot();
    if (di && di.d <= RANGE) { startDig({ kind: 'dia', i: di.i, amount: di.amount, x: di.x, y: di.y }); return; }
    // nothing here — small feedback
    flash("DIG AT AN X");
  }

  function startDig(spot) {
    state.digging = 0.5; state.digResolved = false; state.digSpot = spot;
    face(spot.kind === 'dia' ? { x: spot.x, y: spot.y } : activeStorySpot());
    AU.dig();
  }
  function face(target) {
    if (!target) return;
    const dx = target.x - state.px, dy = target.y - state.py;
    if (Math.abs(dx) > Math.abs(dy)) state.dir = dx < 0 ? 'left' : 'right';
    else state.dir = dy < 0 ? 'up' : 'down';
  }

  function resolveDig() {
    const sp = state.digSpot;
    if (!sp) return;
    if (sp.kind === 'story') {
      const found = state.targetIndex + 1;
      if (found >= W.LM.length) { win(); return; }
      state.targetIndex = found;
      AU.clue();
      const next = W.LM[found].name;
      showClue(next, found);
      save();
      sparkleBurst(activeStorySpotPrev(), '#e9d8a6');
    } else {
      state.diaDug[sp.i] = true;
      state.diamonds += sp.amount;
      AU.ding();
      sparkleBurst(sp, '#5fd3e0');
      floats.push({ x: sp.x, y: sp.y - 6, text: '+' + sp.amount, life: 1.0, color: '#bff3f8' });
      bumpCounter();
      updateHUD(); save();
    }
  }
  function activeStorySpotPrev() {
    // the spot we just dug (targetIndex was advanced, so use previous)
    const lm = W.LM[state.targetIndex - 1];
    return digTileCenter(lm.dig[0], lm.dig[1]);
  }

  // ---------- particles ----------
  function dustBurst(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = (Math.random() - 0.5) * Math.PI;
      const sp = 20 + Math.random() * 40;
      particles.push({ x, y, vx: Math.cos(a - Math.PI / 2) * sp, vy: -Math.random() * 50 - 10,
        life: 0.5 + Math.random() * 0.3, t: 0, color: Math.random() < 0.5 ? '#8a5a3b' : '#6b4226', sz: 1 + (Math.random() < 0.4 ? 1 : 0) });
    }
  }
  function sparkleBurst(p, color) {
    if (!p) return;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 25 + Math.random() * 55;
      particles.push({ x: p.x, y: p.y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
        life: 0.6 + Math.random() * 0.5, t: 0, color, sz: 1 + (Math.random() < 0.5 ? 1 : 0), spark: true });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.vx *= 0.96;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.life -= dt; f.y -= 14 * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
  }

  // ---------- update ----------
  const SPEED = 64;
  let lastStepT = 0;
  function update(dt) {
    if (state.digging > 0) {
      state.digging -= dt;
      if (!state.digResolved && state.digging <= 0.22) {
        state.digResolved = true;
        const sp = state.digSpot;
        const ce = sp && sp.kind === 'dia' ? sp : activeStorySpot();
        if (ce) dustBurst(ce.x, ce.y + 2);
      }
      if (state.digging <= 0) { state.digging = 0; resolveDig(); }
      updateParticles(dt);
      return;
    }
    if (state.paused) { updateParticles(dt); return; }

    const k = readKeyboard();
    let ix = k.x, iy = k.y;
    if (joy.active && (Math.abs(joy.dx) > 0.18 || Math.abs(joy.dy) > 0.18)) { ix = joy.dx; iy = joy.dy; }
    inputX = ix; inputY = iy;

    let len = Math.hypot(ix, iy);
    let moving = len > 0.05;
    if (moving) {
      const nx = ix / len, ny = iy / len;
      const mag = len > 1 ? 1 : len;
      let vx = nx * SPEED * mag, vy = ny * SPEED * mag;
      let cx = state.px + vx * dt;
      if (!feetSolid(cx, state.py)) state.px = cx;
      let cy = state.py + vy * dt;
      if (!feetSolid(state.px, cy)) state.py = cy;
      // facing
      if (Math.abs(vx) > Math.abs(vy)) state.dir = vx < 0 ? 'left' : 'right';
      else state.dir = vy < 0 ? 'up' : 'down';
      state.animT += dt;
      state.frame = Math.floor(state.animT / 0.14) % 2;
      if (performance.now() - lastStepT > 280) { AU.step(); lastStepT = performance.now(); }
    } else {
      state.frame = 0; state.animT = 0;
    }
    updateParticles(dt);
  }

  // ---------- render ----------
  let camX = 0, camY = 0;
  function w2sx(wx) { return Math.round((wx - camX) * zoom); }
  function w2sy(wy) { return Math.round((wy - camY) * zoom); }

  function render(now) {
    camX = Math.max(0, Math.min(W.W - viewArtW, state.px - viewArtW / 2));
    camY = Math.max(0, Math.min(W.H - viewArtH, state.py - viewArtH / 2));
    ctx.fillStyle = '#1a2a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(worldCanvas, camX, camY, viewArtW, viewArtH, 0, 0, canvas.width, canvas.height);

    drawXMarks(now);
    drawPlayer();
    drawParticles();
    drawFloats();
  }

  function drawXMarks(now) {
    // diamond spots
    W.DIA_SPOTS.forEach((s, i) => {
      if (state.diaDug[i]) return;
      const ce = digTileCenter(s[0], s[1]);
      drawX(ce.x, ce.y, 1, false, now);
    });
    // active story spot (pulsing)
    const st = activeStorySpot();
    if (st && !state.won) {
      const pulse = 1 + 0.18 * Math.sin(now / 220);
      // glow ring
      const sx = w2sx(st.x), sy = w2sy(st.y);
      ctx.save();
      ctx.globalAlpha = 0.22 + 0.12 * Math.sin(now / 220);
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.arc(sx, sy, 12 * zoom * 0.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawX(st.x, st.y, pulse, true, now);
    }
  }

  function drawX(wx, wy, scale, gold, now) {
    const sx = w2sx(wx), sy = w2sy(wy);
    const u = Math.max(1, Math.round(zoom * 0.9 * scale)); // pixel unit
    const dark = gold ? '#7a5a1a' : '#5b3a1d';
    const light = gold ? '#ffd766' : '#caa24a';
    // pixel diagonal blocks forming an X (5 steps each leg)
    const steps = [-2, -1, 0, 1, 2];
    ctx.fillStyle = dark;
    steps.forEach((d) => {
      ctx.fillRect(sx + d * u - u, sy + d * u, u + 1, u);       // back-slash shadow
      ctx.fillRect(sx + d * u - u, sy - d * u, u + 1, u);
    });
    ctx.fillStyle = light;
    steps.forEach((d) => {
      ctx.fillRect(sx + d * u - Math.floor(u / 2), sy + d * u - u, u, u); // main
      ctx.fillRect(sx + d * u - Math.floor(u / 2), sy - d * u - u, u, u);
    });
  }

  function drawPlayer() {
    const f = S.playerFrame(state.dir, state.frame);
    const bob = (state.frame === 1 && !state.digging) ? -1 : 0;
    let px = Math.round(state.px - (S.PW / 2)) ;
    let py = Math.round(state.py - S.PH + 1) + bob;
    // shadow
    const sx = w2sx(state.px), sy = w2sy(state.py);
    ctx.save();
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 6 * zoom, 2.4 * zoom, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // dig: small squash + shovel
    const ssx = (state.px - camX) * zoom, ssy = (state.py - camY) * zoom;
    if (state.digging > 0) {
      const prog = 1 - state.digging / 0.5; // 0..1
      const swing = Math.sin(prog * Math.PI); // up then down
      drawShovel(ssx, ssy, swing);
    }
    S.drawSprite(ctx, f.grid, S.PLAYER_PAL,
      (px - camX) * zoom, (py - camY) * zoom, zoom, f.flip);
  }

  function drawShovel(ssx, ssy, swing) {
    // position in front of player based on dir
    let ox = 0, oy = -6 * zoom, flip = false;
    if (state.dir === 'right') { ox = 7 * zoom; flip = false; }
    else if (state.dir === 'left') { ox = -10 * zoom; flip = true; }
    else if (state.dir === 'up') { ox = 4 * zoom; oy = -10 * zoom; }
    else { ox = 4 * zoom; oy = -2 * zoom; }
    const dy = (1 - swing) * 5 * zoom;
    S.drawSprite(ctx, S.SHOVEL.grid, S.SHOVEL.pal,
      ssx + ox, ssy + oy + dy, Math.max(1, Math.round(zoom * 0.9)), flip);
  }

  function drawParticles() {
    particles.forEach((p) => {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      const sx = w2sx(p.x), sy = w2sy(p.y);
      const s = p.sz * zoom;
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      if (p.spark && a > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, Math.max(1, zoom * 0.5), Math.max(1, zoom * 0.5));
      }
    });
    ctx.globalAlpha = 1;
  }
  function drawFloats() {
    floats.forEach((f) => {
      const sx = w2sx(f.x), sy = w2sy(f.y);
      ctx.font = `bold ${Math.round(7 * zoom)}px 'Andika', sans-serif`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, f.life * 1.6);
      ctx.fillStyle = '#10333a';
      ctx.fillText(f.text, sx + 1, sy + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, sx, sy);
      ctx.globalAlpha = 1;
    });
  }

  // ---------- HUD / overlays ----------
  const elDia = document.getElementById('hud-dia');
  const elStep = document.getElementById('hud-step');
  const elSeek = document.getElementById('seek-word');
  function updateHUD() {
    elDia.textContent = state.diamonds;
    const found = Math.min(state.targetIndex, W.LM.length);
    elStep.textContent = (found + (state.won ? 0 : 1)) + ' / ' + W.LM.length;
    if (state.won) { elStep.textContent = W.LM.length + ' / ' + W.LM.length; }
    elSeek.textContent = state.won ? 'DONE' : (W.LM[state.targetIndex] ? W.LM[state.targetIndex].name : '—');
  }
  function bumpCounter() {
    const c = document.getElementById('hud-dia-wrap');
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }

  // small transient toast (e.g. nothing here)
  let flashT = null;
  function flash(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(flashT);
    flashT = setTimeout(() => el.classList.remove('show'), 900);
  }

  // note (torn paper) overlay
  const noteEl = document.getElementById('note');
  function showNote(html, onClose) {
    noteEl.querySelector('#note-body').innerHTML = html;
    noteEl.classList.add('show');
    state.paused = true;
    const btn = noteEl.querySelector('#note-close');
    btn.onclick = () => {
      noteEl.classList.remove('show');
      state.paused = false;
      if (onClose) onClose();
    };
  }
  function showClue(word, foundCount) {
    showNote(
      `<div class="note-kicker">GO TO</div>
       <div class="note-word">${word}</div>
       <div class="note-sub"><span class="note-prog">${foundCount} / ${W.LM.length}</span></div>`,
      () => { updateHUD(); save(); }
    );
    updateHUD();
  }

  function intro() {
    showNote(
      `<div class="note-kicker">DIG AT THE X</div>
       <div class="note-sub" style="margin-bottom:6px">GO TO</div>
       <div class="note-word">${W.LM[0].name}</div>`,
      () => { state.seenIntro = true; save(); }
    );
    updateHUD();
  }

  function win() {
    state.won = true; state.paused = true; AU.fanfare();
    updateHUD(); save();
    // sparkle storm at player
    for (let k = 0; k < 60; k++) {
      setTimeout(() => sparkleBurst({ x: state.px, y: state.py - 4 }, k % 2 ? '#5fd3e0' : '#ffd766'), k * 16);
    }
    const winEl = document.getElementById('win');
    winEl.querySelector('#win-count').textContent = state.diamonds;
    winEl.classList.add('show');
    winEl.querySelector('#win-replay').onclick = () => {
      resetSave();
      location.reload();
    };
  }

  // mute
  const muteBtn = document.getElementById('mute');
  muteBtn.addEventListener('click', () => {
    const m = !AU.muted; AU.init(); AU.setMuted(m);
    muteBtn.classList.toggle('off', m);
    muteBtn.textContent = m ? '♪̸' : '♪';
  });

  // ---------- boot ----------
  (function boot() {
    const s = loadSave();
    if (s && Number.isFinite(s.seed)) {
      // resume the SAME run
      state.seed = s.seed >>> 0;
      W.generate(state.seed);
      state.diaDug = W.DIA_SPOTS.map((_, i) => (s.diaDug && s.diaDug[i]) || false);
      state.targetIndex = s.targetIndex || 0;
      state.diamonds = s.diamonds || 0;
      state.seenIntro = !!s.seenIntro;
      state.won = !!s.won;
      state.px = (typeof s.px === 'number') ? s.px : W.START.x;
      state.py = (typeof s.py === 'number') ? s.py : W.START.y;
    } else {
      // brand new run
      state.seed = (Math.random() * 0xFFFFFFFF) >>> 0;
      W.generate(state.seed);
      state.diaDug = W.DIA_SPOTS.map(() => false);
      state.px = W.START.x; state.py = W.START.y;
      save();
    }
    buildWorldCanvas();
  })();

  updateHUD();
  if (state.won) {
    state.paused = true;
    const winEl = document.getElementById('win');
    winEl.querySelector('#win-count').textContent = state.diamonds;
    winEl.classList.add('show');
    winEl.querySelector('#win-replay').onclick = () => { resetSave(); location.reload(); };
  } else if (!state.seenIntro) {
    intro();
  } else {
    state.paused = false;
  }

  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    render(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // expose for debugging
  window.THG = { state };
})();
