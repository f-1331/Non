import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from aiohttp import web

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s : %(message)s"
)
logger = logging.getLogger("unified_server")

BASE_DIR = Path(__file__).resolve().parent
LOCAL_PORT = int(os.getenv("PORT", 3002))

def start_cloudflared_tunnel():
    """Cloudflare tunnelni ishga tushirish va trycloudflare.com URL manzilini olish."""
    from tunnel_runner import get_quick_tunnel
    return get_quick_tunnel(LOCAL_PORT)


def update_vercel_json_and_push(tunnel_url: str):
    """vercel.json faylidagi marshrutlarni faol tunnelga yo'naltirish va GitHub'ga yuklash."""
    vercel_path = BASE_DIR / "vercel.json"
    if not vercel_path.exists():
        logger.warning("vercel.json fayli topilmadi, o'tkazib yuborildi.")
        return

    try:
        with open(vercel_path, "r", encoding="utf-8") as f:
            content = f.read()

        old_pattern = r'https://[a-zA-Z0-9\.\-]+\.(?:onrender\.com|trycloudflare\.com)'
        new_content = re.sub(old_pattern, tunnel_url, content)

        if new_content != content:
            with open(vercel_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            logger.info("vercel.json yangi tunnel URL bilan yangilandi.")

            subprocess.run(["git", "add", "vercel.json"], cwd=str(BASE_DIR), check=True)
            subprocess.run(["git", "commit", "-m", f"chore(ha-tunnel): route traffic to {tunnel_url}"], cwd=str(BASE_DIR), check=True)
            subprocess.run(["git", "push", "origin", "main"], cwd=str(BASE_DIR), check=True)
            logger.info("✅ Yangi tunnel manzili GitHub va Vercel'ga muvaffaqiyatli yuklandi!")
        else:
            logger.info("vercel.json allaqachon so'nggi holatda.")
    except Exception as e:
        logger.warning(f"vercel.json avtomatik yangilashda xatolik: {e}")


async def monitor_tunnel(cf_proc):
    """Cloudflare tunnel xabarlarini o'qib turish."""
    while True:
        try:
            line = await asyncio.to_thread(cf_proc.stdout.readline)
            if not line:
                break
        except Exception:
            break


# ==================== HTTP ENDPOINTLAR ====================
async def handle_health(request):
    return web.json_response({
        "status": "healthy",
        "service": "tandir-non",
        "mode": "high-availability-failover",
        "port": LOCAL_PORT,
        "timestamp": int(time.time())
    })

async def handle_api_status(request):
    return web.json_response({
        "active": True,
        "maintenance": False,
        "mode": "tunnel-failover",
        "timestamp": int(time.time() * 1000)
    })

async def handle_index(request):
    index_file = BASE_DIR / "index.html"
    if index_file.exists():
        return web.FileResponse(index_file)
    return web.Response(text="Tandir Non Server Active")

async def handle_app_js(request):
    app_file = BASE_DIR / "app.js"
    if app_file.exists():
        return web.FileResponse(app_file)
    return web.Response(status=404)


def create_web_app():
    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_get("/api/health", handle_health)
    app.router.add_get("/api/status", handle_api_status)
    app.router.add_get("/", handle_index)
    app.router.add_get("/index.html", handle_index)
    app.router.add_get("/app.js", handle_app_js)
    
    images_dir = BASE_DIR / "images"
    if images_dir.exists():
        app.router.add_static("/images/", path=str(images_dir), name="images")

    return app


async def start_telegram_bot():
    """Telegram botni parallel polling rejimida ishga tushirish."""
    try:
        from telegram_bot import dp, Bot, BOT_TOKEN
        bot = Bot(token=BOT_TOKEN)
        logger.info("🤖 Telegram Bot (Tandir Non) polling ishga tushirildi...")
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Telegram botni ishga tushirishda xatolik: {e}")


async def main_unified():
    cf_proc, tunnel_url = start_cloudflared_tunnel()
    if not tunnel_url:
        logger.error("Cloudflare tunnel yaratib bo'lmadi!")
        sys.exit(1)

    logger.info(f"🌐 Zaxira Tunnel Manzili: {tunnel_url}")
    update_vercel_json_and_push(tunnel_url)

    tunnel_task = asyncio.create_task(monitor_tunnel(cf_proc))

    # Web server
    web_app = create_web_app()
    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", LOCAL_PORT)
    await site.start()
    logger.info(f"🚀 Mahalliy HTTP server ishga tushdi: http://127.0.0.1:{LOCAL_PORT}")

    # Telegram bot task
    bot_task = asyncio.create_task(start_telegram_bot())

    try:
        await asyncio.gather(tunnel_task, bot_task)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Barcha xizmatlar to'xtatilmoqda...")
    finally:
        if cf_proc and cf_proc.poll() is None:
            cf_proc.terminate()
        await runner.cleanup()
        logger.info("Server to'xtatildi.")


if __name__ == "__main__":
    try:
        asyncio.run(main_unified())
    except KeyboardInterrupt:
        logger.info("Foydalanuvchi tomonidan to'xtatildi.")
