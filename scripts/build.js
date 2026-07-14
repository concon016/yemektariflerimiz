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
          <button class="info-btn" id="historyOpen" aria-label="${esc(tarif.ad)} tarihçesini oku">i</button>
        </div>
        <span class="recipe-region">${esc(yr.ad)} Mutfağı · ${esc(tarif.kategori)}</span>
        <p class="recipe-lead">${esc(tarif.ozet)}</p>
        <div class="recipe-meta-row">
          <span class="pill">⏱ ${esc(tarif.sure)}</span>
          <span class="pill">👤 ${esc(tarif.zorluk)}</span>
          <span class="pill">🍽 ${esc(tarif.porsiyon)}</span>
        </div>
      </div>
      <div class="recipe-header-photo">
        <div class="recipe-header-photo-inner">
          <span class="page-no">s. ${tarif.sayfaNo}</span>
          <img src="${tarif.gorsel}" alt="${esc(tarif.gorselAlt)}" loading="eager">
        </div>
        <p class="photo-credit">Fotoğraf: ${esc(tarif.fotoKredi)} · <a href="${tarif.fotoKaynak}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>, CC BY-SA 4.0</p>
      </div>
    </div>

    <div class="recipe-columns">
      <div>
        <h2>Malzemeler</h2>
        <ul class="ingredient-list">
          ${tarif.malzemeler.map((m) => `<li>${esc(m)}</li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h2>Yapılışı</h2>
        <ol class="step-list">
          ${tarif.adimlar.map((s) => `<li><p>${esc(s)}</p></li>`).join("\n          ")}
        </ol>
      </div>
    </div>

    ${tarif.ipuclari && tarif.ipuclari.length ? `<div class="tips-block">
      <h2>💡 Püf Noktaları</h2>
      <ul class="tips-list">
        ${tarif.ipuclari.map((t) => `<li>${esc(t)}</li>`).join("\n        ")}
      </ul>
    </div>` : ""}
  </div>
</section>

${related.length ? `<section class="section section-alt related-recipes">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">${esc(yr.ad)} Bölümünden</span>
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
</div>`;

  return page(title, description, canonicalPath, "tarifler", body, jsonLd(recipeSchema) + "\n" + jsonLd(breadcrumbSchema));
}

function recipeCard(tarif) {
  return `<article class="recipe-card reveal in">
        <a href="/tarif/${tarif.slug}.html" style="display:block;">
          <div class="recipe-media" style="background-image:url('${tarif.gorsel}'); background-size:cover; background-position:center;">
            <span class="page-no">s. ${tarif.sayfaNo}</span>
          </div>
        </a>
        <div class="recipe-body">
          <span class="recipe-region">${esc(yoreGetir(tarif.yore).ad)}</span>
          <h3><a href="/tarif/${tarif.slug}.html">${esc(tarif.ad)}</a></h3>
          <p style="margin:0; font-size:14px;">${esc(tarif.ozet)}</p>
          <div class="recipe-meta">
            <span>⏱ ${esc(tarif.sure)}</span>
            <span>👤 ${esc(tarif.zorluk)}</span>
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
    <span class="eyebrow">${esc(yr.bolumNo)}</span>
    <h1>${esc(yr.ad)} Mutfağı</h1>
    <p>${esc(yr.aciklama)}</p>
  </div>
</section>

<section class="section">
  <div class="container">
    ${recs.length ? `<div class="recipes-grid">
      ${recs.map((r) => recipeCard(r)).join("\n      ")}
    </div>` : `<div class="empty-state">
      <span class="emoji">📖</span>
      <h2>${esc(yr.ad)} bölümü hazırlanıyor</h2>
      <p>Bu yörenin tarifleri özenle yazılıyor, çok yakında burada olacak. O zamana kadar <a href="/yoreler/ege.html" style="color:var(--accent); font-weight:700;">Ege bölümüne</a> göz atabilirsiniz.</p>
    </div>`}
  </div>
</section>`;

  return page(title, description, canonicalPath, "yoreler", body, jsonLd(breadcrumbSchema));
}

function regionsIndexPage() {
  const title = "Yöreler | Türkiye'nin Yemek Kitabı — yemektariflerimiz";
  const description = "Karadeniz'den Ege'ye, Güneydoğu'dan Marmara'ya — Türkiye'nin 7 coğrafi bölgesinin mutfağını bölüm bölüm keşfedin.";
  const canonicalPath = "/yoreler.html";

  const body = `${breadcrumb([{ label: "Ana Sayfa", href: "/" }, { label: "Yöreler" }])}

<section class="section" style="padding-top:10px;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Kitabın Bölümleri</span>
        <h1>Yöresine göre keşfet</h1>
        <p>Her bölge, kendi hikayesi ve malzemeleriyle kitabımızda ayrı bir bölüm.</p>
      </div>
    </div>
    <div class="regions-grid">
      ${yoreler.map((y) => {
        const count = tariflerByYore(y.slug).length;
        return `<a class="region-card" href="/yoreler/${y.slug}.html" style="--region-color:${y.renk}">
        <span class="region-no">${esc(y.bolumNo)}</span>
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
  const description = "yemektariflerimiz kitabındaki tüm yöresel tarifler tek sayfada — hikayesiyle, adım adım anlatımla.";
  const canonicalPath = "/tarifler.html";

  const body = `${breadcrumb([{ label: "Ana Sayfa", href: "/" }, { label: "Tarifler" }])}

<section class="section" style="padding-top:10px;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Sayfaları Çevirin</span>
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
