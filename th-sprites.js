/* ============================================================
   Treasure Hunt — pixel sprite data + helpers
   Everything attached to window.THS
   ============================================================ */
(function () {
  // ---- player palette ----
  const P = {
    '.': null,
    H: '#6b4322', // hat main
    h: '#4a2c14', // hair / hat shadow
    r: '#b5452f', // hat band (red)
    f: '#f1c693', // skin
    F: '#cf9a5f', // skin shadow
    e: '#241a12', // eye
    g: '#3f8a4a', // shirt
    G: '#2c6135', // shirt dark
    y: '#caa24a', // belt
    p: '#5a3a22', // pants
    o: '#2c1c10', // boot
    k: '#7a4a22', // backpack
  };

  const DOWN = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..rrrrrrrr..",
    "..hffffffh..",
    "..hffffffh..",
    "..ffeffeff..",
    "..ffffffff..",
    "...FFFFFF...",
    "..gggggggg..",
    ".gggggggggg.",
    ".fggggggggf.",
    "..gyyyyyyg..",
    "..pppppppp..",
    "..ppp..ppp..",
    "..oo....oo..",
  ];
  const DOWN_B = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..rrrrrrrr..",
    "..hffffffh..",
    "..hffffffh..",
    "..ffeffeff..",
    "..ffffffff..",
    "...FFFFFF...",
    "..gggggggg..",
    ".gggggggggg.",
    ".fggggggggf.",
    "..gyyyyyyg..",
    "..pppppppp..",
    "..pppppppp..",
    "...oo..oo...",
  ];

  const UP = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..rrrrrrrr..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "...hhhhhh...",
    "..gggggggg..",
    ".ggkkkkkkgg.",
    ".fgkkkkkkgf.",
    "..gkkkkkkg..",
    "..pppppppp..",
    "..ppp..ppp..",
    "..oo....oo..",
  ];
  const UP_B = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..rrrrrrrr..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "..hhhhhhhh..",
    "...hhhhhh...",
    "..gggggggg..",
    ".ggkkkkkkgg.",
    ".fgkkkkkkgf.",
    "..gkkkkkkg..",
    "..pppppppp..",
    "..pppppppp..",
    "...oo..oo...",
  ];

  const SIDE = [
    "....HHHH....",
    "...HHHHHHH..",
    "..HHHHHHHH..",
    "..rrrrrrr...",
    "..hhffff....",
    "..hhffffe...",
    "..hhffff....",
    "...FFFF.....",
    "..gggggg....",
    ".kgggggggf..",
    ".kgggggggf..",
    ".kgggggg....",
    "..pppppp....",
    "..pp..pp....",
    "..oo..oo....",
    "..oo..oo....",
  ];
  const SIDE_B = [
    "....HHHH....",
    "...HHHHHHH..",
    "..HHHHHHHH..",
    "..rrrrrrr...",
    "..hhffff....",
    "..hhffffe...",
    "..hhffff....",
    "...FFFF.....",
    "..gggggg....",
    ".kgggggggf..",
    ".kgggggggf..",
    ".kgggggg....",
    "..pppppp....",
    "...pppp.....",
    "..oo..oo....",
    "...oo.oo....",
  ];

  // shovel (held during dig) — drawn separately, simple
  const SHOVEL = {
    pal: { '.': null, w: '#9a6a33', W: '#6e4a22', m: '#c9d2d8', M: '#8e9aa2' },
    grid: [
      "..mm",
      ".mMM",
      "mMM.",
      "ww..",
      "WW..",
      "ww..",
      "WW..",
    ],
  };

  function drawSprite(ctx, grid, pal, dx, dy, px, flipX) {
    const w = grid[0].length;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c === '.' || c === ' ') continue;
        const col = pal[c];
        if (!col) continue;
        const sx = flipX ? (w - 1 - x) : x;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(dx + sx * px), Math.round(dy + y * px), px, px);
      }
    }
  }

  // Returns {grid, flip} for a direction + walk frame
  function playerFrame(dir, frame) {
    const b = frame === 1;
    switch (dir) {
      case 'up':    return { grid: b ? UP_B : UP, flip: false };
      case 'left':  return { grid: b ? SIDE_B : SIDE, flip: true };
      case 'right': return { grid: b ? SIDE_B : SIDE, flip: false };
      default:      return { grid: b ? DOWN_B : DOWN, flip: false };
    }
  }

  // ---- diamond sprite (collectible & HUD icon), 9x8 ----
  const DIA = {
    pal: { '.': null, w: '#ffffff', a: '#cdf4f9', b: '#7fe0ec', c: '#5fd3e0', d: '#2fa9bd' },
    grid: [
      "..bbbbb..",
      ".bawwwcb.",
      "baawwwccd",
      "aaawwcccd",
      "daaccccdd",
      ".dacccdd.",
      "..dccdd..",
      "...ddd...",
    ],
  };

  function drawDiamond(ctx, dx, dy, px) {
    drawSprite(ctx, DIA.grid, DIA.pal, dx, dy, px, false);
  }

  window.THS = {
    PLAYER_PAL: P,
    drawSprite,
    playerFrame,
    SHOVEL,
    DIA,
    drawDiamond,
    PW: DOWN[0].length,   // player sprite width in art px
    PH: DOWN.length,
  };
})();
