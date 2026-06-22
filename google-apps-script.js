/**
 * TG Store — Google Apps Script Webhook  (v4)
 *
 * DEPLOY STEPS:
 * 1. Go to https://script.google.com → Open your project
 * 2. Replace ALL code with this file
 * 3. Deploy → New Deployment → Web App
 *    Execute as: Me | Who has access: Anyone
 * 4. Copy the new Web App URL → paste into app.js as webhookUrl
 * 5. Visit [web-app-url]?setup=seller   → registers YOU as the admin
 * 6. Visit [web-app-url]?setup=webhook  → registers bot webhook (one-time)
 *    After step 6 every user who sends /start is saved to Customers sheet
 */

const BOT_TOKEN            = "8844507711:AAF_K-m95-0J00k5Y_VAvdWJY8IeCA0ez5w";
const SPREADSHEET_ID       = "1zgYV3RaOvkNQwoRuMzcH0qenizyHpSDK";
const SELLER_CHAT_KEY      = "SELLER_CHAT_ID";

const ORDERS_SHEET_NAME    = "Orders";
const CUSTOMERS_SHEET_NAME = "Customers";

// ─── ENTRY POINTS ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Telegram bot update (sent by Telegram webhook) — always has update_id
    if (body.update_id !== undefined) {
      return handleBotUpdate(body);
    }

    // Order from the mini app — always has orderId
    saveOrderToSheet(body);
    upsertCustomerFromOrder(body);
    notifySeller(body);
    notifyBuyer(body);
    return jsonResponse({ ok: true, orderId: body.orderId });

  } catch (err) {
    logError("doPost", err);
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  const setup = e.parameter.setup;
  if (setup === "seller")  return setupSellerChatId();
  if (setup === "polling") return setupPolling();
  // Legacy — kept for reference but polling is preferred
  if (setup === "webhook") return registerWebhook();
  if (setup === "true")    return setupSellerChatId();
  return jsonResponse({ ok: true, status: "TG Store webhook v4 running" });
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

// ── POLLING (recommended) ──────────────────────────────────────────────────
// GAS returns 302 redirects which Telegram cannot follow, so webhook mode
// fails. Use polling via a 1-minute time trigger instead.

function setupPolling() {
  // Delete existing webhook so updates queue for getUpdates
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
    method: "post", muteHttpExceptions: true,
  });

  // Fast-forward offset to skip already-queued updates (prevents welcome spam)
  const data = JSON.parse(
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&offset=0`
    ).getContentText()
  );
  if (data.ok && data.result.length) {
    const latestId = data.result[data.result.length - 1].update_id;
    PropertiesService.getScriptProperties().setProperty("UPDATE_OFFSET", String(latestId + 1));
  }

  return HtmlService.createHtmlOutput(`
    <h2>✅ Polling mode ready!</h2>
    <p>Webhook deleted. Now add a 1-minute time trigger:</p>
    <ol>
      <li>In Apps Script, click the <strong>⏰ Triggers</strong> icon (left sidebar)</li>
      <li>Click <strong>+ Add Trigger</strong> (bottom right)</li>
      <li>Function: <strong>processUpdates</strong></li>
      <li>Event source: <strong>Time-driven</strong></li>
      <li>Type: <strong>Minutes timer → Every 1 minute</strong></li>
      <li>Save</li>
    </ol>
    <p>Every /start message will now be saved to the Customers sheet within 1 minute.</p>
  `);
}

// Called by the 1-minute time trigger
function processUpdates() {
  const props  = PropertiesService.getScriptProperties();
  const offset = parseInt(props.getProperty("UPDATE_OFFSET") || "0");

  const data = JSON.parse(
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&offset=${offset}&timeout=0`
    ).getContentText()
  );

  if (!data.ok || !data.result.length) return;

  let newOffset = offset;
  for (const update of data.result) {
    newOffset = update.update_id + 1;
    try { handleBotUpdate(update); } catch (err) { logError("processUpdates", err); }
  }

  PropertiesService.getScriptProperties().setProperty("UPDATE_OFFSET", String(newOffset));
}

