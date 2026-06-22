/* ═══════════════════════════════════════════════════════════════════
   TG STORE — app.js
   Plain ES6, no dependencies. Connects to Telegram WebApp SDK.
   Designed to be easily replaced with Firebase / Supabase / REST API.
═══════════════════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────────────────────────
// CONFIG  (easy to swap per deployment)
// ─────────────────────────────────────────────────────────────────
const CONFIG = {
  storeName:             "TG Store",
  storeTagline:          "Premium Mobile Shopping",
  currency:              "$",
  deliveryFee:           3.99,
  freeDeliveryThreshold: 50,      // free delivery above this subtotal
  carouselInterval:      4500,    // ms between auto-slides
  localStorageCartKey:   "tgstore_cart_v1",
  localStorageWishKey:   "tgstore_wish_v1",
  // Paste your Google Apps Script Web App URL here after deploying
  webhookUrl:            "PASTE_YOUR_APPS_SCRIPT_URL_HERE",
};

// ─────────────────────────────────────────────────────────────────
// BANNER DATA
// ─────────────────────────────────────────────────────────────────
const BANNERS = [
  {
    id:       "b1",
    label:    "Just Arrived",
    title:    "New Arrivals\nThis Week",
    subtitle: "Fresh styles, latest tech",
    cta:      "Shop Now",
    emoji:    "🆕",
    gradient: ["#667eea", "#764ba2"],
    category: "new",
  },
  {
    id:       "b2",
    label:    "Limited Time",
    title:    "Up to 40% Off\nSelected Items",
    subtitle: "While stocks last",
    cta:      "See Deals",
    emoji:    "🔥",
    gradient: ["#f093fb", "#f5576c"],
    category: "sale",
  },
  {
    id:       "b3",
    label:    "Best Sellers",
    title:    "Free Delivery\nOver $50",
    subtitle: "On all qualifying orders",
    cta:      "Explore",
    emoji:    "🚀",
    gradient: ["#4facfe", "#00f2fe"],
    category: "all",
  },
];

// ─────────────────────────────────────────────────────────────────
// CATEGORY DATA
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "All",         emoji: "🏠" },
  { id: "phones",      label: "Phones",      emoji: "📱" },
  { id: "electronics", label: "Electronics", emoji: "💻" },
  { id: "fashion",     label: "Fashion",     emoji: "👗" },
  { id: "beauty",      label: "Beauty",      emoji: "✨" },
  { id: "accessories", label: "Accessories", emoji: "💍" },
  { id: "food",        label: "Food",        emoji: "🍜" },
];

// ─────────────────────────────────────────────────────────────────
// PRODUCT DATA
// Replace with API call: fetch("/api/products").then(r => r.json())
// ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id:          1,
    name:        "iPhone 15 Pro Leather Case",
    category:    "phones",
    price:       24.99,
    oldPrice:    39.99,
    rating:      4.8,
    reviews:     312,
    description: "Premium full-grain leather with MagSafe compatibility. Military-grade drop protection with a slim profile. Available in Midnight and Sand.",
    stock:       15,
    badge:       "Sale",
    emoji:       "📱",
    gradient:    ["#667eea", "#764ba2"],
    isNew:       false,
  },
  {
    id:          2,
    name:        "AirPods Pro 2nd Gen",
    category:    "electronics",
    price:       189.99,
    oldPrice:    249.99,
    rating:      4.9,
    reviews:     1204,
    description: "Active noise cancellation, transparency mode, and spatial audio. 6h listening time; charging case adds 30h total battery life.",
    stock:       8,
    badge:       "Hot",
    emoji:       "🎧",
    gradient:    ["#f093fb", "#f5576c"],
    isNew:       false,
  },
  {
    id:          3,
    name:        "Nike Air Max 2025",
    category:    "fashion",
    price:       129.99,
    oldPrice:    null,
    rating:      4.7,
    reviews:     89,
    description: "Lightweight mesh upper with responsive Air cushioning. Breathable, durable, and engineered for all-day comfort on any surface.",
    stock:       22,
    badge:       "New",
    emoji:       "👟",
    gradient:    ["#43e97b", "#38f9d7"],
    isNew:       true,
  },
  {
    id:          4,
    name:        "Vitamin C Brightening Serum",
    category:    "beauty",
    price:       34.99,
    oldPrice:    49.99,
    rating:      4.6,
    reviews:     567,
    description: "15% stabilized Vitamin C, hyaluronic acid, and niacinamide. Visibly reduces dark spots and boosts radiance in 4 weeks.",
    stock:       40,
    badge:       "Sale",
    emoji:       "🌟",
    gradient:    ["#fa709a", "#fee140"],
    isNew:       false,
  },
  {
    id:          5,
    name:        "Gold Link Chain Necklace",
    category:    "accessories",
    price:       45.99,
    oldPrice:    null,
    rating:      4.5,
    reviews:     143,
    description: "18k gold-plated stainless steel link chain. Tarnish-resistant and waterproof. Length 45 cm with a 5 cm extender.",
    stock:       30,
    badge:       "New",
    emoji:       "📿",
    gradient:    ["#f6d365", "#fda085"],
    isNew:       true,
  },
  {
    id:          6,
    name:        "Sushi Premium Bento Box",
    category:    "food",
    price:       18.99,
    oldPrice:    null,
    rating:      4.8,
    reviews:     421,
    description: "12-piece premium sushi selection: salmon, tuna, prawn, and vegetable rolls. Freshly prepared and delivered same day.",
    stock:       50,
    badge:       "Hot",
    emoji:       "🍱",
    gradient:    ["#a18cd1", "#fbc2eb"],
    isNew:       false,
  },
  {
    id:          7,
    name:        "Samsung Galaxy S24 Ultra",
    category:    "phones",
    price:       899.99,
    oldPrice:    1099.99,
    rating:      4.8,
    reviews:     2341,
    description: "6.8\" QHD+ Dynamic AMOLED, 200MP camera system, built-in S Pen, and 5000mAh battery with 45W fast charging.",
    stock:       5,
    badge:       "Hot",
    emoji:       "🤳",
    gradient:    ["#0f0c29", "#302b63"],
    isNew:       false,
  },
  {
    id:          8,
    name:        "Smart Watch Pro 9",
    category:    "electronics",
    price:       299.99,
    oldPrice:    399.99,
    rating:      4.7,
    reviews:     876,
    description: "AMOLED always-on display, GPS, SpO2, ECG monitor, 14-day battery life. 5ATM water resistance.",
    stock:       12,
    badge:       "Sale",
    emoji:       "⌚",
    gradient:    ["#2af598", "#009efd"],
    isNew:       false,
  },
  {
    id:          9,
    name:        "Genuine Leather Tote Bag",
    category:    "fashion",
    price:       89.99,
    oldPrice:    null,
    rating:      4.6,
    reviews:     203,
    description: "Full-grain leather with canvas lining. Fits a 15\" laptop. Adjustable shoulder strap, magnetic closure, 3 internal pockets.",
    stock:       18,
    badge:       "New",
    emoji:       "👜",
    gradient:    ["#d4fc79", "#96e6a1"],
    isNew:       true,
  },
  {
    id:          10,
    name:        "Rosehip Facial Oil",
    category:    "beauty",
    price:       28.99,
    oldPrice:    null,
    rating:      4.7,
    reviews:     389,
    description: "100% cold-pressed rosehip seed oil. Rich in omega fatty acids and vitamin A. Reduces fine lines and improves skin texture overnight.",
    stock:       60,
    badge:       null,
    emoji:       "🌹",
    gradient:    ["#fccb90", "#d57eeb"],
    isNew:       false,
  },
  {
    id:          11,
    name:        "Polarized Sunglasses",
    category:    "accessories",
    price:       59.99,
    oldPrice:    79.99,
    rating:      4.4,
    reviews:     167,
    description: "UV400 polarized lenses with TR90 flexible frame. Blocks 99.9% of UVA/UVB rays. Includes protective case and microfiber cloth.",
    stock:       25,
    badge:       "Sale",
    emoji:       "🕶️",
    gradient:    ["#89f7fe", "#66a6ff"],
    isNew:       false,
  },
  {
    id:          12,
    name:        "Matcha Latte Starter Kit",
    category:    "food",
    price:       24.99,
    oldPrice:    null,
    rating:      4.9,
    reviews:     512,
    description: "Ceremonial-grade Japanese matcha, bamboo whisk, and chawan bowl. Makes 30+ cups. Perfect gift for matcha lovers.",
    stock:       35,
    badge:       "Hot",
    emoji:       "🍵",
    gradient:    ["#84fab0", "#8fd3f4"],
    isNew:       false,
  },
  {
    id:          13,
    name:        "Magsafe Wireless Charger",
    category:    "electronics",
    price:       49.99,
    oldPrice:    69.99,
    rating:      4.5,
    reviews:     334,
    description: "15W wireless charging for iPhone 12–15 series. Slim 6mm profile, LED indicator, USB-C cable included. Works with any Qi device at 7.5W.",
    stock:       20,
    badge:       "Sale",
    emoji:       "🔋",
    gradient:    ["#a1c4fd", "#c2e9fb"],
    isNew:       false,
  },
  {
    id:          14,
    name:        "Premium Cotton Hoodie",
    category:    "fashion",
    price:       74.99,
    oldPrice:    null,
    rating:      4.6,
    reviews:     291,
    description: "400gsm heavyweight French terry cotton. Brushed inner lining, reinforced ribbing, and a spacious kangaroo pocket. Unisex sizing.",
    stock:       45,
    badge:       "New",
    emoji:       "🧥",
    gradient:    ["#e0c3fc", "#8ec5fc"],
    isNew:       true,
  },
  {
    id:          15,
    name:        "Glossy Lip Set (6 Shades)",
    category:    "beauty",
    price:       19.99,
    oldPrice:    29.99,
    rating:      4.3,
    reviews:     608,
    description: "Long-lasting non-sticky formula with hyaluronic acid for plumping. Shades: Nude Glam, Berry Pop, Coral Sun, Rose Baby, Red Hot, Peach Kiss.",
    stock:       70,
    badge:       "Sale",
    emoji:       "💄",
    gradient:    ["#f77062", "#fe5196"],
    isNew:       false,
  },
];

// ─────────────────────────────────────────────────────────────────
// TELEGRAM WEBAP INIT
// ─────────────────────────────────────────────────────────────────
const tg = window.Telegram?.WebApp ?? null;

// True only when launched inside an actual Telegram client
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
};

// ─────────────────────────────────────────────────────────────────
// LOCALSTORAGE HELPERS
// ─────────────────────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota exceeded */ }
}

