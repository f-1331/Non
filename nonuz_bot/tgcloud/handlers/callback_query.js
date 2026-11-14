import { api } from 'sdk';
import { BAKERY_INFO, PRODUCTS } from '../lib/products.js';
import { isOwner, isSystemActive, setSystemActive, getSystemStats } from '../lib/system.js';

export default async function (callbackQuery, ctx) {
  const queryId = callbackQuery.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const owner = await isOwner(callbackQuery.from);
  const active = await isSystemActive();

  await api.answerCallbackQuery({ callback_query_id: queryId });
  if (!chatId || !messageId) return;

  // 1. Owner Admin harakatlari
  if (data === 'admin_toggle_off' && owner) {
    await setSystemActive(false);
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: 
`🔴 <b>Tizim to'xtatildi!</b>

• Saytda profilaktika rejimi yoqildi
• Bot oddiy mijozlarga buyurtma qabul qilmaydi
• Menyu tugmasi vaqtincha olib tashlandi

Qayta ishga tushirish uchun quyidagi tugmani bosing:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🟢 Tizimni qayta ishga tushirish (1 bosishda)", callback_data: "admin_toggle_on" }
          ],
          [
            { text: "📦 So'nggi buyurtmalar", callback_data: "admin_view_stats" },
            { text: "🎛 Panelga qaytish", callback_data: "admin_panel" }
          ]
        ]
      }
    });
    return;
  }

  if (data === 'admin_toggle_on' && owner) {
    await setSystemActive(true);
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: 
`🟢 <b>Tizim muvaffaqiyatli ishga tushirildi!</b>

• Sayt to'liq faol holatga qaytdi
• Bot barcha mijozlarga ochiq
• Non Menyusi tugmasi faollashtirildi

Tizim yana odatiy rejimda ishlamoqda:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔴 Tizimni to'xtatish (Sayt & Bot)", callback_data: "admin_toggle_off" }
          ],
          [
            { text: "📦 So'nggi buyurtmalar", callback_data: "admin_view_stats" },
            { text: "🍞 Mijoz menyusi", callback_data: "admin_client_menu" }
          ],
          [
            { text: "🌐 Saytni ochish", web_app: { url: BAKERY_INFO.webAppUrl } }
          ]
        ]
      }
    });
    return;
  }

  if (data === 'admin_view_stats' && owner) {
    const stats = await getSystemStats();
    let ordersText = "Hozircha buyurtmalar yo'q.";
    if (stats.recentOrders && stats.recentOrders.length > 0) {
      ordersText = stats.recentOrders.map(o => {
        const time = o.createdAt ? new Date(o.createdAt * 1000).toLocaleString('uz-UZ') : '';
        return `• <b>#${o.id}</b> | ${o.name} (${o.phone}) — <b>${(o.totalPrice || 0).toLocaleString('uz-UZ')} so'm</b>\n  <i>${time}</i>`;
      }).join('\n\n');
    }

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: 
`📊 <b>Buyurtmalar Statistikasi</b>

📦 <b>Jami buyurtmalar:</b> ${stats.count} ta
⚙️ <b>Holat:</b> ${active ? '🟢 Faol' : '🔴 To\'xtatilgan'}

<b>So'nggi buyurtmalar:</b>
${ordersText}`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: active ? "🔴 Tizimni to'xtatish" : "🟢 Tizimni yoqish", callback_data: active ? "admin_toggle_off" : "admin_toggle_on" }
          ],
          [
            { text: "⬅️ Boshqaruv paneliga qaytish", callback_data: "admin_panel" }
          ]
        ]
      }
    });
    return;
  }

  if (data === 'admin_panel' && owner) {
    const stats = await getSystemStats();
    const panelText = 
`🎛 <b>Boshqaruv Paneli</b>

📊 <b>Tizim holati:</b> ${active ? '🟢 FAOL (Ishlamoqda)' : '🔴 TO\'XTATILGAN (Profilaktika)'}
🌐 <b>Sayt:</b> ${BAKERY_INFO.webAppUrl}
🤖 <b>Bot holati:</b> ${active ? '🟢 Buyurtmalar qabul qilinmoqda' : '🔴 Buyurtmalar to\'xtatilgan'}
📦 <b>Jami buyurtmalar:</b> ${stats.count} ta

Kerakli amalni tanlang:`;

    const adminButtons = active ? [
      [
        { text: "🔴 Tizimni to'xtatish (Sayt & Bot)", callback_data: "admin_toggle_off" }
      ],
      [
        { text: "📦 So'nggi buyurtmalar", callback_data: "admin_view_stats" },
        { text: "🍞 Mijoz menyusi", callback_data: "admin_client_menu" }
      ],
      [
        { text: "🌐 Saytni ochish", web_app: { url: BAKERY_INFO.webAppUrl } }
      ]
    ] : [
      [
        { text: "🟢 Tizimni qayta ishga tushirish", callback_data: "admin_toggle_on" }
      ],
      [
        { text: "📦 So'nggi buyurtmalar", callback_data: "admin_view_stats" }
      ],
      [
        { text: "🌐 Saytni ochish (Ko'rik)", web_app: { url: BAKERY_INFO.webAppUrl } }
      ]
    ];

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: panelText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: adminButtons
      }
    });
    return;
  }

  // 2. Agar tizim to'xtatilgan bo'lsa va oddiy mijoz bo'lsa
  if (!owner && !active) {
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: 
`⚠️ <b>Hurmatli mijoz!</b>

Hozirda profilaktika va texnik ishlar sababli buyurtmalar qabuli vaqtincha to'xtatilgan.

Tez orada qayta ishga tushamiz!
📞 Aloqa va ma'lumot uchun: <b>+998 98 000 94 54</b>`,
      parse_mode: 'HTML'
    });
    return;
  }

  // 3. Mahsulot tafsiloti
  if (data.startsWith('prod_')) {
    const key = data.replace('prod_', '');
    const prod = PRODUCTS[key];

    if (prod) {
      const caption = 
`🍞 <b>${prod.name}</b>

📝 ${prod.desc}

💰 <b>Narxi:</b> ${prod.price.toLocaleString('uz-UZ')} so'm
⏰ <b>Ish vaqti:</b> ${BAKERY_INFO.workHoursText}
🛵 <i>Dastavka xizmati orqali issiq holda yetkazib beramiz!</i>`;

      await api.editMessageText({
        chat_id: chatId,
        message_id: messageId,
        text: caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🚀 Veb-ilovada savatga solish", web_app: { url: BAKERY_INFO.webAppUrl } }
            ],
            [
              { text: "📞 Qo'ng'iroq qilib buyurtma berish", callback_data: "call_order" }
            ],
            [
              { text: "⬅️ Menyuga qaytish", callback_data: "back_to_menu" }
            ]
          ]
        }
      });
    }
    return;
  }

  // 4. Menyuga qaytish yoki mijoz menyusi
  if (data === 'back_to_menu' || data === 'admin_client_menu') {
    const menuText = 
`🥖 <b>BIZNING TANDIR NONLARIMIZ:</b>

1. 🥩 <b>Go'shtli non</b> — 20 000 so'm
2. ✨ <b>Qo'qon patir</b> — 9 000 so'm
3. 🌼 <b>Ramashka</b> — 8 000 so'm
4. 🧈 <b>Yog'li non</b> — 5 000 so'm

Kerakli nonni tanlang yoki veb-ilovadan foydalaning:`;

    const backButtons = [
      [
        { text: "🚀 Veb-Ilovani ochish", web_app: { url: BAKERY_INFO.webAppUrl } }
      ],
      [
        { text: "🥩 Go'shtli non (20 000)", callback_data: "prod_goshli" },
        { text: "✨ Qo'qon patir (9 000)", callback_data: "prod_qoqon" }
      ],
      [
        { text: "🌼 Ramashka (8 000)", callback_data: "prod_ramashka" },
        { text: "🧈 Yog'li non (5 000)", callback_data: "prod_yogli" }
      ],
      [
        { text: "📞 Dastavka raqamlari", callback_data: "call_order" }
      ]
    ];

    if (owner) {
      backButtons.push([{ text: "🎛 Boshqaruv paneliga qaytish", callback_data: "admin_panel" }]);
    }

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: menuText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: backButtons
      }
    });
    return;
  }

  // 5. Qo'ng'iroq qilish / dastavka
  if (data === 'call_order') {
    const contactText = 
`🛵 <b>DASTAVKA VA BUYURTMA UCHUN:</b>

Telefon orqali tezkor buyurtma bering:
📞 <b>+998 98 000 94 54</b>
📞 <b>+998 90 901 92 92</b>

⏰ <b>Ish vaqti:</b> 05:00 dan 24:00 gacha
Termo-sumkada issiq yetkaziladi!`;

    const callButtons = [
      [
        { text: "🚀 Veb-Ilova orqali buyurtma", web_app: { url: BAKERY_INFO.webAppUrl } }
      ],
      [
        { text: "⬅️ Menyuga qaytish", callback_data: "back_to_menu" }
      ]
    ];

    if (owner) {
      callButtons.push([{ text: "🎛 Boshqaruv paneliga qaytish", callback_data: "admin_panel" }]);
    }

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: contactText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: callButtons
      }
    });
    return;
  }
}