// ── WEBHOOK (legacy — kept but not recommended for GAS) ───────────────────
function registerWebhook() {
  const scriptUrl = ScriptApp.getService().getUrl();
  const res = JSON.parse(
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(scriptUrl)}`
    ).getContentText()
  );
  return HtmlService.createHtmlOutput(
    res.ok
      ? `<h2>⚠️ Webhook set (but GAS 302 redirects may block it)</h2>
         <p>Use <strong>?setup=polling</strong> instead for reliable delivery.</p>`
      : `<h2>❌ Failed: ${res.description}</h2>`
  );
}

function setupSellerChatId() {
  const data = JSON.parse(
    UrlFetchApp.fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10&offset=-10`
    ).getContentText()
  );

  if (!data.ok || !data.result.length) {
    return HtmlService.createHtmlOutput(
      "<h2>⚠️ No messages found</h2><p>Send /start to your bot first, then visit this URL again.</p>"
    );
  }

  const last   = data.result[data.result.length - 1];
  const chatId = last.message?.chat?.id ?? last.callback_query?.from?.id ?? null;
  if (!chatId) return HtmlService.createHtmlOutput("<h2>⚠️ Could not detect chat ID. Try again.</h2>");

  PropertiesService.getScriptProperties().setProperty(SELLER_CHAT_KEY, String(chatId));
  return HtmlService.createHtmlOutput(`
    <h2>✅ Admin registered!</h2>
    <p>Chat ID <strong>${chatId}</strong> saved. You will now receive order notifications.</p>
  `);
}

// ─── BOT UPDATE HANDLER ───────────────────────────────────────────────────────

function handleBotUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg) return jsonResponse({ ok: true });

  const from   = msg.from  || {};
  const chatId = msg.chat?.id;
  const text   = (msg.text || "").trim();

  if (text === "/start" || text.startsWith("/start ")) {
    const isNew = upsertCustomer({
      chatId:       from.id,
      firstName:    from.first_name    || "",
      lastName:     from.last_name     || "",
      username:     from.username      || "",
      languageCode: from.language_code || "",
      isPremium:    from.is_premium    || false,
    });
    // Only send welcome once — on first /start, not on every repeat
    if (isNew) sendWelcomeMessage(chatId, from.first_name);
  }

  // User tapped "Share Phone Number"
  if (msg.contact) {
    updateCustomerPhone(from.id, msg.contact.phone_number);
    sendTelegramMessage(chatId, "✅ Phone number saved! We'll use it for your order updates. 🛍️");
  }

  return jsonResponse({ ok: true });
}

// ─── ORDERS SHEET ─────────────────────────────────────────────────────────────

function getOrdersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headers = [
      "Order ID", "Date & Time", "Buyer Name", "Username", "Telegram ID",
      "Phone", "Address", "City", "Country", "Delivery Notes",
      "Items", "Subtotal ($)", "Delivery ($)", "Total ($)", "Currency", "Status"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0a7cff")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1,  180); // Order ID
    sheet.setColumnWidth(2,  160); // Date
    sheet.setColumnWidth(11, 300); // Items
  }

  return sheet;
}

function saveOrderToSheet(order) {
  const sheet     = getOrdersSheet();
  const addr      = order.address  || {};
  const customer  = order.customer || {};
  const buyerName = [customer.firstName, customer.lastName].filter(Boolean).join(" ")
                  || addr.fullName
                  || "Guest";
  const itemsStr  = (order.items || []).map(i =>
    `${i.name} ×${i.qty} = $${Number(i.lineTotal).toFixed(2)}`
  ).join(" | ");
  const fullAddr  = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", ");

  sheet.appendRow([
    order.orderId,
    new Date(order.timestamp).toLocaleString(),
    buyerName,
    customer.username  ? `@${customer.username}`  : "—",
    customer.telegramId ?? "—",
    addr.phone        || "—",
    fullAddr          || "—",
    addr.city         || "—",
    addr.country      || "—",
    addr.notes        || "—",
    itemsStr,
    Number(order.subtotal).toFixed(2),
    Number(order.delivery).toFixed(2),
    Number(order.total).toFixed(2),
    order.currency    || "$",
    "New",
  ]);
}

// ─── CUSTOMERS SHEET ──────────────────────────────────────────────────────────

function getCustomersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CUSTOMERS_SHEET_NAME);
    const headers = [
      "Chat ID", "First Name", "Last Name", "Username",
      "Phone", "Language", "Premium",
      "First Seen", "Last Active", "Total Orders", "Total Spent ($)"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#34a853")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(8, 160);
    sheet.setColumnWidth(9, 160);
  }

  return sheet;
}

function findCustomerRow(sheet, chatId) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(chatId)) return i + 1; // 1-based
  }
  return -1;
}

// Returns true if this is a brand-new customer, false if already existed
function upsertCustomer(data) {
  const sheet = getCustomersSheet();
  const row   = findCustomerRow(sheet, data.chatId);
  const now   = new Date().toLocaleString();
  const isNew = row === -1;

  if (isNew) {
    sheet.appendRow([
      data.chatId,
      data.firstName    || "—",
      data.lastName     || "—",
      data.username     ? `@${data.username}` : "—",
      data.phone        || "—",
      data.languageCode || "—",
      data.isPremium    ? "Yes" : "No",
      now,  // First Seen
      now,  // Last Active
      0,    // Total Orders
      0,    // Total Spent
    ]);
  } else {
    sheet.getRange(row, 2).setValue(data.firstName || "—");
    sheet.getRange(row, 3).setValue(data.lastName  || "—");
    if (data.username)     sheet.getRange(row, 4).setValue(`@${data.username}`);
    if (data.languageCode) sheet.getRange(row, 6).setValue(data.languageCode);
    sheet.getRange(row, 9).setValue(now); // Last Active
  }

  return isNew;
}

function updateCustomerPhone(chatId, phone) {
  const sheet = getCustomersSheet();
  const row   = findCustomerRow(sheet, chatId);
  const now   = new Date().toLocaleString();

  if (row === -1) {
    sheet.appendRow([chatId, "—", "—", "—", phone, "—", "—", now, now, 0, 0]);
  } else {
    sheet.getRange(row, 5).setValue(phone);
    sheet.getRange(row, 9).setValue(now);
  }
}

function upsertCustomerFromOrder(order) {
  const chatId = order.customer?.telegramId;
  if (!chatId) return;

  const sheet  = getCustomersSheet();
  const row    = findCustomerRow(sheet, chatId);
  const now    = new Date().toLocaleString();
  const addr   = order.address  || {};
  const cust   = order.customer || {};
  const phone  = addr.phone || "—";
  const total  = Number(order.total);

  if (row === -1) {
    sheet.appendRow([
      chatId,
      cust.firstName || addr.fullName || "—",
      cust.lastName  || "—",
      cust.username  ? `@${cust.username}` : "—",
      phone,
      "—", "—",  // language & premium unknown at order time
      now, now,  // First Seen, Last Active
      1,
      total.toFixed(2),
    ]);
  } else {
    const existing = sheet.getRange(row, 1, 1, 11).getValues()[0];
    if (phone !== "—") sheet.getRange(row, 5).setValue(phone);
    sheet.getRange(row, 9).setValue(now);
    sheet.getRange(row, 10).setValue((Number(existing[9])  || 0) + 1);
    sheet.getRange(row, 11).setValue(
      ((parseFloat(existing[10]) || 0) + total).toFixed(2)
    );
  }
}

// ─── SELLER NOTIFICATION ──────────────────────────────────────────────────────