function persistCart()     { saveToStorage(CONFIG.localStorageCartKey, state.cart); }
function persistWishlist() { saveToStorage(CONFIG.localStorageWishKey, state.wishlist); }

// ─────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────
function applyTheme() {
  const scheme = tg?.colorScheme ?? "light";
  document.documentElement.setAttribute("data-theme", scheme);

  if (tg?.themeParams) {
    const p = tg.themeParams;
    const root = document.documentElement;
    if (p.bg_color)             root.style.setProperty("--bg",       p.bg_color);
    if (p.secondary_bg_color)   root.style.setProperty("--bg-card",  p.secondary_bg_color);
    if (p.text_color)           root.style.setProperty("--text",     p.text_color);
    if (p.hint_color)           root.style.setProperty("--text-sub", p.hint_color);
    if (p.button_color)         root.style.setProperty("--accent",   p.button_color);
    if (p.button_text_color)    root.style.setProperty("--accent-text", p.button_text_color);
  }
}

// Re-apply whenever the user switches Telegram's theme
if (tg) tg.onEvent("themeChanged", applyTheme);

// ─────────────────────────────────────────────────────────────────
// HAPTICS
// ─────────────────────────────────────────────────────────────────
const haptic = {
  light()     { tg?.HapticFeedback?.impactOccurred("light"); },
  medium()    { tg?.HapticFeedback?.impactOccurred("medium"); },
  success()   { tg?.HapticFeedback?.notificationOccurred("success"); },
  warning()   { tg?.HapticFeedback?.notificationOccurred("warning"); },
  error()     { tg?.HapticFeedback?.notificationOccurred("error"); },
  selection() { tg?.HapticFeedback?.selectionChanged(); },
};

