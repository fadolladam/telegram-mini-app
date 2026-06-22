# TG Store — Telegram Mini App Shopping Storefront

A complete, production-ready Telegram Mini App shopping storefront built with plain HTML, CSS, and JavaScript. No frameworks, no build step, deploys instantly to Vercel.

---

## Features

- Auto light / dark theme from Telegram
- Banner carousel with auto-slide
- Category filter chips
- Product grid with search, sort, and filter
- Product detail bottom sheet with quantity selector
- Cart panel with quantity controls and live totals
- Wishlist saved to localStorage
- Checkout via `Telegram.WebApp.sendData()` or browser alert fallback
- Telegram Haptic Feedback, Main Button, Back Button integration
- localStorage persistence for cart and wishlist across sessions
- Safe-area aware (iPhone notch / home indicator)

---

## Run Locally

No build step needed — just open the file:

```bash
# Option 1: open directly
open index.html

# Option 2: serve with a local static server (recommended, avoids CORS)
npx serve .
# or
python3 -m http.server 3000
```

Then visit `http://localhost:3000` (or `http://localhost:5000` for `serve`).

> The Telegram SDK gracefully falls back when opened outside Telegram, so all features work in a regular browser.

---

## Push to GitHub

```bash
cd /path/to/telegram-mini-app

git init
git add .
git commit -m "Initial commit: TG Store Mini App"

# Create a GitHub repo first at https://github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/telegram-mini-app.git
git branch -M main
git push -u origin main
```

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel          # follow the prompts; pick "no framework"
```

### Option B — Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework preset: **Other** (Static Site)
4. Root directory: `/` (leave as default)
5. Click **Deploy**

Vercel gives you a free HTTPS URL like:
```
https://telegram-mini-app-abc123.vercel.app
```

---

## Connect to BotFather

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/mybots` → select your bot
3. **Bot Settings** → **Menu Button** → **Configure menu button**
4. Paste your Vercel HTTPS URL
5. Set button label, e.g. `🛍️ Shop Now`

Or use the **Menu Button** approach to launch via the persistent button in the chat bar.

To set up a Web App button on any message/inline keyboard, use:
```
/newapp → choose bot → set Web App URL
```

---

## How Checkout Works

When the user taps **Proceed to Checkout**, the app:

1. Builds an order object containing:
   - `orderId` — unique timestamp-based ID
   - `customer` — Telegram user info (id, name, username)
   - `items` — array of `{ id, name, price, qty, lineTotal }`
   - `subtotal`, `delivery`, `total`, `currency`
   - `timestamp` — ISO 8601 string

2. Calls `Telegram.WebApp.sendData(JSON.stringify(order))`

3. Your bot receives this in the `web_app_data` update type:

```python
# python-telegram-bot example
async def handle_web_app_data(update: Update, context):
    data = json.loads(update.message.web_app_data.data)
    order_id = data["orderId"]
    total    = data["total"]
    # save to your database, trigger payment, etc.
    await update.message.reply_text(f"Order {order_id} received! Total: ${total}")
```

**Browser fallback**: If opened outside Telegram, an `alert()` shows the order summary and the cart is cleared.

---

## File Structure

```
telegram-mini-app/
├── index.html      # HTML structure (semantic, accessible)
├── style.css       # All styling — light/dark, responsive, animations
├── app.js          # All logic — data, state, rendering, Telegram SDK
├── vercel.json     # Vercel static deployment config
└── README.md       # This file
```

---

## What to Improve with a Backend

The JavaScript is intentionally structured so each section is easy to replace:

| Current (static)                  | Future (with backend)                      |
|-----------------------------------|--------------------------------------------|
| `const PRODUCTS = [...]`          | `fetch("/api/products").then(...)`         |
| `localStorage` cart/wishlist      | User session / database                    |
| `tg.sendData(order)`              | `POST /api/orders` + payment gateway       |
| Hardcoded delivery fee            | Dynamic shipping rates API                 |
| No stock tracking                 | Real-time inventory from Firestore/Supabase|
| No user accounts                  | Firebase Auth / Supabase Auth              |

Suggested stack for the next iteration:
- **Firebase** — Firestore for products, Auth for users, Cloud Functions for bot webhook
- **Supabase** — Postgres + REST API, row-level security
- **Laravel** — REST API backend, connect via `fetch()` in `app.js`
- **Stripe** — Payment gateway, integrate with Telegram Stars or card payments

---

## Telegram Mini App Resources

- [Official Mini App docs](https://core.telegram.org/bots/webapps)
- [Telegram WebApp JS reference](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- [BotFather commands](https://t.me/BotFather)
- [Telegram Bot API](https://core.telegram.org/bots/api#message)
