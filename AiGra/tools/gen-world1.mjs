/* Regenerates the world 1 (Egg World) map: campfire start at the bottom,
   20 main battles, 10 side battles, a 3-level cave and a 5-level cave,
   each cave ending in a relic vault, and the boss tower at the top.
   Writes directly into js/data.js between stable anchors. */
import fs from 'node:fs';

const FILE = 'js/data.js';
let src = fs.readFileSync(FILE, 'utf8');

const MAIN = ['e1','e2','e4','e5','e6','e7','e9','e10','e12','e13','e14','e15','e16','e17','e26','e27','e28','e29','e30','e19'];
const GATE = 'e18';
const SIDE_L = ['e40','e41','e42','e43','e44'];
const SIDE_R = ['e45','e46','e47','e48','e49'];
const CAVE_A = ['e50','e51','e52'];
const CAVE_B = ['e54','e55','e56','e57','e58'];
const SHOP_A = 'e53';
const SHOP_B = 'e59';
const SHOP = 'e3', CRAFT = 'e8', BASE = 'e11';

const H = 2600;
const nodes = [];
const edges = [];
const put = (id, type, x, y, extra = {}) => {
  nodes.push({ id, type, x: Math.round(x), y: Math.round(y), ...extra });
};

/* ---- main route: gentle serpentine from the campfire to the tower ---- */
const BOSS = 'e19';
const mainBattles = MAIN.filter((id) => id !== BOSS);
const mainPts = [];
for (let i = 0; i < mainBattles.length; i++) {
  const t = i / (mainBattles.length - 1);      // 0 bottom → 1 top
  const y = 2400 - t * (2400 - 420);           // 2400 → 420
  const x = 350 + Math.sin(i * 1.15) * 175;    // 175 → 525
  mainPts.push([x, y]);
}
mainBattles.forEach((id, i) => put(id, 'battle', mainPts[i][0], mainPts[i][1]));
for (let i = 0; i < mainBattles.length - 1; i++) edges.push([mainBattles[i], mainBattles[i + 1]]);

/* gate between the last battle and the boss tower */
put(GATE, 'gate', 190, 300);
put(BOSS, 'battle', 350, 150);
edges.push([mainBattles[mainBattles.length - 1], GATE], [GATE, BOSS]);

/* ---- side route A: left of the main road, branches and rejoins ---- */
const aFrom = 4, aTo = 9;
for (let i = 0; i < SIDE_L.length; i++) {
  const t = (i + 1) / (SIDE_L.length + 1);
  const y = mainPts[aFrom][1] + (mainPts[aTo][1] - mainPts[aFrom][1]) * t;
  put(SIDE_L[i], 'battle', 96 + i * 5, y);
}
edges.push([MAIN[aFrom], SIDE_L[0]], [SIDE_L[4], MAIN[aTo]]);
SIDE_L.slice(0, -1).forEach((id, i) => edges.push([id, SIDE_L[i + 1]]));

/* ---- side route B: right of the main road ---- */
const bFrom = 10, bTo = 15;
for (let i = 0; i < SIDE_R.length; i++) {
  const t = (i + 1) / (SIDE_R.length + 1);
  const y = mainPts[bFrom][1] + (mainPts[bTo][1] - mainPts[bFrom][1]) * t;
  put(SIDE_R[i], 'battle', 618 - i * 5, y);
}
edges.push([MAIN[bFrom], SIDE_R[0]], [SIDE_R[4], MAIN[bTo]]);
SIDE_R.slice(0, -1).forEach((id, i) => edges.push([id, SIDE_R[i + 1]]));

/* ---- mini cave: 3 fights then the relic vault (bottom left, below the side road) ---- */
let y0 = mainPts[1][1] - 30;
CAVE_A.forEach((id, i) => put(id, 'battle', 80, y0 - i * 84));
put(SHOP_A, 'shop', 80, y0 - CAVE_A.length * 84, { relic: true });
edges.push([MAIN[1], CAVE_A[0]]);
CAVE_A.slice(0, -1).forEach((id, i) => edges.push([id, CAVE_A[i + 1]]));
edges.push([CAVE_A[CAVE_A.length - 1], SHOP_A]);

/* ---- big cave: 5 fights then the relic vault (top right, above the side road) ---- */
let y1 = mainPts[17][1] - 10;
CAVE_B.forEach((id, i) => put(id, 'battle', 634, y1 - i * 80));
put(SHOP_B, 'shop', 634, y1 - CAVE_B.length * 80, { relic: true });
edges.push([MAIN[17], CAVE_B[0]]);
CAVE_B.slice(0, -1).forEach((id, i) => edges.push([id, CAVE_B[i + 1]]));
edges.push([CAVE_B[CAVE_B.length - 1], SHOP_B]);