// ─────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(message, duration = 2200) {
  const el = document.getElementById("toast");
  el.textContent = message;
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

  track.innerHTML = BANNERS.map((b, i) => `
    <div
      class="carousel-slide"
      data-index="${i}"
      data-category="${b.category}"
      role="tab"
      aria-label="${b.title.replace("\n", " ")}"
      tabindex="0"
    >
      <div class="slide-bg" style="background: linear-gradient(135deg, ${b.gradient[0]}, ${b.gradient[1]});"></div>
      <span class="slide-emoji" aria-hidden="true">${b.emoji}</span>
      <div class="slide-content">
        <div class="slide-label">${b.label}</div>
        <div class="slide-title">${b.title.replace("\n", "<br>")}</div>
        <div class="slide-subtitle">${b.subtitle}</div>
        <span class="slide-btn">${b.cta} →</span>
      </div>
    </div>
  `).join("");

  dots.innerHTML = BANNERS.map((_, i) => `
    <button class="dot ${i === 0 ? "active" : ""}" data-index="${i}" role="tab" aria-label="Banner ${i + 1}"></button>
  `).join("");

  // Slide click → filter by category
  track.querySelectorAll(".carousel-slide").forEach(slide => {
    slide.addEventListener("click", () => {
      haptic.selection();
      const cat = slide.dataset.category;
      if (cat && cat !== state.activeCategory) {
        setCategory(cat);
        document.getElementById("mainContent")
          .querySelector(".products-section")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  dots.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => {
      haptic.light();
      goToSlide(Number(dot.dataset.index));
    });
  });

  startCarousel();
}

function goToSlide(index) {
  const track   = document.getElementById("carouselTrack");
  const slides  = track.querySelectorAll(".carousel-slide");
  const dots    = document.getElementById("carouselDots").querySelectorAll(".dot");

  if (!slides.length) return;
  state.carouselIndex = (index + slides.length) % slides.length;

  // Calculate offset: each slide is 100% - 40px padding + 12px gap
  // We use CSS-level scroll instead for reliability
  const viewport = track.parentElement;
  const slideW   = slides[0].getBoundingClientRect().width + 12; // gap
  track.style.transform = `translateX(calc(-${state.carouselIndex} * (${slideW}px)))`;

  dots.forEach((d, i) => d.classList.toggle("active", i === state.carouselIndex));
}

function startCarousel() {
  clearInterval(state.carouselTimer);
  state.carouselTimer = setInterval(() => {
    goToSlide(state.carouselIndex + 1);
  }, CONFIG.carouselInterval);
}

// Recalculate slide width on resize
window.addEventListener("resize", () => goToSlide(state.carouselIndex), { passive: true });

// ─────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────
function renderCategories() {
  const list = document.getElementById("categoryList");
  list.innerHTML = CATEGORIES.map(cat => `
    <button
      class="cat-chip ${cat.id === state.activeCategory ? "active" : ""}"
      data-cat="${cat.id}"
      role="listitem"
    >
      <span aria-hidden="true">${cat.emoji}</span> ${cat.label}
    </button>
  `).join("");

  list.querySelectorAll(".cat-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      haptic.selection();
      setCategory(btn.dataset.cat);
    });
  });
}

