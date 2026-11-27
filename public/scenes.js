/* Thesaurus Genavensis — scènes animées provisoires des malédictions.
   Chaque scène dessine un décor en SVG animé par CSS. Une vraie vidéo (SCENES[i].video) la remplace dès qu'elle existe.
   Les animations utilisent --d (moment de départ, en s) et --el (temps déjà écoulé) pour reprendre au bon endroit après un rechargement. */
(() => {
const d = s => `style="--d:${s}s"`;
const crown = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 6 L-12 -4 L-6 2 L0 -8 L6 2 L12 -4 L12 6 Z" fill="#e8b830" stroke="#a87a10" stroke-width="1.5"/></g>`;
const beard = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0 Q-16 22 0 30 Q16 22 14 0 Q8 8 0 6 Q-8 8 -14 0 Z" fill="#f4f1ea" stroke="#c9c3b5" stroke-width="1.5"/></g>`;

const ART = {
  meduse: () => {
    const snakes = [-168, -146, -124, -102, -78, -56, -34, -12].map((deg, i) => {
      const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const bx = 100 + 37 * ux, by = 146 + 37 * uy, L = 36 + (i % 3) * 6, w = i % 2 ? 9 : -9;
      const P = (k, o) => `${(bx + ux * L * k + nx * o).toFixed(1)} ${(by + uy * L * k + ny * o).toFixed(1)}`;
      const ex = bx + ux * L, ey = by + uy * L;
      return `<g class="sc-snake" style="--i:${i};transform-box:view-box;transform-origin:${bx.toFixed(1)}px ${by.toFixed(1)}px">
        <path d="M${bx.toFixed(1)} ${by.toFixed(1)} C${P(.35, w)} ${P(.65, -w)} ${P(1, 0)}" stroke="#2f6b33" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M${bx.toFixed(1)} ${by.toFixed(1)} C${P(.35, w)} ${P(.65, -w)} ${P(1, 0)}" stroke="#58a64e" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="7" ry="5.5" fill="#58a64e" stroke="#2f6b33" stroke-width="1.5" transform="rotate(${deg} ${ex.toFixed(1)} ${ey.toFixed(1)})"/>
        <circle cx="${(ex + nx * 2.5).toFixed(1)}" cy="${(ey + ny * 2.5).toFixed(1)}" r="1.4" fill="#111"/>
        <path d="M${(ex + ux * 6).toFixed(1)} ${(ey + uy * 6).toFixed(1)} l${(ux * 6).toFixed(1)} ${(uy * 6).toFixed(1)}" stroke="#d2332a" stroke-width="1.6" stroke-linecap="round"/></g>`;
    }).join('');
    return `
  <div class="sc-bg" style="background:linear-gradient(#2e2147 0%,#7a3f5c 55%,#d8884e 100%)"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    <circle cx="160" cy="40" r="14" fill="#f6e3b0" opacity=".85"/>
    ${[12, 166].map(x => `<g><rect x="${x}" y="70" width="22" height="200" fill="#dccfb2"/><rect x="${x - 4}" y="62" width="30" height="10" rx="2" fill="#c8b994"/>
      ${[5, 11, 17].map(o => `<line x1="${x + o}" y1="76" x2="${x + o}" y2="268" stroke="#bfae8a" stroke-width="1.2"/>`).join('')}</g>`).join('')}
    <rect x="0" y="268" width="200" height="32" fill="#4a3346"/>
    <g class="sc-medusa">
      <path d="M48 300 Q54 226 100 214 Q146 226 152 300 Z" fill="#6b3f7a"/><path d="M70 226 Q100 246 130 226" stroke="#e8b830" stroke-width="4" fill="none"/>
      <rect x="90" y="182" width="20" height="30" fill="#a9cf96"/>
      ${snakes}
      <path d="M62 140 Q66 104 100 102 Q134 104 138 140 Q126 120 100 118 Q74 120 62 140 Z" fill="#2f6b33"/>
      <circle cx="100" cy="148" r="38" fill="#b9d9a8" stroke="#6f9a5e" stroke-width="2.5"/>
      <path d="M62 140 Q70 112 100 110 Q130 112 138 140 Q122 126 100 126 Q78 126 62 140 Z" fill="#3b7f3c"/>
      <circle cx="62" cy="160" r="3.5" fill="#e8b830"/><circle cx="138" cy="160" r="3.5" fill="#e8b830"/>
      <path d="M75 136 L92 141 M125 136 L108 141" stroke="#2f5a2a" stroke-width="3.2" stroke-linecap="round"/>
      <ellipse class="sc-eye" style="--d:6.5s" cx="85" cy="149" rx="8.5" ry="6.5" fill="#fff"/><ellipse class="sc-eye" style="--d:6.5s" cx="115" cy="149" rx="8.5" ry="6.5" fill="#fff"/>
      <circle cx="86" cy="150" r="3.6" fill="#1b1b1b"/><circle cx="114" cy="150" r="3.6" fill="#1b1b1b"/>
      <path d="M100 152 q-3 9 0 11" stroke="#7a9a6a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M84 170 Q98 180 116 168" stroke="#a3343a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    </g>
    <g class="sc-shield" style="--d:14s">
      <circle cx="104" cy="236" r="40" fill="url(#bronze)" stroke="#7a5a1a" stroke-width="4"/>
      <g opacity=".75"><circle cx="104" cy="234" r="15" fill="#b9d9a8"/><circle cx="98" cy="232" r="2.4" fill="#7dff6a"/><circle cx="110" cy="232" r="2.4" fill="#7dff6a"/>
        ${[-150, -110, -70, -30].map(g => `<path d="M${104 + 14 * Math.cos(g * Math.PI / 180)} ${234 + 14 * Math.sin(g * Math.PI / 180)} l${8 * Math.cos(g * Math.PI / 180)} ${8 * Math.sin(g * Math.PI / 180)}" stroke="#58a64e" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>
      <circle cx="104" cy="236" r="40" fill="url(#shine)"/>
    </g>
    <defs><radialGradient id="bronze" cx=".4" cy=".35"><stop offset="0" stop-color="#f6dc92"/><stop offset=".7" stop-color="#c39233"/><stop offset="1" stop-color="#8d6221"/></radialGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  </svg>
  <div class="sc-stone" style="--d:7.5s"></div>
  <svg class="sc-svg sc-cracks" style="--d:11s" viewBox="0 0 200 300" aria-hidden="true"><path d="M0 60 l30 18 l-8 22 l26 14 M200 210 l-34 -10 l-6 26 l-30 6 M60 300 l14 -30 l-12 -18 M150 0 l-10 34 l18 16" stroke="#4d4f49" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg>`;
  },

  zeus: () => {
    const zeusFace = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="0" cy="0" r="9" fill="#f2c9a5"/><path d="M-9 1 Q-10 14 0 18 Q10 14 9 1 Q5 6 0 5 Q-5 6 -9 1 Z" fill="#f4f1ea" stroke="#cfc8b8" stroke-width=".8"/>
      <circle cx="-3.2" cy="-1.5" r="1.3" fill="#222"/><circle cx="3.2" cy="-1.5" r="1.3" fill="#222"/>${crown(0, -11, .55)}</g>`;
    const photo = (y0, bg, inner, n) => `<g class="sc-slide" style="--d:${y0[0]}s;--len:${y0[1]}s">
      <rect x="32" y="30" width="136" height="118" rx="4" fill="${bg}"/>${inner}
      <text x="160" y="142" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8" fill="#ffffffcc">${n}/300</text></g>`;
    return `
  <div class="sc-bg" style="background:linear-gradient(#8fc6ec,#d9eef9 70%,#f3f8fb)"></div>
  <div class="sc-dim" style="--d:1s"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    <g fill="#fff" opacity=".9"><circle cx="30" cy="186" r="18"/><circle cx="56" cy="180" r="22"/><circle cx="160" cy="190" r="20"/><circle cx="182" cy="182" r="16"/></g>
    <path class="sc-beam" style="--d:1s" d="M122 214 L32 148 L168 148 Z" fill="#fff6c8" opacity=".25"/>
    <rect x="24" y="22" width="152" height="134" rx="10" fill="#fdfdfb" stroke="#e1e8ee" stroke-width="3"/>
    <g class="sc-slide" style="--d:0s;--len:6s"><rect x="32" y="30" width="136" height="118" rx="4" fill="#1f3b63"/>
      <rect x="40" y="38" width="120" height="102" fill="none" stroke="#e8b830" stroke-width="2" stroke-dasharray="6 3"/>
      <text x="100" y="84" text-anchor="middle" font-family="Marcellus, Georgia, serif" font-size="17" fill="#f4e3b0">Mes vacances</text>
      <text x="100" y="104" text-anchor="middle" font-family="Marcellus, Georgia, serif" font-size="12" fill="#f4e3b0">sur Terre</text>
      <text x="100" y="126" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8" fill="#cfd8e6">300 photos</text></g>
    <g class="sc-slide" style="--d:19s;--len:6s"><rect x="32" y="30" width="136" height="118" rx="4" fill="#2a2a2a"/>
      <g class="sc-hourglass"><path d="M88 62 h24 l-10 26 l10 26 h-24 l10 -26 z" fill="none" stroke="#e8b830" stroke-width="3" stroke-linejoin="round"/><path d="M94 104 h12 l-6 -10 z" fill="#e8b830"/></g>
      <text x="160" y="142" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8" fill="#ffffffcc">5/300</text></g>
    ${photo([6, 3], '#7fb8d8', `<path d="M32 118 Q100 104 168 118 L168 148 L32 148 Z" fill="#4f8fb5"/>
      <path d="M68 122 Q74 96 102 100 Q132 104 130 122 Z" fill="#fff" stroke="#c9d3d9" stroke-width="2"/>
      <path d="M78 110 Q70 92 82 74 Q92 62 98 72" stroke="#c9d3d9" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M78 110 Q70 92 82 74 Q92 62 98 72" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M100 72 l11 3 l-11 4 z" fill="#f08a24"/>${zeusFace(97, 70, .55)}`, 1)}
    ${photo([9, 4], '#9fd07a', `<path d="M32 126 L168 120 L168 148 L32 148 Z" fill="#6fae4e"/>
      <path d="M72 76 Q56 60 66 48" stroke="#f4f1ea" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M128 76 Q144 60 134 48" stroke="#f4f1ea" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="96" rx="34" ry="30" fill="#8a5a3a"/><ellipse cx="100" cy="116" rx="20" ry="12" fill="#e6a7a0"/><circle cx="93" cy="116" r="2.5" fill="#8a5a3a"/><circle cx="107" cy="116" r="2.5" fill="#8a5a3a"/>
      <circle cx="87" cy="90" r="3.5" fill="#222"/><circle cx="113" cy="90" r="3.5" fill="#222"/>${crown(100, 62, .8)}${beard(100, 126, .7)}`, 2)}
    ${photo([13, 3], '#2f3d5a', `<g fill="#9aa7b4"><circle cx="78" cy="64" r="16"/><circle cx="100" cy="56" r="22"/><circle cx="124" cy="66" r="16"/><rect x="64" y="64" width="74" height="18" rx="9"/></g>
      ${zeusFace(100, 66, .9)}
      ${Array.from({ length: 16 }, (_, i) => `<circle class="sc-rain" style="--i:${i % 5}" cx="${68 + i * 4.4}" cy="${90 + (i % 3) * 6}" r="2.6" fill="#f5cf3e"/>`).join('')}`, 3)}
    ${photo([16, 3], '#c9e2f2', `<path d="M32 148 L70 96 L96 126 L124 84 L168 148 Z" fill="#9aa8b4"/><path d="M116 96 L124 84 L132 96 Z" fill="#fff"/>
      <path d="M100 86 Q70 60 40 74 Q66 80 72 96 Z M100 86 Q130 60 160 74 Q134 80 128 96 Z" fill="#6b4a2e"/>
      <ellipse cx="100" cy="98" rx="15" ry="22" fill="#6b4a2e"/><circle cx="100" cy="72" r="11" fill="#fff"/><path d="M108 72 l9 3 l-9 4 z" fill="#f0c43a"/>
      <circle cx="103" cy="70" r="1.6" fill="#222"/>${crown(100, 58, .6)}${beard(100, 78, .28)}`, 4)}
    <g class="sc-zeus">
      <path d="M40 300 Q42 252 70 236 L132 236 Q160 252 162 300 Z" fill="#c99a3c"/>
      <path d="M56 300 Q60 238 100 230 Q140 238 144 300 Z" fill="#fbf8f0"/><path d="M76 236 Q100 262 124 300" stroke="#d9a62a" stroke-width="5" fill="none"/>
      <path class="sc-arm" d="M126 246 Q138 228 124 212" stroke="#f2c9a5" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M118 206 l10 -12 l-2 9 l10 -6 l-12 16 l2 -8 z" fill="#f5d000" stroke="#a88600" stroke-width="1.2"/>
      <circle cx="100" cy="206" r="22" fill="#f2c9a5"/>
      <path d="M78 200 Q74 180 100 178 Q126 180 122 200 Q114 188 100 188 Q86 188 78 200 Z" fill="#f4f1ea"/>
      <path d="M79 208 Q76 238 100 248 Q124 238 121 208 Q112 218 100 216 Q88 218 79 208 Z" fill="#f4f1ea" stroke="#d8d2c4" stroke-width="1.2"/>
      <path class="sc-mouth" d="M93 218 Q100 224 107 218" stroke="#8a3a3a" stroke-width="2.6" fill="#8a3a3a"/>
      <path d="M88 198 L95 199 M105 199 L112 198" stroke="#bdb6a6" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="92" cy="204" r="2.4" fill="#222"/><circle cx="108" cy="204" r="2.4" fill="#222"/>
      ${crown(100, 176, 1.1)}
    </g>
    <g class="sc-scrolls" style="--d:19s">${Array.from({ length: 9 }, (_, i) => `<g><rect x="138" y="${280 - i * 11}" width="54" height="10" rx="5" fill="#efe2c0" stroke="#b89c62" stroke-width="1.4"/><circle cx="140" cy="${285 - i * 11}" r="4" fill="#d8c79a" stroke="#b89c62"/></g>`).join('')}</g>
  </svg>`;
  },

  controle: () => {
    const blocks = Array.from({ length: 10 }, (_, r) => `<line x1="0" y1="${66 + r * 14}" x2="200" y2="${66 + r * 14}" stroke="#bfb08c" stroke-width="1"/>` +
      Array.from({ length: 9 }, (_, c) => `<line x1="${(c * 26 + (r % 2) * 13) % 200}" y1="${66 + r * 14}" x2="${(c * 26 + (r % 2) * 13) % 200}" y2="${80 + r * 14}" stroke="#bfb08c" stroke-width="1"/>`).join('')).join('');
    return `
  <div class="sc-bg" style="background:linear-gradient(#9fd0f0,#e6f3fb 66%,#cdbf9c 66%)"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 24}" y="46" width="14" height="16" fill="#d6c9a8"/>`).join('')}
    <rect x="0" y="60" width="200" height="140" fill="#d6c9a8"/>${blocks}
    <path d="M118 200 L118 128 Q150 96 182 128 L182 200 Z" fill="#eef3ea"/>
    <path d="M118 200 L118 172 Q150 160 182 172 L182 200 Z" fill="#a7c48a"/>
    <path d="M118 200 L118 128 Q150 96 182 128 L182 200" fill="none" stroke="#a89a78" stroke-width="5"/>
    <rect x="112" y="68" width="76" height="22" rx="3" fill="#efe7d2" stroke="#a89a78" stroke-width="2"/>
    <text x="150" y="84" text-anchor="middle" font-family="Marcellus, Georgia, serif" font-size="13" fill="#5a4a2a" letter-spacing="3">GENAVA</text>
    <g class="sc-queue" style="--d:16s">${[0, 1, 2, 3, 4, 5].map(i => { const x = 130 + i * 9, y = 196 - i * 4, k = 1 - i * .1; return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-4" y="-14" width="8" height="14" rx="3" fill="${['#3f6fb0', '#6b3f7a', '#4f9a4a', '#c8261f', '#d9a62a', '#555'][i]}"/><circle cx="0" cy="-18" r="4.2" fill="#f2c9a5"/></g>` }).join('')}</g>
    <g class="sc-legio">
      <path d="M12 196 h30 v70 q-15 8 -30 0 z" fill="#b3302a" stroke="#e8b830" stroke-width="3"/><circle cx="27" cy="230" r="6" fill="#e8b830"/>
      <path d="M20 214 q7 -8 14 0 M20 246 q7 8 14 0" stroke="#e8b830" stroke-width="2" fill="none"/>
      <line x1="46" y1="70" x2="46" y2="284" stroke="#6b4a2a" stroke-width="4"/><path d="M42 74 l4 -16 l4 16 z" fill="#9aa3a8"/>
      <path d="M50 184 Q44 196 47 206" stroke="#f2c9a5" stroke-width="9" fill="none" stroke-linecap="round"/>
      <rect x="58" y="246" width="9" height="36" fill="#f2c9a5"/><rect x="77" y="246" width="9" height="36" fill="#f2c9a5"/>
      <path d="M58 270 h9 M58 276 h9 M77 270 h9 M77 276 h9" stroke="#6b4a2a" stroke-width="2"/><rect x="55" y="280" width="14" height="5" rx="2" fill="#6b4a2a"/><rect x="75" y="280" width="14" height="5" rx="2" fill="#6b4a2a"/>
      <rect x="52" y="226" width="40" height="22" fill="#b3302a"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${54 + i * 8}" y="232" width="5" height="18" rx="1" fill="#7a4a2a"/>`).join('')}
      <rect x="52" y="176" width="40" height="52" rx="7" fill="#aab1b6"/>${[186, 196, 206, 216].map(y => `<line x1="53" y1="${y}" x2="91" y2="${y}" stroke="#7d858a" stroke-width="2"/>`).join('')}
      <rect x="52" y="222" width="40" height="6" fill="#6b4a2a"/>${[58, 66, 74, 82].map(x => `<circle cx="${x}" cy="225" r="1.5" fill="#e8b830"/>`).join('')}
      <rect x="66" y="164" width="12" height="14" fill="#f2c9a5"/>
      <circle cx="72" cy="152" r="18" fill="#f2c9a5"/>
      <path d="M53 150 Q54 128 72 127 Q90 128 91 150 L87 150 Q86 136 72 135 Q58 136 57 150 Z" fill="#9aa3a8" stroke="#6b7378" stroke-width="1.5"/>
      <path d="M56 148 L56 164 L61 160 L61 148 Z M88 148 L88 164 L83 160 L83 148 Z" fill="#9aa3a8"/>
      <rect x="70" y="122" width="4" height="7" fill="#6b7378"/><path class="sc-crest" d="M48 126 Q50 112 72 112 Q94 112 96 126 Q72 120 48 126 Z" fill="#c8261f"/>
      <g class="sc-brows" style="--d:13s"><path d="M61 145 L69 147 M83 145 L75 147" stroke="#5a3a2a" stroke-width="2.6" stroke-linecap="round"/></g>
      <g class="sc-eyes" style="--d:13s"><circle cx="65" cy="152" r="2.4" fill="#222"/><circle cx="79" cy="152" r="2.4" fill="#222"/></g>
      <path d="M72 153 l-2 6 h3" stroke="#c99a7a" stroke-width="1.5" fill="none"/>
      <path d="M66 163 Q72 161 78 163" stroke="#7a3a3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="sc-tabarm" style="--d:16s"><path d="M92 184 Q106 192 112 202" stroke="#f2c9a5" stroke-width="9" fill="none" stroke-linecap="round"/>
        <rect x="104" y="196" width="26" height="19" rx="2" fill="#7a4a22"/><rect x="107" y="199" width="20" height="13" fill="#e8d9a8"/>
        <path d="M109 202 h14 M109 205 h10 M109 208 h12" stroke="#7a6a4a" stroke-width="1"/></g>
    </g>
    ${[4, 7, 10].map(t => `<text class="sc-q" style="--d:${t}s" x="98" y="134" font-family="Marcellus, Georgia, serif" font-size="30" fill="#c8261f" stroke="#fff" stroke-width="1.5" paint-order="stroke">?</text>`).join('')}
  </svg>`;
  },

  appia: () => `
  <div class="sc-bg" style="background:linear-gradient(#f6c97a,#fbeed2 55%)"></div>
  <div class="sc-dusk"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    <circle class="sc-sun" cx="150" cy="40" r="16" fill="#fff1b8"/>
    <path d="M0 150 Q40 118 80 136 Q120 110 160 132 Q182 124 200 132 L200 160 L0 160 Z" fill="#cbb98c"/>
    <g fill="#e4d4ae">${Array.from({ length: 7 }, (_, i) => `<path d="M${i * 30} 160 L${i * 30} 112 L${i * 30 + 30} 112 L${i * 30 + 30} 160 L${i * 30 + 24} 160 L${i * 30 + 24} 132 Q${i * 30 + 15} 118 ${i * 30 + 6} 132 L${i * 30 + 6} 160 Z"/>`).join('')}<rect x="0" y="104" width="200" height="9"/></g>
    ${[[14, 150], [36, 146], [186, 150]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 18}" rx="6" ry="24" fill="#3f5a32"/><rect x="${x - 1}" y="${y + 4}" width="2" height="8" fill="#5a3f22"/>`).join('')}
    <rect x="0" y="160" width="200" height="140" fill="#9c9a86"/>
    <rect x="0" y="190" width="200" height="72" fill="#7f7b6c"/>
    <g stroke="#69665a" stroke-width="1.2" fill="none">${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 12} 190 l6 14 l-4 16 l8 18 l-6 24"/>`).join('')}</g>
    <rect x="0" y="188" width="200" height="4" fill="#c9c3ad"/><rect x="0" y="260" width="200" height="4" fill="#c9c3ad"/>
    <g><rect x="172" y="262" width="22" height="38" rx="8" fill="#ece5d0" stroke="#a89f86" stroke-width="2"/><text x="183" y="280" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="7" fill="#5a4a2a">M·P</text><text x="183" y="292" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8" fill="#5a4a2a">I</text>
      <g class="sc-bird"><ellipse cx="183" cy="258" rx="5" ry="4" fill="#3a3a3a"/><circle cx="187" cy="255" r="2.5" fill="#3a3a3a"/><path d="M189 255 l3 1 l-3 1z" fill="#e8b830"/></g></g>
    <g class="sc-cartA">
      <path d="M6 212 Q32 182 58 212 Z" fill="#efe2c0" stroke="#b89c62" stroke-width="2"/><rect x="6" y="210" width="52" height="20" rx="3" fill="#a0643a"/>
      <circle class="sc-wheel" cx="18" cy="236" r="10" fill="none" stroke="#4a2e16" stroke-width="4"/><circle class="sc-wheel" cx="46" cy="236" r="10" fill="none" stroke="#4a2e16" stroke-width="4"/>
      <circle cx="18" cy="236" r="2" fill="#4a2e16"/><circle cx="46" cy="236" r="2" fill="#4a2e16"/>
      <circle cx="54" cy="200" r="8" fill="#f2c9a5"/><path d="M49 196 l5 2 M59 196 l-4 2" stroke="#5a3a2a" stroke-width="2" stroke-linecap="round"/><path d="M51 205 q3 -2 6 0" stroke="#7a3a3a" stroke-width="1.6" fill="none"/>
      <g class="sc-fist" style="--d:5s"><path d="M60 204 l8 -12" stroke="#f2c9a5" stroke-width="5" stroke-linecap="round"/><circle cx="69" cy="190" r="4" fill="#f2c9a5"/></g>
    </g>
    <g class="sc-cartB">
      <rect x="66" y="214" width="50" height="16" rx="3" fill="#8a5a32"/>
      ${[74, 88, 102].map(x => `<path d="M${x} 214 q-6 -10 0 -18 h6 q6 8 0 18 z" fill="#c76b3a" stroke="#8a4a22" stroke-width="1.2"/><rect x="${x - 1}" y="191" width="8" height="5" fill="#c76b3a"/>`).join('')}
      <circle class="sc-wheel" cx="78" cy="236" r="10" fill="none" stroke="#4a2e16" stroke-width="4"/><circle class="sc-wheel" cx="104" cy="236" r="10" fill="none" stroke="#4a2e16" stroke-width="4"/>
      <circle cx="78" cy="236" r="2" fill="#4a2e16"/><circle cx="104" cy="236" r="2" fill="#4a2e16"/>
      <circle cx="114" cy="202" r="8" fill="#e0b08a"/><path d="M109 198 l5 2 M119 198 l-4 2" stroke="#4a2a1a" stroke-width="2" stroke-linecap="round"/><path d="M111 207 q3 -2 6 0" stroke="#7a3a3a" stroke-width="1.6" fill="none"/>
    </g>
    <path d="M120 220 L136 222" stroke="#6b4a2a" stroke-width="2"/>
    <g class="sc-donkey" style="--d:9s">
      <path d="M134 218 q-4 6 -2 12" stroke="#7d7a74" stroke-width="3" fill="none"/>
      <ellipse cx="156" cy="222" rx="22" ry="12" fill="#a19d96"/><ellipse cx="156" cy="228" rx="14" ry="5" fill="#c9c5bd"/>
      <g class="sc-dlegs" style="--d:9s"><rect x="140" y="228" width="5" height="20" rx="2" fill="#7d7a74"/><rect x="148" y="228" width="5" height="20" rx="2" fill="#7d7a74"/><rect x="162" y="228" width="5" height="20" rx="2" fill="#7d7a74"/><rect x="170" y="228" width="5" height="20" rx="2" fill="#7d7a74"/></g>
      <g class="sc-dhead" style="--d:13s"><path d="M172 216 l8 -10" stroke="#a19d96" stroke-width="9" stroke-linecap="round"/><ellipse cx="184" cy="202" rx="9" ry="7" fill="#a19d96"/><ellipse cx="190" cy="206" rx="5" ry="4" fill="#c9c5bd"/>
        <path d="M178 196 l-4 -16 l7 13 z M184 195 l2 -16 l3 15 z" fill="#7d7a74"/><circle cx="185" cy="200" r="1.8" fill="#222"/></g>
    </g>
    ${[[50, 5], [112, 5.6]].map(([x, t]) => `<g class="sc-puff" style="--d:${t}s"><circle cx="${x}" cy="182" r="5" fill="#fff"/><circle cx="${x + 6}" cy="178" r="6" fill="#fff"/><circle cx="${x + 12}" cy="182" r="4.5" fill="#fff"/></g>`).join('')}
    <g class="sc-honk" style="--d:5s"><path d="M4 196 l-2 -8 M10 192 l0 -9 M16 196 l4 -7" stroke="#b3302a" stroke-width="2.5" stroke-linecap="round"/></g>
  </svg>`,

  sisyphe: () => `
  <div class="sc-bg" style="background:linear-gradient(#1c1630,#3b2340 60%,#6a2a2a)"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    ${[[20, 110], [44, 124], [70, 104], [150, 108], [176, 122], [110, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#e6dcef"/>`).join('')}
    <path d="M0 300 L0 290 L165 140 L200 168 L200 300 Z" fill="#5a4636"/>
    <path d="M0 290 L165 140" stroke="#7a6250" stroke-width="3"/>
    <g><line x1="165" y1="140" x2="165" y2="118" stroke="#d8cbb5" stroke-width="2"/><path d="M165 118 l14 4 l-14 4 z" fill="#c8261f"/></g>
    <g class="sc-dust" style="--d:17s"><circle cx="30" cy="268" r="8" fill="#a8998a"/><circle cx="42" cy="262" r="6" fill="#a8998a"/><circle cx="20" cy="262" r="5" fill="#a8998a"/></g>
    <g data-k="rock"><g data-k="rockspin"><circle cx="0" cy="0" r="20" fill="#8d8f88" stroke="#5d605a" stroke-width="3"/><path d="M-9 -7 l11 4 M3 9 l7 -7 M-12 8 l5 -3" stroke="#5d605a" stroke-width="2.2"/></g></g>
    <g data-k="man">
      <path d="M-20 -12 L-6 -2" stroke="#f2c9a5" stroke-width="5" stroke-linecap="round"/><path d="M-20 -6 L-6 4" stroke="#f2c9a5" stroke-width="5" stroke-linecap="round"/>
      <path d="M-34 -18 Q-24 -24 -18 -10 L-20 8 L-34 6 Z" fill="#7d8b6a"/>
      <g class="sc-legs"><path d="M-28 6 L-34 26" stroke="#f2c9a5" stroke-width="5" stroke-linecap="round"/><path d="M-24 6 L-16 26" stroke="#e0b28e" stroke-width="5" stroke-linecap="round"/></g>
      <circle cx="-26" cy="-26" r="8" fill="#f2c9a5"/><path d="M-33 -22 Q-30 -12 -24 -16 Q-20 -18 -19 -24" fill="#6b5a4a"/><path d="M-33 -30 Q-26 -38 -18 -30" stroke="#6b5a4a" stroke-width="4" fill="none"/>
      <circle cx="-22" cy="-28" r="1.4" fill="#222"/><path data-k="drop" d="M-30 -34 q-2 4 0 5 q2 -1 0 -5" fill="#9fd0f0"/>
    </g>
    <rect x="18" y="22" width="164" height="78" rx="12" fill="#14111f" stroke="#8a7fb0" stroke-width="2"/>
    <text x="100" y="42" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-size="11" fill="#cfc5e6">Chargement de l'énigme</text>
    <rect x="30" y="52" width="140" height="16" rx="8" fill="#231e36"/>
    <rect class="sc-bar" x="31" y="53" width="1" height="14" rx="7" fill="#e0b456"/>
    <text class="sc-pct" x="100" y="90" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#f3eef2">0 %</text>
  </svg>`,

  cresus: () => `
  <div class="sc-bg" style="background:radial-gradient(circle at 45% 62%,#5a4420,#1a1208 70%)"></div>
  <div class="sc-rays" style="--d:3s"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    <g stroke="#3a2a14" stroke-width="1.2" opacity=".6">${Array.from({ length: 9 }, (_, r) => `<line x1="0" y1="${r * 22}" x2="200" y2="${r * 22}"/>` + Array.from({ length: 6 }, (_, c) => `<line x1="${c * 40 + (r % 2) * 20}" y1="${r * 22}" x2="${c * 40 + (r % 2) * 20}" y2="${r * 22 + 22}"/>`).join('')).join('')}</g>
    <rect x="20" y="240" width="130" height="18" fill="#6e5a3a"/><rect x="14" y="256" width="142" height="44" fill="#5a4830"/>
    ${[[30, 120], [70, 90], [120, 104], [44, 180], [130, 160]].map(([x, y], i) => `<path class="sc-twinkle" style="--d:${3 + i * .7}s" d="M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z" fill="#ffe08a"/>`).join('')}
    <ellipse cx="85" cy="186" rx="48" ry="9" fill="#120c05"/>
    <g class="sc-moth" style="--d:10.5s"><ellipse cx="85" cy="186" rx="3" ry="7" fill="#6b6256"/><path class="sc-wing" d="M85 184 q-14 -12 -16 2 q4 8 16 0 M85 184 q14 -12 16 2 q-4 8 -16 0" fill="#b0a696"/></g>
    <rect x="37" y="186" width="96" height="56" rx="4" fill="#7a4a22"/>
    ${[50, 66, 82, 98, 114].map(x => `<line x1="${x}" y1="187" x2="${x}" y2="241" stroke="#5e3816" stroke-width="1.5"/>`).join('')}
    <rect x="37" y="196" width="96" height="6" fill="#4a4a4a"/><rect x="37" y="228" width="96" height="6" fill="#4a4a4a"/>
    ${[44, 64, 106, 126].map(x => `<circle cx="${x}" cy="199" r="1.6" fill="#c9c9c9"/><circle cx="${x}" cy="231" r="1.6" fill="#c9c9c9"/>`).join('')}
    <rect x="76" y="204" width="18" height="20" rx="3" fill="#e8b830" stroke="#a87a10" stroke-width="1.5"/><path d="M85 210 v6" stroke="#5a3a10" stroke-width="2.5" stroke-linecap="round"/>
    <g class="sc-lid" style="--d:9s"><path d="M37 187 Q85 150 133 187 Z" fill="#8a5528" stroke="#5e3816" stroke-width="2"/><path d="M60 175 Q85 162 110 175" stroke="#4a4a4a" stroke-width="5" fill="none"/></g>
    <g class="sc-puffd" style="--d:9.2s"><circle cx="60" cy="182" r="7" fill="#c9b99a"/><circle cx="110" cy="182" r="7" fill="#c9b99a"/><circle cx="85" cy="176" r="8" fill="#c9b99a"/></g>
    <g class="sc-king">
      <path d="M150 300 Q150 230 172 222 Q194 230 194 300 Z" fill="#6b2a7a"/><path d="M162 224 Q172 240 182 224" stroke="#e8b830" stroke-width="4" fill="none"/>
      <g class="sc-karm"><path d="M156 238 Q140 230 136 214" stroke="#6b2a7a" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="135" cy="211" r="5" fill="#f2c9a5"/></g>
      <circle cx="172" cy="200" r="17" fill="#f2c9a5"/>
      <path d="M156 206 Q158 226 172 228 Q186 226 188 206 Q180 214 172 213 Q164 214 156 206 Z" fill="#5a3a22"/>
      ${crown(172, 182, 1.25)}
      <g data-k="happy"><circle cx="166" cy="198" r="2" fill="#222"/><circle cx="178" cy="198" r="2" fill="#222"/><path d="M166 208 Q172 213 178 208" stroke="#7a3a3a" stroke-width="2" fill="none" stroke-linecap="round"/></g>
      <g data-k="sad" style="display:none"><circle cx="166" cy="198" r="3" fill="#fff" stroke="#222"/><circle cx="178" cy="198" r="3" fill="#fff" stroke="#222"/><circle cx="166" cy="198" r="1.2" fill="#222"/><circle cx="178" cy="198" r="1.2" fill="#222"/><ellipse cx="172" cy="210" rx="3" ry="4" fill="#5a2020"/></g>
    </g>
  </svg>`,

  hermes: () => `
  <div class="sc-bg" style="background:radial-gradient(circle at 50% 40%,#ffe6a0,#e8a84a 75%)"></div>
  <div class="sc-confetti"></div>
  <svg class="sc-svg" viewBox="0 0 200 300" aria-hidden="true">
    <path d="M0 0 h34 q-10 120 6 300 h-40 z" fill="#a3202a"/><path d="M200 0 h-34 q10 120 -6 300 h40 z" fill="#a3202a"/>
    <path d="M0 0 h200 v16 q-25 10 -50 0 q-25 10 -50 0 q-25 10 -50 0 q-25 10 -50 0 z" fill="#c8303a"/>
    <path d="M60 60 L20 300 L180 300 L140 60 Z" fill="#fff6d0" opacity=".25"/>
    <rect x="0" y="262" width="200" height="38" fill="#6e3a22"/><rect x="0" y="262" width="200" height="4" fill="#8a5030"/>
    <rect x="36" y="234" width="62" height="30" fill="#ece3cf" stroke="#c9b99a" stroke-width="2"/>
    <g class="sc-gift">
      <rect x="42" y="190" width="50" height="44" rx="3" fill="#c8261f"/><rect x="63" y="190" width="8" height="44" fill="#e8b830"/>
      <rect x="44" y="194" width="46" height="36" fill="#1a1010" class="sc-inside" style="--d:8s"/>
      <g class="sc-spring" style="--d:8.3s"><path d="M67 230 l-8 -6 l16 -6 l-16 -6 l16 -6 l-16 -6 l8 -6" stroke="#9aa3a8" stroke-width="3" fill="none"/>
        <g transform="translate(67 186)"><path d="M-10 -24 h20 l-8 12 l8 12 h-20 l8 -12 z" fill="#fff6d0" stroke="#e8b830" stroke-width="3" stroke-linejoin="round"/><path d="M-5 0 h10 l-5 -7 z" fill="#e8b830"/></g></g>
      <g class="sc-glid" style="--d:8s"><rect x="38" y="180" width="58" height="13" rx="3" fill="#d8352d"/><rect x="63" y="180" width="8" height="13" fill="#e8b830"/><path d="M67 180 q-16 -16 -20 0 M67 180 q16 -16 20 0" stroke="#e8b830" stroke-width="4" fill="none"/></g>
    </g>
    <g class="sc-sandals" style="--d:12s"><g transform="translate(86 272)"><ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#8a5a3a"/><path d="M-6 -2 q6 -8 12 0" stroke="#5a3a22" stroke-width="2" fill="none"/></g><g transform="translate(112 276)"><ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#8a5a3a"/><path d="M-6 -2 q6 -8 12 0" stroke="#5a3a22" stroke-width="2" fill="none"/></g></g>
    <g class="sc-speed" style="--d:12.8s"><path d="M110 120 h-40 M116 140 h-50 M110 160 h-36 M118 180 h-46" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
    <g class="sc-hermes" style="--d:12.8s">
      <path d="M138 232 L134 260 M152 232 L158 260" stroke="#f2c9a5" stroke-width="7" stroke-linecap="round"/>
      <g><path d="M128 262 h12 l-2 -5 h-8 z M152 262 h12 l-2 -5 h-8 z" fill="#8a5a3a"/><path d="M128 258 q-8 -8 -12 -2 q4 4 12 4 M152 258 q-8 -8 -12 -2 q4 4 12 4" fill="#fff" stroke="#bbb" stroke-width=".8"/></g>
      <path d="M128 168 Q146 160 164 168 L170 236 Q146 244 122 236 Z" fill="#2f8f8a"/>
      <path d="M128 170 Q116 196 112 236 L126 236 Q132 200 140 176 Z" fill="#c8303a"/>
      <g class="sc-harm"><path d="M128 178 Q110 186 102 200" stroke="#f2c9a5" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <path d="M164 176 Q176 186 178 200" stroke="#f2c9a5" stroke-width="7" fill="none" stroke-linecap="round"/>
      <line x1="180" y1="120" x2="180" y2="250" stroke="#e8b830" stroke-width="4"/>
      <path d="M180 132 q-9 7 0 14 q9 7 0 14 q-9 7 0 14 M180 132 q9 7 0 14 q-9 7 0 14 q9 7 0 14" stroke="#4f9a4a" stroke-width="2.6" fill="none"/>
      <path d="M180 124 q-12 -10 -16 0 q8 4 16 0 M180 124 q12 -10 16 0 q-8 4 -16 0" fill="#fff" stroke="#bbb" stroke-width=".8"/><circle cx="180" cy="120" r="4" fill="#e8b830"/>
      <rect x="140" y="146" width="12" height="14" fill="#f2c9a5"/>
      <circle cx="146" cy="132" r="18" fill="#f2c9a5"/>
      <path d="M128 130 Q130 112 146 111 Q162 112 164 130 Q158 120 146 120 Q134 120 128 130 Z" fill="#6b4a2a"/>
      <path d="M124 122 Q146 100 168 122 Z" fill="#7a8a96"/><ellipse cx="146" cy="122" rx="26" ry="4" fill="#5f6f7a"/>
      <path d="M124 118 q-14 -14 -20 2 q10 4 20 -2 M168 118 q14 -14 20 2 q-10 4 -20 -2" fill="#fff" stroke="#bbb" stroke-width=".8"/>
      <path d="M137 130 q3 -3 6 0" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="153" cy="130" r="2.2" fill="#222"/>
      <path d="M138 140 Q146 148 156 139" stroke="#7a3a3a" stroke-width="2.4" fill="#fff" stroke-linecap="round"/>
    </g>
  </svg>`,
};

const TICK = {
  meduse(el, root) { root.classList.toggle('stoned', el >= 16.8) },
  sisyphe(el, root) {
    const pct = el < 1 ? 0 : el < 15 ? (el - 1) / 14 * 99 : el < 17 ? 99 * (1 - (el - 15) / 2) : 0;
    const kRock = pct / 99, kMan = el < 15 ? kRock : 1;
    const at = k => { const x = 26 + k * 122, y = 290 - (x / 165) * 150; return [x, y - 21] };
    const q = s => root.querySelector(s);
    const bar = q('.sc-bar'); if (bar) bar.setAttribute('width', String(Math.max(1, 138 * pct / 100)));
    const p = q('.sc-pct'); if (p) p.textContent = Math.round(pct) + ' %';
    const [rx, ry] = at(kRock), [mx, my] = at(kMan);
    const r = q('[data-k=rock]'); if (r) r.setAttribute('transform', `translate(${rx} ${ry})`);
    const sp = q('[data-k=rockspin]'); if (sp) sp.setAttribute('transform', `rotate(${kRock * 760})`);
    const m = q('[data-k=man]'); if (m) m.setAttribute('transform', el < 15 ? `translate(${mx} ${my})` : `translate(${mx - 26} ${my + 4}) scale(-1 1)`);
    const dr = q('[data-k=drop]'); if (dr) dr.style.opacity = (el > 9 && el < 15 && Math.floor(el * 2) % 2) ? 1 : 0;
    root.classList.toggle('done', el >= 15);
  },
  cresus(el, root) { const h = root.querySelector('[data-k=happy]'), s = root.querySelector('[data-k=sad]'); if (h && s) { const sad = el >= 11; h.style.display = sad ? 'none' : ''; s.style.display = sad ? '' : 'none' } root.classList.toggle('sad', el >= 11) },
};

window.TGScenes = {
  html(id, el) { const f = ART[id]; return `<div class="sc" style="--el:${el.toFixed(2)}s">${f ? f() : ''}</div>` },
  tick(id, el, root) { if (TICK[id] && root) TICK[id](el, root) },
};
})();
