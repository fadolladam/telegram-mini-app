# TG Store — Telegram Mini App Shopping Storefront

A complete, production-ready Telegram Mini App shopping storefront.
Plain HTML, CSS, JavaScript — no frameworks, no build step.
Products and banners load live from **Google Sheets**. Orders are saved to Google Sheets and delivered as Telegram notifications to both seller and buyer.

Live demo: `https://digitallicense.vercel.app`

---

## Features

### Buyer (User) Side
| Feature | Details |
|---|---|
| Live product data | Fetched from Google Sheets CSV, cached client-side for 30s (stale-while-revalidate) so repeat visits load near-instantly |
| Real product images | From `imageUrl` column in sheet — emoji fallback if missing |
| Out of Stock | Card overlay + disabled button — set `stock=0` in sheet |
| Stock-limited qty | Can't add more to cart than current stock |
| Search | Live search by name, category, description, badge |
| Category filter | 7 chips — All, Phones, Electronics, Fashion, Beauty, Accessories, Food |
| Sort | Popular / Price Low→High / Price High→Low / Newest |
| Carousel banners | Auto-slide, tap to filter by category — data from Sheets |
| Product modal | Full details, qty selector (stock-capped), stock status badge |
| Cart | Add / remove / update qty, subtotal + delivery + total |
| 2-step checkout | Step 1: cart review → Step 2: delivery address form |
| Delivery animation | Van loading animation plays before order confirmation screen |
| Order confirmation | Full overlay with order ID, items, total, shipping city |
| Wishlist | Save / remove favorites — persists in localStorage |
| Free delivery | Auto-applied on orders over $50 |
| LocalStorage | Cart and wishlist survive page refresh |
| Telegram theme | Auto light/dark synced from Telegram color scheme |
| Haptic feedback | On add to cart, wishlist, checkout, errors |
| Telegram MainButton | Shows "Checkout · $X.XX" when cart has items — hidden when cart panel is open |
| Close App button | Shown only inside Telegram; hidden in browser |
| Buyer notification | Telegram message with QR payment image + full order summary |

### Seller (Merchant) Side
| Feature | Details |
|---|---|
| Orders sheet | Every order auto-saved: buyer info, address, items, total, status |
| Customers sheet | Auto-created on first `/start` — tracks all buyers, phone, order count, spend |
| Seller notification | Telegram message on every new order with full details + tap-to-contact buyer link |
| Status column | Update `Status` in Orders sheet: New → Processing → Shipped → Done |
| Error log sheet | GAS errors auto-logged to an Errors sheet for debugging |
| Bot polling | 1-minute time trigger polls Telegram — more reliable than webhooks on GAS |
| Welcome message | Buyer receives welcome + phone request on first `/start` |

---

## Project Files

```
telegram-mini-app/
├── index.html               # Full HTML — header, search, carousel, grid, modals, address form, confirmation
├── style.css                # All CSS — light/dark, responsive, animations, overlays
├── app.js                   # All logic — Sheets fetch, cart, wishlist, checkout, Telegram SDK
├── google-apps-script.js    # Paste into Google Apps Script (order webhook + bot handler)
├── vercel.json              # Vercel static deployment config
└── README.md                # This file
```

---

## Google Sheets Structure

### Sheet 1 — Products

| Column | Description |
|---|---|
| id | Unique number (1, 2, 3…) |
| name | Product name |
| category | phones / electronics / fashion / beauty / accessories / food |
| price | Selling price (e.g. `24.99`) |
| oldPrice | Original price — leave empty if no discount |
| rating | Star rating (e.g. `4.8`) |
| reviews | Number of reviews |
| description | Full product description shown in modal |
| stock | Quantity in stock — set `0` to show "Out of Stock" |
| badge | `Sale` / `Hot` / `New` — leave empty for none |
| emoji | Fallback emoji if image fails (e.g. `📱`) |
| color1 | Card gradient start color (hex, e.g. `#667eea`) |
| color2 | Card gradient end color (hex, e.g. `#764ba2`) |
| isNew | `TRUE` or `FALSE` |
| imageUrl | Full URL to product photo — any public image link |

> **Using Google Drive images:**
> Upload → Share as "Anyone with link" → convert:
> `https://drive.google.com/file/d/FILE_ID/view` → `https://drive.google.com/uc?id=FILE_ID`

### Sheet 2 — Carousel Banners

| Column | Description |
|---|---|
| id | `b1`, `b2`, `b3`… |
| label | Small tag (e.g. "Just Arrived") |
| title | Main headline (use `\n` for line break) |
| subtitle | Supporting text |
| cta | Button label (e.g. "Shop Now") |
| emoji | Decorative emoji |
| color1 | Gradient start color |
| color2 | Gradient end color |
| category | Category to filter when tapped (`all` / `phones` / `fashion`…) |

### Sheet 3 — Orders (auto-filled)