function setCategory(catId) {
  state.activeCategory = catId;
  document.querySelectorAll(".cat-chip").forEach(b => {
    b.classList.toggle("active", b.dataset.cat === catId);
  });
  renderProducts();
}

// ─────────────────────────────────────────────────────────────────
// FILTERING & SORTING
// ─────────────────────────────────────────────────────────────────
function getFilteredProducts() {
  let list = [...PRODUCTS];

  // Category
  if (state.activeCategory !== "all") {
    list = list.filter(p => p.category === state.activeCategory);
  }

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q)        ||
      p.category.toLowerCase().includes(q)    ||
      p.description.toLowerCase().includes(q) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (state.sortBy) {
    case "price-low":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      list.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    default: // popular — sort by reviews descending
      list.sort((a, b) => b.reviews - a.reviews);
  }

  return list;
}

// ─────────────────────────────────────────────────────────────────
// PRODUCTS RENDER
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

  // Bind card events
  grid.querySelectorAll(".product-card").forEach(card => {
    const id = Number(card.dataset.id);

    card.querySelector(".btn-add-cart").addEventListener("click", e => {
      e.stopPropagation();
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

function productCardHTML(p) {
  const inCart     = state.cart.some(c => c.id === p.id);
  const inWish     = state.wishlist.includes(p.id);
  const discount   = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const badgeClass = p.badge ? `badge-${p.badge.toLowerCase()}` : "";

  return `
  <div class="product-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name}">
    <div class="product-image" style="background: linear-gradient(135deg, ${p.gradient[0]}33, ${p.gradient[1]}55);">
      <span style="font-size:52px" aria-hidden="true">${p.emoji}</span>
      ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ""}
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
      <div class="product-pricing">
        <span class="product-price">${formatPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ""}
        ${discount ? `<span class="discount-label">-${discount}%</span>` : ""}
      </div>
    </div>
    <div class="product-card-footer">
      <button class="btn-add-cart ${inCart ? "in-cart" : ""}">
        ${inCart
          ? `<span>✓ In Cart</span>`
          : `<span>+ Add to Cart</span>`
        }
      </button>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────
// PRODUCT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  haptic.light();
  state.currentProduct = p;
  state.modalQty       = 1;

  const hero  = document.getElementById("modalHero");
  const body  = document.getElementById("modalBody");
  const inCart = state.cart.some(c => c.id === p.id);
  const inWish = state.wishlist.includes(p.id);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  let stockClass, stockLabel;
  if (p.stock === 0)      { stockClass = "out-stock";  stockLabel = "Out of Stock"; }
  else if (p.stock <= 5)  { stockClass = "low-stock";  stockLabel = `Only ${p.stock} left!`; }
  else                    { stockClass = "in-stock";   stockLabel = "In Stock"; }

  hero.style.cssText = `background: linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]});`;
  hero.innerHTML = `<span style="font-size:90px" aria-hidden="true">${p.emoji}</span>`;

  body.innerHTML = `
    <div class="modal-cat-badge">${p.category}</div>
    <h2 class="modal-title">${p.name}</h2>
    <div class="modal-meta-row">
      <div class="modal-rating">
        <span class="star" aria-hidden="true">★</span>
        <strong>${p.rating}</strong>
        <span style="color:var(--text-sub)">${formatNumber(p.reviews)} reviews</span>
      </div>
      <span class="modal-stock ${stockClass}">${stockLabel}</span>
    </div>
    <p class="modal-desc">${p.description}</p>
    <div class="modal-pricing">
      <span class="modal-price">${formatPrice(p.price)}</span>
      ${p.oldPrice ? `<span class="modal-old-price">${formatPrice(p.oldPrice)}</span>` : ""}
      ${discount ? `<span class="modal-discount">Save ${discount}%</span>` : ""}
    </div>
    <div class="qty-row">
      <span class="qty-label">Quantity</span>
      <div class="qty-controls">
        <button class="qty-btn" id="qtyDec" aria-label="Decrease quantity" ${state.modalQty <= 1 ? "disabled" : ""}>−</button>
        <span class="qty-value" id="qtyVal">${state.modalQty}</span>
        <button class="qty-btn" id="qtyInc" aria-label="Increase quantity">+</button>
      </div>
    </div>
    <button class="btn-add-to-cart ${inCart ? "in-cart" : ""}" id="modalAddBtn" ${p.stock === 0 ? "disabled" : ""}>
      ${p.stock === 0
        ? "Out of Stock"
        : inCart
          ? `✓ Added to Cart · ${formatPrice(p.price * state.modalQty)}`
          : `Add to Cart · ${formatPrice(p.price * state.modalQty)}`
      }
    </button>
  `;

  // Quantity controls
  const qtyDec = body.querySelector("#qtyDec");
  const qtyInc = body.querySelector("#qtyInc");
  const qtyVal = body.querySelector("#qtyVal");
  const addBtn = body.querySelector("#modalAddBtn");

  qtyDec.addEventListener("click", () => {
    if (state.modalQty > 1) {
      haptic.light();
      state.modalQty--;
      qtyVal.textContent = state.modalQty;
      qtyDec.disabled = state.modalQty <= 1;
      updateModalAddBtn(addBtn, p);
    }
  });

  qtyInc.addEventListener("click", () => {
    haptic.light();
    state.modalQty++;
    qtyVal.textContent = state.modalQty;
    qtyDec.disabled = false;
    updateModalAddBtn(addBtn, p);
  });

  addBtn.addEventListener("click", () => {
    if (p.stock === 0) return;
    haptic.medium();
    addToCart(p.id, state.modalQty);
    updateModalAddBtn(addBtn, p);
    // Use Telegram MainButton if inside Telegram
    syncTelegramMainButton();
  });

  openOverlay("productModal");

  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(closeAllOverlays);
  }
}

function updateModalAddBtn(btn, p) {
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
  const product  = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const existing = state.cart.find(c => c.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({ id, qty });
    showToast(`🛒 "${product.name}" added to cart`);
    haptic.success();
  }

  persistCart();
  updateCartCount();
  renderProducts(); // refresh card states
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
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  haptic.light();
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
  const total = state.cart.reduce((s, c) => s + c.qty, 0);
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
        <div class="cart-item-img" style="background: linear-gradient(135deg, ${p.gradient[0]}33, ${p.gradient[1]}44);">
          <span aria-hidden="true">${p.emoji}</span>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatPrice(p.price * item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" data-action="dec" aria-label="Decrease">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" data-action="inc" aria-label="Increase">+</button>
        </div>
        <button class="cart-item-remove" aria-label="Remove ${p.name}">🗑</button>
      </div>`;
  }).join("");

  container.querySelectorAll(".cart-item").forEach(row => {
    const id = Number(row.dataset.id);
    row.querySelector("[data-action='dec']").addEventListener("click", () => updateCartQty(id, -1));
    row.querySelector("[data-action='inc']").addEventListener("click", () => updateCartQty(id, +1));
    row.querySelector(".cart-item-remove").addEventListener("click", () => removeFromCart(id));
  });

  document.getElementById("cartSubtotal").textContent = formatPrice(subtotal);
  document.getElementById("cartDelivery").textContent =
    delivery === 0 ? "FREE 🎉" : formatPrice(delivery);
  document.getElementById("cartTotal").textContent = formatPrice(total);
}

