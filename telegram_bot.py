"""
Tandir Non - Rasmiy Telegram Boti
aiogram 3.x asosida tayyorlangan.

Ishga tushirish uchun:
1. @BotFather dan yangi bot ochib TOKEN oling.
2. Quyidagi BOT_TOKEN o'rniga o'z tokeningizni yozing.
3. Terminalda ishga tushiring: python telegram_bot.py
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import (
    Message, 
    CallbackQuery, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    ReplyKeyboardMarkup, 
    KeyboardButton,
    WebAppInfo
)

# ==================== SOZLAMALAR ====================
BOT_TOKEN = "8742728691:AAF-upc8Zhe8l9wRBbZcuqNLQdM3KA8XeYo"  # @BotFather dan olingan token

# Admin yoki buyurtma tushadigan guruh/kanal/admin ID
ADMIN_ID = None  # Masalan: 123456789

# Do'kon ma'lumotlari
WORK_HOURS = "05:00 - 24:00 (Har kuni dam olishsiz)"
PHONES = ["+998 98 000 94 54", "+998 90 901 92 92"]

# Mahsulotlar ro'yxati
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

# ==================== TUGMALAR (KEYBOARDS) ====================
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
            ]
        ],
        resize_keyboard=True
    )

def menu_inline_keyboard():
    buttons = [
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
                InlineKeyboardButton(text="📞 Qo'ng'iroq qilib buyurtma berish", callback_data="call_order")
            ],
            [
                InlineKeyboardButton(text="⬅️ Menyuga qaytish", callback_data="back_to_menu")
            ]
        ]
    )

# ==================== DISPATCHER & HANDLERS ====================
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: Message):
    welcome_text = (
        f"Assalomu alaykum, <b>{message.from_user.full_name}</b>!\n\n"
        f"🔥 <b>Tandir Non</b> yetkazib berish botiga xush kelibsiz!\n\n"
        f"Bizda har kuni tandirdan endigina uzilgan issiq, qarsildoq va mazali nonlar tayyorlanadi.\n\n"
        f"⏰ <b>Ish vaqti:</b> {WORK_HOURS}\n"
        f"🛵 <b>Dastavka mavjud:</b> Issiq holatda uyingizgacha yetkazamiz!\n\n"
        f"Kerakli bo'limni tanlang:"
    )
    await message.answer(welcome_text, reply_markup=main_reply_keyboard(), parse_mode="HTML")

@dp.message(F.text == "🍞 Nonlarimiz (Menyu)")
async def show_menu(message: Message):
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
async def product_callback(callback: CallbackQuery):
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
async def back_menu_callback(callback: CallbackQuery):
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

# WebApp dan kelgan ma'lumotlarni qabul qilish
@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message):
    data = message.web_app_data.data
    await message.answer(
        f"✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n"
        f"Operatorlarimiz tez orada siz bilan bog'lanishadi.\n\n"
        f"Qo'shimcha savollar uchun: <b>98 000 94 54</b>",
        parse_mode="HTML"
    )

# ==================== MAIN ====================
async def main():
    logging.basicConfig(level=logging.INFO)
    if BOT_TOKEN == "BOT_TOKENINGIZNI_BU_YERGA_YOZING":
        print("\n" + "="*60)
        print("DIQQAT: Botni ishga tushirish uchun BOT_TOKEN kiriting!")
        print("1. Telegramda @BotFather ga kiring.")
        print("2. /newbot buyrug'i orqali yangi bot yarating.")
        print("3. Berilgan HTTP API tokenni telegram_bot.py faylidagi BOT_TOKEN ga qo'ying.")
        print("="*60 + "\n")
        return

    bot = Bot(token=BOT_TOKEN)
    print("🤖 Tandir Non boti ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("Bot to'xtatildi.")
