import { db, api, EndpointError } from 'sdk';
import { orders } from '../schema.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  const { customerName, customerPhone, customerAddress, items, totalPrice } = input;

  if (!customerPhone || !items) {
    throw new EndpointError('Telefon raqam va mahsulotlar kiritilishi shart', { code: 'INVALID_INPUT' });
  }

  // Bazaga yozish
  let orderId = null;
  try {
    const inserted = await db.insert(orders).values({
      userId: user?.id || null,
      name: customerName || user?.first_name || 'Mijoz',
      phone: customerPhone,
      address: customerAddress || '',
      items: typeof items === 'string' ? items : JSON.stringify(items),
      totalPrice: Number(totalPrice) || 0,
    }).run();
    orderId = inserted.lastInsertRowid;
  } catch (err) {
    console.error('DB insert error:', err);
  }

  // Agar Telegram foydalanuvchisi bo'lsa, unga xabar yuborish
  if (user?.id) {
    const itemsList = Object.values(items || {})
      .map(i => `• ${i.name} — ${i.qty} dona (${(i.price * i.qty).toLocaleString('uz-UZ')} so'm)`)
      .join('\n');

    try {
      await api.sendMessage({
        chat_id: user.id,
        text: 
`✅ <b>BUYURTMA QABUL QILINDI!</b>

👤 <b>Mijoz:</b> ${customerName || user.first_name}
📞 <b>Telefon:</b> ${customerPhone}
📍 <b>Manzil:</b> ${customerAddress || 'Kiritilmagan'}

📋 <b>Buyurtma tarkibi:</b>
${itemsList}

💰 <b>Jami summa:</b> ${Number(totalPrice).toLocaleString('uz-UZ')} so'm
🛵 <i>Kuryerimiz buyurtmangizni issiq holatda yetkazib beradi!</i>
Savollar bo'lsa: <b>98 000 94 54</b>`,
        parse_mode: 'HTML'
      });
    } catch (e) {
      console.error('Failed to send confirmation to user:', e);
    }
  }

  return { success: true, orderId };
}
