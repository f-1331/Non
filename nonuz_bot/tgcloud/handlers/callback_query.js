import { api } from 'sdk';
import { BAKERY_INFO, PRODUCTS } from '../lib/products.js';

export default async function (callbackQuery, ctx) {
  const queryId = callbackQuery.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  await api.answerCallbackQuery({ callback_query_id: queryId });

  if (!chatId || !messageId) return;

  // Mahsulot tafsiloti
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

  // Menyuga qaytish
  if (data === 'back_to_menu') {
    const menuText = 
`🥖 <b>BIZNING TANDIR NONLARIMIZ:</b>

1. 🥩 <b>Go'shtli non</b> — 20 000 so'm
2. ✨ <b>Qo'qon patir</b> — 9 000 so'm
3. 🌼 <b>Ramashka</b> — 8 000 so'm
4. 🧈 <b>Yog'li non</b> — 5 000 so'm

Kerakli nonni tanlang yoki veb-ilovadan foydalaning:`;

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: menuText,
      parse_mode: 'HTML',
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

  // Qo'ng'iroq qilish / dastavka
  if (data === 'call_order') {
    const contactText = 
`🛵 <b>DASTAVKA VA BUYURTMA UCHUN:</b>

Telefon orqali tezkor buyurtma bering:
📞 <b>+998 98 000 94 54</b>
📞 <b>+998 90 901 92 92</b>

⏰ <b>Ish vaqti:</b> 05:00 dan 20:00 gacha
Termo-sumkada issiq yetkaziladi!`;

    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: contactText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 Veb-Ilova orqali buyurtma", web_app: { url: BAKERY_INFO.webAppUrl } }
          ],
          [
            { text: "⬅️ Menyuga qaytish", callback_data: "back_to_menu" }
          ]
        ]
      }
    });
    return;
  }
}
