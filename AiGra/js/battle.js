/* ============================================================
   Battle engine + battle screen UI
   ============================================================ */
const Battle = (function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let B = null;
  let el = {};
  let hooks = {};

  const HERO_NAME = (def) => def.name.replace(' Pig', '');
  const escAttr = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------------- setup ---------------- */

  function buildHero(def, gear, level, forgeLevel, startHp, relicId, atkBonus, weaponId, shieldId) {
    const stats = DATA.heroStats(def, level, gear, forgeLevel, relicId);
    const relic = relicId || (DATA.relicForHero(def.id) || {}).id;
    return {
      def,
      relic,
      craftedWeapon: weaponId || null,
      craftedShield: shieldId || null,
      actedThisRound: false,
      gear: gear || { weapon: 1, helmet: 1 },
      level,
      maxHp: stats.maxHp,
      hp: startHp != null ? clamp(Math.round(startHp), 1, stats.maxHp) : stats.maxHp,
      atk: Math.round(stats.atk * (1 + (atkBonus || 0))),
      rage: 2,
      /* No free opening shield: a shield only appears when an ability grants
         one. Bacon Plating still adds its slice if the player trained it. */
      shield: Math.round((DATA.trainingBonus.guard || 0) * 100),
      shieldTurns: DATA.trainingBonus.guard ? 3 : 0,
      stun: 0,
      weak: 0,
      silence: 0,
      burn: null,
      poison: null,
      guard: null,
      taunt: 0,
      alive: true,
      /* The live pig is handed in so every ability description can quote what
         it hits for at this level, not only its percentage. */
      abilities: DATA.abilitiesFor(def, gear, relicId, { level, atk: stats.atk, maxHp: stats.maxHp }),
      el: null,
    };
  }

  function buildEnemy(entry, level, index) {
    const tpl = DATA.enemies[entry.t];
    const tune = DATA.tuning || { enemyHp: 1, enemyAtk: 1 };
    /* A boss is already the hardest thing in its world; stacking the level
       curve and tuning on top turned the Frost King into a 7,700 HP wall.
       Bosses scale once, gently. */
    const hpMul = tpl.boss ? Math.min(entry.hpMul || 1, 1.15) : (entry.hpMul || 1);
    const atkMul = tpl.boss ? Math.min(entry.atkMul || 1, 1.15) : (entry.atkMul || 1);
    /* Egg World opens a little softer: a new squad has no gear yet, and the
       first world is a tutorial in disguise. Bosses keep their full bite. */
    const ease = level && level.world === 1 && !tpl.boss ? 0.9 : 1;
    const maxHp = Math.round(tpl.hp * hpMul * tune.enemyHp * ease);
    const built = {
      uid: 'e' + index,
      key: entry.t,
      tpl,
      name: tpl.name,
      art: tpl.art,
      maxHp,
      hp: maxHp,
      atk: Math.round(tpl.atk * atkMul * tune.enemyAtk * ease * 10) / 10,
      armor: tpl.armor || 0,
      flying: !!tpl.flying,
      haunt: !!tpl.haunt,
      /* Iron hide: hits under this much are blunted to 75%. */
      soakAt: tpl.soakAt || 0,
      /* Knight's guard: hits under this much are halved. */
      halfAt: tpl.halfAt || 0,
      /* Charges of outright evasion from a dodge buff. */
      dodgeCharge: 0,
      shieldTurns: 0,
      stun: 0,
      burn: null,
      poison: null,
      chili: 0,
      chiliHits: 0,
      weak: 0,
      silence: 0,
      shield: 0,
      veil: 0,
      power: 0,
      powerTurns: 0,
      /* A rage buff raises the bird's own attack for a few rounds. */
      rageTurns: 0,
      rageBase: 0,
      /* Lifesteal on the move this bird is currently swinging. */
      activeLeech: 0,
      fuse: 'idle',
      alive: true,
      ghost: false,
      ghostTimer: 0,
      ghostMax: 2,
      rising: false,
      ghostType: null,
      revived: false,
      boss: !!tpl.boss,
      focus: 0,
      special: null,
      cdHave: 0,
      el: null,
    };
    /* The charged special this bird is winding up: it cannot attack while the
       bar fills, and a full bar is what fires the move. */
    built.special = pickSpecial(built);
    return built;
  }

  /* Crispy: a short char plus an ember burst for anything set on fire. */
  function crispy(node) {
    if (!node) return;
    node.classList.add('crispy');
    setTimeout(() => node.classList.remove('crispy'), 520);
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('i');
      s.className = 'ember';
      s.style.setProperty('--dx', (Math.random() * 70 - 35).toFixed(0) + 'px');
      s.style.setProperty('--dy', (-30 - Math.random() * 50).toFixed(0) + 'px');
      s.style.animationDelay = (Math.random() * 160).toFixed(0) + 'ms';
      s.style.left = (30 + Math.random() * 40).toFixed(0) + '%';
      node.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  function pickSpecial(enemy) {
    /* Only real attacks earn a charge bar. Healing, shielding, summoning,
       marking and self-buffs stay ordinary turns, so a full bar always means
       a hit is landing on the pigs. */
    const list = ((enemy.tpl && enemy.tpl.moves) || []).filter((m) => m.cd > 0
      && (m.kind === 'single' || m.kind === 'multi' || m.kind === 'aoe' || m.kind === 'charge'));
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  /* Six pepper charge for every pig in the party: eighteen with three pigs. */
  const PEPPER_PER_PIG = 6;
  function pepperNeed() {
    return PEPPER_PER_PIG * ((B && B.heroes && B.heroes.length) || 1);
  }

  /* One squad-wide meter. Nothing else builds or spends it. */
  function addPepper(n) {
    if (!B || !n) return;
    B.pepperCharge = Math.min(pepperNeed(), (B.pepperCharge || 0) + n);
  }

  /* Every bird you hit is worth charge: one for the wound, one more for a
     tank, and one more when the strike lands something the bird is weak to. */
  function pepperForHit(enemy, ab) {
    let n = 1;
    if (DATA.tankBirds && DATA.tankBirds.includes(enemy.key || enemy.t)) n += 1;
    const key = enemy.key || enemy.t;
    const chart = (DATA.effectCharts && DATA.effectCharts.birds && DATA.effectCharts.birds[key]) || {};
    const fx = ['burn', 'stun', 'weaken', 'silence'];
    if (ab && fx.some((k) => ab[k] && chart[k] >= 1.2)) n += 1;
    return n;
  }

  /* Each world, each boss and the dungeon run their own cue. */
  function musicThemeFor(level) {
    const id = String((level && level.id) || '');
    if (id.indexOf('dungeon') === 0) return 'dungeon';
    if (level && level.boss) return 'boss' + (level.world || 1);
    return 'world' + ((level && level.world) || 1);
  }

  function start(level, profile, callbacks) {
    hooks = callbacks || {};
    const roster = (profile.party && profile.party.length ? profile.party : ['corporal']);
    /* Every pig carries its own level now; a profile without a per-pig entry
       falls back to the squad level it used to pass. */
    const levels = profile.levels || {};
    const heroes = roster
      .map((id) => DATA.heroes.find((h) => h.id === id))
      .filter(Boolean)
      .slice(0, 4)
      .map((def) => buildHero(
        def,
        profile.gear && profile.gear[def.id],
        levels[def.id] || profile.level,
        profile.forge && profile.forge[def.id],
        profile.carryHp && profile.carryHp[def.id],
        profile.relics && profile.relics[def.id],
        profile.atkBonus || 0,
        profile.weapons && profile.weapons[def.id],
        profile.shields && profile.shields[def.id]
      ));

    B = {
      level,
      heroes,
      wave: 1,
      waveCount: DATA.wavesFor(level),
      potionTiers: profile.potionTiers || {},
      enemies: DATA.waveEntries(level, 1).map((entry, i) => buildEnemy(entry, level, i)),
      round: 1,
      phase: 'hero',
      active: 0,
      selected: 0,
      pending: null,
      busy: true,
      over: false,
      acted: false,
      items: Object.assign({}, profile.items || {}),
      might: 0,
      mark: null,
      /* The pepper runs on one squad-wide charge meter, not a per-pig count. */
      pepperCharge: 0,
      pepperCd: 0,
      stats: { dealt: 0, taken: 0, healed: 0, kills: 0, ults: 0, byKey: {}, hero: {} },
    };
    B.enemies.forEach((e) => { e.focus = Math.floor(Math.random() * B.heroes.length); });
    /* Per-pig tallies: the victory screen needs an MVP, not just a team total. */
    B.heroes.forEach((h) => { B.stats.hero[h.def.id] = { dealt: 0, healed: 0 }; });

    renderScreen();
    refresh();
    setHint('Get ready…');
    /* The soundtrack starts with the fight. */
    Music.play(musicThemeFor(level));
    setTimeout(() => {
      if (!B || B.over) return;
      banner(B.waveCount > 1 ? `Wave 1 / ${B.waveCount}` : 'Round 1', 'wave');
      startHeroPhase();
      SFX.play('start');
    }, 420);
  }

  /* ---------------- DOM ---------------- */

  function renderScreen() {
    const screen = document.getElementById('screen-battle');
    screen.innerHTML = `
      <div class="battle-top">
        <div class="lv-title">
          <b>${B.level.name}</b>
          <span>World ${B.level.world} · ${B.level.boss ? 'Boss fight' : B.level.elite ? 'Elite flock' : 'Skirmish'}</span>
        </div>
        <div class="wave-track" id="waveTrack" data-tip="Waves in this fight">
          <span class="wave-label">${B.wave}/${B.waveCount}</span>
          <span class="wave-pips">${Array.from({ length: B.waveCount }, (_, wi) => `<i class="wave-pip" title="Wave ${wi + 1}">${wi + 1}</i>`).join('')}</span>
        </div>
        <div class="round-chip">ROUND <b id="roundNum">1</b></div>
        <button class="icon-btn" id="btnSettings" title="Settings">⚙️</button>
        <button class="icon-btn" id="btnSound" title="Sound on/off">🔊</button>
        <button class="icon-btn" id="btnRetreat" title="Retreat to the map">✕</button>
      </div>
      <div class="items-top" id="itemsTop"></div>
      <div class="stage world-${B.level.world || 1} biome-${B.level.biome || 'meadow'}" id="stage">
        <div class="cloud" style="width:80px; top:12%; animation-duration:52s;"></div>
        <div class="cloud" style="width:52px; top:24%; animation-duration:38s; animation-delay:-12s;"></div>
        <div class="cloud" style="width:110px; top:6%; animation-duration:64s; animation-delay:-30s;"></div>
        <!-- Floor/wave rail: one egg per wave, down the right middle. -->
        <div class="wave-rail" id="waveRail" aria-hidden="true">
          ${Array.from({ length: B.waveCount }, (_, wi) => `<i class="wr-pip" data-wave="${wi + 1}"><b>${wi + 1}</b></i>`).join('')}
        </div>
        <div class="sides">
          <div class="side heroes" id="heroSide"></div>
          <div class="side enemies" id="enemySide"></div>
        </div>
        <div class="battle-log" id="battleLog"></div>
      </div>
      <div class="hint-bar" id="hintBar"></div>
      <!-- Pepper charge pours along this bar and into the chili at the far end. -->
      <div class="rage-meter" id="rageMeter">
        <span class="rm-name">Pepper charge</span>
        <div class="rm-track">
          <i class="rm-fill"></i>
          <i class="rm-mark"></i>
          <span class="rm-val">0 / 18</span>
        </div>
        <button class="rm-chili" id="rmChili" type="button" disabled>
          <span class="rm-ico">🌶️</span><span class="rm-cost">6</span>
        </button>
      </div>
      <div class="hud">
        <div class="hud-hero" id="hudHero"></div>
        <div class="hud-actions" id="hudActions"></div>
        <div class="potion-tray hidden" id="potionTray"></div>
      </div>
    `;

    el = {
      screen,
      stage: screen.querySelector('#stage'),
      heroSide: screen.querySelector('#heroSide'),
      enemySide: screen.querySelector('#enemySide'),
      hudHero: screen.querySelector('#hudHero'),
      hudActions: screen.querySelector('#hudActions'),
      potionTray: screen.querySelector('#potionTray'),
      rageMeter: screen.querySelector('#rageMeter'),
      itemsTop: screen.querySelector('#itemsTop'),
      hint: screen.querySelector('#hintBar'),
      log: screen.querySelector('#battleLog'),
      round: screen.querySelector('#roundNum'),
    };

    B.heroes.forEach((h, i) => {
      const fig = document.createElement('div');
      fig.className = 'fig hero spawn';
      fig.dataset.hero = String(i);
      fig.style.animationDelay = i * 90 + 'ms';
      fig.innerHTML = `
        <div class="ground-ring"></div>
        <div class="turn-ring"></div>
        <div class="focus-ring"></div>
        <div class="statuses"></div>
        ${Art.hero(h.def.id, h.relic, h.craftedWeapon, h.craftedShield)}
        <div class="nameplate">${HERO_NAME(h.def)}</div>
        <div class="hp-track"><i></i></div>
        <div class="shield-num hidden">🛡 0</div>
      `;
      fig.setAttribute('data-tip', DATA.heroTip(h));
      fig.addEventListener('click', () => onHeroClick(i));
      el.heroSide.appendChild(fig);
      h.el = fig;
      setTimeout(() => fig.classList.remove('spawn'), 500 + i * 90);
    });

    /* Six, seven or eight birds share one side, so a crowded field shrinks
       the figures instead of overflowing the stage. */
    el.enemySide.classList.toggle('dense', B.enemies.length > 4);

    /* Four or more on one side stands in two ranks — a front line and a back
       row — instead of one cramped file. */
    el.enemySide.classList.toggle('two-row', B.enemies.length >= 4);
    el.heroSide.classList.toggle('two-row', B.heroes.length >= 4);

    B.enemies.forEach((e, i) => {
      const fig = document.createElement('div');
      /* A boss is the headliner: it gets its own class so the stage can draw
         it bigger than the flock around it. */
      fig.className = 'fig enemy spawn' + (e.tpl && e.tpl.boss ? ' boss' : '');
      fig.dataset.enemy = e.uid;
      fig.style.animationDelay = 120 + i * 110 + 'ms';
      fig.innerHTML = `
        <div class="statuses"></div>
        ${Art.enemy(e.art)}
        <div class="nameplate">${e.name}</div>
        <div class="hp-track"><i></i></div>
        <div class="shield-num hidden">🛡 0</div>
        <div class="cd-row hidden"><span class="cd-ico"></span><span class="cd-track"><i></i></span><b class="cd-num">0/0</b></div>
        <div class="cd-row ghost-row hidden"><span class="cd-ico">👻</span><span class="cd-track"><i></i></span><b class="cd-num">0/2</b></div>
        <div class="shield-bubble hidden"></div>
        <div class="ghost-mark">👻</div>
      `;
      fig.setAttribute('data-tip', DATA.enemyTip(e));
      fig.addEventListener('click', () => onEnemyClick(e));
      el.enemySide.appendChild(fig);
      e.el = fig;
      setTimeout(() => fig.classList.remove('spawn'), 700 + i * 110);
    });

    /* The chili at the end of the bar is the pepper button once it lights. */
    if (el.rageMeter) {
      const chiliBtn = el.rageMeter.querySelector('#rmChili');
      if (chiliBtn) {
        chiliBtn.addEventListener('click', () => {
          const hero = B.heroes[B.selected];
          if (!hero || !heroReady(hero)) return;
          const idx = hero.abilities.findIndex((a) => a.chili);
          if (idx < 0) {
            SFX.play('nope');
            setHint('Only some pigs carry a pepper — this one fights with steel.');
            return;
          }
          chooseAbility(idx);
        });
      }
    }

    el.screen.querySelector('#btnRetreat').addEventListener('click', () => {
      if (B.over || B.busy) return;
      Music.stop(0.4);
      hooks.onRetreat && hooks.onRetreat();
    });
    el.screen.querySelector('#btnSettings').addEventListener('click', () => {
      SFX.play('click');
      hooks.onSettings && hooks.onSettings();
    });
    const snd = el.screen.querySelector('#btnSound');
    snd.textContent = SFX.isMuted() ? '🔇' : '🔊';
    snd.addEventListener('click', () => {
      SFX.setMuted(!SFX.isMuted());
      snd.textContent = SFX.isMuted() ? '🔇' : '🔊';
      SFX.play('click');
      hooks.onMuteChange && hooks.onMuteChange(SFX.isMuted());
    });
  }

  document.addEventListener('keydown', (ev) => {
    if (!B || B.over) return;
    if (document.getElementById('screen-battle').classList.contains('hidden')) return;
    if (ev.key === 'Escape') {
      if (B.pending) { B.pending = null; refresh(); }
      return;
    }
    if (ev.key === 'p' || ev.key === 'P') { toggleTray(); return; }
    if (B.phase !== 'hero' || B.busy) return;
    const idx = Number(ev.key) - 1;
    if (idx >= 0 && idx < 3) chooseAbility(idx);
  });

  /* ---------------- refresh ---------------- */

  function refresh() {
    if (!B) return;
    el.round.textContent = B.round;
    /* Wave pips: cleared waves filled, current one lit. */
    const wt = document.getElementById('waveTrack');
    if (wt) {
      wt.querySelectorAll('.wave-pip').forEach((pip, wi) => {
        pip.classList.toggle('done', wi + 1 < B.wave);
        pip.classList.toggle('on', wi + 1 === B.wave);
      });
      const label = wt.querySelector('.wave-label');
      if (label) label.textContent = `${B.wave}/${B.waveCount}`;
      wt.setAttribute('data-tip', `Wave ${B.wave} of ${B.waveCount} — clear them all to win`);
    }
    /* Same state as the top pips, mirrored down the right edge where the
       action is, so the current floor is readable without looking up. */
    const rail = document.getElementById('waveRail');
    if (rail) {
      rail.querySelectorAll('.wr-pip').forEach((pip, wi) => {
        const done = wi + 1 < B.wave;
        const now = wi + 1 === B.wave;
        pip.classList.toggle('done', done);
        pip.classList.toggle('on', now);
        pip.setAttribute('data-tip', `Wave ${wi + 1} of ${B.waveCount}${now ? ' — fighting now' : done ? ' — cleared' : ''}`);
      });
    }

    B.heroes.forEach((h, i) => {
      const fig = h.el;
      const pct = Math.max(0, h.hp / h.maxHp) * 100;
      const hpBar = fig.querySelector('.hp-track');
      hpBar.querySelector('i').style.width = pct + '%';
      hpBar.classList.toggle('low', pct <= 30);
      fig.classList.toggle('ko', !h.alive);
      fig.classList.toggle('active', B.phase === 'hero' && i === B.selected && !B.over);
      fig.classList.toggle('can-act', B.phase === 'hero' && heroReady(h) && !B.over);
      fig.classList.toggle('acted', !!h.actedThisRound);
      fig.classList.toggle('targetable', !!(B.pending && B.pending.target === 'ally' && h.alive));
      fig.classList.toggle('focused', h.alive && B.enemies.some((e) => e.alive && e.focus === i && !e.ghost));
      fig.classList.toggle('marked', !!(B.mark && B.mark.turns > 0 && B.mark.id === h.def.id && h.alive));

      fig.setAttribute('data-tip', DATA.heroTip(h));

      let bubble = fig.querySelector('.shield-bubble');
      if (h.shield > 0 && !bubble) {
        bubble = document.createElement('div');
        bubble.className = 'shield-bubble';
        fig.appendChild(bubble);
      } else if (h.shield <= 0 && bubble) {
        bubble.remove();
      }

      const shNum = fig.querySelector('.shield-num');
      if (shNum) {
        const sv = Math.round(h.shield || 0);
        shNum.classList.toggle('hidden', sv <= 0);
        if (sv > 0) shNum.textContent = '🛡 ' + sv + '%';
      }

      const st = fig.querySelector('.statuses');
      let icons = '';
      if (B.mark && B.mark.turns > 0 && B.mark.id === h.def.id && h.alive) icons += '<span title="Marked — the whole flock is focused on this pig" class="focus-mark">🎯</span>';
      if (h.poison && h.poison.turns > 0) icons += '<span title="Poisoned">☠️</span>';
      if (B.might > 0) icons += '<span title="Might">💪</span>';
      if (h.guard && h.guard.turns > 0) icons += '<span title="Guarding">🛡️</span>';
      if (h.taunt > 0) icons += '<span title="Taunting">😠</span>';
      if (!h.alive) icons = '<span title="Knocked out">💫</span>';
      else {
        if (h.stun > 0) icons += '<span title="Stunned">💫</span>';
        if (h.frozen > 0) icons += '<span title="Frozen — loses turns and takes +25% damage">🧊</span>';
        if (h.drenched > 0) icons += '<span title="Drenched — shields washed off, takes +20% damage">🌊</span>';
        if (h.expose > 0) icons += '<span title="Exposed — takes +25% damage for ' + h.expose + ' more round' + (h.expose === 1 ? '' : 's') + '">🩸</span>';
        if (h.pepperDry > 0) icons += '<span title="Pepper numb — this pig\'s hits build no pepper for ' + h.pepperDry + ' more round' + (h.pepperDry === 1 ? '' : 's') + '">🧂</span>';
        if (h.burn && h.burn.turns > 0) icons += '<span title="Burning — takes ' + h.burn.dmg + ' damage after the pigs act for ' + h.burn.turns + ' more round' + (h.burn.turns === 1 ? '' : 's') + '">🔥</span>';
        if (h.mire > 0) icons += '<span title="Mired — 100% of this pig\'s healing is stolen by the flock for ' + h.mire + ' more round' + (h.mire === 1 ? '' : 's') + '. Cleanse it.">🕳️</span>';
        if (h.weak > 0) icons += '<span title="Weakened">🦴</span>';
        if (h.silence > 0) icons += '<span title="Silenced">🤐</span>';
      }
      st.innerHTML = icons;
    });

    B.enemies.forEach((e) => {
      const fig = e.el;
      const pct = Math.max(0, e.hp / e.maxHp) * 100;
      const hpBar = fig.querySelector('.hp-track');
      hpBar.querySelector('i').style.width = pct + '%';
      hpBar.classList.toggle('low', pct <= 30);
      fig.classList.toggle('dying', !e.alive && !e.ghost);
      fig.classList.toggle('ghost', !!e.ghost);
      fig.dataset.ghost = e.ghost && e.ghostType ? e.ghostType.id : '';
      fig.classList.toggle('targetable', !!B.pending && B.pending.target === 'enemy' && e.alive && !e.ghost);
      fig.setAttribute('data-tip', DATA.enemyTip(e));
      const bubble = fig.querySelector('.shield-bubble');
      if (bubble) bubble.classList.toggle('hidden', !(e.shield > 0));
      const shNum = fig.querySelector('.shield-num');
      if (shNum) {
        const sv = Math.round(e.shield || 0);
        shNum.classList.toggle('hidden', sv <= 0);
        if (sv > 0) shNum.textContent = '🛡 ' + sv + '%';
      }
      /* Charge bar: black while empty, blue as it fills, glowing when ready. */
      const cdRow = fig.querySelector('.cd-row');
      if (cdRow) {
        const sp = e.special;
        /* Nothing telegraphs a move that has not started winding up: the
           bar only appears once the bird has banked its first charge tick. */
        const show = !!(sp && sp.cd > 0 && e.cdHave > 0 && e.alive && !e.ghost && !e.charge);
        cdRow.classList.toggle('hidden', !show);
        if (show) {
          const have = Math.max(0, Math.min(e.cdHave, sp.cd));
          cdRow.querySelector('.cd-ico').textContent = sp.icon || '✨';
          cdRow.querySelector('.cd-track i').style.width = (have / sp.cd) * 100 + '%';
          cdRow.querySelector('.cd-num').textContent = have + '/' + sp.cd;
          cdRow.classList.toggle('ready', have >= sp.cd);
        }
      }
      /* Revive countdown for a bird that is currently a ghost. */
      const ghostRow = fig.querySelector('.ghost-row');
      if (ghostRow) {
        const gmax = e.ghostMax || 2;
        const gtype = e.ghostType;
        /* Count *towards* the revival: 1/3 and 2/3 as the ghost drifts closer,
           then 3/3 as it stands up. A charge only appears above zero. */
        const toward = Math.max(0, Math.min(gmax, gmax - e.ghostTimer));
        const showGhost = !!e.ghost && (toward > 0 || e.rising);
        ghostRow.classList.toggle('hidden', !showGhost);
        if (showGhost) {
          const left = Math.max(0, gmax - toward);
          ghostRow.querySelector('.cd-ico').textContent = gtype ? gtype.icon : '👻';
          ghostRow.querySelector('.cd-track i').style.width = Math.round((toward / gmax) * 100) + '%';
          ghostRow.querySelector('.cd-num').textContent = toward + '/' + gmax;
          ghostRow.classList.toggle('ready', left <= 1);
          ghostRow.title = (gtype ? gtype.name + ' — ' + gtype.blurb : 'Ghost')
            + (left <= 1
              ? ' — RISES NEXT ROUND: finish the wave or shield the squad!'
              : '. Revives in ' + left + ' round' + (left === 1 ? '' : 's') + ' — it rises unless the fight ends first');
        }
      }
      const st = fig.querySelector('.statuses');
      let icons = '';
      if (e.stun > 0) icons += '<span title="Stunned">💫</span>';
      if (e.burn && e.burn.turns > 0) icons += '<span title="Burning">🔥</span>';
      if (e.poison && e.poison.turns > 0) icons += '<span title="Poisoned — ' + e.poison.dmg + ' damage after every pig turn for ' + e.poison.turns + ' more round' + (e.poison.turns === 1 ? '' : 's') + '">☠️</span>';
      if (e.chili > 0 && e.burn && e.burn.turns > 0) icons += '<span title="Chili heat +' + Math.min(e.chiliHits || 0, 4) * 15 + '% damage">🌶️</span>';
      if (e.weak > 0) icons += '<span title="Weakened">🦴</span>';
      if (e.silence > 0) icons += '<span title="Silenced">🤐</span>';
      if (e.vuln > 0) icons += '<span title="Open — takes +' + Math.round((e.vulnBonus || 0.2) * 100) + '% damage for ' + e.vuln + ' more round' + (e.vuln === 1 ? '' : 's') + '">🩸</span>';
      if (e.veil > 0) icons += '<span title="Mirage — 80% of attacks miss (' + e.veil + ' round' + (e.veil === 1 ? '' : 's') + ' left)">🌫️</span>';
      if (e.soakAt) icons += '<span title="Iron hide — hits under ' + e.soakAt + ' deal 75% damage">🧱</span>';
      if (e.halfAt) icons += '<span title="Knight\'s guard — hits under ' + e.halfAt + ' deal 50% damage">🛡️</span>';
      if (e.dodgeCharge > 0) icons += '<span title="Dodge charges: ' + e.dodgeCharge + ' — cleansing damage deletes these">💨</span>';
      if (e.power > 0) icons += '<span title="Frenzied — every hit deals +' + e.power + ' for ' + e.powerTurns + ' more round' + (e.powerTurns === 1 ? '' : 's') + '">⚡</span>';
      if (e.rageTurns > 0) icons += '<span title="Enraged — ' + Math.round(((e.atk / (e.rageBase || e.atk)) - 1) * 100) + '% more damage for ' + e.rageTurns + ' more round' + (e.rageTurns === 1 ? '' : 's') + '">🔥</span>';
      if (e.activeLeech > 0) icons += '<span title="Draining — heals ' + Math.round(e.activeLeech * 100) + '% of the damage it deals">🩸</span>';
      if (e.fuse === 'lit') icons += '<span title="Fuse lit!">💣</span>';
      if (e.ghost) icons += '<span title="Ghost">👻</span>';
      if (!e.ghost) icons += '<span title="Focus" class="focus-mark">🎯</span>';
      st.innerHTML = icons;
    });

    /* A near-death squad gets a red edge on the field: a standing warning that
       costs no HUD space and stops as soon as the pigs are safe. */
    if (el.stage) {
      const danger = B.heroes.some((h) => h.alive && h.hp / h.maxHp <= 0.25);
      el.stage.classList.toggle('danger', danger && !B.over);
    }

    refreshHud();
    refreshHint();
  }

  /* Only touch the DOM when the markup really changed — rewriting a hovered
     button's HTML every refresh made it blink (and killed hover/tooltips). */
  function setHtml(node, html) {
    if (!node) return false;
    if (node.dataset.html === html) return false;
    node.dataset.html = html;
    node.innerHTML = html;
    return true;
  }

  /* Big charge bar: the squad's pepper charge, shared by every pig, filling
     up and pouring into the chili at the far end. */
  function updateRageMeter(hero) {
    const node = el.rageMeter;
    if (!node) return;
    const chiliIdx = hero ? hero.abilities.findIndex((a) => a.chili) : -1;
    const chili = chiliIdx >= 0 ? hero.abilities[chiliIdx] : null;
    const need = pepperNeed();
    const charge = Math.min(need, B.pepperCharge || 0);
    const ready = !!chili && charge >= need;
    const cooling = !!chili && ready && (B.pepperCd || 0) > 0;
    const live = ready && !cooling && hero.alive && B.phase === 'hero' && !B.busy;

    const pct = (charge / need) * 100;
    const fill = node.querySelector('.rm-fill');
    fill.style.width = Math.round(pct) + '%';
    fill.classList.toggle('hot', ready);
    const mark = node.querySelector('.rm-mark');
    mark.style.display = 'none';

    /* A numbed pig builds no pepper at all: name it on the bar so a hit that
       charges nothing is explained instead of looking broken. */
    const numbed = !!(hero && hero.pepperDry > 0);
    node.classList.toggle('numbed', numbed);
    node.querySelector('.rm-name').textContent = numbed ? 'No pepper · ' + hero.pepperDry : 'Pepper charge';
    node.querySelector('.rm-val').textContent = charge + ' / ' + need;

    const btn = node.querySelector('#rmChili');
    btn.classList.toggle('nope', !chili);
    btn.classList.toggle('charged', ready);
    btn.classList.toggle('live', live);
    btn.classList.toggle('spent', false);
    btn.classList.toggle('cooling', cooling);
    btn.disabled = !live;
    btn.querySelector('.rm-cost').textContent = !chili
      ? ''
      : cooling
        ? 'W' + B.pepperCd
        : String(charge);
    btn.setAttribute('data-tip', !chili
      ? 'This pig carries no pepper — the charge is shared by the squad'
      : cooling
        ? 'Pepper cooling — ' + B.pepperCd + ' more round' + (B.pepperCd === 1 ? '' : 's')
        : ready
          ? chili.name + ' is ready — tap the chili'
          : 'Pepper charge ' + charge + ' / ' + need + ' — every bird you hit builds it');
  }

  function refreshHud() {
    if (window.initTips) window.initTips();
    const chosen = B.heroes[B.selected];
    const shown = chosen && chosen.alive ? chosen : B.heroes.find((h) => h.alive);
    if (!shown) { el.hudHero.innerHTML = ''; el.hudActions.innerHTML = ''; return; }
    el.hudHero.innerHTML = `
      ${Art.hero(shown.def.id, shown.relic, shown.craftedWeapon, shown.craftedShield)}
      <div class="who">
        <b>${shown.def.name}</b>
        <span>${shown.def.role} · Lv ${shown.level}${shown.actedThisRound ? ' · acted' : ''}</span>
      </div>
    `;
    updateRageMeter(shown);

    const need = pepperNeed();
    const charge = Math.min(need, B.pepperCharge || 0);
    const cooling = (B.pepperCd || 0) > 0;
    const isHelp = (ab) => !!(ab.healParty || ab.healSingle || ab.shieldParty || ab.shieldSingle || ab.cleanse || ab.taunt || ab.guard);
    const entries = shown.abilities.map((ab, idx) => ({ ab, idx })).filter((e) => !e.ab.hidden);
    const pepper = entries.find((e) => e.ab.chili) || null;
    /* Two attacks, then the one team-help, then the pepper on its own wide row. */
    const bar = entries
      .filter((e) => !e.ab.chili)
      .sort((a, b) => (isHelp(a.ab) ? 1 : 0) - (isHelp(b.ab) ? 1 : 0) || a.idx - b.idx);

    let html = bar.map(({ ab, idx }) => {
      const selected = B.pending && B.pending.id === ab.id ? ' selected' : '';
      const cls = ab.cost >= 6 ? ' ult' : '';
      const kind = ab.target === 'self' && !isHelp(ab) ? ' passive' : isHelp(ab) ? ' help' : ' atk';
      const afford = heroReady(shown) && B.phase === 'hero' && !B.busy;
      const tip = escAttr(ab.desc);
      return `
        <button class="ability${cls}${kind}${selected}" data-ab="${idx}" ${afford ? '' : 'disabled'} data-tip="${tip}" title="${tip}">
          <span class="ab-top">
            <span class="ab-ico">${ab.icon}</span>
            <span class="ab-name">${kind === ' passive' ? '[Passive] ' : ''}${ab.name}</span>
            <span class="cost"><i class="on"></i></span>
          </span>
          <span class="ab-desc">${ab.desc}</span>
        </button>
      `;
    }).join('');

    if (pepper) {
      const ab = pepper.ab;
      const ready = charge >= need && !cooling;
      const live = ready && heroReady(shown) && B.phase === 'hero' && !B.busy;
      const count = cooling
        ? 'wait ' + B.pepperCd + (B.pepperCd === 1 ? ' round' : ' rounds')
        : ready
          ? 'ready'
          : charge + ' / ' + need;
      const pepperTip = escAttr(ab.desc);
      html += `
        <button class="ability pepper-big${ready ? ' ult' : ' spent'}" data-ab="${pepper.idx}" ${live ? '' : 'disabled'} data-tip="${pepperTip}" title="${pepperTip}">
          <span class="ab-top">
            <span class="ab-ico">${ab.icon}</span>
            <span class="pepper-tag">Pepper</span>
            <span class="ab-name">${ab.name}</span>
            <span class="cost pepper-count">${count}</span>
          </span>
          <span class="ab-desc">${cooling ? 'Cooling down — every bird you hit refills the meter.' : ready ? ab.desc : 'Hit birds to fill the meter, then throw it.'}</span>
        </button>
      `;
    }

    const itemCount = Object.values(B.items).reduce((a, b) => a + b, 0);

    if (setHtml(el.hudActions, html)) {
      el.hudActions.querySelectorAll('.ability[data-ab]').forEach((btn) => {
        btn.addEventListener('click', () => chooseAbility(Number(btn.dataset.ab)));
      });
    }
    if (el.itemsTop) {
      const chip = `<button class="ability items ${itemCount ? '' : 'empty'}" id="itemBtn" ${B.phase === 'hero' && !B.busy ? '' : 'disabled'} title="Battle items (P)">
        <span class="ab-top"><span class="ab-ico">🎒</span><span class="ab-name">Items</span><span class="cost"><b>${itemCount}</b></span></span>
        <span class="ab-desc">Potions & brews</span>
      </button>`;
      if (setHtml(el.itemsTop, chip)) {
        const topItem = el.itemsTop.querySelector('#itemBtn');
        if (topItem) topItem.addEventListener('click', toggleTray);
      }
    }

    renderTray();
  }

  function renderTray() {
    if (!B || !el.potionTray) return;
    if (el.potionTray.classList.contains('hidden')) return;
    const list = Object.keys(DATA.potions).filter((k) => k !== 'xp' && !DATA.potions[k].prebattle);
    B.potionsUsed = B.potionsUsed || {};
    el.potionTray.innerHTML = `
      <div class="tray-head">Battle items <span class="tray-cap">one of each per level</span><button class="icon-btn tiny" id="trayClose">✕</button></div>
      ${list.map((k) => {
        const p = DATA.potions[k];
        const count = B.items[k] || 0;
        const used = !!B.potionsUsed[k];
        const canBuy = count <= 0 && hooks.buyPotion && B.phase === 'hero' && !B.busy;
        return `<button class="tray-item ${count ? '' : 'tray-empty'}" data-potion="${k}" data-buy="${canBuy ? 1 : 0}" ${!used && (count > 0 || canBuy) && B.phase === 'hero' && !B.busy ? '' : 'disabled'}>
          <span class="ti-ico">${p.icon}</span>
          <span class="ti-txt"><b>${p.name}${((B.potionTiers || {})[k] || 1) > 1 ? ` · T${(B.potionTiers || {})[k]}` : ''}</b><small>${DATA.potionGradeText(k, (B.potionTiers || {})[k] || 1)}</small></span>
          <span class="ti-count">${used ? 'used' : count ? '×' + count : `🪙 ${p.shop || 60}`}</span>
        </button>`;
      }).join('')}
    `;
    el.potionTray.querySelector('#trayClose').addEventListener('click', toggleTray);
    el.potionTray.querySelectorAll('[data-potion]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const kind = btn.dataset.potion;
        if (btn.dataset.buy === '1') {
          const bought = hooks.buyPotion(kind);
          if (bought != null) { B.items[kind] = bought; renderTray(); }
          return;
        }
        usePotion(kind);
      })
    );
  }

  function toggleTray() {
    if (!B || B.over) return;
    el.potionTray.classList.toggle('hidden');
    renderTray();
  }

  function refreshHint() {
    let text = '';
    let pulse = false;
    if (B.over) {
      text = B.over === 'win' ? 'Victory!' : 'The flock wins this one…';
    } else if (B.pending) {
      text = B.pending.target === 'ally'
        ? `Tap a pig for ${B.pending.name} · Esc to cancel`
        : `Tap a bird for ${B.pending.name} · Esc to cancel`;
      pulse = true;
    } else if (B.phase === 'enemy') {
      const fusey = B.enemies.find((e) => e.alive && e.fuse === 'lit');
      text = fusey ? '💣 Bomb is lighting his fuse — brace!' : 'The flock is attacking…';
      pulse = !!fusey;
    } else if (B.busy) {
      text = '…';
    } else {
      const h = B.heroes[B.selected];
      if (h && h.actedThisRound) text = `${h.def.name} has already acted — tap another pig`;
      else if (h && (h.stun > 0 || h.frozen > 0)) text = `${h.def.name} cannot act this round — tap another pig`;
      else text = h ? `${h.def.name}'s turn — pick an action` : 'Tap a pig to act';
      if (B.level.tip && !B.acted) text = '💡 ' + B.level.tip;
    }
    el.hint.innerHTML = `<span class="${pulse ? 'pulse' : ''}">${text}</span>`;
  }

  function setHint(text) {
    el.hint.innerHTML = `<span>${text}</span>`;
  }

  function setLog(text) {
    if (el.log) el.log.textContent = text;
  }

  /* ---------------- juice ---------------- */

  function floatAt(fig, text, cls) {
    if (!fig || !el.stage) return;
    const stageRect = el.stage.getBoundingClientRect();
    const r = fig.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'float-num ' + (cls || '');
    d.textContent = text;
    d.style.left = r.left + r.width / 2 - stageRect.left + 'px';
    d.style.top = r.top + r.height * 0.3 - stageRect.top + 'px';
    el.stage.appendChild(d);
    setTimeout(() => d.remove(), 1050);
  }

  function sparks(fig, color, count) {
    if (!fig || !el.stage) return;
    const stageRect = el.stage.getBoundingClientRect();
    const r = fig.getBoundingClientRect();
    const cx = r.left + r.width / 2 - stageRect.left;
    const cy = r.top + r.height * 0.45 - stageRect.top;
    const n = count || 8;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.7;
      const dist = 24 + Math.random() * 46;
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.background = color || '#ffd45e';
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      s.style.setProperty('--s', 4 + Math.random() * 6 + 'px');
      el.stage.appendChild(s);
      setTimeout(() => s.remove(), 650);
    }
  }

  function shake(hard) {
    el.stage.classList.remove('shake', 'shake-hard');
    void el.stage.offsetWidth;
    el.stage.classList.add(hard ? 'shake-hard' : 'shake');
    setTimeout(() => el.stage.classList.remove('shake', 'shake-hard'), hard ? 520 : 340);
  }

  function flash(color) {
    const f = document.createElement('div');
    f.className = 'stage-flash';
    f.style.background = color || 'rgba(255,255,255,.55)';
    el.stage.appendChild(f);
    setTimeout(() => f.remove(), 420);
  }

  function banner(text, cls) {
    const b = document.createElement('div');
    b.className = 'banner ' + (cls || '');
    b.textContent = text;
    el.stage.appendChild(b);
    setTimeout(() => b.remove(), 1250);
  }

  function lunge(fig) {
    if (!fig) return;
    fig.classList.remove('attacking');
    void fig.offsetWidth;
    fig.classList.add('attacking');
    setTimeout(() => fig.classList.remove('attacking'), 460);
  }

  /* A landed hit leaves a ring and a small push on the camera. Inline
     transforms are ignored while a shake keyframe is running, so this can be
     called on every hit without fighting the bigger effects. */
  function impact(fig, opts) {
    if (!fig || !el.stage) return;
    const o = opts || {};
    const stageRect = el.stage.getBoundingClientRect();
    const r = fig.getBoundingClientRect();
    const ring = document.createElement('i');
    ring.className = 'impact-ring' + (o.hard ? ' hard' : '') + (o.huge ? ' huge' : '');
    ring.style.left = r.left + r.width / 2 - stageRect.left + 'px';
    ring.style.top = r.top + r.height * 0.48 - stageRect.top + 'px';
    ring.style.setProperty('--ring', o.color || '#ffd9a8');
    el.stage.appendChild(ring);
    setTimeout(() => ring.remove(), 640);
    punch(o.hard ? 1.02 : 1.012);
  }

  function punch(scale) {
    if (!el.stage) return;
    el.stage.style.transition = 'transform .1s ease-out';
    el.stage.style.transform = 'scale(' + (scale || 1.012) + ')';
    setTimeout(() => { if (el.stage) el.stage.style.transform = ''; }, 120);
  }

  /* Each kind of attack moves like itself. A slam crouches and drives down,
     a flurry skids side to side, a cast rises and glows, a peck just lunges.
     Only one movement class is ever on a figure, so the animations cannot
     fight each other. */
  const CHOREO = ['atk-peck', 'atk-slam', 'atk-spin', 'atk-cast', 'atk-dive'];
  function choreograph(fig, move, flying) {
    if (!fig || !move) return;
    const casting = ['healAlly', 'shieldAll', 'self', 'focus', 'summon'].includes(move.kind);
    const cls = casting ? 'atk-cast'
      : (move.kind === 'aoe' || move.kind === 'charge') ? 'atk-slam'
        : move.kind === 'multi' ? 'atk-spin'
          : flying ? 'atk-dive'
            : 'atk-peck';
    CHOREO.forEach((c) => fig.classList.remove(c));
    fig.classList.remove('attacking');
    void fig.offsetWidth;
    fig.classList.add(cls);
    if (cls === 'atk-slam') SFX.play('slam');
    else if (cls === 'atk-dive') SFX.play('dive');
    else if (cls === 'atk-cast') SFX.play('cast');
    setTimeout(() => fig.classList.remove(cls), 700);
  }

  /* A coloured edge on the whole stage: used for boss phases and berserk. */
  function vignette(color) {
    if (!el.stage) return;
    const v = document.createElement('div');
    v.className = 'stage-vignette';
    v.style.setProperty('--vig', color || 'rgba(255,70,40,.55)');
    el.stage.appendChild(v);
    setTimeout(() => v.remove(), 1500);
  }

  /* The boss flip: a gold-red wash over the field, three staggered shockwaves
     off the boss and a second vignette beat. The wash is its own layer and uses
     backdrop-filter, so it never rewrites the stage's shake keyframes the way a
     second transform animation would. */
  function bossFlip(enemy) {
    if (!el.stage) return;
    const wash = document.createElement('div');
    wash.className = 'boss-wash';
    el.stage.appendChild(wash);
    setTimeout(() => wash.remove(), 1000);
    const fig = enemy && enemy.el;
    [0, 110, 220].forEach((delay, i) => setTimeout(() => {
      impact(fig, { hard: true, huge: true, color: i === 1 ? '#ffe6a3' : '#ff7a4d' });
    }, delay));
    punch(1.03);
    vignette('rgba(255,60,40,.6)');
    setTimeout(() => vignette('rgba(255,150,40,.5)'), 320);
    flash('rgba(255,220,150,.35)');
    shake(true);
  }

  function hurt(fig) {
    if (!fig) return;
    fig.classList.remove('hurt');
    void fig.offsetWidth;
    fig.classList.add('hurt');
    setTimeout(() => fig.classList.remove('hurt'), 380);
  }

  /* ---------------- heroes ---------------- */

  function aliveHeroes() { return B.heroes.filter((h) => h.alive); }
  function aliveEnemies() { return B.enemies.filter((e) => e.alive && !e.ghost); }
  function enemiesLeft() { return B.enemies.filter((e) => e.alive || e.ghost); }

  /* A pig can act once per round, in any order the player chooses. Stun and
     freeze remove that pig from the ready list for the round. */
  function heroReady(h) {
    return !!(h && h.alive && !h.actedThisRound && !(h.stun > 0) && !(h.frozen > 0));
  }

  function chooseAbility(idx) {
    if (!B || B.over || B.busy || B.phase !== 'hero') return;
    const hero = B.heroes[B.selected];
    if (!hero || !hero.alive) return;
    if (hero.actedThisRound) {
      SFX.play('nope');
      setHint(`${hero.def.name} has already acted — tap another pig.`);
      return;
    }
    if (hero.stun > 0 || hero.frozen > 0) {
      SFX.play('nope');
      setHint(`${hero.def.name} cannot act this round — tap another pig.`);
      return;
    }
    const ab = hero.abilities[idx];
    if (!ab) return;
    if (ab.chili && (B.pepperCharge || 0) < pepperNeed()) {
      SFX.play('nope');
      setHint('The pepper needs ' + pepperNeed() + ' charge — the squad has ' + (B.pepperCharge || 0) + '. Hit birds to fill it.');
      return;
    }
    if (ab.chili && (B.pepperCd || 0) > 0) {
      SFX.play('nope');
      setHint('The squad needs ' + B.pepperCd + ' more round' + (B.pepperCd === 1 ? '' : 's') + ' before another pepper.');
      return;
    }
    if (ab.target === 'enemy' || ab.target === 'ally') {
      B.pending = ab;
      SFX.play('select');
      refresh();
      return;
    }
    B.pending = null;
    resolveAbility(hero, ab, null);
  }

  function onEnemyClick(enemy) {
    if (!B || B.over || B.busy || !B.pending || B.pending.target !== 'enemy' || !enemy.alive || enemy.ghost) return;
    const ab = B.pending;
    const hero = B.heroes[B.selected];
    if (!heroReady(hero)) return;
    B.pending = null;
    resolveAbility(hero, ab, enemy);
  }

  function onHeroClick(index) {
    if (!B || B.over || B.busy) return;
    const target = B.heroes[index];
    if (!target || !target.alive) return;
    /* If an ally-targeted move is waiting, this click picks its target. */
    if (B.pending && B.pending.target === 'ally') {
      const ab = B.pending;
      const hero = B.heroes[B.selected];
      if (!heroReady(hero)) return;
      B.pending = null;
      resolveAbility(hero, ab, target, 'single');
      return;
    }
    if (B.phase !== 'hero') return;
    /* Otherwise the click is free: browse this pig's moves and choose the
       order. Only the attack itself spends the action. */
    B.pending = null;
    B.selected = index;
    B.active = index;
    SFX.play('select');
    refresh();
  }

  /* ---------------- relic riders ----------------
     Optional extras a relic can bolt onto an ability. Each is independent, so
     two relics rarely play the same way. */

  /* The bird is left open: every later hit lands harder for a few rounds. */
  /* Exposed: the victim takes 25% more damage for a few rounds. Birds apply it
     to pigs; pigs apply it to birds with Smoke Bomb, Hex and the Hex Totem. */
  function exposeEnemy(enemy, turns) {
    if (!enemy || !enemy.alive || enemy.hp <= 0) return;
    const k = DATA.enemyKey(enemy.tpl);
    enemy.vuln = Math.max(enemy.vuln || 0, DATA.effectTurns('birds', k, 'vuln', turns || 2));
    enemy.vulnBonus = Math.max(enemy.vulnBonus || 0, 0.25);
    floatAt(enemy.el, 'EXPOSED +25%', 'crit');
    setLog(`${enemy.name} is exposed — it takes 25% more damage.`);
  }

  function openUp(enemy, ab) {
    if (!enemy || !enemy.alive) return;
    const k = DATA.enemyKey(enemy.tpl);
    const turns = DATA.effectTurns('birds', k, 'vuln', ab.vuln.turns || 2);
    const bonus = ab.vuln.bonus || 0.2;
    enemy.vuln = Math.max(enemy.vuln || 0, turns);
    enemy.vulnBonus = Math.max(enemy.vulnBonus || 0, bonus);
    floatAt(enemy.el, 'OPEN +' + Math.round(bonus * 100) + '%', 'crit');
  }

  /* Shields are percentages now, not a second health bar. A base shield is
     30% for 3 rounds; a shield shaped by a relic is 50% on one pig, 35% on the
     squad, and lasts a single round. */
  function shieldPlan(hero, ab, wholeSquad) {
    const r = hero.relic && DATA.relicById(hero.relic);
    const relicShaped = !!(r && r.mods && r.mods[ab.id]);
    return relicShaped
      ? { pct: wholeSquad ? 35 : 50, turns: 1 }
      : { pct: 30, turns: 3 };
  }

  function grantShield(hero, pct, turns) {
    const p = Math.min(60, Math.max(5, Math.round(pct || 0)));
    hero.shield = Math.max(hero.shield || 0, p);
    hero.shieldTurns = Math.max(hero.shieldTurns || 0, turns || 1);
  }

  /* A relic can turn a taunt into a porcupine: the pig returns 75% of every
     hit it takes. Read straight off the equipped relic so no extra state. */
  function heroThorns(hero) {
    if (!hero || !hero.relic) return 0;
    const r = DATA.relicById(hero.relic);
    const mods = (r && r.mods) || {};
    return Object.keys(mods).reduce((n, k) => n + (mods[k].thorns || 0), 0);
  }

  /* Squad-wide riders: lifesteal, a rally, a ward, a mend. */
  /* One shared cleanse: strips every bird debuff, including mire and pepper
     numb, which healing cannot touch. */
  function cleanseHero(h) {
    if (!h || !h.alive) return;
    h.stun = 0;
    h.frozen = 0;
    h.silence = 0;
    h.weak = 0;
    h.poison = null;
    h.burn = null;
    h.drenched = 0;
    h.mire = 0;
    h.pepperDry = 0;
    h.expose = 0;
  }

  function teamRiders(hero, ab, dealt) {
    let fired = false;
    if (ab.leech && dealt > 0) {
      const amt = Math.max(1, Math.round(dealt * ab.leech));
      healHero(hero, amt);
      floatAt(hero.el, '+' + amt + ' LEECH', 'heal');
      fired = true;
    }
    if (ab.rally) {
      const mult = ab.rally.mult || 0.15;
      B.might = Math.max(B.might, ab.rally.turns || 2);
      B.mightMul = Math.max(B.mightMul || 1, 1 + mult);
      for (const h of aliveHeroes()) floatAt(h.el, 'RALLY +' + Math.round(mult * 100) + '%', 'heal');
      fired = true;
    }
    if (ab.ward) {
      const plan = shieldPlan(hero, ab, true);
      for (const h of aliveHeroes()) {
        grantShield(h, plan.pct, plan.turns);
        floatAt(h.el, '🛡 -' + plan.pct + '%', 'shield');
      }
      fired = true;
    }
    if (ab.mend) {
      const amt = Math.round(ab.mend(hero));
      for (const h of aliveHeroes()) healHero(h, amt);
      floatAt(hero.el, 'SQUAD +' + amt, 'heal');
      fired = true;
    }
    /* Relic rider: some outfits carry a 50% or 75% chance to wash the squad
       clean, so a pig without a cleanse move can still cure the mire. */
    if (ab.cleanseChance && Math.random() < ab.cleanseChance) {
      for (const h of aliveHeroes()) cleanseHero(h);
      floatAt(hero.el, '🫧 CLEANSE', 'heal');
      setLog(`${hero.def.name}'s relic scours the squad clean.`);
      fired = true;
    }
    if (fired) {
      SFX.play('buff');
      refresh();
    }
  }

  async function resolveAbility(hero, ab, target) {
    B.busy = true;
    B.acted = true;
    hero.actedThisRound = true;
    /* The pepper empties the whole meter; every bird you hit fills it again. */
    if (ab.chili) {
      B.pepperCharge = 0;
      B.pepperCd = 2;
    }
    B.pending = null;
    if (ab.cost >= 6 || ab.chili) B.stats.ults++;
    refresh();

    SFX.voice(hero.def.id);
    SFX.play(ab.cost >= 6 || ab.chili ? 'ult' : ab.cost > 0 ? 'skill' : 'attack');
    if (ab.target === 'allEnemies' || ab.target === 'party' || ab.target === 'self') {
      flash(ab.cost >= 6 || ab.chili ? 'rgba(255,214,120,.5)' : 'rgba(255,255,255,.3)');
      if (ab.cost >= 6 || ab.chili) shake(true);
    }
    lunge(hero.el);
    await sleep(430);

    const might = B.might > 0 ? (B.mightMul || 1.25) : 1;

    if (ab.target === 'enemy' && target) {
      const dealt = (await damageEnemy(target, hero, ab, might)) || 0;
      const tKey = DATA.enemyKey(target.tpl);
      /* A dodged or miraged hit carries no rider: no stun, weaken, silence or
         open. The hit has to land first. */
      if (dealt > 0) {
        if (ab.stun) {
          target.stun = Math.max(target.stun, DATA.effectTurns('birds', tKey, 'stun', ab.stun));
          floatAt(target.el, 'STUNNED', 'miss');
        }
        if (ab.weaken) { target.weak = Math.max(target.weak, DATA.effectTurns('birds', tKey, 'weaken', ab.weaken)); floatAt(target.el, 'WEAKENED', 'miss'); }
        if (ab.silence) { target.silence = Math.max(target.silence, DATA.effectTurns('birds', tKey, 'silence', ab.silence)); floatAt(target.el, 'SILENCED', 'miss'); }
        if (ab.poison) {
          target.poison = { turns: ab.poison.turns, dmg: Math.round(ab.poison.dmg(hero) * might) };
          floatAt(target.el, '☠️ POISONED', 'burn');
          sparks(target.el, '#9be04a', 5);
        }
        if (ab.vuln) openUp(target, ab);
      }
      setLog(`${hero.def.name} uses ${ab.name} on ${target.name}.`);
      teamRiders(hero, ab, dealt);
    } else if (ab.target === 'allEnemies') {
      setLog(`${hero.def.name} uses ${ab.name}!`);
      let dealt = 0;
      for (const e of aliveEnemies()) {
        const hit = (await damageEnemy(e, hero, ab, might, 70)) || 0;
        dealt += hit;
        const k = DATA.enemyKey(e.tpl);
        const landed = hit > 0 && e.alive;
        if (ab.burn && landed) e.burn = { turns: DATA.effectTurns('birds', k, 'burn', ab.burn.turns), dmg: Math.round(ab.burn.dmg(hero) * might) };
        if (ab.poison && landed) { e.poison = { turns: ab.poison.turns, dmg: Math.round(ab.poison.dmg(hero) * might) }; floatAt(e.el, '☠️ POISONED', 'burn'); }
        if (ab.chili && landed) { e.chili = 3; e.chiliHits = 0; floatAt(e.el, '🌶️ HOT', 'burn'); crispy(e.el); }
        if (ab.weaken && landed) e.weak = Math.max(e.weak, DATA.effectTurns('birds', k, 'weaken', ab.weaken));
        if (ab.silence && landed) e.silence = Math.max(e.silence, DATA.effectTurns('birds', k, 'silence', ab.silence));
        if (ab.vuln && landed) openUp(e, ab);
        if (ab.cleanse && e.alive && (e.veil > 0 || e.shield > 0 || e.dodgeCharge > 0)) {
          e.veil = 0;
          e.shield = 0;
          e.shieldTurns = 0;
          if (e.dodgeCharge > 0) {
            e.dodgeCharge = 0;
            floatAt(e.el, '💨 DODGE CLEARED', 'shield');
          }
          floatAt(e.el, 'CLEARED', 'shield');
        }
      }
      teamRiders(hero, ab, dealt);
      if (ab.cleanse) {
        for (const h of aliveHeroes()) cleanseHero(h);
        setLog(`${hero.def.name} clears the air — mirages, bubbles, frost and mire blow away!`);
      }
      shake(true);
    } else if (ab.target === 'ally' || ab.target === 'party') {
      const wholeSquad = ab.target === 'party';
      const targets = wholeSquad ? aliveHeroes() : [target];
      const label = wholeSquad ? 'the whole squad' : (target ? target.def.name : 'a pig');
      setLog(`${hero.def.name} uses ${ab.name} on ${label}.`);
      /* Cleanse first: a mired pig would otherwise have its share of the
         supper stolen before the cleanse could remove the mire. */
      if (ab.cleanse) {
        for (const h of aliveHeroes()) {
          cleanseHero(h);
          floatAt(h.el, 'CLEANSED', 'heal');
        }
        setLog(`${hero.def.name} clears the squad — frost, salt, mire and fear run off every pig.`);
      }
      for (const h of targets) {
        if (wholeSquad ? ab.healParty : ab.healSingle) {
          const amount = Math.round((wholeSquad ? ab.healParty : ab.healSingle)(hero) * rnd(0.95, 1.05));
          healHero(h, amount);
          await sleep(110);
        }
        if (wholeSquad ? ab.shieldParty : ab.shieldSingle) {
          const plan = shieldPlan(hero, ab, wholeSquad);
          grantShield(h, plan.pct, plan.turns);
          floatAt(h.el, '🛡 -' + plan.pct + '%', 'shield');
          await sleep(90);
        }
      }
      teamRiders(hero, ab, 0);
      SFX.play('shield');
      refresh();
    } else if (ab.target === 'self') {
      setLog(`${hero.def.name} uses ${ab.name}.`);
      if (ab.guard) {
        hero.guard = { turns: ab.guard.turns, reduce: ab.guard.reduce };
        hero.taunt = Math.max(hero.taunt, ab.taunt || 0);
        floatAt(hero.el, 'GUARD', 'shield');
        SFX.play('shield');
      }
      if (ab.selfHeal) healHero(hero, Math.round(ab.selfHeal(hero)));
      if (ab.shieldParty) {
        const plan = shieldPlan(hero, ab, true);
        for (const h of aliveHeroes()) {
          grantShield(h, plan.pct, plan.turns);
          floatAt(h.el, '🛡 -' + plan.pct + '%', 'shield');
        }
      }
      teamRiders(hero, ab, 0);
      refresh();
    }

    await sleep(460);
    refresh();

    if (checkWin()) return;
    afterHeroAction();
  }

  function healHero(hero, amount) {
    /* Mire: bird filth that redirects 100% of this pig's healing into the
       flock. Split it evenly across every living bird; a cleanse ends it. */
    if (hero.mire > 0) {
      const flock = aliveEnemies();
      const total = Math.max(0, Math.round(Number(amount) || 0));
      let stolen = 0;
      if (flock.length) {
        const share = Math.floor(total / flock.length);
        let rest = total % flock.length;
        flock.forEach((e) => {
          const take = share + (rest > 0 ? 1 : 0);
          if (rest > 0) rest -= 1;
          const before = e.hp;
          e.hp = Math.min(e.maxHp, e.hp + take);
          const got = e.hp - before;
          stolen += got;
          if (got > 0) floatAt(e.el, '+' + got + ' STOLEN', 'heal');
        });
        refresh();
      }
      floatAt(hero.el, '🕳️ HEAL STOLEN', 'miss');
      setLog(`${hero.def.name} is mired — the flock steals ${stolen} healing, split across ${flock.length} bird${flock.length === 1 ? '' : 's'}. Cleanse it.`);
      return;
    }
    const before = hero.hp;
    hero.hp = Math.min(hero.maxHp, hero.hp + amount);
    const healed = hero.hp - before;
    B.stats.healed += healed;
    if (B.stats.hero[hero.def.id]) B.stats.hero[hero.def.id].healed += healed;
    floatAt(hero.el, '+' + healed, 'heal');
    SFX.play('heal');
    refresh();
  }

  /* Open a round: every living pig gets one action, and the player picks the
     order by tapping pigs. A stunned or frozen pig loses its action here. */
  function startHeroPhase() {
    if (!B || B.over) return;
    B.phase = 'hero';
    B.pending = null;
    B.busy = true;
    B.heroes.forEach((h) => {
      h.actedThisRound = false;
      if (!h.alive) return;
      if (h.frozen > 0) {
        h.frozen -= 1;
        h.actedThisRound = true;
        floatAt(h.el, 'FROZEN', 'miss');
        setLog(`${h.def.name} is frozen solid and loses this round.`);
      } else if (h.stun > 0) {
        h.stun -= 1;
        h.actedThisRound = true;
        floatAt(h.el, 'STUNNED', 'miss');
        setLog(`${h.def.name} is stunned and loses this round.`);
      }
    });
    const ready = B.heroes.findIndex(heroReady);
    if (ready >= 0) {
      B.active = ready;
      B.selected = ready;
      B.busy = false;
      refresh();
      setHint('Tap any ready pig to choose who acts next.');
      return;
    }
    refresh();
    setTimeout(afterHeroAction, 420);
  }

  /* After an action, stay on the field while any pig is still ready. The
     player chooses the next pig; there is no forced left-to-right order. */
  function afterHeroAction() {
    if (!B || B.over) return;
    const ready = B.heroes.findIndex(heroReady);
    if (ready >= 0) {
      B.active = ready;
      B.selected = ready;
      B.pending = null;
      B.busy = false;
      refresh();
      return;
    }
    /* Any pig left unspent was stunned or frozen: burn its action now. */
    B.heroes.forEach((h) => {
      if (!h.alive || h.actedThisRound) return;
      h.actedThisRound = true;
      if (h.frozen > 0) { h.frozen -= 1; floatAt(h.el, 'FROZEN', 'miss'); }
      else if (h.stun > 0) { h.stun -= 1; floatAt(h.el, 'STUNNED', 'miss'); }
    });
    B.pending = null;
    B.busy = true;
    refresh();
    setTimeout(startEnemyPhase, 380);
  }

  /* Every item carries a small proc: weapons roll per hit, helmets roll when
     the pig is hit. A crafted blueprint weapon replaces the tier roll with a
     flat 5% chance for its own fixed rider. */
  const WEAPON_PROCS = ['cleanse', 'chain', 'stun', 'crit'];
  const HELMET_PROCS = ['shield', 'heal', 'cleanse', 'thorns'];
  function weaponProc(hero, ab) {
    if (!hero || !hero.gear) return null;
    /* Called only from a landed damaging hit, so moves that rely on the
       default 1x multiplier (no explicit mult) still roll their weapon. */
    if (hero.craftedWeapon) {
      const weapon = DATA.craftedWeaponById(hero.craftedWeapon);
      if (!weapon) return null;
      return Math.random() < 0.05 ? weapon.proc : null;
    }
    const chance = DATA.gearProcChance(hero.gear.weapon || 1);
    if (!chance || Math.random() >= chance) return null;
    return WEAPON_PROCS[Math.floor(Math.random() * WEAPON_PROCS.length)];
  }

  function helmetProc(hero) {
    if (!hero || !hero.gear || !hero.alive) return null;
    const chance = DATA.gearProcChance(hero.gear.helmet || 1);
    if (!chance || Math.random() >= chance) return null;
    return HELMET_PROCS[Math.floor(Math.random() * HELMET_PROCS.length)];
  }

  function runWeaponProc(kind, hero, enemy, dmg) {
    if (!kind || kind === 'crit' || !hero || !hero.alive) return;
    if (kind === 'cleanse') {
      cleanseHero(hero);
      floatAt(hero.el, '🫧 CLEANSE', 'heal');
      setLog(`${hero.def.name}'s crafted weapon burns off every debuff.`);
      return;
    }
    if (kind === 'stun') {
      if (!enemy || !enemy.alive || enemy.hp <= 0) return;
      const k = DATA.enemyKey(enemy.tpl);
      enemy.stun = Math.max(enemy.stun || 0, DATA.effectTurns('birds', k, 'stun', 1));
      floatAt(enemy.el, '💫 STUN', 'crit');
      setLog(`${hero.def.name}'s weapon rings off ${enemy.name} — stunned!`);
      return;
    }
    if (kind === 'chain') {
      const pool = aliveEnemies().filter((e) => e !== enemy).slice(0, 2);
      if (!pool.length) return;
      const chain = Math.max(1, Math.round(dmg * 0.35));
      let total = 0;
      pool.forEach((side) => {
        side.hp = Math.max(0, side.hp - chain);
        B.stats.dealt += chain;
        total += chain;
        floatAt(side.el, '⛓️ ' + chain, 'crit');
        if (side.hp <= 0) killEnemy(side);
      });
      setLog(`${hero.def.name}'s chain lashes ${pool.length} more bird${pool.length === 1 ? '' : 's'} for ${total} damage.`);
    }
  }

  function runHelmetProc(kind, hero, attacker, dmg) {
    if (!kind || !hero || !hero.alive) return;
    const tier = (hero.gear && hero.gear.helmet) || 1;
    if (kind === 'shield') {
      const pct = 10 + tier * 2;
      grantShield(hero, pct, 2);
      floatAt(hero.el, '🛡 HELMET WARD', 'shield');
      setLog(`${hero.def.name}'s helmet sparks a ${pct}% ward.`);
      SFX.play('shield');
      return;
    }
    if (kind === 'heal') {
      healHero(hero, Math.round(hero.maxHp * (0.04 + tier * 0.01)));
      floatAt(hero.el, '🪖 PATCHED', 'heal');
      return;
    }
    if (kind === 'cleanse') {
      cleanseHero(hero);
      floatAt(hero.el, '🫧 HELMET CLEANSE', 'heal');
      setLog(`${hero.def.name}'s helmet shakes off every debuff.`);
      SFX.play('shield');
      return;
    }
    if (kind === 'thorns') {
      if (!attacker || !attacker.alive || attacker.hp <= 0) return;
      const recoil = Math.max(1, Math.round(dmg * (0.12 + tier * 0.035)));
      attacker.hp = Math.max(0, attacker.hp - recoil);
      B.stats.dealt += recoil;
      floatAt(attacker.el, '🪶 ' + recoil, 'crit');
      setLog(`${hero.def.name}'s helmet spikes ${attacker.name} for ${recoil}.`);
      if (attacker.hp <= 0) killEnemy(attacker);
    }
  }

  async function damageEnemy(enemy, hero, ab, might, delay) {
    if (!enemy.alive || enemy.ghost) return;
    if (delay) await sleep(rnd(40, delay));
    /* Cleansing damage scours an active dodge away instead of missing it. A
       passive evade (a bird that flies, or an ice-slick trait) is not a buff,
       so it is never deleted — only the charge from a dodge move is. */
    const cleansing = !!(ab && (ab.cleanse || ab.shred) && (ab.mult || 0) > 0);
    if (cleansing && enemy.dodgeCharge > 0) {
      enemy.dodgeCharge = 0;
      floatAt(enemy.el, '💨 DODGE CLEARED', 'shield');
      setLog(`${enemy.name}'s dodge is scoured away.`);
    }
    /* A dodge buff is spent one charge at a time: the hit simply misses. */
    if (!cleansing && enemy.dodgeCharge > 0) {
      enemy.dodgeCharge -= 1;
      floatAt(enemy.el, '💨 DODGED', 'miss');
      setLog(`${enemy.name} spends a dodge charge — the blow hits empty air.`);
      SFX.play('miss');
      return 0;
    }
    if (enemy.flying && Math.random() < 0.2) {
      floatAt(enemy.el, 'DODGED', 'miss');
      setLog(`${enemy.name} slips out of the way — passive evade, not a buff.`);
      return 0;
    }
    /* Mirage: 80% of attacks sail straight through until the air is cleared. */
    if (enemy.veil > 0 && Math.random() < 0.8) {
      floatAt(enemy.el, 'MISS', 'miss');
      setLog(`${enemy.name} shimmers — the hit passes through the mirage!`);
      SFX.play('miss');
      return 0;
    }
    /* The hit is landing, so this is the moment to roll the weapon proc. */
    const proc = weaponProc(hero, ab);
    /* A relic that breaks wards pops shields and mirages before the blow. */
    if (ab.shred && (enemy.shield > 0 || enemy.veil > 0)) {
      enemy.shield = 0;
      enemy.shieldTurns = 0;
      enemy.veil = 0;
      floatAt(enemy.el, 'WARDS BROKEN', 'miss');
    }
    let raw = hero.atk * (ab.mult || 1) * rnd(0.92, 1.08) * might * (hero.weak > 0 ? 0.7 : 1);
    /* Left open by a relic: this bird takes extra damage for a few rounds. */
    if (enemy.vuln > 0) raw *= 1 + (enemy.vulnBonus || 0.2);
    /* Critical Eye training raises every pig's crit chance. */
    let crit = Math.random() < 0.1 + (DATA.trainingBonus.edge || 0);
    if (crit) raw *= 1.55;
    /* A crafted weapon's crit proc hits like a critical even without the roll. */
    if (proc === 'crit') raw *= 1.55;
    /* Chili heat: a bird splashed by pepper takes extra damage from every pig
       attack, and the heat climbs with each hit — the first pig lights it
       (+15%) and the rest cash it in (+30%, +45%, up to +60%). */
    if (enemy.chili > 0 && (ab.mult || 0) > 0) {
      enemy.chiliHits = (enemy.chiliHits || 0) + 1;
      const heat = Math.min(enemy.chiliHits, 4) * 0.15;
      raw *= 1 + heat;
      if (enemy.chiliHits > 1) floatAt(enemy.el, '🌶️ +' + Math.round(heat * 100) + '%', 'crit');
    }
    if (enemy.armor) raw *= 1 - enemy.armor;
    /* A living wall covers its flock: birds behind it take less. */
    if (!DATA.tankBirds.includes(enemy.key || enemy.t)
      && B.enemies.some((t) => t.alive && !t.ghost && t !== enemy && DATA.tankBirds.includes(t.key || t.t))) raw *= 0.88;
    let dmg = Math.round(raw);
    /* Bird wards cut the hit by a percentage instead of soaking a pool. */
    if (enemy.shield > 0) {
      const cut = Math.min(0.6, enemy.shield / 100);
      dmg = Math.max(1, Math.round(dmg * (1 - cut)));
      floatAt(enemy.el, '🛡 -' + Math.round(cut * 100) + '%', 'shield');
    }
    /* Iron hide: chip damage cannot grind a wall down. Any single hit below
       the bird's threshold only does 75% of its damage. */
    if (enemy.soakAt && dmg < enemy.soakAt) {
      dmg = Math.max(1, Math.round(dmg * 0.75));
      floatAt(enemy.el, '🧱 SOAK', 'shield');
    }
    /* Knight's guard: anything under the threshold is cut in half outright. */
    if (enemy.halfAt && dmg < enemy.halfAt) {
      dmg = Math.max(1, Math.round(dmg * 0.5));
      floatAt(enemy.el, '🛡️ HALVED', 'shield');
    }
    enemy.hp = Math.max(0, enemy.hp - dmg);
    B.stats.dealt += dmg;
    if (hero && B.stats.hero[hero.def.id]) B.stats.hero[hero.def.id].dealt += dmg;
    /* A pig move that carries Exposed leaves the bird taking 25% more damage. */
    if (ab.expose) exposeEnemy(enemy, ab.expose);
    if (proc === 'crit') {
      floatAt(enemy.el, '⭐ CRIT PROC', 'crit');
      setLog(`${hero.def.name}'s weapon bites deep — critical proc!`);
      SFX.play('crit');
    }
    runWeaponProc(proc, hero, enemy, dmg);
    hurt(enemy.el);
    impact(enemy.el, { color: crit ? '#ffe066' : '#ffd9a8', hard: crit });
    if (crit) {
      floatAt(enemy.el, dmg + ' CRIT!', 'crit');
      SFX.play('crit');
      sparks(enemy.el, '#ffd45e', 10);
      shake(true);
    } else {
      floatAt(enemy.el, String(dmg));
      SFX.play('hit');
      sparks(enemy.el, '#ffe9a8', 5);
    }
    /* A numbed pig lands its hit but adds nothing to the squad's pepper. The
       striker is the hero passed in, not whoever's turn the HUD is showing, so
       multi-hit and delayed strikes cannot leak charge from a numbed pig. */
    if (dmg > 0) {
      if (hero && hero.pepperDry > 0) {
        if (hero.el) floatAt(hero.el, '🌶 0 NO CHARGE', 'miss');
      } else {
        addPepper(pepperForHit(enemy, ab));
      }
    }
    /* Thorns: a quilled bird strikes back at whoever just hit it. */
    if (dmg > 0 && enemy.tpl.thorns && enemy.hp > 0 && hero && hero.alive && (ab.mult || 0) > 0) {
      const back = Math.max(1, Math.round(enemy.atk * enemy.tpl.thorns));
      floatAt(enemy.el, '🪶 THORNS', 'crit');
      setLog(`${enemy.name} bristles — ${hero.def.name} takes ${back} back.`);
      damageHero(hero, back);
    }
    /* Mirror: a share of the wound the bird actually took goes back to the
       striker. It reads the final number, so armour, shields and crits all
       count the same on the way back. */
    if (dmg > 0 && enemy.tpl.reflect && enemy.hp > 0 && hero && hero.alive && (ab.mult || 0) > 0) {
      const back = Math.max(1, Math.round(dmg * enemy.tpl.reflect));
      floatAt(enemy.el, '🪞 MIRROR', 'shield');
      setLog(`${enemy.name} turns the blow around — ${hero.def.name} takes ${back} back.`);
      SFX.play('mirror');
      damageHero(hero, back);
    }
    if (enemy.hp <= 0) killEnemy(enemy);
    refresh();
    return dmg;
  }

  /* Eight birds is the whole field. Every slot counts, living or spectral, so
     nothing new can be called in while the field is full. */
  const FIELD_LIMIT = 8;
  function fieldCount() {
    return B.enemies.filter((e) => e.alive || e.ghost).length;
  }

  /* Pull a fresh bird onto the field for a summoner or a cornered boss. */
  function summonMinion(enemy, count, spectral) {
    const room = FIELD_LIMIT - fieldCount();
    if (room <= 0) return false;
    const world = B.level.world || 1;
    let added = 0;
    for (let i = 0; i < Math.min(count, room); i++) {
      /* Binders call their own flock; plain summoners use the world pool. */
      const pool = enemy.tpl && enemy.tpl.summonPool;
      const key = pool && pool.length ? pool[Math.floor(Math.random() * pool.length)] : DATA.summonFor(world);
      if (!key) continue;
      if (!DATA.enemies[key]) continue;
      const fresh = buildEnemy({ t: key, hpMul: 0.95, atkMul: 0.85 }, B.level, B.enemies.length);
      fresh.caller = enemy;
      fresh.focus = Math.floor(Math.random() * B.heroes.length);
      if (spectral) {
        /* The dead call the dead — but only a ghost bird has a ghost to call
           with, so anything else simply does not come through. */
        const gtype = DATA.ghostFor(key);
        if (!gtype) continue;
        fresh.ghost = true;
        fresh.alive = false;
        fresh.hp = 0;
        fresh.ghostType = gtype;
        fresh.ghostMax = gtype.timer;
        fresh.ghostTimer = fresh.ghostMax;
        fresh.noGhostSummon = true;
      }
      B.enemies.push(fresh);
      added++;
    }
    if (!added) return false;
    renderScreen();
    refresh();
    banner(spectral ? 'SPECTRAL REINFORCEMENTS!' : 'REINFORCEMENTS!', 'ghost');
    SFX.play('fuse');
    return true;
  }

  function killEnemy(enemy) {
    const others = B.enemies.filter((e) => (e.alive || e.ghost) && e !== enemy);
    B.stats.kills++;
    const killKey = DATA.enemyKey(enemy.tpl);
    if (killKey) B.stats.byKey[killKey] = (B.stats.byKey[killKey] || 0) + 1;
    /* Only the three ghost birds leave anything behind. Everything else stays
       down, and a ghost dies for good when the living flock is wiped. */
    const ghostType = DATA.ghostFor(enemy.key);
    if (!enemy.revived && others.length && ghostType) {
      enemy.ghost = true;
      enemy.ghostType = ghostType;
      enemy.ghostMax = ghostType.timer;
      enemy.ghostTimer = enemy.ghostMax;
      enemy.hp = 0;
      enemy.alive = false;
      floatAt(enemy.el, ghostType.icon, 'miss');
      banner(enemy.name.toUpperCase() + ' RETURNS AS A ' + ghostType.name.toUpperCase(), 'ghost');
      setLog(`${enemy.name} sinks — a ${ghostType.name} ${ghostType.blurb} in ${enemy.ghostMax} rounds.`);
      SFX.play('ko');
      return;
    }
    /* Kill the caster and the birds it called stagger. */
    if (enemy.summoner) {
      for (const m of B.enemies) {
        if (m !== enemy && m.alive && m.caller === enemy) {
          m.hp = Math.max(1, m.hp - Math.round(m.maxHp * 0.15));
          if (m.el) floatAt(m.el, 'CALL BROKEN', 'miss');
        }
      }
    }
    enemy.alive = false;
    enemy.ghost = false;
    enemy.burn = null;
    enemy.poison = null;
    enemy.weak = 0;
    enemy.silence = 0;
    enemy.vuln = 0;
    enemy.vulnBonus = 0;
    floatAt(enemy.el, 'KO!', 'miss');
    sparks(enemy.el, '#c9e8ff', 12);
    SFX.play('ko');
  }

  /* ---------------- enemy turn ---------------- */

  function chooseTarget(enemy) {
    const alive = aliveHeroes();
    if (!alive.length) return null;
    const taunting = alive.filter((h) => h.taunt > 0);
    if (taunting.length) return pick(taunting);
    /* Party-wide focus: every bird piles onto the marked pig. */
    if (B.mark && B.mark.turns > 0) {
      const prey = alive.find((h) => h.def.id === B.mark.id);
      if (prey) return prey;
      B.mark = null;
    }
    /* Lock-on: this bird has chosen its pig and will not look away. */
    if (enemy.lock && enemy.lock.turns > 0) {
      const marked = alive.find((h) => h.def.id === enemy.lock.id);
      if (marked) return marked;
      enemy.lock = null;
    }
    const focused = B.heroes[enemy.focus];
    if (focused && focused.alive && Math.random() < 0.7) return focused;
    return pick(alive);
  }

  function damageHero(hero, raw) {
    if (!hero.alive) return 0;
    let dmg = raw;
    if (hero.frozen > 0) dmg *= 1.25;
    if (hero.drenched > 0) dmg *= 1.2;
    if (hero.expose > 0) dmg *= 1.25;
    if (hero.guard && hero.guard.turns > 0) dmg *= 1 - hero.guard.reduce;
    if (hero.shield > 0) {
      const cut = Math.min(0.6, hero.shield / 100);
      dmg = Math.max(1, Math.round(dmg * (1 - cut)));
      floatAt(hero.el, '🛡 -' + Math.round(cut * 100) + '%', 'shield');
    }
    /* A frenzied bird adds its flat bonus to every single hit, so a three-hit
       flurry lands it three times over. */
    if (B.lastAttacker && B.lastAttacker.power > 0) {
      dmg += B.lastAttacker.power;
      floatAt(hero.el, '⚡+' + B.lastAttacker.power, 'crit');
    }
    dmg = Math.max(0, Math.round(dmg));
    hero.hp = Math.max(0, hero.hp - dmg);
    B.stats.taken += dmg;
    /* Lifesteal: a draining bird heals itself for a share of the damage. */
    const drain = B.lastAttacker && B.lastAttacker.activeLeech;
    if (drain > 0 && dmg > 0 && B.lastAttacker.alive) {
      const bird = B.lastAttacker;
      const beforeHp = bird.hp;
      bird.hp = Math.min(bird.maxHp, bird.hp + Math.max(1, Math.round(dmg * drain)));
      const sip = bird.hp - beforeHp;
      if (sip > 0) floatAt(bird.el, '🩸 +' + sip, 'heal');
    }
    /* Thorns relic: the taunting pig returns 75% of the hit. */
    const back = heroThorns(hero);
    const striker = B.lastAttacker;
    if (back > 0 && dmg > 0 && striker && striker.alive && striker.hp > 0) {
      const recoil = Math.max(1, Math.round(dmg * back));
      striker.hp = Math.max(0, striker.hp - recoil);
      floatAt(striker.el, '🪶 ' + recoil, 'crit');
      setLog(`${striker.name} hits ${hero.def.name} and takes ${recoil} back!`);
      if (striker.hp <= 0) killEnemy(striker);
    }
    if (dmg > 0 && hero.hp > 0) {
      const helm = helmetProc(hero);
      if (helm) runHelmetProc(helm, hero, B.lastAttacker, dmg);
    }
    if (dmg > 0) addPepper(1);
    hurt(hero.el);
    if (dmg > 0) impact(hero.el, { color: '#ffb3a8', hard: dmg >= 25 });
    if (dmg > 0) floatAt(hero.el, String(dmg));
    SFX.play('hurt');
    if (hero.hp <= 0) {
      hero.alive = false;
      hero.rage = 0;
      B.stats.taken += 0;
      floatAt(hero.el, 'DOWN!', 'miss');
      setLog(`${hero.def.name} is knocked out!`);
      SFX.play('ko');
    }
    refresh();
    return dmg;
  }

  /* Enemies can inflict statuses too, and each pig resists them differently. */
  function applyHeroStatus(hero, move) {
    if (!hero || !hero.alive) return;
    const id = hero.def.id;
    if (move.stun) {
      hero.stun = Math.max(hero.stun, DATA.effectTurns('heroes', id, 'stun', move.stun));
      floatAt(hero.el, 'STUNNED', 'miss');
    }
    if (move.weaken) {
      hero.weak = Math.max(hero.weak, DATA.effectTurns('heroes', id, 'weaken', move.weaken));
      floatAt(hero.el, 'WEAKENED', 'miss');
    }
    if (move.silence) {
      hero.silence = Math.max(hero.silence, DATA.effectTurns('heroes', id, 'silence', move.silence));
      floatAt(hero.el, 'SILENCED', 'miss');
    }
    if (move.poison) {
      hero.poison = { turns: move.poison, dmg: Math.max(1, Math.round(hero.maxHp * 0.06)) };
      floatAt(hero.el, 'POISONED', 'burn');
      SFX.play('burn');
    }
    /* Burn is the fire version of poison: it ticks after the pigs act and
       before the flock swings, so a cleanse matters. */
    if (move.burn) {
      const burnTurns = typeof move.burn === 'object' ? (move.burn.turns || 1) : move.burn;
      hero.burn = { turns: DATA.effectTurns('heroes', id, 'burn', burnTurns), dmg: Math.max(1, Math.round(hero.maxHp * 0.05)) };
      floatAt(hero.el, 'BURNING', 'burn');
      sparks(hero.el, '#ff8a3d', 6);
      SFX.play('burn');
    }
    /* Frost Peak: frozen pigs lose turns and take more damage while iced over. */
    if (move.freeze) {
      hero.frozen = Math.max(hero.frozen || 0, 1, DATA.effectTurns('heroes', id, 'freeze', move.freeze));
      floatAt(hero.el, 'FROZEN', 'miss');
      sparks(hero.el, '#8fdcff', 6);
      SFX.play('shield');
    }
    /* Saltwind Shore: salt water rusts shields off and wets the pig down. */
    if (move.drench) {
      hero.drenched = Math.max(hero.drenched || 0, 1, DATA.effectTurns('heroes', id, 'drench', move.drench));
      if (hero.shield > 0) {
        hero.shield = 0;
        hero.shieldTurns = 0;
        floatAt(hero.el, 'SHIELD WASHED OFF', 'miss');
      }
      floatAt(hero.el, 'DRENCHED', 'miss');
      sparks(hero.el, '#7fd6e8', 6);
    }
    /* Salt-numbed: the pig keeps fighting, but none of its hits charge the
       squad's pepper while the numbness lasts. */
    if (move.pepperDry) {
      hero.pepperDry = Math.max(hero.pepperDry || 0, 1, DATA.effectTurns('heroes', id, 'pepperDry', move.pepperDry));
      floatAt(hero.el, 'PEPPER NUMB', 'miss');
      sparks(hero.el, '#cfe3b0', 5);
      setLog(`${hero.def.name} is numbed — that pig builds no pepper for ${hero.pepperDry} round${hero.pepperDry === 1 ? '' : 's'}.`);
      SFX.play('shield');
    }
    /* Mire: the flock steals every point of healing until the pig is cleansed. */
    if (move.mire) {
      hero.mire = Math.max(hero.mire || 0, 1, DATA.effectTurns('heroes', id, 'mire', move.mire));
      floatAt(hero.el, 'MIRED', 'miss');
      sparks(hero.el, '#7a6a4a', 5);
      setLog(`${hero.def.name} is mired — the flock steals 100% of its healing for ${hero.mire} round${hero.mire === 1 ? '' : 's'}. Cleanse it.`);
      SFX.play('shield');
    }
    /* Exposed: every hit from the flock lands 25% harder. */
    if (move.expose) {
      hero.expose = Math.max(hero.expose || 0, 1, DATA.effectTurns('heroes', id, 'expose', move.expose));
      floatAt(hero.el, 'EXPOSED', 'crit');
      sparks(hero.el, '#ff8a6a', 6);
      setLog(`${hero.def.name} is exposed — the flock deals 25% more damage for ${hero.expose} round${hero.expose === 1 ? '' : 's'}.`);
      SFX.play('crit');
    }
    /* Sticky fingers: a pepper thief eats the squad's charge as it lands. The
       meter is shared, so the loss is shown on the bird that took it. */
    if (move.stealPepper) stealPepper(hero, move.stealPepper);
  }

  /* Pepper is one squad meter. A theft takes what is there and nothing more,
     so it can never push the charge negative. */
  function stealPepper(hero, amount) {
    if (!B || !amount) return 0;
    const had = B.pepperCharge || 0;
    const took = Math.min(had, amount);
    B.pepperCharge = had - took;
    if (!took) {
      if (B.lastAttacker && B.lastAttacker.el) floatAt(B.lastAttacker.el, '🌶 NOTHING TO STEAL', 'miss');
      return 0;
    }
    if (B.lastAttacker && B.lastAttacker.el) floatAt(B.lastAttacker.el, '🌶 −' + took, 'crit');
    setLog(`Pepper stolen — the squad loses ${took} charge (${B.pepperCharge}/${pepperNeed()} left).`);
    SFX.play('steal');
    return took;
  }

  /* Birds play their kit in a fixed order, exactly as the compendium lists it.
     The same bird does the same thing in the same order every fight, so a
     listed effect is never a coin flip. Only damage rolls stay random. */
  function pickMove(enemy, moves) {
    if (!moves.length) return null;
    const idx = (enemy.moveIdx || 0) % moves.length;
    enemy.moveIdx = (idx + 1) % moves.length;
    return moves[idx];
  }

  /* Bosses change tactics once they are badly hurt. Each world boss has its own
     phase, declared in DATA (phase2), and it fires exactly once. */
  function bossPhase(enemy) {
    const p = enemy.tpl && enemy.tpl.phase2;
    if (!p || enemy.phaseDone || !enemy.alive || enemy.ghost) return;
    if (enemy.hp > enemy.maxHp * (p.at || 0.5)) return;
    enemy.phaseDone = true;
    banner(enemy.name.toUpperCase() + ' — ' + (p.banner || 'CHANGES TACTICS!'), 'crit');
    setLog(enemy.name + ' is badly hurt and changes tactics.');
    if (p.shield) {
      enemy.shield = Math.max(enemy.shield, Math.min(60, Math.round((p.shield || 0) * 100)));
      enemy.shieldTurns = 2;
      floatAt(enemy.el, 'SHIELD', 'shield');
    }
    if (p.heal) {
      const amount = Math.round(enemy.maxHp * p.heal);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + amount);
      floatAt(enemy.el, '+' + amount, 'heal');
    }
    if (p.freeze) for (const h of aliveHeroes()) applyHeroStatus(h, { freeze: p.freeze });
    if (p.drench) for (const h of aliveHeroes()) applyHeroStatus(h, { drench: p.drench });
    if (p.sum) summonMinion(enemy, p.sum);
    /* The music gets faster and denser for the second half, and the last boss
       switches to its own phase-two cue. The player hears the change before
       the log explains it. */
    if (p.theme && typeof Music !== 'undefined' && Music.play) Music.play(p.theme);
    else if (typeof Music !== 'undefined' && Music.setIntensity) Music.setIntensity(1);
    bossFlip(enemy);
    SFX.play('phase');
    SFX.play('quake');
    refresh();
  }

  /* Poison ticks between the pig turn and the bird turn: weak direct hits still
     add up because the venom lands after every pig has acted, before any bird
     swings back. Both directions run here, so a poisoned pig and a poisoned
     bird resolve at the same boundary. */
  async function tickPoison() {
    for (const e of B.enemies) {
      if (!e.alive || e.ghost || !e.poison || e.poison.turns <= 0) continue;
      const dmg = e.poison.dmg;
      e.poison.turns -= 1;
      if (e.poison.turns <= 0) e.poison = null;
      e.hp = Math.max(0, e.hp - dmg);
      B.stats.dealt += dmg;
      hurt(e.el);
      floatAt(e.el, String(dmg), 'burn');
      sparks(e.el, '#9be04a', 5);
      SFX.play('burn');
      if (e.hp <= 0) killEnemy(e);
      refresh();
      await sleep(180);
    }
    if (checkWin()) return true;

    for (const h of B.heroes) {
      if (!h.alive || !h.poison || h.poison.turns <= 0) continue;
      const dmg = h.poison.dmg;
      h.poison.turns -= 1;
      if (h.poison.turns <= 0) h.poison = null;
      h.hp = Math.max(0, h.hp - dmg);
      B.stats.taken += dmg;
      hurt(h.el);
      floatAt(h.el, String(dmg), 'burn');
      sparks(h.el, '#9be04a', 5);
      SFX.play('burn');
      if (h.hp <= 0) {
        h.alive = false;
        h.rage = 0;
        setLog(`${h.def.name} succumbs to poison!`);
        floatAt(h.el, 'DOWN!', 'miss');
        SFX.play('ko');
      }
      refresh();
      await sleep(180);
    }
    for (const h of B.heroes) {
      if (!h.alive || !h.burn || h.burn.turns <= 0) continue;
      const dmg = h.burn.dmg;
      h.burn.turns -= 1;
      if (h.burn.turns <= 0) h.burn = null;
      h.hp = Math.max(0, h.hp - dmg);
      B.stats.taken += dmg;
      hurt(h.el);
      floatAt(h.el, String(dmg), 'burn');
      sparks(h.el, '#ff8a3d', 5);
      SFX.play('burn');
      if (h.hp <= 0) {
        h.alive = false;
        h.rage = 0;
        setLog(`${h.def.name} burns out!`);
        floatAt(h.el, 'DOWN!', 'miss');
        SFX.play('ko');
      }
      refresh();
      await sleep(180);
    }
    if (!aliveHeroes().length) { lose(); return true; }
    return false;
  }

  async function startEnemyPhase() {
    if (B.over) return;
    B.phase = 'enemy';
    B.active = -1;
    B.selected = -1;
    B.busy = true;
    B.pending = null;
    refresh();
    await sleep(560);
    if (await tickPoison()) return;

    for (const enemy of B.enemies) {
      if (B.over) return;
      if (!enemy.alive || enemy.ghost) continue;
      if (enemy.stun > 0) {
        enemy.stun -= 1;
        floatAt(enemy.el, 'STUNNED', 'miss');
        setLog(`${enemy.name} is dazed and misses a turn.`);
        refresh();
        await sleep(400);
        continue;
      }
      bossPhase(enemy);
      if (B.over) return;
      await enemyTurn(enemy);
      if (B.over) return;
      if (!aliveHeroes().length) return lose();
      await sleep(340);
    }

    /* The squad is gone: the haunting dies with it. No ghost gets to rise
       over an empty arena. */
    if (!aliveHeroes().length) {
      B.enemies.forEach((e) => { e.ghost = false; e.ghostTimer = 0; e.rising = false; e.alive = false; });
      refresh();
      return lose();
    }

    // ghosts drift back in
    for (const enemy of [...B.enemies]) {
      if (!enemy.ghost) continue;
      /* A dead wall or a dead caller is not harmless: while it is spectral it
         can haul one more spectral bird onto the field, slot permitting. A
         spectral reinforcement cannot chain. */
      const canCall = !enemy.noGhostSummon && enemy.ghostTimer > 0 && fieldCount() < FIELD_LIMIT
        && (enemy.summoner || DATA.tankBirds.indexOf(enemy.key) >= 0
          || (enemy.moves || []).some((m) => m.kind === 'summon'));
      if (canCall && Math.random() < 0.5) {
        if (summonMinion(enemy, 1, true)) {
          setLog(enemy.name + ' calls a spectral flock through the gap!');
          await sleep(300);
        }
      }
      /* ghost-timer fix: every round the fight continues, a ghost drifts one
         step closer to rising. The number on the bird is this timer. */
      enemy.ghostTimer -= 1;
      if (enemy.ghostTimer <= 0) {
        const gtype = enemy.ghostType;
        /* Hold on 3/3 for a beat and flash the body, so the revival reads as
           an event rather than the bird simply reappearing. */
        enemy.ghostTimer = 0;
        enemy.rising = true;
        if (enemy.el) enemy.el.classList.add('rising');
        floatAt(enemy.el, gmax + '/' + gmax, 'shield');
        refresh();
        await sleep(380);
        if (enemy.el) enemy.el.classList.remove('rising');
        enemy.rising = false;
        enemy.ghost = false;
        enemy.alive = true;
        enemy.revived = true;
        enemy.hp = Math.round(enemy.maxHp * (gtype ? gtype.hp : 0.45));
        if (gtype && gtype.shield) {
          enemy.shield = Math.max(enemy.shield, Math.min(60, Math.round((gtype.shield || 0) * 100)));
          enemy.shieldTurns = 2;
          floatAt(enemy.el, 'SHIELD', 'shield');
        }
        if (gtype && (gtype.drench || gtype.silence)) {
          const rising = {};
          if (gtype.drench) rising.drench = gtype.drench;
          if (gtype.silence) rising.silence = gtype.silence;
          for (const h of aliveHeroes()) applyHeroStatus(h, rising);
        }
        banner(enemy.name.toUpperCase() + (gtype ? ' — ' + gtype.name.toUpperCase() + ' RISES!' : ' IS BACK!'), 'ghost');
        floatAt(enemy.el, gtype ? gtype.icon + ' REVIVED' : 'REVIVED', 'miss');
        SFX.play('boom');
        shake(true);
        refresh();
        await sleep(520);
      }
    }

    endRound();
  }

  /* The flock's own buffs, all folded into one number so every attack branch
     (single, multi, AoE, charge, bomb) uses exactly the same multiplier:
     · pack song: a chorus bird lifts every living beak, itself included.
     · berserk: a cornered bird hits harder than its stat line says. */
  function flockAtkMul(enemy) {
    const tpl = enemy.tpl || {};
    let mul = 1;
    if (tpl.packAtk) mul += tpl.packAtk * aliveEnemies().length;
    if (tpl.berserk && enemy.maxHp && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.35) mul += tpl.berserk;
    return mul;
  }

  async function enemyTurn(enemy) {
    B.lastAttacker = enemy;
    SFX.voice(enemy.art);
    const silenced = enemy.silence > 0;
    const weakMul = enemy.weak > 0 ? 0.7 : 1;
    const flockMul = flockAtkMul(enemy);
    if (enemy.tpl.packAtk && aliveEnemies().length > 1) {
      setHint(`${enemy.name} is singing the flock louder: +${Math.round(enemy.tpl.packAtk * aliveEnemies().length * 100)}% damage.`);
    }
    /* A cornered bird announces itself once, then keeps the bonus silently. */
    if (enemy.tpl.berserk && !enemy.berserkShown && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.35) {
      enemy.berserkShown = true;
      banner(enemy.name.toUpperCase() + ' IS BERSERK', 'crit');
      floatAt(enemy.el, '🔥 +' + Math.round(enemy.tpl.berserk * 100) + '%', 'crit');
      setLog(`${enemy.name} is cornered and hits ${Math.round(enemy.tpl.berserk * 100)}% harder.`);
      sparks(enemy.el, '#ff6a3d', 12);
      vignette('rgba(255,70,30,.45)');
      SFX.play('berserk');
      refresh();
    }

    /* Charged attack: wind up for a few rounds, then unload everything. */
    if (enemy.charge) {
      enemy.charge.turns -= 1;
      if (enemy.charge.turns > 0) {
        setLog(`${enemy.name} is winding up… ${enemy.charge.turns} more round${enemy.charge.turns === 1 ? '' : 's'}`);
        floatAt(enemy.el, 'CHARGING ' + enemy.charge.turns, 'miss');
        sparks(enemy.el, '#ffb84d', 6);
        SFX.play('charge');
        refresh();
        await sleep(380);
        return;
      }
      const payload = enemy.charge.payload;
      enemy.charge = null;
      enemy.activeLeech = payload.leech || 0;
      const target = chooseTarget(enemy);
      banner(enemy.name.toUpperCase() + ' UNLEASHES ' + payload.name.toUpperCase() + '!', 'crit');
      choreograph(enemy.el, { kind: 'charge' });
      shake(true);
      vignette('rgba(255,150,60,.4)');
      SFX.play('quake');
      flash('rgba(255,150,60,.45)');
      await sleep(360);
      if (payload.all) {
        /* Boss ultimate: the whole squad takes it. Each pig is floored at 30%
           and capped at 60% of its own health bar, so this always lands like a
           truck without ever deleting a pig from full health. */
        const cap = payload.cap || 0.6;
        for (const t of aliveHeroes()) {
          const raw = enemy.atk * flockMul * (payload.mult || 2);
          damageHero(t, clamp(raw, t.maxHp * 0.3, t.maxHp * cap));
          applyHeroStatus(t, payload);
          await sleep(130);
        }
        setLog(`${enemy.name} brings ${payload.name} down on the whole squad!`);
      } else if (target) {
        let slam = enemy.atk * flockMul * (payload.mult || 2);
        if (payload.scaled) slam = clamp(slam, target.maxHp * 0.3, target.maxHp * (payload.cap || 0.6));
        damageHero(target, slam);
        applyHeroStatus(target, payload);
        setLog(`${enemy.name} crushes ${target.def.name} with ${payload.name}!`);
      }
      refresh();
      await sleep(420);
      return;
    }

    /* Special-attack cooldown. The bar is an option, not a script: a bird with
       a charged special still takes normal turns (peck, heal, buff, whatever
       its kit allows) and only spends *some* of them winding up, more often as
       the bar fills. The tick that fills the bar strikes on the spot. */
    let forced = null;
    if (enemy.special && enemy.special.cd > 0) {
      const sp = enemy.special;
      if (enemy.cdHave >= sp.cd) {
        refresh();
        floatAt(enemy.el, sp.icon || 'READY', 'shield');
        await sleep(240);
        forced = sp;
      } else if (Math.random() < 0.45 + 0.3 * (enemy.cdHave / sp.cd)) {
        enemy.cdHave += 1;
        if (enemy.cdHave >= sp.cd) {
          /* The tick that fills the bar is the strike: it lands this turn, not
             the round after. */
          setLog(`${enemy.name} floods its charge — ${sp.name}!`);
          floatAt(enemy.el, sp.icon || 'READY', 'shield');
          sparks(enemy.el, '#4fb6ff', 8);
          SFX.play('charge');
          refresh();
          await sleep(240);
          forced = sp;
        } else {
          setLog(`${enemy.name} winds up ${sp.name} — ${enemy.cdHave}/${sp.cd}`);
          floatAt(enemy.el, `${enemy.cdHave}/${sp.cd}`, 'miss');
          sparks(enemy.el, '#4fb6ff', 5);
          SFX.play('charge');
          refresh();
          await sleep(360);
          return;
        }
      }
      /* Otherwise: fall through and do something normal this turn. */
    }


    /* Bosses never stop calling the flock. Every boss summons on a hard
       two-round timer; the counter only resets when the summon actually lands
       (the field has to have a free slot). */
    if (enemy.tpl.boss) {
      enemy.summonCd = (enemy.summonCd || 0) + 1;
      if (enemy.summonCd >= 2 && aliveEnemies().length < 4) {
        enemy.summonCd = 0;
        setLog(`${enemy.name} screeches for the flock — reinforcements!`);
        banner('REINFORCEMENTS!', 'ghost');
        summonMinion(enemy, 1);
        await sleep(420);
      }
    }

    if (enemy.tpl.bomb) return bombTurn(enemy, silenced, weakMul);

    const moves = silenced && enemy.tpl.moves.some((m) => m.kind !== 'single')
      ? [{ name: 'Desperate Peck', kind: 'single', mult: 0.8 }]
      : enemy.tpl.moves;
    const basic = moves.filter((m) => !(m.cd > 0) || !enemy.special);
    /* A silenced bird cannot land its special — it wastes the charge. */
    const move = forced && !silenced ? forced : pickMove(enemy, basic.length ? basic : moves);
    /* Lifesteal is read off the move so every branch (single, multi, AoE,
       charge, targeted AoE) drains without touching its own damage code. */
    enemy.activeLeech = move.leech || 0;

    choreograph(enemy.el, move, enemy.flying || (enemy.tpl && enemy.tpl.flying));
    impact(enemy.el, { color: move.kind === 'charge' ? '#ffb84d' : '#ffd9a8' });
    setLog(`${enemy.name} uses ${move.name}!`);
    await sleep(440);

    if (move.kind === 'single') {
      const target = chooseTarget(enemy);
      if (target) {
        damageHero(target, enemy.atk * move.mult * weakMul * flockMul);
        applyHeroStatus(target, move);
      }
    } else if (move.kind === 'multi') {
      let target = chooseTarget(enemy);
      for (let i = 0; i < (move.hits || 2); i++) {
        if (move.random) {
          const list = aliveHeroes();
          if (!list.length) break;
          target = pick(list);
        }
        if (!target || !target.alive) target = chooseTarget(enemy);
        if (!target) break;
        damageHero(target, enemy.atk * move.mult * weakMul * flockMul);
        /* Multi-hit moves carry their listed status too — it used to be
           dropped here, so the compendium promised effects that never came. */
        applyHeroStatus(target, move);
        await sleep(120);
      }
    } else if (move.kind === 'aoe') {
      if (move.targetCount) {
        const pool = aliveHeroes().slice();
        const picked = [];
        for (let i = 0; i < move.targetCount && pool.length; i++) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        for (const t of picked) {
          damageHero(t, enemy.atk * move.mult * weakMul * flockMul);
          applyHeroStatus(t, move);
          await sleep(110);
        }
      } else {
        shake();
        for (const t of aliveHeroes()) {
          damageHero(t, enemy.atk * move.mult * weakMul * flockMul);
          applyHeroStatus(t, move);
          await sleep(100);
        }
      }
    } else if (move.kind === 'charge') {
      enemy.charge = { turns: move.rounds || 3, payload: move };
      if (forced) {
        enemy.cdHave = 0;
        enemy.special = pickSpecial(enemy);
      }
      setLog(`${enemy.name} plants its feet and starts charging ${move.name}…`);
      banner('CHARGING…', 'crit');
      floatAt(enemy.el, 'CHARGING', 'miss');
      sparks(enemy.el, '#ffb84d', 10);
      SFX.play('charge');
      refresh();
    } else if (move.kind === 'summon') {
      setLog(`${enemy.name} calls its flock!`);
      summonMinion(enemy, 1);
      SFX.play('gate');
      await sleep(320);
    } else if (move.kind === 'focus') {
      const marked = chooseTarget(enemy);
      if (marked) {
        B.mark = { id: marked.def.id, turns: move.rounds || 2 };
        setLog(`${enemy.name} marks ${marked.def.name} — the whole flock turns on that pig!`);
        floatAt(marked.el, '🎯 MARKED', 'miss');
        banner('MARKED PREY', 'crit');
        SFX.play('select');
        refresh();
      }
    } else if (move.kind === 'healAlly') {
      const allies = B.enemies.filter((e) => e.alive && !e.ghost);
      const hurt = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurt) {
        const amount = Math.round(hurt.maxHp * move.heal);
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + amount);
        floatAt(hurt.el, '+' + amount, 'heal');
        setLog(`${enemy.name} patches up ${hurt.name}.`);
        SFX.play('heal');
        refresh();
      }
    } else if (move.kind === 'shieldAll') {
      for (const ally of B.enemies.filter((e) => e.alive)) {
        ally.shield = Math.max(ally.shield, Math.min(60, Math.round((move.shield || 0) * 100)));
        ally.shieldTurns = 2;
        if (move.heal) ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * move.heal));
        floatAt(ally.el, 'SHIELD', 'shield');
      }
      setLog(`${enemy.name} shields the flock!`);
      SFX.play('shield');
      refresh();
    } else if (move.kind === 'self') {
      if (move.power) {
        enemy.power = move.power;
        enemy.powerTurns = move.powerTurns || 3;
        banner(enemy.name.toUpperCase() + ' IS FRENZIED', 'crit');
        floatAt(enemy.el, '⚡ +' + move.power, 'crit');
        setLog(`${enemy.name} whips itself into a frenzy — every hit lands +${move.power} harder for ${enemy.powerTurns} rounds!`);
        SFX.play('crit');
        refresh();
        await sleep(320);
      }
      /* Rage: a straight percentage on the bird's own attack. Stored as the
         original ATK so the buff can be lifted cleanly when it expires. */
      if (move.rage) {
        if (!enemy.rageTurns) enemy.rageBase = enemy.atk;
        enemy.rageTurns = Math.max(enemy.rageTurns || 0, move.rageTurns || 3);
        enemy.atk = Math.round((enemy.rageBase || enemy.atk) * (1 + move.rage) * 10) / 10;
        banner(enemy.name.toUpperCase() + ' IS ENRAGED', 'crit');
        floatAt(enemy.el, '🔥 +' + Math.round(move.rage * 100) + '% DMG', 'crit');
        setLog(`${enemy.name} works itself into a fury — +${Math.round(move.rage * 100)}% damage for ${enemy.rageTurns} rounds.`);
        SFX.play('crit');
        refresh();
        await sleep(300);
      }
      /* A self-buff ward: the bird shields its whole flock, not just itself. */
      if (move.shieldBirds) {
        const pct = Math.min(60, Math.max(5, Math.round(move.shieldBirds * 100)));
        for (const ally of B.enemies.filter((x) => x.alive && !x.ghost)) {
          ally.shield = Math.max(ally.shield || 0, pct);
          ally.shieldTurns = Math.max(ally.shieldTurns || 0, 2);
          floatAt(ally.el, '🛡 -' + pct + '%', 'shield');
        }
        banner(enemy.name.toUpperCase() + ' WARDS THE FLOCK', 'shield');
        setLog(`${enemy.name} throws a ward over the whole flock — ${pct}% less damage for 2 rounds.`);
        SFX.play('shield');
        refresh();
        await sleep(300);
      }
      if (move.dodge) {
        enemy.dodgeCharge = (enemy.dodgeCharge || 0) + move.dodge;
        floatAt(enemy.el, '💨 DODGE READY', 'shield');
        setLog(`${enemy.name} slips into the wind — ${move.dodge} dodge charge${move.dodge === 1 ? '' : 's'} (cleansing damage can strip these).`);
        SFX.play('miss');
        refresh();
        await sleep(280);
      }
      if (move.veil) {
        enemy.veil = move.veil;
        enemy.shield = 0;
        banner(enemy.name.toUpperCase() + ' BLURS OUT OF PHASE', 'ghost');
        floatAt(enemy.el, '🌫️ MIRAGE', 'shield');
        setLog(`${enemy.name} shimmers out of phase — most attacks will miss until a pig clears the air.`);
        SFX.play('shield');
        refresh();
        await sleep(320);
      }
    }
    if (forced) {
      enemy.cdHave = 0;
      enemy.special = pickSpecial(enemy);
      refresh();
    }
    await sleep(220);
  }

  async function bombTurn(bomb, silenced, weakMul) {
    if (bomb.fuse === 'lit') {
      bomb.fuse = 'idle';
      lunge(bomb.el);
      banner('BOOM!');
      shake(true);
      flash('rgba(255,150,80,.45)');
      sparks(bomb.el, '#ffb35e', 16);
      SFX.play('boom');
      setLog('Bomb explodes!');
      refresh();
      await sleep(140);
      for (const t of aliveHeroes()) {
        damageHero(t, bomb.atk * flockAtkMul(bomb) * 1.9 * weakMul);
        await sleep(100);
      }
      const recoil = Math.round(bomb.maxHp * 0.2);
      bomb.hp = Math.max(1, bomb.hp - recoil);
      floatAt(bomb.el, '-' + recoil, 'miss');
      refresh();
      await sleep(280);
      return;
    }

    lunge(bomb.el);
    if (!silenced && Math.random() < 0.55) {
      bomb.fuse = 'lit';
      setLog('Bomb is lighting his fuse! Brace for the blast!');
      floatAt(bomb.el, '💣 FUSE LIT', 'miss');
      SFX.play('fuse');
      refresh();
    } else {
      const target = chooseTarget(bomb);
      setLog(`Bomb tackles ${target ? target.def.name : 'a pig'}!`);
      await sleep(220);
      if (target) damageHero(target, bomb.atk * flockAtkMul(bomb) * 0.75 * weakMul);
    }
    await sleep(300);
  }

  function endRound() {
    if (B.over) return;
    // burn ticks
    for (const e of B.enemies) {
      if (!e.alive || e.ghost || !e.burn || e.burn.turns <= 0) continue;
      const dmg = e.burn.dmg;
      e.burn.turns -= 1;
      if (e.burn.turns <= 0) { e.burn = null; e.chili = 0; e.chiliHits = 0; }
      e.hp = Math.max(0, e.hp - dmg);
      B.stats.dealt += dmg;
      hurt(e.el);
      floatAt(e.el, String(dmg), 'burn');
      SFX.play('burn');
      sparks(e.el, '#ff8a3d', 5);
      if (e.hp <= 0) killEnemy(e);
      refresh();
    }
    if (checkWin()) return;

    /* Mirages fade a round at a time. */
    for (const e of B.enemies) {
      if (e.veil > 0) e.veil = Math.max(0, e.veil - 1);
      if (e.power > 0) {
        e.powerTurns = Math.max(0, (e.powerTurns || 0) - 1);
        if (e.powerTurns <= 0) e.power = 0;
      }
    }

    /* Saltwater dries off after a round. */
    for (const h of B.heroes) {
      if (h.drenched > 0) h.drenched -= 1;
    }

    B.heroes.forEach((h) => {
      if (!h.alive) return;
      if (h.guard && h.guard.turns > 0) {
        h.guard.turns -= 1;
        if (h.guard.turns <= 0) h.guard = null;
      }
      if (h.taunt > 0) h.taunt -= 1;
      if (h.weak > 0) h.weak -= 1;
      if (h.silence > 0) h.silence -= 1;
      if (h.pepperDry > 0) h.pepperDry -= 1;
      if (h.mire > 0) h.mire -= 1;
      if (h.expose > 0) h.expose -= 1;
      if (h.shieldTurns > 0) {
        h.shieldTurns -= 1;
        if (h.shieldTurns <= 0) { h.shieldTurns = 0; h.shield = 0; }
      }
    });
    B.enemies.forEach((e) => {
      if (e.weak > 0) e.weak -= 1;
      if (e.silence > 0) e.silence -= 1;
      if (e.vuln > 0) {
        e.vuln -= 1;
        if (e.vuln <= 0) e.vulnBonus = 0;
      }
      if (e.lock && e.lock.turns > 0) {
        e.lock.turns -= 1;
        if (e.lock.turns <= 0) e.lock = null;
      }
      if (e.shieldTurns > 0) {
        e.shieldTurns -= 1;
        if (e.shieldTurns <= 0) { e.shieldTurns = 0; e.shield = 0; }
      }
      if (e.rageTurns > 0) {
        e.rageTurns -= 1;
        if (e.rageTurns <= 0) {
          if (e.rageBase) e.atk = e.rageBase;
          e.rageBase = 0;
        }
      }
    });
    if (B.might > 0) B.might -= 1;
    if (B.mark && B.mark.turns > 0) {
      B.mark.turns -= 1;
      if (B.mark.turns <= 0) B.mark = null;
    }

    B.round += 1;
    /* Deliberately NOT reset: the cap is one potion per level, not per round. */
    B.pepperCd = Math.max(0, (B.pepperCd || 0) - 1);
    B.pending = null;
    B.acted = false;
    setLog(`Round ${B.round}`);
    /* ghost-timer fix: only a ghost that rises next round gets that round.
       Once the field is otherwise beaten, the pigs have already won it. */
    if (!aliveEnemies().length) {
      if (B.enemies.some((e) => e.ghost && e.ghostTimer <= 1)) { startEnemyPhase(); return; }
      checkWin();
      return;
    }
    startHeroPhase();
  }

  /* ---------------- potions ---------------- */

  function usePotion(kind) {
    if (!B || B.over || B.busy || B.phase !== 'hero') return;
    if (!B.items[kind]) return;
    /* One of EACH potion per level: a healing flask and a might brew are
       different tools, so drinking one no longer locks the other out. */
    B.potionsUsed = B.potionsUsed || {};
    if (B.potionsUsed[kind]) { SFX.play('nope'); setHint('That potion has already been drunk this level.'); return; }
    const left = hooks.consumePotion ? hooks.consumePotion(kind) : B.items[kind] - 1;
    if (left === false) return;
    B.items[kind] = left;
    B.potionUsed = true;
    B.potionsUsed[kind] = true;
    SFX.play('potion');

    const tier = (B.potionTiers && B.potionTiers[kind]) || 1;
    const fx = DATA.potionEffect(kind, tier);
    if (kind === 'heal') {
      for (const h of aliveHeroes()) healHero(h, Math.round(h.maxHp * fx.heal));
      flash('rgba(150,255,160,.3)');
      setLog(`The squad drinks a grade ${tier} healing potion — ${Math.round(fx.heal * 100)}% each.`);
    } else if (kind === 'rage') {
      addPepper(fx.pepper);
      for (const h of aliveHeroes()) floatAt(h.el, '+' + fx.pepper + ' PEPPER', 'heal');
      SFX.play('buff');
      setLog('Pepper tonic! The squad swallows a mouthful of chili.');
    } else if (kind === 'might') {
      B.might = fx.rounds;
      B.mightMul = 1 + fx.mult;
      for (const h of aliveHeroes()) floatAt(h.el, 'MIGHT', 'heal');
      SFX.play('buff');
      setLog(`Might brew! +${Math.round(fx.mult * 100)}% damage for ${fx.rounds} rounds.`);
    } else if (kind === 'hex') {
      for (const e of aliveEnemies()) {
        e.weak = Math.max(e.weak, fx.weaken);
        floatAt(e.el, 'HEXED', 'miss');
      }
      SFX.play('buff');
      setLog('Hex vial! Every bird is weakened.');
    }
    refresh();
  }

  /* ---------------- win / lose ---------------- */

  function nextWave() {
    B.wave += 1;
    B.enemies = DATA.waveEntries(B.level, B.wave).map((entry, i) => buildEnemy(entry, B.level, i));
    B.enemies.forEach((e) => { e.focus = Math.floor(Math.random() * B.heroes.length); });
    renderScreen();
    refresh();
    banner(`WAVE ${B.wave} / ${B.waveCount}`, 'crit wave');
    /* A new wave is a new fight: the boss escalation from the last one ends. */
    if (typeof Music !== 'undefined' && Music.setIntensity) Music.setIntensity(0);
    SFX.play('gate');
    shake(true);
    B.phase = 'hero';
    B.acted = false;
    B.busy = true;
    B.pending = null;
    B.mark = null;
    refresh();
    setLog(`Wave ${B.wave} of ${B.waveCount} enters the field!`);
    /* The new flock lands, then the pigs get the first move. Input stays
       locked for a beat so a queued click cannot hand the turn away, and the
       caller bails out on checkWin()'s `true` instead of running the enemy
       phase. */
    setTimeout(() => {
      if (!B || B.over) return;
      startHeroPhase();
      setHint('Your pigs move first.');
    }, 1000);
  }

  function checkWin() {
    if (B.over) return true;
    if (aliveEnemies().length) return false;
    /* No living bird left: any ghost still waiting to rise loses its body for
       good. The wave is won now, not three rounds from now. */
    let hadGhost = false;
    for (const e of B.enemies) {
      if (!e.ghost) continue;
      e.ghost = false;
      e.ghostTimer = 0;
      e.rising = false;
      e.alive = false;
      hadGhost = true;
    }
    if (hadGhost) refresh();
    /* A fresh wave was spawned: report "handled" so the caller stops here
       instead of falling through to the enemy turn. */
    if (B.wave < B.waveCount) { nextWave(); return true; }
    B.over = 'win';
    B.busy = true;
    refresh();
    const remainingHp = B.heroes.reduce((a, h) => a + Math.max(0, h.hp), 0);
    const partyMaxHp = B.heroes.reduce((a, h) => a + h.maxHp, 0);
    const enemyTotalHp = B.enemies.reduce((a, e) => a + e.maxHp, 0);
    const score = Math.round(B.stats.dealt + B.stats.healed * 0.4 + remainingHp * 3 - B.stats.taken * 1.2);
    const stars = DATA.scoreStars(enemyTotalHp, partyMaxHp, score);
    /* Two bonus ribbons, not one: the pig that dealt the most damage and the
       pig that healed the most each earn 1.25x XP. A pig that tops both keeps
       a single ribbon — the bonus is never paid twice. */
    const statOf = (h, key) => (B.stats.hero[h.def.id] || {})[key] || 0;
    const topBy = (key) => {
      const best = B.heroes.slice().sort((a, b) => statOf(b, key) - statOf(a, key))[0];
      return best && statOf(best, key) > 0 ? best.def.id : null;
    };
    const topDamage = topBy('dealt');
    const topHeal = topBy('healed');
    const result = {
      stars,
      score,
      remainingHp,
      partyMaxHp,
      enemyTotalHp,
      rounds: B.round,
      stats: Object.assign({}, B.stats),
      mvp: topDamage,
      mvpHeal: topHeal,
      party: B.heroes.map((h) => h.def.id),
      heroStats: Object.assign({}, B.stats.hero),
      itemsLeft: Object.assign({}, B.items),
      heroEnd: B.heroes.map((h) => ({ id: h.def.id, hp: h.hp, maxHp: h.maxHp }) ),
      fallen: B.heroes.filter((h) => !h.alive).map((h) => h.def.id),
      usedPotion: !!B.potionUsed,
    };
    setTimeout(() => {
      SFX.play('win');
      Music.stop(1.2);
      hooks.onWin && hooks.onWin(result);
    }, 700);
    return true;
  }

  function lose() {
    if (B.over) return;
    B.over = 'lose';
    B.busy = true;
    refresh();
    setTimeout(() => {
      SFX.play('lose');
      Music.stop(0.7);
      hooks.onLose && hooks.onLose({ rounds: B.round, stats: Object.assign({}, B.stats) });
    }, 800);
  }

  return { start };
})();
