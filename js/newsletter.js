/*
 * Popup newsletter (-5 %) — vitrine statique.
 * Envoie l'email à l'API ShapeMax (POST /newsletter/subscribe), qui l'ajoute à la liste Brevo newsletter.
 * Mémorise l'abonnement dans un cookie partagé avec app.shapemax.fr (empreinte SHA-256 de l'email,
 * jamais l'email) pour pré-cocher la case newsletter à l'inscription. Même nom / format que
 * apps/web/src/lib/newsletterMemo.ts côté app.
 */
(function () {
  "use strict";

  var API_URL = (document.currentScript && document.currentScript.dataset.api) || "https://api.shapemax.fr";
  var DISMISSED_KEY = "ps_newsletter_popup";
  var COOKIE = "ps_nl";
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
  var SHOW_AFTER_MS = 5000;

  var TEXT = {
    pre: "Profitez de",
    big: "-5%",
    lede: "Inscris-toi à la newsletter.",
    placeholder: "Entre ton adresse email",
    submit: "Tiens-moi au courant",
    done: "C'est bon, tu es inscrit. Surveille ta boîte mail.",
    no: "Pas intéressé",
    fine: "Pas de spam, désabonnement à tout moment.",
    close: "Fermer",
    error: "Inscription impossible. Vérifie ton email et réessaie.",
  };

  function read() {
    try { return localStorage.getItem(DISMISSED_KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(DISMISSED_KEY, value); } catch (e) { /* stockage indisponible : la popup peut revenir */ }
  }
  if (read() !== null) return;

  function emailHash(email) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(null);
    var data = new TextEncoder().encode(email.trim().toLowerCase());
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    }, function () { return null; });
  }

  function remember(email) {
    return emailHash(email).then(function (hash) {
      if (!hash) return;
      var host = location.hostname.replace(/^www\./, "");
      var shared = host.indexOf(".") > 0 && !/^\d+(\.\d+){3}$/.test(host) && !/\.localhost$/.test(host);
      document.cookie = COOKIE + "=" + hash + "; Max-Age=" + COOKIE_MAX_AGE + "; Path=/; SameSite=Lax" +
        (location.protocol === "https:" ? "; Secure" : "") + (shared ? "; Domain=" + host : "");
    });
  }

  var CSS = [
    ".nlp-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);opacity:0;transition:opacity .25s ease}",
    ".nlp-overlay.is-open{opacity:1}",
    ".nlp-card{position:relative;width:100%;max-width:440px;padding:40px 32px 28px;border-radius:32px;background:#fff;color:#000;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:inherit;transform:translateY(24px);transition:transform .25s ease}",
    ".nlp-overlay.is-open .nlp-card{transform:none}",
    ".nlp-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border:0;border-radius:50%;background:#a3a3a3;color:#fff;font-size:20px;line-height:1;cursor:pointer}",
    ".nlp-close:hover{background:#737373}",
    ".nlp-logo{display:block;width:64px;height:64px;margin:0 auto}",
    ".nlp-pre{display:block;margin-top:24px;font-size:20px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}",
    ".nlp-big{display:block;margin-top:4px;font-size:88px;font-weight:900;line-height:.9;letter-spacing:-.04em;color:#D72638}",
    ".nlp-lede{margin:16px 0 0;font-size:17px;font-weight:500;line-height:1.35}",
    ".nlp-input{box-sizing:border-box;width:100%;margin-top:24px;padding:14px 16px;border:1px solid #d4d4d4;border-radius:12px;background:#fff;color:#000;font:inherit;font-size:16px}",
    ".nlp-input::placeholder{color:#737373}",
    ".nlp-input:focus{outline:none;border-color:#000}",
    ".nlp-submit{box-sizing:border-box;width:100%;height:56px;margin-top:12px;border:0;border-radius:12px;background:#000;color:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer}",
    ".nlp-submit:hover{opacity:.9}",
    ".nlp-submit:disabled{opacity:.5;cursor:not-allowed}",
    ".nlp-no{display:inline-block;margin-top:20px;padding:0;border:0;background:none;color:#737373;font:inherit;font-size:15px;font-weight:600;cursor:pointer}",
    ".nlp-no:hover{color:#000}",
    ".nlp-fine{margin:16px 0 0;font-size:11px;line-height:1.35;color:#737373}",
    ".nlp-error{margin:12px 0 0;font-size:13px;color:#dc2626}",
    ".nlp-done{margin:0;padding:40px 0 16px;font-size:17px;font-weight:600}",
    "@media (prefers-reduced-motion:reduce){.nlp-overlay,.nlp-card{transition:none}}",
  ].join("");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function open() {
    var style = el("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var overlay = el("div", "nlp-overlay");
    var card = el("div", "nlp-card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", TEXT.pre + " " + TEXT.big);

    var close = el("button", "nlp-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", TEXT.close);

    var logo = el("img", "nlp-logo");
    logo.src = "assets/brand/icon-light.webp";
    logo.alt = "";

    var form = el("form");
    var title = el("h2");
    title.style.cssText = "margin:0;font:inherit";
    title.appendChild(el("span", "nlp-pre", TEXT.pre));
    title.appendChild(el("span", "nlp-big", TEXT.big));
    var input = el("input", "nlp-input");
    input.type = "email";
    input.required = true;
    input.autocomplete = "email";
    input.placeholder = TEXT.placeholder;
    input.setAttribute("aria-label", "Email");
    var error = el("p", "nlp-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    var submit = el("button", "nlp-submit", TEXT.submit);
    submit.type = "submit";
    var no = el("button", "nlp-no", TEXT.no);
    no.type = "button";

    form.appendChild(title);
    form.appendChild(el("p", "nlp-lede", TEXT.lede));
    form.appendChild(input);
    form.appendChild(error);
    form.appendChild(submit);
    form.appendChild(no);
    form.appendChild(el("p", "nlp-fine", TEXT.fine));

    card.appendChild(close);
    card.appendChild(logo);
    card.appendChild(form);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    input.focus({ preventScroll: true });

    var subscribed = false;
    function dismiss() {
      if (!subscribed) write("dismissed");
      document.removeEventListener("keydown", onKey);
      overlay.classList.remove("is-open");
      setTimeout(function () { overlay.remove(); style.remove(); }, 250);
    }
    function onKey(e) { if (e.key === "Escape") dismiss(); }
    document.addEventListener("keydown", onKey);
    close.addEventListener("click", dismiss);
    no.addEventListener("click", dismiss);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) dismiss(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      var email = input.value.trim();
      fetch(API_URL + "/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      }).then(function (res) {
        if (!res.ok) throw new Error("subscribe failed");
        subscribed = true;
        write("subscribed");
        return remember(email);
      }).then(function () {
        form.replaceWith(el("p", "nlp-done", TEXT.done));
        setTimeout(dismiss, 2500);
      }).catch(function () {
        error.textContent = TEXT.error;
        error.hidden = false;
        submit.disabled = false;
      });
    });
  }

  function start() { setTimeout(open, SHOW_AFTER_MS); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
