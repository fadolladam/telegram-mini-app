# TG Store — Telegram Mini App Shopping Storefront

A complete, production-ready Telegram Mini App shopping storefront.
Plain HTML, CSS, JavaScript — no frameworks, no build step.
Products and banners load live from **Google Sheets**. Orders are saved to Google Sheets and sent as Telegram notifications to both seller and buyer.

---

## What's New in v3

- ✅ **Products load from Google Sheets** (live data, no code changes needed to update products)
- ✅ **Real product images** from image URLs stored in the sheet (emoji fallback if image fails)
- ✅ **Out-of-stock overlay** on product cards — disabled Add to Cart button
- ✅ **Stock-limited quantity** — can't order more than what's in stock
- ✅ **2-step checkout** — Cart review → Delivery address form → Order placed
- ✅ **Order confirmation screen** — full success overlay with order summary
- ✅ **Delivery address** included in order: sent to Google Sheet + Telegram notifications
- ✅ **Skeleton loading** — smooth placeholder while products load from Sheets

---

## Project Files

```
telegram-mini-app/
├── index.html               # Full HTML — header, search, carousel, grid, modals, address form, confirmation
├── style.css                # All CSS — light/dark, responsive, images, OOS, address form, confirmation
├── app.js                   # All logic — Sheets fetch, cart, wishlist, checkout, Telegram SDK
├── google-apps-script.js    # Paste into Google Apps Script (free order webhook)
├── vercel.json              # Vercel static deployment config
└── README.md                # This file
```

---

## Google Sheets (Your Data Store)

### Sheet 1 — Products (with Images)
**Link:** https://docs.google.com/spreadsheets/d/13HX-BruHcd6k8_tqjL1mxtKdAp1bxSeOXxDPyJW5iVI/edit

