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

  /* Paylaş butonu — Web Share API, yoksa panoya kopyala */
  var shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var shareData = { title: document.title, url: window.location.href };
      if (navigator.share) {
        navigator.share(shareData).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(function () {
          var original = shareBtn.textContent;
          shareBtn.textContent = "✓ Kopyalandı";
          setTimeout(function () { shareBtn.textContent = original; }, 1800);
        }).catch(function () {});
      }
    });
  }

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

  /* Hadi Başlayalım — adım adım pişirme modu */
  (function initCookMode() {
    var openBtn = document.getElementById("cookOpen");
    var overlay = document.getElementById("cookMode");
    var dataEl = document.getElementById("cookData");
    if (!openBtn || !overlay || !dataEl) return;

    var data = JSON.parse(dataEl.textContent);
    var closeBtn = document.getElementById("cookClose");
    var miseScreen = document.getElementById("cookMise");
    var stepsScreen = document.getElementById("cookSteps");
    var doneScreen = document.getElementById("cookDone");
    var ingList = document.getElementById("cookIngredients");
    var startBtn = document.getElementById("cookStart");
    var stepText = document.getElementById("cookStepText");
    var stepCount = document.getElementById("cookStepCount");
    var progressBar = document.getElementById("cookProgressBar");
    var prevBtn = document.getElementById("cookPrev");
    var nextBtn = document.getElementById("cookNext");
    var finishBtn = document.getElementById("cookFinish");
    var current = 0;
    var wakeLock = null;

    /* Adım süresi zamanlayıcısı */
    var timerBox = document.getElementById("cookTimer");
    var timerDisplay = document.getElementById("cookTimerDisplay");
    var timerMinus = document.getElementById("cookTimerMinus");
    var timerPlus = document.getElementById("cookTimerPlus");
    var timerStart = document.getElementById("cookTimerStart");
    var timerPause = document.getElementById("cookTimerPause");
    var timerReset = document.getElementById("cookTimerReset");
    var timerSeconds = 0;
    var timerTotal = 0;
    var timerInterval = null;

    function parseStepMinutes(text) {
      var m = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(saat|sa\.?|dakika|dk\.?)/i);
      if (!m) return null;
      var n = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
      if (/^sa/i.test(m[3])) n *= 60;
      return n;
    }

    function formatTime(totalSec) {
      var mm = Math.floor(totalSec / 60);
      var ss = totalSec % 60;
      return (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
    }

    function beep() {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        var ctx = new Ctx();
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.18;
        o.start();
        setTimeout(function () { o.stop(); ctx.close(); }, 500);
      } catch (e) {}
    }

    function stopTimerInterval() {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function setTimerControls(state) {
      timerStart.hidden = state !== "idle";
      timerPause.hidden = state !== "running";
      timerReset.hidden = state === "idle";
      timerMinus.disabled = timerPlus.disabled = state === "running";
    }

    function resetTimerForStep() {
      stopTimerInterval();
      timerBox.classList.remove("ringing");
      var mins = parseStepMinutes(data.adimlar[current]);
      if (mins === null) { timerBox.hidden = true; return; }
      timerBox.hidden = false;
      timerTotal = mins * 60;
      timerSeconds = timerTotal;
      timerDisplay.textContent = formatTime(timerSeconds);
      setTimerControls("idle");
    }

    function tickTimer() {
      timerSeconds--;
      timerDisplay.textContent = formatTime(Math.max(timerSeconds, 0));
      if (timerSeconds <= 0) {
        stopTimerInterval();
        timerBox.classList.add("ringing");
        beep();
        setTimerControls("done");
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }

    timerMinus.addEventListener("click", function () {
      timerTotal = Math.max(60, timerTotal - 60);
      timerSeconds = timerTotal;
      timerDisplay.textContent = formatTime(timerSeconds);
    });
    timerPlus.addEventListener("click", function () {
      timerTotal += 60;
      timerSeconds = timerTotal;
      timerDisplay.textContent = formatTime(timerSeconds);
    });
    timerStart.addEventListener("click", function () {
      timerBox.classList.remove("ringing");
      setTimerControls("running");
      timerInterval = setInterval(tickTimer, 1000);
    });
    timerPause.addEventListener("click", function () {
      stopTimerInterval();
      setTimerControls("idle");
    });
    timerReset.addEventListener("click", resetTimerForStep);

    function renderIngredients() {
      ingList.innerHTML = "";
      var liveLabels = document.querySelectorAll("#ingredientList .ing-text");
      var texts = liveLabels.length
        ? Array.prototype.map.call(liveLabels, function (el) { return el.textContent; })
        : data.malzemeler;
      texts.forEach(function (m) {
        var li = document.createElement("li");
        li.textContent = m;
        ingList.appendChild(li);
      });
    }

    function showScreen(target) {
      [miseScreen, stepsScreen, doneScreen].forEach(function (s) { s.hidden = s !== target; });
    }

    function renderStep() {
      stepText.textContent = data.adimlar[current];
      stepCount.textContent = "Adım " + (current + 1) + " / " + data.adimlar.length;
      progressBar.style.width = (((current + 1) / data.adimlar.length) * 100) + "%";
      prevBtn.style.visibility = current === 0 ? "hidden" : "visible";
      nextBtn.textContent = current === data.adimlar.length - 1 ? "Tamamladım ✓" : "İlerle →";
      resetTimerForStep();
    }

    function requestWakeLock() {
      if ("wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then(function (lock) { wakeLock = lock; }).catch(function () {});
      }
    }
    function releaseWakeLock() {
      if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    }

    openBtn.addEventListener("click", function () {
      current = 0;
      renderIngredients();
      showScreen(miseScreen);
      overlay.classList.add("open");
      requestWakeLock();
    });

    function closeCook() {
      overlay.classList.remove("open");
      releaseWakeLock();
      stopTimerInterval();
    }
    closeBtn.addEventListener("click", closeCook);
    finishBtn.addEventListener("click", closeCook);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeCook(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeCook();
    });

    startBtn.addEventListener("click", function () {
      current = 0;
      showScreen(stepsScreen);
      renderStep();
    });
    prevBtn.addEventListener("click", function () {
      if (current > 0) { current--; renderStep(); }
    });
    nextBtn.addEventListener("click", function () {
      if (current < data.adimlar.length - 1) {
        current++;
        renderStep();
      } else {
        showScreen(doneScreen);
        releaseWakeLock();
      }
    });
  })();

  /* Search — filters visible recipe cards by name/region (base demo) */
  /* Boşluk/Türkçe karakter farkı olsa da eşleşsin diye normalize ediyoruz (örn. "imambayıldı" == "İmam Bayıldı") */
  function normalizeTr(str) {
    return str
      .toLowerCase()
      .replace(/İ/g, "i").replace(/I/g, "ı")
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "");
  }

  var searchForm = document.getElementById("searchForm");
  var searchInput = document.getElementById("searchInput");
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = normalizeTr(searchInput.value.trim());
      var cards = document.querySelectorAll("#recipesGrid .recipe-card");
      var recipesSection = document.getElementById("recipes");
      var matchCount = 0;
      cards.forEach(function (card) {
        var name = normalizeTr(card.getAttribute("data-name") || "");
        var region = normalizeTr(card.getAttribute("data-region") || "");
        var match = !q || name.indexOf(q) !== -1 || region.indexOf(q) !== -1;
        card.style.display = match ? "" : "none";
        if (match) matchCount++;
      });
      if (recipesSection) recipesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
