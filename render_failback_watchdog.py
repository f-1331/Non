import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import time
from pathlib import Path
import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s : %(message)s"
)
logger = logging.getLogger("ha_failover_watchdog")

BASE_DIR = Path(__file__).resolve().parent
RENDER_URL = os.getenv("RENDER_SERVICE_URL", "https://non-sayti.onrender.com").rstrip("/")
RENDER_HEALTH_URL = f"{RENDER_URL}/health"
LOCAL_PORT = int(os.getenv("PORT", 3002))
LOCAL_HEALTH_URL = f"http://127.0.0.1:{LOCAL_PORT}/health"
OWNER_TELEGRAM_ID = 6707839718
BOT_TOKEN = "8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo"
CHECK_INTERVAL_SECONDS = 90  # Har 90 soniyada tekshirish
STATE_FILE = BASE_DIR / "failover_state.json"


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "current_target": "UNKNOWN",
        "render_fail_count": 0,
        "render_success_count": 0,
        "last_switch_time": None
    }


def save_state(state: dict):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        logger.warning(f"Holatni saqlab bo'lmadi: {e}")


def get_current_vercel_target() -> str:
    vercel_path = BASE_DIR / "vercel.json"
    if not vercel_path.exists():
        return "UNKNOWN"
    try:
        with open(vercel_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "onrender.com" in content:
            return "RENDER"
        elif "trycloudflare.com" in content:
            return "TUNNEL"
    except Exception:
        pass
    return "UNKNOWN"


def get_active_tunnel_url() -> str:
    tunnel_file = BASE_DIR / "tunnel_url.txt"
    if tunnel_file.exists():
        try:
            with open(tunnel_file, "r", encoding="utf-8") as f:
                url = f.read().strip()
                if url.startswith("https://") and "trycloudflare.com" in url:
                    return url
        except Exception:
            pass
    return ""


def update_vercel_route(new_target_url: str, target_name: str) -> bool:
    vercel_path = BASE_DIR / "vercel.json"
    if not vercel_path.exists():
        logger.error("vercel.json topilmadi!")
        return False

    try:
        with open(vercel_path, "r", encoding="utf-8") as f:
            content = f.read()

        old_pattern = r'https://[a-zA-Z0-9\.\-]+\.(?:onrender\.com|trycloudflare\.com)'
        new_content = re.sub(old_pattern, new_target_url, content)

        if new_content == content:
            logger.info(f"vercel.json allaqachon {new_target_url} ga ulangan.")
            return True

        with open(vercel_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        logger.info(f"vercel.json yangilandi -> {new_target_url}")

        subprocess.run(["git", "add", "vercel.json"], cwd=str(BASE_DIR), check=True)
        subprocess.run(["git", "commit", "-m", f"chore(ha-failover): auto-route to {target_name} ({new_target_url})"], cwd=str(BASE_DIR), check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=str(BASE_DIR), check=True)
        logger.info(f"✅ GitHub va Vercel yo'nalishi muvaffaqiyatli o'zgartirildi -> {target_name}")
        return True
    except Exception as e:
        logger.error(f"vercel.json yangilash va git push qilishda xatolik: {e}")
        return False


async def notify_owner_telegram(message_html: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": OWNER_TELEGRAM_ID,
                "text": message_html,
                "parse_mode": "HTML"
            }
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info("Telegram orqali egasiga ogohlantirish xabari yuborildi.")
            else:
                logger.warning(f"Telegram API javobi: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.warning(f"Telegramga xabar jo'natishda xatolik: {e}")


async def check_render_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(RENDER_HEALTH_URL)
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    if data.get("status") in ("healthy", "ok"):
                        return True
                except Exception:
                    return True
    except Exception:
        pass
    return False


async def check_local_server_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(LOCAL_HEALTH_URL)
            if resp.status_code == 200:
                return True
    except Exception:
        pass
    return False


async def run_ha_watchdog():
    logger.info("="*65)
    logger.info("🔄 Tandir Non: Bi-directional HA Failover Watchdog Ishga Tushdi")
    logger.info(f"   Asosiy (Render):   {RENDER_HEALTH_URL}")
    logger.info(f"   Zaxira (Lokal):    {LOCAL_HEALTH_URL}")
    logger.info(f"   Tekshiruv oralig'i: Har {CHECK_INTERVAL_SECONDS}s")
    logger.info("="*65)

    state = load_state()

    while True:
        try:
            current_target = get_current_vercel_target()
            render_alive = await check_render_health()

            if render_alive:
                state["render_success_count"] += 1
                state["render_fail_count"] = 0
                logger.info(f"[HEALTH] Render: UP (ketma-ket: {state['render_success_count']}) | Hozirgi nishon: {current_target}")

                # 2-YO'NALISH (Failback): Render yana ishga tushganda (2 marta muvaffaqiyatli bo'lsa)
                if current_target == "TUNNEL" and state["render_success_count"] >= 2:
                    logger.info("🎉 RENDER TIKLANDI! Asosiy bulut serveriga qaytarilmoqda...")
                    success = update_vercel_route(RENDER_URL, "RENDER")
                    if success:
                        state["current_target"] = "RENDER"
                        state["last_switch_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                        save_state(state)
                        msg = (
                            "🎉 <b>Render limiti yangilandi va server to'liq tiklandi!</b>\n\n"
                            f"Vercel sayti avtomatik ravishda asosiy <b>Render bulut serveriga</b> (<code>{RENDER_URL}</code>) qaytarildi.\n"
                            "Barcha xizmatlar yana to'liq bulutda uzluksiz ishlamoqda!"
                        )
                        await notify_owner_telegram(msg)
            else:
                state["render_fail_count"] += 1
                state["render_success_count"] = 0
                logger.warning(f"[HEALTH] Render: DOWN (ketma-ket xato: {state['render_fail_count']}) | Hozirgi nishon: {current_target}")

                # 1-YO'NALISH (Failover): Render 2 marta ketma-ket xato berganda (limit tugagan yoki 503)
                if current_target == "RENDER" and state["render_fail_count"] >= 2:
                    logger.warning("🚨 RENDER LIMITI TUGADI YOKI TO'XTADI! Zaxira tunneliga o'tkazilmoqda...")
                    tunnel_url = get_active_tunnel_url()
                    local_alive = await check_local_server_health()

                    if tunnel_url and local_alive:
                        success = update_vercel_route(tunnel_url, "TUNNEL")
                        if success:
                            state["current_target"] = "TUNNEL"
                            state["last_switch_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                            save_state(state)
                            msg = (
                                "⚠️ <b>Render limiti tugadi yoki server to'xtab qoldi!</b>\n\n"
                                "Tizim uzilishsiz ishlashi uchun Vercel avtomatik ravishda <b>Zaxira (Cloudflare Tunnel)</b> serveriga ulandi.\n"
                                f"🌐 Jonli zaxira manzili: <code>{tunnel_url}</code>\n"
                                "✅ Tandir Non sayti va Telegram bot 100% uzilishsiz ishlamoqda!"
                            )
                            await notify_owner_telegram(msg)
                    else:
                        logger.error(f"Failover qilib bo'lmadi: local_alive={local_alive}, tunnel_url={tunnel_url}")

            save_state(state)

        except Exception as e:
            logger.error(f"HA watchdog kutilmagan xatolik: {e}", exc_info=True)

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        asyncio.run(run_ha_watchdog())
    except KeyboardInterrupt:
        logger.info("Watchdog foydalanuvchi tomonidan to'xtatildi.")
