/* Balance sandbox: plays every level, all waves, with a simple AI.
   Run with: node tools/balance-sim.mjs        (RUNS=100 for a faster pass) */
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {}, console, DATA: undefined };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8') + '\n;globalThis.__DATA = DATA;',
  ctx
);
const DATA = ctx.__DATA;

/* SWEEP: override the wave ramp without touching the game data, so candidate
   values can be measured before any of them ship. */
const STEP_HP = Number(process.env.STEP_HP || 0);
const STEP_ATK = Number(process.env.STEP_ATK || 0);
const STEP_CAP = Number(process.env.STEP_CAP || 99);
const WAVE_HEAL = Number(process.env.WAVE_HEAL || 0);
const QUIET = !!process.env.QUIET;
if (STEP_HP || STEP_ATK) {
  DATA.waveEntries = function (level, wave) {
    const wv = Math.min(wave, STEP_CAP);
    const hpStep = 1 + (wv - 1) * (STEP_HP || 0.13);
    const atkStep = 1 + (wv - 1) * (STEP_ATK || 0.09);
    const base = level.enemies || [];
    const recruits = DATA.summonsByWorld[level.world || 1] || DATA.summonsByWorld[1];
    const line = base.map((e, i) => {
      const tpl = DATA.enemies[e.t] || {};
      if (wave === 1 || tpl.boss || !recruits || !recruits.length) return e;
      if (i === (wave - 1) % base.length) {
        const key = recruits[(wave - 2 + i) % recruits.length];
        if (key && DATA.enemies[key] && key !== e.t) return { ...e, t: key, hpMul: (e.hpMul || 1) * 1.08 };
      }
      return e;
    });
    const rotated = wave === 1 || !line.length ? line : line.slice(wave % line.length).concat(line.slice(0, wave % line.length));
    return rotated.map((e) => ({ ...e, hpMul: e.hpMul * hpStep, atkMul: e.atkMul * atkStep }));
  };
}

/* Tune sweep: override the global bird knobs without editing data.js. */
if (process.env.TUNE_HP || process.env.TUNE_ATK) {
  DATA.tuning = {
    enemyHp: Number(process.env.TUNE_HP) || DATA.tuning.enemyHp,
    enemyAtk: Number(process.env.TUNE_ATK) || DATA.tuning.enemyAtk,
  };
}

const RUNS = Number(process.env.RUNS) || 200;
const ACT_ATK = Number(process.env.ACT_ATK || 1);
const ACT_HP = Number(process.env.ACT_HP || 1);
const MAX_ROUNDS = 80;
const FIELD_LIMIT = 8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const alive = (l) => l.filter((x) => x.alive);
const field = (l) => l.filter((x) => x.alive || x.ghost);

/* Party level at a point in the campaign, from the real xp curve. */
function partyLevelAt(index) {
  let level = 1;
  let xp = 0;
  for (let i = 0; i < index; i++) {
    xp += DATA.levels[DATA.levelOrder[i]].xp;
    while (level < DATA.maxLevel && xp >= DATA.xpForLevel(level)) {
      xp -= DATA.xpForLevel(level);
      level += 1;
    }
  }
  return level;
}

function makeHeroes(level, roster) {
  return DATA.heroes
    .filter((h) => roster.includes(h.id))
    .map((def) => {
      const s = DATA.heroStats(def, level, {}, 0);
      /* Approximate a geared, upgraded player: workshop, relics, potions and
         training are not modelled, so this multiplier stands in for them. */
      s.atk *= ACT_ATK;
      s.maxHp = Math.round(s.maxHp * ACT_HP);
      return { def, level, maxHp: s.maxHp, hp: s.maxHp, atk: s.atk, rage: 2, shield: 0, guard: null, taunt: 0, alive: true };
    });
}

