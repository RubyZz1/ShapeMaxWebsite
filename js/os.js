(function () {
  var ua = navigator.userAgent || "";
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/.test(ua) || (!android && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var os = android ? "android" : ios ? "ios" : "";
  if (os) document.documentElement.setAttribute("data-os", os);
})();
