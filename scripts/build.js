// yemektariflerimiz — statik sayfa üretici
// data/tarifler.js ve data/yoreler.js dosyalarından /tarif/*.html,
// /yoreler/*.html, /yoreler.html, /tarifler.html ve sitemap.xml üretir.
// Çalıştır: node scripts/build.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://yemektariflerimiz.vercel.app";

const tarifler = require("../data/tarifler.js");
const yoreler = require("../data/yoreler.js");

function yoreGetir(slug) {
  return yoreler.find((y) => y.slug === slug);
}
function tariflerByYore(slug) {
  return tarifler.filter((t) => t.yore === slug);
}
function ilgiliTarifler(tarif, adet) {
  return tarifler
    .filter((t) => t.slug !== tarif.slug && t.yore === tarif.yore)
    .slice(0, adet);
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Sayfadaki "Yapılışı" listesini daha az parçalı göstermek için ardışık
// ince taneli adımları birleştirir. Pişirme modu ve schema.org verisi
// hâlâ orijinal, ince taneli tarif.adimlar dizisini kullanır.
function groupSteps(adimlar, gruplar) {
  if (!gruplar) return adimlar;
  const out = [];
  let i = 0;
  gruplar.forEach((n) => {
    out.push(adimlar.slice(i, i + n).join(" "));
    i += n;
  });
  return out;
}

function head(title, description, canonicalPath) {
  const url = SITE_URL + canonicalPath;
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/favicon.svg">
<script>
  (function () {
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
  })();
</script>
<link rel="stylesheet" href="/style.css">`;
}

function nav(active) {
  const item = (href, label, key) =>
    `<li><a href="${href}"${active === key ? ' class="active"' : ""}>${label}</a></li>`;
  return `<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="logo">
      <img src="/assets/favicon.svg" alt="">
      yemek<span class="logo-dim">tariflerimiz</span>
    </a>
    <ul class="nav-links" id="navMobile">
      ${item("/", "Ana Sayfa", "home")}
      ${item("/yoreler.html", "Yöreler", "yoreler")}
      ${item("/tarifler.html", "Tarifler", "tarifler")}
      ${item("/#about", "Hakkında", "about")}
      ${item("/#contact", "İletişim", "contact")}
    </ul>
    <div class="nav-right">
      <button class="theme-toggle" id="themeToggle" role="switch" aria-checked="false" aria-label="Karanlık modu değiştir">
        <span class="theme-toggle-track"></span>
        <span class="theme-toggle-thumb"></span>
      </button>
      <button class="menu-toggle" id="menuToggle" aria-label="Menü">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>`;
}

function footer() {
  return `<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="logo">
          <img src="/assets/favicon.svg" alt="">
          yemek<span class="logo-dim">tariflerimiz</span>
        </a>
        <p>Türkiye'nin yöresel yemek kitabı. Hikayesiyle, adım adım tarifleriyle Anadolu mutfağı.</p>
      </div>
      <div>
        <h4>Keşfet</h4>
        <ul>
          <li><a href="/yoreler.html">Yöreler</a></li>
          <li><a href="/tarifler.html">Tarifler</a></li>
          <li><a href="/#about">Hakkında</a></li>
        </ul>
      </div>
      <div>
        <h4>Bölgeler</h4>
        <ul>
          ${yoreler.slice(0, 3).map((y) => `<li><a href="/yoreler/${y.slug}.html">${y.ad}</a></li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h4>İletişim</h4>
        <ul>
          <li><a href="mailto:info@yemektariflerimiz.com">info@yemektariflerimiz.com</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 yemektariflerimiz. Tüm hakları saklıdır.</span>
      <span>canwebco tarafından tasarlandı</span>
    </div>
  </div>
</footer>`;
}

function breadcrumb(items) {
  const parts = items.map((it, i) => {
    const isLast = i === items.length - 1;
    if (isLast) return `<span class="current">${esc(it.label)}</span>`;
    return `<a href="${it.href}">${esc(it.label)}</a><span class="sep">›</span>`;
  });
  return `<div class="container"><nav class="breadcrumb" aria-label="Breadcrumb">${parts.join("\n")}</nav></div>`;
}

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

function page(title, description, canonicalPath, active, bodyHtml, extraHead) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
${head(title, description, canonicalPath)}
${extraHead || ""}
</head>
<body>

<div class="scroll-progress" id="scrollProgress"></div>
${nav(active)}

<main>
${bodyHtml}
</main>

${footer()}
<script src="/script.js"></script>
</body>
</html>
`;
}

/* ---------------- Recipe pages ---------------- */

function recipePage(tarif) {
  const yr = yoreGetir(tarif.yore);
  const title = `${tarif.ad} Tarifi Nasıl Yapılır? Malzemeleri ve Yapılışı | yemektariflerimiz`;
  const description = `${tarif.ozet} Malzemeler, adım adım yapılışı ve tarihçesi burada.`;
  const canonicalPath = `/tarif/${tarif.slug}.html`;

  const recipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: tarif.ad,
    image: [SITE_URL + tarif.gorsel],
    description: tarif.ozet,
    recipeCuisine: "Turkish",
    recipeCategory: tarif.kategori,
    keywords: `${tarif.ad}, ${tarif.ad} tarifi, ${yr.ad} mutfağı, yöresel tarif`,
    recipeYield: tarif.porsiyon,
    totalTime: tarif.sureISO,
    author: { "@type": "Organization", name: "yemektariflerimiz" },
    recipeIngredient: tarif.malzemeler,
    recipeInstructions: tarif.adimlar.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s,
    })),
  };
  if (tarif.besin) {
    recipeSchema.nutrition = {
      "@type": "NutritionInformation",
      calories: tarif.besin.kalori + " kcal",
      proteinContent: tarif.besin.protein + " g",
      carbohydrateContent: tarif.besin.karbonhidrat + " g",
      fatContent: tarif.besin.yag + " g",
      fiberContent: tarif.besin.lif + " g",
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: yr.ad, item: SITE_URL + `/yoreler/${yr.slug}.html` },
      { "@type": "ListItem", position: 3, name: tarif.ad, item: SITE_URL + canonicalPath },
    ],
  };

  const related = ilgiliTarifler(tarif, 3);

  const body = `${breadcrumb([
    { label: "Ana Sayfa", href: "/" },
    { label: yr.ad, href: `/yoreler/${yr.slug}.html` },
    { label: tarif.ad },
  ])}

<section class="section recipe-hero" style="padding-top:0;">
  <div class="container">
    <div class="recipe-header">
      <div class="recipe-header-text">
        <div class="recipe-title-row">
          <h1>${esc(tarif.ad)}</h1>
        </div>
        <span class="recipe-region">${esc(yr.ad)} Mutfağı · ${esc(tarif.kategori)}</span>
        <p class="recipe-lead">${esc(tarif.ozet)}</p>
        <div class="recipe-meta-row">
          <span class="pill">⏱ ${esc(tarif.sure)}</span>
          <div class="pill serving-adjust" id="servingAdjust" data-base="${tarif.porsiyonSayisi}">
            <button type="button" id="servMinus" aria-label="Porsiyonu azalt">−</button>
            <span id="servCount">${tarif.porsiyonSayisi}</span> ${esc(tarif.porsiyonEtiket)}
            <button type="button" id="servPlus" aria-label="Porsiyonu artır">+</button>
          </div>
          <button class="pill pill-action" id="historyOpen">Tarihçesi</button>
          ${tarif.ipuclari && tarif.ipuclari.length ? `<button class="pill pill-action pill-gold" id="tipsOpen">Püf Noktaları</button>` : ""}
          <button class="pill pill-action pill-share" id="shareBtn">Paylaş</button>
        </div>
        <div class="cta-row">
          <button class="btn btn-primary cook-start-btn" id="cookOpen">Hadi Başlayalım</button>
          ${tarif.besin ? `<button class="btn btn-outline" id="nutritionOpen">Besin Tablosu</button>` : ""}
        </div>
      </div>
      <div class="recipe-header-photo">
        <div class="recipe-header-photo-inner">
          <img src="${tarif.gorsel}" alt="${esc(tarif.gorselAlt)}" loading="eager">
          <a class="photo-credit-badge" href="${tarif.fotoKaynak}" target="_blank" rel="noopener noreferrer" title="Fotoğraf: ${esc(tarif.fotoKredi)} · Wikimedia Commons, CC BY-SA 4.0" aria-label="Fotoğraf kaynağı: ${esc(tarif.fotoKredi)}, Wikimedia Commons, CC BY-SA 4.0">©</a>
        </div>
      </div>
    </div>

    <div class="recipe-columns">
      <div>
        <h2>Malzemeler</h2>
        <ul class="ingredient-list" id="ingredientList">
          ${tarif.malzemeler.map((m, i) => `<li>
            <input type="checkbox" id="ing-${i}" class="ing-check">
            <label for="ing-${i}" class="ing-text" data-orig="${esc(m)}">${esc(m)}</label>
          </li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h2>Yapılışı</h2>
        <ol class="step-list">
          ${groupSteps(tarif.adimlar, tarif.adimGruplari).map((s) => `<li><p>${esc(s)}</p></li>`).join("\n          ")}
        </ol>
      </div>
    </div>
  </div>
</section>

${related.length ? `<section class="section section-alt related-recipes">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">${esc(yr.ad)} Mutfağından</span>
        <h2>Bunlar da hoşunuza gidebilir</h2>
      </div>
      <a href="/yoreler/${yr.slug}.html" class="see-all">${esc(yr.ad)}'nin tüm tarifleri →</a>
    </div>
    <div class="recipes-grid">
      ${related.map((r) => recipeCard(r)).join("\n      ")}
    </div>
  </div>
</section>` : ""}

<div class="modal-overlay" id="historyModal">
  <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="historyTitle">
    <button class="modal-close" id="historyClose" aria-label="Kapat">✕</button>
    <span class="eyebrow">Tarihçesi</span>
    <h3 id="historyTitle">${esc(tarif.ad)} nereden geliyor?</h3>
    <p>${esc(tarif.tarihce)}</p>
  </div>
</div>

${tarif.ipuclari && tarif.ipuclari.length ? `<div class="modal-overlay" id="tipsModal">
  <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="tipsTitle">
    <button class="modal-close" id="tipsClose" aria-label="Kapat">✕</button>
    <span class="eyebrow">Ustasından</span>
    <h3 id="tipsTitle">Püf Noktaları</h3>
    <ul class="tips-list">
      ${tarif.ipuclari.map((t) => `<li>${esc(t)}</li>`).join("\n      ")}
    </ul>
  </div>
</div>` : ""}

<script type="application/json" id="cookData">${JSON.stringify({ malzemeler: tarif.malzemeler, adimlar: tarif.adimlar, besin: tarif.besin || null, porsiyonSayisi: tarif.porsiyonSayisi, porsiyonEtiket: tarif.porsiyonEtiket })}</script>

${tarif.besin ? `<div class="modal-overlay" id="nutritionModal">
  <div class="modal-box nutrition-box" role="dialog" aria-modal="true" aria-labelledby="nutritionTitle">
    <button class="modal-close" id="nutritionClose" aria-label="Kapat">✕</button>
    <span class="eyebrow">Besin Değerleri</span>
    <h3 id="nutritionTitle">Besin Tablosu</h3>
    <p class="nutrition-note">1 porsiyon için yaklaşık değerler.</p>
    <div class="nutrition-label">
      <div class="nutrition-row nutrition-row-main">
        <span>Kalori</span>
        <strong id="nutriKalori">${tarif.besin.kalori} kcal</strong>
      </div>
      <div class="nutrition-row">
        <span>Protein</span>
        <strong id="nutriProtein">${tarif.besin.protein} g</strong>
      </div>
      <div class="nutrition-row">
        <span>Karbonhidrat</span>
        <strong id="nutriKarb">${tarif.besin.karbonhidrat} g</strong>
      </div>
      <div class="nutrition-row">
        <span>Yağ</span>
        <strong id="nutriYag">${tarif.besin.yag} g</strong>
      </div>
      <div class="nutrition-row">
        <span>Lif</span>
        <strong id="nutriLif">${tarif.besin.lif} g</strong>
      </div>
    </div>
    <p class="nutrition-total" id="nutritionTotal">Toplam (${tarif.porsiyonSayisi} ${esc(tarif.porsiyonEtiket)}): ${tarif.besin.kalori * tarif.porsiyonSayisi} kcal</p>
  </div>
</div>` : ""}

<div class="cook-overlay" id="cookMode">
  <div class="cook-box">
    <button class="cook-close" id="cookClose" aria-label="Kapat">✕</button>

    <div class="cook-screen" id="cookMise">
      <span class="eyebrow">Önce Hazırlık</span>
      <h3>Malzemeleri toplayın</h3>
      <p>Hepsini ölçüp önünüze koyun, hazır olduğunuzda başlayalım.</p>
      <ul class="tips-list cook-ing-list" id="cookIngredients"></ul>
      <button class="btn btn-primary" id="cookStart">Hazırım, Başla →</button>
    </div>

    <div class="cook-screen" id="cookSteps" hidden>
      <div class="cook-progress"><div class="cook-progress-bar" id="cookProgressBar"></div></div>
      <span class="cook-step-count" id="cookStepCount"></span>
      <p class="cook-step-text" id="cookStepText"></p>

      <div class="cook-timer" id="cookTimer" hidden>
        <div class="cook-timer-adjust" id="cookTimerAdjust">
          <button type="button" id="cookTimerMinus" aria-label="Süreyi azalt">−</button>
          <span id="cookTimerDisplay">00:00</span>
          <button type="button" id="cookTimerPlus" aria-label="Süreyi artır">+</button>
        </div>
        <div class="cook-timer-controls">
          <button type="button" class="btn btn-outline" id="cookTimerStart">▶ Zamanlayıcıyı Başlat</button>
          <button type="button" class="btn btn-outline" id="cookTimerPause" hidden>⏸ Duraklat</button>
          <button type="button" class="btn btn-outline" id="cookTimerReset" hidden>↺ Sıfırla</button>
        </div>
      </div>

      <div class="cook-nav">
        <button class="btn btn-outline" id="cookPrev">◀ Geri</button>
        <button class="btn btn-primary" id="cookNext">İlerle →</button>
      </div>
    </div>

    <div class="cook-screen" id="cookDone" hidden>
      <span class="cook-done-emoji">🎉</span>
      <h3>Afiyet olsun!</h3>
      <p>${esc(tarif.ad)} tarifini tamamladınız.</p>
      <button class="btn btn-primary" id="cookFinish">Kapat</button>
    </div>
  </div>
</div>`;

  return page(title, description, canonicalPath, "tarifler", body, jsonLd(recipeSchema) + "\n" + jsonLd(breadcrumbSchema));
}

function recipeCard(tarif) {
  return `<article class="recipe-card reveal in">
        <a href="/tarif/${tarif.slug}.html" style="display:block;">
          <div class="recipe-media" style="background-image:url('${tarif.gorsel}'); background-size:cover; background-position:center;"></div>
        </a>
        <div class="recipe-body">
          <span class="recipe-region">${esc(yoreGetir(tarif.yore).ad)}</span>
          <h3><a href="/tarif/${tarif.slug}.html">${esc(tarif.ad)}</a></h3>
          <p style="margin:0; font-size:14px;">${esc(tarif.ozet)}</p>
          <div class="recipe-meta">
            <span>⏱ ${esc(tarif.sure)}</span>
          </div>
        </div>
      </article>`;
}

/* ---------------- Region hub pages ---------------- */

function regionPage(yr) {
  const recs = tariflerByYore(yr.slug);
  const title = `${yr.ad} Mutfağı Tarifleri | yemektariflerimiz`;
  const description = yr.metaAciklama;
  const canonicalPath = `/yoreler/${yr.slug}.html`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: yr.ad, item: SITE_URL + canonicalPath },
    ],
  };

  const body = `${breadcrumb([{ label: "Ana Sayfa", href: "/" }, { label: yr.ad }])}

<section class="region-hero">
  <div class="container">
    <h1>${esc(yr.ad)} Mutfağı</h1>
    <p>${esc(yr.aciklama)}</p>
  </div>
</section>

<section class="section">
  <div class="container">
    ${recs.length ? `<div class="recipes-grid">
      ${recs.map((r) => recipeCard(r)).join("\n      ")}
    </div>` : `<div class="empty-state">
      <span class="emoji">🍳</span>
      <h2>${esc(yr.ad)} tarifleri hazırlanıyor</h2>
      <p>Bu yörenin tarifleri özenle yazılıyor, çok yakında burada olacak. O zamana kadar <a href="/yoreler/ege.html" style="color:var(--accent); font-weight:700;">Ege mutfağına</a> göz atabilirsiniz.</p>
    </div>`}
  </div>
</section>`;

  return page(title, description, canonicalPath, "yoreler", body, jsonLd(breadcrumbSchema));
}

function regionsIndexPage() {
  const title = "Yöreler | yemektariflerimiz";
  const description = "Karadeniz'den Ege'ye, Güneydoğu'dan Marmara'ya — Türkiye'nin 7 coğrafi bölgesinin mutfağını tek tek keşfedin.";
  const canonicalPath = "/yoreler.html";

  const body = `${breadcrumb([{ label: "Ana Sayfa", href: "/" }, { label: "Yöreler" }])}

<section class="section" style="padding-top:10px;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Yöreler</span>
        <h1>Yöresine göre keşfet</h1>
        <p>Her bölgenin kendine özgü malzemeleri ve tarifleri var.</p>
      </div>
    </div>
    <div class="regions-grid">
      ${yoreler.map((y) => {
        const count = tariflerByYore(y.slug).length;
        return `<a class="region-card" href="/yoreler/${y.slug}.html" style="--region-color:${y.renk}">
        <h3>${esc(y.ad)}</h3>
        <span class="count">${count ? count + " tarif" : "yakında"}</span>
      </a>`;
      }).join("\n      ")}
    </div>
  </div>
</section>`;

  return page(title, description, canonicalPath, "yoreler", body);
}

function recipesIndexPage() {
  const title = "Tüm Tarifler | yemektariflerimiz";
  const description = "yemektariflerimiz'deki tüm yöresel tarifler tek sayfada — hikayesiyle, adım adım anlatımla.";
  const canonicalPath = "/tarifler.html";

  const body = `${breadcrumb([{ label: "Ana Sayfa", href: "/" }, { label: "Tarifler" }])}

<section class="section" style="padding-top:10px;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Öne Çıkanlar</span>
        <h1>Tüm tarifler</h1>
        <p>${tarifler.length} tarif yayında, her hafta yenileri ekleniyor.</p>
      </div>
    </div>
    <div class="recipes-grid">
      ${tarifler.map((r) => recipeCard(r)).join("\n      ")}
    </div>
  </div>
</section>`;

  return page(title, description, canonicalPath, "tarifler", body);
}

/* ---------------- Sitemap ---------------- */

function buildSitemap() {
  const urls = [
    { loc: "/", priority: "1.0" },
    { loc: "/yoreler.html", priority: "0.8" },
    { loc: "/tarifler.html", priority: "0.8" },
    ...yoreler.map((y) => ({ loc: `/yoreler/${y.slug}.html`, priority: tariflerByYore(y.slug).length ? "0.7" : "0.4" })),
    ...tarifler.map((t) => ({ loc: `/tarif/${t.slug}.html`, priority: "0.9" })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
}

/* ---------------- Run ---------------- */

function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log("✓", rel);
}

for (const t of tarifler) write(`tarif/${t.slug}.html`, recipePage(t));
for (const y of yoreler) write(`yoreler/${y.slug}.html`, regionPage(y));
write("yoreler.html", regionsIndexPage());
write("tarifler.html", recipesIndexPage());
buildSitemap();
console.log("✓ sitemap.xml");
console.log(`\nToplam: ${tarifler.length} tarif, ${yoreler.length} yöre sayfası üretildi.`);
