/* Bandeau cookies + pixels Meta et TikTok, chargés seulement après « Tout accepter ».
 * IDs : js/pixels.config.js, généré au déploiement (deploy/remote-update.sh) depuis /etc/shapemax/web.env.
 * Sans ID, rien ne s'affiche et rien ne se charge. Même cookie que l'app (apps/web/src/lib/consent.ts). */
(function () {
  'use strict';

  var cfg = window.SMX_PIXELS || {};
  if (!cfg.meta && !cfg.tiktok) return;

  var KEY = 'smx_consent';
  var MAX_AGE = 60 * 60 * 24 * 180; // 6 mois, durée maximale recommandée par la CNIL
  var DOMAIN = /(^|\.)shapemax\.fr$/.test(location.hostname) ? '; domain=shapemax.fr' : '';

  function readConsent() {
    var match = document.cookie.match(/(?:^|; )smx_consent=(granted|denied)/);
    return match ? match[1] : null;
  }

  function writeConsent(value, maxAge) {
    document.cookie = KEY + '=' + value + '; max-age=' + maxAge + '; path=/; SameSite=Lax' + DOMAIN;
  }

  function inject(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadMeta(id) {
    var fbq = window.fbq = window._fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    // Pas de clics ni de métadonnées de page collectés automatiquement.
    fbq('set', 'autoConfig', false, id);
    fbq('init', id);
    fbq('track', 'PageView');
    inject('https://connect.facebook.net/en_US/fbevents.js');
  }

  function loadTikTok(id) {
    var ttq = window.ttq = [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = function (t, e) {
      t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) {
      var e = ttq._i[t] || [];
      for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e, n) {
      var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      inject(r + '?sdkid=' + encodeURIComponent(e) + '&lib=ttq');
    };
    ttq.load(id);
    ttq.page();
  }

  function loadPixels() {
    if (cfg.meta) loadMeta(cfg.meta);
    if (cfg.tiktok) loadTikTok(cfg.tiktok);
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.className = 'smx-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookies');
    // Refuser aussi simple qu'accepter (CNIL) : deux boutons identiques.
    banner.innerHTML =
      '<p>Avec ton accord, Meta et TikTok mesurent nos pubs (pixels). Jamais tes photos, ton grade ni tes notes. ' +
      '<a href="cookies.html">Politique cookies</a></p>' +
      '<div class="smx-consent__actions">' +
      '<button type="button" class="btn btn-primary btn-small" data-consent="denied">Tout refuser</button>' +
      '<button type="button" class="btn btn-primary btn-small" data-consent="granted">Tout accepter</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var choice = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (!choice) return;
      writeConsent(choice, MAX_AGE);
      banner.remove();
      if (choice === 'granted') loadPixels();
    });
    document.body.appendChild(banner);
  }

  function bindReset() {
    // cookies.html : « Modifier mon choix » efface le choix et rouvre le bandeau (pixels déjà chargés : rechargement).
    var buttons = document.querySelectorAll('[data-consent-reset]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].hidden = false;
      buttons[i].addEventListener('click', function () {
        writeConsent('', 0);
        location.reload();
      });
    }
  }

  function start() {
    bindReset();
    var consent = readConsent();
    if (consent === 'granted') loadPixels();
    else if (consent === null) showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
