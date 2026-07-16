# Cloning This Project — Full Setup Guide

Everything you need to take this repo and stand up your own independent Telegram Mini App store: your own bot, your own Google Sheet, your own GAS deployment, your own Vercel hosting. No part of the original ("Digital Store") is shared or reused — this is a from-scratch clone.

Stack: plain HTML/CSS/JS static site (Vercel) + Google Sheets (product data + order log) + Google Apps Script (order webhook + Telegram bot). No backend server, no build step, no database.

---

## 0. Prerequisites

- A Google account (for [Sheets](https://sheets.new) + [Apps Script](https://script.google.com))
- A [Telegram](https://telegram.org) account
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com/signup) account (free tier is fine)

---

## 1. Get the code

```bash
git clone https://github.com/YOUR_USERNAME/telegram-mini-app.git
cd telegram-mini-app
```

Or, if starting from this repo as a template: [fork it on GitHub](https://github.com/fadolladam/telegram-mini-app/fork) first, then clone your fork. If you're starting completely fresh (no existing repo), create a new one at [github.com/new](https://github.com/new).

Files you'll touch:
```
telegram-mini-app/
├── index.html               # Header title fallback (pre-JS)
├── style.css                # No edits needed
├── app.js                   # CONFIG block — store name, webhook URL, Sheets URLs
├── google-apps-script.js    # Paste into a NEW Apps Script project
└── vercel.json               # No edits needed
```

---

## 2. Create your bot

1. Open Telegram → message **[@BotFather](https://t.me/BotFather)**
2. `/newbot` → choose a name and a unique `@username` (must end in `bot`)
3. Save the token it gives you — you'll paste it into Script Properties in step 4, **never into code**

---

## 3. Create your Google Sheet

1. Create a new Google Sheet at [sheets.new](https://sheets.new)
2. Create two tabs: **Products** and **Carousel** (names can differ — you'll reference them by `gid` in the CSV URL either way)
3. Fill in headers exactly as below (order doesn't matter, names do — `app.js` reads by header name):

**Products tab columns:**
`id, name, category, price, oldPrice, rating, reviews, description, stock, badge, emoji, color1, color2, isNew, imageUrl`

- `category` must be one of: `phones`, `electronics`, `fashion`, `beauty`, `accessories`, `food`
- `stock = 0` shows "Out of Stock"
- `imageUrl` — any public image link. For [Google Drive](https://drive.google.com) images: Share → "Anyone with link" → convert `https://drive.google.com/file/d/FILE_ID/view` to `https://drive.google.com/uc?id=FILE_ID`

**Carousel tab columns:**
`id, label, title, subtitle, cta, emoji, color1, color2, category`

- `title` supports `\n` for a line break
- `category` filters the grid when the banner is tapped (`all` / `phones` / etc.)

4. Add a few rows of real data to each tab so the store isn't empty
5. Copy the **Spreadsheet ID** from the URL — the long string between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

### Publish both tabs to the web (required — this is how the frontend reads them)

1. **File → Share → Publish to web**
2. Select the Products tab → Format: **CSV** → **Publish** → copy the URL
3. Repeat for the Carousel tab
4. You'll paste both URLs into `app.js` in step 6

> If you skip this, the app silently falls back to built-in placeholder data — nothing crashes, but your real products won't show.

---

## 4. Set up Google Apps Script (order webhook + bot)

1. Go to [script.google.com/create](https://script.google.com/create) to start a new project directly
2. Rename it something recognizable, e.g. "MyStore Webhook"
3. **⚙️ Project Settings → Script Properties → Add property**, twice:
   - `BOT_TOKEN` = the token from step 2
   - `SPREADSHEET_ID` = the ID from step 3

   These are read at runtime via `PropertiesService.getScriptProperties()` — **never hardcode them in `google-apps-script.js`**. That file is safe to commit publicly as long as these two properties stay out of it.

4. Delete the default `Code.gs` contents, paste in the full contents of this repo's `google-apps-script.js`
5. **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. **Deploy** → authorize the requested permissions → copy the **Web App URL** (`https://script.google.com/macros/s/XXXXX/exec`)

> Redeploying later after code changes? Use **Manage Deployments → edit your existing deployment → New Version** — never "New Deployment," which would mint a new URL and break the frontend.

---

## 5. Configure `app.js`

Edit the `CONFIG` block near the top:

```js
const CONFIG = {
  storeName:             "Your Store Name",
  currency:              "$",
  deliveryFee:           3.99,
  freeDeliveryThreshold: 50,
  webhookUrl:            "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", // from step 4.6
  sheetsProducts:        "PASTE_PRODUCTS_CSV_URL_HERE",  // from step 3
  sheetsCarousel:        "PASTE_CAROUSEL_CSV_URL_HERE",  // from step 3
};
```

Also update the fallback text in `index.html` (`<title>` and the `#storeName` header) to match — it's shown for a split second before `app.js` overwrites it on load.

---

## 6. Push to GitHub and deploy to Vercel

```bash
git add .
git commit -m "Configure for my store"
git push
```

Then:
1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo (you may need to [install the Vercel GitHub app](https://vercel.com/docs/git/vercel-for-github) first if this is your first import)
2. Framework preset: **Other** — leave everything else default
3. **Deploy** — live in under a minute
4. Copy your live URL (e.g. `https://your-store.vercel.app`)

Every future `git push` to `main` auto-redeploys — no manual steps.

---

## 7. Register yourself as the seller/admin

1. In Telegram, send `/start` to your new bot
2. Visit in a browser:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=seller
   ```
3. You should see **"✅ Admin registered!"** — your chat ID is now saved as the one that receives order alerts

---

## 8. Turn on bot polling

GAS can't reliably receive Telegram webhooks (302-redirect issue), so this project polls instead:

1. Visit:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?setup=polling
   ```
2. In the Apps Script editor → **⏰ Triggers** → **+ Add Trigger**
   - Function: `processUpdates`
   - Event source: Time-driven
   - Type: Minutes timer → **Every 1 minute**
3. Save

Every `/start` and every order will now be picked up within a minute.

---

## 9. Finish setting up the bot in BotFather

Message **[@BotFather](https://t.me/BotFather)**:

| Command | What to set |
|---|---|
| `/setdescription` | Shown before anyone starts a chat — write a real intro to your store |
| `/setabouttext` | Short blurb, shown in the bot's info panel (≤120 chars) |
| `/setuserpic` | Upload your store's logo |
| `/setcommands` | This bot only handles `/start` — set: `start - Start shopping & get order updates` |
| **Menu Button** (`/mybots` → your bot → Bot Settings → Menu Button → Configure menu button) | URL: your Vercel URL from step 6. Label: e.g. `🛍️ Open Store` |

---

## 10. Test it end-to-end

1. Open your bot in Telegram → tap the menu button → confirm the store loads with your products
2. Add an item, go through checkout, place a test order
3. Confirm **you** (admin) get the "🛍️ NEW ORDER RECEIVED!" message
4. Confirm the buyer account gets "✅ Order Confirmed!" with the QR image
5. Check the **Orders** and **Customers** tabs auto-populated in your Sheet

---

## Security checklist before going live

- [ ] `BOT_TOKEN` / `SPREADSHEET_ID` only exist in GAS Script Properties — never in `google-apps-script.js`
- [ ] If you ever paste your token into code, a chat, or a commit by mistake: **rotate it immediately** in [@BotFather](https://t.me/BotFather) (`/mybots` → your bot → API Token → Revoke current token). Removing it from code afterward does *not* invalidate an already-leaked token — someone can still use it until it's revoked.
- [ ] After rotating a token, re-check `getWebhookInfo` to confirm no one hijacked the webhook while the old token was live:
  ```
  https://api.telegram.org/bot<TOKEN>/getWebhookInfo
  ```
  Expect `"url":""` (this project uses polling, not webhooks).

---

## Known limitations (same as upstream)

- Order totals aren't re-validated server-side against the Products sheet — a modified client request could submit an arbitrary price. Low risk for a small single-seller store; see the upstream README's "What to Build Next" for the fix approach.
- Single-seller only — Google Sheets won't scale to multiple independent merchants without a real backend.
