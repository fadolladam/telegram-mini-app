/**
 * TG Store — One-Time Google Sheets Setup
 *
 * This script creates ONE spreadsheet named "TG Store"
 * with 3 tabs: Products, Carousel, Orders
 * and deletes the 3 old separate files.
 *
 * HOW TO RUN (one time only):
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file
 * 3. Click the function dropdown (top bar) → select "setupTGStore"
 * 4. Click ▶ Run
 * 5. Allow permissions when prompted
 * 6. Click "Execution log" at the bottom to see the output
 * 7. Copy the 4 lines that start with ===
 * 8. Send them to Claude to update app.js automatically
 */

function setupTGStore() {

  // ── CREATE MAIN SPREADSHEET ───────────────────────────────────
  const ss = SpreadsheetApp.create("TG Store");
  Logger.log("Created spreadsheet: " + ss.getUrl());

  // ── SHEET 1: PRODUCTS ─────────────────────────────────────────
  const products = ss.getSheets()[0];
  products.setName("Products");

  const productHeaders = [
    "id","name","category","price","oldPrice","rating","reviews",
    "description","stock","badge","emoji","color1","color2","isNew","imageUrl"
  ];

  const productData = [
    [1,"iPhone 15 Pro Leather Case","phones",24.99,39.99,4.8,312,"Premium full-grain leather with MagSafe compatibility. Military-grade drop protection with a slim profile.",15,"Sale","📱","#667eea","#764ba2","FALSE","https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80"],
    [2,"AirPods Pro 2nd Gen","electronics",189.99,249.99,4.9,1204,"Active noise cancellation, transparency mode, and spatial audio. 6h listening time; charging case adds 30h total.",8,"Hot","🎧","#f093fb","#f5576c","FALSE","https://images.unsplash.com/photo-1588423771073-b8903fead714?w=400&q=80"],
    [3,"Nike Air Max 2025","fashion",129.99,"",4.7,89,"Lightweight mesh upper with responsive Air cushioning. Breathable and engineered for all-day comfort.",22,"New","👟","#43e97b","#38f9d7","TRUE","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"],
    [4,"Vitamin C Brightening Serum","beauty",34.99,49.99,4.6,567,"15% stabilized Vitamin C, hyaluronic acid, and niacinamide. Visibly reduces dark spots in 4 weeks.",40,"Sale","🌟","#fa709a","#fee140","FALSE","https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80"],
    [5,"Gold Link Chain Necklace","accessories",45.99,"",4.5,143,"18k gold-plated stainless steel link chain. Tarnish-resistant and waterproof. Length 45 cm.",30,"New","📿","#f6d365","#fda085","TRUE","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80"],
    [6,"Sushi Premium Bento Box","food",18.99,"",4.8,421,"12-piece premium sushi selection: salmon, tuna, prawn, and vegetable rolls. Freshly prepared same day.",50,"Hot","🍱","#a18cd1","#fbc2eb","FALSE","https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80"],
    [7,"Samsung Galaxy S24 Ultra","phones",899.99,1099.99,4.8,2341,"6.8 QHD+ Dynamic AMOLED, 200MP camera system, built-in S Pen, 5000mAh battery with 45W fast charging.",0,"Hot","🤳","#0f0c29","#302b63","FALSE","https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80"],
    [8,"Smart Watch Pro 9","electronics",299.99,399.99,4.7,876,"AMOLED always-on display, GPS, SpO2, ECG monitor, 14-day battery life. 5ATM water resistance.",12,"Sale","⌚","#2af598","#009efd","FALSE","https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80"],
    [9,"Genuine Leather Tote Bag","fashion",89.99,"",4.6,203,"Full-grain leather with canvas lining. Fits a 15 laptop. Adjustable strap, magnetic closure, 3 pockets.",18,"New","👜","#d4fc79","#96e6a1","TRUE","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"],
    [10,"Rosehip Facial Oil","beauty",28.99,"",4.7,389,"100% cold-pressed rosehip seed oil. Rich in omega fatty acids and vitamin A. Reduces fine lines overnight.",60,"","🌹","#fccb90","#d57eeb","FALSE","https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80"],
    [11,"Polarized Sunglasses","accessories",59.99,79.99,4.4,167,"UV400 polarized lenses with TR90 flexible frame. Blocks 99.9% of UVA/UVB rays. Includes case and cloth.",3,"Sale","🕶️","#89f7fe","#66a6ff","FALSE","https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80"],
    [12,"Matcha Latte Starter Kit","food",24.99,"",4.9,512,"Ceremonial-grade Japanese matcha, bamboo whisk, and chawan bowl. Makes 30+ cups.",35,"Hot","🍵","#84fab0","#8fd3f4","FALSE","https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80"],
    [13,"Magsafe Wireless Charger","electronics",49.99,69.99,4.5,334,"15W wireless charging for iPhone 12-15. Slim 6mm profile, LED indicator, USB-C cable included.",20,"Sale","🔋","#a1c4fd","#c2e9fb","FALSE","https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80"],
    [14,"Premium Cotton Hoodie","fashion",74.99,"",4.6,291,"400gsm heavyweight French terry cotton. Brushed inner lining, reinforced ribbing, kangaroo pocket.",45,"New","🧥","#e0c3fc","#8ec5fc","TRUE","https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80"],
    [15,"Glossy Lip Set (6 Shades)","beauty",19.99,29.99,4.3,608,"Long-lasting non-sticky formula with hyaluronic acid. Shades: Nude Glam, Berry Pop, Coral Sun, Rose Baby, Red Hot, Peach Kiss.",70,"Sale","💄","#f77062","#fe5196","FALSE","https://images.unsplash.com/photo-1586495777744-4e6232bf2ebb?w=400&q=80"],
  ];

  products.getRange(1, 1, 1, productHeaders.length).setValues([productHeaders]);
  products.getRange(2, 1, productData.length, productHeaders.length).setValues(productData);
  products.getRange(1, 1, 1, productHeaders.length)
    .setFontWeight("bold").setBackground("#0a7cff").setFontColor("#ffffff");
  products.setFrozenRows(1);
  products.setColumnWidth(8, 300);  // description
  products.setColumnWidth(15, 200); // imageUrl
  Logger.log("✅ Products sheet populated (" + productData.length + " rows)");

  // ── SHEET 2: CAROUSEL ─────────────────────────────────────────
  const carousel = ss.insertSheet("Carousel");

  const carouselHeaders = ["id","label","title","subtitle","cta","emoji","color1","color2","category"];
  const carouselData = [
    ["b1","Just Arrived","New Arrivals This Week","Fresh styles and latest tech","Shop Now","🆕","#667eea","#764ba2","all"],
    ["b2","Limited Time","Up to 40% Off Selected Items","While stocks last","See Deals","🔥","#f093fb","#f5576c","all"],
    ["b3","Best Sellers","Free Delivery Over $50","On all qualifying orders","Explore","🚀","#4facfe","#00f2fe","all"],
  ];

  carousel.getRange(1, 1, 1, carouselHeaders.length).setValues([carouselHeaders]);
  carousel.getRange(2, 1, carouselData.length, carouselHeaders.length).setValues(carouselData);
  carousel.getRange(1, 1, 1, carouselHeaders.length)
    .setFontWeight("bold").setBackground("#f093fb").setFontColor("#ffffff");
  carousel.setFrozenRows(1);
  Logger.log("✅ Carousel sheet populated (" + carouselData.length + " rows)");

  // ── SHEET 3: ORDERS ───────────────────────────────────────────
  const orders = ss.insertSheet("Orders");

  const orderHeaders = [
    "Order ID","Timestamp","Buyer Name","Username","Telegram ID",
    "Phone","Address","City","Country","Delivery Notes",
    "Items","Subtotal","Delivery","Total","Currency","Status"
  ];

  orders.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  orders.getRange(1, 1, 1, orderHeaders.length)
    .setFontWeight("bold").setBackground("#30d158").setFontColor("#ffffff");
  orders.setFrozenRows(1);
  orders.setColumnWidth(11, 300); // items column
  Logger.log("✅ Orders sheet created (ready to receive orders)");

  // ── DELETE OLD 3 SEPARATE FILES ───────────────────────────────
  const oldIds = [
    "1uWnvxJ9mN2fbjUsQ3BWtqn349_6I_gthaLO3CtfLr4o", // TG Store — Products (with Images)
    "13HX-BruHcd6k8_tqjL1mxtKdAp1bxSeOXxDPyJW5iVI", // TG Store — Products & Carousel
    "1FVICVmyye8I6dehA2HF2Y4r2jOEJ2FVXYBtqONzwrmA", // TG Store — Carousel Banners
    "1eF9ISo5-rZpkMABFESpiPQzrB8qCs4KKlX3wI16rpTA", // TG Store — Orders
  ];

  let deleted = 0;
  oldIds.forEach(id => {
    try {
      DriveApp.getFileById(id).setTrashed(true);
      deleted++;
    } catch(e) {
      // File may already be deleted or not accessible — skip
    }
  });
  Logger.log("🗑️ Moved " + deleted + " old file(s) to trash");

  // ── LOG FINAL OUTPUT ──────────────────────────────────────────
  const ssId       = ss.getId();
  const prodGid    = products.getSheetId();
  const carGid     = carousel.getSheetId();
  const ordGid     = orders.getSheetId();

  Logger.log("");
  Logger.log("════════════════════════════════════");
  Logger.log("✅ SETUP COMPLETE — Copy these 4 lines and send to Claude:");
  Logger.log("SPREADSHEET_ID=" + ssId);
  Logger.log("PRODUCTS_GID="   + prodGid);
  Logger.log("CAROUSEL_GID="   + carGid);
  Logger.log("ORDERS_GID="     + ordGid);
  Logger.log("════════════════════════════════════");
  Logger.log("Spreadsheet URL: " + ss.getUrl());
}