| Column | Auto-filled with |
|---|---|
| Order ID | Unique ID (e.g. `ORD-1719123456789`) |
| Date & Time | Timestamp of purchase |
| Buyer Name | Telegram name |
| Username | `@username` if available |
| Telegram ID | Buyer's numeric Telegram user ID |
| Phone | From delivery address form |
| Address | Street address |
| City | City |
| Country | Country |
| Delivery Notes | Optional notes from buyer |
| Items | All products × quantities × prices |
| Subtotal ($) | Before delivery |
| Delivery ($) | Fee or 0 if free |
| Total ($) | Final amount |
| Currency | `$` |
| Status | `New` — update manually: Processing / Shipped / Done |

### Sheet 4 — Customers (auto-filled on `/start`)

| Column | Auto-filled with |
|---|---|
| Chat ID | Telegram user ID |
| First Name | From Telegram profile |
| Last Name | From Telegram profile |
| Username | `@username` |
| Phone | After user shares contact |
| Language | Telegram language code |
| Premium | Whether user is Telegram Premium |
| First Seen | Date of first `/start` |
| Last Active | Date of last interaction or order |
| Total Orders | Incremented on every order |
| Total Spent ($) | Cumulative spend |

---

## Setup Guide

### Step 1 — Publish Sheets to Web

The app fetches products and banners via public CSV URLs. You must publish each sheet first:

1. Open the Products sheet → **File → Share → Publish to web**
2. Select the products tab → Format: **CSV** → Click **Publish**
3. Repeat for the Carousel Banners sheet
4. Copy the CSV URLs and paste them into `app.js` as `sheetsProducts` and `sheetsCarousel`

> If not published, the app automatically uses built-in fallback data — nothing breaks.

---

### Step 2 — Run Locally

```bash
# Open directly in browser
open index.html

# Or serve with a local server
npx serve .
# http://localhost:3000
```

---

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: TG Store Mini App"
git remote add origin https://github.com/YOUR_USERNAME/telegram-mini-app.git
git push -u origin main
```

---

### Step 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework: **Other** — leave all settings default
4. Click **Deploy** — done in ~30 seconds
5. Copy your live Vercel URL (e.g. `https://your-store.vercel.app`)

> Every `git push` to `main` auto-redeploys. No manual uploads needed.

---

### Step 5 — Set Up Google Apps Script (Order Webhook)

#### 5.1 Add your credentials as Script Properties (do this first — not in the code)
1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Rename to **TG Store Webhook**
3. **Project Settings (⚙️) → Script Properties → Add property**, twice:
   - `BOT_TOKEN` = your bot token from @BotFather
   - `SPREADSHEET_ID` = your spreadsheet ID (from the sheet URL)

`BOT_TOKEN` and `SPREADSHEET_ID` are read from these properties at runtime (`PropertiesService.getScriptProperties()`) — they are **never hardcoded in `google-apps-script.js`**, so the file stays safe to commit to a public repo. If you skip this step before deploying, the bot will silently fail (empty token).

#### 5.2 Paste the script
1. Delete all default code in the project
2. Paste the full contents of `google-apps-script.js`

#### 5.3 Deploy as Web App
1. Click **Deploy → New Deployment**
2. Type: **Web App**
3. Execute as: **Me** | Who has access: **Anyone**
4. Click **Deploy** → authorize → copy the **Web App URL**

> Redeploying later? Use **Manage Deployments → edit your existing deployment → New Version**, not "New Deployment" — that keeps the same URL so `app.js` never needs to change.

#### 5.4 Paste the URL into app.js
```js
webhookUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
```
Then push to GitHub — Vercel auto-redeploys.

---

### Step 6 — Register Yourself as Seller

1. Open Telegram → send `/start` to your bot
2. Visit in your browser:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=seller
   ```
3. You'll see: **✅ Admin registered!** — your chat ID is saved
4. You'll now receive a Telegram message for every new order

---

### Step 7 — Enable Bot Polling (Recommended)

GAS can't reliably receive Telegram webhooks (302 redirect issue). Use polling instead:

1. Visit:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=polling
   ```
2. In Apps Script → **Triggers (⏰)** → **+ Add Trigger**
   - Function: `processUpdates`
   - Event source: Time-driven
   - Type: Minutes timer → **Every 1 minute**
3. Save — the bot now polls Telegram every minute

> This means every `/start` from a new buyer gets captured within 1 minute.

---

### Step 8 — Connect Bot to Your Store

