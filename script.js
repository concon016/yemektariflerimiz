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

  /* Tarihçe / Püf Noktaları modalları — tarif sayfalarında kullanılır */
  function wireModal(openId, modalId, closeId) {
    var openBtn = document.getElementById(openId);
    var modal = document.getElementById(modalId);
    var closeBtn = document.getElementById(closeId);
    if (!openBtn || !modal || !closeBtn) return;
    openBtn.addEventListener("click", function () { modal.classList.add("open"); });
    closeBtn.addEventListener("click", function () { modal.classList.remove("open"); });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") modal.classList.remove("open");
    });
  }
  wireModal("historyOpen", "historyModal", "historyClose");
  wireModal("tipsOpen", "tipsModal", "tipsClose");

  /* Porsiyon hesaplayıcı — malzeme miktarlarındaki baştaki sayıyı ölçekler */
  function scaleIngredientText(text, factor) {
    var m = text.match(/^(\d+(?:[.,]\d+)?)(?:-(\d+(?:[.,]\d+)?))?(\s.*)$/);
    if (!m) return text;
    function fmt(raw) {
      var n = parseFloat(raw.replace(",", ".")) * factor;
      var rounded = n < 10 ? Math.round(n * 2) / 2 : Math.round(n);
      if (rounded <= 0) rounded = n < 10 ? 0.5 : 1;
      return (rounded % 1 === 0) ? String(rounded) : String(rounded).replace(".", ",");
    }
    var out = fmt(m[1]);
    if (m[2]) out += "-" + fmt(m[2]);
    return out + m[3];
  }

  var servingWrap = document.getElementById("servingAdjust");
  if (servingWrap) {
    var base = parseFloat(servingWrap.getAttribute("data-base"));
    var current = base;
    var servCount = document.getElementById("servCount");
    var servMinus = document.getElementById("servMinus");
    var servPlus = document.getElementById("servPlus");
    var ingLabels = document.querySelectorAll("#ingredientList .ing-text");
    function renderServings() {
      servCount.textContent = current % 1 === 0 ? current : String(current).replace(".", ",");
      var factor = current / base;
      ingLabels.forEach(function (el) {
        el.textContent = scaleIngredientText(el.getAttribute("data-orig"), factor);
      });
    }
    servMinus.addEventListener("click", function () {
      if (current > (base < 4 ? 1 : 2)) { current -= base < 4 ? 1 : 2; renderServings(); }
    });
    servPlus.addEventListener("click", function () {
      current += base < 4 ? 1 : 2;
      renderServings();
    });
  }

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
