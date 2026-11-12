/* ============================================================
   Data — heroes, gear, birds, worlds, levels, rewards, lore
   ============================================================ */

const DATA = {
  version: 2,
  title: 'Piggy Epic',
  /* Sixty levels, so the last pig (level 60) is actually reachable. */
  maxLevel: 60,

  /* XP for the next level. The road starts trivial and climbs geometrically:
     level 1 costs 10 XP, level 30 costs exactly 10,000, and after thirty the
     growth relaxes to 9% a level instead of running away into the millions. */
  xpForLevel(level) {
    const l = Math.max(1, Math.min(DATA.maxLevel, Math.round(level || 1)));
    if (l <= 30) return Math.round(10 * Math.pow(1000, (l - 1) / 29));
    return Math.round(10000 * Math.pow(1.09, l - 30));
  },

  /* ---------------- Heroes ---------------- */
  heroes: [
    {
      id: 'corporal',
      name: 'Corporal Pig',
      title: 'Hammer Corporal',
      role: 'Warrior',
      baseHp: 44,
      hpGrow: 12,
      baseAtk: 16,
      atkGrow: 3.4,
      unlockLevel: 0,
      unlockBattle: 0,
      trait: 'Pure damage. One heavy bonk, one squad shield, one pepper finisher.',
      colors: ['#7cc33f', '#4e8a1c', '#a8dd63'],
      abilities: [
        {
          id: 'shieldwall', name: 'Shield Wall', icon: '🛡️', cost: 3, target: 'party',
          shieldParty: (h) => 16 + 1.7 * h.level,
          desc: 'A wall of shields closes around the squad.'
        },
        { id: 'bonk', name: 'Hammer Bonk', icon: '🔨', cost: 0, target: 'enemy', mult: 1.35, desc: 'One heavy, honest swing of the hammer.' },
        {
          /* The pepper. Relics and helmets never rewrite it. */
          id: 'skullcrack', name: 'Skull Crack', icon: '🌶️', cost: 0, target: 'enemy', mult: 2.0, stun: 1, chili: 3,
          burn: { turns: 2, dmg: (h) => 8 + 0.35 * h.atk },
          desc: 'A pepper-wrapped hammer blow that leaves one bird reeling.',
        },
      ],
      weapon: { name: 'Pig Hammer', atkMul: [1, 1.15, 1.32], cost: [0, 160, 420] },
      helmet: {
        name: 'Steel Helm',
        hpBonus: [0, 26, 64],
        cost: [0, 180, 460],
        tiers: [
          { name: 'Steel Helm', desc: '+26 max HP.' },
          { name: 'Spiked Helm', desc: 'Skull Crack becomes Skull Quake: hits every bird.', mods: { skullcrack: { name: 'Skull Quake', target: 'allEnemies', mult: 1.25 } } },
          { name: 'Crowned Helm', desc: 'Skull Quake stuns every bird it hits.', mods: { skullcrack: { stun: 1, name: 'Skull Quake' } } },
        ],
      },
    },
    {
      id: 'chef',
      name: 'Chef Pig',
      title: 'Soup Chef',
      role: 'Support',
      baseHp: 58,
      hpGrow: 9,
      baseAtk: 13,
      atkGrow: 2.7,
      unlockLevel: 0,
      unlockBattle: 3,
      trait: 'Squad medic. One heal, one light hit, and a pepper supper that heals and cleanses the whole squad.',
      colors: ['#8ed14d', '#5c941f', '#b6e877'],
      abilities: [
        {
          id: 'hotsoup', name: 'Hot Soup', icon: '🍲', cost: 3, target: 'ally',
          healSingle: (h) => 40 + 4.4 * h.level,
          desc: 'A big bowl of soup for one wounded pig.',
        },
        { id: 'panwhack', name: 'Pan Whack', icon: '🍳', cost: 0, target: 'enemy', mult: 0.9, weaken: 1, desc: 'A frying-pan crack across the beak.' },
        {
          /* No rage cost: the pepper is paid for with its own charge meter.
             This is a support pepper: it feeds and cleanses the whole squad. */
          id: 'chili', name: 'Pepper Supper', icon: '🌶️', cost: 0, target: 'party',
          healParty: (h) => 34 + 3.2 * h.level, cleanse: true, chili: 3,
          desc: 'A steaming supper for the whole squad — it feeds every pig and washes off everything the flock threw at them.',
        },
      ],
      weapon: { name: 'Cast Iron Pan', atkMul: [1, 1.16, 1.34], cost: [0, 150, 400] },
      helmet: {
        name: 'Chef Toque',
        hpBonus: [0, 24, 58],
        cost: [0, 170, 440],
        tiers: [
          { name: 'Chef Toque', desc: '+24 max HP.' },
          { name: 'Pressure Toque', desc: 'Hot Soup heals one pig far more.', mods: { hotsoup: { healSingle: (h) => 58 + 5.6 * h.level } } },
          { name: 'Volcano Toque', desc: 'A taller toque with extra HP. The Chef\'s pepper supper is his own — no hat changes it.' },
        ],
      },
    },
    {
      id: 'king',
      name: 'King Pig',
      title: 'His Royal Largeness',
      role: 'Tank',
      baseHp: 56,
      hpGrow: 13,
      baseAtk: 17,
      atkGrow: 3.6,
      unlockLevel: 0,
      unlockBattle: 10,
      trait: 'Royal wall. Guards himself, hits back hard, and keeps a pepper finisher.',
      colors: ['#6fb52f', '#427d13', '#9cd757'],
      abilities: [
        {
          id: 'royalguard', name: 'Royal Guard', icon: '🛡️', cost: 3, target: 'self',
          guard: { turns: 2, reduce: 0.45 }, taunt: 2,
          desc: 'The King plants himself in the flock\'s way.',
        },
        { id: 'royalsmash', name: 'Royal Smash', icon: '👑', cost: 0, target: 'enemy', mult: 1.5, desc: 'A dignified flattening.' },
        {
          /* The pepper. */
          id: 'wrath', name: "King's Wrath", icon: '🌶️', cost: 0, target: 'enemy', mult: 2.3, chili: 3,
          selfHeal: (h) => 18 + 2.0 * h.level,
          burn: { turns: 2, dmg: (h) => 8 + 0.38 * h.atk },
          desc: 'A royal slam wrapped in pepper.',
        },
      ],
      weapon: { name: 'Royal Scepter', atkMul: [1, 1.14, 1.3], cost: [0, 180, 460] },
      helmet: {
        name: 'Gold Crown',
        hpBonus: [0, 34, 80],
        cost: [0, 200, 500],
        tiers: [
          { name: 'Gold Crown', desc: '+34 max HP.' },
          { name: 'War Crown', desc: 'Royal Guard also shields every ally.', mods: { royalguard: { shieldParty: (h) => 20 + 2.0 * h.level } } },
          { name: 'Crown of Ruin', desc: "King's Wrath hits every bird.", mods: { wrath: { target: 'allEnemies', mult: 1.35, name: 'Wrath of Kings' } } },
        ],
      },
    },
    {
      id: 'sapper',
      name: 'Sapper Pig',
      title: 'Demolitions Expert',
      role: 'Saboteur',
      baseHp: 72,
      hpGrow: 10,
      baseAtk: 18,
      atkGrow: 3.7,
      unlockLevel: 0,
      unlockBattle: 20,
      trait: 'Multi-target saboteur. Medium damage across the whole flock.',
      colors: ['#9dc94a', '#5f8f22', '#c6e98a'],
      abilities: [
        {
          id: 'barricade', name: 'Sandbag Wall', icon: '🧱', cost: 3, target: 'party',
          shieldParty: (h) => 22 + 2.2 * h.level,
          desc: 'Sandbags dropped in front of every pig.'
        },
        {
          id: 'smoke', name: 'Smoke Bomb', icon: '💨', cost: 3, target: 'allEnemies', mult: 0.85, weaken: 2, expose: 2,
          desc: 'Smoke and grit thrown over the whole flock.',
        },
        {
          /* The pepper. */
          id: 'bigboom', name: 'Big Boom', icon: '🌶️', cost: 0, target: 'allEnemies', mult: 1.25, silence: 2, chili: 3,
          burn: { turns: 3, dmg: (h) => 9 + 0.4 * h.atk },
          desc: 'A keg of pepper cracks open over the flock.',
        },
      ],
      weapon: { name: 'Pig Wrench', atkMul: [1, 1.16, 1.34], cost: [0, 170, 440] },
      helmet: {
        name: 'Hard Hat',
        hpBonus: [0, 28, 66],
        cost: [0, 190, 470],
        tiers: [
          { name: 'Hard Hat', desc: '+28 max HP.' },
          { name: 'Blast Visor', desc: 'Smoke Bomb hits harder and weakens for 3 rounds.', mods: { smoke: { mult: 0.75, weaken: 3 } } },
          { name: 'Detonator Rig', desc: 'Big Boom also weakens every bird.', mods: { bigboom: { weaken: 2 } } },
        ],
      },
    },
    {
      id: 'wizard',
      name: 'Wizard Pig',
      title: 'Keeper of the Eggs',
      role: 'Mage',
      baseHp: 80,
      hpGrow: 9,
      baseAtk: 19,
      atkGrow: 3.8,
      unlockLevel: 0,
      unlockBattle: 35,
      trait: 'Poison mage. Tiny direct hits, heavy poison that ticks between turns.',
      colors: ['#86c95a', '#4f8a28', '#b3e88a'],
      abilities: [
        {
          id: 'dispel', name: 'Clear Air', icon: '🌬️', cost: 3, target: 'party', cleanse: true,
          desc: 'A clean breeze rolls over the squad.',
        },
        {
          id: 'hex', name: 'Hex', icon: '🕯️', cost: 3, target: 'enemy', mult: 0.55, weaken: 2, expose: 2,
          poison: { turns: 4, dmg: (h) => 10 + 0.7 * h.atk },
          desc: 'A weak hex with a nasty bite.',
        },
        {
          id: 'meteor', name: 'Meteor', icon: '☄️', cost: 0, target: 'allEnemies', mult: 0.5, chili: 3,
          poison: { turns: 3, dmg: (h) => 12 + 0.9 * h.atk },
          desc: 'A poisonous meteor shower.',
        },
      ],
      weapon: { name: 'Hex Rod', atkMul: [1, 1.16, 1.34], cost: [0, 170, 450] },
      helmet: {
        name: 'Star Hat',
        hpBonus: [0, 25, 60],
        cost: [0, 190, 470],
        tiers: [
          { name: 'Star Hat', desc: '+25 max HP.' },
          { name: 'Hex Hat', desc: 'Hex also silences the bird for 2 rounds.', mods: { hex: { silence: 2 } } },
          { name: 'Comet Hat', desc: 'Meteor weakens every bird it hits.', mods: { meteor: { weaken: 2 } } },
        ],
      },
    },
  ],

  gearTierCost(heroDef, slot, tier) {
    const table = slot === 'weapon' ? heroDef.weapon : heroDef.helmet;
    return table.cost[tier - 1] || 0;
  },

  gearHp(heroDef, gear) {
    const t = (gear && gear.helmet) || 1;
    return heroDef.helmet.hpBonus[t - 1] || 0;
  },

  gearAtkMul(heroDef, gear) {
    const t = (gear && gear.weapon) || 1;
    return heroDef.weapon.atkMul[t - 1] || 1;
  },

  /* Every weapon and helmet carries a small proc chance. It starts at 2% on
     the starter item and climbs to 10% at tier 5. */
  gearProcChance(tier) {
    return [0.02, 0.04, 0.06, 0.08, 0.10][Math.max(0, Math.min(4, (tier || 1) - 1))];
  },

  /* Squad-wide training bought with coins and materials. Applies to every pig,
     on top of their own weapon, helmet and relic. */
  training: {
    power: {
      name: 'Whetstone Drills', icon: '⚔️', unit: 'DMG',
      step: 0.06, max: 5,
      cost: [140, 300, 520, 800, 1150],
      mats: [{ ore: 2 }, { ore: 4 }, { ore: 6 }, { ore: 9 }, { ore: 12 }],
      blurb: 'Sharper beaks on the hammers. Every pig hits harder.',
    },
    vigour: {
      name: 'Block & Tackle', icon: '❤️', unit: 'HP',
      step: 0.08, max: 5,
      cost: [160, 340, 580, 880, 1250],
      mats: [{ wood: 2 }, { wood: 4 }, { wood: 6 }, { wood: 9 }, { wood: 12 }],
      blurb: 'Drills and big dinners. Every pig survives more.',
    },
  },
  trainingBonus: { power: 0, vigour: 0 },

  heroStats(heroDef, level, gear, forgeLevel, relicId) {
    const forge = Math.max(0, Math.min(5, forgeLevel || 0));
    const relic = DATA.relicForHero ? DATA.relicForHero(heroDef.id, relicId) : null;
    const rs = (relic && relic.stats) || {};
    return {
      maxHp: Math.round((heroDef.baseHp + heroDef.hpGrow * (level - 1) + DATA.gearHp(heroDef, gear) + ((gear && gear.bonusHp) || 0) + forge * 55) * (1 + (rs.hp || 0)) * (1 + (DATA.trainingBonus.vigour || 0))),
      atk: Math.round((heroDef.baseAtk + heroDef.atkGrow * (level - 1) + ((gear && gear.bonusAtk) || 0)) * DATA.gearAtkMul(heroDef, gear) * (1 + forge * 0.07) * (1 + (rs.atk || 0)) * (1 + (DATA.trainingBonus.power || 0)) * 10) / 10,
    };
  },    relicForge: { cost: 3, maxLevel: 5, hp: 58, atk: 0.075 },

  /* Turn a small healing formula into readable text: the source is read once,
     before gear scaling wraps it, so the tooltip keeps the real numbers. */
  formulaFromFn(fn) {
    if (typeof fn !== 'function') return '';
    const src = String(fn);
    const arrow = src.indexOf('=>');
    let expr = arrow >= 0 ? src.slice(arrow + 2) : src;
    expr = expr.replace(/Math\.round\(/g, '').replace(/;\s*}?\s*$/, '').replace(/\)\s*$/, '');
    expr = expr.replace(/\bh\.level\b/g, 'level').replace(/\bh\.atk\b/g, 'damage');
    expr = expr.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ');
    return expr.replace(/\s+/g, ' ').trim();
  },

  /* One line of exact mechanics for every hero ability, including relic and
     helmet variants. The descriptions stay readable; this line carries the
     target count, percentages, durations and what each status actually does. */
  abilityFacts(ab, hero) {
    if (!ab) return '';
    const r = (n) => n + (n === 1 ? ' round' : ' rounds');
    const pct = (n) => Math.round(n * 100) + '%';
    const turns = (v) => (v && typeof v === 'object' ? (v.turns || 1) : v);
    const formula = (fn) => (fn && fn.formula) || DATA.formulaFromFn(fn);
    /* With a live pig in hand every number also prints what it does right now,
       so an attack reads as "deals 42 damage" at that pig's real level. */
    const live = (fn) => (hero && typeof fn === 'function' && Number.isFinite(fn(hero)) ? ' ≈ ' + Math.round(fn(hero)) : '');
    const liveMul = (n) => (hero && Number.isFinite(hero.atk) ? Math.round(n * hero.atk) : null);
    const target = {
      enemy: '1 bird',
      allEnemies: 'all living birds',
      ally: '1 ally',
      party: 'all living allies (up to 3)',
      self: 'self',
    }[ab.target] || 'the squad';
    const bits = [target];
    if (ab.mult) {
      /* A pig's attack power is never printed anywhere, so the description
         quotes the damage itself: the number the bird actually loses. */
      const hit = liveMul(ab.mult);
      const per = ab.hits && ab.hits > 1 ? ' per hit' : '';
      bits.push(hit != null ? hit + ' damage' + per : pct(ab.mult) + ' of its damage' + per);
    }
    if (ab.healSingle && ab.target === 'ally') {
      const n = (hero && typeof ab.healSingle === 'function' && Number.isFinite(ab.healSingle(hero))) ? Math.round(ab.healSingle(hero)) : null;
      bits.push('heals the target for ' + (n != null ? n + ' HP' : 'HP'));
    }
    if (ab.healParty && ab.target === 'party') {
      const n = (hero && typeof ab.healParty === 'function' && Number.isFinite(ab.healParty(hero))) ? Math.round(ab.healParty(hero)) : null;
      bits.push('heals each living ally for ' + (n != null ? n + ' HP' : 'HP'));
    }
    if (ab.selfHeal) {
      const n = (hero && typeof ab.selfHeal === 'function' && Number.isFinite(ab.selfHeal(hero))) ? Math.round(ab.selfHeal(hero)) : null;
      bits.push('heals self for ' + (n != null ? n + ' HP' : 'HP'));
    }
    if (ab.shieldParty || ab.shieldSingle || ab.ward) {
      const squadShield = !!(ab.shieldParty || ab.ward || ab.target === 'party' || ab.target === 'self');
      const shieldPct = ab._relicShaped ? (squadShield ? 35 : 50) : 30;
      const shieldTurns = ab._relicShaped ? 1 : 3;
      bits.push('shield: ' + (squadShield ? 'all living allies take ' : 'the target takes ') + shieldPct + '% less damage for ' + r(shieldTurns));
    }
    if (ab.guard) bits.push('takes ' + pct(ab.guard.reduce || 0.45) + ' less damage for ' + r(ab.guard.turns || 2));
    if (ab.taunt) bits.push('taunts birds for ' + r(ab.taunt));
    if (ab.stun) bits.push('stun ' + r(turns(ab.stun)) + ' (skips turns)');
    if (ab.weaken) bits.push('weaken ' + r(turns(ab.weaken)) + ' (bird deals 30% less damage)');
    if (ab.silence) bits.push('silence ' + r(turns(ab.silence)) + ' (no specials)');
    /* Damage over time prints the tick a live pig would actually suffer, not
       a formula the player has to solve. */
    const tick = (fn) => ((hero && typeof fn === 'function' && Number.isFinite(fn(hero)))
      ? Math.round(fn(hero)) + ' damage per round'
      : 'damage per round');
    if (ab.burn) bits.push('burn ' + r(ab.burn.turns || 1) + (ab.burn.dmg ? ' — ' + tick(ab.burn.dmg) : ''));
    if (ab.poison) bits.push('poison ' + r(turns(ab.poison)) + (ab.poison.dmg ? ' — ' + tick(ab.poison.dmg) : ''));
    if (ab.vuln) bits.push('exposed ' + r(ab.vuln.turns || 2) + ' (+' + pct(ab.vuln.bonus || 0.2) + ' damage taken)');
    else if (ab.expose) bits.push('exposed ' + r(turns(ab.expose)) + ' (+25% damage taken)');
    if (ab.mire) bits.push('mire ' + r(turns(ab.mire)) + ' (100% healing stolen)');
    if (ab.cleanse) bits.push(ab.target === 'allEnemies'
      ? 'clears bird shields and mirages'
      : 'cleanses all 10 debuffs (stun, freeze, silence, weaken, poison, burn, drench, mire, pepper numb, expose)');
    if (ab.cleanseChance) bits.push(pct(ab.cleanseChance) + ' chance to cleanse the squad of all debuffs');
    if (ab.leech) bits.push('heals self for ' + pct(ab.leech) + ' of damage dealt');
    if (ab.thorns) bits.push('returns ' + pct(ab.thorns) + ' of damage taken');
    if (ab.rally) bits.push('+' + pct(ab.rally.mult || 0.15) + ' squad damage for ' + r(ab.rally.turns || 2));
    if (ab.shred) bits.push('removes bird shields and mirages');
    if (ab.mend) {
      const n = (hero && typeof ab.mend === 'function' && Number.isFinite(ab.mend(hero))) ? Math.round(ab.mend(hero)) : null;
      bits.push('heals each living ally for ' + (n != null ? n + ' HP' : 'HP'));
    }
    if (ab.chili) bits.push('pepper: needs 6 charge per squad pig (18 with 3); 2-round cooldown');
    return bits.join(' · ');
  },

  withEffects(ab, hero) {
    const facts = DATA.abilityFacts(ab, hero);
    const desc = ab.desc || '';
    if (!facts) return desc;
    return (desc ? desc + ' ' : '') + 'Details: ' + facts + '.';
  },

  abilitiesFor(heroDef, gear, relicId, hero) {
    const list = heroDef.abilities.map((a) => Object.assign({}, a));
    const tier = (gear && gear.helmet) || 1;
    /* Team help grows with the gear that grows damage: every helmet tier adds
       10% and every weapon tier 12% to heals and shields, so upgrading a
       support pig is never wasted. */
    const weapon = (gear && gear.weapon) || 1;
    const supportMul = 1 + 0.1 * (tier - 1) + 0.12 * (weapon - 1);
    const scale = (ab, key) => {
      if (typeof ab[key] !== 'function') return;
      const fn = ab[key];
      const formula = DATA.formulaFromFn(fn);
      ab[key] = (h) => Math.round(fn(h) * supportMul);
      ab[key].formula = formula;
    };
    list.forEach((ab) => {
      scale(ab, 'ward');
      scale(ab, 'mend');
      scale(ab, 'healSingle');
      scale(ab, 'healParty');
      scale(ab, 'shieldSingle');
      scale(ab, 'shieldParty');
      scale(ab, 'selfHeal');
    });
    for (let i = 1; i < tier; i++) {
      const t = heroDef.helmet.tiers[i];
      if (!t || !t.mods) continue;
      Object.keys(t.mods).forEach((id) => {
        const ab = list.find((a) => a.id === id);
        /* The pepper attack is the pig, not the outfit: no relic or helmet
           ever rewrites it, so the ultimate is identical on every relic. */
        if (ab && !ab.chili) Object.assign(ab, t.mods[id]);
      });
    }
    const relic = DATA.relicForHero ? DATA.relicForHero(heroDef.id, relicId) : null;
    if (relic && relic.mods) {
      Object.keys(relic.mods).forEach((id) => {
        const ab = list.find((a) => a.id === id);
        if (ab && !ab.chili) {
          Object.assign(ab, relic.mods[id]);
          /* shieldPlan() gives relic-shaped shields 35% for one round (or
             50% on one ally); the description must say the same thing. */
          ab._relicShaped = true;
        }
      });
    }
    list.forEach((a) => { a.desc = DATA.withEffects(a, hero); });
    return list;
  },

  /* ---------------- Birds ---------------- */
  enemies: {
    red: {
      name: 'Scarlet Bully', art: 'red', hp: 60, atk: 16,
      lore: 'The original angry bird. Straight lines, straight anger, no surprises.',
      trait: 'Balanced pecker',
      moves: [
        { name: 'Peck', kind: 'single', mult: 1.0, weight: 3 },
        { name: 'War Screech', kind: 'single', mult: 0.55, silence: 2, weight: 1 },
        { name: 'Toxic Peck', kind: 'single', mult: 0.55, poison: 3, icon: '☠️', cd: 2, weight: 1 },
      ],
    },
    chuck: {
      name: 'Blitz Chuck', art: 'chuck', hp: 52, atk: 17,
      lore: 'Yellow, fast, and utterly convinced he is the main character.',
      trait: 'Hits twice',
      moves: [
        { name: 'Speed Peck', kind: 'multi', mult: 0.62, hits: 2, weight: 3 },
        { name: 'Dizzy Dash', kind: 'single', mult: 0.9, stun: 1, weight: 1 },
        { name: 'Flock Mark', kind: 'focus', rounds: 2, icon: '🎯', cd: 3, weight: 1 },
      ],
    },
    blue: {
      name: 'Triple Jay', art: 'blue', hp: 44, atk: 13,
      lore: 'Three small jays in a trench coat. They split damage all over the squad.',
      trait: 'Splits into 3 hits',
      moves: [
        { name: 'Split Shot', kind: 'multi', mult: 0.5, hits: 3, random: true, weight: 3 },
        { name: 'Icy Chirp', kind: 'aoe', mult: 0.4, weaken: 2, weight: 1 },
      ],
    },
    bomb: {
      name: 'Fuse Bomb', art: 'bomb', hp: 70, atk: 14, bomb: true,
      lore: 'A walking fuse with a short temper. Lights up, then hits everyone.',
      trait: 'Explodes on a fuse',
      moves: [],
    },
    matilda: {
      name: 'Nurse Matilda', art: 'matilda', hp: 78, atk: 17,
      lore: 'The flock\'s nurse. Patches up birds and lays explosive eggs.',
      trait: 'Heals the flock',
      moves: [{ name: 'Warm Egg', kind: 'healAlly', heal: 0.4, icon: '🥚', cd: 2 }, { name: 'Egg Drop', kind: 'single', mult: 1.15, weight: 2 }],
    },
    hal: {
      name: 'Boomerang Hal', art: 'hal', hp: 66, atk: 16,
      lore: 'A boomerang in bird form. One throw, two bruised pigs.',
      trait: 'Boomerang hits 2',
      moves: [
        { name: 'Boomerang', kind: 'aoe', mult: 0.6, targetCount: 2, weight: 3 },
        { name: 'Ring Out', kind: 'single', mult: 1.05, stun: 1, weight: 1 },
      ],
    },
    bubbles: {
      name: 'Bubble Brawler', art: 'bubbles', hp: 58, atk: 14,
      lore: 'A tiny wizard of bubbles. Pops into three hits at once, usually on the healer.',
      trait: 'Hits 3 random pigs',
      moves: [
        { name: 'Bubble Barrage', kind: 'multi', mult: 0.62, hits: 3, random: true, weight: 3 },
        { name: 'Soap Hex', kind: 'aoe', mult: 0.35, silence: 1, weight: 1 },
      ],
    },
    stella: {
      name: 'Shield Stella', art: 'stella', hp: 74, atk: 15,
      lore: 'The flock\'s bubble mage. Shields the whole flock and pecks with rainbow light.',
      trait: 'Shields the flock',
      moves: [
        { name: 'Bubble Shield', kind: 'shieldAll', shield: 0.22, heal: 0.12, icon: '🫧', cd: 3 },
        { name: 'Rainbow Peck', kind: 'single', mult: 1.2, weight: 2 },
      ],
    },
    terence: {
      name: 'Terence the Wall', art: 'terence', hp: 1000, atk: 25, haunt: true, armor: 0.22,
      lore: 'A living wall of bird. Enormous health, heavy hits, and armor that turns aside small damage.',
      trait: 'Tank: 1,000 HP, 22% less damage, charged stun slam',
      moves: [
        { name: 'Big Peck', kind: 'single', mult: 1.3, weight: 3 },
        { name: 'Titan Hammer', kind: 'charge', rounds: 3, mult: 2.8, stun: 2, scaled: true, cd: 3, icon: '🔨', weight: 2, desc: 'Winds up for 3 rounds, then brings the hammer down for 280% of its damage and a 2-round stun.' },
        { name: 'Tremor', kind: 'single', mult: 0.9, stun: 1, weight: 1 },
      ],
    },
    eagle: {
/* boss phases + side smoothing */
      name: 'Mighty Eagle', art: 'eagle', hp: 1100, atk: 31, boss: true, haunt: true, flying: true,
      /* Half health: he stops hunting one pig and calls the guard. */
      phase2: { at: 0.5, sum: 2, banner: 'CALLS THE SKY GUARD!' },
      lore: 'The Mighty Eagle. He flies, so a fifth of everything the pigs throw at him sails right past.',
      trait: 'Boss: 1,100 HP, 20% dodge, summons every 2 rounds',
      moves: [
        { name: 'Talon Dive', kind: 'single', mult: 1.7, weight: 2 },
        { name: 'Feather Storm', kind: 'aoe', mult: 0.7, icon: '🪶', cd: 2, weight: 2 },
        { name: 'Wind Screech', kind: 'aoe', mult: 0.45, weaken: 2, weight: 1 },
      ],
    },
    mother: {
      name: 'Mother Flock', art: 'mother', hp: 1450, atk: 34, boss: true, haunt: true, armor: 0.12,
      /* Half health: she wraps the nest and starts eating her own wounds. */
      phase2: { at: 0.5, shield: 0.22, heal: 0.1, banner: 'CURLS AROUND THE NEST!' },
      lore: 'The reason every bird is angry. She shields her brood, devours pigs whole, and does not stay dead.',
      trait: 'Boss: 1,450 HP, armour, summons every 2 rounds',
      moves: [
        { name: 'Egg Barrage', kind: 'aoe', mult: 0.75, icon: '🥚', cd: 2, weight: 2 },
        { name: 'Devour', kind: 'single', mult: 1.65, weight: 2 },
        { name: 'Shell Guard', kind: 'shieldAll', shield: 0.18, heal: 0.08, weight: 1 },
      ],
    },
    frost: {
      name: 'Rime Jay', art: 'blue', hp: 95, atk: 16, armor: 0.05,
      lore: 'A jay encased in ice. Its pecks leave frostbite.',
      trait: 'Chills: reduces speed',
      moves: [
        { name: 'Icicle Peck', kind: 'single', mult: 1.0, weight: 2 },
        { name: 'Frost Breath', kind: 'aoe', mult: 0.6, weaken: 2, icon: '❄️', cd: 2, weight: 1 },
      ],
    },
    balloon: {
      name: 'Skyfloat Raider', art: 'red', hp: 70, atk: 12, flying: true,
      lore: 'Floating by helium. Hard to hit but fragile.',
      trait: 'Flying: 25% dodge',
      moves: [
        { name: 'Swoop', kind: 'single', mult: 1.1, weight: 2 },
        { name: 'Float Away', kind: 'self', mult: 0, dodge: 2, weight: 1, desc: 'Drifts up and out of reach: the next 2 hits miss.' },
      ],
    },
    yeti: {
      name: 'Glacier Behemoth', art: 'terence', hp: 1000, atk: 26, armor: 0.22,
      lore: 'A massive frozen bird. Brutally strong.',
      trait: 'Tank: 1,000 HP, 22% armour, charged stun slam',
      moves: [
        { name: 'Snow Smash', kind: 'single', mult: 1.4, stun: 1, weight: 2 },
        { name: 'Avalanche', kind: 'aoe', mult: 0.8, weight: 1 },
        { name: 'Glacier Charge', kind: 'charge', rounds: 3, mult: 1.9, stun: 1, weight: 1 },
      ],
    },
    sparrow: {
      name: 'Pip Sparrow', art: 'red', hp: 34, atk: 9, flying: true,
      lore: 'A tiny bird with big opinions. Comes in flocks.',
      trait: 'Mini: fast, dodges 25% of hits',
      moves: [{ name: 'Quick Peck', kind: 'single', mult: 0.85, weight: 2 }, { name: 'Flutter', kind: 'multi', hits: 2, mult: 0.5, weight: 1 }, { name: 'Pip Squeak', kind: 'single', mult: 0.5, silence: 1, weight: 1 }],
    },
    diver: {
      name: 'Skydive Kestrel', art: 'blue', hp: 78, atk: 14, flying: true,
      lore: 'Drops out of the sun with no warning at all.',
      trait: 'Normal: dives twice',
      moves: [{ name: 'Dive Bomb', kind: 'multi', hits: 2, mult: 0.65, weight: 2 }, { name: 'Wing Slap', kind: 'single', mult: 1.0, weight: 2 }, { name: 'Sky Yell', kind: 'aoe', mult: 0.35, silence: 1, weight: 1 }],
    },
    hawk: {
      name: 'Ridge Talon', art: 'chuck', hp: 135, atk: 19, armor: 0.1,
      lore: 'A big bird that hunts the high path and never misses twice.',
      trait: 'Bigger: 10% armour, heavy hits',
      moves: [{ name: 'Talon Rake', kind: 'single', mult: 1.35, weight: 2 }, { name: 'Screech', kind: 'aoe', mult: 0.55, silence: 1, weight: 1 }],
    },
    mammoth: {
      name: 'Tundra Mammoth', art: 'bomb', hp: 320, atk: 18, armor: 0.28, big: true,
      lore: 'A woolly wall of bird. It walks through the squad and does not slow down.',
      trait: 'Living wall: 28% armour, huge HP',
      moves: [
        { name: 'Tusk Ram', kind: 'single', mult: 1.5, weight: 2 },
        { name: 'Stampede', kind: 'aoe', mult: 0.7, weight: 1 },
        { name: 'Ice Hide', kind: 'shieldAll', mult: 0, shield: 0.12, weight: 1 },
        { name: 'Wool Rush', kind: 'charge', rounds: 3, mult: 2.1, stun: 2, weight: 1 },
      ],
    },

    /* ---- Terence's cousins: one walking wall per world ---- */
    camel: {
      name: 'Camelback Colossus', art: 'camel', hp: 1000, atk: 24, armor: 0.22, big: true,
      lore: 'A dune with a beak. It stores three days of bad temper in that hump and spends it all on the squad.',
      trait: 'Tank: 1,000 HP, 22% armour, charged stun slam',
      moves: [
        { name: 'Dune Stomp', kind: 'single', mult: 1.35, weight: 2 },
        { name: 'Sand Spit', kind: 'aoe', mult: 0.55, weaken: 2, weight: 1 },
        { name: 'Hump Slam', kind: 'charge', rounds: 3, mult: 2.8, stun: 2, scaled: true, cd: 3, icon: '🐪', weight: 2 },
      ],
    },
    kraken: {
      name: 'Kraken Coil', art: 'kraken', hp: 1000, atk: 26, armor: 0.2, big: true,
      lore: 'What the shore dragged up. It has too many wings and every one of them is wet.',
      trait: 'Tank: 1,000 HP, 20% armour, charged stun slam',
      moves: [
        { name: 'Tentacle Lash', kind: 'single', mult: 1.4, weight: 2 },
        { name: 'Deep Drag', kind: 'aoe', mult: 0.55, drench: 2, weight: 1 },
        { name: 'Abyss Slam', kind: 'charge', rounds: 3, mult: 2.8, stun: 2, scaled: true, cd: 3, icon: '🐙', weight: 2 },
      ],
    },

/* sea-and-ice-birds */
    /* ---- Frost Peak and Saltwind Shore: extra walls and casters ---- */
    frostwall: {
      name: 'Hoarfrost Bulwark', art: 'frostwall', hp: 560, atk: 22, armor: 0.26, big: true,
      lore: 'A wall of frozen feathers that walks the shelf road. Snow does not settle on it; it settles on whatever it hits.',
      trait: 'Tank: 560 HP, 26% armour, shields the flock, charged slam',
      moves: [
        { name: 'Ice Shoulder', kind: 'single', mult: 1.35, weight: 3 },
        { name: 'Permafrost Plate', kind: 'shieldAll', shield: 0.12, weight: 1 },
        { name: 'Avalanche Slam', kind: 'charge', rounds: 3, mult: 2.4, stun: 2, cd: 3, icon: '🧊', weight: 2 },
      ],
    },
    rimeweaver: {
      name: 'Rime Weaver', art: 'rimeweaver', hp: 215, atk: 16, armor: 0.08,
      lore: 'It does not fight so much as knit. Every thread it pulls tight is a pig that suddenly cannot speak.',
      trait: 'Caster: heals the flock, silences a pig, freezes',
      moves: [
        { name: 'Rime Mend', kind: 'healAlly', heal: 0.2, icon: '❄️', cd: 2, weight: 2 },
        { name: 'Glass Hex', kind: 'single', mult: 0.7, silence: 2, freeze: 1, pepperDry: 3, weight: 2 },
        { name: 'Hoar Ward', kind: 'shieldAll', shield: 0.14, weight: 1 },
      ],
    },
    tidewall: {
      name: 'Tidewall Galleon', art: 'tidewall', hp: 560, atk: 22, armor: 0.24, big: true,
      lore: 'Half bird, half shipwreck, all bulk. It beaches itself in front of the flock and dares the pigs to move it.',
      trait: 'Tank: 560 HP, 24% armour, shields the flock, charged drenching slam',
      moves: [
        { name: 'Keel Smash', kind: 'single', mult: 1.35, weight: 3 },
        { name: 'Bilge Guard', kind: 'shieldAll', shield: 0.12, weight: 1 },
        { name: 'Anchor Slam', kind: 'charge', rounds: 3, mult: 2.4, stun: 2, drench: 2, cd: 3, icon: '⚓', weight: 2 },
      ],
    },
    tideseer: {
      name: 'Tide Seer', art: 'tideseer', hp: 205, atk: 15, armor: 0.06,
      lore: 'It reads the water and tells the flock where the pigs will be standing. It is never wrong.',
      trait: 'Caster: heals the flock, drenches and silences a pig',
      moves: [
        { name: 'Salt Mend', kind: 'healAlly', heal: 0.2, icon: '🌊', cd: 2, weight: 2 },
        { name: 'Undertow Hex', kind: 'single', mult: 0.65, drench: 2, silence: 1, pepperDry: 3, weight: 2 },
        { name: 'Foam Ward', kind: 'shieldAll', shield: 0.14, weight: 1 },
      ],
    },

/* second-wave birds + boss cutscenes */
    /* ---- second wave: summoning casters and a second wall per world ---- */
    icefall: {
      name: 'Icefall Colossus', art: 'icefall', hp: 600, atk: 23, armor: 0.27, big: true,
      lore: 'A hanging glacier that decided to stand up. It does not chase the pigs; it waits for them to come to it.',
      trait: 'Tank: 600 HP, 27% armour, shields the flock, charged slam',
      moves: [
        { name: 'Icefall Shoulder', kind: 'single', mult: 1.4, weight: 3 },
        { name: 'Frostbound Plate', kind: 'shieldAll', shield: 0.13, weight: 1 },
        { name: 'Glacier Drop', kind: 'charge', rounds: 3, mult: 2.5, stun: 2, freeze: 1, cd: 3, icon: '🧊', weight: 2 },
      ],
    },
    frostbinder: {
      name: 'Frost Binder', art: 'frostbinder', hp: 225, atk: 17, armor: 0.08, summoner: true,
      summonPool: ['frost', 'balloon', 'frostwall'],
      lore: 'It braids the cold into shapes and the shapes into birds. Kill it first or the mountain keeps sending them.',
      trait: 'Caster: summons, freezes, shields the flock',
      moves: [
        { name: 'Rime Call', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Frozen Sigil', kind: 'aoe', mult: 0.4, freeze: 1, icon: '❄️', cd: 2, weight: 2 },
        { name: 'Hoarfrost Ward', kind: 'shieldAll', shield: 0.14, weight: 1 },
      ],
    },
    reefbulwark: {
      name: 'Reef Bulwark', art: 'reefbulwark', hp: 600, atk: 23, armor: 0.25, big: true,
      lore: 'A living reef with a beak. The tide breaks on it, the pigs break on it, and it does not notice either.',
      trait: 'Tank: 600 HP, 25% armour, shields the flock, charged drenching slam',
      moves: [
        { name: 'Reef Ram', kind: 'single', mult: 1.4, weight: 3 },
        { name: 'Barnacle Plate', kind: 'shieldAll', shield: 0.13, weight: 1 },
        { name: 'Anchor Drop', kind: 'charge', rounds: 3, mult: 2.5, stun: 2, drench: 2, cd: 3, icon: '⚓', weight: 2 },
      ],
    },
    brinebinder: {
      name: 'Brine Binder', art: 'brinebinder', hp: 220, atk: 16, armor: 0.06, summoner: true,
      summonPool: ['tern', 'gull', 'tideseer'],
      lore: 'It ties knots in the tide and pulls birds out of them. Every knot it finishes is another bird the pigs have to kill.',
      trait: 'Caster: summons, drenches and silences a pig',
      moves: [
        { name: 'Tide Summons', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Salt Hex', kind: 'single', mult: 0.7, drench: 2, silence: 2, pepperDry: 3, weight: 2 },
        { name: 'Brine Ward', kind: 'shieldAll', shield: 0.14, weight: 1 },
      ],
    },

    /* ---- numb flock: the birds that take the pepper away ---- */
    numbwing: {
      name: 'Numbwing', art: 'numbwing', hp: 168, atk: 19, role: 'Disruptor',
      lore: 'A canyon bird with a beak full of chalk dust. Two pecks and a pig cannot taste chili at all.',
      trait: 'Chalk hits numb a pig so its hits build no pepper',
      moves: [
        { name: 'Chalk Peck', kind: 'single', mult: 1.0, pepperDry: 3, weight: 3 },
        { name: 'Grit Gale', kind: 'aoe', mult: 0.45, pepperDry: 2, weaken: 1, icon: '🌫️', cd: 2, weight: 2 },
      ],
    },
    brinewretch: {
      name: 'Brine Wretch', art: 'brinewretch', hp: 208, atk: 21, role: 'Disruptor',
      lore: 'It spits salt water down a pig\'s throat and the chili goes out like a candle.',
      trait: 'Salt hits numb the squad and wash shields away',
      moves: [
        { name: 'Salt Gulp', kind: 'single', mult: 1.05, pepperDry: 3, drench: 1, weight: 3 },
        { name: 'Pickle Spray', kind: 'multi', mult: 0.5, hits: 2, pepperDry: 2, weight: 2 },
      ],
    },

    /* ---- thorn flock: hit them and they hit back ---- */
    bristleback: {
      name: 'Bristleback', art: 'bristleback', hp: 235, atk: 18, armor: 0.08, thorns: 0.4, role: 'Bruiser',
      lore: 'A dusty bird armoured in quills. Every pig that lands a hit takes a faceful of them.',
      trait: 'Thorns: strikes back for 40% of its damage when hit · mires a pig so the flock steals its healing',
      moves: [
        { name: 'Quill Lunge', kind: 'single', mult: 1.0, mire: 3, weight: 3 },
        { name: 'Bristle Burst', kind: 'aoe', mult: 0.45, mire: 2, icon: '🪶', cd: 2, weight: 2 },
      ],
    },
    spikegull: {
      name: 'Spike Gull', art: 'spikegull', hp: 195, atk: 20, thorns: 0.35, role: 'Bruiser',
      lore: 'A shore gull with salt-crusted spines. Hitting it is the second worst part of the fight.',
      trait: 'Thorns: strikes back for 35% of its damage when hit · mire steals healing for the flock',
      moves: [
        { name: 'Spine Dive', kind: 'single', mult: 1.05, mire: 3, drench: 1, weight: 3 },
        { name: 'Salt Screech', kind: 'aoe', mult: 0.4, silence: 1, weight: 1 },
      ],
    },

    /* ---- gimmick flock: lockers, poisoners and chargers ---- */
    vulture: {
      name: 'Bone Picker', art: 'terence', hp: 88, atk: 15, flying: true,
      lore: 'Circles high above until it picks one pig out of the line, then never looks at anyone else.',
      trait: 'Marks one pig for 2 rounds',
      moves: [
        { name: 'Carrion Peck', kind: 'single', mult: 1.0, weight: 3 },
        { name: 'Mark Prey', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
      ],
    },
    spitter: {
      name: 'Venom Spitter', art: 'blue', hp: 74, atk: 13,
      lore: 'It chews something awful and spits it. The wound keeps working long after the bird is gone.',
      trait: 'Poison: 6% max HP a round',
      moves: [
        { name: 'Quick Peck', kind: 'single', mult: 0.85, weight: 3 },
        { name: 'Venom Spit', kind: 'single', mult: 0.6, poison: 3, weight: 2 },
        { name: 'Acid Rain', kind: 'aoe', mult: 0.3, poison: 2, icon: '☠️', cd: 2, weight: 1 },
      ],
    },
    shrike: {
      name: 'Thorn Shrike', art: 'chuck', hp: 120, atk: 18, armor: 0.08,
      lore: 'Every feather on it is a needle loaded with whatever it last ate.',
      trait: 'Poisons and silences',
      moves: [
        { name: 'Needle Volley', kind: 'multi', mult: 0.45, hits: 3, weight: 3 },
        { name: 'Thorn Prick', kind: 'single', mult: 0.8, poison: 2, silence: 1, weight: 2 },
      ],
    },
    ram: {
      name: 'Boulder Ram', art: 'bomb', hp: 240, atk: 20, armor: 0.18, big: true,
      lore: 'It has been walking downhill at the pigs for three days and it is not going to stop now.',
      trait: 'Charges 3 rounds, then flattens a pig',
      moves: [
        { name: 'Headbutt', kind: 'single', mult: 1.1, weight: 2 },
        { name: 'Rock Rush', kind: 'charge', rounds: 3, mult: 2.3, stun: 1, weight: 2 },
      ],
    },
    /* ---- one summoner per world: they call in more birds mid-fight ---- */
    nestkeeper: {
      name: 'Brood Keeper', art: 'matilda', hp: 110, atk: 12, summoner: true,
      lore: 'Sits on the nest and shrieks. Every shriek brings another bird down out of the trees.',
      trait: 'Summons reinforcements',
      moves: [
        { name: 'Brood Call', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Wing Buffet', kind: 'single', mult: 0.8, weight: 2 },
      ],
    },
    canyoncaller: {
      name: 'Canyon Herald', art: 'hal', hp: 150, atk: 15, summoner: true,
      lore: 'Its cry bounces off the canyon walls until birds from miles away come to see what died.',
      trait: 'Summons reinforcements',
      moves: [
        { name: 'Echo Summons', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Boomerang Call', kind: 'aoe', mult: 0.45, weight: 2 },
      ],
    },
    frostcaller: {
      name: 'Rime Caller', art: 'stella', hp: 190, atk: 18, summoner: true, armor: 0.1,
      lore: 'It sings one long note and the whole mountain answers with wings.',
      trait: 'Summons reinforcements',
      moves: [
        { name: 'Winter Summons', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Cold Shriek', kind: 'single', mult: 0.7, poison: 2, weight: 2 },
      ],
    },
    harrier: {
      name: 'Dune Harrier', art: 'matilda', hp: 96, atk: 17, flying: true,
      lore: 'Hunts in low passes, picking the same pig out of the mud over and over.',
      trait: 'Locks one pig for 2 rounds',
      moves: [
        { name: 'Swoop Strike', kind: 'single', mult: 1.15, weight: 3 },
        { name: 'Shadow the Prey', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
      ],
    },

    /* ---- Saltwind Shore: beach flock ---- */
    gull: {
      name: 'Salt Gull', art: 'blue', hp: 96, atk: 15, flying: true,
      lore: 'A beach thief with wings. It will take your lunch and then your health bar.',
      trait: 'Snatches twice, dodges 20%',
      moves: [
        { name: 'Dive Peck', kind: 'single', mult: 1.0, weight: 3 },
        { name: 'Double Snatch', kind: 'multi', mult: 0.55, hits: 2, weight: 2 },
        { name: 'Tide Call', kind: 'summon', icon: '🥚', cd: 3, weight: 1 },
      ],
    },
    tern: {
      name: 'Sea Tern', art: 'chuck', hp: 62, atk: 13, flying: true,
      lore: 'Small, fast, and never alone. The terns arrive in threes.',
      trait: 'Fast triple pecks',
      moves: [
        { name: 'Skim Peck', kind: 'single', mult: 0.9, weight: 3 },
        { name: 'Dive Line', kind: 'multi', mult: 0.45, hits: 3, random: true, weight: 2 },
      ],
    },
    pelican: {
      name: 'Pelican Galleon', art: 'terence', hp: 168, atk: 18, armor: 0.1,
      lore: 'It carries half the ocean in its beak and drops it, without warning, on pigs.',
      trait: 'Heavy hitter with 10% armour',
      moves: [
        { name: 'Beak Slam', kind: 'single', mult: 1.3, weight: 3 },
        { name: 'Scoop', kind: 'single', mult: 0.85, stun: 1, weight: 2 },
        { name: 'Belly Flop', kind: 'aoe', mult: 0.62, icon: '💥', cd: 2, weight: 1 },
      ],
    },
    heron: {
      name: 'Heron Stalker', art: 'matilda', hp: 108, atk: 16, flying: true,
      lore: 'Stands dead still in the shallows until every pig is looking somewhere else.',
      trait: 'Marks one pig for the flock',
      moves: [
        { name: 'Spear Beak', kind: 'single', mult: 1.1, weight: 3 },
        { name: 'Tide Mark', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
      ],
    },
    albatross: {
      name: 'Storm Albatross', art: 'hal', hp: 132, atk: 14, flying: true,
      lore: 'Never lands, never stops, and lets the wind do half the work.',
      trait: 'Gusts hit the whole squad',
      moves: [
        { name: 'Long Glide', kind: 'single', mult: 0.95, weight: 3 },
        { name: 'Gale Wing', kind: 'aoe', mult: 0.55, weaken: 2, icon: '🪶', cd: 2, weight: 1 },
      ],
    },
    reefcaller: {
      name: 'Reef Caller', art: 'stella', hp: 176, atk: 15, summoner: true, armor: 0.08,
      lore: 'It shrieks into the surf, and the shallows answer with wings.',
      trait: 'Summons reinforcements',
      moves: [
        { name: 'Shoal Summons', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
        { name: 'Salt Spray', kind: 'single', mult: 0.75, poison: 2, weight: 2 },
      ],
    },
    tidewarden: {
      name: 'Tide Warden', art: 'mother', hp: 1750, atk: 36, boss: true, haunt: true, armor: 0.15,
      /* Half health: the sea comes in, and it brings company. */
      phase2: { at: 0.5, drench: 2, shield: 0.2, sum: 1, banner: 'CALLS THE RIPTIDE!' },
      lore: 'The sea grew feathers. The Warden owns every beach the pigs ever loved, and it is not giving them back.',
      trait: 'Boss: 1,600 HP, armour, shields, summons every 2 rounds',
      moves: [
        { name: 'Wave Crash', kind: 'aoe', mult: 0.78, weight: 2 },
        { name: 'Undertow', kind: 'single', mult: 1.6, weight: 2 },
        { name: 'Salt Surge', kind: 'shieldAll', shield: 0.2, heal: 0.1, icon: '🫧', cd: 3, weight: 1 },
        { name: 'Kraken Call', kind: 'summon', icon: '🥚', cd: 3, weight: 1 },
      ],
    },
  },

  /* ---------------- Levels ---------------- */
  /* enemy entries: [templateId, hpMul, atkMul] */
  _levelRows: [
    /* ---------------- World 1: Egg World ---------------- */
    { id: 'e1', world: 1, name: 'Trespassers', lore: 'The flock has found the egg stores. Corporal Pig stands alone at the gate.', e: [['red', 0.46, 0.42]] },
    { id: 'e2', world: 1, name: 'Basket Case', lore: 'Two scouts are making off with the breakfast eggs.', e: [['chuck', 0.51, 0.47]] },
    { id: 'e4', world: 1, name: 'Feathered Foes', lore: 'Chuck hits twice and never stops talking about it.', e: [['blue', 0.56, 0.51]] },
    { id: 'e5', world: 1, name: 'Cracking Point', lore: 'A blue jay splits into three little problems.', e: [['red', 0.61, 0.55], ['red', 0.65, 0.60]] },
    { id: 'e6', world: 1, name: 'Nest Raid', lore: 'Chef Pig joins with a frying pan and strong opinions.', e: [['chuck', 0.66, 0.59], ['chuck', 0.71, 0.64]] },
    { id: 'e7', world: 1, name: 'Boom Squad', lore: 'Matilda keeps patching up the flock. Knock out the nurse first.', elite: true, e: [['blue', 0.71, 0.63], ['blue', 0.76, 0.69]] },
    { id: 'e9', world: 1, name: 'Boomerang Band', lore: 'Bomb has a fuse and very little patience.', e: [['red', 0.76, 0.68], ['red', 0.81, 0.73]] },
    { id: 'e10', world: 1, name: 'Big Red', lore: 'Hal throws a boomerang. It comes back. Twice.', e: [['chuck', 0.81, 0.72], ['bomb', 0.87, 0.78]] },
    { id: 'e12', world: 1, name: 'Egg Fortress', lore: 'Terence does not speak. Terence pecks.', e: [['blue', 0.86, 0.76], ['hal', 0.92, 0.83], ['blue', 0.98, 0.76]] },
    { id: 'e13', world: 1, name: 'Air Raid', lore: 'Three jays in the sky and one very loud escort.', e: [['matilda', 0.92, 0.80], ['red', 0.98, 0.87], ['matilda', 1.03, 0.80]] },
    { id: 'e14', world: 1, name: 'Bomb Brigade', lore: 'The flock has found the egg stores. Corporal Pig stands alone at the gate.', e: [['bomb', 0.97, 0.85], ['chuck', 1.03, 0.92], ['bomb', 1.09, 0.85]] },
    { id: 'e15', world: 1, name: 'Elite Flock', lore: 'Two scouts are making off with the breakfast eggs.', elite: true, e: [['hal', 1.02, 0.89], ['blue', 1.08, 0.96], ['hal', 1.15, 0.89]] },
    { id: 'e16', world: 1, name: 'The Last Nest', lore: 'Chuck hits twice and never stops talking about it.', e: [['red', 1.07, 0.93], ['matilda', 1.14, 1.01], ['red', 1.21, 0.93]] },
    { id: 'e17', world: 1, name: 'Feather Line', lore: 'A blue jay splits into three little problems.', e: [['chuck', 1.12, 0.97], ['bomb', 1.19, 1.06], ['chuck', 1.26, 0.97]] },
    { id: 'e26', world: 1, name: 'Scrap Patrol', lore: 'Chef Pig joins with a frying pan and strong opinions.', e: [['chuck', 1.17, 1.02], ['matilda', 1.24, 1.10], ['bubbles', 1.32, 1.02]] },
    { id: 'e27', world: 1, name: 'Cliff Run', lore: 'Matilda keeps patching up the flock. Knock out the nurse first.', e: [['chuck', 1.22, 1.06], ['matilda', 1.30, 1.15], ['bubbles', 1.38, 1.06]] },
    { id: 'e28', world: 1, name: 'Nest Breakers', lore: 'Bomb has a fuse and very little patience.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e29', world: 1, name: 'Double Trouble', lore: 'Hal throws a boomerang. It comes back. Twice.', elite: true, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e30', world: 1, name: 'Sky Gauntlet', lore: 'Terence does not speak. Terence pecks.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e19', world: 1, name: 'Mighty Eagle', lore: 'The Mighty Eagle himself has come for the last egg.', boss: true, e: [['eagle', 1.0, 0.95], ['bomb', 1.05, 0.9], ['matilda', 1.05, 0.9]], tip: 'The Eagle hits everyone and calls in a fresh bird every 2 rounds. Keep shields and soup ready.' },
    { id: 'e40', world: 1, name: 'Left Lane', lore: 'A side road. The birds use it as a shortcut too.', elite: false, e: [['chuck', 1.24, 1.08], ['bomb', 1.32, 1.17], ['chuck', 1.40, 1.08]] },
    { id: 'e41', world: 1, name: 'Scrap Heap', lore: 'A side road. The birds use it as a shortcut too.', elite: true, e: [['blue', 1.24, 1.08], ['hal', 1.32, 1.17], ['blue', 1.40, 1.08]] },
    { id: 'e42', world: 1, name: 'Sky Chase', lore: 'A side road. The birds use it as a shortcut too.', elite: false, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e43', world: 1, name: 'High Perch', lore: 'A side road. The birds use it as a shortcut too.', elite: true, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e44', world: 1, name: 'Wreckage', lore: 'A side road. The birds use it as a shortcut too.', elite: false, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e45', world: 1, name: 'Right Lane', lore: 'A side road. The birds use it as a shortcut too.', elite: true, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e46', world: 1, name: 'Cliff Cache', lore: 'A side road. The birds use it as a shortcut too.', elite: false, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e47', world: 1, name: 'Wind Gap', lore: 'A side road. The birds use it as a shortcut too.', elite: true, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e48', world: 1, name: 'Long Drop', lore: 'A side road. The birds use it as a shortcut too.', elite: false, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e49', world: 1, name: 'Ridge Watch', lore: 'A side road. The birds use it as a shortcut too.', elite: true, e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e50', world: 1, name: 'Dark Hollow', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e51', world: 1, name: 'Cold Mouth', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e52', world: 1, name: 'Deep Shaft', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e54', world: 1, name: 'Echo Chamber', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e55', world: 1, name: 'Treasure Room', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e56', world: 1, name: 'Flooded Gallery', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e57', world: 1, name: 'Old Mines', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },
    { id: 'e58', world: 1, name: 'Crystal Hall', lore: 'Inside the cave it is dark, damp and full of feathers.', e: [['chuck', 1.24, 1.08], ['matilda', 1.32, 1.17], ['bubbles', 1.40, 1.08]] },

    /* ---------------- World 2: Cuckoo Canyon ---------------- */
    { id: 'c1', world: 2, name: 'Dust Devils', lore: 'The flock regrouped in the canyon. They brought snacks.', e: [['red', 0.7, 0.6], ['red', 0.7, 0.6]] },
    { id: 'c2', world: 2, name: 'Sand Storm', lore: 'Three jays ride the dust. Aim carefully.', e: [['blue', 0.75, 0.65], ['blue', 0.75, 0.65], ['red', 0.75, 0.62], ['diver', 0.7, 0.62]] },
    { id: 'c4', world: 2, name: 'Chuck Wagon', lore: 'Chuck brought a wagon and a grudge.', e: [['chuck', 0.85, 0.7], ['chuck', 0.85, 0.7]] },
    { id: 'c5', world: 2, name: 'Nitro Nest', lore: 'Bombs in a canyon: what could go wrong.', e: [['bomb', 0.9, 0.7], ['red', 0.9, 0.7]], tip: 'Bombs hit everyone. Kill them before the fuse runs out.' },
    { id: 'c20', world: 2, name: 'Rock Slide', lore: 'The low road is blocked by a wall of angry bird. Mostly Terence.', elite: true, e: [['terence', 0.7, 0.68], ['hal', 0.95, 0.78]] },
    { id: 'c6', world: 2, name: 'Feather Fury', lore: 'Hal and the jays are playing catch with the pigs.', e: [['hal', 0.95, 0.75], ['blue', 0.9, 0.72], ['red', 0.9, 0.7]] },
    { id: 'c21', world: 2, name: 'Tumbleweed', lore: 'The high road is watched by two birds with very fancy tricks.', elite: true, e: [['bubbles', 0.95, 0.78], ['stella', 0.95, 0.78]] },
    { id: 'c7', world: 2, name: 'Bubble Trouble', lore: 'Bubbles pops in. Bubbles pops everything.', e: [['bubbles', 0.95, 0.75], ['blue', 0.9, 0.72]], tip: 'Bubbles hits several pigs at once. Spread your shields.' },
    { id: 'c9', world: 2, name: 'Nest Egg', lore: 'Matilda is guarding something warm and valuable.', e: [['matilda', 1.0, 0.8], ['chuck', 1.0, 0.78], ['matilda', 0.95, 0.75]] },
    { id: 'c10', world: 2, name: 'Hard Rock', lore: 'Terence in a canyon. The acoustics are terrible.', elite: true, e: [['terence', 0.78, 0.72], ['hal', 1.0, 0.82]] },
    { id: 'c11', world: 2, name: 'Sky Pirates', lore: 'Stella shields the flock while Bubbles does the rest.', e: [['stella', 1.0, 0.8], ['bubbles', 1.0, 0.78], ['blue', 0.95, 0.75]] },
    { id: 'c13', world: 2, name: 'The Long Drop', lore: 'One wrong step and it is a very long way down.', e: [['terence', 0.9, 0.85], ['bomb', 1.05, 0.85]] },
    { id: 'c14', world: 2, name: 'Shell Shock', lore: 'Two bombs and a nurse. The classics never die.', e: [['bomb', 1.05, 0.85], ['bomb', 1.05, 0.85], ['matilda', 1.05, 0.82]] },
    { id: 'c15', world: 2, name: 'Canyon King', lore: 'Terence has a canyon now. He is very proud.', e: [['camel', 0.5, 0.9], ['chuck', 1.1, 0.85], ['stella', 1.1, 0.85]] },
    { id: 'c16', world: 2, name: 'Storm Flock', lore: 'A full flight of birds, riding the wind.', e: [['stella', 1.05, 0.9], ['bubbles', 1.05, 0.9], ['hal', 1.05, 0.85]] },
    { id: 'c17', world: 2, name: 'The Last Stand', lore: 'The flock makes its final stand before the nest.', elite: true, e: [['terence', 1.05, 0.95], ['bomb', 1.15, 0.9], ['matilda', 1.1, 0.9]] },
    { id: 'c19', world: 2, name: 'Mother Flock', lore: 'The mother of every angry bird has come to take the eggs herself.', boss: true, e: [['mother', 1.0, 0.95], ['bubbles', 1.15, 0.9], ['stella', 1.15, 0.9]], tip: 'Mother Flock shields her brood, hits everyone and summons every 2 rounds. Silence her.' },
    /* World 2 — mini cave (3 levels + relic shop) */
    { id: 'c30', world: 2, name: 'Crumbling Shaft', lore: 'A crack in the canyon floor. Something is nesting in the rubble.', e: [['blue', 1.0, 0.85], ['red', 1.0, 0.85]] },
    { id: 'c31', world: 2, name: 'Echo Well', lore: 'Every clang comes back twice. The birds like the noise.', e: [['chuck', 1.05, 0.9], ['hal', 1.05, 0.9], ['blue', 1.0, 0.85]] },
    { id: 'c32', world: 2, name: 'Sunken Cache', lore: 'Old pig treasure, new bird owners.', elite: true, e: [['bomb', 1.1, 0.95], ['matilda', 1.1, 0.9]] },
    { id: 'c33', world: 2, name: 'Relic Vault', lore: 'A vault the old pigs left behind. The relics still hum.', e: [['red', 0.9, 0.8]] },
    /* World 2 — big cave (5 levels + relic shop) */
    { id: 'c34', world: 2, name: 'Beetle Tunnels', lore: 'Narrow tunnels, wide birds. Awkward all round.', e: [['blue', 1.1, 0.95], ['blue', 1.1, 0.95], ['red', 1.05, 0.9]] },
    { id: 'c35', world: 2, name: 'Dust Bath', lore: 'A hot dust vent, and a flock that will not share it.', e: [['chuck', 1.1, 0.95], ['hal', 1.15, 1.0]] },
    { id: 'c36', world: 2, name: 'Rusted Gate', lore: 'A rusted gate, a rusted temper, a very large bird.', elite: true, e: [['camel', 0.45, 1.0], ['bubbles', 1.15, 0.95]] },
    { id: 'c37', world: 2, name: 'Deep Nest', lore: 'The nest down here is old and full of things that glint.', e: [['matilda', 1.2, 1.0], ['stella', 1.2, 1.0], ['chuck', 1.15, 0.95]] },
    { id: 'c38', world: 2, name: 'The Long Dark', lore: 'The last chamber. No light, no backup, only birds.', elite: true, e: [['mother', 0.4, 0.95], ['bomb', 1.2, 1.0]] },
    { id: 'c39', world: 2, name: 'Relic Vault', lore: 'A sealed vault at the bottom of the cave. Relics for whoever survives.', e: [['stella', 0.95, 0.85]] },

    /* ---------------- World 3: Frost Peak ---------------- */
    /* ---------------- World 3: Frost Peak ---------------- */
    { id: 'f1', world: 3, name: 'Frozen Gate', lore: 'Snow to the horizon. The first scouts are already shivering with rage.', e: [['red', 0.95, 0.85], ['red', 0.95, 0.85]], tip: 'Frost birds chill your pigs. Shield early.' },
    { id: 'f2', world: 3, name: 'Icicle Ridge', lore: 'The path climbs an icicle ridge. One slip and it is a long way down.', e: [['frost', 0.9, 0.85], ['blue', 1.0, 0.88], ['sparrow', 0.95, 0.85], ['sparrow', 0.95, 0.85]] },
    { id: 'f4', world: 3, name: 'Balloon Patrol', lore: 'Helium birds drift overhead, dropping snowballs.', e: [['balloon', 1.0, 0.9], ['balloon', 1.0, 0.9], ['chuck', 1.0, 0.9]] },
    { id: 'f5', world: 3, name: 'Deep Freeze', lore: 'The low route runs through a frozen cave. Something large is breathing in there.', elite: true, e: [['yeti', 0.7, 0.75], ['frost', 1.05, 0.9]] },
    { id: 'f20', world: 3, name: 'Snowdrift Ambush', lore: 'Two birds buried in a drift. Classic.', elite: true, e: [['frost', 1.1, 0.95], ['chuck', 1.1, 0.95]] },
    { id: 'f6', world: 3, name: 'Thin Ice', lore: 'The high route crosses a frozen lake. It is cracking.', e: [['blue', 1.1, 0.95], ['balloon', 1.1, 0.95]] },
    { id: 'f21', world: 3, name: 'Aurora Watch', lore: 'The birds watch the northern lights and plan raids by them.', elite: true, e: [['stella', 1.15, 1.0], ['frost', 1.1, 0.95]] },
    { id: 'f7', world: 3, name: 'Blizzard Camp', lore: 'A full patrol in the white-out. You can barely see them coming.', e: [['frost', 1.1, 1.0], ['chuck', 1.1, 1.0], ['blue', 1.1, 0.98]] },
    { id: 'f9', world: 3, name: 'Frozen Nest', lore: 'Matilda guards a nest packed in ice.', e: [['matilda', 1.15, 1.0], ['frost', 1.15, 1.0], ['red', 1.15, 1.0]] },
    { id: 'f10', world: 3, name: 'Shell Snow', lore: 'Bombs rolled in snow. They still go off.', elite: true, e: [['bomb', 1.2, 1.0], ['frost', 1.15, 1.0]] },
    { id: 'f11', world: 3, name: 'Peak Patrol', lore: 'The flock patrols the shelf road in threes.', e: [['balloon', 1.15, 1.0], ['blue', 1.15, 1.0], ['hawk', 1.15, 1.0], ['frostwall', 0.35, 0.85]] },
    { id: 'f13', world: 3, name: 'White Fang', lore: 'A yeti bird blocks the pass and does not negotiate.', elite: true, e: [['yeti', 0.9, 0.95], ['frost', 1.15, 1.0], ['rimeweaver', 1.0, 0.95]] },
    { id: 'f18', world: 3, name: 'Mammoth Pass', lore: 'A woolly mountain with a beak. The ground shakes before it even swings.', elite: true, e: [['mammoth', 0.85, 0.9], ['balloon', 1.15, 1.0], ['frostwall', 0.85, 0.9]], tip: 'Armour 28% — burn and silence it; big single hits beat small chips.' },
    { id: 'f14', world: 3, name: 'Crevasse', lore: 'The low shelf drops into blue ice.', e: [['frost', 1.2, 1.05], ['frost', 1.2, 1.05], ['matilda', 1.2, 1.0]] },
    { id: 'f15', world: 3, name: 'Gale Force', lore: 'Wind so strong the balloon birds are barely controllable.', elite: true, e: [['balloon', 1.2, 1.05], ['stella', 1.2, 1.05], ['bubbles', 1.2, 1.05], ['rimeweaver', 1.05, 1.0]] },
    { id: 'f16', world: 3, name: 'Avalanche', lore: 'Terence starts an avalanche on purpose. He thinks it is funny.', e: [['terence', 1.1, 1.05], ['frost', 1.25, 1.05]] },
    { id: 'f17', world: 3, name: 'The Last Cold', lore: 'The summit guard. Nothing gets past here.', elite: true, e: [['yeti', 1.0, 1.05], ['bomb', 1.3, 1.1], ['matilda', 1.25, 1.05]] },
    { id: 'f19', world: 3, name: 'The Frost King', lore: 'On the highest peak sits a bird wearing a crown of ice. He has been waiting.', boss: true, e: [['terence', 1.35, 1.15], ['frost', 1.3, 1.1], ['balloon', 1.3, 1.1]], tip: 'The Frost King freezes the whole squad and summons every 2 rounds. Keep heals ready and burst the adds.' },
    /* World 3 — mini cave (3 levels + relic shop) */
    { id: 'f30', world: 3, name: 'Snow Burrow', lore: 'A burrow dug under the snow. Warm, and absolutely occupied.', e: [['frost', 1.15, 1.0], ['chuck', 1.15, 1.0]] },
    { id: 'f31', world: 3, name: 'Frozen Hollow', lore: 'The hollow rings like a bell when the pigs walk in.', e: [['balloon', 1.2, 1.05], ['blue', 1.2, 1.05], ['frost', 1.15, 1.0]] },
    { id: 'f32', world: 3, name: 'Crystal Pocket', lore: 'Blue crystals everywhere. Something big is sleeping behind them.', elite: true, e: [['yeti', 0.85, 1.0], ['stella', 1.2, 1.0], ['icefall', 0.85, 0.95], ['frostbinder', 1.0, 0.9]] },
    { id: 'f33', world: 3, name: 'Relic Vault', lore: 'A vault under the ice, humming with old pig magic.', e: [['frost', 0.95, 0.85]] },
    /* World 3 — big cave (6 levels + relic shop) */
    { id: 'f34', world: 3, name: 'Ice Maw', lore: 'The cave mouth is ringed with teeth of ice.', e: [['frost', 1.2, 1.05], ['frost', 1.2, 1.05], ['red', 1.15, 1.0]] },
    { id: 'f35', world: 3, name: 'Frozen Gallery', lore: 'Birds frozen mid-flight in the walls. The live ones are not frozen.', e: [['balloon', 1.25, 1.1], ['chuck', 1.2, 1.05]] },
    { id: 'f36', world: 3, name: 'Yeti Den', lore: 'Warm bones, cold air, and a very large tenant.', elite: true, e: [['yeti', 1.0, 1.1], ['frost', 1.25, 1.05]] },
    { id: 'f37', world: 3, name: 'Blue Deep', lore: 'The ice down here is so old it glows.', e: [['matilda', 1.25, 1.05], ['stella', 1.25, 1.05], ['blue', 1.25, 1.05]] },
    { id: 'f38', world: 3, name: 'The Long Cold', lore: 'A corridor of wind. Nothing survives standing still.', e: [['terence', 1.15, 1.1], ['bomb', 1.3, 1.1]] },
    { id: 'f39', world: 3, name: 'Heart of Frost', lore: 'The deepest chamber. The cold itself has feathers.', elite: true, e: [['frost', 1.35, 1.15], ['yeti', 0.95, 1.1], ['stella', 1.3, 1.05]] },
    { id: 'f40', world: 3, name: 'Relic Vault', lore: 'The last vault. Only the strongest pigs ever see it.', e: [['yeti', 0.9, 0.9]] },

    /* ---------------- World 4: Saltwind Shore ---------------- */
    { id: 's1', world: 4, name: 'Foam Line', lore: 'Surf, sand and the first birds of the shore. They are not surprised to see pigs.', e: [['gull', 0.95, 0.85], ['tern', 0.95, 0.85]] },
    { id: 's2', world: 4, name: 'Tide Pools', lore: 'Two terns and a gull argue over a rock pool. The pigs are the tie-breaker.', e: [['tern', 1.0, 0.9], ['tern', 1.0, 0.9], ['gull', 1.0, 0.88]] },
    { id: 's4', world: 4, name: 'Beak Band', lore: 'A gull and an albatross working the same stretch of beach.', e: [['gull', 1.05, 0.9], ['albatross', 1.0, 0.85]] },
    { id: 's5', world: 4, name: 'Sand Castle', lore: 'The low road runs past a castle of sand with something enormous asleep behind it.', elite: true, e: [['kraken', 0.45, 0.8], ['tern', 1.05, 0.9], ['tidewall', 0.42, 0.85]] },
    { id: 's20', world: 4, name: 'Dune Ambush', lore: 'A heron in the dunes, and the terns it brought along.', elite: true, e: [['heron', 1.05, 0.9], ['tern', 1.1, 0.9]] },
    { id: 's6', world: 4, name: 'Salt Flats', lore: 'The high road crosses cracked salt. Everything here is white and loud.', e: [['albatross', 1.05, 0.9], ['gull', 1.05, 0.9]] },
    { id: 's21', world: 4, name: 'Shell Beach', lore: 'Broken shells underfoot and a pelican that has decided this is its beach.', elite: true, e: [['pelican', 0.9, 0.9], ['heron', 1.1, 0.95]] },
    { id: 's7', world: 4, name: 'Low Tide', lore: 'The water pulls back and the whole flock comes out to walk on the flats.', e: [['tern', 1.1, 1.0], ['gull', 1.1, 1.0], ['heron', 1.1, 1.0]] },
    { id: 's9', world: 4, name: 'Wreck Cove', lore: 'An old hull, half in the sand, and birds nesting in the ribs, among the mirrors.', e: [['albatross', 1.15, 1.0], ['pelican', 0.95, 0.95], ['gull', 1.1, 1.0], ['magpie', 1.0, 0.95]] },
    { id: 's10', world: 4, name: 'Gull Roost', lore: 'A reef caller on the rocks, and more gulls than the rocks can hold.', elite: true, e: [['reefcaller', 0.95, 0.95], ['gull', 1.15, 1.0], ['tideseer', 0.95, 0.9]] },
    { id: 's11', world: 4, name: 'Pier Run', lore: 'Along the pier, under the boards, two birds with nowhere else to be.', e: [['pelican', 1.0, 1.0], ['tern', 1.15, 1.0], ['reefbulwark', 0.95, 0.95], ['brinebinder', 1.0, 0.9]] },
    { id: 's13', world: 4, name: 'Brine Marsh', lore: 'Salt marsh and slow water. Everything here bites.', e: [['heron', 1.2, 1.0], ['gull', 1.2, 1.0], ['albatross', 1.15, 1.0], ['tidewall', 0.9, 1.0]] },
    { id: 's14', world: 4, name: 'Rip Current', lore: 'The low road runs along a rip that has already taken three pigs.', elite: true, e: [['albatross', 1.25, 1.05], ['pelican', 1.0, 1.0]] },
    { id: 's15', world: 4, name: 'Lighthouse', lore: 'From the top, the flock looks very small. Then it flies at you.', e: [['reefcaller', 1.05, 1.05], ['tern', 1.25, 1.05], ['tideseer', 1.0, 1.0]] },
    { id: 's16', world: 4, name: 'Shoal Break', lore: 'The high road breaks across the shoal. Something in the water is watching.', elite: true, e: [['pelican', 1.1, 1.05], ['heron', 1.25, 1.05]] },
    { id: 's17', world: 4, name: 'The Last Beach', lore: 'The last dry sand before the deep water, and the whole shore is waiting on it.', elite: true, e: [['albatross', 1.3, 1.1], ['reefcaller', 1.15, 1.1], ['pelican', 1.2, 1.1]] },
    { id: 's19', world: 4, name: 'Tide Warden', lore: 'Out past the breakers, the sea has grown feathers. It has been waiting for a pig to try.', boss: true, e: [['tidewarden', 1.0, 0.95], ['gull', 1.15, 0.95], ['pelican', 1.1, 0.95]], tip: 'The Warden shields the shoal, hits everyone and summons every 2 rounds. Silence her, then burst the gulls.' },
    /* World 4 — mini cave (3 levels + relic shop) */
    { id: 's30', world: 4, name: 'Barnacle Cave', lore: 'A cave under the cliff, ringed with barnacles and birds.', e: [['gull', 1.15, 1.0], ['tern', 1.15, 1.0]] },
    { id: 's31', world: 4, name: 'Tidal Cave', lore: 'The water comes in twice a day. It is coming in now.', e: [['heron', 1.2, 1.05], ['albatross', 1.2, 1.05], ['tern', 1.15, 1.0]] },
    { id: 's32', world: 4, name: 'Pearl Pocket', lore: 'Something in here glints, and something in here guards it.', elite: true, e: [['pelican', 1.05, 1.05], ['reefcaller', 1.15, 1.0], ['reefbulwark', 0.85, 0.95], ['brinebinder', 1.0, 0.9]] },
    /* World 4 — big cave (6 levels + relic shop) */
    { id: 's34', world: 4, name: 'Coral Throat', lore: 'Coral so sharp the pigs have to walk single file. The terns do not.', e: [['tern', 1.25, 1.1], ['tern', 1.25, 1.1], ['gull', 1.2, 1.05]] },
    { id: 's35', world: 4, name: 'Sunken Gallery', lore: 'An old hall, half drowned, with an albatross on every ledge.', e: [['albatross', 1.3, 1.1], ['heron', 1.25, 1.1]] },
    { id: 's36', world: 4, name: 'Kraken Den', lore: 'The den is warm and the walls are wet. Something calls, and wings answer.', elite: true, e: [['kraken', 0.55, 1.1], ['reefcaller', 1.25, 1.05]] },
    { id: 's37', world: 4, name: 'Deep Blue', lore: 'The water down here is so clear it looks shallow. It is not.', e: [['heron', 1.3, 1.1], ['albatross', 1.3, 1.1], ['tern', 1.3, 1.1]] },
    { id: 's38', world: 4, name: 'The Long Wash', lore: 'A corridor that floods every minute. The Warden keeps a gull here.', e: [['tidewarden', 0.3, 0.95], ['gull', 1.3, 1.1]] },
    { id: 's39', world: 4, name: 'Heart of the Shore', lore: 'The deepest chamber, where the tide never leaves.', elite: true, e: [['albatross', 1.35, 1.15], ['pelican', 1.25, 1.1], ['reefcaller', 1.25, 1.05]] },
  ],

  /* ---------------- Worlds / maps ---------------- */
  worlds: [
    {
      id: 1,
      name: 'Egg World',
      tag: 'The royal egg stores',
      gateStars: 18,
      mapH: 2600,
      theme: 'meadow',
      nodes: [
        { id: 'e1', type: 'battle', x: 350, y: 2400 },
        { id: 'e2', type: 'battle', x: 510, y: 2290 },
        { id: 'e4', type: 'battle', x: 480, y: 2180 },
        { id: 'e5', type: 'battle', x: 297, y: 2070 },
        { id: 'e6', type: 'battle', x: 176, y: 1960 },
        { id: 'e7', type: 'battle', x: 261, y: 1850 },
        { id: 'e9', type: 'battle', x: 451, y: 1740 },
        { id: 'e10', type: 'battle', x: 522, y: 1630 },
        { id: 'e12', type: 'battle', x: 389, y: 1520 },
        { id: 'e13', type: 'battle', x: 210, y: 1410 },
        { id: 'e14', type: 'battle', x: 197, y: 1300 },
        { id: 'e15', type: 'battle', x: 365, y: 1190 },
        { id: 'e16', type: 'battle', x: 515, y: 1080 },
        { id: 'e17', type: 'battle', x: 470, y: 970 },
        { id: 'e26', type: 'battle', x: 283, y: 860 },
        { id: 'e27', type: 'battle', x: 175, y: 750 },
        { id: 'e28', type: 'battle', x: 274, y: 640 },
        { id: 'e29', type: 'battle', x: 463, y: 530 },
        { id: 'e30', type: 'battle', x: 518, y: 420 },
        { id: 'e19', type: 'battle', x: 350, y: 150 },
        { id: 'e40', type: 'battle', x: 96, y: 1868 },
        { id: 'e41', type: 'battle', x: 101, y: 1777 },
        { id: 'e42', type: 'battle', x: 106, y: 1685 },
        { id: 'e43', type: 'battle', x: 111, y: 1593 },
        { id: 'e44', type: 'battle', x: 116, y: 1502 },
        { id: 'e45', type: 'battle', x: 620, y: 1214 },
        { id: 'e46', type: 'battle', x: 657, y: 1112 },
        { id: 'e47', type: 'battle', x: 608, y: 1025 },
        { id: 'e48', type: 'battle', x: 603, y: 933 },
        { id: 'e49', type: 'battle', x: 598, y: 842 },
        { id: 'e50', type: 'battle', x: 80, y: 2264 },
        { id: 'e51', type: 'battle', x: 80, y: 2178 },
        { id: 'e52', type: 'battle', x: 80, y: 2092 },
        { id: 'e53', type: 'shop', relic: true, x: 80, y: 2006 },
        { id: 'e54', type: 'battle', x: 634, y: 537 },
        { id: 'e55', type: 'battle', x: 634, y: 451 },
        { id: 'e56', type: 'battle', x: 634, y: 365 },
        { id: 'e57', type: 'battle', x: 634, y: 279 },
        { id: 'e58', type: 'battle', x: 634, y: 193 },
        { id: 'e59', type: 'shop', relic: true, x: 634, y: 107 },
        { id: 'e3', type: 'shop', x: 564, y: 2128 },
        { id: 'a3', type: 'alchemy', x: 564, y: 2040 },
        { id: 'e8', type: 'craft', x: 305, y: 1558 },
        { id: 'e11', type: 'base', x: 576, y: 1140 },
      ],
      edges: [
        ['e1', 'e2'], ['e2', 'e4'], ['e4', 'e5'], ['e5', 'e6'],
        ['e6', 'e7'], ['e7', 'e9'], ['e9', 'e10'], ['e10', 'e12'],
        ['e12', 'e13'], ['e13', 'e14'], ['e14', 'e15'], ['e15', 'e16'],
        ['e16', 'e17'], ['e17', 'e26'], ['e26', 'e27'], ['e27', 'e28'],
        ['e28', 'e29'], ['e29', 'e30'], ['e30', 'e19'],
        ['e6', 'e40'], ['e44', 'e13'], ['e40', 'e41'], ['e41', 'e42'],
        ['e42', 'e43'], ['e43', 'e44'], ['e14', 'e45'], ['e49', 'e27'],
        ['e45', 'e46'], ['e46', 'e47'], ['e47', 'e48'], ['e48', 'e49'],
        ['e2', 'e50'], ['e50', 'e51'], ['e51', 'e52'], ['e52', 'e53'],
        ['e29', 'e54'], ['e54', 'e55'], ['e55', 'e56'], ['e56', 'e57'],
        ['e57', 'e58'], ['e58', 'e59'],         ['e4', 'e3'], ['e3', 'a3'], ['e12', 'e8'],
        ['e16', 'e11'],
      ],
    },
    {
      id: 2,
      name: 'Cuckoo Canyon',
      tag: 'Red rocks, redder tempers',
      gateStars: 34,
      theme: 'canyon',
      nodes: [
        { id: 'c1', type: 'battle', x: 300, y: 1900 },
        { id: 'c2', type: 'battle', x: 198, y: 1815 },
        { id: 'c3', type: 'shop', x: 466, y: 1735 },
        { id: 'ca3', type: 'alchemy', x: 560, y: 1655 },
        { id: 'c4', type: 'battle', x: 300, y: 1735 },
        { id: 'c5', type: 'battle', x: 170, y: 1655 },
        { id: 'c20', type: 'battle', x: 150, y: 1555 },
        { id: 'c22', type: 'craft', x: 150, y: 1455 },
        { id: 'c6', type: 'battle', x: 430, y: 1655 },
        { id: 'c21', type: 'battle', x: 450, y: 1555 },
        { id: 'c23', type: 'shop', x: 450, y: 1455 },
        { id: 'c7', type: 'battle', x: 300, y: 1380 },
        { id: 'c8', type: 'craft', x: 150, y: 1290 },
        { id: 'c9', type: 'battle', x: 300, y: 1295 },
        { id: 'c10', type: 'battle', x: 460, y: 1210 },
        { id: 'c12', type: 'base', x: 150, y: 1210 },
        { id: 'c11', type: 'battle', x: 300, y: 1210 },
        { id: 'c13', type: 'battle', x: 300, y: 1120 },
        { id: 'c14', type: 'battle', x: 170, y: 1035 },
        { id: 'c15', type: 'battle', x: 300, y: 950 },
        { id: 'c16', type: 'battle', x: 430, y: 865 },
        { id: 'c17', type: 'battle', x: 300, y: 780 },
        { id: 'c19', type: 'battle', x: 300, y: 555 },
        /* mini cave + big cave, each ending in a relic shop */
        { id: 'c30', type: 'battle', x: 62, y: 1145 },
        { id: 'c31', type: 'battle', x: 62, y: 1055 },
        { id: 'c32', type: 'battle', x: 62, y: 965 },
        { id: 'c33', type: 'shop', relic: true, x: 62, y: 870 },
        { id: 'c34', type: 'battle', x: 622, y: 900 },
        { id: 'c35', type: 'battle', x: 622, y: 812 },
        { id: 'c36', type: 'battle', x: 622, y: 724 },
        { id: 'c37', type: 'battle', x: 622, y: 636 },
        { id: 'c38', type: 'battle', x: 622, y: 548 },
        { id: 'c39', type: 'shop', relic: true, x: 622, y: 452 },
      ],
      edges: [
        ['c1', 'c2'],         ['c2', 'c3'], ['c3', 'ca3'], ['c2', 'c4'],
        ['c4', 'c5'], ['c5', 'c20'], ['c20', 'c22'], ['c22', 'c7'],
        ['c4', 'c6'], ['c6', 'c21'], ['c21', 'c23'], ['c23', 'c7'],
        ['c7', 'c8'], ['c7', 'c9'], ['c9', 'c10'], ['c9', 'c12'], ['c9', 'c11'],
        ['c11', 'c13'], ['c13', 'c14'], ['c14', 'c15'], ['c15', 'c16'],
        ['c16', 'c17'], ['c17', 'c19'],
        ['c11', 'c30'], ['c30', 'c31'], ['c31', 'c32'], ['c32', 'c33'],
        ['c16', 'c34'], ['c34', 'c35'], ['c35', 'c36'], ['c36', 'c37'],
        ['c37', 'c38'], ['c38', 'c39'],
      ],
    },
    {
      id: 3,
      name: 'Frost Peak',
      tag: 'The snow age, frozen birds and balloon fliers',
      gateStars: 50,
      theme: 'snow',
      nodes: [
        { id: 'f1', type: 'battle', x: 300, y: 1900 },
        { id: 'f2', type: 'battle', x: 410, y: 1810 },
        { id: 'f3', type: 'shop', x: 470, y: 1710 },
        { id: 'f4', type: 'battle', x: 300, y: 1720 },
        { id: 'f5', type: 'battle', x: 175, y: 1635 },
        { id: 'f20', type: 'battle', x: 150, y: 1535 },
        { id: 'f22', type: 'craft', x: 150, y: 1435 },
        { id: 'f6', type: 'battle', x: 435, y: 1635 },
        { id: 'f21', type: 'battle', x: 455, y: 1535 },
        { id: 'f23', type: 'shop', x: 455, y: 1435 },
        { id: 'f7', type: 'battle', x: 300, y: 1350 },
        { id: 'f8', type: 'craft', x: 150, y: 1255 },
        { id: 'f9', type: 'battle', x: 300, y: 1260 },
        { id: 'f10', type: 'battle', x: 465, y: 1175 },
        { id: 'f12', type: 'base', x: 150, y: 1175 },
        { id: 'f11', type: 'battle', x: 300, y: 1175 },
        { id: 'f13', type: 'battle', x: 300, y: 1085 },
        { id: 'f14', type: 'battle', x: 175, y: 1000 },
        { id: 'f15', type: 'battle', x: 300, y: 915 },
        { id: 'f16', type: 'battle', x: 435, y: 830 },
        { id: 'f17', type: 'battle', x: 300, y: 745 },
        { id: 'f18', type: 'battle', x: 300, y: 645 },
        { id: 'f19', type: 'battle', x: 300, y: 545 },
        /* mini cave + big cave, each ending in a relic shop */
        { id: 'f30', type: 'battle', x: 62, y: 1150 },
        { id: 'f31', type: 'battle', x: 62, y: 1060 },
        { id: 'f32', type: 'battle', x: 62, y: 970 },
        { id: 'f33', type: 'shop', relic: true, x: 62, y: 872 },
        { id: 'f34', type: 'battle', x: 632, y: 890 },
        { id: 'f35', type: 'battle', x: 632, y: 802 },
        { id: 'f36', type: 'battle', x: 632, y: 714 },
        { id: 'f37', type: 'battle', x: 632, y: 626 },
        { id: 'f38', type: 'battle', x: 632, y: 538 },
        { id: 'f39', type: 'battle', x: 632, y: 450 },
        { id: 'f40', type: 'shop', relic: true, x: 632, y: 356 },
      ],
      edges: [
        ['f1', 'f2'], ['f2', 'f3'], ['f2', 'f4'],
        ['f4', 'f5'], ['f5', 'f20'], ['f20', 'f22'], ['f22', 'f7'],
        ['f4', 'f6'], ['f6', 'f21'], ['f21', 'f23'], ['f23', 'f7'],
        ['f7', 'f8'], ['f7', 'f9'], ['f9', 'f10'], ['f9', 'f12'], ['f9', 'f11'],
        ['f11', 'f13'], ['f13', 'f14'], ['f14', 'f15'], ['f15', 'f16'],
        ['f16', 'f17'], ['f17', 'f18'], ['f18', 'f19'],
        ['f13', 'f30'], ['f30', 'f31'], ['f31', 'f32'], ['f32', 'f33'],
        ['f15', 'f34'], ['f34', 'f35'], ['f35', 'f36'], ['f36', 'f37'],
        ['f37', 'f38'], ['f38', 'f39'], ['f39', 'f40'],
      ],
    },
    {
      id: 4,
      name: 'Saltwind Shore',
      tag: 'Beaches, tide pools, and something with tentacles',
      gateStars: 66,
      theme: 'beach',
      nodes: [
        { id: 's1', type: 'battle', x: 300, y: 1900 },
        { id: 's2', type: 'battle', x: 410, y: 1810 },
        { id: 's3', type: 'shop', x: 470, y: 1710 },
        { id: 's4', type: 'battle', x: 300, y: 1720 },
        { id: 's5', type: 'battle', x: 175, y: 1635 },
        { id: 's20', type: 'battle', x: 150, y: 1535 },
        { id: 's22', type: 'craft', x: 150, y: 1435 },
        { id: 's6', type: 'battle', x: 435, y: 1635 },
        { id: 's21', type: 'battle', x: 455, y: 1535 },
        { id: 's23', type: 'shop', x: 455, y: 1435 },
        { id: 's7', type: 'battle', x: 300, y: 1350 },
        { id: 's8', type: 'craft', x: 150, y: 1255 },
        { id: 's9', type: 'battle', x: 300, y: 1260 },
        { id: 's10', type: 'battle', x: 465, y: 1175 },
        { id: 's12', type: 'base', x: 150, y: 1175 },
        { id: 's11', type: 'battle', x: 300, y: 1175 },
        { id: 's13', type: 'battle', x: 300, y: 1085 },
        { id: 's14', type: 'battle', x: 175, y: 1000 },
        { id: 's15', type: 'battle', x: 300, y: 915 },
        { id: 's16', type: 'battle', x: 435, y: 830 },
        { id: 's17', type: 'battle', x: 300, y: 745 },
        { id: 's19', type: 'battle', x: 300, y: 545 },
        /* mini cave + big cave, each ending in a relic shop */
        { id: 's30', type: 'battle', x: 62, y: 1150 },
        { id: 's31', type: 'battle', x: 62, y: 1060 },
        { id: 's32', type: 'battle', x: 62, y: 970 },
        { id: 's33', type: 'shop', relic: true, x: 62, y: 872 },
        { id: 's34', type: 'battle', x: 632, y: 890 },
        { id: 's35', type: 'battle', x: 632, y: 802 },
        { id: 's36', type: 'battle', x: 632, y: 714 },
        { id: 's37', type: 'battle', x: 632, y: 626 },
        { id: 's38', type: 'battle', x: 632, y: 538 },
        { id: 's39', type: 'battle', x: 632, y: 450 },
        { id: 's40', type: 'shop', relic: true, x: 632, y: 356 },
        /* the storm shelf, off the lagoon road */
        { id: 's41', type: 'battle', x: 632, y: 1015 },
        { id: 's43', type: 'battle', x: 632, y: 1130 },
      ],
      edges: [
        ['s1', 's2'], ['s2', 's3'], ['s2', 's4'],
        ['s4', 's5'], ['s5', 's20'], ['s20', 's22'], ['s22', 's7'],
        ['s4', 's6'], ['s6', 's21'], ['s21', 's23'], ['s23', 's7'],
        ['s7', 's8'], ['s7', 's9'], ['s9', 's10'], ['s9', 's12'], ['s9', 's11'],
        ['s11', 's13'], ['s13', 's14'], ['s14', 's15'], ['s15', 's16'],
        ['s16', 's17'], ['s17', 's19'],
        ['s13', 's30'], ['s30', 's31'], ['s31', 's32'], ['s32', 's33'],
        ['s15', 's34'], ['s34', 's35'], ['s35', 's36'], ['s36', 's37'],
        ['s37', 's38'], ['s38', 's39'], ['s39', 's40'],
        ['s10', 's41'], ['s41', 's43'],
      ],
    },
  ],

  /* ---------------- Relics: 3 per pig, tier 1 is free & equipped ---------------- */
  relics: [
    /* --- Corporal Pig (warrior) --- */
    {
      id: 'corporal_r1', hero: 'corporal', tier: 1, starter: true, cost: 0,
      name: "Bonker's Relic", skin: 'Steel Sweeper', tint: '#8fb8ff', sigil: '🔨',
      desc: 'Hammer Bonk sweeps the whole line for 80% and breaks every shield and mirage it touches.',
      mods: { bonk: { name: 'Sweep Bonk', target: 'allEnemies', mult: 0.8, shred: true, desc: 'Hammer sweeps every bird and tears off their wards. Free to use.' } },
      stats: { atk: 0.05, hp: 0.02 },
    },
    {
      id: 'corporal_r2', hero: 'corporal', tier: 2, cost: 6,
      name: 'Quake Sigil', skin: 'Quake Brute', tint: '#e0a14a', sigil: '💫',
      desc: 'Skull Crack becomes Skull Quake: every bird takes 130%, is stunned, and is left open (+18% damage taken, 2 rounds).',
      mods: { skullcrack: { name: 'Skull Quake', target: 'allEnemies', mult: 1.3, stun: 1, vuln: { turns: 2, bonus: 0.18 }, desc: 'Quakes every bird: 130%, stunned a round, and open for the squad.' } },
      stats: { atk: 0.09, hp: 0.03 },
    },
    {
      id: 'corporal_r3', hero: 'corporal', tier: 3, cost: 12,
      name: 'Bulwark Relic', skin: 'Bulwark Warden', tint: '#9fe08a', sigil: '🛡️',
      desc: 'Shield Wall narrows to one pig: 50% less damage for 1 round.',
      mods: { shieldwall: { name: 'Aegis Wall', target: 'ally', shieldSingle: (h) => 72 + 6.5 * h.level, desc: 'One pig only, walled in steel: 50% less damage for 1 round.' } },
      stats: { atk: 0.03, hp: 0.10 },
    },

    /* --- King Pig (tank) --- */
    {
      id: 'king_r1', hero: 'king', tier: 1, starter: true, cost: 0,
      name: 'Royal Benediction', skin: 'Gilded King', tint: '#f7c948', sigil: '👑',
      desc: "King's Wrath heals the King hard and mends every other pig a little.",
      mods: { wrath: { selfHeal: (h) => 34 + 3.2 * h.level, mend: (h) => 8 + 0.9 * h.level, desc: 'Royal slam: a big heal for the King and a small mending for the squad.' } },
      stats: { atk: 0.04, hp: 0.04 },
    },
    {
      id: 'king_r2', hero: 'king', tier: 2, cost: 6,
      name: 'Rust Crown', skin: 'Rust Warlord', tint: '#c07a4a', sigil: '⚙️',
      desc: 'Royal Guard taunts 3 rounds, cuts squad damage 35% for a round, returns 75% of every hit, and rallies (+12%, 3 rounds).',
      mods: { royalguard: { shieldParty: (h) => 18 + 1.8 * h.level, taunt: 3, thorns: 0.75, rally: { turns: 3, mult: 0.12 }, desc: 'Taunts 3 rounds, returns 75% of every hit, shields the squad 35% for a round and rallies them.' } },
      stats: { atk: 0.04, hp: 0.08 },
    },
    {
      id: 'king_r3', hero: 'king', tier: 3, cost: 12,
      name: 'Warlord Crown', skin: 'Warlord of the Mud', tint: '#d04a4a', sigil: '💥',
      desc: 'Royal Smash flattens every bird and strips shields and mirages off the whole flock.',
      mods: { royalsmash: { name: 'Royal Quake', target: 'allEnemies', mult: 0.85, shred: true, desc: 'Flattens every bird and breaks their wards. Free to use.' } },
      stats: { atk: 0.10, hp: 0.04 },
    },

    /* --- Chef Pig (support) --- */
    {
      id: 'chef_r1', hero: 'chef', tier: 1, starter: true, cost: 0,
      name: 'Spice Arsenal', skin: 'Spice Chef', tint: '#f08a4a', sigil: '🌶️',
      desc: 'Hot Soup heals one pig far more, and every other pig gets a sip.',
      mods: { hotsoup: { healSingle: (h) => 52 + 5 * h.level, mend: (h) => 6 + 0.7 * h.level, desc: 'A deep bowl for the pig you pick, plus a sip for the rest of the squad.' } },
      stats: { atk: 0.03, hp: 0.04 },
    },
    {
      id: 'chef_r2', hero: 'chef', tier: 2, cost: 24,
      name: 'Molten Ladle', skin: 'Magma Cook', tint: '#e05a2a', sigil: '🍳',
      desc: 'A heavy ladle: +7% of its damage and +4% HP. The Chef\'s pepper supper is his own — no relic changes it.',
      stats: { atk: 0.07, hp: 0.04 },
    },
    {
      id: 'chef_r3', hero: 'chef', tier: 3, cost: 12,
      name: 'Feast Pot', skin: 'Feastmaster', tint: '#ffd76b', sigil: '🍲',
      desc: 'Hot Soup feeds the whole squad, plus a small shield.',
      mods: { hotsoup: { target: 'party', healParty: (h) => 30 + 3.2 * h.level, shieldParty: (h) => 10 + 1 * h.level, desc: 'Soup for the whole squad and a small shield.' } },
      stats: { atk: 0.03, hp: 0.09 },
    },

    /* --- Sapper Pig (saboteur) --- */
    {
      id: 'sapper_r1', hero: 'sapper', tier: 1, starter: true, cost: 0,
      name: 'Fusemaster Relic', skin: 'Fusemaster', tint: '#ffe066', sigil: '🧨',
      desc: 'Smoke Bomb hits harder, blinds the flock for 3 rounds and silences their specials for 1.',
      mods: { smoke: { mult: 0.7, weaken: 3, silence: 1, desc: 'A thick cloud of smoke and grit over the whole flock.' } },
      stats: { atk: 0.05, hp: 0.03 },
    },
    {
      id: 'sapper_r2', hero: 'sapper', tier: 2, cost: 6,
      name: 'Shrapnel Kit', skin: 'Shrapnel Sapper', tint: '#9a9a9a', sigil: '🔧',
      desc: 'Big Boom deals 50% more damage and leaves every bird open (+20% damage taken) for 3 rounds.',
      mods: { bigboom: { mult: 1.5, vuln: { turns: 3, bonus: 0.2 }, desc: 'A huge blast that leaves every bird open for 3 rounds.' } },
      stats: { atk: 0.08, hp: 0.03 },
    },
    {
      id: 'sapper_r3', hero: 'sapper', tier: 3, cost: 12,
      name: 'Blackpowder Heart', skin: 'Blackpowder Chief', tint: '#5c5cff', sigil: '💣',
      desc: 'Big Boom sets every bird on fire for 3 rounds and blows their shields apart.',
      mods: { bigboom: { burn: { turns: 3, dmg: (h) => 6 + 0.3 * h.atk }, shred: true, desc: 'Fire for 3 rounds, and every shield and mirage blown apart.' } },
      stats: { atk: 0.10, hp: 0.03 },
    },

    /* --- Wizard Pig (mage) --- */
    {
      id: 'wizard_r1', hero: 'wizard', tier: 1, starter: true, cost: 0,
      name: 'Arcane Spoon', skin: 'Arcane Cook', tint: '#b48fff', sigil: '✨',
      desc: 'Hex hits 25% harder and keeps its curse on the bird for an extra round.',
      mods: { hex: { mult: 0.7, weaken: 3, desc: 'A stronger hex that keeps the bird weak and open for the next pig.' } },
      stats: { atk: 0.06, hp: 0.02 },
    },
    {
      id: 'wizard_r2', hero: 'wizard', tier: 2, cost: 6,
      name: 'Hex Totem', skin: 'Hex Doctor', tint: '#7ad6c0', sigil: '🕯️',
      desc: 'Hex weakens for 4 rounds, silences for 2 and drains 25% of the damage back into the Wizard.',
      mods: { hex: { weaken: 4, silence: 2, leech: 0.25, desc: 'Weakens 4 rounds, silences 2, and the hex drinks a quarter of the damage back.' } },
      stats: { atk: 0.06, hp: 0.04 },
    },
    {
      id: 'wizard_r3', hero: 'wizard', tier: 3, cost: 12,
      name: 'Comet Crown', skin: 'Comet Herald', tint: '#ff7ad6', sigil: '☄️',
      desc: 'Meteor hits 30% harder, weakens the flock and blows every shield and mirage apart.',
      mods: { meteor: { mult: 1.3, weaken: 2, shred: true, desc: 'Fire rains on every bird: 130%, weakened, wards broken.' } },
      stats: { atk: 0.11, hp: 0.02 },
    },
  ],

  /* Relic rarity: each step is harder to craft and genuinely stronger. */
  rarities: {
    common: { key: 'common', label: 'Common', icon: '◇', color: '#c9d3de', cost: 0, statMul: 1, blurb: 'Free — every pig already owns it.' },
    rare: { key: 'rare', label: 'Rare', icon: '◆', color: '#5fb0ff', cost: 10, statMul: 1.7, blurb: '10 🏅 relics · bigger rework, +70% relic stats.' },
    unreal: { key: 'unreal', label: 'Unreal', icon: '✦', color: '#c07bff', cost: 20, statMul: 2.6, blurb: '20 🏅 relics · the strongest rework, +160% relic stats.' },
  },

  /* ---------------- Potions & shop ---------------- */
  potions: {
    heal: { name: 'Healing Potion', icon: '🧪', desc: 'Battle: heals every pig for 25% of max HP.', shop: 85, target: 'team' },
    might: { name: 'Might Brew', icon: '💪', desc: 'Battle: the squad deals 25% more damage for 3 rounds.', shop: 110, target: 'team' },
    hex: { name: 'Hex Vial', icon: '🕯️', desc: 'Battle: weakens every bird for 3 rounds (30% less damage).', shop: 95, target: 'enemies' },
    rage: { name: 'Pepper Tonic', icon: '⚡', desc: 'Battle: +4 pepper charge for the squad.', shop: 90, target: 'team' },
    xp: { name: 'XP Tonic', icon: '📗', desc: 'Drink outside battle for 90 XP.', shop: 120, target: 'self' },
    /* Held for the level preview, never the battle tray: ring it, field four
       pigs, and it is spent when the fight starts. */
    backup: { name: 'Backup Bell', icon: '🔔', desc: 'Before a fight: rings in a fourth pig for one level.', shop: 240, target: 'self', prebattle: true },
  },

  recipes: [
    { id: 'heal', name: 'Healing Potion', icon: '🧪', herbs: 3, coins: 20, desc: 'Heal the squad mid-fight.' },
    { id: 'might', name: 'Might Brew', icon: '💪', herbs: 4, coins: 30, desc: '+25% squad damage, 3 rounds.' },
    { id: 'hex', name: 'Hex Vial', icon: '🕯️', herbs: 4, coins: 26, desc: 'Weaken every bird, 3 rounds.' },
    { id: 'rage', name: 'Pepper Tonic', icon: '⚡', herbs: 3, coins: 24, desc: '+4 pepper charge for the squad.' },
    { id: 'xp', name: 'XP Tonic', icon: '📗', herbs: 5, coins: 42, desc: '90 XP, outside battle.' },
  ],

  /* ---------------- Wheel of rewards ---------------- */
  wheel: [
    { kind: 'coins', amount: 20, label: '20 coins', icon: '🪙', color: '#f3c969' },
    { kind: 'coins', amount: 55, label: '55 coins', icon: '🪙', color: '#e9a94c' },
    { kind: 'potion', id: 'heal', label: 'Healing potion', icon: '🧪', color: '#8fd06b' },
    { kind: 'coins', amount: 35, label: '35 coins', icon: '🪙', color: '#f3c969' },
    { kind: 'herbs', amount: 3, label: '3 herbs', icon: '🌿', color: '#7dbb52' },
    { kind: 'coins', amount: 80, label: '80 coins', icon: '🪙', color: '#e9a94c' },
    { kind: 'xp', amount: 70, label: '70 XP', icon: '📗', color: '#7fb6d6' },
    { kind: 'potion', id: 'rage', label: 'Pepper tonic', icon: '⚡', color: '#d7a1e8' },
  ],

  /* First-time treasures on selected roads. Bosses and the deepest side roads
     pay relics, potions and materials instead of only extra coins. */
  firstClearRewards: {
    e19: { label: 'Egg World treasure', coins: 150, relics: 2, potions: { heal: 1 }, mats: { eggshell: 3, feather: 4 } },
    c19: { label: 'Canyon treasure', coins: 250, relics: 2, potions: { might: 1 }, mats: { cactus: 3, sand: 3 } },
    f19: { label: 'Frost Peak treasure', coins: 350, relics: 3, potions: { heal: 1 }, mats: { rime: 3, wool: 2 } },
    s19: { label: 'Saltwind treasure', coins: 450, relics: 3, potions: { might: 1 }, mats: { coral: 3, pearl: 2 } },
    k22: { label: 'Gilded treasure', coins: 600, relics: 4, potions: { xp: 1 }, mats: { pearl: 3, rime: 3 } },
    e49: { label: 'High Perch cache', coins: 80, relics: 1, mats: { ore: 3, feather: 3 } },
    c38: { label: 'Sunken cache', coins: 120, relics: 1, mats: { sand: 3, rime: 2 } },
    f39: { label: 'Deep cave cache', coins: 160, relics: 2, mats: { rime: 3, wool: 2 } },
    s39: { label: 'Tide cave cache', coins: 200, relics: 2, mats: { coral: 3, pearl: 2 } },
    k43: { label: 'Broken crown cache', coins: 250, relics: 2, mats: { pearl: 2, rime: 2 } },
  },

  /* ---------------- Achievements ---------------- */
  achievements: [
    { id: 'world1', name: 'Egg Protector', icon: '🥚', desc: 'Defeat the Mighty Eagle.' },
    { id: 'world2', name: 'Canyon Cleaner', icon: '🏜️', desc: 'Defeat Mother Flock.' },
    { id: 'flawless', name: 'Flawless Dozen', icon: '🌟', desc: 'Earn three stars on twelve different levels.' },
    { id: 'untouched', name: 'Not a Scratch', icon: '🩹', desc: 'Beat a boss with a full three-pig squad and nobody knocked out.' },
    { id: 'spender', name: 'Big Spender', icon: '💰', desc: 'Spend 2,000 coins in the base, shops and brewing hut.' },
    { id: 'geared', name: 'Fully Loaded', icon: '🛠️', desc: 'Upgrade one pig to tier 3 weapon and helmet.' },
    { id: 'party', name: 'Full Piggy Party', icon: '🐷', desc: 'Unlock all six pigs.' },
    { id: 'hunter', name: 'Bird Watcher', icon: '🪶', desc: 'Knock out 200 birds.' },
    { id: 'jackpot', name: 'Jackpot', icon: '🎡', desc: 'Land the 80-coin wheel wedge.' },
    { id: 'lucky', name: 'Lucky Roll', icon: '🎲', desc: 'Roll a six on a gear upgrade.' },
    { id: 'combo', name: 'Combo Machine', icon: '🔥', desc: 'Use four ultimate abilities in one battle.' },
    { id: 'legend', name: 'Legend of Egg World', icon: '👑', desc: 'Reach the maximum party level.' },
    { id: 'deep', name: 'Eighteen Fathoms', icon: '💀', desc: 'Clear dungeon depth 18.' },
    { id: 'unerring', name: 'No Way Out But Down', icon: '🔥', desc: 'Clear dungeon depth 35.' },
    { id: 'explorer', name: 'Pathfinder', icon: '🗺️', desc: 'Clear 30 levels, side routes and caves included.' },
    { id: 'hoarder', name: 'Hoarder', icon: '🪙', desc: 'Collect 4,000 coins.' },
    { id: 'brewmaster', name: 'Brewmaster', icon: '🧪', desc: 'Brew 35 potions.' },
    /* --- World-specific --- */
    { id: 'w1sweep', name: 'Egg World Sweep', icon: '🥚', desc: 'Clear every level in Egg World, caves and side routes included.', world: 1 },
    { id: 'w2sweep', name: 'Canyon Sweep', icon: '🏜️', desc: 'Clear every level in Cuckoo Canyon, caves and side routes included.', world: 2 },
    { id: 'w3sweep', name: 'Peak Sweep', icon: '❄️', desc: 'Clear every level on Frost Peak, caves and side routes included.', world: 3 },
    { id: 'w3boss', name: 'The Frost King Falls', icon: '👑', desc: 'Defeat the Frost King on Frost Peak.' },
    { id: 'frostbite', name: 'Frostbite', icon: '🧊', desc: 'Knock out 40 winter birds (frost jays, yeti, balloons, mammoths).' },
    { id: 'caveman', name: 'Cave Crawler', icon: '🕯️', desc: 'Clear every level of a cave and reach its relic vault.' },
    /* --- Index / collection --- */
    { id: 'unreal', name: 'Unreal', icon: '✦', desc: 'Own an Unreal relic.' },
    { id: 'relicdex', name: 'Relic Index', icon: '📚', desc: 'Own every relic in the vault, starters and legendaries included.' },
    { id: 'index', name: 'The Index', icon: '🗂️', desc: 'Unlock every other achievement in the index.' },
  ],

  /* ---------------- Cutscenes ---------------- */
  cutscenes: {
    intro1: {
      title: 'Egg World',
      panels: [
        { art: 'eagle', kicker: 'Somewhere above the clouds', text: 'The flocks have seen the royal egg stores. Every bird on the island is hungry, and every egg is undefended.', voice: 'eagle' },
        { art: 'corporal', kicker: 'The pig gate', text: 'Corporal Pig has a hammer, a helmet, and exactly one plan: hit birds until there are no birds.', voice: 'corporal' },
        { art: 'red', kicker: 'The first scout', text: 'A red scout waddles through the gate. It has made a terrible mistake.', voice: 'red' },
      ],
    },
    boss1: {
      title: 'The Mighty Eagle',
      panels: [
        { art: 'eagle', kicker: 'The last gate', text: 'The sky goes dark. The Mighty Eagle lands, and the ground remembers it.', voice: 'eagle' },
        { art: 'king', kicker: 'King Pig', text: 'King Pig steps forward. "Nobody touches the eggs. Nobody."', voice: 'king' },
      ],
    },
    outro1: {
      title: 'Egg World is safe',
      panels: [
        { art: 'eagle', kicker: 'Victory', text: 'The Eagle retreats over the hills, and the eggs are counted, one by one. All present.', voice: 'eagle' },
        { art: 'sapper', kicker: 'A new recruit', text: 'A sapper pig arrives from the mines with a wrench and a crate of dynamite. "Heard you had a bird problem."', voice: 'sapper' },
        { art: 'mother', kicker: 'Far away', text: 'In a canyon of red rock, something enormous opens one eye. Mother Flock has heard about the eggs too.', voice: 'mother' },
      ],
    },
    intro2: {
      title: 'Cuckoo Canyon',
      panels: [
        { art: 'mother', kicker: 'The canyon', text: 'Red cliffs, hot wind, and a flock that has been waiting for the pigs to follow.', voice: 'mother' },
        { art: 'sapper', kicker: 'Sapper Pig', text: 'Sapper Pig cracks his knuckles. "I brought enough for everyone."', voice: 'sapper' },
      ],
    },
    boss2: {
      title: 'Mother Flock',
      panels: [
        { art: 'mother', kicker: 'The nest', text: 'Mother Flock rises out of the nest, and every angry bird in the canyon goes quiet.', voice: 'mother' },
        { art: 'chef', kicker: 'Chef Pig', text: 'Chef Pig ladles out one last bowl. "For luck. And for the eggs."', voice: 'chef' },
      ],
    },
    outro2: {
      title: 'The eggs are safe',
      panels: [
        { art: 'mother', kicker: 'The end of the flock', text: 'Mother Flock folds her wings and the canyon empties. Not a single bird is left to guard the nest.', voice: 'mother' },
        { art: 'king', kicker: 'King Pig', text: 'King Pig sits on the biggest egg. "We did it. All of us. Mostly me."', voice: 'king' },
        { art: 'corporal', kicker: 'The end', text: 'The eggs are counted, the pigs are home, and somewhere far away, a very small bird is already planning something stupid.', voice: 'corporal' },
        { art: 'wizard', kicker: 'A new threat', text: 'Far to the north, beneath the frozen peaks, something ancient stirs. The snow age is coming...', voice: 'wizard' },
      ],
    },
    boss3: {
      title: 'The Frost King',
      panels: [
        { art: 'frostking', kicker: 'The highest peak', text: 'The wind stops. Every snowflake in the pass hangs where it is, and a bird wearing a crown of ice walks out of the white.', voice: 'frostking' },
        { art: 'corporal', kicker: 'Corporal Pig', text: '"That is a lot of bird." Corporal Pig plants his feet anyway. "Shields up. Nobody freezes alone."', voice: 'corporal' },
        { art: 'wizard', kicker: 'Wizard Pig', text: 'Wizard Pig sets his staff alight. "Ice is only water that forgot how to move. I can remind it."', voice: 'wizard' },
      ],
    },
    outro3: {
      title: 'Frost Peak is silent',
      panels: [
        { art: 'frostking', kicker: 'The crown falls', text: 'The Frost King sits down in the snow, and for the first time in a hundred years the peak is quiet. The crown rolls to a stop at the pigs\' feet.', voice: 'frostking' },
        { art: 'chef', kicker: 'Camp', text: 'Chef Pig lights a fire out of the wreckage of the last sled and ladles soup into six helmets. Nobody complains about the smoke.', voice: 'chef' },
        { art: 'king', kicker: 'King Pig', text: 'King Pig wears the ice crown. "It is a bit cold." He wears it anyway.', voice: 'king' },
        { art: 'tidewarden', kicker: 'Far below', text: 'Down where the mountain meets the water, something enormous turns over in its sleep. The peaks were never the last line. The sea was.', voice: 'tidewarden' },
      ],
    },
    boss4: {
      title: 'The Tide Warden',
      panels: [
        { art: 'tidewarden', kicker: 'Past the breakers', text: 'The sea stands up. Feathers of foam, eyes like lighthouse lamps, and a voice that comes from under the water rather than above it.', voice: 'tidewarden' },
        { art: 'sapper', kicker: 'Sapper Pig', text: 'Sapper Pig checks his fuse one last time. "Everything I have. All at once. Say when."', voice: 'sapper' },
        { art: 'king', kicker: 'King Pig', text: 'King Pig raises the ice crown, which is now full of seawater. "For the eggs. And for the beach. Mostly the beach."', voice: 'king' },
      ],
    },
    outro4: {
      title: 'The island is safe',
      panels: [
        { art: 'tidewarden', kicker: 'The Warden sinks', text: 'The Tide Warden goes back under, and the shore comes back one wave at a time. The gulls land. Nobody attacks anybody.', voice: 'tidewarden' },
        { art: 'corporal', kicker: 'The last egg', text: 'Corporal Pig counts the eggs twice, because once is how you lose one. All present. He sits down in the sand and does not get up for a while.', voice: 'corporal' },
        { art: 'wizard', kicker: 'Wizard Pig', text: 'Wizard Pig looks north, then east, then at the sea. "It will not stay quiet forever." Corporal Pig, eyes closed: "Then it can wait until after lunch."', voice: 'wizard' },
        { art: 'king', kicker: 'Home', text: 'The pigs sail home with the eggs lashed to the deck and the ice crown hanging off the mast. The birds watch them go, and nobody follows.', voice: 'king' },
      ],
    },
    recruit_chef: {
      title: 'Soup Time',
      panels: [
        { art: 'chef', kicker: 'A new recruit', text: 'Chef Pig arrives with a massive pan and an even bigger cauldron. "Nobody fights hungry on my watch."', voice: 'chef' },
        { art: 'corporal', kicker: 'Accepted', text: 'Corporal Pig nods solemnly. "Soup is tactical."', voice: 'corporal' },
      ],
    },
    recruit_king: {
      title: 'His Royal Bacon',
      panels: [
        { art: 'king', kicker: 'Royal decree', text: 'King Pig strides through the gates in a golden crown. "These eggs are MINE to protect. And by mine, I mean ours."', voice: 'king' },
        { art: 'sapper', kicker: 'Respect', text: 'Sapper Pig salutes. "Yes, Your Highness."', voice: 'sapper' },
      ],
    },
    recruit_sapper: {
      title: 'Boom Time',
      panels: [
        { art: 'sapper', kicker: 'Demolitions', text: 'Sapper Pig rolls in a barrel of dynamite. "I heard there was a bird problem. I brought enough for three bird problems."', voice: 'sapper' },
        { art: 'chef', kicker: 'Nervous', text: 'Chef Pig nervously puts down his pan. "Maybe go a little lighter on the big boom..."', voice: 'chef' },
      ],
    },
    recruit_wizard: {
      title: 'Arcane Aid',
      panels: [
        { art: 'wizard', kicker: 'The keeper', text: 'Wizard Pig appears in a cloud of sparkles, levitating over the gate. "The eggs called to me. I could not ignore them."', voice: 'wizard' },
        { art: 'king', kicker: 'Skeptical', text: 'King Pig squints up at him. "Can you cook?" "I can conjure soup." "Good enough."', voice: 'king' },
      ],
    },
    final: {
      title: 'Egg World Reborn',
      panels: [
        { art: 'king', kicker: 'Victory', text: 'The three worlds fall quiet. The eggs are safe once more.', voice: 'king' },
        { art: 'wizard', kicker: 'Gratitude', text: 'The pigs have saved the island. The birds fly free once more.', voice: 'wizard' },
        { art: 'corporal', kicker: 'The end', text: 'Time for soup, time for sleep. The hammer rests... for now.', voice: 'corporal' },
      ],
    },
  },

  /* ---------------- Endless dungeon ---------------- */
  dungeon: {
    runsPerDay: 3,
    fogRadius: 7,
    depthCap: 200,
    /* After a clear, the next chamber can open into a shelter or a merchant.
       Boss depths are never replaced, and stops never land back-to-back. */
    stopChance: 0.35,
    restOffers: [
      { id: 'heal', icon: '🩹', name: 'Field Dressings', desc: 'Restore every pig to full HP for the next battle.' },
      { id: 'whet', icon: '🪨', name: 'Whetstone', desc: '+12% attack for the rest of this run. Stacks with more stones.' },
      { id: 'relic', icon: '🏅', name: 'Hidden Cache', desc: 'Add 1 relic to the run purse.' },
      { id: 'coins', icon: '🪙', name: 'Loose Change', desc: 'Add 25 + 4×depth run coins to the purse.' },
      { id: 'potion', icon: '🧪', name: 'Brew a Tonic', desc: 'Add 1 healing potion to your bag.' },
    ],
    shopOffers: [
      { id: 'heal', icon: '🍲', name: 'Hot Stew', desc: 'Restore 50% HP to every pig for the next battle.', cost: 14 },
      { id: 'whet', icon: '🪨', name: 'Whetstone', desc: '+10% attack for the rest of this run.', cost: 26 },
      { id: 'relic', icon: '🏅', name: 'Relic Fragment', desc: 'Add 1 relic to the run purse.', cost: 34 },
      { id: 'potion', icon: '🧪', name: 'Healing Tonic', desc: 'Add 1 healing potion to your bag.', cost: 18 },
      { id: 'xp', icon: '📗', name: 'Dusty Tome', desc: 'Add 30 XP to the run purse.', cost: 20 },
    ],
    /* The dungeon changes stone every five depths. */
    BIOMES: ['dungeon-crypt', 'dungeon-ember', 'dungeon-frost', 'dungeon-void'],
    biome(floor) {
      const f = Math.max(1, floor || 1);
      return this.BIOMES[Math.floor((f - 1) / 5) % this.BIOMES.length];
    },
    danger(floor) {
      return Math.min(100, Math.round(floor * 2.6));
    },
    rewards(floor) {
      return {
        coins: 16 + floor * 5,
        herbs: floor % 2 === 0 ? 1 : 0,
        relics: floor % 3 === 0 ? (floor % 9 === 0 ? 2 : 1) : 0,
        xp: 12 + floor * 3,
      };
    },
    /* Random opponents scaled by depth. Bosses every fifth floor. */
    makeFloor(floor) {
      const rnd = (a, b) => a + Math.random() * (b - a);
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const hpMul = 0.5 + floor * 0.15;
      const atkMul = 0.45 + floor * 0.11;
      const boss = floor % 5 === 0;
      if (boss) {
        /* Any boss can hold a floor, and any bird in the game can be in its
           escort — the dungeon is the one place the whole flock mixes. */
        const bossPool = Object.keys(DATA.enemies).filter((k) => DATA.enemies[k].boss);
        const t = bossPool[(Math.floor(floor / 5) - 1) % bossPool.length];
        const adds = Object.keys(DATA.enemies).filter((k) => !DATA.enemies[k].boss);
        const list = [{ t, hpMul: hpMul * 0.62, atkMul: atkMul * 0.9 }];
        const addCount = Math.min(2, 1 + Math.floor(floor / 10));
        for (let i = 0; i < addCount; i++) list.push({ t: pick(adds), hpMul: hpMul * 0.55, atkMul: atkMul * 0.72 });
        return { enemies: list, boss: true };
      }
      /* Any bird can turn up down here — the depth decides how nasty it is,
         not a hand-written shortlist. */
      const pool = Object.keys(DATA.enemies).filter((k) => !DATA.enemies[k].boss);
      const count = Math.min(4, 2 + Math.floor(floor / 4));
      const list = [];
      for (let i = 0; i < count; i++) {
        const t = pick(pool);
        list.push({ t, hpMul: hpMul * rnd(0.9, 1.1), atkMul: atkMul * rnd(0.9, 1.1) });
      }
      return { enemies: list, boss: false };
    },
  },

  /* First time a run reaches a new personal-best depth, the cave pays a
     one-off descent bonus. Milestones every five depths pay relics. */
  dungeonFirstClear(floor) {
    const f = Math.max(1, floor || 1);
    const milestone = f % 10 === 0 ? 3 : f % 5 === 0 ? 2 : 0;
    return {
      label: milestone ? `First descent · depth ${f} milestone` : `First descent · depth ${f}`,
      coins: 20 + f * 6,
      xp: 10 + f * 2,
      herbs: f % 2 === 0 ? 1 : 0,
      relics: milestone,
    };
  },

  /* ---------------- Compendium ---------------- */
  index: {
    heroes: ['corporal', 'chef', 'king', 'sapper', 'wizard'],
    birds: ['red', 'chuck', 'blue', 'bomb', 'matilda', 'hal', 'bubbles', 'stella', 'terence', 'eagle', 'mother', 'gull', 'tern', 'pelican', 'heron', 'albatross', 'reefcaller', 'tidewarden'],
  },
};

/* ---------------- One bird, one world ---------------- */
/* Each bird belongs to a single world and draws its own sprite. Only the
   dungeon mixes the whole flock together. */
DATA.worldRoster = {
  1: ['red', 'chuck', 'blue', 'matilda', 'hal', 'bubbles', 'stella', 'bomb'],
  2: ['diver', 'hawk', 'vulture', 'spitter', 'shrike', 'ram', 'nestkeeper', 'harrier'],
  3: ['frost', 'balloon', 'mammoth', 'frostcaller', 'frostwall', 'rimeweaver', 'icefall', 'frostbinder', 'frost', 'balloon', 'mammoth'],
  4: ['gull', 'tern', 'pelican', 'heron', 'albatross', 'reefcaller', 'tidewall', 'tideseer', 'reefbulwark', 'brinebinder'],
};
DATA.birdWorld = {
  red: 1, chuck: 1, blue: 1, bomb: 1, matilda: 1, hal: 1, bubbles: 1, stella: 1, sparrow: 1, eagle: 1,
  diver: 2, hawk: 2, vulture: 2, spitter: 2, shrike: 2, ram: 2, nestkeeper: 2, canyoncaller: 2, harrier: 2, terence: 2, mother: 2,
  frost: 3, balloon: 3, yeti: 3, mammoth: 3, frostcaller: 3, frostking: 3, frostwall: 3, rimeweaver: 3, icefall: 3, frostbinder: 3,
  gull: 4, tern: 4, pelican: 4, heron: 4, albatross: 4, reefcaller: 4, tidewarden: 4, tidewall: 4, tideseer: 4, reefbulwark: 4, brinebinder: 4,
  camel: 2, kraken: 4,
};
DATA.worldBoss = { 1: 'eagle', 2: 'mother', 3: 'frostking', 4: 'tidewarden' };

DATA.worldBoss[5] = 'gildedking';

/* ---------------- World 5: the Gilded Kingdom ----------------
   Sixteen new birds in five roles, four biomes and three castle keys. */
DATA.worldRoster[5] = [
  'squire', 'herald', 'bannerman', 'rooknight', 'falconer', 'warden',
  'thornwing', 'mossback', 'bramblecaster', 'gloomowl', 'shrieker', 'stonebeak',
  'lanternwing', 'royalguard', 'crownseer', 'gildedking',
];
Object.assign(DATA.birdWorld, {
  squire: 5, herald: 5, bannerman: 5, rooknight: 5, falconer: 5, warden: 5,
  thornwing: 5, mossback: 5, bramblecaster: 5, gloomowl: 5, shrieker: 5, stonebeak: 5,
  lanternwing: 5, royalguard: 5, crownseer: 5, gildedking: 5,
});

Object.assign(DATA.enemies, {
  squire: {
    name: 'Squire Sparrow', art: 'squire', hp: 92, atk: 21, role: 'Skirmisher',
    lore: 'Carries a spear twice his height and a helmet three sizes too big.',
    trait: 'Quick jabs, two at a time',
    moves: [
      { name: 'Spear Jab', kind: 'multi', mult: 0.66, hits: 2, weight: 3 },
      { name: 'Nervous Charge', kind: 'single', mult: 1.05, stun: 1, weight: 1 },
    ],
  },
  herald: {
    name: 'Trumpet Herald', art: 'herald', hp: 104, atk: 18, role: 'Support',
    lore: "Announces every pig's death in advance, which is somehow worse.",
    trait: 'Marks a pig for the whole court',
    moves: [
      { name: 'Fanfare', kind: 'aoe', mult: 0.42, weaken: 2, weight: 2 },
      { name: 'Royal Decree', kind: 'focus', rounds: 2, icon: '🎯', cd: 3, weight: 2 },
      { name: 'Bray', kind: 'single', mult: 0.95, weight: 1 },
    ],
  },
  bannerman: {
    name: 'Banner Bearer', art: 'bannerman', hp: 118, atk: 17, role: 'Support',
    lore: 'Holds the colours up so the rest of the court can keep hitting things.',
    trait: 'Shields the whole court',
    moves: [
      { name: 'Raise the Colours', kind: 'shieldAll', shield: 0.12, icon: '🚩', cd: 3 },
      { name: 'Pole Shove', kind: 'single', mult: 0.9, weight: 2 },
    ],
  },
  rooknight: {
    name: 'Rook Knight', art: 'rooknight', hp: 158, atk: 24, armor: 0.1, role: 'Bruiser',
    lore: 'A tower with feathers. The lance is mostly for show and entirely for damage.',
    trait: 'Armoured charger',
    moves: [
      { name: 'Lance Charge', kind: 'single', mult: 1.3, weight: 3 },
      { name: 'Tower Shield', kind: 'shieldAll', shield: 0.1, icon: '🛡️', cd: 3, weight: 1 },
    ],
  },
  falconer: {
    name: 'Falconer', art: 'falconer', hp: 112, atk: 26, role: 'Skirmisher',
    lore: 'Lets the hawk do the work and takes the credit at dinner.',
    trait: 'Three fast strikes',
    moves: [
      { name: 'Talon Flurry', kind: 'multi', mult: 0.55, hits: 3, random: true, weight: 3 },
      { name: 'Whistle', kind: 'focus', rounds: 1, icon: '🎯', cd: 3, weight: 1 },
    ],
  },
  warden: {
    name: 'Gate Warden', art: 'warden', hp: 205, atk: 22, armor: 0.16, role: 'Tank',
    lore: 'Keeps the brass key on a chain around his neck. Good luck with the neck.',
    trait: 'Key warden: heavy armour, slams everyone',
    moves: [
      { name: 'Portcullis Slam', kind: 'aoe', mult: 0.62, icon: '🚪', cd: 2, weight: 2 },
      { name: 'Key Chain', kind: 'single', mult: 1.15, weight: 3 },
    ],
  },
  thornwing: {
    name: 'Thornwing', art: 'thornwing', hp: 98, atk: 25, role: 'Bruiser',
    lore: 'Nests in the bramble hedge. Everything about it is barbed, including the temper.',
    trait: 'Poison barbs',
    moves: [
      { name: 'Barb Peck', kind: 'single', mult: 0.95, poison: 3, icon: '☠️', cd: 2, weight: 2 },
      { name: 'Bramble Rush', kind: 'single', mult: 1.1, weight: 2 },
    ],
  },
  mossback: {
    name: 'Mossback', art: 'mossback', hp: 188, atk: 20, armor: 0.15, role: 'Tank',
    lore: 'A forest floor that got up and decided the pigs were intruding.',
    trait: 'Armoured forest wall',
    moves: [
      { name: 'Root Heave', kind: 'aoe', mult: 0.55, weaken: 2, weight: 2 },
      { name: 'Headbutt', kind: 'single', mult: 1.2, weight: 2 },
    ],
  },
  bramblecaster: {
    name: 'Bramble Caster', art: 'bramblecaster', hp: 96, atk: 24, role: 'Caster',
    lore: 'Grows thorns mid-fight, which is rude and effective.',
    trait: 'Burning thorns on everyone',
    moves: [
      { name: 'Thorn Storm', kind: 'aoe', mult: 0.5, burn: { turns: 2 }, icon: '🌿', cd: 2, weight: 2 },
      { name: 'Seed Shot', kind: 'single', mult: 1.0, weight: 2 },
    ],
  },
  gloomowl: {
    name: 'Gloom Owl', art: 'gloomowl', hp: 108, atk: 26, role: 'Caster',
    lore: 'Hunts by sound. Silence is the only thing it fears, which it also causes.',
    trait: 'Silences a pig',
    moves: [
      { name: 'Hush', kind: 'single', mult: 0.6, silence: 2, icon: '🤫', cd: 2, weight: 2 },
      { name: 'Talon Drop', kind: 'single', mult: 1.25, weight: 2 },
      /* Ghost drain: it patches itself up out of whatever it tears off a pig. */
      { name: 'Drain Hope', kind: 'single', mult: 0.8, leech: 0.3, icon: '🩸', weight: 1, desc: 'Tears at one pig for 80% of its damage and heals itself for 30% of the damage.' },
    ],
  },
  shrieker: {
    name: 'Cave Shrieker', art: 'shrieker', hp: 86, atk: 27, role: 'Skirmisher',
    lore: 'Every cave has one. This one has brought friends.',
    trait: 'Screams the flock awake',
    moves: [
      { name: 'Screech', kind: 'aoe', mult: 0.4, weaken: 2, weight: 2 },
      { name: 'Claw Combo', kind: 'multi', mult: 0.6, hits: 2, weight: 2 },
    ],
  },
  stonebeak: {
    name: 'Stonebeak', art: 'stonebeak', hp: 225, atk: 21, armor: 0.22, role: 'Tank',
    lore: 'Eats gravel. Sleeps in gravel. Is, functionally, gravel with opinions.',
    trait: 'The deepest armour in the kingdom',
    moves: [
      { name: 'Rockfall', kind: 'aoe', mult: 0.6, icon: '🪨', cd: 2, weight: 2 },
      { name: 'Granite Peck', kind: 'single', mult: 1.1, weight: 2 },
    ],
  },
  lanternwing: {
    name: 'Lanternwing', art: 'lanternwing', hp: 100, atk: 16, role: 'Support',
    lore: 'Carries the only light down there, and charges the flock for it.',
    trait: 'Heals the flock',
    moves: [
      { name: 'Warm Glow', kind: 'healAlly', heal: 0.35, icon: '🏮', cd: 2 },
      { name: 'Soot Puff', kind: 'single', mult: 0.85, weight: 2 },
    ],
  },
  royalguard: {
    name: 'Royal Guard', art: 'royalguard', hp: 255, atk: 27, armor: 0.2, role: 'Tank',
    lore: 'Polished, plumed and entirely unwilling to let a pig past the door.',
    trait: 'Elite guard: armoured and shields the court',
    moves: [
      { name: 'Halberd Sweep', kind: 'aoe', mult: 0.7, icon: '🪓', cd: 2, weight: 2 },
      { name: 'Guard Stance', kind: 'shieldAll', shield: 0.14, icon: '🛡️', cd: 3, weight: 1 },
      { name: 'Court Ward', kind: 'self', shieldBirds: 0.18, icon: '🛡️', cd: 3, weight: 1, desc: 'Raises a ward over the court: every bird takes 18% less damage for 2 rounds.' },
    ],
  },
  crownseer: {
    name: 'Crown Seer', art: 'crownseer', hp: 128, atk: 23, role: 'Support',
    lore: "Reads the court's future in a bowl of soup. It is never good news for pigs.",
    trait: 'Heals and marks for the crown',
    moves: [
      { name: 'Royal Mending', kind: 'healAlly', heal: 0.4, icon: '👑', cd: 2 },
      { name: 'Foreseen Doom', kind: 'focus', rounds: 2, icon: '🎯', cd: 3, weight: 1 },
      { name: 'Sceptre Tap', kind: 'single', mult: 1.0, weight: 2 },
    ],
  },
  gildedking: {
    name: 'The Gilded King', art: 'gildedking', hp: 2400, atk: 40, boss: true, haunt: true, armor: 0.14, role: 'Boss',
    phase2: { at: 0.5, shield: 0.2, weaken: 2, banner: 'CALLS THE WHOLE COURT TO ARMS!', theme: 'boss5phase' },
    lore: 'The crown of the kingdom is a bird. So is the kingdom.',
    trait: 'Boss: 2,400 HP, golden armour, summons the court',
    moves: [
      { name: 'Gilded Verdict', kind: 'single', mult: 1.6, weight: 2 },
      { name: 'Court Decree', kind: 'aoe', mult: 0.75, weaken: 2, icon: '👑', cd: 2, weight: 2 },
      { name: 'Coronation', kind: 'shieldAll', shield: 0.22, heal: 0.1, icon: '✨', cd: 3, weight: 1 },
    ],
  },
});

/* ---------------- World 5 level table ---------------- */
const w5 = (id, name, lore, e, biome, extra) =>
  Object.assign({ id: id, world: 5, name: name, lore: lore, e: e, biome: biome }, extra || {});
DATA._levelRows.push(
  w5('k1', 'The Gilded Gate', 'A drawbridge, a moat, and a herald who does not like pigs.', [['herald', 0.85, 0.85], ['squire', 0.9, 0.9]], 'castle'),
  w5('k2', 'Banner Walk', 'Banners line the causeway, and every one of them is a bird.', [['squire', 0.95, 0.9], ['bannerman', 0.9, 0.9]], 'castle'),
  w5('k4', 'Courtyard Drill', 'The guard practises on straw pigs. They would prefer the real thing.', [['rooknight', 0.9, 0.95], ['squire', 0.95, 0.9]], 'castle'),
  w5('k5', 'Warden of the Brass Gate', 'A warden the size of a door, wearing the key to a side road.', [['warden', 1.0, 0.95], ['rooknight', 0.95, 0.95]], 'castle', { elite: true, grantsKey: 'brass', tip: 'The Warden slams the whole squad. Shield before it charges.' }),
  w5('k7', 'Forest Verge', 'The kingdom turns to forest fast, and the forest is not empty.', [['thornwing', 1.0, 0.95], ['mossback', 0.9, 0.95]], 'forest'),
  w5('k8', 'Bramble Hedge', 'A hedge grown into a wall, with a bird on every thorn.', [['bramblecaster', 1.0, 0.95], ['thornwing', 1.0, 0.95]], 'forest', { elite: true }),
  w5('k10', 'The Hollow Path', 'The path drops under the roots. Something up ahead is coughing.', [['gloomowl', 0.95, 1.0], ['shrieker', 1.0, 0.95]], 'forest'),
  w5('k11', 'Cave Mouth', 'Cold air, wet stone, and eyes that reflect the torchlight.', [['shrieker', 1.0, 1.0], ['gloomowl', 0.95, 1.0]], 'cave'),
  w5('k12', 'Warden of the Silver Gate', 'Silver chain, silver key, and a temper to match.', [['warden', 1.05, 1.0], ['bannerman', 1.0, 0.95]], 'castle', { elite: true, grantsKey: 'silver', tip: 'Banner Bearers shield the court — burst the Warden before the adds pile up.' }),
  w5('k13', 'Lantern Gallery', 'Somebody hung lamps down here. Somebody is still here.', [['lanternwing', 1.0, 0.95], ['stonebeak', 0.9, 1.0], ['ironclad', 1.0, 0.9]], 'cave'),
  w5('k15', 'Stone Deep', 'The rock is warm here. The birds are warmer.', [['stonebeak', 1.05, 1.0], ['shrieker', 1.0, 1.0], ['ironclad', 1.05, 1.0]], 'cave', { elite: true }),
  w5('k16', 'Warden of the Gold Gate', 'The last warden, and the last key. He knows it.', [['warden', 1.1, 1.05], ['royalguard', 0.9, 0.95]], 'castle', { elite: true, grantsKey: 'gold', tip: 'Royal Guard shields the court. Silence or burst it before it guards again.' }),
  w5('k20', 'Hall of Banners', 'Every banner of every house, and a bird under each one.', [['rooknight', 1.05, 1.0], ['bannerman', 1.0, 1.0], ['squire', 1.0, 1.0]], 'throne', { elite: true }),
  /* side road behind the brass key */
  w5('k30', 'Brass Road', 'A road the pigs were never meant to find.', [['squire', 1.1, 1.05], ['rooknight', 1.0, 1.0]], 'castle'),
  w5('k31', 'Smugglers Walk', 'Crates, feathers, and a very surprised falconer.', [['falconer', 1.1, 1.05], ['thornwing', 1.05, 1.0]], 'forest', { elite: true }),
  /* side road behind the silver key */
  w5('k34', 'Silver Stair', 'It goes up and up and the birds keep coming down.', [['shrieker', 1.1, 1.05], ['gloomowl', 1.05, 1.05]], 'cave'),
  w5('k35', 'The Echo Hall', 'Every footstep comes back twice. So does every attack.', [['stonebeak', 1.1, 1.05], ['bramblecaster', 1.05, 1.05]], 'cave', { elite: true }),
  /* side road behind the gold key */
  w5('k37', 'Throne Approach', 'Red carpet the whole way up. The carpet is a trap.', [['royalguard', 1.0, 1.0], ['crownseer', 1.0, 0.95]], 'throne'),
  w5('k38', 'Crown Chamber Guard', 'The last thing between the pigs and the throne, and it is enormous.', [['royalguard', 1.1, 1.05], ['stonebeak', 1.0, 1.0]], 'throne', { elite: true }),
  w5('k22', 'The Gilded King', 'The throne is a nest of gold leaf, and the crown is still warm.', [['gildedking', 1.0, 0.95], ['royalguard', 1.05, 0.95], ['crownseer', 1.0, 0.9]], 'throne', { boss: true, tip: 'The King shields the court and weakens everyone past half health. Save the pepper for the shield, then burst him.' }),
);

/* ---------------- The late flock ----------------
   Three new birds for the last two worlds, and four roads to meet them on.
   Each one reuses a rule the engine already runs, so nothing new can break:
   a three-hit flier, an armoured pepper thief, and a berserk bruiser. */
Object.assign(DATA.enemies, {
  squallwing: {
    name: 'Squall Wing', art: 'squallwing', hp: 126, atk: 21, role: 'Skirmisher', flying: true,
    lore: 'It rides the sea wind in three quick passes and is gone before the echo.',
    trait: 'Fast, flighty, three hits a turn',
    moves: [
      { name: 'Gale Flurry', kind: 'multi', mult: 0.46, hits: 3, weight: 3 },
      { name: 'Storm Screech', kind: 'single', mult: 1.1, silence: 1, weight: 2 },
    ],
  },
  coinmaw: {
    name: 'Coin Maw', art: 'coinmaw', hp: 190, atk: 19, role: 'Tank', armor: 0.12,
    lore: 'It eats the payroll first and the pigs second.',
    trait: 'Armoured, and it skims the pepper meter',
    moves: [
      { name: 'Till Snatch', kind: 'single', mult: 0.95, stealPepper: 5, icon: '🌶️', weight: 3 },
      { name: 'Heavy Purse', kind: 'aoe', mult: 0.5, weight: 2 },
    ],
  },
  crownbreaker: {
    name: 'Crownbreaker', art: 'crownbreaker', hp: 240, atk: 26, role: 'Bruiser', big: true, berserk: 0.3,
    lore: 'It broke its own crown and kept the heavy half.',
    trait: 'Huge, and angrier the closer it is to falling',
    moves: [
      { name: 'Crown Slam', kind: 'single', mult: 1.35, weight: 3 },
      { name: 'Scatter the Court', kind: 'aoe', mult: 0.72, weaken: 2, icon: '💥', weight: 2 },
    ],
  },
});
DATA.worldRoster[4].push('squallwing');
DATA.worldRoster[5].push('coinmaw', 'crownbreaker');
Object.assign(DATA.birdWorld, { squallwing: 4, coinmaw: 5, crownbreaker: 5 });

DATA._levelRows.push(
  { id: 's41', world: 4, name: 'Storm Shelf', lore: 'A ledge above the breakers where the squalls nest. The spray never stops.', e: [['squallwing', 1.05, 1.0], ['tern', 1.1, 1.0], ['gull', 1.05, 1.0]] },
  { id: 's43', world: 4, name: 'Shardfall', lore: 'The cliff sheds glass in the wind, and the birds have learned to use it.', elite: true, e: [['squallwing', 1.1, 1.05], ['magpie', 1.05, 1.0], ['albatross', 1.1, 1.0]] },
  w5('k41', 'Mint Vault', 'A vault of counted coins and one bird that counts them.', [['coinmaw', 1.0, 0.95], ['squire', 1.0, 0.95], ['rooknight', 0.95, 0.95]], 'castle'),
  w5('k43', 'The Broken Crown', 'The crown is in pieces on the floor, and something is guarding the pieces.', [['crownbreaker', 1.0, 1.0], ['royalguard', 1.0, 0.95], ['crownseer', 0.95, 0.9]], 'throne', { elite: true }),
);

/* ---------------- World 5 map ---------------- */
DATA.worlds.push({
  id: 5,
  name: 'Gilded Kingdom',
  tag: 'Castles, forests, caves and a crown',
  gateStars: 86,
  mapH: 2600,
  theme: 'kingdom',
  nodes: [
    { id: 'k1', type: 'battle', x: 350, y: 2400 },
    { id: 'k2', type: 'battle', x: 510, y: 2290 },
    { id: 'k3', type: 'shop', x: 330, y: 2180 },
    { id: 'k4', type: 'battle', x: 180, y: 2070 },
    { id: 'k5', type: 'battle', x: 330, y: 1960 },
    { id: 'k7', type: 'battle', x: 500, y: 1850 },
    { id: 'k8', type: 'battle', x: 330, y: 1740 },
    { id: 'k9', type: 'craft', x: 180, y: 1630 },
    { id: 'k10', type: 'battle', x: 330, y: 1520 },
    { id: 'k11', type: 'battle', x: 500, y: 1410 },
    { id: 'k12', type: 'battle', x: 330, y: 1300 },
    { id: 'k13', type: 'battle', x: 180, y: 1190 },
    { id: 'k14', type: 'base', x: 330, y: 1080 },
    { id: 'k15', type: 'battle', x: 500, y: 970 },
    { id: 'k16', type: 'battle', x: 330, y: 860 },
    { id: 'k18', type: 'shop', relic: true, x: 330, y: 750 },
    { id: 'k20', type: 'battle', x: 180, y: 530 },
    { id: 'k22', type: 'battle', x: 360, y: 420 },
    /* brass key: a side road down the right-hand edge */
    { id: 'kA', type: 'gate', key: 'brass', x: 600, y: 1960 },
    { id: 'k30', type: 'battle', x: 600, y: 2070 },
    { id: 'k31', type: 'battle', x: 600, y: 2180 },
    { id: 'k33', type: 'shop', relic: true, x: 600, y: 2290 },
    /* silver key: a cave road down the left-hand edge */
    { id: 'kB', type: 'gate', key: 'silver', x: 62, y: 1300 },
    { id: 'k34', type: 'battle', x: 62, y: 1410 },
    { id: 'k35', type: 'battle', x: 62, y: 1520 },
    { id: 'k36', type: 'shop', relic: true, x: 62, y: 1630 },
    /* gold key: the shortcut road to the throne */
    { id: 'kC', type: 'gate', key: 'gold', x: 600, y: 860 },
    { id: 'k37', type: 'battle', x: 600, y: 970 },
    { id: 'k38', type: 'battle', x: 600, y: 1080 },
    { id: 'k39', type: 'shop', relic: true, x: 600, y: 1190 },
    /* the vault and the broken crown, off the forest road */
    { id: 'k41', type: 'battle', x: 600, y: 1830 },
    { id: 'k43', type: 'battle', x: 600, y: 1720 },
  ],
  edges: [
    ['k1', 'k2'], ['k2', 'k3'], ['k2', 'k4'], ['k4', 'k5'], ['k5', 'k7'],
    ['k7', 'k8'], ['k8', 'k9'], ['k8', 'k10'], ['k10', 'k11'], ['k11', 'k12'],
    ['k12', 'k13'], ['k13', 'k14'], ['k14', 'k15'], ['k15', 'k16'], ['k16', 'k18'],
    ['k18', 'k20'], ['k20', 'k22'],
    ['k5', 'kA'], ['kA', 'k30'], ['k30', 'k31'], ['k31', 'k33'],
    ['k12', 'kB'], ['kB', 'k34'], ['k34', 'k35'], ['k35', 'k36'],
    ['k16', 'kC'], ['kC', 'k37'], ['k37', 'k38'], ['k38', 'k39'],
    ['k7', 'k41'], ['k41', 'k43'],
  ],
});

/* ---------------- Coloured side doors ----------------
   Three tiers of key, three colours of door. Brass is the cheap one, silver
   the middle, gold the last, and the same colour opens its door in any world. */
DATA.keys = {
  brass: { id: 'brass', tier: 1, name: 'Brass Key', icon: '🥉', colour: '#d08a3c', blurb: 'Opens every brass side door on the map.' },
  silver: { id: 'silver', tier: 2, name: 'Silver Key', icon: '🥈', colour: '#cfd8e3', blurb: 'Opens every silver side door on the map.' },
  gold: { id: 'gold', tier: 3, name: 'Gold Key', icon: '🥇', colour: '#ffd36b', blurb: 'Opens every gold side door on the map.' },
};
DATA.keyOrder = ['brass', 'silver', 'gold'];

/* ---------------- Side-road gates ----------------
   Side routes (caves, vaults, smugglers' roads) hang off the main line with
   nothing marking the turn. Every junction gets a gate node in the middle of
   the edge, and behind it a coloured door: brass on the first road, silver on
   the second, gold on the third. The kingdom keeps its own key gates. */
DATA.worlds.forEach(function (w) {
  if (w.id === 5) return;
  const sideOf = (id) => {
    const n = parseInt(String(id).slice(1), 10) || 0;
    /* Egg World's main road runs through e30; its side roads start at e40. */
    return n >= (w.id === 1 ? 40 : 30);
  };
  const byId = {};
  w.nodes.forEach((n) => { byId[n.id] = n; });
  const added = [];
  const edges = [];
  w.edges.forEach(function (pair) {
    const a = byId[pair[0]];
    const b = byId[pair[1]];
    if (!a || !b || sideOf(a.id) || !sideOf(b.id)) { edges.push(pair); return; }
    const gateId = 'g' + w.id + '_' + b.id;
    const gate = {
      id: gateId, type: 'gate',
      key: DATA.keyOrder[added.length % DATA.keyOrder.length],
      x: Math.round((a.x + b.x) / 2),
      y: Math.round((a.y + b.y) / 2),
    };
    byId[gateId] = gate;
    added.push(gate);
    edges.push([a.id, gateId]);
    edges.push([gateId, b.id]);
  });
  if (added.length) {
    w.edges = edges;
    w.nodes = w.nodes.concat(added);
  }
});

/* ---------------- World 5 cutscenes ---------------- */
DATA.cutscenes.boss5 = {
  title: 'The Gilded King',
  panels: [
    { art: 'gildedking', kicker: 'The throne room', text: 'Gold leaf on every wall and a crown on every perch. At the end of the hall something enormous stops pretending to be a statue.', voice: 'king' },
    { art: 'corporal', kicker: 'Corporal Pig', text: 'Corporal Pig sets his hammer down and picks it back up again, because that is the whole plan and it has never failed yet.', voice: 'corporal' },
    { art: 'crownseer', kicker: 'The court', text: 'The Seer reads the soup one last time and does not like what it sees. The court stands anyway.', voice: 'wizard' },
  ],
};
DATA.cutscenes.ending = {
  title: 'The Kingdom of Pigs',
  panels: [
    { art: 'gildedking', kicker: 'The crown comes down', text: 'The Gilded King folds his wings, and the throne room goes quiet for the first time in a hundred years. The crown rolls across the floor and stops at a trotter.', voice: 'king' },
    { art: 'king', kicker: 'King Pig', text: 'King Pig picks it up, tries it on, and finds it fits. "Well," he says. "Obviously."', voice: 'king' },
    { art: 'chef', kicker: 'The banquet', text: 'The long table gets used properly at last: soup for two hundred birds, and not one of them fights anybody over it.', voice: 'chef' },
    { art: 'corporal', kicker: 'The end', text: 'The eggs are counted. All present. Corporal Pig sits down on the throne steps, puts the hammer beside him, and finally lets himself be tired.', voice: 'corporal' },
    { art: 'wizard', kicker: 'After', text: 'Five worlds. Four crowns. One very long year. Wizard Pig rolls the map up and says: "It will not stay quiet forever." Corporal Pig, eyes closed: "Then it can wait until after lunch."', voice: 'wizard' },
  ],
};

/* ---------------- World 5 achievements ---------------- */
DATA.achievements.push(
  { id: 'w5boss', name: 'The Gilded King Falls', icon: '👑', desc: 'Defeat the Gilded King in his throne room.' },
  { id: 'w5sweep', name: 'Kingdom Sweep', icon: '🏰', desc: 'Clear every level in the Gilded Kingdom, side roads and caves included.', world: 5 },
  { id: 'keymaster', name: 'Keymaster', icon: '🔑', desc: 'Hold all three castle keys at once.' },
  { id: 'mythic', name: 'Mythic Bacon', icon: '❖', desc: 'Own a mythic relic from the kingdom vaults.' },
  { id: 'finale', name: 'The Last Lunch', icon: '🍲', desc: 'Watch the kingdom ending all the way through.' },
);

/* ---------------- World 5 training ---------------- */
DATA.training.edge = {
  name: 'Critical Eye', icon: '🎯', unit: 'CRIT',
  step: 0.02, max: 5,
  cost: [220, 460, 780, 1200, 1750],
  mats: [{ feather: 3 }, { feather: 6 }, { feather: 8 }, { feather: 12 }, { feather: 16 }],
  blurb: 'Sharp eyes and sharper drills. Every pig crits more often.',
};
DATA.training.guard = {
  name: 'Bacon Plating', icon: '🛡️', unit: 'SHIELD',
  step: 0.03, max: 5,
  cost: [240, 500, 820, 1250, 1800],
  mats: [{ ore: 4 }, { ore: 7 }, { ore: 10 }, { ore: 14 }, { ore: 18 }],
  blurb: 'Every pig walks into a fight already plated. Starts each battle with a shield.',
};

/* ---------------- Mythic rarity + kingdom relics ---------------- */
DATA.rarities.mythic = { key: 'mythic', label: 'Mythic', icon: '❖', color: '#ffd36b', cost: 30, statMul: 3.4, blurb: '30 relics · the kingdom tier, +240% relic stats.' };
DATA.relics.push(
  {
    id: 'corporal_r4', hero: 'corporal', tier: 4, cost: 48,
    name: 'Wardbreaker', skin: 'Wardbreaker', tint: '#ffd36b', sigil: '🔨',
    desc: "Skull Crack hits 320%, stuns for two turns, breaks the bird's wards and heals Corporal for 30% of the damage.",
    mods: { skullcrack: { mult: 3.2, stun: 2, shred: true, leech: 0.3, desc: 'A kingdom-breaking blow: 320%, two-round stun, wards broken and 30% of the damage healed back.' } },
    stats: { atk: 0.14, hp: 0.06 },
  },
  {
    id: 'chef_r4', hero: 'chef', tier: 4, cost: 48,
    name: 'Banquet Ladle', skin: 'Banquetmaster', tint: '#ffb86b', sigil: '🍲',
    desc: 'Hot Soup becomes a banquet for the squad: a big heal, a shield, and a rally (+10% damage, 2 rounds).',
    mods: { hotsoup: { target: 'party', healParty: (h) => 44 + 4.6 * h.level, shieldParty: (h) => 16 + 1.6 * h.level, rally: { turns: 2, mult: 0.1 }, desc: 'A kingdom banquet: big heal, a shield on every pig and a rally.' } },
    stats: { atk: 0.06, hp: 0.12 },
  },
  {
    id: 'king_r4', hero: 'king', tier: 4, cost: 48,
    name: 'Crown of the Kingdom', skin: 'Gilded Sovereign', tint: '#ffe28a', sigil: '👑',
    desc: "King's Wrath hits every bird for 370% and the King drinks 25% of the damage back as health.",
    mods: { wrath: { target: 'allEnemies', mult: 3.7, leech: 0.25, name: 'Wrath of the Crown', desc: 'A royal slam on every bird that heals the King for a quarter of the damage.' } },
    stats: { atk: 0.15, hp: 0.05 },
  },
  {
    id: 'sapper_r4', hero: 'sapper', tier: 4, cost: 48,
    name: 'Siegeheart', skin: 'Siegebreaker', tint: '#ff9a4d', sigil: '🧨',
    desc: 'Big Boom hits 225%, silences for 3 rounds, burns for 3 and leaves the flock open (+15%, 2 rounds).',
    mods: { bigboom: { mult: 2.25, silence: 3, vuln: { turns: 2, bonus: 0.15 }, burn: { turns: 3, dmg: (h) => 9 + 0.35 * h.atk }, desc: 'A siege blast: silence, fire, and the flock left open.' } },
    stats: { atk: 0.13, hp: 0.05 },
  },
);


DATA.enemies.frostking = {
  name: 'The Frost King', art: 'frostking', hp: 1600, atk: 34, boss: true, haunt: true, armor: 0.12,
  /* Just past half: the pass itself freezes over. */
  phase2: { at: 0.55, freeze: 1, shield: 0.18, banner: 'TURNS THE PASS TO ICE!' },
  lore: 'On the highest peak sits a bird wearing a crown of ice. He has been waiting.',
  trait: 'Boss: 1,600 HP, freezing hits, summons every 2 rounds',
  moves: [
    { name: 'Crown Slam', kind: 'single', mult: 1.55, weight: 2 },
    { name: 'Deep Freeze', kind: 'aoe', mult: 0.7, weaken: 2, icon: '❄️', cd: 2, weight: 2 },
    { name: 'Glacier Guard', kind: 'shieldAll', shield: 0.2, heal: 0.1, icon: '🫧', cd: 3, weight: 1 },
  ],
};

/* The two numb birds live where the chili grows worst: the dusty canyon and
   the salt shore. They join the pool before worlds are stamped on birds. */
DATA.worldRoster[2].push('numbwing');
DATA.worldRoster[4].push('brinewretch');
DATA.worldRoster[2].push('bristleback');
DATA.worldRoster[4].push('spikegull');
DATA.birdWorld.numbwing = 2;
DATA.birdWorld.brinewretch = 4;
DATA.birdWorld.bristleback = 2;
DATA.birdWorld.spikegull = 4;

/* The castle's walking wall. Three full rounds of wind-up, then one slam that
   always stuns — no dice, no luck, exactly what its card says. */
DATA.enemies.ironclad = {
  name: 'Ironhide Colossus', art: 'ironclad', hp: 640, atk: 26, armor: 0.18,
  lore: 'A slab of castle iron that learned to breathe. It plants its feet, counts to three, and lets the ground answer for it.',
  trait: 'Living wall: bows its head for 3 rounds, then a slam that always stuns',
  moves: [
    { name: 'Ironfall', kind: 'charge', rounds: 3, mult: 2.5, stun: 2, icon: '🪨', weight: 1, desc: 'Winds up for 3 rounds, then slams one pig for 250% of its damage and stuns it for 2 rounds.' },
    { name: 'Iron Peck', kind: 'single', mult: 0.85, weight: 1 },
    { name: 'Iron Aegis', kind: 'self', shieldBirds: 0.2, icon: '🗿', cd: 3, weight: 1, desc: 'Slams its shield into the ground: every bird takes 20% less damage for 2 rounds.' },
  ],
};
DATA.worldRoster[5].push('ironclad');
DATA.birdWorld.ironclad = 5;

/* ---------------- The exposed flock ----------------
   Three new birds per world. Every one carries an Exposed move: the victim
   takes 25% more damage for 2 rounds. Birds use it on pigs; pigs answer with
   Smoke Bomb, Hex and the Hex Totem relic. */
Object.assign(DATA.enemies, {
  emberwing: {
    name: 'Ember Wing', art: 'emberwing', hp: 82, atk: 17, role: 'Skirmisher',
    lore: 'A cinder-feathered jay that fights like a falling spark.',
    trait: 'Scorches a pig open: +25% damage taken',
    moves: [
      { name: 'Smoulder Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Ember Peck', kind: 'single', mult: 1.0, expose: 2, icon: '🩸', weight: 2, desc: 'Burns a pig open for 100% of its damage; it takes 25% more damage for 2 rounds.' },
      { name: 'Ash Cloud', kind: 'aoe', mult: 0.4, weaken: 2, icon: '🌫️', weight: 1 },
    ],
  },
  galebeak: {
    name: 'Gale Beak', art: 'galebeak', hp: 74, atk: 16, role: 'Caster',
    lore: 'It cuts the wind into ribbons and throws them at the pigs.',
    trait: 'Wind opens cuts: +25% damage taken',
    moves: [
      { name: 'Buffet', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Gust Slash', kind: 'single', mult: 0.9, expose: 2, icon: '🩸', weight: 2, desc: 'Slices one pig for 90% of its damage and leaves it exposed for 2 rounds.' },
      { name: 'Tailwind', kind: 'self', rage: 0.25, rageTurns: 2, icon: '🔥', weight: 1, desc: 'Rides its own gale: +25% damage for 2 rounds.' },
    ],
  },
  shellguard: {
    name: 'Shell Guard', art: 'shellguard', hp: 112, atk: 13, armor: 0.1, role: 'Tank',
    lore: 'A walking eggshell with a bad attitude and a worse crack.',
    trait: 'Armoured; its cracks expose the squad',
    moves: [
      { name: 'Shell Bash', kind: 'single', mult: 1.1, weight: 3 },
      { name: 'Crack Shell', kind: 'aoe', mult: 0.35, expose: 2, icon: '🩸', weight: 1, desc: 'Splinters its shell over the squad: everyone takes 25% more damage for 2 rounds.' },
    ],
  },
  dustdevil: {
    name: 'Dust Devil', art: 'dustdevil', hp: 120, atk: 22, role: 'Skirmisher',
    lore: 'A spinning column of sand with a beak somewhere inside it.',
    trait: 'Sand scours pigs open: +25% damage taken',
    moves: [
      { name: 'Sand Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Sand Lance', kind: 'single', mult: 1.05, expose: 2, icon: '🩸', weight: 2, desc: 'Drills one pig for 105% of its damage and leaves it exposed for 2 rounds.' },
      { name: 'Dust Veil', kind: 'self', dodge: 2, icon: '💨', weight: 1, desc: 'Spins into the dust: the next 2 hits miss.' },
    ],
  },
  sunspot: {
    name: 'Sunspot', art: 'sunspot', hp: 104, atk: 24, role: 'Caster',
    lore: 'It stares at the sun until the sun stares back.',
    trait: 'Solar glare exposes a pig',
    moves: [
      { name: 'Scorch Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Solar Flare', kind: 'single', mult: 0.9, expose: 3, icon: '☀️', weight: 2, desc: 'Burns one pig for 90% of its damage; it takes 25% more damage for 3 rounds.' },
      { name: 'Heat Haze', kind: 'self', rage: 0.25, rageTurns: 2, icon: '🔥', weight: 1, desc: 'Shimmers with heat: +25% damage for 2 rounds.' },
    ],
  },
  mesabreaker: {
    name: 'Mesa Breaker', art: 'mesabreaker', hp: 170, atk: 19, armor: 0.14, role: 'Bruiser',
    lore: 'It headbutts canyon walls for fun. The walls lose.',
    trait: 'Armoured; rubble leaves the squad exposed',
    moves: [
      { name: 'Mesa Slam', kind: 'single', mult: 1.2, weight: 3 },
      { name: 'Rubble Rain', kind: 'aoe', mult: 0.45, expose: 2, icon: '🩸', weight: 1, desc: 'Buries the squad in rubble: everyone takes 25% more damage for 2 rounds.' },
    ],
  },
  rimecaller: {
    name: 'Rime Caller', art: 'rimecaller', hp: 118, atk: 25, role: 'Caster',
    lore: 'It calls the frost by name. The frost always answers.',
    trait: 'Frost marks a pig: +25% damage taken',
    moves: [
      { name: 'Frost Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Rime Shard', kind: 'single', mult: 0.95, expose: 2, icon: '🩸', weight: 2, desc: 'Stakes a shard in one pig for 95% of its damage and leaves it exposed for 2 rounds.' },
      { name: 'Frost Mark', kind: 'aoe', mult: 0.35, freeze: 1, icon: '❄️', weight: 1 },
    ],
  },
  snowblind: {
    name: 'Snowblind', art: 'snowblind', hp: 106, atk: 26, role: 'Skirmisher',
    lore: 'You cannot hit what you cannot see, and it prefers it that way.',
    trait: 'Whiteout exposes a pig; wards the flock',
    moves: [
      { name: 'Snow Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Whiteout Peck', kind: 'single', mult: 1.0, expose: 2, icon: '🩸', weight: 2, desc: 'Strikes from the blizzard for 100% of its damage and leaves the pig exposed for 2 rounds.' },
      { name: 'Blind Drift', kind: 'self', shieldBirds: 0.15, icon: '🛡️', cd: 3, weight: 1, desc: 'Throws up a whiteout: the flock takes 15% less damage for 2 rounds.' },
    ],
  },
  glacierwing: {
    name: 'Glacier Wing', art: 'glacierwing', hp: 176, atk: 20, armor: 0.16, role: 'Bruiser',
    lore: 'A slab of old ice that learned to fly and immediately regretted it.',
    trait: 'Armoured; ice cracks expose the squad',
    moves: [
      { name: 'Glacier Crush', kind: 'single', mult: 1.15, weight: 3 },
      { name: 'Ice Crack', kind: 'aoe', mult: 0.4, expose: 2, icon: '🩸', weight: 1, desc: 'Splits the ice under the squad: everyone takes 25% more damage for 2 rounds.' },
    ],
  },
  saltfang: {
    name: 'Salt Fang', art: 'saltfang', hp: 132, atk: 24, role: 'Skirmisher',
    lore: 'Its beak is crusted with salt and its temper with rust.',
    trait: 'Salt bites open a pig: +25% damage taken',
    moves: [
      { name: 'Brine Bite', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Salt Fang', kind: 'single', mult: 1.05, expose: 2, icon: '🩸', weight: 2, desc: 'Bites one pig for 105% of its damage and leaves it exposed for 2 rounds.' },
      { name: 'Brine Spray', kind: 'aoe', mult: 0.4, drench: 2, icon: '🌊', weight: 1 },
    ],
  },
  stormpetrel: {
    name: 'Storm Petrel', art: 'stormpetrel', hp: 118, atk: 23, role: 'Skirmisher',
    lore: 'It flies in the eye of the storm because the storm lets it.',
    trait: 'Storm strikes expose a pig; rides the gale',
    moves: [
      { name: 'Storm Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Storm Dive', kind: 'multi', mult: 0.5, hits: 2, expose: 2, icon: '🩸', weight: 2, desc: 'Hits twice for 50% of its damage each and leaves the pig exposed for 2 rounds.' },
      { name: 'Squall Wing', kind: 'self', rage: 0.25, rageTurns: 2, icon: '🔥', weight: 1, desc: 'Catches a squall: +25% damage for 2 rounds.' },
    ],
  },
  brinepriest: {
    name: 'Brine Priest', art: 'brinepriest', hp: 142, atk: 18, role: 'Support',
    lore: 'It blesses the flock with salt and the pigs with bad news.',
    trait: 'Heals the flock; its sermon exposes the squad',
    moves: [
      { name: 'Salt Jab', kind: 'single', mult: 0.95, weight: 3 },
      { name: 'Brine Blessing', kind: 'healAlly', heal: 0.3, icon: '🌊', cd: 2, weight: 2 },
      { name: 'Salt Sermon', kind: 'aoe', mult: 0.35, expose: 2, icon: '🩸', weight: 2, desc: 'Preaches salt at the squad: everyone takes 25% more damage for 2 rounds.' },
    ],
  },
  giltwing: {
    name: 'Gilt Wing', art: 'giltwing', hp: 150, atk: 27, role: 'Skirmisher',
    lore: 'Its feathers are gold leaf. It sheds them into pigs on purpose.',
    trait: 'Gilded cuts expose a pig: +25% damage taken',
    moves: [
      { name: 'Gold Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Gilded Talon', kind: 'single', mult: 1.1, expose: 2, icon: '🩸', weight: 2, desc: 'Rakes one pig for 110% of its damage and leaves it exposed for 2 rounds.' },
      { name: 'Coin Storm', kind: 'aoe', mult: 0.45, icon: '🪙', weight: 1 },
    ],
  },
  stonemason: {
    name: 'Stonemason', art: 'stonemason', hp: 205, atk: 22, armor: 0.18, role: 'Tank',
    lore: 'It built half the castle. It would like the pigs to leave it alone.',
    trait: 'Armoured; mortar dust exposes the squad',
    moves: [
      { name: 'Mortar Peck', kind: 'single', mult: 1.1, weight: 3 },
      { name: 'Foundation Crack', kind: 'aoe', mult: 0.35, expose: 2, icon: '🩸', weight: 1, desc: 'Cracks the floor under the squad: everyone takes 25% more damage for 2 rounds.' },
    ],
  },
  courtjester: {
    name: 'Court Jester', art: 'courtjester', hp: 124, atk: 25, role: 'Caster',
    lore: 'The only bird allowed to insult the King, which it does constantly.',
    trait: 'Mocking cuts expose a pig for longer',
    moves: [
      { name: 'Jester Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: "Jester's Cut", kind: 'single', mult: 0.9, expose: 3, icon: '🩸', weight: 2, desc: 'Cuts one pig for 90% of its damage and leaves it exposed for 3 rounds.' },
      { name: 'Mocking Bow', kind: 'self', dodge: 1, icon: '💨', weight: 1, desc: 'Bows sarcastically: the next hit misses.' },
    ],
  },

  /* ---------------- Dungeon-only birds ----------------
     These never appear on the campaign map. They live in the endless
     dungeon and use the same status rules as the rest of the flock. */
  chainwraith: {
    name: 'Chain Wraith', art: 'gloomowl', hp: 260, atk: 27, haunt: true, dungeonOnly: true,
    role: 'Dungeon',
    lore: 'A bird-shaped absence dragging the chains of everything it has already eaten.',
    trait: 'Dungeon only · drains life through its chains',
    moves: [
      { name: 'Grave Chain', kind: 'single', mult: 1.0, stun: 1, leech: 0.35, icon: '⛓️', weight: 3, desc: 'Binds one pig for 100% of its damage, stuns it for a round and heals the Wraith for 35% of the damage.' },
      { name: 'Wailing Gale', kind: 'aoe', mult: 0.4, weaken: 2, icon: '🌫️', weight: 1, desc: 'A cold scream weakens the whole squad for 2 rounds.' },
    ],
  },
  cindermaw: {
    name: 'Cinder Maw', art: 'kraken', hp: 380, atk: 30, armor: 0.12, dungeonOnly: true,
    role: 'Dungeon',
    lore: 'The floor opened once and something with a beak crawled out of the embers.',
    trait: 'Dungeon only · armoured, poisonous bite',
    moves: [
      { name: 'Ember Gullet', kind: 'single', mult: 1.15, poison: 3, icon: '☠️', weight: 3, desc: 'Swallows a pig in cinders: 115% of its damage and poison for 3 rounds.' },
      { name: 'Ashfall', kind: 'aoe', mult: 0.45, poison: 2, icon: '🌋', cd: 2, weight: 1, desc: 'Buries the squad in hot ash: 45% of its damage and poison for 2 rounds.' },
    ],
  },
  mirrorshell: {
    name: 'Mirror Shell', art: 'shellguard', hp: 230, atk: 21, armor: 0.18, dungeonOnly: true,
    role: 'Dungeon',
    lore: 'A polished shell that reflects the torchlight, the pigs, and every spell thrown at it.',
    trait: 'Dungeon only · armoured, shields the flock, silences the squad',
    moves: [
      { name: 'Prism Peck', kind: 'single', mult: 1.1, weight: 3 },
      { name: 'Glass Ward', kind: 'shieldAll', shield: 0.16, icon: '🛡️', weight: 1 },
      { name: 'Dazzle', kind: 'aoe', mult: 0.35, silence: 2, icon: '✨', cd: 2, weight: 1, desc: 'A flash of reflected light silences every pig for 2 rounds.' },
    ],
  },
});
/* New dungeon-only birds for the two status effects that needed a dedicated
   carrier: burn on the pigs, and mire stealing their healing. */
Object.assign(DATA.enemies, {
  cinderwing: {
    name: 'Cinderwing', art: 'emberwing', hp: 250, atk: 26, dungeonOnly: true,
    role: 'Dungeon',
    lore: 'A coal-black wing that never stopped smouldering after the first world burned.',
    trait: 'Dungeon only · burning feathers set the squad alight',
    moves: [
      { name: 'Cinder Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Firefall', kind: 'aoe', mult: 0.4, burn: { turns: 2 }, icon: '🔥', cd: 2, weight: 1, desc: 'Rains burning feathers: 40% of its damage and burn on every pig for 2 rounds.' },
    ],
  },
  mirewing: {
    name: 'Mirewing', art: 'bristleback', hp: 300, atk: 23, dungeonOnly: true,
    role: 'Dungeon',
    lore: 'It nests in the flooded levels and drinks every drop of healing the pigs bring.',
    trait: 'Dungeon only · mires the squad so the flock steals their healing',
    moves: [
      { name: 'Bog Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Silt Gulp', kind: 'single', mult: 0.8, mire: 3, icon: '🕳️', weight: 2, desc: 'Coats one pig in mire: 80% of its damage and 3 rounds of stolen healing.' },
      { name: 'Muck Spray', kind: 'aoe', mult: 0.35, mire: 2, icon: '🕳️', cd: 2, weight: 1, desc: 'Sprays the whole squad: 35% of its damage and 2 rounds of stolen healing.' },
    ],
  },
});
DATA.worldRoster[1].push('emberwing', 'galebeak', 'shellguard');
DATA.worldRoster[2].push('dustdevil', 'sunspot', 'mesabreaker');
DATA.worldRoster[3].push('rimecaller', 'snowblind', 'glacierwing');
DATA.worldRoster[4].push('saltfang', 'stormpetrel', 'brinepriest');
DATA.worldRoster[5].push('giltwing', 'stonemason', 'courtjester');
Object.assign(DATA.birdWorld, {
  emberwing: 1, galebeak: 1, shellguard: 1,
  dustdevil: 2, sunspot: 2, mesabreaker: 2,
  rimecaller: 3, snowblind: 3, glacierwing: 3,
  saltfang: 4, stormpetrel: 4, brinepriest: 4,
  giltwing: 5, stonemason: 5, courtjester: 5,
});

/* ---------------- Knight variants ----------------
   The same knight kit in two costumes. Both raise a shield wall and both wear
   a guard that halves any hit below their threshold; only the name, the body
   and the size of the guard change between the canyon and the castle. */
Object.assign(DATA.enemies, {
  duneknight: {
    name: 'Dune Knight', art: 'duneknight', hp: 168, atk: 18, armor: 0.16, role: 'Tank',
    halfAt: 55,
    lore: 'A canyon bird in sun-bleached plate. The sand wore the colour off, not the manners.',
    trait: "Knight: shields the flock · hits under 55 deal half damage",
    moves: [
      { name: 'Shield Wall', kind: 'shieldAll', shield: 0.14, icon: '🛡️', cd: 2, weight: 2 },
      { name: 'Lance Thrust', kind: 'single', mult: 1.25, weight: 3 },
    ],
  },
  gildedknight: {
    name: 'Gilded Knight', art: 'gildedknight', hp: 235, atk: 25, armor: 0.2, role: 'Tank',
    halfAt: 110,
    lore: 'The same knight, promoted and dipped in gold. Shinier plate, identical technique.',
    trait: "Knight: shields the flock · hits under 110 deal half damage",
    moves: [
      { name: 'Shield Wall', kind: 'shieldAll', shield: 0.14, icon: '🛡️', cd: 2, weight: 2 },
      { name: 'Lance Thrust', kind: 'single', mult: 1.25, weight: 3 },
    ],
  },
});
DATA.worldRoster[2].push('duneknight');
DATA.worldRoster[5].push('gildedknight');
Object.assign(DATA.birdWorld, { duneknight: 2, gildedknight: 5 });

/* ---------------- The clever flock ----------------
   Three birds, three rules the flock did not have yet:
   · Mirror Magpie sends a share of the wound it takes back to the striker.
   · Pepper Pilferer eats the squad's pepper charge with every hit.
   · Chorus Wren lifts every beak on the field, so killing it first matters.
   All three are ordinary passes through the same turn engine, so a listed
   number is what actually happens. */
Object.assign(DATA.enemies, {
  magpie: {
    name: 'Mirror Magpie', art: 'magpie', hp: 132, atk: 22, reflect: 0.3, role: 'Trickster',
    lore: 'Collects shiny things: bottle caps, lost earrings, and the last hit you landed on it.',
    trait: 'Mirror — returns 30% of every wound it takes to the pig that dealt it',
    moves: [
      { name: 'Glass Peck', kind: 'single', mult: 1.0, weight: 3 },
      { name: 'Shatter Shriek', kind: 'aoe', mult: 0.45, silence: 2, icon: '🪞', cd: 2, weight: 2 },
    ],
  },
  pilferer: {
    name: 'Pepper Pilferer', art: 'pilferer', hp: 118, atk: 20, role: 'Skirmisher',
    lore: 'A canyon thief with a sack of stolen spice. It eats your pepper before you can spend it.',
    trait: 'Sticky fingers — every hit steals 4 pepper charge from the squad',
    moves: [
      { name: 'Snatch Peck', kind: 'single', mult: 0.9, stealPepper: 4, icon: '🌶️', weight: 3 },
      { name: 'Spice Sack', kind: 'aoe', mult: 0.4, weaken: 2, stealPepper: 2, icon: '🧂', cd: 2, weight: 2 },
    ],
  },
  chorus: {
    name: 'Chorus Wren', art: 'chorus', hp: 112, atk: 15, packAtk: 0.08, role: 'Support',
    lore: 'Sings the whole flock louder. Every friend still standing is another verse.',
    trait: 'Pack song — +8% damage for every living bird, itself included',
    moves: [
      { name: 'Chorus Peck', kind: 'single', mult: 0.95, weight: 3 },
      { name: 'Rising Verse', kind: 'aoe', mult: 0.42, weaken: 1, weight: 2 },
      { name: 'Flock Hymn', kind: 'shieldAll', shield: 0.12, heal: 0.06, icon: '🎵', cd: 3, weight: 1 },
    ],
  },
});
DATA.worldRoster[1].push('chorus');
DATA.worldRoster[2].push('pilferer');
DATA.worldRoster[4].push('magpie');
Object.assign(DATA.birdWorld, { chorus: 1, pilferer: 2, magpie: 4 });

/* Relic rider: the Hex Totem leaves birds exposed for a third round. */
(function () {
  const totem = DATA.relics.find((r) => r.id === 'wizard_r2');
  if (!totem) return;
  totem.mods = totem.mods || {};
  totem.mods.hex = Object.assign({}, totem.mods.hex, { expose: 3 });
})();

Object.keys(DATA.enemies).forEach((k) => {
  const b = DATA.enemies[k];
  b.id = k;
  b.world = b.dungeonOnly ? 0 : (DATA.birdWorld[k] || 1);
  /* Dungeon-only birds borrow an existing sprite until they get their own. */
  b.art = b.art || k;
});
DATA.dungeonBirds = ['chainwraith', 'cindermaw', 'mirrorshell', 'cinderwing', 'mirewing'];

/* Rewrite every lineup so a bird only ever fights in its own world. */
DATA._levelRows.forEach((row) => {
  const roster = DATA.worldRoster[row.world] || DATA.worldRoster[1];
  const seed = row.id.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0);
  row.e = (row.e || []).map(([t, hp, atk], i) => {
    const known = DATA.enemies[t];
    if (known && (known.world || 1) === row.world) return [t, hp, atk];
    const bird = roster[(seed + i) % roster.length];
    return [bird, hp, atk];
  });
  if (row.boss && row.e.length) row.e[0] = [DATA.worldBoss[row.world], row.e[0][1], row.e[0][2]];
});

/* Terence the Wall carries 1,000 base HP. Levels that use him as an escort keep
   roughly the fight they had, so his slice of the lineup is rescaled to match
   (about a third more than before, because he is supposed to feel like a wall). */
DATA._levelRows.forEach((row) => {
  row.e = (row.e || []).map(([t, hp, atk]) => {
    if (t === 'terence') return [t, +(hp * 0.55).toFixed(3), atk];
    if (t === 'yeti') return [t, +(hp * 0.3).toFixed(3), atk];
    return [t, hp, atk];
  });
});
/* The Last Stand is the gauntlet before Mother Flock: Terence blocks it at his
   full 1,000 HP instead of a slice, so the wall actually shows up once. */
const lastStand = DATA._levelRows.find((r) => r.id === 'c17');
if (lastStand) lastStand.e = lastStand.e.map(([t, hp, atk]) => (t === 'terence' ? [t, 1, atk] : [t, hp, atk]));
/* Yeti Den is the snow wall's full-health showing. */
const yetiDen = DATA._levelRows.find((r) => r.id === 'f36');
if (yetiDen) yetiDen.e = yetiDen.e.map(([t, hp, atk]) => (t === 'yeti' ? [t, 1, atk] : [t, hp, atk]));

/* ---------------- The three that come back ---------------- */
/* Most birds stay dead. Three do not: one from Frost Peak and two from the
   deep water, each rising again as its own kind of ghost. */
DATA.ghostTypes = {
  drowned: {
    name: 'Drowned Ghost', icon: '🌊', colour: '#6fc6ff', timer: 2, hp: 0.45,
    drench: 2,
    blurb: 'rises dripping and drenches the whole squad',
  },
  lantern: {
    name: 'Lantern Wraith', icon: '🕯️', colour: '#ffd98a', timer: 2, hp: 0.55,
    shield: 0.28,
    blurb: 'rises wrapped in cold fire and shielded',
  },
  fog: {
    name: 'Fog Shade', icon: '🌫️', colour: '#cfd8e3', timer: 2, hp: 0.35,
    silence: 1,
    blurb: 'comes back a round sooner and fog-silences a pig',
  },
  rime: {
    name: 'Rime Shade', icon: '❄️', colour: '#bfeaff', timer: 3, hp: 0.45,
    freeze: 1,
    blurb: 'rises frozen and freezes a pig solid',
  },
  hoarfrost: {
    name: 'Hoarfrost Wraith', icon: '🌨️', colour: '#e6f7ff', timer: 2, hp: 0.5,
    shield: 0.22,
    blurb: 'comes back a round sooner, sheathed in ice',
  },
};
/* The only birds that ever leave a ghost behind. Everything else stays down,
   and even these lose their ghost the moment the living flock is wiped. */
DATA.ghostBirds = {
  frost: 'rime',
  icefall: 'hoarfrost',
  brinebinder: 'drowned',
};
DATA.ghostFor = function (key) {
  const id = DATA.ghostBirds[key];
  return id ? Object.assign({ id }, DATA.ghostTypes[id]) : null;
};

/* Every bird that leaves a ghost says so on its card, with the countdown: a
   ghost is a second health bar, and the player should know it is coming. */
Object.keys(DATA.ghostBirds).forEach((key) => {
  const b = DATA.enemies[key];
  if (!b) return;
  const g = DATA.ghostTypes[DATA.ghostBirds[key]] || {};
  b.trait = (b.trait ? b.trait + ' · ' : '') + 'Ghost: revives in ' + (g.timer || 2) + ' rounds';
});

/* More passives, all using rules the engine already runs: iron hide on the
   other walls, thorns on the bramble birds. */
DATA.morePassives = {
  frostwall: { soakAt: 60 },
  tidewall: { soakAt: 60 },
  royalguard: { soakAt: 80 },
  stonebeak: { soakAt: 55 },
  thornwing: { thorns: 0.3 },
  mossback: { thorns: 0.25 },
  /* Cornered birds fight harder: below 35% HP they hit for a third more. */
  bristleback: { berserk: 0.33 },
  shrieker: { berserk: 0.25 },
};
Object.keys(DATA.morePassives).forEach((id) => {
  const b = DATA.enemies[id];
  if (!b) return;
  const cfg = DATA.morePassives[id];
  if (cfg.soakAt) {
    b.soakAt = Math.max(b.soakAt || 0, cfg.soakAt);
    b.trait = (b.trait ? b.trait + ' · ' : '') + 'iron hide: hits under ' + cfg.soakAt + ' deal 75%';
  }
  if (cfg.thorns) {
    b.thorns = Math.max(b.thorns || 0, cfg.thorns);
    b.trait = (b.trait ? b.trait + ' · ' : '') + 'thorns: returns ' + Math.round(cfg.thorns * 100) + '% of its damage when hit';
  }
  if (cfg.berserk) {
    b.berserk = Math.max(b.berserk || 0, cfg.berserk);
    b.trait = (b.trait ? b.trait + ' · ' : '') + 'berserk: below 35% HP it deals +' + Math.round(cfg.berserk * 100) + '% damage';
  }
});

/* Wave variety and summons draw only from the world you are standing in. */
DATA.summonsByWorld = {
  1: DATA.worldRoster[1].slice(),
  2: DATA.worldRoster[2].slice(),
  3: DATA.worldRoster[3].slice(),
  4: DATA.worldRoster[4].slice(),
  5: DATA.worldRoster[5].slice(),
};
/* ============================================================
   World attack kits
   ------------------------------------------------------------
   The same kind of bird fights differently depending on where it
   lives. Egg World staggers with blunt, whole-squad shell hits;
   Cuckoo Canyon grinds with poison, silence and marks; Frost Peak
   FREEZES (a pig loses a turn and takes extra damage); Saltwind
   Shore DRENCHES (shields are washed off, damage taken rises).
   ============================================================ */
DATA.birdMoves = {
  /* ---- Egg World: shellshock ---- */
  sparrow: [
    { name: 'Shell Tap', kind: 'single', mult: 0.85, weight: 2 },
    { name: 'Wing Flurry', kind: 'multi', mult: 0.5, hits: 2, weight: 1 },
    { name: 'Eggshell Fleck', kind: 'single', mult: 0.5, silence: 1, weight: 1 },
  ],
  red: [
    { name: 'Beak Jab', kind: 'single', mult: 1.0, weight: 3 },
    { name: 'Egg Shrapnel', kind: 'aoe', mult: 0.45, stun: 1, icon: '🥚', cd: 2, weight: 1 },
    { name: 'Sour Yolk', kind: 'single', mult: 0.55, silence: 2, weight: 1 },
  ],
  chuck: [
    { name: 'Yolk Dash', kind: 'multi', mult: 0.62, hits: 2, weight: 3 },
    { name: 'Clipped Wing', kind: 'single', mult: 0.9, stun: 1, weight: 1 },
    { name: 'Shell Shock', kind: 'aoe', mult: 0.35, stun: 1, icon: '🥚', cd: 2, weight: 1 },
  ],
  blue: [
    { name: 'Triple Yolk', kind: 'multi', mult: 0.5, hits: 3, random: true, weight: 3 },
    { name: 'Nest Screech', kind: 'aoe', mult: 0.4, weaken: 2, weight: 1 },
    { name: 'Shellburst', kind: 'aoe', mult: 0.42, stun: 1, icon: '🥚', cd: 3, weight: 1 },
  ],
  matilda: [
    { name: 'Warm Egg', kind: 'healAlly', heal: 0.4, icon: '🥚', cd: 2 },
    { name: 'Yolk Bomb', kind: 'single', mult: 1.15, weight: 2 },
  ],
  hal: [
    { name: 'Shell Boomerang', kind: 'aoe', mult: 0.6, targetCount: 2, weight: 3 },
    { name: 'Ring Out', kind: 'single', mult: 1.05, stun: 1, weight: 1 },
  ],
  bubbles: [
    { name: 'Foam Barrage', kind: 'multi', mult: 0.62, hits: 3, random: true, weight: 3 },
    { name: 'Soap Hex', kind: 'aoe', mult: 0.35, silence: 1, weight: 1 },
    { name: 'Shell Bubbles', kind: 'aoe', mult: 0.4, stun: 1, icon: '🥚', cd: 3, weight: 1 },
  ],
  stella: [
    { name: 'Nest Ward', kind: 'shieldAll', shield: 0.22, heal: 0.12, icon: '🫧', cd: 3 },
    { name: 'Prism Peck', kind: 'single', mult: 1.2, weight: 2 },
  ],
  eagle: [
    { name: 'Sky Talon', kind: 'single', mult: 1.7, weight: 2 },
    { name: 'Skyfall', kind: 'charge', rounds: 3, mult: 2.6, all: true, cd: 3, icon: '🪶', weight: 2 },
    { name: 'Eyrie Shriek', kind: 'aoe', mult: 0.45, weaken: 2, weight: 1 },
  ],

  /* ---- Cuckoo Canyon: sand, venom, marks ---- */
  diver: [
    { name: 'Canyon Dive', kind: 'single', mult: 1.0, weight: 3 },
    { name: 'Dust Plunge', kind: 'multi', mult: 0.55, hits: 2, weight: 1 },
    { name: 'Grit Gust', kind: 'aoe', mult: 0.35, weaken: 2, icon: '🪨', cd: 2, weight: 1 },
  ],
  hawk: [
    { name: 'Ridge Strike', kind: 'single', mult: 1.15, weight: 3 },
    { name: 'Talon Rend', kind: 'single', mult: 0.8, poison: 2, weight: 1 },
  ],
  vulture: [
    { name: 'Bone Pick', kind: 'single', mult: 1.0, weight: 3 },
    { name: 'Bone Stare', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
  ],
  spitter: [
    { name: 'Sand Spit', kind: 'single', mult: 0.85, weight: 3 },
    { name: 'Canyon Venom', kind: 'single', mult: 0.6, poison: 3, weight: 2 },
    { name: 'Dust Storm', kind: 'aoe', mult: 0.3, poison: 2, icon: '☠️', cd: 2, weight: 1 },
  ],
  shrike: [
    { name: 'Thorn Volley', kind: 'multi', mult: 0.45, hits: 3, weight: 3 },
    { name: 'Barbed Ambush', kind: 'single', mult: 0.8, poison: 2, silence: 1, weight: 2 },
  ],
  ram: [
    { name: 'Ridge Ram', kind: 'single', mult: 1.1, weight: 2 },
    { name: 'Canyon Rockslide', kind: 'aoe', mult: 0.5, poison: 2, icon: '🪨', cd: 2, weight: 1 },
    { name: 'Canyon Charge', kind: 'charge', rounds: 3, mult: 2.3, stun: 1, weight: 2 },
  ],
  nestkeeper: [
    { name: 'Canyon Brood', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Dust Buffet', kind: 'single', mult: 0.8, weight: 2 },
  ],
  canyoncaller: [
    { name: 'Echo Chorus', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Canyon Echo', kind: 'aoe', mult: 0.45, silence: 1, weight: 2 },
  ],
  harrier: [
    { name: 'Dune Dive', kind: 'single', mult: 1.15, weight: 3 },
    { name: 'Sand Shadow', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
    /* Weather: wind hits the whole squad and leaves them weak. */
    { name: 'Sandstorm', kind: 'aoe', mult: 0.45, weaken: 2, icon: '🌪️', cd: 3, weight: 1, desc: 'Sand whips the whole squad for 45% of its damage and leaves every pig weakened for 2 rounds.' },
    { name: 'Battle Screech', kind: 'self', rage: 0.25, rageTurns: 2, icon: '🔥', weight: 1, desc: 'Screams itself into a fury: +25% damage for 2 rounds.' },
  ],
  terence: [
    { name: 'Boulder Beak', kind: 'single', mult: 1.3, weight: 3 },
    { name: 'Titan Hammer', kind: 'charge', rounds: 3, mult: 2.8, stun: 2, scaled: true, cd: 3, icon: '🔨', weight: 2, desc: 'Winds up for 3 rounds, then brings the hammer down for 280% of its damage and a 2-round stun.' },
    { name: 'Quake Step', kind: 'single', mult: 0.9, stun: 1, weight: 1 },
  ],
  mother: [
    { name: 'Shellstorm', kind: 'charge', rounds: 3, mult: 2.7, all: true, cd: 3, icon: '🥚', weight: 2 },
    { name: 'Gorge', kind: 'single', mult: 1.65, weight: 2 },
    { name: 'Brood Guard', kind: 'shieldAll', shield: 0.18, heal: 0.08, weight: 1 },
  ],

  /* ---- Frost Peak: freeze ---- */
  frost: [
    { name: 'Rime Lance', kind: 'single', mult: 1.0, weight: 3 },
    { name: 'Shiver Peck', kind: 'single', mult: 0.8, weaken: 2, weight: 1 },
    { name: 'Freeze Zone', kind: 'aoe', mult: 0.45, freeze: 1, icon: '❄️', cd: 3, weight: 2 },
  ],
  balloon: [
    { name: 'Ice Swoop', kind: 'single', mult: 1.1, weight: 3 },
    { name: 'Whiteout Drift', kind: 'self', mult: 0, dodge: 2, weight: 1, desc: 'Drifts into the blizzard: the next 2 hits miss.' },
    /* Weather: snow falls on every pig at once and freezes them in place. */
    { name: 'Snow Squall', kind: 'aoe', mult: 0.38, freeze: 1, icon: '❄️', cd: 3, weight: 1, desc: 'Snow buries the whole squad for 38% of its damage and freezes each pig for a round.' },
  ],
  yeti: [
    { name: 'Glacier Slam', kind: 'single', mult: 1.4, stun: 1, weight: 2 },
    { name: 'Deep Snow', kind: 'aoe', mult: 0.7, freeze: 1, icon: '❄️', cd: 3, weight: 1 },
    { name: 'Permafrost Charge', kind: 'charge', rounds: 3, mult: 1.9, stun: 1, weight: 1 },
  ],
  mammoth: [
    { name: 'Tundra Tusk', kind: 'single', mult: 1.5, weight: 2 },
    { name: 'Herd Stampede', kind: 'aoe', mult: 0.7, freeze: 1, icon: '❄️', cd: 3, weight: 1 },
    { name: 'Frozen Hide', kind: 'shieldAll', mult: 0, shield: 0.12, weight: 1 },
    { name: 'Glacial Rush', kind: 'charge', rounds: 3, mult: 2.1, stun: 2, weight: 1 },
  ],
  frostcaller: [
    { name: 'Blizzard Call', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Frost Shriek', kind: 'single', mult: 0.7, freeze: 1, weight: 2 },
    /* Weather: a hail shower across the whole squad. */
    { name: 'Hailstorm', kind: 'aoe', mult: 0.5, freeze: 1, icon: '🌨️', cd: 3, weight: 1, desc: 'Hail hammers every pig for 50% of its damage and freezes them for a round.' },
  ],
  frostwall: [
    { name: 'Ice Shoulder', kind: 'single', mult: 1.35, freeze: 1, weight: 3 },
    { name: 'Permafrost Plate', kind: 'shieldAll', shield: 0.14, weight: 1 },
    { name: 'Avalanche Slam', kind: 'charge', rounds: 3, mult: 2.3, stun: 2, cd: 3, icon: '🧊', weight: 2 },
  ],
  rimeweaver: [
    { name: 'Rime Mend', kind: 'healAlly', heal: 0.22, icon: '❄️', cd: 2, weight: 2 },
    { name: 'Glass Hex', kind: 'single', mult: 0.7, silence: 2, freeze: 1, pepperDry: 3, weight: 2 },
    { name: 'Hoar Ward', kind: 'shieldAll', shield: 0.16, heal: 0.06, weight: 1 },
  ],
  icefall: [
    { name: 'Icefall Shoulder', kind: 'single', mult: 1.4, freeze: 1, weight: 3 },
    { name: 'Frostbound Plate', kind: 'shieldAll', shield: 0.15, weight: 1 },
    { name: 'Glacier Drop', kind: 'charge', rounds: 3, mult: 2.4, stun: 2, freeze: 1, cd: 3, icon: '🧊', weight: 2 },
  ],
  frostbinder: [
    { name: 'Rime Call', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Frozen Sigil', kind: 'aoe', mult: 0.42, freeze: 1, icon: '❄️', cd: 2, weight: 2 },
    { name: 'Hoarfrost Ward', kind: 'shieldAll', shield: 0.16, heal: 0.06, weight: 1 },
  ],
  frostking: [
    { name: 'Crown of Ice', kind: 'single', mult: 1.55, weight: 2 },
    { name: 'Whiteout', kind: 'charge', rounds: 3, mult: 2.7, all: true, cd: 3, icon: '❄️', weight: 2 },
    { name: 'Glacier Wall', kind: 'shieldAll', shield: 0.2, heal: 0.1, icon: '🫧', cd: 3, weight: 1 },
  ],

  /* ---- Saltwind Shore: drench ---- */
  gull: [
    { name: 'Shore Dive', kind: 'single', mult: 1.0, weight: 3 },
    { name: 'Twin Snatch', kind: 'multi', mult: 0.55, hits: 2, weight: 2 },
    { name: 'Gull Alarm', kind: 'summon', icon: '🥚', cd: 3, weight: 1 },
    /* Weather: salt rain soaks the whole squad, washing shields away. */
    { name: 'Salt Rain', kind: 'aoe', mult: 0.42, drench: 2, icon: '🌧️', cd: 3, weight: 1, desc: 'Salt rain soaks the whole squad for 42% of its damage, washes off shields and drenches them for 2 rounds.' },
    { name: 'Storm Ward', kind: 'self', shieldBirds: 0.2, icon: '🛡️', cd: 3, weight: 1, desc: 'Calls a squall over the flock: every bird takes 20% less damage for 2 rounds.' },
  ],
  tern: [
    { name: 'Wave Skim', kind: 'single', mult: 0.9, weight: 3 },
    { name: 'Tern Dive Line', kind: 'multi', mult: 0.45, hits: 3, random: true, weight: 2 },
    { name: 'Brine Splash', kind: 'aoe', mult: 0.35, drench: 2, icon: '🌊', cd: 2, weight: 1 },
  ],
  pelican: [
    { name: 'Keel Beak', kind: 'single', mult: 1.3, weight: 3 },
    { name: 'Net Scoop', kind: 'single', mult: 0.85, stun: 1, weight: 2 },
    { name: 'Gulp', kind: 'single', mult: 1.2, leech: 0.5, icon: '🩸', weight: 1, desc: 'Swallows a mouthful of pig for 120% of its damage and heals half of it back.' },
    { name: 'Tidal Flop', kind: 'aoe', mult: 0.62, drench: 2, icon: '🌊', cd: 2, weight: 1 },
  ],
  heron: [
    { name: 'Harpoon Beak', kind: 'single', mult: 1.1, weight: 3 },
    { name: 'Tide Mark', kind: 'focus', rounds: 2, icon: '🎯', cd: 2, weight: 2 },
  ],
  albatross: [
    { name: 'Ocean Glide', kind: 'single', mult: 0.95, weight: 3 },
    { name: 'Storm Gale', kind: 'aoe', mult: 0.55, weaken: 2, icon: '🪶', cd: 2, weight: 1 },
    { name: 'Salt Wake', kind: 'aoe', mult: 0.4, drench: 2, icon: '🌊', cd: 2, weight: 1 },
  ],
  reefcaller: [
    { name: 'Shoal Call', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Brine Spray', kind: 'single', mult: 0.75, poison: 2, weight: 2 },
  ],
  tidewall: [
    { name: 'Keel Smash', kind: 'single', mult: 1.35, drench: 2, weight: 3 },
    { name: 'Bilge Guard', kind: 'shieldAll', shield: 0.14, weight: 1 },
    { name: 'Anchor Slam', kind: 'charge', rounds: 3, mult: 2.3, stun: 2, drench: 2, cd: 3, icon: '⚓', weight: 2 },
  ],
  tideseer: [
    { name: 'Salt Mend', kind: 'healAlly', heal: 0.22, icon: '🌊', cd: 2, weight: 2 },
    { name: 'Brine Siphon', kind: 'single', mult: 1.3, leech: 0.35, icon: '🩸', weight: 2, desc: 'Siphons one pig for 130% of its damage and heals itself for 35% of the damage.' },
    { name: 'Undertow Hex', kind: 'single', mult: 0.65, drench: 2, silence: 1, weaken: 2, pepperDry: 3, weight: 2 },
    { name: 'Foam Ward', kind: 'shieldAll', shield: 0.16, heal: 0.06, weight: 1 },
  ],
  reefbulwark: [
    { name: 'Reef Ram', kind: 'single', mult: 1.4, drench: 2, weight: 3 },
    { name: 'Barnacle Plate', kind: 'shieldAll', shield: 0.15, weight: 1 },
    { name: 'Anchor Drop', kind: 'charge', rounds: 3, mult: 2.4, stun: 2, drench: 2, cd: 3, icon: '⚓', weight: 2, desc: 'Winds up for 3 rounds, then drops an anchor on one pig for 240% of its damage, stunning and drenching it.' },
  ],
  brinebinder: [
    { name: 'Tide Summons', kind: 'summon', icon: '🥚', cd: 3, weight: 2 },
    { name: 'Salt Hex', kind: 'single', mult: 0.7, drench: 2, silence: 2, pepperDry: 3, weight: 2 },
    { name: 'Brine Ward', kind: 'shieldAll', shield: 0.16, heal: 0.06, weight: 1 },
  ],
  tidewarden: [
    { name: 'Riptide', kind: 'charge', rounds: 3, mult: 2.6, all: true, cd: 3, icon: '🌊', weight: 2 },
    { name: 'Undertow', kind: 'single', mult: 1.6, drench: 2, weight: 2 },
    { name: 'Salt Surge', kind: 'shieldAll', shield: 0.2, heal: 0.1, icon: '🫧', cd: 3, weight: 1 },
    { name: 'Kraken Call', kind: 'summon', icon: '🥚', cd: 3, weight: 1 },
  ],
};

/* Every bird fights with its world kit; the Bomb ignores move lists entirely. */
Object.keys(DATA.birdMoves).forEach((id) => {
  if (DATA.enemies[id] && !DATA.enemies[id].bomb) DATA.enemies[id].moves = DATA.birdMoves[id];
});

/* One walking wall per world: its charge always owns the bar and always hits
   like a truck without one-tapping a full-health pig. */
DATA.tankBirds = ['terence', 'camel', 'kraken', 'yeti', 'frostwall', 'tidewall', 'icefall', 'reefbulwark', 'ironclad'];
DATA.tankBirds.forEach((id) => {
  const tank = DATA.enemies[id];
  if (!tank || !tank.moves) return;
  const ult = tank.moves.find((m) => m.kind === 'charge');
  if (!ult) return;
  if (!ult.cd) ult.cd = 3;
  ult.scaled = true;
});

/* Iron hide: only the walls have it, and the threshold climbs with the world.
   Any single hit under the number lands for 75%, so chip damage cannot chew
   through a late-game tank. */
DATA.ironHide = { ram: 50, yeti: 70, reefbulwark: 100, ironclad: 120 };
Object.keys(DATA.ironHide).forEach((id) => {
  const bird = DATA.enemies[id];
  if (!bird) return;
  bird.soakAt = DATA.ironHide[id];
  bird.trait = (bird.trait ? bird.trait + ' · ' : '') + 'iron hide: hits under ' + DATA.ironHide[id] + ' deal 75%';
});

/* Mirage birds: they blur out of phase, and 80% of everything the pigs throw
   passes straight through until somebody clears the air. */
DATA.veilBirds = ['gull', 'frost', 'spitter'];
DATA.veilBirds.forEach((id) => {
  const bird = DATA.enemies[id];
  if (!bird || !bird.moves || bird.moves.some((m) => m.veil)) return;
  bird.moves.push({ name: 'Mirage Veil', kind: 'self', veil: 2, icon: '🌫️', weight: 1, desc: 'Blurs out of phase: 80% of attacks miss for 2 rounds.' });
  bird.trait = (bird.trait ? bird.trait + ' · ' : '') + 'blurs out of reach (80% miss)';
});

/* Frenzy birds: they whip themselves into a state where EVERY hit lands with a
   flat damage bonus on top. On a bird that hits three times, that stacks into
   something the pigs should genuinely fear. */
DATA.frenzyBirds = { blue: 50, bubbles: 40, shrike: 35 };
Object.keys(DATA.frenzyBirds).forEach((id) => {
  const bird = DATA.enemies[id];
  const bonus = DATA.frenzyBirds[id];
  if (!bird || !bird.moves || bird.moves.some((m) => m.power)) return;
  bird.moves.push({ name: 'Feather Frenzy', kind: 'self', power: bonus, powerTurns: 3, icon: '⚡', weight: 1, desc: 'Whips itself into a frenzy: every hit deals +' + bonus + ' more for 3 rounds.' });
  bird.trait = (bird.trait ? bird.trait + ' · ' : '') + 'frenzies for +' + bonus + ' per hit';
});

  /* Every bird assigned to a world must actually turn up in that world. Two
     pool members were missing outright and one was in the pool but in no
     authored row, so they showed in the compendium yet never fought. */
  if (!DATA.worldRoster[1].includes('sparrow')) DATA.worldRoster[1].push('sparrow');
  if (!DATA.worldRoster[2].includes('canyoncaller')) DATA.worldRoster[2].push('canyoncaller');
  ['1', '2', '3', '4', '5'].forEach((w) => {
    const wId = Number(w);
    const rows = DATA._levelRows.filter((r) => Number(r.world) === wId);
    if (!rows.length) return;
    /* The opening fights of a world are allowed to stay small — one or two
       birds is the point of a first level. The filler only pads the levels
       after those, so a new world never opens with a full lineup. */
    const opening = new Set(rows.slice(0, 3).map((r) => r.id));
    const used = new Set();
    rows.forEach((r) => (r.e || []).forEach(([t]) => used.add(t)));
    DATA.worldRoster[w].forEach((bird) => {
      if (used.has(bird)) return;
      const spare = rows.filter((r) => !opening.has(r.id) && (r.e || []).length < 4 && !r.e.some(([t]) => t === bird));
      if (!spare.length) return;
      spare[used.size % spare.length].e.push([bird, 1, 1]);
      used.add(bird);
    });
  });

DATA.index.birds = Object.keys(DATA.enemies);
  /* A world pool must never list the same bird twice. */
  Object.keys(DATA.worldRoster).forEach((w) => {
    DATA.worldRoster[w] = [...new Set(DATA.worldRoster[w].filter((k) => DATA.enemies[k]))];
  });

/* ---------------- Relic helpers ---------------- */
/* Assign rarity from tier, scale costs and relic stat bonuses with it. */
DATA.relics.forEach((r) => {
  r.rarity = r.tier >= 4 ? 'mythic' : r.tier === 3 ? 'unreal' : r.tier === 2 ? 'rare' : 'common';
  const info = DATA.rarities[r.rarity];
  r.cost = info.cost;
  const s = r.stats || {};
  if (info.statMul !== 1) {
    s.atk = Math.round((s.atk || 0) * info.statMul * 1000) / 1000;
    s.hp = Math.round((s.hp || 0) * info.statMul * 1000) / 1000;
    r.stats = s;
  }
});

DATA.rarityOf = function (relic) {
  return (relic && DATA.rarities[relic.rarity]) || DATA.rarities.common;
};

DATA.relicById = function (id) {
  return DATA.relics.find((r) => r.id === id) || null;
};
DATA.relicsFor = function (heroId) {
  return DATA.relics.filter((r) => r.hero === heroId);
};
/* Resolve the relic a pig actually wears: equipped id, else their free starter. */
DATA.relicForHero = function (heroId, relicId) {
  const picked = relicId ? DATA.relicById(relicId) : null;
  if (picked && picked.hero === heroId) return picked;
  return DATA.relics.find((r) => r.hero === heroId && r.starter) || null;
};
DATA.starterRelics = function () {
  const out = {};
  DATA.relics.forEach((r) => { if (r.starter) out[r.hero] = r.id; });
  return out;
};

/* ---------------- Weaknesses (shown in hover tooltips) ---------------- */
DATA.weak = {
  red: 'No tricks. Any attack lands cleanly — burst it.',
  chuck: 'Fragile. Burn and two quick hits drop it.',
  blue: 'Splits its hits — party shields soak it up.',
  bomb: 'Explodes on a fuse. Kill or silence it before it goes off.',
  matilda: 'Heals the flock — knock out the nurse first.',
  hal: 'Only reaches two pigs — spread the squad.',
  bubbles: 'Random chip damage — a party-wide shield blunts it.',
  stella: 'Shields the flock — silence her, then burst.',
  terence: '22% armour: bring big hits. Burn ignores plating.',
  eagle: 'Flying and dodgy — stuns and burn still land.',
  mother: 'Armour plus a ghost revive — silence her and finish twice.',
  frost: 'Chips the whole squad — heal early.',
  balloon: 'Dodges a quarter of hits — burn and stun always land.',
  yeti: 'Slow and heavy — stun-lock it and it never swings.',
  mammoth: 'Slow as a glacier — burn ignores the 28% armour, and it cannot heal itself.',
  sparrow: 'Paper thin — any area attack wipes the whole flock.',
  diver: 'Fragile in the air — stun it before it dives.',
  hawk: 'Big target, no heals — silence the screech and burn it down.',
  cinderwing: 'Burns the squad — cleanse the fire before it stacks.',
  mirewing: 'Steals healing for the flock — kill it before you heal.',
};
DATA.weakHero = {
  corporal: 'No healing of his own — pair him with Chef Pig.',
  chef: 'Low damage — she needs a hitter beside her.',
  king: 'Slow swings and taunts eat his turns.',
  sapper: 'Fragile when focused — shield him.',
  wizard: 'Squishy — stuns and silences hurt most.',
};

/* ----------------------------------------------------------------
   Status-effect charts: every pig and every bird reacts differently.
   Multiplier > 1 = weak to it (lasts longer), < 1 = resistant.
   ---------------------------------------------------------------- */
DATA.effectNames = { stun: '💫 stun', burn: '🔥 burn', weaken: '🦴 weaken', silence: '🤐 silence' };

DATA.effectCharts = {
  heroes: {
    corporal: { stun: 0.5, burn: 1.0, weaken: 0.8, silence: 1.4 },
    king:     { stun: 1.3, burn: 0.7, weaken: 1.0, silence: 0.7 },
    chef:     { stun: 1.2, burn: 1.0, weaken: 1.2, silence: 1.6 },
    sapper:   { stun: 1.0, burn: 0.7, weaken: 1.3, silence: 1.0 },
    wizard:   { stun: 1.4, burn: 1.1, weaken: 0.8, silence: 1.5 },
  },
  birds: {
    red:      { stun: 1.0, burn: 1.0, weaken: 1.0, silence: 1.0 },
    chuck:    { stun: 1.25, burn: 1.1, weaken: 1.0, silence: 1.0 },
    blue:     { stun: 1.15, burn: 1.2, weaken: 1.0, silence: 1.0 },
    bomb:     { stun: 0.8, burn: 0.5, weaken: 1.0, silence: 1.1 },
    matilda:  { stun: 1.0, burn: 1.0, weaken: 1.2, silence: 1.6 },
    hal:      { stun: 1.1, burn: 1.0, weaken: 1.1, silence: 1.0 },
    bubbles:  { stun: 1.0, burn: 1.3, weaken: 1.2, silence: 1.0 },
    stella:   { stun: 1.1, burn: 1.0, weaken: 1.0, silence: 1.5 },
    terence:  { stun: 0.45, burn: 1.4, weaken: 0.6, silence: 1.0 },
    mother:   { stun: 0.7, burn: 1.0, weaken: 0.8, silence: 1.3 },
    frost:    { stun: 0.9, burn: 0.6, weaken: 1.2, silence: 1.0 },
    balloon:  { stun: 1.5, burn: 1.4, weaken: 1.0, silence: 1.0 },
    yeti:     { stun: 1.6, burn: 0.8, weaken: 0.9, silence: 0.8 },
    mammoth:  { stun: 0.7, burn: 0.9, weaken: 1.0, silence: 0.8 },
    sparrow:  { stun: 1.3, burn: 1.2, weaken: 1.0, silence: 1.0 },
    diver:    { stun: 1.4, burn: 1.0, weaken: 1.1, silence: 1.0 },
    hawk:     { stun: 0.9, burn: 1.1, weaken: 1.0, silence: 1.3 },
  },
};

/* How long a status lasts on this target (min 1 round, never 0). */
DATA.effectTurns = function (side, id, kind, turns) {
  if (!turns) return 0;
  const chart = (DATA.effectCharts[side] || {})[id] || {};
  const mul = chart[kind] == null ? 1 : chart[kind];
  return Math.max(1, Math.round(turns * mul));
};

/* "Weak to 💫 stun ×1.5 · resists 🔥 burn ×0.5" for tooltips. */
DATA.resistLine = function (side, id) {
  const chart = (DATA.effectCharts[side] || {})[id] || {};
  const weak = Object.keys(chart).filter((k) => chart[k] >= 1.2).sort((a, b) => chart[b] - chart[a]);
  const res = Object.keys(chart).filter((k) => chart[k] <= 0.85).sort((a, b) => chart[a] - chart[b]);
  const bits = [];
  if (weak.length) bits.push(`weak to ${weak.map((k) => `${DATA.effectNames[k]} ×${chart[k]}`).join(', ')}`);
  if (res.length) bits.push(`resists ${res.map((k) => `${DATA.effectNames[k]} ×${chart[k]}`).join(', ')}`);
  return bits.length ? bits.join(' · ') : 'no special status resistances';
};

/* Hover tooltip markup: name, HP, what it does, weakness. */
DATA.heroTip = function (h) {
  const def = h.def || h;
  const abil = (h.abilities || def.abilities || [])
    .map((a) => `<li><b>${a.icon || ''} ${a.name}</b><span>${a.desc || ''}</span></li>`)
    .join('');
  const shield = h.shield > 0 ? ` · 🛡 ${Math.round(h.shield)}% less damage` + (h.shieldTurns ? ` (${h.shieldTurns})` : '') : '';
  const hp = (h.maxHp ? `HP ${Math.max(0, Math.round(h.hp))}/${h.maxHp}` : `HP ${def.baseHp}`) + shield;
  const relic = h.relic ? DATA.relicById(h.relic) : null;
  return `<div class="tt-name">${def.name}</div>
    <div class="tt-meta">${def.role}${h.level ? ` · Lv ${h.level}` : ''} · ${hp}</div>
    ${relic ? `<div class="tt-relic">💎 ${relic.name} · ${relic.skin} skin</div>` : ''}
    <ul class="tt-list">${abil}</ul>
    <div class="tt-weak"><b>Weakness</b> ${DATA.weakHero[def.id] || '—'}</div>
    <div class="tt-effects">${DATA.resistLine('heroes', def.id)}</div>`;
};

/* What every status a bird move carries actually does to the pig, spelled out
   for the bird card and the hover tooltip instead of a bare verb. */
DATA.moveEffects = function (m) {
  const turns = (v) => (v && typeof v === 'object' ? (v.turns || 1) : v);
  const r = (n) => n + (n === 1 ? ' round' : ' rounds');
  const out = [];
  if (m.stun) out.push(`💫 stun ${r(turns(m.stun))} — the pig loses its turn`);
  if (m.weaken) out.push(`🦴 weaken ${r(turns(m.weaken))} — the flock deals 30% less damage`);
  if (m.silence) out.push(`🤐 silence ${r(turns(m.silence))} — the pig cannot use special moves`);
  if (m.poison) out.push(`☠️ poison ${r(turns(m.poison))} — the pig loses 6% of its max HP each round`);
  if (m.freeze) out.push(`🧊 freeze ${r(turns(m.freeze))} — the pig loses a turn and takes 25% more damage`);
  if (m.drench) out.push(`🌊 drench ${r(turns(m.drench))} — shields are washed off and the pig takes 20% more damage`);
  if (m.pepperDry) out.push(`🧂 pepper numb ${r(turns(m.pepperDry))} — the pig builds no pepper charge`);
  if (m.burn) out.push(`🔥 burn ${r(turns(m.burn))} — the pig takes fire damage at the start of the flock's turn`);
  if (m.mire) out.push(`🕳️ mire ${r(turns(m.mire))} — 100% of the pig's healing is stolen by the flock and split among its birds`);
  if (m.expose) out.push(`🩸 expose ${r(turns(m.expose))} — the pig takes 25% more damage`);
  if (m.dodge) out.push(`💨 dodge — the next ${m.dodge} hit${m.dodge === 1 ? '' : 's'} miss`);
  if (m.rage) out.push(`🔥 +${Math.round(m.rage * 100)}% damage for ${r(turns(m.rageTurns || 3))}`);
  if (m.shieldBirds) out.push(`🛡 the whole flock takes ${Math.round(m.shieldBirds * 100)}% less damage for 2 rounds`);
  if (m.leech) out.push(`🩸 lifesteal — heals the bird for ${Math.round(m.leech * 100)}% of the damage it deals`);
  if (m.stealPepper) out.push(`🌶 steals ${m.stealPepper} pepper charge from the squad's meter`);
  return out;
};

/* A bird's ATK on the road you are walking: the same per-level growth and
   world step the level table builds, so the compendium can quote a real number
   instead of a bare percentage. */
DATA.birdAtkFor = function (tpl, level, world) {
  if (!tpl) return 0;
  const l = Math.max(1, Math.round(level || 1));
  const w = Math.max(1, Math.round(world || 1));
  const tune = (DATA.tuning && DATA.tuning.enemyAtk) || 1;
  return Math.round(tpl.atk * Math.pow(1.022, l - 1) * (1 + (w - 1) * 0.08) * tune * 10) / 10;
};

/* Bird attacks quote the wound they leave, not a share of an invisible stat:
   each "% of its damage" in the hand-written line is swapped for the number
   that bird actually takes off a pig at its current attack power. */
DATA.birdMoveText = function (m, atk) {
  const base = String((m && m.desc) || '');
  if (!(atk > 0) || !base) return base;
  return base.replace(/(\d+(?:\.\d+)?)% of its damage/g,
    (_, p) => Math.max(1, Math.round(atk * Number(p) / 100)) + ' damage');
};

DATA.enemyTip = function (e) {
  const tpl = e.tpl || e;
  const key = e.key || DATA.enemyKey(tpl);
  const how = (m) => (m.kind === 'healAlly' ? 'heals a bird'
    : m.kind === 'shieldAll' ? 'shields the flock'
      : m.kind === 'summon' ? 'calls reinforcements'
        : m.kind === 'focus' ? 'marks one pig for the whole flock'
          : m.kind === 'charge' ? 'winds up, then hits hard'
            : m.kind === 'aoe' ? (m.targetCount ? `hits ${m.targetCount} pigs` : 'hits everyone')
              : m.kind === 'multi' ? `hits ${m.hits || 2} times`
                : m.kind === 'self' ? (m.rage ? `works itself up: +${Math.round(m.rage * 100)}% damage for ${m.rageTurns || 3} rounds`
                  : m.shieldBirds ? `wards the whole flock: ${Math.round(m.shieldBirds * 100)}% less damage for 2 rounds`
                  : m.power ? `frenzies: every hit deals +${m.power} for ${m.powerTurns || 3} rounds`
                  : m.veil ? `blurs out of phase: 80% of attacks miss for ${m.veil} rounds`
                    : m.dodge ? `the next ${m.dodge} hits miss`
                      : 'buffs itself')
                  : 'hits one pig');
  const fx = (m) => DATA.moveEffects(m).join(' · ');
  /* The live bird's attack if the tooltip is opened mid-fight, otherwise the
     attack it would have on this road. Every attack prints a wound. */
  const atkLive = Math.max(1, Math.round(e.atk != null ? e.atk : (DATA.birdAtkFor(tpl, (e.level || 1), (e.world || 1)) || tpl.atk)));
  const damage = (m, body) => {
    if (!m.mult || /\d+\s*damage/.test(body || '')) return '';
    const spread = m.kind === 'multi' ? ' per hit' : (m.kind === 'aoe' || (m.kind === 'charge' && m.all)) ? ' to each pig' : '';
    return ` · ${Math.max(1, Math.round(atkLive * m.mult))} damage${spread}`;
  };
  /* Specials that need a charge show their icon, and how many rounds they take. */
  const moves = (tpl.moves || []).map((m) => {
    const body = DATA.birdMoveText(m, atkLive) || how(m);
    return `<li><b>${m.icon ? m.icon + ' ' : ''}${m.name}</b><span>${body}${damage(m, body)}${m.cd ? ` · charge ${m.cd}` : ''}${fx(m) ? ` · ${fx(m)}` : ''}</span></li>`;
  }).join('');
  const shield = e.shield > 0 ? ` · 🛡 ${Math.round(e.shield)}% less damage` + (e.shieldTurns ? ` (${e.shieldTurns})` : '') : '';
  const hp = (e.maxHp ? `HP ${Math.max(0, Math.round(e.hp))}/${e.maxHp}` : `HP ${tpl.hp}`) + shield;
  const atk = `deals ${atkLive}`;
  /* Two different kinds of evasion: a trait that simply dodges (never a buff)
     and charges from a dodge move (removed by cleansing damage). */
  const passiveDodge = tpl.flying ? '💨 passive evade 20% — not a buff, cleansing cannot remove it' : '';
  const dodgeCharges = e.dodgeCharge > 0 ? `💨 ${e.dodgeCharge} dodge charge${e.dodgeCharge === 1 ? '' : 's'} — cleansing damage deletes these` : '';
  const guard = tpl.halfAt ? `🛡️ knight's guard — hits under ${tpl.halfAt} deal half damage` : '';
  const mirror = tpl.reflect ? `🪞 mirror — returns ${Math.round(tpl.reflect * 100)}% of the wound it takes to the pig that dealt it` : '';
  const pack = tpl.packAtk ? `🎵 pack song — +${Math.round(tpl.packAtk * 100)}% damage for every living bird (itself included)` : '';
  const berserk = tpl.berserk ? `🔥 berserk — below 35% HP it deals +${Math.round(tpl.berserk * 100)}% damage` : '';
  const passives = [passiveDodge, dodgeCharges, guard, mirror, pack, berserk].filter(Boolean);
  const dodgeLine = passives.length ? `<div class="tt-effects">${passives.join(' · ')}</div>` : '';
  return `<div class="tt-name">${tpl.name}</div>
    <div class="tt-meta">${hp} · ${atk}${tpl.armor ? ` · ${Math.round(tpl.armor * 100)}% armour` : ''}</div>
    <div class="tt-trait">${DATA.birdMoveText({ desc: tpl.trait }, atkLive) || ''}</div>
    ${dodgeLine}
    <ul class="tt-list">${moves}</ul>
    <div class="tt-weak"><b>Weakness</b> ${(key && DATA.weak[key]) || 'Focus it down.'}</div>
    <div class="tt-effects">${DATA.resistLine('birds', key)}</div>`;
};

DATA.enemyKey = function (tpl) {
  const keys = Object.keys(DATA.enemies);
  return keys.find((k) => DATA.enemies[k] === tpl) || null;
};

/* Map tile labels are generated after the road numbers are assigned: the main
   road is numbered 1..N in every world, and side roads hang lettered off the
   main stop they branch from. */
DATA.labels = {};

/* Turn the compact level table into full level objects. */
DATA.levels = {};
DATA._levelRows.forEach((row, idx) => {
  const worldLevels = DATA._levelRows.filter((r) => r.world === row.world);
  const order = worldLevels.indexOf(row) + 1;
  const boss = !!row.boss;
  const elite = !!row.elite;
  const baseXp = row.world === 1 ? 34 : 128;
  const baseCoins = row.world === 1 ? 16 : 40;
  DATA.levels[row.id] = {
    id: row.id,
    world: row.world,
    order,
    worldSize: worldLevels.length,
    name: row.name,
    lore: row.lore,
    tip: row.tip || '',
    boss,
    mini: !!row.mini,
    elite,
    /* Birds are never capped: each level stacks ~4% HP and ~2% attack on top of
       the previous one, plus a step up per world, so the curve stays smooth
       while the pigs grow toward ~500 HP. */
    enemies: row.e.map(([t, hpMul, atkMul]) => ({
      t,
      hpMul: hpMul * Math.pow(1.04, order - 1) * (1 + (row.world - 1) * 0.1),
      atkMul: atkMul * Math.pow(1.022, order - 1) * (1 + (row.world - 1) * 0.08),
    })),
    xp: Math.round(baseXp + order * 11 + (boss ? 130 : 0) + (elite ? 45 : 0)),
    coins: Math.round(baseCoins + order * 3.5 + (boss ? 110 : 0) + (elite ? 45 : 0)),
    // deterministic herb drops (the data must not change between calls)
    herbs: boss ? 3 : elite ? 2 : order % 3 === 0 ? 1 : 0,
    firstClearCoins: boss ? 150 : 60,
  };
});

/* The main road, numbered per world. Side roads, caves and bosses keep no
   route number, so a wave count can follow the path the player is actually
   walking instead of a hidden table index. */
(function numberMainRoute() {
  const byWorld = {};
  Object.keys(DATA.levels).forEach((id) => {
    const lv = DATA.levels[id];
    const num = parseInt(String(lv.id).slice(1), 10) || 0;
    if (num >= 30 || lv.boss) return;
    (byWorld[lv.world] = byWorld[lv.world] || []).push(lv);
  });
  Object.keys(byWorld).forEach((w) => {
    byWorld[w].sort((a, b) => a.order - b.order).forEach((lv, i) => { lv.route = i + 1; });
  });
})();

/* Every level must be a little harder than the one before it. Authored
   lineups and wave counts do not naturally line up, so after the levels are
   built each one is nudged up until it clears the previous level by 1.5% on a
   combined bulk-and-bite score. Scaling is always upward and capped at 1.5x per
   level, so the authored feel of a fight survives the correction. */
function levelLadder() {
  const byWorld = {};
  Object.keys(DATA.levels).forEach((id) => {
    const lv = DATA.levels[id];
    (byWorld[lv.world] = byWorld[lv.world] || []).push(lv);
  });
  const scoreOf = (lv) => {
    const waves = DATA.wavesFor(lv);
    const waveHp = 1 + (waves - 1) * 0.08;
    const waveAtk = 1 + (waves - 1) * 0.055;
    let hp = 0;
    let atk = 0;
    lv.enemies.forEach((e) => {
      const tpl = DATA.enemies[e.t];
      hp += tpl.hp * e.hpMul;
      atk += tpl.atk * e.atkMul;
    });
    return Math.sqrt(hp * waveHp * atk * waveAtk * waves) * (lv.boss ? 1.12 : 1);
  };
  Object.keys(byWorld).forEach((w) => {
    const list = byWorld[w].sort((a, b) => a.order - b.order);
    let prev = 0;
    list.forEach((lv) => {
      /* Optional side content (numbered 30+) is not part of the main road, so
         it neither has to beat the level before it nor drag the curve. */
      if ((parseInt(String(lv.id).slice(1), 10) || 0) >= 30) return;
      /* Boss levels are hand-tuned (cutscene, phase, finale). The ladder would
         multiply the king by the whole difficulty gap and make him a wall. */
      if (lv.boss) return;
      const cur = scoreOf(lv);
      const target = prev * 1.005;
      if (cur < target) {
        const k = Math.min(6, target / cur);
        /* The score is a geometric mean of bulk and bite, so scaling both
           stats by k multiplies the score by exactly k. */
        const f = k;
        lv.enemies.forEach((e) => { e.hpMul *= f; e.atkMul *= f; });
      }
      prev = scoreOf(lv);
    });
  });
}

DATA.levelOrder = DATA._levelRows.map((r) => r.id);

/* Number every world's road by walking it, not by the id it was authored with.
   The shortest road from the first stop to the boss is the main line (1..N);
   every other battle hangs off it as 5a, 5b, 12a and so on, so parallel roads
   never show raw ids like "20" or repeat a number. */
(function labelEveryRoad() {
  const labels = {};
  const letter = (n) => {
    let s = '';
    n += 1;
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(97 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };
  DATA.worlds.forEach((world) => {
    const byId = {};
    world.nodes.forEach((n) => { byId[n.id] = n; });
    const adj = {};
    world.edges.forEach(([a, b]) => {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    });
    const battles = world.nodes.filter((n) => n.type === 'battle' && DATA.levels[n.id]);
    if (!battles.length) return;
    const start = world.nodes[0].id;
    const boss = (battles.find((n) => DATA.levels[n.id].boss) || battles[battles.length - 1]).id;
    const prev = { [start]: null };
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === boss) break;
      (adj[cur] || []).forEach((next) => {
        if (!(next in prev)) { prev[next] = cur; queue.push(next); }
      });
    }
    if (!(boss in prev)) return;
    const mainPath = [];
    for (let cur = boss; cur; cur = prev[cur]) mainPath.unshift(cur);
    const mainSet = new Set(mainPath);
    let mainNo = 0;
    mainPath.forEach((id) => {
      const node = byId[id];
      if (node && node.type === 'battle' && DATA.levels[id]) labels[id] = String(++mainNo);
    });
    const seen = new Set();
    const used = {};
    battles.filter((n) => !labels[n.id]).forEach((startNode) => {
      if (seen.has(startNode.id)) return;
      const comp = [];
      const compQueue = [startNode.id];
      seen.add(startNode.id);
      while (compQueue.length) {
        const id = compQueue.shift();
        const node = byId[id];
        if (!node) continue;
        comp.push(node);
        (adj[id] || []).forEach((next) => {
          if (mainSet.has(next) || seen.has(next) || !byId[next]) return;
          seen.add(next);
          compQueue.push(next);
        });
      }
      let prefix = null;
      comp.forEach((node) => {
        (adj[node.id] || []).forEach((next) => {
          if (!mainSet.has(next) || !labels[next]) return;
          const n = parseInt(labels[next], 10);
          if (prefix == null || n < prefix) prefix = n;
        });
      });
      const head = prefix == null ? 'S' : String(prefix);
      const dist = {};
      const walk = [];
      comp.forEach((node) => {
        if ((adj[node.id] || []).some((next) => mainSet.has(next) && labels[next] === head)) {
          dist[node.id] = 0;
          walk.push(node.id);
        }
      });
      for (let i = 0; i < walk.length; i++) {
        const id = walk[i];
        (adj[id] || []).forEach((next) => {
          if (mainSet.has(next) || !byId[next] || next in dist) return;
          dist[next] = dist[id] + 1;
          walk.push(next);
        });
      }
      let slot = used[head] || 0;
      comp
        .filter((node) => node.type === 'battle' && DATA.levels[node.id])
        .sort((a, b) => (dist[a.id] == null ? 999 : dist[a.id]) - (dist[b.id] == null ? 999 : dist[b.id]))
        .forEach((node) => { labels[node.id] = head + letter(slot++); });
      used[head] = slot;
    });
  });
  DATA.labels = labels;
})();

/* ---------------- Key drops ----------------
   The first three elite fights in each world drop brass, silver and gold, so
   a world's own side doors can be opened without leaving it. The castle
   wardens drop their own copies of the same three keys. */
DATA.worlds.forEach(function (w) {
  if (w.id === 5) return;
  const elites = w.nodes
    .filter(function (n) { return n.type === 'battle' && DATA.levels[n.id] && DATA.levels[n.id].elite; })
    .sort(function (a, b) { return (DATA.levels[a.id].order || 0) - (DATA.levels[b.id].order || 0); });
  elites.forEach(function (n, i) {
    if (i < 3) DATA.levels[n.id].grantsKey = DATA.keyOrder[i];
    else delete DATA.levels[n.id].grantsKey;
  });
});


/* Blueprints are sold in shops to unlock helmet tiers. Each recipe also asks
   for one material from the world its tier belongs to: tier 2 draws on worlds
   1–2, tier 3 on worlds 3–4, so the crafts follow the road. */
const BP_THEMES = {
  corporal: { 2: 'eggshell', 3: 'rime' },
  chef: { 2: 'straw', 3: 'wool' },
  king: { 2: 'cactus', 3: 'coral' },
  sapper: { 2: 'sand', 3: 'pearl' },
  wizard: { 2: 'eggshell', 3: 'coral' },
  scout: { 2: 'cactus', 3: 'rime' },
};
function blueprintMats(heroId, tier) {
  const mats = { ore: tier, feather: tier * 2 };
  const themed = BP_THEMES[heroId] && BP_THEMES[heroId][tier];
  if (themed) mats[themed] = tier === 2 ? 2 : 3;
  return mats;
}
DATA.blueprints = DATA.heroes.flatMap((hero) =>
  [2, 3].map((tier) => ({
    id: `${hero.id}-helmet-${tier}`,
    heroId: hero.id,
    tier,
    name: `${hero.name.replace(' Pig', '')} · ${hero.helmet.tiers[tier - 1].name}`,
    desc: hero.helmet.tiers[tier - 1].desc,
    cost: 90 + tier * 110,
    mats: blueprintMats(hero.id, tier),
  }))
);

/* Four one-off weapon blueprints. Unlike the tiered training weapons, these
   are carried items: craft one, hand it to any pig, and it is drawn in that
   pig's hoof. Each has a flat 5% chance on a damaging hit for its own rider. */
DATA.craftedWeapons = [
  {
    id: 'sparkmaul', name: 'Sparkmaul', icon: '⚡', proc: 'stun', atk: 5,
    effect: 'Stun', colour: '#ffd45e',
    desc: 'A crackling maul. +5 base damage. 5% chance on a hit to stun the bird for a round.',
    cost: 260, mats: { ore: 2, feather: 3, eggshell: 2 },
  },
  {
    id: 'sudsbrush', name: 'Sudsbrush', icon: '🫧', proc: 'cleanse', atk: 4,
    effect: 'Cleanse', colour: '#9fe8ff',
    desc: 'A soapy scrub. +4 base damage. 5% chance on a hit to wash every debuff off the holder.',
    cost: 260, mats: { ore: 2, feather: 3, straw: 2 },
  },
  {
    id: 'chainhook', name: 'Chainhook', icon: '⛓️', proc: 'chain', atk: 7,
    effect: 'Chain damage', colour: '#e0b0ff',
    desc: 'A hooked chain. +7 base damage. 5% chance on a hit to lash two other birds for 35%.',
    cost: 300, mats: { ore: 3, feather: 4, wood: 3 },
  },
  {
    id: 'critcleaver', name: 'Crit Cleaver', icon: '🪓', proc: 'crit', atk: 9,
    effect: 'Crit', colour: '#ff9a6a',
    desc: 'A heavy cleaver. +9 base damage. 5% chance on a hit to land a critical blow.',
    cost: 320, mats: { ore: 4, feather: 4, wood: 3, cactus: 2 },
  },
];
/* Every pig joins with a signature weapon already in its hoof. These are
   carried items like the shop weapons, but they are never sold and are only
   granted once per pig. */
DATA.starterWeapons = [
  {
    id: 'starter_corporal', name: 'Pig Hammer', icon: '🔨', proc: 'stun', shape: 'hammer', atk: 1,
    effect: 'Stun', colour: '#c99a5b', starterFor: 'corporal',
    desc: 'Corporal’s trusty hammer. +1 base damage. 5% chance to stun on a hit.',
  },
  {
    id: 'starter_chef', name: 'Cast Iron Pan', icon: '🍳', proc: 'cleanse', shape: 'pan', atk: 1,
    effect: 'Cleanse', colour: '#8a5a2c', starterFor: 'chef',
    desc: 'Chef’s well-seasoned pan. +1 base damage. 5% chance to cleanse on a hit.',
  },
  {
    id: 'starter_king', name: 'Royal Scepter', icon: '👑', proc: 'crit', shape: 'scepter', atk: 1,
    effect: 'Crit', colour: '#ffd36b', starterFor: 'king',
    desc: 'The King’s royal scepter. +1 base damage. 5% chance to crit on a hit.',
  },
  {
    id: 'starter_sapper', name: 'Pig Wrench', icon: '🔧', proc: 'chain', shape: 'wrench', atk: 1,
    effect: 'Chain damage', colour: '#a9b6c4', starterFor: 'sapper',
    desc: 'Sapper’s trusty wrench. +1 base damage. 5% chance to chain on a hit.',
  },
  {
    id: 'starter_wizard', name: 'Hex Rod', icon: '🪄', proc: 'crit', shape: 'rod', atk: 1,
    effect: 'Crit', colour: '#c3a6ff', starterFor: 'wizard',
    desc: 'Wizard’s hex rod. +1 base damage. 5% chance to crit on a hit.',
  },
  {
    id: 'starter_scout', name: 'Pig Sling', icon: '🪶', proc: 'stun', shape: 'sling', atk: 1,
    effect: 'Stun', colour: '#8fc95a', starterFor: 'scout',
    desc: 'Scout’s silent sling. +1 base damage. 5% chance to stun on a hit.',
  },
];
DATA.craftedWeaponById = function (id) {
  return DATA.craftedWeapons.find((w) => w.id === id) ||
    DATA.starterWeapons.find((w) => w.id === id) ||
    (DATA.anvilWeapons || []).find((w) => w.id === id) || null;
};
DATA.starterWeaponFor = function (heroId) {
  return DATA.starterWeapons.find((w) => w.starterFor === heroId) || null;
};

DATA.starterShields = [
  {
    id: 'starter_shield_corporal', name: 'Tin Tray', icon: '🛡️', hp: 8, colour: '#c99a5b', shape: 'tray', starterFor: 'corporal',
    desc: 'Corporal’s battered tin tray. +8 base HP.',
  },
  {
    id: 'starter_shield_chef', name: 'Pot Lid', icon: '🛡️', hp: 8, colour: '#a9b6c4', shape: 'lid', starterFor: 'chef',
    desc: 'Chef’s trusty pot lid. +8 base HP.',
  },
  {
    id: 'starter_shield_king', name: 'Gilded Buckler', icon: '🛡️', hp: 8, colour: '#ffd36b', shape: 'round', starterFor: 'king',
    desc: 'A small royal buckler. +8 base HP.',
  },
  {
    id: 'starter_shield_sapper', name: 'Rivet Plate', icon: '🛡️', hp: 8, colour: '#9dc94a', shape: 'rivet', starterFor: 'sapper',
    desc: 'A riveted scrap plate. +8 base HP.',
  },
  {
    id: 'starter_shield_wizard', name: 'Rune Ward', icon: '🛡️', hp: 8, colour: '#c3a6ff', shape: 'rune', starterFor: 'wizard',
    desc: 'A humming rune ward. +8 base HP.',
  },
  {
    id: 'starter_shield_scout', name: 'Bramble Ward', icon: '🛡️', hp: 8, colour: '#8fc95a', shape: 'aegis', starterFor: 'scout',
    desc: 'Scout’s woven bramble guard. +8 base HP.',
  },
];
DATA.starterShieldFor = function (heroId) {
  return DATA.starterShields.find((s) => s.starterFor === heroId) || null;
};

/* The four crafted-weapon riders. Every anvil weapon rolls exactly one of
   these at a flat 5% chance on a landed hit. */
DATA.weaponEffects = {
  stun: { name: 'Stun', icon: '💫', chance: 0.05, colour: '#ffd45e', desc: 'stun the hit bird for 1 round' },
  cleanse: { name: 'Cleanse', icon: '🫧', chance: 0.05, colour: '#9fe8ff', desc: 'wash every debuff off the holder' },
  chain: { name: 'Chain', icon: '⛓️', chance: 0.05, colour: '#e0b0ff', desc: 'lash two other birds for 35% damage' },
  crit: { name: 'Crit', icon: '💥', chance: 0.05, colour: '#ff9a6a', desc: 'land a critical blow' },
};
DATA.anvilSpinCosts = { 1: 400, 10: 3600 };

/* Every anvil weapon gets its own recipe: three distinct materials whose
   quantities climb with the weapon's tier. Early weapons ask for 1–2 of each
   basic material; the top tier asks for 11–14 of each of three materials. */
DATA.anvilWeaponDamage = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 28, 30];

DATA.anvilRecipeFor = function (base) {
  const basic = ['feather', 'ore', 'wood', 'eggshell', 'straw', 'cactus', 'sand'];
  const mid = basic.concat(['rime']);
  const all = mid.concat(['wool', 'coral', 'pearl']);
  const pools = [basic, basic, mid, mid, all, all];
  const starts = [1, 2, 4, 6, 8, 11];
  const spreads = [1, 1, 2, 2, 3, 4];
  const heroIndex = Math.floor(base / 24);
  const i = base % 24;
  const tier = Math.floor(i / 4);
  const slot = heroIndex * 4 + (i % 4);
  const pool = pools[tier];
  const triples = [];
  for (let a = 0; a < pool.length; a += 1) {
    for (let b = a + 1; b < pool.length; b += 1) {
      for (let c = b + 1; c < pool.length; c += 1) triples.push([pool[a], pool[b], pool[c]]);
    }
  }
  const triple = triples[slot];
  const start = starts[tier];
  const spread = spreads[tier];
  const mats = {};
  triple.forEach((key, idx) => {
    const qty = start + ((slot + idx) % spread);
    mats[key] = (mats[key] || 0) + qty;
  });
  return mats;
};

DATA.anvilWeapons = [];
(function buildAnvilWeapons() {
  const nouns = {
    corporal: ['Hammer', 'Maul', 'Mallet', 'Cudgel', 'Sledge', 'Anvil'],
    chef: ['Pan', 'Cleaver', 'Skillet', 'Whisk', 'Ladle', 'Rolling Pin'],
    king: ['Scepter', 'Blade', 'Mace', 'Halberd', 'Crownblade', 'Glaive'],
    sapper: ['Wrench', 'Pick', 'Spanner', 'Drill', 'Crowbar', 'Shovel'],
    wizard: ['Rod', 'Staff', 'Wand', 'Orb', 'Sickle', 'Grimoire'],
  };
  const prefixes = [
    'Rusty', 'Sturdy', 'Spiked', 'Gilded', 'Storm', 'Moon', 'Cinder', 'Frost',
    'Thunder', 'Royal', 'Bone', 'Rune', 'Iron', 'Verdant', 'Gloom', 'Sun',
    'Crystal', 'Gale', 'Ember', 'Bramble', 'Silver', 'Shadow', 'Copper', 'Star',
  ];
  const procs = ['stun', 'cleanse', 'chain', 'crit'];
  const shapes = {
    corporal: ['hammer', 'maul', 'mace', 'axe', 'blade', 'hammer'],
    chef: ['pan', 'cleaver', 'pan', 'rod', 'pan', 'cleaver'],
    king: ['scepter', 'blade', 'mace', 'axe', 'blade', 'scepter'],
    sapper: ['wrench', 'pick', 'wrench', 'pick', 'wrench', 'pick'],
    wizard: ['rod', 'wand', 'orb', 'rod', 'pick', 'rod'],
  };
  DATA.heroes.forEach((hero, heroIndex) => {
    const list = nouns[hero.id] || ['Blade'];
    const shapeList = shapes[hero.id] || ['blade'];
    for (let i = 0; i < 24; i += 1) {
      const proc = procs[i % procs.length];
      const fx = DATA.weaponEffects[proc];
      const atk = DATA.anvilWeaponDamage[i];
      const name = `${prefixes[i]} ${list[i % list.length]}`;
      DATA.anvilWeapons.push({
        id: `anvil_${hero.id}_${i + 1}`,
        name,
        icon: '⚔️',
        proc,
        shape: shapeList[i % shapeList.length],
        chance: 0.05,
        atk,
        colour: fx.colour,
        forHero: hero.id,
        effect: fx.name,
        desc: `${name}. +${atk} base damage. 5% chance on a hit to ${fx.desc}.`,
        cost: 150 + atk * 25,
        mats: DATA.anvilRecipeFor(heroIndex * 24 + i),
      });
    }
  });
})();


/* Carried shields: flat base HP, added before gear, relic and training
   multipliers. Like the crafted weapons they are drawn on the pig in battle. */
DATA.craftedShields = [
  {
    id: 'buckler', name: 'Wooden Buckler', icon: '🛡️', hp: 12, colour: '#c99a5b', shape: 'round', cost: 110,
    desc: 'A sturdy plank strapped to the hoof. +12 base HP.',
  },
  {
    id: 'ironwall', name: 'Iron Wall', icon: '🛡️', hp: 20, colour: '#a9b6c4', shape: 'tower', cost: 260,
    desc: 'A heavy iron shield. +20 base HP.',
  },
  {
    id: 'aegis', name: 'Royal Aegis', icon: '🛡️', hp: 30, colour: '#ffd36b', shape: 'aegis', cost: 520,
    desc: 'A gilded tower shield. +30 base HP.',
  },
];

/* Anvil shield catalogue: shared recipes any pig can carry. Weapons are
   per-pig; shields are universal carried HP, so one forge serves the squad. */
DATA.anvilShields = [
  { id: 'anvil_shield_1', name: 'Splinter Buckler', icon: '🛡️', hp: 6, colour: '#c99a5b', shape: 'round', cost: 220, mats: { wood: 1, feather: 1, eggshell: 1 }, desc: 'A rough plank buckler. +6 base HP.' },
  { id: 'anvil_shield_2', name: 'Kite Guard', icon: '🛡️', hp: 8, colour: '#a9b6c4', shape: 'tower', cost: 320, mats: { ore: 1, wood: 1, straw: 1 }, desc: 'A tall kite shield. +8 base HP.' },
  { id: 'anvil_shield_3', name: 'Bramble Aegis', icon: '🛡️', hp: 10, colour: '#8fc95a', shape: 'aegis', cost: 420, mats: { straw: 1, feather: 1, cactus: 1 }, desc: 'A woven bramble guard. +10 base HP.' },
  { id: 'anvil_shield_4', name: 'Tinker Tray', icon: '🛡️', hp: 12, colour: '#d9b38c', shape: 'tray', cost: 520, mats: { ore: 2, wood: 2, eggshell: 2 }, desc: 'A reinforced serving tray. +12 base HP.' },
  { id: 'anvil_shield_5', name: 'Cauldron Lid', icon: '🛡️', hp: 14, colour: '#8a5a2c', shape: 'lid', cost: 620, mats: { ore: 2, eggshell: 2, sand: 2 }, desc: 'A heavy pot lid. +14 base HP.' },
  { id: 'anvil_shield_6', name: 'Rivet Bulwark', icon: '🛡️', hp: 16, colour: '#9dc94a', shape: 'rivet', cost: 720, mats: { ore: 3, wood: 3, cactus: 3 }, desc: 'A riveted scrap wall. +16 base HP.' },
  { id: 'anvil_shield_7', name: 'Rune Bastion', icon: '🛡️', hp: 18, colour: '#c3a6ff', shape: 'rune', cost: 840, mats: { ore: 3, rime: 3, sand: 3 }, desc: 'A rune-etched bastion. +18 base HP.' },
  { id: 'anvil_shield_8', name: 'Ironwood Wall', icon: '🛡️', hp: 20, colour: '#7d8a99', shape: 'tower', cost: 960, mats: { wood: 4, ore: 4, straw: 4 }, desc: 'Ironbound timber. +20 base HP.' },
  { id: 'anvil_shield_9', name: 'Gilded Aegis', icon: '🛡️', hp: 22, colour: '#ffd36b', shape: 'aegis', cost: 1080, mats: { ore: 11, coral: 11, pearl: 11 }, desc: 'A gilded aegis. +22 base HP.' },
  { id: 'anvil_shield_10', name: 'Rune Tower', icon: '🛡️', hp: 25, colour: '#b8a6ff', shape: 'tower', cost: 1200, mats: { rime: 12, ore: 12, sand: 12 }, desc: 'A humming rune tower. +25 base HP.' },
  { id: 'anvil_shield_11', name: 'Bacon Bulwark', icon: '🛡️', hp: 28, colour: '#ff9a9a', shape: 'rivet', cost: 1350, mats: { wool: 13, ore: 13, cactus: 13 }, desc: 'A thick padded bulwark. +28 base HP.' },
  { id: 'anvil_shield_12', name: 'Legendary Lid', icon: '🛡️', hp: 30, colour: '#ffd45e', shape: 'lid', cost: 1500, mats: { pearl: 14, rime: 14, ore: 14 }, desc: 'The finest lid in the kingdom. +30 base HP.' },
];
DATA.craftedShieldById = function (id) {
  return DATA.craftedShields.find((s) => s.id === id) || DATA.starterShields.find((s) => s.id === id) ||
    (DATA.anvilShields || []).find((s) => s.id === id) || null;
};
DATA.craftedWeapons.forEach((weapon) => {
  DATA.blueprints.push({
    id: `bp-${weapon.id}`,
    slot: 'weapon',
    weaponId: weapon.id,
    heroId: null,
    tier: 0,
    name: `${weapon.name} Blueprint`,
    desc: weapon.desc,
    cost: weapon.cost,
    mats: weapon.mats,
  });
});
DATA.anvilWeapons.forEach((weapon) => {
  DATA.blueprints.push({
    id: `bp-${weapon.id}`,
    slot: 'weapon',
    weaponId: weapon.id,
    heroId: weapon.forHero,
    tier: 0,
    name: `${weapon.name} Blueprint`,
    desc: weapon.desc,
    cost: weapon.cost,
    mats: weapon.mats,
  });
});
DATA.anvilShields.forEach((shield) => {
  DATA.blueprints.push({
    id: `bp-${shield.id}`,
    slot: 'shield',
    shieldId: shield.id,
    heroId: null,
    tier: 0,
    name: `${shield.name} Blueprint`,
    desc: shield.desc,
    cost: shield.cost,
    mats: shield.mats,
  });
});

/* ---------------- Craft materials (dropped in battle) ---------------- */
DATA.mats = {
  feather: { name: 'Feathers', icon: '🪶' },
  ore: { name: 'Ore', icon: '⛏️' },
  wood: { name: 'Timber', icon: '🪵' },
  eggshell: { name: 'Eggshell', icon: '🥚' },
  straw: { name: 'Straw Twine', icon: '🧵' },
  cactus: { name: 'Cactus Spine', icon: '🌵' },
  sand: { name: 'Glass Sand', icon: '⏳' },
  rime: { name: 'Rime Crystal', icon: '❄️' },
  wool: { name: 'Mammoth Wool', icon: '🧶' },
  coral: { name: 'Coral Bloom', icon: '🌺' },
  pearl: { name: 'Brine Pearl', icon: '🐚' },
};

/* What a battle drops. Replays drop half, bosses and caves drop more. Each
   world also rolls its own two craft materials into the pool. */
DATA.rollDrops = function (level, replay) {
  const out = {};
  const base = level.boss ? 4 : level.elite ? 3 : 2;
  const n = replay ? Math.max(1, Math.round(base * 0.5)) : base;
  const pools = {
    1: ['feather', 'wood', 'wood', 'eggshell', 'straw'],
    2: ['feather', 'ore', 'wood', 'cactus', 'sand'],
    3: ['ore', 'ore', 'feather', 'wood', 'rime', 'wool'],
    4: ['ore', 'ore', 'wood', 'feather', 'coral', 'pearl'],
    5: ['ore', 'ore', 'wood', 'feather', 'rime', 'wool', 'coral', 'pearl'],
  };
  const pool = pools[Math.min(5, level.world || 1)] || pools[1];
  for (let i = 0; i < n; i++) {
    const k = pool[Math.floor(Math.random() * pool.length)];
    out[k] = (out[k] || 0) + 1;
  }
  return out;
};

/* Star thresholds: score = damage + healing assist + health left - damage taken */
DATA.scoreStars = function (enemyHp, partyHp, score) {
  const three = Math.round(enemyHp * 1.0 + partyHp * 2.7);
  const two = Math.round(enemyHp * 1.0 + partyHp * 1.5);
  if (score >= three) return 3;
  if (score >= two) return 2;
  return 1;
};

/* Global difficulty knobs. Everything that builds a bird multiplies through
   these, so the whole curve can be retuned without touching 90 level rows. */
/* The flock's global bite and bulk. Pigs gained more per level, so the birds
   were raised to match and then a little past it, keeping the road tense. */
DATA.tuning = { enemyHp: 1.5, enemyAtk: 1.42 };

/* ---------------- XP per bird ----------------
   A bird is worth XP for what it is, not for the map it stands on: chaff pays
   10, a proper fighter 15, a big one 20, a bruiser 40, a wall 100 and a boss a
   packet. The world it roosts in multiplies that, or the last world would pay
   the same pocket money as the first. */
DATA.xpPerBird = { small: 10, mid: 15, big: 20, brute: 40, tank: 100, boss: 500 };
DATA.xpWorldMul = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 12 };
DATA.birdXp = function (key) {
  const t = DATA.enemies[key] || {};
  const w = DATA.birdWorld[key] || 1;
  let tier = 'small';
  if (t.boss) tier = 'boss';
  else if (t.big) tier = 'brute';
  else if (t.role === 'Tank') tier = 'tank';
  else if ((t.hp || 0) >= 190) tier = 'big';
  else if ((t.hp || 0) >= 130) tier = 'mid';
  return Math.round(DATA.xpPerBird[tier] * (DATA.xpWorldMul[w] || 1));
};

/* ---------------- Map compaction ----------------
   The worlds were strung out over a very long scroll. Pull the tiles closer on
   the Y axis (and scale the map height to match) so the boss is a short ride
   away, while keeping every route intact. Tiles render larger to compensate. */
DATA.mapScale = 0.82;
DATA.worlds.forEach((w) => {
  w.nodes.forEach((n) => { n.y = Math.round(n.y * DATA.mapScale); });
  w.mapH = Math.round((w.mapH || 2000) * DATA.mapScale);

  /* Squeezing the map vertically could push tiles into each other, so nudge
     neighbours apart until every pair has room. Edges follow their nodes, so
     the roads stay connected. */
  const MIN = 80;
  for (let pass = 0; pass < 120; pass++) {
    let moved = 0;
    for (let i = 0; i < w.nodes.length; i++) {
      for (let j = i + 1; j < w.nodes.length; j++) {
        const a = w.nodes[i];
        const b = w.nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= MIN) continue;
        if (d < 0.001) { dx = 1; dy = 0; d = 1; }
        const push = (MIN - d) / 2 + 0.5;
        const ux = (dx / d) * push;
        const uy = (dy / d) * push;
        a.x -= ux; a.y -= uy;
        b.x += ux; b.y += uy;
        moved++;
      }
    }
    w.nodes.forEach((n) => {
      n.x = Math.round(Math.max(56, Math.min(664, n.x)));
      n.y = Math.round(Math.max(90, Math.min(w.mapH - 70, n.y)));
    });
    if (!moved) break;
  }
});

/* The grass starts around y 300, so any stop above that floated in the sky.
   Every map grows until its highest stop stands on ground: the road keeps its
   spacing, it just gets longer, and the horizon stays where it is. */
DATA.groundLine = 540;
DATA.worlds.forEach((w) => {
  const minY = Math.min.apply(null, w.nodes.map((n) => n.y));
  if (minY >= DATA.groundLine) return;
  const shift = DATA.groundLine - minY;
  w.nodes.forEach((n) => { n.y += shift; });
  w.mapH += shift;
});

/* ---------------- Achievement rewards ----------------
   Every achievement pays out coins, but only when you claim it from the
   achievements panel — the claim button sits next to the finished achievement. */
DATA.achievements.push({
  id: 'laststand',
  name: 'Last Pig Standing',
  icon: '🐷',
  desc: 'Win a battle with three pigs sent in and only one still breathing.',
});

const ACH_REWARD = {
  first: 120, world1: 500, world2: 750, world3: 900, flawless: 400,
  untouched: 300, spender: 500, geared: 450, party: 600,
  hunter: 500, jackpot: 250, lucky: 250, combo: 400, legend: 800,
  delver: 300, deep: 600, unerring: 1000, explorer: 500, hoarder: 500,
  brewmaster: 400, relic: 200, w1sweep: 900, w2sweep: 1200, w3sweep: 1500,
  w3boss: 1000, frostbite: 550, woolly: 350, caveman: 450, unreal: 700,
  relicdex: 1500, index: 2000, laststand: 650,
  w5boss: 1400, w5sweep: 2800, keymaster: 900, mythic: 1100, finale: 2200,
};
DATA.achievements.forEach((a) => { a.reward = ACH_REWARD[a.id] || 200; });

/* ---------------- Waves ----------------
   Every level is fought in waves: one to three for a normal battle, five for a boss.
   A two-heavy patrol or a mini-boss pack gets a single longer wave instead.
   Waves change the flock, not its numbers: the level's own HP and ATK are fixed. */
/* wavesFor: waves per level. The opening road is one or two waves, the late
   road tops out at three, and bosses run five waves (the last king gets six). A patrol
   built around tanks, mini-bosses or big casters trades wave count for one
   longer, tougher fight instead of becoming a six-wave slog. */
DATA.wavesFor = function (level) {
  if (!level) return 1;
  /* A level can pin its own wave count. The dungeon uses this: one depth is
     one chamber, so a boss chamber is the boss, not four waves of escorts. */
  if (level.waves) return level.waves;

  /* Bosses run the whole five-wave finale, and the last world's king gets a
     sixth so the campaign ends bigger than it started. */
  if (level.boss) return level.world >= ((DATA.worlds || []).length || 5) ? 6 : 5;

  /* A heavy wall is a set-piece too: two or more genuinely huge birds in one
     line is a long fight, not a three-wave patrol. High late-game HP alone is
     not enough, or every road in the last world would collapse to one wave. */
  const heavy = (level.enemies || []).filter((e) => !!(DATA.enemies[e.t] || {}).big).length;

  /* Elite squads, mini-bosses, side roads and caves are a single long wave:
     they trade wave count for one tougher flock. */
  const num = parseInt(String(level.id).slice(1), 10) || 0;
  if (level.elite || level.mini || heavy >= 2 || num >= 30) return 1;

  /* The main road ramps: the opening fight is one wave, the next three are
     two, and every main level from the fifth on is a three-wave fight. */
  const route = level.route || 0;
  if (route <= 1) return 1;
  if (route <= 4) return 2;
  return 3;
};
levelLadder();

/* Side roads and caves are optional branches. They sit late in the row table
   but are reachable early, so they must read as "a fight near this point on the
   road", never as a spike. Each one is pulled to within 10% of the closest main
   level in its world. */
(function smoothSideLevels() {    const scoreOf = (lv) => {
    const waves = DATA.wavesFor(lv);
    let hp = 0;
    let atk = 0;
    lv.enemies.forEach((e) => {
      const tpl = DATA.enemies[e.t];
      hp += tpl.hp * e.hpMul;
      atk += tpl.atk * e.atkMul;
    });
    /* More waves mean more total birds, but each bird keeps the same stats. */
    return Math.sqrt(hp * atk * waves) * (lv.boss ? 1.12 : 1);
  };
  const byWorld = {};
  Object.keys(DATA.levels).forEach((id) => {
    const lv = DATA.levels[id];
    (byWorld[lv.world] = byWorld[lv.world] || []).push(lv);
  });
  Object.keys(byWorld).forEach((w) => {
    const all = byWorld[w].sort((a, b) => a.order - b.order);
    const isSide = (lv) => (parseInt(String(lv.id).slice(1), 10) || 0) >= 30;
    const main = all.filter((lv) => !isSide(lv));
    if (!main.length) return;
    all.filter(isSide).forEach((lv) => {
      const near = main.reduce((best, cand) => (Math.abs(cand.order - lv.order) < Math.abs(best.order - lv.order) ? cand : best), main[0]);
      const cap = scoreOf(near) * 1.1;
      const cur = scoreOf(lv);
      if (cur <= cap || cur <= 0) return;
      const k = Math.max(0.25, cap / cur);
      lv.enemies.forEach((e) => { e.hpMul *= k; e.atkMul *= k; });
    });
  });
})();

DATA.waveEntries = function (level, wave) {
  /* Waves rotate the flock; they never add hidden HP or ATK. The level row's
     multipliers are the only stat scaling, so a listed bird has the same
     numbers in every wave. */
  const base = level.enemies || [];
  const recruits = DATA.summonsByWorld[level.world || 1] || DATA.summonsByWorld[1];
  /* Every wave brings a different flock: the authored line rotates, and one
     non-boss slot is filled by a fresh recruit from this world's pool. Bosses
     keep their slot so the finale never loses its headliner. */
  const line = base.map((e, i) => {
    const tpl = DATA.enemies[e.t] || {};
    /* A boss is the finale, not a resident: it arrives with the last wave. */
    if (tpl.boss) return wave === DATA.wavesFor(level) ? e : null;
    if (wave === 1 || !recruits || !recruits.length) return e;
    if (i === (wave - 1) % base.length) {
      const key = recruits[(wave - 2 + i) % recruits.length];
      if (key && DATA.enemies[key] && key !== e.t) return { ...e, t: key };
    }
    return e;
  });
  const kept = line.filter(Boolean);
  return wave === 1 || !kept.length ? kept : kept.slice(wave % kept.length).concat(kept.slice(0, wave % kept.length));
};

/* Who a boss or a summoner can call in, per world. */
/* Wave recruits and summons come from the world you are standing in — never
   from anywhere else. The dungeon is the only mixed pool. */
DATA.summonsByWorld = {
  1: DATA.worldRoster[1].slice(),
  2: DATA.worldRoster[2].slice(),
  3: DATA.worldRoster[3].slice(),
  4: DATA.worldRoster[4].slice(),
};
DATA.summonFor = function (world) {
  const pool = DATA.summonsByWorld[world] || DATA.summonsByWorld[1];
  return pool[Math.floor(Math.random() * pool.length)];
};


/* ----------------------------------------------------------------
   Prices — the wheel pays double on its first spin of the day, so
   every coin sink carries a modest markup to match. Herb costs are
   left alone: herbs come from fights and chests, not the wheel.
   ---------------------------------------------------------------- */
DATA.priceMul = 1.2;
(function () {
  const bump = (v) => Math.max(1, Math.round((v * DATA.priceMul) / 5) * 5);
  DATA.heroes.forEach((h) => {
    [h.weapon, h.helmet].forEach((slot) => {
      if (slot && Array.isArray(slot.cost)) slot.cost = slot.cost.map((c, i) => (i === 0 ? c : bump(c)));
    });
  });
  Object.keys(DATA.training).forEach((k) => {
    DATA.training[k].cost = DATA.training[k].cost.map(bump);
  });
  Object.keys(DATA.potions).forEach((k) => {
    const potion = DATA.potions[k];
    if (potion.shop) potion.shop = bump(potion.shop);
    if (potion.coins) potion.coins = bump(potion.coins);
  });
  (DATA.blueprints || []).forEach((b) => {
    if (b.cost) b.cost = bump(b.cost);
    if (b.coins) b.coins = bump(b.coins);
  });
  /* Brewing recipes: the list whose entries carry herbs + coins. */
  const brewKey = Object.keys(DATA).find((k) => Array.isArray(DATA[k]) && DATA[k].length
    && DATA[k][0] && DATA[k][0].herbs != null && DATA[k][0].coins != null);
  if (brewKey) DATA[brewKey].forEach((r) => { if (r.coins) r.coins = bump(r.coins); });
  DATA.brewKey = brewKey || null;
})();


/* ----------------------------------------------------------------
   Crafting — the wheel pays well, so brewing is the priciest sink in
   the game. Recipes carry an extra markup over the base 20%: coins
   climb by a third again and herbs by 30%.
   ---------------------------------------------------------------- */
DATA.craftMul = { coins: 1.35, herbs: 1.3 };
DATA.recipes.forEach((r) => {
  r.coins = Math.max(5, Math.round((r.coins * DATA.craftMul.coins) / 5) * 5);
  r.herbs = Math.ceil(r.herbs * DATA.craftMul.herbs);
});


/* ----------------------------------------------------------------
   The pepper relic — the rarity pass above rewrites every relic cost
   from its rarity, so this has to come after it. The Chef's pepper
   supper is one party-wide charge per battle, worth 4x a usual rare.
   ---------------------------------------------------------------- */
DATA.PEPPER_RELIC_MUL = 4;
(function () {
  const pepper = DATA.relics.find((r) => r.id === 'chef_r2');
  if (pepper) pepper.cost = Math.round(pepper.cost * DATA.PEPPER_RELIC_MUL);
})();


/* ----------------------------------------------------------------
   Achievement tiers — four difficulty bands (1, 2, 3 and 5 stars).
   The harder the band, the bigger the coin payout when claimed.
   ---------------------------------------------------------------- */
const ACH_STARS = {
  jackpot: 1, lucky: 1,
  world1: 2, world2: 2, spender: 2, geared: 2, party: 2, hunter: 2, combo: 2,
  explorer: 2, hoarder: 2, brewmaster: 2, caveman: 2,
  flawless: 3, untouched: 3, legend: 3, deep: 3, w1sweep: 3, w2sweep: 3,
  w3boss: 3, frostbite: 3, unreal: 3, laststand: 3,
  unerring: 5, w3sweep: 5, relicdex: 5, index: 5,
};
DATA.achievements.forEach((a) => { if (!a.stars) a.stars = ACH_STARS[a.id] || 2; });

/* ---------------- Star milestones + late-game feats ----------------
   The long-haul feats. The star milestones watch the
   total stars earned across the campaign, not the three-star clear count. */
DATA.achievements.push(
  { id: 'stars50', name: 'First Fifty', icon: '⭐', stars: 2, desc: 'Earn 50 stars across the campaign.' },
  { id: 'stars100', name: 'Century of Stars', icon: '💫', stars: 3, desc: 'Earn 100 stars across the campaign.' },
  { id: 'stars150', name: 'Half the Sky', icon: '🌌', stars: 5, desc: 'Earn 150 stars across the campaign.' },
  { id: 'stars200', name: 'Star Baron', icon: '🪐', stars: 5, desc: 'Earn 200 stars across the campaign.' },
  { id: 'stars250', name: 'Star Sovereign', icon: '👑', stars: 5, desc: 'Earn 250 stars across the campaign.' },
  { id: 'stars300', name: 'Star Empire', icon: '🏛️', stars: 5, desc: 'Earn 300 stars across the campaign.' },
  { id: 'stars350', name: 'Star Dynasty', icon: '🌞', stars: 5, desc: 'Earn 350 stars across the campaign.' },
  { id: 'stars400', name: 'The Whole Sky', icon: '💯', stars: 5, desc: 'Earn 400 stars across the campaign — almost every level perfected.' },
  { id: 'w4sweep', name: 'Shore Sweep', icon: '🌊', stars: 3, desc: 'Clear every level on Saltwind Shore, side roads and caves included.' },
  { id: 'bossrushall', name: 'Crown Collector', icon: '👑', stars: 5, desc: 'Defeat every world boss, the Gilded King included.' },
  { id: 'kills500', name: 'Bird Bouncer', icon: '🪶', stars: 3, desc: 'Knock out 500 birds.' },
  { id: 'kills1000', name: 'Feathered Extinction', icon: '☄️', stars: 5, desc: 'Knock out 1,000 birds. The flock is running out of cousins.' },
  { id: 'perfect20', name: 'Twenty Perfect', icon: '🌟', stars: 3, desc: 'Earn three stars on twenty different levels.' },
  { id: 'perfect30', name: 'Thirty Perfect', icon: '💎', stars: 3, desc: 'Earn three stars on thirty different levels.' },
  { id: 'deep25', name: 'Deep Diver', icon: '🕳️', stars: 3, desc: 'Clear dungeon depth 25.' },
  { id: 'rich20k', name: 'Royal Treasury', icon: '🪙', stars: 3, desc: 'Hold 20,000 coins at once.' },
  { id: 'forgeall', name: 'Forge Master', icon: '🔥', stars: 5, desc: 'Take every pig to the maximum relic-forge level.' },
  { id: 'weapon5', name: 'Fully Forged', icon: '🔨', stars: 3, desc: 'Upgrade one pig to a tier-5 weapon.' },
  { id: 'helmet5', name: 'Full Plate', icon: '🪖', stars: 3, desc: 'Upgrade one pig to a tier-5 helmet.' },
  { id: 'flask20', name: 'Apothecary', icon: '🧪', stars: 2, desc: 'Carry 20 potions at once.' },
  { id: 'legendary3', name: 'Three Crowns', icon: '✹', stars: 5, desc: 'Own three Legendary relics at the same time.' },
  { id: 'elites40', name: 'Elite Veteran', icon: '⚔️', stars: 3, desc: 'Clear 40 elite levels.' },
  { id: 'dungeon30', name: 'Abyss Walker', icon: '🕳️', stars: 5, desc: 'Clear dungeon depth 30.' },
  { id: 'carnival50', name: 'Wheel Dealer', icon: '🎡', stars: 2, desc: 'Spin the victory wheel 50 times.' },
  { id: 'flask30', name: 'Traveling Apothecary', icon: '🧪', stars: 3, desc: 'Carry 30 potions at once.' },
  { id: 'week14', name: 'Fortnight of Slop', icon: '🎁', stars: 3, desc: 'Claim the daily chest 14 days in a row.' },
);

/* Twelve more, so the index holds forty awards in total. */
DATA.achievements.push(
  { id: 'veteran', name: 'Seasoned Trooper', icon: '🎖️', stars: 3, desc: 'Win 100 battles.' },
  { id: 'bossrush', name: 'Boss Breaker', icon: '👑', stars: 5, desc: 'Defeat all five world bosses.' },
  { id: 'grandsweep', name: 'World Tour', icon: '🌍', stars: 5, desc: 'Clear every level in all five worlds, caves and side routes included.' },
  { id: 'relic3', name: 'Relic Hunter', icon: '💎', stars: 2, desc: 'Own three different relics.' },
  { id: 'tier2all', name: 'Kitchen Arsenal', icon: '🔨', stars: 3, desc: 'Get every pig to at least a tier-2 weapon.' },
  { id: 'trainingmax', name: 'Drill Sergeant', icon: '💪', stars: 3, desc: 'Max out one Barracks training track.' },
  { id: 'rich10k', name: 'Egg Tycoon', icon: '🏦', stars: 3, desc: 'Hold 10,000 coins at once.' },
  { id: 'dungeon5', name: 'Into the Deep', icon: '🕳️', stars: 2, desc: 'Reach dungeon depth 5.' },
  { id: 'elites20', name: 'Elite Slayer', icon: '⚔️', stars: 3, desc: 'Clear 20 elite levels.' },
  { id: 'materials8', name: 'Material World', icon: '🧰', stars: 3, desc: 'Hold at least one of every craft material at once, down to the last brine pearl.' },
  { id: 'alchemy3', name: 'Licensed Alchemist', icon: '⚗️', stars: 2, desc: 'Max out a potion grade. The bench stops smoking eventually.' },
  { id: 'forge5', name: 'Anvil Chorus', icon: '🔨', stars: 3, desc: 'Take one pig to relic forge level 5, where the sparks sing.' },
  { id: 'week7', name: 'Seven Slops Running', icon: '🎁', stars: 3, desc: 'Claim the daily chest seven days in a row. The pigs now expect breakfast.' },
  { id: 'w4boss', name: 'The Tide Turns', icon: '🌊', stars: 3, desc: 'Defeat the Saltwind boss in its own surf and walk back up the beach.' },
  { id: 'triplesix', name: 'Three Sixes', icon: '🎲', stars: 2, desc: 'Have three pigs sitting on a six at the same time. The dice are showing off.' },
  { id: 'architect', name: 'Blueprint Baron', icon: '📜', stars: 2, desc: 'Own six helmet blueprints. Knowledge is power; paperwork is armour.' },
  { id: 'carnival', name: 'Carnival Regular', icon: '🎡', stars: 2, desc: 'Spin the victory wheel 25 times. The carnies know your name now.' },
  { id: 'legendary', name: 'The Top Shelf', icon: '✹', stars: 5, desc: 'Own a Legendary relic. There is no shelf above this one.' },
);

/* One payout per band: 1 star is pocket change, 5 stars is a jackpot. */
DATA.achReward = { 1: 150, 2: 350, 3: 700, 5: 1500 };
DATA.achievements.forEach((a) => { a.reward = DATA.achReward[a.stars] || 200; });


/* One-star band ordering: easiest at the top, hardest at the bottom.
   Lower rank = shown higher in the list. */
const ACH_RANK = { lucky: 1, jackpot: 2 };
DATA.achievements.forEach((a) => { if (ACH_RANK[a.id]) a.rank = ACH_RANK[a.id]; });

/* ---------------- Biome decoration ----------------
   Every level gets a backdrop: caverns read as caverns, the kingdom forests as
   forests, and the rest inherit their world's sky. */
Object.assign(ACH_STARS, { w5boss: 5, w5sweep: 5, keymaster: 3, mythic: 3, finale: 5 });
(function () {
  const cavey = /cave|burrow|den|hollow|vault|maw|gallery|deep|throat|pocket|cellar|echo|nest|stair|mine/i;
  const foresty = /forest|marsh|grove|wood|bramble|hedge|verge|clearing|thicket/i;
  const watery = /river|stream|ford|creek|lake|pool|well|sea|surf|wave|tide|dock|pier|bay/i;
  const stony = /ruin|tower|wall|keep|gate|bridge|fort|yard|court|hall|throne|stone/i;
  const coldy = /frost|snow|ice|glacier|peak|blizzard|chill/i;
  const sandy = /dune|sand|mesa|canyon|bluff|scorch|ember|forge|desert/i;

  /* Every world owns a pool of skies. Slot 0 is its signature look, the rest
     rotate in so a world's fights stop looking like one single room. */
  const POOLS = {
    1: ['meadow', 'forest', 'orchard', 'river', 'night'],
    2: ['canyon', 'mesa', 'ruins', 'cave', 'oasis'],
    3: ['snow', 'pines', 'ice', 'cave', 'aurora'],
    4: ['beach', 'lagoon', 'cliffs', 'storm', 'cave'],
    5: ['castle', 'forest', 'courtyard', 'throne', 'moonlit'],
  };

  const pending = Object.keys(DATA.levels).filter(function (id) { return !DATA.levels[id].biome; });
  const totals = {};
  pending.forEach(function (id) { const w = DATA.levels[id].world || 1; totals[w] = (totals[w] || 0) + 1; });

  const seen = {};
  const used = {};
  pending.forEach(function (id) {
    const lv = DATA.levels[id];
    const name = lv.name || '';
    const world = lv.world || 1;
    const pool = POOLS[world] || POOLS[1];
    const n = seen[world] = (seen[world] || 0) + 1;
    const tally = used[world] = used[world] || {};
    /* No single sky may eat more than its fair share of a world: hints dress
       the room, they do not take the world over. */
    const cap = Math.ceil((totals[world] || pool.length) / pool.length);

    let hint = '';
    if (cavey.test(name)) hint = world === 3 ? 'ice' : 'cave';
    else if (foresty.test(name)) hint = world === 3 ? 'pines' : 'forest';
    else if (watery.test(name)) hint = world === 4 ? 'lagoon' : 'river';
    else if (stony.test(name)) hint = world === 5 ? 'courtyard' : 'ruins';
    else if (coldy.test(name)) hint = 'snow';
    else if (sandy.test(name)) hint = world === 2 ? 'mesa' : 'canyon';

    const hintOk = hint && pool.indexOf(hint) >= 0 && (tally[hint] || 0) < cap;
    const pick = hintOk ? hint : pool[(n - 1) % pool.length];
    lv.biome = pick;
    tally[pick] = (tally[pick] || 0) + 1;
  });
})();

/* ---------------- Sixth pig: Scout Pig ----------------
   Late recruit. Hunts one bird at a time and shuts its specials down. */
DATA.heroes.push({
  id: 'scout',
  name: 'Scout Pig',
  title: 'Trail Scout',
  role: 'Ranger',
  baseHp: 64,
  hpGrow: 9,
  baseAtk: 19,
  atkGrow: 3.9,
  unlockLevel: 0,
  unlockBattle: 55,
  trait: 'Single-target finisher. Pure damage with a squad whistle.',
  colors: ['#8fc95a', '#568a24', '#c0e88c'],
  abilities: [
    {
      id: 'rally', name: 'Rally Whistle', icon: '📣', cost: 3, target: 'party',
      healParty: (h) => 16 + 1.8 * h.level, shieldParty: (h) => 12 + 1.4 * h.level,
      desc: 'A sharp whistle pulls the whole squad together.',
    },
    { id: 'slingshot', name: 'Slingshot', icon: '🪶', cost: 0, target: 'enemy', mult: 1.35, desc: 'A hard pebble from the hedge.' },
    {
      id: 'ambush', name: 'Ambush', icon: '🏹', cost: 0, target: 'enemy', mult: 2.6, stun: 2, chili: 3,
      desc: 'A shot from silence.',
    },
  ],
  weapon: { name: 'Pig Sling', atkMul: [1, 1.18, 1.36], cost: [0, 175, 450] },
  helmet: {
    name: 'Scout Hood',
    hpBonus: [0, 22, 55],
    cost: [0, 175, 445],
    tiers: [
      { name: 'Scout Hood', desc: '+22 max HP.' },
      { name: 'Stalker Hood', desc: 'Rally Whistle heals and shields the squad for more.', mods: { rally: { healParty: (h) => 24 + 2.6 * h.level, shieldParty: (h) => 18 + 2.0 * h.level } } },
      { name: 'Night Hood', desc: 'Ambush hits for 325% and stuns for three rounds.', mods: { ambush: { mult: 3.25, stun: 3 } } },
    ],
  },
});

/* Scout joined after the first anvil pass, so build her 24 recipes here. */
(function buildScoutAnvilWeapons() {
  const nouns = ['Sling', 'Bow', 'Dart', 'Bola', 'Kunai', 'Spear'];
  const shapes = ['sling', 'wand', 'blade', 'pick', 'axe', 'sling'];
  const prefixes = [
    'Rusty', 'Sturdy', 'Spiked', 'Gilded', 'Storm', 'Moon', 'Cinder', 'Frost',
    'Thunder', 'Royal', 'Bone', 'Rune', 'Iron', 'Verdant', 'Gloom', 'Sun',
    'Crystal', 'Gale', 'Ember', 'Bramble', 'Silver', 'Shadow', 'Copper', 'Star',
  ];
  const procs = ['stun', 'cleanse', 'chain', 'crit'];
  for (let i = 0; i < 24; i += 1) {
    const proc = procs[i % procs.length];
    const fx = DATA.weaponEffects[proc];
    const atk = DATA.anvilWeaponDamage[i];
    const name = `${prefixes[i]} ${nouns[i % nouns.length]}`;
    const weapon = {
      id: `anvil_scout_${i + 1}`,
      name,
      icon: '⚔️',
      proc,
      shape: shapes[i % shapes.length],
      chance: 0.05,
      atk,
      colour: fx.colour,
      forHero: 'scout',
      effect: fx.name,
      desc: `${name}. +${atk} base damage. 5% chance on a hit to ${fx.desc}.`,
      cost: 150 + atk * 25,
      mats: DATA.anvilRecipeFor(120 + i),
    };
    DATA.anvilWeapons.push(weapon);
    DATA.blueprints.push({
      id: `bp-${weapon.id}`,
      slot: 'weapon',
      weaponId: weapon.id,
      heroId: 'scout',
      tier: 0,
      name: `${weapon.name} Blueprint`,
      desc: weapon.desc,
      cost: weapon.cost,
      mats: weapon.mats,
    });
  }
})();

/* Scout joined after the original blueprint pass, so add her helmet tiers here. */
[2, 3].forEach((tier) => {
  const helmet = DATA.heroes.find((h) => h.id === 'scout').helmet;
  DATA.blueprints.push({
    id: `scout-helmet-${tier}`,
    heroId: 'scout',
    tier,
    name: `Scout · ${helmet.tiers[tier - 1].name}`,
    desc: helmet.tiers[tier - 1].desc,
    cost: 90 + tier * 110,
    mats: blueprintMats('scout', tier),
  });
});

DATA.relics.push(
  {
    id: 'scout_r1', hero: 'scout', tier: 1, starter: true, cost: 0,
    name: 'Trail Map', skin: 'Trailblazer', tint: '#8fe08a', sigil: '🏹',
    desc: 'Slingshot hits 35% harder and knocks shields and mirages clean off the bird.',
    mods: { slingshot: { mult: 1.35, shred: true, desc: 'A harder pebble that takes the bird\'s wards with it.' } },
    stats: { atk: 0.07, hp: 0.01 },
  },
  {
    id: 'scout_r2', hero: 'scout', tier: 2, cost: 14,
    name: 'Rally Kit', skin: 'Field Medic', tint: '#b8e88f', sigil: '📣',
    desc: 'Rally Whistle becomes a field dressing: a much bigger squad heal and shield.',
    mods: { rally: { healParty: (h) => 28 + 2.8 * h.level, shieldParty: (h) => 20 + 2.2 * h.level, desc: 'A proper field dressing: big squad heal and a strong shield.' } },
    stats: { atk: 0.06, hp: 0.05 },
  },
);

/* Any relic added after the rarity pass still needs its tier label. */
DATA.relics.forEach((r) => {
  if (r.rarity) return;
  r.rarity = r.tier >= 4 ? 'mythic' : r.tier === 3 ? 'unreal' : r.tier === 2 ? 'rare' : 'common';
});

if (DATA.index.heroes.indexOf('scout') < 0) DATA.index.heroes.push('scout');

DATA.cutscenes.recruit_scout = {
  title: 'A Trail Worth Taking',
  panels: [
    { art: 'scout', kicker: 'A new recruit', text: 'Scout Pig comes over the wall without a sound, a sling in one trotter and a map in the other. "You have all been very loud," she says. "I have not."', voice: 'scout' },
    { art: 'corporal', kicker: 'Accepted', text: 'Corporal Pig looks at the map: every bird marked, and three routes around each one. "...Huh," he says, which from him is applause.', voice: 'corporal' },
  ],
};

/* ---------------- Gear tiers 4 and 5 ----------------
   Weapons and helmets climb to five. Tiers four and five are coin only: the
   blueprint gate still stops at three. The top two also sharpen each pig's
   ultimate, so a maxed helmet is worth the climb. */
DATA.heroes.forEach((h) => {
  const w = h.weapon;
  const hm = h.helmet;

  if (w.atkMul.length === 3) {
    const step = w.atkMul[2] - w.atkMul[1];
    const t4 = +(w.atkMul[2] + step * 1.05).toFixed(2);
    const t5 = +(t4 + step * 1.15).toFixed(2);
    w.atkMul.push(t4, t5);
  }
  if (w.cost.length === 3) {
    w.cost.push(Math.round((w.cost[2] * 2.1) / 10) * 10, Math.round((w.cost[2] * 3.8) / 10) * 10);
  }

  if (hm.hpBonus.length === 3) {
    const step = hm.hpBonus[2] - hm.hpBonus[1];
    const t4 = Math.round(hm.hpBonus[2] + step);
    const t5 = Math.round(t4 + step * 1.2);
    hm.hpBonus.push(t4, t5);
  }
  if (hm.cost.length === 3) {
    hm.cost.push(Math.round((hm.cost[2] * 2.1) / 10) * 10, Math.round((hm.cost[2] * 3.8) / 10) * 10);
  }

  if (hm.tiers.length === 3) {
    const ult = h.abilities.filter((a) => a.cost >= 6).pop() || h.abilities[h.abilities.length - 1];
    const base = ult.mult || 1;
    hm.tiers.push(
      {
        name: 'Masterwork ' + hm.name,
        desc: `${ult.name} hits 20% harder.`,
        mods: { [ult.id]: { mult: +(base * 1.2).toFixed(2) } },
      },
      {
        name: 'Ascendant ' + hm.name,
        desc: `${ult.name} hits 45% harder.`,
        mods: { [ult.id]: { mult: +(base * 1.45).toFixed(2) } },
      },
    );
  }
});

/* Scout Pig's third relic, so every pig carries the full ladder. */
DATA.relics.push({
  id: 'scout_r3', hero: 'scout', tier: 3, cost: 32,
  name: 'Silent Step', skin: 'Nightstalker', tint: '#7ad6a0', sigil: '🌙',
  desc: 'Slingshot hits 60% harder and feeds 15% of the damage back as health.',
  mods: { slingshot: { mult: 1.6, leech: 0.15, desc: 'A silent, heavier pebble that feeds 15% of its damage back.' } },
  stats: { atk: 0.10, hp: 0.03 },
});
DATA.relics.forEach((r) => {
  if (r.rarity) return;
  r.rarity = r.tier >= 4 ? 'mythic' : r.tier === 3 ? 'unreal' : r.tier === 2 ? 'rare' : 'common';
});

/* Wizard and Scout catch up: every pig now carries four relics. */
DATA.relics.push(
  {
    id: 'wizard_r4', hero: 'wizard', tier: 4, cost: 36,
    name: 'Archmage Crown', skin: 'Archmage', tint: '#b48fff', sigil: '☄️',
    desc: 'Meteor hits 160%, weakens for 3 rounds and leaves every bird open (+20% damage taken, 3 rounds).',
    mods: { meteor: { mult: 1.6, weaken: 3, vuln: { turns: 3, bonus: 0.2 }, desc: 'Kingdom fire: 160%, weakened 3 rounds, and every bird open for 3.' } },
    stats: { atk: 0.14, hp: 0.06 },
  },
  {
    id: 'scout_r4', hero: 'scout', tier: 4, cost: 36,
    name: 'Gilded Quiver', skin: 'Gilded Ranger', tint: '#ffd36b', sigil: '🏹',
    desc: 'Ambush becomes Killing Shot: 410%, a three-round stun, and the bird is left open (+25% damage taken).',
    mods: { ambush: { name: 'Killing Shot', mult: 4.1, stun: 3, vuln: { turns: 2, bonus: 0.25 }, desc: 'One shot from cover: 410%, a 3-round stun, and the bird wide open.' } },
    stats: { atk: 0.15, hp: 0.05 },
  },
);

/* ---------------- Legendary relics: the fifth and final rung ----------------
   One per pig, bought with dungeon medals after the mythic shelf is done.
   Raw stats and a giant rider on each pig's signature move; no new battle
   rules, so old saves keep working. */
DATA.rarities.legendary = {
  key: 'legendary', label: 'Legendary', icon: '✹', color: '#ff9a4a',
  cost: 50, statMul: 1,
  blurb: '50 🏅 relics · the top shelf. Raw endgame power, no multipliers.',
};
DATA.relics.push(
  {
    id: 'corporal_r5', hero: 'corporal', tier: 5, rarity: 'legendary',
    name: "Titan's Last Word", skin: 'Titanbreaker', tint: '#ff8a3d', sigil: '🌋',
    desc: 'Skull Crack becomes Cataclysm: every bird takes 190%, is stunned, burns for two and is left open (+25%, 3 rounds).',
    mods: { skullcrack: { name: 'Cataclysm', target: 'allEnemies', mult: 1.9, stun: 1, vuln: { turns: 3, bonus: 0.25 }, burn: { turns: 2, dmg: (h) => 10 + 0.45 * h.atk }, desc: 'Every bird: 190%, stunned a round, burning two, and open for three.' } },
    stats: { atk: 0.20, hp: 0.08 },
  },
  {
    id: 'chef_r5', hero: 'chef', tier: 5, rarity: 'legendary',
    name: 'Cauldron Eternal', skin: 'Everfeast', tint: '#ffb347', sigil: '🍲',
    desc: 'Hot Soup becomes Everlasting Stew: a huge squad heal, a big shield and it washes every debuff off the pigs.',
    mods: { hotsoup: { target: 'party', healParty: (h) => 48 + 4.6 * h.level, shieldParty: (h) => 20 + 1.8 * h.level, cleanse: true, desc: 'A bottomless bowl: huge heal, big shields, and every debuff washed away.' } },
    stats: { atk: 0.10, hp: 0.15 },
  },
  {
    id: 'king_r5', hero: 'king', tier: 5, rarity: 'legendary',
    name: 'Crown of the Abyss', skin: 'Abyssal King', tint: '#ff5f52', sigil: '🔱',
    desc: 'Royal Guard becomes Unbroken Line: taunts for four rounds, takes 60% less damage, shields and mends the squad.',
    mods: { royalguard: { guard: { turns: 3, reduce: 0.6 }, taunt: 4, shieldParty: (h) => 30 + 2.6 * h.level, mend: (h) => 10 + 1.1 * h.level, desc: 'Taunts 4 rounds, takes 60% less, shields every pig and mends them.' } },
    stats: { atk: 0.22, hp: 0.09 },
  },
  {
    id: 'sapper_r5', hero: 'sapper', tier: 5, rarity: 'legendary',
    name: 'Sunfall Charge', skin: 'Sunbreaker', tint: '#ffd166', sigil: '☀️',
    desc: 'Big Boom becomes Sunfall: 300% to every bird, silenced 3 rounds, weakened 2, burning 3 and left open (+30%, 3 rounds).',
    mods: { bigboom: { mult: 3.0, silence: 3, weaken: 2, vuln: { turns: 3, bonus: 0.3 }, burn: { turns: 3, dmg: (h) => 8 + 0.35 * h.atk }, desc: 'Sunfall: 300%, silence, weakness, fire and every bird wide open.' } },
    stats: { atk: 0.21, hp: 0.06 },
  },
  {
    id: 'wizard_r5', hero: 'wizard', tier: 5, rarity: 'legendary',
    name: 'Starfall Codex', skin: 'Star Sovereign', tint: '#b48fff', sigil: '🌠',
    desc: 'Meteor becomes Starfall: 200% to every bird, weakened 4 rounds, silenced 3, and the squad rallies (+18%, 3 rounds).',
    mods: { meteor: { mult: 2.0, weaken: 4, silence: 3, rally: { turns: 3, mult: 0.18 }, desc: 'Starfall: 200%, weakened 4, silenced 3, and the squad surges.' } },
    stats: { atk: 0.20, hp: 0.09 },
  },
  {
    id: 'scout_r5', hero: 'scout', tier: 5, rarity: 'legendary',
    name: "Huntsman's Star", skin: 'Star Hunter', tint: '#7ad6a0', sigil: '🌌',
    desc: 'Ambush becomes Deadeye: 500%, stunned and silenced for 2 rounds, and 35% of the damage returns as health.',
    mods: { ambush: { name: 'Deadeye', target: 'enemy', mult: 5.0, stun: 2, silence: 2, leech: 0.35, desc: 'One shot: 500%, stun 2, silence 2, and a third of the damage healed back.' } },
    stats: { atk: 0.22, hp: 0.07 },
  },
);

/* Some relics wash the squad clean: tier 3 relics 50%, tier 4 and up 75%.
   The chance hangs off whichever ability the relic already rewrites, so it
   shows up in the tooltip and fires when that ability is used. */
DATA.relics.forEach((r) => {
  if (!r.mods) return;
  const chance = r.tier >= 4 ? 0.75 : r.tier === 3 ? 0.5 : 0;
  if (!chance) return;
  Object.keys(r.mods).forEach((k) => {
    const m = r.mods[k];
    if (m && typeof m === 'object') m.cleanseChance = Math.max(m.cleanseChance || 0, chance);
  });
});

/* One price per rarity, so every relic on the shelf matches its band. */
DATA.relics.forEach((r) => {
  if (!r.rarity) r.rarity = r.tier >= 4 ? 'mythic' : r.tier === 3 ? 'unreal' : r.tier === 2 ? 'rare' : 'common';
  if (!r.starter) r.cost = DATA.rarities[r.rarity].cost;
});

/* The two best relics of every pig carry a signature passive on top of their
   normal line: +8% attack and health while worn. The rest of the ladder keeps
   its plain stat rolls, so the top shelf is worth chasing. */
DATA.relicPassiveBonus = 0.08;
DATA.heroes.forEach((hero) => {
  DATA.relicsFor(hero.id)
    .slice()
    .sort((a, b) => (b.tier || 0) - (a.tier || 0))
    .slice(0, 2)
    .forEach((r) => {
      r.stats = r.stats || {};
      r.stats.atk = (r.stats.atk || 0) + DATA.relicPassiveBonus;
      r.stats.hp = (r.stats.hp || 0) + DATA.relicPassiveBonus;
      r.desc = (r.desc || '') + ' Signature passive: +8% of its damage and HP while worn.';
    });
});

/* ---------------- Warden keys for the first four roads ----------------
   Each of the early worlds keeps one side road sealed behind a key. Elites and
   the castle boss of that road carry it, and the branch behind the lock is a
   relic vault, so the key is always worth turning. */
DATA.worldKeys = {
  1: { id: 'iron', name: 'Iron Key' },
  2: { id: 'bronze', name: 'Bronze Key' },
  3: { id: 'jade', name: 'Jade Key' },
  4: { id: 'coral', name: 'Coral Key' },
};

DATA.worlds.forEach((w) => {
  const key = DATA.worldKeys[w.id];
  if (!key) return;
  const gates = w.nodes.filter((n) => n.type === 'gate' && n.auto);
  if (!gates.length) return;
  /* The deepest junction becomes the keyed branch. */
  const gate = gates[gates.length - 1];
  gate.auto = false;
  gate.key = key.id;
  const childId = String(gate.id).split('_')[1];
  const child = w.nodes.find((n) => n.id === childId);
  if (child && !DATA.levels[child.id]) {
    child.type = 'shop';
    child.relic = true;
  }
  if (child) child.keyed = true;
});

/* Elites and castles hand the key over. */
Object.keys(DATA.levels).forEach((id) => {
  const lv = DATA.levels[id];
  const key = DATA.worldKeys[lv && lv.world];
  if (!key) return;
  if (lv.elite || lv.boss) lv.grantsKey = key.id;
});

/* ---------------- Potion grades ----------------
   Three grades of each brew, except the ones that are already too strong to
   improve. Higher grades make the potion stronger and the next brew dearer. */
DATA.potions.heal.maxTier = 3;
DATA.potions.heal.grades = ['Heals 35% of every pig', 'Heals 50% of every pig', 'Heals 70% of every pig'];
DATA.potions.might.maxTier = 3;
DATA.potions.might.grades = ['+25% damage for 3 rounds', '+35% damage for 4 rounds', '+50% damage for 5 rounds'];
DATA.potions.hex.maxTier = 3;
DATA.potions.hex.grades = ['Birds hit 30% softer for 3 rounds', 'Weakens the flock for 4 rounds', 'Weakens the flock for 5 rounds'];
DATA.potions.rage.maxTier = 3;
DATA.potions.rage.grades = ['+4 pepper charge', '+7 pepper charge', '+10 pepper charge'];
DATA.potions.xp.maxTier = 1;
DATA.potions.xp.grades = ['90 XP on the spot'];
DATA.potions.backup.maxTier = 1;
DATA.potions.backup.grades = ['A fourth pig for one level'];

DATA.potionTierCost = function (key, tier) {
  const base = 1400;
  return { coins: tier >= 3 ? base * 2.6 : base, medals: tier >= 3 ? 14 : 6 };
};

DATA.potionGradeText = function (key, tier) {
  const p = DATA.potions[key] || {};
  return (p.grades && p.grades[Math.max(0, Math.min(2, (tier || 1) - 1))]) || p.desc || '';
};

DATA.potionEffect = function (kind, tier) {
  const t = Math.max(1, Math.min(3, tier || 1));
  if (kind === 'heal') return { heal: [0.35, 0.5, 0.7][t - 1] };
  if (kind === 'might') return { mult: [0.25, 0.35, 0.5][t - 1], rounds: [3, 4, 5][t - 1] };
  if (kind === 'hex') return { weaken: [3, 4, 5][t - 1] };
  if (kind === 'rage') return { pepper: [4, 7, 10][t - 1] };
  return {};
};

/* ---------------- Power readout ----------------
   One readable rating for a pig and one for a flock, so the level preview can
   say how the fight looks without printing four-digit walls. HP and ATK carry
   the weight, and every source that feeds them (level, weapon, crafted helmet
   tier, forge, relic and training) is already baked into heroStats. Shields,
   heals and guard turns are folded in as effective HP so support pigs are not
   undervalued just because they hit softer.
   The flock figure adds every wave together: the squad has to survive them
   all, so comparing it with one wave alone made every fight look trivial. */
DATA.POWER = { hp: 0.08, atk: 1.0, support: 0.6, hero: 1.08, flock: 1.05 };

/* What a pig's kit is worth beyond raw HP/ATK. The functions come from the
   same abilitiesFor() path the battle uses, so helmet tiers bought with
   blueprints, relic riders and gear upgrades are all reflected here. */
DATA.heroSupport = function (heroDef, level, gear, forgeLevel, relicId, partySize) {
  if (!heroDef) return 0;
  const stats = DATA.heroStats(heroDef, level, gear, forgeLevel, relicId);
  const squad = Math.max(1, partySize || 1);
  const h = { def: heroDef, level, atk: stats.atk, maxHp: stats.maxHp };
  let raw = 0;
  const value = (fn) => (typeof fn === 'function' ? fn(h) : 0);
  DATA.abilitiesFor(heroDef, gear, relicId).forEach((ab) => {
    raw += value(ab.healSingle) * (0.35 + 0.08 * squad);
    raw += value(ab.healParty) * (0.55 + 0.25 * squad);
    raw += value(ab.shieldSingle) * (0.50 + 0.10 * squad);
    raw += value(ab.shieldParty) * (0.60 + 0.30 * squad);
    raw += value(ab.selfHeal) * 0.25;
    if (ab.guard && ab.guard.reduce) raw += stats.maxHp * ab.guard.reduce * (0.45 + 0.08 * squad);
    if (ab.taunt) raw += 8 * ab.taunt;
  });
  /* Bacon Plating starts every fight with a shield; Critical Eye raises the
     squad's expected damage, so both training tracks count too. */
  raw += stats.maxHp * (DATA.trainingBonus.guard || 0) * 0.7;
  raw += stats.atk * (DATA.trainingBonus.edge || 0) * 0.55;
  return Math.round(raw);
};

DATA.heroPowerOf = function (stats, support) {
  const hp = stats.maxHp + (support || 0) * DATA.POWER.support;
  return Math.round((hp * DATA.POWER.hp + stats.atk * DATA.POWER.atk) * DATA.POWER.hero);
};

DATA.birdPower = function (hp, atk) {
  const base = hp * DATA.POWER.hp + atk * DATA.POWER.atk;
  return Math.round(base * (DATA.POWER.flock || 1));
};

DATA.pigPower = function (heroDef, level, gear, forgeLevel, relicId, partySize) {
  if (!heroDef) return 0;
  const stats = DATA.heroStats(heroDef, level, gear, forgeLevel, relicId);
  const support = DATA.heroSupport(heroDef, level, gear, forgeLevel, relicId, partySize);
  return DATA.heroPowerOf(stats, support);
};

/* Both numb birds must also be met on the main road, not only down a cave:
   the canyon gets Numbwing at 'Feather Fury', the shore gets Brine Wretch at
   'Brine Break'. Their rows are otherwise untouched. */
[['c6', 'numbwing'], ['s6', 'brinewretch'], ['c7', 'bristleback'], ['s7', 'spikegull']].forEach(([id, key]) => {
  const lv = DATA.levels[id];
  if (!lv || !lv.enemies) return;
  if (lv.enemies.some((e) => e.t === key)) return;
  lv.enemies.push({ t: key, hpMul: 1.0, atkMul: 0.9 });
});

DATA.difficultyOf = function (ratio) {
  const r = Number.isFinite(ratio) ? ratio : 1;
  if (r >= 2.4) return { tier: 0, key: 'cakewalk', label: 'Cakewalk', color: '#67d97a', note: 'You outgun this flock badly. Nothing to prove.' };
  if (r >= 1.85) return { tier: 1, key: 'easy', label: 'Easy', color: '#a8d94f', note: 'A comfortable fight if you play it straight.' };
  if (r >= 1.4) return { tier: 2, key: 'intimidating', label: 'Intimidating', color: '#ffcf5c', note: 'The flock has teeth. Watch the shields.' };
  if (r >= 1.05) return { tier: 3, key: 'difficult', label: 'Difficult', color: '#ff9a4a', note: 'Bring potions and focus fire.' };
  if (r >= 0.8) return { tier: 4, key: 'challenging', label: 'Challenging', color: '#ff6b4a', note: 'One bad round could end the run.' };
  return { tier: 5, key: 'catastrophic', label: 'Catastrophic', color: '#ff3b3b', note: 'The flock outguns you. Level up or gear first.' };
};

/* Not every pig swings with the same weight. The heavy hitters carry the early
   road, so the flock is tuned around a squad that is not perfectly even. */
DATA.heroGrade = { king: 1.12, corporal: 1.08, sapper: 1.06, scout: 1.04 };
DATA.heroes.forEach((h) => {
  const g = DATA.heroGrade[h.id];
  if (!g) return;
  if (typeof h.baseAtk === 'number') h.baseAtk = Math.round(h.baseAtk * g);
  else if (typeof h.atk === 'number') h.atk = Math.round(h.atk * g);
  if (typeof h.baseHp === 'number') h.baseHp = Math.round(h.baseHp * g);
  else if (typeof h.hp === 'number') h.hp = Math.round(h.hp * g);
});

/* Copy pass: every card reads as a sentence. Collapses doubled spaces, fixes
   spacing before punctuation, capitalises the first letter and closes the line
   with a full stop. Runs over every bird and pig after all content is built. */
DATA.tidyText = function (s) {
  if (typeof s !== 'string' || !s.trim()) return s;
  let t = s.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  return t;
};
Object.keys(DATA.enemies).forEach((k) => {
  const b = DATA.enemies[k];
  if (b.trait) b.trait = DATA.tidyText(b.trait);
  if (b.lore) b.lore = DATA.tidyText(b.lore);
});
DATA.heroes.forEach((h) => {
  if (h.trait) h.trait = DATA.tidyText(h.trait);
  (h.abilities || []).forEach((a) => {
    if (a.desc) a.desc = DATA.tidyText(a.desc);
  });
});
/* ---------------- Relic rework ----------------
   No two relics should feel alike. Each one hits a different ability with a
   different rider (stun, weaken, silence, burn, shield, heal, taunt), and the
   stat lines split between glass cannons, bruisers and support carries. */
