// yemektariflerimiz — ortak script

(function () {
  "use strict";

  /* Theme toggle */
  var themeToggle = document.getElementById("themeToggle");
  function applyThemeUI() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (themeToggle) themeToggle.setAttribute("aria-checked", String(isDark));
  }
  applyThemeUI();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      applyThemeUI();
    });
  }

  /* Mobile menu */
  var menuToggle = document.getElementById("menuToggle");
  var navMobile = document.getElementById("navMobile");
  if (menuToggle && navMobile) {
    menuToggle.addEventListener("click", function () {
      navMobile.classList.toggle("open");
    });
    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { navMobile.classList.remove("open"); });
    });
  }

  /* Scroll progress bar */
  var progress = document.getElementById("scrollProgress");
  function updateProgress() {
    if (!progress) return;
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    var pct = height > 0 ? (scrolled / height) * 100 : 0;
    progress.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Favorite toggle (visual only, base template) */
  document.querySelectorAll(".fav").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var active = btn.textContent.trim() === "❤️";
      btn.textContent = active ? "🤍" : "❤️";
    });
  });

  /* Search — filters visible recipe cards by name/region (base demo) */
  var searchForm = document.getElementById("searchForm");
  var searchInput = document.getElementById("searchInput");
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = searchInput.value.trim().toLowerCase();
      var cards = document.querySelectorAll("#recipesGrid .recipe-card");
      var recipesSection = document.getElementById("recipes");
      var matchCount = 0;
      cards.forEach(function (card) {
        var name = (card.getAttribute("data-name") || "").toLowerCase();
        var region = (card.getAttribute("data-region") || "").toLowerCase();
        var match = !q || name.indexOf(q) !== -1 || region.indexOf(q) !== -1;
        card.style.display = match ? "" : "none";
        if (match) matchCount++;
      });
      if (recipesSection) recipesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