function notifySeller(order) {
  const sellerChatId = PropertiesService.getScriptProperties().getProperty(SELLER_CHAT_KEY);
  if (!sellerChatId) return;

  const addr      = order.address  || {};
  const cust      = order.customer || {};
  const buyerName = [cust.firstName, cust.lastName].filter(Boolean).join(" ") || addr.fullName || "Guest";
  const username  = cust.username ? `@${cust.username}` : "—";
  const phone     = addr.phone    || "—";
  const addrLine  = [addr.addressLine1, addr.addressLine2, addr.city, addr.country]
                    .filter(Boolean).join(", ");

  const itemLines = (order.items || []).map(i =>
    `  • ${i.name} × ${i.qty}  →  ${order.currency}${Number(i.lineTotal).toFixed(2)}`
  ).join("\n");

  const lines = [
    `🛍️ *NEW ORDER RECEIVED!*`,
    ``,
    `📦 *Order ID:* \`${order.orderId}\``,
    `🕐 *Time:* ${new Date(order.timestamp).toLocaleString()}`,
    ``,
    `━━━━━━━━━━ CUSTOMER ━━━━━━━━━━`,
    `👤 *Name:* ${buyerName}`,
    `💬 *Telegram:* ${username}`,
    `🆔 *Chat ID:* ${cust.telegramId || "—"}`,
    `📞 *Phone:* ${phone}`,
    ``,
    `━━━━━━━━━━ DELIVERY ━━━━━━━━━━`,
    `📍 *Address:* ${addrLine || "—"}`,
    addr.notes ? `📝 *Notes:* ${addr.notes}` : null,
    ``,
    `━━━━━━━━━━ ITEMS ━━━━━━━━━━`,
    itemLines,
    ``,
    `━━━━━━━━━━ PAYMENT ━━━━━━━━━━`,
    `💰 *Subtotal:* ${order.currency}${Number(order.subtotal).toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery == 0 ? "FREE 🎉" : order.currency + Number(order.delivery).toFixed(2)}`,
    `✅ *TOTAL: ${order.currency}${Number(order.total).toFixed(2)}*`,
  ].filter(l => l !== null).join("\n");

  sendTelegramMessage(sellerChatId, lines);
}

// ─── BUYER NOTIFICATION ───────────────────────────────────────────────────────

function notifyBuyer(order) {
  const chatId = order.customer?.telegramId;
  if (!chatId) return;

  const addr      = order.address  || {};
  const cust      = order.customer || {};
  const firstName = cust.firstName || addr.fullName || "there";
  const addrLine  = [addr.addressLine1, addr.city, addr.country].filter(Boolean).join(", ");
  const short     = order.orderId.slice(-10);

  const itemLines = (order.items || []).map(i =>
    `  • ${i.name} × ${i.qty}  —  ${order.currency}${Number(i.lineTotal).toFixed(2)}`
  ).join("\n");

  const lines = [
    `✅ *Order Confirmed!*`,
    ``,
    `Hi ${firstName}! Your order has been placed successfully. 🎉`,
    ``,
    `📦 *Order ID:* \`${short}\``,
    `🕐 *Placed at:* ${new Date(order.timestamp).toLocaleString()}`,
    ``,
    `🧾 *Your Items:*`,
    itemLines,
    ``,
    `💰 *Subtotal:* ${order.currency}${Number(order.subtotal).toFixed(2)}`,
    `🚚 *Delivery:* ${order.delivery == 0 ? "FREE 🎉" : order.currency + Number(order.delivery).toFixed(2)}`,
    `✅ *Total Paid: ${order.currency}${Number(order.total).toFixed(2)}*`,
    ``,
    `📍 *Shipping to:* ${addrLine || "—"}`,
    addr.notes ? `📝 *Your notes:* ${addr.notes}` : null,
    ``,
    `We're preparing your order now. You'll receive updates here. Thank you for shopping with us! 🛍️`,
  ].filter(l => l !== null).join("\n");

  sendTelegramMessage(chatId, lines);
}

// ─── WELCOME MESSAGE ──────────────────────────────────────────────────────────

function sendWelcomeMessage(chatId, firstName) {
  const name = firstName || "there";
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:      "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: [
        `👋 *Welcome to TG Store, ${name}!*`,
        ``,
        `We're glad you're here. 🛍️`,
        ``,
        `To receive order updates and delivery notifications, please share your phone number using the button below.`,
      ].join("\n"),
      parse_mode: "Markdown",
      reply_markup: {
        keyboard:          [[{ text: "📱 Share Phone Number", request_contact: true }]],
        resize_keyboard:   true,
        one_time_keyboard: true,
      },
    }),
    muteHttpExceptions: true,
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

function logError(context, err) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet   = ss.getSheetByName("Errors");
    if (!sheet) {
      sheet = ss.insertSheet("Errors");
      sheet.appendRow(["Timestamp", "Context", "Error"]);
      sheet.getRange(1,1,1,3).setFontWeight("bold").setBackground("#ea4335").setFontColor("#fff");
    }
    sheet.appendRow([new Date().toLocaleString(), context, err.message || String(err)]);
  } catch (_) {}
}