function makeEnemy(key, hpMul, atkMul, uid, level) {
  const tpl = DATA.enemies[key];
  const tune = DATA.tuning || { enemyHp: 1, enemyAtk: 1 };
  const boss = !!tpl.boss;
  /* Match buildEnemy(): bosses ignore the level curve, and world 1 is eased. */
  const hpScale = boss ? Math.min(hpMul || 1, 1.15) : (hpMul || 1);
  const atkScale = boss ? Math.min(atkMul || 1, 1.15) : (atkMul || 1);
  const ease = level && level.world === 1 && !boss ? 0.9 : 1;
  const hp = Math.max(1, Math.round(tpl.hp * hpScale * tune.enemyHp * ease));
  return {
    tpl, key, level, name: tpl.name, maxHp: hp, hp,
    atk: Math.round(tpl.atk * atkScale * tune.enemyAtk * ease * 10) / 10,
    armor: tpl.armor || 0, alive: true, ghost: false, ghostTimer: 0,
    stun: 0, burn: null, wind: 0, windMove: null, focus: 0, revived: false, uid,
  };
}

function makeWave(level, wave) {
  return DATA.waveEntries(level, wave).map((e, i) => makeEnemy(e.t, e.hpMul, e.atkMul, i, level));
}

function damageHero(h, raw) {
  if (!h.alive) return;
  let dmg = raw;
  if (h.guard && h.guard.turns > 0) dmg *= 1 - h.guard.reduce;
  if (h.shield > 0) {
    const a = Math.min(h.shield, dmg);
    h.shield -= a;
    dmg -= a;
  }
  h.hp = Math.max(0, h.hp - Math.round(dmg));
  h.rage = clamp(h.rage + 1, 0, 10);
  if (h.hp <= 0) h.alive = false;
}

function killEnemy(e, enemies) {
  e.alive = false;
  e.burn = null;
  const others = enemies.filter((x) => (x.alive || x.ghost) && x !== e);
  if (others.length && !e.revived) {
    e.ghost = true;
    e.ghostTimer = 3;
    e.hp = 0;
    return;
  }
  e.ghost = false;
}

function hitEnemy(e, dmg, enemies) {
  if (!e.alive) return;
  e.hp = Math.max(0, e.hp - Math.round(dmg * (1 - (e.armor || 0))));
  if (e.hp <= 0) killEnemy(e, enemies);
}

function chooseHero(heroes) {
  const list = alive(heroes);
  if (!list.length) return null;
  const taunting = list.filter((h) => h.taunt > 0);
  return pick(taunting.length ? taunting : list);
}

function pickMove(moves) {
  const total = moves.reduce((s, m) => s + (m.weight || 1), 0);
  let r = Math.random() * total;
  for (const m of moves) {
    r -= m.weight || 1;
    if (r <= 0) return m;
  }
  return moves[0];
}

function summon(e, enemies) {
  if (field(enemies).length >= FIELD_LIMIT) return;
  const pool = DATA.worldRoster[e.tpl.world] || DATA.worldRoster[1];
  const key = pick(pool);
  const fresh = makeEnemy(key, 0.95, 0.85, enemies.length, e.level);
  fresh.summoned = true;
  enemies.push(fresh);
}

function enemyAction(e, heroes, enemies) {
  if (e.wind > 0) {
    e.wind -= 1;
    if (e.wind > 0) return;
    const mv = e.windMove;
    if (!mv) return;
    if (mv.all) {
      for (const h of alive(heroes)) damageHero(h, clamp(e.atk * mv.mult, h.maxHp * 0.3, h.maxHp * 0.6));
    } else {
      const t = chooseHero(heroes);
      if (t) damageHero(t, clamp(e.atk * mv.mult, t.maxHp * 0.3, t.maxHp * 0.6));
    }
    return;
  }
  if (e.tpl.bomb) {
    if (e.fuse === 'lit') {
      e.fuse = 'idle';
      for (const h of alive(heroes)) damageHero(h, e.atk * 1.9);
      e.hp = Math.max(1, e.hp - Math.round(e.maxHp * 0.22));
    } else if (Math.random() < 0.55) {
      const t = chooseHero(heroes);
      if (t) damageHero(t, e.atk * 0.75);
    } else e.fuse = 'lit';
    return;
  }
  const moves = e.tpl.moves && e.tpl.moves.length ? e.tpl.moves : [{ kind: 'single', mult: 1 }];
  const move = pickMove(moves);

  if (move.kind === 'charge') {
    e.wind = Math.max(2, move.rounds || 3) - 1;
    e.windMove = move;
    return;
  }
  if (move.kind === 'summon') return summon(e, enemies);
  if (move.kind === 'healAlly') {
    const hurt = alive(enemies).slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (hurt) hurt.hp = Math.min(hurt.maxHp, hurt.hp + Math.round(hurt.maxHp * (move.heal || 0.2)));
    return;
  }
  if (move.kind === 'shieldAll') {
    for (const a of alive(enemies)) a.shield = Math.max(a.shield, Math.round(a.maxHp * (move.shield || 0.12)));
    return;
  }
  if (move.kind === 'focus') {
    e.focus = 2;
    return;
  }
  if (move.kind === 'self') return;
  if (move.kind === 'multi') {
    let t = chooseHero(heroes);
    for (let i = 0; i < (move.hits || 2); i++) {
      if (!t || !t.alive) t = chooseHero(heroes);
      if (!t) break;
      damageHero(t, e.atk * move.mult);
    }
    return;
  }
  if (move.kind === 'aoe') {
    for (const t of alive(heroes)) damageHero(t, e.atk * move.mult);
    return;
  }
  const t = chooseHero(heroes);
  if (t) damageHero(t, e.atk * (move.mult || 1));
}

