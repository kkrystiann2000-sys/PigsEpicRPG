/* Shared hover-tooltip layer.
   Lives in its own file because BOTH battle.js and game.js need it; keeping it
   inside game.js's closure made battle.js throw on `initTips is not defined`
   and the whole ability bar never rendered. */

(function () {
  let tipEl = null;

  function initTips() {
    if (tipEl) return;
    tipEl = document.createElement('div');
    tipEl.className = 'hover-tip hidden';
    document.body.appendChild(tipEl);
    let current = null;

    const hide = () => { current = null; tipEl.classList.add('hidden'); };
    const place = (x, y) => {
      tipEl.style.left = '0px';
      tipEl.style.top = '0px';
      const r = tipEl.getBoundingClientRect();
      const pad = 12;
      let left = x + 16;
      let top = y + 16;
      if (left + r.width > window.innerWidth - pad) left = Math.max(pad, x - r.width - 12);
      if (top + r.height > window.innerHeight - pad) top = Math.max(pad, window.innerHeight - r.height - pad);
      tipEl.style.left = left + 'px';
      tipEl.style.top = top + 'px';
    };
    const show = (target, x, y) => {
      const html = target.getAttribute('data-tip');
      if (!html) { hide(); return; }
      current = target;
      tipEl.innerHTML = html;
      tipEl.classList.remove('hidden');
      place(x, y);
    };

    document.addEventListener('pointerover', (ev) => {
      const target = ev.target && ev.target.closest ? ev.target.closest('[data-tip]') : null;
      if (!target) { if (current) hide(); return; }
      if (target === current) return;
      show(target, ev.clientX, ev.clientY);
    });
    document.addEventListener('pointermove', (ev) => {
      if (!current) return;
      if (!current.contains(ev.target)) { hide(); return; }
      place(ev.clientX, ev.clientY);
    });
    /* A phone has no hover, so a tap shows the tip for a moment instead:
       hero, bird, ability and bar details stay reachable on touch. */
    let tapTimer = null;
    const isTouch = (ev) => ev.pointerType === 'touch' || ev.pointerType === 'pen';
    document.addEventListener('pointerdown', (ev) => {
      if (isTouch(ev)) return;
      hide();
    }, true);
    document.addEventListener('pointerup', (ev) => {
      if (!isTouch(ev)) return;
      const target = ev.target && ev.target.closest ? ev.target.closest('[data-tip]') : null;
      if (!target) { hide(); return; }
      show(target, ev.clientX, ev.clientY);
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { if (current === target) hide(); }, 2800);
    }, true);
    document.addEventListener('scroll', hide, true);
  }

  window.initTips = initTips;
})();
