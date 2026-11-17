export default async function handler(req, res) {
  // CORS va metod tekshiruvi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const BOT_TOKEN = process.env.BOT_TOKEN || '8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo';
  const OWNER_CHAT_ID = '6707839718';
  const OWNER_USERNAME = 'fayzbek1331';
  const SITE_URL = 'https://non-uzb.vercel.app';

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'nonuz_bot_webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const PRODUCTS = {
    goshli: {
      name: "Go'shtli non",
      price: 20000,
      desc: "Tandirda pishirilgan mayin mol go'shti, piyoz va xushbo'y ziravorlar bilan to'ldirilgan issiq non."
    },
    qoqon: {
      name: "Qo'qon patir",
      price: 9000,
      desc: "Mashhur Qo'qoncha uslubdagi chiroyli naqshli, qarsildoq chetli shohona patir."
    },
    ramashka: {
      name: "Ramashka non",
      price: 8000,
      desc: "Moychechak gul barglari shaklidagi juda yumshoq va nafis dasturxon ko'rki."
    },
    yogli: {
      name: "Yog'li non",
      price: 5000,
      desc: "Saryog' va qat-qat xamirdan tayyorlangan, sedana sepilgan an'anaviy non."
    }
  };

  // Helper funksiyalar
  async function callTg(method, payload) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (e) {
      console.error(`Telegram API error (${method}):`, e);
      return null;
    }
  }

  function isOwner(user) {
    if (!user) return false;
    if (String(user.id) === OWNER_CHAT_ID) return true;
    if (user.username && user.username.toLowerCase() === OWNER_USERNAME.toLowerCase()) return true;
    return false;
  }

  async function getSystemStatus() {
    try {
      const data = await callTg('getMyShortDescription', {});
      const desc = data?.result?.short_description || '';
      return !desc.startsWith('[OFF]');
    } catch (e) {
      return true;
    }
  }

  async function setSystemStatus(active) {
    const shortDesc = active
      ? 'Tandir Non — Issiq va mazali nonlar. Sayt: https://non-uzb.vercel.app'
      : '[OFF] Tandir Non vaqtincha buyurtma qabul qilmayapti.';

    await callTg('setMyShortDescription', { short_description: shortDesc });

    if (active) {
      await callTg('setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: '🍞 Non Menyusi',
          web_app: { url: SITE_URL }
        }
      });
    } else {
      await callTg('setChatMenuButton', {
        menu_button: { type: 'default' }
      });
    }
  }

  function getClientReplyKeyboard() {
    return {
      keyboard: [
        [
          { text: '🍞 Nonlarimiz (Menyu)' },
          { text: '🛵 Dastavka buyurtma berish' }
        ],
        [
          { text: '⏰ Ish vaqti' },
          { text: '📞 Bog\'lanish & Dastavka' }
        ],
        [
          { text: '🌐 Saytni ochish (Non Savati)', web_app: { url: SITE_URL } }
        ]
      ],
      resize_keyboard: true
    };
  }

  function getOwnerKeyboard(active) {
    if (active) {
      return {
        inline_keyboard: [
          [
            { text: '🔴 Tizimni to\'xtatish (Sayt & Bot)', callback_data: 'admin_toggle_off' }
          ],
          [
            { text: '🌐 Saytni ochish', web_app: { url: SITE_URL } },
            { text: '📋 Mijoz menyusi', callback_data: 'admin_client_menu' }
          ],
          [
            { text: '🔄 Holatni yangilash', callback_data: 'admin_refresh' }
          ]
        ]
      };
    } else {
      return {
        inline_keyboard: [
          [
            { text: '🟢 Tizimni qayta ishga tushirish (1 bosishda)', callback_data: 'admin_toggle_on' }
          ],
          [
            { text: '🌐 Saytni ko\'rish', web_app: { url: SITE_URL } },
            { text: '🔄 Holatni yangilash', callback_data: 'admin_refresh' }
          ]
        ]
      };
    }
  }

  function getMenuInlineKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '🚀 Saytda xarid qilish (Veb-Ilova)', web_app: { url: SITE_URL } }
        ],
        [
          { text: '🥩 Go\'shtli non — 20 000 so\'m', callback_data: 'prod_goshli' }
        ],
        [
          { text: '🥯 Qo\'qon patir — 9 000 so\'m', callback_data: 'prod_qoqon' }
        ],
        [
          { text: '🌼 Ramashka — 8 000 so\'m', callback_data: 'prod_ramashka' }
        ],
        [
          { text: '🧈 Yog\'li non — 5 000 so\'m', callback_data: 'prod_yogli' }
        ]
      ]
    };
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // 1. CALLBACK QUERY
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || '';
      const user = cq.from;
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;

      // Admin toggle OFF
      if (data === 'admin_toggle_off') {
        if (!isOwner(user)) {
          await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Ruxsat yo\'q!', show_alert: true });
          return res.status(200).json({ ok: true });
        }
        await setSystemStatus(false);
        await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: '🔴 Tizim to\'xtatildi!' });
        await callTg('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `⚙️ <b>TANDIR NON — BOSHQARUV PANELI</b>\n\n` +
                `🔴 <b>Tizim holati:</b> TO'XTATILGAN (Profilaktika)\n` +
                `<i>Sayt va bot mijozlar uchun profilaktika rejimida.</i>`,
          parse_mode: 'HTML',
          reply_markup: getOwnerKeyboard(false)
        });
        return res.status(200).json({ ok: true });
      }

      // Admin toggle ON
      if (data === 'admin_toggle_on') {
        if (!isOwner(user)) {
          await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Ruxsat yo\'q!', show_alert: true });
          return res.status(200).json({ ok: true });
        }
        await setSystemStatus(true);
        await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: '🟢 Tizim ishga tushirildi!' });
        await callTg('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `⚙️ <b>TANDIR NON — BOSHQARUV PANELI</b>\n\n` +
                `🟢 <b>Tizim holati:</b> ISHLAMOQDA (Faol)\n` +
                `<i>Sayt va bot buyurtmalarni qabul qilishga tayyor.</i>`,
          parse_mode: 'HTML',
          reply_markup: getOwnerKeyboard(true)
        });
        return res.status(200).json({ ok: true });
      }

      // Admin refresh
      if (data === 'admin_refresh') {
        if (!isOwner(user)) {
          await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Ruxsat yo\'q!' });
          return res.status(200).json({ ok: true });
        }
        const active = await getSystemStatus();
        await callTg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Yangilandi' });
        await callTg('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `⚙️ <b>TANDIR NON — BOSHQARUV PANELI</b>\n\n` +
                `${active ? '🟢 <b>Tizim holati:</b> ISHLAMOQDA (Faol)' : '🔴 <b>Tizim holati:</b> TO\'XTATILGAN (Profilaktika)'}\n` +
                `<i>Barcha xizmatlar avtomatik boshqaruvda.</i>`,
          parse_mode: 'HTML',
          reply_markup: getOwnerKeyboard(active)
        });
        return res.status(200).json({ ok: true });
      }

      // Admin client menu
      if (data === 'admin_client_menu') {
        await callTg('answerCallbackQuery', { callback_query_id: cq.id });
        await callTg('sendMessage', {
          chat_id: chatId,
          text: '🥖 <b>Mijoz menyusi ko\'rinishi:</b>',
          parse_mode: 'HTML',
          reply_markup: getMenuInlineKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Product detail callback
      if (data.startsWith('prod_')) {
        const prodKey = data.replace('prod_', '');
        const prod = PRODUCTS[prodKey];
        if (prod) {
          await callTg('answerCallbackQuery', { callback_query_id: cq.id });
          const text = `🥖 <b>${prod.name}</b>\n\n` +
                       `📝 ${prod.desc}\n\n` +
                       `💰 <b>Narxi:</b> ${prod.price.toLocaleString('uz-UZ')} so'm\n\n` +
                       `🛵 <i>Dastavka xizmati orqali issiq holda yetkazib beramiz!</i>`;
          await callTg('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🛒 Saytda savatga qo\'shish', web_app: { url: SITE_URL } }
                ],
                [
                  { text: '⬅️ Menyu ro\'yxatiga qaytish', callback_data: 'back_to_menu' }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Back to menu
      if (data === 'back_to_menu') {
        await callTg('answerCallbackQuery', { callback_query_id: cq.id });
        const text = `🥖 <b>Bizning Tandir Nonlarimiz:</b>\n\n` +
                     `1. <b>Go'shtli non</b> — 20 000 so'm\n` +
                     `2. <b>Qo'qon patir</b> — 9 000 so'm\n` +
                     `3. <b>Ramashka non</b> — 8 000 so'm\n` +
                     `4. <b>Yog'li non</b> — 5 000 so'm\n\n` +
                     `Batafsil ma'lumot olish uchun tanlang:`;
        await callTg('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: getMenuInlineKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Order accept / cancel
      if (data.startsWith('order_accept_') || data.startsWith('order_cancel_')) {
        const isAccept = data.startsWith('order_accept_');
        const orderId = data.replace(isAccept ? 'order_accept_' : 'order_cancel_', '');
        await callTg('answerCallbackQuery', {
          callback_query_id: cq.id,
          text: isAccept ? `✅ Buyurtma #${orderId} qabul qilindi!` : `❌ Buyurtma #${orderId} bekor qilindi!`
        });

        const originalText = cq.message?.text || '';
        const statusBadge = isAccept ? `\n\n<b>✅ STATUS: QABUL QILINDI VA TAYYORLANMOQDA</b>` : `\n\n<b>❌ STATUS: BEKOR QILINDI</b>`;
        await callTg('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: originalText + statusBadge,
          parse_mode: 'HTML'
        });
        return res.status(200).json({ ok: true });
      }

      await callTg('answerCallbackQuery', { callback_query_id: cq.id });
      return res.status(200).json({ ok: true });
    }

    // 2. MESSAGE
    if (update.message) {
      const msg = update.message;
      const text = msg.text || '';
      const user = msg.from;
      const chatId = msg.chat?.id;

      // /start yoki /admin
      if (text.startsWith('/start') || text.startsWith('/admin')) {
        if (isOwner(user)) {
          const active = await getSystemStatus();
          await callTg('sendMessage', {
            chat_id: chatId,
            text: `⚙️ <b>TANDIR NON — BOSHQARUV PANELI</b>\n\n` +
                  `${active ? '🟢 <b>Tizim holati:</b> ISHLAMOQDA (Faol)' : '🔴 <b>Tizim holati:</b> TO\'XTATILGAN (Profilaktika)'}\n\n` +
                  `Quyidagi tugmalar orqali butun tizimni (sayt va bot) 1 bosish bilan to'xtatishingiz yoki qayta ishga tushirishingiz mumkin:`,
            parse_mode: 'HTML',
            reply_markup: getOwnerKeyboard(active)
          });
          return res.status(200).json({ ok: true });
        }

        const active = await getSystemStatus();
        if (!active) {
          await callTg('sendMessage', {
            chat_id: chatId,
            text: `⚠️ <b>Assalomu alaykum!</b>\n\n` +
                  `Nonvoyxonamizda hozirda profilaktika ishlari olib borilmoqda yoki buyurtmalar vaqtincha to'xtatilgan.\n\n` +
                  `Tez orada xizmatingizda bo'lamiz! Noqulaylik uchun uzr so'raymiz.\n` +
                  `📞 Aloqa: <b>+998 98 000 94 54</b>`,
            parse_mode: 'HTML'
          });
          return res.status(200).json({ ok: true });
        }

        const firstName = user?.first_name || 'Hurmatli mijoz';
        await callTg('sendMessage', {
          chat_id: chatId,
          text: `Assalomu alaykum, <b>${firstName}</b>! 🥖\n\n` +
                `<b>Tandir Non</b> rasmiy botiga xush kelibsiz!\n` +
                `Bizda har doim yangi uzilgan, issiq va mazali tandir nonlari mavjud.\n\n` +
                `Quyidagi menyudan kerakli bo'limni tanlang yoki to'g'ridan-to'g'ri saytimiz orqali savatga to'plab buyurtma bering:`,
          parse_mode: 'HTML',
          reply_markup: getClientReplyKeyboard()
        });

        await callTg('sendMessage', {
          chat_id: chatId,
          text: `🛒 <b>Nonlar menyusini ko'rish va xarid qilish:</b>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🍞 Non Menyusi (Saytni ochish)', web_app: { url: SITE_URL } }
              ]
            ]
          }
        });

        return res.status(200).json({ ok: true });
      }

      // Menyu tugmasi
      if (text === '🍞 Nonlarimiz (Menyu)') {
        const active = await getSystemStatus();
        if (!active && !isOwner(user)) {
          await callTg('sendMessage', {
            chat_id: chatId,
            text: `⚠️ Profilaktika sababli buyurtmalar vaqtincha to'xtatilgan.`,
            parse_mode: 'HTML'
          });
          return res.status(200).json({ ok: true });
        }

        await callTg('sendMessage', {
          chat_id: chatId,
          text: `🥖 <b>Bizning Tandir Nonlarimiz:</b>\n\n` +
                `1. <b>Go'shtli non</b> — 20 000 so'm\n` +
                `2. <b>Qo'qon patir</b> — 9 000 so'm\n` +
                `3. <b>Ramashka non</b> — 8 000 so'm\n` +
                `4. <b>Yog'li non</b> — 5 000 so'm\n\n` +
                `Batafsil ma'lumot olish uchun quyidagilardan birini tanlang:`,
          parse_mode: 'HTML',
          reply_markup: getMenuInlineKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Ish vaqti
      if (text === '⏰ Ish vaqti') {
        await callTg('sendMessage', {
          chat_id: chatId,
          text: `⏰ <b>Tandir Non Ish Vaqti:</b>\n\n` +
                `🌅 <b>Ish boshlanadi:</b> Ertalab 05:00 da\n` +
                `🌃 <b>Ish tugaydi:</b> Kechasi 24:00 da (Yarim tun)\n` +
                `📅 <b>Ish kunlari:</b> Har kuni (Dam olishsiz)\n\n` +
                `🔥 <i>Har kuni erta tong soat 05:00 dan birinchi issiq nonlar tayyor bo'ladi!</i>`,
          parse_mode: 'HTML'
        });
        return res.status(200).json({ ok: true });
      }

      // Bog'lanish va dastavka
      if (text === '📞 Bog\'lanish & Dastavka' || text === '🛵 Dastavka buyurtma berish') {
        await callTg('sendMessage', {
          chat_id: chatId,
          text: `🛵 <b>Dastavka va Buyurtma Uchun Bog'lanish:</b>\n\n` +
                `Issiq tandir nonlariga hoziroq qo'ng'iroq qilib buyurtma berishingiz mumkin:\n\n` +
                `📞 <b>+998 98 000 94 54</b>\n` +
                `📞 <b>+998 90 901 92 92</b>\n\n` +
                `⏰ <b>Buyurtma qabul vaqti:</b> 05:00 dan 24:00 gacha\n` +
                `📍 Tezkor kuryer termo-sumkada issiq yetkazadi!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🌐 Sayt orqali buyurtma berish', web_app: { url: SITE_URL } }
              ]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Web App Data (agar mijoz eski klaviatura orqali yuborsa)
      if (msg.web_app_data && msg.web_app_data.data) {
        await callTg('sendMessage', {
          chat_id: chatId,
          text: `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\nOperatorlarimiz tez orada siz bilan bog'lanishadi.\n📞 Qo'shimcha savollar uchun: <b>98 000 94 54</b>`,
          parse_mode: 'HTML'
        });
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Bot handler error:", err);
    return res.status(200).json({ ok: true, error: err.message });
  }
}