/* ---- utility nodes: merchant, crafting hut, forward camp ---- */
put(SHOP, 'shop', mainPts[2][0] + 84, mainPts[2][1] - 52);
edges.push([MAIN[2], SHOP]);
put(CRAFT, 'craft', mainPts[8][0] - 84, mainPts[8][1] + 38);
edges.push([MAIN[8], CRAFT]);
put(BASE, 'base', mainPts[12][0] + 84, mainPts[12][1] + 38);
edges.push([MAIN[12], BASE]);

/* ---- relax: push decorative tiles off each other, main road stays fixed ---- */
const isMain = (id) => MAIN.includes(id) || id === GATE;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
for (let pass = 0; pass < 400; pass++) {
  let moved = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d >= 86) continue;
      if (d < 0.001) { dx = 1; dy = 0; d = 1; }
      const push = (86 - d) / 2;
      const ux = dx / d, uy = dy / d;
      if (!isMain(a.id) && !isMain(b.id)) {
        a.x -= ux * push; a.y -= uy * push;
        b.x += ux * push; b.y += uy * push;
      } else if (!isMain(a.id)) {
        a.x -= ux * push * 2; a.y -= uy * push * 2;
      } else if (!isMain(b.id)) {
        b.x += ux * push * 2; b.y += uy * push * 2;
      }
      moved++;
    }
  }
  nodes.forEach((n) => { n.x = Math.round(clamp(n.x, 56, 664)); n.y = Math.round(clamp(n.y, 100, 2500)); });
  if (!moved) break;
}

let tooClose = 0;
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
    if (Math.hypot(dx, dy) < 80) tooClose++;
  }
}
if (tooClose) console.warn('warning: overlapping tiles:', tooClose);

const nodeText = nodes
  .map((n) => `        { id: '${n.id}', type: '${n.type}'${n.relic ? ', relic: true' : ''}, x: ${n.x}, y: ${n.y} },`)
  .join('\n');
const edgeLines = [];
for (let i = 0; i < edges.length; i += 4) {
  edgeLines.push('        ' + edges.slice(i, i + 4).map(([a, b]) => `['${a}', '${b}']`).join(', ') + ',');
}
const edgeText = edgeLines.join('\n');

/* ---- splice the node list (first world only) ---- */
const nodesStart = src.indexOf("      id: 1,\n      name: 'Egg World'");
if (nodesStart < 0) throw new Error('world 1 header not found');
const openIdx = src.indexOf('      nodes: [', nodesStart);
const edgesKey = src.indexOf('      edges: [', openIdx);
const edgesEnd = src.indexOf('      ],', edgesKey) + '      ],'.length;
if (openIdx < 0 || edgesKey < 0 || edgesEnd < 0) throw new Error('world 1 nodes/edges not found');

const block = `      nodes: [\n${nodeText}\n      ],\n      edges: [\n${edgeText}\n      ],`;
src = src.slice(0, openIdx) + block + src.slice(edgesEnd);

/* ---- map height so the route has room ---- */
src = src.replace("      gateStars: 18,\n      theme: 'meadow',", "      gateStars: 18,\n      mapH: 2600,\n      theme: 'meadow',");

/* ---- labels: main 1..20, sides lettered, caves C/D ---- */
const labelStart = src.indexOf('DATA.labels = {};');
const labelEnd = src.indexOf('})();', labelStart) + '})();'.length;
const labelMain = MAIN.filter((id) => id !== 'e19');
const labelLines = [];
labelLines.push('DATA.labels = {};');
labelLines.push('(function () {');
labelLines.push(`  const main = ${JSON.stringify(labelMain)};`);
labelLines.push("  main.forEach((id, i) => { DATA.labels[id] = String(i + 1); });");
labelLines.push("  DATA.labels.e19 = String(main.length + 1);");
labelLines.push(`  ${JSON.stringify(SIDE_L)}.forEach((id, i) => { DATA.labels[id] = (5 + Math.floor(i / 2)) + 'abcde'[i]; });`);
labelLines.push(`  ${JSON.stringify(SIDE_R)}.forEach((id, i) => { DATA.labels[id] = (12 + Math.floor(i / 2)) + 'abcde'[i]; });`);
labelLines.push(`  ${JSON.stringify(CAVE_A)}.forEach((id, i) => { DATA.labels[id] = 'C' + (i + 1); });`);
labelLines.push(`  ${JSON.stringify(CAVE_B)}.forEach((id, i) => { DATA.labels[id] = 'D' + (i + 1); });`);
labelLines.push("  ['e53', 'e59', 'c33', 'c39', 'f33', 'f40'].forEach((id) => { DATA.labels[id] = '💎'; });");
labelLines.push('})();');
src = src.slice(0, labelStart) + labelLines.join('\n') + src.slice(labelEnd);

fs.writeFileSync(FILE, src);
console.log('world 1 regenerated:', nodes.length, 'tiles,', edges.length, 'roads');