// ─────────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────────
function toggleWishlist(id) {
  const idx = state.wishlist.indexOf(id);
  if (idx === -1) {
    state.wishlist.push(id);
    const p = PRODUCTS.find(x => x.id === id);
    showToast(`💝 "${p.name}" saved to wishlist`);
    haptic.success();
  } else {
    state.wishlist.splice(idx, 1);
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

  if (!state.wishlist.length) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  container.innerHTML = state.wishlist.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return "";
    return productCardHTML(p);
  }).join("");

  container.querySelectorAll(".product-card").forEach(card => {
    const id = Number(card.dataset.id);

    card.querySelector(".btn-add-cart").addEventListener("click", e => {
      e.stopPropagation();
      haptic.medium();
      addToCart(id, 1);
      renderWishlistItems();
    });

    card.querySelector(".wishlist-toggle").addEventListener("click", e => {
      e.stopPropagation();
      toggleWishlist(id);
      renderWishlistItems();
    });

    card.addEventListener("click", () => openProductModal(id));
  });
}

// ─────────────────────────────────────────────────────────────────
// OVERLAYS (open / close)
// ─────────────────────────────────────────────────────────────────
const OVERLAYS = ["productModal", "cartPanel", "wishlistPanel"];

function openOverlay(id) {
  OVERLAYS.forEach(oid => {
    document.getElementById(oid).classList.toggle("open", oid === id);
  });
  document.body.style.overflow = "hidden";
}

