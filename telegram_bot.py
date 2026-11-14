"""
Tandir Non - Rasmiy Telegram Boti
aiogram 3.x asosida tayyorlangan.

Ishga tushirish uchun:
1. Terminalda ishga tushiring: python telegram_bot.py
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message, 
    CallbackQuery, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    ReplyKeyboardMarkup, 
    KeyboardButton,
    WebAppInfo,
    MenuButtonWebApp,
    MenuButtonDefault
)

# ==================== SOZLAMALAR ====================
BOT_TOKEN = "8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo"
OWNER_USERNAME = "fayzbek1331"

WORK_HOURS = "05:00 - 24:00 (Har kuni dam olishsiz)"
PHONES = ["+998 98 000 94 54", "+998 90 901 92 92"]
SITE_URL = "https://non-uzb.vercel.app"

PRODUCTS = {
    "goshli": {
        "name": "Go'shtli non",
        "price": 20000,
        "desc": "Tandirda pishirilgan mayin mol go'shti, piyoz va xushbo'y ziravorlar bilan to'ldirilgan issiq non."
    },
    "qoqon": {
        "name": "Qo'qon patir",
        "price": 9000,
        "desc": "Mashhur Qo'qoncha uslubdagi chiroyli naqshli, qarsildoq chetli shohona patir."
    },
    "ramashka": {
        "name": "Ramashka non",
        "price": 8000,
        "desc": "Moychechak gul barglari shaklidagi juda yumshoq va nafis dasturxon ko'rki."
    },
    "yogli": {
        "name": "Yog'li non",
        "price": 5000,
        "desc": "Saryog' va qat-qat xamirdan tayyorlangan, sedana sepilgan an'anaviy non."
    }
}

# ==================== YORDAMCHI FUNKSIYALAR ====================
def is_owner(user) -> bool:
    return bool(user and user.username and user.username.lower() == OWNER_USERNAME.lower())

async def get_system_status(bot: Bot) -> bool:
    try:
        desc = await bot.get_my_short_description()
        if desc and desc.short_description and desc.short_description.startswith("[OFF]"):
            return False
    except Exception:
        pass
    return True

async def set_system_status(bot: Bot, active: bool):
    try:
        if active:
            await bot.set_my_short_description(
                short_description="Tandir Non — Issiq va mazali nonlar. Sayt: https://non-uzb.vercel.app"
            )
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="🍞 Non Menyusi",
                    web_app=WebAppInfo(url=SITE_URL)
                )
            )
        else:
            await bot.set_my_short_description(
                short_description="[OFF] Tandir Non vaqtincha buyurtma qabul qilmayapti."
            )
            await bot.set_chat_menu_button(
                menu_button=MenuButtonDefault()
            )
    except Exception as e:
        logging.error(f"Holatni o'zgartirishda xatolik: {e}")

# ==================== TUGMALAR (KEYBOARDS) ====================
def owner_panel_keyboard(active: bool):
    if active:
        buttons = [
            [
                InlineKeyboardButton(text="🔴 Tizimni to'xtatish (Sayt & Bot)", callback_data="admin_toggle_off")
            ],
            [
                InlineKeyboardButton(text="🍞 Mijoz menyusi ko'rinishi", callback_data="admin_client_menu")
            ],
            [
                InlineKeyboardButton(text="🌐 Saytni ochish", web_app=WebAppInfo(url=SITE_URL))
            ]
        ]
    else:
        buttons = [
            [
                InlineKeyboardButton(text="🟢 Tizimni qayta ishga tushirish (1 bosishda)", callback_data="admin_toggle_on")
            ],
            [
                InlineKeyboardButton(text="🌐 Saytni ko'rish", web_app=WebAppInfo(url=SITE_URL))
            ]
        ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def main_reply_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🍞 Nonlarimiz (Menyu)"),
                KeyboardButton(text="🛵 Dastavka buyurtma berish")
            ],
            [
                KeyboardButton(text="⏰ Ish vaqti"),
                KeyboardButton(text="📞 Bog'lanish & Dastavka")
            ],
            [
                KeyboardButton(text="🌐 Saytni ochish (Non Savati)", web_app=WebAppInfo(url=SITE_URL))
            ]
        ],
        resize_keyboard=True
    )

def menu_inline_keyboard():
    buttons = [
        [
            InlineKeyboardButton(text="🚀 Saytda xarid qilish (Veb-Ilova)", web_app=WebAppInfo(url=SITE_URL))
        ],
        [
            InlineKeyboardButton(text="🥩 Go'shtli non — 20 000 so'm", callback_data="prod_goshli")
        ],
        [
            InlineKeyboardButton(text="✨ Qo'qon patir — 9 000 so'm", callback_data="prod_qoqon")
        ],
        [
            InlineKeyboardButton(text="🌼 Ramashka — 8 000 so'm", callback_data="prod_ramashka")
        ],
        [
            InlineKeyboardButton(text="🧈 Yog'li non — 5 000 so'm", callback_data="prod_yogli")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def product_detail_keyboard(prod_key):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🚀 Saytda buyurtma berish", web_app=WebAppInfo(url=SITE_URL))
            ],
            [
                InlineKeyboardButton(text="📞 Qo'ng'iroq qilib buyurtma berish", callback_data="call_order")
            ],
            [
                InlineKeyboardButton(text="⬅️ Menyuga qaytish", callback_data="back_to_menu")
            ]
        ]
    )

MAINTENANCE_TEXT = (
    "⚠️ <b>Hurmatli mijoz!</b>\n\n"
    "Hozirda nonvoyxonamizda profilaktika va texnik ishlar olib borilmoqda. "
    "Shu sababli buyurtmalar qabuli vaqtincha to'xtatildi.\n\n"
    "Tez orada yana issiq nonlar bilan xizmatingizdamiz!\n"
    "📞 Aloqa va ma'lumot uchun: <b>+998 98 000 94 54</b>"
)

# ==================== DISPATCHER & HANDLERS ====================
dp = Dispatcher()

@dp.message(Command("admin", "panel"))
async def cmd_admin(message: Message, bot: Bot):
    if not is_owner(message.from_user):
        return
    active = await get_system_status(bot)
    panel_text = (
        f"🎛 <b>Boshqaruv Paneli</b>\n\n"
        f"📊 <b>Tizim holati:</b> {'🟢 FAOL (Ishlamoqda)' if active else '🔴 TO\'XTATILGAN (Profilaktika)'}\n"
        f"🌐 <b>Sayt:</b> {SITE_URL}\n"
        f"🤖 <b>Bot holati:</b> {'🟢 Mijozlarga ochiq' if active else '🔴 Profilaktika rejimida'}\n\n"
        f"Quyidagi tugma orqali butun tizimni 1 bosishda to'xtatishingiz yoki yoqishingiz mumkin:"
    )
    await message.answer(panel_text, reply_markup=owner_panel_keyboard(active), parse_mode="HTML")

@dp.message(CommandStart())
async def cmd_start(message: Message, bot: Bot):
    # Agar owner bo'lsa, boshqaruv panelini ko'rsatamiz
    if is_owner(message.from_user):
        active = await get_system_status(bot)
        panel_text = (
            f"🎛 <b>Boshqaruv Paneli</b>\n\n"
            f"📊 <b>Tizim holati:</b> {'🟢 FAOL (Ishlamoqda)' if active else '🔴 TO\'XTATILGAN (Profilaktika)'}\n"
            f"🌐 <b>Sayt:</b> {SITE_URL}\n\n"
            f"Boshqaruv tugmalari:"
        )
        await message.answer(panel_text, reply_markup=owner_panel_keyboard(active), parse_mode="HTML")
        return

    active = await get_system_status(bot)
    if not active:
        await message.answer(MAINTENANCE_TEXT, parse_mode="HTML")
        return

    welcome_text = (
        f"Assalomu alaykum, <b>{message.from_user.full_name}</b>!\n\n"
        f"🔥 <b>Tandir Non</b> yetkazib berish botiga xush kelibsiz!\n\n"
        f"Bizda har kuni tandirdan endigina uzilgan issiq, qarsildoq va mazali nonlar tayyorlanadi.\n\n"
        f"⏰ <b>Ish vaqti:</b> {WORK_HOURS}\n"
        f"🛵 <b>Dastavka mavjud:</b> Issiq holatda uyingizgacha yetkazamiz!\n\n"
        f"Kerakli bo'limni tanlang:"
    )
    await message.answer(welcome_text, reply_markup=main_reply_keyboard(), parse_mode="HTML")

# Owner harakatlari (Callback)
@dp.callback_query(F.data == "admin_toggle_off")
async def cb_admin_toggle_off(callback: CallbackQuery, bot: Bot):
    if not is_owner(callback.from_user):
        await callback.answer("Ruxsat berilmagan!", show_alert=True)
        return

    await set_system_status(bot, False)
    text = (
        "🔴 <b>Tizim to'xtatildi!</b>\n\n"
        "• Sayt va Botda profilaktika rejimi yoqildi.\n"
        "• Mijozlar buyurtma bera olmaydi.\n\n"
        "Qayta ishga tushirish uchun quyidagi tugmani bosing:"
    )
    await callback.message.edit_text(text, reply_markup=owner_panel_keyboard(False), parse_mode="HTML")
    await callback.answer("Tizim to'xtatildi!")

@dp.callback_query(F.data == "admin_toggle_on")
async def cb_admin_toggle_on(callback: CallbackQuery, bot: Bot):
    if not is_owner(callback.from_user):
        await callback.answer("Ruxsat berilmagan!", show_alert=True)
        return

    await set_system_status(bot, True)
    text = (
        "🟢 <b>Tizim qayta ishga tushirildi!</b>\n\n"
        "• Sayt va Bot to'liq faol holatga keltirildi.\n"
        "• Buyurtmalar qabuli qayta ochildi."
    )
    await callback.message.edit_text(text, reply_markup=owner_panel_keyboard(True), parse_mode="HTML")
    await callback.answer("Tizim ishga tushirildi!")

@dp.callback_query(F.data == "admin_client_menu")
async def cb_admin_client_menu(callback: CallbackQuery):
    if not is_owner(callback.from_user):
        return
    text = "🥖 <b>Mijoz menyusi ko'rinishi:</b>"
    await callback.message.answer(text, reply_markup=menu_inline_keyboard(), parse_mode="HTML")
    await callback.answer()

@dp.message(F.text == "🍞 Nonlarimiz (Menyu)")
async def show_menu(message: Message, bot: Bot):
    if not is_owner(message.from_user):
        active = await get_system_status(bot)
        if not active:
            await message.answer(MAINTENANCE_TEXT, parse_mode="HTML")
            return

    text = (
        "🥖 <b>Bizning Tandir Nonlarimiz:</b>\n\n"
        "1. <b>Go'shtli non</b> — 20 000 so'm\n"
        "2. <b>Qo'qon patir</b> — 9 000 so'm\n"
        "3. <b>Ramashka</b> — 8 000 so'm\n"
        "4. <b>Yog'li non</b> — 5 000 so'm\n\n"
        "Batafsil ma'lumot olish uchun quyidagi tugmalardan birini bosing:"
    )
    await message.answer(text, reply_markup=menu_inline_keyboard(), parse_mode="HTML")

@dp.callback_query(F.data.startswith("prod_"))
async def product_callback(callback: CallbackQuery, bot: Bot):
    if not is_owner(callback.from_user):
        active = await get_system_status(bot)
        if not active:
            await callback.answer("Profilaktika tufayli vaqtincha to'xtatilgan", show_alert=True)
            return

    prod_key = callback.data.split("_")[1]
    prod = PRODUCTS.get(prod_key)
    if prod:
        caption = (
            f"🍞 <b>{prod['name']}</b>\n\n"
            f"📝 {prod['desc']}\n\n"
            f"💰 <b>Narxi:</b> {prod['price']:,} so'm\n\n"
            f"🛵 <i>Dastavka xizmati orqali issiq holda yetkazib beramiz!</i>"
        ).replace(",", " ")
        await callback.message.edit_text(caption, reply_markup=product_detail_keyboard(prod_key), parse_mode="HTML")
    await callback.answer()

@dp.callback_query(F.data == "back_to_menu")
async def back_menu_callback(callback: CallbackQuery, bot: Bot):
    if not is_owner(callback.from_user):
        active = await get_system_status(bot)
        if not active:
            await callback.message.edit_text(MAINTENANCE_TEXT, parse_mode="HTML")
            await callback.answer()
            return

    text = (
        "🥖 <b>Bizning Tandir Nonlarimiz:</b>\n\n"
        "1. <b>Go'shtli non</b> — 20 000 so'm\n"
        "2. <b>Qo'qon patir</b> — 9 000 so'm\n"
        "3. <b>Ramashka</b> — 8 000 so'm\n"
        "4. <b>Yog'li non</b> — 5 000 so'm\n\n"
        "Batafsil ma'lumot uchun tanlang:"
    )
    await callback.message.edit_text(text, reply_markup=menu_inline_keyboard(), parse_mode="HTML")
    await callback.answer()

@dp.message(F.text == "⏰ Ish vaqti")
async def show_work_hours(message: Message):
    text = (
        "⏰ <b>Tandir Non Ish Vaqti:</b>\n\n"
        "🌅 <b>Ish boshlanadi:</b> Ertalab 05:00 da\n"
        "🌆 <b>Ish tugaydi:</b> Kechasi 24:00 da (Yarim tun)\n"
        "📅 <b>Ish kunlari:</b> Har kuni (Dam olishsiz)\n\n"
        "🔥 <i>Har kuni erta tong soat 05:00 dan birinchi issiq nonlar tayyor bo'ladi!</i>"
    )
    await message.answer(text, parse_mode="HTML")

@dp.message(F.text.in_(["📞 Bog'lanish & Dastavka", "🛵 Dastavka buyurtma berish"]))
@dp.callback_query(F.data == "call_order")
async def show_contacts(event: Message | CallbackQuery):
    text = (
        "🛵 <b>Dastavka va Buyurtma Uchun Bog'lanish:</b>\n\n"
        "Issiq tandir nonlariga hoziroq qo'ng'iroq qilib buyurtma berishingiz mumkin:\n\n"
        "📞 <b>+998 98 000 94 54</b>\n"
        "📞 <b>+998 90 901 92 92</b>\n\n"
        "⏰ <b>Buyurtma qabul vaqti:</b> 05:00 dan 24:00 gacha\n"
        "📍 Tezkor kuryer termo-sumkada issiq yetkazadi!"
    )
    if isinstance(event, CallbackQuery):
        await event.message.answer(text, parse_mode="HTML")
        await event.answer()
    else:
        await event.answer(text, parse_mode="HTML")

@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message, bot: Bot):
    if not is_owner(message.from_user):
        active = await get_system_status(bot)
        if not active:
            await message.answer(MAINTENANCE_TEXT, parse_mode="HTML")
            return

    await message.answer(
        f"✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n"
        f"Operatorlarimiz tez orada siz bilan bog'lanishadi.\n\n"
        f"Qo'shimcha savollar uchun: <b>98 000 94 54</b>",
        parse_mode="HTML"
    )

# ==================== MAIN ====================
async def main():
    logging.basicConfig(level=logging.INFO)
    bot = Bot(token=BOT_TOKEN)
    print("🤖 Tandir Non boti ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("Bot to'xtatildi.")
