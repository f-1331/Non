# 🥖 Tandir Non — Rasmiy Veb-Sayt va Telegram Bot Loyihasi

Ushbu loyiha tandir nonlari savdosi va yetkazib berish (dastavka) xizmati uchun maxsus tayyorlandi.

---

## 📋 Loyiha haqida ma'lumotlar:

### 🕒 Ish vaqti:
* **Ertalab soat 05:00 da** ish boshlanadi.
* **Kechqurun soat 20:00 da** ishxona yopiladi.
* Sayt hozirgi soatga qarab avtomatik ravishda **"🟢 Hozir ochiq (20:00 gacha)"** yoki **"🌙 Hozir yopiq (05:00 da ochiladi)"** holatini ko'rsatib turadi.

---

### 🍞 Non turlari va narxlari:
1. **Go'shtli non** — `20 000 so'm` (Xaridorgir, tandirda pishirilgan mayin mol go'shti bilan)
2. **Qo'qon patir** — `9 000 so'm` (Klassik qarsildoq chetli shohona patir)
3. **Ramashka non** — `8 000 so'm` (Yumshoq, moychechak gul barglari shaklida)
4. **Yog'li non** — `5 000 so'm` (Saryog' va sedana sepilgan mazali non)

---

### 🛵 Dastavka (Yetkazib berish):
Dastavka xizmati mavjud bo'lib, mijozlar sayt orqali to'g'ridan-to'g'ri qo'ng'iroq qilishlari yoki savatdan buyurtma yuborishlari mumkin.

**Dastavka uchun telefon raqamlar:**
* 📞 **+998 98 000 94 54**
* 📞 **+998 90 901 92 92**

---

## 📁 Fayllar tuzilishi:

* `index.html` — Zamonaviy, to'liq moslashuvchan (mobil va kompyuterga mos) veb-sayt.
* `app.js` — Savat mantiqi, ish vaqti hisoblagichi, tovush effektlari va Telegram buyurtma shakllantiruvchi.
* `Saytni ochish.bat` — Sichqonchani ikki marta bosib saytni brauzerda ochish uchun qulay fayl.
* `telegram_bot.py` — aiogram 3.x kutubxonasida tayyorlangan rasmiy Telegram bot andozasi.

---

## 🚀 Saytni ishga tushirish:

1. Shunchaki `index.html` faylini yoki `Saytni ochish.bat` faylini ikki marta bosing.
2. Sayt darhol Google Chrome, Edge yoki istalgan brauzerda ochiladi.
3. Internet tarmog'iga ulanish orqali rasm va stillar to'liq chiroyli ko'rinishda ishlaydi.

---

## 🤖 Telegram botni ishga tushirish (keyinchalik):

Loyiha ichida `telegram_bot.py` fayli to'liq tayyorlangan. Uni ishga tushirish uchun:

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va botingizga nom bering.
3. BotFather bergan **HTTP API Token**ni nusxalang.
4. `telegram_bot.py` faylidagi `BOT_TOKEN = "..."` joyiga o'z tokeningizni yozing.
5. Terminalda botni ishga tushiring:
   ```bash
   python telegram_bot.py
   ```
6. Botingiz orqali mijozlar 4 xil non menyusini ko'rishlari, dastavka buyurtma qilishlari va telefon raqamlarni olishlari mumkin!
