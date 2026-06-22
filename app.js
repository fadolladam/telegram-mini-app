/* ═══════════════════════════════════════════════════════════════════
   TG STORE — app.js  (v3)
   - Loads products & banners from Google Sheets (CSV)
   - Real product images with emoji fallback
   - Out-of-stock card overlay + disabled button
   - Stock-limited quantity selector
   - 2-step checkout: Cart → Delivery address form
   - Order confirmation overlay
   - Orders saved to Google Sheets + Telegram notifications
═══════════════════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────
const CONFIG = {
  storeName:             "TG Store",
  currency:              "$",
  deliveryFee:           3.99,
  freeDeliveryThreshold: 50,
  carouselInterval:      4500,
  localStorageCartKey:   "tgstore_cart_v1",
  localStorageWishKey:   "tgstore_wish_v1",
  // Your Google Apps Script Web App URL (paste after deploying)
  webhookUrl:            "https://script.google.com/macros/s/AKfycbxEb5HQrneJDXcQW0DTYOO69_Wya09-dR6QxBNsiKLNz92mqzggEo6f8stDxaQdqDcp/exec",
  // Google Sheets CSV URLs — must be published to web first
  // File → Share → Publish to web → Sheet → CSV → Publish
  sheetsProducts: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4QXMPP5Tp89rmnOolgZIZhOHLSteRMVcpeeju0UfH05FHrpyp1y9KezHYpcGlAQ/pub?gid=1932103623&single=true&output=csv",
  sheetsCarousel: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4QXMPP5Tp89rmnOolgZIZhOHLSteRMVcpeeju0UfH05FHrpyp1y9KezHYpcGlAQ/pub?gid=2040782121&single=true&output=csv",
};

// ─────────────────────────────────────────────────────────────────
// FALLBACK DATA (used when Sheets not yet published to web)
// ─────────────────────────────────────────────────────────────────
const FALLBACK_BANNERS = [
  { id:"b1", label:"Just Arrived",  title:"New Arrivals\nThis Week",       subtitle:"Fresh styles and latest tech",   cta:"Shop Now",  emoji:"🆕", gradient:["#667eea","#764ba2"], category:"all"  },
  { id:"b2", label:"Limited Time",  title:"Up to 40% Off\nSelected Items", subtitle:"While stocks last",              cta:"See Deals", emoji:"🔥", gradient:["#f093fb","#f5576c"], category:"all"  },
  { id:"b3", label:"Best Sellers",  title:"Free Delivery\nOver $50",       subtitle:"On all qualifying orders",       cta:"Explore",   emoji:"🚀", gradient:["#4facfe","#00f2fe"], category:"all"  },
];

const FALLBACK_PRODUCTS = [
  { id:1,  name:"iPhone 15 Pro Leather Case",    category:"phones",      price:24.99,  oldPrice:39.99,  rating:4.8, reviews:312,  stock:15, badge:"Sale", emoji:"📱", gradient:["#667eea","#764ba2"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80", description:"Premium full-grain leather with MagSafe compatibility. Military-grade drop protection with a slim profile." },
  { id:2,  name:"AirPods Pro 2nd Gen",           category:"electronics", price:189.99, oldPrice:249.99, rating:4.9, reviews:1204, stock:8,  badge:"Hot",  emoji:"🎧", gradient:["#f093fb","#f5576c"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1588423771073-b8903fead714?w=400&q=80", description:"Active noise cancellation, transparency mode, and spatial audio. 6h listening time." },
  { id:3,  name:"Nike Air Max 2025",             category:"fashion",     price:129.99, oldPrice:null,   rating:4.7, reviews:89,   stock:22, badge:"New",  emoji:"👟", gradient:["#43e97b","#38f9d7"], isNew:true,  imageUrl:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", description:"Lightweight mesh upper with responsive Air cushioning. Built for all-day comfort." },
  { id:4,  name:"Vitamin C Brightening Serum",   category:"beauty",      price:34.99,  oldPrice:49.99,  rating:4.6, reviews:567,  stock:40, badge:"Sale", emoji:"🌟", gradient:["#fa709a","#fee140"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80", description:"15% stabilized Vitamin C, hyaluronic acid, and niacinamide." },
  { id:5,  name:"Gold Link Chain Necklace",      category:"accessories", price:45.99,  oldPrice:null,   rating:4.5, reviews:143,  stock:30, badge:"New",  emoji:"📿", gradient:["#f6d365","#fda085"], isNew:true,  imageUrl:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80", description:"18k gold-plated stainless steel link chain. Tarnish-resistant and waterproof." },
  { id:6,  name:"Sushi Premium Bento Box",       category:"food",        price:18.99,  oldPrice:null,   rating:4.8, reviews:421,  stock:50, badge:"Hot",  emoji:"🍱", gradient:["#a18cd1","#fbc2eb"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80", description:"12-piece premium sushi selection. Freshly prepared and delivered same day." },
  { id:7,  name:"Samsung Galaxy S24 Ultra",      category:"phones",      price:899.99, oldPrice:1099.99,rating:4.8, reviews:2341, stock:0,  badge:"Hot",  emoji:"🤳", gradient:["#0f0c29","#302b63"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80", description:"6.8\" QHD+ Dynamic AMOLED, 200MP camera, built-in S Pen." },
  { id:8,  name:"Smart Watch Pro 9",             category:"electronics", price:299.99, oldPrice:399.99, rating:4.7, reviews:876,  stock:12, badge:"Sale", emoji:"⌚", gradient:["#2af598","#009efd"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80", description:"AMOLED always-on display, GPS, SpO2, ECG monitor, 14-day battery." },
  { id:9,  name:"Genuine Leather Tote Bag",      category:"fashion",     price:89.99,  oldPrice:null,   rating:4.6, reviews:203,  stock:18, badge:"New",  emoji:"👜", gradient:["#d4fc79","#96e6a1"], isNew:true,  imageUrl:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", description:"Full-grain leather, fits 15\" laptop. Adjustable strap, 3 internal pockets." },
  { id:10, name:"Rosehip Facial Oil",            category:"beauty",      price:28.99,  oldPrice:null,   rating:4.7, reviews:389,  stock:60, badge:null,   emoji:"🌹", gradient:["#fccb90","#d57eeb"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80", description:"100% cold-pressed rosehip seed oil. Reduces fine lines overnight." },
  { id:11, name:"Polarized Sunglasses",          category:"accessories", price:59.99,  oldPrice:79.99,  rating:4.4, reviews:167,  stock:3,  badge:"Sale", emoji:"🕶️",gradient:["#89f7fe","#66a6ff"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80", description:"UV400 polarized lenses with TR90 flexible frame. Blocks 99.9% of UV rays." },
  { id:12, name:"Matcha Latte Starter Kit",      category:"food",        price:24.99,  oldPrice:null,   rating:4.9, reviews:512,  stock:35, badge:"Hot",  emoji:"🍵", gradient:["#84fab0","#8fd3f4"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80", description:"Ceremonial-grade matcha, bamboo whisk, chawan bowl. Makes 30+ cups." },
  { id:13, name:"Magsafe Wireless Charger",      category:"electronics", price:49.99,  oldPrice:69.99,  rating:4.5, reviews:334,  stock:20, badge:"Sale", emoji:"🔋", gradient:["#a1c4fd","#c2e9fb"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80", description:"15W wireless charging for iPhone 12–15. Slim 6mm profile, USB-C included." },
  { id:14, name:"Premium Cotton Hoodie",         category:"fashion",     price:74.99,  oldPrice:null,   rating:4.6, reviews:291,  stock:45, badge:"New",  emoji:"🧥", gradient:["#e0c3fc","#8ec5fc"], isNew:true,  imageUrl:"https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80", description:"400gsm heavyweight French terry cotton. Brushed inner lining, kangaroo pocket." },
  { id:15, name:"Glossy Lip Set (6 Shades)",     category:"beauty",      price:19.99,  oldPrice:29.99,  rating:4.3, reviews:608,  stock:70, badge:"Sale", emoji:"💄", gradient:["#f77062","#fe5196"], isNew:false, imageUrl:"https://images.unsplash.com/photo-1586495777744-4e6232bf2ebb?w=400&q=80", description:"Long-lasting non-sticky formula with hyaluronic acid. 6 shades included." },
];

// ─────────────────────────────────────────────────────────────────
// CATEGORIES (static — no need for Sheets)
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:"all",         label:"All",         emoji:"🏠" },
  { id:"phones",      label:"Phones",      emoji:"📱" },
  { id:"electronics", label:"Electronics", emoji:"💻" },
  { id:"fashion",     label:"Fashion",     emoji:"👗" },
  { id:"beauty",      label:"Beauty",      emoji:"✨" },
  { id:"accessories", label:"Accessories", emoji:"💍" },
  { id:"food",        label:"Food",        emoji:"🍜" },
];

// ─────────────────────────────────────────────────────────────────
// RUNTIME DATA (populated from Sheets or fallback)
// ─────────────────────────────────────────────────────────────────
let PRODUCTS = [];
let BANNERS  = [];

// ─────────────────────────────────────────────────────────────────
// TELEGRAM
// ─────────────────────────────────────────────────────────────────
const tg = window.Telegram?.WebApp ?? null;
const isInTelegram = !!(tg && tg.initData && tg.initData.length > 0);

if (tg) {
  tg.ready();
  tg.expand();
  if (isInTelegram) tg.enableClosingConfirmation();
}

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
const state = {
  cart:            loadFromStorage(CONFIG.localStorageCartKey, []),
  wishlist:        loadFromStorage(CONFIG.localStorageWishKey, []),
  activeCategory:  "all",
  searchQuery:     "",
  sortBy:          "popular",
  currentProduct:  null,
  modalQty:        1,
  carouselIndex:   0,
  carouselTimer:   null,
  cartStep:        "cart",   // "cart" | "address"
};

// ─────────────────────────────────────────────────────────────────
// LOCALSTORAGE
// ─────────────────────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function persistCart()     { saveToStorage(CONFIG.localStorageCartKey, state.cart); }
function persistWishlist() { saveToStorage(CONFIG.localStorageWishKey, state.wishlist); }

// ─────────────────────────────────────────────────────────────────
// CSV PARSER (handles quoted commas and newlines)
// ─────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows   = [];
  const lines  = text.trim().split("\n");
  if (!lines.length) return rows;
  const headers = splitCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCSVLine(line);
    const row  = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] ?? "").trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"')         { inQ = !inQ; }
    else if (c === "," && !inQ) { result.push(cur); cur = ""; }
    else                        { cur += c; }
  }
  result.push(cur);
  return result;
}

// ─────────────────────────────────────────────────────────────────
// GOOGLE SHEETS FETCH
// ─────────────────────────────────────────────────────────────────
async function fetchSheetCSV(url) {
  const res  = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseCSV(await res.text());
}

function csvToProduct(row) {
  return {
    id:          parseInt(row.id)         || 0,
    name:        row.name                 || "",
    category:    row.category             || "all",
    price:       parseFloat(row.price)    || 0,
    oldPrice:    row.oldPrice             ? parseFloat(row.oldPrice) : null,
    rating:      parseFloat(row.rating)   || 0,
    reviews:     parseInt(row.reviews)    || 0,
    description: row.description          || "",
    stock:       parseInt(row.stock)      || 0,
    badge:       row.badge                || null,
    emoji:       row.emoji                || "📦",
    gradient:    [row.color1 || "#667eea", row.color2 || "#764ba2"],
    isNew:       row.isNew === "TRUE"     || row.isNew === "true",
    imageUrl:    row.imageUrl             || null,
  };
}

function csvToBanner(row) {
  return {
    id:       row.id       || "",
    label:    row.label    || "",
    title:    row.title    || "",
    subtitle: row.subtitle || "",
    cta:      row.cta      || "Shop Now",
    emoji:    row.emoji    || "🛍️",
    gradient: [row.color1  || "#667eea", row.color2 || "#764ba2"],
    category: row.category || "all",
  };
}

async function loadData() {
  try {
    const [pRows, bRows] = await Promise.all([
      fetchSheetCSV(CONFIG.sheetsProducts),
      fetchSheetCSV(CONFIG.sheetsCarousel),
    ]);
    PRODUCTS = pRows.map(csvToProduct).filter(p => p.id && p.name);
    BANNERS  = bRows.map(csvToBanner).filter(b => b.title);
    console.log(`✅ Loaded ${PRODUCTS.length} products and ${BANNERS.length} banners from Sheets`);
  } catch (err) {
    console.warn("⚠️ Could not load from Google Sheets — using fallback data.", err.message);
    PRODUCTS = [...FALLBACK_PRODUCTS];
    BANNERS  = [...FALLBACK_BANNERS];
  }
}

// ─────────────────────────────────────────────────────────────────
// SKELETON LOADING
// ─────────────────────────────────────────────────────────────────
function showSkeleton() {
  document.getElementById("skeletonGrid").classList.remove("hidden");
  document.getElementById("productGrid").classList.add("hidden");
}
function hideSkeleton() {
  document.getElementById("skeletonGrid").classList.add("hidden");
  document.getElementById("productGrid").classList.remove("hidden");
}

// ─────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────
function applyTheme() {
  const scheme = tg?.colorScheme ?? "light";
  document.documentElement.setAttribute("data-theme", scheme);
  if (tg?.themeParams) {
    const p = tg.themeParams, r = document.documentElement;
    if (p.bg_color)           r.style.setProperty("--bg",          p.bg_color);
    if (p.secondary_bg_color) r.style.setProperty("--bg-card",     p.secondary_bg_color);
    if (p.text_color)         r.style.setProperty("--text",        p.text_color);
    if (p.hint_color)         r.style.setProperty("--text-sub",    p.hint_color);
    if (p.button_color)       r.style.setProperty("--accent",      p.button_color);
    if (p.button_text_color)  r.style.setProperty("--accent-text", p.button_text_color);
  }
}
if (tg) tg.onEvent("themeChanged", applyTheme);

// ─────────────────────────────────────────────────────────────────
// HAPTICS
// ─────────────────────────────────────────────────────────────────
const haptic = {
  light()     { tg?.HapticFeedback?.impactOccurred("light"); },
  medium()    { tg?.HapticFeedback?.impactOccurred("medium"); },
  success()   { tg?.HapticFeedback?.notificationOccurred("success"); },
  error()     { tg?.HapticFeedback?.notificationOccurred("error"); },
  selection() { tg?.HapticFeedback?.selectionChanged(); },
};

// ─────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, duration = 2400) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), duration);
}

// ─────────────────────────────────────────────────────────────────
// CAROUSEL
// ─────────────────────────────────────────────────────────────────
function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  const dots  = document.getElementById("carouselDots");
  if (!BANNERS.length) return;

  track.innerHTML = BANNERS.map((b, i) => `
    <div class="carousel-slide" data-index="${i}" data-category="${b.category}" tabindex="0">
      <div class="slide-bg" style="background:linear-gradient(135deg,${b.gradient[0]},${b.gradient[1]});"></div>
      <span class="slide-emoji" aria-hidden="true">${b.emoji}</span>
      <div class="slide-content">
        <div class="slide-label">${b.label}</div>
        <div class="slide-title">${b.title.replace(/\\n/g,"<br>")}</div>
        <div class="slide-subtitle">${b.subtitle}</div>
        <span class="slide-btn">${b.cta} →</span>
      </div>
    </div>`).join("");

  dots.innerHTML = BANNERS.map((_,i) => `
    <button class="dot ${i===0?"active":""}" data-index="${i}"></button>`).join("");

  track.querySelectorAll(".carousel-slide").forEach(s => {
    s.addEventListener("click", () => {
      haptic.selection();
      setCategory(s.dataset.category || "all");
    });
  });
  dots.querySelectorAll(".dot").forEach(d => {
    d.addEventListener("click", () => { haptic.light(); goToSlide(Number(d.dataset.index)); });
  });
  startCarousel();
}

function goToSlide(idx) {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots   = document.querySelectorAll(".dot");
  if (!slides.length) return;
  state.carouselIndex = (idx + slides.length) % slides.length;
  const w = slides[0].getBoundingClientRect().width + 12;
  document.getElementById("carouselTrack").style.transform = `translateX(calc(-${state.carouselIndex} * ${w}px))`;
  dots.forEach((d,i) => d.classList.toggle("active", i === state.carouselIndex));
}

function startCarousel() {
  clearInterval(state.carouselTimer);
  state.carouselTimer = setInterval(() => goToSlide(state.carouselIndex + 1), CONFIG.carouselInterval);
}

window.addEventListener("resize", () => goToSlide(state.carouselIndex), { passive:true });

// ─────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────
function renderCategories() {
  const list = document.getElementById("categoryList");
  list.innerHTML = CATEGORIES.map(c => `
    <button class="cat-chip ${c.id===state.activeCategory?"active":""}" data-cat="${c.id}">
      <span aria-hidden="true">${c.emoji}</span> ${c.label}
    </button>`).join("");
  list.querySelectorAll(".cat-chip").forEach(btn => {
    btn.addEventListener("click", () => { haptic.selection(); setCategory(btn.dataset.cat); });
  });
}

function setCategory(catId) {
  state.activeCategory = catId;
  document.querySelectorAll(".cat-chip").forEach(b => b.classList.toggle("active", b.dataset.cat === catId));
  renderProducts();
}

// ─────────────────────────────────────────────────────────────────
// FILTERING & SORTING
// ─────────────────────────────────────────────────────────────────
function getFilteredProducts() {
  let list = [...PRODUCTS];
  if (state.activeCategory !== "all") list = list.filter(p => p.category === state.activeCategory);
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );
  }
  switch (state.sortBy) {
    case "price-low":  list.sort((a,b) => a.price - b.price); break;
    case "price-high": list.sort((a,b) => b.price - a.price); break;
    case "newest":     list.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0)); break;
    default:           list.sort((a,b) => b.reviews - a.reviews);
  }
  return list;
}

// ─────────────────────────────────────────────────────────────────
// PRODUCT CARD HTML
// ─────────────────────────────────────────────────────────────────
function productCardHTML(p) {
  const inCart    = state.cart.some(c => c.id === p.id);
  const inWish    = state.wishlist.includes(p.id);
  const oos       = p.stock === 0;
  const lowStock  = p.stock > 0 && p.stock <= 5;
  const discount  = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const badgeCls  = p.badge ? `badge-${p.badge.toLowerCase()}` : "";

  const imageHTML = p.imageUrl
    ? `<img class="product-img" src="${p.imageUrl}" alt="${p.name}" loading="lazy"
         onerror="this.closest('.product-image').classList.add('img-error')" />
       <span class="product-emoji" aria-hidden="true">${p.emoji}</span>`
    : `<span class="product-emoji" aria-hidden="true">${p.emoji}</span>`;

  return `
  <div class="product-card ${oos ? "oos" : ""} ${p.imageUrl ? "has-image" : ""}"
       data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name}">
    <div class="product-image" style="background:linear-gradient(135deg,${p.gradient[0]}22,${p.gradient[1]}33);">
      ${imageHTML}
      ${oos ? `<div class="oos-overlay"><span class="oos-label">Out of Stock</span></div>` : ""}
      ${p.badge && !oos ? `<span class="product-badge ${badgeCls}">${p.badge}</span>` : ""}
      <button class="wishlist-toggle ${inWish ? "active" : ""}" aria-label="${inWish ? "Remove from wishlist" : "Add to wishlist"}">
        ${inWish ? "♥" : "♡"}
      </button>
    </div>
    <div class="product-info">
      <div class="product-category">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-rating">
        <span class="star" aria-hidden="true">★</span>
        <span>${p.rating}</span>
        <span>(${formatNumber(p.reviews)})</span>
      </div>
      ${lowStock ? `<div class="low-stock-warn">⚡ Only ${p.stock} left!</div>` : ""}
      <div class="product-pricing">
        <span class="product-price">${formatPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ""}
        ${discount   ? `<span class="discount-label">-${discount}%</span>` : ""}
      </div>
    </div>
    <div class="product-card-footer">
      <button class="btn-add-cart ${inCart ? "in-cart" : ""} ${oos ? "oos-btn" : ""}" ${oos ? "disabled" : ""}>
        ${oos ? "Out of Stock" : inCart ? "✓ In Cart" : "+ Add to Cart"}
      </button>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────
// RENDER PRODUCTS
// ─────────────────────────────────────────────────────────────────
function renderProducts() {
  const grid    = document.getElementById("productGrid");
  const empty   = document.getElementById("emptyProducts");
  const counter = document.getElementById("resultsCount");
  const list    = getFilteredProducts();

  counter.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    grid.innerHTML = "";
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }
  grid.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.innerHTML = list.map(p => productCardHTML(p)).join("");

  grid.querySelectorAll(".product-card").forEach(card => {
    const id = Number(card.dataset.id);
    card.querySelector(".btn-add-cart").addEventListener("click", e => {
      e.stopPropagation();
      const p = PRODUCTS.find(x => x.id === id);
      if (p && p.stock === 0) return;
      haptic.medium();
      addToCart(id, 1);
    });
    card.querySelector(".wishlist-toggle").addEventListener("click", e => {
      e.stopPropagation();
      haptic.light();
      toggleWishlist(id);
    });
    card.addEventListener("click", () => openProductModal(id));
  });
}

// ─────────────────────────────────────────────────────────────────
// PRODUCT MODAL
// ─────────────────────────────────────────────────────────────────
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  haptic.light();
  state.currentProduct = p;
  state.modalQty = 1;

  const inCart   = state.cart.some(c => c.id === p.id);
  const oos      = p.stock === 0;
  const lowStock = p.stock > 0 && p.stock <= 5;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const maxQty   = p.stock > 0 ? p.stock : 1;

  let stockClass, stockLabel;
  if (oos)           { stockClass = "out-stock";  stockLabel = "Out of Stock"; }
  else if (lowStock) { stockClass = "low-stock";  stockLabel = `Only ${p.stock} left!`; }
  else               { stockClass = "in-stock";   stockLabel = "In Stock"; }

  const hero = document.getElementById("modalHero");
  if (p.imageUrl) {
    hero.innerHTML = `<img class="modal-hero-img" src="${p.imageUrl}" alt="${p.name}"
      onerror="this.parentElement.innerHTML='<span style=font-size:90px>${p.emoji}</span>';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';" />`;
    hero.style.cssText = "";
  } else {
    hero.innerHTML = `<span style="font-size:90px">${p.emoji}</span>`;
    hero.style.cssText = `background:linear-gradient(135deg,${p.gradient[0]},${p.gradient[1]});`;
  }

  document.getElementById("modalBody").innerHTML = `
    <div class="modal-cat-badge">${p.category}</div>
    <h2 class="modal-title">${p.name}</h2>
    <div class="modal-meta-row">
      <div class="modal-rating"><span class="star">★</span> <strong>${p.rating}</strong> <span style="color:var(--text-sub)">${formatNumber(p.reviews)} reviews</span></div>
      <span class="modal-stock ${stockClass}">${stockLabel}</span>
    </div>
    <p class="modal-desc">${p.description}</p>
    <div class="modal-pricing">
      <span class="modal-price">${formatPrice(p.price)}</span>
      ${p.oldPrice ? `<span class="modal-old-price">${formatPrice(p.oldPrice)}</span>` : ""}
      ${discount   ? `<span class="modal-discount">Save ${discount}%</span>` : ""}
    </div>
    ${!oos ? `
    <div class="qty-row">
      <span class="qty-label">Quantity</span>
      <div class="qty-controls">
        <button class="qty-btn" id="qtyDec" ${state.modalQty <= 1 ? "disabled" : ""}>−</button>
        <span class="qty-value" id="qtyVal">1</span>
        <button class="qty-btn" id="qtyInc" ${state.modalQty >= maxQty ? "disabled" : ""}>+</button>
      </div>
    </div>` : ""}
    <button class="btn-add-to-cart ${inCart ? "in-cart" : ""}" id="modalAddBtn" ${oos ? "disabled" : ""}>
      ${oos ? "Out of Stock" : inCart ? `✓ Added to Cart · ${formatPrice(p.price)}` : `Add to Cart · ${formatPrice(p.price)}`}
    </button>`;

  if (!oos) {
    const dec = document.getElementById("qtyDec");
    const inc = document.getElementById("qtyInc");
    const val = document.getElementById("qtyVal");
    const btn = document.getElementById("modalAddBtn");

    dec.addEventListener("click", () => {
      if (state.modalQty > 1) { haptic.light(); state.modalQty--; val.textContent = state.modalQty; dec.disabled = state.modalQty <= 1; inc.disabled = false; updateModalBtn(btn, p); }
    });
    inc.addEventListener("click", () => {
      if (state.modalQty < maxQty) { haptic.light(); state.modalQty++; val.textContent = state.modalQty; dec.disabled = false; inc.disabled = state.modalQty >= maxQty; updateModalBtn(btn, p); }
    });
    btn.addEventListener("click", () => { haptic.medium(); addToCart(p.id, state.modalQty); updateModalBtn(btn, p); syncTelegramMainButton(); });
  }

  openOverlay("productModal");
  if (tg) { tg.BackButton.show(); tg.BackButton.onClick(closeAllOverlays); }
}

function updateModalBtn(btn, p) {
  const inCart = state.cart.some(c => c.id === p.id);
  btn.className = `btn-add-to-cart ${inCart ? "in-cart" : ""}`;
  btn.textContent = inCart
    ? `✓ Added to Cart · ${formatPrice(p.price * state.modalQty)}`
    : `Add to Cart · ${formatPrice(p.price * state.modalQty)}`;
}

// ─────────────────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────────────────
function addToCart(id, qty = 1) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  const existing = state.cart.find(c => c.id === id);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, p.stock);
  } else {
    state.cart.push({ id, qty: Math.min(qty, p.stock) });
    showToast(`🛒 "${p.name}" added to cart`);
    haptic.success();
  }
  persistCart();
  updateCartCount();
  renderProducts();
  syncTelegramMainButton();
}

function removeFromCart(id) {
  haptic.medium();
  state.cart = state.cart.filter(c => c.id !== id);
  persistCart();
  updateCartCount();
  renderCartItems();
  renderProducts();
  syncTelegramMainButton();
}

function updateCartQty(id, delta) {
  const item = state.cart.find(c => c.id === id);
  const p    = PRODUCTS.find(x => x.id === id);
  if (!item || !p) return;
  haptic.light();
  item.qty = Math.max(1, Math.min(item.qty + delta, p.stock));
  persistCart();
  renderCartItems();
  syncTelegramMainButton();
}

function getCartSubtotal() {
  return state.cart.reduce((sum, c) => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return sum + (p ? p.price * c.qty : 0);
  }, 0);
}

function getDeliveryFee(subtotal) {
  return subtotal >= CONFIG.freeDeliveryThreshold ? 0 : CONFIG.deliveryFee;
}

function updateCartCount() {
  const total = state.cart.reduce((s,c) => s + c.qty, 0);
  const badge = document.getElementById("cartCount");
  badge.textContent = total;
  badge.classList.toggle("hidden", total === 0);
}

function renderCartItems() {
  const container = document.getElementById("cartItems");
  const empty     = document.getElementById("cartEmpty");
  const footer    = document.getElementById("cartFooter");

  if (!state.cart.length) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    footer.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  footer.classList.remove("hidden");

  const subtotal = getCartSubtotal();
  const delivery = getDeliveryFee(subtotal);
  const total    = subtotal + delivery;

  container.innerHTML = state.cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return "";
    return `
      <div class="cart-item" data-id="${p.id}">
        <div class="cart-item-img" style="background:linear-gradient(135deg,${p.gradient[0]}33,${p.gradient[1]}44);">
          ${p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)" onerror="this.style.display='none'">`
            : `<span>${p.emoji}</span>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatPrice(p.price * item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" data-action="dec">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" data-action="inc" ${item.qty >= p.stock ? "disabled" : ""}>+</button>
        </div>
        <button class="cart-item-remove" title="Remove">🗑</button>
      </div>`;
  }).join("");

  container.querySelectorAll(".cart-item").forEach(row => {
    const id = Number(row.dataset.id);
    row.querySelector("[data-action='dec']").addEventListener("click", () => updateCartQty(id,-1));
    row.querySelector("[data-action='inc']").addEventListener("click", () => updateCartQty(id,+1));
    row.querySelector(".cart-item-remove").addEventListener("click", () => removeFromCart(id));
  });

  document.getElementById("cartSubtotal").textContent = formatPrice(subtotal);
  document.getElementById("cartDelivery").textContent = delivery === 0 ? "FREE 🎉" : formatPrice(delivery);
  document.getElementById("cartTotal").textContent    = formatPrice(total);
  document.getElementById("addressTotal").textContent = formatPrice(total);
}

// ─────────────────────────────────────────────────────────────────
// CART STEPS
// ─────────────────────────────────────────────────────────────────
function goToStep(step) {
  state.cartStep = step;
  const isCart    = step === "cart";
  document.getElementById("cartStepCart").classList.toggle("hidden", !isCart);
  document.getElementById("cartStepAddress").classList.toggle("hidden", isCart);
  document.getElementById("stepDot1").classList.toggle("active", isCart);
  document.getElementById("stepDot1").classList.toggle("done", !isCart);
  document.getElementById("stepDot2").classList.toggle("active", !isCart);
  document.querySelector(".step-line").classList.toggle("active", !isCart);

  // Update address total
  const sub = getCartSubtotal();
  document.getElementById("addressTotal").textContent = formatPrice(sub + getDeliveryFee(sub));
}

// ─────────────────────────────────────────────────────────────────
// ADDRESS FORM
// ─────────────────────────────────────────────────────────────────
function validateAddress() {
  const fields = [
    { id:"fieldAddress", err:"errAddress", label:"Street address" },
    { id:"fieldCity",    err:"errCity",    label:"City" },
  ];
  let valid = true;
  fields.forEach(f => {
    const el  = document.getElementById(f.id);
    const err = document.getElementById(f.err);
    const val = el.value.trim();
    if (!val) {
      el.classList.add("error");
      err.textContent = `${f.label} is required`;
      valid = false;
    } else {
      el.classList.remove("error");
      err.textContent = "";
    }
  });
  return valid;
}

function getAddressValues() {
  return {
    addressLine1: document.getElementById("fieldAddress").value.trim(),
    city:         document.getElementById("fieldCity").value.trim(),
    notes:        document.getElementById("fieldNotes").value.trim(),
  };
}

// ─────────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────────
function toggleWishlist(id) {
  const idx = state.wishlist.indexOf(id);
  if (idx === -1) {
    state.wishlist.push(id);
    const p = PRODUCTS.find(x => x.id === id);
    if (p) showToast(`💝 "${p.name}" saved to wishlist`);
    haptic.success();
  } else {
    state.wishlist.splice(idx,1);
    haptic.light();
  }
  persistWishlist();
  updateWishlistCount();
  renderProducts();
}

function updateWishlistCount() {
  const badge = document.getElementById("wishlistCount");
  badge.textContent = state.wishlist.length;
  badge.classList.toggle("hidden", state.wishlist.length === 0);
}

function renderWishlistItems() {
  const container = document.getElementById("wishlistItems");
  const empty     = document.getElementById("wishlistEmpty");
  if (!state.wishlist.length) { container.innerHTML = ""; empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  const items = state.wishlist.map(id => PRODUCTS.find(x => x.id === id)).filter(Boolean);
  container.innerHTML = items.map(p => productCardHTML(p)).join("");
  container.querySelectorAll(".product-card").forEach(card => {
    const id = Number(card.dataset.id);
    card.querySelector(".btn-add-cart").addEventListener("click", e => { e.stopPropagation(); haptic.medium(); addToCart(id,1); renderWishlistItems(); });
    card.querySelector(".wishlist-toggle").addEventListener("click", e => { e.stopPropagation(); toggleWishlist(id); renderWishlistItems(); });
    card.addEventListener("click", () => openProductModal(id));
  });
}

// ─────────────────────────────────────────────────────────────────
// OVERLAYS
// ─────────────────────────────────────────────────────────────────
const OVERLAYS = ["productModal","cartPanel","wishlistPanel","confirmOverlay"];

function openOverlay(id) {
  OVERLAYS.forEach(oid => document.getElementById(oid).classList.toggle("open", oid === id));
  document.body.style.overflow = "hidden";
}

function closeAllOverlays() {
  OVERLAYS.forEach(oid => document.getElementById(oid).classList.remove("open"));
  document.body.style.overflow = "";
  state.currentProduct = null;
  goToStep("cart");
  if (tg) tg.BackButton.hide();
  syncTelegramMainButton();
}

// ─────────────────────────────────────────────────────────────────
// ORDER CONFIRMATION OVERLAY
// ─────────────────────────────────────────────────────────────────
function showConfirmation(order) {
  const sub      = order.subtotal;
  const delivery = order.delivery;
  const short    = order.orderId.slice(-8);
  const itemsStr = order.items.map(i => `${i.name} × ${i.qty}`).join(", ");

  document.getElementById("confirmDetails").innerHTML = `
    <div class="confirm-row"><span>Order ID</span>     <strong>#${short}</strong></div>
    <div class="confirm-row"><span>Items</span>        <strong>${order.items.length} item${order.items.length > 1 ? "s" : ""}</strong></div>
    <div class="confirm-row"><span>Subtotal</span>     <strong>${formatPrice(sub)}</strong></div>
    <div class="confirm-row"><span>Delivery</span>     <strong>${delivery === 0 ? "FREE 🎉" : formatPrice(delivery)}</strong></div>
    <div class="confirm-row"><span>Total Paid</span>   <strong style="color:var(--accent);font-size:16px">${formatPrice(order.total)}</strong></div>
    <div class="confirm-row"><span>Ship to</span>      <strong>${order.address.city}</strong></div>`;

  openOverlay("confirmOverlay");

  // Reset checkmark animation
  const check = document.getElementById("confirmCheck");
  check.style.animation = "none";
  check.offsetHeight; // reflow
  check.style.animation = "";
}

// ─────────────────────────────────────────────────────────────────
// TELEGRAM MAIN BUTTON
// ─────────────────────────────────────────────────────────────────
function syncTelegramMainButton() {
  if (!isInTelegram || !tg?.MainButton) return;
  const count = state.cart.reduce((s,c) => s + c.qty, 0);
  if (count > 0) {
    const sub   = getCartSubtotal();
    const total = sub + getDeliveryFee(sub);
    tg.MainButton.setText(`Checkout · ${formatPrice(total)} (${count} item${count>1?"s":""})`);
    tg.MainButton.show();
  } else {
    tg.MainButton.hide();
  }
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────────
function checkout() {
  if (!state.cart.length) return;
  if (!validateAddress()) { haptic.error(); showToast("⚠️ Please fill in all required fields", 2500); return; }

  haptic.success();

  const address  = getAddressValues();
  const subtotal = getCartSubtotal();
  const delivery = getDeliveryFee(subtotal);
  const total    = subtotal + delivery;

  const items = state.cart.map(c => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return { id:p.id, name:p.name, category:p.category, price:p.price, qty:c.qty, lineTotal:+(p.price*c.qty).toFixed(2) };
  });

  const order = {
    orderId:   `ORD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    customer: {
      telegramId: tg?.initDataUnsafe?.user?.id         ?? null,
      firstName:  tg?.initDataUnsafe?.user?.first_name ?? "Guest",
      lastName:   tg?.initDataUnsafe?.user?.last_name  ?? "",
      username:   tg?.initDataUnsafe?.user?.username   ?? null,
    },
    address,
    items,
    subtotal: +subtotal.toFixed(2),
    delivery: +delivery.toFixed(2),
    total:    +total.toFixed(2),
    currency: CONFIG.currency,
  };

  // Close cart immediately — prevents cart showing behind confirmation
  closeAllOverlays();

  const webhookReady = CONFIG.webhookUrl && CONFIG.webhookUrl !== "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

  const afterOrder = (ok) => {
    if (!ok) { haptic.error(); showToast("⚠️ Could not place order. Please try again.", 3000); return; }

    // Clear cart
    state.cart = [];
    persistCart();
    updateCartCount();
    renderProducts();
    syncTelegramMainButton();

    // Show confirmation
    showConfirmation(order);
  };

  if (webhookReady) {
    // text/plain avoids CORS preflight — Google Apps Script rejects OPTIONS requests
    fetch(CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(order),
    })
    .then(r => r.json())
    .then(res => afterOrder(res.ok))
    .catch(err => { console.warn("Webhook error:", err); afterOrder(true); });
  } else {
    console.log("📦 Order (demo mode):", order);
    setTimeout(() => afterOrder(true), 700);
  }

  if (isInTelegram) tg.sendData(JSON.stringify(order));
}

// ─────────────────────────────────────────────────────────────────
// SEARCH & SORT
// ─────────────────────────────────────────────────────────────────
function setupSearch() {
  const input  = document.getElementById("searchInput");
  const clear  = document.getElementById("clearSearch");
  const cancel = document.getElementById("searchCancel");
  let timer;

  input.addEventListener("focus", () => {
    cancel.classList.remove("hidden");
  });

  input.addEventListener("input", () => {
    state.searchQuery = input.value.trim();
    clear.classList.toggle("hidden", !state.searchQuery);
    clearTimeout(timer);
    timer = setTimeout(renderProducts, 220);
  });

  clear.addEventListener("click", () => {
    input.value = ""; state.searchQuery = "";
    clear.classList.add("hidden");
    input.focus();
    renderProducts();
  });

  cancel.addEventListener("click", () => {
    input.value = ""; state.searchQuery = "";
    clear.classList.add("hidden");
    cancel.classList.add("hidden");
    input.blur();
    renderProducts();
  });
}

function setupSort() {
  document.getElementById("sortSelect").addEventListener("change", e => {
    state.sortBy = e.target.value;
    haptic.selection();
    renderProducts();
  });
}

function resetFilters() {
  state.searchQuery = ""; state.activeCategory = "all";
  document.getElementById("searchInput").value = "";
  document.getElementById("clearSearch").classList.add("hidden");
  document.getElementById("searchCancel").classList.add("hidden");
  document.getElementById("searchInput").blur();
  document.querySelectorAll(".cat-chip").forEach(b => b.classList.toggle("active", b.dataset.cat === "all"));
  renderProducts();
}
window.resetFilters = resetFilters;

// ─────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────
function formatPrice(n)  { return CONFIG.currency + n.toFixed(2); }
function formatNumber(n) { return n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n); }

// ─────────────────────────────────────────────────────────────────
// EVENT BINDINGS
// ─────────────────────────────────────────────────────────────────
function bindEvents() {
  // Header
  document.getElementById("cartBtn").addEventListener("click", () => {
    haptic.light(); renderCartItems(); goToStep("cart"); openOverlay("cartPanel");
  });
  document.getElementById("wishlistBtn").addEventListener("click", () => {
    haptic.light(); renderWishlistItems(); openOverlay("wishlistPanel");
  });

  // Close buttons
  document.getElementById("closeProductModal").addEventListener("click", closeAllOverlays);
  document.getElementById("closeCart").addEventListener("click", closeAllOverlays);
  document.getElementById("closeCartAddress").addEventListener("click", closeAllOverlays);
  document.getElementById("closeWishlist").addEventListener("click", closeAllOverlays);
  document.getElementById("closeConfirmBtn").addEventListener("click", closeAllOverlays);
  const closeAppBtn = document.getElementById("closeAppBtn");
  if (isInTelegram) {
    closeAppBtn.addEventListener("click", () => { haptic.light(); tg.close(); });
  } else {
    closeAppBtn.style.display = "none";
  }

  // Cart step navigation
  document.getElementById("goToAddressBtn").addEventListener("click", () => {
    if (!state.cart.length) return;
    haptic.light(); goToStep("address");
  });
  document.getElementById("backToCartBtn").addEventListener("click", () => {
    haptic.light(); goToStep("cart");
  });

  // Place order
  document.getElementById("checkoutBtn").addEventListener("click", checkout);

  // Telegram MainButton
  if (isInTelegram && tg?.MainButton) {
    tg.MainButton.onClick(() => { renderCartItems(); goToStep("cart"); openOverlay("cartPanel"); });
  }

  // Backdrop tap to close
  OVERLAYS.forEach(id => {
    document.getElementById(id).addEventListener("click", e => {
      if (e.target === e.currentTarget) closeAllOverlays();
    });
  });

  // Scroll shadow
  window.addEventListener("scroll", () => {
    document.getElementById("header").classList.toggle("scrolled", window.scrollY > 8);
  }, { passive:true });

  // Escape key
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAllOverlays(); });
}

// ─────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────
async function init() {
  applyTheme();
  showSkeleton();

  await loadData();

  hideSkeleton();
  renderCarousel();
  renderCategories();
  renderProducts();
  updateCartCount();
  updateWishlistCount();
  setupSearch();
  setupSort();
  bindEvents();
  syncTelegramMainButton();

  console.log("%cTG Store v3 ready 🛍️", "color:#0a84ff;font-size:14px;font-weight:bold;");
}

document.addEventListener("DOMContentLoaded", init);
