/*! ShapemaxLoader (web) — rideau de chargement plein écran, couleurs de la charte du site.
 * Usage : <script src="js/logo-loader.js" data-mode="web" data-theme="auto" data-min-duration="1200"></script>
 */
(function (global) {
  'use strict';

  var LOGO =
    '<svg class="smx-logo" viewBox="0 0 320 301" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<circle class="smx-head" cx="242" cy="97" r="48"/>' +
    '<path class="smx-body" d="M2 300L162 128L318 300H230L165 220L100 300Z"/>' +
    '<polygon class="smx-band" points="50,0 138,0 299,180 299,276"/>' +
    '</svg>';

  var CSS = '' +
    '.smx{--smx-bg:#FFFFFF;--smx-ink:#1B1B1B;--smx-accent:#D72638;--smx-head:#CFDCFF;--smx-band:#D72638;--smx-size:clamp(96px,14vw,148px);' +
    'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--smx-bg);color:var(--smx-ink);' +
    'overflow:hidden;box-sizing:border-box;clip-path:inset(0 0 0 0);transition:clip-path .9s cubic-bezier(.76,0,.24,1)}' +
    '.smx--dark{--smx-bg:#1B1B1B;--smx-ink:#F5F5F5}' +
    '.smx__stage{display:flex;flex-direction:column;align-items:center}' +
    '.smx-logo{display:block;width:var(--smx-size);height:auto;overflow:visible}' +
    '.smx-head,.smx-body,.smx-band{transform-box:fill-box}' +
    '.smx-head{fill:var(--smx-head);transform-origin:50% 50%;animation:smx-head-in .7s cubic-bezier(.3,1.5,.5,1) .35s both,smx-bob 1.4s ease-in-out 1.6s infinite alternate}' +
    '.smx-body{fill:var(--smx-ink);clip-path:inset(100% 0 0 0);animation:smx-body-in .7s cubic-bezier(.22,.75,.24,1) .05s both}' +
    '.smx-band{fill:var(--smx-band);transform-origin:50% 50%;animation:smx-band-in .9s cubic-bezier(.16,1,.3,1) .6s both,smx-scan 1.4s ease-in-out 1.75s infinite alternate}' +
    '.smx__line{position:absolute;top:0;left:0;width:100%;height:3px;background:var(--smx-accent);transform-origin:0 50%;transform:scaleX(0);transition:transform .35s linear,opacity .2s ease}' +
    '.smx--out{clip-path:inset(0 0 100% 0)}' +
    '.smx--out .smx__stage{opacity:0;transform:translateY(-14px) scale(.94);transition:opacity .35s ease,transform .55s ease}' +
    '.smx--out .smx__line{opacity:0}' +
    '@keyframes smx-body-in{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}' +
    '@keyframes smx-head-in{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}' +
    '@keyframes smx-band-in{from{opacity:0;transform:translate(-70px,-78px)}to{opacity:1;transform:none}}' +
    '@keyframes smx-bob{to{transform:translateY(-8px)}}' +
    '@keyframes smx-scan{to{transform:translate(13px,14px)}}' +
    '@media (prefers-reduced-motion:reduce){.smx *{animation:none!important;clip-path:none!important;opacity:1!important}' +
    '.smx{clip-path:none;transition:opacity .3s ease}.smx--out{clip-path:none;opacity:0}.smx--out .smx__stage{transform:none;transition:none}}';

  function matches(q) { return !!(global.matchMedia && global.matchMedia(q).matches); }

  function create(options) {
    var opts = Object.assign({ theme: 'auto', minDuration: 2000, maxDuration: 12000 }, options || {});
    var reduced = matches('(prefers-reduced-motion: reduce)');

    var st = document.createElement('style');
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);

    var root = document.createElement('div');
    var dark = opts.theme === 'dark' || (opts.theme !== 'light' && matches('(prefers-color-scheme: dark)'));
    root.className = 'smx' + (dark ? ' smx--dark' : '');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', 'Chargement de la page');
    root.innerHTML = '<div class="smx__line"></div><div class="smx__stage">' + LOGO + '</div>';
    var line = root.querySelector('.smx__line');

    document.documentElement.appendChild(root);
    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    var shownAt = performance.now();
    var hidden = false;
    var sim = 0;
    var raf = global.requestAnimationFrame(function tick() {
      sim += (0.92 - sim) * 0.025;
      line.style.transform = 'scaleX(' + sim + ')';
      raf = global.requestAnimationFrame(tick);
    });

    function hide() {
      if (hidden) return;
      hidden = true;
      setTimeout(function () {
        global.cancelAnimationFrame(raf);
        line.style.transform = 'scaleX(1)';
        setTimeout(function () {
          root.classList.add('smx--out');
          setTimeout(function () {
            root.remove();
            document.documentElement.style.overflow = prevOverflow;
          }, reduced ? 320 : 950);
        }, 260);
      }, Math.max(0, opts.minDuration - (performance.now() - shownAt)));
    }

    var done = function () { Promise.resolve(document.fonts && document.fonts.ready).then(hide, hide); };
    if (document.readyState === 'complete') done();
    else global.addEventListener('load', done, { once: true });
    setTimeout(hide, opts.maxDuration);
  }

  var s = document.currentScript;
  if (s && s.dataset && s.dataset.mode === 'web') {
    var o = { theme: s.dataset.theme || 'auto' };
    if (s.dataset.minDuration) o.minDuration = Number(s.dataset.minDuration);
    create(o);
  }
})(window);
