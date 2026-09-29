/*!
 * ShapemaxLoader — animation de chargement du logo Shapemax
 * Couleurs alignées sur la charte du site (css/style.css) :
 *   fond clair #FFFFFF / encre #1B1B1B / accent #FF5522
 *   fond sombre #1B1B1B / encre #F5F5F5 / accent #FF5522
 *
 * Aucune dépendance. Le CSS et le SVG sont injectés par le script.
 *
 * ─────────────────────────────────────────────────────────────
 *  1) SITE WEB : rideau plein écran, disparaît quand la page est chargée
 * ─────────────────────────────────────────────────────────────
 *  Place ce script tout en haut du <head> (ou du <body>) :
 *
 *    <script src="js/logo-loader.js" data-mode="web" data-theme="auto"></script>
 *
 *  ou en JS :
 *
 *    ShapemaxLoader.web({ theme: 'light' });
 *
 * ─────────────────────────────────────────────────────────────
 *  2) APPLICATION : splash discret + barre de progression
 * ─────────────────────────────────────────────────────────────
 *    const splash = ShapemaxLoader.app({ theme: 'dark', label: 'Chargement…' });
 *    splash.progress(0.4);            // optionnel (sinon barre indéterminée)
 *    splash.text('Synchronisation…'); // optionnel
 *    await splash.hide();             // à appeler quand l'app est prête
 *
 *  Pour l'afficher dans un conteneur plutôt qu'en plein écran :
 *    ShapemaxLoader.app({ target: '#app-root' });
 *
 * ─────────────────────────────────────────────────────────────
 *  Options communes
 * ─────────────────────────────────────────────────────────────
 *    theme        'light' (fond clair, logo foncé) | 'dark' (fond foncé, logo clair) | 'auto'
 *    minDuration  durée minimale d'affichage en ms
 *    background   couleur de fond CSS      (ex. '#fff')
 *    color        couleur du corps du logo (ex. '#1B1B1B')
 *    accent       couleur de la bande orange (ex. '#FF5522')
 *    head         couleur de la tête        (ex. '#A4BDFC')
 *    size         taille du logo           (ex. 120 ou '10vw')
 *    onHidden     fonction appelée une fois le loader retiré
 *
 *  Options web  : autoHide (true), maxDuration (12000), autoProgress (true)
 *  Options app  : target (null = plein écran), label ('')
 */