function closeAllOverlays() {
  OVERLAYS.forEach(oid => document.getElementById(oid).classList.remove("open"));
  document.body.style.overflow = "";
  state.currentProduct = null;
  if (tg) tg.BackButton.hide();
  syncTelegramMainButton();
}

// ─────────────────────────────────────────────────────────────────
// TELEGRAM MAIN BUTTON
// ─────────────────────────────────────────────────────────────────
function syncTelegramMainButton() {
  if (!isInTelegram || !tg?.MainButton) return;
  const count = state.cart.reduce((s, c) => s + c.qty, 0);
  if (count > 0) {
    const total = getCartSubtotal() + getDeliveryFee(getCartSubtotal());
    tg.MainButton.setText(`Checkout · ${formatPrice(total)} (${count} item${count > 1 ? "s" : ""})`);
    tg.MainButton.show();
    tg.MainButton.color = tg.themeParams?.button_color ?? "#0a7cff";
  } else {
    tg.MainButton.hide();
  }
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────────
function checkout() {
  if (!state.cart.length) return;

  haptic.success();

  const subtotal = getCartSubtotal();
  const delivery = getDeliveryFee(subtotal);
  const total    = subtotal + delivery;

  const items = state.cart.map(c => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return {
      id:        p.id,
      name:      p.name,
      category:  p.category,
      price:     p.price,
      qty:       c.qty,
      lineTotal: +(p.price * c.qty).toFixed(2),
    };
  });

  const order = {
    orderId:   `ORD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    customer: {
      telegramId:   tg?.initDataUnsafe?.user?.id        ?? null,
      firstName:    tg?.initDataUnsafe?.user?.first_name ?? "Guest",
      lastName:     tg?.initDataUnsafe?.user?.last_name  ?? "",
      username:     tg?.initDataUnsafe?.user?.username   ?? null,
    },
    items,
    subtotal: +subtotal.toFixed(2),
    delivery: +delivery.toFixed(2),
    total:    +total.toFixed(2),
    currency: CONFIG.currency,
  };

  // Disable button to prevent double-submit
  const btn = document.getElementById("checkoutBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Placing order…"; }

  const webhookReady = CONFIG.webhookUrl &&
                       CONFIG.webhookUrl !== "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

  if (webhookReady) {
    // POST to Google Apps Script → saves to Sheet + notifies seller + buyer
    fetch(CONFIG.webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(order),
    })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        onOrderSuccess(order);
      } else {
        onOrderError(btn, res.error);
      }
    })
    .catch(err => {
      // Webhook failed — still confirm locally so user isn't left hanging
      console.warn("Webhook error (order may still have saved):", err);
      onOrderSuccess(order);
    });
  } else {
    // Demo mode — no webhook configured yet
    console.log("📦 Order (demo):", order);
    setTimeout(() => onOrderSuccess(order), 600);
  }

  // Also send via Telegram sendData when inside Telegram (bot receives it too)
  if (isInTelegram) {
    tg.sendData(JSON.stringify(order));
  }
}

function onOrderSuccess(order) {
  state.cart = [];
  persistCart();
  updateCartCount();
  renderCartItems();
  renderProducts();
  closeAllOverlays();
  syncTelegramMainButton();

  const shortId = order.orderId.slice(-8);
  showToast(`✅ Order #${shortId} placed! Check Telegram for confirmation.`, 3500);

  const btn = document.getElementById("checkoutBtn");
  if (btn) { btn.disabled = false; btn.textContent = "Proceed to Checkout"; }
}

function onOrderError(btn, errorMsg) {
  if (btn) { btn.disabled = false; btn.textContent = "Proceed to Checkout"; }
  haptic.error();
  showToast("⚠️ Could not place order. Please try again.", 3000);
  console.error("Order error:", errorMsg);
}

// ─────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("searchInput");
  const clear = document.getElementById("clearSearch");

  let debounceTimer;
  input.addEventListener("input", () => {
    state.searchQuery = input.value.trim();
    clear.classList.toggle("hidden", !state.searchQuery);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderProducts, 220);
  });

  clear.addEventListener("click", () => {
    input.value       = "";
    state.searchQuery = "";
    clear.classList.add("hidden");
    input.focus();
    renderProducts();
  });
}

