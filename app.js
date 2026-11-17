// Tandir Non — O'zbek An'anaviy Nonvoyxonasi Mantiqi
// nonuz_bot rasmiy veb-ilovasi

const BAKERY_CONFIG = {
    name: "Tandir Non",
    openHour: 5,   // Ertalabki 5:00
    closeHour: 24, // Kechasi 24:00 (Yarim tun)
    phones: ["+998980009454", "+998909019292"],
    telegramUsername: "nonuz_bot"
};

const PRODUCTS = {
    1: { id: 1, name: "Go'shtli non", price: 20000, img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=650&q=85" },
    2: { id: 2, name: "Qo'qon patir", price: 9000, img: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=650&q=85" },
    3: { id: 3, name: "Ramashka", price: 8000, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=650&q=85" },
    4: { id: 4, name: "Yog'li non", price: 5000, img: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=650&q=85" }
};

let cart = {};
let cardQuantities = { 1: 1, 2: 1, 3: 1, 4: 1 };
let audioCtx = null;
let fireAmbientNode = null;
let isFireAmbientPlaying = false;

// Web Audio API orqali qarsildoq qobig'i va tandir tovushlarini sintezlash
function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Qarsildoq non ovozi effekti (Bread crust crunch sound)
function playBreadCrunchSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // White noise burst with filter sweep to mimic bread crust snapping
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        filter.Q.value = 3.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

        // Qo'shimcha yumshoq ohang
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        noise.start(ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
        noise.stop(ctx.currentTime + 0.12);
    } catch (e) {
        // Silent catch
    }
}

// Tandir o'tini shukuhi (Ambient fire crackle)
function toggleFireAmbient() {
    const icon = document.getElementById("sound-icon");
    const label = document.getElementById("sound-label");

    if (isFireAmbientPlaying) {
        stopFireAmbient();
        if (icon) icon.className = "fas fa-volume-xmark text-stone-400";
        if (label) label.innerText = "Tandir ovozi: O'chiq";
        isFireAmbientPlaying = false;
    } else {
        startFireAmbient();
        if (icon) icon.className = "fas fa-volume-high text-flame-400 animate-pulse";
        if (label) label.innerText = "Tandir ovozi: Yangramoqda";
        isFireAmbientPlaying = true;
    }
}

function startFireAmbient() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Brown noise generator for warm fire rumble
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 280;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start(0);
        fireAmbientNode = { source: whiteNoise, gain: gainNode };
    } catch (e) {
        console.warn("Audio ambient not supported", e);
    }
}

function stopFireAmbient() {
    if (fireAmbientNode && fireAmbientNode.source) {
        try {
            fireAmbientNode.source.stop();
            fireAmbientNode.source.disconnect();
        } catch (e) {}
        fireAmbientNode = null;
    }
}

// 1. Ish vaqti holatini yangilash
function updateWorkingHoursStatus() {
    const now = new Date();
    const currentHour = now.getHours();

    const pill = document.getElementById("tandir-live-pill");
    const text = document.getElementById("tandir-live-text");

    const isOpen = currentHour >= BAKERY_CONFIG.openHour && currentHour < BAKERY_CONFIG.closeHour;

    if (pill && text) {
        if (isOpen) {
            pill.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flame-500/10 border border-flame-500/40 text-crust-200 font-medium";
            text.innerHTML = `🔥 Tandir qizigan (20:00 gacha)`;
        } else {
            pill.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-800 border border-stone-600/40 text-stone-400 font-medium";
            text.innerHTML = `🌙 Hozir yopiq (05:00 da ochiladi)`;
        }
    }
}

// 2. Mahsulot kartasidagi son
function incrementCardCount(id) {
    cardQuantities[id] = (cardQuantities[id] || 1) + 1;
    const el = document.getElementById(`card-qty-${id}`);
    if (el) el.innerText = cardQuantities[id];
}

function decrementCardCount(id) {
    if (cardQuantities[id] > 1) {
        cardQuantities[id] -= 1;
        const el = document.getElementById(`card-qty-${id}`);
        if (el) el.innerText = cardQuantities[id];
    }
}

// 3. Savatga qo'shish
function addToCart(id, name, price, customQty = null) {
    const qty = customQty !== null ? customQty : (cardQuantities[id] || 1);
    
    if (cart[id]) {
        cart[id].qty += qty;
    } else {
        cart[id] = {
            id: id,
            name: name,
            price: price,
            qty: qty,
            img: PRODUCTS[id].img
        };
    }

    if (customQty === null) {
        cardQuantities[id] = 1;
        const qtyEl = document.getElementById(`card-qty-${id}`);
        if (qtyEl) qtyEl.innerText = "1";
    }

    saveCart();
    renderCart();
    showToast(`${name} (${qty} dona)`, "Savatga muvaffaqiyatli qo'shildi!");
    playBreadCrunchSound();
}

function updateCartItemQty(id, change) {
    if (!cart[id]) return;

    cart[id].qty += change;
    if (cart[id].qty <= 0) {
        delete cart[id];
    }

    saveCart();
    renderCart();
    playBreadCrunchSound();
}

function removeCartItem(id) {
    if (cart[id]) {
        delete cart[id];
        saveCart();
        renderCart();
    }
}

function saveCart() {
    try {
        localStorage.setItem("tandir_cart_v2", JSON.stringify(cart));
    } catch (e) {}
}

function loadCart() {
    try {
        const saved = localStorage.getItem("tandir_cart_v2");
        if (saved) cart = JSON.parse(saved);
    } catch (e) {
        cart = {};
    }
    renderCart();
}

function formatMoney(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

// 4. Savatni chizish (Render Cart)
function renderCart() {
    const itemsList = document.getElementById("cart-items-list");
    const emptyState = document.getElementById("cart-empty-state");
    const cartFooter = document.getElementById("cart-footer");
    const badge = document.getElementById("cart-badge-count");
    const mobileBadge = document.getElementById("mobile-cart-count");
    const countLabel = document.getElementById("cart-items-count-label");
    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");

    const itemKeys = Object.keys(cart);
    let totalCount = 0;
    let totalPrice = 0;

    itemKeys.forEach(id => {
        totalCount += cart[id].qty;
        totalPrice += cart[id].price * cart[id].qty;
    });

    if (badge) {
        badge.innerText = totalCount;
        if (totalCount > 0) {
            badge.classList.remove("scale-0");
            badge.classList.add("scale-100");
        } else {
            badge.classList.remove("scale-100");
            badge.classList.add("scale-0");
        }
    }

    if (mobileBadge) mobileBadge.innerText = totalCount;
    if (countLabel) countLabel.innerText = `${totalCount} ta non tanlandi`;

    if (itemKeys.length === 0) {
        if (itemsList) {
            itemsList.innerHTML = "";
            itemsList.classList.add("hidden");
        }
        if (emptyState) {
            emptyState.classList.remove("hidden");
            emptyState.classList.add("flex");
        }
        if (cartFooter) cartFooter.classList.add("opacity-50", "pointer-events-none");
        if (subtotalEl) subtotalEl.innerText = "0 so'm";
        if (totalEl) totalEl.innerText = "0 so'm";
        return;
    }

    if (itemsList) itemsList.classList.remove("hidden");
    if (emptyState) {
        emptyState.classList.add("hidden");
        emptyState.classList.remove("flex");
    }
    if (cartFooter) cartFooter.classList.remove("opacity-50", "pointer-events-none");

    let html = "";
    itemKeys.forEach(id => {
        const item = cart[id];
        const itemSubtotal = item.price * item.qty;

        html += `
            <div class="flex items-center gap-3 p-3 bg-clay-950 rounded-2xl border border-crust-600/30">
                <img src="${item.img}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-crust-600/20">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-white text-xs sm:text-sm truncate">${item.name}</h4>
                    <p class="text-[11px] text-stone-400">${formatMoney(item.price)}</p>
                    <p class="text-xs font-black text-crust-300 mt-1">${formatMoney(itemSubtotal)}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <button onclick="removeCartItem(${item.id})" class="text-stone-500 hover:text-red-400 text-xs p-1 transition" title="O'chirish">
                        <i class="fas fa-trash-can"></i>
                    </button>
                    <div class="flex items-center bg-clay-900 border border-crust-600/30 rounded-lg overflow-hidden">
                        <button onclick="updateCartItemQty(${item.id}, -1)" class="w-6 h-6 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center">-</button>
                        <span class="w-6 text-center text-xs font-bold text-white">${item.qty}</span>
                        <button onclick="updateCartItemQty(${item.id}, 1)" class="w-6 h-6 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    if (itemsList) itemsList.innerHTML = html;
    if (subtotalEl) subtotalEl.innerText = formatMoney(totalPrice);
    if (totalEl) totalEl.innerText = formatMoney(totalPrice);
}

// 5. Savat modalini ochish/yopish
function toggleCartModal() {
    const modal = document.getElementById("cart-modal");
    const backdrop = document.getElementById("cart-backdrop");
    const panel = document.getElementById("cart-panel");

    if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        setTimeout(() => {
            backdrop.classList.remove("opacity-0");
            panel.classList.remove("translate-x-full");
        }, 10);
    } else {
        backdrop.classList.add("opacity-0");
        panel.classList.add("translate-x-full");
        setTimeout(() => {
            modal.classList.add("hidden");
            document.body.classList.remove("overflow-hidden");
        }, 300);
    }
}

// 6. Toast xabarnomasi
let toastTimeout;
function showToast(title, desc) {
    const toast = document.getElementById("toast");
    const titleEl = document.getElementById("toast-title");
    const descEl = document.getElementById("toast-desc");

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;

    toast.classList.remove("translate-y-24", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-24", "opacity-0");
    }, 2500);
}

// 7. Mehmon Dasturxon Kalkulyatori
let currentBundlePlan = null;
function calculateDasturxon(guests) {
    const titleEl = document.getElementById("calc-title");
    const priceEl = document.getElementById("calc-price");
    const breakdownEl = document.getElementById("calc-breakdown");

    if (guests === 4) {
        currentBundlePlan = {
            title: "4 kishilik oila dasturxoni:",
            items: [
                { id: 1, name: "Go'shtli non", qty: 1, price: 20000 },
                { id: 2, name: "Qo'qon patir", qty: 1, price: 9000 },
                { id: 4, name: "Yog'li non", qty: 2, price: 5000 }
            ],
            total: 39000
        };
    } else if (guests === 8) {
        currentBundlePlan = {
            title: "8 kishilik qadrdonlar davrasi:",
            items: [
                { id: 1, name: "Go'shtli non", qty: 2, price: 20000 },
                { id: 2, name: "Qo'qon patir", qty: 2, price: 9000 },
                { id: 3, name: "Ramashka", qty: 2, price: 8000 }
            ],
            total: 74000
        };
    } else if (guests === 15) {
        currentBundlePlan = {
            title: "15 kishilik mehmondorchilik to'plami:",
            items: [
                { id: 1, name: "Go'shtli non", qty: 4, price: 20000 },
                { id: 2, name: "Qo'qon patir", qty: 4, price: 9000 },
                { id: 3, name: "Ramashka", qty: 3, price: 8000 },
                { id: 4, name: "Yog'li non", qty: 3, price: 5000 }
            ],
            total: 155000
        };
    } else {
        currentBundlePlan = {
            title: "30+ kishilik katta to'y va ma'rakalar:",
            items: [
                { id: 1, name: "Go'shtli non", qty: 8, price: 20000 },
                { id: 2, name: "Qo'qon patir", qty: 10, price: 9000 },
                { id: 3, name: "Ramashka", qty: 8, price: 8000 },
                { id: 4, name: "Yog'li non", qty: 6, price: 5000 }
            ],
            total: 344000
        };
    }

    if (titleEl) titleEl.innerText = currentBundlePlan.title;
    if (priceEl) priceEl.innerText = formatMoney(currentBundlePlan.total);
    if (breakdownEl) {
        breakdownEl.innerText = currentBundlePlan.items
            .map(i => `• ${i.qty} ta ${i.name}`)
            .join(' + ');
    }
}

function applyCalculatedBundle() {
    if (!currentBundlePlan) calculateDasturxon(8);
    currentBundlePlan.items.forEach(item => {
        addToCart(item.id, item.name, item.price, item.qty);
    });
    showToast("To'plam qo'shildi!", "Savatga barcha tavsiya qilingan nonlar solindi.");
    toggleCartModal();
}

// 8. Buyurtmani yuborish (To'g'ridan-to'g'ri Vercel API & Telegram)
async function submitOrderViaTelegram() {
    if (!systemIsActive && !isOwnerSession) {
        alert("Hozirda profilaktika va texnik ishlar tufayli buyurtmalar qabuli vaqtincha to'xtatilgan!");
        return;
    }

    const itemKeys = Object.keys(cart);
    if (itemKeys.length === 0) {
        alert("Savat bo'sh! Iltimos avval non tanlang.");
        return;
    }

    const nameInput = document.getElementById("order-customer-name");
    const phoneInput = document.getElementById("order-customer-phone");
    const addressInput = document.getElementById("order-customer-address");

    const name = nameInput ? nameInput.value.trim() : "Mijoz";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    if (!phone) {
        alert("Iltimos telefon raqamingizni kiriting!");
        if (phoneInput) phoneInput.focus();
        return;
    }

    let total = 0;
    let itemsText = "";

    itemKeys.forEach(id => {
        const item = cart[id];
        const sub = item.price * item.qty;
        total += sub;
        itemsText += `• ${item.name} — ${item.qty} dona (${formatMoney(sub)})\n`;
    });

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;

    const orderPayload = {
        customerName: name || "Mijoz",
        customerPhone: phone,
        customerAddress: address,
        items: cart,
        totalPrice: total,
        time: timeString,
        user: tgUser
    };

    // Yuborish tugmasini faolsizlantirish
    const submitBtn = event?.currentTarget || document.querySelector("button[onclick='submitOrderViaTelegram()']");
    const originalText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i> <span>Yuborilmoqda...</span>';
    }

    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();

        if (result && result.success) {
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            showToast("Buyurtma qabul qilindi!", `Raqami: #${result.orderId}. Tez orada siz bilan bog'lanamiz!`);
            
            // Savatni tozalash
            cart = {};
            saveCart();
            renderCart();

            // Maydonlarni tozalash
            if (addressInput) addressInput.value = "";

            // Savat modalini yopish
            setTimeout(() => {
                toggleCartModal();
            }, 800);

            // Agar Telegram WebApp bo'lsa
            setTimeout(() => {
                if (window.Telegram?.WebApp?.close) {
                    window.Telegram.WebApp.close();
                }
            }, 2500);
            return;
        } else {
            const errMsg = result?.error || "Buyurtmani qabul qilishda xatolik yuz berdi";
            showToast("Buyurtma qabul qilinmadi", errMsg);
            alert(errMsg);
        }
    } catch (err) {
        console.error("Order API request error:", err);
        fallbackSendOrder(orderPayload, itemsText, total, timeString);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

function fallbackSendOrder(order, itemsText, total, timeString) {
    const orderMessage = 
`🥖 YANGI BUYURTMA | TANDIR NON
⏰ Vaqt: ${timeString}
----------------------------------
👤 Buyurtmachi: ${order.customerName}
📞 Telefon: ${order.customerPhone}
📍 Manzil: ${order.customerAddress || 'Kiritilmagan'}
----------------------------------
📋 BUYURTMA TARKIBI:
${itemsText}----------------------------------
💰 JAMI SUMMA: ${formatMoney(total)}
🛵 Dastavka: Termo-sumkada tezkor
----------------------------------
Ish vaqti: 05:00 - 24:00`;

    const encodedText = encodeURIComponent(orderMessage);

    if (BAKERY_CONFIG.telegramUsername) {
        window.open(`https://t.me/${BAKERY_CONFIG.telegramUsername}`, '_blank');
    } else {
        window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
    }

    showToast("Telegram ochilmoqda...", "Xabarni tasdiqlash uchun yuboring.");
}

// ==================== TIZIM HOLATI VA BOSHQARUV ====================
let systemIsActive = true;
let isOwnerSession = false;

function detectOwner() {
    try {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (user) {
            if (user.username && user.username.toLowerCase() === 'fayzbek1331') return true;
            if (String(user.id) === '6707839718') return true;
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'fayzbek1331' || urlParams.get('owner') === 'fayzbek1331' || urlParams.get('key') === 'fayzbek1331_key') {
            return true;
        }
    } catch (e) {}
    return false;
}

async function syncSystemStatus() {
    isOwnerSession = detectOwner();
    const ownerBar = document.getElementById("owner-control-bar");
    const overlay = document.getElementById("maintenance-overlay");

    try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (typeof data.active === 'boolean') {
                systemIsActive = data.active;
            }
        }
    } catch (e) {
        // Tarmoq xatoligida sukut bo'yicha faol
    }

    if (isOwnerSession) {
        if (ownerBar) {
            ownerBar.classList.remove("hidden");
            const dot = document.getElementById("owner-status-dot");
            const label = document.getElementById("owner-status-label");
            const btn = document.getElementById("owner-toggle-btn");
            const btnText = document.getElementById("owner-toggle-text");

            if (systemIsActive) {
                if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";
                if (label) label.innerText = "Tizim FAOL (Sayt & Bot ishlamoqda)";
                if (btn) btn.className = "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer bg-red-600/90 hover:bg-red-500 text-white border border-red-400/40";
                if (btnText) btnText.innerText = "Tizimni to'xtatish (1 bosishda)";
            } else {
                if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-red-500 animate-ping";
                if (label) label.innerText = "Tizim TO'XTATILGAN (Profilaktika)";
                if (btn) btn.className = "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40";
                if (btnText) btnText.innerText = "Tizimni ishga tushirish (1 bosishda)";
            }
        }
        if (overlay) overlay.classList.add("hidden");
    } else {
        if (ownerBar) ownerBar.classList.add("hidden");
        if (overlay) {
            if (!systemIsActive) {
                overlay.classList.remove("hidden");
            } else {
                overlay.classList.add("hidden");
            }
        }
    }
}

async function toggleSystemByOwner() {
    if (!isOwnerSession) return;
    const btnText = document.getElementById("owner-toggle-text");
    if (btnText) btnText.innerText = "Bajarilmoqda...";

    const newTarget = !systemIsActive;
    try {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const res = await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: newTarget ? 'on' : 'off',
                username: tgUser?.username || 'fayzbek1331',
                userId: tgUser?.id || '6707839718',
                secret: 'fayzbek1331_key'
            })
        });
        const data = await res.json();
        if (data.success) {
            systemIsActive = data.active;
            showToast(
                systemIsActive ? "Tizim ishga tushirildi!" : "Tizim to'xtatildi!",
                systemIsActive ? "Sayt va bot mijozlar uchun faollashtirildi." : "Sayt va botda profilaktika rejimi yoqildi."
            );
        }
    } catch (e) {
        showToast("Xatolik yuz berdi", e.message);
    }
    await syncSystemStatus();
}

// Boshlang'ich yuklash
document.addEventListener("DOMContentLoaded", () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.innerText = new Date().getFullYear();

    updateWorkingHoursStatus();
    setInterval(updateWorkingHoursStatus, 60000);

    calculateDasturxon(8);
    loadCart();

    syncSystemStatus();
    setInterval(syncSystemStatus, 15000);

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        try {
            window.Telegram.WebApp.setHeaderColor('#150d08');
            window.Telegram.WebApp.setBackgroundColor('#120b07');
        } catch (e) {}
    }
});
