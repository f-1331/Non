export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Faqat POST so\'rov qabul qilinadi' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN || '8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo';
  const OWNER_CHAT_ID = '6707839718';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { customerName, customerPhone, customerAddress, notes, items, totalPrice, time, user } = body;

    if (!customerPhone || !items) {
      return res.status(400).json({ success: false, error: 'Telefon raqam yoki mahsulotlar kiritilmagan' });
    }

    // 1. Tizim holatini tekshirish
    try {
      const descRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMyShortDescription`);
      const descData = await descRes.json();
      const shortDesc = descData?.result?.short_description || '';
      const isMaintenance = shortDesc.startsWith('[OFF]');

      const isOwner = (user && (String(user.id) === OWNER_CHAT_ID || (user.username && user.username.toLowerCase() === 'fayzbek1331')));

      if (isMaintenance && !isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Hozirda buyurtmalar qabul qilinmayapti (profilaktika rejimi yoqilgan).'
        });
      }
    } catch (e) {
      // Tekshiruvda xatolik bo'lsa buyurtma qabul qilinadi
    }

    const orderId = 'TN-' + Math.floor(100000 + Math.random() * 900000);
    const cleanPhone = (customerPhone || '').replace(/[^\d+]/g, '');

    let itemsFormatted = '';
    if (typeof items === 'object') {
      Object.values(items).forEach(it => {
        const qty = it.qty || it.count || 1;
        const subtotal = (it.price || 0) * qty;
        itemsFormatted += `▫️ <b>${escapeHtml(it.name)}</b> x ${qty} = ${subtotal.toLocaleString('uz-UZ')} so'm\n`;
      });
    }

    const orderTime = time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    // 2. Egaga (Owner) xabar yuborish
    const ownerMsg = `🥖 <b>YANGI BUYURTMA! #${orderId}</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> ${escapeHtml(customerName || 'Mijoz')}
📞 <b>Telefon:</b> <a href="tel:${cleanPhone}">${escapeHtml(customerPhone)}</a>
📍 <b>Manzil:</b> ${escapeHtml(customerAddress || 'Kiritilmagan')}
${notes ? `📝 <b>Izoh:</b> ${escapeHtml(notes)}\n` : ''}
🛒 <b>Buyurtma tarkibi:</b>
${itemsFormatted || 'Mahsulotlar mavjud emas'}
━━━━━━━━━━━━━━━━━━━━━━
💰 <b>Jami summa:</b> ${Number(totalPrice || 0).toLocaleString('uz-UZ')} so'm
🛵 <b>Yetkazib berish:</b> Tezkor kuryer
⏰ <b>Vaqt:</b> ${escapeHtml(orderTime)}`;

    const ownerKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Qabul qilish', callback_data: `order_accept_${orderId}` },
          { text: '❌ Bekor qilish', callback_data: `order_cancel_${orderId}` }
        ]
      ]
    };

    if (cleanPhone) {
      ownerKeyboard.inline_keyboard.push([
        { text: `📞 Mijozga qo'ng'iroq (${cleanPhone})`, url: `tel:${cleanPhone}` }
      ]);
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: OWNER_CHAT_ID,
        text: ownerMsg,
        parse_mode: 'HTML',
        reply_markup: ownerKeyboard
      })
    });

    // 3. Agar mijoz Telegram orqali kirgan bo'lsa, mijozning o'ziga tasdiq xabari jo'natish
    if (user && user.id && String(user.id) !== OWNER_CHAT_ID) {
      const customerMsg = `✅ <b>Assalomu alaykum, ${escapeHtml(customerName || user.first_name || 'Hurmatli mijoz')}!</b>

Sizning buyurtmangiz muvaffaqiyatli qabul qilindi!
📦 <b>Buyurtma kodi:</b> #${orderId}
💰 <b>Jami summa:</b> ${Number(totalPrice || 0).toLocaleString('uz-UZ')} so'm

Kuryerimiz tez orada nonlarni issiq yetkazib berish uchun siz bilan bog'lanadi.
📞 <b>Operator aloqa:</b> +998 98 000 94 54`;

      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.id,
            text: customerMsg,
            parse_mode: 'HTML'
          })
        });
      } catch (tgErr) {
        console.error("Mijozga xabar yuborishda xatolik:", tgErr);
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderId,
      message: 'Buyurtmangiz muvaffaqiyatli qabul qilindi!'
    });

  } catch (err) {
    console.error("Order handler error:", err);
    return res.status(500).json({
      success: false,
      error: 'Buyurtmani qayta ishlashda xatolik: ' + err.message
    });
  }
}
