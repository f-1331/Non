export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const BOT_TOKEN = process.env.BOT_TOKEN || '8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo';

  // POST: Tizim holatini o'zgartirish (Owner uchun)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { action, username, userId, secret } = body;
      const isOwner = (username && username.toLowerCase() === 'fayzbek1331') || String(userId) === '6707839718' || secret === 'fayzbek1331_key';

      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });
      }

      const turnOn = action === 'enable' || action === 'on';
      const shortDesc = turnOn
        ? 'Tandir Non — Issiq va mazali nonlar. Sayt: https://non-uzb.vercel.app'
        : '[OFF] Tandir Non vaqtincha buyurtma qabul qilmayapti.';

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: shortDesc })
      });

      if (turnOn) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text: '🍞 Non Menyusi',
              web_app: { url: 'https://non-uzb.vercel.app' }
            }
          })
        });
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: { type: 'default' }
          })
        });
      }

      return res.status(200).json({ success: true, active: turnOn });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET: Tizim holatini tekshirish
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMyShortDescription`);
    const data = await tgRes.json();
    const shortDesc = data?.result?.short_description || '';
    const isMaintenance = shortDesc.startsWith('[OFF]');

    return res.status(200).json({
      active: !isMaintenance,
      maintenance: isMaintenance,
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(200).json({
      active: true,
      maintenance: false,
      error: err.message
    });
  }
}
