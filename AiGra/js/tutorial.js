/* ============================================================
   Guided first run
   ------------------------------------------------------------
   A spotlight that walks a new player through the whole loop:
   start → pick a node → attack → choose a bird → pepper →
   rewards → base → workshop → relic forge → relics.

   Steps marked click:true are FORCED: four blockers cover the
   screen, the target keeps a hole in the middle, and the tour
   only moves on when that thing is really tapped. Steps without
   a target (or marked next) explain and wait for a button.
   ============================================================ */

const Tutorial = (function () {
  const STEPS = [
    {
      find: () => document.querySelector('#playBtn'),
      kicker: 'Welcome',
      title: 'Piggy Epic',
      text: 'Press Start to open the pig gate. The arrow points at everything you need to tap — nothing else can be clicked until you do.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-map .xp-pill'),
      kicker: 'Step 1 · Level bar',
      title: 'Squad level',
      text: 'This pill is the squad level. Main-road wins fill it, and a new level unlocks pigs and the next stretch of road. Side roads pay coins and materials, never pig XP.',
      next: 'Got it',
    },
    {
      find: () => document.querySelector('#screen-map .map-node'),
      kicker: 'Step 2 · The map',
      title: 'Pick a fight',
      text: 'Tap the glowing egg node on the road. Every node is one battle, and its flock is fixed: the same birds turn up every time you open it.',
      click: true,
    },
    {
      find: () => document.querySelector('#overlay:not(.hidden) #ovFight'),
      kicker: 'Step 3 · The squad',
      title: 'Check the pigs, then fight',
      text: 'This is the squad screen. Tap a pig to bench it, tap a bench pig to field it — then press Fight. The flock it shows is the flock you will always meet here.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-battle .hud-actions .ability[data-ab]'),
      kicker: 'Step 4 · Attack',
      title: 'Hit something',
      text: 'Tap one of the pig\'s attacks. Two are free, the third is the team shield or heal, and the big pepper ability waits at the bottom.',
      click: true,
    },
    {
      /* Prefer the bird the game is actually asking for: a knocked-out figure
         stays in the DOM and would leave the spotlight on an empty slot. */
      find: () => document.querySelector('#screen-battle .fig.enemy.targetable')
        || document.querySelector('#screen-battle .fig.enemy:not(.ko):not(.dying)')
        || document.querySelector('#screen-battle .fig.enemy'),
      kicker: 'Step 5 · Target',
      title: 'Now pick a bird',
      text: 'Tap the bird you want to hit. Abilities that hit the whole flock skip this step — they just go off.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-battle #itemsTop'),
      kicker: 'Step 6 · Items',
      title: 'Potions are free actions',
      text: 'The Items button opens your potions. A potion does not cost a turn, and you may use one of each kind per battle. The shop node on the map sells more, and the Pantry brews them from herbs.',
      next: 'Got it',
    },
    {
      find: () => document.querySelector('#screen-battle .rage-meter'),
      kicker: 'Step 7 · Pepper',
      title: 'Pepper charge',
      text: 'Every hit fills the pepper bar — six per pig in the squad. When it is full the chili lights up: tap it for the ultimate. Some birds can numb a pig so its hits build none.',
      next: 'Got it',
      pass: true,
    },
    {
      find: () => document.querySelector('#screen-battle .fig.hero .statuses'),
      kicker: 'Step 8 · Statuses',
      title: 'Read the badges',
      text: 'Icons over a pig are what is wrong with it right now: stunned, frozen, silenced, drenched, poisoned, or pepper-numbed. Hover any badge to see the countdown. Shields cut the damage a pig takes instead of soaking a bar.',
      next: 'Okay',
      pass: true,
    },
    {
      find: () => document.querySelector('#overlay:not(.hidden) .sheet .btn'),
      kicker: 'Step 9 · Victory',
      title: 'Rewards',
      text: 'Stars, coins, XP and herbs land here, and the XP pours into the bar at the top right. Three stars needs every pig standing and the squad above half health when the last bird drops. Finish the fight — the tour waits for the win screen.',
      click: true,
      pass: true,
    },
    {
      find: () => document.querySelector('#screen-map #baseBtn'),
      kicker: 'Step 10 · The base',
      title: 'Everything you own',
      text: 'Open the base. The squad, gear, materials, potions, relics and the compendium all live behind this button, one tab each. We will walk them in order.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base .base-tabs'),
      kicker: 'Step 11 · Squad',
      title: 'Party',
      text: 'The Party tab is who fights. Tap a resting pig to field it and a fielded pig to bench it; the gear you buy follows that pig into every battle. Stats and the power number are on each card.',
      next: 'Got it',
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="workshop"]'),
      kicker: 'Step 12 · Upgrades',
      title: 'Workshop',
      text: 'Spend coins to raise each pig\'s weapon and helmet. Gear carries over to every fight, and party level rises with the XP you earn.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="inventory"]'),
      kicker: 'Step 13 · Inventory',
      title: 'What you are carrying',
      text: 'Every material, key, blueprint, relic chip and potion the squad owns sits in the Inventory. Keys open the coloured side doors on the map; materials feed the Barracks and the forge.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="forge"]'),
      kicker: 'Step 14 · Blueprints',
      title: 'Relic Forge',
      text: 'Blueprints and relic metal buy the next relic rank for a pig. Ranks stack stats and add effects to that pig\'s abilities.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="relics"]'),
      kicker: 'Step 15 · Relics',
      title: 'Relics',
      text: 'Every pig carries five relic ranks. Equipping one changes its look and its kit, and a higher tier relic may also cleanse a pig when its ability fires. The last rank only drops in the dungeon.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="pantry"]'),
      kicker: 'Step 16 · Potions',
      title: 'Pantry',
      text: 'This is where potions live between fights. Brew Healing, Might, Hex, Rage and XP tonics with herbs and coins, then carry one of each kind into a battle. Stronger tiers cost more and heal more.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="alchemy"]'),
      kicker: 'Step 17 · Brewing',
      title: 'Alchemy',
      text: 'Alchemy turns herbs into lasting buffs for the next run: extra coins, extra herbs, softer birds. Buffs stack with potions but fade when you stop using them.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="barracks"]'),
      kicker: 'Step 18 · Barracks',
      title: 'Permanent upgrades',
      text: 'The Barracks spends materials on the whole squad at once: more power, more health, more edge, more guard. These never expire, so they are the slow, safe way to get stronger.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-base [data-tab="index"]'),
      kicker: 'Step 19 · Index',
      title: 'Compendium',
      text: 'The Index lists every bird you have met: its health, its attacks, its trait, and what it resists. Locked birds stay as question marks until you fight them.',
      click: true,
    },
    {
      find: () => document.querySelector('#baseBack'),
      kicker: 'Step 20 · Back out',
      title: 'Back to the road',
      text: 'That is the base. Head back to the map when you have spent what you wanted.',
      click: true,
    },
    {
      find: () => document.querySelector('#screen-map .map-node'),
      kicker: 'That is the loop',
      title: 'Ready to play',
      text: 'Fight, level up, spend, upgrade, repeat. Potions are free actions, pepper wins long fights, and the compendium remembers every bird. Have fun.',
      next: 'Let\'s play',
    },
  ];

  let index = -1;
  let layer = null;
  let blockers = [];
  let ring = null;
  let arrow = null;
  let bubble = null;
  let tickTimer = null;
  let startedAt = 0;
  let lastRect = null;
  let opts = {};
  let listening = false;

  const vw = () => window.innerWidth || document.documentElement.clientWidth;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;

  function build() {
    if (layer) return;
    layer = document.createElement('div');
    layer.className = 'tour-layer';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-live', 'polite');
    layer.innerHTML = `
      <div class="tour-block"></div>
      <div class="tour-block"></div>
      <div class="tour-block"></div>
      <div class="tour-block"></div>
      <div class="tour-ring"></div>
      <div class="tour-arrow">👇</div>
      <div class="tour-bubble">
        <div class="tour-kicker"></div>
        <h3 class="tour-title"></h3>
        <p class="tour-text"></p>
        <div class="tour-actions">
          <button class="btn gold tour-next" type="button">Got it</button>
          <button class="tour-skip" type="button">Skip tour</button>
        </div>
      </div>`;
    document.body.appendChild(layer);
    blockers = Array.prototype.slice.call(layer.querySelectorAll('.tour-block'));
    ring = layer.querySelector('.tour-ring');
    arrow = layer.querySelector('.tour-arrow');
    bubble = layer.querySelector('.tour-bubble');
    layer.querySelector('.tour-next').addEventListener('click', () => advance());
    layer.querySelector('.tour-skip').addEventListener('click', () => finish(true));
  }

  /* Four dark panels around the hole. The hole itself stays fully clickable. */
  function placeHole(rect) {
    const pad = 8;
    const w = vw();
    const h = vh();
    if (!rect || !rect.width || !rect.height) {
      blockers[0].style.cssText = 'left:0;top:0;right:0;bottom:0';
      blockers[1].style.cssText = 'display:none';
      blockers[2].style.cssText = 'display:none';
      blockers[3].style.cssText = 'display:none';
      ring.style.display = 'none';
      arrow.style.display = 'none';
      return;
    }
    const top = Math.max(0, rect.top - pad);
    const left = Math.max(0, rect.left - pad);
    const right = Math.min(w, rect.right + pad);
    const bottom = Math.min(h, rect.bottom + pad);
    blockers[0].style.cssText = `left:0;top:0;right:0;height:${top}px`;
    blockers[1].style.cssText = `left:0;top:${bottom}px;right:0;bottom:0`;
    blockers[2].style.cssText = `left:0;top:${top}px;width:${left}px;height:${bottom - top}px`;
    blockers[3].style.cssText = `left:${right}px;top:${top}px;right:0;height:${bottom - top}px`;
    ring.style.display = 'block';
    ring.style.cssText = `display:block;left:${left}px;top:${top}px;width:${right - left}px;height:${bottom - top}px`;
    placeBubble(left, top, right, bottom);
    placeArrow(left, top, right, bottom);
  }

  function placeBubble(left, top, right, bottom) {
    const bw = bubble.offsetWidth || 320;
    const bh = bubble.offsetHeight || 150;
    const cx = Math.min(Math.max(left + (right - left) / 2 - bw / 2, 10), vw() - bw - 10);
    const below = bottom + 14;
    const above = top - bh - 14;
    let y = below + bh < vh() - 10 ? below : above > 10 ? above : vh() - bh - 10;
    bubble.style.left = cx + 'px';
    bubble.style.top = Math.max(10, y) + 'px';
  }

  function placeArrow(left, top, right, bottom) {
    const cx = left + (right - left) / 2;
    const below = bottom + 14 + (bubble.offsetHeight || 150) + 14 < vh();
    arrow.style.display = 'block';
    arrow.style.left = Math.max(14, Math.min(cx, vw() - 30)) + 'px';
    arrow.style.top = (below ? bottom - 2 : top - 26) + 'px';
    arrow.textContent = below ? '👇' : '👆';
  }

  function render() {
    const step = STEPS[index];
    if (!step) return;
    bubble.querySelector('.tour-kicker').textContent = step.kicker || '';
    bubble.querySelector('.tour-title').textContent = step.title || '';
    bubble.querySelector('.tour-text').textContent = step.text || '';
    const nextBtn = bubble.querySelector('.tour-next');
    nextBtn.style.display = step.click ? 'none' : '';
    nextBtn.textContent = step.next || 'Got it';
    /* Info steps must not wall off the screen: the player keeps fighting or
       browsing while reading. Forced steps keep all four blockers armed. */
    blockers.forEach((b) => b.classList.toggle('pass', !!step.pass || !step.click));
    bubble.style.left = '10px';
    bubble.style.top = '10px';
  }

  function targetOf(step) {
    if (!step || !step.find) return null;
    try {
      const el = step.find();
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 ? el : null;
    } catch (err) {
      return null;
    }
  }

  function tick() {
    if (!layer || index < 0) return;
    const step = STEPS[index];
    const el = targetOf(step);
    if (el) {
      const r = el.getBoundingClientRect();
      /* A target can appear off-screen (a node below the fold): bring it in. */
      if (r.top < 0 || r.bottom > vh()) {
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); }
      }
      lastRect = el.getBoundingClientRect();
      placeHole(lastRect);
    } else {
      /* No target yet (screen changing, sheet closing): hold the dark screen
         over everything so stray taps cannot skip the lesson. */
      placeHole(lastRect && Date.now() - startedAt < 1200 ? lastRect : null);
    }
  }

  function onDocClick(ev) {
    const step = STEPS[index];
    if (!step || !step.click) return;
    const el = targetOf(step);
    if (!el) return;
    if (el === ev.target || el.contains(ev.target)) {
      setTimeout(() => advance(), 260);
    }
  }

  function advance() {
    index += 1;
    if (index >= STEPS.length) { finish(false); return; }
    lastRect = null;
    startedAt = Date.now();
    render();
    const step = STEPS[index];
    const el = targetOf(step);
    if (el && el.getBoundingClientRect().top < 0) {
      try { el.scrollIntoView({ block: 'center' }); } catch (e) { /* older browsers */ }
    }
    tick();
    clearTimeout(layer._settle);
    layer._settle = setTimeout(tick, 320);
  }

  /* Tear the layer down without reporting anything: used when the game wants
     to restart the tour on a new screen (new game, replay). */
  function cancel() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
    if (listening) {
      document.removeEventListener('click', onDocClick, true);
      listening = false;
    }
    if (layer) {
      layer.remove();
      layer = null;
    }
    index = -1;
  }

  function finish(skipped) {
    cancel();
    const cb = skipped ? opts.onSkip : opts.onFinish;
    if (typeof cb === 'function') cb();
  }

  return {
    begin(options) {
      if (layer) return;
      opts = options || {};
      /* startAt lets the game resume on a later screen (e.g. the map after the
         intro cutscene) without flashing the title step again. */
      index = (typeof opts.startAt === 'number' ? opts.startAt : 0) - 1;
      build();
      if (!listening) {
        document.addEventListener('click', onDocClick, true);
        listening = true;
      }
      advance();
      tickTimer = setInterval(tick, 200);
      window.addEventListener('resize', tick);
    },
    stop() { finish(true); },
    cancel,
    isActive() { return !!layer; },
    steps: STEPS.length,
  };
})();

if (typeof window !== 'undefined') window.Tutorial = Tutorial;
