/* ============================================================
   Treasure Hunt — LANDMARK CATALOGUE  (window.THL)
   Each entry: { id, name, draw(g, c, r) }
   draw is anchored at the tile's bottom-centre ground point.
   Words are kept short & concrete for a beginning reader.
   ============================================================ */
(function () {
  let _g = null;
  function R(col, X, Y, w, h) { _g.fillStyle = col; _g.fillRect(Math.round(X), Math.round(Y), w, h); }
  // wrap a (x,y)=>{} painter into a (g,c,r) landmark draw fn
  function L(fn) { return function (g, c, r) { _g = g; fn(c * 16 + 8, r * 16 + 16); }; }

  // palette
  const C = {
    grn1: '#3f8a4a', grn2: '#2f6b35', grn3: '#56a85e', grn4: '#6fbf73',
    trunk: '#5b3a1d', trunkD: '#46300f', wood: '#7c5226', woodL: '#9a6a33', woodD: '#46300f',
    gray: '#9aa3a8', grayL: '#b6bdc1', grayD: '#6e767b', grayDD: '#5f676c',
    stone: '#8a8276', stoneL: '#a39a8b', stoneD: '#6f685d',
    water: '#5fd3e0', waterD: '#3aa7b8', waterL: '#7ee2ec',
    red: '#b5452f', redD: '#9a3b2c',
    gold: '#caa24a', goldL: '#e6c463', goldD: '#9a7a2e',
    cloth: '#e7e0cf', clothD: '#cfc7b2', wall: '#cbb089',
    clay: '#c1734a', clayD: '#9c5634',
    orange: '#e08a2c', orangeD: '#b5651f',
    dark: '#2a2118', win: '#3a4756',
  };

  const CAT = [
    { id: 'tree', name: 'TREE', draw: L((x, y) => {
      R(C.trunk, x - 3, y - 14, 6, 14); R(C.trunkD, x - 3, y - 5, 2, 5);
      R(C.grn2, x - 13, y - 30, 26, 20); R(C.grn1, x - 9, y - 34, 20, 18);
      R(C.grn3, x - 4, y - 35, 11, 11); R(C.grn4, x - 1, y - 33, 5, 5);
    }) },
    { id: 'pine', name: 'PINE', draw: L((x, y) => {
      R(C.trunk, x - 2, y - 8, 4, 8);
      R(C.grn2, x - 11, y - 14, 22, 8); R(C.grn1, x - 8, y - 22, 16, 10);
      R(C.grn2, x - 6, y - 30, 12, 10); R(C.grn3, x - 3, y - 30, 4, 8);
    }) },
    { id: 'palm', name: 'PALM', draw: L((x, y) => {
      R(C.woodL, x - 2, y - 24, 4, 24); R(C.trunkD, x - 2, y - 12, 4, 2); R(C.trunkD, x - 2, y - 19, 4, 2);
      R(C.grn1, x - 15, y - 27, 13, 4); R(C.grn1, x + 2, y - 27, 13, 4);
      R(C.grn2, x - 11, y - 31, 9, 5); R(C.grn2, x + 2, y - 31, 9, 5);
      R(C.gold, x - 3, y - 26, 3, 3); R(C.gold, x + 1, y - 26, 3, 3);
    }) },
    { id: 'bush', name: 'BUSH', draw: L((x, y) => {
      R(C.grn2, x - 11, y - 12, 22, 12); R(C.grn1, x - 8, y - 16, 16, 11);
      R(C.grn3, x - 4, y - 16, 8, 6); R(C.grn4, x + 2, y - 12, 4, 3);
    }) },
    { id: 'rock', name: 'ROCK', draw: L((x, y) => {
      R(C.grayDD, x - 12, y - 12, 24, 12); R(C.gray, x - 9, y - 17, 19, 13);
      R(C.grayL, x - 5, y - 19, 11, 8); R(C.grayD, x + 4, y - 12, 6, 8);
    }) },
    { id: 'stone', name: 'STONE', draw: L((x, y) => {
      R(C.grayDD, x - 7, y - 7, 14, 7); R(C.gray, x - 5, y - 11, 11, 8);
      R(C.grayL, x - 2, y - 12, 5, 4);
    }) },
    { id: 'log', name: 'LOG', draw: L((x, y) => {
      R(C.trunkD, x - 13, y - 9, 26, 9); R(C.wood, x - 13, y - 9, 26, 3);
      R(C.woodL, x - 13, y - 8, 4, 7); R(C.trunkD, x - 12, y - 6, 2, 2);
      R(C.woodL, x + 9, y - 8, 4, 7);
    }) },
    { id: 'stump', name: 'STUMP', draw: L((x, y) => {
      R(C.trunk, x - 7, y - 11, 14, 11); R(C.woodL, x - 7, y - 13, 14, 4);
      R(C.trunkD, x - 3, y - 12, 6, 2);
    }) },
    { id: 'pond', name: 'POND', draw: L((x, y) => {
      R(C.grn2, x - 13, y - 7, 26, 9); R(C.water, x - 11, y - 6, 22, 6);
      R(C.waterD, x - 11, y - 3, 22, 2); R(C.waterL, x - 7, y - 5, 9, 2);
    }) },
    { id: 'well', name: 'WELL', draw: L((x, y) => {
      R(C.stone, x - 9, y - 8, 18, 8); R(C.stoneL, x - 9, y - 8, 18, 2);
      R(C.waterD, x - 5, y - 5, 10, 4); R(C.water, x - 5, y - 5, 10, 1);
      R(C.trunk, x - 7, y - 26, 3, 18); R(C.trunk, x + 4, y - 26, 3, 18);
      R(C.red, x - 11, y - 30, 22, 5); R(C.redD, x - 11, y - 26, 22, 2);
    }) },
    { id: 'tower', name: 'TOWER', draw: L((x, y) => {
      R(C.stone, x - 8, y - 38, 16, 38); R(C.stoneL, x - 8, y - 38, 5, 38); R(C.stoneD, x + 3, y - 38, 5, 38);
      R(C.stone, x - 10, y - 45, 5, 7); R(C.stone, x - 2, y - 45, 4, 7); R(C.stone, x + 5, y - 45, 5, 7);
      R(C.win, x - 3, y - 28, 6, 8); R(C.win, x - 3, y - 13, 6, 13);
    }) },
    { id: 'gate', name: 'GATE', draw: L((x, y) => {
      R(C.stone, x - 14, y - 30, 7, 30); R(C.stone, x + 7, y - 30, 7, 30);
      R(C.stoneL, x - 14, y - 30, 2, 30); R(C.stoneL, x + 7, y - 30, 2, 30);
      R(C.stoneD, x - 14, y - 34, 28, 6); R(C.stone, x - 16, y - 38, 32, 5);
    }) },
    { id: 'bridge', name: 'BRIDGE', draw: L((x, y) => {
      R(C.woodD, x - 14, y - 12, 3, 12); R(C.woodD, x + 11, y - 12, 3, 12);
      R(C.wood, x - 14, y - 14, 28, 5); R(C.woodL, x - 14, y - 17, 28, 3);
      R(C.woodD, x - 8, y - 12, 2, 12); R(C.woodD, x + 6, y - 12, 2, 12);
    }) },
    { id: 'house', name: 'HOUSE', draw: L((x, y) => {
      R(C.wall, x - 11, y - 20, 22, 20); R(C.clayD, x - 11, y - 20, 22, 2);
      R(C.red, x - 14, y - 27, 28, 8); R(C.redD, x - 14, y - 22, 28, 2);
      R(C.trunkD, x - 3, y - 11, 7, 11); R(C.win, x - 9, y - 16, 5, 5); R(C.win, x + 5, y - 16, 5, 5);
    }) },
    { id: 'hut', name: 'HUT', draw: L((x, y) => {
      R(C.wall, x - 10, y - 15, 20, 15); R(C.clayD, x - 10, y - 6, 20, 2);
      R(C.woodL, x - 12, y - 19, 24, 5); R(C.wood, x - 9, y - 24, 18, 6); R(C.woodL, x - 4, y - 28, 8, 5);
      R(C.trunkD, x - 3, y - 9, 6, 9);
    }) },
    { id: 'tent', name: 'TENT', draw: L((x, y) => {
      R(C.redD, x - 13, y - 9, 26, 9); R(C.red, x - 9, y - 17, 18, 9); R(C.red, x - 5, y - 25, 10, 9);
      R(C.trunk, x - 1, y - 28, 2, 4); R(C.redD, x - 2, y - 9, 4, 9); R(C.goldL, x - 1, y - 27, 2, 2);
    }) },
    { id: 'fence', name: 'FENCE', draw: L((x, y) => {
      R(C.woodL, x - 13, y - 13, 3, 13); R(C.woodL, x - 2, y - 13, 3, 13); R(C.woodL, x + 9, y - 13, 3, 13);
      R(C.wood, x - 13, y - 11, 25, 2); R(C.wood, x - 13, y - 6, 25, 2);
    }) },
    { id: 'sign', name: 'SIGN', draw: L((x, y) => {
      R(C.trunk, x - 1, y - 17, 3, 17); R(C.woodL, x - 10, y - 24, 20, 10); R(C.woodD, x - 10, y - 24, 20, 2);
      R(C.trunkD, x - 6, y - 20, 12, 1); R(C.trunkD, x - 6, y - 17, 9, 1);
    }) },
    { id: 'flag', name: 'FLAG', draw: L((x, y) => {
      R(C.stone, x - 7, y - 3, 16, 5); R(C.trunk, x - 1, y - 36, 3, 33); R(C.gold, x - 2, y - 38, 5, 4);
      R(C.red, x + 2, y - 36, 18, 13); R(C.redD, x + 2, y - 25, 18, 2);
      R(C.cloth, x + 8, y - 33, 6, 6); R(C.gold, x + 9, y - 32, 4, 4);
    }) },
    { id: 'lamp', name: 'LAMP', draw: L((x, y) => {
      R(C.grayD, x - 4, y - 2, 8, 2); R(C.grayD, x - 1, y - 30, 3, 28);
      R(C.dark, x - 5, y - 34, 10, 6); R(C.goldL, x - 3, y - 33, 6, 5); R(C.gold, x - 4, y - 35, 8, 2);
    }) },
    { id: 'chest', name: 'CHEST', draw: L((x, y) => {
      R(C.wood, x - 10, y - 12, 20, 12); R(C.woodL, x - 10, y - 19, 20, 8); R(C.woodD, x - 10, y - 12, 20, 2);
      R(C.woodD, x - 7, y - 19, 2, 19); R(C.woodD, x + 5, y - 19, 2, 19);
      R(C.gold, x - 2, y - 15, 4, 6); R(C.goldL, x - 2, y - 15, 4, 2);
    }) },
    { id: 'barrel', name: 'BARREL', draw: L((x, y) => {
      R(C.woodD, x - 9, y - 16, 18, 16); R(C.woodL, x - 7, y - 16, 14, 16);
      R(C.wood, x - 9, y - 16, 18, 2); R(C.woodD, x - 9, y - 11, 18, 2); R(C.woodD, x - 9, y - 5, 18, 2);
    }) },
    { id: 'box', name: 'BOX', draw: L((x, y) => {
      R(C.woodL, x - 9, y - 18, 18, 18); R(C.woodD, x - 9, y - 18, 18, 2); R(C.woodD, x - 9, y - 2, 18, 2);
      R(C.woodD, x - 9, y - 18, 2, 18); R(C.woodD, x + 7, y - 18, 2, 18); R(C.wood, x - 9, y - 10, 18, 2);
    }) },
    { id: 'pot', name: 'POT', draw: L((x, y) => {
      R(C.clayD, x - 9, y - 16, 18, 4); R(C.clay, x - 8, y - 13, 16, 13); R(C.clayD, x - 8, y - 3, 16, 3);
      R(C.cloth, x - 5, y - 12, 4, 2);
    }) },
    { id: 'cart', name: 'CART', draw: L((x, y) => {
      R(C.wood, x - 11, y - 16, 22, 8); R(C.woodD, x - 11, y - 10, 22, 2); R(C.woodL, x - 11, y - 16, 22, 2);
      R(C.trunkD, x - 9, y - 8, 8, 8); R(C.woodL, x - 6, y - 5, 3, 3);
      R(C.trunkD, x + 1, y - 8, 8, 8); R(C.woodL, x + 4, y - 5, 3, 3);
    }) },
    { id: 'boat', name: 'BOAT', draw: L((x, y) => {
      R(C.wood, x - 12, y - 9, 24, 6); R(C.woodD, x - 12, y - 4, 24, 4);
      R(C.trunkD, x - 9, y - 11, 18, 3); R(C.woodL, x - 1, y - 18, 2, 8); R(C.cloth, x + 1, y - 18, 8, 7);
    }) },
    { id: 'ship', name: 'SHIP', draw: L((x, y) => {
      R(C.wood, x - 16, y - 10, 34, 12); R(C.trunkD, x - 16, y - 2, 34, 4); R(C.woodL, x - 13, y - 13, 28, 5);
      R(C.trunkD, x - 1, y - 36, 4, 26); R(C.cloth, x + 3, y - 34, 14, 16); R(C.clothD, x + 3, y - 34, 14, 2);
      R(C.red, x - 1, y - 38, 7, 3);
    }) },
    { id: 'bell', name: 'BELL', draw: L((x, y) => {
      R(C.gold, x - 1, y - 18, 2, 3); R(C.gold, x - 7, y - 16, 14, 12); R(C.goldL, x - 7, y - 16, 4, 12);
      R(C.gold, x - 9, y - 5, 18, 3); R(C.goldD, x - 9, y - 3, 18, 2); R(C.dark, x - 1, y - 2, 2, 3);
    }) },
    { id: 'drum', name: 'DRUM', draw: L((x, y) => {
      R(C.cloth, x - 9, y - 16, 18, 4); R(C.red, x - 9, y - 13, 18, 11); R(C.redD, x - 9, y - 4, 18, 2);
      R(C.gold, x - 9, y - 10, 18, 2); R(C.clothD, x - 9, y - 13, 18, 1);
    }) },
    { id: 'pumpkin', name: 'PUMPKIN', draw: L((x, y) => {
      R(C.orangeD, x - 10, y - 14, 20, 14); R(C.orange, x - 8, y - 14, 16, 14);
      R(C.orangeD, x - 4, y - 14, 2, 14); R(C.orangeD, x + 3, y - 14, 2, 14);
      R(C.grn2, x - 1, y - 17, 3, 4);
    }) },
    { id: 'nest', name: 'NEST', draw: L((x, y) => {
      R(C.trunkD, x - 9, y - 7, 18, 7); R(C.woodL, x - 9, y - 9, 18, 3);
      R(C.cloth, x - 5, y - 11, 4, 4); R(C.cloth, x + 1, y - 11, 4, 4); R(C.clothD, x - 5, y - 8, 10, 1);
    }) },
    { id: 'crystal', name: 'CRYSTAL', draw: L((x, y) => {
      R(C.waterD, x - 7, y - 13, 6, 13); R(C.water, x - 6, y - 12, 3, 11);
      R(C.waterD, x + 2, y - 11, 6, 11); R(C.water, x + 3, y - 10, 3, 9);
      R(C.waterL, x - 2, y - 19, 5, 19); R(C.cloth, x - 1, y - 18, 2, 5);
    }) },
    { id: 'mushroom', name: 'MUSHROOM', draw: L((x, y) => {
      R(C.cloth, x - 3, y - 10, 6, 10); R(C.clothD, x - 3, y - 4, 6, 1);
      R(C.red, x - 9, y - 17, 18, 8); R(C.redD, x - 9, y - 11, 18, 2);
      R(C.cloth, x - 5, y - 15, 3, 3); R(C.cloth, x + 3, y - 14, 3, 3);
    }) },
    { id: 'cactus', name: 'CACTUS', draw: L((x, y) => {
      R(C.grn2, x - 3, y - 22, 6, 22); R(C.grn3, x - 2, y - 21, 2, 20);
      R(C.grn2, x - 9, y - 16, 6, 3); R(C.grn2, x - 9, y - 16, 3, 9);
      R(C.grn2, x + 3, y - 13, 6, 3); R(C.grn2, x + 6, y - 13, 3, 8);
    }) },
    { id: 'anchor', name: 'ANCHOR', draw: L((x, y) => {
      R(C.grayD, x - 2, y - 22, 4, 3); R(C.gray, x - 1, y - 20, 2, 16); R(C.gray, x - 6, y - 16, 12, 2);
      R(C.gray, x - 9, y - 6, 18, 2); R(C.gray, x - 9, y - 8, 3, 3); R(C.gray, x + 6, y - 8, 3, 3);
    }) },
  ];

  window.THL = { CAT };
})();
