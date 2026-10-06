(function () {
  var root = document.documentElement;
  var ua = navigator.userAgent || "";
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/.test(ua) || (!android && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var os = android ? "android" : ios ? "ios" : "";
  if (os) root.setAttribute("data-os", os);

  // Hide [data-reveal] blocks until main.js reveals them on scroll; if the
  // script never runs, show everything again rather than leave it hidden.
  if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    root.classList.add("reveal-ready");
    setTimeout(function () {
      if (!window.__smxReady) root.classList.remove("reveal-ready");
    }, 6000);
  }
})();
