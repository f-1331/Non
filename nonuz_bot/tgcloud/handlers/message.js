import { api } from 'sdk';
import { BAKERY_INFO, PRODUCTS } from '../lib/products.js';

export default async function (message, ctx) {
  const chatId = message.chat.id;
  const text = message.text ? message.text.trim() : '';

  // 1. Mini App orqali yuborilgan buyurtma (WebAppData)
  if (message.web_app_data) {
    try {
      const order = JSON.parse(message.web_app_data.data);
      const itemsList = Object.values(order.items || {})
        .map(i => `• ${i.name} — ${i.qty} dona (${(i.price * i.qty).toLocaleString('uz-UZ')} so'm)`)
        .join('\n');

      const receipt = 
`✅ <b>BUYURTMA QABUL QILINDI!</b>

👤 <b>Mijoz:</b> ${order.customerName || 'Mijoz'}
📞 <b>Telefon:</b> ${order.customerPhone || 'Kiritilmagan'}
📍 <b>Manzil:</b> ${order.customerAddress || 'Kiritilmagan'}

📋 <b>Mahsulotlar:</b>
${itemsList}

💰 <b>Jami summa:</b> ${Number(order.totalPrice || 0).toLocaleString('uz-UZ')} so'm
⏰ <b>Vaqt:</b> ${order.time || 'Hozir'}

🛵 <i>Kuryerimiz buyurtmangizni issiq holatda yetkazib beradi!</i>
Savollar bo'lsa: <b>98 000 94 54</b>`;

      await api.sendMessage({
        chat_id: chatId,
        text: receipt,
        parse_mode: 'HTML'
      });
      return;
    } catch (e) {
      console.error('WebAppData parsing error:', e);
    }
  }

  // 2. /start yoki /help buyrug'i
  if (text.startsWith('/start') || text === '/help') {
    const welcome = 
`Assalomu alaykum, <b>${message.from?.first_name || 'Hurmatli mijoz'}</b>! 🍞

🔥 <b>Tandir Non</b> rasmiy botiga xush kelibsiz!

Bizda har kuni erta tongdan tandirdan uzilgan eng sara issiq nonlar tayyorlanadi:
• 🥩 <b>Go'shtli non</b> — 20 000 so'm
• ✨ <b>Qo'qon patir</b> — 9 000 so'm
• 🌼 <b>Ramashka</b> — 8 000 so'm
• 🧈 <b>Yog'li non</b> — 5 000 so'm

⏰ <b>Ish vaqti:</b> 05:00 dan 24:00 gacha (Har kuni)
🛵 <b>Dastavka:</b> Termo-sumkada tez va issiq yetkaziladi!

Quyidagi tugmalar orqali buyurtma berishingiz mumkin 👇`;

    await api.sendMessage({
      chat_id: chatId,
      text: welcome,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [
            { text: "🍞 Nonlarimiz (Menyu)" },
            { text: "🛵 Dastavka buyurtma berish" }
          ],
          [
            { text: "⏰ Ish vaqti" },
            { text: "📞 Bog'lanish" }
          ],
          [
            { text: "🌐 Veb-Ilova (Non Savati)", web_app: { url: BAKERY_INFO.webAppUrl } }
          ]
        ],
        resize_keyboard: true
      }
    });

    await api.sendMessage({
      chat_id: chatId,
      text: "Tanlang yoki Veb-ilovamiz orqali savatga to'plang:",
      reply_markup: {
        inline_keyboard: [
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
        ]
      }
    });
    return;
  }

  // 3. Menyu so'ralganda
  if (text === "🍞 Nonlarimiz (Menyu)" || text.startsWith('/menu')) {
    const menuText = 
`🥖 <b>BIZNING TANDIR NONLARIMIZ:</b>

1. 🥩 <b>Go'shtli non</b> — 20 000 so'm
<i>Mayin mol go'shti, xushbo'y piyoz va ziravorlar bilan to'ldirilgan issiq non.</i>

2. ✨ <b>Qo'qon patir</b> — 9 000 so'm
<i>Shohona naqshli, qarsildoq chetli, uzoq vaqt yangi saqlanuvchi patir.</i>

3. 🌼 <b>Ramashka non</b> — 8 000 so'm
<i>Moychechak guli shaklida nafis pishirilgan yumshoq non.</i>

4. 🧈 <b>Yog'li non</b> — 5 000 so'm
<i>Saryog'li qat-qat xamir, sedana sepilgan mazali nonushta noni.</i>

Buyurtma berish uchun quyidagi tugmalardan birini bosing:`;

    await api.sendMessage({
      chat_id: chatId,
      text: menuText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 Veb-Ilovada xarid qilish", web_app: { url: BAKERY_INFO.webAppUrl } }
          ],
          [
            { text: "🥩 Go'shtli non", callback_data: "prod_goshli" },
            { text: "✨ Qo'qon patir", callback_data: "prod_qoqon" }
          ],
          [
            { text: "🌼 Ramashka", callback_data: "prod_ramashka" },
            { text: "🧈 Yog'li non", callback_data: "prod_yogli" }
          ],
          [
            { text: "📞 Qo'ng'iroq qilib zakaz berish", callback_data: "call_order" }
          ]
        ]
      }
    });
    return;
  }

  // 4. Ish vaqti
  if (text === "⏰ Ish vaqti" || text.startsWith('/hours')) {
    const workText = 
`⏰ <b>TANDIR NON ISH VAQTI JADVALI:</b>

🌅 <b>Ish boshlanishi:</b> Ertalab 05:00 da
🌆 <b>Ish tugashi:</b> Kechasi 24:00 da (Yarim tun)
📅 <b>Ish kunlari:</b> Har kuni (Dam olishsiz)

🔥 <i>Har kuni erta tong soat 05:00 dan tandirdan birinchi issiq nonlar uziladi!</i>

Dastavka xizmati ham 05:00 dan 24:00 gacha uzluksiz ishlaydi.`;

    await api.sendMessage({
      chat_id: chatId,
      text: workText,
      parse_mode: 'HTML'
    });
    return;
  }

  // 5. Aloqa va dastavka
  if (text === "📞 Bog'lanish" || text === "🛵 Dastavka buyurtma berish" || text.startsWith('/contact')) {
    const contactText = 
`🛵 <b>DASTAVKA VA BUYURTMA UCHUN:</b>

Issiq tandir nonlariga hoziroq qo'ng'iroq qilib buyurtma berishingiz mumkin:

📞 <b>+998 98 000 94 54</b>
📞 <b>+998 90 901 92 92</b>

⏰ <b>Qo'ng'iroqlarni qabul qilish:</b> 05:00 dan 24:00 gacha
📍 Buyurtmangiz termo-sumkada issiq holatda yetkaziladi!`;

    await api.sendMessage({
      chat_id: chatId,
      text: contactText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 Veb-Ilova orqali buyurtma", web_app: { url: BAKERY_INFO.webAppUrl } }
          ]
        ]
      }
    });
    return;
  }

  // Standart javob
  await api.sendMessage({
    chat_id: chatId,
    text: "Quyidagi tugmalardan birini tanlang yoki menyuni oching:",
    reply_markup: {
      keyboard: [
        [
          { text: "🍞 Nonlarimiz (Menyu)" },
          { text: "🛵 Dastavka buyurtma berish" }
        ],
        [
          { text: "⏰ Ish vaqti" },
          { text: "📞 Bog'lanish" }
        ],
        [
          { text: "🌐 Veb-Ilova (Non Savati)", web_app: { url: BAKERY_INFO.webAppUrl } }
        ]
      ],
      resize_keyboard: true
    }
  });
}
