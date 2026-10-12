/*
 * Bandeau de lancement (code LANCEMENT10). Affiché automatiquement à partir du lancement,
 * pour pouvoir déployer avant. Pour le retirer : supprimer le bandeau dans index.html (ou décaler LAUNCH_END).
 * Chargé dans <head> pour poser la classe avant le premier rendu (pas de décalage de la page).
 */
(function () {
  var LAUNCH_START = Date.parse("2026-10-23T00:00:00+02:00");
  var LAUNCH_END = Infinity; // à fixer quand la remise s'arrête
  var now = Date.now();
  if (now >= LAUNCH_START && now < LAUNCH_END) document.documentElement.classList.add("has-banner");
})();
