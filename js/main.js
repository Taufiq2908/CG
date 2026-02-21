// --- 1. INISIALISASI ---
AOS.init({ duration: 800, once: true });

let lenis;
try {
    lenis = new Lenis({ duration: 1.2, smooth: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
} catch (e) { console.warn(e); }

// --- 2. SEQUENCE ANIMATION (RESPONSIVE FIX) ---
const canvas = document.getElementById("sequence-canvas");
const context = canvas.getContext("2d");
const frameCount = 72; 
const currentFrame = index => `./sequence/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;
const images = [];
const frames = { frame: 0 };

// Load Frame Pertama
const img0 = new Image();
img0.onload = () => {
    render(); 
    loadRestOfImages();
    updateRotatingText(); // Jalankan teks berputar setelah gambar siap
};
img0.onerror = () => {
    canvas.style.display = 'none';
    // Fallback Background jika gambar gagal
    document.getElementById('sequence-container').style.background = 'radial-gradient(circle at center, #1e3a8a 0%, #0b1120 100%)';
    updateRotatingText();
};
img0.src = currentFrame(0);
images.push(img0);

function loadRestOfImages() {
    for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
    }
}

// Setup Animasi GSAP
gsap.registerPlugin(ScrollTrigger);

let tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#sequence-container",
        start: "top top",
        end: "+=30%", // Scroll lebih pendek biar animasi cepat selesai
        scrub: 0,     // Instant response
        pin: true, 
        anticipatePin: 1
    },
    onUpdate: render
});

tl.to(frames, { frame: frameCount - 1, snap: "frame", ease: "none", duration: 1 });
gsap.to("#scroll-hint", { scrollTrigger: { trigger: "#sequence-container", start: "top top", end: "+=20%", scrub: true }, opacity: 0 });

// --- LOGIKA RENDER RESPONSIF (FIT WIDTH) ---
function render() {
    // Set ukuran canvas sesuai layar
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const img = images[frames.frame] || images[0]; 
    
    if (img && img.complete && img.naturalWidth !== 0) {
        const scale = canvas.width / img.width;
        const drawnW = img.width * scale;
        const drawnH = img.height * scale;
        const x = (canvas.width - drawnW) / 2;
        const y = (canvas.height - drawnH) / 2;
        
        context.drawImage(img, x, y, drawnW, drawnH);
    }
}
window.addEventListener('resize', render);

// --- 3. FITUR LAIN (NAVIGASI, KALKULATOR, DLL) ---

// Smooth Scroll Link
document.querySelectorAll('.nav-link, a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            e.preventDefault();
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                if (lenis) lenis.scrollTo(targetId, { offset: -50, duration: 1.5 });
                else targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Game Switcher
window.switchGame = function(type) {
    const gridPs5 = document.getElementById('grid-ps5');
    const gridPs4 = document.getElementById('grid-ps4');
    const btnPs5 = document.getElementById('btn-ps5');
    const btnPs4 = document.getElementById('btn-ps4');

    if (type === 'ps5') {
        gridPs5.classList.remove('hidden'); gridPs4.classList.add('hidden');
        btnPs5.classList.replace('text-gray-400', 'bg-blue-600');
        btnPs4.classList.replace('bg-blue-600', 'text-gray-400');
    } else {
        gridPs4.classList.remove('hidden'); gridPs5.classList.add('hidden');
        btnPs4.classList.replace('text-gray-400', 'bg-blue-600');
        btnPs5.classList.replace('bg-blue-600', 'text-gray-400');
    }
}

// Rotating Text Logic
const words = ["Terpercaya", "Termurah", "Terfavorit", "Terupdate", "Terbaik", "Ter-worth it"];
const badgeContainer = document.getElementById("rotating-badge");
let currentIndex = 0;

function updateRotatingText() {
    if(!badgeContainer) return;
    badgeContainer.innerHTML = '';
    const text = words[currentIndex];
    text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'rotate-char';
        gsap.set(span, { y: 20, opacity: 0 });
        badgeContainer.appendChild(span);
    });

    const tl = gsap.timeline({
        onComplete: () => {
            currentIndex = (currentIndex + 1) % words.length;
            setTimeout(updateRotatingText, 200);
        }
    });
    tl.to(".rotate-char", { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.7)" });
    tl.to({}, { duration: 2 });
    tl.to(".rotate-char", { y: -20, opacity: 0, duration: 0.3, stagger: 0.03, ease: "power2.in" });
}

// Rolling Counter & Calculator
function createRollingDigit(char) {
    if (char === '.') return `<div class="digit-separator">.</div>`;
    let numbers = '';
    for (let i = 0; i <= 9; i++) { numbers += `<div class="digit-number">${i}</div>`; }
    return `<div class="digit-container"><div class="digit-strip">${numbers}</div></div>`;
}

function updateRollingCounter(valueString) {
    const container = document.getElementById('rolling-digits');
    if (!container) return;
    const chars = valueString.replace(/[^0-9.]/g, '').split(''); 
    if (container.children.length !== chars.length) {
        container.innerHTML = chars.map(c => createRollingDigit(c)).join('');
    }
    const strips = container.querySelectorAll('.digit-strip');
    let stripIdx = 0;
    chars.forEach((char) => {
        if (char !== '.') {
            const num = parseInt(char);
            if(strips[stripIdx]) {
                gsap.to(strips[stripIdx], { yPercent: -(num * 10), duration: 0.8, ease: "power4.out" });
            }
            stripIdx++;
        }
    });
}

let currentDays = 1;
window.autoSelectUnit = function(unit) {
    const radio = document.querySelector(`input[name="console"][value="${unit}"]`);
    if(radio) { radio.click(); calculatePrice(); }
}
window.autoSetDays = function(days) {
    currentDays = days;
    document.getElementById('days-display').innerText = currentDays;
    calculatePrice();
}
window.autoSetStudent = function() {
    const cb = document.getElementById('student');
    if(cb && !cb.checked) { cb.click(); }
    calculatePrice();
}
window.adjustDays = function(amount) {
    currentDays += amount;
    if (currentDays < 1) currentDays = 1;
    if (currentDays > 30) currentDays = 30;
    document.getElementById('days-display').innerText = currentDays;
    calculatePrice();
}
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID').format(Math.floor(number));
}
window.calculatePrice = function() {
    const consoleEl = document.querySelector('input[name="console"]:checked');
    if (!consoleEl) return;
    
    const consoleType = consoleEl.value;
    const locationVal = document.getElementById('location').value;
    const isStudent = document.getElementById('student').checked;
    
    let locationFee = locationVal === "manual" ? 0 : parseInt(locationVal);
    let isManualLocation = locationVal === "manual";
    
    // 1. UPDATE HARGA BARU
    let basePricePerDay = consoleType === 'ps4' ? 110000 : 200000;
    let subtotal = basePricePerDay * currentDays;
    
    // 2. LOGIKA PROMO BERTUMPUK (MINGGUAN + LONG PLAY)
    let promoDeduction = 0;
    let freeDaysCount = 0;
    let discountedDaysCount = 0;

    for (let i = 1; i <= currentDays; i++) {
        if (i % 7 === 0) {
            // Hari ke-7, 14, 21 dst adalah GRATIS
            freeDaysCount++;
            promoDeduction += basePricePerDay; 
        } else if (i > 1) {
            // Hari ke-2 s/d 6 (dan selain kelipatan 7) diskon 15%
            discountedDaysCount++;
            promoDeduction += (basePricePerDay * 0.15); 
        }
    }

    // 3. LOGIKA DISKON PELAJAR (Dihitung dari sisa harga promo)
    let priceAfterPromo = subtotal - promoDeduction;
    let discountStudent = isStudent ? (priceAfterPromo * 0.10) : 0;
    let finalTotal = priceAfterPromo - discountStudent + locationFee;

    // 4. LOGIKA TEKS UPSELL (Tambah X Hari dapat Gratis)
    const upsellEl = document.getElementById('upsell-prompt');
    let daysUntilNextFree = 7 - (currentDays % 7);
    
    // Tampilkan prompt jika sisa hari menuju gratis kurang dari 7 (artinya sedang tidak di hari gratis)
    if (daysUntilNextFree < 7 && daysUntilNextFree > 0 && currentDays < 30) {
        upsellEl.innerHTML = `✨ Tambah <strong>${daysUntilNextFree} hari</strong> lagi dapat <strong>GRATIS 1 Hari!</strong>`;
        upsellEl.classList.remove('hidden');
    } else {
        upsellEl.classList.add('hidden');
    }

    // 5. UPDATE TAMPILAN DI LAYAR (DOM)
    document.getElementById('label-unit').innerText = `${consoleType.toUpperCase()} x ${currentDays} Hari`;
    document.getElementById('price-unit').innerText = formatRupiah(subtotal);
    
    const elTotal = document.getElementById('total-price');
    const elShipping = document.getElementById('price-shipping');
    const rollingContainer = document.getElementById('rolling-digits');
    
    if (isManualLocation) {
        rollingContainer.innerHTML = `<span class="text-xl tracking-tight">Hubungi Admin</span>`;
        elTotal.classList.replace("text-blue-500", "text-yellow-400");
        elShipping.innerText = "Tanya Admin";
        elShipping.classList.add("text-yellow-400");
    } else {
        elTotal.classList.replace("text-yellow-400", "text-blue-500");
        elShipping.classList.remove("text-yellow-400");
        elShipping.innerText = locationFee === 0 ? "Gratis" : "+" + formatRupiah(locationFee);
        updateRollingCounter(formatRupiah(finalTotal));
    }

    // Update Teks Promo di Layar
    const rowPromo = document.getElementById('row-discount-promo');
    if (promoDeduction > 0) {
        rowPromo.classList.remove('hidden');
        let promoTags = [];
        if (freeDaysCount > 0) promoTags.push(`Free ${freeDaysCount} Hari`);
        if (discountedDaysCount > 0) promoTags.push(`Diskon 15%`);
        document.getElementById('label-promo').innerText = "Promo: " + promoTags.join(" & ");
        document.getElementById('price-discount-promo').innerText = "-" + formatRupiah(promoDeduction);
    } else {
        rowPromo.classList.add('hidden');
    }
    
    const rowStudent = document.getElementById('row-discount-student');
    if (discountStudent > 0) {
        rowStudent.classList.remove('hidden');
        document.getElementById('price-discount-student').innerText = "-" + formatRupiah(discountStudent);
    } else {
        rowStudent.classList.add('hidden');
    }

    // 6. UPDATE LINK WHATSAPP
    const locText = document.getElementById('location').options[document.getElementById('location').selectedIndex].text;
    const message = `Halo Admin CUCs Gaming, saya mau booking:\n\n` +
                    `🎮 Unit: ${consoleType.toUpperCase()}\n` +
                    `📅 Durasi: ${currentDays} Hari\n` +
                    `📍 Lokasi: ${locText}\n` +
                    `${isStudent ? '🎓 Status: Pelajar\n' : ''}\n` +
                    `💰 Estimasi: Rp ${formatRupiah(finalTotal)}`;
    document.getElementById('btn-wa-order').href = `https://wa.me/6282188966247?text=${encodeURIComponent(message)}`;
}

document.addEventListener('DOMContentLoaded', calculatePrice);
document.addEventListener("click", function(e) {
    const tooltips = document.querySelectorAll(".tooltip");
    tooltips.forEach(t => t.classList.remove("active"));
    if(e.target.classList.contains("tooltip-icon")){
        e.target.parentElement.classList.toggle("active");
        e.stopPropagation();
    }
});