// ─────────────────────────────────────────────────────────────────
// SORT
// ─────────────────────────────────────────────────────────────────
function setupSort() {
  document.getElementById("sortSelect").addEventListener("change", e => {
    state.sortBy = e.target.value;
    haptic.selection();
    renderProducts();
  });
}

// ─────────────────────────────────────────────────────────────────
// RESET FILTERS (called from empty-state HTML)
// ─────────────────────────────────────────────────────────────────
function resetFilters() {
  state.searchQuery     = "";
  state.activeCategory  = "all";
  document.getElementById("searchInput").value = "";
  document.getElementById("clearSearch").classList.add("hidden");
  document.querySelectorAll(".cat-chip").forEach(b => {
    b.classList.toggle("active", b.dataset.cat === "all");
  });
  renderProducts();
}

// Make resetFilters globally accessible (called from HTML onclick)
window.resetFilters = resetFilters;

// ─────────────────────────────────────────────────────────────────
// SCROLL — sticky header shadow
// ─────────────────────────────────────────────────────────────────
window.addEventListener("scroll", () => {
  document.getElementById("header").classList.toggle("scrolled", window.scrollY > 8);
}, { passive: true });

// ─────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return CONFIG.currency + n.toFixed(2);
}

function formatNumber(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

// ─────────────────────────────────────────────────────────────────
// EVENT BINDINGS
// ─────────────────────────────────────────────────────────────────
function bindEvents() {
  // Header buttons
  document.getElementById("cartBtn").addEventListener("click", () => {
    haptic.light();
    renderCartItems();
    openOverlay("cartPanel");
  });

  document.getElementById("wishlistBtn").addEventListener("click", () => {
    haptic.light();
    renderWishlistItems();
    openOverlay("wishlistPanel");
  });

  // Close buttons
  document.getElementById("closeProductModal").addEventListener("click", closeAllOverlays);
  document.getElementById("closeCart").addEventListener("click", closeAllOverlays);
  document.getElementById("closeWishlist").addEventListener("click", closeAllOverlays);

  // Checkout button (in cart panel)
  document.getElementById("checkoutBtn").addEventListener("click", checkout);

  // Telegram MainButton checkout
  if (tg?.MainButton) {
    tg.MainButton.onClick(checkout);
  }

  // Overlay backdrop tap to close
  OVERLAYS.forEach(id => {
    document.getElementById(id).addEventListener("click", e => {
      if (e.target === e.currentTarget) closeAllOverlays();
    });
  });

  // Keyboard: Escape closes overlay
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAllOverlays();
  });
}

// ─────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────
function init() {
  applyTheme();
  renderCarousel();
  renderCategories();
  renderProducts();
  updateCartCount();
  updateWishlistCount();
  setupSearch();
  setupSort();
  bindEvents();
  syncTelegramMainButton();

  console.log(
    "%cTG Store ready 🛍️",
    "color:#0a84ff;font-size:14px;font-weight:bold;"
  );
}

document.addEventListener("DOMContentLoaded", init);