(function (global) {
  'use strict';

  var P = 'smx';
  var STYLE_ID = P + '-style';

  /* Logo : mêmes proportions que les fichiers PNG fournis (viewBox 320 × 301).
     Ordre de dessin : tête, corps, bande orange par-dessus. */
  var LOGO =
    '<svg class="smx-logo" viewBox="0 0 320 301" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<circle class="smx-head" cx="242" cy="97" r="48"/>' +
    '<path class="smx-body" d="M2 300L162 128L318 300H230L165 220L100 300Z"/>' +
    '<polygon class="smx-band" points="50,0 138,0 299,180 299,276"/>' +
    '</svg>';

  var CSS = `
.smx{
  --smx-bg:#FFFFFF; --smx-ink:#1B1B1B; --smx-accent:#FF5522; --smx-head:#A4BDFC;
  position:fixed; inset:0; z-index:2147483000;
  display:grid; place-items:center;
  background:var(--smx-bg); color:var(--smx-ink);
  overflow:hidden; box-sizing:border-box;
}
.smx--dark{ --smx-bg:#1B1B1B; --smx-ink:#F5F5F5; }
.smx--contained{ position:absolute; z-index:50; }
.smx--web{ --smx-size:clamp(96px,14vw,148px); }
.smx--app{ --smx-size:76px; }

.smx__stage{ display:flex; flex-direction:column; align-items:center; gap:26px; }
.smx-logo{ display:block; width:var(--smx-size); height:auto; overflow:visible; }
.smx-head,.smx-body,.smx-band{ transform-box:fill-box; }
.smx-head{ fill:var(--smx-head); transform-origin:50% 50%; }
.smx-body{ fill:var(--smx-ink); clip-path:inset(100% 0 0 0); }
.smx-band{ fill:var(--smx-accent); transform-origin:50% 50%; }

/* ── Version WEB : le logo se construit pièce par pièce, puis respire ──
   Le chevron se révèle par un fondu-balayage (clip-path) du bas vers le haut :
   sa silhouette reste nette du premier au dernier instant, sans déformation. */
.smx--web .smx-body{ animation:smx-body-in .7s cubic-bezier(.22,.75,.24,1) .05s both; }
.smx--web .smx-head{ animation:smx-head-in .7s cubic-bezier(.3,1.5,.5,1) .35s both,
                                smx-bob 1.4s ease-in-out 1.6s infinite alternate; }
.smx--web .smx-band{ animation:smx-band-in .9s cubic-bezier(.16,1,.3,1) .6s both,
                                smx-scan 1.4s ease-in-out 1.75s infinite alternate; }

.smx__line{
  position:absolute; top:0; left:0; width:100%; height:3px;
  background:var(--smx-accent); transform-origin:0 50%; transform:scaleX(0);
  transition:transform .35s linear, opacity .2s ease;
}

/* sortie WEB : le rideau se lève, le logo s'efface avant lui */
.smx--web{ clip-path:inset(0 0 0 0); transition:clip-path .9s cubic-bezier(.76,0,.24,1); }
.smx--web.smx--out{ clip-path:inset(0 0 100% 0); }
.smx--web.smx--out .smx__stage{ opacity:0; transform:translateY(-14px) scale(.94);
  transition:opacity .35s ease, transform .55s ease; }
.smx--web.smx--out .smx__line{ opacity:0; }

/* ── Version APPLICATION : plus courte, plus discrète ── */
.smx--app .smx-body{ animation:smx-body-in .4s cubic-bezier(.22,.75,.24,1) both; }
.smx--app .smx-head{ animation:smx-head-in .45s cubic-bezier(.3,1.5,.5,1) .12s both,
                                smx-bob 1.1s ease-in-out .9s infinite alternate; }
.smx--app .smx-band{ animation:smx-band-in .55s cubic-bezier(.16,1,.3,1) .22s both,
                                smx-scan 1.1s ease-in-out 1s infinite alternate; }

.smx__bar{
  position:relative; width:120px; height:3px; border-radius:3px; overflow:hidden;
  background:rgba(127,127,127,.25);
  background:color-mix(in srgb, var(--smx-ink) 14%, transparent);
}
.smx__bar > i{
  display:block; height:100%; border-radius:inherit; background:var(--smx-accent);
  transform-origin:0 50%; transform:scaleX(var(--smx-p,0)); transition:transform .25s ease-out;
}
.smx__bar--indet > i{ width:40%; transform:none; transition:none; animation:smx-indet 1.1s ease-in-out infinite; }
.smx__label{ margin:0; min-height:1.4em; font:500 14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; opacity:.7; }
.smx__label:empty{ display:none; }

/* sortie APP : léger zoom + fondu, comme un splash natif */
.smx--app{ transition:opacity .4s ease .05s; }
.smx--app .smx__stage{ transition:transform .45s cubic-bezier(.4,0,.2,1); }
.smx--app.smx--out{ opacity:0; pointer-events:none; }
.smx--app.smx--out .smx__stage{ transform:scale(1.14); }

@keyframes smx-body-in{ from{ clip-path:inset(100% 0 0 0); } to{ clip-path:inset(0 0 0 0); } }
@keyframes smx-head-in{ from{ opacity:0; transform:scale(0); } to{ opacity:1; transform:scale(1); } }
@keyframes smx-band-in{ from{ opacity:0; transform:translate(-70px,-78px); } to{ opacity:1; transform:none; } }
@keyframes smx-bob{ to{ transform:translateY(-8px); } }
@keyframes smx-scan{ to{ transform:translate(13px,14px); } }
@keyframes smx-indet{ from{ transform:translateX(-100%); } to{ transform:translateX(260%); } }

/* Accessibilité : pas d'animation si l'utilisateur les a désactivées */
@media (prefers-reduced-motion:reduce){
  .smx *{ animation:none !important; clip-path:none !important; opacity:1 !important; }
  .smx--web{ clip-path:none; transition:opacity .3s ease; }
  .smx--web.smx--out{ clip-path:none; opacity:0; }
  .smx--web.smx--out .smx__stage,
  .smx--app.smx--out .smx__stage{ transform:none; transition:none; }
}
`;

  var DEFAULTS = {
    web: { theme: 'auto', minDuration: 2000, maxDuration: 12000, autoHide: true, autoProgress: true,
           ariaLabel: 'Chargement de la page' },
    app: { theme: 'auto', minDuration: 900, target: null, label: '',
           ariaLabel: "Chargement de l'application" }
  };

  var instances = [];

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function isDark(theme) {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

  function create(mode, options) {
    var opts = Object.assign({}, DEFAULTS[mode], options || {});
    var reduced = prefersReducedMotion();
    injectStyle();

    /* ── DOM ── */
    var root = document.createElement('div');
    root.className = P + ' ' + P + '--' + mode + (isDark(opts.theme) ? ' ' + P + '--dark' : '');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', opts.ariaLabel);

    if (opts.background) root.style.setProperty('--smx-bg', opts.background);
    if (opts.color) root.style.setProperty('--smx-ink', opts.color);
    if (opts.accent) root.style.setProperty('--smx-accent', opts.accent);
    if (opts.head) root.style.setProperty('--smx-head', opts.head);
    if (opts.size) root.style.setProperty('--smx-size', typeof opts.size === 'number' ? opts.size + 'px' : opts.size);

    var line = null, bar = null, barFill = null, label = null;

    if (mode === 'web') {
      root.innerHTML = '<div class="smx__line"></div><div class="smx__stage">' + LOGO + '</div>';
      line = root.querySelector('.smx__line');
    } else {
      root.innerHTML =
        '<div class="smx__stage">' + LOGO +
        '<div class="smx__bar smx__bar--indet"><i></i></div>' +
        '<p class="smx__label"></p></div>';
      bar = root.querySelector('.smx__bar');
      barFill = bar.firstChild;
      label = root.querySelector('.smx__label');
      label.textContent = opts.label || '';
    }

    /* ── Montage ── */
    var target = opts.target;
    if (typeof target === 'string') target = document.querySelector(target);
    var contained = !!(target && target !== document.body && target !== document.documentElement);
    var restorePosition = false, prevOverflow = null;

    if (contained) {
      root.classList.add(P + '--contained');
      if (global.getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
        restorePosition = true;
      }
      target.appendChild(root);
    } else {
      // On s'accroche à <html> : fonctionne même si <body> n'existe pas encore (pas de flash de contenu).
      document.documentElement.appendChild(root);
      prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }

    /* ── État ── */
    var shownAt = performance.now();
    var hidePromise = null;
    var raf = 0;
    var sim = 0;

    function setProgress(v) {
      v = clamp01(v);
      if (mode === 'web') {
        line.style.transform = 'scaleX(' + v + ')';
      } else {
        bar.classList.remove('smx__bar--indet');
        bar.style.setProperty('--smx-p', v);
      }
    }

    if (mode === 'web' && opts.autoProgress) {
      (function tick() {
        sim += (0.92 - sim) * 0.025;   // approche 92 % sans jamais y arriver
        setProgress(sim);
        raf = global.requestAnimationFrame(tick);
      })();
    }

    function destroy() {
      global.cancelAnimationFrame(raf);
      if (root.parentNode) root.parentNode.removeChild(root);
      if (restorePosition) target.style.position = '';
      if (prevOverflow !== null) document.documentElement.style.overflow = prevOverflow;
      var i = instances.indexOf(api);
      if (i > -1) instances.splice(i, 1);
    }

    function hide() {
      if (hidePromise) return hidePromise;
      hidePromise = new Promise(function (resolve) {
        var wait = Math.max(0, opts.minDuration - (performance.now() - shownAt));
        setTimeout(function () {
          global.cancelAnimationFrame(raf);
          var determinate = mode === 'web' || !bar.classList.contains('smx__bar--indet');
          if (determinate) setProgress(1);
          setTimeout(function () {
            root.classList.add(P + '--out');
            var outMs = reduced ? 320 : (mode === 'web' ? 950 : 500);
            setTimeout(function () {
              destroy();
              if (typeof opts.onHidden === 'function') opts.onHidden();
              resolve();
            }, outMs);
          }, determinate ? 260 : 0);
        }, wait);
      });
      return hidePromise;
    }

    var api = {
      el: root,
      progress: function (v) { setProgress(v); return api; },
      text: function (t) { if (label) label.textContent = t || ''; return api; },
      hide: hide
    };
    instances.push(api);

    /* ── Masquage automatique côté web ── */
    if (mode === 'web' && opts.autoHide) {
      var done = function () {
        var fonts = document.fonts && document.fonts.ready;
        Promise.resolve(fonts).then(hide, hide);
      };
      if (document.readyState === 'complete') done();
      else global.addEventListener('load', done, { once: true });
      setTimeout(hide, opts.maxDuration);   // filet de sécurité
    }

    return api;
  }

  var ShapemaxLoader = {
    version: '1.0.0',
    web: function (options) { return create('web', options); },
    app: function (options) { return create('app', options); },
    hideAll: function () { return Promise.all(instances.slice().map(function (i) { return i.hide(); })); }
  };

  /* Démarrage automatique via l'attribut data-mode sur la balise <script> */
  var s = document.currentScript;
  if (s && s.dataset && (s.dataset.mode === 'web' || s.dataset.mode === 'app')) {
    var o = { theme: s.dataset.theme || 'auto' };
    if (s.dataset.minDuration) o.minDuration = Number(s.dataset.minDuration);
    if (s.dataset.target && document.querySelector(s.dataset.target)) o.target = s.dataset.target;
    if (s.dataset.label) o.label = s.dataset.label;
    ShapemaxLoader[s.dataset.mode](o);
  }

  global.ShapemaxLoader = ShapemaxLoader;
  if (typeof module !== 'undefined' && module.exports) module.exports = ShapemaxLoader;
})(typeof window !== 'undefined' ? window : this);
