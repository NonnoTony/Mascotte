/*!
 * Mascotte.js — una piccola mascotte animata per la chat.
 * Passa, sbircia, balla, dorme e reagisce quando la tocchi.
 * Nessuna dipendenza. Uso:
 *   const m = new Mascotte({ container: '#chat' });
 *   m.onMessage('balla!');   // reagisce ai messaggi della chat
 */
(function (global) {
  'use strict';

  const CANCEL = Symbol('cancel');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const weighted = (entries) => {
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [v, w] of entries) if ((r -= w) < 0) return v;
    return entries[0][0];
  };

  const ACTION_CLASSES = [
    'is-walking', 'is-dancing', 'is-waving', 'is-jumping', 'is-squish',
    'is-spinning', 'is-shaking', 'is-sleeping', 'is-stretching', 'is-blush', 'is-dragging',
  ];

  const PHRASES = {
    hello: ['Ciao! 👋', 'Eccomi!', 'Ehilà!', 'Ci sono anch\'io!'],
    peek: ['Bu! 👀', 'Cucù!', 'Chi c\'è qui?', 'Psst…'],
    bye: ['Torno dopo!', 'Ciao ciao!', 'Vado a fare un giro…', 'A dopo! 👋'],
    dance: ['♪ La la la ♪', 'Balliamo! 💃', 'Che ritmo!', 'Guarda che mosse!'],
    tap: ['Ehi! 😄', 'Hihi, solletico!', 'Mi hai toccato!', 'Ancora! 😆', 'Boing!'],
    drag: ['Wheee! 🎈', 'Dove mi porti?', 'Volo!'],
    drop: ['Atterraggio perfetto!', 'Di nuovo! 😆', 'Hop!'],
    fall: ['Ahia… 😵', 'Che botta!', 'Un po\' più piano…'],
    idle: ['Sono qui se ti serve!', 'Bella chat! 💬', 'Toccami! 😄', 'Mi annoio un po\'…', 'Che si dice?', 'Trascinami! 🎈'],
    notice: ['Oh! 👀', 'Interessante!', 'Hmm, capisco…', 'Davvero?!', 'Ooh!'],
  };

  // ---------- Stili ----------
  const CSS = `
.mascotte-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:50}
.mascotte-layer.is-fixed{position:fixed}
.mascotte{position:absolute;bottom:0;left:-200px;width:var(--m-size);height:var(--m-size);pointer-events:auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:none}
.mascotte.is-dragging{cursor:grabbing}
.m-body{width:100%;height:100%;transform-origin:50% 100%}
.m-svg{--al0:15deg;--al1:150deg;--ar0:-15deg;--ar1:-150deg;--w0:-115deg;--w1:-165deg;--sw:20deg;--dl:120deg;--dr:-120deg;
  width:100%;height:100%;overflow:visible;display:block;transform-origin:50% 100%;animation:m-breathe 2.6s ease-in-out infinite}
.m-svg.is-pixel{--al0:0deg;--al1:55deg;--ar0:0deg;--ar1:-55deg;--w0:-15deg;--w1:-65deg;--sw:10deg;--dl:50deg;--dr:-50deg;shape-rendering:crispEdges}
.m-svg *{transform-box:fill-box}
.m-arm-l{transform-origin:100% 12%}
.m-arm-r{transform-origin:0% 12%}
.m-foot{transform-origin:50% 50%}
.m-antenna{transform-origin:15% 100%}
.m-eye{transform-origin:50% 50%;animation:m-blink 4.5s infinite}
.m-pupil{transition:transform .25s ease-out}
.m-cheek{opacity:.45;transition:opacity .3s}
.m-eyes,.m-brows{display:none}
.m-svg[data-eyes=normal] .m-eyes-normal,.m-svg[data-eyes=happy] .m-eyes-happy,.m-svg[data-eyes=closed] .m-eyes-closed,
.m-svg[data-eyes=x] .m-eyes-x,.m-svg[data-eyes=heart] .m-eyes-heart,.m-svg[data-mood=angry] .m-brows{display:inline}
.m-svg[data-mood=surprised] .m-eye{transform:scale(1.12)}
.m-svg.is-pixel .m-arm-l{transform-origin:100% 50%}
.m-svg.is-pixel .m-arm-r{transform-origin:0% 50%}
.m-svg.is-pixel .m-cheek{opacity:0}
.is-blush .m-cheek,.m-svg[data-mood=love] .m-cheek{opacity:1}
.is-blush .m-svg.is-pixel .m-cheek,.m-svg.is-pixel[data-mood=love] .m-cheek{opacity:.9}

.is-walking .m-body{animation:m-bob .4s ease-in-out infinite}
.is-walking .m-foot-l{animation:m-step .4s ease-in-out infinite}
.is-walking .m-foot-r{animation:m-step .4s ease-in-out -.2s infinite}
.is-walking .m-arm-l,.is-walking .m-arm-r{animation:m-swing .4s ease-in-out infinite alternate}
.is-dancing .m-body{animation:m-dance .8s ease-in-out infinite}
.is-dancing .m-arm-l{animation:m-arm-l-up .4s ease-in-out infinite alternate}
.is-dancing .m-arm-r{animation:m-arm-r-up .4s ease-in-out infinite alternate-reverse}
.is-dancing .m-antenna{animation:m-wiggle .2s ease-in-out infinite alternate}
.is-dancing .m-foot-l{animation:m-step .4s ease-in-out infinite}
.is-dancing .m-foot-r{animation:m-step .4s ease-in-out -.2s infinite}
.is-waving .m-arm-r{animation:m-wave .3s ease-in-out infinite alternate}
.is-waving .m-body{animation:m-tilt 1.2s ease-in-out infinite alternate}
.is-jumping .m-body{animation:m-jump .9s cubic-bezier(.3,.7,.4,1)}
.is-jumping .m-arm-l{animation:m-arm-l-up .45s ease-in-out 2 alternate}
.is-jumping .m-arm-r{animation:m-arm-r-up .45s ease-in-out 2 alternate}
.is-squish .m-body{animation:m-squish .55s ease-out}
.is-spinning .m-body{animation:m-spin 1.1s ease-in-out;transform-origin:50% 60%}
.is-shaking .m-body{animation:m-shake .25s linear 5}
.is-sleeping .m-body{transform:rotate(-7deg) translateY(3px);transition:transform .6s}
.is-sleeping .m-svg{animation:m-breathe 3.8s ease-in-out infinite}
.is-sleeping .m-antenna{transform:rotate(35deg);transition:transform .6s}
.is-stretching .m-body{animation:m-stretch 1.6s ease-in-out}
.is-stretching .m-arm-l{animation:m-arm-l-up .8s ease-in-out 2 alternate}
.is-stretching .m-arm-r{animation:m-arm-r-up .8s ease-in-out 2 alternate}
.is-dragging .m-body{animation:m-dangle .45s ease-in-out infinite alternate;transform-origin:50% 0}
.is-dragging .m-foot-l{animation:m-step .25s ease-in-out infinite}
.is-dragging .m-foot-r{animation:m-step .25s ease-in-out -.12s infinite}
.is-dragging .m-arm-l{transform:rotate(var(--dl))}
.is-dragging .m-arm-r{transform:rotate(var(--dr))}

.m-bubble{position:absolute;bottom:calc(100% + 8px);left:50%;width:max-content;max-width:210px;
  transform:translate(calc(-50% + var(--shift,0px)),6px) scale(.85);transform-origin:50% 100%;opacity:0;
  transition:opacity .2s,transform .2s;background:#fff;color:#2d2d3a;font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;
  padding:8px 12px;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,.18);pointer-events:none;text-align:center}
.m-bubble.show{opacity:1;transform:translate(calc(-50% + var(--shift,0px)),0) scale(1)}
.m-bubble::after{content:"";position:absolute;top:100%;left:calc(50% - var(--shift,0px));margin-left:-7px;border:7px solid transparent;border-top-color:#fff}
.m-particle{position:absolute;pointer-events:none;font-size:20px;line-height:1;color:#ff6b9a;font-weight:700;
  animation:m-particle 1.5s ease-out forwards;text-shadow:0 1px 2px rgba(0,0,0,.15)}

@keyframes m-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97)}}
@keyframes m-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes m-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-7px) rotate(4deg)}}
@keyframes m-step{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes m-swing{from{transform:rotate(calc(var(--sw) * -1))}to{transform:rotate(var(--sw))}}
@keyframes m-dance{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-10px,-12px) rotate(-12deg)}50%{transform:translate(0,0) scale(1.08,.92)}75%{transform:translate(10px,-12px) rotate(12deg)}}
@keyframes m-arm-l-up{from{transform:rotate(var(--al0))}to{transform:rotate(var(--al1))}}
@keyframes m-arm-r-up{from{transform:rotate(var(--ar0))}to{transform:rotate(var(--ar1))}}
@keyframes m-wave{from{transform:rotate(var(--w0))}to{transform:rotate(var(--w1))}}
@keyframes m-wiggle{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
@keyframes m-tilt{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes m-jump{0%{transform:translateY(0) scale(1,1)}15%{transform:translateY(0) scale(1.2,.8)}45%{transform:translateY(-75px) scale(.9,1.12)}60%{transform:translateY(-75px) scale(1,1)}88%{transform:translateY(0) scale(1.18,.84)}100%{transform:translateY(0) scale(1,1)}}
@keyframes m-squish{0%{transform:scale(1,1)}25%{transform:scale(1.3,.7)}50%{transform:scale(.85,1.18)}75%{transform:scale(1.07,.94)}100%{transform:scale(1,1)}}
@keyframes m-spin{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}
@keyframes m-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px) rotate(-5deg)}75%{transform:translateX(7px) rotate(5deg)}}
@keyframes m-stretch{0%,100%{transform:scale(1,1)}40%,60%{transform:scale(.9,1.15)}}
@keyframes m-dangle{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
@keyframes m-particle{0%{opacity:0;transform:translate(-50%,0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),-85px) scale(1.25) rotate(var(--rot))}}
@media (prefers-reduced-motion:reduce){.m-svg,.m-eye{animation:none}}
`;

  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const style = document.createElement('style');
    style.id = 'mascotte-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---------- Disegno (SVG originale) ----------
  let uid = 0;
  function svgMarkup(c) {
    const id = 'mg' + ++uid;
    const ink = '#2d2d3a';
    return `
<svg class="m-svg" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="${id}" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="${c.light}"/><stop offset="1" stop-color="${c.main}"/>
    </radialGradient>
  </defs>
  <ellipse cx="60" cy="116" rx="30" ry="4" fill="rgba(0,0,0,.15)"/>
  <g class="m-foot m-foot-l"><ellipse cx="45" cy="107" rx="11" ry="7" fill="${c.dark}"/></g>
  <g class="m-foot m-foot-r"><ellipse cx="75" cy="107" rx="11" ry="7" fill="${c.dark}"/></g>
  <g class="m-arm m-arm-l"><ellipse cx="22" cy="76" rx="7" ry="13" fill="${c.main}"/></g>
  <g class="m-arm m-arm-r"><ellipse cx="98" cy="76" rx="7" ry="13" fill="${c.main}"/></g>
  <g class="m-antenna">
    <path d="M60 32 Q56 18 65 11" stroke="${c.dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="65" cy="11" r="5.5" fill="${c.accent}"/>
  </g>
  <ellipse cx="60" cy="68" rx="40" ry="40" fill="url(#${id})"/>
  <ellipse cx="60" cy="88" rx="23" ry="15" fill="#fff" opacity=".35"/>
  <ellipse class="m-cheek" cx="33" cy="75" rx="6.5" ry="3.8" fill="#ff7b9c"/>
  <ellipse class="m-cheek" cx="87" cy="75" rx="6.5" ry="3.8" fill="#ff7b9c"/>
  <g class="m-eyes m-eyes-normal">
    <g class="m-eye"><ellipse cx="46" cy="60" rx="8" ry="10" fill="#fff"/>
      <g class="m-pupil"><circle cx="46" cy="61" r="5" fill="${ink}"/><circle cx="48" cy="58.5" r="1.7" fill="#fff"/></g></g>
    <g class="m-eye"><ellipse cx="74" cy="60" rx="8" ry="10" fill="#fff"/>
      <g class="m-pupil"><circle cx="74" cy="61" r="5" fill="${ink}"/><circle cx="76" cy="58.5" r="1.7" fill="#fff"/></g></g>
  </g>
  <g class="m-eyes m-eyes-happy" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round">
    <path d="M38 63 Q46 52 54 63"/><path d="M66 63 Q74 52 82 63"/>
  </g>
  <g class="m-eyes m-eyes-closed" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round">
    <path d="M38 60 Q46 67 54 60"/><path d="M66 60 Q74 67 82 60"/>
  </g>
  <g class="m-eyes m-eyes-x" stroke="${ink}" stroke-width="3.5" stroke-linecap="round">
    <path d="M40 54 L52 66 M52 54 L40 66"/><path d="M68 54 L80 66 M80 54 L68 66"/>
  </g>
  <g class="m-eyes m-eyes-heart" fill="#ff3d6e">
    <path d="M46 69 C33 60 37 48 46 55 C55 48 59 60 46 69 Z"/><path d="M74 69 C61 60 65 48 74 55 C83 48 87 60 74 69 Z"/>
  </g>
  <g class="m-brows" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"><path d="M37 46 L53 52"/><path d="M83 46 L67 52"/></g>
  <path class="m-mouth" stroke="#5a2424" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  }


  // Personaggio in pixel art: griglia 12x8, 1 pixel = 10 unità
  function rects(list, extra = '') {
    return list.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`).join('');
  }
  function pixelEyes(fn) { return fn(30) + fn(80); } // x sinistro dei due occhi
  function pixelMarkup(c) {
    const ink = '#141414';
    const heart = (x) => rects([[x - 2, 41, 3, 3], [x + 4, 41, 3, 3], [x - 2, 44, 9, 3], [x + 1, 47, 3, 3]]);
    return `
<svg class="m-svg is-pixel" viewBox="0 0 120 120" aria-hidden="true">
  <rect x="22" y="112" width="76" height="4" fill="rgba(0,0,0,.18)"/>
  <g class="m-foot m-foot-l" fill="${c.main}">${rects([[20, 88, 10, 22], [70, 88, 10, 22]])}</g>
  <g class="m-foot m-foot-r" fill="${c.main}">${rects([[40, 88, 10, 22], [90, 88, 10, 22]])}</g>
  <g class="m-arm m-arm-l"><rect x="0" y="50" width="22" height="20" fill="${c.main}"/></g>
  <g class="m-arm m-arm-r"><rect x="98" y="50" width="22" height="20" fill="${c.main}"/></g>
  <rect x="20" y="30" width="80" height="60" fill="${c.main}"/>
  <g class="m-cheek" fill="#ff8fa8">${rects([[22, 58, 8, 5], [90, 58, 8, 5]])}</g>
  <g class="m-eyes m-eyes-normal">
    <g class="m-eye"><g class="m-pupil"><rect x="30" y="40" width="10" height="10" fill="${ink}"/></g></g>
    <g class="m-eye"><g class="m-pupil"><rect x="80" y="40" width="10" height="10" fill="${ink}"/></g></g>
  </g>
  <g class="m-eyes m-eyes-happy" fill="${ink}">${pixelEyes((x) => rects([[x - 3, 45, 4, 4], [x + 1, 41, 8, 4], [x + 9, 45, 4, 4]]))}</g>
  <g class="m-eyes m-eyes-closed" fill="${ink}">${pixelEyes((x) => rects([[x - 2, 45, 14, 4]]))}</g>
  <g class="m-eyes m-eyes-x" fill="${ink}">${pixelEyes((x) => rects([[x - 2, 38, 4, 4], [x + 8, 38, 4, 4], [x + 3, 43, 4, 4], [x - 2, 48, 4, 4], [x + 8, 48, 4, 4]]))}</g>
  <g class="m-eyes m-eyes-heart" fill="#ff3d6e">${pixelEyes(heart)}</g>
  <g class="m-brows" fill="${ink}">${rects([[28, 32, 6, 4], [34, 35, 6, 4], [86, 32, 6, 4], [80, 35, 6, 4]])}</g>
  <path class="m-mouth" fill="${ink}"/>
</svg>`;
  }
  const PIXEL_MOUTHS = {
    smile: { d: '', fill: 'none' }, frown: { d: '', fill: 'none' }, wavy: { d: '', fill: 'none' }, small: { d: '', fill: 'none' },
    laugh: { d: 'M50 62h20v4h-4v4h-12v-4h-4z', fill: '#141414' },
    o: { d: 'M55 62h10v10h-10z', fill: '#141414' },
  };

  const FACES = {
    neutral: ['normal', 'smile'], happy: ['happy', 'laugh'], surprised: ['normal', 'o'],
    dizzy: ['x', 'wavy'], sleep: ['closed', 'small'], love: ['heart', 'laugh'],
    angry: ['normal', 'frown'], sad: ['normal', 'frown'],
  };
  const MOUTHS = {
    smile: { d: 'M50 80 Q60 89 70 80', fill: 'none' },
    laugh: { d: 'M48 78 Q60 97 72 78 Z', fill: '#7a2e2e' },
    o: { d: 'M60 77 C67 77 67 90 60 90 C53 90 53 77 60 77 Z', fill: '#7a2e2e' },
    frown: { d: 'M51 87 Q60 79 69 87', fill: 'none' },
    wavy: { d: 'M48 84 Q54 79 60 84 Q66 89 72 84', fill: 'none' },
    small: { d: 'M56 83 Q60 85.5 64 83', fill: 'none' },
  };

  const COLORS = {
    pallino: { main: '#ff9f43', light: '#ffd98a', dark: '#e07a1f', accent: '#ff5e7e' },
    pixel: { main: '#d97757' },
  };

  // ---------- Classe ----------
  class Mascotte {
    constructor(options = {}) {
      this.o = Object.assign({
        container: document.body,
        name: 'Clawd',
        character: 'pixel', // 'pixel' oppure 'pallino'
        size: 96,
        minDelay: 5000,   // pausa minima tra un'azione e l'altra (ms)
        maxDelay: 12000,  // pausa massima
        speed: 110,       // px al secondo quando cammina
        autoStart: true,
        colors: {},
        phrases: {},
      }, options);
      this.P = Object.assign({}, PHRASES, this.o.phrases);
      this.pixel = this.o.character !== 'pallino';
      this.colors = Object.assign({}, COLORS[this.pixel ? 'pixel' : 'pallino'], this.o.colors);
      this.token = 0;
      this.busy = false;
      this.state = 'hidden';
      this.taps = [];
      this.sulkUntil = 0;
      injectCSS();
      this._build();
      this._bind();
      if (this.o.autoStart) this.start();
    }

    // ----- costruzione DOM -----
    _build() {
      let host = this.o.container;
      if (typeof host === 'string') host = document.querySelector(host);
      this.host = host || document.body;
      const isBody = this.host === document.body;
      if (!isBody && getComputedStyle(this.host).position === 'static') this.host.style.position = 'relative';

      this.layer = document.createElement('div');
      this.layer.className = 'mascotte-layer' + (isBody ? ' is-fixed' : '');
      this.el = document.createElement('div');
      this.el.className = 'mascotte';
      this.el.style.setProperty('--m-size', this.o.size + 'px');
      this.el.setAttribute('role', 'button');
      this.el.setAttribute('tabindex', '0');
      this.el.setAttribute('aria-label', `${this.o.name}, la mascotte. Toccala!`);
      this.el.innerHTML = `<div class="m-bubble" role="status" aria-live="polite"></div><div class="m-body">${this.pixel ? pixelMarkup(this.colors) : svgMarkup(this.colors)}</div>`;
      this.layer.appendChild(this.el);
      this.host.appendChild(this.layer);

      this.bubble = this.el.querySelector('.m-bubble');
      this.svg = this.el.querySelector('.m-svg');
      this.mouth = this.el.querySelector('.m-mouth');
      this.pupils = [...this.el.querySelectorAll('.m-pupil')];
      this.setFace('neutral');
      this._place(-this.o.size - 60);
    }

    _bind() {
      const el = this.el;
      // Gli occhi seguono il puntatore
      this._onMove = (e) => {
        if (this.lookLock || this.state === 'sleep' || this.state === 'hidden') return;
        const r = el.getBoundingClientRect();
        let dx = e.clientX - (r.left + r.width / 2);
        let dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 140);
        this.lookAt((dx / d) * k, (dy / d) * k);
      };
      document.addEventListener('pointermove', this._onMove, { passive: true });

      // Tocco, pressione lunga, trascinamento
      el.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        this.press = { x: e.clientX, y: e.clientY, moved: false, long: false };
        clearTimeout(this.pressTimer);
        this.pressTimer = setTimeout(() => {
          if (this.press && !this.press.moved) {
            this.press.long = true;
            this.run((c) => this._love(c));
          }
        }, 600);
      });
      el.addEventListener('pointermove', (e) => {
        const p = this.press;
        if (!p) return;
        if (!p.moved && !p.long && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) {
          p.moved = true;
          clearTimeout(this.pressTimer);
          this.run((c) => this._drag(c));
        }
        if (p.moved && this.dragging) this._dragTo(e.clientX, e.clientY);
      });
      const end = () => {
        const p = this.press;
        this.press = null;
        clearTimeout(this.pressTimer);
        if (!p) return;
        if (p.moved) { if (this._dragRelease) this._dragRelease(); }
        else if (!p.long) this._onTap();
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._onTap(); }
      });

      this._onResize = () => {
        if (this.state === 'hidden' || this.busy) return;
        const max = this._w() - this.o.size;
        if (this.x > max) this._place(Math.max(0, max));
      };
      window.addEventListener('resize', this._onResize);
    }

    // ----- utilità -----
    _w() { return this.layer.clientWidth; }
    _h() { return this.layer.clientHeight; }
    _place(x) {
      this.el.style.transition = 'none';
      this.el.style.left = x + 'px';
      this.x = x;
      void this.el.offsetWidth;
    }

    setFace(mood) {
      const [eyes, m] = FACES[mood] || FACES.neutral;
      this.svg.dataset.eyes = eyes;
      this.svg.dataset.mood = mood;
      const mo = (this.pixel ? PIXEL_MOUTHS : MOUTHS)[m];
      this.mouth.setAttribute('d', mo.d);
      this.mouth.setAttribute('fill', mo.fill);
    }

    lookAt(dx, dy) {
      const k = this.pixel ? 2.5 : 3;
      for (const p of this.pupils) p.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    }

    say(text, ms = 2400) {
      const b = this.bubble;
      b.textContent = text;
      b.style.setProperty('--shift', '0px');
      b.classList.add('show');
      // tieni il fumetto dentro lo schermo
      const lr = this.layer.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      let shift = 0;
      if (br.left < lr.left + 6) shift = lr.left + 6 - br.left;
      else if (br.right > lr.right - 6) shift = lr.right - 6 - br.right;
      b.style.setProperty('--shift', shift + 'px');
      clearTimeout(this.sayTimer);
      this.sayTimer = setTimeout(() => b.classList.remove('show'), ms);
    }

    _particle(ch) {
      const lr = this.layer.getBoundingClientRect();
      const r = this.el.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'm-particle';
      s.textContent = ch;
      s.style.left = r.left - lr.left + r.width / 2 + rand(-22, 22) + 'px';
      s.style.top = r.top - lr.top + r.height * 0.1 + 'px';
      s.style.setProperty('--dx', rand(-35, 35) + 'px');
      s.style.setProperty('--rot', rand(-30, 30) + 'deg');
      s.addEventListener('animationend', () => s.remove());
      this.layer.appendChild(s);
    }
    _burst(chars, n = 6) {
      for (let i = 0; i < n; i++) setTimeout(() => this._particle(pick(chars)), i * 90);
    }

    // ----- motore delle azioni -----
    _interrupt() {
      this.token++;
      const cs = getComputedStyle(this.el);
      const left = parseFloat(cs.left);
      const tf = cs.transform;
      this.el.style.transition = 'none';
      if (!isNaN(left)) { this.el.style.left = left + 'px'; this.x = left; }
      this.el.style.transform = tf === 'none' ? '' : tf;
      this.el.classList.remove(...ACTION_CLASSES);
      this.lookLock = false;
    }

    run(fn) {
      this._interrupt();
      clearTimeout(this.timer);
      const token = this.token;
      const ctx = {
        wait: async (ms) => { await sleep(ms); if (token !== this.token) throw CANCEL; },
        alive: () => token === this.token,
      };
      this.busy = true;
      return Promise.resolve()
        .then(() => fn(ctx))
        .catch((e) => { if (e !== CANCEL) console.error(e); })
        .finally(() => {
          if (token !== this.token) return;
          this.busy = false;
          this.lookLock = false;
          if (this.state !== 'hidden') { this.setFace('neutral'); this.lookAt(0, 0); }
          this._schedule();
        });
    }

    async _anim(ctx, cls, ms) {
      this.el.classList.remove(cls);
      void this.el.offsetWidth;
      this.el.classList.add(cls);
      try { await ctx.wait(ms); } finally { if (ctx.alive()) this.el.classList.remove(cls); }
    }

    async _walkTo(ctx, x, speed = this.o.speed) {
      const d = Math.abs(x - this.x);
      if (d < 2) return;
      const dur = (d / speed) * 1000;
      this.lookLock = true;
      this.lookAt(Math.sign(x - this.x), 0.1);
      this.el.classList.add('is-walking');
      this.el.style.transition = `left ${dur}ms linear`;
      this.el.style.left = x + 'px';
      this.x = x;
      await ctx.wait(dur);
      this.el.classList.remove('is-walking');
      this.el.style.transition = 'none';
      this.lookLock = false;
      this.lookAt(0, 0);
    }

    _hide() {
      this.state = 'hidden';
      this.el.style.transition = 'none';
      this.el.style.transform = '';
      this._place(-this.o.size - 60);
      this.bubble.classList.remove('show');
    }

    async _ensureShown(ctx) {
      if (this.state === 'hidden') {
        const S = this.o.size, W = this._w();
        const fromLeft = Math.random() < 0.5;
        this.el.style.transform = '';
        this._place(fromLeft ? -S - 10 : W + 10);
        this.state = 'walk';
        this.shownAt = Date.now();
        await this._walkTo(ctx, rand(S * 0.3, Math.max(S * 0.3, W - S * 1.3)), this.o.speed * 1.8);
      } else if (this.el.style.transform && this.el.style.transform !== 'none') {
        this.el.style.transition = 'transform .3s ease-out';
        this.el.style.transform = 'translateY(0)';
        await ctx.wait(300);
      }
      // se era stata interrotta mentre entrava/usciva dallo schermo, rientra
      const S = this.o.size, W = this._w();
      if (this.x < -S / 3 || this.x > W - (2 * S) / 3) {
        await this._walkTo(ctx, Math.max(0, Math.min(W - S, this.x)), this.o.speed * 1.8);
      }
      this.state = 'idle';
    }

    // ----- pianificazione autonoma -----
    start() { this.running = true; this._schedule(rand(1200, 2500)); return this; }
    stop() { this.running = false; clearTimeout(this.timer); return this; }

    _schedule(ms) {
      clearTimeout(this.timer);
      if (!this.running) return;
      this.timer = setTimeout(() => this._tick(), ms ?? rand(this.o.minDelay, this.o.maxDelay));
    }

    _tick() {
      if (this.busy || this.dragging || document.hidden) return this._schedule();
      if (this.state === 'hidden') {
        if (Date.now() < this.sulkUntil) return this._schedule();
        return this.run((c) => (Math.random() < 0.45 ? this._peek(c) : this._enter(c)));
      }
      const visibleFor = Date.now() - (this.shownAt || 0);
      const act = weighted([
        ['dance', 3], ['wave', 1.2], ['jump', 2], ['look', 2], ['wander', 3], ['sleep', 1],
        ['spin', 1], ['stretch', 1], ['chat', 2], ['leave', visibleFor > 45000 ? 5 : 0.8],
      ]);
      this.run((c) => this['_' + act](c));
    }

    // ----- azioni -----
    async _enter(ctx) {
      const S = this.o.size, W = this._w();
      const fromLeft = Math.random() < 0.5;
      this.el.style.transform = '';
      this._place(fromLeft ? -S - 10 : W + 10);
      this.state = 'walk';
      this.shownAt = Date.now();
      await this._walkTo(ctx, rand(S * 0.3, Math.max(S * 0.3, W - S * 1.3)));
      this.state = 'idle';
      if (Math.random() < 0.6) {
        this.setFace('happy');
        this.say(pick(this.P.hello));
        await this._anim(ctx, 'is-waving', 1600);
      }
    }

    async _peek(ctx) {
      const S = this.o.size, W = this._w();
      this._place(rand(10, Math.max(10, W - S - 10)));
      this.el.style.transform = 'translateY(110%)';
      void this.el.offsetWidth;
      this.state = 'peek';
      this.shownAt = Date.now();
      this.setFace('surprised');
      this.el.style.transition = 'transform .7s cubic-bezier(.2,.8,.3,1.25)';
      this.el.style.transform = 'translateY(42%)';
      await ctx.wait(800);
      this.lookLock = true;
      this.lookAt(-1, -0.3); await ctx.wait(650);
      this.lookAt(1, -0.3); await ctx.wait(650);
      this.lookAt(0, 0); this.lookLock = false;
      this.setFace('happy');
      this.say(pick(this.P.peek));
      await ctx.wait(1700);
      if (Math.random() < 0.55) {
        this.el.style.transition = 'transform .3s ease-out';
        this.el.style.transform = 'translateY(0)';
        this.state = 'idle';
        await this._anim(ctx, 'is-jumping', 900);
      } else {
        this.setFace('neutral');
        this.el.style.transition = 'transform .5s ease-in';
        this.el.style.transform = 'translateY(110%)';
        await ctx.wait(550);
        this._hide();
      }
    }

    async _leave(ctx, speed) {
      const S = this.o.size, W = this._w();
      this.say(pick(this.P.bye), 1600);
      if (Math.random() < 0.25 && !speed) {
        // si tuffa giù
        this.setFace('happy');
        await this._anim(ctx, 'is-squish', 450);
        this.el.style.transition = 'transform .45s ease-in';
        this.el.style.transform = 'translateY(115%)';
        await ctx.wait(500);
      } else {
        this.state = 'walk';
        const toLeft = this.x + S / 2 < W / 2;
        await this._walkTo(ctx, toLeft ? -S - 20 : W + 20, speed);
      }
      this._hide();
    }

    async _dance(ctx) {
      this.setFace('happy');
      this.say(pick(this.P.dance));
      this.el.classList.add('is-dancing');
      const end = Date.now() + rand(3200, 5200);
      try {
        while (Date.now() < end) {
          this._particle(pick(['♪', '♫', '🎵', '✨']));
          await ctx.wait(420);
        }
      } finally { if (ctx.alive()) this.el.classList.remove('is-dancing'); }
    }

    async _wave(ctx) {
      this.setFace('happy');
      this.say(pick(this.P.hello));
      await this._anim(ctx, 'is-waving', 1800);
    }

    async _jump(ctx) {
      this.setFace('happy');
      const n = Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        this._burst(['✨'], 3);
        await this._anim(ctx, 'is-jumping', 900);
      }
    }

    async _look(ctx) {
      this.lookLock = true;
      this.setFace('surprised');
      this.say('Hmm?', 1400);
      this.lookAt(-1, 0); await ctx.wait(700);
      this.lookAt(1, 0); await ctx.wait(700);
      this.lookAt(0, -1); await ctx.wait(600);
      this.setFace('neutral');
      this.lookAt(0, 0);
      await ctx.wait(300);
    }

    async _wander(ctx) {
      const S = this.o.size, W = this._w();
      this.state = 'walk';
      await this._walkTo(ctx, rand(0, Math.max(0, W - S)));
      this.state = 'idle';
      if (Math.random() < 0.3) await this._anim(ctx, 'is-squish', 550);
    }

    async _sleep(ctx) {
      this.state = 'sleep';
      this.setFace('sleep');
      this.say('Che sonno… 🥱', 1600);
      await ctx.wait(1400);
      this.el.classList.add('is-sleeping');
      const end = Date.now() + rand(7000, 12000);
      while (Date.now() < end) {
        this._particle(pick(['Z', 'z', 'Z']));
        await ctx.wait(1000);
      }
      this.el.classList.remove('is-sleeping');
      this.state = 'idle';
      this.setFace('surprised');
      await ctx.wait(400);
      this.setFace('happy');
      await this._anim(ctx, 'is-stretching', 1600);
    }

    async _spin(ctx) {
      this.setFace('happy');
      this.say('Wiii! 🌀', 1400);
      await this._anim(ctx, 'is-spinning', 1100);
    }

    async _stretch(ctx) {
      this.setFace('happy');
      this.say('Ahhh… 😌', 1600);
      await this._anim(ctx, 'is-stretching', 1600);
    }

    async _chat(ctx) {
      this.setFace('happy');
      this.say(pick(this.P.idle), 2600);
      await this._anim(ctx, 'is-squish', 550);
      await ctx.wait(1200);
    }

    async _notice(ctx) {
      this.lookLock = true;
      this.lookAt(0, -1);
      this.setFace('surprised');
      this.say(pick(this.P.notice), 1800);
      await this._anim(ctx, 'is-jumping', 900);
      await ctx.wait(600);
    }

    async _come(ctx) {
      this.setFace('happy');
      this.say('Eccomi! 😄');
      await this._anim(ctx, 'is-waving', 1600);
    }

    // ----- reazioni al tocco -----
    _onTap() {
      const now = Date.now();
      this.taps = this.taps.filter((t) => now - t < 2500);
      this.taps.push(now);
      const n = this.taps.length;
      if (n >= 7) { this.taps = []; return this.run((c) => this._angry(c)); }
      if (n >= 4) return this.run((c) => this._dizzy(c));
      if (this.state === 'sleep') return this.run((c) => this._wake(c));
      if (this.state === 'peek') return this.run((c) => this._caught(c));
      this.run((c) => this._react(c));
    }

    async _react(ctx) {
      await this._ensureShown(ctx);
      const r = Math.random();
      if (r < 0.45) {
        this.setFace('happy');
        this.say(pick(this.P.tap), 1500);
        this._burst(['✨', '⭐'], 3);
        await this._anim(ctx, 'is-squish', 550);
      } else if (r < 0.7) {
        this.setFace('surprised');
        this.say('Eek! 😲', 1300);
        await this._anim(ctx, 'is-jumping', 900);
      } else if (r < 0.85) {
        this.setFace('happy');
        this.el.classList.add('is-blush');
        this.say('Hihi 😊', 1500);
        await this._anim(ctx, 'is-squish', 550);
        await ctx.wait(700);
      } else {
        await this._spin(ctx);
      }
      await ctx.wait(500);
    }

    async _caught(ctx) {
      this.setFace('surprised');
      this.say('Mi hai trovato! 🙈', 1800);
      this.el.style.transition = 'transform .25s ease-out';
      this.el.style.transform = 'translateY(0)';
      this.state = 'idle';
      await this._anim(ctx, 'is-jumping', 900);
      this.setFace('happy');
      await ctx.wait(700);
    }

    async _wake(ctx) {
      this.state = 'idle';
      this.setFace('surprised');
      this.say('Eh?! Non stavo dormendo! 😳', 2000);
      await this._anim(ctx, 'is-jumping', 900);
      await ctx.wait(600);
    }

    async _dizzy(ctx) {
      await this._ensureShown(ctx);
      this.setFace('dizzy');
      this.say('Mi gira la testa… 😵‍💫', 2000);
      await this._anim(ctx, 'is-spinning', 1100);
      this._burst(['⭐', '💫'], 4);
      await ctx.wait(1300);
    }

    async _angry(ctx) {
      await this._ensureShown(ctx);
      this.setFace('angry');
      this.say('Ora basta! 😤', 1800);
      this._burst(['💢'], 3);
      await this._anim(ctx, 'is-shaking', 1250);
      this.sulkUntil = Date.now() + 15000;
      await this._leave(ctx, this.o.speed * 2.5);
    }

    async _love(ctx) {
      await this._ensureShown(ctx);
      this.setFace('love');
      this.say(pick(['Coccole! 🥰', 'Ti voglio bene! 💕', 'Che bello! 💖']), 2000);
      this._burst(['❤️', '💕', '💖'], 7);
      await this._anim(ctx, 'is-squish', 550);
      await ctx.wait(1500);
    }

    async _drag(ctx) {
      this.dragging = true;
      this.state = 'idle';
      this.shownAt = this.shownAt || Date.now();
      this.el.style.transform = '';
      this.el.classList.add('is-dragging');
      this.setFace('surprised');
      this.say(pick(this.P.drag), 1500);
      await new Promise((r) => (this._dragRelease = r));
      this._dragRelease = null;
      this.dragging = false;
      this.el.classList.remove('is-dragging');
      // caduta
      const h = parseFloat(this.el.style.bottom) || 0;
      const dur = Math.min(700, 180 + Math.sqrt(h) * 28);
      this.el.style.transition = `bottom ${dur}ms cubic-bezier(.55,0,1,.45)`;
      this.el.style.bottom = '0px';
      await ctx.wait(dur);
      const hard = h > 140;
      this.setFace(hard ? 'dizzy' : 'happy');
      this.say(pick(hard ? this.P.fall : this.P.drop), 1800);
      await this._anim(ctx, 'is-squish', 550);
      await ctx.wait(900);
    }

    _dragTo(cx, cy) {
      const S = this.o.size, lr = this.layer.getBoundingClientRect();
      const x = Math.max(-S / 3, Math.min(lr.width - (2 * S) / 3, cx - lr.left - S / 2));
      const b = Math.max(0, Math.min(lr.height - S - 64, lr.bottom - cy - S * 0.2));
      this.el.style.transition = 'none';
      this.el.style.left = x + 'px';
      this.el.style.bottom = b + 'px';
      this.x = x;
    }

    // ----- API pubblica -----
    /** Esegue un'azione: dance, wave, jump, sleep, spin, stretch, love, come, leave, look */
    do(action) {
      if (action === 'leave') return this.state === 'hidden' ? null : this.run((c) => this._leave(c));
      const fn = this['_' + action];
      if (!fn) return null;
      return this.run(async (c) => { await this._ensureShown(c); await fn.call(this, c); });
    }
    dance() { return this.do('dance'); }
    wave() { return this.do('wave'); }
    jump() { return this.do('jump'); }
    sleep() { return this.do('sleep'); }
    spin() { return this.do('spin'); }
    love() { return this.do('love'); }
    come() { return this.do('come'); }
    leave() { return this.do('leave'); }

    /** Fai reagire la mascotte a un messaggio della chat. */
    onMessage(text) {
      const t = String(text || '').toLowerCase();
      const has = (...w) => w.some((x) => t.includes(x));
      if (has('vai via', 'sparisci', 'ciao ciao', 'addio', 'nasconditi')) return this.do('leave');
      if (has('balla', 'ballo', 'musica', 'dance')) return this.do('dance');
      if (has('salta', 'jump')) return this.do('jump');
      if (has('dormi', 'buonanotte', 'sonno', 'nanna')) return this.do('sleep');
      if (has('gira', 'piroetta', 'spin')) return this.do('spin');
      if (has('ti voglio bene', 'ti amo', 'coccol', '❤', '😍', '🥰')) return this.do('love');
      if (has('ciao', 'salve', 'buongiorno', 'buonasera', 'hey')) return this.do('wave');
      if (has('vieni', 'dove sei', this.o.name.toLowerCase())) return this.do('come');
      if (this.state === 'hidden' || this.busy) return null;
      if (Math.random() < 0.35) return this.run((c) => this._notice(c));
      return null;
    }

    destroy() {
      this.stop();
      this.token++;
      document.removeEventListener('pointermove', this._onMove);
      window.removeEventListener('resize', this._onResize);
      this.layer.remove();
    }
  }

  global.Mascotte = Mascotte;
  if (typeof module === 'object' && module.exports) module.exports = Mascotte;
})(typeof window !== 'undefined' ? window : this);
