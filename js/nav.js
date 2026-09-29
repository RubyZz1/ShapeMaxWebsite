(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (!toggle || !header || !nav) return;
  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();
