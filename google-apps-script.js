/**
 * TG Store — Google Apps Script Webhook  (v2)
 *
 * DEPLOY STEPS:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file, replacing the default code
 * 3. Set BOT_TOKEN below to your token from @BotFather
 * 4. Deploy → New Deployment → Web App
 *    Execute as: Me | Who has access: Anyone
 * 5. Copy the Web App URL → paste into app.js as webhookUrl
 * 6. Message your bot /start in Telegram
 * 7. Visit [web-app-url]?setup=true once to register as seller
 */

const BOT_TOKEN       = "PASTE_YOUR_BOT_TOKEN_HERE";
const ORDERS_SHEET_ID = "1eF9ISo5-rZpkMABFESpiPQzrB8qCs4KKlX3wI16rpTA";
const SELLER_CHAT_KEY = "SELLER_CHAT_ID";

// ─── RECEIVE ORDER ────────────────────────────────────────────────
function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);
    saveOrderToSheet(order);
    notifySeller(order);
    notifyBuyer(order);
    return jsonResponse({ ok: true, orderId: order.orderId });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ─── SETUP / HEALTH CHECK ─────────────────────────────────────────
function doGet(e) {
  if (e.parameter.setup === "true") return setupSellerChatId();
  return jsonResponse({ ok: true, status: "TG Store webhook running" });
}

function setupSellerChatId() {
  const url  = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10&offset=-10`;
  const data = JSON.parse(UrlFetchApp.fetch(url).getContentText());

  if (!data.ok || !data.result.length) {
    return HtmlService.createHtmlOutput(
      "<h2>⚠️ No messages found</h2><p>Please send /start to your bot first, then visit this URL again.</p>"
    );
  }

  const last   = data.result[data.result.length - 1];
  const chatId = last.message?.chat?.id ?? last.callback_query?.from?.id ?? null;

  if (!chatId) return HtmlService.createHtmlOutput("<h2>⚠️ Could not detect chat ID. Try again.</h2>");

  PropertiesService.getScriptProperties().setProperty(SELLER_CHAT_KEY, String(chatId));

  return HtmlService.createHtmlOutput(`
    <h2>✅ Seller registered!</h2>
    <p>Chat ID <strong>${chatId}</strong> saved. You will now receive order notifications.</p>
    <p>You can close this tab.</p>
  `);
}

// ─── SAVE ORDER TO GOOGLE SHEET ──────────────────────────────────
function saveOrderToSheet(order) {
  const ss    = SpreadsheetApp.openById(ORDERS_SHEET_ID);
  const sheet = ss.getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Order ID","Timestamp","Buyer Name","Username","Telegram ID",
      "Phone","Address","City","Country","Delivery Notes",
      "Items","Subtotal","Delivery","Total","Currency","Status"
    ]);
    sheet.getRange(1,1,1,16).setFontWeight("bold").setBackground("#0a7cff").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }

  const addr     = order.address || {};
  const itemsStr = order.items.map(i => `${i.name} x${i.qty} ($${i.lineTotal})`).join(" | ");
  const buyerName = `${order.customer.firstName} ${order.customer.lastName}`.trim() || addr.fullName || "Guest";

  sheet.appendRow([
    order.orderId,
    new Date(order.timestamp).toLocaleString(),
    buyerName,
    order.customer.username ? `@${order.customer.username}` : "—",
    order.customer.telegramId ?? "—",
    addr.phone       || "—",
    [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
    addr.city        || "—",
    addr.country     || "—",
    addr.notes       || "—",
    itemsStr,
    order.subtotal,
    order.delivery,
    order.total,
    order.currency,
    "New"
  ]);
}

// ─── NOTIFY SELLER ────────────────────────────────────────────────
function notifySeller(order) {
  const sellerChatId = PropertiesService.getScriptProperties().getProperty(SELLER_CHAT_KEY);
  if (!sellerChatId) return;

  const addr      = order.address || {};
  const buyerName = `${order.customer.firstName} ${order.customer.lastName}`.trim() || addr.fullName || "Guest";
  const username  = order.customer.username ? `@${order.customer.username}` : "No username";
  const itemLines = order.items.map(i => `  • ${i.name} × ${i.qty}  →  ${order.currency}${i.lineTotal.toFixed(2)}`).join("\n");
  const addrLine  = [addr.addressLine1, addr.addressLine2, addr.city, addr.country].filter(Boolean).join(", ");

  const msg = [
    `🛍️ *New Order Received!*`,
    ``,
    `📦 *Order ID:* \`${order.orderId}\``,
    `🕐 *Time:* ${new Date(order.timestamp).toLocaleString()}`,
    ``,
    `👤 *Buyer:* ${buyerName}`,
    `💬 *Telegram:* ${username}`,
    `📞 *Phone:* ${addr.phone || "—"}`,
    ``,
    `📍 *Ship to:*`,
    `  ${addrLine}`,
    addr.notes ? `📝 *Notes:* ${addr.notes}` : "",
    ``,
    `🧾 *Items:*`,
    itemLines,
    ``,
    `💰 *Subtotal:* ${order.currency}${order.subtotal.toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery === 0 ? "FREE 🎉" : order.currency + order.delivery.toFixed(2)}`,
    `✅ *Total:* ${order.currency}${order.total.toFixed(2)}`,
  ].filter(l => l !== "").join("\n");

  sendTelegramMessage(sellerChatId, msg);
}

// ─── NOTIFY BUYER ─────────────────────────────────────────────────
function notifyBuyer(order) {
  const buyerId = order.customer.telegramId;
  if (!buyerId) return;

  const addr      = order.address || {};
  const firstName = order.customer.firstName || addr.fullName || "there";
  const itemLines = order.items.map(i => `  • ${i.name} × ${i.qty}`).join("\n");
  const addrLine  = [addr.addressLine1, addr.city, addr.country].filter(Boolean).join(", ");

  const msg = [
    `✅ *Order Confirmed!*`,
    ``,
    `Hi ${firstName}! Your order has been placed successfully.`,
    ``,
    `📦 *Order ID:* \`${order.orderId}\``,
    ``,
    `🧾 *Your Items:*`,
    itemLines,
    ``,
    `💰 *Total:* ${order.currency}${order.total.toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery === 0 ? "FREE 🎉" : order.currency + order.delivery.toFixed(2)}`,
    ``,
    `📍 *Delivering to:* ${addrLine}`,
    addr.notes ? `📝 *Your notes:* ${addr.notes}` : "",
    ``,
    `We will process your order shortly. Thank you for shopping with us! 🛍️`,
  ].filter(l => l !== "").join("\n");

  sendTelegramMessage(buyerId, msg);
}

// ─── SEND TELEGRAM MESSAGE ────────────────────────────────────────
function sendTelegramMessage(chatId, text) {
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:      "post",
    contentType: "application/json",
    payload:     JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    muteHttpExceptions: true,
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
