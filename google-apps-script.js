/**
 * TG Store — Google Apps Script Webhook
 *
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file, replacing the default code
 * 3. Set BOT_TOKEN below to your Telegram bot token from @BotFather
 * 4. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL — paste it into app.js as WEBHOOK_URL
 * 6. Message your bot /start in Telegram
 * 7. Visit: [your-web-app-url]?setup=true  (one time only)
 *    This auto-saves YOUR chat ID as the seller
 */

// ─── CONFIGURATION ────────────────────────────────────────────────
const BOT_TOKEN        = "PASTE_YOUR_BOT_TOKEN_HERE";   // from @BotFather
const ORDERS_SHEET_ID  = "1eF9ISo5-rZpkMABFESpiPQzrB8qCs4KKlX3wI16rpTA";
const SELLER_CHAT_KEY  = "SELLER_CHAT_ID";   // stored in Script Properties

// ─── RECEIVE ORDER (POST from Mini App) ──────────────────────────
function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);
    saveOrderToSheet(order);
    notifySeller(order);
    notifyBuyer(order);
    return jsonResponse({ ok: true, orderId: order.orderId });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

// ─── SETUP ENDPOINT (GET — run once to register seller) ──────────
function doGet(e) {
  if (e.parameter.setup === "true") {
    return setupSellerChatId();
  }
  return jsonResponse({ ok: true, status: "TG Store webhook is running" });
}

// Auto-fetch the most recent message sender and save as seller
function setupSellerChatId() {
  const url      = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10&offset=-10`;
  const response = UrlFetchApp.fetch(url);
  const data     = JSON.parse(response.getContentText());

  if (!data.ok || !data.result.length) {
    return HtmlService.createHtmlOutput(
      "<h2>⚠️ No messages found</h2><p>Please message your bot /start first, then visit this URL again.</p>"
    );
  }

  // Get the most recent message's chat ID
  const updates = data.result;
  const lastMsg = updates[updates.length - 1];
  const chatId  = lastMsg.message?.chat?.id
               ?? lastMsg.callback_query?.from?.id
               ?? null;

  if (!chatId) {
    return HtmlService.createHtmlOutput("<h2>⚠️ Could not detect chat ID</h2>");
  }

  PropertiesService.getScriptProperties().setProperty(SELLER_CHAT_KEY, String(chatId));

  return HtmlService.createHtmlOutput(`
    <h2>✅ Seller registered!</h2>
    <p>Your Chat ID <strong>${chatId}</strong> has been saved.</p>
    <p>You will now receive order notifications in Telegram.</p>
    <p>You can close this tab.</p>
  `);
}

// ─── SAVE ORDER TO GOOGLE SHEET ──────────────────────────────────
function saveOrderToSheet(order) {
  const ss    = SpreadsheetApp.openById(ORDERS_SHEET_ID);
  const sheet = ss.getSheets()[0];

  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Order ID", "Timestamp", "Buyer Name", "Username",
      "Telegram ID", "Items", "Subtotal", "Delivery", "Total", "Currency", "Status"
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0a7cff").setFontColor("#ffffff");
  }

  const itemsSummary = order.items
    .map(i => `${i.name} x${i.qty} ($${i.lineTotal})`)
    .join(" | ");

  sheet.appendRow([
    order.orderId,
    order.timestamp,
    `${order.customer.firstName} ${order.customer.lastName}`.trim() || "Guest",
    order.customer.username ? `@${order.customer.username}` : "—",
    order.customer.telegramId ?? "—",
    itemsSummary,
    order.subtotal,
    order.delivery,
    order.total,
    order.currency,
    "New"
  ]);
}

// ─── NOTIFY SELLER ────────────────────────────────────────────────
function notifySeller(order) {
  const sellerChatId = PropertiesService.getScriptProperties()
                         .getProperty(SELLER_CHAT_KEY);
  if (!sellerChatId) return; // not set up yet

  const itemLines = order.items
    .map(i => `  • ${i.name} × ${i.qty}  →  ${order.currency}${i.lineTotal.toFixed(2)}`)
    .join("\n");

  const buyerName = `${order.customer.firstName} ${order.customer.lastName}`.trim() || "Guest";
  const username  = order.customer.username ? `@${order.customer.username}` : "No username";

  const message = [
    `🛍️ *New Order Received!*`,
    ``,
    `📦 *Order ID:* \`${order.orderId}\``,
    `🕐 *Time:* ${new Date(order.timestamp).toLocaleString()}`,
    ``,
    `👤 *Buyer:* ${buyerName}`,
    `💬 *Telegram:* ${username}`,
    `🔢 *User ID:* ${order.customer.telegramId ?? "—"}`,
    ``,
    `🧾 *Items:*`,
    itemLines,
    ``,
    `💰 *Subtotal:* ${order.currency}${order.subtotal.toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery === 0 ? "FREE 🎉" : order.currency + order.delivery.toFixed(2)}`,
    `✅ *Total:* ${order.currency}${order.total.toFixed(2)}`,
  ].join("\n");

  sendTelegramMessage(sellerChatId, message);
}

// ─── NOTIFY BUYER ─────────────────────────────────────────────────
function notifyBuyer(order) {
  const buyerId = order.customer.telegramId;
  if (!buyerId) return; // opened outside Telegram

  const itemLines = order.items
    .map(i => `  • ${i.name} × ${i.qty}`)
    .join("\n");

  const message = [
    `✅ *Order Confirmed!*`,
    ``,
    `Hi ${order.customer.firstName}! Your order has been placed successfully.`,
    ``,
    `📦 *Order ID:* \`${order.orderId}\``,
    ``,
    `🧾 *Your Items:*`,
    itemLines,
    ``,
    `💰 *Total Paid:* ${order.currency}${order.total.toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery === 0 ? "FREE 🎉" : order.currency + order.delivery.toFixed(2)}`,
    ``,
    `We will process your order shortly. Thank you for shopping with us! 🛍️`,
  ].join("\n");

  sendTelegramMessage(buyerId, message);
}

// ─── SEND TELEGRAM MESSAGE ────────────────────────────────────────
function sendTelegramMessage(chatId, text) {
  const url     = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id:    chatId,
    text:       text,
    parse_mode: "Markdown",
  };
  UrlFetchApp.fetch(url, {
    method:  "post",
    payload: JSON.stringify(payload),
    contentType: "application/json",
    muteHttpExceptions: true,
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────
function jsonResponse(data, code) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
