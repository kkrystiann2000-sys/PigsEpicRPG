const Art = (function () {
  const open = (inner) =>
    `<svg class="art" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  /* ---------------- Pigs ---------------- */

  /* One family, six jobs. Every pig shares the same face � ears, brow, snout,
     tusks � so the squad reads as one litter; the headgear does the talking.
     Every head carries its own gradient ids, so two pigs on one screen never
     share a fill. */
  let pigSeq = 0;

  function pigFace(skin, shade, light, brow) {
    const uid = 'p' + (++pigSeq);
    const head = 'M50 16 C33 16 20 30 20 50 C20 70 33 84 50 84 C67 84 80 70 80 50 C80 30 67 16 50 16 Z';
    return `
      <defs>
        <radialGradient id="${uid}-skin" cx="32%" cy="24%" r="88%">
          <stop offset="0" stop-color="${light}"/>
          <stop offset=".56" stop-color="${skin}"/>
          <stop offset="1" stop-color="${shade}"/>
        </radialGradient>
        <linearGradient id="${uid}-snout" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${light}"/>
          <stop offset="1" stop-color="${skin}"/>
        </linearGradient>
        <clipPath id="${uid}-clip"><path d="${head}"/></clipPath>
      </defs>
      <ellipse cx="50" cy="92" rx="24" ry="3.4" fill="#0b1406" opacity=".28"/>
      <path d="M32 35 C26 29 20 25 14 24 C17 19 25 19 30 25 C34 29 36 32 37 35 Z" fill="url(#${uid}-skin)" stroke="${shade}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M68 35 C74 29 80 25 86 24 C83 19 75 19 70 25 C66 29 64 32 63 35 Z" fill="url(#${uid}-skin)" stroke="${shade}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M32 32.6 C27.6 28 22.6 25.2 18 24.4 C20.6 21 26 21 29.6 25.4 C31.8 28 32.8 30.4 33.4 32.6 Z" fill="#e2919a" opacity=".7"/>
      <path d="M68 32.6 C72.4 28 77.4 25.2 82 24.4 C79.4 21 74 21 70.4 25.4 C68.2 28 67.2 30.4 66.6 32.6 Z" fill="#e2919a" opacity=".7"/>
      <path d="${head}" fill="url(#${uid}-skin)" stroke="${shade}" stroke-width="2.8"/>
      <g clip-path="url(#${uid}-clip)">
        <ellipse cx="50" cy="90" rx="34" ry="17" fill="#000" opacity=".16"/>
        <ellipse cx="73" cy="66" rx="12" ry="15" fill="#000" opacity=".08"/>
        <ellipse cx="31" cy="58" rx="9" ry="12" fill="#fff" opacity=".15"/>
      </g>
      <ellipse cx="50" cy="78" rx="18" ry="10" fill="${light}" opacity=".22"/>
      <ellipse cx="40.4" cy="47.8" rx="7.6" ry="8.2" fill="#fffdf1" stroke="${shade}" stroke-width="1.8"/>
      <ellipse cx="59.6" cy="47.8" rx="7.6" ry="8.2" fill="#fffdf1" stroke="${shade}" stroke-width="1.8"/>
      <circle cx="41.6" cy="48.9" r="4.1" fill="#2b3a18"/>
      <circle cx="58.4" cy="48.9" r="4.1" fill="#2b3a18"/>
      <circle cx="41.6" cy="48.9" r="2.3" fill="#11170a"/>
      <circle cx="58.4" cy="48.9" r="2.3" fill="#11170a"/>
      <circle cx="40.2" cy="46.4" r="1.5" fill="#fff"/>
      <circle cx="57" cy="46.4" r="1.5" fill="#fff"/>
      <path d="M32.6 45.4 q7.4 -2.4 14.2 0.5" stroke="${shade}" stroke-width="1.5" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M53.2 45.9 q6.8 -2.9 14.2 -0.5" stroke="${shade}" stroke-width="1.5" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M30 38.4 q8.8 -3.8 16 -0.8" stroke="${brow}" stroke-width="2.7" fill="none" stroke-linecap="round"/>
      <path d="M54 37.6 q7.2 -3 16 0.8" stroke="${brow}" stroke-width="2.7" fill="none" stroke-linecap="round"/>
      <ellipse cx="26.5" cy="63" rx="5.6" ry="3.6" fill="#e2747e" opacity=".18"/>
      <ellipse cx="73.5" cy="63" rx="5.6" ry="3.6" fill="#e2747e" opacity=".18"/>
      <rect x="37" y="55.8" width="26" height="18.6" rx="9.3" fill="${light}" stroke="${shade}" stroke-width="2.3"/>
      <path d="M39.4 69.6 q10.6 5.4 21.2 0" stroke="${shade}" stroke-width="1.4" fill="none" opacity=".22"/>
      <ellipse cx="44.4" cy="64.4" rx="2.5" ry="3.5" fill="#3d5219"/>
      <ellipse cx="55.6" cy="64.4" rx="2.5" ry="3.5" fill="#3d5219"/>
      <path d="M42.6 71.4 q7.4 2.4 14.8 0" stroke="${shade}" stroke-width="1.2" fill="none" opacity=".35"/>
      <path d="M41.4 78.6 q8.6 5 17.2 0" stroke="${shade}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M34.4 73.8 q-1.7 4.6 1.7 5.8 q2.5 -2.7 1.5 -6.2 Z" fill="#fff8e2" stroke="#cdbb92" stroke-width="1"/>
      <path d="M65.6 73.8 q1.7 4.6 -1.7 5.8 q-2.5 -2.7 -1.5 -6.2 Z" fill="#fff8e2" stroke="#cdbb92" stroke-width="1"/>
    `;
  }

  /* Every pig wears one of these unless a relic is equipped. Shapes are kept
     wide and flat across the brow so they still read at 40px in a squad list. */
  const PIG_STYLE = {
    corporal: { skin: '#7cc33f', shade: '#4a8419', light: '#b0e46b', brow: '#3f6f18' },
    chef:     { skin: '#8ed14d', shade: '#568e1d', light: '#c1ef82', brow: '#4e7f1a' },
    king:     { skin: '#6fb52f', shade: '#3f7712', light: '#a2dd60', brow: '#3c6c12' },
    sapper:   { skin: '#9dc94a', shade: '#5d8c21', light: '#cdf095', brow: '#4e7f1a' },
    scout:    { skin: '#8fc95a', shade: '#528823', light: '#c6ec94', brow: '#3d6c1a' },
    wizard:   { skin: '#86c95a', shade: '#4b8526', light: '#bdee95', brow: '#3f7a1c' },
    minion:   { skin: '#88c94a', shade: '#548c1f', light: '#c0ea80', brow: '#4a7d18' },
  };

  const classHats = {
    /* Steel pot helmet: raised crest, riveted brim and a chin strap. */
    corporal() {
      return `
        <path d="M22 37 Q23 11 50 11 Q77 11 78 37 Z" fill="#dfe5ec" stroke="#8b96a5" stroke-width="2.6"/>
        <path d="M50 11.5 L50 37" stroke="#b6bfcb" stroke-width="2"/>
        <path d="M23 21 Q50 3 77 21" fill="none" stroke="#a9b3c1" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M34 20 Q42 13 54 14" stroke="#ffffff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/>
        <rect x="14" y="31.6" width="72" height="8.6" rx="4.3" fill="#b3bdc9" stroke="#8b96a5" stroke-width="2.2"/>
        <circle cx="50" cy="29" r="3.6" fill="#f7c948" stroke="#b98a16" stroke-width="1.4"/>
        <circle cx="24" cy="35.9" r="1.5" fill="#8b96a5"/>
        <circle cx="76" cy="35.9" r="1.5" fill="#8b96a5"/>
        <path d="M23 40 q-3 12 5 18" stroke="#8b96a5" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"/>
      `;
    },
    /* Tall pleated toque that sits down over the whole crown. */
    chef() {
      return `
        <path d="M22 27 q-11 -9 1 -15 q0 -12 15 -12 q7 -7 15 -2 q8 -5 15 2 q15 0 15 12 q12 6 1 15 z" fill="#fffdf4" stroke="#c9bfa4" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M36 22 q-2 -14 5 -20 M50 22 q0 -15 0 -22 M64 22 q2 -14 -5 -20" stroke="#e6dcc4" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>
        <rect x="20" y="24" width="60" height="15" rx="5" fill="#fffdf4" stroke="#c9bfa4" stroke-width="2.4"/>
        <path d="M24 33.6 h52" stroke="#e7dfc9" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="50" cy="31.4" r="2.8" fill="#8ed14d" stroke="#568e1d" stroke-width="1"/>
      `;
    },
    /* Crown with a velvet cap and an ermine band. */
    king() {
      return `
        <path d="M28 32 L28 12 L38 21 L50 6 L62 21 L72 12 L72 32 Z" fill="#f7c948" stroke="#c1931c" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M31 14 q19 -8 38 0 l0 -5 q-19 -8 -38 0 z" fill="#7b4bc4" opacity=".9"/>
        <path d="M32 11 q18 -7 36 0" stroke="#9a63e0" stroke-width="1.4" fill="none" opacity=".7"/>
        <rect x="26" y="28.6" width="48" height="9" rx="4.4" fill="#f4efe2" stroke="#c9bfa4" stroke-width="1.8"/>
        <circle cx="34" cy="33.4" r="1.1" fill="#3b3630"/>
        <circle cx="42" cy="31.8" r="1.1" fill="#3b3630"/>
        <circle cx="58" cy="31.8" r="1.1" fill="#3b3630"/>
        <circle cx="66" cy="33.4" r="1.1" fill="#3b3630"/>
        <circle cx="50" cy="15" r="3" fill="#e2543f" stroke="#b23a28" stroke-width="1.2"/>
        <circle cx="38" cy="21" r="2" fill="#3aa5e0"/>
        <circle cx="62" cy="21" r="2" fill="#3aa5e0"/>
      `;
    },
    /* Hard hat with a lamp over the forehead and goggles on the dome. */
    sapper() {
      return `
        <path d="M20 37 Q22 11 50 11 Q78 11 80 37 Z" fill="#f7c948" stroke="#b98a16" stroke-width="2.6"/>
        <path d="M50 12 L50 37" stroke="#dfae24" stroke-width="2" opacity=".55"/>
        <path d="M28 24 q10 -9 22 -6" stroke="#ffe693" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
        <rect x="13" y="31.6" width="74" height="9" rx="4.5" fill="#ffd964" stroke="#b98a16" stroke-width="2.2"/>
        <rect x="28" y="18.6" width="44" height="11.4" rx="5.7" fill="#4d5a63" stroke="#31404a" stroke-width="1.9"/>
        <circle cx="39" cy="24.3" r="4.4" fill="#a5d8e8" stroke="#31404a" stroke-width="1.5"/>
        <circle cx="61" cy="24.3" r="4.4" fill="#a5d8e8" stroke="#31404a" stroke-width="1.5"/>
        <circle cx="37.6" cy="23" r="1.6" fill="#fff" opacity=".85"/>
        <circle cx="59.6" cy="23" r="1.6" fill="#fff" opacity=".85"/>
        <circle cx="50" cy="35.8" r="1.4" fill="#b98a16" opacity=".55"/>
      `;
    },
    /* Hood with a wrapped scarf, a brass pin and a feather. */
    scout() {
      return `
        <path d="M22 38 Q23 11 50 11 Q77 11 78 38 Q63 28 50 30 Q37 28 22 38 Z" fill="#3f5f3a" stroke="#2a4226" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M30 23 q20 -9 40 0" stroke="#6a9460" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M22 38 Q34 31 50 33 Q66 31 78 38 L74.5 42.6 Q62 35.4 50 37.4 Q38 35.4 25.5 42.6 Z" fill="#507546" stroke="#2a4226" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="50" cy="30.6" r="2.8" fill="#f0c85a" stroke="#b8912a" stroke-width="1.2"/>
        <path d="M70 16 Q86 8 93 23 Q81 21 73 26 Z" fill="#f0c85a" stroke="#b8912a" stroke-width="1.8"/>
        <path d="M62 18 q6 -9 15 -7" stroke="#2a4226" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      `;
    },
    /* Tall triangle with the base spread wide over the ears, tip at the top. */
    wizard() {
      return `
        <path d="M50 0 L30 38 L70 38 Z" fill="#7b4bc4" stroke="#4f2a85" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M50 0 L30 38 L50 38 Z" fill="#9a63e0" opacity=".35"/>
        <path d="M42 17 l1.6 3.4 l3.4 .9 l-3.4 1.6 l-1.6 3.4 l-1.6 -3.4 l-3.4 -1.6 l3.4 -.9 z" fill="#ffe27a"/>
        <path d="M4 37 Q50 26 96 37 Q50 44.5 4 37 Z" fill="#5c3399" stroke="#3d1f6b" stroke-width="2.4" stroke-linejoin="round"/>
        <rect x="41" y="30" width="18" height="8.6" rx="2.4" fill="none" stroke="#ffd76b" stroke-width="2.2"/>
      `;
    },
    /* Fresh recruit: a bristly tuft and nothing else. */
    minion() {
      return `
        <path d="M41 16 q4 -9 9 -2 q5 -8 9 2" stroke="#548c1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      `;
    },
  };

  /* Face furniture that belongs to the pig, not the hat. */
  const pigExtras = {
    chef() {
      return `
        <path d="M50 76.6 q-8 -3.6 -12.5 0.8 q4.4 4.6 12.5 4.4 q8.1 0.2 12.5 -4.4 q-4.5 -4.4 -12.5 -0.8 z" fill="#6a4a1f" opacity=".92"/>
        <path d="M52 81 q6 5 9.5 2.6" stroke="#4d3413" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
      `;
    },
    king() {
      return '<circle cx="74" cy="57" r="3" fill="#f7c948" stroke="#c1931c" stroke-width="1.2"/>';
    },
    wizard() {
      return `
        <path d="M36 79 q14 12 28 0 q-2 11 -14 11 q-12 0 -14 -11 z" fill="#efe9da" stroke="#cfc6b0" stroke-width="1.4"/>
        <path d="M44 84 q6 3.4 12 0" stroke="#cfc6b0" stroke-width="1.4" fill="none"/>
      `;
    },
  };

  /* ---------------- Hats ----------------
     A relic is a promotion, not a costume. Every pig climbs the ladder of its
     own trade: caps turn into helmets, toques get taller, crowns gain points,
     hard hats gain lamps. Natural materials and real silhouettes only — no
     gems, no glow, no fantasy metal. */
  const PIG_HATS = {
    /* Soldier: field cap, leather skullcap, steel pot, crested helm, officer's helm. */
    corporal: [
      `<path d="M26 34 Q26 14 50 14 Q74 14 74 34 Z" fill="#7a8a5c" stroke="#4f5c3a" stroke-width="2.4"/>
       <path d="M23 33 Q50 27 77 33 L79 38.5 Q50 33 21 38.5 Z" fill="#5d6b42" stroke="#4f5c3a" stroke-width="1.8" stroke-linejoin="round"/>
       <circle cx="50" cy="18.4" r="2.2" fill="#c9b06a" stroke="#9a8448" stroke-width=".8"/>`,
      `<path d="M24 35 Q25 13 50 13 Q75 13 76 35 Z" fill="#6d5133" stroke="#46301d" stroke-width="2.4"/>
       <path d="M24 29 q-4 11 2 17 q6 -3 4 -13 z" fill="#6d5133" stroke="#46301d" stroke-width="2"/>
       <path d="M76 29 q4 11 -2 17 q-6 -3 -4 -13 z" fill="#6d5133" stroke="#46301d" stroke-width="2"/>
       <path d="M25 32 Q50 27 75 32" stroke="#46301d" stroke-width="2.2" fill="none" opacity=".8"/>`,
      `<path d="M22 37 Q23 11 50 11 Q77 11 78 37 Z" fill="#c9d3de" stroke="#7c8794" stroke-width="2.6"/>
       <path d="M50 12 L50 37" stroke="#a8b3c0" stroke-width="1.8"/>
       <rect x="15" y="31" width="70" height="8" rx="4" fill="#b3bdc9" stroke="#7c8794" stroke-width="2.2"/>
       <circle cx="50" cy="26" r="2.6" fill="#d9b45a" stroke="#a8812c" stroke-width="1"/>
       <circle cx="24" cy="35" r="1.4" fill="#7c8794"/><circle cx="76" cy="35" r="1.4" fill="#7c8794"/>`,
      `<path d="M21 37 Q22 10 50 10 Q78 10 79 37 Z" fill="#d4dbe3" stroke="#76818f" stroke-width="2.6"/>
       <rect x="14" y="31" width="72" height="8" rx="4" fill="#bfc8d3" stroke="#76818f" stroke-width="2.2"/>
       <path d="M50 31 L50 44" stroke="#9aa5b2" stroke-width="4.4" stroke-linecap="round"/>
       <path d="M37 15 Q50 2 63 15 Q50 8 37 15 Z" fill="#a8402f" stroke="#7e2418" stroke-width="1.6"/>
       <circle cx="50" cy="26" r="2.8" fill="#d9b45a" stroke="#a8812c" stroke-width="1"/>`,
      `<path d="M19 36 Q20 8 50 8 Q80 8 81 36 Z" fill="#dfe6ee" stroke="#6f7a88" stroke-width="2.6"/>
       <rect x="13" y="30.5" width="74" height="9" rx="4.5" fill="#c8b06a" stroke="#9a8448" stroke-width="2"/>
       <path d="M22 38 q-2 10 4 14 q6 -3 4 -12 z" fill="#cfd7e0" stroke="#6f7a88" stroke-width="2"/>
       <path d="M78 38 q2 10 -4 14 q-6 -3 -4 -12 z" fill="#cfd7e0" stroke="#6f7a88" stroke-width="2"/>
       <path d="M36 13 Q50 -3 64 13 Q50 5 36 13 Z" fill="#a8402f" stroke="#7e2418" stroke-width="1.8"/>
       <circle cx="50" cy="24" r="3" fill="#f0d089" stroke="#9a8448" stroke-width="1"/>`
    ],
    /* Cook: every rung wears the same tall toque; the cap cloth shifts tone. */
    chef: [
      `<path d="M20 21 q-13 -19 6 -21 q5 -14 24 -14 q19 0 24 14 q19 2 6 21 z" fill="#fff6dc" stroke="#d8c9a4" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="18" y="20" width="64" height="19" rx="5.4" fill="#fff6dc" stroke="#d8c9a4" stroke-width="2.2"/>
       <path d="M32 6 q-2 9 1 15 M50 -2 q-1 10 0 22 M68 6 q2 9 -1 15" stroke="#d8c9a4" stroke-width="1.6" fill="none" opacity=".7"/>
       <path d="M23 29.6 h54" stroke="#d8c9a4" stroke-width="2"/>
       <circle cx="50" cy="30" r="2.8" fill="#8ed14d" stroke="#568e1d" stroke-width="1"/>`,
      `<path d="M20 21 q-13 -19 6 -21 q5 -14 24 -14 q19 0 24 14 q19 2 6 21 z" fill="#fffdf4" stroke="#cdc2a5" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="18" y="20" width="64" height="19" rx="5.4" fill="#fffdf4" stroke="#cdc2a5" stroke-width="2.2"/>
       <path d="M32 6 q-2 9 1 15 M50 -2 q-1 10 0 22 M68 6 q2 9 -1 15" stroke="#cdc2a5" stroke-width="1.6" fill="none" opacity=".7"/>
       <path d="M23 29.6 h54" stroke="#cdc2a5" stroke-width="2"/>
       <circle cx="50" cy="30" r="2.8" fill="#8ed14d" stroke="#568e1d" stroke-width="1"/>`,
      `<path d="M20 21 q-13 -19 6 -21 q5 -14 24 -14 q19 0 24 14 q19 2 6 21 z" fill="#fffbec" stroke="#c6b898" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="18" y="20" width="64" height="19" rx="5.4" fill="#fffbec" stroke="#c6b898" stroke-width="2.2"/>
       <path d="M32 6 q-2 9 1 15 M50 -2 q-1 10 0 22 M68 6 q2 9 -1 15" stroke="#c6b898" stroke-width="1.6" fill="none" opacity=".7"/>
       <path d="M23 29.6 h54" stroke="#c6b898" stroke-width="2"/>
       <circle cx="50" cy="30" r="2.8" fill="#8ed14d" stroke="#568e1d" stroke-width="1"/>`,
      `<path d="M20 21 q-13 -19 6 -21 q5 -14 24 -14 q19 0 24 14 q19 2 6 21 z" fill="#fff6d4" stroke="#bfae86" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="18" y="20" width="64" height="19" rx="5.4" fill="#fff6d4" stroke="#bfae86" stroke-width="2.2"/>
       <path d="M32 6 q-2 9 1 15 M50 -2 q-1 10 0 22 M68 6 q2 9 -1 15" stroke="#bfae86" stroke-width="1.6" fill="none" opacity=".7"/>
       <path d="M23 29.6 h54" stroke="#bfae86" stroke-width="2"/>
       <circle cx="50" cy="30" r="2.8" fill="#8ed14d" stroke="#568e1d" stroke-width="1"/>`,
      `<path d="M20 21 q-13 -19 6 -21 q5 -14 24 -14 q19 0 24 14 q19 2 6 21 z" fill="#ffefc2" stroke="#b39c6c" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="18" y="20" width="64" height="19" rx="5.4" fill="#ffefc2" stroke="#b39c6c" stroke-width="2.2"/>
       <path d="M32 6 q-2 9 1 15 M50 -2 q-1 10 0 22 M68 6 q2 9 -1 15" stroke="#b39c6c" stroke-width="1.6" fill="none" opacity=".7"/>
       <path d="M23 29.6 h54" stroke="#b39c6c" stroke-width="2"/>
       <circle cx="50" cy="30" r="2.8" fill="#f0c95e" stroke="#a8812c" stroke-width="1"/>`
    ],
    /* King: circlet, pointed band, five-point crown, crowned velvet cap, full crown. */
    king: [
      `<path d="M27 32 Q50 26 73 32 L73 37.5 Q50 31 27 37.5 Z" fill="#e0b64a" stroke="#a8812c" stroke-width="1.8"/>
       <circle cx="50" cy="29.6" r="2.6" fill="#c4453a" stroke="#8f2f27" stroke-width="1"/>`,
      `<path d="M27 34 L27 20 L36 27 L50 18 L64 27 L73 20 L73 34 Z" fill="#e6bd55" stroke="#a8812c" stroke-width="2" stroke-linejoin="round"/>
       <rect x="25" y="31" width="50" height="7" rx="3.5" fill="#d9ab3f" stroke="#a8812c" stroke-width="1.6"/>`,
      `<path d="M26 33 L26 14 L36 22 L43 10 L50 21 L57 10 L64 22 L74 14 L74 33 Z" fill="#f0c95e" stroke="#a8812c" stroke-width="2.2" stroke-linejoin="round"/>
       <rect x="24" y="30" width="52" height="8" rx="4" fill="#e0b64a" stroke="#a8812c" stroke-width="1.8"/>
       <circle cx="50" cy="16" r="2.6" fill="#c4453a"/><circle cx="36" cy="26" r="1.8" fill="#3aa5e0"/><circle cx="64" cy="26" r="1.8" fill="#3aa5e0"/>`,
      `<path d="M25 33 L25 12 L36 21 L43 7 L50 19 L57 7 L64 21 L75 12 L75 33 Z" fill="#f2cd66" stroke="#a8812c" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M31 13 q19 -8 38 0 l0 -5 q-19 -8 -38 0 z" fill="#7b4bc4" opacity=".9"/>
       <rect x="23" y="29.5" width="54" height="8.6" rx="4.3" fill="#e0b64a" stroke="#a8812c" stroke-width="1.8"/>
       <circle cx="50" cy="14" r="2.8" fill="#c4453a"/><circle cx="37" cy="24" r="1.9" fill="#3aa5e0"/><circle cx="63" cy="24" r="1.9" fill="#3aa5e0"/>`,
      `<path d="M24 33 L24 10 L36 20 L43 5 L50 17 L57 5 L64 20 L76 10 L76 33 Z" fill="#f5d271" stroke="#9a7a22" stroke-width="2.2" stroke-linejoin="round"/>
       <path d="M30 11 q20 -9 40 0 l0 -5 q-20 -9 -40 0 z" fill="#6b3fae" opacity=".95"/>
       <rect x="22" y="29" width="56" height="9.4" rx="4.7" fill="#f4efe2" stroke="#c9bfa4" stroke-width="1.8"/>
       <circle cx="31" cy="33.8" r="1.3" fill="#3b3630"/><circle cx="40" cy="32" r="1.3" fill="#3b3630"/>
       <circle cx="60" cy="32" r="1.3" fill="#3b3630"/><circle cx="69" cy="33.8" r="1.3" fill="#3b3630"/>
       <circle cx="50" cy="12" r="3" fill="#c4453a" stroke="#8f2f27" stroke-width="1"/>
       <circle cx="36" cy="22" r="2" fill="#3aa5e0"/><circle cx="64" cy="22" r="2" fill="#3aa5e0"/>`
    ],
    /* Engineer: bandana, soft cap, hard hat, hard hat with lamp, full rig. */
    sapper: [
      `<path d="M25 32 Q50 23 75 32 L75 38 Q50 29 25 38 Z" fill="#e79a35" stroke="#a5641a" stroke-width="2"/>
       <path d="M72 34 q8 3 6 9 q-6 0 -8 -6 z" fill="#d3832a" stroke="#a5641a" stroke-width="1.6"/>`,
      `<path d="M26 34 Q26 14 50 14 Q74 14 74 34 Z" fill="#4d5a63" stroke="#31404a" stroke-width="2.4"/>
       <path d="M23 33 Q50 27 77 33 L79 38 Q50 33 21 38 Z" fill="#3f4a52" stroke="#31404a" stroke-width="1.8" stroke-linejoin="round"/>`,
      `<path d="M21 37 Q23 12 50 12 Q77 12 79 37 Z" fill="#f7c948" stroke="#b98a16" stroke-width="2.6"/>
       <path d="M50 13 L50 37" stroke="#dfae24" stroke-width="1.8" opacity=".5"/>
       <rect x="14" y="31.5" width="72" height="9" rx="4.5" fill="#ffd964" stroke="#b98a16" stroke-width="2.2"/>`,
      `<path d="M21 37 Q23 12 50 12 Q77 12 79 37 Z" fill="#f7c948" stroke="#b98a16" stroke-width="2.6"/>
       <rect x="14" y="31.5" width="72" height="9" rx="4.5" fill="#ffd964" stroke="#b98a16" stroke-width="2.2"/>
       <rect x="40" y="16" width="20" height="12" rx="4" fill="#4d5a63" stroke="#31404a" stroke-width="1.8"/>
       <circle cx="50" cy="22" r="3.8" fill="#ffe9a8" stroke="#b98a16" stroke-width="1.4"/>`,
      `<path d="M21 37 Q23 12 50 12 Q77 12 79 37 Z" fill="#f7c948" stroke="#b98a16" stroke-width="2.6"/>
       <rect x="14" y="31.5" width="72" height="9" rx="4.5" fill="#ffd964" stroke="#b98a16" stroke-width="2.2"/>
       <rect x="40" y="14" width="20" height="10" rx="3.6" fill="#4d5a63" stroke="#31404a" stroke-width="1.8"/>
       <circle cx="50" cy="19" r="3.2" fill="#ffe9a8" stroke="#b98a16" stroke-width="1.3"/>
       <rect x="27" y="22" width="46" height="10" rx="5" fill="#3f4a52" stroke="#26333b" stroke-width="1.8"/>
       <circle cx="39" cy="27" r="3.6" fill="#a5d8e8" stroke="#26333b" stroke-width="1.2"/>
       <circle cx="61" cy="27" r="3.6" fill="#a5d8e8" stroke="#26333b" stroke-width="1.2"/>`
    ],
    /* Ranger: headband, leather cap, hood, hood with scarf, fur-trimmed hood. */
    scout: [
      `<path d="M25 32 Q50 24 75 32 L75 38 Q50 30 25 38 Z" fill="#4f7040" stroke="#2f4a26" stroke-width="2"/>
       <path d="M70 30 q10 -9 16 -4 q-8 5 -13 9 z" fill="#c9a227" stroke="#8a6a12" stroke-width="1.4"/>`,
      `<path d="M25 34 Q26 14 50 14 Q74 14 75 34 Z" fill="#6d5133" stroke="#46301d" stroke-width="2.4"/>
       <path d="M23 33 Q50 27 77 33 L78 37.5 Q50 32 22 37.5 Z" fill="#5c4329" stroke="#46301d" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M66 22 q12 -12 20 -7 q-7 6 -14 12 z" fill="#c9a227" stroke="#8a6a12" stroke-width="1.4"/>`,
      `<path d="M22 38 Q23 11 50 11 Q77 11 78 38 Q63 28 50 30 Q37 28 22 38 Z" fill="#3f5f3a" stroke="#2a4226" stroke-width="2.6" stroke-linejoin="round"/>
       <path d="M22 38 Q34 31 50 33 Q66 31 78 38 L74.5 42.6 Q62 35.4 50 37.4 Q38 35.4 25.5 42.6 Z" fill="#507546" stroke="#2a4226" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="50" cy="30.6" r="2.6" fill="#c9a227" stroke="#8a6a12" stroke-width="1"/>`,
      `<path d="M22 38 Q23 11 50 11 Q77 11 78 38 Q63 28 50 30 Q37 28 22 38 Z" fill="#3f5f3a" stroke="#2a4226" stroke-width="2.6" stroke-linejoin="round"/>
       <path d="M22 38 Q34 31 50 33 Q66 31 78 38 L76 44 Q62 38 50 40 Q38 38 24 44 Z" fill="#507546" stroke="#2a4226" stroke-width="2" stroke-linejoin="round"/>
       <path d="M70 16 Q86 8 93 23 Q81 21 73 26 Z" fill="#c9a227" stroke="#8a6a12" stroke-width="1.8"/>
       <circle cx="50" cy="31" r="2.8" fill="#c9a227" stroke="#8a6a12" stroke-width="1"/>`,
      `<path d="M22 38 Q23 11 50 11 Q77 11 78 38 Q63 28 50 30 Q37 28 22 38 Z" fill="#33502f" stroke="#22381d" stroke-width="2.6" stroke-linejoin="round"/>
       <path d="M22 38 Q34 31 50 33 Q66 31 78 38 L76 45 Q62 39 50 41 Q38 39 24 45 Z" fill="#d9d3c2" stroke="#b3ac99" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M66 18 Q84 6 94 18 Q82 19 72 26 Z" fill="#c9a227" stroke="#8a6a12" stroke-width="1.8"/>
       <path d="M62 22 Q78 14 86 24 Q76 25 68 30 Z" fill="#e0a94a" stroke="#8a6a12" stroke-width="1.6"/>
       <circle cx="50" cy="31" r="3" fill="#c9a227" stroke="#8a6a12" stroke-width="1"/>`
    ],
    /* Mage: every rung wears the same big hat; only the cloth changes. */
    wizard: [
      `<path d="M50 0 L20 38 L80 38 Z" fill="#6e4cbb" stroke="#4a3180" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 0 L20 38 L50 38 Z" fill="#8f6ad6" opacity=".35"/>
       <path d="M0 37 Q50 23 100 37 Q50 45 0 37 Z" fill="#5d3c9f" stroke="#4a3180" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="30" width="18" height="8.4" rx="2.6" fill="none" stroke="#ffd76b" stroke-width="2.2"/>`,
      `<path d="M50 0 L20 38 L80 38 Z" fill="#5c3399" stroke="#3a1f67" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 0 L20 38 L50 38 Z" fill="#7b4bc4" opacity=".35"/>
       <path d="M0 37 Q50 23 100 37 Q50 45 0 37 Z" fill="#4a2a80" stroke="#3a1f67" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="30" width="18" height="8.4" rx="2.6" fill="none" stroke="#ffd76b" stroke-width="2.2"/>
       <circle cx="50" cy="33" r="2.2" fill="#ffd76b" stroke="#b98a16" stroke-width="1"/>`,
      `<path d="M50 0 L20 38 L80 38 Z" fill="#4f2b88" stroke="#33205c" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 0 L20 38 L50 38 Z" fill="#6f45b8" opacity=".35"/>
       <path d="M0 37 Q50 23 100 37 Q50 45 0 37 Z" fill="#412472" stroke="#33205c" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="30" width="18" height="8.4" rx="2.6" fill="none" stroke="#ffd76b" stroke-width="2.2"/>
       <path d="M50 16 l1.5 3.2 l3.2 .9 l-3.2 1.5 l-1.5 3.2 l-1.5 -3.2 l-3.2 -1.5 l3.2 -.9 z" fill="#ffd76b"/>`,
      `<path d="M50 0 L20 38 L80 38 Z" fill="#43236f" stroke="#2a1549" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 0 L20 38 L50 38 Z" fill="#5f3aa3" opacity=".35"/>
       <path d="M0 37 Q50 23 100 37 Q50 45 0 37 Z" fill="#351a5c" stroke="#2a1549" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="30" width="18" height="8.4" rx="2.6" fill="none" stroke="#ffd76b" stroke-width="2.2"/>
       <path d="M50 13 l1.6 3.4 l3.4 .9 l-3.4 1.6 l-1.6 3.4 l-1.6 -3.4 l-3.4 -1.6 l3.4 -.9 z" fill="#ffd76b"/><path d="M60 26 l1.1 2.4 l2.4 .6 l-2.4 1.1 l-1.1 2.4 l-1.1 -2.4 l-2.4 -1.1 l2.4 -.6 z" fill="#ffd76b"/>`,
      `<path d="M50 0 L20 38 L80 38 Z" fill="#35205c" stroke="#1f0f38" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M50 0 L20 38 L50 38 Z" fill="#523090" opacity=".35"/>
       <path d="M0 37 Q50 23 100 37 Q50 45 0 37 Z" fill="#2a1246" stroke="#1f0f38" stroke-width="2.4" stroke-linejoin="round"/>
       <rect x="41" y="30" width="18" height="8.4" rx="2.6" fill="none" stroke="#ffd76b" stroke-width="2.2"/>
       <path d="M18 30 q32 9 64 0" stroke="#ffd76b" stroke-width="2.6" fill="none"/>
       <path d="M50 12 a4.6 4.6 0 1 0 0.1 0 z" fill="#ffd76b" opacity=".95"/>
       <path d="M35 25 l1.3 2.8 l2.8 .75 l-2.8 1.3 l-1.3 2.8 l-1.3 -2.8 l-2.8 -1.3 l2.8 -.75 z" fill="#ffd76b"/>
       <path d="M64 26 l1.1 2.4 l2.4 .6 l-2.4 1.1 l-1.1 2.4 l-1.1 -2.4 l-2.4 -1.1 l2.4 -.6 z" fill="#ffd76b"/>`
    ],
    /* Recruit: plain cloth cap, same trade, no rank. */
    minion: [
      `<path d="M28 33 Q50 26 72 33 L72 38 Q50 31 28 38 Z" fill="#8a9a6a" stroke="#5f6b48" stroke-width="2"/>`,
      `<path d="M28 33 Q50 26 72 33 L72 38 Q50 31 28 38 Z" fill="#8a9a6a" stroke="#5f6b48" stroke-width="2"/>`,
      `<path d="M28 33 Q50 26 72 33 L72 38 Q50 31 28 38 Z" fill="#8a9a6a" stroke="#5f6b48" stroke-width="2"/>`,
      `<path d="M28 33 Q50 26 72 33 L72 38 Q50 31 28 38 Z" fill="#8a9a6a" stroke="#5f6b48" stroke-width="2"/>`,
      `<path d="M28 33 Q50 26 72 33 L72 38 Q50 31 28 38 Z" fill="#8a9a6a" stroke="#5f6b48" stroke-width="2"/>`
    ],
  };

  /* The relic only says which rung of the ladder this pig stands on. */
  function relicHat(relic, id) {
    const ladder = PIG_HATS[id] || PIG_HATS.minion;
    const tier = Math.max(1, Math.min(ladder.length, relic.tier || 1));
    return ladder[tier - 1];
  }

  /* ---------------- Clothing ----------------
     One wardrobe, six pigs. Each job gets its own silhouette, seams and kit, so
     the squad reads apart even before the hats go on: a riveted breastplate, a
     chef's jacket and neckerchief, a fur-trimmed royal cape, a hi-vis work vest
     with pockets, a ranger's cloak and quiver, and a starry robe with a sash.
     A relic recolours the pig's own garment instead of handing everyone the
     same tinted shirt. */
  const PIG_WEAR = {
    corporal: { main: '#c9d3de', dark: '#7c8794', light: '#eef3f8', trim: '#6b4a2f' },
    chef:     { main: '#fffdf4', dark: '#cdc2a5', light: '#ffffff', trim: '#c4453a' },
    king:     { main: '#6b3fae', dark: '#40246e', light: '#a978e6', trim: '#f7c948' },
    sapper:   { main: '#e79a35', dark: '#a5641a', light: '#ffc76e', trim: '#3f4a52' },
    scout:    { main: '#4f7040', dark: '#2f4a26', light: '#86ad6c', trim: '#c9a227' },
    wizard:   { main: '#5c3399', dark: '#3a1f67', light: '#9a63e0', trim: '#ffd76b' },
    minion:   { main: '#8a9a6a', dark: '#5f6b48', light: '#b9c79a', trim: '#6b4a2f' },
  };

  const classWear = {
    /* Riveted steel breastplate, angular pauldrons and one leather war strap. */
    corporal(c) {
      return `
        <path d="M28 58 Q50 72 72 58 L72 96 L28 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2"/>
        <path d="M2 96 C4 76 13 64 28 57 L35 77 C26 82 15 89 9 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M98 96 C96 76 87 64 72 57 L65 77 C74 82 85 89 91 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M6 92 C9 79 16 68 27 61" stroke="${c.light}" stroke-width="2.6" fill="none" opacity=".7" stroke-linecap="round"/>
        <path d="M94 92 C91 79 84 68 73 61" stroke="${c.light}" stroke-width="2.6" fill="none" opacity=".7" stroke-linecap="round"/>
        <path d="M24 58 Q50 69 76 58" stroke="${c.dark}" stroke-width="2.2" fill="none" opacity=".85"/>
        <path d="M30 96 L66 84" stroke="${c.trim}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="18" cy="85" r="2.5" fill="${c.light}" stroke="${c.dark}" stroke-width="1"/>
        <circle cx="82" cy="85" r="2.5" fill="${c.light}" stroke="${c.dark}" stroke-width="1"/>
      `;
    },
    /* White double-breasted jacket, red neckerchief and a row of buttons. */
    chef(c) {
      return `
        <path d="M28 58 Q50 72 72 58 L72 96 L28 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2"/>
        <path d="M2 96 C5 77 14 65 29 58 L36 79 C27 84 16 90 10 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M98 96 C95 77 86 65 71 58 L64 79 C73 84 84 90 90 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M34 82 Q50 91 66 82 L74 90 Q50 101 26 90 Z" fill="${c.trim}" stroke="${c.dark}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M44 90 l6 10 l7 -10 z" fill="${c.trim}"/>
        <circle cx="50" cy="90" r="1.8" fill="${c.dark}"/>
        <circle cx="50" cy="96" r="1.8" fill="${c.dark}"/>
        <path d="M12 92 q38 10 76 0" stroke="${c.dark}" stroke-width="2.2" fill="none" opacity=".55"/>
      `;
    },
    /* Spreading ermine cape, gold chain and a big medallion. */
    king(c) {
      return `
        <path d="M0 98 C4 75 16 61 33 54 L40 70 C24 78 11 88 5 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M100 98 C96 75 84 61 67 54 L60 70 C76 78 89 88 95 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M0 98 C4 75 16 61 33 54 L36 61 C22 69 11 80 6 98 Z" fill="#f4efe2" stroke="#cfc6b0" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M100 98 C96 75 84 61 67 54 L64 61 C78 69 89 80 94 98 Z" fill="#f4efe2" stroke="#cfc6b0" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="11" cy="87" r="1.4" fill="#3b3630"/>
        <circle cx="19" cy="77" r="1.4" fill="#3b3630"/>
        <circle cx="28" cy="68" r="1.3" fill="#3b3630"/>
        <circle cx="89" cy="87" r="1.4" fill="#3b3630"/>
        <circle cx="81" cy="77" r="1.4" fill="#3b3630"/>
        <circle cx="72" cy="68" r="1.3" fill="#3b3630"/>
        <path d="M16 96 q34 12 68 0" stroke="${c.trim}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="99" r="5.4" fill="${c.trim}" stroke="#b98a16" stroke-width="1.6"/>
      `;
    },
    /* Hi-vis work vest: reflector stripes, chest pockets and a tool belt. */
    sapper(c) {
      return `
        <path d="M28 58 Q50 72 72 58 L72 96 L28 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2"/>
        <path d="M2 96 C5 76 14 64 29 57 L36 78 C27 83 16 89 10 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M98 96 C95 76 86 64 71 57 L64 78 C73 83 84 89 90 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M9 94 C12 82 19 72 30 66" stroke="${c.light}" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M91 94 C88 82 81 72 70 66" stroke="${c.light}" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".9"/>
        <rect x="12" y="79" width="14" height="12" rx="2.4" fill="${c.dark}" stroke="${c.trim}" stroke-width="1.8"/>
        <rect x="74" y="79" width="14" height="12" rx="2.4" fill="${c.dark}" stroke="${c.trim}" stroke-width="1.8"/>
        <path d="M8 95 q42 10 84 0" stroke="${c.trim}" stroke-width="5" fill="none"/>
        <rect x="45" y="93" width="10" height="8" rx="1.6" fill="${c.trim}"/>
      `;
    },
    /* Ranger's cloak with a brass clasp and a quiver of arrows on the shoulder. */
    scout(c) {
      return `
        <path d="M0 98 C6 78 16 64 30 57 L36 74 C24 82 12 90 6 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M100 98 C94 78 84 64 70 57 L64 74 C76 82 88 90 94 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <g transform="rotate(20 78 74)">
          <rect x="72" y="58" width="12" height="30" rx="4" fill="#7a4b2a" stroke="#4d2f19" stroke-width="1.8"/>
          <path d="M75 58 l0 -8 M79 58 l0 -10 M83 58 l0 -7" stroke="#d9c08a" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M74 66 h8" stroke="#4d2f19" stroke-width="1.6"/>
        </g>
        <circle cx="31" cy="63" r="3.2" fill="${c.trim}" stroke="#8a6a12" stroke-width="1.2"/>
        <path d="M5 96 C9 82 17 71 28 64" stroke="${c.light}" stroke-width="2.2" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M30 96 L70 84" stroke="${c.trim}" stroke-width="3" opacity=".8"/>
      `;
    },
    /* Starry robe: standing collar, a sash with a tail and two star pins. */
    wizard(c) {
      return `
        <path d="M0 98 C6 76 18 62 33 55 L40 72 C24 80 11 88 5 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M100 98 C94 76 82 62 67 55 L60 72 C76 80 89 88 95 98 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M30 58 q20 12 40 0 l7 12 q-27 16 -54 0 z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 94 q42 12 84 0" stroke="${c.trim}" stroke-width="4.6" fill="none"/>
        <path d="M60 96 l6 9 l-5 2 l-6 -9 z" fill="${c.trim}"/>
        <path d="M18 76 l1.7 3.5 l3.5 1 l-3.5 1.7 l-1.7 3.5 l-1.7 -3.5 l-3.5 -1.7 l3.5 -1 z" fill="${c.trim}"/>
        <path d="M82 72 l1.4 3 l3 0.8 l-3 1.4 l-1.4 3 l-1.4 -3 l-3 -1.4 l3 -0.8 z" fill="${c.trim}"/>
      `;
    },
    /* Fresh recruit: a plain sack-cloth tunic with one rope belt. */
    minion(c) {
      return `
        <path d="M28 58 Q50 72 72 58 L72 96 L28 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2"/>
        <path d="M2 96 C5 77 14 65 29 58 L36 78 C27 83 16 90 10 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M98 96 C95 77 86 65 71 58 L64 78 C73 83 84 90 90 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M12 90 q38 10 76 0" stroke="${c.trim}" stroke-width="3.6" fill="none"/>
      `;
    },
  };

  /* A promotion changes the cut of the same uniform — a stitched seam, then
     shoulder boards, then brass, then a medal — while the pig keeps its working
     colours. The relic is rank, not paint. */
  function relicWear(relic, id) {
    const c = PIG_WEAR[id] || PIG_WEAR.minion;
    const tier = Math.max(1, Math.min(5, relic.tier || 1));
    const brass = '#d9b45a';
    const brassDark = '#9a8448';

    /* Low relics are barely kitted out: a plain vest and a ragged collar. The
       full working uniform arrives at the third rung, rank details after it. */
    if (tier <= 2) {
      const collar = tier >= 2
        ? `<path d="M30 60 Q50 74 70 60" stroke="${c.dark}" stroke-width="3" fill="none" opacity=".8"/>
           <path d="M34 63 L34 88 M66 63 L66 88" stroke="${c.dark}" stroke-width="1.4" opacity=".35"/>`
        : '';
      return `<g pointer-events="none">
        <path d="M26 59 Q50 69 74 59 L77 96 L23 96 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M50 62 L43 75 L50 96 L57 75 Z" fill="${c.dark}" opacity=".16"/>
        ${collar}
      </g>`;
    }

    const seam = `<path d="M10 92 q40 10 80 0" stroke="${c.dark}" stroke-width="2" fill="none" opacity=".6"/>`;
    const boards = tier >= 4
      ? `<path d="M8 86 q9 -4 15 2 q-6 5 -15 3 z" fill="${c.light}" stroke="${c.dark}" stroke-width="1.4" stroke-linejoin="round"/>
         <path d="M92 86 q-9 -4 -15 2 q6 5 15 3 z" fill="${c.light}" stroke="${c.dark}" stroke-width="1.4" stroke-linejoin="round"/>`
      : '';
    const medal = tier >= 5
      ? `<path d="M30 86 l5 9" stroke="#c4453a" stroke-width="3.2"/>
         <circle cx="36" cy="95" r="3.4" fill="${brass}" stroke="${brassDark}" stroke-width="1.2"/>`
      : '';
    return `<g pointer-events="none">${(classWear[id] || classWear.minion)(c)}${seam}${boards}${medal}</g>`;
  }

  /* ---------------- Birds ---------------- */

  function birdBase(body, dark, belly) {
    return `
      <path d="M80 62 q16 -4 17 4 q-9 2 -17 8" fill="${dark}"/>
      <path d="M80 70 q13 2 14 9 q-9 -2 -16 -2" fill="${dark}" opacity=".8"/>
      <ellipse cx="54" cy="57" rx="31" ry="30" fill="${body}" stroke="${dark}" stroke-width="2.6"/>
      <ellipse cx="47" cy="69" rx="17" ry="14" fill="${belly}" stroke="${dark}" stroke-width="1.8" opacity=".96"/>
      <path d="M23 55 L5 61 L23 69 Z" fill="#f7a13a" stroke="#c67a1e" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M23 62 L6 61" stroke="#c67a1e" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="42" cy="45" rx="8" ry="9" fill="#fffef8" stroke="${dark}" stroke-width="1.6"/>
      <ellipse cx="59" cy="43" rx="7.4" ry="8.4" fill="#fffef8" stroke="${dark}" stroke-width="1.6"/>
      <circle cx="43" cy="46" r="3.5" fill="#1d232b"/>
      <circle cx="60" cy="44" r="3.2" fill="#1d232b"/>
      <circle cx="42" cy="44.5" r="1.1" fill="#fff"/>
      <circle cx="59" cy="42.5" r="1" fill="#fff"/>
      <ellipse cx="64" cy="68" rx="14" ry="9" fill="${dark}" opacity=".45" transform="rotate(-12 64 68)"/>
    `;
  }

  const brows = (color = '#2b241c', w = 3.4) => `
    <path d="M30 33 L45 39" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
    <path d="M70 30 L56 38" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
  `;

  const enemyParts = {
    red() {
      return `${birdBase('#d94436', '#9d2a20', '#f6ead2')}
        <path d="M46 27 q-7 -15 1 -14 q7 1 7 12" fill="#8f241b"/>
        <path d="M54 26 q4 -12 9 -10 q4 2 -2 12" fill="#8f241b"/>
        ${brows()}
      `;
    },
    chuck() {
      return `${birdBase('#f5c81c', '#c39a0d', '#fff3c4')}
        <path d="M47 27 L53 3 L60 27 Z" fill="#ffe066" stroke="#c39a0d" stroke-width="2.2" stroke-linejoin="round"/>
        ${brows()}
      `;
    },
    blue() {
      return `
        <path d="M86 66 q14 -3 15 4 q-8 2 -15 7" fill="#2b7fa8"/>
        <ellipse cx="57" cy="61" rx="27" ry="26" fill="#46a9e0" stroke="#2b7fa8" stroke-width="2.6"/>
        <ellipse cx="51" cy="71" rx="15" ry="12" fill="#dff2ff" stroke="#2b7fa8" stroke-width="1.8" opacity=".96"/>
        <path d="M30 59 L13 64 L30 71 Z" fill="#f7a13a" stroke="#c67a1e" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M30 65 L14 64" stroke="#c67a1e" stroke-width="2"/>
        <path d="M46 36 L43 23 L51 31" fill="#2b7fa8"/>
        <path d="M53 34 L55 20 L59 32" fill="#2b7fa8"/>
        <path d="M60 36 L66 25 L65 38" fill="#2b7fa8"/>
        <ellipse cx="47" cy="50" rx="7" ry="8" fill="#fffef8" stroke="#2b7fa8" stroke-width="1.6"/>
        <ellipse cx="62" cy="48" rx="6.6" ry="7.6" fill="#fffef8" stroke="#2b7fa8" stroke-width="1.6"/>
        <circle cx="48" cy="51" r="3.1" fill="#1d232b"/>
        <circle cx="63" cy="49" r="2.9" fill="#1d232b"/>
        <path d="M38 39 L49 43" stroke="#1f2b33" stroke-width="3" stroke-linecap="round"/>
        <path d="M71 37 L60 42" stroke="#1f2b33" stroke-width="3" stroke-linecap="round"/>
      `;
    },
    bomb() {
      return `${birdBase('#383b42', '#1b1d21', '#8b909a')}
        <path d="M55 28 q1 -13 11 -18" stroke="#9c8a63" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="68" cy="9" r="5" fill="#ff9d2e"/>
        <circle cx="68" cy="9" r="2.4" fill="#fff6c2"/>
        ${brows('#ddd6c4', 3.6)}
      `;
    },
    matilda() {
      return `${birdBase('#f4eee1', '#c4b9a2', '#fffdf7')}
        <path d="M40 27 q-2 -14 8 -14 q8 0 6 12" fill="#fffdf7" stroke="#c4b9a2" stroke-width="2.2"/>
        <path d="M56 27 q8 -10 12 -4 q3 4 -6 10" fill="#fffdf7" stroke="#c4b9a2" stroke-width="2.2"/>
        <circle cx="33" cy="56" r="5" fill="#f5b3b3" opacity=".65"/>
        <circle cx="62" cy="55" r="4.4" fill="#f5b3b3" opacity=".6"/>
        <path d="M35 35 L44 38" stroke="#a89a80" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M66 33 L57 37" stroke="#a89a80" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M35 42 l-4 -4 M47 40 l-2 -5" stroke="#a89a80" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    hal() {
      return `${birdBase('#5cbb4c', '#3a8a2f', '#dcf3c6')}
        <path d="M23 55 L2 59 L23 67 Z" fill="#f7a13a" stroke="#c67a1e" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M34 24 q-8 -12 0 -13 q7 -1 9 11" fill="#3a8a2f"/>
        ${brows()}
      `;
    },
    terence() {
      const uid = 'terence' + (++birdSeq);
      return `
        <defs>
          <radialGradient id="${uid}-body" cx="34%" cy="18%" r="92%">
            <stop offset="0" stop-color="#d94b3c"/>
            <stop offset=".42" stop-color="#ad2d26"/>
            <stop offset=".8" stop-color="#7c1715"/>
            <stop offset="1" stop-color="#49090a"/>
          </radialGradient>
          <linearGradient id="${uid}-belly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f5e8cf"/>
            <stop offset=".55" stop-color="#dcc5a1"/>
            <stop offset="1" stop-color="#b6926a"/>
          </linearGradient>
          <linearGradient id="${uid}-beak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffe98b"/>
            <stop offset=".5" stop-color="#f4b52f"/>
            <stop offset="1" stop-color="#a85f08"/>
          </linearGradient>
          <radialGradient id="${uid}-eye" cx="35%" cy="28%" r="78%">
            <stop offset="0" stop-color="#fff8c9"/>
            <stop offset=".5" stop-color="#f5b52c"/>
            <stop offset="1" stop-color="#a65b08"/>
          </radialGradient>
          <radialGradient id="${uid}-shade" cx="30%" cy="18%" r="90%">
            <stop offset="0" stop-color="#fff" stop-opacity=".24"/>
            <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
            <stop offset=".75" stop-color="#000" stop-opacity=".12"/>
            <stop offset="1" stop-color="#000" stop-opacity=".44"/>
          </radialGradient>
          <clipPath id="${uid}-clip"><ellipse cx="55" cy="58" rx="38" ry="35"/></clipPath>
        </defs>
        <ellipse cx="54" cy="96" rx="35" ry="4.5" fill="#000" opacity=".2"/>
        <g stroke="#3f0909" stroke-width="2" stroke-linejoin="round">
          <path d="M84 48 C93 41 100 42 100 49 C96 52 92 56 89 61 Z" fill="#5e0d0d"/>
          <path d="M86 59 C95 55 101 59 99 68 C94 67 90 70 86 75 Z" fill="#7d1815"/>
          <path d="M84 71 C93 71 99 76 97 84 C91 81 86 83 80 87 Z" fill="#4a0909"/>
          <path d="M85 51 L97 48 M87 64 L97 65 M85 77 L94 81" fill="none" opacity=".45"/>
        </g>
        <g stroke="#4a0a0a" stroke-width="2.2" stroke-linejoin="round">
          <path d="M63 34 C74 25 88 27 95 38 C98 45 97 57 92 66 C86 59 82 51 76 46 C71 42 66 39 63 34 Z" fill="#7c1715"/>
          <path d="M66 34 C74 29 84 31 89 37 C84 40 78 44 73 48 C70 43 68 38 66 34 Z" fill="#a92b26"/>
          <path d="M80 42 C87 39 94 44 96 51 C90 53 85 57 81 62 C80 55 80 48 80 42 Z" fill="#8f1e19"/>
          <path d="M88 56 C93 55 97 60 97 67 C93 69 90 73 87 78 C86 70 87 63 88 56 Z" fill="#5e0d0d"/>
          <path d="M70 33 C77 38 82 45 86 52 M82 38 C88 43 91 49 93 56" fill="none" opacity=".5"/>
        </g>
        <ellipse cx="55" cy="58" rx="38" ry="35" fill="url(#${uid}-body)" stroke="#4a0a0a" stroke-width="3"/>
        <ellipse cx="55" cy="58" rx="38" ry="35" fill="url(#${uid}-shade)" clip-path="url(#${uid}-clip)"/>
        <path d="M30 53 C34 69 40 85 55 91 C70 86 78 70 81 52 C72 45 62 42 54 42 C46 42 37 46 30 53 Z" fill="url(#${uid}-belly)" stroke="#6b4a2a" stroke-width="2"/>
        <g stroke="#a9875b" stroke-width="1.8" fill="none" opacity=".7">
          <path d="M35 61 q10 7 20 0"/>
          <path d="M33 70 q11 7 22 0"/>
          <path d="M35 79 q10 7 20 0"/>
          <path d="M41 87 q7 5 14 0"/>
        </g>
        <path d="M62 54 L70 77" stroke="#8f6d47" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
        <path d="M64 61 l6 2 M66 68 l6 2 M68 75 l5 1" stroke="#8f6d47" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
        <path d="M28 44 C22 42 15 45 9 50 C13 57 21 60 29 57 Z" fill="url(#${uid}-beak)" stroke="#8a5206" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M9 50 C14 55 21 57 28 55" stroke="#8a5206" stroke-width="1.8" fill="none"/>
        <path d="M20 45 l2 4" stroke="#8a5206" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="22.5" cy="47.5" r="1" fill="#8a5206"/>
        <path d="M13 47 l5 -2" stroke="#ffe9a0" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
        <ellipse cx="40" cy="42" rx="7.1" ry="7.9" fill="#fff9e8" stroke="#5e0d0d" stroke-width="1.8"/>
        <circle cx="40.5" cy="43" r="4.3" fill="url(#${uid}-eye)"/>
        <circle cx="40.2" cy="43.2" r="2.2" fill="#210a06"/>
        <circle cx="39.4" cy="41.9" r=".9" fill="#fff"/>
        <ellipse cx="59" cy="41" rx="6.6" ry="7.4" fill="#fff9e8" stroke="#5e0d0d" stroke-width="1.8"/>
        <circle cx="59.2" cy="41.8" r="3.9" fill="url(#${uid}-eye)"/>
        <circle cx="59" cy="42" r="2" fill="#210a06"/>
        <circle cx="58.2" cy="40.9" r=".85" fill="#fff"/>
        <path d="M26 31 L46 39" stroke="#3b0808" stroke-width="5.6" stroke-linecap="round"/>
        <path d="M70 28 L54 38" stroke="#3b0808" stroke-width="5.2" stroke-linecap="round"/>
        <path d="M52 22 L50 31" stroke="#5e0d0d" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
        <path d="M42 28 C39 22 39 16 43 11 L47 19 L51 9 L54 18 L59 8 L61 18 L67 14 L65 28 Z" fill="#6f1211" stroke="#4a0a0a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M45 18 L47 24 M55 15 L56 23 M62 20 L62 25" stroke="#d96850" stroke-width="1.4" fill="none" opacity=".35"/>
        <path d="M66 38 L77 54" stroke="#efd1b5" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        <path d="M68 45 l5 -2 M71 50 l5 -2" stroke="#efd1b5" stroke-width="1.4" stroke-linecap="round" opacity=".65"/>
        <path d="M70 52 C82 48 93 53 97 63 C99 73 93 84 83 89 C87 79 85 69 79 62 C76 58 73 55 70 52 Z" fill="#6f1211" stroke="#3f0909" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M77 58 C84 63 87 73 83 82" stroke="#3f0909" stroke-width="1.6" fill="none" opacity=".6"/>
        <path d="M85 57 C91 63 92 72 89 79" stroke="#3f0909" stroke-width="1.6" fill="none" opacity=".5"/>
        <path d="M92 64 C95 70 94 77 92 82" stroke="#3f0909" stroke-width="1.4" fill="none" opacity=".45"/>
        <g stroke="#a86a10" stroke-width="2.2" stroke-linecap="round" fill="none">
          <path d="M43 90 L39 96 M43 90 L44 98 M43 90 L49 96"/>
          <path d="M65 90 L61 96 M65 90 L66 98 M65 90 L71 96"/>
        </g>
        <g fill="#2a1607">
          <path d="M39 96 l-2 3 l4 -1 Z"/><path d="M44 98 l0 2 l3 -2 Z"/><path d="M49 96 l3 2 l-3 1 Z"/>
          <path d="M61 96 l-3 2 l3 1 Z"/><path d="M66 98 l0 2 l3 -2 Z"/><path d="M71 96 l3 2 l-3 1 Z"/>
        </g>
      `;
    },
    eagle() {
      const uid = 'eagle' + (++birdSeq);
      return `
        <defs>
          <radialGradient id="${uid}-body" cx="34%" cy="20%" r="86%">
            <stop offset="0" stop-color="#d09658"/>
            <stop offset=".46" stop-color="#9a5a2e"/>
            <stop offset="1" stop-color="#42210e"/>
          </radialGradient>
          <linearGradient id="${uid}-wingL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#d29a5e"/>
            <stop offset=".46" stop-color="#875027"/>
            <stop offset="1" stop-color="#361b0b"/>
          </linearGradient>
          <linearGradient id="${uid}-wingR" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b77b44"/>
            <stop offset=".5" stop-color="#6c3c1e"/>
            <stop offset="1" stop-color="#2c1609"/>
          </linearGradient>
          <linearGradient id="${uid}-belly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff8df"/>
            <stop offset=".6" stop-color="#efd4a8"/>
            <stop offset="1" stop-color="#b98a58"/>
          </linearGradient>
          <linearGradient id="${uid}-head" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fffef8"/>
            <stop offset=".58" stop-color="#f3e9d5"/>
            <stop offset="1" stop-color="#c8b28e"/>
          </linearGradient>
          <linearGradient id="${uid}-beak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffeb8a"/>
            <stop offset=".5" stop-color="#f0b52c"/>
            <stop offset="1" stop-color="#a56408"/>
          </linearGradient>
          <radialGradient id="${uid}-eye" cx="32%" cy="28%" r="76%">
            <stop offset="0" stop-color="#fff9c9"/>
            <stop offset=".48" stop-color="#ffd05a"/>
            <stop offset="1" stop-color="#cf830c"/>
          </radialGradient>
          <radialGradient id="${uid}-shade" cx="33%" cy="22%" r="80%">
            <stop offset="0" stop-color="#fff" stop-opacity=".24"/>
            <stop offset=".52" stop-color="#fff" stop-opacity="0"/>
            <stop offset=".82" stop-color="#000" stop-opacity=".12"/>
            <stop offset="1" stop-color="#000" stop-opacity=".4"/>
          </radialGradient>
          <clipPath id="${uid}-bodyClip"><ellipse cx="51" cy="59" rx="29" ry="30"/></clipPath>
          <clipPath id="${uid}-bellyClip"><path d="M33 62 C34 74 42 87 52 88 C63 87 70 75 69 61 C63 55 57 53 51 53 C45 53 38 56 33 62 Z"/></clipPath>
        </defs>
        <g stroke="#37200f" stroke-width="1.9" stroke-linejoin="round">
          <path d="M70 64 C80 57 91 54 99 57 C95 66 87 73 77 78 Z" fill="#895027"/>
          <path d="M72 70 C84 67 95 70 99 77 C90 84 80 86 70 83 Z" fill="#5c3217"/>
          <path d="M70 78 C80 83 87 89 88 95 C78 94 70 89 65 82 Z" fill="#361b0b"/>
          <path d="M74 63 L95 58 M75 71 L97 74 M72 83 L86 92" fill="none" opacity=".45"/>
        </g>
        <path d="M38 45 C25 34 12 20 2 6 C1 22 5 39 14 51 C22 61 31 65 41 63 Z" fill="url(#${uid}-wingL)" stroke="#37200f" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M34 43 C23 33 12 20 3 7" stroke="#e1ae70" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M31 50 C21 42 11 32 4 20" stroke="#4a2812" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M27 57 C18 51 10 43 5 32" stroke="#b47a45" stroke-width="1.8" fill="none" opacity=".45"/>
        <path d="M23 62 C16 58 9 53 5 46" stroke="#4a2812" stroke-width="1.8" fill="none" opacity=".4"/>
        <path d="M2 6 C-1 13 0 21 4 27 C4 18 8 12 13 10 Z" fill="#e4bc85" opacity=".42"/>
        <path d="M4 27 C3 35 7 43 13 49 C11 41 13 33 17 28 Z" fill="#c68d55" opacity=".35"/>
        <path d="M13 49 C14 55 19 61 26 64 C23 58 24 52 27 48 Z" fill="#3b1f0d" opacity=".35"/>
        <path d="M63 45 C76 34 89 20 99 6 C100 22 96 39 88 51 C80 61 71 65 61 63 Z" fill="url(#${uid}-wingR)" stroke="#37200f" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M67 43 C78 33 89 20 98 7" stroke="#d19a5e" stroke-width="2" fill="none" opacity=".5"/>
        <path d="M70 50 C80 42 90 32 97 20" stroke="#44230e" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M74 57 C83 51 91 43 96 32" stroke="#c58b52" stroke-width="1.8" fill="none" opacity=".4"/>
        <path d="M78 62 C85 58 92 53 96 46" stroke="#44230e" stroke-width="1.8" fill="none" opacity=".4"/>
        <path d="M98 6 C101 13 100 21 96 27 C96 18 92 12 87 10 Z" fill="#e1b77f" opacity=".36"/>
        <path d="M96 27 C97 35 93 43 87 49 C89 41 87 33 83 28 Z" fill="#b77b44" opacity=".3"/>
        <path d="M87 49 C86 55 81 61 74 64 C77 58 76 52 73 48 Z" fill="#2c1609" opacity=".35"/>
        <ellipse cx="51" cy="59" rx="29" ry="30" fill="url(#${uid}-body)" stroke="#35200f" stroke-width="2.4"/>
        <ellipse cx="54" cy="60" rx="28" ry="29" fill="url(#${uid}-shade)" clip-path="url(#${uid}-bodyClip)"/>
        <path d="M33 62 C34 74 42 87 52 88 C63 87 70 75 69 61 C63 55 57 53 51 53 C45 53 38 56 33 62 Z" fill="url(#${uid}-belly)" stroke="#6f4728" stroke-width="1.6"/>
        <g fill="none" stroke="#c39a66" stroke-width="1.4" opacity=".85" clip-path="url(#${uid}-bellyClip)">
          <path d="M38 65 q7 7 14 0"/>
          <path d="M35 73 q8 7 16 0"/>
          <path d="M38 81 q7 7 14 0"/>
          <path d="M33 60 q10 8 20 0"/>
        </g>
        <path d="M63 48 C69 55 71 65 67 76" stroke="#3f2412" stroke-width="2" fill="none" opacity=".35"/>
        <path d="M35 48 C29 53 27 60 29 68" stroke="#ffe0ad" stroke-width="2" fill="none" opacity=".3"/>
        <g fill="none" stroke="#d9a528" stroke-width="2.6" stroke-linecap="round">
          <path d="M41 84 L37 92 M41 84 L42 94 M41 84 L47 92"/>
          <path d="M59 84 L56 92 M59 84 L60 94 M59 84 L65 92"/>
        </g>
        <g fill="#2c1a0c">
          <path d="M37 92 l-2 4 l4 -2 Z"/>
          <path d="M42 94 l0 4 l3 -4 Z"/>
          <path d="M47 92 l4 3 l-4 1 Z"/>
          <path d="M56 92 l-3 4 l4 -2 Z"/>
          <path d="M60 94 l0 4 l3 -4 Z"/>
          <path d="M65 92 l4 3 l-4 1 Z"/>
        </g>
        <ellipse cx="46" cy="33" rx="19" ry="17.5" fill="url(#${uid}-head)" stroke="#a58d68" stroke-width="1.8"/>
        <path d="M58 45 C64 41 67 34 67 27 C70 38 64 48 52 51 Z" fill="#c9b28d" opacity=".55"/>
        <path d="M42 17 C42 8 48 3 55 7 C50 12 50 18 54 23 C49 20 45 18 42 17 Z" fill="#fffdf4" stroke="#b09a76" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M54 14 C60 7 68 8 72 15 C65 16 61 20 58 25 Z" fill="#f3e7d3" stroke="#b09a76" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M64 22 C71 17 79 20 80 27 C73 26 69 29 66 33 Z" fill="#dfcdb1" stroke="#a58d68" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M29 38 C22 37 14 40 8 45 C14 48 21 49 28 48 C25 45 25 42 29 38 Z" fill="url(#${uid}-beak)" stroke="#8a5706" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8 45 C10 52 16 54 23 51 C18 48 13 46 8 45 Z" fill="#b96e08"/>
        <path d="M9 46 C13 49 18 50 22 49" stroke="#8a5206" stroke-width="1.2" fill="none" opacity=".8"/>
        <path d="M27 45 L13 45" stroke="#a46608" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="37" cy="35" rx="7.2" ry="7.8" fill="#fffdf2" stroke="#8d7658" stroke-width="1.5"/>
        <circle cx="37" cy="35.5" r="4.7" fill="url(#${uid}-eye)"/>
        <circle cx="36.7" cy="35.7" r="2.25" fill="#1b1208"/>
        <circle cx="35.8" cy="34.7" r=".9" fill="#fff"/>
        <ellipse cx="53" cy="34" rx="6.5" ry="7" fill="#fffdf2" stroke="#8d7658" stroke-width="1.5"/>
        <circle cx="53" cy="34.4" r="4.2" fill="url(#${uid}-eye)"/>
        <circle cx="52.8" cy="34.5" r="2" fill="#1b1208"/>
        <circle cx="52" cy="33.7" r=".8" fill="#fff"/>
        <path d="M27 27 L44 31" stroke="#5b3a1e" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M64 26 L54 30" stroke="#5b3a1e" stroke-width="4" stroke-linecap="round"/>
        <path d="M30 42 L43 45" stroke="#7f5a36" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
        <path d="M66 46 C72 51 73 61 69 71" stroke="#e2a766" stroke-width="1.8" fill="none" opacity=".45"/>
      `;
    },
    bubbles() {
      return `${birdBase('#f08fb6', '#b95e85', '#ffe3ef')}
        <path d="M44 28 q-7 -13 1 -13 q7 0 7 11" fill="#d9739c"/>
        <path d="M54 27 q5 -11 10 -9 q4 2 -3 11" fill="#d9739c"/>
        <circle cx="33" cy="56" r="5" fill="#f9b8cf" opacity=".8"/>
        <circle cx="62" cy="55" r="4.4" fill="#f9b8cf" opacity=".7"/>
        ${brows('#7a3550', 3.2)}
      `;
    },
    stella() {
      return `${birdBase('#e874a8', '#a83d70', '#ffe0ee')}
        <path d="M37 24 q-10 -8 -6 -14 q9 -1 12 7 z" fill="#9b5ad1" stroke="#6d3a9c" stroke-width="2"/>
        <path d="M52 20 q6 -12 12 -10 q5 4 -2 14 z" fill="#9b5ad1" stroke="#6d3a9c" stroke-width="2"/>
        <circle cx="52" cy="22" r="4.2" fill="#c48ce8" stroke="#6d3a9c" stroke-width="1.8"/>
        <path d="M30 33 L45 39" stroke="#7a2b52" stroke-width="3" stroke-linecap="round"/>
        <path d="M70 31 L57 38" stroke="#7a2b52" stroke-width="3" stroke-linecap="round"/>
        <path d="M36 45 l-3 -4 M47 43 l-2 -4" stroke="#7a2b52" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    mother() {
      const uid = 'mother' + (++birdSeq);
      return `
        <defs>
          <radialGradient id="${uid}-body" cx="36%" cy="20%" r="88%">
            <stop offset="0" stop-color="#fff9e9"/>
            <stop offset=".5" stop-color="#e2cfb0"/>
            <stop offset="1" stop-color="#8d775d"/>
          </radialGradient>
          <linearGradient id="${uid}-wingL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a08a72"/>
            <stop offset=".5" stop-color="#5b493d"/>
            <stop offset="1" stop-color="#241b17"/>
          </linearGradient>
          <linearGradient id="${uid}-wingR" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#8b7562"/>
            <stop offset=".52" stop-color="#4b3a30"/>
            <stop offset="1" stop-color="#1e1612"/>
          </linearGradient>
          <linearGradient id="${uid}-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fffef8"/>
            <stop offset=".6" stop-color="#f4e6cd"/>
            <stop offset="1" stop-color="#cbb490"/>
          </linearGradient>
          <linearGradient id="${uid}-beak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffe788"/>
            <stop offset=".5" stop-color="#dead36"/>
            <stop offset="1" stop-color="#85520c"/>
          </linearGradient>
          <radialGradient id="${uid}-eye" cx="35%" cy="28%" r="78%">
            <stop offset="0" stop-color="#fff6c7"/>
            <stop offset=".42" stop-color="#ffc94b"/>
            <stop offset="1" stop-color="#c47009"/>
          </radialGradient>
          <radialGradient id="${uid}-shade" cx="32%" cy="20%" r="82%">
            <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
            <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
            <stop offset=".82" stop-color="#000" stop-opacity=".12"/>
            <stop offset="1" stop-color="#000" stop-opacity=".38"/>
          </radialGradient>
          <clipPath id="${uid}-bodyClip"><ellipse cx="51" cy="60" rx="30" ry="31"/></clipPath>
        </defs>
        <g stroke="#2b211c" stroke-width="1.9" stroke-linejoin="round">
          <path d="M72 68 C84 62 95 65 99 72 C94 80 85 86 74 88 Z" fill="#675244"/>
          <path d="M74 76 C86 76 96 81 98 88 C89 93 80 92 71 88 Z" fill="#44332a"/>
          <path d="M72 84 C82 87 89 92 90 97 C80 97 72 93 66 88 Z" fill="#2a1e19"/>
          <path d="M76 70 L96 73 M76 79 L97 84 M73 87 L87 94" fill="none" opacity=".45"/>
        </g>
        <path d="M39 47 C25 43 12 51 6 66 C1 79 6 91 17 93 C28 94 36 84 40 71 Z" fill="url(#${uid}-wingL)" stroke="#2b211c" stroke-width="2.2"/>
        <path d="M13 55 C20 61 26 70 31 81" stroke="#d6bea0" stroke-width="2" fill="none" opacity=".42"/>
        <path d="M9 64 C17 69 23 77 27 87" stroke="#a68b70" stroke-width="2" fill="none" opacity=".38"/>
        <path d="M17 91 C12 86 9 79 10 71 C6 77 5 85 9 91 Z" fill="#d6bea0" opacity=".32"/>
        <path d="M8 79 C10 86 15 91 22 93 C18 87 17 81 18 75 Z" fill="#e5d1b2" opacity=".24"/>
        <path d="M17 87 C21 91 27 93 33 92 C28 88 25 84 24 80 Z" fill="#bda385" opacity=".22"/>
        <path d="M63 47 C77 43 90 51 96 65 C101 78 96 91 85 93 C74 94 66 84 62 71 Z" fill="url(#${uid}-wingR)" stroke="#2b211c" stroke-width="2.2"/>
        <path d="M84 55 C78 62 73 70 69 81" stroke="#d6bea0" stroke-width="2" fill="none" opacity=".4"/>
        <path d="M89 65 C82 70 77 78 73 88" stroke="#a68b70" stroke-width="2" fill="none" opacity=".36"/>
        <path d="M82 91 C88 85 91 79 90 71 C94 77 95 85 91 91 Z" fill="#d6bea0" opacity=".3"/>
        <path d="M92 79 C90 86 85 91 78 93 C82 87 83 81 82 75 Z" fill="#e5d1b2" opacity=".22"/>
        <path d="M83 87 C79 91 73 93 67 92 C72 88 75 84 76 80 Z" fill="#bda385" opacity=".2"/>
        <ellipse cx="51" cy="60" rx="30" ry="31" fill="url(#${uid}-body)" stroke="#5f4d3e" stroke-width="2.4"/>
        <ellipse cx="54" cy="61" rx="29" ry="30" fill="url(#${uid}-shade)" clip-path="url(#${uid}-bodyClip)"/>
        <path d="M33 58 C36 72 43 86 52 88 C63 87 69 75 69 58 C63 53 57 51 51 51 C45 51 39 53 33 58 Z" fill="#fff6e2" opacity=".55"/>
        <g fill="none" stroke="#bfa886" stroke-width="1.5" opacity=".8">
          <path d="M38 64 q8 8 16 0"/>
          <path d="M35 73 q9 8 18 0"/>
          <path d="M39 82 q7 7 14 0"/>
          <path d="M31 58 q10 9 20 0"/>
        </g>
        <g fill="none" stroke="#d3a447" stroke-width="2.5" stroke-linecap="round">
          <path d="M41 87 L37 94 M41 87 L42 96 M41 87 L47 94"/>
          <path d="M59 87 L56 94 M59 87 L60 96 M59 87 L65 94"/>
        </g>
        <g fill="#2b1e13">
          <path d="M37 94 l-2 4 l4 -2 Z"/>
          <path d="M42 96 l0 3 l3 -4 Z"/>
          <path d="M47 94 l4 3 l-4 1 Z"/>
          <path d="M56 94 l-3 4 l4 -2 Z"/>
          <path d="M60 96 l0 3 l3 -4 Z"/>
          <path d="M65 94 l4 3 l-4 1 Z"/>
        </g>
        <path d="M34 24 C27 15 27 7 35 3 C38 11 41 17 45 21 Z" fill="#4e3b2f" stroke="#2b211c" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M59 21 C62 12 68 6 74 8 C70 15 68 21 67 27 Z" fill="#4e3b2f" stroke="#2b211c" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M37 13 C38 8 40 5 42 6" stroke="#c7a98a" stroke-width="1.6" fill="none" opacity=".55"/>
        <path d="M69 13 C71 14 72 17 71 20" stroke="#c7a98a" stroke-width="1.6" fill="none" opacity=".55"/>
        <ellipse cx="46" cy="34" rx="20" ry="18" fill="url(#${uid}-face)" stroke="#a88f6f" stroke-width="1.8"/>
        <path d="M27 34 C28 23 36 18 46 19 C57 19 66 25 66 36 C64 43 58 48 50 50 C40 49 30 43 27 34 Z" fill="url(#${uid}-face)" opacity=".7"/>
        <path d="M58 46 C64 41 67 34 67 27 C70 38 64 48 52 51 Z" fill="#c4ac89" opacity=".5"/>
        <path d="M34 27 C40 22 50 22 55 27 C49 29 43 33 39 38 C37 35 36 31 34 27 Z" fill="#fffdf5" opacity=".55"/>
        <path d="M29 41 C23 41 18 44 18 48 C21 52 27 51 31 47 C27 46 26 44 29 41 Z" fill="url(#${uid}-beak)" stroke="#81500b" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M18 48 C21 51 25 51 29 49 C26 47 22 47 18 48 Z" fill="#b97a10" opacity=".8"/>
        <ellipse cx="38" cy="33" rx="7.8" ry="8.8" fill="#fff9e9" stroke="#8d7558" stroke-width="1.5"/>
        <circle cx="38" cy="34" r="5.4" fill="url(#${uid}-eye)"/>
        <circle cx="37.7" cy="34" r="2.6" fill="#1a1108"/>
        <circle cx="36.7" cy="32.9" r="1" fill="#fff"/>
        <ellipse cx="55" cy="32" rx="6.9" ry="7.7" fill="#fff9e9" stroke="#8d7558" stroke-width="1.5"/>
        <circle cx="55" cy="32.8" r="4.6" fill="url(#${uid}-eye)"/>
        <circle cx="54.8" cy="32.9" r="2.2" fill="#1a1108"/>
        <circle cx="54" cy="32" r=".9" fill="#fff"/>
        <path d="M28 25 L44 29" stroke="#5d4533" stroke-width="4.6" stroke-linecap="round"/>
        <path d="M64 24 L56 28" stroke="#5d4533" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M33 42 q5 -3 10 0" stroke="#a88f6f" stroke-width="1.4" fill="none" opacity=".7"/>
        <path d="M49 43 q5 -3 10 0" stroke="#a88f6f" stroke-width="1.4" fill="none" opacity=".55"/>
        <path d="M30 50 C38 57 49 58 58 53" stroke="#7b5a3b" stroke-width="1.6" fill="none" opacity=".5"/>
        <path d="M67 42 C73 47 75 57 71 68" stroke="#d9b184" stroke-width="1.8" fill="none" opacity=".4"/>
      `;
    },
  };

  /* The crafted weapon is drawn in the right hoof, in front of the pig, so a
     quick glance at the squad shows who is carrying which blueprint weapon. */
  function craftedWeaponFigure(weaponId) {
    if (!weaponId || typeof DATA === 'undefined' || !DATA.craftedWeaponById) return '';
    const weapon = DATA.craftedWeaponById(weaponId);
    if (!weapon) return '';
    const shapes = {
      stun: `<path d="M0 2 L0 -22" stroke="#8a5a2c" stroke-width="4.4" stroke-linecap="round"/>
        <rect x="-8" y="-33" width="16" height="13" rx="3" fill="#c4ced8" stroke="#5b6874" stroke-width="2"/>
        <path d="M-5 -30 L5 -30" stroke="#f4f8fc" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 -26 l5 3 l-7 3" fill="none" stroke="#ffd45e" stroke-width="2.4" stroke-linecap="round"/>`,
      cleanse: `<path d="M0 2 L0 -20" stroke="#8a5a2c" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M-7 -20 L7 -20 L10 -34 L-10 -34 Z" fill="#9fe8ff" stroke="#4d93aa" stroke-width="2"/>
        <path d="M-6 -34 L-8 -42 M-2 -34 L-2 -43 M2 -34 L3 -42 M6 -34 L8 -40" stroke="#d8fbff" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="-39" r="2" fill="#fff"/><circle cx="-9" cy="-38" r="1.4" fill="#fff"/>`,
      chain: `<path d="M0 2 L0 -12" stroke="#6d4a26" stroke-width="4" stroke-linecap="round"/>
        <circle cx="0" cy="-18" r="4" fill="none" stroke="#aeb6c4" stroke-width="2.2"/>
        <circle cx="4" cy="-25" r="4" fill="none" stroke="#aeb6c4" stroke-width="2.2"/>
        <circle cx="8" cy="-32" r="7" fill="#6f7280" stroke="#34363f" stroke-width="2"/>
        <path d="M8 -39 L10 -44 M15 -32 L20 -32 M1 -32 L-4 -32" stroke="#e0b0ff" stroke-width="2" stroke-linecap="round"/>`,
      crit: `<path d="M0 2 L0 -18" stroke="#7b4a24" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M-2 -18 L12 -27 L18 -17 L3 -10 Z" fill="#e8eef4" stroke="#5b6874" stroke-width="2" stroke-linejoin="round"/>
        <path d="M10 -24 L14 -19" stroke="#ff9a6a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M-1 -4 L1 -2" stroke="#ffd45e" stroke-width="2" stroke-linecap="round"/>`,
      hammer: `<path d="M0 2 L0 -24" stroke="#8a5a2c" stroke-width="4.6" stroke-linecap="round"/>
        <rect x="-9" y="-35" width="18" height="13" rx="3" fill="#c4ced8" stroke="#5b6874" stroke-width="2"/>
        <path d="M-5 -31 L5 -31" stroke="#f4f8fc" stroke-width="2" stroke-linecap="round"/>`,
      pan: `<path d="M0 2 L0 -10" stroke="#5b3d22" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M0 -10 L-6 -25" stroke="#5b3d22" stroke-width="4.4" stroke-linecap="round"/>
        <circle cx="-11" cy="-31" r="11" fill="#4a4a52" stroke="#2e2e36" stroke-width="2"/>
        <circle cx="-11" cy="-31" r="7" fill="#6a6a74"/>`,
      scepter: `<path d="M0 2 L0 -30" stroke="#c99a5b" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M-7 -20 L7 -20 M-5 -25 L5 -25" stroke="#ffd36b" stroke-width="2" stroke-linecap="round"/>
        <circle cx="0" cy="-36" r="6" fill="#ffd36b" stroke="#9b6a18" stroke-width="2"/>`,
      wrench: `<path d="M0 2 L0 -18" stroke="#7d8a99" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M-8 -18 L8 -18 L8 -27 L3 -27 L3 -32 L-3 -32 L-3 -27 L-8 -27 Z" fill="#a9b6c4" stroke="#4f5f6d" stroke-width="2" stroke-linejoin="round"/>`,
      rod: `<path d="M0 2 L0 -30" stroke="#7b4a8a" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M0 -30 L-8 -39 L0 -48 L8 -39 Z" fill="#c3a6ff" stroke="#6f4c9a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M0 -35 L0 -44" stroke="#f3e9ff" stroke-width="2" stroke-linecap="round"/>`,
      maul: `<path d="M0 2 L0 -22" stroke="#8a5a2c" stroke-width="5.2" stroke-linecap="round"/>
        <rect x="-13" y="-40" width="26" height="20" rx="4" fill="#aeb9c6" stroke="#4a3218" stroke-width="2.6"/>
        <path d="M-7 -34 H7 M-7 -27 H7" stroke="#fff" stroke-width="2" opacity=".45"/>`,
      mace: `<path d="M0 2 L0 -18" stroke="#6d4a26" stroke-width="4.8" stroke-linecap="round"/>
        <circle cx="0" cy="-27" r="12" fill="#aeb6c4" stroke="#4a3218" stroke-width="2.6"/>
        <path d="M0 -44 V-40 M0 -14 V-10 M-17 -27 H-13 M13 -27 H17 M-11 -38 L-8 -35 M8 -19 L11 -16 M11 -38 L8 -35 M-8 -19 L-11 -16" stroke="#4a3218" stroke-width="2.2"/>`,
      axe: `<path d="M0 2 L0 -30" stroke="#8a5a2c" stroke-width="4.8" stroke-linecap="round"/>
        <path d="M2 -34 C15 -34 24 -26 25 -18 C15 -20 7 -15 2 -8 L-2 -20 Z" fill="var(--weapon, #ff9a6a)" stroke="#4a3218" stroke-width="2.4"/>
        <path d="M7 -30 C15 -28 20 -24 22 -20" stroke="#fff" stroke-width="2" opacity=".4"/>`,
      blade: `<path d="M0 2 L0 -20" stroke="#8a5a2c" stroke-width="4.6" stroke-linecap="round"/>
        <path d="M0 -20 L7 -26 L5 -43 L0 -50 L-5 -43 L-7 -26 Z" fill="#e8eef4" stroke="#4a3218" stroke-width="2.2"/>
        <path d="M-12 -22 H12" stroke="#c99a5b" stroke-width="4" stroke-linecap="round"/>
        <path d="M0 -28 V-44" stroke="var(--weapon, #ffd45e)" stroke-width="2" opacity=".8"/>`,
      cleaver: `<path d="M0 2 L0 -14" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/>
        <path d="M-12 -15 H13 V-39 L0 -49 L-12 -39 Z" fill="#dce5ed" stroke="#4a3218" stroke-width="2.4"/>
        <path d="M-6 -21 V-36" stroke="var(--weapon, #ff9a6a)" stroke-width="3" opacity=".9"/>
        <circle cx="5" cy="-25" r="2" fill="#4a3218"/>`,
      pick: `<path d="M0 2 L0 -34" stroke="#8a5a2c" stroke-width="4.8" stroke-linecap="round"/>
        <path d="M-18 -34 C-10 -52 10 -52 18 -34" fill="none" stroke="#aeb6c4" stroke-width="5" stroke-linecap="round"/>
        <path d="M-18 -34 L-22 -26 M18 -34 L22 -26" stroke="#4a3218" stroke-width="2.4" stroke-linecap="round"/>`,
      sling: `<path d="M0 2 V-10 M0 -10 L-9 -30 M0 -10 L9 -30" fill="none" stroke="#8a5a2c" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M-9 -30 C-2 -19 2 -19 9 -30" fill="none" stroke="#d9b38c" stroke-width="2.4"/>
        <circle cx="0" cy="-19" r="3.4" fill="var(--weapon, #8fc95a)" stroke="#4a3218" stroke-width="1.6"/>`,
      wand: `<path d="M0 2 L0 -22" stroke="#7b4a8a" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M0 -23 L4 -32 L14 -35 L5 -39 L0 -49 L-5 -39 L-14 -35 L-4 -32 Z" fill="var(--weapon, #c3a6ff)" stroke="#4a3218" stroke-width="2"/>
        <circle cx="0" cy="-35" r="2.5" fill="#fff" opacity=".7"/>`,
      orb: `<path d="M0 2 L0 -18" stroke="#8a5a2c" stroke-width="4.8" stroke-linecap="round"/>
        <circle cx="0" cy="-31" r="12" fill="var(--weapon, #9fe8ff)" stroke="#4a3218" stroke-width="2.6"/>
        <circle cx="-4" cy="-35" r="3" fill="#fff" opacity=".6"/>
        <path d="M-11 -31 H11 M0 -42 V-20" stroke="#4a3218" stroke-width="1.4" opacity=".35"/>`,
    };
    const shapeName = weapon.shape || weapon.proc;
    const shape = shapes[shapeName];
    if (!shape) return '';
    return `<g class="held-weapon shape-${shapeName}" transform="translate(80 76) rotate(-24)" style="--weapon:${weapon.colour}">${shape}</g>`;
  }

  function craftedShieldFigure(shieldId) {
    if (!shieldId || typeof DATA === 'undefined' || !DATA.craftedShieldById) return '';
    const shield = DATA.craftedShieldById(shieldId);
    if (!shield) return '';
    const shapes = {
      round: `<path d="M0 -20 L14 -15 V4 C14 13 8 19 0 23 C-8 19 -14 13 -14 4 V-15 Z" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.2"/><path d="M0 -15 L9 -12 V4 C9 10 5 15 0 18 Z" fill="#fff" opacity=".22"/><path d="M0 -10 L0 13 M-7 -1 L7 -1" stroke="#4a3218" stroke-width="1.6" opacity=".65"/>`,
      tower: `<path d="M-13 -22 H13 V8 L0 23 L-13 8 Z" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M0 -18 V18 M-8 -14 H8 M-8 -5 H8" stroke="#4a3218" stroke-width="1.6" opacity=".55"/><path d="M-9 -22 V-17 H-3 V-22 M3 -22 V-17 H9 V-22" fill="none" stroke="#4a3218" stroke-width="1.6"/>`,
      aegis: `<path d="M0 -21 L15 -15 V4 C15 14 8 20 0 24 C-8 20 -15 14 -15 4 V-15 Z" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M-10 -9 L-5 -16 L0 -11 L5 -16 L10 -9" fill="none" stroke="#4a3218" stroke-width="2"/><circle cx="0" cy="4" r="5" fill="none" stroke="#4a3218" stroke-width="1.8" opacity=".65"/>`,
      tray: `<rect x="-14" y="-18" width="28" height="30" rx="4" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M-18 -13 H-14 M14 -13 H18 M-18 6 H-14 M14 6 H18" stroke="#4a3218" stroke-width="2.2" stroke-linecap="round"/><path d="M-8 -10 H8 M-8 -3 H8" stroke="#4a3218" stroke-width="1.6" opacity=".5"/>`,
      lid: `<ellipse cx="0" cy="2" rx="18" ry="17" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><circle cx="0" cy="-18" r="4" fill="${shield.colour}" stroke="#4a3218" stroke-width="2"/><path d="M-11 3 H11 M-8 -4 C-4 -8 4 -8 8 -4" fill="none" stroke="#4a3218" stroke-width="1.6" opacity=".55"/>`,
      rivet: `<path d="M-13 -22 H13 V10 L0 23 L-13 10 Z" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><circle cx="-7" cy="-15" r="1.8" fill="#4a3218"/><circle cx="7" cy="-15" r="1.8" fill="#4a3218"/><circle cx="-7" cy="4" r="1.8" fill="#4a3218"/><circle cx="7" cy="4" r="1.8" fill="#4a3218"/><path d="M0 -12 V10" stroke="#4a3218" stroke-width="1.5" opacity=".5"/>`,
      rune: `<path d="M0 -23 L14 -12 V12 L0 23 L-14 12 V-12 Z" fill="${shield.colour}" stroke="#4a3218" stroke-width="2.4"/><path d="M0 -14 V14 M-7 -5 H7 M-5 5 L0 10 L5 5" fill="none" stroke="#4a3218" stroke-width="1.8"/><circle cx="0" cy="-5" r="1.8" fill="#fff" opacity=".55"/>`,
    };
    const shapeName = shield.shape || 'round';
    return `<g class="held-shield shape-${shapeName}" transform="translate(20 78) rotate(18)" style="--shield:${shield.colour}">${shapes[shapeName] || shapes.round}</g>`;
  }

  function hero(id, relicId, weaponId, shieldId) {
    const st = PIG_STYLE[id] || PIG_STYLE.minion;
    let relic = null;
    if (relicId && typeof DATA !== 'undefined' && DATA.relicById) relic = DATA.relicById(relicId);
    const worn = relic || { tier: 1 };
    const wear = relicWear(worn, id);
    const hat = relicHat(worn, id);
    const extra = pigExtras[id] ? pigExtras[id]() : '';
    const shield = craftedShieldFigure(shieldId);
    const weapon = craftedWeaponFigure(weaponId);
    return open(wear + pigFace(st.skin, st.shade, st.light, st.brow) + hat + extra + shield + weapon);
  }

  /* One generator, many birds — but not one silhouette. Beyond colour, a bird
     can wear a headpiece, carry a pattern on its body and grow extras (tusks,
     antlers, a studded collar, ice shards, a third eye, even a balloon), so a
     flock reads at a glance instead of nine shades of the same teal. */
  let birdSeq = 0;

  function variantBird(c) {
    const dark = c.dark;
    const accent = c.accent || dark;
    const hatColor = c.hatColor || '#2f3a48';
    const hatDark = c.hatDark || '#1c242e';
    const uid = 'b' + (++birdSeq);
    const shade = c.shade == null ? 1 : c.shade;
    const aura = c.aura
      ? `<circle cx="54" cy="56" r="46" fill="url(#${uid}-aura)"/>`
      : '';
    /* Every bird carries its own light: a highlight across the brow and a
       shadow pooling under the belly. Both are clipped to the body, so a
       pattern, a wing or a hat never picks them up. */
    const defs = `<defs><clipPath id="${uid}-clip"><ellipse cx="54" cy="57" rx="31" ry="30"/></clipPath>${c.aura ? `<radialGradient id="${uid}-aura"><stop offset="0" stop-color="${c.aura}" stop-opacity=".45"/><stop offset=".65" stop-color="${c.aura}" stop-opacity=".16"/><stop offset="1" stop-color="${c.aura}" stop-opacity="0"/></radialGradient>` : ''}<radialGradient id="${uid}-shade" cx="30%" cy="22%" r="88%"><stop offset="0" stop-color="#fff" stop-opacity="${(0.34 * shade).toFixed(2)}"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="${(0.12 * shade).toFixed(2)}"/><stop offset="1" stop-color="#000" stop-opacity="${(0.38 * shade).toFixed(2)}"/></radialGradient></defs>`;
    const shadeArt = `<ellipse cx="54" cy="57" rx="31" ry="30" fill="url(#${uid}-shade)" clip-path="url(#${uid}-clip)"/>`;
    const patternArt = {
      spots: `<circle cx="46" cy="40" r="5" fill="${accent}" opacity=".55"/><circle cx="67" cy="50" r="4.2" fill="${accent}" opacity=".5"/><circle cx="38" cy="63" r="3.4" fill="${accent}" opacity=".45"/><circle cx="73" cy="69" r="3.2" fill="${accent}" opacity=".5"/><circle cx="55" cy="79" r="3.6" fill="${accent}" opacity=".4"/>`,
      stripes: `<path d="M38 28 q-7 28 1 58" stroke="${dark}" stroke-width="8" fill="none" opacity=".35"/><path d="M60 26 q7 30 -1 62" stroke="${dark}" stroke-width="8" fill="none" opacity=".3"/><path d="M79 40 q4 22 0 38" stroke="${dark}" stroke-width="7" fill="none" opacity=".3"/>`,
      chevron: `<path d="M35 39 l13 9 l13 -9" stroke="${accent}" stroke-width="4" fill="none" opacity=".55"/><path d="M35 57 l13 9 l13 -9" stroke="${accent}" stroke-width="4" fill="none" opacity=".45"/><path d="M35 75 l13 9 l13 -9" stroke="${accent}" stroke-width="4" fill="none" opacity=".35"/>`,
      scales: `<g stroke="${accent}" stroke-width="2.6" fill="none" opacity=".5"><path d="M34 40 q7 7 14 0"/><path d="M52 40 q7 7 14 0"/><path d="M43 50 q7 7 14 0"/><path d="M62 50 q7 7 14 0"/><path d="M34 60 q7 7 14 0"/><path d="M52 60 q7 7 14 0"/><path d="M44 70 q7 7 14 0"/></g>`,
      plates: `<path d="M32 36 l16 -8 l5 15 l-16 8 Z" fill="${accent}" opacity=".38"/><path d="M58 28 l16 6 l-2 15 l-16 -5 Z" fill="${accent}" opacity=".3"/><path d="M36 60 l16 -6 l3 14 l-16 7 Z" fill="${accent}" opacity=".3"/><path d="M60 56 l16 5 l-2 14 l-16 -5 Z" fill="${accent}" opacity=".26"/>`,
      fur: `<path d="M30 42 q7 8 0 15 q9 -2 9 9 q6 -7 11 2 q4 -9 10 -2 q2 -11 9 -4 q-2 -11 6 -11 q-9 -4 -5 -13" stroke="${dark}" stroke-width="3" fill="none" opacity=".32"/>`,
    }[c.pattern];
    const pattern = patternArt ? `<g clip-path="url(#${uid}-clip)">${patternArt}</g>` : '';
    const crest = {
      spike: `<path d="M46 27 q-7 -15 1 -14 q7 1 7 12" fill="${dark}"/>`,
      tuft: `<path d="M45 25 q-3 -13 4 -13 q6 0 5 11" fill="${dark}"/><path d="M56 26 q4 -11 9 -9 q3 2 -3 11" fill="${accent}"/>`,
      crest: `<path d="M50 24 q4 -16 13 -13 q-3 7 -1 13" fill="${accent}"/>`,
      horn: `<path d="M52 24 L56 3 L62 24 Z" fill="${accent}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`,
      sail: `<path d="M40 26 q14 -26 30 -8 q-12 2 -16 14 Z" fill="${accent}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`,
      curl: `<path d="M40 27 q-5 -20 11 -20 q13 0 13 13 q0 10 -10 10 q-6 0 -6 -6 q0 -6 6 -6" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
      shard: `<path d="M46 26 L50 1 L56 26 Z" fill="${accent}" stroke="${dark}" stroke-width="1.6"/><path d="M58 26 L64 7 L68 26 Z" fill="${accent}" opacity=".8" stroke="${dark}" stroke-width="1.4"/>`,
      mohawk: `<path d="M40 28 l4 -13 l5 9 l4 -15 l5 13 l4 -9 l3 15 Z" fill="${accent}" stroke="${dark}" stroke-width="1.8" stroke-linejoin="round"/>`,
      leaf: `<path d="M48 26 q-2 -17 8 -21 q10 6 8 21 q-8 6 -16 0 Z" fill="${accent}" stroke="${dark}" stroke-width="1.8"/><path d="M56 7 q2 11 0 19" stroke="${dark}" stroke-width="1.4" fill="none" opacity=".55"/>`,
      none: '',
    }[c.crest || 'spike'];
    const tail = {
      short: `<path d="M24 56 L6 62 L24 70 Z" fill="${dark}"/>`,
      fan: `<path d="M24 55 L2 44 L7 60 L1 74 L24 70 Z" fill="${accent}"/>`,
      fork: `<path d="M24 55 L4 48 L10 60 L2 70 L24 69 Z" fill="${dark}"/>`,
      long: `<path d="M24 58 q-20 2 -24 -6 q14 0 24 4 Z" fill="${accent}"/>`,
      plume: `<path d="M26 54 q-18 -12 -25 -3 q13 3 19 11 Z" fill="${accent}"/><path d="M26 61 q-20 -2 -25 8 q15 -2 25 2 Z" fill="${accent}" opacity=".8"/><path d="M26 68 q-16 6 -19 17 q15 -5 23 -9 Z" fill="${accent}" opacity=".6"/>`,
      sword: `<path d="M26 59 L1 54 L1 66 Z" fill="${dark}"/><path d="M24 61 L3 59" stroke="${accent}" stroke-width="1.8" opacity=".8"/>`,
      puff: `<circle cx="17" cy="58" r="12" fill="${accent}" opacity=".85"/><circle cx="27" cy="65" r="9" fill="${dark}" opacity=".45"/>`,
      tentacle: `<path d="M26 55 q-18 0 -20 11 q12 3 15 13 q-9 6 1 13" stroke="${accent}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>`,
    }[c.tail || 'short'];
    const beak = {
      short: '',
      long: `<path d="M23 56 L-4 61 L23 68 Z" fill="${c.beak}" stroke="${c.beakDark}" stroke-width="2.2" stroke-linejoin="round"/>`,
      hook: `<path d="M24 52 q-16 2 -20 10 q6 8 18 6 Z" fill="${c.beak}" stroke="${c.beakDark}" stroke-width="2.2" stroke-linejoin="round"/>`,
      pouch: `<path d="M24 55 L0 59 q-2 16 16 16 q12 0 8 -14 Z" fill="${c.beak}" stroke="${c.beakDark}" stroke-width="2.2" stroke-linejoin="round"/>`,
    }[c.beakShape || 'short'];
    const wing = `<path d="M60 50 q20 -7 22 10 q-3 16 -22 18 q12 -13 10 -22 Z" fill="${dark}" opacity=".5"/>`;
    const breast = `<path d="M38 74 q12 6 24 0" stroke="${dark}" stroke-width="1.6" fill="none" opacity=".45"/>`;
    const extra = {
      tusks: `<path d="M23 67 q-6 13 3 17 q5 -9 1 -17 Z" fill="#fff8ec" stroke="${dark}" stroke-width="1.4"/><path d="M35 78 q-1 13 8 13 q1 -10 -3 -13 Z" fill="#fff8ec" stroke="${dark}" stroke-width="1.2"/>`,
      antlers: `<path d="M44 26 q-6 -15 -17 -17 q7 7 9 17" stroke="${accent}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M64 26 q6 -15 17 -17 q-7 7 -9 17" stroke="${accent}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M39 15 l-6 -8 M69 15 l6 -8" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`,
      collar: `<path d="M27 83 Q54 97 81 83" stroke="#3b2a20" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M36 86 l3 -8 M54 92 l0 -9 M71 86 l-3 -8" stroke="#c9ccd6" stroke-width="3.2" stroke-linecap="round"/>`,
      shards: `<path d="M77 44 l11 -13 l4 15 Z" fill="${accent}" stroke="${dark}" stroke-width="1.4"/><path d="M83 62 l13 -6 l1 13 Z" fill="${accent}" opacity=".85" stroke="${dark}" stroke-width="1.2"/>`,
      thirdEye: `<ellipse cx="54" cy="30" rx="5.6" ry="6.4" fill="${accent}" stroke="${dark}" stroke-width="1.8"/><circle cx="54" cy="30" r="2.4" fill="#1d232b"/><circle cx="54" cy="29" r=".9" fill="#fff"/>`,
      earTufts: `<path d="M33 28 q-9 -13 0 -17 q6 5 6 15 Z" fill="${dark}"/><path d="M71 26 q9 -13 0 -17 q-6 5 -6 15 Z" fill="${dark}"/>`,
      balloon: `<path d="M62 26 q6 -8 12 -9" stroke="${dark}" stroke-width="1.4" fill="none"/><ellipse cx="80" cy="12" rx="7" ry="7.8" fill="${accent}" stroke="${dark}" stroke-width="1.2"/><path d="M77 18 l3 3 l3 -3" fill="none" stroke="${dark}" stroke-width="1.2"/>`,
      none: '',
    }[c.extra || 'none'];
    const hat = {
      helm: `<path d="M33 33 Q33 10 54 10 Q75 10 75 33 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="2.2" stroke-linejoin="round"/><path d="M28 31 q26 -6 52 0 l0 7 q-26 -6 -52 0 Z" fill="${hatDark}"/><path d="M48 33 q6 -5 12 0 q-1 10 -6 10 q-5 0 -6 -10 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="1.6"/><path d="M54 13 L54 31" stroke="${hatDark}" stroke-width="2.4" opacity=".55"/>`,
      crown: `<path d="M30 32 L34 12 L42 24 L50 6 L58 24 L66 12 L70 32 Z" fill="#ffcf5c" stroke="#c99a1e" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="19" r="3" fill="#ff5f7a" stroke="#c99a1e" stroke-width="1"/>`,
      hood: `<path d="M24 40 Q26 6 54 6 Q82 6 84 40 Q68 24 54 24 Q40 24 24 40 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="2.2" stroke-linejoin="round"/>`,
      visor: `<rect x="29" y="35" width="43" height="12" rx="6" fill="#22303c" stroke="${hatColor}" stroke-width="2"/><circle cx="41" cy="41" r="4.2" fill="${hatColor}" opacity=".95"/><circle cx="60" cy="40" r="3.8" fill="${hatColor}" opacity=".95"/>`,
      cap: `<path d="M24 36 Q52 4 80 36 Q52 22 24 36 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="2" stroke-linejoin="round"/><path d="M78 32 q18 1 18 7 q-9 -2 -18 -1 Z" fill="${hatDark}"/>`,
      wizard: `<path d="M50 2 L30 34 Q54 26 74 34 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="2" stroke-linejoin="round"/><path d="M27 33 q23 -8 46 0" stroke="${hatDark}" stroke-width="3" fill="none"/><path d="M52 18 l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1 z" fill="#ffe27a"/>`,
      bow: `<path d="M50 20 q-14 -12 -18 -2 q4 10 18 6 q14 4 18 -6 q-4 -10 -18 2 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="1.8"/><circle cx="50" cy="22" r="4" fill="${hatDark}"/>`,
      plume: `<path d="M46 28 q-4 -22 6 -26 q8 4 6 26 Z" fill="${accent}" stroke="${dark}" stroke-width="1.8"/><path d="M58 27 q2 -14 10 -16 q4 2 -4 16 Z" fill="${accent}" opacity=".8" stroke="${dark}" stroke-width="1.2"/>`,
      beret: `<path d="M30 33 Q34 11 55 10 Q77 9 79 29 Q59 24 30 33 Z" fill="${hatColor}" stroke="${hatDark}" stroke-width="2" stroke-linejoin="round"/><path d="M74 15 q7 -4 9 3 q-5 3 -9 1 Z" fill="${hatDark}"/><path d="M38 26 q16 -8 34 -2" stroke="#ffffff" stroke-width="2" fill="none" opacity=".35"/>`,
      none: '',
    }[c.hat || 'none'];
    const flair = {
      snow: `<path d="M33 32 q15 -10 32 0 q-4 -9 -16 -9 q-12 0 -16 9 Z" fill="#ffffff" opacity=".92"/><path d="M64 20 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1 Z" fill="#eaffff" opacity=".85"/>`,
      ice: `<path d="M30 34 q18 -12 36 0 q-5 -11 -18 -11 q-13 0 -18 11 Z" fill="#dff6ff" opacity=".95"/><path d="M50 16 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z" fill="#ffffff" opacity=".9"/>`,
      bandana: `<path d="M28 30 q26 -10 50 2 l-2 8 q-22 -8 -46 -2 Z" fill="${accent}" opacity=".95"/><path d="M28 32 l-10 7 l12 3 Z" fill="${accent}" opacity=".95"/>`,
      shell: `<path d="M70 80 l8 -12 l8 12 q-8 5 -16 0 Z" fill="${c.beak}" stroke="${c.beakDark}" stroke-width="1.6"/>`,
      flare: `<path d="M28 68 q22 16 48 2" stroke="${accent}" stroke-width="3" fill="none" opacity=".6"/>`,
      /* Mirror Magpie: loose shards of glass across the chest, each with its
         own highlight so the bird reads as "reflective" at card size. */
      glass: `<g opacity=".85"><path d="M34 44 l15 -11 l10 10 l-13 15 Z" fill="#dff6ff" opacity=".5" stroke="${accent}" stroke-width="1.5"/><path d="M40 44 l7 -6" stroke="#ffffff" stroke-width="2" opacity=".9"/><path d="M61 61 l12 -8 l6 10 l-10 9 Z" fill="#effcff" opacity=".42" stroke="${accent}" stroke-width="1.3"/><path d="M65 62 l6 -4" stroke="#ffffff" stroke-width="1.8" opacity=".8"/></g>`,
      none: '',
    }[c.flair || 'none'];
    /* Proportions are per bird as well as colour: some are plump, some lean,
       some tall, and a boss reads as big before a single stat is shown. */
    const buildX = { plump: 1.1, round: 1.05, tall: 0.93, lean: 0.87, egg: 0.99 }[c.build] || 1;
    const buildY = { plump: 0.93, round: 1, tall: 1.1, lean: 1.05, egg: 1.08 }[c.build] || 1;
    const size = c.size || 1;
    return `${aura}${defs}<g transform="translate(54 57) scale(${(size * buildX).toFixed(3)} ${(size * buildY).toFixed(3)}) translate(-54 -57)">
      ${birdBase(c.body, c.dark, c.belly)}
      ${shadeArt}
      ${pattern}
      ${tail}
      ${wing}
      ${breast}
      ${extra}
      ${crest}
      ${beak}
      ${flair}
      ${brows(c.brow || '#2b241c', c.browW || 3.4)}
      ${hat}
    </g>`;
  }

  /* Every bird in the game, one look each — different hues, different hats,
     different backs. */
  const variantBirds = {
    /* --- wind and shore --- */
    sparrow:    { body: '#c07a3f', dark: '#6d3d18', belly: '#ffe0b8', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#8ff0b0', crest: 'tuft', tail: 'short', pattern: 'spots' },
    gull:       { body: '#f7fbff', dark: '#8ea6b8', belly: '#ffffff', beak: '#ffd93b', beakDark: '#c9a01e', accent: '#c9d8e4', crest: 'none', tail: 'fork', beakShape: 'long', flair: 'shell', pattern: 'plates' },
    tern:       { body: '#eef6fb', dark: '#48586a', belly: '#ffffff', beak: '#ff7a3a', beakDark: '#b9501f', accent: '#7fe0ff', crest: 'crest', tail: 'sword', hat: 'cap', hatColor: '#141a20', hatDark: '#080b0f' },
    pelican:    { body: '#fbf1dd', dark: '#9a845c', belly: '#fffdf5', beak: '#ffc44a', beakDark: '#b07f1e', accent: '#3f6fbf', crest: 'tuft', tail: 'fan', beakShape: 'pouch', hat: 'helm', hatColor: '#c9d4e4', hatDark: '#5b6675' },
    heron:      { body: '#b9a8e8', dark: '#5f4f96', belly: '#f0eaff', beak: '#ffd36b', beakDark: '#b8912a', accent: '#ff9fd8', crest: 'sail', tail: 'long', beakShape: 'long', pattern: 'scales' },
    albatross:  { body: '#c3d4e0', dark: '#57697a', belly: '#f4fbff', beak: '#ffc44a', beakDark: '#b07f1e', accent: '#4f7fa8', crest: 'none', tail: 'long', beakShape: 'hook', hat: 'visor', hatColor: '#9fe8ff', pattern: 'chevron' },
    reefcaller: { body: '#ff6fa8', dark: '#a8306a', belly: '#ffe0ee', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#ffe066', crest: 'horn', tail: 'plume', pattern: 'scales', extra: 'thirdEye' },
    tidewarden: { body: '#1f8f9a', dark: '#0e4650', belly: '#8ff0dc', beak: '#ffd36b', beakDark: '#b8912a', accent: '#ffd36b', crest: 'crest', tail: 'sword', beakShape: 'hook', extra: 'collar', brow: '#d9f7ff', browW: 4 },
    frostking:  { body: '#a8e8fa', dark: '#3f7f9a', belly: '#f0fdff', beak: '#e8f6ff', beakDark: '#8fb0c0', accent: '#ffffff', crest: 'horn', tail: 'sword', beakShape: 'hook', hat: 'crown', aura: '#8ff0ff', brow: '#1c3b4a', browW: 4 },
    diver:      { body: '#2f6fd0', dark: '#17376e', belly: '#cfe4ff', beak: '#ff8f3a', beakDark: '#b9541f', accent: '#ffd36b', crest: 'crest', tail: 'long', hat: 'visor', hatColor: '#7fffe0', brow: '#eaf4ff', browW: 4 },
    hawk:       { body: '#b0603a', dark: '#63301a', belly: '#ffd9b8', beak: '#ffc44a', beakDark: '#b07f1e', accent: '#ffd36b', crest: 'none', tail: 'fan', beakShape: 'hook', hat: 'hood', hatColor: '#7a3f22', hatDark: '#4a2410', extra: 'earTufts' },
    vulture:    { body: '#7a6a86', dark: '#41374a', belly: '#e2d6e0', beak: '#e8c8a8', beakDark: '#a8845c', accent: '#ff8f6b', crest: 'none', tail: 'fan', beakShape: 'hook', extra: 'collar', pattern: 'spots' },
    spitter:    { body: '#8fe03a', dark: '#3f7a18', belly: '#f2ffd0', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#ff5f8a', crest: 'mohawk', tail: 'short', pattern: 'spots' },
    shrike:     { body: '#d8c04a', dark: '#6b5a1a', belly: '#fff3c0', beak: '#3a3a2a', beakDark: '#232318', accent: '#ff8f3a', crest: 'spike', tail: 'fork', beakShape: 'long', pattern: 'chevron', hat: 'cap', hatColor: '#2f2f38', hatDark: '#1b1b22' },
    ram:        { body: '#8a8fa0', dark: '#43485c', belly: '#e2e6f0', beak: '#ffd36b', beakDark: '#a88a20', accent: '#ffe9a8', crest: 'curl', tail: 'short' },
    nestkeeper: { body: '#f0dfb8', dark: '#9a8452', belly: '#fffaea', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#8fd06a', crest: 'leaf', tail: 'short', pattern: 'plates' },
    canyoncaller: { body: '#e07a3a', dark: '#8a3f14', belly: '#ffd9b0', beak: '#4a2a12', beakDark: '#2e1a08', accent: '#2fd0c0', crest: 'sail', tail: 'plume', beakShape: 'long', extra: 'collar' },
    /* Remade: a dune rider — sand-striped, hooded, with a red bandana. */
    harrier:    { body: '#c8a24a', dark: '#6f5218', belly: '#ffe9b8', beak: '#ffcf5a', beakDark: '#a8811c', accent: '#ff7a4a', crest: 'tuft', tail: 'long', beakShape: 'hook', hat: 'hood', hatColor: '#8a6a2a', hatDark: '#4a3610', flair: 'bandana', pattern: 'stripes' },
    frost:      { body: '#7fdcff', dark: '#2f88b8', belly: '#f0fcff', beak: '#ffe27a', beakDark: '#b8912a', accent: '#ffffff', crest: 'shard', tail: 'puff', extra: 'antlers', aura: '#7fe0ff', brow: '#1d3b4a', browW: 4 },
    balloon:    { body: '#ff9ec4', dark: '#b83f74', belly: '#ffe6f0', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#ffd36b', crest: 'none', tail: 'plume', hat: 'bow', hatColor: '#ff6fa8', hatDark: '#b8306a', extra: 'balloon' },
    yeti:       { body: '#f2f8ff', dark: '#a8c0d8', belly: '#ffffff', beak: '#c8d8e8', beakDark: '#8fa8bc', accent: '#7fe0ff', crest: 'none', tail: 'fan', pattern: 'fur', extra: 'tusks', aura: '#bfefff', brow: '#5a7fa8', browW: 4.2 },
    mammoth:    { body: '#a88a70', dark: '#5b4534', belly: '#f0e0cc', beak: '#f0e0c0', beakDark: '#a89a84', accent: '#ffe9a8', crest: 'curl', tail: 'puff', extra: 'tusks', pattern: 'plates', brow: '#2f3140', browW: 4.6 },
    camel:      { body: '#e8c072', dark: '#a07a2a', belly: '#fff0c8', beak: '#8a6a3a', beakDark: '#5e4622', accent: '#ff7a4a', crest: 'none', tail: 'short', pattern: 'stripes', hat: 'hood', hatColor: '#c98a3a', hatDark: '#7a4a10', brow: '#5a4526', browW: 4.6 },
    kraken:     { body: '#2f4f9f', dark: '#152655', belly: '#4f9fd8', beak: '#ffd36b', beakDark: '#a8842c', accent: '#7fffe0', crest: 'none', tail: 'tentacle', beakShape: 'hook', extra: 'thirdEye', pattern: 'scales', aura: '#5fffdc', brow: '#d9f7ff', browW: 4.4 },
    /* --- ice and deep water --- */
    frostcaller: { body: '#6fe0b0', dark: '#1f8a6a', belly: '#e0fff4', beak: '#eafcff', beakDark: '#7fb8a8', accent: '#ff8fd8', crest: 'sail', tail: 'plume', beakShape: 'long', aura: '#7fffcf', extra: 'thirdEye' },
    /* Remade: a glacier rampart — blue-white, shard-backed, with a visor of ice. */
    frostwall:  { body: '#cfe8ff', dark: '#5f8fb8', belly: '#ffffff', beak: '#eaf6ff', beakDark: '#8fb0c0', accent: '#7fd8ff', crest: 'shard', tail: 'sword', beakShape: 'hook', hat: 'visor', hatColor: '#bfe6ff', hatDark: '#4f7fa8', extra: 'shards', pattern: 'plates', aura: '#a9e8ff', brow: '#3f6a86', browW: 4.4 },
    rimeweaver: { body: '#a8f0d0', dark: '#3f9a7a', belly: '#f0fff8', beak: '#e8f6ff', beakDark: '#8fb0b8', accent: '#ffffff', crest: 'crest', tail: 'puff', beakShape: 'long', pattern: 'chevron' },
    tidewall:   { body: '#1f3f6f', dark: '#0f2038', belly: '#9fd0e8', beak: '#ffd36b', beakDark: '#b8912a', accent: '#ffd36b', crest: 'spike', tail: 'sword', beakShape: 'hook', hat: 'helm', hatColor: '#2f5f8f', hatDark: '#0b1a2c', brow: '#d9f7ff', browW: 4.6 },
    tideseer:   { body: '#b86fe0', dark: '#6a2f9a', belly: '#f0dfff', beak: '#ffcf5a', beakDark: '#c08a20', accent: '#ffd36b', crest: 'crest', tail: 'plume', beakShape: 'long', hat: 'hood', hatColor: '#7a3fbf', hatDark: '#4a1f80', extra: 'thirdEye', pattern: 'spots' },
    icefall:    { body: '#bfeaff', dark: '#5f9ac0', belly: '#ffffff', beak: '#e6f2fa', beakDark: '#9fb8c8', accent: '#e0f8ff', crest: 'shard', tail: 'fan', beakShape: 'hook', extra: 'shards', pattern: 'plates', brow: '#3d6480', browW: 4.8 },
    frostbinder: { body: '#9fb0f0', dark: '#3f4f9a', belly: '#e8eeff', beak: '#eaf8ff', beakDark: '#9fb0d0', accent: '#7fffe0', crest: 'crest', tail: 'long', beakShape: 'long', hat: 'visor', hatColor: '#9fffe8', pattern: 'scales' },
    /* Remade: a coral fortress rather than a green lump — pink plating, a
       barnacle helm and shards growing out of its back. */
    reefbulwark: { body: '#e06a8a', dark: '#8a2f4a', belly: '#ffe0ea', beak: '#ffd36b', beakDark: '#b08a1e', accent: '#7fffe0', crest: 'shard', tail: 'fan', beakShape: 'hook', hat: 'helm', hatColor: '#e08aa8', hatDark: '#7a2f4a', extra: 'shards', pattern: 'plates', aura: '#ff9fc4', brow: '#ffe6ef', browW: 4.6 },
    brinebinder: { body: '#3fd0c0', dark: '#167a72', belly: '#d8fff8', beak: '#ffcf5a', beakDark: '#bf8a20', accent: '#ff7a9a', crest: 'spike', tail: 'puff', beakShape: 'long', pattern: 'spots', aura: '#7ffff0' },
    /* --- the Gilded Kingdom --- */
    squire:     { body: '#d8b074', dark: '#8a6a3a', belly: '#fff0cc', beak: '#ffc44a', beakDark: '#b8831f', accent: '#ff6f6f', crest: 'tuft', tail: 'short', flair: 'bandana', pattern: 'chevron' },
    herald:     { body: '#7a4fc0', dark: '#3f2b6b', belly: '#efe4ff', beak: '#ffd36b', beakDark: '#c1962a', accent: '#ffe27a', crest: 'crest', tail: 'fan', beakShape: 'long', hat: 'plume' },
    bannerman:  { body: '#c0304a', dark: '#6d1c2e', belly: '#ffd9c8', beak: '#ffc44a', beakDark: '#b98a1e', accent: '#ffe9a8', crest: 'mohawk', tail: 'fan', beakShape: 'hook', extra: 'collar' },
    rooknight:  { body: '#4a4f68', dark: '#232532', belly: '#c9cede', beak: '#e8e2c8', beakDark: '#a89f80', accent: '#ffd36b', crest: 'none', tail: 'sword', beakShape: 'hook', hat: 'helm', hatColor: '#5f6478', hatDark: '#b9c0d0', brow: '#ffd36b', browW: 4.6 },
    falconer:   { body: '#a8542f', dark: '#5f2a12', belly: '#ffe0c4', beak: '#ffc44a', beakDark: '#bf8a1c', accent: '#ffd36b', crest: 'crest', tail: 'long', beakShape: 'hook', hat: 'visor', hatColor: '#ffd36b', flair: 'bandana' },
    warden:     { body: '#6f8a45', dark: '#3d4f22', belly: '#e8f0c0', beak: '#ffd36b', beakDark: '#a88a20', accent: '#ffd36b', crest: 'curl', tail: 'fan', beakShape: 'hook', extra: 'collar', brow: '#ffd36b', browW: 5 },
    thornwing:  { body: '#7fbf4a', dark: '#2f6a2a', belly: '#dcf0b8', beak: '#ffd36b', beakDark: '#a8811c', accent: '#c8ff8f', crest: 'mohawk', tail: 'long', beakShape: 'long', extra: 'shards', pattern: 'chevron' },
    mossback:   { body: '#4c8a5a', dark: '#27492f', belly: '#c8e6b0', beak: '#e8d98a', beakDark: '#9a8242', accent: '#9fe07a', crest: 'tuft', tail: 'puff', beakShape: 'hook', pattern: 'fur', extra: 'antlers', brow: '#eaffd8', browW: 4.8 },
    bramblecaster: { body: '#8fb03f', dark: '#4a5c1a', belly: '#e8f5c0', beak: '#ffd36b', beakDark: '#b89a20', accent: '#b0ff6b', crest: 'none', tail: 'fan', beakShape: 'long', hat: 'wizard', hatColor: '#4f7a2a', hatDark: '#2f4a16' },
    gloomowl:   { body: '#3f3f6a', dark: '#1e1e34', belly: '#9fa8cc', beak: '#c9b06a', beakDark: '#8a7440', accent: '#ffd36b', crest: 'horn', tail: 'short', beakShape: 'hook', brow: '#ffe27a', browW: 5.4, aura: '#7a6fd8', extra: 'thirdEye' },
    shrieker:   { body: '#3a3a44', dark: '#17171d', belly: '#a9a9b4', beak: '#e0b45a', beakDark: '#a8822a', accent: '#ff5f4a', crest: 'spike', tail: 'plume', beakShape: 'long', aura: '#ff5f4a' },
    /* Remade: a gargoyle — horned, moss-veined stone with a chipped helm. */
    stonebeak:  { body: '#8f948f', dark: '#3f443f', belly: '#d8dcd4', beak: '#c9c9b0', beakDark: '#7f7f6a', accent: '#9fe08a', crest: 'horn', tail: 'fan', beakShape: 'hook', pattern: 'plates', extra: 'tusks', hat: 'helm', hatColor: '#6f746f', hatDark: '#2f342f', brow: '#e8ffe0', browW: 5.4 },
    lanternwing: { body: '#e0a83f', dark: '#7a5410', belly: '#fff6c9', beak: '#ffd36b', beakDark: '#b88f20', accent: '#ffe27a', crest: 'crest', tail: 'plume', aura: '#ffcc66' },
    royalguard: { body: '#2f4f9f', dark: '#182c56', belly: '#d9e6ff', beak: '#ffd36b', beakDark: '#bc9422', accent: '#ffd36b', crest: 'spike', tail: 'fan', beakShape: 'hook', hat: 'helm', hatColor: '#3f60b0', hatDark: '#ffd36b', brow: '#ffe9a8', browW: 4.8 },
    crownseer:  { body: '#a06ac8', dark: '#5a3a7a', belly: '#f0e2ff', beak: '#ffd36b', beakDark: '#b8912a', accent: '#ffd36b', crest: 'none', tail: 'long', beakShape: 'long', hat: 'crown', extra: 'thirdEye', pattern: 'spots' },
    gildedking: { body: '#f0c04a', dark: '#8f6a18', belly: '#fff6d0', beak: '#ffe27a', beakDark: '#b8912a', accent: '#fff6c2', crest: 'crest', tail: 'plume', beakShape: 'hook', hat: 'crown', aura: '#ffe9a0', brow: '#fff6c2', browW: 6.2, big: true },
    /* --- the clever flock: each one looks like its rule before it acts --- */
    /* Saltwind Shore: a shard-backed magpie wearing a mirrored visor. */
    magpie:     { body: '#5f6fa8', dark: '#2b3157', belly: '#e6ecff', beak: '#ffd36b', beakDark: '#c1962a', accent: '#8ff0ff', crest: 'spike', tail: 'plume', beakShape: 'hook', flair: 'glass', pattern: 'plates', hat: 'visor', hatColor: '#8ff0ff', hatDark: '#2b3157', aura: '#9fe8ff', brow: '#eaf4ff', browW: 4.4 },
    /* Cuckoo Canyon: hooded, bandana'd and carrying the spice it stole. */
    pilferer:   { body: '#a8562f', dark: '#5a2a12', belly: '#ffd9b0', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#ff5f5f', crest: 'mohawk', tail: 'fan', flair: 'bandana', pattern: 'chevron', hat: 'hood', hatColor: '#3a2a22', hatDark: '#1e140f' },
    /* Egg World: a soft cream songbird in a red beret, built like a bell. */
    chorus:     { body: '#e8d8a8', dark: '#a8905a', belly: '#fffbe8', beak: '#ffb03a', beakDark: '#c67a1e', accent: '#e05a6a', crest: 'tuft', tail: 'short', flair: 'flare', pattern: 'spots', hat: 'beret', hatColor: '#c0304a', hatDark: '#7a1c2c', aura: '#ffe9b8' },
    /* --- the late flock: shore squall and the two kingdom heavies --- */
    /* Saltwind Shore: a storm shrike with a visor of sea glass. */
    squallwing: { body: '#6f9fd8', dark: '#2f4f7a', belly: '#e6f4ff', beak: '#ffcf4a', beakDark: '#b8912a', accent: '#9fffe0', crest: 'crest', tail: 'fork', beakShape: 'long', hat: 'visor', hatColor: '#9fffe0', hatDark: '#2f4f7a', pattern: 'chevron', aura: '#9fffe0', brow: '#eaf4ff', browW: 4.2 },
    /* Gilded Kingdom: an armoured strongbox of a bird with a coin-slot beak. */
    coinmaw:    { body: '#e0b64a', dark: '#8a6a18', belly: '#fff4c8', beak: '#ffe27a', beakDark: '#b8912a', accent: '#ff6f4a', crest: 'none', tail: 'short', beakShape: 'pouch', extra: 'tusks', pattern: 'plates', hat: 'helm', hatColor: '#d8b04a', hatDark: '#7a5a10', brow: '#fff2c2', browW: 5 },
    /* Gilded Kingdom: the crown split in half and worn on its head. */
    crownbreaker: { body: '#b03a4a', dark: '#5f1a24', belly: '#ffd9d0', beak: '#ffd36b', beakDark: '#b8912a', accent: '#ffd36b', crest: 'horn', tail: 'sword', beakShape: 'hook', hat: 'crown', extra: 'tusks', pattern: 'chevron', aura: '#ff9f6b', brow: '#ffe9a8', browW: 5.4, big: true },
  };
  /* Give every generated bird its own body as well as its own palette. The
     seed comes from the key, so a bird looks the same on every visit. */
  const BIRD_BUILDS = ['plump', 'round', 'tall', 'lean', 'egg'];
  const shapedBirds = Object.fromEntries(Object.entries(variantBirds).map(([k, cfg]) => {
    const seed = [...k].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    return [k, Object.assign({
      size: cfg.big ? 1.16 : 0.88 + ((seed * 7) % 21) / 100,
      build: cfg.build || BIRD_BUILDS[seed % BIRD_BUILDS.length],
      shade: cfg.shade == null ? 0.82 + ((seed * 13) % 39) / 100 : cfg.shade,
    }, cfg)];
  }));
  Object.assign(enemyParts, Object.fromEntries(Object.entries(shapedBirds).map(([k, cfg]) => [k, () => variantBird(cfg)])));


  /* The eight hand-drawn Egg World birds get the same treatment as the
     generated flock: a seeded size, one of the five body builds and a shade
     pass clipped to the body. Their own line work is untouched. */
  const LEGACY_SHAPES = {
    red:     { build: 'plump', box: [54, 57, 31, 30] },
    chuck:   { build: 'lean',  box: [54, 57, 31, 30] },
    blue:    { build: 'round', box: [57, 61, 27, 26] },
    bomb:    { build: 'plump', box: [54, 57, 31, 30] },
    matilda: { build: 'round', box: [54, 57, 31, 30] },
    hal:     { build: 'lean',  box: [54, 57, 31, 30] },
    bubbles: { build: 'round', box: [54, 57, 31, 30] },
    stella:  { build: 'egg',   box: [54, 57, 31, 30] },
  };
  const BUILD_SQUASH = {
    plump: [1.1, 0.93], round: [1.05, 1], tall: [0.93, 1.1], lean: [0.87, 1.05], egg: [0.99, 1.08],
  };
  function shapedLegacy(key, inner) {
    const cfg = LEGACY_SHAPES[key];
    const seed = [...key].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const size = 0.88 + ((seed * 7) % 21) / 100;
    const [sx, sy] = BUILD_SQUASH[cfg.build];
    const shade = 0.82 + ((seed * 13) % 39) / 100;
    const [cx, cy, rx, ry] = cfg.box;
    const uid = 'h' + (++birdSeq);
    return `<defs><clipPath id="${uid}-clip"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath><radialGradient id="${uid}-shade" cx="30%" cy="22%" r="88%"><stop offset="0" stop-color="#fff" stop-opacity="${(0.34 * shade).toFixed(2)}"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="${(0.12 * shade).toFixed(2)}"/><stop offset="1" stop-color="#000" stop-opacity="${(0.38 * shade).toFixed(2)}"/></radialGradient></defs>
      <g transform="translate(${cx} ${cy}) scale(${(size * sx).toFixed(3)} ${(size * sy).toFixed(3)}) translate(-${cx} -${cy})">${inner}
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${uid}-shade)" clip-path="url(#${uid}-clip)"/></g>`;
  }

  /* The numb flock borrows an existing body plan: same build, own beak. */
  enemyParts.numbwing = enemyParts.vulture || enemyParts.red;
  enemyParts.brinewretch = enemyParts.tideseer || enemyParts.red;
  enemyParts.bristleback = enemyParts.ram || enemyParts.red;
  enemyParts.spikegull = enemyParts.gull || enemyParts.red;
  /* The castle tank: widest existing body plan, plated by the renderer. */
  enemyParts.ironclad = enemyParts.royalguard || enemyParts.terence || enemyParts.red;
  /* The exposed flock borrows a body plan that already exists. */
  const EXPOSED_ART = {
    emberwing: 'chuck', galebeak: 'blue', shellguard: 'bomb',
    dustdevil: 'diver', sunspot: 'hawk', mesabreaker: 'vulture',
    rimecaller: 'frostcaller', snowblind: 'frost', glacierwing: 'frostwall',
    saltfang: 'gull', stormpetrel: 'tern', brinepriest: 'tideseer',
    giltwing: 'herald', stonemason: 'stonebeak', courtjester: 'bramblecaster',
  };
  Object.keys(EXPOSED_ART).forEach((k) => { enemyParts[k] = enemyParts[EXPOSED_ART[k]] || enemyParts.red; });
  /* Two costumes of the same knight: horned canyon plate and castle gold. */
  enemyParts.duneknight = enemyParts.ram || enemyParts.red;
  enemyParts.gildedknight = enemyParts.royalguard || enemyParts.rooknight || enemyParts.red;

  function enemy(id) {
    if (LEGACY_SHAPES[id]) return open(shapedLegacy(id, enemyParts[id]()));
    const fn = enemyParts[id] || enemyParts.red;
    return open(fn());
  }

  function egg(fill = '#fdf3d8', stroke = '#c9b78a') {
    return open(`<ellipse cx="50" cy="53" rx="35" ry="42" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <path d="M35 40 q6 -6 12 -3" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`);
  }

  return { hero, enemy, egg };
})();