function heroAction(hero, heroes, enemies) {
  const ab = (id) => hero.def.abilities.find((a) => a.id === id);
  const target = alive(enemies).slice().sort((a, b) => (a.hp - b.hp) || (b.tpl.boss ? 1 : 0) - (a.tpl.boss ? 1 : 0))[0];
  if (!target) return;
  const hit = (mult) => hitEnemy(target, hero.atk * mult * rnd(0.92, 1.08), enemies);

  if (hero.def.id === 'chef') {
    const hurt = alive(heroes).filter((h) => h.hp < h.maxHp * 0.62).length;
    const soup = ab('hotsoup');
    if (hurt && soup && hero.rage >= soup.cost) {
      hero.rage -= soup.cost;
      const targets = soup.healParty ? alive(heroes) : [alive(heroes).slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]].filter(Boolean);
      for (const h of targets) h.hp = Math.min(h.maxHp, h.hp + Math.round((soup.healParty || soup.healSingle)(hero)));
      return;
    }
    const chili = ab('chili');
    if (chili && hero.rage >= chili.cost) {
      hero.rage -= chili.cost;
      for (const h of alive(heroes)) h.hp = Math.min(h.maxHp, h.hp + Math.round(chili.healParty(hero)));
      return;
    }
    hero.rage = clamp(hero.rage + 2, 0, 10);
    hit(ab('panwhack').mult);
    return;
  }
  if (hero.def.id === 'corporal') {
    const wall = ab('shieldwall');
    const hurt = alive(heroes).filter((h) => h.hp < h.maxHp * 0.75).length;
    if (wall && hero.rage >= wall.cost && (hurt >= 2 || Math.random() < 0.25)) {
      hero.rage -= wall.cost;
      for (const h of alive(heroes)) h.shield = Math.max(h.shield, Math.round(wall.shieldParty(hero)));
      return;
    }
    const crack = ab('skullcrack');
    if (crack && hero.rage >= crack.cost) {
      hero.rage -= crack.cost;
      hit(crack.mult);
      if (target.alive) target.stun = Math.max(target.stun, 1);
      return;
    }
    hero.rage = clamp(hero.rage + 2, 0, 10);
    hit(ab('bonk').mult);
    return;
  }
  if (hero.def.id === 'king') {
    const guard = ab('royalguard');
    if (guard && hero.rage >= guard.cost && hero.hp < hero.maxHp * 0.6) {
      hero.rage -= guard.cost;
      hero.guard = { turns: guard.guard.turns, reduce: guard.guard.reduce };
      hero.taunt = guard.taunt;
      return;
    }
    const wrath = ab('wrath');
    if (wrath && hero.rage >= wrath.cost) {
      hero.rage -= wrath.cost;
      hit(wrath.mult);
      hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(wrath.selfHeal(hero)));
      return;
    }
    hero.rage = clamp(hero.rage + 2, 0, 10);
    hit(ab('royalsmash').mult);
    return;
  }
  hero.rage = clamp(hero.rage + 2, 0, 10);
  hit(1);
}

function ghostTick(enemies) {
  for (const e of enemies) {
    if (!e.ghost) continue;
    e.ghostTimer -= 1;
    if (e.ghostTimer <= 0) {
      e.ghost = false;
      e.alive = true;
      e.revived = true;
      e.hp = Math.round(e.maxHp * 0.45);
    }
  }
}

