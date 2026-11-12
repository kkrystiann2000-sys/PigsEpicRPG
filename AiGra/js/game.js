/* ============================================================
   Game — save data, menu, worlds, base, shop, wheel, cutscenes
   ============================================================ */
const Game = (function () {
  const SAVE_KEY = 'piggy-epic-save-v2';
  const LEGACY_KEY = 'piggy-epic-save-v1';
  const MAX_PARTY = 3;
  const MAX_LEVEL = DATA.maxLevel;

  const el = {
    title: document.getElementById('screen-title'),
    map: document.getElementById('screen-map'),
    battle: document.getElementById('screen-battle'),
    base: document.getElementById('screen-base'),
    dungeon: document.getElementById('screen-dungeon'),
    overlay: document.getElementById('overlay'),
  };

  let save = loadSave();
  applyTraining();
  if (!save.flags || !save.flags.starterWeapons) {
    grantStarterWeapons();
    persist(true);
  }
  if (!save.flags || !save.flags.starterShields) {
    grantStarterShields();
    persist(true);
  }
  /* Safety net for new recruits added after the original starter pass. */
  ensureStarterGear();
  let activeLevel = null;
  let activeNode = null;
  let baseTab = 'party';
  let invPig = '';
  let anvilPig = '';
  let anvilKind = 'weapon';
  let wheel = null;
  let wheelDoneHook = null;
  let battleMode = 'campaign';
  let dungeonRun = null;
  let savedTimer = null;
  let toastTimer = null;

  /* ============================================================
     Save
     ============================================================ */

  function defaultSave() {
    return {
      version: 2,
      level: 1,
      xp: 0,
      coins: 60,
      herbs: 3,
      heroes: ['corporal'],
      party: ['corporal'],
      gear: {},
      upgrades: { power: 0, vigour: 0, edge: 0, guard: 0 },
      blueprints: [],
      weapons: ['starter_corporal'],
      weaponEquip: { corporal: 'starter_corporal' },
      shields: ['starter_shield_corporal'],
      shieldEquip: { corporal: 'starter_shield_corporal' },
      potions: { heal: 2 },
      cleared: {},
      opened: {},
      keys: [],
      potionTier: {},
      alchemyBuff: 0,
      world: 1,
      spins: 0,
      relics: 0,
      starsSpent: 0,
      charRelics: DATA.starterRelics(),
      relicBag: [],
      forge: {},
      dice: {},
      dungeon: { day: '', runs: 3, best: 0 },
      daily: { day: '', streak: 0 },
      wheelDay: '',
      wheelSpinsToday: 0,
      achieved: {},
      claimed: {},
      seenBirds: {},
      seenHeroes: {},
      cutscenes: {},
      flags: {},
      stats: { battles: 0, wins: 0, kills: 0, spent: 0, brews: 0, spins: 0, frostKills: 0, mammothKills: 0 },
      mats: { feather: 0, ore: 0, wood: 0, eggshell: 0, straw: 0, cactus: 0, sand: 0, rime: 0, wool: 0, coral: 0, pearl: 0 },
      pigs: {},
      settings: { sound: true, ui: 'normal', motion: true },
      started: false,
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = Object.assign(defaultSave(), parsed);
        merged.gear = parsed.gear || {};
        merged.stats = Object.assign(defaultSave().stats, parsed.stats);
        merged.potions = Object.assign({}, parsed.potions || {});
        merged.flags = parsed.flags || {};
        merged.claimed = parsed.claimed || {};
        merged.forge = parsed.forge || {};
        merged.dice = parsed.dice || {};
        merged.upgrades = Object.assign({ power: 0, vigour: 0, edge: 0, guard: 0 }, parsed.upgrades || {});
        merged.mats = Object.assign(defaultSave().mats, parsed.mats || {});
        merged.keys = Array.isArray(parsed.keys) ? parsed.keys : [];
        merged.potionTier = parsed.potionTier || {};
        merged.alchemyBuff = parsed.alchemyBuff || 0;
        merged.relics = parsed.relics || 0;
        merged.dungeon = Object.assign({ day: '', runs: DATA.dungeon.runsPerDay, best: 0 }, parsed.dungeon || {});
        merged.daily = Object.assign({ day: '', streak: 0 }, parsed.daily || {});
        merged.wheelDay = parsed.wheelDay || '';
        merged.wheelSpinsToday = parsed.wheelSpinsToday || 0;
        merged.charRelics = Object.assign(DATA.starterRelics(), parsed.charRelics || {});
        merged.relicBag = Array.isArray(parsed.relicBag) ? parsed.relicBag : [];
        merged.weapons = Array.isArray(parsed.weapons)
          ? parsed.weapons.filter((id) => !!DATA.craftedWeaponById(id))
          : [];
        merged.weaponEquip = parsed.weaponEquip && typeof parsed.weaponEquip === 'object' ? parsed.weaponEquip : {};
        merged.shields = Array.isArray(parsed.shields) ? parsed.shields.filter((id) => !!DATA.craftedShieldById(id)) : [];
        merged.shieldEquip = parsed.shieldEquip && typeof parsed.shieldEquip === 'object' ? parsed.shieldEquip : {};
        /* Awards that no longer exist are dropped on load: an old save can
           carry ids the index has since removed, and they would inflate every
           "x / N unlocked" count on the board and in the panel. */
        merged.achieved = merged.achieved || {};
        Object.keys(merged.achieved).forEach((id) => {
          if (!DATA.achievements.some((a) => a.id === id)) delete merged.achieved[id];
        });
        /* Per-pig XP arrived later: every pig an old save already has starts at
           the squad level that save was carrying, so nobody loses progress. */
        merged.pigs = merged.pigs || {};
        const seedPig = { level: merged.level || 1, xp: merged.xp || 0 };
        (merged.heroes || []).forEach((id) => { if (!merged.pigs[id]) merged.pigs[id] = Object.assign({}, seedPig); });
        return merged;
      }
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const old = JSON.parse(legacy);
        const fresh = defaultSave();
        fresh.started = !!(old.cleared && Object.keys(old.cleared).length);
        fresh.level = old.level || 1;
        fresh.xp = old.xp || 0;
        if (old.roster && old.roster.includes('chef')) fresh.heroes.push('chef');
        if (old.roster && old.roster.includes('king')) fresh.heroes.push('king');
        fresh.heroes = Array.from(new Set(fresh.heroes));
        fresh.pigs = {};
        fresh.heroes.forEach((id) => { fresh.pigs[id] = { level: fresh.level, xp: fresh.xp }; });
        fresh.party = fresh.heroes.slice(0, MAX_PARTY);
        // carry over world-1 clears where ids line up
        if (old.cleared) {
          Object.keys(old.cleared).forEach((n) => {
            const id = 'e' + n;
            if (DATA.levels[id]) fresh.cleared[id] = { stars: old.cleared[n], score: 0, best: 0 };
          });
        }
        return fresh;
      }
    } catch (e) { /* fall through to a fresh save */ }
    return defaultSave();
  }

  function persist(quiet) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { /* private mode: progress lasts the session */ }
    if (!quiet) savedFlash();
  }

  function savedFlash() {
    const pill = document.getElementById('savePill');
    if (!pill) return;
    pill.classList.add('show');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => pill.classList.remove('show'), 1100);
  }

  /* Main route only: side roads and cave clusters pay coins and materials,
     never pig XP. A numeric suffix of 30 or more marks a side level. */
  function isSideLevel(level) {
    const n = parseInt(String((level && level.id) || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 30;
  }

  /* Recruits are earned by clearing main-road battles, not by the party's XP
     level. Side roads and caves deliberately do not count. */
  function mainBattlesCleared() {
    return Object.keys(save.cleared || {}).filter((id) => {
      const lv = DATA.levels[id];
      return lv && !isSideLevel(lv);
    }).length;
  }

  /* ---------------- Per-pig XP ----------------
     Every pig banks its own XP and carries its own level. The squad's headline
     level (map pill, title screen, achievements) is simply the highest pig, so
     the older screens keep working unchanged. */
  function pigState(id) {
    if (!save.pigs) save.pigs = {};
    if (!save.pigs[id]) save.pigs[id] = { level: save.level || 1, xp: save.xp || 0 };
    return save.pigs[id];
  }

  function pigLevel(id) {
    return pigState(id).level;
  }

  function pigXp(id) {
    return pigState(id).xp;
  }

  function pigXpNeed(id) {
    return DATA.xpForLevel(pigLevel(id));
  }

  function pigXpPct(id) {
    const need = Math.max(1, pigXpNeed(id));
    return Math.max(0, Math.min(100, Math.round((Math.min(pigXp(id), need) / need) * 100)));
  }

  /* Returns how many levels this one pig gained. */
  function addPigXp(id, amount) {
    if (!(amount > 0)) return 0;
    const pig = pigState(id);
    pig.xp += Math.round(amount);
    let ups = 0;
    while (pig.level < MAX_LEVEL && pig.xp >= DATA.xpForLevel(pig.level)) {
      pig.xp -= DATA.xpForLevel(pig.level);
      pig.level += 1;
      ups += 1;
    }
    if (pig.level >= MAX_LEVEL) pig.xp = Math.min(pig.xp, DATA.xpForLevel(pig.level));
    return ups;
  }

  function syncSquadLevel() {
    let best = null;
    Object.keys(save.pigs || {}).forEach((id) => {
      if (!save.heroes.includes(id)) return;
      const p = save.pigs[id];
      if (!best || p.level > best.level) best = p;
    });
    if (!best) return;
    save.level = Math.max(save.level || 1, best.level);
    save.xp = best.level >= save.level ? best.xp : (save.xp || 0);
  }

  /* XP is personal: only the pigs that took the field earn it, never the bench. */
  function addXp(amount) {
    let ups = 0;
    (save.party || []).filter((id) => save.heroes.includes(id)).forEach((id) => { ups = Math.max(ups, addPigXp(id, amount)); });
    syncSquadLevel();
    return ups;
  }

  function starsTotal() {
    return Object.values(save.cleared).reduce((a, c) => a + (c.stars || 0), 0);
  }

  /* Stars remain lifetime progress for gates and achievements; the merchant
     spends from the unspent balance so a purchase never seals a world gate. */
  function starBalance() {
    return Math.max(0, starsTotal() - (save.starsSpent || 0));
  }

  function relicShopPrice(r) {
    return (r.tier || 1) >= 3
      ? { stars: 12, coins: 900 }
      : { stars: 6, coins: 450 };
  }

  function clearedBattles() {
    return Object.keys(save.cleared).filter((id) => DATA.levels[id]).length;
  }

  function heroDef(id) {
    return DATA.heroes.find((h) => h.id === id);
  }

  function gearOf(id) {
    if (!save.gear[id]) save.gear[id] = { weapon: 1, helmet: 1 };
    const gear = save.gear[id];
    /* Carried gear is flat base stats: the shield's HP and the weapon's attack
       sit inside the brackets in heroStats(), so every multiplier scales them. */
    const weapon = equippedWeapon(id);
    const shield = equippedShield(id);
    gear.bonusAtk = weapon ? (weapon.atk || 0) : 0;
    gear.bonusHp = shield ? (shield.hp || 0) : 0;
    return gear;
  }

  function craftedWeaponList() {
    save.weapons = Array.isArray(save.weapons) ? save.weapons : [];
    return save.weapons.map((id) => DATA.craftedWeaponById(id)).filter(Boolean);
  }

  function equippedWeaponId(heroId) {
    save.weaponEquip = save.weaponEquip || {};
    const id = save.weaponEquip[heroId];
    return id && (save.weapons || []).includes(id) ? id : '';
  }

  function equippedWeapon(heroId) {
    return DATA.craftedWeaponById(equippedWeaponId(heroId));
  }

  /* A pig's signature weapon is granted once, not on every load: a player who
     deliberately empties that hoof must stay empty. */
  function grantStarterFor(heroId) {
    const starter = DATA.starterWeaponFor(heroId);
    if (!starter) return;
    save.weapons = Array.isArray(save.weapons) ? save.weapons : [];
    save.weaponEquip = save.weaponEquip || {};
    if (!save.weapons.includes(starter.id)) save.weapons.push(starter.id);
    const heldBy = Object.keys(save.weaponEquip).find((id) => save.weaponEquip[id] === starter.id);
    if (!heldBy && !save.weaponEquip[heroId]) save.weaponEquip[heroId] = starter.id;
  }

  function grantStarterWeapons() {
    save.flags = save.flags || {};
    (save.heroes || []).forEach((id) => grantStarterFor(id));
    save.flags.starterWeapons = true;
  }

  function grantStarterShieldFor(heroId) {
    const starter = DATA.starterShieldFor(heroId);
    if (!starter) return;
    save.shields = Array.isArray(save.shields) ? save.shields : [];
    save.shieldEquip = save.shieldEquip || {};
    if (!save.shields.includes(starter.id)) save.shields.push(starter.id);
    const heldBy = Object.keys(save.shieldEquip).find((id) => save.shieldEquip[id] === starter.id);
    if (!heldBy && !save.shieldEquip[heroId]) save.shieldEquip[heroId] = starter.id;
  }

  function grantStarterShields() {
    save.flags = save.flags || {};
    (save.heroes || []).forEach((id) => grantStarterShieldFor(id));
    save.flags.starterShields = true;
  }

  function ensureStarterGear() {
    (save.heroes || []).forEach((id) => {
      grantStarterFor(id);
      grantStarterShieldFor(id);
    });
  }

  function clearWeapon(weaponId) {
    save.weaponEquip = save.weaponEquip || {};
    Object.keys(save.weaponEquip).forEach((heroId) => {
      if (save.weaponEquip[heroId] === weaponId) delete save.weaponEquip[heroId];
    });
  }

  function equipWeapon(heroId, weaponId) {
    /* Weapons are part of the pig's kit: there is no empty-hoof slot. Pick a
       different weapon to swap; every pig falls back to its signature weapon. */
    if (!weaponId) return equippedWeapon(heroId);
    const weapon = DATA.craftedWeaponById(weaponId);
    if (!weapon || !(save.weapons || []).includes(weaponId) || !save.heroes.includes(heroId)) return null;
    if (weapon.starterFor && weapon.starterFor !== heroId) return null;
    clearWeapon(weaponId);
    save.weaponEquip = save.weaponEquip || {};
    save.heroes.forEach((id) => {
      if (save.weaponEquip[id]) return;
      const starter = DATA.starterWeaponFor(id);
      if (!starter || !(save.weapons || []).includes(starter.id)) return;
      const heldBy = Object.keys(save.weaponEquip).find((hid) => save.weaponEquip[hid] === starter.id);
      if (!heldBy) save.weaponEquip[id] = starter.id;
    });
    save.weaponEquip[heroId] = weaponId;
    return weapon;
  }

  function craftedShieldList() {
    save.shields = Array.isArray(save.shields) ? save.shields : [];
    return save.shields.map((id) => DATA.craftedShieldById(id)).filter(Boolean);
  }

  function equippedShieldId(heroId) {
    save.shieldEquip = save.shieldEquip || {};
    const id = save.shieldEquip[heroId];
    return id && (save.shields || []).includes(id) ? id : '';
  }

  function equippedShield(heroId) {
    return DATA.craftedShieldById(equippedShieldId(heroId));
  }

  function clearShield(shieldId) {
    save.shieldEquip = save.shieldEquip || {};
    Object.keys(save.shieldEquip).forEach((heroId) => {
      if (save.shieldEquip[heroId] === shieldId) delete save.shieldEquip[heroId];
    });
  }

  function equipShield(heroId, shieldId) {
    /* Shields are carried HP, so they cannot be left behind either. */
    if (!shieldId) return equippedShield(heroId);
    const shield = DATA.craftedShieldById(shieldId);
    if (!shield || !(save.shields || []).includes(shieldId) || !save.heroes.includes(heroId)) return null;
    if (shield.starterFor && shield.starterFor !== heroId) return null;
    clearShield(shieldId);
    save.shieldEquip = save.shieldEquip || {};
    save.heroes.forEach((id) => {
      if (save.shieldEquip[id]) return;
      const starter = DATA.starterShieldFor(id);
      if (!starter || !(save.shields || []).includes(starter.id)) return;
      const heldBy = Object.keys(save.shieldEquip).find((hid) => save.shieldEquip[hid] === starter.id);
      if (!heldBy) save.shieldEquip[id] = starter.id;
    });
    save.shieldEquip[heroId] = shieldId;
    return shield;
  }

  function forgeOf(id) {
    return save.forge[id] || 0;
  }

  function heroPower(hero) {
    return DATA.heroStats(hero, pigLevel(hero.id), gearOf(hero.id), forgeOf(hero.id));
  }

  function isUnlockedHero(id) {
    return save.heroes.includes(id);
  }

  function heroUnlockHint(hero) {
    const need = hero.unlockBattle || 0;
    if (!need) return 'Starts with you';
    const done = mainBattlesCleared();
    if (done >= need) return `Unlocked after ${need} main battles`;
    return `Joins after ${need} main battles (${done}/${need})`;
  }

  /* A pig joining gets a proper card, not just a toast line lost in battle. */
  function showRecruitPopup(ids) {
    if (!ids || !ids.length || overlayOpen() || !el.battle.classList.contains('hidden')) return;
    const hero = heroDef(ids[0]);
    if (!hero) return;
    openSheet(`
      <div class="eyebrow">New pig</div>
      <h2>${hero.name} joined the squad!</h2>
      <div class="recruit-pop">
        <span class="rp-art">${Art.hero(hero.id)}</span>
        <div class="rp-body"><b>${hero.title || hero.role || 'Pig'}</b><span>${hero.trait || ''}</span>
        <small>Lv ${pigLevel(hero.id)} · swap pigs in and out from the Party tab in the base.</small></div>
      </div>
      <div class="sheet-actions"><button class="btn gold" id="ovCancel">Nice!</button></div>
    `);
    const btn = el.overlay.querySelector('#ovCancel');
    if (btn) btn.addEventListener('click', closeOverlay);
    SFX.play('levelup');
  }

  /* A win queues its scenes and recruit card here; the reward sheet closes
     first, then afterBattleNavigation runs them in order. */
  let pendingScenes = [];
  let pendingRecruits = [];
  const RECRUIT_SCENES = {
    chef: 'recruit_chef', king: 'recruit_king', sapper: 'recruit_sapper',
    wizard: 'recruit_wizard', scout: 'recruit_scout',
  };

  function ensureUnlocks() {
    const joined = [];
    const battles = mainBattlesCleared();
    DATA.heroes.forEach((hero) => {
      const need = hero.unlockBattle || 0;
      if (!save.heroes.includes(hero.id) && battles >= need) {
        save.heroes.push(hero.id);
        grantStarterFor(hero.id);
        grantStarterShieldFor(hero.id);
        joined.push(hero.id);
        if (save.party.length < MAX_PARTY) save.party.push(hero.id);
      }
    });
    if (!save.party.length) save.party = [save.heroes[0] || 'corporal'];
    save.party = save.party.filter((id) => save.heroes.includes(id)).slice(0, MAX_PARTY);
    if (!save.party.length) save.party = [save.heroes[0]];
    if (joined.length) {
      persist();
      /* The toast lands now; the scene and the card are queued so they never
         play underneath a victory sheet. */
      joined.forEach((id) => {
        const h = heroDef(id);
        SFX.play('unlock');
        toast(`${h.name} joined the party!`, h.id);
        if (!pendingRecruits.includes(id)) pendingRecruits.push(id);
        const cut = RECRUIT_SCENES[id];
        if (cut && !save.cutscenes[cut] && !pendingScenes.includes(cut)) pendingScenes.push(cut);
      });
      /* Nothing on the battle path will drain this, so try again shortly. */
      setTimeout(flushPending, 1200);
    }
    return joined;
  }

  /* ============================================================
     Overlay helpers
     ============================================================ */

  function show(which) {
    [['title', el.title], ['map', el.map], ['battle', el.battle], ['base', el.base], ['dungeon', el.dungeon]].forEach(([key, node]) => {
      node.classList.toggle('hidden', key !== which);
    });
    if (which === 'title') renderTitle();
    if (which === 'map') renderMap();
    if (which === 'base') renderBase();
    if (which === 'dungeon') renderDungeon();
    /* One theme for every screen that is not a fight; the battle picks its
       own cue when it starts. */
    if (which !== 'battle' && typeof Music !== 'undefined' && Music.play) Music.play('menu');
  }

  function closeOverlay() {
    el.overlay.classList.add('hidden');
    el.overlay.innerHTML = '';
    wheel = null;
  }

  let overlayOpenedAt = 0;

  function openSheet(html, opts) {
    const o = opts || {};
    /* A sheet that brings its own close control opts out of the default one. */
    const closeX = (o.cutscene || o.noX) ? '' : '<button class="sheet-x" id="ovX" aria-label="Close">✕</button>';
    el.overlay.innerHTML = `<div class="sheet ${o.dark ? 'dark' : ''} ${o.wide ? 'wide' : ''} ${o.cutscene ? 'cutscene' : ''} ${o.compact ? 'compact' : ''}">${closeX}${html}</div>`;
    el.overlay.classList.remove('hidden');
    overlayOpenedAt = Date.now();
    const sheetX = el.overlay.querySelector('#ovX');
    if (sheetX) sheetX.addEventListener('click', () => { SFX.play('click'); closeOverlay(); });
  }

  /* A sheet opened by a tap can take the synthetic click that follows the tap
     on whatever button now sits under the finger  -  on a phone that closed the
     level preview the instant it appeared. Swallow overlay clicks for a moment
     after a sheet opens so the tap that opened it cannot also dismiss it. */
  el.overlay.addEventListener('click', (ev) => {
    if (Date.now() - overlayOpenedAt < 350) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  }, true);

  function overlayOpen() {
    return !el.overlay.classList.contains('hidden');
  }

  function toast(text, artId) {
    let host = document.getElementById('toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toasts';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${artId ? `<span class="toast-art">${Art.hero(artId)}</span>` : '<span class="toast-ico">🏆</span>'}<span>${text}</span>`;
    host.appendChild(t);
    SFX.play('unlock');
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 400);
    }, 2600);
  }

  function coins(n) {
    return `<span class="cur">🪙 ${n}</span>`;
  }
  function herbs(n) {
    return `<span class="cur">🌿 ${n}</span>`;
  }
  function starStr(n) {
    return `<span class="stars-inline">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</span>`;
  }

  /* ============================================================
     Menu / title
     ============================================================ */

  /* ============================================================
     Menu tips
     ------------------------------------------------------------
     One short tip under the logo, picked fresh every time the
     title screen opens. Never the same line twice in a row.
     ============================================================ */

  const TITLE_TIPS = [
    'Every skill is free — only the pepper has to charge before it can be thrown.',
    'The road to each boss is always open. Gates only seal the side roads.',
    'Silence shuts down healers and shielders. Sometimes it beats raw damage.',
    'Bombs light a fuse. Kill or silence them before the squad disappears.',
    'A living tank gives the whole flock 12% damage reduction. Break the tank first.',
    'Shields last through the enemy turn. Cast them the round before the big hit.',
    'The wheel pays double on your first spin each day. Later spins pay half of that.',
    'The daily chest is one claim a day. Miss a day and the streak starts over.',
    'Potions do not stack. Brew one when you need it, not in advance.',
    'Only three birds come back as ghosts — wipe the living flock and they stay down.',
    'Burn ignores armour, so it chews through Terence and the mammoth.',
    'Bosses only appear in the final wave. Clear the small birds fast to keep your shields.',
    'A ghost stops counting down the moment the last living bird falls.',
    'Replays pay 25% rewards and one spin at 35% value. Star upgrades still pay the relic medals you missed.',
    'Three stars needs nobody knocked out and the squad above half health at the end.',
    'Party training and gear apply to all six pigs, not just the ones in the squad.',
    'The compendium remembers every bird you have met, weaknesses included.',
    'The castle at the end of each road keeps a golden egg. Reach it to close the world.',
  ];

  let lastTitleTip = -1;

  function pickTitleTip() {
    if (!TITLE_TIPS.length) return '';
    let i = Math.floor(Math.random() * TITLE_TIPS.length);
    if (TITLE_TIPS.length > 1 && i === lastTitleTip) i = (i + 1) % TITLE_TIPS.length;
    lastTitleTip = i;
    return TITLE_TIPS[i];
  }

  /* ---------------- Title flight ----------------
     The six pigs glide on a real sine wave, each on its own phase and speed,
     drifting sideways on one sine and bobbing on another, banking with the
     slope. The loop parks itself the moment the title screen is hidden. */
  let flightFrame = 0;

  function stopHeroFlight() {
    if (flightFrame) cancelAnimationFrame(flightFrame);
    flightFrame = 0;
  }

  function startHeroFlight() {
    stopHeroFlight();
    const box = el.title.querySelector('.title-heroes');
    if (!box) return;
    const flyers = Array.from(box.querySelectorAll('.flyer'));
    if (!flyers.length) return;
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pose = (f, x, y, bank, scale) => {
      f.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${bank.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    };
    /* Park every pig in its slot right away so they are never stacked, then
       hand over to the sine loop when the visitor allows motion. */
    const park = () => {
      const w0 = box.clientWidth || 340;
      const step0 = w0 / flyers.length;
      flyers.forEach((f, i) => {
        const baseX = -w0 / 2 + step0 * (i + 0.5);
        const lift = 6 - Math.sin((i / Math.max(1, flyers.length - 1)) * Math.PI) * 12;
        pose(f, baseX, lift, i % 2 ? 3 : -3, 1);
      });
    };
    park();
    if (still) return;

    const t0 = performance.now();
    const tick = (now) => {
      if (el.title.classList.contains('hidden')) { flightFrame = 0; return; }
      const w = box.clientWidth || 340;
      const step = w / flyers.length;
      const t = (now - t0) / 1000;
      flyers.forEach((f, i) => {
        const phase = i * 0.92;
        const baseX = -w / 2 + step * (i + 0.5);
        /* Travel is a pure vertical sine: x barely breathes so the line stays readable. */
        const x = baseX + Math.sin(t * 0.85 + phase) * 3;
        const bob = Math.sin(t * 1.75 + phase);
        const y = bob * 20;
        const bank = Math.cos(t * 1.75 + phase) * 6;
        const scale = 0.94 + Math.max(0, bob) * 0.08;
        pose(f, x, y, bank, scale);
      });
      flightFrame = requestAnimationFrame(tick);
    };
    flightFrame = requestAnimationFrame(tick);
  }

  /* ---------------- Title world ----------------
     The menu sky is a slow world rather than a still picture: three biomes are
     laid end to end and drift past on their own, while the menu scrolls over
     them. A day/night cycle runs over the top, so the same hills are dawn, noon,
     dusk and midnight without a reload. */
  let worldTimer = 0;
  let worldState = null;
  const WORLD_CYCLE = 108;

  function stopTitleWorld() {
    if (worldTimer) clearInterval(worldTimer);
    worldTimer = 0;
    if (worldState && worldState.unbind) worldState.unbind();
    worldState = null;
  }

  function startTitleWorld() {
    stopTitleWorld();
    const sky = el.title.querySelector('.sky');
    const track = el.title.querySelector('.world-track');
    if (!sky || !track) return;
    const sun = el.title.querySelector('.sky-sun');
    const moon = el.title.querySelector('.sky-moon');
    const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const state = { offset: 0, drift: 13, phase: 0.34, panel: track.clientWidth / 4 || 1 };
    worldState = state;

    /* Sun and moon ride the same arc from left to right; the second half of the
       day hands the sky to the moon. */
    const place = (node, t, arc) => {
      if (!node) return;
      if (t < 0) { node.style.opacity = '0'; return; }
      const lift = Math.sin(t * Math.PI);
      node.style.left = (8 + t * 84).toFixed(2) + '%';
      node.style.top = (64 - lift * arc).toFixed(2) + '%';
      node.style.opacity = Math.min(1, 0.2 + lift * 1.9).toFixed(2);
    };

    const paint = () => {
      const p = state.phase;
      const day = (Math.cos((p - 0.25) * Math.PI * 2) + 1) / 2;
      el.title.style.setProperty('--day', day.toFixed(3));
      el.title.style.setProperty('--night', (1 - day).toFixed(3));
      place(sun, p <= 0.5 ? p / 0.5 : -1, 44);
      place(moon, p > 0.5 ? (p - 0.5) / 0.5 : -1, 40);
    };

    const measure = () => { state.panel = track.clientWidth / 4 || 1; };
    const onResize = () => measure();

    /* The sky drifts on its own. Mouse wheel and drag are left alone so the
       title menu scrolls normally without scrubbing the background. */
    window.addEventListener('resize', onResize);
    state.unbind = () => {
      window.removeEventListener('resize', onResize);
    };

    paint();
    /* A slow interval rather than a frame loop: the drift is a few pixels a
       second, so the step size never shows, and the clock keeps its own time
       when the tab is throttled in the background. */
    let last = performance.now();
    const step = () => {
      if (el.title.classList.contains('hidden')) { stopTitleWorld(); return; }
      const now = performance.now();
      const dt = Math.min(0.4, Math.max(0, (now - last) / 1000));
      last = now;
      if (!still) {
        state.offset += state.drift * dt;
        state.phase = (state.phase + dt / WORLD_CYCLE) % 1;
      }
      /* Three authored panels plus a copy of the first one: wrapping at the
         width of the three keeps the seam off screen. */
      const span = state.panel * 3;
      if (span > 0) state.offset = ((state.offset % span) + span) % span;
      track.style.transform = `translate3d(${(-state.offset).toFixed(2)}px, 0, 0)`;
      paint();
    };
    worldTimer = setInterval(step, 40);
  }

  function renderTitle() {
    const progress = clearedBattles();
    const label = progress === 0 ? 'Start the Epic' : 'Continue';
    const achieved = Object.keys(save.achieved || {}).length;
    const claimable = DATA.achievements.filter((a) => save.achieved[a.id] && !(save.claimed || {})[a.id]).length;
    const seenBirds = Object.keys(save.seenBirds || {}).length;
    const birdTotal = Object.keys(DATA.enemies || {}).length;
    const dailyInfo = dailyRewardInfo();
    const worldName = (DATA.worlds.find((w) => w.id === save.world) || DATA.worlds[0] || {}).name || 'Egg World';
    const campaignTotal = Object.keys(DATA.levels).length;
    const campaignPct = campaignTotal ? Math.round((progress / campaignTotal) * 100) : 0;
    const furthestWorld = DATA.worlds.slice().reverse().find((w) => worldUnlocked(w.id)) || DATA.worlds[0];
    const furthestIcon = ({ 1: '🥚', 2: '🏜️', 3: '❄️', 4: '🏖️', 5: '🏰' })[furthestWorld.id] || '🗺️';
    el.title.innerHTML = `
      <div class="sky" aria-hidden="true">
        <div class="world-track">
          <div class="biome b-night"><span class="bio-far"></span><span class="bio-mid"></span><span class="bio-prop"></span></div>
          <div class="biome b-dunes"><span class="bio-far"></span><span class="bio-mid"></span><span class="bio-prop"></span></div>
          <div class="biome b-frost"><span class="bio-far"></span><span class="bio-mid"></span><span class="bio-prop"></span></div>
          <div class="biome b-night"><span class="bio-far"></span><span class="bio-mid"></span><span class="bio-prop"></span></div>
        </div>
        <div class="sky-nightwash"></div>
        <div class="sky-daywash"></div>
        <div class="sky-sun"></div>
        <div class="sky-moon"></div>
        <div class="sky-stars"></div>
        <div class="sky-cloud" style="--w:184px; top:8%; animation-duration:104s; animation-delay:-26s;"></div>
        <div class="sky-cloud" style="--w:98px; top:21%; animation-duration:72s; animation-delay:-54s;"></div>
        <div class="sky-cloud" style="--w:136px; top:33%; animation-duration:88s; animation-delay:-9s; opacity:0.72;"></div>
        <div class="sky-cloud" style="--w:62px; top:16%; animation-duration:58s; animation-delay:-40s; opacity:0.55;"></div>
        <div class="sky-cloud" style="--w:112px; top:40%; animation-duration:96s; animation-delay:-68s; opacity:0.45;"></div>
      </div>
      <div class="title-inner">
        <div class="title-kicker"><span class="kicker-dot"></span> A Bad Piggies RPG <span class="kicker-dot"></span></div>
        <h1 class="logo">PIGGY<span>EPIC</span></h1>
        <div class="logo-sub">Five Worlds · 60+ Battles · Six Pigs</div>
        <p class="title-desc">A turn-based pig-and-bird RPG: lead three pigs across five worlds, break the flock's shells, shields and ghosts, and keep the eggs out of beaks.</p>
        <div class="title-heroes">
          ${['corporal', 'chef', 'king', 'sapper', 'wizard', 'scout'].map((id, i) => `<span class="flyer" style="--i:${i}">${Art.hero(id)}</span>`).join('')}
        </div>
        <div class="title-board">
          <div class="title-board-head">
            <span class="board-label">Campaign</span>
            <span class="board-line"></span>
            <span class="board-status ${save.started ? 'live' : 'new'}"><i></i>${save.started ? 'In progress' : 'New game'}</span>
          </div>
          <div class="title-dossier">
            <span class="td-stat"><i>⚔️</i><b>${progress}</b><small>battles</small></span>
            <span class="td-stat"><i>★</i><b>${starsTotal()}</b><small>stars</small></span>
            <span class="td-stat"><i>🏆</i><b>${achieved}/${DATA.achievements.length}</b><small>achievements</small></span>
            <span class="td-stat"><i>💎</i><b>${save.relics || 0}</b><small>relics</small></span>
            <span class="td-stat"><i>🐷</i><b>Lv ${save.level}</b><small>🪙 ${save.coins}</small></span>
          </div>
          <div class="title-xp">${xpBar()}</div>
          <div class="title-run">
            <div class="title-run-progress" title="${progress} of ${campaignTotal} battles cleared">
              <div class="tr-top"><span>Campaign progress</span><b>${campaignPct}%</b></div>
              <div class="tr-track" role="progressbar" aria-label="Campaign progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${campaignPct}">
                <i style="width:${campaignPct}%"></i>
              </div>
            </div>
            <div class="title-run-world">
              <span class="tr-world-ico" aria-hidden="true">${furthestIcon}</span>
              <span class="tr-world-copy"><small>Furthest world</small><b>${furthestWorld.name}</b></span>
              <span class="tr-world-of">${furthestWorld.id}/${DATA.worlds.length}</span>
            </div>
          </div>
          <button class="btn gold title-cta" id="playBtn">
            <span class="cta-main">▶ ${label}</span>
            <span class="cta-sub">${save.started ? `${worldName} · Level ${save.level}` : 'Begin at the pig gate'}</span>
          </button>
          <div class="title-tools">
            <button class="tool" id="setBtn"><span>⚙️</span><small>Settings</small></button>
            <button class="tool" id="statsBtn"><span>📊</span><small>Statistics</small></button>
            <button class="tool" id="howBtn"><span>❔</span><small>How to Play</small></button>
            <button class="tool" id="credBtn"><span>🎬</span><small>Credits</small></button>
          </div>
          <div class="title-quick">
            <button class="tq" id="awardsBtn"><span class="tq-ico">🏆</span><span class="tq-body"><b>Achievements</b><small>${claimable ? `${claimable} reward${claimable === 1 ? '' : 's'} waiting` : `${achieved}/${DATA.achievements.length} unlocked`}</small></span><span class="tq-arrow">›</span></button>
            ${save.started ? `<button class="tq ${dailyRewardReady() ? 'ready' : ''}" id="dailyBtnTitle"><span class="tq-ico">🎁</span><span class="tq-body"><b>Daily chest</b><small>${dailyRewardReady() ? `Day ${dailyInfo.streak} ready` : `Day ${dailyInfo.streak} collected`}</small></span><span class="tq-arrow">›</span></button>` : ''}
            <button class="tq" id="codexBtn"><span class="tq-ico">📖</span><span class="tq-body"><b>Compendium</b><small>${seenBirds}/${birdTotal} birds met</small></span><span class="tq-arrow">›</span></button>
          </div>
          <div class="title-tip"><span class="tip-ico">💡</span><span>${pickTitleTip()}</span></div>
        </div>
        <div class="title-foot">
          The birds want the eggs. The pigs have hammers, soup, a king, dynamite and a wizard.
        </div>
      </div>
      <div class="title-ground" aria-hidden="true">
        <span class="tg-river"></span>
        <span class="tg-hill one"></span>
        <span class="tg-hill two"></span>
        <span class="tg-hill three"></span>
        <span class="tg-hill four"></span>
        <span class="tg-grass"></span>
      </div>
      <div id="savePill" class="save-pill">Saved ✓</div>
    `;
    startHeroFlight();
    startTitleWorld();
    el.title.querySelector('#playBtn').addEventListener('click', () => {
      stopHeroFlight();
      stopTitleWorld();
      SFX.play('click');
      if (!save.started) startNewGame();
      else show('map');
    });
    el.title.querySelector('#statsBtn').addEventListener('click', () => { SFX.play('click'); openStats(); });
    el.title.querySelector('#setBtn').addEventListener('click', () => { SFX.play('click'); openSettings(); });
    el.title.querySelector('#howBtn').addEventListener('click', openHowTo);
    el.title.querySelector('#credBtn').addEventListener('click', () => { SFX.play('click'); openCredits(); });
    el.title.querySelector('#awardsBtn').addEventListener('click', () => { SFX.play('click'); openAchievements(); });
    const titleDaily = el.title.querySelector('#dailyBtnTitle');
    if (titleDaily) titleDaily.addEventListener('click', () => { SFX.play('click'); openDailyReward(); });
    el.title.querySelector('#codexBtn').addEventListener('click', () => { SFX.play('click'); openIndex(); });
  }

  function startNewGame() {
    save = defaultSave();
    save.started = true;
    save.tutorial = { done: false };
    persist(true);
    SFX.play('click');
    playCutscene('intro1', () => {
      show('map');
      setTimeout(() => beginGuidedTour(true, 1), 600);
    });
  }

  function openTutorial() {
    if (save.tutorial && save.tutorial.done) return;
    openSheet(`
      <div class="eyebrow">Tutorial</div>
      <h2>How to play</h2>
      <div class="howto">
        <p><b>1) Pick a node.</b> Tap the glowing egg on the road to start a battle. Clear nodes to open the path forward.</p>
        <p><b>2) Battle.</b> Pick any ability, then a target — nothing costs rage. Only pepper moves wait on the squad's pepper charge; Chef's pepper supper heals and cleanses the whole squad. Heals/shields can hit one (stronger) or the whole squad.</p>
        <p><b>3) Grow stronger.</b> Visit the Base for gear, brew potions, spin the wheel, and check Settings for sound/UI.</p>
        <p><b>4) Replay.</b> Cleared levels can be replayed for 25% rewards to grind if needed.</p>
      </div>
      <div class="sheet-actions">
        <button class="btn gold" id="tutDone">Got it</button>
        <button class="btn ghost" id="tutSkip">Skip forever</button>
      </div>
    `);
    el.overlay.querySelector('#tutDone').addEventListener('click', () => { save.tutorial = { done: true }; persist(true); SFX.play('click'); closeOverlay(); });
    el.overlay.querySelector('#tutSkip').addEventListener('click', () => { save.tutorial = { done: true, skip: true }; persist(true); SFX.play('click'); closeOverlay(); });
  }

  /* The guided tour owns the first run: it walks the player through start,
     battle, pepper, rewards and every base tab, forcing the taps it needs.
     Finishing or skipping writes the flag so it never returns unasked. */
  function beginGuidedTour(force, startAt) {
    if (!window.Tutorial) { openTutorial(); return; }
    if (!force && save.tutorial && save.tutorial.done) return;
    if (new URLSearchParams(location.search).get('tour') === '0') return;
    /* Never start the tour on top of a sheet: a recruit card or the intro
       cutscene would be buried under the spotlight. */
    if (overlayOpen()) {
      clearTimeout(beginGuidedTour._retry);
      beginGuidedTour._retry = setTimeout(() => beginGuidedTour(force, startAt), 900);
      return;
    }
    /* A new game restarts the tour from the map step: the title one is done. */
    if (window.Tutorial.isActive()) window.Tutorial.cancel();
    window.Tutorial.begin({
      startAt: startAt || 0,
      onFinish() { save.tutorial = { done: true }; persist(true); },
      onSkip() { save.tutorial = { done: true, skip: true }; persist(true); },
    });
  }

  function buyPotionInBattle(kind) {
    const p = DATA.potions[kind];
    if (!p) return null;
    const price = p.shop || 60;
    if ((save.potions[kind] || 0) >= 1) { SFX.play('nope'); toast('You already carry one of those — potions do not stack.', null); return null; }
    if (save.coins < price) { SFX.play('nope'); toast('Not enough coins for that potion.', null); return null; }
    save.coins -= price;
    save.stats.spent += price;
    save.potions[kind] = 1;
    persist();
    SFX.play('buy');
    toast(`Bought ${p.name} for 🪙 ${price}`, null);
    return save.potions[kind];
  }

  function openStats() {
    const cleared = Object.keys(save.cleared).length;
    const perfect = Object.values(save.cleared).filter((c) => c.stars === 3).length;
    const rows = [
      ['Battles fought', save.stats.battles],
      ['Battles won', save.stats.wins],
      ['Win rate', save.stats.battles ? Math.round((save.stats.wins / save.stats.battles) * 100) + '%' : '—'],
      ['Birds knocked out', save.stats.kills],
      ['Levels cleared', `${cleared} / ${Object.keys(DATA.levels).length}`],
      ['Three-star clears', perfect],
      ['Stars earned', starsTotal()],
      ['Party level', save.level],
      ['Pigs recruited', `${save.heroes.length} / ${DATA.heroes.length}`],
      ['Coins spent', save.stats.spent],
      ['Potions brewed', save.stats.brews],
      ['Wheel spins', save.stats.spins],
      ['Dungeon runs today', `${save.dungeon.runs} / ${DATA.dungeon.runsPerDay}`],
      ['Deepest dungeon depth', save.dungeon.best || 0],
      ['Achievements', `${Object.keys(save.achieved).length} / ${DATA.achievements.length}`],
    ];
    openSheet(`
      <div class="eyebrow">Piggy Epic</div>
      <h2>Statistics</h2>
      ${rows.map(([k, v]) => `<div class="reward-line"><span>${k}</span><b>${v}</b></div>`).join('')}
      <div class="sheet-actions"><button class="btn" id="ovClose">Close</button></div>
    `);
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  function openSettings() {
    const st = save.settings || (save.settings = { sound: true, ui: 'normal', motion: true });
    const tap = (v) => (st.ui === v ? 'on' : '');
    openSheet(`
      <div class="eyebrow">Options</div>
      <h2>Settings</h2>
      <div class="set-row"><span>Sound &amp; voices</span><button class="btn small ${st.sound ? 'gold' : 'ghost'}" id="setSound">${st.sound ? '🔊 On' : '🔇 Off'}</button></div>
      <div class="set-row"><span>Interface size</span>
        <div class="seg"><button class="seg-btn ${tap('small')}" data-ui="small">S</button><button class="seg-btn ${tap('normal')}" data-ui="normal">M</button><button class="seg-btn ${tap('large')}" data-ui="large">L</button></div>
      </div>
      <div class="set-row"><span>Animations</span><button class="btn small ${st.motion ? 'gold' : 'ghost'}" id="setMotion">${st.motion ? 'Juicy' : 'Calm'}</button></div>
      <div class="set-row"><span>Save file</span><b class="set-note">autosaved locally</b></div>
      <div class="sheet-actions">
        <button class="btn ghost danger" id="setWipe">🗑 Delete save &amp; start from zero</button>
        <button class="btn" id="ovClose">Close</button>
      </div>
    `);
    el.overlay.querySelector('#setSound').addEventListener('click', () => {
      st.sound = !st.sound;
      SFX.setMuted(!st.sound);
      persist(true);
      openSettings();
    });
    el.overlay.querySelector('#setMotion').addEventListener('click', () => {
      st.motion = !st.motion;
      applySettings();
      persist(true);
      openSettings();
    });
    el.overlay.querySelectorAll('[data-ui]').forEach((b) => b.addEventListener('click', () => {
      st.ui = b.dataset.ui;
      applySettings();
      persist(true);
      openSettings();
    }));
    el.overlay.querySelector('#setWipe').addEventListener('click', () => {
      closeOverlay();
      confirmReset();
    });
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  function applySettings() {
    const st = save.settings || {};
    document.documentElement.dataset.ui = st.ui || 'normal';
    document.documentElement.classList.toggle('calm', st.motion === false);
    SFX.setMuted(st.sound === false);
  }

  function openCredits() {
    openSheet(`
      <div class="eyebrow">Piggy Epic</div>
      <h2>Credits</h2>
      <div class="howto">
        <p><b>The pigs.</b> Corporal, Chef, King, Sapper, Wizard and Scout Pig — six pigs, one egg problem.</p>
        <p><b>The flock.</b> Eighty-seven birds, five worlds, and five that refuse to stay dead.</p>
        <p><b>Engine.</b> Plain HTML, CSS and JavaScript. No frameworks, no build step beyond the single-file bundler.</p>
        <p><b>Art.</b> Every pig and bird is drawn in code as SVG.</p>
        <p><b>Sound.</b> Voices and effects are synthesised in the browser.</p>
        <p><b>Made with.</b> Freebuff.</p>
      </div>
      <div class="sheet-actions"><button class="btn" id="ovClose">Close</button></div>
    `);
    el.overlay.querySelector("#ovClose").addEventListener("click", closeOverlay);
  }
  function openHowTo() {
    openSheet(`
      <div class="eyebrow">Piggy Epic</div>
      <h2>How to play</h2>
      <div class="howto">
        <p><b>Battles.</b> Pick any ability, then a target. Nothing costs rage — the pepper charges as you hit birds. Heroes act left to right, then the flock attacks.</p>
        <p><b>Single or squad.</b> Heals and shields can be cast on one pig (much stronger) or the whole squad (weaker). Tap a pig for the strong version.</p>
        <p><b>Items.</b> Potions in your bag are free actions. Open the bag with the Items button.</p>
        <p><b>Coins & base.</b> Every fight pays coins. Spend them in the Pig Base on weapons, helmets, potions and dice-rolled upgrades.</p>
        <p><b>Stars.</b> Score comes from damage dealt, healing, health left and damage taken. Every win pays a single wheel spin.</p>
        <p><b>Gates.</b> The main road to every boss is always open. Only side roads are sealed, and their keys drop from elite fights.</p>
      </div>
      <div class="sheet-actions"><button class="btn" id="ovClose">Got it</button></div>
    `);
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  function confirmReset() {
    openSheet(`
      <div class="eyebrow">Danger</div>
      <h2>Start over?</h2>
      <p>All battles, stars, coins, gear, potions, heroes and achievements will be wiped. The birds will be delighted.</p>
      <div class="sheet-actions">
        <button class="btn" id="ovResetYes">Wipe it</button>
        <button class="btn ghost" id="ovResetNo">Keep playing</button>
      </div>
    `);
    el.overlay.querySelector('#ovResetYes').addEventListener('click', () => {
      save = defaultSave();
      persist(true);
      closeOverlay();
      show('title');
    });
    el.overlay.querySelector('#ovResetNo').addEventListener('click', closeOverlay);
  }

  /* ============================================================
     Map
     ============================================================ */

  const THEMES = {
    kingdom: {
      sky1: '#f6d9a4', sky2: '#fbeed6', ground1: '#c9b48a', ground2: '#9c855f',
      hill: '#b8a077', path1: '#8a7350', path2: '#f7e6c2', rock: '#8d7c63',
    },
    meadow: {
      sky1: '#bfe9f7', sky2: '#eafad8', ground1: '#a2d76d', ground2: '#6ba63c',
      hill: '#8ecb5b', path1: '#7f9e4e', path2: '#f6e8bd', rock: '#a9ab97',
    },
    canyon: {
      sky1: '#ffd8a1', sky2: '#ffeccb', ground1: '#dda267', ground2: '#b9763c',
      hill: '#c98a52', path1: '#a8663a', path2: '#f6d7a4', rock: '#b4835a',
    },
    snow: {
      sky1: '#bcd7ee', sky2: '#f0f8ff', ground1: '#e8f3fb', ground2: '#bcd4e8',
      hill: '#d7e9f7', path1: '#a8c3d8', path2: '#f4fbff', rock: '#9fb6c9',
    },
    beach: {
      sky1: '#a9e6f0', sky2: '#eafaf3', ground1: '#f3e3b0', ground2: '#e0c78a',
      hill: '#8fd8d0', path1: '#cbb083', path2: '#fff6dd', rock: '#9fb3ac',
    },
  };

  function worldOf(id) {
    return DATA.worlds.find((w) => w.id === id);
  }

  function nodeOf(world, id) {
    return world.nodes.find((n) => n.id === id);
  }

  function nodeComplete(world, id, seen) {
    const n = nodeOf(world, id);
    if (!n) return false;
    if (n.type === 'gate') return !!save.opened[id];
    if (n.type === 'battle') return !!save.cleared[id];
    /* Shops, forges and the base are stops on the road, not walls. Reaching
       one opens the road beyond it, so a branch that runs through two shops
       can never dead-end the world. */
    return nodeAvailable(world, n, seen);
  }

  function nodeAvailable(world, node, seen) {
    if (node.id === world.nodes[0].id) return true;
    const guard = seen || new Set();
    if (guard.has(node.id)) return false;
    const nextSeen = new Set(guard).add(node.id);
    const preds = world.edges.filter(([a, b]) => b === node.id).map(([a]) => a);
    return preds.some((p) => nodeComplete(world, p, nextSeen));
  }

  function bossNodeId(world) {
    const boss = world.nodes.find((n) => DATA.levels[n.id] && DATA.levels[n.id].boss);
    return boss ? boss.id : world.nodes[world.nodes.length - 1].id;
  }

  function worldUnlocked(id) {
    if (id === 1) return true;
    const prev = worldOf(id - 1);
    return prev ? !!save.cleared[bossNodeId(prev)] : true;
  }

  function currentWorld() {
    return worldOf(save.world) || DATA.worlds[0];
  }

  function smoothPath(pts) {
    if (!pts.length) return '';
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  /* Roads bow sideways instead of running dead straight, and the swing grows
     with the world: a small arc in Egg World, a proper snake by the shore and
     the kingdom. The side is decided by which way the road travels, so runs of
     parallel segments bow together like one wave. */
  function edgePath(world, a, b) {
    const na = nodeOf(world, a);
    const nb = nodeOf(world, b);
    if (!na || !nb) return '';
    const dx = nb.x - na.x;
    const dy = nb.y - na.y;
    const len = Math.hypot(dx, dy) || 1;
    const wid = (world && world.id) || 1;
    const swing = wid >= 4 ? 0.26 : wid >= 3 ? 0.17 : 0.09;
    const bow = Math.min(58, len * swing) * (na.x <= nb.x ? 1 : -1);
    const nx = -dy / len;
    const ny = dx / len;
    const c1x = na.x + dx * 0.24 + nx * bow;
    const c1y = na.y + dy * 0.24 + ny * bow;
    const c2x = na.x + dx * 0.76 + nx * bow;
    const c2y = na.y + dy * 0.76 + ny * bow;
    return `M${na.x} ${na.y} C${c1x} ${c1y} ${c2x} ${c2y} ${nb.x} ${nb.y}`;
  }

  function sceneDecor(theme, kind) {
    const t = THEMES[theme] || THEMES.meadow;
    let out = '';
    if (kind === 'snow') {
      out += `<g pointer-events="none">
        <g transform="translate(75,640)"><path d="M-34 14 L0 -46 L34 14 Z" fill="#e9f4fc" stroke="#c6dcec" stroke-width="3"/><rect x="-4" y="14" width="8" height="16" fill="#8a6b4a"/><path d="M-16 -14 L16 -14" stroke="#c6dcec" stroke-width="4"/></g>
        <g transform="translate(540,820)"><path d="M-30 14 L0 -40 L30 14 Z" fill="#eef7fd" stroke="#c6dcec" stroke-width="3"/><rect x="-4" y="14" width="8" height="14" fill="#8a6b4a"/></g>
        <g transform="translate(90,1340)"><path d="M-26 12 L0 -34 L26 12 Z" fill="#e4f0fa" stroke="#c6dcec" stroke-width="3"/></g>
        <g transform="translate(525,1520)"><path d="M-30 12 L0 -40 L30 12 Z" fill="#e9f4fc" stroke="#c6dcec" stroke-width="3"/></g>
        <ellipse cx="130" cy="900" rx="30" ry="14" fill="#f4fbff"/>
        <ellipse cx="495" cy="1080" rx="26" ry="12" fill="#f4fbff"/>
        <ellipse cx="100" cy="1520" rx="26" ry="13" fill="#f4fbff"/>
        <g transform="translate(95,1000)" stroke="#7fa8c4" stroke-width="3" fill="none"><path d="M0 -26 L0 8 M0 -8 L-14 -18 M0 -8 L14 -18 M0 0 L-12 12 M0 0 L12 12"/></g>
        <g transform="translate(515,1260)" stroke="#7fa8c4" stroke-width="3" fill="none"><path d="M0 -22 L0 6 M0 -6 L-12 -15 M0 -6 L12 -15"/></g>
        <g fill="#ffffff" opacity=".9">
          <circle cx="120" cy="720" r="5"/><circle cx="470" cy="880" r="4"/><circle cx="200" cy="1180" r="5"/>
          <circle cx="520" cy="1360" r="4"/><circle cx="90" cy="1620" r="5"/><circle cx="430" cy="1760" r="4"/>
        </g>
        <g transform="translate(360,1900)"><ellipse cx="0" cy="12" rx="12" ry="5" fill="#6b4a2a" opacity=".5"/><path d="M-6 12 L-8 -4 L8 -4 L6 12 Z" fill="#7a4f24"/><rect x="-2" y="-16" width="4" height="14" rx="2" fill="#8d5f2c"/><ellipse cx="0" cy="-18" rx="8" ry="4" fill="#ff7a2a"/><ellipse cx="0" cy="-18" rx="4" ry="2" fill="#ffd27a" opacity=".8"/></g>
      </g>`;
    } else if (kind === 'meadow') {
      out += `<g pointer-events="none">
        <g transform="translate(70,620)"><rect x="-5" y="0" width="10" height="28" rx="3" fill="#7a5228"/><path d="M0 -52 L26 -4 L-26 -4 Z" fill="#4f8f33"/><path d="M0 -76 L22 -28 L-22 -28 Z" fill="#5da33c"/></g>
        <g transform="translate(360,1900)"><ellipse cx="0" cy="12" rx="12" ry="5" fill="#6b4a2a" opacity=".5"/><path d="M-6 12 L-8 -4 L8 -4 L6 12 Z" fill="#7a4f24"/><rect x="-2" y="-16" width="4" height="14" rx="2" fill="#8d5f2c"/><ellipse cx="0" cy="-18" rx="8" ry="4" fill="#ff7a2a"/><ellipse cx="0" cy="-18" rx="4" ry="2" fill="#ffd27a" opacity=".8"/></g>
        <g transform="translate(530,780)"><rect x="-5" y="0" width="10" height="30" rx="3" fill="#7a5228"/><path d="M0 -56 L28 -4 L-28 -4 Z" fill="#4f8f33"/><path d="M0 -82 L24 -30 L-24 -30 Z" fill="#6cb446"/></g>
        <g transform="translate(85,1280)"><rect x="-5" y="0" width="10" height="28" rx="3" fill="#7a5228"/><path d="M0 -50 L24 -4 L-24 -4 Z" fill="#4f8f33"/><path d="M0 -74 L20 -28 L-20 -28 Z" fill="#5da33c"/></g>
        <g transform="translate(540,1460)"><rect x="-5" y="0" width="10" height="26" rx="3" fill="#7a5228"/><path d="M0 -48 L22 -4 L-22 -4 Z" fill="#4f8f33"/></g>
        <ellipse cx="120" cy="880" rx="30" ry="16" fill="#5b9c37"/><ellipse cx="500" cy="1060" rx="26" ry="14" fill="#5b9c37"/>
        <ellipse cx="95" cy="1500" rx="24" ry="13" fill="#5b9c37"/><ellipse cx="525" cy="1580" rx="28" ry="15" fill="#5b9c37"/>
        <g transform="translate(95,980)"><path d="M-14 0 Q-10 -16 0 -18 Q10 -16 14 0 Z" fill="#7fbf4a"/><path d="M-8 0 Q-5 -12 0 -14 Q5 -12 8 0 Z" fill="#8cd158"/><ellipse cx="0" cy="2" rx="16" ry="6" fill="#6aa83a" opacity=".6"/></g>
        <g transform="translate(520,1220)"><path d="M-12 0 Q-8 -14 0 -16 Q8 -14 12 0 Z" fill="#7fbf4a"/><ellipse cx="0" cy="2" rx="14" ry="5" fill="#6aa83a" opacity=".6"/></g>
        <g transform="translate(110,1380)">
          <path d="M-26 10 L-18 -22 L-10 10 Z" fill="#b88a44"/>
          <path d="M0 12 L10 -24 L18 12 Z" fill="#c99a4c"/>
          <ellipse cx="-2" cy="14" rx="28" ry="8" fill="#8a5f2a" opacity=".5"/>
          <path d="M-6 -6 Q-2 -14 4 -6" stroke="#7a4f24" stroke-width="3" fill="none"/>
        </g>
      </g>`;
    } else {
      out += `<g pointer-events="none">
        <path d="M40 620 L120 500 L200 620 Z" fill="#b9763c" opacity=".8"/>
        <path d="M420 760 L500 620 L580 760 Z" fill="#c98a52" opacity=".9"/>
        <path d="M30 1140 L120 1000 L210 1140 Z" fill="#a8663a" opacity=".8"/>
        <path d="M410 1280 L500 1140 L590 1280 Z" fill="#c98a52" opacity=".9"/>
        <ellipse cx="95" cy="860" rx="28" ry="14" fill="${t.rock}"/>
        <ellipse cx="520" cy="980" rx="24" ry="12" fill="${t.rock}"/>
        <ellipse cx="75" cy="1460" rx="26" ry="14" fill="${t.rock}"/>
        <ellipse cx="530" cy="1560" rx="28" ry="14" fill="${t.rock}"/>
        <path d="M60 1400 q32 -26 64 0" stroke="#c98a52" stroke-width="10" fill="none" opacity=".7"/>
        <path d="M470 1520 q32 -26 64 0" stroke="#c98a52" stroke-width="10" fill="none" opacity=".7"/>
        <path d="M0 460 q70 -30 140 0 t140 0 t140 0" stroke="#e8b877" stroke-width="7" fill="none" opacity=".6"/>
        <g transform="translate(130,760)">
          <path d="M-18 10 L-10 -28 L-2 10 Z" fill="#9a6b3a"/>
          <path d="M6 12 L14 -24 L22 12 Z" fill="#a87a44"/>
          <ellipse cx="2" cy="14" rx="24" ry="8" fill="#7a4f24" opacity=".5"/>
        </g>
        <g transform="translate(480,920)">
          <ellipse cx="0" cy="12" rx="22" ry="8" fill="#8a5f2a" opacity=".5"/>
          <path d="M-14 12 L-8 -18 L0 12 Z" fill="#9a6b3a"/>
          <path d="M4 10 L10 -14 L16 10 Z" fill="#a87a44"/>
        </g>
        <g transform="translate(85,1320)">
          <path d="M-22 14 Q-14 -10 0 -12 Q14 -10 22 14 Z" fill="#b87c42" opacity=".9"/>
          <path d="M-12 14 Q-6 -2 0 -4 Q6 -2 12 14 Z" fill="#c98a52" opacity=".9"/>
          <ellipse cx="0" cy="16" rx="26" ry="10" fill="#7a4f24" opacity=".5"/>
        </g>
      </g>`;
    }
    return out;
  }

  /* A campfire base beside the first tile of every world. */
  function worldCampfire(world) {
    const first = world.nodes[0];
    const x = Math.min(632, first.x + 92);
    const y = first.y + 6;
    return `<g class="world-campfire" transform="translate(${x}, ${y})" pointer-events="none">
      <ellipse cx="0" cy="20" rx="30" ry="10" fill="#000" opacity=".18"/>
      <g>
        <path d="M-24 18 L-30 -2 L30 -2 L24 18 Z" fill="#6b4423"/>
        <path d="M-28 0 L28 0" stroke="#8d5f2c" stroke-width="4" stroke-linecap="round"/>
        <path d="M-24 18 L24 18" stroke="#4a2d16" stroke-width="3"/>
      </g>
      <ellipse cx="0" cy="-26" rx="26" ry="22" fill="#ff9d3c" opacity=".18">
        <animate attributeName="opacity" values=".10;.26;.10" dur="1.6s" repeatCount="indefinite"/>
      </ellipse>
      <g>
        <animateTransform attributeName="transform" type="scale" values="1 1;1.07 1.14;1 1" dur="1.1s" repeatCount="indefinite" additive="sum"/>
        <path d="M-11 0 L-6 -20 L0 -11 L7 -30 L12 -8 L18 0 Z" fill="#ff8a2a"/>
        <path d="M-6 0 L-2 -13 L3 -7 L7 -19 L10 -4 L12 0 Z" fill="#ffd35a"/>
        <path d="M-2 0 L1 -7 L4 -2 L6 0 Z" fill="#fff6cf"/>
      </g>
      <circle cx="17" cy="-14" r="2" fill="#ffb347" opacity=".9">
        <animate attributeName="cy" values="-14;-30" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".9;0" dur="2.4s" repeatCount="indefinite"/>
      </circle>
    </g>`;
  }

  function nodeIcon(node) {
    if (node.type === 'shop' && node.relic) return '💎';
    if (node.type === 'shop' && node.alchemy) return '🧪';
    switch (node.type) {
      case 'shop': return '🛒';
      case 'alchemy': return '🧪';
      case 'craft': return '⚗️';
      case 'base': return '🏠';
      case 'gate': return '🚪';
      default: return '';
    }
  }

  function levelLabel(id) {
    if (DATA.labels && DATA.labels[id]) return DATA.labels[id];
    const m = id.match(/([a-z]+)(\d+)([a-z]*)/i);
    if (!m) return id;
    const num = m[2];
    const letter = m[3];
    if (letter) return num + letter;
    return num;
  }

  /* Every road starts at camp: one tent pitched before the first stop, so a
     world opens with a landmark instead of a bare number. */
  function campMarker(nodes, mapH) {
    if (!nodes || !nodes.length) return '';
    /* The node array is not in path order: rank by the level's own order. */
    const ranked = nodes
      .filter((n) => n.type === 'battle' && DATA.levels[n.id])
      .map((n) => ({ n, o: DATA.levels[n.id].order }))
      .sort((p, q) => p.o - q.o);
    const a = ranked.length ? ranked[0].n : nodes[0];
    const b = (ranked[1] ? ranked[1].n : nodes[1]) || { x: a.x + 70, y: a.y };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const x = Math.round(a.x - (dx / len) * 88);
    const y = Math.max(64, Math.min((mapH || 2000) - 92, Math.round(a.y - (dy / len) * 88)));
    return '<g class="map-deco camp" transform="translate(' + x + ' ' + y + ')" aria-hidden="true">'
      + '<ellipse cx="0" cy="16" rx="36" ry="10" fill="#000" opacity=".16"/>'
      + '<path d="M-32 14 L0 -28 L32 14 Z" fill="#f6e6c4" stroke="#8f6f3e" stroke-width="2.6"/>'
      + '<path d="M-32 14 L0 -28 L0 14 Z" fill="#e0c99b"/>'
      + '<path d="M-8 14 L0 -8 L8 14 Z" fill="#77542f"/>'
      + '<path d="M0 -28 L0 -44" stroke="#8f6f3e" stroke-width="2.6"/>'
      + '<path d="M0 -44 L15 -38 L0 -33 Z" fill="#e0563f"/>'
      + '<path d="M22 14 L30 2" stroke="#8f6f3e" stroke-width="2"/>'
      + '<circle cx="32" cy="1" r="5" fill="#ffb347"><animate attributeName="opacity" values=".75;1;.75" dur="1.6s" repeatCount="indefinite"/></circle>'
      + '<text y="38" text-anchor="middle" font-size="13" font-weight="800" fill="#4a3218">Camp</text>'
      + '</g>';
  }

  /* The road ends at the castle that keeps the egg. It sits beyond the last
     stop so it reads as a destination rather than another battle node. */
  function castleMarker(nodes, mapH) {
    if (!nodes || nodes.length < 2) return '';
    const ranked = nodes
      .filter((n) => n.type === 'battle' && DATA.levels[n.id])
      .map((n) => ({ n, o: DATA.levels[n.id].order }))
      .sort((p, q) => q.o - p.o);
    if (ranked.length < 2) return '';
    const z = ranked[0].n;
    const p = ranked[1].n;
    const dx = z.x - p.x;
    const dy = z.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    /* Centred on the map, not tacked onto the right edge. */
    const x = 360;
    const y = Math.max(96, Math.min((mapH || z.y) - 70, Math.round(z.y - 150)));
    /* The egg belongs to the world's castle boss, never to whichever side road
       happens to sit last on the map. */
    const castleDown = nodes.some((n) => DATA.levels[n.id] && DATA.levels[n.id].boss && save.cleared[n.id]);
    const egg = castleDown ? '' : [
      '<ellipse cx="0" cy="-56" rx="11" ry="13" fill="#fff6cf" stroke="#d8a93a" stroke-width="2"><animate attributeName="opacity" values=".82;1;.82" dur="2.6s" repeatCount="indefinite"/></ellipse>',
      '<ellipse cx="-3.5" cy="-61" rx="3.4" ry="4.4" fill="#fff" opacity=".9"/>',
      '<circle cx="0" cy="-56" r="21" fill="none" stroke="#ffe27a" stroke-width="1.6" opacity=".7"><animate attributeName="r" values="19;23;19" dur="2.6s" repeatCount="indefinite"/></circle>',
    ].join('');
    return '<g class="map-deco castle" transform="translate(' + x + ' ' + y + ')" aria-hidden="true">'
      + '<ellipse cx="0" cy="34" rx="58" ry="13" fill="#000" opacity=".18"/>'
      + '<rect x="-44" y="-6" width="88" height="40" rx="4" fill="#cbb59a" stroke="#6d5738" stroke-width="2.6"/>'
      + '<rect x="-52" y="-26" width="26" height="60" rx="3" fill="#dccaae" stroke="#6d5738" stroke-width="2.6"/>'
      + '<rect x="26" y="-26" width="26" height="60" rx="3" fill="#dccaae" stroke="#6d5738" stroke-width="2.6"/>'
      + '<rect x="-14" y="-40" width="28" height="74" rx="3" fill="#e6d6ba" stroke="#6d5738" stroke-width="2.6"/>'
      + '<path d="M-52 -26 L-52 -34 L-44 -34 L-44 -26 L-36 -26 L-36 -34 L-28 -34 L-28 -26 Z" fill="#dccaae" stroke="#6d5738" stroke-width="2"/>'
      + '<path d="M26 -26 L26 -34 L34 -34 L34 -26 L42 -26 L42 -34 L50 -34 L50 -26 Z" fill="#dccaae" stroke="#6d5738" stroke-width="2"/>'
      + '<path d="M-14 -40 L-14 -48 L-6 -48 L-6 -40 L2 -40 L2 -48 L10 -48 L10 -40 Z" fill="#e6d6ba" stroke="#6d5738" stroke-width="2"/>'
      + '<path d="M-9 34 L-9 16 Q0 4 9 16 L9 34 Z" fill="#6b4a26"/>'
      + '<path d="M0 -48 L0 -66" stroke="#6d5738" stroke-width="2.4"/>'
      + '<path d="M0 -66 L16 -60 L0 -54 Z" fill="#e0563f"/>'
      /* The egg is gone the moment the castle falls; the flag stays. */
      + egg
      + '<text y="52" text-anchor="middle" font-size="13" font-weight="800" fill="#4a3218">Castle</text>'
      + '</g>';
  }

  function mapNodesSvg(world) {
    const t = THEMES[world.theme];
    const nodes = world.nodes;
    return nodes.map((node, idx) => {
      const available = nodeAvailable(world, node);
      const isBattle = node.type === 'battle';
      const isGate = node.type === 'gate';
      const complete = isGate ? !!save.opened[node.id] : isBattle ? !!save.cleared[node.id] : false;
      const level = isBattle ? DATA.levels[node.id] : null;
      const clearedInfo = save.cleared[node.id];
      const gateOpen = save.opened[node.id];
      const locked = !available && !complete;
      const isCurrent = available && !complete && (isBattle || isGate);
      const isStart = idx === 0;
      const isEnd = idx === nodes.length - 1 || (level && level.boss);
      const isBoss = level && level.boss;
      const cls = ['map-node', locked ? 'locked' : '', complete ? 'cleared' : '', isCurrent ? 'current' : '', available ? 'available' : '', isGate ? 'gate' : '', isGate && gateOpen ? 'open' : '']
        .filter(Boolean).join(' ');

      let fill = locked ? '#9b9b9b' : complete ? '#f5d16e' : '#ffffff';
      let stroke = locked ? '#6b6b6b' : complete ? '#b8860b' : '#e7e3d6';
      if (isGate) {
        fill = gateOpen ? '#f5d16e' : '#9b9b9b';
        stroke = gateOpen ? '#b8860b' : '#6b6b6b';
        if (!gateOpen && node.key && DATA.keys[node.key]) stroke = DATA.keys[node.key].colour;
      }

      let inner = '';
      if (locked) {
        inner = `<text y="10" text-anchor="middle" font-size="22">🔒</text>`;
      } else if (isGate) {
        inner = node.key && !gateOpen
          ? `<text y="12" text-anchor="middle" font-size="26">🔑</text>`
          : `<text y="12" text-anchor="middle" font-size="28">🚪</text>`;
      } else if (isBattle) {
        if (isStart) {
          inner = `<text class="node-label" y="12" text-anchor="middle" fill="${complete ? '#6b4a0c' : '#2a2a2a'}" font-size="${(levelLabel(node.id) + '').length > 2 ? '15' : '18'}">${levelLabel(node.id)}</text>`;
        } else        if (isEnd) {
          if (complete) {
            inner = `<g transform="translate(0,-8)"><rect x="-22" y="6" width="44" height="12" rx="4" fill="#5a4a2a"/><rect x="-18" y="-16" width="8" height="10" rx="2" fill="#6b5a3a"/><rect x="6" y="-22" width="8" height="12" rx="2" fill="#6b5a3a"/><rect x="-12" y="-4" width="6" height="6" rx="2" fill="#7b6a4a"/><rect x="12" y="-10" width="6" height="8" rx="2" fill="#7b6a4a"/><path d="M-20 -6 L-14 -14 L-8 -6 Z" fill="#8b7a5a"/><path d="M4 -12 L10 -20 L16 -12 Z" fill="#8b7a5a"/><ellipse cx="-10" cy="0" rx="4" ry="2" fill="#4a3a2a" opacity=".6"/><ellipse cx="10" cy="2" rx="3" ry="1.5" fill="#4a3a2a" opacity=".6"/><text y="32" text-anchor="middle" font-size="13" fill="#4a3218" font-weight="800">${levelLabel(node.id)}</text></g>`;
          } else {
            inner = `<g transform="translate(0,-8)"><rect x="-26" y="6" width="52" height="14" rx="4" fill="#7a5a2a"/><rect x="-22" y="-18" width="10" height="24" rx="3" fill="#9b7a3a"/><rect x="8" y="-26" width="10" height="32" rx="3" fill="#9b7a3a"/><rect x="-14" y="-4" width="8" height="12" rx="2" fill="#c9a05a"/><rect x="14" y="-12" width="8" height="18" rx="2" fill="#c9a05a"/><path d="M-20 -18 L-20 -32 L-10 -28 L-10 -18 Z" fill="#d9b06a"/><path d="M10 -26 L10 -40 L20 -36 L20 -26 Z" fill="#d9b06a"/><g class="castle-egg"><ellipse cx="15" cy="-38" rx="6.2" ry="7.8" fill="#fff6cf" stroke="#d8a93a" stroke-width="1.4"><animate attributeName="opacity" values=".8;1;.8" dur="2.4s" repeatCount="indefinite"/></ellipse><circle cx="13" cy="-41" r="1.8" fill="#fff" opacity=".9"/><circle cx="15" cy="-38" r="11.5" fill="none" stroke="#ffe27a" stroke-width="1.3" opacity=".75"/></g><rect x="-4" y="-10" width="8" height="16" rx="2" fill="#b98a2a"/><text y="36" text-anchor="middle" font-size="13" fill="#4a3218" font-weight="800">${levelLabel(node.id)}</text></g>`;
          }
        } else {
          inner = `<text class="node-label" y="12" fill="${complete ? '#6b4a0c' : '#2a2a2a'}" font-size="${(levelLabel(node.id) + '').length > 2 ? '15' : '18'}">${levelLabel(node.id)}</text>`;
        }
      } else {
        inner = `<text y="13" text-anchor="middle" font-size="${isGate ? 28 : 26}">${nodeIcon(node)}</text>`;
      }

      const stars = clearedInfo ? clearedInfo.stars : 0;
      const starHtml = stars && !isStart && !isEnd
        ? `<text x="0" y="60" text-anchor="middle" font-size="16" fill="${stars === 3 ? '#ffd24a' : '#ffcf5c'}" stroke="#7a5410" stroke-width="0.4" paint-order="stroke">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</text>`
        : '';

      const label = isBattle
        ? (level ? `${level.name}${level.boss ? ' · TOWER' : level.elite ? ' · ELITE' : ''} (${levelLabel(node.id)})` : levelLabel(node.id))
        : isGate ? 'Gate' : node.type === 'shop' ? 'Shop' : node.type === 'alchemy' ? 'Alchemy' : node.type === 'craft' ? 'Craft' : node.type === 'base' ? 'Base' : '';

      return `
        <g class="${cls}" data-node="${node.id}" transform="translate(${node.x}, ${node.y})">
          <title>${label}</title>
          <ellipse class="egg-body" cx="0" cy="${isEnd ? 8 : 0}" rx="${isGate ? 38 : isEnd ? 40 : 35}" ry="${isGate ? 40 : isEnd ? 44 : 40}" fill="${fill}" stroke="${stroke}" stroke-width="3.6"/>
          ${(isStart || isEnd) && !complete && available && !locked ? `<ellipse cx="0" cy="${isEnd ? 8 : 0}" rx="${isEnd ? 52 : 48}" ry="${isEnd ? 54 : 48}" fill="none" stroke="#7dff9b" stroke-width="3" stroke-dasharray="8 10" opacity=".95"><animate attributeName="stroke-dashoffset" from="36" to="0" dur="2.2s" repeatCount="indefinite"/></ellipse>` : ''}
          ${(isStart || isEnd) && complete ? `<ellipse cx="0" cy="${isEnd ? 8 : 0}" rx="${isEnd ? 52 : 48}" ry="${isEnd ? 54 : 48}" fill="none" stroke="#f5d16e" stroke-width="3" stroke-dasharray="8 10" opacity=".9"><animate attributeName="stroke-dashoffset" from="36" to="0" dur="2.6s" repeatCount="indefinite"/></ellipse>` : ''}
          ${inner}
          ${isCurrent && !isStart && !isEnd ? '<circle cx="0" cy="0" r="54" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="7 9" opacity=".9"/>' : ''}
          ${starHtml}
          ${isGate && !gateOpen ? `<text x="0" y="60" text-anchor="middle" font-size="13" fill="${node.key && DATA.keys[node.key] ? DATA.keys[node.key].colour : '#4a3218'}" font-weight="700">${node.key && DATA.keys[node.key] ? `🔑 ${DATA.keys[node.key].name.replace(' Key', '')}` : `${world.gateStars}★`}</text>` : ''}
          <circle class="node-hit" r="52" fill="transparent"/>
        </g>`;
    }).join('');
  }

  /* ------------------------------------------------------------
     The squad on the road
     ------------------------------------------------------------
     A little cluster of pigs stands on the node the party has
     reached. Clicking another node makes them walk the roads to
     it first, then that node opens as usual.
     ------------------------------------------------------------ */

  /* Where the pigs stand on a world they have never visited: the furthest
     cleared node, or the first one on the road. */
  function partyStartNode(world) {
    const cleared = world.nodes.filter((n) => (n.type === 'battle' || n.type === 'gate') && nodeComplete(world, n.id));
    return (cleared[cleared.length - 1] || world.nodes[0]).id;
  }

  /* Node-to-node route along the drawn roads, or null if they are not joined. */
  function roadTo(world, fromId, toId) {
    if (fromId === toId) return [nodeOf(world, toId)].filter(Boolean);
    const adj = {};
    world.edges.forEach(([a, b]) => {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    });
    const prev = { [fromId]: null };
    const queue = [fromId];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === toId) break;
      (adj[cur] || []).forEach((next) => {
        if (!(next in prev)) { prev[next] = cur; queue.push(next); }
      });
    }
    if (!(toId in prev)) return null;
    const route = [];
    let cur = toId;
    while (cur) { route.unshift(nodeOf(world, cur)); cur = prev[cur]; }
    return route.filter(Boolean);
  }

  function partyMarker(world) {
    const stand = nodeOf(world, save.mapPos) || world.nodes[0];
    if (!stand) return '';
    const ids = (save.party || []).slice(0, 3);
    /* The squad stands *around* the node, using the same art as the base at a
       smaller size, so the level number in the middle of the egg stays clear. */
    /* Degrees on a clock face: the squad gathers along the bottom of the node,
       so the level number sitting in the middle of the egg stays readable. */
    const spots = ({ 1: [90], 2: [205, 335], 3: [190, 350, 90] })[ids.length] || [90];
    const ring = ids.length === 1 ? 0 : 52;
    const pigs = ids.map((id, i) => {
      const ang = (spots[i] || 90) * Math.PI / 180;
      const dx = Math.cos(ang) * ring;
      const dy = Math.sin(ang) * ring * 0.8 + 6;
      const art = Art.hero(id, save.charRelics[id], equippedWeaponId(id), equippedShieldId(id))
        .replace('<svg ', '<svg width="100" height="100" ');
      return `<g transform="translate(${dx.toFixed(1)},${dy.toFixed(1)}) scale(0.3) translate(-50,-50)">${art}</g>`;
    }).join('');
    return `<g class="map-party" transform="translate(${stand.x}, ${stand.y})" pointer-events="none">${pigs}</g>`;
  }

  /* Quick stroll along the roads: node to node, eased, never longer than a
     second so it reads as travel and not as a cutscene. */
  function walkParty(world, toId, done) {
    const group = el.map.querySelector('.map-party');
    const target = nodeOf(world, toId);
    const from = nodeOf(world, save.mapPos);
    const route = from ? roadTo(world, save.mapPos, toId) : null;
    const calm = !save.settings || save.settings.motion === false ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    save.mapPos = toId;
    persist(true);
    if (!group || !target || calm || !route || route.length < 2) {
      if (group && target) group.setAttribute('transform', `translate(${target.x}, ${target.y})`);
      done();
      return;
    }
    const segs = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i];
      const b = route[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push([a, b, len]);
      total += len;
    }
    const dur = Math.max(320, Math.min(1000, total * 0.85));
    const t0 = performance.now();
    let finished = false;
    /* A hidden tab stops rAF, and a walk that never reports back would swallow
       the node click. The guard finishes the stroll either way. */
    const finish = () => {
      if (finished) return;
      finished = true;
      const g = el.map.querySelector('.map-party') || group;
      if (g) g.setAttribute('transform', `translate(${target.x}, ${target.y})`);
      done();
    };
    const guard = setTimeout(finish, dur + 260);
    const step = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - t0) / dur);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let walked = eased * total;
      let x = route[0].x;
      let y = route[0].y;
      for (const [a, b, len] of segs) {
        if (walked <= len) {
          const k = len ? walked / len : 0;
          x = a.x + (b.x - a.x) * k;
          y = a.y + (b.y - a.y) * k;
          break;
        }
        walked -= len;
        x = b.x;
        y = b.y;
      }
      group.setAttribute('transform', `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
      if (t < 1) requestAnimationFrame(step);
      else { clearTimeout(guard); finish(); }
    };
    requestAnimationFrame(step);
  }

  function mapScene(world) {
    const t = THEMES[world.theme];
    const H = world.mapH || 2000;
    const edgeSvg = world.edges.map(([a, b]) => {
      const na = nodeOf(world, a);
      const nb = nodeOf(world, b);
      const active = nodeComplete(world, a) || nodeAvailable(world, nb) || nodeComplete(world, b);
      const d = edgePath(world, a, b);
      return `<g class="map-road" opacity="${active ? 1 : 0.45}">
        <path d="${d}" fill="none" stroke="#4d5f34" stroke-width="16" stroke-linecap="round" opacity=".30"/>
        <path d="${d}" fill="none" stroke="${active ? '#f6e8bd' : '#9aa887'}" stroke-width="${active ? 9 : 6}" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${active ? '#c9a86a' : '#7d8a6b'}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 16" opacity=".9"/>
      </g>`;
    }).join('');

    return `
      <svg class="map-scene" viewBox="0 0 720 ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${t.sky1}"/><stop offset="1" stop-color="${t.sky2}"/>
          </linearGradient>
          <linearGradient id="mapGrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${t.ground1}"/><stop offset="1" stop-color="${t.ground2}"/>
          </linearGradient>
          <radialGradient id="eggCream" cx="35%" cy="26%" r="85%">
            <stop offset="0" stop-color="#fffdf4"/><stop offset="1" stop-color="#e9d5a0"/>
          </radialGradient>
          <radialGradient id="eggGold" cx="35%" cy="26%" r="85%">
            <stop offset="0" stop-color="#fff3bd"/><stop offset="1" stop-color="#f1bf3c"/>
          </radialGradient>
        </defs>
        <rect width="720" height="${H}" fill="url(#mapSky)"/>
        <ellipse cx="560" cy="52" rx="42" ry="42" fill="#ffe9a8" opacity=".8"/>
        <g pointer-events="none" opacity=".85">
          <ellipse cx="110" cy="100" rx="46" ry="20" fill="#fff"/>
          <ellipse cx="148" cy="108" rx="34" ry="16" fill="#fff"/>
          <ellipse cx="430" cy="200" rx="52" ry="18" fill="#fff" opacity=".7"/>
          <ellipse cx="472" cy="208" rx="32" ry="13" fill="#fff" opacity=".7"/>
        </g>
        <path d="M0 320 Q140 260 300 315 T600 300 T720 305 L720 ${H} L0 ${H} Z" fill="url(#mapGrass)"/>
        <path d="M0 360 Q160 286 320 356 T600 340 T720 345 L720 430 L0 430 Z" fill="${t.hill}" opacity=".55"/>
        <path d="M0 ${H - 300} L0 430 Q120 500 300 450 T600 490 T720 500 L720 ${H - 300} Z" fill="${t.ground1}" opacity=".5"/>
        ${sceneDecor(world.theme, world.theme)}
        ${edgeSvg}
        ${worldCampfire(world)}
        ${mapNodesSvg(world)}
        ${campMarker(world.nodes, H)}
        ${castleMarker(world.nodes, H)}
        ${partyMarker(world)}
        <g transform="translate(360,${H - 64})" opacity=".95" pointer-events="none">
          <ellipse cx="0" cy="10" rx="30" ry="9" fill="#000" opacity=".14"/>
          <path d="M-16 10 L-20 -8 L20 -8 L16 10 Z" fill="#7a4f24"/>
          <rect x="-3" y="-30" width="6" height="24" rx="2" fill="#8d5f2c"/>
          <ellipse cx="0" cy="-34" rx="13" ry="7" fill="#ff7a2a"/>
          <ellipse cx="0" cy="-34" rx="7" ry="4" fill="#ffd27a" opacity=".85"/>
        </g>
      </svg>`;
  }

  /* Top-right level bar: the squad's average level. Each pig contributes its
     own level plus the fraction it has earned toward the next one, so two pigs
     at 1 and 20 read as 10.5 — not whatever the XP curve's midpoint happens
     to be. */
  function xpBar() {
    const heroes = (save.heroes || []).filter((id) => save.pigs && save.pigs[id]);
    let level = save.level || 1;
    let have = Math.min(save.xp || 0, DATA.xpForLevel(level));
    let maxed = false;
    let avgShown = level;
    if (heroes.length) {
      let sum = 0;
      heroes.forEach((id) => {
        const p = save.pigs[id];
        const lv = Math.max(1, Math.min(MAX_LEVEL, p.level || 1));
        const frac = lv >= MAX_LEVEL ? 0 : Math.min(1, (p.xp || 0) / Math.max(1, DATA.xpForLevel(lv)));
        sum += lv + frac;
      });
      const avg = sum / heroes.length;
      level = Math.min(MAX_LEVEL, Math.floor(avg));
      maxed = level >= MAX_LEVEL;
      const need = DATA.xpForLevel(level);
      have = maxed ? need : Math.round((avg - level) * need);
      avgShown = maxed ? MAX_LEVEL : Math.round(avg * 10) / 10;
    }
    const need = DATA.xpForLevel(level);
    const pct = maxed ? 100 : Math.max(0, Math.min(100, Math.round((have / Math.max(1, need)) * 100)));
    return `<div class="xp-pill" title="Average Team Level: ${maxed ? 'max level' : `Lv ${avgShown} · ${pct}% to Lv ${level + 1}`}">
      <span class="xp-lv">Lv ${avgShown}</span>
      <span class="xp-core"><span class="xp-label">Avg XP</span><span class="xp-track"><i style="width:${pct}%"></i></span></span>
      <b>${maxed ? 'MAX' : have + '/' + need}</b>
    </div>`;
  }

  function mapHeader(world) {
    const w1 = worldUnlocked(1);
    const w2 = worldUnlocked(2);
    return `
      <div class="map-top">
        <button class="icon-btn" id="menuBtn" title="Menu">☰</button>
        <div class="world">
          <div class="world-badge">${({ 1: '🥚', 2: '🏜️', 3: '❄️', 4: '🏖️', 5: '🏰' })[world.id] || '🥚'}</div>
          <div>
            <h1>${world.name}</h1>
            <p>${clearedBattles()} battles · ${starsTotal()} ★</p>
          </div>
        </div>
        <div class="res-row">
          ${coins(save.coins)}${herbs(save.herbs)}<span class="cur">⭐ ${starsTotal()}</span>
        </div>
        ${xpBar()}
        <button class="btn small ghost" id="baseBtn">🏠 Base</button>
        <button class="icon-btn ${dailyRewardReady() ? 'ready' : ''}" id="dailyBtn" title="Daily reward${dailyRewardReady() ? ' — ready to claim' : ''}">🎁</button>
        <button class="icon-btn" id="achBtn" title="Achievements">🏆</button>
        <button class="icon-btn" id="indexBtn" title="Compendium">📖</button>
        ${dungeonUnlocked() ? '<button class="icon-btn" id="dungeonBtn" title="Dungeon">🕳️</button>' : ''}
        <button class="icon-btn" id="statsBtn" title="Statistics">📊</button>
        <button class="icon-btn" id="setBtn" title="Settings">⚙️</button>
        <button class="icon-btn" id="soundBtn">${SFX.isMuted() ? '🔇' : '🔊'}</button>
      </div>
      <div class="world-tabs">
        ${[1, 2, 3, 4, 5].map((id) => {
          const w = worldOf(id);
          if (!w) return '';
          const open = worldUnlocked(id);
          const icon = ({ 1: '🥚', 2: '🏜️', 3: '❄️', 4: '🏖️', 5: '🏰' })[id] || '';
          return `<button class="world-tab ${world.id === id ? 'on' : ''} ${open ? '' : 'locked'}" data-world="${id}" ${open ? '' : 'data-locked="1"'}>${open ? `${icon} ${w.name}` : `🔒 ${w.name}`}</button>`;
        }).join('')}
        ${dungeonUnlocked()
          ? '<button class="world-tab dungeon-tab" data-dungeon="1">🕳️ Dungeon</button>'
          : '<button class="world-tab dungeon-tab locked" data-dungeon="1" data-locked="1" title="Opens after Mother Flock falls in Cuckoo Canyon">🔒 Dungeon</button>'}
      </div>`;
  }

  function renderMap() {
    save.world = save.world || 1;
    if (!worldUnlocked(save.world)) save.world = 1;
    ensureUnlocks();
    persist(true);
    const world = currentWorld();
    if (!save.mapPos || !nodeOf(world, save.mapPos)) save.mapPos = partyStartNode(world);
    el.map.innerHTML = `
      ${mapHeader(world)}
      <div class="map-scroll">
        ${mapScene(world)}
        <div class="map-legend">
          <span>⚔️ battle</span><span>🛒 shop</span><span>⚗️ craft</span><span>🚪 gate</span><span>🏠 base</span>
        </div>
      </div>
      <div class="map-tip" id="mapTip">The main road to the boss is open. Side roads need keys.</div>
      <div id="savePill" class="save-pill">Saved ✓</div>
    `;

    el.map.querySelector('#menuBtn').addEventListener('click', () => { SFX.play('click'); show('title'); });
    const mapStats = el.map.querySelector('#statsBtn');
    if (mapStats) mapStats.addEventListener('click', () => { SFX.play('click'); openStats(); });
    const mapSet = el.map.querySelector('#setBtn');
    if (mapSet) mapSet.addEventListener('click', () => { SFX.play('click'); openSettings(); });
    el.map.querySelector('#baseBtn').addEventListener('click', () => { SFX.play('click'); show('base'); });
    const mapDaily = el.map.querySelector('#dailyBtn');
    if (mapDaily) mapDaily.addEventListener('click', () => { SFX.play('click'); openDailyReward(); });
    const mapAch = el.map.querySelector('#achBtn');
    if (mapAch) mapAch.addEventListener('click', () => { SFX.play('click'); openAchievements(); });
    const mapIndex = el.map.querySelector('#indexBtn');
    if (mapIndex) mapIndex.addEventListener('click', () => { SFX.play('click'); openIndex(); });
    const mapDungeon = el.map.querySelector('#dungeonBtn');
    if (mapDungeon) mapDungeon.addEventListener('click', () => { SFX.play('click'); show('dungeon'); });
    el.map.querySelector('#soundBtn').addEventListener('click', (ev) => {
      SFX.setMuted(!SFX.isMuted());
      ev.currentTarget.textContent = SFX.isMuted() ? '🔇' : '🔊';
      SFX.play('click');
    });
    const dgTab = el.map.querySelector('.dungeon-tab');
    if (dgTab) dgTab.addEventListener('click', () => {
      /* The sealed tab still sits in the row, so the dungeon is visible as a
         destination from the first world onwards. */
      if (dgTab.dataset.locked) {
        SFX.play('gate');
        mapTip('The Endless Dungeon is sealed — beat Mother Flock in Cuckoo Canyon to open it.', true);
        return;
      }
      SFX.play('gate');
      show('dungeon');
    });
    el.map.querySelectorAll('[data-world]').forEach((btn) =>
      btn.addEventListener('click', () => {
        /* A sealed world still shows its button, so the road ahead is visible. */
        if (btn.dataset.locked) {
          SFX.play('gate');
          mapTip('The Gilded Kingdom is sealed — beat the Saltwind Shore boss to open it.', true);
          return;
        }
        SFX.play('select');
        save.world = Number(btn.dataset.world);
        persist(true);
        renderMap();
      })
    );

    /* Each node owns its own click. A capture listener on the whole scene ran
       first and opened the preview before the pigs had walked anywhere. */
    el.map.querySelectorAll('.map-node').forEach((g) => {
      g.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onNodeClick(world, g.dataset.node);
      }, true);
    });

    requestAnimationFrame(() => scrollToCurrent());
  }

  function scrollToCurrent() {
    const container = el.map.querySelector('.map-scroll');
    if (!container) return;
    const node = container.querySelector('.map-node.current') || container.querySelector('.map-node.cleared');
    if (!node) return;
    const cr = container.getBoundingClientRect();
    const nr = node.getBoundingClientRect();
    const top = container.scrollTop + (nr.top - cr.top) - cr.height * 0.6;
    container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }

  function mapTip(text, bad) {
    const tip = el.map.querySelector('#mapTip');
    if (!tip) return;
    tip.textContent = text;
    tip.style.color = bad ? '#ffcf6b' : '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      const world = currentWorld();
      const carried = (save.keys || []).filter((k) => DATA.keys[k]).map((k) => `${DATA.keys[k].icon} ${DATA.keys[k].name}`);
      tip.textContent = 'Tap a node to travel there.' + (carried.length ? ` · ${carried.join(' · ')}` : '');
      tip.style.color = '';
    }, 2600);
  }

  function onNodeClick(world, id) {
    const node = nodeOf(world, id);
    if (!node) return;
    if (!nodeAvailable(world, node) && !nodeComplete(world, id)) {
      SFX.play('nope');
      mapTip('That road is closed. Clear the node before it first.', true);
      return;
    }
    /* Pigs walk the road before the node does anything. A sealed gate is not
       worth the walk, so those still answer on the spot. */
    const walkable = !(node.type === 'gate' && !save.opened[id]);
    if (walkable && save.mapPos !== id) {
      walkParty(world, id, () => onNodeClick(world, id));
      return;
    }
    if (node.type === 'gate') {
      /* Junction gates on a side road open the moment the pigs reach them. */
      if (node.auto) {
        if (!save.opened[id]) {
          save.opened[id] = true;
          persist();
          SFX.play('unlock');
          renderMap();
        }
        mapTip('The side road is open - follow it down.');
        return;
      }
      /* Coloured doors: every world's elite fights drop the three keys. */
      if (node.key) {
        if (save.opened[id]) { mapTip('The door is open — the side road is yours.'); return; }
        save.keys = save.keys || [];
        const keyDef = DATA.keys[node.key];
        const keyName = keyDef ? keyDef.name : `${node.key} key`;
        if (save.keys.includes(node.key)) {
          save.opened[id] = true;
          grantKeyLoot(node);
          persist();
          SFX.play('unlock');
          mapTip(`${keyName} turns. A keyed vault opens!`);
          renderMap();
        } else {
          SFX.play('gate');
          mapTip(`Sealed. Elite fights in every world carry the ${keyName}.`, true);
        }
        return;
      }
      if (save.opened[id]) {
        mapTip('The gate is open — the boss is up ahead.');
        return;
      }
      if (starsTotal() >= world.gateStars) {
        save.opened[id] = true;
        persist();
        SFX.play('unlock');
        mapTip('The gate grinds open!');
        renderMap();
      } else {
        SFX.play('gate');
        mapTip(`Sealed. This gate needs ${world.gateStars} ★ — you have ${starsTotal()}. Replay levels for more stars.`, true);
      }
      return;
    }
    SFX.play('select');
    if (node.type === 'shop') return node.relic ? openRelicShop(currentWorld()) : openShop();
    if (node.type === 'alchemy') return openAlchemy();
    if (node.type === 'craft') return openCraft();
    if (node.type === 'base') return show('base');
    openLevelIntro(DATA.levels[id], id);
  }

  /* ============================================================
     Level intro + battle
     ============================================================ */

  /* Every distinct bird that can appear in any wave of this fight. */
  function levelRoster(level) {
    const out = [];
    const waves = DATA.wavesFor(level);
    for (let w = 1; w <= waves; w++) {
      DATA.waveEntries(level, w).forEach((entry) => {
        if (!out.some((r) => r.t === entry.t)) out.push(entry);
      });
    }
    return out;
  }

  /* ---------------- Level preview ----------------
     Before a fight the sheet shows the numbers: your squad's power against
     the flock's, a colour for how that matchup reads, and the squad itself so
     pigs can be swapped without leaving the map. A Backup Bell opens a fourth
     slot for this one level and is spent the moment the fight starts. */

  let intro = null;

  /* The preview compares the squad with ONE average wave, not the whole
     gauntlet: a five-wave fight looked five times as deadly on paper while
     every wave is fought with the same pigs. */
  function levelFlockPower(level, average) {
    const tune = DATA.tuning || { enemyHp: 1, enemyAtk: 1 };
    const waves = DATA.wavesFor(level);
    let total = 0;
    for (let w = 1; w <= waves; w++) {
      DATA.waveEntries(level, w).forEach((entry) => {
        const tpl = DATA.enemies[entry.t];
        /* Same curve the fight uses: a boss never stacks the level curve. */
        const hpMul = tpl.boss ? Math.min(entry.hpMul, 1.15) : entry.hpMul;
        const atkMul = tpl.boss ? Math.min(entry.atkMul, 1.15) : entry.atkMul;
        const ease = level.world === 1 && !tpl.boss ? 0.9 : 1;
        total += DATA.birdPower(Math.round(tpl.hp * hpMul * tune.enemyHp * ease), Math.round(tpl.atk * atkMul * tune.enemyAtk * ease));
      });
    }
    return Math.round(average && waves ? total / waves : total);
  }

  function squadPower(party) {
    const size = Math.max(1, party.length);
    return party.reduce((sum, id) => {
      const def = DATA.heroes.find((h) => h.id === id);
      return sum + DATA.pigPower(def, pigLevel(id), gearOf(id), forgeOf(id), save.charRelics[id], size);
    }, 0);
  }

  function introPower(level) {
    const mine = squadPower(intro.party);
    /* The panel quotes the whole gauntlet now: every wave added up. The star
       verdict still weighs one wave, so a long fight is not read as an
       unwinnable wall. */
    const theirs = levelFlockPower(level, false);
    const wave = levelFlockPower(level, true);
    const ratio = wave ? mine / wave : 2;
    const d = DATA.difficultyOf(ratio);
    const fill = Math.max(8, Math.min(100, Math.round((ratio / 2.6) * 100)));
    const stars = [0, 1, 2, 3, 4].map((i) => `<i class="${i < d.tier ? 'on' : ''}">★</i>`).join('');
    return `
      <div class="pv-power" style="--pw-color:${d.color}">
        <div class="pvp-row">
          <span class="pvp-side"><small>Your squad</small><b>${mine}</b></span>
          <span class="pvp-mid">vs</span>
          <span class="pvp-side right"><small>The flock · all waves</small><b>${theirs}</b></span>
        </div>
        <div class="pvp-bar"><span style="width:${fill}%"></span></div>
        <div class="pvp-verdict"><span class="pvp-tier">${d.tier}/5</span><span class="pvp-stars" aria-label="Difficulty tier ${d.tier} of 5: ${d.label}">${stars}</span><b>${d.label}</b><span>${d.note}</span></div>
        <div class="pvp-formula">Power counts health, damage, shields and heals. Level, gear, forge, relics and training all add in. The flock figure is every wave together; the stars weigh you against one wave.</div>
      </div>`;
  }

  function introSquad() {
    const cap = intro.bell ? 4 : MAX_PARTY;
    const size = Math.max(1, intro.party.length);
    const chosen = intro.party.map((id) => {
      const def = DATA.heroes.find((h) => h.id === id) || { name: id };
      const gear = gearOf(id);
      const stats = DATA.heroStats(def, pigLevel(id), gear, forgeOf(id), save.charRelics[id]);
      const support = DATA.heroSupport(def, pigLevel(id), gear, forgeOf(id), save.charRelics[id], size);
      const pw = DATA.pigPower(def, pigLevel(id), gear, forgeOf(id), save.charRelics[id], size);
      const tip = `Drop ${def.name} — Lv ${pigLevel(id)} · ${stats.maxHp} HP · weapon ${gear.weapon}/5 · helmet ${gear.helmet}/5 · forge ${forgeOf(id)} · support ${support}`;
      return `<button class="sq-slot on" data-drop="${id}" title="${tip}">
        ${Art.hero(id, save.charRelics[id], equippedWeaponId(id), equippedShieldId(id))}<b>${def.name.split(' ')[0]}</b><small>${pw} pw</small><span class="sq-x">✕</span>
      </button>`;
    }).join('');
    const bench = DATA.heroes
      .filter((h) => !intro.party.includes(h.id) && isUnlockedHero(h.id))
      .map((h) => {
        const gear = gearOf(h.id);
        const stats = DATA.heroStats(h, pigLevel(h.id), gear, forgeOf(h.id), save.charRelics[h.id]);
        const support = DATA.heroSupport(h, pigLevel(h.id), gear, forgeOf(h.id), save.charRelics[h.id], Math.max(size, 3));
        const pw = DATA.pigPower(h, pigLevel(h.id), gear, forgeOf(h.id), save.charRelics[h.id], Math.max(size, 3));
        const full = intro.party.length >= cap;
        const tip = full ? 'Squad is full' : `Field ${h.name} — Lv ${pigLevel(h.id)} · ${stats.maxHp} HP · weapon ${gear.weapon}/5 · helmet ${gear.helmet}/5 · forge ${forgeOf(h.id)} · support ${support}`;
        return `<button class="sq-slot bench" data-add="${h.id}" ${full ? 'disabled' : ''} title="${tip}">
          ${Art.hero(h.id, save.charRelics[h.id], equippedWeaponId(h.id), equippedShieldId(h.id))}<b>${h.name.split(' ')[0]}</b><small>${pw} pw</small>
        </button>`;
      }).join('');
    const bells = save.potions.backup || 0;
    const hasFourthPig = DATA.heroes.some((h, i) => i >= 3 && isUnlockedHero(h.id));
    const bellRow = intro.bell
      ? '<div class="sq-bell on">🔔 Backup Bell armed — four pigs this level, spent when the fight starts</div>'
      : !hasFourthPig
        ? '<div class="sq-bell off">🔔 Backup Bell needs the 4th pig unlocked first</div>'
        : bells > 0
          ? `<button class="sq-bell-btn" id="ovBell">🔔 Use Backup Bell · field a 4th pig (${bells} left)</button>`
          : '<div class="sq-bell off">🔔 No Backup Bell — buy one in the shop to field a fourth pig</div>';
    return `
      <div class="sq-wrap">
        <div class="sq-head"><b>Squad ${intro.party.length}/${cap}</b><span>Tap a pig to drop it, tap a bench pig to field it.</span></div>
        <div class="sq-row">${chosen}${intro.party.length < cap ? '<span class="sq-empty">+ open slot</span>' : ''}</div>
        ${bench ? `<div class="sq-bench">${bench}</div>` : ''}
        ${bellRow}
      </div>`;
  }

  function renderIntro() {
    if (!intro) return;
    const level = intro.level;
    const nodeId = intro.nodeId;
    const best = save.cleared[nodeId] || { stars: 0, score: 0 };
    const waveCount = DATA.wavesFor(level);
    const tune = DATA.tuning || { enemyHp: 1, enemyAtk: 1 };
    const preview = levelRoster(level).map((entry) => {
      const tpl = DATA.enemies[entry.t];
      const hpMul = tpl.boss ? Math.min(entry.hpMul, 1.15) : entry.hpMul;
      const atkMul = tpl.boss ? Math.min(entry.atkMul, 1.15) : entry.atkMul;
      const hp = Math.round(tpl.hp * hpMul * tune.enemyHp);
      const atk = Math.round(tpl.atk * atkMul * tune.enemyAtk);
      const tip = DATA.enemyTip({ tpl, key: entry.t, hp, maxHp: hp, atk });
      const birdPower = Math.round(DATA.birdPower(hp, atk));
      return `<div class="pv" data-tip="${tip.replace(/"/g, '&quot;')}">${Art.enemy(tpl.art)}<span class="pv-name">${tpl.name}</span><span>${hp} HP</span><span class="pv-pw">${birdPower} power</span></div>`;
    }).join('');
    openSheet(`
      <div class="eyebrow">World ${level.world} · ${level.boss ? 'Boss' : level.elite ? 'Elite' : 'Battle'}</div>
      <h2>${level.name}</h2>
      ${introPower(level)}
      ${introSquad()}
      <div class="enemy-preview">${preview}</div>
      <p class="pv-note">🪶 Every bird type you can meet here — all ${waveCount} waves</p>
      ${level.tip ? `<p class="tip-line">💡 ${level.tip}</p>` : ''}
      <div class="reward-line"><span>Reward</span><b>🪙 ${level.coins + (level.elite ? 40 : 0)} · 📗 ${level.xp} XP${level.herbs ? ` · 🌿 ${level.herbs}` : ''}</b></div>
      <div class="reward-line"><span>Best</span><b>${best.stars ? starStr(best.stars) + ' · ' + best.score : '—'}</b></div>
      <div class="sheet-actions">
        <button class="btn gold" id="ovFight">⚔ Fight!</button>
        <button class="btn ghost" id="ovCancel">Back</button>
      </div>
    `);
    const q = (sel) => el.overlay.querySelector(sel);
    q('#ovFight').addEventListener('click', () => {
      SFX.play('click');
      const party = intro.party.slice();
      if (intro.bell) save.potions.backup = Math.max(0, (save.potions.backup || 0) - 1);
      /* The preview doubles as the squad screen: what you field is the squad
         from here on, minus any temporary fourth pig. */
      save.party = party.slice(0, MAX_PARTY);
      persist();
      closeOverlay();
      intro = null;
      const cutsceneId = level.boss && DATA.cutscenes['boss' + level.world] ? 'boss' + level.world : null;
      if (cutsceneId && !save.cutscenes[cutsceneId]) {
        playCutscene(cutsceneId, () => startBattle(level, nodeId, party));
      } else {
        startBattle(level, nodeId, party);
      }
    });
    q('#ovCancel').addEventListener('click', () => {
      intro = null;
      closeOverlay();
    });
    el.overlay.querySelectorAll('[data-drop]').forEach((btn) => btn.addEventListener('click', () => {
      if (intro.party.length <= 1) {
        SFX.play('nope');
        return;
      }
      intro.party = intro.party.filter((x) => x !== btn.dataset.drop);
      SFX.play('select');
      renderIntro();
    }));
    el.overlay.querySelectorAll('[data-add]').forEach((btn) => btn.addEventListener('click', () => {
      const cap = intro.bell ? 4 : MAX_PARTY;
      if (btn.disabled || intro.party.length >= cap) {
        SFX.play('nope');
        return;
      }
      intro.party = intro.party.concat(btn.dataset.add);
      SFX.play('select');
      renderIntro();
    }));
    const bellBtn = q('#ovBell');
    if (bellBtn) {
      bellBtn.addEventListener('click', () => {
        if ((save.potions.backup || 0) <= 0) return;
        intro.bell = true;
        SFX.play('unlock');
        renderIntro();
      });
    }
  }

  function openLevelIntro(level, nodeId) {
    intro = { level, nodeId, party: save.party.slice(), bell: false };
    renderIntro();
  }

  function startBattle(level, nodeId, squad) {
    activeLevel = level;
    activeNode = nodeId;
    save.stats.battles += 1;
    persist(true);
    el.title.classList.add('hidden');
    el.map.classList.add('hidden');
    el.base.classList.add('hidden');
    el.battle.classList.remove('hidden');
    const battleParty = (squad && squad.length ? squad : save.party).slice();
    battleParty.forEach((id) => gearOf(id));
    Battle.start(level, {
      level: save.level,
      levels: battleParty.reduce((m, id) => { m[id] = pigLevel(id); return m; }, {}),
      party: battleParty,
      gear: save.gear,
      forge: save.forge,
      relics: save.charRelics,
      weapons: save.weaponEquip,
      shields: save.shieldEquip,
      items: save.potions,
      potionTiers: save.potionTier,
    }, {
      onWin: onBattleWin,
      onLose: onBattleLose,
      onRetreat: () => { SFX.play('click'); show('map'); },
      buyPotion: buyPotionInBattle,
      onSettings: () => openSettings(),
      consumePotion: (kind) => {
        if (!save.potions[kind]) return false;
        save.potions[kind] -= 1;
        persist();
        return save.potions[kind];
      },
      onMuteChange: (muted) => { persist(true); },
    });
  }

  function onBattleWin(result) {
    const level = activeLevel;
    const nodeId = activeNode;
    const prev = save.cleared[nodeId] || { stars: 0, score: 0 };
    const first = !save.cleared[nodeId];
    const firstBonus = first ? (DATA.firstClearRewards || {})[nodeId] : null;
    /* Star rewards are paid once per newly reached star. Replaying a level
       only tops up the stars the player did not already own. */
    let relicGain = Math.max(0, result.stars - (prev.stars || 0)) + ((firstBonus && firstBonus.relics) || 0);

    const replay = !!save.cleared[nodeId] && first === false;
    /* XP is paid per bird killed, not per map: every species carries its own
       purse (DATA.birdXp), and re-beating a cleared road pays half of it. */
    const killsByBird = result.stats.byKey || {};
    const killXp = Object.keys(killsByBird).reduce((n, k) => n + (DATA.birdXp(k) || 10) * killsByBird[k], 0);
    /* Re-beating a cleared road pays a quarter of its XP, not half. */
    const gainedXp = Math.round(killXp * (replay ? 0.25 : 1));
    let gainedCoins = (first ? level.coins + (level.firstClearCoins || 0) : Math.round(level.coins * 0.25)) + result.stars * (replay ? 1 : 5) + ((firstBonus && firstBonus.coins) || 0);
    let gainedHerbs = replay ? 0 : (level.herbs || 0) + ((firstBonus && firstBonus.herbs) || 0);
    save.cleared[nodeId] = {
      stars: Math.max(prev.stars, result.stars),
      score: Math.max(prev.score, result.score),
      rounds: Math.min(prev.rounds || 99, result.rounds),
    };
    /* The squad is standing on the fight they just won. */
    save.mapPos = nodeId;
    save.coins += gainedCoins;
    if (relicGain) save.relics = (save.relics || 0) + relicGain;
    if (gainedHerbs) save.herbs += gainedHerbs;
    save.stats.wins += 1;
    save.stats.kills += result.stats.kills;
    const byKey = result.stats.byKey || {};
    const winter = ['frost', 'yeti', 'balloon', 'mammoth', 'sparrow', 'diver'];
    save.stats.frostKills = (save.stats.frostKills || 0) + winter.reduce((n, k) => n + (byKey[k] || 0), 0);
    save.stats.mammothKills = (save.stats.mammothKills || 0) + (byKey.mammoth || 0);
    const drops = DATA.rollDrops(level, replay);
    if (firstBonus && firstBonus.mats) {
      Object.keys(firstBonus.mats).forEach((k) => { drops[k] = (drops[k] || 0) + firstBonus.mats[k]; });
    }
    save.mats = save.mats || { feather: 0, ore: 0, wood: 0 };
    Object.keys(drops).forEach((k) => { save.mats[k] = (save.mats[k] || 0) + drops[k]; });
    if (firstBonus && firstBonus.potions) {
      Object.keys(firstBonus.potions).forEach((id) => { save.potions[id] = (save.potions[id] || 0) + firstBonus.potions[id]; });
    }
    /* Stars are wheel rewards: 1 star = 1 reward, 2 = 2, 3 = 3. */
    save.spins += Math.max(1, result.stars || 0);

    if (!result.fallen.length) save.flags.noLossWin = true;
    /* "Not a Scratch" is a boss-only feat now: the full three-pig squad has to
       be standing at the end of a boss fight. */
    if (!result.fallen.length && level.boss && save.party.length >= MAX_PARTY) save.flags.noLossBossFull = true;
    if (result.rounds <= 3) save.flags.blitz = true;
    if (result.stats.ults >= 4) save.flags.combo = true;
    if (!result.usedPotion) save.flags.noPotionWin = true;
    /* Went in three wide, came out with a single pig still standing. */
    if (save.party.length >= 3 && result.fallen.length === save.party.length - 1) save.flags.lastStand = true;

    /* Castle keys: each warden drops one, and each key opens a side road on
       the map that was already visible but sealed. */
    if (level.grantsKey) {
      save.keys = save.keys || [];
      if (!save.keys.includes(level.grantsKey)) {
        const keyDef = DATA.keys[level.grantsKey];
        save.keys.push(level.grantsKey);
        toast(`The ${keyDef ? keyDef.name : level.grantsKey} is yours ${keyDef ? keyDef.icon : '🔑'} — every ${keyDef ? keyDef.name.replace(' Key', '').toLowerCase() : ''} door is open.`, null);
        SFX.play('unlock');
      }
    }
    /* Recruits unlocked by this win simply join the roster; no XP is handed out. */
    ensureUnlocks();
    const mvpId = result.mvp;
    const healId = result.mvpHeal && result.mvpHeal !== mvpId ? result.mvpHeal : null;
    const nameOfPig = (id) => (id ? ((heroDef(id) || {}).name || '') : '');
    const mvpName = nameOfPig(mvpId);
    const healName = nameOfPig(healId);
    /* Solo XP: only the pigs that fought this battle are paid. Nothing
       trickles down to the bench any more. */
    const xpRows = [];
    const squad = (result.party || save.party || []).filter((id) => save.heroes.includes(id));
    DATA.heroes.forEach((hero) => {
      if (!squad.includes(hero.id)) return;
      const ribbon = hero.id === mvpId ? 'damage' : hero.id === healId ? 'heal' : null;
      const mult = ribbon ? 1.25 : 1;
      const gain = Math.round(gainedXp * mult);
      const ups = addPigXp(hero.id, gain);
      xpRows.push({ id: hero.id, name: hero.name, gain, mult, ups, ribbon });
    });
    syncSquadLevel();
    persist();
    checkAchievements();

    DATA.heroes.forEach((h) => { if (save.heroes.includes(h.id)) save.seenHeroes[h.id] = true; });
    /* Keyed by the bird itself, never by its artwork, so two birds that happen
       to look alike can never count as the same discovery. */
    levelRoster(level).forEach((e) => { save.seenBirds[e.t] = true; });

    const stars = [1, 2, 3].map((i) => `<span class="star-slot${i <= result.stars ? ' on' : ''}">★</span>`).join('');
    const bonusBits = [];
    if (firstBonus) {
      if (firstBonus.coins) bonusBits.push(`+${firstBonus.coins} 🪙`);
      if (firstBonus.relics) bonusBits.push(`+${firstBonus.relics} 🏅`);
      Object.keys(firstBonus.mats || {}).forEach((k) => bonusBits.push(`+${firstBonus.mats[k]} ${DATA.mats[k].icon}`));
      Object.keys(firstBonus.potions || {}).forEach((id) => bonusBits.push(`+${firstBonus.potions[id]} ${DATA.potions[id].icon} ${DATA.potions[id].name}`));
    }

    openSheet(`
      <div class="eyebrow">${level.boss ? 'Boss defeated' : replay ? 'Replayed & cleared' : 'Battle won'}</div>
      <h2>${replay ? 'Replay complete' : 'Victory!'}</h2>
      <div class="stars-row">${stars}</div>
      <p>Score <b>${result.score}</b> · ${result.rounds} round${result.rounds === 1 ? '' : 's'} · ${result.stats.kills} bird${result.stats.kills === 1 ? '' : 's'} down${replay ? ' · reduced rewards' : ''}</p>
      <div class="reward-line"><span>Damage dealt</span><b>${result.stats.dealt}</b></div>
      <div class="reward-line"><span>Damage taken</span><b>${result.stats.taken}</b></div>
      <div class="reward-line"><span>Coins</span><b>+${gainedCoins} 🪙</b></div>
      ${relicGain ? `<div class="reward-line"><span>Relics</span><b>+${relicGain} 🏅 · ${firstBonus ? 'star + first clear' : 'star reward'}</b></div>` : ''}
      <div class="reward-line"><span>XP</span><b>${`+${gainedXp} 📗 from ${result.stats.kills} bird${result.stats.kills === 1 ? '' : 's'}${replay ? ' · rebeat ×0.25' : ''}`}${mvpName ? ` · most damage ${mvpName}` : ''}${healName ? ` · most healing ${healName}` : ''}</b></div>
      ${xpRows.map((r) => `<div class="reward-line"><span>${r.ribbon === 'damage' ? '⭐ ' : r.ribbon === 'heal' ? '💚 ' : '🐷 '}${r.name}${r.ribbon ? (r.ribbon === 'damage' ? ' · most damage' : ' · most healing') : ''}</span><b>+${r.gain} 📗${r.mult !== 1 ? ` ×${r.mult}` : ''}${r.ups ? ` · Lv ${pigLevel(r.id)}` : ''}</b></div>`).join('')}
      ${gainedHerbs ? `<div class="reward-line"><span>Herbs</span><b>+${gainedHerbs} 🌿</b></div>` : ''}
      ${Object.keys(drops).length ? `<div class="reward-line"><span>Materials</span><b>${Object.keys(drops).map((k) => `+${drops[k]} ${DATA.mats[k].icon}`).join(' ')}</b></div>` : ''}
      ${bonusBits.length ? `<div class="reward-line first-clear"><span>★ ${firstBonus.label}</span><b>${bonusBits.join(' · ')}</b></div>` : ''}
      <div class="reward-line wheel-line"><span>Wheel rewards</span><b>${save.spins} 🎪 · ★ ${result.stars} = ${Math.max(1, result.stars || 0)} reward${Math.max(1, result.stars || 0) === 1 ? '' : 's'}${replay ? ` · replay prizes are ${Math.round(REPLAY_PRIZE_MUL * 100)}%` : ''}</b></div>
      <div class="sheet-actions">
        ${`<button class="btn gold" id="ovSpin" data-replay="${replay ? 1 : 0}" ${save.spins ? '' : 'disabled'}>🎪 ${replay ? `Replay spin (${Math.round(REPLAY_PRIZE_MUL * 100)}%)` : `Spin ×${save.spins}`}</button>`}
        <button class="btn ${save.spins ? 'ghost' : 'go'}" id="ovContinue" ${save.spins ? 'disabled' : ''}>${save.spins ? 'Spin first…' : 'Continue →'}</button>
      </div>
    `);
    SFX.play('levelup');
    [1, 2, 3].forEach((i) => { if (i <= result.stars) setTimeout(() => SFX.play('star', i), 240 * i); });
    if (!replay) confetti(el.overlay.querySelector('.sheet'));

    const ovSpin = el.overlay.querySelector('#ovSpin');
    const ovCont = el.overlay.querySelector('#ovContinue');
    /* One exit for the whole reward sheet, wheel included: close it, then let
       afterBattleNavigation() do the unlocking and land on the map. The old
       hook only re-enabled a Continue button that the wheel's own sheet had
       already replaced, so collecting a prize left the player stuck on the
       finished battle screen. */
    const finishVictory = () => {
      closeOverlay();
      afterBattleNavigation(level);
    };
    if (ovSpin) ovSpin.addEventListener('click', () => {
      SFX.play('click');
      openWheel(ovSpin.dataset.replay === '1' ? REPLAY_PRIZE_MUL : 1, finishVictory);
    });
    ovCont.addEventListener('click', () => {
      SFX.play('click');
      finishVictory();
    });
    /* The wheel is part of the reward, not an optional detour: it plays itself,
       and "Collect & continue" walks you straight back to the map. */
    if (save.spins > 0 && ovSpin) {
      setTimeout(() => {
        if (!el.overlay || el.overlay.classList.contains('hidden')) return;
        openWheel(replay ? REPLAY_PRIZE_MUL : 1, finishVictory);
      }, 900);
    }
  }

  /* A queue outside the battle path (a pig unlocked on load, say) still has to
     surface: run it as soon as nothing else is covering the screen. */
  function flushPending() {
    if (overlayOpen() || !el.battle.classList.contains('hidden')) return;
    if (!pendingScenes.length && !pendingRecruits.length) return;
    const scenes = pendingScenes.slice();
    const recruits = pendingRecruits.slice();
    pendingScenes = [];
    pendingRecruits = [];
    const run = (i) => {
      if (i < scenes.length) { playCutscene(scenes[i], () => run(i + 1)); return; }
      if (recruits.length) setTimeout(() => showRecruitPopup(recruits), 250);
    };
    run(0);
  }

  function afterBattleNavigation(level) {
    /* Scenes queued by the win (a pig joining) and the recruit card wait for
       the reward sheet to close, so nothing plays hidden underneath it. */
    const scenes = pendingScenes.slice();
    const recruits = pendingRecruits.slice();
    pendingScenes = [];
    pendingRecruits = [];
    const land = () => {
      show('map');
      if (recruits.length) setTimeout(() => showRecruitPopup(recruits), 320);
    };
    const after = (i) => {
      if (i < scenes.length) { playCutscene(scenes[i], () => after(i + 1)); return; }
      if (!level.boss) { save.started = true; persist(); land(); return; }
      /* A castle falling ends its world on a scene, and the next world opens
         behind it. A world only advances if there is somewhere to go. */
      const outro = level.world === 5 ? 'ending' : 'outro' + level.world;
      const nextWorld = level.world + 1;
      const finish = () => {
        if (worldOf(nextWorld)) save.world = nextWorld;
        save.started = true;
        persist();
        land();
        const notes = {
          1: 'Cuckoo Canyon unlocked — the flock fled east. Follow them!',
          2: 'Frost Peak unlocked — the flock climbed north into the snow.',
          3: 'Saltwind Shore unlocked — the flock has gone out to sea.',
          4: 'Saltwind Shore is clear. Every world is open — the dungeon runs three a day.',
          5: 'The Gilded Kingdom is yours. Every world is clear, and the dungeon is open.',
        };
        toast(notes[level.world] || notes[1], null);
      };
      /* The castle scene belongs to the kill, not to the first clear: replaying
         a boss still gets its closing scene. */
      if (DATA.cutscenes[outro]) { playCutscene(outro, finish); return; }
      finish();
    };
    after(0);
  }

  function onBattleLose() {
    const level = activeLevel;
    /* Ten coins for the walk home. A loss still pays no XP, stars or drops. */
    save.coins += 10;
    persist(true);
    openSheet(`
      <div class="eyebrow">Defeat</div>
      <h2>The flock wins this one</h2>
      <p>${level.boss ? 'The boss is still standing. Open with a squad heal or shield, then focus the small birds so the boss cannot revive.' : 'Try a different opening: open with a shield or a squad heal. Potions are free actions.'}</p>
      <div class="reward-line"><span>Consolation</span><b>+10 🪙</b></div>
      <div class="sheet-actions">
        <button class="btn gold" id="ovRetry">↻ Try again</button>
        <button class="btn ghost" id="ovBack">Back to base</button>
      </div>
    `, { dark: true });
    el.overlay.querySelector('#ovRetry').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
      startBattle(level, activeNode);
    });
    el.overlay.querySelector('#ovBack').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
      show('map');
    });
  }

  function confetti(host) {
    if (!host) return;
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = ['#ffd34e', '#7cc33f', '#e2543f', '#8fd0ff', '#f4a3c8'][i % 5];
      c.style.animationDelay = Math.random() * 0.5 + 's';
      c.style.setProperty('--rot', Math.random() * 360 + 'deg');
      host.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }

  /* ============================================================
     Daily reward
     ------------------------------------------------------------
     One chest a calendar day. Seven days in a row pays the most,
     and a missed day drops the streak back to one.
     ============================================================ */

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function dailyRewardInfo() {
    const d = save.daily || { day: '', streak: 0 };
    const claimed = d.day === todayKey();
    let streak = d.streak || 0;
    if (!claimed) {
      if (d.day && d.day !== yesterdayKey()) streak = 0;
      streak += 1;
    }
    const day = Math.max(1, Math.min(streak, 7));
    return {
      claimed,
      streak: Math.max(1, streak),
      day,
      coins: 50 + (day - 1) * 20,
      herbs: day >= 6 ? 3 : day >= 3 ? 2 : 1,
    };
  }

  function dailyRewardReady() { return !dailyRewardInfo().claimed; }

  function claimDailyReward() {
    const info = dailyRewardInfo();
    if (info.claimed) { SFX.play('nope'); return; }
    save.daily = { day: todayKey(), streak: info.streak };
    save.coins += info.coins;
    save.herbs += info.herbs;
    persist();
    SFX.play('coin');
    checkAchievements();
    toast(`Day ${info.streak} chest: 🪙 ${info.coins} · 🌿 ${info.herbs}`, null);
    closeOverlay();
    renderMap();
  }

  function openDailyReward() {
    const info = dailyRewardInfo();
    openSheet(`
      <div class="eyebrow">Daily reward</div>
      <h2>${info.claimed ? 'Already collected' : `Day ${info.streak} chest`}</h2>
      <p>${info.claimed
        ? 'One chest a day. Come back tomorrow — miss a day and the streak starts over.'
        : 'One chest a day. The longer the streak, the fatter the purse.'}</p>
      <div class="reward-line"><span>Coins</span><b>🪙 ${info.coins}</b></div>
      <div class="reward-line"><span>Herbs</span><b>🌿 ${info.herbs}</b></div>
      <div class="reward-line"><span>Streak</span><b>${info.streak} day${info.streak === 1 ? '' : 's'}</b></div>
      <p class="tip-line">Day 1–2: 50–70 coins · day 3–5: extra herbs · day 6–7: 150–170 coins and 3 herbs.</p>
      <div class="sheet-actions">
        ${info.claimed
          ? '<button class="btn ghost" id="ovCancel">Close</button>'
          : '<button class="btn gold" id="ovDailyClaim">Claim 🎁</button><button class="btn ghost" id="ovCancel">Later</button>'}
      </div>
    `);
    const claim = el.overlay.querySelector('#ovDailyClaim');
    if (claim) claim.addEventListener('click', claimDailyReward);
    const cancel = el.overlay.querySelector('#ovCancel');
    if (cancel) cancel.addEventListener('click', closeOverlay);
  }

  /* ============================================================
     Wheel
     ============================================================ */

  /* Replaying a cleared level still spins once, but the loot is ~3x worse
     than a first clear — grinding should not out-earn new ground. */
  const REPLAY_PRIZE_MUL = 0.35;

  function openWheel(mult, onDone) {
    const prizeMul = mult || 1;
    wheelDoneHook = onDone || null;
    const n = DATA.wheel.length;
    const seg = 360 / n;
    const wedges = DATA.wheel.map((p, i) => {
      const a0 = (i * seg - 90) * Math.PI / 180;
      const a1 = ((i + 1) * seg - 90) * Math.PI / 180;
      const x0 = 100 + 92 * Math.cos(a0);
      const y0 = 100 + 92 * Math.sin(a0);
      const x1 = 100 + 92 * Math.cos(a1);
      const y1 = 100 + 92 * Math.sin(a1);
      const mid = (i * seg + seg / 2 - 90) * Math.PI / 180;
      const tx = 100 + 62 * Math.cos(mid);
      const ty = 100 + 62 * Math.sin(mid);
      return `<g>
        <path d="M100 100 L${x0.toFixed(1)} ${y0.toFixed(1)} A92 92 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${p.color}" stroke="#7a5a1e" stroke-width="1.5"/>
        <text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}" text-anchor="middle" font-size="17">${p.icon}</text>
        <text x="${tx.toFixed(1)}" y="${(ty + 18).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#3a2c0c" font-weight="700">${p.kind === 'coins' ? p.amount : p.kind === 'herbs' ? 'HERBS' : p.kind === 'xp' ? 'XP' : 'ITEM'}</text>
      </g>`;
    }).join('');

    wheel = { spins: save.spins, rotation: 0, busy: false, results: [], prizeMul };
    openSheet(`
      <div class="eyebrow">Reward wheel</div>
      <h2>Spin for your prize</h2>
      <p style="margin-bottom:2px">Spins left: <b id="spinCount">${wheel.spins}</b></p>
      <p class="panel-note" style="margin:0 0 8px">First spin each day pays <b>2×</b>. Later spins pay half of that. Your star rating sets the rewards: <b>1★ = 1</b>, <b>2★ = 2</b>, <b>3★ = 3</b>.</p>
      <div class="wheel-wrap">
        <svg viewBox="0 0 200 200" class="wheel-svg">
          <circle cx="100" cy="100" r="96" fill="#5c3d17"/>
          <g id="wheelRot" style="transform-origin:100px 100px;">${wedges}</g>
          <circle cx="100" cy="100" r="16" fill="#f7c948" stroke="#b8860b" stroke-width="3"/>
          <text x="100" y="105" text-anchor="middle" font-size="13">🐷</text>
        </svg>
        <div class="wheel-pointer">▼</div>
      </div>
      <div class="wheel-result" id="wheelResult">${wheel.spins ? 'Spinning for you…' : 'No spins left.'}</div>
      <div class="sheet-actions">
        <button class="btn gold" id="ovSpinGo" ${wheel.spins ? '' : 'disabled'}>🎡 Spin</button>
        <button class="btn ${wheel.spins ? 'ghost' : 'go'}" id="ovSpinDone" ${wheel.spins ? 'disabled' : ''}>${wheel.spins ? 'Spinning…' : 'Collect & continue →'}</button>
      </div>
    `, { wide: true });
    el.overlay.querySelector('#ovSpinGo').addEventListener('click', spinWheel);
    el.overlay.querySelector('#ovSpinDone').addEventListener('click', () => {
      SFX.play('click');
      save.spins = 0;
      persist();
      closeOverlay();
      if (wheelDoneHook) { const fn = wheelDoneHook; wheelDoneHook = null; fn(); return; }
      if (activeLevel) afterBattleNavigation(activeLevel);
      else show('map');
    });
    /* Auto-play: every spin the player earned fires on its own. */
    if (wheel.spins > 0) setTimeout(spinWheel, 650);
  }

  function wheelPrize(i) {
    const prizes = DATA.wheel;
    return prizes[i % prizes.length];
  }

  function applyPrize(prize, mul) {
    const m = mul == null ? 1 : mul;
    if (prize.kind === 'coins') {
      const amount = Math.max(1, Math.round(prize.amount * m));
      save.coins += amount;
      save.stats.spins += 1;
      if (prize.amount >= 80) save.flags.jackpot = true;
      return `+${amount} coins${m < 1 ? ' (reduced)' : ''}`;
    }
    if (prize.kind === 'herbs') {
      const amount = Math.max(1, Math.round(prize.amount * m));
      save.herbs += amount;
      return `+${amount} herbs`;
    }
    if (prize.kind === 'xp') {
      const amount = Math.max(1, Math.round(prize.amount * m));
      const ups = addXp(amount);
      return `+${amount} XP${ups ? ' · level up!' : ''}`;
    }
    if (prize.kind === 'potion') {
      save.potions[prize.id] = (save.potions[prize.id] || 0) + 1;
      return `+1 ${DATA.potions[prize.id].name}`;
    }
    return 'Nothing';
  }

  function spinWheel() {
    if (!wheel || wheel.busy || wheel.spins <= 0) return;
    wheel.busy = true;
    wheel.spins -= 1;
    save.spins = wheel.spins;
    const count = DATA.wheel.length;
    const seg = 360 / count;
    const idx = Math.floor(Math.random() * count);
    const target = 360 + (360 - (idx * seg + seg / 2));
    wheel.rotation = target;
    const rot = document.getElementById('wheelRot');
    const btn = el.overlay.querySelector('#ovSpinGo');
    const result = document.getElementById('wheelResult');
    if (btn) btn.disabled = true;
    if (result) result.textContent = 'Spinning…';
    rot.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.15,1)';
    rot.style.transform = `rotate(${target}deg)`;
    persist();

    let tickCount = 0;
    const tick = setInterval(() => {
      SFX.play('tick');
      tickCount += 1;
      if (tickCount > 26) clearInterval(tick);
    }, 120);

    setTimeout(() => {
      clearInterval(tick);
      const prize = wheelPrize(idx);
      /* First spin of the day pays double; every spin after it pays half of that. */
      const firstSpinToday = save.wheelDay !== todayKey();
      const spinMul = (wheel.prizeMul || 1) * (firstSpinToday ? 2 : 1);
      save.wheelDay = todayKey();
      save.wheelSpinsToday = firstSpinToday ? 1 : (save.wheelSpinsToday || 0) + 1;
      const text = applyPrize(prize, spinMul);
      wheel.results.push(text);
      const countEl = document.getElementById('spinCount');
      if (countEl) countEl.textContent = wheel.spins;
      if (result) result.innerHTML = `<b>${prize.icon} ${text}</b>${wheel.results.length > 1 ? `<small>${wheel.results.join(' · ')}</small>` : ''}`;
      SFX.play('coin');
      persist();
      checkAchievements();
      wheel.busy = false;
      const go = el.overlay.querySelector('#ovSpinGo');
      if (go) {
        go.disabled = wheel.spins <= 0;
        go.textContent = wheel.spins ? `🎡 Spin ×${wheel.spins}` : '🎡 No spins left';
      }
      const done = el.overlay.querySelector('#ovSpinDone');
      if (wheel.spins > 0) {
        if (done) { done.disabled = true; done.className = 'btn ghost'; done.textContent = 'Spinning…'; }
        setTimeout(spinWheel, 780);
      } else {
        if (done) { done.disabled = false; done.className = 'btn go'; done.textContent = 'Collect & continue →'; }
        SFX.play('unlock');
      }
    }, 3650);
  }

  /* ============================================================
     Base
     ============================================================ */

  function renderBase() {
    ensureUnlocks();
    const tabs = [
      ['party', '🐷 Party'],
      ['workshop', '🛠️ Workshop'],
      ['anvil', '⚒️ Anvil'],
      ['inventory', '🎒 Inventory'],
      ['forge', '⚔️ Relic Forge'],
      ['relics', '💎 Relics'],
      ['pantry', '🧪 Pantry'],
      ['alchemy', '⚗️ Alchemy'],
      ['barracks', '💪 Barracks'],
      ['ach', '🏆 Achievements'],
      ['index', '📖 Index'],
    ];
    const resting = save.party.map((id) => Art.hero(id, save.charRelics[id], equippedWeaponId(id), equippedShieldId(id))).join('');
    el.base.innerHTML = `
      <div class="base-top">
        <button class="icon-btn" id="baseBack">←</button>
        <div class="base-title">
          <h1>Pig Base</h1>
          <p>Rest, upgrade, and plan the next raid</p>
        </div>
        <div class="base-xp">${xpBar()}</div>
        <div class="res-row">${coins(save.coins)}${herbs(save.herbs)}<span class="cur">Lv ${save.level}</span></div>
      </div>
      <div class="base-heroes">${resting}</div>
      <div class="base-tabs">
        ${tabs.map(([key, label]) => `<button class="tab ${baseTab === key ? 'on' : ''}" data-tab="${key}">${label}</button>`).join('')}
      </div>
      <div class="base-body" id="baseBody"></div>
      <div id="savePill" class="save-pill">Saved ✓</div>
    `;
    el.base.querySelector('#baseBack').addEventListener('click', () => { SFX.play('click'); show('map'); });
    el.base.querySelectorAll('.tab').forEach((btn) =>
      btn.addEventListener('click', () => { SFX.play('click'); baseTab = btn.dataset.tab; renderBase(); })
    );
    const body = el.base.querySelector('#baseBody');
    if (baseTab === 'party') body.innerHTML = partyTab();
    if (baseTab === 'workshop') body.innerHTML = workshopTab();
    if (baseTab === 'anvil') body.innerHTML = anvilTab();
    if (baseTab === 'inventory') body.innerHTML = inventoryTab();
    if (baseTab === 'forge') body.innerHTML = forgeTab();
    if (baseTab === 'relics') body.innerHTML = relicsTab();
    if (baseTab === 'pantry') body.innerHTML = pantryTab();
    if (baseTab === 'alchemy') body.innerHTML = alchemyTab();
    if (baseTab === 'barracks') body.innerHTML = barracksTab();
    if (baseTab === 'ach') body.innerHTML = achievementsTab();
    if (baseTab === 'index') body.innerHTML = indexTab();
    wireBase(body);
    requestAnimationFrame(() => savedFlash());
  }

  function partyTab() {
    return `
      <div class="panel-note">Choose ${MAX_PARTY} pigs for the squad. All six keep their gear and levels.</div>
      <div class="hero-grid">
        ${DATA.heroes.map((hero, i) => {
          const unlocked = isUnlockedHero(hero.id);
          const gear = gearOf(hero.id);
          const stats = DATA.heroStats(hero, pigLevel(hero.id), gear, forgeOf(hero.id));
          const inParty = save.party.includes(hero.id);
          const hint = heroUnlockHint(hero);
          const tip = unlocked
            ? DATA.heroTip(Object.assign({}, stats, { def: hero, level: pigLevel(hero.id), relic: save.charRelics[hero.id], abilities: DATA.abilitiesFor(hero, gear, save.charRelics[hero.id], { level: pigLevel(hero.id), atk: Math.round(stats.atk), maxHp: stats.maxHp }) }))
            : `<div class="tt-name">???</div><div class="tt-meta">Not recruited yet</div><div class="tt-trait">${hint}</div>`;
          return `<div class="hero-card ${unlocked ? '' : 'locked'} ${inParty ? 'in-party' : ''}" data-tip="${tip.replace(/"/g, '&quot;')}">
            <div class="hc-top">
              ${unlocked ? Art.hero(hero.id, save.charRelics[hero.id], equippedWeaponId(hero.id), equippedShieldId(hero.id)) : '<span class="mystery">?</span>'}
              <div>
                <b>${unlocked ? hero.name : '???'}</b>
                <span>${unlocked ? `${hero.title} · ${hero.role}` : 'Not recruited yet'}</span>
                <small>${unlocked ? `Lv ${pigLevel(hero.id)} · ${stats.maxHp} HP` : hint}</small>
                ${unlocked ? `<span class="pig-xp"><span class="track"><i style="width:${pigXpPct(hero.id)}%"></i></span><em>${pigXp(hero.id)}/${pigXpNeed(hero.id)} XP</em></span>` : ''}
              </div>
              ${inParty ? '<span class="party-badge">In party</span>' : ''}
            </div>
            ${unlocked ? `<p class="hc-trait">${hero.trait}</p>
            <div class="hc-gear">
              <span>🔨 ${hero.weapon.name} ${'●'.repeat(gear.weapon)}${'○'.repeat(5 - gear.weapon)}</span>
              <span>🪖 ${hero.helmet.tiers[gear.helmet - 1].name} ${'●'.repeat(gear.helmet)}${'○'.repeat(5 - gear.helmet)}</span>
              ${equippedWeapon(hero.id) ? `<span>🗡️ ${equippedWeapon(hero.id).name} · 5% ${equippedWeapon(hero.id).effect}</span>` : ''}
              ${equippedShield(hero.id) ? `<span>🛡️ ${equippedShield(hero.id).name} · +${equippedShield(hero.id).hp} base HP</span>` : ''}
            </div>
            <div class="hc-abilities">
              ${DATA.abilitiesFor(hero, gear, save.charRelics[hero.id], { level: pigLevel(hero.id), atk: Math.round(stats.atk), maxHp: stats.maxHp }).map((a) => `<span title="${a.desc}">${a.icon} ${a.name}</span>`).join('')}
            </div>` : `<p class="hc-trait">Meet this pig on the road to unlock its name, kit and abilities.</p>`}
            <button class="btn small ${inParty ? 'ghost' : ''}" data-party="${hero.id}" ${unlocked ? '' : 'disabled'}>
              ${unlocked ? (inParty ? 'Remove' : 'Add to squad') : '🔒 Locked'}
            </button>
          </div>`;
        }).join('')}
      </div>`;
  }

  function workshopTab() {
    return DATA.heroes.filter((h) => isUnlockedHero(h.id)).map((hero) => {
      const gear = gearOf(hero.id);
      const rows = ['weapon', 'helmet'].map((slot) => {
        const table = slot === 'weapon' ? hero.weapon : hero.helmet;
        const tier = gear[slot];
        const next = tier + 1;
        const maxed = tier >= 5;
        const cost = maxed ? 0 : table.cost[next - 1];
        const needsBp = false;
        const canBuy = !maxed && !needsBp && save.coins >= cost;
        const label = maxed
          ? 'Tier 5 · Maxed'
          : needsBp
            ? `Needs blueprint (🛒 shop)`
            : `${table.tiers ? table.tiers[next - 1].name : 'Tier ' + next} · ${cost} 🪙`;
        return `<div class="gear-row">
          <div class="gr-head">
            <b>${slot === 'weapon' ? '🔨 Weapon' : '🪖 Helmet'}</b>
            <span class="tier-pips">${'●'.repeat(tier)}${'○'.repeat(5 - tier)}</span>
          </div>
          <div class="gr-desc">${slot === 'weapon'
            ? `Attack ×${hero.weapon.atkMul[tier - 1].toFixed(2)} — upgrades add damage.`
            : (table.tiers[tier - 1].desc || '')}</div>
          <div class="gr-next">${slot === 'weapon'
            ? `Weapon proc (${Math.round(DATA.gearProcChance(tier) * 100)}% per hit) — 🫧 cleanse, ⛓️ chain, 💫 stun or ⭐ crit. A crafted weapon replaces this with its own flat 5%.`
            : `Helmet proc (${Math.round(DATA.gearProcChance(tier) * 100)}% when hit) — 🛡 shield, ❤️ heal, 🫧 cleanse or 🪶 thorns.`}</div>
          <button class="btn small ${canBuy ? '' : 'ghost'}" data-upgrade="${hero.id}:${slot}" ${canBuy ? '' : 'disabled'}>${label}</button>
          ${slot === 'helmet' && !maxed ? `<div class="gr-next">Next: ${table.tiers[next - 1].desc}</div>` : ''}
        </div>`;
      }).join('');
      const held = equippedWeapon(hero.id);
      const carried = craftedWeaponList();
      const heldRow = `<div class="gear-row cw-workshop">
        <div class="gr-head"><b>🗡️ Carried weapon</b><span>${held ? `${held.icon} ${held.name}` : 'No weapon'}</span></div>
        <div class="gr-desc">${held ? held.desc : 'Every pig starts with a weapon. Buy or craft another, then swap it in from the Inventory.'}</div>
        ${carried.length
          ? `<select class="cw-select" data-weapon-pig="${hero.id}" aria-label="Crafted weapon for ${hero.name}">
              <option value="">No crafted weapon</option>
              ${carried.map((w) => `<option value="${w.id}" ${held && held.id === w.id ? 'selected' : ''}>${w.icon} ${w.name} · 5% ${w.effect}</option>`).join('')}
            </select>`
          : '<div class="gr-next">No crafted weapons yet — buy a weapon blueprint from a merchant, then craft it in the Inventory.</div>'}
      </div>`;
      return `<div class="workshop-card">
        <div class="wc-head">${Art.hero(hero.id, save.charRelics[hero.id], equippedWeaponId(hero.id), equippedShieldId(hero.id))}<div><b>${hero.name}</b><span>${hero.title} · Lv ${pigLevel(hero.id)}</span></div>
          <button class="die die-btn die-head" data-dice="${hero.id}" aria-label="Die showing ${dieOf(hero.id)}" title="Reroll ${hero.name}&rsquo;s die — ${dieNextCost(hero)} coins">${dieFace(dieOf(hero.id))}</button>
          <span class="wc-hp">${DATA.heroStats(hero, pigLevel(hero.id), gear, forgeOf(hero.id)).maxHp} HP</span></div>
        ${rows}
        ${heldRow}
      </div>`;
    }).join('');
  }

  /* Squad training: permanent ATK / HP for every pig, bought with coins and
     the ore and wood the flock drops. */
  function barracksTab() {
    save.upgrades = save.upgrades || { power: 0, vigour: 0 };
    const rows = Object.keys(DATA.training).map((key) => {
      const track = DATA.training[key];
      const lvl = save.upgrades[key] || 0;
      const maxed = lvl >= track.max;
      const cost = maxed ? 0 : track.cost[lvl];
      const mats = maxed ? {} : (track.mats[lvl] || {});
      const matText = Object.keys(mats).map((k) => `${DATA.mats[k].icon} ${mats[k]} ${DATA.mats[k].name}`).join(' · ');
      const haveMats = Object.keys(mats).every((k) => (save.mats[k] || 0) >= mats[k]);
      const canBuy = !maxed && haveMats && save.coins >= cost;
      const pct = Math.round(lvl * track.step * 100);
      return `<div class="gear-row">
        <div class="gr-head">
          <b>${track.icon} ${track.name}</b>
          <span class="tier-pips">${'●'.repeat(lvl)}${'○'.repeat(track.max - lvl)}</span>
        </div>
        <div class="gr-desc">${track.blurb} <b>+${pct}% ${track.unit}</b> to every pig.</div>
        <button class="btn small ${canBuy ? '' : 'ghost'}" data-train="${key}" ${canBuy ? '' : 'disabled'}>
          ${maxed ? 'Maxed' : `Train · ${cost} 🪙 ${matText ? '· ' + matText : ''}`}
        </button>
        ${maxed ? '' : `<div class="gr-next">Next level: +${Math.round((lvl + 1) * track.step * 100)}% ${track.unit} for the whole squad.</div>`}
      </div>`;
    }).join('');
    return `<div class="panel-note">Training is permanent and applies to all six pigs. Earn coins in battles, ore and wood from elites and caves.</div>
      <div class="workshop-card">${rows}</div>`;
  }

  function trainUp(key) {
    const track = DATA.training[key];
    if (!track) return;
    save.upgrades = save.upgrades || { power: 0, vigour: 0 };
    const lvl = save.upgrades[key] || 0;
    if (lvl >= track.max) return;
    const cost = track.cost[lvl];
    const mats = track.mats[lvl] || {};
    const haveMats = Object.keys(mats).every((k) => (save.mats[k] || 0) >= mats[k]);
    if (!haveMats || save.coins < cost) { SFX.play('nope'); return; }
    Object.keys(mats).forEach((k) => { save.mats[k] -= mats[k]; });
    save.coins -= cost;
    save.stats.spent = (save.stats.spent || 0) + cost;
    save.upgrades[key] = lvl + 1;
    applyTraining();
    SFX.play('unlock');
    toast(`${track.name} ${lvl + 1}/${track.max} — +${Math.round((lvl + 1) * track.step * 100)}% ${track.unit} for the squad`);
    persist();
    checkAchievements();
    renderBase();
  }

  function applyTraining() {
    save.upgrades = save.upgrades || { power: 0, vigour: 0, edge: 0, guard: 0 };
    DATA.trainingBonus = {
      power: (save.upgrades.power || 0) * DATA.training.power.step,
      vigour: (save.upgrades.vigour || 0) * DATA.training.vigour.step,
      edge: (save.upgrades.edge || 0) * DATA.training.edge.step,
      guard: (save.upgrades.guard || 0) * DATA.training.guard.step,
    };
  }

  function weaponTip(w) {
    const fx = DATA.weaponEffects[w.proc] || { name: w.effect || 'Weapon', icon: '⚔️', desc: w.desc || 'A crafted rider.' };
    const pct = Math.round((w.chance || 0.05) * 100);
    const owner = w.forHero && heroDef(w.forHero) ? `<div class="tt-meta">${heroDef(w.forHero).name} recipe</div>` : '';
    return `<div class="tt-name">${w.name}</div>${owner}<div class="tt-meta">+${w.atk || 0} base damage</div><div class="tt-relic">${fx.icon || '⚔️'} ${fx.name} · ${pct}% on hit</div><div>${fx.desc}.</div>`;
  }

  function shieldTip(s) {
    return `<div class="tt-name">${s.name}</div><div class="tt-meta">+${s.hp || 0} base HP</div><div>${s.desc || 'A carried shield.'}</div><div class="tt-meta">Shared shield recipe</div>`;
  }

  function anvilTab() {
    const unlocked = DATA.heroes.filter((h) => save.heroes.includes(h.id));
    if (!unlocked.some((h) => h.id === anvilPig)) {
      anvilPig = (save.party || []).find((id) => unlocked.some((h) => h.id === id)) || (unlocked[0] && unlocked[0].id) || '';
    }
    const owned = new Set(save.blueprints || []);
    const made = new Set(save.weapons || []);
    const carried = new Set(save.shields || []);
    const bpOf = (item) => DATA.blueprints.find((b) => b.id === `bp-${item.id}`);
    const weaponCard = (w) => {
      const bp = bpOf(w);
      const has = bp && owned.has(bp.id);
      const crafted = made.has(w.id);
      const coinCost = bp ? Math.round((bp.cost || 0) * 0.8) : 0;
      const canMats = bp && Object.keys(bp.mats || {}).every((k) => (save.mats[k] || 0) >= bp.mats[k]);
      const can = has && !crafted && canMats && save.coins >= coinCost;
      const mats = bp ? Object.keys(bp.mats || {}).map((k) => `${DATA.mats[k].icon}${bp.mats[k]}`).join(' ') : '';
      const fx = DATA.weaponEffects[w.proc] || { icon: '⚔️', name: w.effect || 'Weapon', desc: w.desc || '' };
      return `<div class="anvil-card ${crafted ? 'done' : ''} ${has ? '' : 'locked'}" style="--item:${w.colour}" data-tip="${weaponTip(w).replace(/"/g, '&quot;')}">
        <span class="anvil-art">${itemArt('weapon', w)}</span>
        <div class="anvil-body"><b>${w.name}</b><span class="fx-badge">${fx.icon} ${fx.name} · 5%</span><small>+${w.atk} base damage</small><small>${fx.desc}.</small><small class="anvil-cost">${mats} · ${coinCost} 🪙</small></div>
        ${crafted ? '<span class="anvil-state done">Forged ✓</span>' : has ? `<button class="btn small ${can ? 'go' : 'ghost'}" data-craft="${bp.id}" ${can ? '' : 'disabled'}>${can ? 'Craft' : 'Need mats'}</button>` : '<span class="anvil-state">Need blueprint</span>'}
      </div>`;
    };
    const shieldCard = (s) => {
      const bp = bpOf(s);
      const has = bp && owned.has(bp.id);
      const crafted = carried.has(s.id);
      const coinCost = bp ? Math.round((bp.cost || 0) * 0.8) : 0;
      const canMats = bp && Object.keys(bp.mats || {}).every((k) => (save.mats[k] || 0) >= bp.mats[k]);
      const can = has && !crafted && canMats && save.coins >= coinCost;
      const mats = bp ? Object.keys(bp.mats || {}).map((k) => `${DATA.mats[k].icon}${bp.mats[k]}`).join(' ') : '';
      return `<div class="anvil-card ${crafted ? 'done' : ''} ${has ? '' : 'locked'}" style="--item:${s.colour}" data-tip="${shieldTip(s).replace(/"/g, '&quot;')}">
        <span class="anvil-art">${itemArt('shield', s)}</span>
        <div class="anvil-body"><b>${s.name}</b><span class="fx-badge">🛡️ Shield · +${s.hp} base HP</span><small>${s.desc}</small><small class="anvil-cost">${mats} · ${coinCost} 🪙</small></div>
        ${crafted ? '<span class="anvil-state done">Forged ✓</span>' : has ? `<button class="btn small ${can ? 'go' : 'ghost'}" data-craft="${bp.id}" ${can ? '' : 'disabled'}>${can ? 'Craft' : 'Need mats'}</button>` : '<span class="anvil-state">Need blueprint</span>'}
      </div>`;
    };
    const weaponRecipes = DATA.anvilWeapons.filter((w) => w.forHero === anvilPig);
    const shieldRecipes = DATA.anvilShields;
    const recipes = anvilKind === 'shield' ? shieldRecipes : weaponRecipes;
    const anvilIds = new Set(DATA.anvilWeapons.map((w) => `bp-${w.id}`));
    const shared = (save.blueprints || [])
      .filter((id) => id.startsWith('bp-') && !anvilIds.has(id))
      .map((id) => DATA.blueprints.find((b) => b.id === id))
      .filter((bp) => bp && bp.slot === 'weapon')
      .map((bp) => DATA.craftedWeaponById(bp.weaponId))
      .filter(Boolean);
    const foundWeapons = DATA.anvilWeapons.filter((w) => owned.has(`bp-${w.id}`)).length;
    const foundShields = DATA.anvilShields.filter((s) => owned.has(`bp-${s.id}`)).length;
    const missingWeapons = DATA.anvilWeapons.filter((w) => !owned.has(`bp-${w.id}`) && !made.has(w.id) && save.heroes.includes(w.forHero)).length;
    const missingShields = DATA.anvilShields.filter((s) => !owned.has(`bp-${s.id}`) && !carried.has(s.id)).length;
    const found = foundWeapons + foundShields;
    const missing = missingWeapons + missingShields;
    const totalRecipes = DATA.anvilWeapons.length + DATA.anvilShields.length;
    const last = save.flags.lastAnvil && (DATA.craftedWeaponById(save.flags.lastAnvil) || DATA.craftedShieldById(save.flags.lastAnvil));
    const lastText = last ? (last.atk ? `${last.effect} 5%` : `+${last.hp} base HP`) : '';
    const oneCost = DATA.anvilSpinCosts[1];
    const tenCost = DATA.anvilSpinCosts[10];
    const canSpinOne = save.coins >= oneCost && missing > 0;
    const canSpinTen = save.coins >= tenCost && missing >= 10;
    const kindTabs = `<button class="anvil-pig ${anvilKind === 'weapon' ? 'on' : ''}" data-anvil-kind="weapon">⚔️ Weapons</button><button class="anvil-pig ${anvilKind === 'shield' ? 'on' : ''}" data-anvil-kind="shield">🛡️ Shields</button>`;
    const pigTabs = anvilKind === 'shield'
      ? '<div class="panel-note">Shield recipes are shared — any pig can carry a forged shield.</div>'
      : `<div class="anvil-pig-tabs">${unlocked.map((h) => `<button class="anvil-pig ${h.id === anvilPig ? 'on' : ''}" data-anvil-pig="${h.id}">${h.name.replace(' Pig', '')}</button>`).join('')}</div>`;
    return `<div class="panel-note">The anvil forges blueprints into carried gear. Weapons have one 5% rider and 24 recipes per pig; shields are shared HP recipes. Hover a card to read it.</div>
      <div class="slot-card">
        <div class="slot-copy"><span class="slot-ico">🎰</span><div><b>Blueprint coin slot</b><small>Two choices: one pull or ten. ${found}/${totalRecipes} found${missing ? '' : ' — all available blueprints found'}.</small></div></div>
        <button class="btn ${canSpinOne ? 'go' : 'ghost'}" data-anvil-spin="1" ${canSpinOne ? '' : 'disabled'}>1 pull · ${oneCost} 🪙</button>
        <button class="btn ${canSpinTen ? 'go' : 'ghost'}" data-anvil-spin="10" ${canSpinTen ? '' : 'disabled'}>10 pulls · ${tenCost} 🪙</button>
        ${last ? `<div class="slot-last">Last drop: ${last.icon || '⚔️'} ${last.name} · ${lastText}</div>` : ''}
      </div>
      <div class="anvil-kind-tabs">${kindTabs}</div>
      ${pigTabs}
      <div class="anvil-grid">${recipes.map(anvilKind === 'shield' ? shieldCard : weaponCard).join('')}</div>
      ${anvilKind === 'weapon' && shared.length ? `<h3 class="base-h">Shared weapon blueprints</h3><div class="anvil-grid">${shared.map(weaponCard).join('')}</div>` : ''}`;
  }

  /* Everything the pigs are carrying: materials, brews, blueprints, relics. */
  function inventoryTab() {
    save.mats = save.mats || { feather: 0, ore: 0, wood: 0 };
    const matCards = Object.keys(DATA.mats).map((k) => `<div class="inv-mat">
      <span class="im-ico">${DATA.mats[k].icon}</span>
      <b>${save.mats[k] || 0}</b>
      <small>${DATA.mats[k].name}</small>
    </div>`).join('');

    const potionCards = Object.keys(DATA.potions).map((k) => {
      const p = DATA.potions[k];
      const n = save.potions[k] || 0;
      return `<div class="inv-row ${n ? '' : 'empty'}">
        <span class="ir-ico">${p.icon}</span>
        <div class="ir-body"><b>${p.name}</b><small>${p.desc}</small></div>
        <span class="ir-count">×${n}</span>
      </div>`;
    }).join('');

    const owned = (save.blueprints || []).filter((id) => {
      const bp = DATA.blueprints.find((b) => b.id === id);
      return bp && bp.slot !== 'weapon' && bp.slot !== 'shield';
    });
    const bpCards = owned.length
      ? owned.map((id) => {
        const bp = DATA.blueprints.find((b) => b.id === id);
        if (!bp) return '';
        const done = bp.slot === 'weapon'
          ? (save.weapons || []).includes(bp.weaponId)
          : (gearOf(bp.heroId).helmet || 1) >= bp.tier;
        const mats = Object.keys(bp.mats || {}).map((k) => {
          const have = save.mats[k] || 0;
          const need = bp.mats[k];
          return `<span class="bp-mat ${have >= need ? 'ok' : 'no'}">${DATA.mats[k].icon} ${have}/${need}</span>`;
        }).join('');
        const coinCost = Math.round((bp.cost || 0) * 0.8);
        const canMats = Object.keys(bp.mats || {}).every((k) => (save.mats[k] || 0) >= bp.mats[k]);
        const can = !done && canMats && save.coins >= coinCost;
        return `<div class="bp-card ${done ? 'done' : ''}">
          <div class="bp-body">
            <span class="bp-tag">${bp.slot === 'weapon' ? '🗡️ Weapon blueprint' : '📜 Blueprint'}</span>
            <b>${bp.name}</b>
            <small>${bp.desc}</small>
            <div class="bp-mats">${mats}<span class="bp-mat ${save.coins >= coinCost ? 'ok' : 'no'}">🪙 ${coinCost}</span></div>
          </div>
          <button class="btn small ${can ? 'go' : 'ghost'}" data-craft="${bp.id}" ${can ? '' : 'disabled'}>
            ${done ? 'Crafted ✓' : can ? 'Craft' : 'Need mats'}
          </button>
        </div>`;
      }).join('')
      : '<div class="panel-note">No helmet blueprints yet. Weapon blueprints are forged at the Anvil.</div>';

    const unlockedHeroes = DATA.heroes.filter((h) => save.heroes.includes(h.id));
    if (!unlockedHeroes.some((h) => h.id === invPig)) {
      invPig = (save.party || []).find((id) => unlockedHeroes.some((h) => h.id === id)) || (unlockedHeroes[0] && unlockedHeroes[0].id) || '';
    }
    const selectedHero = DATA.heroes.find((h) => h.id === invPig) || null;
    const holderName = (id, map) => {
      const heroId = Object.keys(map || {}).find((k) => map[k] === id);
      const def = heroId && heroDef(heroId);
      return def ? def.name.replace(' Pig', '') : '';
    };

    /* One card per pig: click a pig, then pick from that pig's mini armoury. */
    const pigCards = unlockedHeroes.map((hero) => {
      const w = equippedWeapon(hero.id);
      const s = equippedShield(hero.id);
      const stats = DATA.heroStats(hero, pigLevel(hero.id), gearOf(hero.id), forgeOf(hero.id), save.charRelics[hero.id]);
      return `<button class="inv-pig ${invPig === hero.id ? 'on' : ''}" data-inv-pig="${hero.id}">
        <span class="ip-art">${Art.hero(hero.id, save.charRelics[hero.id], equippedWeaponId(hero.id), equippedShieldId(hero.id))}</span>
        <span class="ip-main"><b>${hero.name}</b><small>Lv ${pigLevel(hero.id)} · ${stats.maxHp} HP</small><em>${w ? `🗡️ ${w.name}` : 'No weapon'}${s ? ` · 🛡️ ${s.name}` : ''}</em></span>
      </button>`;
    }).join('');

    const loadoutWeapons = craftedWeaponList().filter((w) => !w.starterFor || w.starterFor === invPig);
    const loadoutShields = craftedShieldList().filter((s) => !s.starterFor || s.starterFor === invPig);
    const weaponTiles = loadoutWeapons.map((w) => {
      const holder = holderName(w.id, save.weaponEquip);
      const sigDef = w.starterFor && heroDef(w.starterFor);
      const locked = !!(w.starterFor && w.starterFor !== invPig);
      const fx = DATA.weaponEffects[w.proc] || { name: w.effect || 'Weapon' };
      return `<button class="loadout-item ${equippedWeaponId(invPig) === w.id ? 'on' : ''} ${locked ? 'signature' : ''}" data-give-weapon="${w.id}" data-tip="${weaponTip(w).replace(/"/g, '&quot;')}" ${locked ? 'disabled' : ''}>
        <span class="li-art">${itemArt('weapon', w)}</span><b>${w.name}</b><small>+${w.atk} base dmg · ${fx.name} 5%</small><em>${locked ? `🔒 ${sigDef ? sigDef.name.replace(' Pig', '') : 'Pig'}’s signature` : holder ? `Held by ${holder}` : 'Free'}</em>
      </button>`;
    }).join('');
    const shieldTiles = loadoutShields.map((s) => {
      const holder = holderName(s.id, save.shieldEquip);
      const sigDef = s.starterFor && heroDef(s.starterFor);
      const locked = !!(s.starterFor && s.starterFor !== invPig);
      return `<button class="loadout-item ${equippedShieldId(invPig) === s.id ? 'on' : ''} ${locked ? 'signature' : ''}" data-give-shield="${s.id}" ${locked ? 'disabled' : ''}>
        <span class="li-art">${itemArt('shield', s)}</span><b>${s.name}</b><small>+${s.hp} base HP</small><em>${locked ? `🔒 ${sigDef ? sigDef.name.replace(' Pig', '') : 'Pig'}’s signature` : holder ? `Held by ${holder}` : 'Free'}</em>
      </button>`;
    }).join('');
    const loadoutPanel = selectedHero ? `<div class="loadout-panel">
      <div class="lo-head">${Art.hero(selectedHero.id, save.charRelics[selectedHero.id], equippedWeaponId(selectedHero.id), equippedShieldId(selectedHero.id))}<div><b>${selectedHero.name}</b><span>Choose what this pig carries. Weapons and shields stay equipped — pick another to swap. One item can only be held by one pig.</span></div></div>
      <h4>Weapons</h4>
      <div class="loadout-grid">${weaponTiles || '<p class="panel-note">No weapons owned yet.</p>'}</div>
      <h4>Shields</h4>
      <div class="loadout-grid">${shieldTiles || '<p class="panel-note">No shields owned yet.</p>'}</div>
    </div>` : '<p class="panel-note">Recruit a pig to manage gear.</p>';

    const keyCards = (DATA.keyOrder || []).map((id) => {
      const k = DATA.keys[id];
      const owned = (save.keys || []).includes(id);
      const doors = DATA.worlds.reduce((n, w) => n + w.nodes.filter((x) => x.key === id).length, 0);
      return `<div class="key-card ${owned ? 'owned' : ''}" style="--key:${k.colour}">
        <span class="key-ico">${owned ? k.icon : '🔒'}</span>
        <div class="key-body"><b>${owned ? k.name : '??? Key'}</b><small>${owned ? k.blurb : `Tier ${k.tier} · ${doors} door${doors === 1 ? '' : 's'} sealed`}</small></div>
        <span class="key-tag">${owned ? `Tier ${k.tier}` : 'Missing'}</span>
      </div>`;
    }).join('');

    const bag = (save.relicBag || []).map((id) => {
      const r = DATA.relicById(id);
      if (!r) return '';
      return `<span class="inv-chip">💎 ${r.name}</span>`;
    }).join('') || '<span class="panel-note">No spare relics yet.</span>';

    return `<div class="panel-note">Everything the squad is carrying. Click a pig to open its mini inventory, then choose the weapon and shield it carries. Materials come from battles, and the three keys open the coloured side doors on every map.</div>
      <h3 class="base-h">Pig loadouts</h3>
      <div class="inv-pig-grid">${pigCards}</div>
      ${loadoutPanel}
      <h3 class="base-h">Keys</h3>
      <div class="inv-keys">${keyCards}</div>
      <h3 class="base-h">Materials</h3>
      <div class="inv-mats">${matCards}<div class="inv-mat"><span class="im-ico">🪙</span><b>${save.coins}</b><small>Coins</small></div></div>
      <h3 class="base-h">Battle items</h3>
      <div class="inv-list">${potionCards}</div>
      <h3 class="base-h">Helmet blueprints</h3>
      <div class="bp-list">${bpCards}</div>
      <h3 class="base-h">Spare relics</h3>
      <div class="inv-chips">${bag}</div>`;
  }

  function forgeTab() {
    return `<div class="panel-note">Relics come from star rewards and the endless dungeon. Spend them on permanent stats for each pig — they stack with gear.</div>
      <div class="forge-wallet">🏅 <b>${save.relics}</b> relics · ${DATA.relicForge.cost} per upgrade</div>
      <div class="forge-list">
        ${DATA.heroes.filter((h) => save.heroes.includes(h.id)).map((hero) => {
          const lvl = forgeOf(hero.id);
          const maxed = lvl >= DATA.relicForge.maxLevel;
          const can = !maxed && save.relics >= DATA.relicForge.cost;
          const stats = heroPower(hero);
          return `<div class="forge-card">
            ${Art.hero(hero.id, save.charRelics[hero.id], equippedWeaponId(hero.id), equippedShieldId(hero.id))}
            <div class="fc-body">
              <b>${hero.name}</b>
              <small>${stats.maxHp} HP</small>
              <span class="tier-pips">${'●'.repeat(lvl)}${'○'.repeat(DATA.relicForge.maxLevel - lvl)}</span>
            </div>
            <button class="btn small ${can ? '' : 'ghost'}" data-forge="${hero.id}" ${can ? '' : 'disabled'}>
              ${maxed ? 'Maxed' : `${DATA.relicForge.cost} 🏅`}
            </button>
          </div>`;
        }).join('')}
      </div>`;
  }

  function relicAction(id, done) {
    const r = DATA.relicById(id);
    if (!r) return;
    if (!isUnlockedHero(r.hero)) { SFX.play('nope'); toast(`${heroDef(r.hero).name} is still locked`, r.hero); return; }
    const owned = !!r.starter || save.relicBag.includes(id);
    if (!owned) {
      if ((save.relics || 0) < r.cost) {
        SFX.play('nope');
        toast(`Needs 🏅 ${r.cost} relics — you have ${save.relics || 0}`, r.hero);
        return;
      }
      save.relics -= r.cost;
      save.relicBag.push(id);
    }
    save.charRelics[r.hero] = id;
    SFX.play('unlock');
    toast(`${heroDef(r.hero).name} → ${r.name}`, r.hero);
    persist();
    if (done) done();
  }

  function relicCard(hero, r, equippedId, unlocked, reveal, buyable, shop) {
    const owned = !!r.starter || save.relicBag.includes(r.id);
    const equipped = equippedId === r.id;
    const price = shop ? relicShopPrice(r) : null;
    const can = unlocked && (owned || (price
      ? starBalance() >= price.stars && save.coins >= price.coins
      : buyable && (save.relics || 0) >= r.cost));
    const label = !unlocked ? 'Pig locked' : equipped ? 'Equipped' : owned ? 'Equip' : price ? `★ ${price.stars} · ${price.coins} 🪙` : buyable ? `🏅 ${r.cost}` : `🏅 ${r.cost} · vault`;
    /* A locked pig's relics stay as secret as its compendium card. */
    const known = unlocked && (owned || !!reveal);
    const rar = DATA.rarityOf(r);
    const action = price ? `data-shoprelic="${r.id}"` : `data-buyrelic="${r.id}"`;
    const title = owned ? 'Wear this relic' : price ? `Buy for ★ ${price.stars} and 🪙 ${price.coins}` : buyable ? 'Buy and wear it' : 'Only sold at a relic vault (end of a cave)';
    return `<div class="relic-card r-${rar.key}${equipped && unlocked ? ' on' : ''}${known ? '' : ' locked'}">
      <div class="relic-art">${known ? Art.hero(hero.id, r.id) : '<span class="relic-lock">🔒</span>'}</div>
      <div class="relic-body">
        <span class="relic-rarity" style="color:${rar.color};border-color:${rar.color}33">${rar.icon} ${rar.label}</span>
        <b>${known ? r.name : unlocked ? 'Unidentified relic' : '???'}</b>
        <small class="relic-skin">${known ? `🧵 ${r.skin} skin` : unlocked ? 'Not bought yet' : 'Meet the pig first'}</small>
        ${known ? `<p>${r.desc}</p>` : `<p class="relic-unknown">${unlocked ? 'Locked. Buy it from a relic merchant to see what it does.' : 'Find this pig on the road to reveal its relics.'}</p>`}
      </div>
      <button class="btn small ${equipped ? 'gold' : owned ? '' : 'ghost'}" ${action} title="${title}" ${equipped || !can ? 'disabled' : ''}>${label}</button>
    </div>`;
  }

  function relicsTab() {
    const pigs = DATA.heroes.map((hero) => {
      const unlocked = isUnlockedHero(hero.id);
      const list = DATA.relicsFor(hero.id);
      const equippedId = save.charRelics[hero.id] || (DATA.relicForHero(hero.id) || {}).id;
      const cards = list.map((r) => relicCard(hero, r, equippedId, unlocked)).join('');
      return `<div class="relic-pig">
        <div class="relic-pig-head">
          <span class="rph-art">${unlocked ? Art.hero(hero.id, equippedId) : '<span class="mystery">?</span>'}</span>
          <div><b>${unlocked ? hero.name : '???'}</b><span>${unlocked ? `${hero.role} · ${list.length} relics` : `🔒 ${heroUnlockHint(hero)}`}</span></div>
        </div>
        <div class="relic-grid">${cards}</div>
      </div>`;
    }).join('');
    return `
      <div class="forge-wallet">🏅 <b>${save.relics || 0}</b> relics · ◇ common free · ◆ rare ${DATA.rarities.rare.cost} 🏅 · ✦ unreal ${DATA.rarities.unreal.cost} 🏅 · ❖ mythic ${DATA.rarities.mythic.cost} 🏅</div>
      <div class="panel-note">Every pig carries 5 relics — one starter, three to buy and a legendary from the dungeons. The first is free and already equipped; the rest cost 🏅 relics (cave vaults, dungeon) and each one rewires attacks and dresses the pig up another rung.</div>
      ${pigs}`;
  }

  /* ============================================================
     Alchemy — potion grades
     ============================================================ */

  function potionTier(kind) {
    save.potionTier = save.potionTier || {};
    return save.potionTier[kind] || 1;
  }

  /* Brewing gets dearer with every grade bought, and cheaper with every buff
     pulled out of a keyed vault. */
  function brewPrice(id) {
    const r = DATA.recipes.find((x) => x.id === id);
    if (!r) return { herbs: 0, coins: 0 };
    const tier = potionTier(id);
    const discount = 1 - Math.min(0.4, 0.1 * (save.alchemyBuff || 0));
    return {
      herbs: Math.max(1, Math.ceil(r.herbs * (1 + 0.4 * (tier - 1)))),
      coins: Math.max(5, Math.round((r.coins * (1 + 0.55 * (tier - 1)) * discount) / 5) * 5),
    };
  }

  function upgradePotion(key) {
    const p = DATA.potions[key];
    if (!p) return;
    const tier = potionTier(key);
    const max = p.maxTier || 3;
    if (tier >= max) return;
    const price = DATA.potionTierCost(key, tier + 1);
    if (save.coins < price.coins || (save.relics || 0) < price.medals) {
      SFX.play('nope');
      toast(`Needs 🪙 ${price.coins} and 🏅 ${price.medals}`, null);
      return;
    }
    save.coins -= price.coins;
    save.stats.spent += price.coins;
    save.relics -= price.medals;
    save.potionTier[key] = tier + 1;
    SFX.play('levelup');
    toast(`${p.name} is grade ${tier + 1}`, null);
    persist();
    checkAchievements();
    renderBase();
  }

  function alchemyTab() {
    const buff = save.alchemyBuff || 0;
    const rows = Object.keys(DATA.potions).map((key) => {
      const p = DATA.potions[key];
      const tier = potionTier(key);
      const max = p.maxTier || 3;
      const maxed = tier >= max;
      const price = maxed ? null : DATA.potionTierCost(key, tier + 1);
      const can = !!price && save.coins >= price.coins && (save.relics || 0) >= price.medals;
      const pips = `${'●'.repeat(tier)}${'○'.repeat(Math.max(0, max - tier))}`;
      const grade = DATA.potionGradeText(key, tier);
      return `<div class="potion-card">
        <span class="pc-ico">${p.icon}</span>
        <div class="pc-body">
          <b>${p.name}${tier > 1 ? ` · grade ${tier}` : ''}</b>
          <small>${grade}</small>
          <span class="tier-pips">${pips}</span>
        </div>
        ${maxed
          ? `<span class="pc-count">${max === 1 ? 'Single grade' : 'Maxed'}</span>`
          : `<button class="btn small ${can ? '' : 'ghost'}" data-tier="${key}" ${can ? '' : 'disabled'}>🪙 ${price.coins} · 🏅 ${price.medals}</button>`}
      </div>`;
    }).join('');
    return `
      <div class="panel-note">Grades make a potion stronger, and every grade you buy makes brewing that potion <b>more expensive</b>. The XP tonic is too strong to improve. Alchemy buffs from keyed vaults cut brewing prices by 10% each.</div>
      <div class="forge-wallet">🏅 <b>${save.relics || 0}</b> medals · ⚗️ buff <b>${buff}</b> · −${Math.min(40, buff * 10)}% brewing</div>
      <div class="potion-list">${rows}</div>`;
  }

  /* A keyed branch pays its haul the moment the lock turns. */
  function grantKeyLoot(node) {
    const world = currentWorld();
    const id = world ? world.id : 1;
    const coinsWon = 350 + id * 150;
    const medals = 2 + id;
    save.coins += coinsWon;
    save.relics = (save.relics || 0) + medals;
    save.alchemyBuff = (save.alchemyBuff || 0) + 1;
    SFX.play('coin');
    toast(`Keyed vault: +${coinsWon} 🪙 · +${medals} 🏅 · alchemy buff ${save.alchemyBuff}`, null);
  }

  function pantryTab() {
    const potionCards = Object.keys(DATA.potions).map((key) => {
      const p = DATA.potions[key];
      const count = save.potions[key] || 0;
      const usable = key === 'xp' && count > 0;
      return `<div class="potion-card">
        <span class="pc-ico">${p.icon}</span>
        <div class="pc-body"><b>${p.name}</b><small>${p.desc}</small></div>
        <span class="pc-count">×${count}</span>
        ${usable ? `<button class="btn small" data-drink="${key}">Drink</button>` : ''}
      </div>`;
    }).join('');

    const recipes = DATA.recipes.map((r) => {
      const p = DATA.potions[r.id];
      const price = brewPrice(r.id);
      const can = save.herbs >= price.herbs && save.coins >= price.coins;
      return `<div class="recipe-row">
        <span class="pc-ico">${p.icon}</span>
        <div class="pc-body"><b>${r.name}</b><small>${r.desc}</small></div>
        <span class="recipe-cost">🌿 ${price.herbs} · 🪙 ${price.coins}</span>
        <button class="btn small ${can ? '' : 'ghost'}" data-brew="${r.id}" ${can ? '' : 'disabled'}>Brew</button>
      </div>`;
    }).join('');

    return `
      <div class="panel-note">Potions are free actions in battle. Brew more with herbs from fights.</div>
      <h3 class="base-h">Your pantry</h3>
      <div class="potion-list">${potionCards}</div>
      <h3 class="base-h">Crafting hut recipes</h3>
      <div class="potion-list">${recipes}</div>`;
  }

  function achievementsTab() {
    save.claimed = save.claimed || {};
    const tierOf = (a) => a.stars || 2;
    const row = (a) => {
      const got = !!save.achieved[a.id];
      const claimed = !!save.claimed[a.id];
      const claimable = got && !claimed;
      const right = claimable
        ? `<button class="btn small go" data-claim="${a.id}">Claim 🪙 ${a.reward}</button>`
        : `<span class="ach-state ${claimed ? 'paid' : ''}">${claimed ? 'Paid ✓' : got ? 'Unlocked' : `🪙 ${a.reward}`}</span>`;
      return `<div class="ach-row ${got ? 'got' : ''} ${claimed ? 'paid' : ''}">
        <span class="ach-ico">${got ? a.icon : '🔒'}</span>
        <div class="ach-body"><b>${a.name}</b><small>${a.desc}</small></div>
        <span class="ach-stars t${tierOf(a)}">${'★'.repeat(tierOf(a))}</span>
        ${right}
      </div>`;
    };
    /* Highest band first: the five-star feats headline the panel. */
    const groups = [5, 3, 2, 1].map((tier) => {
      /* Within a band: rank first (easiest at the top, hardest at the bottom),
         then declaration order for anything unranked. */
      const list = DATA.achievements
        .filter((a) => tierOf(a) === tier)
        .sort((a, b) => ((a.rank || 99) - (b.rank || 99)) || (DATA.achievements.indexOf(a) - DATA.achievements.indexOf(b)));
      if (!list.length) return '';
      const done = list.filter((a) => save.achieved[a.id]).length;
      const label = tier === 1 ? '1 star' : `${tier} stars`;
      return `<h3 class="base-h ach-tier t${tier}"><span>${'★'.repeat(tier)}</span> ${label} <em>${done}/${list.length}</em></h3>
        <div class="ach-list">${list.map(row).join('')}</div>`;
    }).join('');
    const total = DATA.achievements.length;
    const unlocked = DATA.achievements.filter((a) => save.achieved[a.id]).length;
    const openClaims = DATA.achievements.filter((a) => save.achieved[a.id] && !save.claimed[a.id]).length;
    return `<div class="panel-note">${unlocked} / ${total} unlocked${openClaims ? ` · ${openClaims} reward${openClaims === 1 ? '' : 's'} waiting` : ''}. Harder star bands pay more coins.</div>
      ${groups}`;
  }

  function indexTab() {
    const heroes = DATA.index.heroes.map((id) => {
      const h = heroDef(id);
      const known = isUnlockedHero(id);
      const gear = gearOf(id);
      const stats = DATA.heroStats(h, pigLevel(id), gear, forgeOf(id));
      const tip = known
        ? DATA.heroTip({ def: h, hp: stats.maxHp, maxHp: stats.maxHp, abilities: DATA.abilitiesFor(h, gear, save.charRelics[id], { level: pigLevel(id), atk: stats.atk, maxHp: stats.maxHp }), relic: save.charRelics[id] })
        : `<div class="tt-name">???</div><div class="tt-meta">Not recruited yet</div><div class="tt-trait">${heroUnlockHint(h)}</div>`;
      return `<div class="index-card ${known ? '' : 'locked'}" data-hero="${id}" role="button" tabindex="0" data-tip="${tip.replace(/"/g, '&quot;')}">
        ${known ? Art.hero(id, save.charRelics[id]) : '<span class="mystery">?</span>'}
        <b>${known ? h.name : '???'}</b>
        <span>${known ? h.title : 'Not recruited yet'}</span>
        <p>${known ? h.trait : heroUnlockHint(h)}</p>
        ${known ? `<div class="idx-stats">${stats.maxHp} HP</div>` : ''}
      </div>`;
    }).join('');

    /* Birds are grouped by the worlds they actually turn up in, built straight
       from the level table so the compendium can never drift from the battles. */
    /* One section per bird, decided by the bird's own world — a bird can never
       show up in two worlds here, and no bird can be listed twice. */
    const order = DATA.index.birds
      .filter((id) => DATA.enemies[id])
      .slice()
      .sort((a, b) => ((DATA.birdWorld[a] || 1) - (DATA.birdWorld[b] || 1)) || a.localeCompare(b));
    const worldOf = {};
    const dungeonOnly = new Set(DATA.dungeonBirds || []);
    order.forEach((id) => { worldOf[id] = DATA.birdWorld[id] ? [DATA.birdWorld[id]] : []; });

    const worldNames = { 1: 'Egg World', 2: 'Cuckoo Canyon', 3: 'Frost Peak', 4: 'Saltwind Shore', 5: 'Gilded Kingdom' };
    const birdCard = (id) => {
      const b = DATA.enemies[id];
      const known = !!save.seenBirds[id];
      const moves = (b.moves || []).map((m) => `${m.name}`).join(' · ');
      const where = dungeonOnly.has(id) ? 'Endless Dungeon' : ((worldOf[id] || []).map((w) => worldNames[w] || `World ${w}`).join(', ') || 'Boss lair');
      const tip = known
        ? DATA.enemyTip({ tpl: b, key: id, level: save.level, world: DATA.birdWorld[id] || 1 })
        : `<div class="tt-name">???</div><div class="tt-meta">Undiscovered</div><div class="tt-trait">Fight this bird to learn about it.</div>`;
      return `<div class="index-card ${known ? '' : 'locked'}" data-bird="${id}" role="button" tabindex="0" data-tip="${tip.replace(/"/g, '&quot;')}">
        ${known ? Art.enemy(b.art || id) : '<span class="mystery">?</span>'}
        <b>${known ? b.name : '???'}</b>
        <span>${known ? b.trait + (b.flying && !/dodge|flying/i.test(b.trait) ? ' · 💨 passive evade' : '') : 'Undiscovered'}</span>
        <p>${known ? b.lore : 'Fight this bird to learn about it.'}</p>
        ${known ? `<div class="idx-stats">${b.hp} HP</div>` : ''}
        ${known && moves ? `<div class="idx-moves">⚔️ ${moves}</div>` : ''}
        <div class="idx-world">📍 ${known ? where : 'Unknown'}</div>
      </div>`;
    };

    const birdSections = [1, 2, 3, 4, 5].map((w) => {
      const list = order.filter((id) => (worldOf[id] || []).includes(w));
      if (!list.length) return '';
      const seen = list.filter((id) => save.seenBirds[id]).length;
      return `<h4 class="idx-world-h">${worldNames[w]} <em>${seen}/${list.length} found</em></h4>
        <div class="index-grid">${list.map(birdCard).join('')}</div>`;
    }).join('');

    const dungeonList = order.filter((id) => dungeonOnly.has(id));
    const dungeonHtml = dungeonList.length
      ? `<h4 class="idx-world-h">Endless Dungeon <em>${dungeonList.filter((id) => save.seenBirds[id]).length}/${dungeonList.length} found</em></h4><div class="index-grid">${dungeonList.map(birdCard).join('')}</div>`
      : '';
    const strays = order.filter((id) => !(worldOf[id] || []).length && !dungeonOnly.has(id));
    const strayHtml = strays.length
      ? `<h4 class="idx-world-h">Elsewhere <em>${strays.length}</em></h4><div class="index-grid">${strays.map(birdCard).join('')}</div>`
      : '';

    return `<div class="panel-note">Everyone the pigs have met so far. Click any card to read its description, stats, attacks and weaknesses.</div>
      <h3 class="base-h">Pigs</h3><div class="index-grid">${heroes}</div>
      <h3 class="base-h">Birds</h3>${birdSections}${dungeonHtml}${strayHtml}`;
  }

  /* ============================================================
     Compendium detail
     ------------------------------------------------------------
     Clicking a bird or a pig in the compendium opens everything
     known about it: description, stats, attacks and weaknesses.
     ============================================================ */

  /* Every ability reads as one of three things, and the card colours follow
     the label: damage (pastel red), help for the squad (pastel blue), or a
     self-only passive (pastel green, tagged so it is never confused for a
     button you should be pressing). */
  function pigAbilityKind(a) {
    if (!a) return 'atk';
    if (a.passive) return 'passive';
    if (a.target === 'enemy' || a.target === 'allEnemies') return 'atk';
    if (a.target === 'self' && !a.healParty && !a.shieldParty) return 'passive';
    return 'help';
  }

  function birdMoveKind(m) {
    if (!m) return 'atk';
    if (m.kind === 'self') return 'passive';
    if (m.kind === 'healAlly' || m.kind === 'shieldAll') return 'help';
    return 'atk';
  }

  function moveWords(m) {
    const bits = [];
    if (m.kind === 'aoe') bits.push('hits the whole squad');
    if (m.kind === 'multi') bits.push('hits ' + (m.hits || 2) + ' times');
    if (m.kind === 'focus') bits.push('marks a pig for the flock');
    if (m.kind === 'summon') bits.push('calls more birds in');
    if (m.kind === 'healAlly') bits.push('heals a hurt bird');
    if (m.kind === 'shieldAll') bits.push('shields the whole flock');
    if (m.kind === 'charge') bits.push('winds up for ' + (m.rounds || 3) + ' rounds' + (m.all ? ', then slams the whole squad' : ''));
    if (m.kind === 'self') bits.push(m.power ? 'frenzies — every hit deals +' + m.power : m.veil ? 'blurs out of phase — 80% of attacks miss' : 'drifts out of reach');
    /* Each status is spelled out: how long it lasts and what it actually does
       to the pig, instead of a bare verb. */
    bits.push(...DATA.moveEffects(m));
    if (m.cd) bits.push('charges over ' + m.cd + ' rounds');
    if (m.mult) {
      const spread = m.kind === 'multi' ? ' per hit' : (m.kind === 'aoe' || (m.kind === 'charge' && m.all)) ? ' to each pig' : '';
      /* The card quotes the wound itself at this bird's attack power, so an
         attack reads "34 damage" rather than a share of an unseen stat. */
      const hit = m._atk ? Math.max(1, Math.round(m._atk * m.mult)) : null;
      bits.push(hit != null ? hit + ' damage' + spread : Math.round(m.mult * 100) + '% of its damage' + spread);
    }
    return bits.join(' · ') || 'a straight hit';
  }

  const DETAIL_WORLDS = { 1: 'Egg World', 2: 'Cuckoo Canyon', 3: 'Frost Peak', 4: 'Saltwind Shore', 5: 'Gilded Kingdom' };

  function closeDetailSheet() {
    const btn = el.overlay.querySelector('#ovCancel');
    if (btn) btn.addEventListener('click', closeOverlay);
  }

  function openBirdCard(id) {
    const b = DATA.enemies[id];
    if (!b) return;
    if (!save.seenBirds[id]) {
      openSheet(`<div class="eyebrow">Undiscovered</div><h2>???</h2>
        <p>Fight this bird to learn its HP, attacks, traits and weaknesses.</p>
        <div class="sheet-actions"><button class="btn ghost" id="ovCancel">Back</button></div>`);
      closeDetailSheet();
      return;
    }
    const where = b.dungeonOnly ? 'Endless Dungeon' : (DETAIL_WORLDS[DATA.birdWorld[id] || 1] || ('World ' + (DATA.birdWorld[id] || 1)));
    /* The card quotes what this bird would actually swing at your level, not
       just its percentages. */
    const atk = DATA.birdAtkFor(b, save.level, DATA.birdWorld[id] || 1);
    const moves = (b.moves || []).map((m) => {
      const kind = birdMoveKind(m);
      const tag = kind === 'passive' ? '<span class="mv-tag">[Passive]</span>' : '';
      return `<div class="mv ${kind}"><b>${tag}${m.icon || '⚔️'} ${m.name}</b><span>${moveWords(Object.assign({}, m, { _atk: atk }))}</span></div>`;
    }).join('');
    openSheet(`
      <div class="entry-detail bird-detail">
        <div class="entry-art">${Art.enemy(b.art || id)}</div>
        <div class="entry-body">
          <div class="eyebrow">${where} · ${b.boss ? 'Boss' : 'Bird'}</div>
          <h2>${b.name}</h2>
          <p>${b.lore}</p>
          <div class="reward-line"><span>Trait</span><b>${b.trait}</b></div>
          <div class="reward-line"><span>Stats</span><b>${b.hp} HP at Lv ${save.level}</b></div>
          <div class="reward-line"><span>Found in</span><b>📍 ${where}</b></div>
          ${b.boss ? '<div class="reward-line"><span>Summons</span><b>🥚 a fresh bird every 2 rounds</b></div>' : ''}
          ${(() => { const g = DATA.ghostFor && DATA.ghostFor(id); return g ? `<div class="reward-line"><span>Ghost</span><b>${g.icon} ${g.name} — ${g.blurb}</b></div>` : ''; })()}
          <h3 class="base-h">Attacks</h3>
          <div class="entry-moves">${moves || '<div class="mv"><b>💣 Fuse</b><span>lights a fuse and blows up the squad</span></div>'}</div>
          <p class="tip-line">🧪 ${DATA.resistLine('birds', id)}</p>
        </div>
      </div>
      <div class="sheet-actions"><button class="btn gold" id="ovCancel">Back</button></div>
    `, { wide: true });
    closeDetailSheet();
  }

  function openHeroCard(id) {
    const h = heroDef(id);
    if (!h) return;
    if (!isUnlockedHero(id)) {
      openSheet(`<div class="eyebrow">Not recruited</div><h2>???</h2>
        <p>${heroUnlockHint(h)}</p>
        <div class="sheet-actions"><button class="btn ghost" id="ovCancel">Back</button></div>`);
      closeDetailSheet();
      return;
    }
    const heroLv = pigLevel(id);
    const stats = DATA.heroStats(h, heroLv, gearOf(id), forgeOf(id));
    /* The card quotes the damage each move lands at this pig's level, so the
       number is on the card instead of a percentage nobody can size up. */
    const abil = DATA.abilitiesFor(h, gearOf(id), save.charRelics[id], { level: heroLv, atk: Math.round(stats.atk), maxHp: stats.maxHp })
      .map((a) => {
        const kind = pigAbilityKind(a);
        const tag = kind === 'passive' ? '<span class="mv-tag">[Passive]</span>' : '';
        return `<div class="mv ${kind}"><b>${tag}${a.icon || ''} ${a.name}</b><span>${a.desc || ''}</span></div>`;
      }).join('');
    const relic = save.charRelics[id] ? DATA.relicById(save.charRelics[id]) : null;
    openSheet(`
      <div class="entry-detail pig-detail">
        <div class="entry-art">${Art.hero(id, save.charRelics[id])}</div>
        <div class="entry-body">
          <div class="eyebrow">${h.role || 'Pig'} · Lv ${heroLv}</div>
          <h2>${h.name}</h2>
          <span class="entry-title">${h.title || ''}</span>
          <p>${h.trait || ''}</p>
          <div class="reward-line"><span>Stats</span><b>${stats.maxHp} HP</b></div>
          <div class="reward-line"><span>XP</span><b>${pigXp(id)} / ${pigXpNeed(id)}${heroLv >= MAX_LEVEL ? ' · max level' : ` · next Lv in ${Math.max(0, pigXpNeed(id) - pigXp(id))}`}</b></div>
          <div class="pig-xp"><span class="track"><i style="width:${pigXpPct(id)}%"></i></span><em>${pigXpPct(id)}% to Lv ${heroLv + 1}</em></div>
          ${relic ? `<div class="reward-line"><span>Relic</span><b>${relic.name}</b></div>` : ''}
          <h3 class="base-h">Abilities</h3>
          <div class="entry-moves">${abil}</div>
          <p class="tip-line">🧪 ${DATA.resistLine('heroes', id)}</p>
        </div>
      </div>
      <div class="sheet-actions"><button class="btn gold" id="ovCancel">Back</button></div>
    `, { wide: true });
    closeDetailSheet();
  }

  /* One delegated listener, so the cards keep working after every tab
     re-render (the old nodes and their handlers are thrown away each time). */
  function wireCompendiumClicks() {
    if (document.body.dataset.compendiumWired === '1') return;
    document.body.dataset.compendiumWired = '1';
    const openFrom = (ev) => {
      const node = ev.target && ev.target.closest ? ev.target.closest('[data-bird], [data-hero]') : null;
      if (!node) return;
      if (node.dataset.bird) openBirdCard(node.dataset.bird);
      else if (node.dataset.hero) openHeroCard(node.dataset.hero);
    };
    document.addEventListener('click', openFrom);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') openFrom(ev);
    });
  }

  function wireBase(body) {
    wireCompendiumClicks();
    body.querySelectorAll('[data-party]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.party;
        if (save.party.includes(id)) {
          if (save.party.length <= 1) return;
          save.party = save.party.filter((x) => x !== id);
        } else {
          if (save.party.length >= MAX_PARTY) {
            SFX.play('nope');
            toast('The squad already has three pigs. Remove one first.', null);
            return;
          }
          save.party.push(id);
        }
        SFX.play('select');
        persist();
        renderBase();
      })
    );
    body.querySelectorAll('[data-train]').forEach((btn) =>
      btn.addEventListener('click', () => trainUp(btn.dataset.train))
    );
    body.querySelectorAll('[data-upgrade]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const [heroId, slot] = btn.dataset.upgrade.split(':');
        startUpgrade(heroId, slot);
      })
    );
    body.querySelectorAll('[data-claim]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.claim;
        const ach = DATA.achievements.find((a) => a.id === id);
        if (!ach || !save.achieved[id]) return;
        save.claimed = save.claimed || {};
        if (save.claimed[id]) return;
        save.claimed[id] = true;
        save.coins += ach.reward;
        SFX.play('coin');
        toast(`+${ach.reward} 🪙 · ${ach.name}`);
        persist();
        /* Swap just this row's button: re-rendering the tab scrolled the list
           back to the top after every claim. */
        const row = btn.closest('.ach-row');
        if (row) {
          row.classList.add('paid');
          btn.outerHTML = '<span class="ach-state paid">Paid ✓</span>';
        }
      })
    );
    body.querySelectorAll('[data-anvil-kind]').forEach((btn) =>
      btn.addEventListener('click', () => {
        anvilKind = btn.dataset.anvilKind === 'shield' ? 'shield' : 'weapon';
        SFX.play('select');
        renderBase();
      })
    );
    body.querySelectorAll('[data-anvil-pig]').forEach((btn) =>
      btn.addEventListener('click', () => {
        anvilPig = btn.dataset.anvilPig;
        SFX.play('select');
        renderBase();
      })
    );
    body.querySelectorAll('[data-anvil-spin]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const count = Number(btn.dataset.anvilSpin) === 10 ? 10 : 1;
        const cost = DATA.anvilSpinCosts[count] || 400;
        if (save.coins < cost) { SFX.play('nope'); return; }
        const owned = new Set(save.blueprints || []);
        const made = new Set(save.weapons || []);
        const carried = new Set(save.shields || []);
        const pool = [
          ...DATA.anvilWeapons
            .filter((w) => save.heroes.includes(w.forHero) && !owned.has(`bp-${w.id}`) && !made.has(w.id))
            .map((item) => ({ kind: 'weapon', item })),
          ...DATA.anvilShields
            .filter((s) => !owned.has(`bp-${s.id}`) && !carried.has(s.id))
            .map((item) => ({ kind: 'shield', item })),
        ];
        if (!pool.length) { toast('Every available blueprint is already found'); return; }
        if (count === 10 && pool.length < 10) { SFX.play('nope'); toast('Need at least 10 missing blueprints for a 10-pull'); return; }
        const bag = pool.slice();
        const drops = [];
        for (let i = 0; i < count && bag.length; i += 1) {
          drops.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
        }
        save.coins -= cost;
        save.stats.spent = (save.stats.spent || 0) + cost;
        save.blueprints = save.blueprints || [];
        drops.forEach((drop) => save.blueprints.push(`bp-${drop.item.id}`));
        const lastDrop = drops[drops.length - 1];
        save.flags.lastAnvil = lastDrop.item.id;
        SFX.play('unlock');
        toast(drops.length === 1 ? `Blueprint found: ${lastDrop.item.name}` : `${drops.length} blueprints found — last: ${lastDrop.item.name}`, lastDrop.item.forHero);
        persist();
        checkAchievements();
        renderBase();
      })
    );
    body.querySelectorAll('[data-craft]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const bp = DATA.blueprints.find((b) => b.id === btn.dataset.craft);
        if (!bp || !(save.blueprints || []).includes(bp.id)) return;
        const isHelmet = bp.slot !== 'weapon' && bp.slot !== 'shield';
        const gear = isHelmet ? gearOf(bp.heroId) : null;
        const already = bp.slot === 'weapon'
          ? (save.weapons || []).includes(bp.weaponId)
          : bp.slot === 'shield'
            ? (save.shields || []).includes(bp.shieldId)
            : (gear.helmet || 1) >= bp.tier;
        if (already) { SFX.play('nope'); return; }
        const coinCost = Math.round((bp.cost || 0) * 0.8);
        const mats = bp.mats || {};
        const canMats = Object.keys(mats).every((k) => (save.mats[k] || 0) >= mats[k]);
        if (!canMats || save.coins < coinCost) { SFX.play('nope'); toast('Not enough materials', bp.heroId); return; }
        Object.keys(mats).forEach((k) => { save.mats[k] -= mats[k]; });
        save.coins -= coinCost;
        save.stats.spent = (save.stats.spent || 0) + coinCost;
        if (bp.slot === 'weapon') {
          save.weapons = save.weapons || [];
          save.weapons.push(bp.weaponId);
          const weapon = DATA.craftedWeaponById(bp.weaponId);
          toast(`Forged ${weapon.name} — hand it to a pig in Inventory`, null);
        } else if (bp.slot === 'shield') {
          save.shields = save.shields || [];
          save.shields.push(bp.shieldId);
          const shield = DATA.craftedShieldById(bp.shieldId);
          toast(`Forged ${shield.name} — hand it to a pig in Inventory`, null);
        } else {
          save.gear[bp.heroId] = { ...gear, helmet: bp.tier };
          toast(`Crafted ${bp.name}`, bp.heroId);
        }
        SFX.play('unlock');
        persist();
        checkAchievements();
        renderBase();
      })
    );
    body.querySelectorAll('[data-inv-pig]').forEach((btn) =>
      btn.addEventListener('click', () => {
        invPig = btn.dataset.invPig;
        SFX.play('select');
        renderBase();
      })
    );
    body.querySelectorAll('[data-give-weapon]').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (!invPig) return;
        equipWeapon(invPig, btn.dataset.giveWeapon || '');
        SFX.play(btn.dataset.giveWeapon ? 'select' : 'click');
        persist();
        checkAchievements();
        renderBase();
      })
    );
    body.querySelectorAll('[data-give-shield]').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (!invPig) return;
        equipShield(invPig, btn.dataset.giveShield || '');
        SFX.play(btn.dataset.giveShield ? 'select' : 'click');
        persist();
        checkAchievements();
        renderBase();
      })
    );
    body.querySelectorAll('[data-weapon-for]').forEach((sel) =>
      sel.addEventListener('change', () => {
        const weaponId = sel.dataset.weaponFor;
        const heroId = sel.value;
        if (heroId) equipWeapon(heroId, weaponId);
        else clearWeapon(weaponId);
        SFX.play('select');
        persist();
        renderBase();
      })
    );
    body.querySelectorAll('[data-shield-for]').forEach((sel) =>
      sel.addEventListener('change', () => {
        const shieldId = sel.dataset.shieldFor;
        const heroId = sel.value;
        if (heroId) equipShield(heroId, shieldId);
        else clearShield(shieldId);
        SFX.play('select');
        persist();
        renderBase();
      })
    );
    body.querySelectorAll('[data-weapon-pig]').forEach((sel) =>
      sel.addEventListener('change', () => {
        const heroId = sel.dataset.weaponPig;
        if (!save.heroes.includes(heroId)) return;
        equipWeapon(heroId, sel.value || '');
        SFX.play('select');
        persist();
        renderBase();
      })
    );
    body.querySelectorAll('[data-forge]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.forge;
        if (!id || !save.heroes.includes(id)) return;
        if (save.relics < DATA.relicForge.cost) { SFX.play('nope'); return; }
        if (forgeOf(id) >= DATA.relicForge.maxLevel) return;
        save.relics -= DATA.relicForge.cost;
        save.forge[id] = forgeOf(id) + 1;
        checkAchievements();
        SFX.play('unlock');
        persist();
        renderBase();
      })
    );
    body.querySelectorAll('[data-dice]').forEach((btn) =>
      btn.addEventListener('click', () => {
        SFX.play('click');
        openDieSheet(btn.dataset.dice);
      })
    );
    body.querySelectorAll('[data-brew]').forEach((btn) =>
      btn.addEventListener('click', () => brew(btn.dataset.brew))
    );
    body.querySelectorAll('[data-buyrelic]').forEach((btn) =>
      btn.addEventListener('click', () => relicAction(btn.dataset.buyrelic, () => renderBase()))
    );
    body.querySelectorAll('[data-tier]').forEach((btn) =>
      btn.addEventListener('click', () => upgradePotion(btn.dataset.tier))
    );
    body.querySelectorAll('[data-drink]').forEach((btn) =>
      btn.addEventListener('click', () => drink(btn.dataset.drink))
    );
  }

  /* ---------------- Workshop dice ----------------
     Every pig owns one saved die, shown beside their name in the workshop. A
     six makes that pig's next upgrade free, so the face is worth chasing: tap
     the die and it offers a reroll for about half the price of the tier that
     pig is buying next (half of tier five once everything is maxed). */
  function diceRoll() {
    return 1 + Math.floor(Math.random() * 6);
  }

  const DIE_PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function dieFace(value) {
    const on = DIE_PIPS[value] || [];
    return `<span class="die-pips" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i class="${on.includes(i) ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function dieOf(heroId) {
    save.dice = save.dice || {};
    if (!save.dice[heroId]) save.dice[heroId] = diceRoll();
    return save.dice[heroId];
  }

  function dieNextCost(hero) {
    const gear = gearOf(hero.id);
    const prices = ['weapon', 'helmet']
      .map((slot) => {
        const table = slot === 'weapon' ? hero.weapon : hero.helmet;
        const tier = gear[slot];
        return tier < 5 ? table.cost[tier] : table.cost[table.cost.length - 1];
      })
      .filter((p) => p > 0);
    const price = prices.length ? Math.min(...prices) : 100;
    return Math.max(20, Math.round((price * 0.6) / 10) * 10);
  }

  function openDieSheet(heroId) {
    const hero = heroDef(heroId);
    if (!hero) return;
    const face = dieOf(heroId);
    const gear = gearOf(heroId);
    const maxed = gear.weapon >= 5 && gear.helmet >= 5;
    const cost = dieNextCost(hero);
    const can = save.coins >= cost;
    openSheet(`
      <div class="eyebrow">${hero.name}</div>
      <h2>Reroll this die?</h2>
      <div class="dice-result"><span class="die" role="img" aria-label="Die showing ${face}">${dieFace(face)}</span></div>
      <p>${face === 6
        ? '<b>A six is showing — the next upgrade is free.</b>'
        : 'A six would make the next upgrade free.'}</p>
      <p>Rerolling costs <b>${cost} 🪙</b> — about half the price of ${maxed ? 'tier five' : 'the tier you are buying next'}. You have ${save.coins} 🪙.</p>
      <div class="sheet-actions">
        <button class="btn ${can ? '' : 'ghost'}" id="diceYes" ${can ? '' : 'disabled'}>Reroll · ${cost} 🪙</button>
        <button class="btn ghost" id="diceNo">No</button>
      </div>
    `);
    el.overlay.querySelector('#diceNo').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
    });
    el.overlay.querySelector('#diceYes').addEventListener('click', () => {
      if (save.coins < cost) { SFX.play('nope'); return; }
      save.coins -= cost;
      save.stats.spent += cost;
      save.dice[heroId] = diceRoll();
      if (save.dice[heroId] === 6) save.flags.lucky = true;
      SFX.play('dice');
      persist();
      checkAchievements();
      closeOverlay();
      renderBase();
      toast(`${hero.name} rolled a ${save.dice[heroId]}`, heroId);
    });
  }

  function startUpgrade(heroId, slot) {
    const hero = heroDef(heroId);
    if (!hero) return;
    const gear = gearOf(heroId);
    save.gear[heroId] = gear;
    const tier = gear[slot];
    if (tier >= 5) return;
    const table = slot === 'weapon' ? hero.weapon : hero.helmet;
    const cost = table.cost[tier];

    if (!cost || save.coins < cost) {
      SFX.play('nope');
      return;
    }

    /* The die you walked in with decides the price, then rerolls itself. */
    const face = dieOf(heroId);
    const free = face === 6;
    save.coins -= cost;
    save.stats.spent += cost;
    if (free) {
      save.coins += cost;
      save.stats.spent -= cost;
      save.flags.lucky = true;
    }
    gear[slot] = tier + 1;
    save.dice[heroId] = diceRoll();
    const next = save.dice[heroId];
    persist();
    checkAchievements();

    SFX.play('dice');
    /* Repaint the workshop behind the result sheet now, so the card shows the
       tier that was just bought instead of the one it replaced. */
    renderBase();
    const name = slot === 'weapon' ? `${hero.weapon.name} Mk ${gear[slot]}` : hero.helmet.tiers[gear[slot] - 1].name;
    openSheet(`
      <div class="eyebrow">Workshop</div>
      <h2>${slot === 'weapon' ? 'Weapon upgraded' : 'Helmet upgraded'}</h2>
      <div class="dice-result"><span class="die" role="img" aria-label="Die showing ${face}">${dieFace(face)}</span></div>
      <p><b>${hero.name}</b> now has <b>${name}</b> — tier ${gear[slot]} of 5.</p>
      ${free ? '<p class="lucky">A six! This upgrade was free — coins refunded.</p>' : '<p>Full price. The die rolls again for next time.</p>'}
      <div class="dice-note">Next die: <b class="die-mini" role="img" aria-label="Next die ${next}">${dieFace(next)}</b>${next === 6 ? ' — a free upgrade is waiting' : ''}</div>
      <div class="sheet-actions">
        <button class="btn" id="ovClose">Nice</button>
        <button class="btn ghost" id="ovAgain" ${gear[slot] >= 5 ? 'disabled' : ''}>Upgrade again</button>
      </div>
    `);
    el.overlay.querySelector('#ovClose').addEventListener('click', () => {
      closeOverlay();
      renderBase();
    });
    const again = el.overlay.querySelector('#ovAgain');
    if (again && !again.disabled) {
      again.addEventListener('click', () => {
        SFX.play('click');
        closeOverlay();
        renderBase();
        startUpgrade(heroId, slot);
      });
    }
    SFX.play('levelup');
  }
  function brew(id) {
    const recipe = DATA.recipes.find((r) => r.id === id);
    if (!recipe) return;
    const price = brewPrice(id);
    if (save.herbs < price.herbs || save.coins < price.coins) { SFX.play('nope'); return; }
    save.herbs -= price.herbs;
    save.coins -= price.coins;
    save.potions[id] = (save.potions[id] || 0) + 1;
    save.stats.brews += 1;
    SFX.play('potion');
    persist();
    renderBase();
  }

  function drink(id) {
    if (id !== 'xp' || !save.potions.xp) return;
    save.potions.xp -= 1;
    const ups = addXp(90);
    SFX.play('levelup');
    toast(`+90 XP${ups ? ' · party level up!' : ''}`, null);
    persist();
    renderBase();
  }

  /* ============================================================
     Shop & crafting nodes
     ============================================================ */

  let vaultPig = null;

  function buyRelicFromShop(id, done) {
    const r = DATA.relicById(id);
    if (!r) return;
    if (!isUnlockedHero(r.hero)) { SFX.play('nope'); toast(`${heroDef(r.hero).name} is still locked`, r.hero); return; }
    const owned = !!r.starter || save.relicBag.includes(id);
    if (!owned) {
      const price = relicShopPrice(r);
      if (starBalance() < price.stars || save.coins < price.coins) {
        SFX.play('nope');
        toast(`Needs ★ ${price.stars} and 🪙 ${price.coins} — you have ★ ${starBalance()} and 🪙 ${save.coins}`, r.hero);
        return;
      }
      save.starsSpent = (save.starsSpent || 0) + price.stars;
      save.coins -= price.coins;
      save.stats.spent = (save.stats.spent || 0) + price.coins;
      save.relicBag.push(id);
    }
    save.charRelics[r.hero] = id;
    SFX.play('unlock');
    toast(`${heroDef(r.hero).name} → ${r.name}`, r.hero);
    persist();
    checkAchievements();
    if (done) done();
  }

  function openRelicShop(world) {
    const pigs = DATA.heroes.filter((h) => isUnlockedHero(h.id));
    if (!pigs.length) { closeOverlay(); return; }
    if (!vaultPig || !pigs.some((p) => p.id === vaultPig)) vaultPig = pigs[0].id;
    const hero = heroDef(vaultPig);
    const shopMode = !!world;
    const maxTier = world && world.id === 1 ? 2 : 3;
    const stock = DATA.relicsFor(hero.id).filter((r) => !shopMode || r.starter || ((r.tier || 1) >= 2 && (r.tier || 1) <= maxTier));
    const equippedId = save.charRelics[hero.id] || (DATA.relicForHero(hero.id) || {}).id;
    const cards = stock.map((r) => relicCard(hero, r, equippedId, true, true, !shopMode, shopMode)).join('');
    const tabs = pigs.map((h) => {
      const id = save.charRelics[h.id] || (DATA.relicForHero(h.id) || {}).id;
      return `<button class="vault-tab ${h.id === hero.id ? 'on' : ''}" data-vaultpig="${h.id}" title="${h.name}">${Art.hero(h.id, id)}<span>${h.name.split(' ')[0]}</span></button>`;
    }).join('');
    const legend = Object.keys(DATA.rarities).map((k) => {
      const r = DATA.rarities[k];
      return `<span style="color:${r.color}">${r.icon} ${r.label} — ${r.blurb}</span>`;
    }).join('');
    const wallet = shopMode
      ? `<div class="forge-wallet">★ <b>${starBalance()}</b> available · 🪙 <b>${save.coins}</b></div>`
      : `<div class="forge-wallet">🏅 <b>${save.relics || 0}</b></div>`;
    const note = shopMode
      ? `<div class="panel-note">${world.name} relic stock — unlocked by reaching this merchant. Relics cost stars and coins; spent stars never close a world gate.</div>`
      : '<div class="panel-note">Dungeon relic vault. Buy relics with 🏅 medals.</div>';
    openSheet(`
      <div class="vault-head">
        <div class="vault-title"><span class="eyebrow">💎 ${shopMode ? 'Relic merchant' : 'Relic vault'}</span><h2>${hero.name}</h2></div>
        ${wallet}
      </div>
      ${note}
      <div class="vault-tabs">${tabs}</div>
      <div class="relic-grid">${cards}</div>
      <div class="vault-legend">${legend}</div>
      <div class="sheet-actions"><button class="btn ghost" id="ovClose">Leave</button></div>
    `, { compact: true });
    el.overlay.querySelector('#ovClose').addEventListener('click', () => { SFX.play('click'); closeOverlay(); });
    el.overlay.querySelectorAll('[data-vaultpig]').forEach((btn) =>
      btn.addEventListener('click', () => {
        SFX.play('click');
        vaultPig = btn.dataset.vaultpig;
        openRelicShop();
      })
    );
    el.overlay.querySelectorAll('[data-buyrelic]').forEach((btn) =>
      btn.addEventListener('click', () => relicAction(btn.dataset.buyrelic, () => openRelicShop(world)))
    );
    el.overlay.querySelectorAll('[data-shoprelic]').forEach((btn) =>
      btn.addEventListener('click', () => buyRelicFromShop(btn.dataset.shoprelic, () => openRelicShop(world)))
    );
  }

  function matCost(bp) {
    return Object.keys(bp.mats || {}).map((k) => `${bp.mats[k]} ${DATA.mats[k].icon}`).join(' ');
  }

  function hasMats(bp) {
    if (save.blueprints.includes(bp.id)) return false;
    if (save.coins < bp.cost) return false;
    const mats = save.mats || {};
    return Object.keys(bp.mats || {}).every((k) => (mats[k] || 0) >= bp.mats[k]);
  }

  /* --- Armoury shop: distinct silhouettes per weapon and shield type --- */
  function itemArt(kind, itemOrColour) {
    const item = itemOrColour && typeof itemOrColour === 'object' ? itemOrColour : null;
    const colour = item ? item.colour : itemOrColour;
    if (kind === 'shield') {
      const shape = (item && item.shape) || 'round';
      const shields = {
        round: `<path d="M24 3 L42 10 V27 C42 39 34 48 24 53 C14 48 6 39 6 27 V10 Z" fill="${colour}" stroke="#4a3218" stroke-width="3"/><path d="M24 8 L37 13 V27 C37 36 31 43 24 47 Z" fill="#fff" opacity=".22"/><path d="M24 14 L24 40 M15 24 L33 24" stroke="#4a3218" stroke-width="2.4" opacity=".6"/>`,
        tower: `<path d="M9 4 H39 V29 L24 53 L9 29 Z" fill="${colour}" stroke="#4a3218" stroke-width="3"/><path d="M24 7 V47 M13 15 H35 M13 24 H35" stroke="#4a3218" stroke-width="2" opacity=".55"/><path d="M14 4 V9 H20 V4 M28 4 V9 H34 V4" fill="none" stroke="#4a3218" stroke-width="2"/>`,
        aegis: `<path d="M24 3 L42 10 V27 C42 39 34 48 24 53 C14 48 6 39 6 27 V10 Z" fill="${colour}" stroke="#4a3218" stroke-width="3"/><path d="M13 13 L18 6 L24 11 L30 6 L35 13" fill="none" stroke="#4a3218" stroke-width="2.4"/><circle cx="24" cy="29" r="8" fill="none" stroke="#4a3218" stroke-width="2.2" opacity=".65"/>`,
        tray: `<rect x="8" y="8" width="32" height="32" rx="5" fill="${colour}" stroke="#4a3218" stroke-width="3"/><path d="M4 14 H8 M40 14 H44 M4 34 H8 M40 34 H44" stroke="#4a3218" stroke-width="3" stroke-linecap="round"/><path d="M16 17 H32 M16 26 H32" stroke="#4a3218" stroke-width="2" opacity=".5"/>`,
        lid: `<ellipse cx="24" cy="30" rx="20" ry="19" fill="${colour}" stroke="#4a3218" stroke-width="3"/><circle cx="24" cy="9" r="5" fill="${colour}" stroke="#4a3218" stroke-width="2.5"/><path d="M11 31 H37 M14 23 C18 18 30 18 34 23" fill="none" stroke="#4a3218" stroke-width="2" opacity=".55"/>`,
        rivet: `<path d="M9 6 H39 V36 L24 52 L9 36 Z" fill="${colour}" stroke="#4a3218" stroke-width="3"/><circle cx="15" cy="13" r="2.2" fill="#4a3218"/><circle cx="33" cy="13" r="2.2" fill="#4a3218"/><circle cx="15" cy="34" r="2.2" fill="#4a3218"/><circle cx="33" cy="34" r="2.2" fill="#4a3218"/><path d="M24 17 V37" stroke="#4a3218" stroke-width="2" opacity=".5"/>`,
        rune: `<path d="M24 3 L42 14 V35 L24 53 L6 35 V14 Z" fill="${colour}" stroke="#4a3218" stroke-width="3"/><path d="M24 14 V39 M16 23 H32 M18 32 L24 38 L30 32" fill="none" stroke="#4a3218" stroke-width="2.4"/><circle cx="24" cy="23" r="2.4" fill="#fff" opacity=".55"/>`,
      };
      return `<svg viewBox="0 0 48 56" class="item-art shield-${shape}" aria-hidden="true">${shields[shape] || shields.round}</svg>`;
    }
    const shape = (item && (item.shape || item.proc)) || 'blade';
    const weapons = {
      hammer: `<path d="M24 25 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><rect x="13" y="9" width="22" height="15" rx="4" fill="#c4ced8" stroke="#4a3218" stroke-width="2.4"/><path d="M18 14 H30" stroke="#fff" stroke-width="2" opacity=".65"/>`,
      maul: `<path d="M24 27 V50" stroke="#8a5a2c" stroke-width="6" stroke-linecap="round"/><rect x="8" y="5" width="32" height="22" rx="4" fill="#aeb9c6" stroke="#4a3218" stroke-width="2.6"/><path d="M14 13 H34 M14 20 H34" stroke="#fff" stroke-width="2" opacity=".4"/>`,
      mace: `<path d="M24 26 V50" stroke="#6d4a26" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="18" r="13" fill="#aeb6c4" stroke="#4a3218" stroke-width="2.6"/><path d="M24 1 V7 M24 29 V35 M6 18 H12 M36 18 H42 M11 5 L15 9 M33 27 L37 31 M37 5 L33 9 M15 27 L11 31" stroke="#4a3218" stroke-width="2.2"/>`,
      axe: `<path d="M24 16 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M25 8 C35 8 42 14 43 20 C35 19 29 22 25 28 L22 20 Z" fill="${colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M28 11 C34 13 38 16 40 19" stroke="#fff" stroke-width="2" opacity=".45"/>`,
      blade: `<path d="M24 3 L29 30 L24 38 L19 30 Z" fill="#e8eef4" stroke="#4a3218" stroke-width="2.4"/><path d="M16 32 H32" stroke="#c99a5b" stroke-width="4" stroke-linecap="round"/><path d="M24 38 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M24 8 V28" stroke="${colour}" stroke-width="2" opacity=".8"/>`,
      cleaver: `<path d="M14 7 H37 V31 L24 40 L14 31 Z" fill="#dce5ed" stroke="#4a3218" stroke-width="2.6"/><path d="M24 40 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M20 12 V26" stroke="${colour}" stroke-width="3" opacity=".8"/><circle cx="30" cy="15" r="2" fill="#4a3218"/>`,
      pick: `<path d="M24 18 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M8 18 C14 5 34 5 40 18" fill="none" stroke="#aeb6c4" stroke-width="5" stroke-linecap="round"/><path d="M8 18 L5 24 M40 18 L43 24" stroke="#4a3218" stroke-width="2.4"/>`,
      sling: `<path d="M24 50 V32 M24 32 L15 12 M24 32 L33 12" fill="none" stroke="#8a5a2c" stroke-width="4.4" stroke-linecap="round"/><path d="M15 12 C22 24 26 24 33 12" fill="none" stroke="#d9b38c" stroke-width="2.4"/><circle cx="24" cy="23" r="3.2" fill="${colour}" stroke="#4a3218" stroke-width="1.6"/>`,
      wand: `<path d="M24 27 V50" stroke="#7b4a8a" stroke-width="4.4" stroke-linecap="round"/><path d="M24 6 L27 14 L35 17 L27 20 L24 28 L21 20 L13 17 L21 14 Z" fill="${colour}" stroke="#4a3218" stroke-width="2"/><circle cx="24" cy="17" r="2" fill="#fff" opacity=".7"/>`,
      orb: `<path d="M24 27 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="17" r="11" fill="${colour}" stroke="#4a3218" stroke-width="2.6"/><circle cx="20" cy="13" r="3" fill="#fff" opacity=".65"/><path d="M13 17 H35 M24 6 V28" stroke="#4a3218" stroke-width="1.4" opacity=".35"/>`,
      scepter: `<path d="M24 22 V50" stroke="#c99a5b" stroke-width="4.4" stroke-linecap="round"/><path d="M15 18 L19 8 L24 14 L29 8 L33 18 Z" fill="${colour}" stroke="#4a3218" stroke-width="2.2"/><circle cx="24" cy="6" r="3" fill="${colour}" stroke="#4a3218" stroke-width="1.8"/>`,
      wrench: `<path d="M24 22 V50" stroke="#7d8a99" stroke-width="5" stroke-linecap="round"/><path d="M14 18 H34 V8 H27 V13 H21 V8 H14 Z" fill="#a9b6c4" stroke="#4a3218" stroke-width="2.4" stroke-linejoin="round"/>`,
      rod: `<path d="M24 20 V50" stroke="#7b4a8a" stroke-width="4.4" stroke-linecap="round"/><path d="M24 4 L32 18 L24 30 L16 18 Z" fill="${colour}" stroke="#4a3218" stroke-width="2.2"/><path d="M24 10 V23" stroke="#fff" stroke-width="2" opacity=".6"/>`,
      pan: `<path d="M24 30 V50" stroke="#5b3d22" stroke-width="5" stroke-linecap="round"/><path d="M24 30 L16 20" stroke="#5b3d22" stroke-width="4.4" stroke-linecap="round"/><circle cx="13" cy="16" r="10" fill="#4a4a52" stroke="#4a3218" stroke-width="2.4"/><circle cx="13" cy="16" r="6" fill="#6a6a74"/>`,
      stun: `<path d="M24 25 V50" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><rect x="13" y="9" width="22" height="15" rx="4" fill="#c4ced8" stroke="#4a3218" stroke-width="2.4"/><path d="M7 18 L11 21 L7 24" fill="none" stroke="#ffd45e" stroke-width="2.2"/>`,
      cleanse: `<path d="M24 26 V50" stroke="#8a5a2c" stroke-width="4.6" stroke-linecap="round"/><path d="M15 24 H33 L37 8 H11 Z" fill="${colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M17 8 L15 2 M22 8 V2 M27 8 L29 2 M31 9 L34 3" stroke="#e8fbff" stroke-width="2" stroke-linecap="round"/>`,
      chain: `<path d="M24 24 V50" stroke="#6d4a26" stroke-width="4.4" stroke-linecap="round"/><circle cx="24" cy="17" r="6" fill="none" stroke="#aeb6c4" stroke-width="2.6"/><circle cx="28" cy="8" r="6" fill="none" stroke="#aeb6c4" stroke-width="2.6"/><path d="M28 2 L31 -3 M34 8 H40" stroke="#e0b0ff" stroke-width="2.2" stroke-linecap="round"/>`,
      crit: `<path d="M14 7 H37 V31 L24 40 L14 31 Z" fill="#e8eef4" stroke="#4a3218" stroke-width="2.6"/><path d="M24 40 V50" stroke="#7b4a24" stroke-width="5" stroke-linecap="round"/><path d="M20 12 V26" stroke="#ff9a6a" stroke-width="3" opacity=".9"/>`,
    };
    return `<svg viewBox="0 0 48 56" class="item-art weapon-${shape}" aria-hidden="true">${weapons[shape] || weapons.blade}</svg>`;
  }

  function shopItemRow(kind, item) {
    const owned = kind === 'shield' ? (save.shields || []).includes(item.id) : (save.weapons || []).includes(item.id);
    const stat = kind === 'shield' ? `+${item.hp} base HP` : `+${item.atk} base damage`;
    const can = !owned && save.coins >= item.cost;
    return `<div class="shop-item ${owned ? 'owned' : ''}" style="--item:${item.colour}">
      <span class="shop-art">${itemArt(kind, item)}</span>
      <div class="shop-body"><b>${item.icon} ${item.name}</b><span>${stat}</span><small>${item.desc}</small></div>
      <button class="btn small ${can ? 'go' : 'ghost'}" data-buyitem="${kind}:${item.id}" ${can ? '' : 'disabled'}>${owned ? 'Owned' : item.cost + ' 🪙'}</button>
    </div>`;
  }

  function openShop() {
    const shields = DATA.craftedShields.map((s) => shopItemRow('shield', s)).join('');
    const weapons = DATA.craftedWeapons.map((w) => shopItemRow('weapon', w)).join('');
    openSheet(`
      <div class="eyebrow">Traveling merchant · Armoury</div>
      <h2>Bird-be-gone gear</h2>
      <p>Two things are worth carrying: a shield for HP, a weapon for damage. Both add flat base stats before every multiplier.</p>
      <div class="shop-wallet">${coins(save.coins)}${herbs(save.herbs)}</div>
      <h3 class="base-h">🛡️ Shields · base HP</h3>
      <div class="shop-grid">${shields}</div>
      <h3 class="base-h">⚔️ Weapons · base damage</h3>
      <div class="shop-grid">${weapons}</div>
      <p class="panel-note">Owned gear lives in the Base → Inventory, where you can hand it to any pig.</p>
      <div class="sheet-actions"><button class="btn small ghost" id="ovAlchemy">⚗️ Alchemy</button><button class="btn ghost" id="ovClose">Leave</button></div>
    `, { wide: true });
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
    const alch = el.overlay.querySelector('#ovAlchemy');
    if (alch) alch.addEventListener('click', openAlchemy);
    wireShop();
  }

  function wireShop() {
    el.overlay.querySelectorAll('[data-buyitem]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const [kind, id] = btn.dataset.buyitem.split(':');
        const item = kind === 'shield' ? DATA.craftedShieldById(id) : DATA.craftedWeaponById(id);
        if (!item || save.coins < item.cost) return;
        const owned = kind === 'shield' ? (save.shields || []).includes(id) : (save.weapons || []).includes(id);
        if (owned) return;
        save.coins -= item.cost;
        save.stats.spent = (save.stats.spent || 0) + item.cost;
        if (kind === 'shield') {
          save.shields = save.shields || [];
          save.shields.push(id);
        } else {
          save.weapons = save.weapons || [];
          save.weapons.push(id);
        }
        SFX.play('coin');
        toast(`${item.name} added to Inventory`, null);
        persist();
        checkAchievements();
        openShop();
      })
    );
  }

  function openCraft() {
    const rows = DATA.recipes.map((r) => {
      const p = DATA.potions[r.id];
      const price = brewPrice(r.id);
      const can = save.herbs >= price.herbs && save.coins >= price.coins;
      return `<div class="shop-row">
        <span class="pc-ico">${p.icon}</span>
        <div class="pc-body"><b>${r.name}</b><small>${r.desc}</small></div>
        <span class="recipe-cost">🌿 ${price.herbs} · 🪙 ${price.coins}</span>
        <button class="btn small ${can ? '' : 'ghost'}" data-brew="${r.id}" ${can ? '' : 'disabled'}>Brew</button>
      </div>`;
    }).join('');
    openSheet(`
      <div class="eyebrow">Crafting hut</div>
      <h2>Brew something useful</h2>
      <p>Herbs drop from fights and elite birds. Coins are for the base.</p>
      <div class="shop-wallet">${coins(save.coins)}${herbs(save.herbs)}</div>
      <div class="shop-list">${rows}</div>
      <div class="sheet-actions"><button class="btn ghost" id="ovClose">Leave</button></div>
    `);
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
    el.overlay.querySelectorAll('[data-brew]').forEach((btn) =>
      btn.addEventListener('click', () => {
        brew(btn.dataset.brew);
        openCraft();
      })
    );
  }

  function openAlchemy() {
    openSheet(`
      <div class="eyebrow">Traveling alchemist · Grades</div>
      <h2>Brew stronger potions</h2>
      <p>Grade up your potions with coins and medals. Available here and at the Pig Base.</p>
      ${alchemyTab()}
      <div class="sheet-actions"><button class="btn ghost" id="ovClose">Leave</button></div>
    `, { wide: true });
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
    el.overlay.querySelectorAll('[data-tier]').forEach((btn) =>
      btn.addEventListener('click', () => { upgradePotion(btn.dataset.tier); openAlchemy(); })
    );
  }

  /* ============================================================
     Cutscenes
     ============================================================ */

  function playCutscene(id, onDone) {
    const scene = DATA.cutscenes[id];
    if (!scene) { onDone && onDone(); return; }
    save.cutscenes[id] = true;
    persist(true);
    let panel = 0;

    const draw = () => {
      const p = scene.panels[panel];
      const art = p.art && DATA.enemies[p.art] ? Art.enemy(p.art) : Art.hero(p.art);
      openSheet(`
        <div class="cut-scene">
          <div class="cut-art">${art}</div>
          <div class="cut-body">
            <div class="eyebrow">${scene.title}</div>
            <h2>${p.kicker}</h2>
            <p>${p.text}</p>
          </div>
        </div>
        <div class="cut-dots">${scene.panels.map((_, i) => `<i class="${i === panel ? 'on' : ''}"></i>`).join('')}</div>
        <div class="sheet-actions">
          <button class="btn ghost" id="cutPrev" ${panel === 0 ? 'disabled' : ''}>← Back</button>
          <button class="btn gold" id="cutNext">${panel === scene.panels.length - 1 ? 'Done' : 'Next'}</button>
          <button class="btn ghost" id="cutSkip">Skip</button>
        </div>
      `, { cutscene: true });
      SFX.voice(p.voice || 'corporal');
      el.overlay.querySelector('#cutSkip').addEventListener('click', () => { SFX.play('click'); closeOverlay(); onDone && onDone(); });
      const prevBtn = el.overlay.querySelector('#cutPrev');
      if (prevBtn) prevBtn.addEventListener('click', () => { if (panel === 0) return; SFX.play('click'); panel -= 1; draw(); });
      el.overlay.querySelector('#cutNext').addEventListener('click', () => {
        SFX.play('click');
        panel += 1;
        if (panel >= scene.panels.length) { closeOverlay(); onDone && onDone(); }
        else draw();
      });
    };
    draw();
  }

  /* ============================================================
     Achievements & index
     ============================================================ */

  const ACH_CHECKS = {
    first: () => save.stats.wins >= 1,
    world1: () => !!save.cleared.e19,
    world2: () => !!save.cleared.c19,
    flawless: () => Object.values(save.cleared).filter((c) => c.stars === 3).length >= 12,
    laststand: () => !!save.flags.lastStand,
    /* Only a boss cleared with the full three-pig squad and no knockouts. */
    untouched: () => !!save.flags.noLossBossFull,
    spender: () => save.stats.spent >= 2000,
    geared: () => DATA.heroes.some((h) => {
      const g = save.gear[h.id];
      return g && g.weapon >= 3 && g.helmet >= 3;
    }),
    party: () => save.heroes.length >= DATA.heroes.length,
    hunter: () => save.stats.kills >= 200,
    jackpot: () => !!save.flags.jackpot,
    lucky: () => !!save.flags.lucky,
    combo: () => !!save.flags.combo,
    legend: () => save.level >= MAX_LEVEL,
    delver: () => !!save.flags.delver,
    deep: () => (save.dungeon.best || 0) >= 18,
    unerring: () => (save.dungeon.best || 0) >= 35,
    explorer: () => Object.keys(save.cleared).length >= 30,
    hoarder: () => (save.coins || 0) >= 4000,
    brewmaster: () => (save.stats.brews || 0) >= 35,
    relic: () => Object.keys(save.charRelics || {}).length >= 1,
    /* --- World-specific + index --- */
    w1sweep: () => worldSwept(1),
    w2sweep: () => worldSwept(2),
    w3sweep: () => worldSwept(3),
    w3boss: () => !!save.cleared.f19,
    frostbite: () => (save.stats.frostKills || 0) >= 40,
    woolly: () => (save.stats.mammothKills || 0) >= 1,
    caveman: () => caveVaultReached(),
    unreal: () => DATA.relics.some((r) => r.rarity === 'unreal' && save.relicBag.includes(r.id)),
    relicdex: () => DATA.relics.every((r) => r.starter || save.relicBag.includes(r.id)),
    /* Every award except the index itself, checked by id: a stale id from an
       older save can never stand in for a real award. */
    index: () => DATA.achievements.every((a) => a.id === 'index' || save.achieved[a.id]),
    /* --- tiered additions --- */
    veteran: () => (save.stats.wins || 0) >= 100,
    bossrush: () => ['e19', 'c19', 'f19', 's19'].every((id) => !!save.cleared[id]),
    grandsweep: () => [1, 2, 3, 4].every((w) => worldSwept(w)),
    relic3: () => (save.relicBag || []).length >= 3,
    /* --- The Gilded Kingdom --- */
    w5boss: () => !!(save.cleared && save.cleared.k25),
    w5sweep: () => worldSwept(5),
    keymaster: () => (save.keys || []).length >= 3,
    mythic: () => DATA.relics.some((r) => r.rarity === 'mythic' && save.relicBag.includes(r.id)),
    legendary: () => DATA.relics.some((r) => r.rarity === 'legendary' && save.relicBag.includes(r.id)),
    finale: () => !!(save.cutscenes && save.cutscenes.ending),
    tier2all: () => DATA.heroes.every((h) => (((save.gear[h.id] || {}).weapon) || 1) >= 2),
    trainingmax: () => (save.upgrades.power || 0) >= 5 || (save.upgrades.vigour || 0) >= 5,
    rich10k: () => (save.coins || 0) >= 10000,
    dungeon5: () => (save.dungeon.best || 0) >= 5,
    elites20: () => Object.keys(save.cleared).filter((id) => DATA.levels[id] && DATA.levels[id].elite).length >= 20,
    /* --- title board additions --- */
    materials8: () => Object.keys(DATA.mats).every((k) => (save.mats[k] || 0) >= 1),
    alchemy3: () => Object.keys(DATA.potions).some((k) => potionTier(k) >= (DATA.potions[k].maxTier || 3)),
    forge5: () => DATA.heroes.some((h) => forgeOf(h.id) >= DATA.relicForge.maxLevel),
    week7: () => ((save.daily || {}).streak || 0) >= 7,
    w4boss: () => !!save.cleared.s19,
    triplesix: () => Object.values(save.dice || {}).filter((v) => v === 6).length >= 3,
    architect: () => (save.blueprints || []).length >= 6,
    carnival: () => (save.stats.spins || 0) >= 25,
    /* --- Star milestones + late-game feats --- */
    stars50: () => starsTotal() >= 50,
    stars100: () => starsTotal() >= 100,
    stars150: () => starsTotal() >= 150,
    stars200: () => starsTotal() >= 200,
    stars250: () => starsTotal() >= 250,
    stars300: () => starsTotal() >= 300,
    stars350: () => starsTotal() >= 350,
    stars400: () => starsTotal() >= 400,
    w4sweep: () => worldSwept(4),
    bossrushall: () => ['e19', 'c19', 'f19', 's19'].every((id) => !!save.cleared[id]) && !!(save.cleared && save.cleared.k25),
    kills500: () => (save.stats.kills || 0) >= 500,
    kills1000: () => (save.stats.kills || 0) >= 1000,
    perfect20: () => Object.values(save.cleared).filter((c) => c.stars === 3).length >= 20,
    perfect30: () => Object.values(save.cleared).filter((c) => c.stars === 3).length >= 30,
    deep25: () => (save.dungeon.best || 0) >= 25,
    rich20k: () => (save.coins || 0) >= 20000,
    forgeall: () => DATA.heroes.every((h) => forgeOf(h.id) >= DATA.relicForge.maxLevel),
    weapon5: () => DATA.heroes.some((h) => (((save.gear[h.id] || {}).weapon) || 1) >= 5),
    helmet5: () => DATA.heroes.some((h) => (((save.gear[h.id] || {}).helmet) || 1) >= 5),
    flask20: () => Object.values(save.potions || {}).reduce((a, b) => a + b, 0) >= 20,
    legendary3: () => DATA.relics.filter((r) => r.rarity === 'legendary' && (save.relicBag || []).includes(r.id)).length >= 3,
    elites40: () => Object.keys(save.cleared).filter((id) => DATA.levels[id] && DATA.levels[id].elite).length >= 40,
    dungeon30: () => (save.dungeon.best || 0) >= 30,
    carnival50: () => (save.stats.spins || 0) >= 50,
    flask30: () => Object.values(save.potions || {}).reduce((a, b) => a + b, 0) >= 30,
    week14: () => ((save.daily || {}).streak || 0) >= 14,
  };

  /* Every battle node in a world cleared (main, side routes and caves). */
  function worldSwept(id) {
    const w = DATA.worlds.find((x) => x.id === id);
    if (!w) return false;
    const battles = w.nodes.filter((n) => n.type === 'battle' && DATA.levels[n.id]);
    return battles.length > 0 && battles.every((n) => !!save.cleared[n.id]);
  }

  /* Cleared the level right before a relic vault, i.e. reached the vault. */
  function caveVaultReached() {
    return DATA.worlds.some((w) => w.nodes.some((n) => {
      if (!(n.type === 'shop' && n.relic)) return false;
      return w.edges.some(([a, b]) => {
        const other = a === n.id ? b : b === n.id ? a : null;
        return other && !!save.cleared[other];
      });
    }));
  }

  function checkAchievements() {
    let changed = false;
    DATA.achievements.forEach((a) => {
      if (save.achieved[a.id]) return;
      const fn = ACH_CHECKS[a.id];
      if (fn && fn()) {
        save.achieved[a.id] = true;
        changed = true;
        toast(`Achievement: ${a.name}`, null);
        SFX.play('unlock');
      }
    });
    if (changed) persist();
  }

  function openAchievements() {
    openSheet(`
      <div class="eyebrow">Piggy Epic</div>
      <h2>Achievements</h2>
      <p>${Object.keys(save.achieved).length} / ${DATA.achievements.length} unlocked</p>
      <div class="ach-list">${achievementsTab().replace('<div class="panel-note">', '<div class="panel-note hidden">')}</div>
      <div class="sheet-actions"><button class="btn" id="ovClose">Close</button></div>
    `, { wide: true });
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  function openIndex() {
    openSheet(`
      <div class="sheet-x-row"><button class="sheet-x" id="ovClose" type="button" aria-label="Close compendium" title="Close">✕</button></div>
      <div class="eyebrow">Piggy Epic</div>
      <h2>Compendium</h2>
      ${indexTab()}
    `, { wide: true, noX: true });
    /* The compendium opens from the title as well as from the base, so the card
       listener has to be wired on this path too or the cards do nothing. */
    wireCompendiumClicks();
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  /* ============================================================
     Endless dungeon
     ============================================================ */

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function refreshDungeonDaily() {
    if (!save.dungeon) save.dungeon = { day: '', runs: DATA.dungeon.runsPerDay, best: 0 };
    if (save.dungeon.day !== todayKey()) {
      save.dungeon.day = todayKey();
      save.dungeon.runs = DATA.dungeon.runsPerDay;
      persist(true);
    }
  }

  function dungeonUnlocked() {
    /* The dungeon stays sealed until the Cuckoo Canyon boss is down. */
    return !!save.cleared.c19;
  }

  function dungeonMapSvg(center, stop) {
    const radius = DATA.dungeon.fogRadius;
    const start = Math.max(1, center - radius);
    const end = center + radius;
    const step = 84;
    const height = 200 + (end - start) * step;
    const W = window.innerWidth < 640 ? 420 : 600;
    const cx = W / 2;
    const ex = W / 600;
    const nodes = [];
    for (let f = start; f <= end; f++) {
      const drift = Math.sin(f * 1.9) * 20;
      const stopType = stop && stop.floor === f ? stop.type : null;
      nodes.push({
        f,
        x: cx + (f % 2 ? 54 : -54) + drift,
        y: 104 + (end - f) * step,
        behind: f < center,
        current: f === center,
        stopType,
        boss: f % 5 === 0 && !stopType,
      });
    }
    const topDown = nodes.slice().sort((a, b) => a.y - b.y);
    let tunnel = `M ${topDown[0].x.toFixed(1)} ${topDown[0].y.toFixed(1)}`;
    for (let i = 1; i < topDown.length; i++) {
      const prev = topDown[i - 1];
      const cur = topDown[i];
      const mid = (prev.y + cur.y) / 2;
      tunnel += ` C ${prev.x.toFixed(1)} ${mid.toFixed(1)}, ${cur.x.toFixed(1)} ${mid.toFixed(1)}, ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
    }
    const edgeAt = (side, y) => {
      const n = y / 52;
      const edge = (W === 600 ? 112 : 84) + Math.sin(n * 1.7 + (side === 'right' ? 1.2 : 0)) * 24 + (n % 2 ? 17 : 0);
      return side === 'left' ? edge : W - edge;
    };
    const wall = (side) => {
      const pts = [];
      for (let y = 0; y <= height; y += 52) pts.push(`${edgeAt(side, y).toFixed(1)} ${y}`);
      return side === 'left'
        ? `M0 0 L ${pts.join(' L ')} L 0 ${height} Z`
        : `M${W} 0 L ${pts.join(' L ')} L ${W} ${height} Z`;
    };
    let strata = '';
    for (let i = 0; i < 9; i++) {
      const y = 52 + i * ((height - 96) / 8);
      const lx = edgeAt('left', y) - 8;
      const rx = edgeAt('right', y) + 8;
      const d = i % 2 ? 44 : 36;
      strata += `<path d="M8 ${y.toFixed(1)} q ${d} -11 ${d * 2} 0 t ${d * 2} 0" stroke="#342642" stroke-width="2" fill="none" opacity=".65"/>`;
      strata += `<path d="M${W - 8} ${(y + 18).toFixed(1)} q -${d} -11 -${d * 2} 0 t -${d * 2} 0" stroke="#342642" stroke-width="2" fill="none" opacity=".65"/>`;
      if (lx > 74 * ex) strata += `<path d="M${Math.max(12, lx - 58 * ex)} ${(y + 24).toFixed(1)} l 16 -7 l 19 5" stroke="#4a3559" stroke-width="1.5" fill="none" opacity=".5"/>`;
      if (rx < W - 74 * ex) strata += `<path d="M${Math.min(W - 12, rx + 58 * ex)} ${(y + 24).toFixed(1)} l -16 -7 l -19 5" stroke="#4a3559" stroke-width="1.5" fill="none" opacity=".5"/>`;
    }
    const boulders = [[48, 150, 20], [556, 214, 24], [40, 338, 17], [562, 420, 21], [54, height - 250, 23], [548, height - 150, 18], [92, height - 44, 15], [508, height - 62, 20]];
    let rubble = '';
    boulders.forEach(([x0, y, r], i) => {
      if (y > height - 10) return;
      const x = x0 * ex;
      rubble += `<g opacity="${(0.8 + (i % 2) * 0.12).toFixed(2)}"><path d="M${x - r} ${y + r * 0.35} L${x - r * 0.5} ${y - r * 0.7} L${x + r * 0.4} ${y - r} L${x + r} ${y - r * 0.2} L${x + r * 0.7} ${y + r * 0.55} L${x - r * 0.1} ${y + r * 0.7} Z" fill="#2b2037" stroke="#4a3559" stroke-width="2"/><path d="M${x - r * 0.4} ${y - r * 0.55} l ${r * 0.7} -${r * 0.1}" stroke="#5b4568" stroke-width="1.5" opacity=".6"/></g>`;
    });
    let teeth = '';
    const tooth = (x, h, down) => {
      const y = down ? 0 : height;
      const tip = down ? h : height - h;
      teeth += `<path d="M${x - 12} ${y} L${x + 12} ${y} L${x + 3} ${tip} Z" fill="#1b1424"/>`;
    };
    [34, 78, 126, 170, 434, 480, 526, 570].forEach((x, i) => tooth(x * ex, 20 + ((i * 19) % 30), true));
    [52, 110, 166, 442, 498, 554].forEach((x, i) => tooth(x * ex, 18 + ((i * 23) % 26), false));
    const gemSpots = [
      [70, 190, '#7fe8ff'], [530, 260, '#ffc46b'], [56, 430, '#c49bff'],
      [542, 560, '#7fffd4'], [84, height - 180, '#ff9e6b'], [516, height - 220, '#9fc6ff'],
    ];
    let gems = '';
    gemSpots.forEach(([x0, y, c], i) => {
      const x = x0 * ex;
      if (y < 40 || y > height - 30) return;
      gems += `<g opacity="${(0.45 + (i % 3) * 0.14).toFixed(2)}"><path d="M${x} ${y - 18} L${x + 12} ${y} L${x} ${y + 24} L${x - 12} ${y} Z" fill="${c}" stroke="#0b0811" stroke-width="2"/><path d="M${x} ${y - 13} L${x + 6} ${y} L${x} ${y + 15}" stroke="#fff" stroke-opacity=".5" fill="none"/><circle cx="${x}" cy="${y}" r="24" fill="${c}" opacity=".12"/></g>`;
    });
    let dust = '';
    for (let i = 0; i < 26; i++) {
      const x = (30 + ((i * 83) % 540)) * ex;
      const y = 54 + ((i * 137) % Math.max(1, height - 110));
      dust += `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2 : 1.2}" fill="#ffd98a" opacity="${(0.12 + (i % 4) * 0.05).toFixed(2)}"/>`;
    }
    const chamber = (r, seed) => {
      const pts = [];
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2;
        const rr = r * (0.84 + 0.16 * Math.sin(seed + i * 2.1));
        pts.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr * 0.84).toFixed(1)}`);
      }
      return `M ${pts.join(' L ')} Z`;
    };
    let nodeArt = '';
    nodes.forEach(({ f, x, y, behind, current, boss, stopType }) => {
      const fill = current ? '#ffd964' : behind ? '#f1bf3c' : '#292531';
      const stroke = current ? '#fff0b0' : behind ? '#b8860b' : '#4a4058';
      const glyph = stopType === 'rest' ? '🕯️' : stopType === 'shop' ? '🛒' : boss ? '💀' : current ? '⚔️' : behind ? '✓' : '?';
      const suffix = stopType === 'rest' ? ' · REST' : stopType === 'shop' ? ' · SHOP' : boss ? ' · BOSS' : '';
      nodeArt += `
        <g class="depth-node ${current ? 'current' : behind ? 'done' : 'fog'}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
          <path d="${chamber(boss ? 41 : 35, f * 3)}" fill="#1a1522" stroke="#493b58" stroke-width="2"/>
          <path d="${chamber(boss ? 33 : 28, f * 3 + 1)}" fill="none" stroke="${boss ? '#7a4a5c' : '#33293f'}" stroke-width="1.5"/>
          <circle r="${boss ? 24 : 21}" fill="${fill}" stroke="${stroke}" stroke-width="${current ? 3.5 : 2.5}"/>
          <circle r="${boss ? 30 : 26}" fill="none" stroke="${current ? '#ffea9c' : '#342a42'}" stroke-width="1" opacity=".85"/>
          <text y="7" text-anchor="middle" font-size="${boss ? 22 : 19}">${glyph}</text>
          <text y="${boss ? 51 : 47}" text-anchor="middle" font-size="12.5" fill="${behind ? '#d8c58f' : '#a79bb8'}" font-weight="700" letter-spacing=".4">DEPTH ${f}${suffix}</text>
        </g>`;
    });
    const here = nodes.find((n) => n.current) || nodes[0];
    return `
      <svg class="dungeon-svg" viewBox="0 0 ${W} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="dunBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#191321"/>
            <stop offset="0.42" stop-color="#110d18"/>
            <stop offset="1" stop-color="#08060d"/>
          </linearGradient>
          <linearGradient id="dunRock" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#352642"/>
            <stop offset="0.55" stop-color="#21172c"/>
            <stop offset="1" stop-color="#120d1a"/>
          </linearGradient>
          <radialGradient id="dunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#ffd964" stop-opacity=".38"/>
            <stop offset="0.55" stop-color="#ffae4a" stop-opacity=".12"/>
            <stop offset="1" stop-color="#ffd964" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${height}" fill="url(#dunBg)"/>
        <path d="${wall('left')}" fill="url(#dunRock)" stroke="#5a4568" stroke-width="2.5"/>
        <path d="${wall('right')}" fill="url(#dunRock)" stroke="#5a4568" stroke-width="2.5"/>
        ${strata}
        ${rubble}
        ${teeth}
        ${gems}
        <path d="${tunnel}" fill="none" stroke="#2a2135" stroke-width="92" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>
        <path d="${tunnel}" fill="none" stroke="#0e0a14" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${tunnel}" fill="none" stroke="#5b4568" stroke-width="2" stroke-dasharray="3 12" opacity=".7"/>
        ${dust}
        <ellipse cx="${here.x.toFixed(1)}" cy="${here.y.toFixed(1)}" rx="125" ry="125" fill="url(#dunGlow)"/>
        ${nodeArt}
      </svg>`;
  }

  function openDungeonHelp() {
    openSheet(`
      <div class="eyebrow">Delve guide</div>
      <h2>The Endless Dungeon</h2>
      <div class="howto">
        <p><b>One road down.</b> Every clear opens the next depth. The cave map tracks how far the current run has reached; fog swallows anything past it.</p>
        <p><b>Boss depths.</b> Every fifth depth is a boss chamber. Bosses hit harder, guard more often, and drop the best loot in the cave.</p>
        <p><b>Relic vaults.</b> Every tenth depth hides a vault. Spend relics on permanent dungeon upgrades, then carry on deeper.</p>
        <p><b>Shelters and merchants.</b> After a clear, the next chamber can open into a quiet rest stop or a traveling merchant. Rest floors grant one of three boons; merchants trade the coins you have banked this run. Boss chambers never lose their slot.</p>
        <p><b>Risk and reward.</b> Push on and your reward pool grows — but a loss costs you half of everything banked this run.</p>
        <p><b>Runs.</b> You get ${DATA.dungeon.runsPerDay} runs each day. Rested runs refill at midnight, so spend them on a deep delve rather than a shallow one.</p>
      </div>
      <div class="reward-line"><span>Boss cadence</span><b>Every 5 depths</b></div>
      <div class="reward-line"><span>Relic vault</span><b>Every 10 depths</b></div>
      <div class="reward-line"><span>Rest or merchant</span><b>Random after a clear · ${Math.round(DATA.dungeon.stopChance * 100)}%</b></div>
      <div class="reward-line"><span>Daily runs</span><b>${DATA.dungeon.runsPerDay}</b></div>
      <div class="sheet-actions"><button class="btn gold" id="ovClose">Into the dark</button></div>
    `);
    el.overlay.querySelector('#ovClose').addEventListener('click', closeOverlay);
  }

  function renderDungeon() {
    if (!dungeonUnlocked()) { show('map'); return; }
    refreshDungeonDaily();
    const run = dungeonRun;
    const stop = run && run.stop;
    const floor = run ? run.floor : Math.max(1, (save.dungeon.best || 0) + 1);
    const danger = DATA.dungeon.danger(run ? run.floor - 1 : floor - 1);
    const runs = save.dungeon.runs;
    el.dungeon.innerHTML = `
      <div class="dungeon-bg" aria-hidden="true">
        <span class="db-vault a"></span>
        <span class="db-vault b"></span>
        <span class="db-vault c"></span>
        <span class="db-torch left"></span>
        <span class="db-torch right"></span>
        <span class="db-mist"></span>
        <span class="db-embers"></span>
      </div>
      <div class="base-top dg-top">
        <button class="icon-btn" id="dgBack" title="Leave the dungeon">←</button>
        <div class="base-title">
          <h1>Endless Dungeon</h1>
          <p>${save.dungeon.best ? `deepest run · depth ${save.dungeon.best}` : 'the fog has no bottom'}</p>
        </div>
        <div class="dg-tools">
          <button class="icon-btn dg-tool" id="dgHelp" title="Dungeon guide" aria-label="Dungeon guide">❔</button>
          <button class="icon-btn dg-tool" id="dgStats" title="Statistics" aria-label="Statistics">📊</button>
          <button class="icon-btn dg-tool" id="dgSet" title="Settings" aria-label="Settings">⚙️</button>
          <button class="icon-btn dg-tool" id="dgSound" title="Toggle sound" aria-label="Toggle sound">${SFX.isMuted() ? '🔇' : '🔊'}</button>
        </div>
      </div>
      <div class="dungeon-meta">
        <span class="dg-chip">🏅 <b>${save.relics}</b> relics</span>
        <span class="dg-chip">🎟 <b>${runs}/${DATA.dungeon.runsPerDay}</b> runs left</span>
        <span class="dg-chip">🏆 <b>${save.dungeon.best || 0}</b> best depth</span>
        <span class="dg-chip">⚡ <b>${run ? run.score : '—'}</b> run score</span>
      </div>
      <div class="dungeon-body">
        <div class="danger-wrap">
          <div class="danger-label"><span>💀 Danger meter</span><b>Depth ${floor} · ${danger}%</b></div>
          <div class="danger-track"><i style="width:${danger}%"></i></div>
          <div class="danger-foot">
            <span>💀 Boss every 5 depths</span>
            <span>💎 Relic vault every 10</span>
            <span>🕯️ Shelters at random</span>
            <span>🔥 Deeper pays more</span>
          </div>
        </div>
        <div class="dungeon-scroll">
          <div class="dungeon-fog top"></div>
          ${dungeonMapSvg(floor, stop)}
          <div class="dungeon-fog bottom"></div>
        </div>
        <div class="dungeon-legend">
          <span><i class="lg-dot current"></i> You are here</span>
          <span><i class="lg-dot done"></i> Cleared</span>
          <span><i class="lg-dot fog"></i> Fog</span>
          <span><i class="lg-dot boss"></i> Boss</span>
          <span><i class="lg-dot shelter"></i> Shelter</span>
        </div>
        <div class="dungeon-run">
          ${run
            ? `<div class="run-line"><span>Run rewards</span><b>🪙 ${run.rewards.coins} · 🏅 ${run.rewards.relics} · 🌿 ${run.rewards.herbs} · 📗 ${run.rewards.xp}</b></div>
               <div class="run-line"><span>Score</span><b>${run.score}</b></div>
               <div class="run-line"><span>Next depth</span><b>${run.floor}${stop ? (stop.type === 'rest' ? ' · 🕯️ REST' : ' · 🛒 SHOP') : run.floor % 5 === 0 ? ' · 💀 BOSS' : ''}</b></div>
               ${run.atkBonus ? `<div class="run-line"><span>Run boon</span><b>⚔️ +${Math.round(run.atkBonus * 100)}% damage</b></div>` : ''}`
            : `<p class="panel-note">Each depth is tougher than the last and pays better. Claim to keep everything, or push on and risk half.</p>`}
        </div>
      </div>
      <div class="dungeon-actions">
        ${run
          ? `${stop
              ? `<button class="btn gold" id="dgStop">${stop.type === 'rest' ? `🕯️ Rest at depth ${run.floor}` : `🛒 Merchant at depth ${run.floor}`}</button>`
              : `<button class="btn gold" id="dgDescend">⚔ Descend to depth ${run.floor}</button>`}
             <button class="btn ghost" id="dgClaim">🎁 Claim & leave</button>`
          : `<button class="btn gold" id="dgEnter" ${runs ? '' : 'disabled'}>${runs ? '🕳️ Enter the dungeon' : '🎟 No runs left today'}</button>`}
      </div>
      <div id="savePill" class="save-pill">Saved ✓</div>
    `;
    el.dungeon.querySelector('#dgBack').addEventListener('click', () => { SFX.play('click'); show('map'); });
    el.dungeon.querySelector('#dgHelp').addEventListener('click', () => { SFX.play('click'); openDungeonHelp(); });
    el.dungeon.querySelector('#dgStats').addEventListener('click', () => { SFX.play('click'); openStats(); });
    el.dungeon.querySelector('#dgSet').addEventListener('click', () => { SFX.play('click'); openSettings(); });
    el.dungeon.querySelector('#dgSound').addEventListener('click', (ev) => {
      const st = save.settings || (save.settings = { sound: true, ui: 'normal', motion: true });
      st.sound = SFX.isMuted();
      SFX.setMuted(!st.sound);
      ev.currentTarget.textContent = SFX.isMuted() ? '🔇' : '🔊';
      persist(true);
    });
    const enter = el.dungeon.querySelector('#dgEnter');
    if (enter) enter.addEventListener('click', enterDungeon);
    const desc = el.dungeon.querySelector('#dgDescend');
    if (desc) desc.addEventListener('click', () => { SFX.play('click'); startDungeonFloor(); });
    const stopBtn = el.dungeon.querySelector('#dgStop');
    if (stopBtn) stopBtn.addEventListener('click', () => { SFX.play('click'); openDungeonStop(); });
    const claim = el.dungeon.querySelector('#dgClaim');
    if (claim) claim.addEventListener('click', () => claimDungeon(false, 'You climbed back out with everything you found.'));
    const centreDepth = () => {
      const scroller = el.dungeon.querySelector('.dungeon-scroll');
      const node = el.dungeon.querySelector('.depth-node.current');
      if (!scroller || !node) return;
      const r = node.getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      scroller.scrollTop += r.top - s.top - s.height / 2 + r.height / 2;
    };
    requestAnimationFrame(() => { centreDepth(); savedFlash(); });
    setTimeout(centreDepth, 80);
  }

  function enterDungeon() {
    refreshDungeonDaily();
    if (save.dungeon.runs <= 0) { SFX.play('nope'); toast('No dungeon runs left today. Come back tomorrow.', null); return; }
    save.dungeon.runs -= 1;
    save.flags.delver = true;
    dungeonRun = { floor: 1, score: 0, bestFloor: 0, rewards: { coins: 0, herbs: 0, relics: 0, xp: 0 }, carryHp: {}, atkBonus: 0, stop: null, lastStop: 0 };
    persist();
    checkAchievements();
    SFX.play('gate');
    startDungeonFloor();
  }

  function startDungeonFloor() {
    if (!dungeonRun) { show('dungeon'); return; }
    if (dungeonRun.stop) { show('dungeon'); openDungeonStop(); return; }
    const floor = dungeonRun.floor;
    const built = DATA.dungeon.makeFloor(floor);
    const level = {
      id: 'dungeon-' + floor,
      world: 2,
      biome: DATA.dungeon.biome(floor),
      order: floor,
      name: `Depth ${floor}`,
      lore: built.boss ? 'A heavy shape shifts in the fog.' : 'The fog thickens. Every step deeper pays more.',
      tip: built.boss ? 'Boss floor — guard up before the big hit.' : '',
      boss: built.boss,
      elite: false,
      /* One depth is one chamber: the whole flock on the field at once, boss
         included, instead of a five-wave gauntlet with the boss last. */
      waves: 1,
      enemies: built.enemies,
      xp: 0,
      coins: 0,
      herbs: 0,
      firstClearCoins: 0,
    };
    battleMode = 'dungeon';
    activeLevel = level;
    activeNode = 'dungeon';
    el.title.classList.add('hidden');
    el.map.classList.add('hidden');
    el.base.classList.add('hidden');
    el.dungeon.classList.add('hidden');
    el.battle.classList.remove('hidden');
    save.stats.battles += 1;
    persist(true);
    save.party.forEach((id) => gearOf(id));
    Battle.start(level, {
      level: save.level,
      levels: save.party.reduce((m, id) => { m[id] = pigLevel(id); return m; }, {}),
      party: save.party.slice(),
      gear: save.gear,
      forge: save.forge,
      relics: save.charRelics,
      weapons: save.weaponEquip,
      shields: save.shieldEquip,
      items: save.potions,
      potionTiers: save.potionTier,
      carryHp: dungeonRun.carryHp,
      atkBonus: dungeonRun.atkBonus || 0,
    }, {
      onWin: onDungeonWin,
      onLose: onDungeonLose,
      onRetreat: () => claimDungeon(false, 'You climbed back out with everything you found.'),
      buyPotion: buyPotionInBattle,
      onSettings: () => openSettings(),
      consumePotion: (kind) => {
        if (!save.potions[kind]) return false;
        save.potions[kind] -= 1;
        persist();
        return save.potions[kind];
      },
      onMuteChange: () => persist(true),
    });
  }

  function onDungeonWin(result) {
    const floor = dungeonRun.floor;
    save.stats.wins += 1;
    const r = DATA.dungeon.rewards(floor);
    const firstDescent = floor > (save.dungeon.best || 0);
    const firstBonus = firstDescent ? DATA.dungeonFirstClear(floor) : null;
    dungeonRun.rewards.coins += r.coins;
    dungeonRun.rewards.herbs += r.herbs;
    dungeonRun.rewards.relics += r.relics;
    dungeonRun.rewards.xp += r.xp;
    if (firstBonus) {
      dungeonRun.rewards.coins += firstBonus.coins || 0;
      dungeonRun.rewards.herbs += firstBonus.herbs || 0;
      dungeonRun.rewards.relics += firstBonus.relics || 0;
      dungeonRun.rewards.xp += firstBonus.xp || 0;
    }
    dungeonRun.score += result.score;
    dungeonRun.bestFloor = floor;
    save.dungeon.best = Math.max(save.dungeon.best || 0, floor);
    save.stats.kills += result.stats.kills;
    /* Dungeon birds belong in the compendium too, including the three that
       only ever appear down here. */
    if (activeLevel && Array.isArray(activeLevel.enemies)) {
      activeLevel.enemies.forEach((e) => { save.seenBirds[e.t] = true; });
    }
    if (!result.fallen.length) save.flags.noLossWin = true;
    result.heroEnd.forEach((h) => {
      dungeonRun.carryHp[h.id] = Math.min(h.maxHp, Math.round(h.hp + h.maxHp * 0.3));
    });
    dungeonRun.floor = floor + 1;
    dungeonRun.stop = null;
    rollDungeonStop(dungeonRun);
    const stop = dungeonRun.stop;
    persist();
    checkAchievements();

    const nextDanger = DATA.dungeon.danger(dungeonRun.floor - 1);
    openSheet(`
      <div class="eyebrow">Dungeon · depth ${floor}</div>
      <h2>Depth ${floor} cleared</h2>
      <div class="stars-row">${[1, 2, 3].map((i) => `<span class="star-slot${i <= result.stars ? ' on' : ''}">★</span>`).join('')}</div>
      <p>Score <b>${result.score}</b> · danger is now <b>${nextDanger}%</b>. Deeper floors pay more and hit harder.</p>
      <div class="reward-line"><span>This depth</span><b>🪙 +${r.coins}${r.relics ? ` · 🏅 +${r.relics}` : ''}${r.herbs ? ` · 🌿 +${r.herbs}` : ''}</b></div>
      ${firstBonus ? `<div class="reward-line first-clear"><span>★ ${firstBonus.label}</span><b>🪙 +${firstBonus.coins} · 📗 +${firstBonus.xp} XP${firstBonus.relics ? ` · 🏅 +${firstBonus.relics}` : ''}${firstBonus.herbs ? ` · 🌿 +${firstBonus.herbs}` : ''}</b></div>` : ''}
      <div class="reward-line"><span>Run total</span><b>🪙 ${dungeonRun.rewards.coins} · 🏅 ${dungeonRun.rewards.relics} · 📗 ${dungeonRun.rewards.xp} XP</b></div>
      ${stop ? `<div class="reward-line"><span>Next chamber</span><b>${stop.type === 'rest' ? '🕯️ Rest floor' : '🛒 Traveling merchant'}</b></div>` : ''}
      ${floor % 10 === 0 ? '<div class="reward-line"><span>💎 Every 10th depth</span><b>A relic merchant has set up down here</b></div>' : ''}
      <div class="sheet-actions">
        ${floor % 10 === 0 ? '<button class="btn gold" id="dgRelic">💎 Visit relic vault</button>' : ''}
        ${stop
          ? `<button class="btn gold" id="dgStop">${stop.type === 'rest' ? `🕯️ Rest at depth ${dungeonRun.floor}` : `🛒 Merchant at depth ${dungeonRun.floor}`}</button>`
          : `<button class="btn gold" id="dgGo">⚔ Descend to ${dungeonRun.floor}</button>`}
        <button class="btn ghost" id="dgBank">🎁 Claim & leave</button>
      </div>
    `);
    SFX.play('levelup');
    const dgRelic = el.overlay.querySelector('#dgRelic');
    if (dgRelic) dgRelic.addEventListener('click', () => { SFX.play('click'); closeOverlay(); show('dungeon'); openRelicShop(); });
    const dgStop = el.overlay.querySelector('#dgStop');
    if (dgStop) dgStop.addEventListener('click', () => { SFX.play('click'); closeOverlay(); show('dungeon'); openDungeonStop(); });
    const dgGo = el.overlay.querySelector('#dgGo');
    if (dgGo) dgGo.addEventListener('click', () => { SFX.play('click'); closeOverlay(); startDungeonFloor(); });
    el.overlay.querySelector('#dgBank').addEventListener('click', () => claimDungeon(false, 'You climbed back out with everything you found.'));
  }

  function makeDungeonStop(type, floor) {
    const source = type === 'rest' ? DATA.dungeon.restOffers : DATA.dungeon.shopOffers;
    const pool = source.slice();
    const offers = [];
    /* Every merchant keeps one cheap meal in stock so the first shop is never
       a dead end, then the rest of the shelf is rolled fresh. */
    if (type === 'shop') {
      const meal = pool.findIndex((o) => o.id === 'heal');
      if (meal >= 0) offers.push(pool.splice(meal, 1)[0]);
    }
    while (offers.length < 3 && pool.length) {
      offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return { type, floor, offers, bought: {} };
  }

  function rollDungeonStop(run) {
    if (!run || run.stop) return;
    const f = run.floor;
    /* Boss chambers keep their slot, and a stop never follows another stop. */
    if (f % 5 === 0) return;
    if (run.lastStop && f - run.lastStop <= 1) return;
    if (Math.random() > DATA.dungeon.stopChance) return;
    run.stop = makeDungeonStop(Math.random() < 0.55 ? 'rest' : 'shop', f);
  }

  function openDungeonStop() {
    if (!dungeonRun) { show('dungeon'); return; }
    if (!dungeonRun.stop) { startDungeonFloor(); return; }
    if (dungeonRun.stop.type === 'rest') openRestFloor();
    else openShopFloor();
  }

  function openRestFloor() {
    const run = dungeonRun;
    const stop = run && run.stop;
    if (!stop || stop.type !== 'rest') return;
    const cards = stop.offers.map((o) => `
      <button class="stop-card" data-rest="${o.id}" type="button">
        <span class="stop-ico">${o.icon}</span>
        <b>${o.name}</b>
        <small>${o.desc}</small>
      </button>`).join('');
    openSheet(`
      <div class="eyebrow">Dungeon · depth ${stop.floor}</div>
      <h2>A quiet alcove</h2>
      <p>Someone left a lantern burning here. The pigs get a moment to catch their breath — choose one comfort before the road goes on.</p>
      <div class="stop-wallet">
        <span class="cur">🪙 ${run.rewards.coins} run coins</span>
        <span class="cur">🏅 ${run.rewards.relics} relics</span>
      </div>
      <div class="stop-grid">${cards}</div>
      <div class="sheet-actions"><button class="btn small stop-later" id="dgStopLater">Leave it for later</button></div>
    `);
    el.overlay.querySelectorAll('[data-rest]').forEach((btn) =>
      btn.addEventListener('click', () => applyDungeonRest(btn.dataset.rest))
    );
    el.overlay.querySelector('#dgStopLater').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
      show('dungeon');
    });
  }

  function openShopFloor() {
    const run = dungeonRun;
    const stop = run && run.stop;
    if (!stop || stop.type !== 'shop') return;
    const rows = stop.offers.map((o) => {
      const bought = !!stop.bought[o.id];
      return `<div class="shop-row">
        <span class="pc-ico">${o.icon}</span>
        <div class="pc-body"><b>${o.name}</b><small>${o.desc}</small></div>
        <button class="btn small ${bought ? 'stop-bought' : ''}" data-shop="${o.id}" aria-label="${bought ? `${o.name} already bought` : `Buy ${o.name} for ${o.cost} run coins`}" ${bought ? 'disabled' : ''}>${bought ? 'Bought ✓' : `${o.cost} 🪙`}</button>
      </div>`;
    }).join('');
    openSheet(`
      <div class="eyebrow">Dungeon · depth ${stop.floor}</div>
      <h2>The Lamplighter</h2>
      <p>“You look like you've been counting coppers in the dark. I can turn some of that run purse into something useful.”</p>
      <div class="stop-wallet">
        <span class="cur">🪙 ${run.rewards.coins} run coins</span>
        <span class="cur">🏅 ${run.rewards.relics} relics</span>
      </div>
      <div class="shop-list">${rows}</div>
      <div class="sheet-actions">
        <button class="btn gold" id="dgStopNext">Descend to depth ${stop.floor + 1} →</button>
        <button class="btn small stop-later" id="dgStopLater">Leave for later</button>
      </div>
    `);
    el.overlay.querySelectorAll('[data-shop]').forEach((btn) =>
      btn.addEventListener('click', () => buyDungeonSupply(btn.dataset.shop))
    );
    el.overlay.querySelector('#dgStopNext').addEventListener('click', () => { SFX.play('click'); leaveDungeonStop(); });
    el.overlay.querySelector('#dgStopLater').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
      show('dungeon');
    });
  }

  function healDungeonParty(frac) {
    if (!dungeonRun) return;
    dungeonRun.carryHp = dungeonRun.carryHp || {};
    save.party.forEach((id) => {
      const def = heroDef(id);
      if (!def) return;
      const stats = DATA.heroStats(def, pigLevel(id), gearOf(id), forgeOf(id), save.charRelics[id]);
      const maxHp = stats.maxHp;
      const current = dungeonRun.carryHp[id] == null ? maxHp : dungeonRun.carryHp[id];
      dungeonRun.carryHp[id] = Math.min(maxHp, Math.round(current + maxHp * frac));
    });
  }

  function applyDungeonRest(id) {
    if (!dungeonRun || !dungeonRun.stop || dungeonRun.stop.type !== 'rest') return;
    const run = dungeonRun;
    const stop = run.stop;
    const offer = stop.offers.find((o) => o.id === id);
    if (!offer) return;
    let note = '';
    if (id === 'heal') {
      healDungeonParty(1);
      note = 'Squad healed to full';
    } else if (id === 'whet') {
      run.atkBonus = (run.atkBonus || 0) + 0.12;
      note = '+12% attack for this run';
    } else if (id === 'relic') {
      run.rewards.relics += 1;
      note = '+1 run relic';
    } else if (id === 'coins') {
      run.rewards.coins += 25 + stop.floor * 4;
      note = `+${25 + stop.floor * 4} run coins`;
    } else if (id === 'potion') {
      save.potions.heal = (save.potions.heal || 0) + 1;
      note = '+1 healing potion';
    }
    toast(`${offer.icon} ${offer.name} · ${note}`, null);
    leaveDungeonStop();
  }

  function buyDungeonSupply(id) {
    if (!dungeonRun || !dungeonRun.stop || dungeonRun.stop.type !== 'shop') return;
    const run = dungeonRun;
    const stop = run.stop;
    const offer = stop.offers.find((o) => o.id === id);
    if (!offer || stop.bought[id]) return;
    if (run.rewards.coins < offer.cost) {
      SFX.play('nope');
      toast(`Need ${offer.cost} run coins for ${offer.name}.`, null);
      return;
    }
    run.rewards.coins -= offer.cost;
    stop.bought[id] = true;
    let note = '';
    if (id === 'heal') {
      healDungeonParty(0.5);
      note = 'squad healed 50%';
    } else if (id === 'whet') {
      run.atkBonus = (run.atkBonus || 0) + 0.1;
      note = '+10% attack';
    } else if (id === 'relic') {
      run.rewards.relics += 1;
      note = '+1 run relic';
    } else if (id === 'potion') {
      save.potions.heal = (save.potions.heal || 0) + 1;
      note = '+1 healing potion';
    } else if (id === 'xp') {
      run.rewards.xp += 30;
      note = '+30 run XP';
    }
    persist();
    SFX.play('buy');
    toast(`Bought ${offer.name} · ${note}`, null);
    openShopFloor();
  }

  function leaveDungeonStop() {
    if (!dungeonRun || !dungeonRun.stop) { closeOverlay(); show('dungeon'); return; }
    const stop = dungeonRun.stop;
    dungeonRun.lastStop = stop.floor;
    dungeonRun.stop = null;
    dungeonRun.floor = stop.floor + 1;
    persist();
    closeOverlay();
    show('dungeon');
    SFX.play('gate');
  }

  function onDungeonLose() {
    if (!dungeonRun) return;
    const floor = dungeonRun.bestFloor || 1;
    claimDungeon(true, `The pigs fell at depth ${floor}. The fog keeps half the loot.`);
  }

  function claimDungeon(half, message) {
    if (!dungeonRun) { show('dungeon'); return; }
    const run = dungeonRun;
    const f = half ? 0.5 : 1;
    const c = Math.round(run.rewards.coins * f);
    const h = Math.round(run.rewards.herbs * f);
    const rel = Math.round(run.rewards.relics * f);
    const xp = Math.round(run.rewards.xp * f);
    save.coins += c;
    save.herbs += h;
    save.relics += rel;
    const ups = addXp(xp);
    save.dungeon.best = Math.max(save.dungeon.best || 0, run.bestFloor || 0);
    dungeonRun = null;
    persist();
    checkAchievements();
    openSheet(`
      <div class="eyebrow">Dungeon run ${half ? 'lost' : 'banked'}</div>
      <h2>${half ? 'The fog takes its cut' : 'Loot secured'}</h2>
      <p>${message || ''}</p>
      <div class="reward-line"><span>Deepest depth</span><b>${run.bestFloor || 0}</b></div>
      <div class="reward-line"><span>Run score</span><b>${run.score}</b></div>
      <div class="reward-line"><span>Coins</span><b>+${c} 🪙</b></div>
      ${rel ? `<div class="reward-line"><span>Relics</span><b>+${rel} 🏅</b></div>` : ''}
      ${h ? `<div class="reward-line"><span>Herbs</span><b>+${h} 🌿</b></div>` : ''}
      ${xp ? `<div class="reward-line"><span>XP</span><b>+${xp} 📗${ups ? ' · level up!' : ''}</b></div>` : ''}
      <div class="sheet-actions"><button class="btn" id="ovClose">Back to the dungeon</button></div>
    `, { dark: half });
    el.overlay.querySelector('#ovClose').addEventListener('click', () => {
      SFX.play('click');
      closeOverlay();
      show('dungeon');
    });
  }

  /* ============================================================
     Boot
     ============================================================ */

  const initTips = () => window.initTips && window.initTips();

  function init() {
    initTips();
    if (!save.settings) save.settings = { sound: true, ui: 'normal', motion: true };
    applySettings();
    ensureUnlocks();
    /* Catch-up: a pig that joined before its scene could be shown (the old code
       tried to play it underneath the victory sheet and lost it) still gets to
       play its scene once, on the next visit. */
    setTimeout(() => {
      save.heroes.forEach((id) => {
        const cut = RECRUIT_SCENES[id];
        if (cut && !save.cutscenes[cut] && !pendingScenes.includes(cut)) pendingScenes.push(cut);
      });
      flushPending();
    }, 900);
    if (!save.seenHeroes.corporal) save.seenHeroes.corporal = true;
    show('title');
    if (save.started && !save.cutscenes.intro1) save.cutscenes.intro1 = true;
    /* First launch (or a save that never finished the tour) starts the walk-
       through on the title screen, where it forces the Start button. */
    if (!save.started || !(save.tutorial && save.tutorial.done)) {
      setTimeout(() => beginGuidedTour(), 700);
    }
  }

  return { init, show };
})();

Game.init();
