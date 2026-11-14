import { db, api } from 'sdk';
import { eq, desc } from 'sdk/db';
import { settings, orders } from '../schema.js';

const OWNER_USERNAME = 'fayzbek1331';

export async function isOwner(from) {
  if (!from) return false;
  if (from.username && from.username.toLowerCase() === OWNER_USERNAME) {
    try {
      await saveSetting('owner_user_id', String(from.id));
    } catch (e) {}
    return true;
  }
  try {
    const ownerIdSetting = await getSetting('owner_user_id');
    if (ownerIdSetting && String(from.id) === String(ownerIdSetting)) {
      return true;
    }
  } catch (e) {}
  return false;
}

export async function getSetting(key) {
  try {
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    return row ? row.value : null;
  } catch (e) {
    return null;
  }
}

export async function saveSetting(key, value) {
  try {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
    if (existing) {
      await db.update(settings).set({ value: String(value) }).where(eq(settings.key, key)).run();
    } else {
      await db.insert(settings).values({ key, value: String(value) }).run();
    }
  } catch (e) {
    console.error('saveSetting error:', e);
  }
}

export async function isSystemActive() {
  const val = await getSetting('system_active');
  return val !== '0';
}

export async function setSystemActive(active) {
  await saveSetting('system_active', active ? '1' : '0');

  try {
    if (active) {
      await api.setMyShortDescription({
        short_description: 'Tandir Non — Issiq va mazali nonlar. Sayt: https://non-uzb.vercel.app'
      });
      await api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '🍞 Non Menyusi',
          web_app: { url: 'https://non-uzb.vercel.app' }
        }
      });
    } else {
      await api.setMyShortDescription({
        short_description: '[OFF] Tandir Non vaqtincha buyurtma qabul qilmayapti.'
      });
      await api.setChatMenuButton({
        menu_button: {
          type: 'default'
        }
      });
    }
  } catch (err) {
    console.error('Sync bot error:', err);
  }
}

export async function getSystemStats() {
  let count = 0;
  let recentOrders = [];
  try {
    count = await db.$count(orders);
    recentOrders = await db.select().from(orders).orderBy(desc(orders.id)).limit(5).all();
  } catch (e) {}
  return { count, recentOrders };
}
