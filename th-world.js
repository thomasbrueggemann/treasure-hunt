/* ============================================================
   Treasure Hunt — seeded world generation. window.THW
   generate(seed) builds terrain + picks 10 random landmarks
   from THL.CAT, places them reachably, scatters diamond spots.
   Same seed => identical world (so a refresh resumes a run).
   ============================================================ */
(function () {
  const TILE = 16;
  const COLS = 50, ROWS = 50;
  const W = COLS * TILE, H = ROWS * TILE;
  const idx = (c, r) => r * COLS + c;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // tile types: 0 grass, 1 water, 2 sand
  const tiles = new Uint8Array(COLS * ROWS);
  const shade = new Uint8Array(COLS * ROWS);
  const solid = new Uint8Array(COLS * ROWS);

  // runtime run data
  let LM = [];            // chosen 10 landmarks {id,name,draw,c,r,dig:[c,r]}
  let DIA_SPOTS = [];     // [c,r,amount]
  let START = { x: 0, y: 0 };

  const COL = {
    grass: ['#3a7d44', '#3f8549', '#347040', '#8ec16a'],
    water: ['#5fd3e0', '#4ec3d4', '#7ee2ec'],
    sand:  ['#e9d8a6', '#efe1b6', '#ddc890'],
  };

  function inBounds(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }
  function isSolid(c, r) { return inBounds(c, r) ? solid[idx(c, r)] === 1 : true; }
  function tileAt(c, r) { return inBounds(c, r) ? tiles[idx(c, r)] : -1; }
  function setSolid(c, r, v) { if (inBounds(c, r)) solid[idx(c, r)] = v; }

  function blob(rng, type, cx, cy, rad, solidify) {
    for (let r = cy - rad; r <= cy + rad; r++)
      for (let c = cx - rad; c <= cx + rad; c++) {
        if (!inBounds(c, r)) continue;
        const d = Math.hypot(c - cx, r - cy) + (rng() - 0.5) * 1.2;
        if (d <= rad) { tiles[idx(c, r)] = type; if (solidify) solid[idx(c, r)] = 1; }
      }
  }

  function generate(seed) {
    const rng = mulberry32(seed >>> 0);
    tiles.fill(0); shade.fill(0); solid.fill(0);
    LM = []; DIA_SPOTS = [];

    // base grass + texture variation
    for (let i = 0; i < tiles.length; i++) {
      const rv = rng();
      shade[i] = rv < 0.12 ? 2 : (rv < 0.5 ? 1 : 0);
    }
    // sand patches (walkable) + ponds (water, solid, small so map stays connected)
    const nSand = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < nSand; i++)
      blob(rng, 2, 4 + Math.floor(rng() * (COLS - 8)), 4 + Math.floor(rng() * (ROWS - 8)), 3 + Math.floor(rng() * 3), false);
    const nPond = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < nPond; i++)
      blob(rng, 1, 5 + Math.floor(rng() * (COLS - 10)), 5 + Math.floor(rng() * (ROWS - 10)), 2 + Math.floor(rng() * 2), true);

    // border solid
    for (let c = 0; c < COLS; c++) { setSolid(c, 0, 1); setSolid(c, ROWS - 1, 1); }
    for (let r = 0; r < ROWS; r++) { setSolid(0, r, 1); setSolid(COLS - 1, r, 1); }

    // start tile: an open spot near the middle
    let sc = COLS >> 1, sr = ROWS >> 1, tries = 0;
    while (isSolid(sc, sr) && tries++ < 500) { sc = 4 + Math.floor(rng() * (COLS - 8)); sr = 4 + Math.floor(rng() * (ROWS - 8)); }
    START = { x: sc * TILE + 8, y: sr * TILE + 8 };

    // reachable set from start (over terrain solids only — before landmarks)
    const reach = new Uint8Array(COLS * ROWS);
    const q = [[sc, sr]]; reach[idx(sc, sr)] = 1;
    while (q.length) {
      const [c, r] = q.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dr]) => {
        const nc = c + dc, nr = r + dr;
        if (inBounds(nc, nr) && !reach[idx(nc, nr)] && solid[idx(nc, nr)] === 0) {
          reach[idx(nc, nr)] = 1; q.push([nc, nr]);
        }
      });
    }
    const reachable = (c, r) => inBounds(c, r) && reach[idx(c, r)] === 1;

    // shuffle catalogue, take 10 (Fisher-Yates with seeded rng)
    const cat = window.THL.CAT.slice();
    for (let i = cat.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cat[i], cat[j]] = [cat[j], cat[i]]; }
    const chosen = cat.slice(0, 10);

    const used = new Set();
    const mark = (c, r) => used.add(c + ',' + r);
    const isUsed = (c, r) => used.has(c + ',' + r);
    used.add(sc + ',' + sr); used.add((sc) + ',' + (sr - 1));

    function farEnough(c, r, min) {
      if (Math.hypot(c - sc, r - sr) < 4) return false;
      for (const l of LM) if (Math.hypot(c - l.c, r - l.r) < min) return false;
      return true;
    }
    function digNeighbor(c, r) {
      // prefer a tile in front (south) then others, must be walkable+reachable+free
      const order = [[0, 1], [0, 2], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1]];
      for (const [dc, dr] of order) {
        const nc = c + dc, nr = r + dr;
        if (reachable(nc, nr) && tileAt(nc, nr) !== 1 && !isUsed(nc, nr)) return [nc, nr];
      }
      return null;
    }

    chosen.forEach((item) => {
      let placed = false;
      for (let minD = 7; minD >= 3 && !placed; minD--) {
        for (let a = 0; a < 300 && !placed; a++) {
          const c = 3 + Math.floor(rng() * (COLS - 6));
          const r = 3 + Math.floor(rng() * (ROWS - 6));
          if (tileAt(c, r) === 1) continue;          // not on water
          if (!reachable(c, r)) continue;            // anchor reachable
          if (isUsed(c, r)) continue;
          if (!farEnough(c, r, minD)) continue;
          const dig = digNeighbor(c, r);
          if (!dig) continue;
          LM.push({ id: item.id, name: item.name, draw: item.draw, c, r, dig });
          mark(c, r); mark(c, r - 1); mark(dig[0], dig[1]);
          setSolid(c, r, 1); setSolid(c, r - 1, 1);   // footprint blocks walking through
          setSolid(dig[0], dig[1], 0);                 // keep dig tile open
          placed = true;
        }
      }
    });

    // diamond dig spots (scattered, walkable, away from landmarks)
    const nDia = 9 + Math.floor(rng() * 3);
    let guard = 0;
    while (DIA_SPOTS.length < nDia && guard++ < 4000) {
      const c = 3 + Math.floor(rng() * (COLS - 6));
      const r = 3 + Math.floor(rng() * (ROWS - 6));
      if (!reachable(c, r) || tileAt(c, r) === 1 || isUsed(c, r)) continue;
      let ok = true;
      for (const l of LM) if (Math.hypot(c - l.c, r - l.r) < 3) { ok = false; break; }
      if (!ok) continue;
      mark(c, r);
      DIA_SPOTS.push([c, r, 1 + Math.floor(rng() * 3)]);
    }
  }

  // ---------- painting ----------
  function paintTerrain(g) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const t = tiles[idx(c, r)], s = shade[idx(c, r)], x = c * TILE, y = r * TILE;
        if (t === 0) {
          g.fillStyle = s === 1 ? COL.grass[1] : COL.grass[0];
          g.fillRect(x, y, TILE, TILE);
          if (s === 2) { g.fillStyle = COL.grass[3]; g.fillRect(x + 4, y + 5, 3, 2); g.fillRect(x + 9, y + 10, 2, 2); }
          else if ((c + r) % 7 === 0) { g.fillStyle = COL.grass[2]; g.fillRect(x + 6, y + 8, 4, 2); }
        } else if (t === 1) {
          g.fillStyle = COL.water[0]; g.fillRect(x, y, TILE, TILE);
          g.fillStyle = COL.water[1]; g.fillRect(x, y + ((c + r) % 2 ? 4 : 10), TILE, 3);
          if (s === 2) { g.fillStyle = COL.water[2]; g.fillRect(x + 5, y + 2, 4, 2); }
        } else if (t === 2) {
          g.fillStyle = s === 1 ? COL.sand[1] : COL.sand[0]; g.fillRect(x, y, TILE, TILE);
          if (s === 2) { g.fillStyle = COL.sand[2]; g.fillRect(x + 5, y + 7, 3, 2); g.fillRect(x + 10, y + 3, 2, 2); }
        }
      }
  }
  function paintLandmarks(g) {
    [...LM].sort((a, b) => a.r - b.r).forEach((l) => l.draw(g, l.c, l.r));
  }

  window.THW = {
    TILE, COLS, ROWS, W, H,
    generate, paintTerrain, paintLandmarks,
    isSolid, tileAt,
    get LM() { return LM; },
    get DIA_SPOTS() { return DIA_SPOTS; },
    get START() { return START; },
  };
})();