function simLevel(level, roster) {
  const heroes = makeHeroes(partyLevelAt(DATA.levelOrder.indexOf(level.id)), roster);
  const waves = DATA.wavesFor(level);
  let wave = 1;
  let round = 1;
  let enemies = makeWave(level, 1);

  const nextWave = () => {
    if (wave >= waves) return true;
    wave += 1;
    enemies = makeWave(level, wave);
    if (WAVE_HEAL) for (const h of alive(heroes)) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * WAVE_HEAL));
    return false;
  };

  while (round <= MAX_ROUNDS) {
    for (const h of alive(heroes)) {
      if (!alive(enemies).length) break;
      heroAction(h, heroes, enemies);
    }
    if (!alive(enemies).length) {
      if (!enemies.some((e) => e.ghost)) {
        if (nextWave()) return { win: true, wave, round, heroes };
        continue;
      }
      ghostTick(enemies);
      if (!alive(enemies).length) {
        if (nextWave()) return { win: true, wave, round, heroes };
        continue;
      }
    }
    for (const e of alive(enemies)) {
      if (!alive(heroes).length) break;
      if (e.stun > 0) {
        e.stun -= 1;
        continue;
      }
      enemyAction(e, heroes, enemies);
    }
    ghostTick(enemies);
    if (!alive(heroes).length) return { win: false, wave, round, heroes };

    for (const e of alive(enemies)) {
      if (e.burn && e.burn.turns > 0) {
        const dmg = e.burn.dmg;
        e.burn.turns -= 1;
        if (e.burn.turns <= 0) e.burn = null;
        hitEnemy(e, dmg, enemies);
      }
    }
    for (const h of alive(heroes)) {
      if (h.guard && --h.guard.turns <= 0) h.guard = null;
      if (h.taunt > 0) h.taunt -= 1;
    }
    round += 1;
  }
  return { win: false, wave, round, heroes };
}

const roster = ['corporal'];
const rows = [];
for (let i = 0; i < DATA.levelOrder.length; i++) {
  const level = DATA.levels[DATA.levelOrder[i]];
  let wins = 0;
  let roundSum = 0;
  let hpSum = 0;
  for (let r = 0; r < RUNS; r++) {
    const out = simLevel(level, roster);
    if (out.win) {
      wins += 1;
      roundSum += out.round;
      hpSum += out.heroes.reduce((a, h) => a + Math.max(0, h.hp), 0) / out.heroes.reduce((a, h) => a + h.maxHp, 0);
    }
  }
  const pct = Math.round((wins / RUNS) * 100);
  rows.push({ id: level.id, world: level.world, waves: DATA.wavesFor(level), boss: !!level.boss, pct });
  if (!QUIET) console.log(
    level.id.padEnd(4), 'w' + level.world, 'waves ' + DATA.wavesFor(level),
    String(pct).padStart(4) + '%',
    'rounds ' + (wins ? (roundSum / wins).toFixed(1) : '-').padStart(5),
    'endHP ' + (wins ? Math.round((hpSum / wins) * 100) + '%' : '-').padStart(4),
    level.enemies.map((e) => e.t).join(',')
  );
  if (i === 0 && !roster.includes('chef')) roster.push('chef');
  if (i === 2 && !roster.includes('king')) roster.push('king');
}

const byWaves = {};
rows.filter((r) => !r.boss).forEach((r) => { (byWaves[r.waves] = byWaves[r.waves] || []).push(r.pct); });
console.log('\n--- win rate by wave count (normal fights, simple AI, one starting pig) ---');
Object.keys(byWaves).sort().forEach((w) => {
  const list = byWaves[w];
  const avg = list.reduce((a, b) => a + b, 0) / list.length;
  console.log(w + ' waves: ' + Math.round(avg) + '% average over ' + list.length + ' levels (' + list.filter((p) => p < 70).length + ' below 70%)');
});
const below = rows.filter((r) => r.pct < 70);
console.log('\nlevels below 70%: ' + below.length + (below.length ? ' -> ' + below.slice(0, 12).map((r) => r.id + '(' + r.pct + '%)').join(', ') : ''));
