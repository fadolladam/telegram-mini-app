# TG Store — Telegram Mini App Shopping Storefront

A complete, production-ready Telegram Mini App shopping storefront.
Built with plain HTML, CSS, and JavaScript. No frameworks, no build step.
Deploys instantly to Vercel and connects to Google Sheets + Telegram notifications.

---

## What This App Does

- Displays products inside Telegram as a Mini App
- Buyers can browse, search, filter, add to cart, and checkout
- Every order is saved automatically to **Google Sheets**
- **Seller** receives a Telegram notification for every new order
- **Buyer** receives a Telegram confirmation after checkout
- Cart and wishlist are saved locally (localStorage) across sessions

---

## Project Files

```
telegram-mini-app/
├── index.html               # Full HTML structure
├── style.css                # All styling — light/dark, responsive, animations
├── app.js                   # All logic — products, cart, checkout, Telegram SDK
├── google-apps-script.js    # Copy this into Google Apps Script (free backend)
├── vercel.json              # Vercel static deployment config
└── README.md                # This file
```

---

## Google Sheets (Already Created)

Three Google Sheets have been created in your Google Drive:

| Sheet | Purpose | Link |
|---|---|---|
| **TG Store — Products & Carousel** | All 15 products with full details | [Open Sheet](https://docs.google.com/spreadsheets/d/1uWnvxJ9mN2fbjUsQ3BWtqn349_6I_gthaLO3CtfLr4o/edit) |
| **TG Store — Carousel Banners** | 3 promotional banners with colors | [Open Sheet](https://docs.google.com/spreadsheets/d/1FVICVmyye8I6dehA2HF2Y4r2jOEJ2FVXYBtqONzwrmA/edit) |
| **TG Store — Orders** | Every order is recorded here automatically | [Open Sheet](https://docs.google.com/spreadsheets/d/1eF9ISo5-rZpkMABFESpiPQzrB8qCs4KKlX3wI16rpTA/edit) |

### Products Sheet Columns
| Column | Description |
|---|---|
| id | Unique product ID |
| name | Product name |
| category | phones / electronics / fashion / beauty / accessories / food |
| price | Current selling price |
| oldPrice | Original price (leave empty if no discount) |
| rating | Star rating (e.g. 4.8) |
| reviews | Number of reviews |
| description | Full product description |
| stock | Number of items in stock |
| badge | Label shown on card: Sale / Hot / New (leave empty for none) |
| emoji | Product emoji icon (e.g. 📱) |
| color | Hex color for card gradient (e.g. #667eea) |
| isNew | TRUE or FALSE |

### Carousel Banners Sheet Columns
| Column | Description |
|---|---|
| id | Unique banner ID (b1, b2, b3) |
| label | Small top label (e.g. "Just Arrived") |
| title | Main banner headline |
| subtitle | Short supporting text |
| cta | Button label (e.g. "Shop Now") |
| emoji | Large decorative emoji |
| color1 | Gradient start color (hex) |
| color2 | Gradient end color (hex) |
| category | Which category to open when tapped (all / sale / new / phones etc.) |

### Orders Sheet Columns (auto-filled on every purchase)
| Column | Description |
|---|---|
| Order ID | Unique order reference (e.g. ORD-1719123456789) |
| Timestamp | Date and time of order (ISO format) |
| Buyer Name | Telegram first + last name |
| Username | Telegram @username |
| Telegram ID | Buyer's numeric Telegram user ID |
| Items | All products, quantities, and line totals |
| Subtotal | Order subtotal before delivery |
| Delivery | Delivery fee ($3.99 or FREE over $50) |
| Total | Final amount paid |
| Currency | $ |
| Status | New (can be updated manually to Processing / Shipped / Done) |

---

## Step 1 — Run Locally

No build step needed:

```bash
# Open directly in browser
open index.html

# Or serve with a local static server (recommended)
npx serve .
# then visit http://localhost:3000
```

> All features work in a regular browser. The Telegram SDK gracefully falls back when opened outside Telegram.

---

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: TG Store Mini App"
git remote add origin https://github.com/fadolladam/telegram-mini-app.git
git branch -M main
git push -u origin main
```

Your repo: **https://github.com/fadolladam/telegram-mini-app**

---

## Step 3 — Deploy to Vercel

### Option A — Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** → select `fadolladam/telegram-mini-app`
3. Framework preset: **Other** (leave everything as default)
4. Click **Deploy**
5. Wait ~30 seconds → you get a live HTTPS URL like:
   ```
   https://telegram-mini-app-abc123.vercel.app
   ```

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel
# Follow prompts — choose "no framework"
```

---

## Step 4 — Set Up Google Apps Script (Free Backend)

This handles saving orders to Google Sheets and sending Telegram notifications.

### 4.1 — Create the Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Delete all default code in the editor
4. Open `google-apps-script.js` from this repo
5. Copy the entire contents and paste it into the editor
6. Click the project title (top left, says "Untitled project") and rename it to **TG Store Webhook**

### 4.2 — Add Your Bot Token

In the script, find this line near the top:

```js
const BOT_TOKEN = "PASTE_YOUR_BOT_TOKEN_HERE";
```

Replace `PASTE_YOUR_BOT_TOKEN_HERE` with your actual bot token from [@BotFather](https://t.me/BotFather).

Example:
```js
const BOT_TOKEN = "7123456789:AAHdqTcvCH1vGWJxfSeofShs0K8YLMmYWA";
```

### 4.3 — Deploy as Web App

1. Click **Deploy** (top right) → **New Deployment**
2. Click the gear icon next to **Type** → select **Web App**
3. Fill in:
   - Description: `TG Store Webhook`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → Allow
6. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfy.../exec
   ```

### 4.4 — Add the Webhook URL to app.js

Open `app.js` and find this line near the top:

```js
webhookUrl: "PASTE_YOUR_APPS_SCRIPT_URL_HERE",
```

Replace it with your Web App URL:

```js
webhookUrl: "https://script.google.com/macros/s/AKfy.../exec",
```

Save the file, then push to GitHub:

```bash
git add app.js
git commit -m "Add Apps Script webhook URL"
git push
```

Vercel will auto-redeploy within seconds.

---

## Step 5 — Register Yourself as Seller (One Time Only)

This auto-saves your Telegram chat ID so you receive order notifications.

1. Open Telegram → find your bot → send it `/start`
2. Open your browser and visit:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=true
   ```
   *(Replace with your actual Web App URL and add `?setup=true` at the end)*
3. You will see: **✅ Seller registered! Your Chat ID has been saved.**
4. Done — you will now receive a Telegram message for every new order.

---

## Step 6 — Connect to BotFather

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/mybots` → select your bot
3. Go to **Bot Settings** → **Menu Button** → **Configure menu button**
4. Paste your Vercel HTTPS URL
5. Set a button label, e.g. `🛍️ Shop Now`

Now anyone who opens your bot will see the store as a Mini App.

---

## How Orders Work (Full Flow)

```
User taps "Checkout" in the Mini App
         │
         ▼
app.js builds order object:
  - orderId, timestamp
  - customer (Telegram name, username, ID)
  - items (name, qty, price, lineTotal)
  - subtotal, delivery, total
         │
         ▼
POST → Google Apps Script Web App
         │
         ├──▶ Saves new row to Orders Google Sheet
         │
         ├──▶ Sends Telegram message to SELLER:
         │      🛍️ New Order Received!
         │      Buyer: John Doe (@johndoe)
         │      Items: iPhone Case x1 ($24.99)
         │      Total: $28.98
         │
         └──▶ Sends Telegram message to BUYER:
                ✅ Order Confirmed!
                Hi John! Your order has been placed.
                Order ID: ORD-1719123456789
                Total: $28.98
```

---

## Seller Notification Example

When a buyer places an order, you receive this in Telegram:

```
🛍️ New Order Received!

📦 Order ID: ORD-1719123456789
🕐 Time: 6/22/2026, 3:15:00 PM

👤 Buyer: John Doe
💬 Telegram: @johndoe
🔢 User ID: 123456789

🧾 Items:
  • iPhone 15 Pro Leather Case × 1 → $24.99
  • Matcha Latte Starter Kit × 2 → $49.98

💰 Subtotal: $74.97
🚚 Delivery: FREE 🎉
✅ Total: $74.97
```

---

## Buyer Confirmation Example

The buyer receives this in Telegram after checkout:

```
✅ Order Confirmed!

Hi John! Your order has been placed successfully.

📦 Order ID: ORD-1719123456789

🧾 Your Items:
  • iPhone 15 Pro Leather Case × 1
  • Matcha Latte Starter Kit × 2

💰 Total Paid: $74.97
🚚 Delivery: FREE 🎉

We will process your order shortly. Thank you for shopping with us! 🛍️
```

---

## App Features Summary

| Feature | Details |
|---|---|
| Products | 15 products across 6 categories |
| Search | Live search by name, category, description |
| Filter | 7 category chips (All, Phones, Electronics, Fashion, Beauty, Accessories, Food) |
| Sort | Popular / Price Low→High / Price High→Low / Newest |
| Banner Carousel | 3 banners, auto-slide every 4.5s, tap to filter |
| Product Modal | Full details, quantity selector, stock status |
| Cart | Add/remove/update qty, subtotal + delivery + total |
| Wishlist | Save/remove favorites, persists across sessions |
| Free Delivery | Automatically applied on orders over $50 |
| LocalStorage | Cart and wishlist survive page refresh |
| Dark / Light Mode | Auto-detects from Telegram theme |
| Haptic Feedback | On add to cart, wishlist, checkout |
| Telegram MainButton | Shows total and item count when cart is not empty |

---

## What to Improve Later (with a Backend)

| Current | Future upgrade |
|---|---|
| Products hardcoded in `app.js` | Fetch from Google Sheets API or Supabase |
| No user accounts | Firebase Auth / Supabase Auth |
| No real payment | Stripe, Telegram Stars, or TON payments |
| Manual order status updates | Admin dashboard to update order status |
| No stock tracking | Real-time inventory updates |
| Single store | Multi-vendor marketplace |

---

## Telegram Mini App Resources

- [Official Mini App docs](https://core.telegram.org/bots/webapps)
- [Telegram WebApp JS reference](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- [BotFather](https://t.me/BotFather)
- [Telegram Bot API — web_app_data](https://core.telegram.org/bots/api#message)
- [Google Apps Script docs](https://developers.google.com/apps-script)