1. Open [@BotFather](https://t.me/BotFather)
2. `/mybots` → select your bot
3. **Bot Settings → Menu Button → Configure menu button**
4. URL: `https://your-store.vercel.app`
5. Label: `🛍️ Open Store`

---

## Checkout Flow

```
User taps "Continue to Delivery"
         │
         ▼
  Delivery Address Form
  (Street · City · Notes)
         │
         ▼  "Place Order"
         │
app.js validates form → builds order object
         │
         ├──▶ Van loading animation (2 seconds)
         │
         ├──▶ Order Confirmation overlay shown ✅
         │
         └──▶ Background: POST to Google Apps Script
                  ├── Saves row to Orders sheet
                  ├── Upserts row in Customers sheet
                  ├── Sends Telegram to SELLER (full details + tap-to-contact)
                  └── Sends Telegram to BUYER (QR payment image + order summary)
```

> The confirmation screen appears immediately. The webhook fires in the background — the buyer never waits for it.

---

## Seller Telegram Notification

```
🛍️ NEW ORDER RECEIVED!

📦 Order ID: ORD-1719123456789
🕐 Time: 6/23/2026, 3:15:00 PM

━━━━━━━━━━ CUSTOMER ━━━━━━━━━━
👤 Name: John Doe
💬 Contact Buyer: [Tap to message]
🆔 Chat ID: 123456789
📞 Phone: +1 555 000 0000

━━━━━━━━━━ DELIVERY ━━━━━━━━━━
📍 Address: 123 Main Street, New York

━━━━━━━━━━ ITEMS ━━━━━━━━━━
  • iPhone 15 Pro Leather Case × 1  →  $24.99
  • Matcha Latte Starter Kit × 2    →  $49.98

━━━━━━━━━━ PAYMENT ━━━━━━━━━━
💰 Subtotal: $74.97
🚚 Delivery: FREE 🎉
✅ TOTAL: $74.97
```

---

## Renaming the Store

The store name is set from two single-source-of-truth constants — one per side, since the frontend and backend are separate deployments with no shared config file between them:

| Where | Constant | Drives |
|---|---|---|
| `app.js` | `CONFIG.storeName` | Browser tab title + header name (set on load via JS — `index.html`'s hardcoded text is just the pre-JS fallback, kept in sync manually) |
| `google-apps-script.js` | `STORE_NAME` | The bot's `/start` welcome message + the webhook's status response |

Change each constant once, redeploy (push for `app.js`, paste + new deployment version for `google-apps-script.js`), and every place that shows the name updates with it. Currently set to **"Digital Store"**.

---

## How to Update Products (No Code Needed)

1. Open the Products Google Sheet
2. Edit any row — change price, stock, name, image URL, etc.
3. Add a new row for a new product
4. Set `stock` to `0` to show "Out of Stock"
5. The app picks up changes the next time a user opens it — no deployment needed

---

## Managing Orders (Google Sheets Admin)

All orders land in the **Orders** sheet automatically. To manage them:

- **Change status:** Edit the `Status` column → `New` / `Processing` / `Shipped` / `Done`
- **Contact buyer:** Use the Telegram ID column — open `tg://user?id=CHAT_ID` on your phone or tap the link in your seller notification
- **Filter:** Use Sheets column filters to view by status, date, or buyer
- **Track revenue:** Sum the `Total ($)` column with a formula or pivot table
- **Customer database:** The Customers sheet auto-tracks every buyer's order count and total spend

---

## Security Notes

- **`BOT_TOKEN` / `SPREADSHEET_ID`** live only in GAS Script Properties (Project Settings → Script Properties), never in `google-apps-script.js` itself — safe to keep this repo public.
- **`webhookUrl` and the Sheets CSV links are visible in `app.js`** by design — the browser calls them directly, there's no backend to hide them behind. This is normal for a static-site + Google Sheets architecture, not a leak.
- **`doPost` validates incoming order payloads** (`isValidOrder` in `google-apps-script.js`) — rejects malformed/incomplete submissions before they touch the Sheet or trigger any Telegram message.
- **Not yet done:** prices/totals in an order are trusted as submitted by the browser — `doPost` doesn't re-check them against the live Products sheet. Low risk for a small single-seller store, but worth knowing before scaling up. See "What to Build Next" below.
- If a bot token is ever exposed publicly (e.g. committed to git before this setup), rotating it in @BotFather is required — removing it from the code afterward does not invalidate an already-leaked token.

---

## What to Build Next

| Feature | Approach |
|---|---|
| Server-side price validation | In `doPost`, recompute each item's price from the Products sheet by `id` instead of trusting the submitted price/total |
| Telegram Payments | Use Telegram's built-in Stars or provider payments API |
| Order status → buyer | GAS custom menu: select order row → run script → sends Telegram to buyer |
| Order history (buyer) | Save order IDs to localStorage, fetch from Sheets by ID |
| Saved address | Store last address in localStorage, pre-fill the form |
| Low stock alerts | GAS time trigger scans Products sheet, messages seller when stock ≤ 5 |
| Promo / coupon codes | Add Codes sheet, validate in GAS before saving order |
| Product variants | Add `variants` column (JSON), render size/color selector in modal |
| Multiple merchants | Requires a real backend (Supabase / Firebase) — Google Sheets won't scale |
