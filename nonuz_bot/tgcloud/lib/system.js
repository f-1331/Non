import { api } from 'sdk';

const OWNER_USERNAME = 'fayzbek1331';
const OWNER_ID = 6707839718;

export async function isOwner(from) {
  if (!from) return false;
  if (from.id && (Number(from.id) === OWNER_ID || String(from.id) === String(OWNER_ID))) {
    return true;
  }
  if (from.username && from.username.toLowerCase() === OWNER_USERNAME) {
    return true;
  }
  return false;
}

export async function isSystemActive() {
  try {
    const res = await api.getMyShortDescription();
    const desc = res?.short_description || '';
    if (desc.startsWith('[OFF]')) {
      return false;
    }
  } catch (e) {
    // Xatolik bo'lsa sukut bo'yicha faol
  }
  return true;
}

export async function setSystemActive(active) {
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
    console.error('setSystemActive xatolik:', err);
  }
}

export async function getSystemStats() {
  return { count: 0, recentOrders: [] };
}
