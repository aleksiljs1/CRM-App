(function () {
  try {
    var s = localStorage.getItem("theme");
    var p = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var d = s === "dark" || (!s && p);
    if (d) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