| Column | Description |
|---|---|
| id | Unique number (1, 2, 3…) |
| name | Product name |
| category | phones / electronics / fashion / beauty / accessories / food |
| price | Selling price (e.g. 24.99) |
| oldPrice | Original price — leave empty if no discount |
| rating | Star rating (e.g. 4.8) |
| reviews | Number of reviews |
| description | Full product description |
| stock | Quantity in stock — set 0 to show "Out of Stock" |
| badge | Sale / Hot / New — leave empty for none |
| emoji | Fallback emoji if image fails (e.g. 📱) |
| color1 | Card gradient start color (hex, e.g. #667eea) |
| color2 | Card gradient end color (hex, e.g. #764ba2) |
| isNew | TRUE or FALSE |
| **imageUrl** | **Full URL to product photo — paste any public image link** |

> **To add your own product photos:**
> Upload your image to Google Drive → right-click → Share → Anyone with link can view → Copy link
> Convert Drive link: `https://drive.google.com/file/d/FILE_ID/view` → `https://drive.google.com/uc?id=FILE_ID`
> Paste that URL into the `imageUrl` column.
> Or use any public image URL (Unsplash, your own host, etc.)

### Sheet 2 — Carousel Banners
**Link:** https://docs.google.com/spreadsheets/d/1FVICVmyye8I6dehA2HF2Y4r2jOEJ2FVXYBtqONzwrmA/edit

| Column | Description |
|---|---|
| id | b1, b2, b3 |
| label | Small top tag (e.g. "Just Arrived") |
| title | Main headline |
| subtitle | Supporting text |
| cta | Button label (e.g. "Shop Now") |
| emoji | Decorative emoji |
| color1 | Gradient start color |
| color2 | Gradient end color |
| category | Category to filter when tapped (all / phones / fashion…) |

### Sheet 3 — Orders (auto-filled on every purchase)
**Link:** https://docs.google.com/spreadsheets/d/1eF9ISo5-rZpkMABFESpiPQzrB8qCs4KKlX3wI16rpTA/edit

| Column | Auto-filled with |
|---|---|
| Order ID | Unique ID (e.g. ORD-1719123456789) |
| Timestamp | Date and time of purchase |
| Buyer Name | Telegram name or address form name |
| Username | @username if available |
| Telegram ID | Buyer's numeric Telegram user ID |
| Phone | From delivery address form |
| Address | Street address |
| City | City |
| Country | Country |
| Delivery Notes | Optional notes from buyer |
| Items | All products, quantities, and prices |
| Subtotal | Before delivery |
| Delivery | Fee (or FREE if over $50) |
| Total | Final amount |
| Currency | $ |
| Status | "New" — update manually to Processing / Shipped / Done |

---

## Setup Guide

### Step 1 — Publish Sheets to Web (Required for live data)

The app fetches product and banner data from Google Sheets via a public CSV URL.
You must publish each sheet first:

1. Open **TG Store — Products (with Images)** → File → Share → **Publish to web**
2. Select **Sheet1** → Format: **CSV** → Click **Publish** → confirm
3. Repeat for **TG Store — Carousel Banners**

> After publishing, the app will load live data from your sheets every time it opens.
> If not published yet, the app uses built-in fallback data automatically — nothing breaks.

---

### Step 2 — Run Locally

```bash
open index.html
# or serve with a local server:
npx serve .
# visit http://localhost:3000
```

---

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: TG Store Mini App"
git remote add origin https://github.com/fadolladam/telegram-mini-app.git
git push -u origin main
```

---

### Step 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `fadolladam/telegram-mini-app`
3. Framework: **Other** — leave everything default
4. Click **Deploy** — done in ~30 seconds
5. Get your HTTPS URL: `https://telegram-mini-app-xxx.vercel.app`

---

### Step 5 — Set Up Google Apps Script (Order Webhook)

This script receives orders, saves them to the Orders sheet, and sends Telegram messages.

#### 5.1 Create the script
1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Rename project to **TG Store Webhook**
3. Delete all default code
4. Copy the contents of `google-apps-script.js` from this repo and paste it

#### 5.2 Add your bot token
Find this line near the top:
```js
const BOT_TOKEN = "PASTE_YOUR_BOT_TOKEN_HERE";
```
Replace with your actual bot token from [@BotFather](https://t.me/BotFather):
```js
const BOT_TOKEN = "7123456789:AAHdqTcvCH1vGWJxfSeofShs0K8YLMmYWA";
```

#### 5.3 Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Click the gear icon → select **Web App**
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** → **Authorize access** → choose your Google account → Allow
5. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfy.../exec`)

#### 5.4 Add the webhook URL to app.js
Open `app.js`, find:
```js
webhookUrl: "PASTE_YOUR_APPS_SCRIPT_URL_HERE",
```
Replace with your URL:
```js
webhookUrl: "https://script.google.com/macros/s/AKfy.../exec",
```
Then push to GitHub — Vercel auto-redeploys.

---

### Step 6 — Register Yourself as Seller (One Time)

1. Open Telegram → find your bot → send `/start`
2. Open this URL in your browser:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=true
   ```
3. You will see: **✅ Seller registered!** — your chat ID is saved
4. Done — you will now receive a Telegram message for every new order

---

### Step 7 — Connect to BotFather

1. Open [@BotFather](https://t.me/BotFather)
2. Send `/mybots` → select your bot
3. **Bot Settings** → **Menu Button** → **Configure menu button**
4. Paste your Vercel URL
5. Set label: `🛍️ Shop Now`

---

## Checkout Flow (End to End)

```
User taps "Continue to Delivery"
         │
         ▼
Delivery Address Form
  Full Name · Phone · Address · City · Country · Notes
         │
         ▼ "Place Order"
         │
app.js validates form → builds order object
         │
         ├──▶ POST to Google Apps Script
         │        ├── Saves row to Orders Google Sheet
         │        ├── Sends Telegram to SELLER (with address + items)
         │        └── Sends Telegram to BUYER (confirmation)
         │
         ├──▶ tg.sendData() if inside Telegram
         │
         └──▶ Shows Order Confirmation overlay ✅
```

---

## Seller Notification (what you receive in Telegram)

```
🛍️ New Order Received!

📦 Order ID: ORD-1719123456789
🕐 Time: 6/22/2026, 3:15:00 PM

👤 Buyer: John Doe
💬 Telegram: @johndoe
📞 Phone: +1 555 000 0000

📍 Ship to:
  123 Main Street, Apt 4B, New York, United States
📝 Notes: Please leave at the door

🧾 Items:
  • iPhone 15 Pro Leather Case × 1  →  $24.99
  • Matcha Latte Starter Kit × 2    →  $49.98

💰 Subtotal: $74.97
🚚 Delivery: FREE 🎉
✅ Total: $74.97
```

---

## Buyer Confirmation (what the buyer receives)

```
✅ Order Confirmed!

Hi John! Your order has been placed successfully.

📦 Order ID: ORD-1719123456789

🧾 Your Items:
  • iPhone 15 Pro Leather Case × 1
  • Matcha Latte Starter Kit × 2

💰 Total: $74.97
🚚 Delivery: FREE 🎉

📍 Delivering to: 123 Main Street, New York, United States

We will process your order shortly. Thank you for shopping with us! 🛍️
```

---

## How to Update Products (No Code Needed)

1. Open the **Products (with Images)** Google Sheet
2. Edit any row — change price, stock, name, image URL, etc.
3. Add a new row for a new product
4. Set `stock` to `0` to show "Out of Stock" on the card
5. The app picks up changes the next time it's opened — no deployment needed

> **To use your own product images:**
> Upload photo to Google Drive → Share as "Anyone with link" → Copy link
> Change: `https://drive.google.com/file/d/ID/view` → `https://drive.google.com/uc?id=ID`
> Paste the `uc?id=` URL into the `imageUrl` column

---

## App Features

| Feature | Details |
|---|---|
| Data source | Google Sheets CSV (live, no code changes needed) |
| Products | 15 products across 6 categories |
| Real images | From `imageUrl` column — emoji fallback if image fails or missing |
| Out of Stock | Card overlay, disabled button — set stock=0 in sheet |
| Stock limit | Can't add more to cart than stock allows |
| Search | Live search by name, category, description |
| Categories | 7 chips — All, Phones, Electronics, Fashion, Beauty, Accessories, Food |
| Sort | Popular / Price Low→High / Price High→Low / Newest |
| Carousel | 3 banners, auto-slide, tap to filter — data from Sheets |
| Product Modal | Full details, qty selector (max = stock), stock status |
| Cart | Add/remove/update qty, subtotal + delivery + total |
| Checkout Step 1 | Cart review with subtotal |
| Checkout Step 2 | Delivery address form (name, phone, address, city, country, notes) |
| Order Confirmation | Full overlay with order summary after successful checkout |
| Wishlist | Save/remove favorites, persists in localStorage |
| Free Delivery | Auto-applied on orders over $50 |
| LocalStorage | Cart and wishlist survive page refresh |
| Telegram Theme | Auto light/dark from Telegram |
| Haptic Feedback | On add to cart, wishlist, checkout, errors |
| Notifications | Seller + buyer both get Telegram messages on every order |
| Orders Sheet | Every order auto-saved with full address and item details |

---

## What to Build Next

| Feature | How |
|---|---|
| Payment | Telegram Stars, Stripe, or TON |
| Real stock tracking | Sheets formula to decrement on order |
| Admin panel | Google Sheets itself — update Status column |
| Order history for buyer | Store orders in localStorage or Firestore |
| Size / color variants | Add `variants` column to Products sheet |
| Promo codes | Add Codes sheet, validate in Apps Script |
| Push notifications | Telegram bot scheduled messages |
| Analytics | Apps Script writes views/cart events to a Stats sheet |
