// ===== JavaScript Block 1 ===== 

  {
    "imports": {
      "three": "https://unpkg.com/three@0.152.0/build/three.module.js",
      "three/examples/jsm/loaders/GLTFLoader": "https://unpkg.com/three@0.152.0/examples/jsm/loaders/GLTFLoader.js"
    }
  }


// ===== JavaScript Block 2 ===== 

  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
  
  // هذه الخطوة هي الأهم: تجعل المكتبة مرئية لكل الملفات الأخرى
  window.THREE = THREE;
  window.GLTFLoader = GLTFLoader; 
  console.log("✅ Three.js & GLTFLoader are now Global");


// ===== JavaScript Block 3 ===== 

// --- تعريف اتجاه الصفحة ---
const isRTL = document.documentElement.dir === 'rtl';

// --- الدالة الرئيسية (Main Entry) ---
function handleNavigation(e) {
    const key = e.key.toLowerCase();
    const activeEl = document.activeElement;

    // 1. إعادة التركيز إذا فُقد أو عند بدء التشغيل
    if (!activeEl || activeEl === document.body) {
        if (key === 'arrowdown' || key === 'enter') {
            const firstIcon = document.querySelector('nav .app-icon');
            if (firstIcon) setFocus(firstIcon);
            e.preventDefault();
            return;
        }
    }

    // 2. تصنيف العنصر النشط
    const inScrollList = activeEl.closest('.favorites-dashboard-horizontal-scroll, .scroll-viewport');
    // تحديد ما إذا كان العنصر عائماً (مثل أزرار التحكم السفلية)
    const isFloating = activeEl.closest('#bottom-left-controls, #floating-media-button, #floating-mic-button, #floating-minimized-video-button, #back-to-search-floating-button, #add-video-by-url-btn');

    // 3. توجيه المنطق
    if (isFloating) {
        handleFloatingNav(key, activeEl); // منطق الهروب من الأزرار العائمة
    } else if (inScrollList) {
        handleScrollListNav(key, activeEl); // منطق القوائم المنزلقة
    } else {
        // الملاحة المكانية الذكية لباقي العناصر
        handleSpatialNav(key, activeEl);
    }
}

// --- منطق الأزرار العائمة (Fixed Floating Buttons) ---
function handleFloatingNav(key, el) {
    if (key === 'arrowup') {
        // الهروب للمحتوى الرئيسي
        jumpToMainContent();
    } else if (key === 'arrowright') {
        // الهروب للقائمة الجانبية
        focusSidebar();
    } else if (key === 'arrowleft') {
        // التنقل بين الأزرار المجاورة
        handleSpatialNav(key, el); 
    } else if (key === 'enter' || key === 'ok') {
        el.click();
    }
}

// --- منطق القوائم المنزلقة (Scroll Lists) ---
function handleScrollListNav(key, el) {
    const container = el.parentElement;
    const items = Array.from(container.querySelectorAll('.grid-item'));
    const idx = items.indexOf(el);

    if (key === 'arrowright') { // RTL: السابق (لليمين)
        if (idx > 0) {
            setFocus(items[idx - 1]);
            container.scrollBy({ left: 200, behavior: 'smooth' });
        } else {
            focusSidebar(); // الخروج للقائمة
        }
    } else if (key === 'arrowleft') { // RTL: التالي (لليسار)
        if (idx < items.length - 1) {
            setFocus(items[idx + 1]);
            container.scrollBy({ left: -200, behavior: 'smooth' });
        }
    } else if (key === 'arrowup') {
        handleSpatialNav('up', el);
    } else if (key === 'arrowdown') {
        handleSpatialNav('down', el);
    } else if (key === 'enter' || key === 'ok') {
        el.click();
    }
}

// --- الملاحة المكانية الذكية (Spatial Navigation) ---
function handleSpatialNav(key, el) {
    const directionMap = {
        'arrowup': 'up', 'arrowdown': 'down',
        'arrowleft': 'left', 'arrowright': 'right',
        'enter': 'enter', 'ok': 'enter'
    };
    const direction = directionMap[key];
    if (!direction) return;

    if (direction === 'enter') {
        el.click();
        return;
    }

    const nextEl = findNextFocus(el, direction);

    if (nextEl) {
        setFocus(nextEl);
    } else {
        // منطق الحواف (Edge Cases)
        const inSidebar = el.closest('nav');
        // من السايدبار -> للمحتوى (يسار في العربية)
        if (inSidebar && direction === 'left') { 
             jumpToMainContent();
        }
        // من المحتوى -> للسايدبار (يمين في العربية)
        else if (!inSidebar && direction === 'right') {
            focusSidebar();
        }
    }
}

// --- خوارزمية البحث الهندسي (Geometric Search) ---
function findNextFocus(currentEl, direction) {
    const rect = currentEl.getBoundingClientRect();
    const currentCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };

    const allCandidates = Array.from(document.querySelectorAll('.navigable, .grid-item')).filter(el => {
        return el !== currentEl && el.offsetParent !== null && !el.closest('.hidden');
    });

    let bestCandidate = null;
    let minDistance = Infinity;

    allCandidates.forEach(candidate => {
        const cRect = candidate.getBoundingClientRect();
        const cCenter = {
            x: cRect.left + cRect.width / 2,
            y: cRect.top + cRect.height / 2
        };

        let isValid = false;
        // تسامح 20px لتعويض الفروقات البسيطة في المحاذاة
        switch (direction) {
            case 'up': isValid = cRect.bottom <= rect.top + 20; break;
            case 'down': isValid = cRect.top >= rect.bottom - 20; break;
            case 'left': isValid = cRect.right <= rect.left + 20; break;
            case 'right': isValid = cRect.left >= rect.right - 20; break;
        }

        if (isValid) {
            // حساب المسافة الإقليدية
            const dist = Math.sqrt(Math.pow(cCenter.x - currentCenter.x, 2) + Math.pow(cCenter.y - currentCenter.y, 2));
            
            // إضافة وزن للمحاذاة (تفضيل العناصر التي على نفس الخط)
            const alignmentBonus = (direction === 'up' || direction === 'down') 
                ? Math.abs(cCenter.x - currentCenter.x) 
                : Math.abs(cCenter.y - currentCenter.y);

            const totalScore = dist + (alignmentBonus * 2.5); 

            if (totalScore < minDistance) {
                minDistance = totalScore;
                bestCandidate = candidate;
            }
        }
    });

    return bestCandidate;
}

// --- دوال مساعدة ---
function jumpToMainContent() {
    const activeScreen = document.querySelector('.app-screen.active');
    if (!activeScreen) return;
    
    // البحث عن أول عنصر محتوى رئيسي
    const target = activeScreen.querySelector('.tab-content:not(.hidden) .grid-item') || 
                   activeScreen.querySelector('.dashboard-main-grid .grid-item') ||
                   activeScreen.querySelector('.grid-item');

    if (target) setFocus(target);
}

function focusSidebar() {
    const activeIcon = document.querySelector('nav .app-icon.active') || document.querySelector('nav .app-icon');
    if (activeIcon) setFocus(activeIcon);
}

function setFocus(el) {
    if (!el) return;
    document.querySelectorAll('.tv-focus').forEach(i => i.classList.remove('tv-focus'));
    el.classList.add('tv-focus');
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}









function handleHorizontalMapping(key, el) {
    const items = Array.from(el.parentElement.querySelectorAll('.grid-item'));
    const idx = items.indexOf(el);

    switch(key) {
        case 'arrowright': // Move Next
            if (idx < items.length - 1) {
                setFocus(items[idx + 1]);
                items[idx + 1].parentElement.scrollBy({ left: 250, behavior: 'smooth' });
            }
            break;
        case 'arrowleft': // Move Previous
            if (idx > 0) {
                setFocus(items[idx - 1]);
                items[idx - 1].parentElement.scrollBy({ left: -250, behavior: 'smooth' });
            } else {
                // Exit to Sidebar if at the start
                const sidebarIcon = document.querySelector('nav .app-icon.active');
                if (sidebarIcon) setFocus(sidebarIcon);
            }
            break;
        case 'arrowup': // Exit to Search Row
            const searchInput = document.getElementById('youtube-search-input');
            if (searchInput) setFocus(searchInput);
            break;
    }
}

function handleGridMapping(key, el) {
    const container = el.closest('.grid-container') || el.closest('.reader-container');
    if (!container) return;

   const currentScreen = el.closest('.app-screen');
    const items = Array.from(currentScreen.querySelectorAll('.navigable')).filter(i => i.offsetParent !== null);
    const idx = items.indexOf(el);

    if (key === 'arrowleft' && (idx === 0 || el.classList.contains('app-icon'))) {
        // العودة للتاب أو القائمة الجانبية
        const activeIcon = document.querySelector('nav .app-icon.active');
        setFocus(activeIcon);
        return;
    }


    switch(key) {
        case 'arrowright': if (idx % cols !== 0) setFocus(items[idx - 1]); break;
        case 'arrowleft': 
            if ((idx + 1) % cols === 0) {
                const sidebarIcon = document.querySelector('nav .app-icon.active');
                if (sidebarIcon) setFocus(sidebarIcon);
            } else if (idx < items.length - 1) {
                setFocus(items[idx + 1]);
            }
            break;
        case 'arrowup': if (idx >= cols) setFocus(items[idx - cols]); break;
        case 'arrowdown': if (idx + cols < items.length) setFocus(items[idx + cols]); break;
    }
}


    // 1. تحميل الإعدادات المخزنة أو استخدام الافتراضية
// قمنا بتوحيد اسم المتغير إلى savedTuner لمنع خطأ الـ ReferenceError
const savedTunerData = localStorage.getItem('custom_tuner_settings');
const savedTuner = savedTunerData ? JSON.parse(savedTunerData) : null;

window.tuner = savedTuner || { 
    zoom: 19.5, 
    tilt: 65, 
    scale: 1.02, 
    offset: 50 
};

// 2. دالة تعديل الحجم (Car Scale)
function adjustScale(amount) {
    // نضمن أننا نعدل القيمة الموجودة حالياً
    window.tuner.scale = Math.max(0.1, (window.tuner.scale || 0.75) + amount);
    
    // إرسال أمر تحديث للسيارة فوراً
    if (window.carOverlay) window.carOverlay.requestRedraw();
    console.log("📏 الحجم الجديد:", window.tuner.scale.toFixed(2));
}

// 3. دالة تعديل الميلان (Tilt) المربوطة بالأزرار ↑ ↓
function adjustTilt(amount) {
    if (!window.dashboardGoogleMap) return;
    
    let currentTilt = window.dashboardGoogleMap.getTilt();
    let newTilt = Math.min(Math.max(currentTilt + amount, 0), 75);
    
    // تطبيق التغيير على الخريطة فوراً
    window.dashboardGoogleMap.setTilt(newTilt);
    
    window.tuner.tilt = newTilt;
    console.log("📐 الميلان الجديد:", newTilt);
}

// 4. دالة الحفظ الموحدة (💾)
// حفظ الحالة الحالية كافتراضية للمتصفح
// 1. تحديث دالة الحفظ لإظهار القيم المحفوظة في رسالة
window.saveCurrentTuner = function() {
    if (!window.dashboardGoogleMap) return;
    
    // قنص القيم الحقيقية من الحالة الحالية للخريطة والموديل
    const currentZoom = window.dashboardGoogleMap.getZoom();
    const currentTilt = window.dashboardGoogleMap.getTilt();
    const currentScale = window.tuner.scale || 0.75;
    const currentOffset = window.tuner.offset || 40;

    // تحديث الكائن العالمي
    window.tuner.zoom = currentZoom;
    window.tuner.tilt = currentTilt;
    // السكيل والافسيت يتم تحديثهما لحظياً عبر أزرارهم بالفعل

    // الحفظ في ذاكرة المتصفح (الكاش)
    localStorage.setItem('custom_tuner_settings', JSON.stringify(window.tuner));
    
    // إنهاء وضع التعديل اليدوي لتعود الكاميرا للملاحقة التلقائية
    window.isUserAdjusting = false;

    // إظهار الرسالة المطلوبة بالقيم الحقيقية
    alert(`✅ تم حفظ إعدادات الثيم بنجاح!
-------------------------
🔍 مستوى الزوم: ${currentZoom.toFixed(2)}
📐 زاوية الميلان: ${currentTilt}°
🚗 حجم السيارة: ${currentScale.toFixed(2)}
↔️ الإزاحة الجانبية: ${currentOffset}px`);

    console.log("💾 Saved Settings:", window.tuner);
};

// 2. تحديث دالة الملاحقة لضمان استخدام القيم المحفوظة
window.updateGoogleMapLocation = function(pos) {
    if (!pos || !pos.coords || !window.dashboardGoogleMap) return;

    const { latitude: lat, longitude: lng, heading } = pos.coords;
    const currentHeading = heading || 0;

    window.appState.currentLocation = { lat, lng };
    window.appState.car.heading = currentHeading;

    const cameraOptions = {
        center: { lat, lng },
        heading: currentHeading,
        tilt: window.tuner.tilt // استخدام الميلان المحفوظ
    };

    // لا نغير الزوم إذا كان المستخدم يلمس الخريطة حالياً
    if (!window.isUserAdjusting) {
        cameraOptions.zoom = window.tuner.zoom; // استخدام الزوم المحفوظ
        window.dashboardGoogleMap.moveCamera(cameraOptions);
        window.dashboardGoogleMap.panBy(window.tuner.offset, 0);
    }

    if (window.carOverlay) window.carOverlay.requestRedraw();
};

// تعديل الميلان (Tilt)
window.adjustTilt = function(amount) {
    if (!window.dashboardGoogleMap) return;
    let newTilt = Math.min(Math.max(window.dashboardGoogleMap.getTilt() + amount, 0), 75);
    window.dashboardGoogleMap.setTilt(newTilt);
    window.tuner.tilt = newTilt;
};

// تعديل الحجم (Scale)
window.adjustScale = function(amount) {
    window.tuner.scale = Math.max(0.1, (window.tuner.scale || 0.75) + amount);
    if (window.carOverlay) window.carOverlay.requestRedraw();
};
    
    
        // 1. المتغيرات المركزية للتدوير
let carplayRotationIndex = 0;
let dashRotationIndex = 0;

// 2. مصفوفات المعرفات (تأكد أن هذه الـ IDs تطابق الموجود في الـ HTML لديك)
const carplaySlideIds = [
    'carplay-card-media', 
    'carplay-card-nasa',
    'carplay-card-weather'
];

const dashSlideIds = [
    'dash-card-media', 
    'dash-card-nasa', 
    'dash-card-weather',
    'dash-card-gregorian-date' // السطر الجديد المضاف هنا
];

// 3. المحرك الرئيسي للتحديث (يعمل كل ثانية)
function updateAllDisplays() {
    window.updateGregorianCard();
    const player = window.popupPlayer || window.player;
    const now = Date.now();

    // مزامنة البيانات للكل
    syncDataToElements(player);

    // تدوير كروت CarPlay كل 7 ثواني
    if (!window.lastCarplaySwap || (now - window.lastCarplaySwap > 7000)) {
        rotateSlidesSpecific('.carousel-slide', carplaySlideIds, 'carplay');
        window.lastCarplaySwap = now;
    }

    // تدوير كروت الداشبورد كل 7 ثواني
    if (!window.lastDashSwap || (now - window.lastDashSwap > 7000)) {
        rotateSlidesSpecific('.carousel-slide-dash', dashSlideIds, 'dash');
        window.lastDashSwap = now;
    }
}

window.updateGregorianCard = function() {
    // جلب العناصر والتأكد من وجودها
    const dayEl = document.getElementById('greg-day-num');
    const monthEl = document.getElementById('greg-month-name');
    
    // إذا لم يجد العناصر، يحاول البحث عنها مرة أخرى بعد ثانية (حل مشكلة التأخير)
    if (!dayEl || !monthEl) {
        console.warn("⚠️ لم يتم العثور على IDs التاريخ بعد، سيتم المحاولة مجدداً...");
        return; 
    }

    const today = new Date(); //
    
    // تنسيق البيانات
    const dayFormatter = new Intl.DateTimeFormat('en-SA', { day: 'numeric' }); //
    const monthFormatter = new Intl.DateTimeFormat('en-SA', { month: 'long' }); //
    
    const dayInArabic = dayFormatter.format(today); //
    const monthInArabic = monthFormatter.format(today); //
    
    // تحديث النصوص
    dayEl.innerText = dayInArabic; //
    monthEl.innerText = monthInArabic; //
    
    // تطبيق التنسيق الزجاجي
    Object.assign(dayEl.style, {
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #a1a1a1 100%)', //
        webkitBackgroundClip: 'text', //
        webkitTextFillColor: 'transparent', //
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', //
        fontWeight: '900' //
    });
};
// تحديث تلقائي كل ساعة لضمان دقة التاريخ عند منتصف الليل
// 4. دالة التدوير المحسنة لمنع التداخل
function rotateSlidesSpecific(selector, idArray, type) {
    let idx;
    if (type === 'carplay') {
        carplayRotationIndex = (carplayRotationIndex + 1) % idArray.length;
        idx = carplayRotationIndex;
    } else {
        dashRotationIndex = (dashRotationIndex + 1) % idArray.length;
        idx = dashRotationIndex;
    }

    const nextId = idArray[idx];
    
    // تحديث الكلاسات بصرياً
    document.querySelectorAll(selector).forEach(slide => {
        if (slide.id === nextId) {
            slide.classList.add('active');
            slide.classList.remove('hidden');
        } else {
            slide.classList.remove('active');
            // تأخير الإخفاء لضمان سلاسة الأنيميشن
            setTimeout(() => {
                if (!slide.classList.contains('active')) slide.classList.add('hidden');
            }, 600); 
        }
    });
}

// 5. دالة حقن البيانات الموحدة
function syncDataToElements(player) {
// 1. تحديد المشغل والعناصر
const activePlayer = window.popupPlayer || window.player || player; //
const dashTitleEl = document.getElementById('dash-media-title');
const dashThumbEl = document.getElementById('dash-media-thumb');

// 2. استخراج العنوان بأولوية ذكية
let finalTitle = "";
if (activePlayer && typeof activePlayer.getVideoData === 'function') {
    const vData = activePlayer.getVideoData();
    finalTitle = (vData && vData.title) ? vData.title : ""; //
}

// الحل البديل: إذا فشل المشغل، استخدم عنوان الصفحة (نفس منطق الكونسول الناجح)
if (!finalTitle || finalTitle === "جاري التحميل...") {
    finalTitle = document.title.split(' - YouTube')[0]; //
}

// 3. التحديث الفعلي للواجهة
if (dashTitleEl && finalTitle && finalTitle !== "" && finalTitle !== "جاري التحميل...") {
    dashTitleEl.textContent = finalTitle; //
    
    // تحديث الصورة
    if (dashThumbEl && activePlayer && typeof activePlayer.getVideoData === 'function') {
        const vData = activePlayer.getVideoData();
        if (vData.video_id) {
            dashThumbEl.src = `https://img.youtube.com/vi/${vData.video_id}/hqdefault.jpg`; //
        }
    }

    // 4. ضبط التحريك (Marquee)
    const container = document.getElementById('dash-media-title-container');
    if (container && dashTitleEl.scrollWidth > container.offsetWidth) {
        dashTitleEl.className = "text-lg font-black text-white animate-marquee whitespace-nowrap"; //
    } else {
        dashTitleEl.className = "text-lg font-black text-white line-clamp-2"; //
    }
}
    const now = new Date(); 
    const weather = appState.weather;
    const moon = appState.moonData;


    // أ. تحديث الميديا
    if (player && typeof player.getVideoData === 'function') {
        const vData = player.getVideoData();
        const thumbUrl = `https://img.youtube.com/vi/${vData.video_id}/hqdefault.jpg`;
        
        ['carplay', 'dash'].forEach(p => {
            const title = document.getElementById(`${p}-media-title`);
            const thumb = document.getElementById(`${p}-media-thumb`);
            if (title) title.textContent = vData.title;
            if (thumb) thumb.src = thumbUrl;
        });
    }

    // ب. تحديث الطقس والمقاييس
    if (weather) {
        ['carplay', 'dash'].forEach(p => {
            const tempBig = document.getElementById(`${p}-weather-temp-big`);
            const icon = document.getElementById(`${p}-weather-icon-big`);
            const tempMetric = document.getElementById(`${p}-metric-temp`);
            
            if (tempBig) tempBig.textContent = `${Math.round(weather.temperature)}°`;
            if (icon) icon.src = weather.iconUrl;
            if (tempMetric) tempMetric.textContent = `${Math.round(weather.temperature)}°C`;
        });
    }

    // ج. تحديث القمر (NASA)
    if (appState.dynamicMoonImageUrl) {
        ['carplay', 'dash'].forEach(p => {
            const img = document.getElementById(`${p}-nasa-moon`);
            const phaseTxt = document.getElementById(`${p}-moon-phase`);
            if (img) img.src = appState.dynamicMoonImageUrl;
            if (phaseTxt && moon) phaseTxt.textContent = `الإضاءة: ${moon.phase.toFixed(1)}%`;
        });
    }
}

// 6. تشغيل النظام
if (window.globalSyncInterval) clearInterval(window.globalSyncInterval);
window.globalSyncInterval = setInterval(updateAllDisplays, 1000);

window.isYouTubeApiReady = false;


// 1. الدالة التي يناديها اليوتيوب تلقائياً عند انتهاء التحميل
window.onYouTubeIframeAPIReady = function() {
    window.isYouTubeApiReady = true;
    console.log("✅ YouTube API is Ready.");
};

function playRandomSuggested() {
    // جلب القائمة المفلترة (بدون المكتملة)
    const availableVideos = filterWatchedVideos(window.suggestedVideos || []);
    
    if (availableVideos.length === 0) {
        console.log("كل الفيديوهات تمت مشاهدتها! جاري إعادة تصفير القائمة...");
        // اختياري: مسح قائمة المكتملة إذا انتهت الفيديوهات
        return;
    }

    const randomIndex = Math.floor(Math.random() * Math.min(availableVideos.length, 30));
    const selectedVideo = availableVideos[randomIndex];
    
    playYoutubeVideo(selectedVideo.id, selectedVideo.title);
}


function filterWatchedVideos(videoList) {
    // جلب قائمة الفيديوهات التي اكتملت مشاهدتها من الكاش المحلي
    const watchedData = JSON.parse(localStorage.getItem('youtube_watched_history') || '{}');
    
    // استبعاد الفيديوهات التي تم وسمها كـ "مكتملة" (مثلاً تجاوزت 95% من وقتها)
    // أو الفيديوهات الموجودة في قائمة 'completed'
    const completedVideos = JSON.parse(localStorage.getItem('completed_videos_ids') || '[]');

    return videoList.filter(video => {
        // لا تستبعد البث المباشر أبداً
        if (video.isLive) return true;
        
        // استبعاد إذا كان الفيديو في قائمة المكتملة
        return !completedVideos.includes(video.id);
    });
}

// 2. دالة لجلب المكتبة يدوياً إذا تأخرت
function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
        window.isYouTubeApiReady = true;
        return;
    }
    
    // فحص هل السكربت موجود مسبقاً في الصفحة؟
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        console.log("📥 Injecting YouTube API Script...");
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

// تشغيل التحميل فوراً عند بدء الموقع
loadYouTubeApi();

// ============================================================
// 1. SYSTEM HEADER: تعريف المفاتيح ونظام الفحص المباشر
// ============================================================

window.YT_KEYS_POOL = [
    "AIzaSyAjdVZ2Rodp6ZVEF1pZT195kAtGELolxSI", // 0
    "AIzaSyDULoFJLWNIO9hn0u8siLz-BzTi7eM-CX4",
    "AIzaSyBYThRM6tVnzgFgdHOUAN6DN8jQd54OKeg", // 1
    "AIzaSyB7QdfI0br5BfP71hOr36hz2dRWG_l0G8k", // 2
    "AIzaSyBdhcRo-EsvIduedQd-jFHfrEj9NeiP7pU", // 3
    "AIzaSyBLrMA6plsSZtqg2iY9Z1N1fJAHNmgGxos", // 4
    "AIzaSyCaqMPtn-egmEQk7XmTel--xsXV1Xbdp7o", // 5
    "AIzaSyDj4w1H3Is_rmTLhl40zER7AgYhT_tKASo", // 6
    "AIzaSyBYThRM6tVnzgFgdHOUAN6DN8jQd54OKeg", // 7
    "AIzaSyBeTHs25EsKeDFtIS5kq8iDATz-2c8hBrI", // 8
    "AIzaSyAjdVZ2Rodp6ZVEF1pZT195kAtGELolxSI"  // 9
];

window.YOUTUBE_API_KEY = null;
window.YOUTUBE_API_KEY2 = null;
window.isSystemReady = false; 
window.observer = null;

// تشغيل نظام الفحص التلقائي
(async function initLiveKeyScanner() {
    console.log("🚀 INITIALIZING: Scanning for valid keys...");
    
    // دالة اختبار سريعة
    const test = async (k) => {
        try { return (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id&id=Ks-_Mh1QhMc&key=${k}`)).status === 200; } 
        catch { return false; }
    };

    let found = 0;
    
    for (let i = 0; i < window.YT_KEYS_POOL.length; i++) {
        if (found >= 2) break;

        const isValid = await test(window.YT_KEYS_POOL[i]);
        
        if (isValid) {
            if (found === 0) {
                window.YOUTUBE_API_KEY = window.YT_KEYS_POOL[i];
                localStorage.setItem('yt_idx_1', i);
                console.log(`✅ Key 1 Assigned: Index ${i}`);
            } else {
                window.YOUTUBE_API_KEY2 = window.YT_KEYS_POOL[i];
                localStorage.setItem('yt_idx_2', i);
                console.log(`✅ Key 2 Assigned: Index ${i}`);
            }
            found++;
        }
    }
    
    if (found > 0) {
        window.isSystemReady = true;
        console.log("🟢 SYSTEM READY: Scan Complete.");

        // 🔥 التعديل هنا: تشغيل المقترحات فوراً بعد العثور على المفاتيح
        if (typeof populateYoutubeSuggestions === 'function') {
            console.log("🔄 Triggering Suggestions Refresh...");
            populateYoutubeSuggestions(); 
        }

        // 🔥 وأيضاً تشغيل مفضلة ناسا أو أي شيء يعتمد على المفاتيح
        if (typeof renderFavoritesDashboard === 'function') {
            renderFavoritesDashboard();
        }

    } else {
        alert("⚠️ Fatal Error: No valid API keys found in the pool!");
    }
})();

// بدلاً من كتابة HTML string، استخدم هذا الأسلوب داخل دالة render:
const parent = document.querySelector('.dashboard-main-grid'); // أو العنصر المحدد

// 1. إنشاء الزر
const btn = document.createElement('button');
btn.className = 'playlist-shuffle-btn navigable grid-item';
btn.innerHTML = `<svg ...>...</svg> تشغيل الكل`; // ضع الـ SVG هنا

// 2. تنسيق الموقع (أو استخدم CSS class)
Object.assign(btn.style, {
    position: 'absolute',
    bottom: '15px',
    left: '15px',
    zIndex: '9999',
    width: '9rem',
    height: '3rem',
    color:'transparent !important',
    background: 'transparent !important'
// مهم جداً
});

// 3. ربط الحدث مباشرة
btn.onclick = (e) => {
    console.log("Button Clicked!"); // للتجربة في الكونسول
    e.stopPropagation(); // منع انتقال النقر للعناصر الخلفية
    e.preventDefault();
    playAsShufflePlaylist();
};

// 4. الإضافة
parent.appendChild(btn);

        async function loadDashboardSuggestions() {
    const gridContainer = document.getElementById('favorites-popup-grid');
    if (!gridContainer) return;

    // إظهار مؤشر تحميل بسيط أو تنظيف الحاوية
    gridContainer.innerHTML = ''; 

    try {
        // جلب الفيديوهات من المصدر الجديد (الهجين: أحدث + أهم + بدون Shorts)
        const videos = await fetchSuggestedVideos();

        if (videos && videos.length > 0) {
            const html = videos.map(video => `
                <div class="simple-suggestion-card flex items-center gap-3 p-2 rounded-lg bg-white/10 cursor-pointer navigable grid-item" 
                     onclick="playSelectedVideo('${video.id}')" 
                     data-id="${video.id}">
                    <div class="video-thumbnail-wrapper" style="position: relative; width: 100%; height: 140px;">
                        <img src="${video.thumbnail}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                        <span class="video-duration-badge" style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.8); color: white; padding: 2px 5px; border-radius: 4px; font-size: 12px;">
                            ${video.duration}
                        </span>
                    </div>
                    <div class="video-info" style="margin-top: 8px; width: 100%;">
                        <div class="video-title" style="color: white; font-weight: bold; font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${video.title}
                        </div>
                        <div class="video-stats" style="color: #ccc; font-size: 12px; margin-top: 4px;">
                            ${video.viewsDisplay} • ${video.channelTitle}
                        </div>
                    </div>
                </div>
            `).join('');

            gridContainer.innerHTML = html;
            
            // إعادة تفعيل نظام التنقل (Navigable) إذا كنت تستخدم ريموت كنترول أو لوحة مفاتيح
            if (typeof initializeNavigable === 'function') initializeNavigable();
        } else {
            gridContainer.innerHTML = '<div style="color: white; padding: 20px;">لا توجد مقترحات حالياً</div>';
        }
    } catch (error) {
        console.error("Failed to load dashboard suggestions:", error);
    }
}


const CACHE_KEY = 'suggestedVideosCache';

async function initSuggestedDashboard() {
    console.log("🚀 Checking Cache for Dashboard...");

    // 1. محاولة قراءة الكاش
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedData) {
        // ✅ الحالة أ: الكاش موجود!
        console.log("📦 Cache FOUND! Loading from local storage...");
        
        // تحويل النص إلى مصفوفة
        const videos = JSON.parse(cachedData);
        
        // ⚡ تشغيل دالة الرسم فوراً (بدون استهلاك كوتا)
        renderSuggestedDashboard(videos);
        
        return; // توقف هنا، لا تكمل للأسفل (لا تطلب API)
    }

    // ❌ الحالة ب: الكاش غير موجود (أو تم مسحه)
    console.log("🌐 No Cache found. Fetching from API...");
    
    // جلب البيانات من النت
    const videos = await fetchVideosFromAPI(); // دالتك الخاصة بالجلب
    
    if (videos && videos.length > 0) {
        // 1. حفظ في الكاش للمرة القادمة
        localStorage.setItem(CACHE_KEY, JSON.stringify(videos));
        
        // 2. تشغيل دالة الرسم
        renderSuggestedDashboard(videos);
    }
}

const TARGET_ID = 'UCZPY2lpYyo6Y5mxk2CczJXg';
const UPDATE_HOURS = [7,10, 14,16, 18]; 
const NEW_JSONBIN_CHANNEL_IDS = '693fb33cae596e708f9ade6a';

// ✅ دالة الجلب الذكية (النسخة النهائية المستقرة)
async function fetchSafely(url, options = {}, retryCount = 0) {

    // 1. الانتظار حتى يصبح النظام جاهزاً (Scanning Complete)
    while (!window.isSystemReady && !window.YOUTUBE_API_KEY) {
        console.log("⏳ Waiting for Key Scanner...");
        await new Promise(r => setTimeout(r, 500)); // انتظر نصف ثانية
    }

    if (!window.YT_KEYS_POOL) return fetch(url, options);



    // 🛑 حماية: إيقاف الحلقة المفرغة بعد 4 محاولات
    if (retryCount > 4) {
        console.error("⛔ FetchSafely: Too many retries. Aborting.");
        return null;
    }

    try {
        const response = await fetch(url, options);

        // 403 = المفتاح احترق
        if (response.status === 403) {
            console.warn(`🔥 403 Error detected (Attempt ${retryCount + 1}/5)`);

            // 1. معرفة المفتاح المستخدم حالياً من الرابط
            const urlObj = new URL(url);
            const currentKeyInUrl = urlObj.searchParams.get('key');
            
            // 2. البحث عن ترتيبه في المصفوفة
            let failedIdx = window.YT_KEYS_POOL.indexOf(currentKeyInUrl);
            
            // إذا لم نجده، نعتمد على المتغيرات العامة
            if (failedIdx === -1) {
                // هل المفتاح الموجود في الرابط هو نفسه KEY1؟
                if (window.YOUTUBE_API_KEY && url.includes(window.YOUTUBE_API_KEY)) {
                    failedIdx = window.YT_KEYS_POOL.indexOf(window.YOUTUBE_API_KEY);
                } else {
                    failedIdx = 0; // افتراضي
                }
            }

            // 3. حساب المفتاح القادم
            let nextIdx = (failedIdx + 1) % window.YT_KEYS_POOL.length;
            
            // 4. قفز التصادم (تجنب استخدام مفتاح المتغير الآخر)
            const isVar1 = (window.YOUTUBE_API_KEY === window.YT_KEYS_POOL[failedIdx]);
            const otherIdx = parseInt(localStorage.getItem(isVar1 ? 'yt_idx_2' : 'yt_idx_1')) || (isVar1 ? 1 : 0);
            
            if (nextIdx === otherIdx) {
                nextIdx = (nextIdx + 1) % window.YT_KEYS_POOL.length;
            }

            // 5. تطبيق التغيير وحفظه
            const newKey = window.YT_KEYS_POOL[nextIdx];
            
            if (isVar1) {
                window.YOUTUBE_API_KEY = newKey;
                localStorage.setItem('yt_idx_1', nextIdx);
                console.log(`♻️ VAR 1 updated to Index ${nextIdx}`);
            } else {
                window.YOUTUBE_API_KEY2 = newKey;
                localStorage.setItem('yt_idx_2', nextIdx);
                console.log(`♻️ VAR 2 updated to Index ${nextIdx}`);
            }

            // 6. بناء الرابط الجديد (أهم خطوة لمنع التكرار)
            let newUrl = url;
            if (newUrl.includes('key=')) {
                // استبدال المفتاح القديم بالجديد بدقة
                newUrl = newUrl.replace(/key=[^&]+/, `key=${newKey}`);
            } else {
                const sep = newUrl.includes('?') ? '&' : '?';
                newUrl = `${newUrl}${sep}key=${newKey}`;
            }

            console.log(`🔄 Retrying with NEW Key (Index ${nextIdx})...`);
            
            // إعادة المحاولة بالرابط الجديد + زيادة العداد
            return fetchSafely(newUrl, options, retryCount + 1);
        }

        if (!response.ok && response.status !== 404) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

// ============================================================
// 🛠️ UNIVERSAL BOOKMARK MENU FIXER
// Target: #video-popup-bookmark-button
// ============================================================

function fixVideoPopupBookmarkMenu() {
    
    // 1. إضافة CSS إجباري لضمان ظهور القائمة فوق الفيديو
    const style = document.createElement('style');
    style.textContent = `
        /* تنسيق القائمة لتكون عائمة وحرة */
        .video-bookmark-dropdown-fixed {
            position: fixed !important; /* تثبيت بالنسبة للشاشة */
            z-index: 2147483647 !important; /* أعلى طبقة في المتصفح */
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 8px 0;
            min-width: 150px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            display: none; /* مخفية افتراضياً */
        }

        .video-bookmark-dropdown-fixed.show {
            display: block !important;
            animation: fadeInMenu 0.2s ease-out;
        }

        @keyframes fadeInMenu {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .video-bookmark-dropdown-fixed div {
            padding: 8px 15px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }

        .video-bookmark-dropdown-fixed div:hover {
            background: rgba(255,255,255,0.1);
            color: #4ade80; /* أخضر عند التحويم */
        }
    `;
    document.head.appendChild(style);

    // 2. المستمع العام للنقر (Event Delegation)
    document.addEventListener('click', function(e) {
        
        // أ. هل تم الضغط على الزر المحدد؟
        const btn = e.target.closest('#video-popup-bookmark-button');
        
        if (btn) {
            e.stopPropagation(); // منع إغلاق القائمة فوراً
            e.preventDefault();

            // ب. البحث عن القائمة (أو إنشاؤها إذا لم تكن موجودة)
            let menu = document.getElementById('global-video-bookmark-menu');
            
            if (!menu) {
                // إنشاء القائمة ديناميكياً لأول مرة
                menu = document.createElement('div');
                menu.id = 'global-video-bookmark-menu';
                menu.className = 'video-bookmark-dropdown-fixed';
                
                // محتوى القائمة (عدله حسب رغبتك)
                menu.innerHTML = `
                    <div onclick="saveToPlaylist('favorites')">❤️ Favorites</div>
                    <div onclick="saveToPlaylist('watch_later')">⏰ Watch Later</div>
                    <div onclick="saveToPlaylist('music')">🎵 Music</div>
                    <div style="border-top:1px solid #444; margin-top:5px; padding-top:8px; color:#aaa">Cancel</div>
                `;
                document.body.appendChild(menu); // نضعها في الـ Body مباشرة لتجنب القص
            }

            // ج. تبديل الظهور
            const isVisible = menu.classList.contains('show');
            
            // إغلاق أي قوائم أخرى
            closeAllMenus();

            if (!isVisible) {
                // د. الحساب الرياضي للموقع (Magic Positioning) 📐
                const rect = btn.getBoundingClientRect();
                
                // وضع القائمة أسفل الزر تماماً
                menu.style.top = (rect.bottom + 8) + 'px'; 
                
                // محاذاة لليسار، ولكن نتأكد أنها لا تخرج عن يمين الشاشة
                let leftPos = rect.left;
                if (leftPos + 150 > window.innerWidth) {
                    leftPos = window.innerWidth - 160; // إزاحة لليسار إذا كانت ستخرج
                }
                menu.style.left = leftPos + 'px';
                
                // إظهار القائمة
                menu.classList.add('show');
            }
        } 
        // هـ. إذا ضغطت خارج الزر والقائمة -> أغلق القائمة
        else if (!e.target.closest('#global-video-bookmark-menu')) {
            closeAllMenus();
        }
    });

    // دالة مساعدة لإغلاق القوائم
    function closeAllMenus() {
        const menu = document.getElementById('global-video-bookmark-menu');
        if (menu) menu.classList.remove('show');
    }
    
    // التعامل مع التمرير (Scroll) - نغلق القائمة إذا قام المستخدم بالتمرير
    window.addEventListener('scroll', closeAllMenus, true);
    window.addEventListener('resize', closeAllMenus);
}

// تشغيل الإصلاح
document.addEventListener('DOMContentLoaded', fixVideoPopupBookmarkMenu);

function shouldRefreshNow(lastTimestamp) {
    if (!lastTimestamp) return true;
    const lastUpdate = new Date(lastTimestamp);
    const now = new Date();
    for (let hour of UPDATE_HOURS) {
        let scheduledTime = new Date();
        scheduledTime.setHours(hour, 0, 0, 0);
        if (now >= scheduledTime && lastUpdate < scheduledTime) return true;
    }
    return false;
}
async function fetchSuggestedVideos() {
    const CACHE_KEY = 'suggestedVideosCache_Official_v3';
    const lastUpdate = localStorage.getItem('last_fetch_timestamp_official');
    const now = Date.now();
    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    // 1. فحص الكاش لتقليل استهلاك الـ API
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData && lastUpdate && (now - lastUpdate < FOUR_HOURS)) {
        console.log("♻️ جلب البيانات من الكاش...");
        return processSelection(JSON.parse(cachedData));
    }

    // 2. جلب قائمة الـ IDs من JSONBin (القنوات الـ 6)
    let channelIdsArray = [];
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${NEW_JSONBIN_CHANNEL_IDS}/latest`, {
            headers: { 'X-Access-Key': JSONBIN_ACCESS_KEY_CHANNELS }
        });
        const data = await res.json();
        channelIdsArray = Array.isArray(data.record) ? data.record.slice(0, 6) : [];
    } catch (e) {
        console.error("❌ فشل جلب القنوات من JSONBin:", e);
        if (cachedData) return processSelection(JSON.parse(cachedData));
        return [];
    }

    let allFetchedItems = [];

    // 3. حلقة الجلب لكل قناة بمنطق "الميديا" والفلترة المسبقة
    for (const channelId of channelIdsArray) {
        try {
            // أ- الحصول على معرف قائمة التحميلات الرسمي (Uploads)
            const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
            const channelData = await channelRes.json();
            const uploadsId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (uploadsId) {
                // ب- جلب 25 فيديو (لضمان وجود مساحة كافية لتخطي الـ Shorts)
                // أضفنا contentDetails لجلب المدة الزمنية مباشرة
                const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=25&key=${YOUTUBE_API_KEY}`;
                // يجب أن يحتوي الرابط على part=snippet,contentDetails
                const videosData = await fetch(videosUrl).then(r => r.json());

                if (videosData?.items) {
                    let validVideosFromThisChannel = 0;

                    for (const item of videosData.items) {
                        // حد أقصى 8 فيديوهات من كل قناة لضمان التنوع في الـ 30 فيديو الكلية
                        if (validVideosFromThisChannel >= 8) break;

                        const duration = item.contentDetails?.duration; // صيغة ISO 8601
                        const durationInSecs = parseDurationToSeconds(duration);

                        // 🛑 الشرط المطلوب: تخطي أي فيديو أقل من 180 ثانية (3 دقائق)
                        if (durationInSecs < 180) {
                            console.log(`⏩ تخطي فيديو قصير: ${item.snippet.title} (${durationInSecs}s)`);
                            continue; // ابحث في الفيديو التالي
                        }

                        // إذا اجتاز الشرط، يتم إضافته للمصفوفة
                        allFetchedItems.push({
                            id: item.snippet.resourceId.videoId,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.high?.url,
                            channelTitle: item.snippet.channelTitle,
                            channelId: channelId,
                            duration: duration, // نحفظ الصيغة لعرضها أو لفلترة إضافية
                            isLive: false
                        });
                        validVideosFromThisChannel++;
                    }
                }
            }

            // ج- جلب البث المباشر الحالي (إن وجد) - المباشر دائماً مقبول
            const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${YOUTUBE_API_KEY}`;
            const liveData = await fetch(liveUrl).then(r => r.json());
            if (liveData?.items) {
                liveData.items.forEach(item => {
                    allFetchedItems.push({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.medium?.url,
                        channelTitle: item.snippet.channelTitle,
                        channelId: channelId,
                        isLive: true,
                        duration: "LIVE"
                    });
                });
            }

        } catch (err) {
            console.error(`⚠️ خطأ في معالجة القناة ${channelId}:`, err);
        }
    }

    // 4. التخزين النهائي في الكاش
    if (allFetchedItems.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(allFetchedItems));
        localStorage.setItem('last_fetch_timestamp_official', Date.now().toString());
    }

    // 5. إرسال النتائج إلى دالة الاختيار (2 مثبت + 12 عشوائي)
    return processSelection(allFetchedItems);
}
// دالة تطبيق مبدأ 2 من القناة المختارة + 12 عشوائي (المجموع 14)
function processSelection(allVideos) {
    // 1. فلترة الفيديوهات التي تمت مشاهدتها بالكامل (Completed)
    const completedVideos = JSON.parse(localStorage.getItem('completed_videos_ids') || '[]');
    const available = allVideos.filter(v => !completedVideos.includes(v.id));

    // 2. اختيار أول فيديوهين من القناة المفضلة بشرط (المدة > 5 دقائق)
    const priorityPool = available.filter(v => {
        if (v.channelId !== TARGET_ID) return false;
        const durationInSecs = parseDurationToSeconds(v.duration || "00:00");
        return v.isLive || durationInSecs > 300; 
    }).sort(() => 0.5 - Math.random()); // خلط داخل القناة المفضلة لجلب فيديوهات مختلفة في كل مرة

    // استخراج أول فيديوهين مثبتين
    const fixedTwo = priorityPool.slice(0, 2);

    // 3. تجهيز "خزانات" لكل قناة من القنوات الـ 5 الأخرى للتناوب
    const otherChannelIds = [...new Set(available.map(v => v.channelId))].filter(id => id !== TARGET_ID);
    
    const pools = {};
    // إضافة القناة المفضلة للمداورة (بقية فيديوهاتها بعد أول 2)
    pools[TARGET_ID] = priorityPool.slice(2); 
    
    // إضافة بقية القنوات
    otherChannelIds.forEach(id => {
        pools[id] = available.filter(v => v.channelId === id).sort(() => 0.5 - Math.random());
    });

    // مصفوفة الترتيب (المفضلة ثم القنوات الأخرى بالترتيب)
    const rotationOrder = [TARGET_ID, ...otherChannelIds];

    // 4. بناء القائمة النهائية (الترتيب التناوبي)
    let finalSelection = [...fixedTwo]; // نبدأ بالاثنين المثبتين
    
    let poolPointer = 0;
    let safetyCounter = 0;

    // استكمال العدد لـ 14 كرت بالتناوب
    while (finalSelection.length < 14 && safetyCounter < 100) {
        const currentChannelId = rotationOrder[poolPointer % rotationOrder.length];
        const currentPool = pools[currentChannelId];

        if (currentPool && currentPool.length > 0) {
            const video = currentPool.shift();
            // التأكد من عدم تكرار الفيديوهات المثبتة
            if (!finalSelection.find(v => v.id === video.id)) {
                finalSelection.push(video);
            }
        }

        poolPointer++;
        safetyCounter++;
        
        // إذا فرغت كل الخزانات، اخرج
        const totalRemaining = Object.values(pools).reduce((acc, curr) => acc + curr.length, 0);
        if (totalRemaining === 0) break;
    }

    // تخزين القائمة الكاملة المفلترة للتشغيل التلقائي (Shuffle)
    window.allFetchedVideos30 = available; 
    
    console.log("✅ تم الترتيب التناوبي: 2 مفضلة + البقية بالتناوب بين القنوات");
    return finalSelection;
}

function playAsShufflePlaylist() {
    const btn = document.querySelector('.playlist-shuffle-btn') || document.getElementById('popup-shuffle-btn');
    
    if (window.isAutoPlayMode) {
        // إيقاف التشغيل التلقائي
        window.isAutoPlayMode = false;
        if (btn) {
            btn.innerHTML = `<i data-lucide="shuffle"></i> تشغيل الكل (Playlist)`;
            btn.style.background = "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)";
        }
    } else {
        // 🛑 الجزء المهم: جلب الفيديوهات غير المكتملة فقط من المخزن (window.allFetchedVideos30)
        // الذي تم تعبئته وتصفيته داخل دالة processSelection
        let availableVideos = window.allFetchedVideos30 || [];

        if (availableVideos.length === 0) {
            showMessageBox("لقد شاهدت جميع الفيديوهات المتاحة! قم بمسح سجل المشاهدة لإعادة البدء.");
            return;
        }

        window.isAutoPlayMode = true;
        
        // خلط القائمة المفلترة عشوائياً
        window.currentSuggestedVideos = [...availableVideos].sort(() => 0.5 - Math.random());

        if (btn) {
            btn.innerHTML = `<i data-lucide="square"></i> إيقاف التشغيل التلقائي`;
            btn.style.background = "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)";
        }

        // تشغيل أول فيديو من القائمة المفلترة
        const firstVideo = window.currentSuggestedVideos[0];
        showVideoPopup(firstVideo.id, 0);
    }
    if (window.lucide) lucide.createIcons();
}

function parseISO8601ToSeconds(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
}

function renderSuggestedDashboard(videosInput = null) {
    const container = document.getElementById('suggested-d-dashboard-container');
    if (!container) return;

    // 1. تحديد مصدر البيانات
    let list = videosInput;
    if (!list) {
        const cached = localStorage.getItem('suggestedVideosCache');
        if (cached) {
            try { list = JSON.parse(cached); } catch (e) { list = []; }
        }
    }
    
    if (!list && typeof suggestedVideos !== 'undefined') {
        list = suggestedVideos;
    }

    const finalDisplayList = (list && list.length > 0) ? list.slice(0, 20) : [];

    // 2. إعداد المغلف لزر التشغيل
    let parentWrapper = document.getElementById('suggested-dashboard-wrapper');
    if (!parentWrapper) {
        parentWrapper = document.createElement('div');
        parentWrapper.id = 'suggested-dashboard-wrapper';
        parentWrapper.style.position = 'relative';
        parentWrapper.style.width = '100%';
        container.parentNode.insertBefore(parentWrapper, container);
        parentWrapper.appendChild(container);
    }

    // تنظيف المحتوى القديم
    container.innerHTML = ''; 
    const oldBtn = parentWrapper.querySelector('.playlist-shuffle-btn');
    if (oldBtn) oldBtn.remove();

    // 3. معالجة حالة عدم وجود بيانات
    if (finalDisplayList.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-4 w-full">لا توجد مقترحات حاليًا.</p>';
        return;
    }
    
    // 4. إضافة زر "تشغيل الكل" (نفس الهيكل السابق)
    const shuffleBtn = document.createElement('button');
    shuffleBtn.id = 'custom-shuffle-play-btn';
    shuffleBtn.className = 'playlist-shuffle-btn navigable grid-item';
    shuffleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-12.6c.8-1 1.9-1.7 3.1-1.7H22"></path>
            <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l3.2 2.9"></path>
            <path d="M22 18h-2.1c-1.3 0-2.5-.6-3.3-1.7L14.9 14.6"></path>
            <polyline points="18 6 22 2 18 2"></polyline>
            <polyline points="18 18 22 22 18 22"></polyline>
        </svg>
        <span>تشغيل الكل</span>`;

    shuffleBtn.onclick = (e) => {
        e.stopPropagation();
        if (typeof playAsShufflePlaylist === 'function') playAsShufflePlaylist(finalDisplayList);
    };
    parentWrapper.appendChild(shuffleBtn);

    // 5. بناء الكروت (بالهيكل القديم المباشر)
    const fragment = document.createDocumentFragment(); 

  finalDisplayList.forEach(video => {
        const card = document.createElement('div');
        // ✅ الحفاظ على الكلاسات القديمة ليتعرف عليها الـ CSS الخاص بك
        card.className = 'suggested-d-dashboard-card navigable grid-item p-2'; 
        card.tabIndex = 0; 
        
        card.innerHTML = `
            <div style="position:relative; width:100%;">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                
                <button id="dash-bk-${video.id}" 
                        class="dashboard-only-bookmark navigable grid-item" 
                        tabindex="0">
                    <i data-lucide="bookmark"></i>
                </button>
            </div>

            <div class="video-details flex-grow-1"> 
                <h6 class="mb-0 text-truncate">${video.title}</h6>
                <p class="mb-1 text-muted small">${video.channelTitle}</p>
            </div>
            <div class="flex flex-col flex-grow min-w-0 h-full justify-between ml-2"></div>
        `;
        
        // 1. ربط الزر الجديد بقائمة المفضلة (Car/TV)
        const bookmarkBtn = card.querySelector(`#dash-bk-${video.id}`);
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // منع تشغيل الفيديو
            if (typeof showFavoritesMenu === 'function') {
                showFavoritesMenu(bookmarkBtn, video);
            }
        });

        // 2. النقر على الكارت يشغل الفيديو (بشرط عدم النقر على زر الحفظ)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.dashboard-only-bookmark')) {
                window.isAutoPlayMode = false;
                showVideoPopup(video.id); 
            }
        });

        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);

    // 6. التحديث النهائي
    if (window.lucide) lucide.createIcons();
    if (typeof updateNavigableElements === 'function') updateNavigableElements();
}

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

function startVoiceToText() {
    // 1. التحقق من الدعم
    if (!SpeechRecognition) {
        showMessageBox("عذراً، البحث الصوتي غير مدعوم في هذا المتصفح.");
        return;
    }
    
    // 🛑 الخطوة الأولى: تفعيل الكتابة (جعل حقل البحث قابلاً للكتابة)
    youtubeSearchInput.readOnly = false;
    // تحديث حالة زر لوحة المفاتيح المرئي (للتزامن البصري)
    floatingKeyboardButton?.classList.add('active-keyboard');
    floatingKeyboardButton?.classList.remove('inactive-keyboard');

    // 2. تهيئة الكائن (إذا لم يكن مهيئاً)
    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.lang = 'ar-SA';     
        recognition.interimResults = false; 
    }
    
    // 3. معالجة النتائج
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            // 🛑 الخطوة الرابعة: كتابة النص في الحقل
            youtubeSearchInput.value = transcript.trim();
            youtubeSearchInput.focus();
            
            // 💡 اختيارياً: تشغيل البحث تلقائياً
            // youtubeSearchButton.click();
        }
    };

    // 4. معالجة الأخطاء والتوقف (لإعادة تعيين الحالة)
    recognition.onerror = (event) => {
        floatingMicButton?.classList.remove('recording');
        // 🛑 إعادة تعيين حالة لوحة المفاتيح إذا فشل التسجيل
        youtubeSearchInput.readOnly = true; 
        floatingKeyboardButton?.classList.add('inactive-keyboard');
        floatingKeyboardButton?.classList.remove('active-keyboard');
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
             showMessageBox("الوصول إلى الميكروفون مرفوض. يرجى مراجعة إعدادات الموقع.");
        }
    };
    
    // 5. إدارة حالة الواجهة المرئية
    recognition.onstart = () => {
        floatingMicButton?.classList.add('recording');
        showMessageBox("🎤 استمع الآن...");
    };

    recognition.onend = () => {
        floatingMicButton?.classList.remove('recording');
        showMessageBox("✅ تم الانتهاء من الاستماع.");
        
        // 🛑 الخطوة الخامسة: بعد الانتهاء من الإدخال، نعود لوضع القراءة فقط (للحماية)
        // إذا كنت تفضل ترك الوضع مفتوحاً للكتابة اليدوية بعد الصوت، قم بإزالة الأسطر أدناه
        // youtubeSearchInput.readOnly = true; 
        // floatingKeyboardButton?.classList.add('inactive-keyboard'); 
        
        updateNavigableElements(); 
    };

    // 6. البدء
    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition already started or permission denied.", e);
        if (floatingMicButton?.classList.contains('recording')) {
            recognition.stop();
        }
    }
}



function playSpeechAnnouncement(message) {
    if (!('speechSynthesis' in window) || !message) {
        console.warn("TTS not supported or message is empty.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    
    // محاولة العثور على صوت عربي ذكر (لجودة أفضل)
    let arabicVoice = voices.find(voice => voice.lang.startsWith('ar') && (voice.name.includes('male') || voice.name.includes('Arabic')));
    
    if (arabicVoice) {
        utterance.voice = arabicVoice;
    } else {
        arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;
    }
    
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0; 
    
    window.speechSynthesis.speak(utterance);
}




// 💡 يجب أن تكون هذه المصفوفة مُعرَّفة عالمياً في بداية الكود
const PLAYBACK_RATES = [1.0, 1.25, 1.5, 1.65]; // يمكنك استخدام 1.65 بدلاً من 2.0 إذا أردت

/**
 * FINAL: Sets the playback rate to a specific value based on the selected rate.
 * This is called directly by the individual speed buttons (1.0x, 1.25x, etc.).
 * * @param {string} rateValue - The rate string (e.g., "1.25").
 */
function setSpecificPlaybackRate(rateValue) {
    if (!popupPlayer || typeof popupPlayer.setPlaybackRate !== 'function') return; // التحقق من وجود المشغل

    const rate = parseFloat(rateValue);

    if (PLAYBACK_RATES.includes(rate)) {
        popupPlayer.setPlaybackRate(rate);
        
        // نعتمد على مستمع onPlaybackRateChange لتحديث UI
        // (يمكن استدعاء updateMinimizedControlsState() هنا أيضاً كإجراء احتياطي)
        updateMinimizedControlsState(); 
    }
}

/**
 * Toggles the playback rate to the next speed in the defined sequence 
 * (نستخدمها لربط الزر الدائري في الكبسولة إذا أردت التبديل بزر واحد).
 */
function togglePlaybackRate() {
    if (!popupPlayer || typeof popupPlayer.getPlaybackRate !== 'function') return;

    const currentRate = popupPlayer.getPlaybackRate();
    const currentRateFixed = parseFloat(currentRate.toFixed(2));

    const currentIndex = PLAYBACK_RATES.indexOf(currentRateFixed);
    
    const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % PLAYBACK_RATES.length;
    const nextRate = PLAYBACK_RATES[nextIndex];
    
    popupPlayer.setPlaybackRate(nextRate);
    updateMinimizedControlsState(); 
}

/**
 * Event handler that fires when YouTube player confirms the playback rate has changed.
 */
function handlePlaybackRateChange(event) {
    // يجب استدعاء هذه الدالة عندما يتغير المشغل السرعة (مربوطة في showVideoPopup)
    updateMinimizedControlsState(); 
}
        // --- المتغيرات العامة لتتبع حالة المؤقتات (يجب أن تُضاف في بداية الكود) ---
let weatherIntervalId = null;       // 5 دقائق (للطقس)
let clockIntervalId = null;         // 1 ثانية (للساعة)
let timerDisplayIntervalId = null;  // 2 ثانية (للعد التنازلي للصلاة)
let nextPrayerIntervalId = null;    // 1 دقيقة (لتحديد الصلاة القادمة)
let carSimulationIntervalId = null; // 2 ثانية (لمحاكاة السيارة/الاتجاه)
let fullDateIntervalId = null;      // 6 مليون مللي ثانية (لتحديث التاريخ)
let trafficIntervalId = null; 

function startTrafficUpdates() {
    if (trafficIntervalId === null) {
        // 🛑 التشغيل الفوري عند فتح Dashboard
        updateTrafficIndicators(); 
        // 🛑 المؤقت البطيء للتحديث الدوري
        trafficIntervalId = setInterval(updateTrafficIndicators, 600000); // كل 10 دقائق
    }
}
function stopTrafficUpdates() {
    if (trafficIntervalId !== null) {
        clearInterval(trafficIntervalId);
        trafficIntervalId = null;
    }
}


function startWeatherUpdates() {
    if (weatherIntervalId === null) {
        // نُشغِّل الجلب الأولي أولاً
        fetchWeatherData();
        // 🛑 ثم نُنشئ المؤقت
        weatherIntervalId = setInterval(fetchWeatherData, 300000); // كل 5 دقائق
    }
}
function stopWeatherUpdates() {
    if (weatherIntervalId !== null) {
        clearInterval(weatherIntervalId);
        weatherIntervalId = null;
    }
}

function startCarSimulation() {
    if (carSimulationIntervalId === null) {
        carSimulationIntervalId = setInterval(simulateOtherCarData, 2000); // كل 2 ثانية
    }
}
function stopCarSimulation() {
    if (carSimulationIntervalId !== null) {
        clearInterval(carSimulationIntervalId);
        carSimulationIntervalId = null;
    }
}

function startClockAndTimer() {
    if (clockIntervalId === null) {
        clockIntervalId = setInterval(updateDigitalClock, 1000); // تحديث الساعة كل 1 ثانية
    }
    if (timerDisplayIntervalId === null) {
        timerDisplayIntervalId = setInterval(updateTimerDisplay, 1000); // تحديث عداد الصلاة كل 2 ثانية
    }
}
function stopClockAndTimer() {
    if (clockIntervalId !== null) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
    if (timerDisplayIntervalId !== null) {
        clearInterval(timerDisplayIntervalId);
        timerDisplayIntervalId = null;
    }
}

// --- دوال التحكم للمؤقتات البطيئة (التي كانت تعمل بـ setInterval) ---
function startNextPrayerDetermination() {
    if (nextPrayerIntervalId === null) {
        determineNextPrayer(); // تشغيل فوري
        nextPrayerIntervalId = setInterval(determineNextPrayer, 60000); // كل 1 دقيقة
    }
}
function stopNextPrayerDetermination() {
    if (nextPrayerIntervalId !== null) {
        clearInterval(nextPrayerIntervalId);
        nextPrayerIntervalId = null;
    }
}
function startFullDateUpdates() {
    if (fullDateIntervalId === null) {
        updateFullDateWidget(); // تشغيل فوري
        fullDateIntervalId = setInterval(updateFullDateWidget, 6000000); // كل 100 دقيقة
    }
}
// لا نحتاج لـ stopFullDateUpdates حيث أنها تعمل ببطء شديد
function switchApp(appName) {
    // 1. الإيقاف العام لجميع المؤقتات (Clean Slate)
    stopClockAndTimer();
    stopCarSimulation();
    stopWeatherUpdates(); 
    stopDashboardLocationTracking();

    // 2. تحديث الشاشة النشطة
    const newIndex = appOrder.indexOf(appName);
    if (newIndex === -1) return;
    currentAppIndex = newIndex;
    
    // تحديث الفئات المرئية للشاشات والأيقونات
    appScreens.forEach(s => s.classList.remove('active'));
    sidebarIcons.forEach(i => i.classList.remove('active'));
    
    const screen = document.getElementById(`screen-${appName}`);
    if (screen) screen.classList.add('active');
    
    const icon = document.querySelector(`.app-icon[data-app="${appName}"]`);
    if (icon) icon.classList.add('active');

    // 🚀 3. الجزء الجديد: التحكم الذكي في ظهور العناصر (Logic-Based UI)
    // نقوم بتحديث الـ class الخاص بالجسم للتحكم في العناصر عبر CSS
    document.body.className = `animated-bg text-white overflow-hidden theme-gradient-1 app-${appName}-active`;
    
    // إضافة وسم إضافي إذا كان المشغل مصغراً للحفاظ على تناسق التصميم
    if (appState.isVideoPlayerMinimized) {
        document.body.classList.add('video-minimized');
    }

    // 4. التشغيل الشرطي للمؤقتات (Conditional Start)

    // A. منطق شاشة Dashboard
    if (appName === 'Dashboard') {
        startClockAndTimer();       // 1s
        startWeatherUpdates();      // 5m
        startDashboardLocationTracking();
        updateTimerDisplay(); 
        renderFavoritesDashboard();
       
        setTimeout(() => {
            if (dashboardGoogleMap) {
                google.maps.event.trigger(dashboardGoogleMap, 'resize');
               
                if (appState.currentLocation) {
                     dashboardGoogleMap.setCenter(appState.currentLocation);
                     const numericHeading = directionToDegrees(appState.car.direction);
                    dashboardGoogleMap.setHeading(numericHeading);
                }
            }
            updateTrafficIndicators(); 
        }, 0); 
    }
    
    // B. منطق شاشة 3D (Map)
    if (appName === 'Map') {
        startCarSimulation(); 
        startWeatherUpdates();
        startDashboardLocationTracking();
    } 
    
    // C. منطق شاشة Weather
    if (appName === 'Weather') {
        startWeatherUpdates();
    }
    
   // ... (باقي كود switchApp في الأعلى) ...

    const activeScreen = document.getElementById(`screen-${appName}`);
    
    if (activeScreen) {
        if (typeof updateNavigableElements === 'function') updateNavigableElements();
        
        setTimeout(() => {
            let firstItem;

            if (appName === 'Media') {
                // 🛑 1. استهداف "الكروت" تحديداً (باستخدام كلاس البطاقة وليس grid-item العام)
                firstItem = activeScreen.querySelector('.youtube-reader-card');

                // 🛑 2. إذا لم نجد كروت، نذهب للتاب النشط (مثلاً "القراء")
                if (!firstItem) {
                    firstItem = activeScreen.querySelector('.tab-button.active');
                }

                // 🛑 3. حماية إضافية: إذا كان العنصر المختار هو زر التكبير، تجاهله وابحث عن غيره
                if (firstItem && firstItem.id === 'fullscreen-screen-Media-btn') {
                    // ابحث عن أول عنصر في الشاشة ليس هو زر التكبير
                    const allItems = Array.from(activeScreen.querySelectorAll('.navigable, .grid-item'));
                    firstItem = allItems.find(el => el.id !== 'fullscreen-screen-Media-btn' && el.offsetParent !== null);
                }

            } else {
                // الوضع الطبيعي لباقي الشاشات
                firstItem = activeScreen.querySelector('.grid-item, .navigable');
            }

            // تنفيذ التركيز
            if (firstItem) setFocus(firstItem);
            
        }, 250); // وقت كافٍ لضمان تحميل القائمة
    }
}
        /**
 * Toggles a section element between its normal state and fullscreen mode.
 * * @param {string} sectionId - The ID of the section element (e.g., 'screen-Dashboard').
 */
/**
 * Function 2: Toggles fullscreen mode specifically for an IFRAME element.
 * (This function is generic and will work on 'reciters-iframe')
 * @param {string} targetId - The ID of the IFRAME element.
 */
/**
 * Converts a 24-hour time string (HH:MM) to a 12-hour time string (H:MM ص/م).
 *
 * @param {string} time24h - Time in 24-hour format (e.g., "15:36").
 * @returns {string} Time in 12-hour format with 'ص' or 'م' (e.g., "3:36 م").
 */
function convertTo12HourWithAmPm(time24h) {
    if (!time24h || typeof time24h !== 'string' || time24h === '--:--') {
        return time24h; 
    }

    // Split the time string into hours and minutes
    const [hours24, minutes] = time24h.split(':').map(str => parseInt(str, 10));
    
    // Determine AM/PM (ص/م)
    const suffix = hours24 >= 12 ? 'م' : 'ص';
    
    // Convert to 12-hour format (0 = 12 AM, 13 = 1 PM)
    let hours12 = hours24 % 12;
    hours12 = hours12 ? hours12 : 12; // The hour '0' (midnight) should be '12'

    // Return the formatted string
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}
// -------------------------------------------------------------
// --- NEW updateTimerDisplay function ---
// -------------------------------------------------------------
/**
 * UPDATED: Updates the digital clock countdown/count-up display separately.
 * Runs every 2 seconds ONLY IF THE VIDEO POPUP IS NOT ACTIVE.
 */

/**
 * NEW: Updates the directional buttons (the compass) to highlight the current direction.
 * This is called immediately after appState.car.direction is updated.
 */
function updateDirectionButtons() {
    const controlsContainer = document.getElementById('direction-controls-3d');
    if (!controlsContainer) return;

    const currentDir = appState.car.direction; // N, NE, E, SE, S, SW, W, NW, or '--'
    const buttons = controlsContainer.querySelectorAll('button');

    // 1. إزالة حالة النشاط من جميع الأزرار
    buttons.forEach(btn => btn.classList.remove('active-direction'));

    if (currentDir === '--') return;

    // 2. تطبيق حالة النشاط على الزر الموافق للاتجاه الحالي
    buttons.forEach(btn => {
        if (btn.textContent.trim() === currentDir) {
            btn.classList.add('active-direction');
        }
    });
}

/**
 * UPDATED: Updates the digital clock countdown/count-up display separately.
 * CRITICAL FIX: Countdown to Azan is now hidden unless it's within 20 minutes of the prayer time.
 */
function updateTimerDisplay() {
    // 🛑 الشرط الحاسم: إذا كان المشغل المنبثق نشطاً، قم بالخروج فوراً لتجنب التقطيع
    if (videoPopupContainer.classList.contains('active')) {
        return;
    }
    
    const now = new Date();
    
    // تأكد من أن determineNextPrayer قد عملت مرة واحدة على الأقل
    if (!appState.prayerTimes.nextPrayerIqamaTime) {
        digitalDateLine1.textContent = ''; // مسح المحتوى إذا لم يتم التهيئة
        digitalDateLine2.textContent = '';
        return;
    }

    // إعادة تعيين أنماط الألوان قبل التحديث
    digitalDateLine1.classList.remove('countdown-azan', 'countdown-iqama', 'countdown-up');
    digitalDateLine2.classList.remove('countdown-azan', 'countdown-iqama', 'countdown-up');

    // 1. Logic for COUNT UP (after Iqama)
    if (appState.prayerTimes.currentPrayer && appState.prayerTimes.currentPrayerIqamaTime && now > appState.prayerTimes.currentPrayerIqamaTime) {
        const diffUp = now - appState.prayerTimes.currentPrayerIqamaTime;
        const upSecs = Math.floor(diffUp / 1000);
        const secs = upSecs % 60;
        const mins = Math.floor(upSecs / 60);

        digitalDateLine1.textContent = `انتهت اقامة الصلاة ${appState.prayerTimes.currentPrayer} منذ:`;
        digitalDateLine2.textContent = `+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        digitalDateLine1.classList.add('countdown-up');
        digitalDateLine2.classList.add('countdown-up');
        return;
    }

    // 2. Logic for COUNT DOWN (to Azan or Iqama)
    const diff = appState.prayerTimes.nextPrayerIqamaTime - now;
    const totalSecs = Math.floor(diff / 1000);
    
    // 🛑 شرط الإخفاء الجديد: إذا كان الوقت المتبقي أكبر من 20 دقيقة (1200 ثانية)
    const MAX_COUNTDOWN_SECS = 10 * 60; 

    if (totalSecs > MAX_COUNTDOWN_SECS && appState.prayerTimes.currentPrayer !== appState.prayerTimes.nextPrayer) {
        // إذا كان العد التنازلي للأذان وأكثر من 20 دقيقة، قم بالإخفاء
        digitalDateLine1.textContent = `الأذان القادم: ${appState.prayerTimes.nextPrayer}`;
        digitalDateLine2.textContent = appState.prayerTimes.nextPrayerIqamaTime.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true }); 
        
        // 💡 عرض الوقت الفعلي للأذان بدلاً من العد التنازلي عندما يكون بعيداً
        // يمكننا هنا اختيار عرض الوقت بدلاً من إظهار "متبقي X ساعة"
        digitalDateLine1.classList.remove('countdown-azan');
        digitalDateLine2.classList.remove('countdown-azan');

        return; // الخروج وعدم عرض العد التنازلي بالثواني
    }

    // المنطق يستمر فقط إذا كان الوقت المتبقي <= 20 دقيقة أو عد تنازلي للإقامة
    if (totalSecs >= 0) {
        const secs = totalSecs % 60;
        const mins = Math.floor((totalSecs / 60) % 60);
        const hrs = Math.floor(totalSecs / 3600);
        
        const isCountdownToIqama = (appState.prayerTimes.currentPrayer === appState.prayerTimes.nextPrayer);

        if (isCountdownToIqama) {
            // العد التنازلي للإقامة (في وقت الصلاة)
            digitalDateLine1.textContent = `إقامة صلاة ${appState.prayerTimes.currentPrayer} في:`;
            digitalDateLine2.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            digitalDateLine1.classList.add('countdown-iqama');
            digitalDateLine2.classList.add('countdown-iqama');
        } else {
            // العد التنازلي للأذان (الآن داخل نطاق الـ 20 دقيقة)
            digitalDateLine1.textContent = `الأذان القادم: ${appState.prayerTimes.nextPrayer}`;
            digitalDateLine2.textContent = hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            digitalDateLine1.classList.add('countdown-azan');
            digitalDateLine2.classList.add('countdown-azan');
        }
    }
}

function toggleIframeFullscreen(targetId) {
    const targetElement = document.getElementById(targetId);
    const body = document.body;

    if (targetElement) {
        // We toggle the is-fullscreen class on the target element (the iframe)
        targetElement.classList.toggle('is-fullscreen');
        
        // We toggle fullscreen-mode on the body to hide global elements
        body.classList.toggle('fullscreen-mode');

        // Optional: Icon update logic here (using a generic button ID if possible)
        const buttonId = `fullscreen-btn-${targetId}`;
        const icon = document.querySelector(`#${buttonId} .fas`); 
        
        if (icon) {
            if (targetElement.classList.contains('is-fullscreen')) {
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
            } else {
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            }
        }
    } else {
        console.error(`Error: Element with ID ${targetId} not found.`);
    }
}
        
function toggleFullscreen(sectionId) {
    const section = document.getElementById(sectionId);
    const body = document.body;

    if (section) {
        // Toggle the fullscreen class on the section
        section.classList.toggle('is-fullscreen');
        
        // Toggle a class on the body to handle hiding global elements like the navigation bar
        body.classList.toggle('fullscreen-mode');

        // Optional: Update the button icon to indicate the state
        const icon = document.querySelector(`#fullscreen-${sectionId}-btn .fas`);
        if (icon) {
            if (section.classList.contains('is-fullscreen')) {
                // Change to exit fullscreen icon
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
            } else {
                // Change back to expand icon
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            }
        }

        console.log(`${sectionId} is now in fullscreen mode: ${section.classList.contains('is-fullscreen')}`);
    } else {
        console.error(`Error: Section with ID ${sectionId} not found.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof observer === 'undefined' || !observer) {
        console.warn("⚠️ Observer was missing, creating a new instance...");
        window.observer = new MutationObserver((mutations) => {
            // ضع هنا الكود الذي تريده أن يتنفذ عند حدوث تغييرات
            // mutations.forEach(...)
        });
    }

    // 2. التأكد من وجود document.body قبل المراقبة
    if (document.body) {
        // --- الكود الخاص بك (الآن أصبح آمناً) ---
        observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true 
        });
        console.log("✅ Observer started successfully on document.body");
    } else {
        console.error("❌ document.body not found! Observer could not start.");
    }
});

function updateFullDateWidget() {
    // تحديد المعرفين معاً
    const oldContainer = document.getElementById('full-date-widget-container');
    const newContainer = document.getElementById('universal-date-display');

    // إذا لم يكن أي منهما موجوداً، نوقف الدالة
    if (!oldContainer && !newContainer) return;

    // 🛑 [إصلاح هام]: تعريف المتغيرات لتجنب خطأ ReferenceError
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // الهجري يسبق بيوم حسب طلبك

    // إعداد التنسيقات
    const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(today);
    const gregDate = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
    const hijriDate = new Intl.DateTimeFormat('ar-OM-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(yesterday);

    // الهيكل الموحد (كما هو في كودك)
    const dateHTML = `
        <div class="date-wrapper">
            <span class="day-highlight">${dayName}</span>
            <div class="date-details">
                <span class="greg-text">${gregDate}</span>
                <span class="separator">|</span>
                <span class="hijri-text">${hijriDate}</span>
            </div>
        </div>
    `;

    if (oldContainer) {
        oldContainer.innerHTML = dateHTML;
    }

    // ملء المعرف الجديد إذا وجد
    if (newContainer) {
        newContainer.innerHTML = dateHTML;
    }
}

function renderFavoritesDashboard() {
    const container = document.getElementById('fav-d-dashboard-container');
    
    // 1. فحص الأمان لضمان وجود العنصر
    if (!container) {
        console.warn("⚠️ Container #fav-d-dashboard-container not found!");
        return;
    }

    // 2. استخدام القائمة العالمية (مع مصفوفة احتياطية فارغة لتجنب الأخطاء)
    const list = favoritesD || []; 
    
    console.log(`📊 تحديث داشبورد السيارة: ${list.length} فيديو.`);

    // 3. تنظيف الحاوية بالكامل
    container.innerHTML = ''; 
    
    // 4. ضبط خصائص الحاوية (Flex & Scroll)
    container.className = 'favorites-dashboard-horizontal-scroll flex-grow overflow-x-auto whitespace-nowrap flex gap-4';

    // 5. معالجة القائمة الفارغة
    if (list.length === 0) {
        container.style.justifyContent = 'center'; 
        container.innerHTML = '<p class="text-white/50 text-center p-4 w-full self-center">لا توجد فيديوهات محفوظة في قائمة السيارة.</p>';
        return;
    }
    
    // إعادة المحاذاة لليسار عند وجود محتوى
    container.style.justifyContent = 'flex-start';

    // 6. بناء الكروت
    list.forEach(video => {
        if (!video || !video.id) return;
        
        const card = document.createElement('div');
        
        // تنسيق الكارت: عرض نسبي لضمان ظهور 3.5 كارت
        card.className = 'fav-d-dashboard-card navigable grid-item flex-shrink-0 relative group'; 
        card.style.minWidth = '28%'; 
        card.style.maxWidth = '28%';
        card.setAttribute('tabindex', '0');
        card.tabIndex = 0;
        card.dataset.videoId = video.id;

        // حساب نسبة شريط التقدم
        const durationSec = typeof parseDurationToSeconds === 'function' ? parseDurationToSeconds(video.duration) : 100;
        const progressPercent = (video.progress > 0) ? (video.progress / durationSec) * 100 : 0;

        card.innerHTML = `
            <div class="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <img src="${video.thumbnail || 'https://placehold.co/320x180'}" 
                     alt="${video.title}"
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <button class="remove-fav-btn absolute top-2 left-2 p-1.5 bg-red-600/90 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity navigable grid-item" title="إزالة من القائمة">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>

                <div class="absolute bottom-2 right-2 left-2 flex flex-col gap-1">
                    <h4 class="text-sm font-bold text-white truncate text-right leading-tight">${video.title}</h4>
                    <p class="text-[10px] text-gray-300 truncate text-right">${video.channelTitle || ''}</p>
                    
                    <div class="w-full h-1 bg-gray-600/50 rounded-full overflow-hidden mt-1">
                        <div class="h-full bg-blue-500" style="width: ${Math.min(progressPercent, 100)}%"></div>
                    </div>
                </div>
                
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <i data-lucide="play-circle" class="w-8 h-8 text-white/90 drop-shadow-md"></i>
                </div>
            </div>
        `;

        // --- ربط الأحداث ---

        // 1. تشغيل الفيديو
        card.addEventListener('click', (e) => {
            // منع التشغيل إذا ضغطنا على زر الحذف
            if (!e.target.closest('.remove-fav-btn')) {
                window.isAutoPlayMode = false;
                showVideoPopup(video.id, video.progress); 
            }
        });

        // 2. حذف الفيديو (Binding Fix)
        const delBtn = card.querySelector('.remove-fav-btn');
        if (delBtn) {
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // منع تشغيل الفيديو
                // استدعاء دالة الحذف وتمرير النوع 'D' للسيارة
                await removeVideoFromFavorites(video.id, 'D'); 
                // إعادة الرسم فوراً ستتم داخل removeVideoFromFavorites إذا كانت مبرمجة بشكل صحيح،
                // أو يمكننا استدعاؤها يدوياً هنا لضمان التحديث البصري الفوري:
                // renderFavoritesDashboard(); (اختياري إذا كانت دالة الحذف تقوم بذلك)
            });
        }

        container.appendChild(card);
    });

    // 7. تحديث الأيقونات ونظام التنقل
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof updateNavigableElements === 'function') updateNavigableElements();
}

// REPLACE the current displayLastWatchedVideo function with this one
async function displayLastWatchedVideo() {
    const lastWatchedContainer = document.getElementById('last-watched-container');
    const history = getWatchedHistory();
    
    // Sort by timestamp to show the most recently watched videos first
    const videoIds = Object.keys(history)
        .sort((a, b) => (history[b].lastWatchedTimestamp || 0) - (history[a].lastWatchedTimestamp || 0))
        .slice(0, 3);

    if (videoIds.length === 0) {
        lastWatchedContainer.classList.add('hidden');
        return;
    }

    try {
        const videoDetails = await fetchVideosDetails(videoIds);
        if (!videoDetails || videoDetails.length === 0) {
            lastWatchedContainer.classList.add('hidden');
            return;
        }

        // REVERSE the array so the most recent video is last in the list, ready to be scrolled to.
        videoDetails.reverse();

        const slidesHTML = videoDetails.map(video => {
            const videoData = {
                id: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.medium.url,
                channelTitle: video.snippet.channelTitle
            };
            const lastVideoInfo = history[videoData.id];
            const progressPercent = (lastVideoInfo && lastVideoInfo.progress > 0 && lastVideoInfo.duration > 0) 
                ? (lastVideoInfo.progress / lastVideoInfo.duration) * 100 
                : 0;

            return `
                <div class="last-watched-slide">
                    <div class="glass-surface glass-surface--svg p-3 rounded-2xl w-full">
                        <div class="flex items-center gap-4">
                            <img src="${videoData.thumbnail}" class="w-28 h-auto rounded-lg flex-shrink-0">
                            <div class="flex flex-col gap-2 flex-grow min-w-0">
                                <h3 class="font-bold text-lg leading-tight">${videoData.title}</h3>
                                <p class="text-sm text-white/70">${videoData.channelTitle}</p>
                                <div class="w-full bg-white/20 rounded-full h-1.5 mt-1">
                                    <div class="bg-red-500 h-1.5 rounded-full" style="width: ${progressPercent}%"></div>
                                </div>
                                <button class="resume-play-button self-start navigable grid-item" onclick="showVideoPopup('${videoData.id}')">
                                    <i data-lucide="play" class="w-4 h-4"></i>
                                    استئناف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const viewAllCardHTML = `
            <div class="last-watched-slide">
                <div class="glass-surface glass-surface--svg p-3 rounded-2xl w-full h-full flex flex-col items-center justify-center text-center cursor-pointer navigable grid-item" id="view-all-history-card">
                    <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                        <i data-lucide="history" class="w-8 h-8 text-white"></i>
                    </div>
                    <h3 class="font-bold text-lg">عرض الكل</h3>
                    <p class="text-sm text-white/70">مشاهدة كل السجل</p>
                </div>
            </div>
        `;

        // Simplified structure for the new scroll-snap container
        lastWatchedContainer.innerHTML = `
            <h2 class="text-xl font-bold mb-3 text-white/90 text-center">متابعة المشاهدة</h2>
            <div class="last-watched-carousel-wrapper">
                 <div class="last-watched-slides-container">
                   
                     <div class="last-watched-slide">
                <div class="glass-surface glass-surface--svg p-3 rounded-2xl w-full h-full flex flex-col items-center justify-center text-center cursor-pointer navigable grid-item" id="istory-card">
                    <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                       
                    </div>
                  
                </div>
            </div>
             ${slidesHTML}
             ${viewAllCardHTML}
                   
                </div>
                <button id="last-watched-prev" class="carousel-nav-button prev navigable grid-item" tabindex="0"><i data-lucide="chevron-left" class="w-8 h-8"></i></button>
                <button id="last-watched-next" class="carousel-nav-button next navigable grid-item" tabindex="0"><i data-lucide="chevron-right" class="w-8 h-8"></i></button>
            </div>
        `;

        

        lastWatchedContainer.classList.remove('hidden');
        lucide.createIcons();
        
        // NEW: Add event listener for the view all card
        const viewAllCard = document.getElementById('view-all-history-card');
        if (viewAllCard) {
            viewAllCard.addEventListener('click', showAllWatchedHistory);
        }
        
        // Scroll to the last item on load
        setTimeout(() => {
            const slidesContainer = document.querySelector('.last-watched-slides-container');
            if (slidesContainer) {
                // To show the last item (most recent) in an LTR container, scroll all the way to the right.
                slidesContainer.scrollLeft = slidesContainer.scrollWidth;
            }
        }, 0); // Use a timeout of 0 to run this after the browser has rendered the elements

        // NEW: Event listeners for carousel navigation
        const slidesContainer = lastWatchedContainer.querySelector('.last-watched-slides-container');
        const prevButton = lastWatchedContainer.querySelector('#last-watched-prev');
        const nextButton = lastWatchedContainer.querySelector('#last-watched-next');

        if (slidesContainer && prevButton && nextButton && slidesContainer.querySelector('.last-watched-slide')) {
            const scrollAmount = slidesContainer.querySelector('.last-watched-slide').offsetWidth + 16; // 16 is the gap

            prevButton.addEventListener('click', () => {
                slidesContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });

            nextButton.addEventListener('click', () => {
                slidesContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

    } catch (error) {
        console.error("Error fetching details for last watched videos:", error);
        lastWatchedContainer.classList.add('hidden');
    }
}

        // Initialize Lucide icons after they are loaded
        lucide.createIcons();

        // --- API Keys ---
        
        const AI_ASSISTANT_API_KEY = 'AIzaSyBMmtON9ww4dJxMHrl1wKyWTvI0ipJXJws'; 
        const WEATHER_API_KEY = '7acefc26deee4904a2393917252207'; 
        const GOOGLE_MAPS_API_KEY = 'AIzaSyBRqAHJ2elbE_Z7NXXYC50XZpqi6HbG6Rk';



const JSONBIN_API_KEY = '$2a$10$SYrYv.ct8hiMU9YeUxEQ.ecRkOrTqs.TDchJRV3wW.aKJnDXy2oVy';
const JSONBIN_BIN_ID_REMINDERS = '68e3800cae596e708f07cf32';
const JSONBIN_ACCESS_KEY_REMINDERS = '$2a$10$J8o3WrPtnqmKAd///uDw6.BOWnGIBekHFOImbeEZZwsJ/h/XPbVUy';

// NEW: JSONBin IDs for Favorites
const JSONBIN_BIN_ID_FAV_M = '68e4ac20d0ea881f4098138c';
const JSONBIN_BIN_ID_FAV_D = '68e4ac2e43b1c97be95d24af';

// NEW: JSONBin IDs for Channels List
const JSONBIN_BIN_ID_CHANNELS = '68ef1b3dd0ea881f40a38bd1';
const JSONBIN_ACCESS_KEY_CHANNELS = '$2a$10$J8o3WrPtnqmKAd///uDw6.BOWnGIBekHFOImbeEZZwsJ/h/XPbVUy';
let localChannelsCache = []; // To store the list locally

const JSONBIN_BIN_ID_RECITER = '6909c1cd43b1c97be997b522'; 
const JSONBIN_ACCESS_KEY_RECITER = '$2a$10$J8o3WrPtnqmKAd///uDw6.BOWnGIBekHFOImbeEZZwsJ/h/XPbVUy'; 
let localRecitersCache = [];


let favoritesD = [];
let favoritesM = [];

        
        // --- Global App State Management ---
        let appState = {
            currentTime: '',
            mapLocation: { lat: 17.081667, lon: 54.159722, zoom: 18 },
            weather: { temperature: null, description: null, uvIndex: null, iconUrl: '', location: 'Salalah, Oman' },
            car: { speed: 0, rpm: 0, fuel: 0, temp: 0, gear: 'P', direction: '--' }, // Added direction
            prayerTimes: { Fajr: '--:--', Dhuhr: '--:--', Asr: '--:--', Maghrib: '--:--', Isha: '--:--', nextPrayer: null, nextPrayerIqamaTime: null, currentPrayer: null },
            hasShownGeolocationError: false,
            mapZoomChangedByUser: false,
            dashboardReturnCounter: 0,
            custom360Image: localStorage.getItem('custom360Image') || null,
            currentLocation: null,
            previousLocation: null, // For tracking movement
            destinationSet: false,
            isVideoPlayerMinimized: false // NEW state for minimized player
        };
        let googleMapsPromise = null;
        let currentFontSize = 16; // Base size in pixels
        const fontSizeStep = 1; // Change by 1px
        const maxFontSize = 20; // Max size (125%)
        const minFontSize = 12; // Min size (75%)

        // --- Home Locations ---
        // UPDATED: Coordinates for Home 1 and Home 2
        // 💡 تحديد مواقع المنازل الثابتة (يجب أن تكون معرفة عالمياً)
const HOME1_COORDS = {lat: 17.067330, lng: 54.160190, zoom: 18}; 
const HOME2_COORDS = {lat: 17.081852, lng: 54.158345, zoom: 18};

/**
 * NEW: Determines the color class for traffic status based on the delay percentage.
 */
/**
 * NEW: Displays a marker for a specific location on the Dashboard Google Map.
 *
 * @param {object} coords - The {lat, lng} coordinates of the location (HOME1_COORDS or HOME2_COORDS).
 * @param {string} title - The title for the marker's infowindow.
 */
function displayLocationMarker(coords, title) {
    if (!dashboardGoogleMap || !window.google || !window.google.maps) {
        showMessageBox('الخريطة غير مهيأة بعد أو خدمات جوجل غير متاحة.');
        return;
    }
    
    // 1. إنشاء علامة موقع جديدة مؤقتة
    const tempMarker = new google.maps.Marker({
        position: coords,
        map: dashboardGoogleMap,
        title: title,
        // استخدام أيقونة علم لتمييز الوجهة
        icon: {
            path: google.maps.SymbolPath.FLAG, 
            scale: 5,
            fillColor: "#FF00FF",
            fillOpacity: 0.8,
            strokeColor: "#FFFFFF",
            strokeWeight: 1
        }
    });

    // 2. تركيز الخريطة على الموقع الجديد وتكبيره
    dashboardGoogleMap.setCenter(coords);
    dashboardGoogleMap.setZoom(16); 
    
    showMessageBox(`تم تحديد وجهة "${title}". يمكنك رؤية الازدحام عليها.`);
    
    // 3. إزالة العلامة المؤقتة بعد 10 ثوانٍ (لتنظيف الخريطة)
    setTimeout(() => {
        tempMarker.setMap(null); 
    }, 10000); 
}

function getTrafficColorClass(delayPercentage) {
    if (delayPercentage === -1) return 'traffic-unknown';
    // أقل من 5% تأخير: ازدحام خفيف (أخضر)
    if (delayPercentage < 5) return 'traffic-green';    
    // 5% - 20% تأخير: ازدحام متوسط (أصفر)
    if (delayPercentage < 20) return 'traffic-yellow';   
    // أكثر من 20% تأخير: ازدحام شديد (أحمر)
    return 'traffic-red';                                
}

/**
 * NEW: Fetches the current traffic status from the user's location to a destination.
 * * @param {object} origin - {lat, lng} of the starting point (appState.currentLocation).
 * @param {object} destination - {lat, lng} of the destination (HOME_COORDS).
 * @returns {Promise<number>} Returns the duration difference percentage (0-100) or -1 on failure.
 */
async function fetchTrafficStatus(origin, destination) {
    // يجب أن يكون directionsService مهيأ في initMap()
    if (!window.google || !window.google.maps || !directionsService || !origin) return -1;

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
            departureTime: new Date(Date.now()),
            trafficModel: 'bestguess'
        },
        unitSystem: google.maps.UnitSystem.METRIC
    };

    try {
        const response = await directionsService.route(request);
        if (response.status === 'OK') {
            const route = response.routes[0].legs[0];
            const durationInTraffic = route.duration_in_traffic.value; // بالثواني مع الازدحام
            const predictedDuration = route.duration.value;          // بالثواني بدون ازدحام (افتراضي)

            if (predictedDuration > 0) {
                const trafficDelaySecs = durationInTraffic - predictedDuration;
                // حساب نسبة التأخير
                return Math.min(100, Math.round((trafficDelaySecs / predictedDuration) * 100));
            }
        }
        return -1;
    } catch (e) {
        console.error("Traffic status fetch failed:", e);
        return -1;
    }
}

/**
 * NEW: Master function to fetch and update the traffic indicators on home buttons.
 * This is the function that should run every 10 minutes.
 */
/**
 * FINAL: Fetches and updates the traffic indicators on home buttons in the Dashboard.
 * It uses the Directions API to calculate delay percentage and colors the buttons accordingly.
 */
/**
 * FINAL: Fetches and updates the traffic indicators on home buttons in the Dashboard.
 */
async function updateTrafficIndicators() {
    const origin = appState.currentLocation || HOME1_COORDS; // Fallback Origin

    // 1. التحقق من جاهزية خدمات Google Maps
    if (!window.google || !window.google.maps || !directionsService) {
         console.warn("Traffic update postponed: Google Maps services not ready.");
         // 💡 نُحدِّث الأزرار فوراً لحالة عدم المعرفة
         document.getElementById('go-to-home-1-button')?.classList.add('traffic-unknown');
         document.getElementById('go-to-home-2-button')?.classList.add('traffic-unknown');
         return;
    }

    // 2. حساب مؤشرات الازدحام
    const home1Promise = fetchTrafficStatus(origin, HOME1_COORDS);
    const home2Promise = fetchTrafficStatus(origin, HOME2_COORDS);
    const [delay1, delay2] = await Promise.all([home1Promise, home2Promise]);
    
    // 3. تحديث زر 'إشارات ق' (Home 1)
    const btn1 = document.getElementById('go-to-home-1-button');
    if (btn1) {
        const colorClass = getTrafficColorClass(delay1);
        btn1.classList.remove('traffic-red', 'traffic-yellow', 'traffic-green', 'traffic-unknown');
        btn1.classList.add(colorClass);
        // 🛑 التحديث باسم "إشارات ق"
        btn1.innerHTML = `إشارات ق (${delay1 !== -1 ? delay1 + '%' : '--'})`;
    }

    // 4. تحديث زر 'تقاطع ش' (Home 2)
    const btn2 = document.getElementById('go-to-home-2-button');
    if (btn2) {
        const colorClass = getTrafficColorClass(delay2);
        btn2.classList.remove('traffic-red', 'traffic-yellow', 'traffic-green', 'traffic-unknown');
        btn2.classList.add(colorClass);
        // 🛑 التحديث باسم "تقاطع ش"
        btn2.innerHTML = `تقاطع ش (${delay2 !== -1 ? delay2 + '%' : '--'})`;
    }
}
        // --- DOM Element References ---
        const appButtons = document.querySelectorAll('button[data-app]');
        const appScreens = document.querySelectorAll('.app-screen');
        const sidebarIcons = document.querySelectorAll('.app-icon');
        const quranQuickAccess = document.getElementById('quran-quick-access');
        const youtubeSearchInput = document.getElementById('youtube-search-input');
        const youtubeSearchButton = document.getElementById('youtube-search-button');
        const youtubeSuggestionsDiv = document.getElementById('youtube-suggestions');
        const youtubeVideoListView = document.getElementById('youtube-video-list-view'); 
        const videoListContainer = document.getElementById('video-list-container'); 
        const youtubeSearchResultsView = document.getElementById('youtube-search-results-view');
        const searchResultsContainer = document.getElementById('search-results-container');
        const backToPlaylistsFromVideosButton = document.getElementById('back-to-playlists-from-videos'); 
        const backToPlaylistsBottomButton = document.getElementById('back-to-playlists-bottom-button');
        const backToPlaylistsBottomButtonSearch = document.getElementById('back-to-playlists-bottom-button-search');
        const previousItemButton = document.getElementById('previous-item-button');
        const nextItemButton = document.getElementById('next-item-button');
        const videoPopupContainer = document.getElementById('video-popup-container');
        const videoPopupPlayerContainer = document.getElementById('video-popup-player-container');
        const videoPopupCloseButton = document.getElementById('video-popup-close-button');
        const quranIframe = document.getElementById('quran-iframe');
        const floatingMediaButton = document.getElementById('floating-media-button');
        const floatingKeyboardButton = document.getElementById('floating-keyboard-button');
        const floatingMinimizedVideoButton = document.getElementById('floating-minimized-video-button');
        const backToSearchFloatingButton = document.getElementById('back-to-search-floating-button'); // NEW
        const clearSearchButton = document.getElementById('clear-search-button');
        const prayerTimesContainer = document.getElementById('prayer-times-container');
        const digitalHoursSpan = document.querySelector('#digital-time .hours');
        const digitalMinutesSpan = document.querySelector('#digital-time .minutes');
        const digitalSecondsSpan = document.querySelector('#digital-time .seconds');
        const digitalDateLine1 = document.getElementById('digital-date-line1');
        const digitalDateLine2 = document.getElementById('digital-date-line2');
        let dashboardGoogleMap, dashboardGoogleMarker, directionsService, directionsRenderer;
        let watchId;
        const getMyLocationButtonDashboard = document.getElementById('get-my-location-button-dashboard');
        const goToHome1Button = document.getElementById('go-to-home-1-button');
        const goToHome2Button = document.getElementById('go-to-home-2-button');
        const car360Image = document.getElementById('car-360-image');
        const upload360ImageInput = document.getElementById('upload-360-image-input');
        const upload360ImageButton = document.getElementById('upload-360-image-button');
        const reset360ImageButton = document.getElementById('reset-360-image-button');
        const carplayMainInterface = document.getElementById('carplay-main-interface');
        const pauseAnimationButton = document.getElementById('pause-animation-button');
        const zoomInButton = document.getElementById('zoom-in-button');
        const zoomOutButton = document.getElementById('zoom-out-button');
        const removeCacheButton = document.getElementById('remove-cache-button');
        const default360ImageSrc = "https://dmusera.netlify.app/es350gb.png";
        let currentPlayingPlaylistId = '', activeMediaView = 'suggestions', currentPlayingVideoId = '', selectedReaderName = '', popupPlayer, isYouTubeApiReady = false, searchMode = 'reciter_surah', progressInterval = null;
        let lastSuccessfulSearchQuery = null; // NEW: To store the last search query
        let initialLocationFetched = false;

        const juzArabicNames = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"];

       
       /**
 * Fetches the list of Reciters from JSONBin.io and updates the local cache.
 * @returns {Promise<Array>} The list of reciters.
 */
async function fetchRecitersList() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_RECITER}/latest`, {
            headers: { 'X-Access-Key': JSONBIN_ACCESS_KEY_RECITER }
        });
        if (res.status === 404) return []; // Bin is new/empty
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        
        // التأكد من أن القائمة هي مصفوفة وتحتوي على حقل clicks
        const fetchedList = Array.isArray(data.record) ? data.record : [];
        localRecitersCache = fetchedList.map(r => ({
            ...r,
            clicksreciter: parseInt(r.clicksreciter, 10) || 0 // تحويل Click Count إلى رقم
        }));
        
        return localRecitersCache;
    } catch (error) {
        console.error(`Error fetching reciters list:`, error);
        // في حالة الفشل، نستخدم القائمة الثابتة السابقة كاحتياطي (إذا كانت متوفرة)
        return localRecitersCache || [];
    }
}

/**
 * Updates the Reciters list on JSONBin.io.
 * @param {Array} newRecitersList - The updated list to send.
 * @returns {Promise<boolean>} True if successful.
 */
async function updateRecitersList(newRecitersList) {
    // تصفية للحفاظ على الخصائص الهامة فقط قبل الإرسال
    const sanitizedList = newRecitersList.map(r => ({
        name: r.name,
        image: r.image,
        clicksreciter: r.clicksreciter // يجب الاحتفاظ به كنص أو رقم
    }));
    
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_RECITER}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY // استخدام المفتاح الرئيسي للتعديل
            },
            body: JSON.stringify(sanitizedList)
        });
        if (!res.ok) throw new Error(`Failed to update reciters list: ${res.status}`);
        localRecitersCache = newRecitersList; // تحديث الذاكرة المؤقتة
        return true;
    } catch (error) {
        console.error(`Error updating reciters list:`, error);
        showMessageBox(`حدث خطأ أثناء تحديث قائمة القراء`);
        return false;
    }
}

/**
 * Increments the click counter for a specific reciter.
 * @param {string} reciterName - The name of the reciter.
 */
function incrementReciterClick(reciterName) {
    if (!reciterName || !localRecitersCache) return;
    
    let reciterFound = false;
    const updatedList = localRecitersCache.map(reciter => {
        if (reciter && reciter.name === reciterName) {
            reciterFound = true;
            const currentClicks = parseInt(reciter.clicksreciter, 10) || 0;
            return { ...reciter, clicksreciter: currentClicks + 1 };
        }
        return reciter;
    });

    if (reciterFound) {
        localRecitersCache = updatedList;
        // إرسال التحديث إلى الخادم في الخلفية
        updateRecitersList(updatedList).catch(err => {
            console.error("Failed to update reciter clicks in background:", err);
        });
    }
}

 /**
 * Shows the prompt to add a new reciter to the list.
 */
/**
 * NEW: Shows the modal prompt to add a new Reciter.
 * It initiates a search flow (handleSearchForReciterChannel) against the YouTube API 
 * filtered for Arabic channels, allowing the user to select and save a Reciter.
 */
/**
 * REPLACED & COMPLETE: Shows the modal prompt to add a new Reciter by searching YouTube Channels.
 * It dynamically creates the search interface and handles the event binding to the search function.
 */
function showAddReciterPrompt() {
    const existingPrompt = document.getElementById('add-reciter-prompt');
    if (existingPrompt) existingPrompt.remove();

    // 1. هيكل النافذة المنبثقة (Modal Structure)
    const promptHTML = `
        <div id="add-reciter-prompt" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
            <div id="add-reciter-prompt-content" class="glass-surface glass-surface--svg p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 transition-all duration-300">
                <h3 class="text-xl font-bold text-center">إضافة قارئ/قناة جديدة</h3>
                <p class="text-sm text-white/70 text-center">ابحث باسم القارئ (مثل: ياسر الدوسري) للعثور على قناته وإضافتها.</p>
                <div class="flex gap-2 grid-container">
                    <input type="text" id="new-reciter-name-input" placeholder="اسم القارئ..." class="flex-grow p-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 navigable grid-item" tabindex="0" />
                    <button id="search-channel-confirm" class="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-full navigable grid-item" tabindex="0">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div id="channel-search-results" class="mt-4 max-h-[50vh] overflow-y-auto flex flex-col gap-3 grid-container">
                    <p class="text-center text-white/50">نتائج بحث قنوات القراء ستظهر هنا.</p>
                </div>
                
                <button id="add-reciter-cancel" class="mt-2 bg-red-600/80 hover:bg-red-700/80 text-white font-bold py-2 px-4 rounded-full navigable grid-item self-center" tabindex="0">إغلاق</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', promptHTML);
    lucide.createIcons();

    // 2. ربط العناصر (Event Binding)
    const promptEl = document.getElementById('add-reciter-prompt');
    const nameInput = document.getElementById('new-reciter-name-input');
    const searchBtn = document.getElementById('search-channel-confirm');
    const cancelBtn = document.getElementById('add-reciter-cancel');

    const closePrompt = () => {
        promptEl.remove();
        updateNavigableElements(); // تحديث عناصر التنقل بعد إزالة النافذة
    };

    // 🛑 ربط زر البحث بالدالة المخصصة للقراء
    searchBtn.addEventListener('click', handleSearchForReciterChannel); 

    // 🛑 دعم البحث بزر Enter
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchForReciterChannel(); 
        }
    });

    cancelBtn.addEventListener('click', closePrompt);
    
    // 3. إعداد التركيز والـ Escape
    nameInput.focus();
    setFocus(nameInput);
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closePrompt();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    updateNavigableElements(); // تحديث عناصر التنقل في النافذة المنبثقة
}

// -------------------------------------------------------------
// * يجب أن تكون الدوال التالية مُعرفة عالمياً:
// * handleSearchForReciterChannel()
// * lucide.createIcons()
// * setFocus()
// * showMessageBox()
// -------------------------------------------------------------

/**
 * Handles the addition of a new reciter to the JSONBin list.
 */
/**
 * RENAMED & REFINED: Handles the search action specifically for finding a Reciter Channel.
 * Applies strong filtering for 'type=channel' and 'relevanceLanguage=ar'.
 */
/**
 * RENAMED & REFINED: Handles the search action specifically for finding a Reciter Channel.
 * Applies strong filtering for 'type=channel' and 'relevanceLanguage=ar'.
 */
async function handleSearchForReciterChannel() {
    // 🛑 نستخدم المُعرّفات الصحيحة من نافذة القراء المنبثقة
    const inputEl = document.getElementById('new-reciter-name-input');
    const resultsContainer = document.getElementById('channel-search-results');
    const confirmBtn = document.getElementById('search-channel-confirm');
    
    const query = inputEl?.value.trim();

    if (!query) {
        showMessageBox("الرجاء إدخال اسم القارئ/القناة للبحث.");
        return;
    }

    // 1. تعطيل الزر وعرض التحميل (CRITICAL FIX)
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
    lucide.createIcons();
    resultsContainer.innerHTML = '<p class="text-center text-white/70">...جاري البحث</p>';

    try {
        // 2. استدعاء API يوتيوب مع فلتر القنوات واللغة العربية
        const API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${YOUTUBE_API_KEY}&maxResults=10&relevanceLanguage=ar`; 
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             if (errorData?.error?.message.includes('API key not valid') || response.status === 403) {
                 throw new Error("API_KEY_INVALID");
             }
             throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 3. عرض النتائج باستخدام الدالة المخصصة (يجب أن تكون هذه الدالة مُعرفة)
        displayReciterSearchResults(data.items);
        
    } catch (error) {
        console.error("Error searching for Reciter Channel:", error);
        let errorMsg = "حدث خطأ في البحث. يرجى المحاولة مرة أخرى.";
        if (error.message === "API_KEY_INVALID") {
             errorMsg = "فشل البحث: مفتاح YouTube API غير صالح.";
        }
        showMessageBox(errorMsg);
        resultsContainer.innerHTML = `<p class="text-center text-red-400">${errorMsg}</p>`;
    } finally {
        // 4. إعادة تفعيل زر البحث (CRITICAL FIX)
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i data-lucide="search" class="w-5 h-5"></i>`;
        lucide.createIcons();
        updateNavigableElements(); // تحديث التنقل ليشمل نتائج البحث
    }
}

async function handleAddReciter(name, image, buttonElement) {
    if (localRecitersCache.some(r => r.name === name)) {
        showMessageBox(`القارئ "${name}" موجود بالفعل في القائمة.`);
        return;
    }

    buttonElement.disabled = true;
    buttonElement.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 text-white animate-spin"></i>`;
    lucide.createIcons();

    const newReciter = {
        name: name,
        image: image || 'https://placehold.co/100x100/334155/ffffff?text=Q',
        clicksreciter: 0
    };

    try {
        const updatedList = [...localRecitersCache, newReciter];
        const success = await updateRecitersList(updatedList);

        if (success) {
            showMessageBox(`تمت إضافة القارئ "${name}" بنجاح.`);
            // إعادة تحميل تبويب الاقتراحات لتظهر التغييرات
            const suggestionsContent = document.getElementById('suggestions-content');
            if(suggestionsContent) {
                 // Clear and re-populate the suggestions tabs
                suggestionsContent.innerHTML = '';
                await populateYoutubeSuggestions();
                // Switch back to Reciters tab after successful update
                document.getElementById('tab-reciters')?.click();
            }
        }
    } catch (error) {
        console.error("Error adding reciter:", error);
        showMessageBox("حدث خطأ أثناء إضافة القارئ.");
    } finally {
        buttonElement.disabled = false;
        buttonElement.innerHTML = `<i data-lucide="plus" class="w-5 h-5"></i> إضافة`;
        lucide.createIcons();
    }
}      
       
        // --- Utility Functions ---
        function showMessageBox(message) { const box = document.createElement('div'); box.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(0, 0, 0, 0.8); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.5); z-index: 1000; text-align: center; max-width: 80%; font-size: 1.1rem;`; box.innerHTML = `<p>${message}</p><button style="margin-top: 15px; padding: 8px 15px; background-color: #9333ea; border: none; border-radius: 5px; color: white; cursor: pointer;">إغلاق</button>`; document.body.appendChild(box); box.querySelector('button').addEventListener('click', () => document.body.removeChild(box)); }

        async function showAllWatchedHistory() {
            const history = getWatchedHistory();
            const videoIds = Object.keys(history)
                .sort((a, b) => (history[b].lastWatchedTimestamp || 0) - (history[a].lastWatchedTimestamp || 0));

            if (videoIds.length === 0) {
                showMessageBox('لا يوجد سجل مشاهدة.');
                return;
            }

            try {
                // Fetch details in chunks to avoid long URLs
                const allVideoDetails = [];
                for (let i = 0; i < videoIds.length; i += 50) {
                    const chunk = videoIds.slice(i, i + 50);
                    const details = await fetchVideosDetails(chunk);
                    if(details) {
                        allVideoDetails.push(...details);
                    }
                }
                
                if (allVideoDetails.length > 0) {
                    searchResultsContainer.innerHTML = '<h2 class="text-3xl font-bold mb-4 text-center w-full text-white col-span-full">سجل المشاهدة</h2>'; // Add a title
                    
                    // NEW: Fetch channel thumbnails for all videos
                    const channelIds = [...new Set(allVideoDetails.map(video => video.snippet.channelId))];
                    const channelThumbnails = await fetchChannelsDetails(channelIds);

                    // Sort details according to original sorted videoIds
                const sortedDetails = allVideoDetails.sort((a, b) => {
                    const aTimestamp = history[a.id]?.lastWatchedTimestamp || 0;
                    const bTimestamp = history[b.id]?.lastWatchedTimestamp || 0;
                    return bTimestamp - aTimestamp;
                });
                
                sortedDetails.forEach(video => {
                    const videoData = {
                        id: video.id,
                        title: video.snippet.title,
                        thumbnail: video.snippet.thumbnails.medium.url,
                        channelTitle: video.snippet.channelTitle,
                        channelId: video.snippet.channelId,
                        channelThumbnail: channelThumbnails[video.snippet.channelId], // Add thumbnail
                        viewCount: formatViewCount(video.statistics.viewCount),
                        publishedAt: formatTimeAgo(video.snippet.publishedAt),
                        duration: formatDuration(video.contentDetails.duration)
                    };
                    searchResultsContainer.appendChild(createVideoCard(videoData));
                });

                youtubeSuggestionsDiv.style.display = 'none';
                youtubeVideoListView.classList.add('hidden');
                    youtubeSearchResultsView.classList.remove('hidden');
                    activeMediaView = 'searchResults'; // Reuse this view
                    backToPlaylistsBottomButton.style.display = 'none';
                    backToPlaylistsBottomButtonSearch.style.display = 'flex';
                    previousItemButton.style.display = 'none'; // No next/prev for history
                    nextItemButton.style.display = 'none';

                    lucide.createIcons();
                    updateNavigableElements();
                    setTimeout(() => {
                        const firstResult = searchResultsContainer.querySelector('.grid-item');
                        if (firstResult) setFocus(firstResult);
                    }, 100);
                } else {
                     showMessageBox('لا يوجد سجل مشاهدة.');
                }

            } catch (error) {
                console.error("Error fetching all history details:", error);
                showMessageBox('حدث خطأ أثناء تحميل سجل المشاهدة.');
            }
        }
        
        // --- NEW: Watched History Helpers ---
        function getWatchedHistory() {
            return JSON.parse(localStorage.getItem('youtubeWatchedHistory')) || {};
        }

        async function updateVideoProgress(videoId, currentTime, duration) {
            if (!videoId || !duration || !isFinite(currentTime) || !isFinite(duration)) return;
        
            // 1. Update local history (localStorage)
            const history = getWatchedHistory();
            history[videoId] = { progress: currentTime, duration: duration, lastWatchedTimestamp: Date.now() };
            localStorage.setItem('youtubeWatchedHistory', JSON.stringify(history));
        
            // 2. Check and update favorites in JSONBin.io
            const favDIndex = favoritesD.findIndex(fav => fav.id === videoId);
            const favMIndex = favoritesM.findIndex(fav => fav.id === videoId);
        
            // If the video is not in any favorites list, we don't need to proceed further.
            if (favDIndex === -1 && favMIndex === -1) {
                return;
            }
        
            const updatePromises = [];
        
            if (favDIndex > -1) {
                // To ensure state changes are handled correctly, create a new array using .map
                const updatedFavoritesD = favoritesD.map((fav, index) => {
                    if (index === favDIndex) {
                        // Return a new object with the updated progress
                        return { ...fav, progress: currentTime };
                    }
                    return fav; // Return the original object if it's not the one we're updating
                });
                favoritesD = updatedFavoritesD; // Re-assign the global variable to the newly created array
                updatePromises.push(updateFavorites('D', favoritesD));
            }
        
            if (favMIndex > -1) {
                // Repeat the same immutable update pattern for the 'M' list
                const updatedFavoritesM = favoritesM.map((fav, index) => {
                    if (index === favMIndex) {
                        return { ...fav, progress: currentTime };
                    }
                    return fav;
                });
                favoritesM = updatedFavoritesM; // Re-assign the global variable
                updatePromises.push(updateFavorites('M', favoritesM));
            }
            
            if (updatePromises.length > 0) {
                try {
                    await Promise.all(updatePromises);
                } catch (error) {
                    console.error(`Failed to update favorite progress for video ${videoId}:`, error);
                }
            }
        }

        function markVideoAsWatched(videoId) {
            if (!videoId) return;
            const history = getWatchedHistory();
            // Using a special value to indicate fully watched
            history[videoId] = { progress: -1, duration: 1, lastWatchedTimestamp: Date.now() };
            localStorage.setItem('youtubeWatchedHistory', JSON.stringify(history));
            // Also update the card in the UI if it's visible
            const card = document.querySelector(`.youtube-video-card[data-video-id="${videoId}"]`);
            if(card) {
                // Remove progress bar if it exists
                const progressBar = card.querySelector('.watched-progress-bar-container');
                if(progressBar) progressBar.remove();
                // Add watched badge if it doesn't exist
                if(!card.querySelector('.watched-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'watched-badge';
                    badge.textContent = 'تمت المشاهدة';
                    card.querySelector('.thumbnail-container').appendChild(badge);
                }
            }
        }
        
       // -------------------------------------------------------------
// --- MODIFIED updateUI function (Applies Icon Logic) ---
// -------------------------------------------------------------
function updateUI() {
    const tempEl = document.getElementById('dashboard-weather-temp');
    const descEl = document.getElementById('dashboard-weather-desc');
    const dashboardIcon = document.getElementById('dashboard-weather-icon');
    const locationEl = document.getElementById('dashboard-weather-location');
    
    // العناصر الجديدة التي تحتوي على المقاييس (Dash Metrics)
    const dashMetricTemp = document.getElementById('dash-metric-temp');
    const dashMetricUV = document.getElementById('dash-metric-uv');
    const dashMetricHumidity = document.getElementById('dash-metric-humidity');
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // القيم المخزنة في حالة التطبيق (App State)
    const tempValue = appState.weather.temperature;
    const uvValue = appState.weather.uvIndex;
    const humidityValue = appState.weather.humidity;


    // 🛑 PERIOD FOR MOON DISPLAY (Night Time)
    const isNightTimeOrTest = (currentHour >= 17 || currentHour < 6); 
    
    let iconSrc = appState.weather.iconUrl || 'https://placehold.co/64x64/000000/FFFFFF?text=X';
        
    // --- 1. تحديث أيقونة لوحة القيادة (Dashboard Weather Icon) ---
    if (dashboardIcon) {
        // 1.1. تطبيق المنطق الليلي (قمر NASA)
        if (isNightTimeOrTest && appState.dynamicMoonImageUrl) {
            iconSrc = appState.dynamicMoonImageUrl; 
        } 
        // 1.2. تطبيق منطق الأيقونات الشمسية/الغيوم العادية (أثناء النهار)
        else {
            if ((currentHour > 8 || (currentHour === 8 && currentMinute >= 30)) && (currentHour < 17)) { 
                iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/113.png'; // Sun Icon
            } else if ((currentHour >= 18 && currentHour < 19)) { 
                iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/1087.png'; // Sunset Icon
            } else if (currentHour === 6 && currentMinute > 0 && currentMinute <= 30) { 
                iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/1087.png'; // Sunrise Icon
            } else if ((currentHour === 6 && currentMinute > 30) || (currentHour === 7) || (currentHour === 8 && currentMinute <= 30) || (currentHour >= 17 && currentHour < 18)) { 
                iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/116.png'; // Cloudy/Sun Icon
            } else {
                 iconSrc = appState.weather.iconUrl || 'https://placehold.co/64x64/000000/FFFFFF?text=X';
            }
        }
        dashboardIcon.src = iconSrc;
    }

    // --- 2. تحديث الشاشات الرئيسية والنصوص ---
    
    // تحديث درجة الحرارة الكبيرة (التي لا تحتاج إلى toFixed إلا إذا كانت موجودة)
    if (tempEl) {
        const tempDisplay = tempValue !== null && !isNaN(tempValue) ? tempValue.toFixed(1) : '--';
        tempEl.textContent = `${tempDisplay}°C`;
    }
    
    // وصف الطقس / مرحلة القمر
    if (descEl) {
        if (isNightTimeOrTest && appState.moonData && appState.moonData.phase !== undefined) {
            const phase = appState.moonData.phase.toFixed(1);
            descEl.textContent = `القمر: ${phase}% مضاء`;
        } else {
            descEl.textContent = appState.weather.description || '--';
        }
    }
    
    if (locationEl) {
        locationEl.textContent = appState.weather.location;
    }

    // --- 3. تحديث المقاييس الموحدة الجديدة في لوحة القيادة ---

    // الحرارة (Metric 1)
    if (dashMetricTemp && tempValue !== null && !isNaN(tempValue)) {
        dashMetricTemp.textContent = `${Math.round(tempValue)}°C`;
        dashMetricTemp.className = `font-bold text-lg ${getTempTextColor(tempValue)}`;
    } else if (dashMetricTemp) { dashMetricTemp.textContent = '--°C'; dashMetricTemp.className = 'font-bold text-lg text-white/70'; }

    // مؤشر UV (Metric 2)
    if (dashMetricUV && uvValue !== null && !isNaN(uvValue)) {
        dashMetricUV.textContent = `${Math.round(uvValue)}`;
        dashMetricUV.className = `font-bold text-lg ${getUvTextColor(uvValue)}`;
    } else if (dashMetricUV) { dashMetricUV.textContent = '--'; dashMetricUV.className = 'font-bold text-lg text-white/70'; }

    // الرطوبة (Metric 3)
    if (dashMetricHumidity && humidityValue !== null && !isNaN(humidityValue)) { 
        dashMetricHumidity.textContent = `${Math.round(humidityValue)}%`;
        dashMetricHumidity.className = `font-bold text-lg ${getHumidityTextColor(humidityValue)}`;
    } else if (dashMetricHumidity) { 
        dashMetricHumidity.textContent = '--%'; 
        dashMetricHumidity.className = 'font-bold text-lg text-white/70'; 
    }

    // 360 Image Update
    const car360Image = document.getElementById('car-360-image');
    if (car360Image) { 
        car360Image.src = appState.custom360Image || default360ImageSrc;
    }

    if (currentAppIndex === appOrder.indexOf('DashboardCarPlay')) {
        updateCarPlayDashboard();
    }

}

function updateCarPlayDashboard() {
    // 1. المرجع العالمي الآمن للمشغل
    const player = window.popupPlayer || window.player;
    
    // 2. تحديث بيانات (الصلاة والطقس) - تعمل دائماً حتى لو الفيديو متوقف
    try {
        const prayerName = document.getElementById('carplay-next-prayer-name');
        const prayerTime = document.getElementById('carplay-next-prayer-time');
        const weatherTemp = document.getElementById('carplay-weather-temp');

        if (prayerName) prayerName.textContent = appState.prayerTimes.nextPrayer || '--';
        if (prayerTime && appState.prayerTimes.nextPrayerIqamaTime) {
            prayerTime.textContent = appState.prayerTimes.nextPrayerIqamaTime.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (weatherTemp) weatherTemp.textContent = appState.weather.temperature !== null ? `${Math.round(appState.weather.temperature)}°` : '--°';
    } catch (e) { console.warn("CarPlay Prayer/Weather Sync Error"); }

    // 3. تحديث بيانات اليوتيوب (فقط إذا كان هناك فيديو محمل)
    if (player && typeof player.getVideoData === 'function') {
        try {
            const videoData = player.getVideoData();
            const playerState = player.getPlayerState();
            
            // التحقق من وجود ID للفيديو لضمان عدم تحديث بيانات فارغة
            if (videoData && videoData.video_id) {
                const titleEl = document.getElementById('carplay-media-title');
                const channelEl = document.getElementById('carplay-media-channel');
                const thumbEl = document.getElementById('carplay-media-thumb');
                const thumbEl1 = document.getElementById('dash-media-thumb');
                const playBtn = document.getElementById('carplay-capsule-play-pause');

                if (titleEl) titleEl.textContent = videoData.title;
                if (channelEl) channelEl.textContent = videoData.author;
                if (thumbEl) {
                    const thumbUrl = `https://i.ytimg.com/vi/${videoData.video_id}/mqdefault.jpg`;
                    if (thumbEl.src !== thumbUrl) thumbEl.src = thumbUrl;
                }
                if (thumbEl1) {
                    const thumbUrl = `https://i.ytimg.com/vi/${videoData.video_id}/mqdefault.jpg`;
                    if (thumbEl1.src !== thumbUrl) thumbEl1.src = thumbUrl;
                }

                // مزامنة أيقونة التشغيل (Play/Pause)
                if (playBtn) {
                    const isPlaying = (playerState === 1); // 1 = PLAYING
                    playBtn.innerHTML = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
                    if (window.lucide) lucide.createIcons();
                }
            }
        } catch (mediaError) { console.warn("CarPlay Media Sync Pending..."); }
    }
}

function forceUpdateCarPlayMedia(activePlayer) {
    if (!activePlayer || typeof activePlayer.getVideoData !== 'function') return;

    const vData = activePlayer.getVideoData();
    const videoId = vData.video_id;

    console.log("🎬 CarPlay Syncing:", vData.title);

    // استهداف العناصر بقوة
    const titleEl = document.getElementById('carplay-media-title');
    const channelEl = document.getElementById('carplay-media-channel');
    const thumbEl = document.getElementById('carplay-media-thumb');
    const thumbEl1 = document.getElementById('dash-media-thumb');

    if (titleEl) titleEl.textContent = vData.title;
    if (channelEl) channelEl.textContent = vData.author;
    if (thumbEl && videoId) {
        // نستخدم hqdefault لضمان جودة الصورة وسرعة التحميل
        thumbEl.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
if (thumbEl1 && videoId) {
        // نستخدم hqdefault لضمان جودة الصورة وسرعة التحميل
        thumbEl1.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    // تحديث أيقونة التشغيل في الكبسولة
    const playBtn = document.getElementById('carplay-capsule-play-pause');
    if (playBtn) {
        playBtn.innerHTML = '<i data-lucide="pause"></i>';
        if (window.lucide) lucide.createIcons();
    }
}
// --- 2. محرك المراقبة (The Engine) ---
// هذا الجزء يضمن التحديث في حالتين: دورياً وعند تغيير حالة الفيديو
function initCarPlaySync() {
    // تحديث كل ثانية لضمان دقة البيانات (الطقس والصلاة)
    setInterval(updateCarPlayDashboard, 1000);

    // ربط الأزرار فعلياً بالمشغل
    const controls = {
        'carplay-capsule-play-pause': () => {
            const state = popupPlayer.getPlayerState();
            state === 1 ? popupPlayer.pauseVideo() : popupPlayer.playVideo();
            setTimeout(updateCarPlayDashboard, 100);
        },
        'carplay-capsule-next': () => popupPlayer.nextVideo(),
        'carplay-capsule-prev': () => popupPlayer.previousVideo()
    };

    Object.entries(controls).forEach(([id, action]) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.stopPropagation(); action(); };
    });
}

// تشغيل النظام
initCarPlaySync();

        // --- App Switching and Navigation Logic ---
const appOrder = ['Dashboard', 'Media', 'DashboardCarPlay', 'Radio', 'Athkar', 'Reciters', 'Weather', 'Map', 'Quran'];
        let currentAppIndex = 0;

       function switchApp(appName) {
    // 1. الإيقاف العام لجميع المؤقتات ذات التردد العالي (Clean Slate)
    // نوقف جميع المؤقتات التي تعمل بشكل شرطي أولاً
    stopClockAndTimer();
    stopCarSimulation();
    stopWeatherUpdates(); 
    // 💡 ملاحظة: start/stopNextPrayerDetermination و startFullDateUpdates تعملان بشكل دائم (بطيء).

    // 2. تحديث الشاشة النشطة
    const newIndex = appOrder.indexOf(appName);
    if (newIndex === -1) return;
    currentAppIndex = newIndex;
    
    // تحديث الفئات المرئية
    appScreens.forEach(s => s.classList.remove('active'));
    sidebarIcons.forEach(i => i.classList.remove('active'));
    const screen = document.getElementById(`screen-${appName}`);
    if (screen) screen.classList.add('active');
    const icon = document.querySelector(`.app-icon[data-app="${appName}"]`);
    if (icon) icon.classList.add('active');

const floatingVideo = document.getElementById('floating-minimized-video-button');
const minimizeBtn = document.getElementById('video-popup-minimize-button');
const restoreBtn = document.querySelector('.minimized-restore-btn');

if (appName === 'DashboardCarPlay') {
    // 1. إدارة الفيديو: التحويل التلقائي للوضع المصغر (Capsule)
    const popupContainer = document.getElementById('video-popup-container');
    const isPopupActive = popupContainer && popupContainer.classList.contains('active');
    const minimizeBtn = document.getElementById('video-popup-minimize-button');

    if (isPopupActive && minimizeBtn) {
        minimizeBtn.click(); 
    }
setTimeout(() => {
        // 🚀 استدعاء الحقن المباشر عند الدخول للشاشة
        if (window.popupPlayer) forceUpdateCarPlayMedia(window.popupPlayer);
        updateCarPlayDashboard();
    }, 200);
    // 2. تحديث موحد للواجهة والخريطة (Unified UI & Map Refresh)
    // نستخدم تأخير بسيط (150ms) لضمان أن المتصفح قام برسم حاوية CarPlay أولاً
    setTimeout(() => {
        // أ. تحديث النصوص (يوتيوب، صلاة، طقس)
        if (typeof updateCarPlayDashboard === 'function') {
            updateCarPlayDashboard();
        }


        // ب. معالجة الخريطة ثلاثية الأبعاد
        if (carplayGoogleMap) {
            // إجبار الخريطة على حساب أبعاد الحاوية (حل مشكلة المساحة السوداء)
            google.maps.event.trigger(carplayGoogleMap, 'resize');
            
            if (appState.currentLocation) {
                // ضبط المركز والزووم والميل الاحترافي
                carplayGoogleMap.setCenter(appState.currentLocation);
                carplayGoogleMap.setZoom(18); 
                carplayGoogleMap.setTilt(45);
                
                // مزامنة اتجاه الخريطة مع اتجاه السيارة
                if (typeof directionToDegrees === 'function') {
                    const currentHeading = directionToDegrees(appState.car.direction);
                    carplayGoogleMap.setHeading(currentHeading);
                }
            }
        }

        // ج. تحديث نص الموقع الجغرافي
        const locationText = document.getElementById('carplay-location-text');
        if (locationText) {
            locationText.textContent = appState.weather.location || "موقعك الحالي";
        }
        
        console.log("✅ CarPlay View Sync Complete.");
    }, 150);

} else {
    // 3. منطق الخروج من CarPlay: استعادة المشغل تلقائياً إذا كان يعمل
    const restoreBtn = document.getElementById('floating-minimized-video-button');
    // نتحقق من أن زر الاستعادة مرئي (أي أن الفيديو مصغر)
    const isMinimized = restoreBtn && restoreBtn.style.display !== 'none';

    if (isMinimized && typeof restoreVideoPopup === 'function') {
        restoreVideoPopup();
    }
}
    
    // A. المؤقتات المطلوبة في Dashboard
    if (appName === 'Dashboard') {
        startClockAndTimer(); // 1s/2s (الساعة والعداد التنازلي)
        startWeatherUpdates(); // الطقس (جلب كل 5 دقائق)
        
        // 🚀 FIX: تطبيق التدوير والمركز فوراً عند فتح الشاشة
        // نستخدم setTimeout(0) لضمان أن الـ DOM أصبح مرئياً قبل تطبيق setHeading
        setTimeout(() => {
            if (dashboardGoogleMap) {
                const numericHeading = directionToDegrees(appState.car.direction);
                dashboardGoogleMap.setHeading(numericHeading);
                
                // 💡 نركز الخريطة على الموقع الحالي لضمان تحديثها بالكامل
                if (appState.currentLocation) {
                     dashboardGoogleMap.setCenter(appState.currentLocation);
                }
            }
            
        }, 0); 
    }
    
    // B. المؤقتات المطلوبة في شاشة 3D (Map)
    if (appName === 'Map') {
        startCarSimulation(); // محاكاة القيادة (2 ثانية)
        startWeatherUpdates(); // الطقس (جلب كل 5 دقائق)
    } 
    
    // C. المؤقتات المطلوبة في شاشة Weather
    if (appName === 'Weather') {
        startWeatherUpdates();
    }
    
    // ... (بقية منطق switchApp)
    
    // 4. نقل التركيز الأولي بعد التبديل
    const activeScreen = document.getElementById(`screen-${appName}`);
    if (activeScreen) {
        setTimeout(() => {
            const firstItem = activeScreen.querySelector('.grid-item');
            if (firstItem) setFocus(firstItem);
        }, 150);
    }

}

        function navigateToNextApp() {
            currentAppIndex = (currentAppIndex + 1) % appOrder.length;
            switchApp(appOrder[currentAppIndex]);
        }

        function navigateToPrevApp() {
            currentAppIndex = (currentAppIndex - 1 + appOrder.length) % appOrder.length;
            switchApp(appOrder[currentAppIndex]);
        }

        function handleMediaViewSwitch(appName) {
            floatingMediaButton.style.display = (appName === 'Media') ? 'none' : 'flex';
            floatingKeyboardButton.style.display = (appName === 'Media') ? 'flex' : 'none';
            clearSearchButton.style.display = (appName === 'Media') ? 'flex' : 'none';
             
             if (appName === 'Media') {
        // 🚀 FIX: تحديث حالة زر لوحة المفاتيح (Active/Inactive)
        if (floatingKeyboardButton) {
            floatingKeyboardButton.style.display = 'flex'; // تأكد من إظهار الزر
            floatingKeyboardButton.classList.toggle('active-keyboard', !youtubeSearchInput.readOnly);
            floatingKeyboardButton.classList.toggle('inactive-keyboard', youtubeSearchInput.readOnly);
        }
        
        // 💡 تحديث زر مسح البحث
        if (clearSearchButton) {
            clearSearchButton.style.display = 'flex';
        }
        
        // 💡 إخفاء زر الوسائط العادي
        if (floatingMediaButton) {
            floatingMediaButton.style.display = 'none';
        }
        

        // --- Logic to show the correct view ---
        youtubeVideoListView.classList.add('hidden');
        youtubeSearchResultsView.classList.add('hidden');
        youtubeSuggestionsDiv.style.display = 'flex'; // Make suggestions visible

        if (activeMediaView === 'videoList' && currentPlayingPlaylistId) {
            youtubeVideoListView.classList.remove('hidden');
        } else if (activeMediaView === 'searchResults') {
            youtubeSearchResultsView.classList.remove('hidden');
        } else {
            // Default to suggestions view
            resetYoutubeSearchUI();
        }
    } else {
        // 🛑 2. منطق إخفاء العناصر في الشاشات الأخرى
        if (floatingKeyboardButton) {
            floatingKeyboardButton.style.display = 'none';
        }
        if (clearSearchButton) {
            clearSearchButton.style.display = 'none';
        }
        if (floatingMediaButton) {
            floatingMediaButton.style.display = 'flex'; // إظهار زر الوسائط العائم
        }
        youtubeSuggestionsDiv.style.display = 'none';
    }
        }
        appButtons.forEach(b => b.addEventListener('click', () => switchApp(b.dataset.app)));
        sidebarIcons.forEach(el => el.classList.add('w-16', 'h-16', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'transition-all', 'duration-300', 'ease-in-out'));
        
        // --- YouTube/Media Functions (REFACTORED) ---
        function onYouTubeIframeAPIReady() { isYouTubeApiReady = true; }
        
        /**
 * Creates an HTML element (Card) for displaying a YouTube video search result 
 * or a video in a playlist.
 *
 * @param {object} video - Object containing video details (title, thumbnail, duration, etc.).
 * @returns {HTMLElement} The complete video card DIV element.
 */
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'glass-surface glass-surface--svg youtube-video-card navigable grid-item';
    card.tabIndex = 0;
    card.dataset.videoId = video.id;

    // Get watched history for this video (assumes getWatchedHistory is defined globally)
    const history = getWatchedHistory();
    const watchedInfo = history[video.id];
    let progressHTML = '';

    if (watchedInfo) {
        if (watchedInfo.progress === -1) { // Fully watched
            progressHTML = `<div class="watched-badge">تمت المشاهدة</div>`;
        } else if (watchedInfo.progress > 0 && watchedInfo.duration > 0) {
            const progressPercent = (watchedInfo.progress / watchedInfo.duration) * 100;
            progressHTML = `<div class="watched-progress-bar-container"><div class="watched-progress-bar" style="width: ${progressPercent}%"></div></div>`;
        }
    }
    
    // Determine bookmark state
    const isSavedD = favoritesD.some(fav => fav.id === video.id);
    const isSavedM = favoritesM.some(fav => fav.id === video.id);
    let bookmarkClass = '';
    if (isSavedD && isSavedM) bookmarkClass = 'saved-both';
    else if (isSavedD) bookmarkClass = 'saved-d';
    else if (isSavedM) bookmarkClass = 'saved-m';

    const isLive = video.duration === 'مباشر'; // Used for live video styling

    card.innerHTML = `
        <div class="video-details">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <div class="flex items-center justify-between w-full gap-2">
                    <div class="flex items-center gap-2 cursor-pointer channel-link min-w-0" data-channel-id="${video.channelId}" data-channel-title="${video.channelTitle}">
                       <img src="${video.channelThumbnail || 'https://placehold.co/24x24/334155/ffffff?text=?'}" alt="${video.channelTitle}" class="w-6 h-6 rounded-full object-cover flex-shrink-0">
                       <span class="hover:underline truncate">${video.channelTitle}</span>
                    </div>
                    <button class="add-channel-from-search-btn p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0 navigable grid-item" data-channel-id="${video.channelId}" data-channel-title="${video.channelTitle}" data-channel-thumbnail="${video.channelThumbnail || ''}" title="إضافة القناة للقائمة" tabindex="0">
                        <i data-lucide="plus-circle" class="w-5 h-5 text-green-400"></i>
                    </button>
                </div>
                <span class="text-xs text-white/60">${video.viewCount} مشاهدة • ${video.publishedAt}</span>
            </div>
        </div>
        <div class="thumbnail-container relative">
            <img src="${video.thumbnail}" alt="${video.title}" class="w-[180px] h-[101.25px] object-cover rounded-md ml-4 flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/180x101';">
            <span class="video-duration ${isLive ? 'bg-red-600 font-bold' : ''}">${video.duration}</span>
            ${progressHTML}
            <button class="bookmark-button ${bookmarkClass}" data-video-id="${video.id}"><i data-lucide="bookmark" class="w-5 h-5"></i></button>
        </div>
    `;
    
    // --- Event Listeners ---

    // 1. تشغيل الفيديو عند النقر على البطاقة
    card.addEventListener('click', () => showVideoPopup(video.id));
    
    // 2. فتح قائمة المفضلة عند النقر على زر الحفظ
    card.querySelector('.bookmark-button').addEventListener('click', (e) => {
        e.stopPropagation(); 
        showFavoritesMenu(e.currentTarget, video);
    });

    // 3. الانتقال إلى القناة عند النقر على رابط القناة
    const channelLink = card.querySelector('.channel-link');
    if (channelLink) {
        channelLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const channelId = e.currentTarget.dataset.channelId;
            const channelTitle = e.currentTarget.dataset.channelTitle;
            if(channelId && channelTitle) {
                searchVideosByChannel(channelId, channelTitle);
            }
        });
    }

    // 4. إضافة القناة من نتائج البحث
    const addChannelBtn = card.querySelector('.add-channel-from-search-btn');
    if (addChannelBtn) {
        // التحقق مما إذا كانت القناة موجودة
        if (localChannelsCache.some(c => c.channelid === video.channelId)) {
            addChannelBtn.disabled = true;
            addChannelBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>`;
        } else {
            addChannelBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const btn = e.currentTarget;
                const channelId = btn.dataset.channelId;
                const channelTitle = btn.dataset.channelTitle;
                const channelThumbnail = btn.dataset.channelThumbnail;
                addChannelFromSearchResult(channelId, channelTitle, channelThumbnail, btn);
            });
        }
    }

    // 5. تهيئة أيقونات Lucide
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
    
    return card;
}

        async function fetchVideosDetails(videoIds) {
            if (!videoIds || videoIds.length === 0) return [];
            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("YouTube API error (videos):", errorData?.error?.message || response.status);
                    return null; // Indicate failure
                }
                const data = await response.json();
                return data.items;
            } catch (error) {
                console.error("Network error in fetchVideosDetails:", error);
                return null; // Indicate failure
            }
        }

        async function fetchChannelsDetails(channelIds) {
            if (!channelIds || channelIds.length === 0) return {};
            const uniqueIds = [...new Set(channelIds)];
            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${uniqueIds.join(',')}&key=${YOUTUBE_API_KEY}`);
                if (!response.ok) {
                    console.error("YouTube API error (channels):", response.status);
                    return {};
                }
                const data = await response.json();
                const channelMap = {};
                if (data.items) {
                    data.items.forEach(channel => {
                        channelMap[channel.id] = channel.snippet.thumbnails.default.url;
                    });
                }
                return channelMap;
            } catch (error) {
                console.error("Network error in fetchChannelsDetails:", error);
                return {};
            }
        }

    function formatDuration(duration) {
    if (!duration) return "00:00";
    
    // محاولة استخراج الساعات والدقائق والثواني باستخدام Regex
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    // إذا فشل الـ Match (كما في حالتك)، نعيد نصاً افتراضياً بدلاً من انهيار الكود
    if (!match) {
        return duration.includes('P') ? "Live" : "00:00";
    }

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));

    return parts.join(':');
}

        function formatViewCount(views) {
            if (views >= 1000000) return `${(views / 1000000).toFixed(1)} مليون`;
            if (views >= 1000) return `${(views / 1000).toFixed(0)} ألف`;
            return views;
        }

        function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return `قبل ${Math.floor(interval)} سنوات`;
            interval = seconds / 2592000;
            if (interval > 1) return `قبل ${Math.floor(interval)} أشهر`;
            interval = seconds / 86400;
            if (interval > 1) return `قبل ${Math.floor(interval)} أيام`;
            interval = seconds / 3600;
            if (interval > 1) return `قبل ${Math.floor(interval)} ساعات`;
            interval = seconds / 60;
            if (interval > 1) return `قبل ${Math.floor(interval)} دقائق`;
            return `قبل ${Math.floor(seconds)} ثوان`;
        }
        
        // --- START: NEW Channel List Functions (JSONBin.io) ---
        async function fetchChannelsList() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_CHANNELS}/latest`, {
                    headers: { 'X-Access-Key': JSONBIN_ACCESS_KEY_CHANNELS }
                });
                if (res.status === 404) return []; // Bin is new/empty
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                localChannelsCache = Array.isArray(data.record) ? data.record : [];
                return localChannelsCache;
            } catch (error) {
                console.error(`Error fetching channels list:`, error);
                return []; // Return empty on error
            }
        }

        async function updateChannelsList(newChannelsList) {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_CHANNELS}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY
                    },
                    body: JSON.stringify(newChannelsList)
                });
                if (!res.ok) throw new Error(`Failed to update channels list: ${res.status}`);
                localChannelsCache = newChannelsList; // Update local cache
                return true;
            } catch (error) {
                console.error(`Error updating channels list:`, error);
                showMessageBox(`حدث خطأ أثناء تحديث قائمة القنوات`);
                return false;
            }
        }

        // --- ADD THIS NEW FUNCTION ---
    function incrementChannelClick(channelId) {
            if (!channelId || !localChannelsCache) return;
            
            let channelFound = false;
            const updatedList = localChannelsCache.map(channel => {
                if (channel && channel.channelid === channelId) { // التأكد من أن 'channel' موجود
                    channelFound = true;
                    const currentClicks = parseInt(channel.clickschannel, 10) || 0; // تحويل آمن إلى رقم
                    return { ...channel, clickschannel: currentClicks + 1 };
                }
                return channel;
            });

            if (channelFound) {
                localChannelsCache = updatedList; // تحديث الذاكرة المؤقتة فورًا
                // إرسال التحديث إلى الخادم في الخلفية
                updateChannelsList(updatedList).catch(err => {
                    console.error("Failed to update channel clicks in background:", err);
                });
            }
        }

        // --- 2. أضف هذه الدالة الجديدة ---
        // (هذه الدالة تصلح بياناتك القديمة في JSONBin بإضافة clickschannel: 0)
        async function migrateChannelData() {
            if (localStorage.getItem('channelMigrationDone')) {
                return; // تم التنفيذ من قبل
            }

            console.log("Running channel data migration (one time only)...");
            try {
                let currentList = await fetchChannelsList(); // جلب القائمة الحالية
                let needsUpdate = false;
                
                const updatedList = currentList.map(channel => {
                    if (channel && typeof channel === 'object' && channel.channelid) {
                        // إذا كانت الخاصية غير موجودة
                        if (typeof channel.clickschannel === 'undefined') {
                            needsUpdate = true;
                            return { ...channel, clickschannel: 0 }; // أضفها بقيمة 0
                        }
                    }
                    return channel;
                });

                if (needsUpdate) {
                    console.log("Updating channels in JSONBin with default clickschannel: 0...");
                    await updateChannelsList(updatedList);
                    localChannelsCache = updatedList; // تحديث الذاكرة المؤقتة
                    console.log("Migration complete.");
                } else {
                    console.log("No channel data migration needed.");
                }
                
                localStorage.setItem('channelMigrationDone', 'true'); // تسجيل أنه تم
            } catch (error) {
                console.error("Error during channel data migration:", error);
            }
        }

        function showAddChannelPrompt() {
            const existingPrompt = document.getElementById('add-channel-prompt');
            if (existingPrompt) existingPrompt.remove();

            const promptHTML = `
                <div id="add-channel-prompt" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
                    <div id="add-channel-prompt-content" class="glass-surface glass-surface--svg p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 transition-all duration-300">
                        <h3 class="text-xl font-bold text-center">إضافة قناة يوتيوب جديدة</h3>
                        <p class="text-sm text-white/70 text-center">ابحث باسم القناة لإضافتها إلى قائمتك.</p>
                        <div class="flex gap-2">
                            <input type="text" id="new-channel-search-input" placeholder="اسم القناة..." class="flex-grow p-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 navigable grid-item" tabindex="0" />
                            <button id="search-channel-confirm" class="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-full navigable grid-item" tabindex="0">
                                <i data-lucide="search" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <div id="channel-search-results" class="mt-4 max-h-[50vh] overflow-y-auto flex flex-col gap-3">
                            <!-- Search results will appear here -->
                        </div>
                         <button id="add-channel-cancel" class="mt-2 bg-red-600/80 hover:bg-red-700/80 text-white font-bold py-2 px-4 rounded-full navigable grid-item self-center" tabindex="0">إغلاق</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', promptHTML);
            lucide.createIcons();

            const promptEl = document.getElementById('add-channel-prompt');
            const inputEl = document.getElementById('new-channel-search-input');
            const confirmBtn = document.getElementById('search-channel-confirm');
            const cancelBtn = document.getElementById('add-channel-cancel');

            const closePrompt = () => promptEl.remove();

            confirmBtn.addEventListener('click', handleSearchForChannel);
            cancelBtn.addEventListener('click', closePrompt);
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchForChannel();
                }
            });
            
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    closePrompt();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            inputEl.focus();
            setFocus(inputEl);
        }

        async function handleSearchForChannel() {
            const inputEl = document.getElementById('new-channel-search-input');
            const resultsContainer = document.getElementById('channel-search-results');
            const confirmBtn = document.getElementById('search-channel-confirm');
            const query = inputEl.value.trim();

            if (!query) {
                showMessageBox("الرجاء إدخال اسم قناة للبحث.");
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
            lucide.createIcons();
            resultsContainer.innerHTML = '<p class="text-center text-white/70">...جاري البحث</p>';

            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${YOUTUBE_API_KEY}&maxResults=10`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                displayChannelSearchResults(data.items);
            } catch (error) {
                console.error("Error searching for channel:", error);
                resultsContainer.innerHTML = '<p class="text-center text-red-400">حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.</p>';
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `<i data-lucide="search" class="w-5 h-5"></i>`;
                lucide.createIcons();
            }
        }

        function displayChannelSearchResults(channels) {
            const resultsContainer = document.getElementById('channel-search-results');
            resultsContainer.innerHTML = '';

            if (!channels || channels.length === 0) {
                resultsContainer.innerHTML = '<p class="text-center text-white/70">لم يتم العثور على قنوات بهذا الاسم.</p>';
                return;
            }

            channels.forEach(channel => {
                const isSaved = localChannelsCache.some(c => c.channelid === channel.id.channelId);
                const resultCard = document.createElement('div');
                resultCard.className = 'flex items-center gap-4 p-3 rounded-xl bg-white/5';
                resultCard.innerHTML = `
                    <img src="${channel.snippet.thumbnails.default.url}" alt="${channel.snippet.title}" class="w-16 h-16 rounded-full object-cover">
                    <div class="flex-grow min-w-0">
                        <h4 class="font-bold truncate">${channel.snippet.title}</h4>
                        <p class="text-sm text-white/60 truncate">${channel.snippet.description || 'لا يوجد وصف'}</p>
                    </div>
                    <button 
                        class="add-channel-from-modal-btn p-2 rounded-full transition-colors flex-shrink-0 navigable grid-item ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}" 
                        data-channel-id="${channel.id.channelId}" 
                        data-channel-title="${channel.snippet.title}" 
                        data-channel-thumbnail="${channel.snippet.thumbnails.default.url}"
                        ${isSaved ? 'disabled' : ''}
                        tabindex="0"
                    >
                        <i data-lucide="${isSaved ? 'check' : 'plus'}" class="w-5 h-5 text-white"></i>
                    </button>
                `;
                resultsContainer.appendChild(resultCard);

                if (!isSaved) {
                    resultCard.querySelector('.add-channel-from-modal-btn').addEventListener('click', (e) => {
                        const btn = e.currentTarget;
                        const channelId = btn.dataset.channelId;
                        const channelTitle = btn.dataset.channelTitle;
                        const channelThumbnail = btn.dataset.channelThumbnail;
                        handleAddChannelFromModal(channelId, channelTitle, channelThumbnail);
                    });
                }
            });
            lucide.createIcons();
            updateNavigableElements();
        }

/**
 * NEW: Displays a modal prompt to input a YouTube video URL/ID for adding to favorites.
 */
function promptAddVideoByUrl() {
    const existingPrompt = document.getElementById('add-video-prompt');
    if (existingPrompt) existingPrompt.remove();

    const promptHTML = `
        <div id="add-video-prompt" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
            <div id="add-video-prompt-content" class="glass-surface glass-surface--svg p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
                <h3 class="text-xl font-bold text-center">إضافة فيديو جديد بالرابط</h3>
                <p class="text-sm text-white/70 text-center">الصق رابط يوتيوب أو مُعرّف الفيديو (ID) أدناه.</p>
                <div class="flex gap-2 grid-container">
                    <input type="text" id="new-video-url-input" placeholder="مثال: https://youtu.be/dQw4w9WgXcQ" class="flex-grow p-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 navigable grid-item" tabindex="0" />
                </div>
                
                <div id="url-action-buttons" class="flex justify-between mt-2 gap-3">
                    <button id="add-video-cancel" class="bg-gray-600/80 hover:bg-gray-700/80 text-white font-bold py-2 px-4 rounded-full navigable grid-item flex-1" tabindex="0">إلغاء</button>
                    <button id="add-video-confirm" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full navigable grid-item flex-1" tabindex="0">إضافة</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', promptHTML);
    lucide.createIcons();

    const promptEl = document.getElementById('add-video-prompt');
    const urlInput = document.getElementById('new-video-url-input');
    const confirmBtn = document.getElementById('add-video-confirm');
    const cancelBtn = document.getElementById('add-video-cancel');

    const closePrompt = () => {
        promptEl.remove();
        updateNavigableElements(); 
    };

    // 🛑 ربط زر الإضافة بالدالة الجديدة
    confirmBtn.addEventListener('click', () => addVideoFromUrl(urlInput.value));
    
    // دعم البحث بزر Enter
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addVideoFromUrl(urlInput.value); 
        }
    });

    cancelBtn.addEventListener('click', closePrompt);
    urlInput.focus();
    setFocus(urlInput);
    updateNavigableElements();
}

/**
 * NEW: Extracts video ID from URL and adds the video to the Car Favorites List (D).
 * * @param {string} url - The URL or video ID provided by the user.
 */
async function addVideoFromUrl(url) {
    // 1. استخراج الـ ID من الرابط
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/(?:shorts\/))([\w-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url.trim();

    if (videoId.length !== 11) {
        showMessageBox("الرابط غير صالح. يرجى إدخال رابط يوتيوب صحيح أو مُعرّف فيديو (ID).");
        return;
    }
    
    const confirmBtn = document.getElementById('add-video-confirm');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
    lucide.createIcons();

    try {
        // 2. جلب تفاصيل الفيديو باستخدام الـ ID
        const videoDetailsList = await fetchVideosDetails([videoId]);

        if (!videoDetailsList || videoDetailsList.length === 0) {
            showMessageBox("تعذر العثور على الفيديو. تأكد من أن الرابط صحيح وعام.");
            return;
        }

        const video = videoDetailsList[0];
        
        // 3. تجهيز بيانات الحفظ
        const videoToSave = {
            id: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.medium.url,
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            duration: formatDuration(video.contentDetails.duration),
            progress: 0 // يبدأ من الصفر
        };

        // 4. حفظ الفيديو إلى قائمة السيارة (D)
        const favoritesList = favoritesD;
        if (favoritesList.some(fav => fav.id === video.id)) {
            showMessageBox("هذا الفيديو موجود بالفعل في قائمة المتابعة في السيارة.");
            return;
        }

        const updatedList = [videoToSave, ...favoritesList];
        const success = await updateFavorites('D', updatedList);

        if (success) {
            favoritesD = updatedList; // تحديث القائمة العامة
            showMessageBox(`تمت إضافة الفيديو "${video.snippet.title}" إلى قائمة السيارة.`);
            
            // إعادة تحميل المفضلة إذا كانت الشاشة مفتوحة
            const activeTab = document.querySelector('#screen-Media .tab-button.active')?.id;
            if (activeTab === 'tab-saved-d') { loadSavedVideos('D'); }
        }
        
    } catch (error) {
        console.error("Error adding video by URL:", error);
        showMessageBox("حدث خطأ أثناء إضافة الفيديو. يرجى التحقق من مفتاح API.");
    } finally {
        document.getElementById('add-video-prompt').remove();
        updateNavigableElements();
    }
}

// --- REPLACE THIS FUNCTION ---
        async function handleAddChannelFromModal(channelId, channelTitle, channelThumbnail) {
            const modalButton = document.querySelector(`.add-channel-from-modal-btn[data-channel-id="${channelId}"]`);
            if (modalButton) {
                modalButton.disabled = true;
                modalButton.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 text-yellow-400 animate-spin"></i>`;
                lucide.createIcons();
            }

            try {
                if (localChannelsCache.some(c => c.channelid === channelId)) {
                     showMessageBox("هذه القناة موجودة بالفعل في قائمتك.");
                     if (modalButton) {
                         modalButton.innerHTML = `<i data-lucide="check" class="w-5 h-5 text-white"></i>`;
                         modalButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                         modalButton.classList.add('bg-green-600');
                         lucide.createIcons();
                     }
                     return;
                }

                // [FIX] إضافة خاصية clickschannel: 0
                const newChannel = { 
                    name: channelTitle, 
                    image: channelThumbnail, 
                    channelid: channelId, 
                    channeltitle: channelTitle,
                    clickschannel: 0 
                };
                
                const updatedList = [...localChannelsCache, newChannel];
                const success = await updateChannelsList(updatedList);

                if (success) {
                    showMessageBox(`تمت إضافة قناة "${newChannel.name}" بنجاح.`);
                    if (modalButton) {
                         modalButton.innerHTML = `<i data-lucide="check" class="w-5 h-5 text-white"></i>`;
                         modalButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                         modalButton.classList.add('bg-green-600');
                         lucide.createIcons();
                    }
                    // ... (الكود الخاص بك لتحديث الواجهة) ...
                    const suggestionsContent = document.getElementById('suggestions-content');
                    if(suggestionsContent) {
                        const activeTabId = document.querySelector('#screen-Media .tab-button.active')?.id;
                        suggestionsContent.innerHTML = '';
                        await populateYoutubeSuggestions();
                        if (activeTabId) { document.getElementById(activeTabId)?.click(); } 
                        else { document.getElementById('tab-channels')?.click(); }
                    }
                }
            } catch (error) {
                console.error("Error adding channel from modal:", error);
                showMessageBox("حدث خطأ أثناء إضافة القناة.");
                if (modalButton) {
                     modalButton.disabled = false;
                     modalButton.innerHTML = `<i data-lucide="plus" class="w-5 h-5 text-white"></i>`;
                     lucide.createIcons();
                }
            }
        }

       async function addChannelFromSearchResult(channelId, channelTitle, channelThumbnail, buttonElement) {
            if (!channelId || !channelTitle) {
                showMessageBox("معلومات القناة غير كاملة.");
                return;
            }

            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>`;
                lucide.createIcons();
            }

            try {
                if (localChannelsCache.some(c => c.channelid === channelId)) {
                     showMessageBox("هذه القناة موجودة بالفعل في قائمتك.");
                     return;
                }

                const newChannel = {
                    name: channelTitle,
                    image: channelThumbnail,
                    channelid: channelId,
                    channeltitle: channelTitle,
                    clickschannel: 0 // [تعديل] إضافة عدّاد النقرات
                };

                const updatedList = [...localChannelsCache, newChannel];
                const success = await updateChannelsList(updatedList);

                if (success) {
                    showMessageBox(`تمت إضافة قناة "${newChannel.name}" بنجاح.`);
                } else {
                    if (buttonElement) {
                        buttonElement.disabled = false;
                        buttonElement.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-green-400"></i>`;
                        lucide.createIcons();
                    }
                }

            } catch (error) {
                console.error("Error adding channel from search result:", error);
                showMessageBox("حدث خطأ أثناء إضافة القناة.");
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-green-400"></i>`;
                    lucide.createIcons();
                }
            }
        }

        async function removeChannelFromList(channelId, channelName) {
            if (!channelId) return;

            // This function directly removes the channel. A confirmation modal would be a good addition later.
            try {
                const updatedList = localChannelsCache.filter(c => c.channelid !== channelId);
                const success = await updateChannelsList(updatedList);
                
                if (success) {
                    showMessageBox(`تمت إزالة قناة "${channelName}" بنجاح.`);
                    // Refresh the entire suggestions view to reflect the deletion
                    const suggestionsContent = document.getElementById('suggestions-content');
                    if(suggestionsContent) {
                       suggestionsContent.innerHTML = '';
                       await populateYoutubeSuggestions(); // await to ensure it completes
                       // After refresh, focus might be lost, so let's refocus on the tab
                       const activeTab = document.querySelector('#screen-Media .tab-button.active');
                       if(activeTab) setFocus(activeTab);
                    }
                }
            } catch (error) {
                console.error("Error removing channel from list:", error);
                showMessageBox("حدث خطأ أثناء إزالة القناة.");
            }
        }
        // --- END: NEW Channel List Functions ---
        
        async function searchYouTubeVideos(query) {
            try {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=25`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error("YouTube API error (search):", errorData?.error?.message || res.status);
                    throw new Error("API search request failed.");
                }
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    const videoIds = data.items.map(item => item.id.videoId);
                    const videoDetails = await fetchVideosDetails(videoIds);

                    if (videoDetails === null) {
                        throw new Error("Failed to fetch details for search results.");
                    }
                    
                    // NEW: Fetch channel thumbnails
                    const channelIds = [...new Set(videoDetails.map(video => video.snippet.channelId))];
                    const channelThumbnails = await fetchChannelsDetails(channelIds);

                    lastSuccessfulSearchQuery = query; // NEW: Save the last successful query
                    searchResultsContainer.innerHTML = '';
                    videoDetails.forEach(video => {
                        const isLive = video.snippet.liveBroadcastContent === 'live';
                        const durationString = video.contentDetails.duration;

                        if (!isLive) {
                            const durationSeconds = durationString.match(/\d+/g)?.map(Number).reduce((acc, time, i, arr) => acc + time * (arr.length === 3 ? [3600, 60, 1][i] : (arr.length === 2 ? [60, 1][i] : 1)), 0) || 0;
                            if (durationSeconds <= 61) return;
                        }

                        const videoData = {
                            id: video.id,
                            title: video.snippet.title,
                            thumbnail: video.snippet.thumbnails.medium.url,
                            channelTitle: video.snippet.channelTitle,
                            channelId: video.snippet.channelId,
                            channelThumbnail: channelThumbnails[video.snippet.channelId],
                            viewCount: formatViewCount(video.statistics.viewCount),
                            publishedAt: formatTimeAgo(video.snippet.publishedAt),
                            duration: isLive ? 'مباشر' : formatDuration(durationString)
                        };
                        searchResultsContainer.appendChild(createVideoCard(videoData));
                    });
                    
                    youtubeSuggestionsDiv.style.display = 'none';
                    youtubeVideoListView.classList.add('hidden');
                    youtubeSearchResultsView.classList.remove('hidden');
                    activeMediaView = 'searchResults';
                    backToPlaylistsBottomButton.style.display = 'none';
                    backToPlaylistsBottomButtonSearch.style.display = 'flex';
                    backToSearchFloatingButton.style.display = 'flex'; // NEW: Show the floating button
                    // The back button is now inside a container, so we don't hide/show it directly
                    updateNavigationButtons(query); // NEW: Update navigation buttons
                    setTimeout(() => { const firstResult = searchResultsContainer.querySelector('.grid-item'); if (firstResult) setFocus(firstResult); }, 100);
                } else {
                    showMessageBox('لم يتم العثور على نتائج بحث لـ: ' + query);
                }
            } catch (err) {
                console.error('Error searching YouTube videos:', err);
                showMessageBox('حدث خطأ أثناء البحث في يوتيوب. قد تكون هناك مشكلة في الاتصال أو مفتاح API.');
            }
        }
        
      /**
 * Searches for a channel's content, prioritizing currently live videos over regular uploads,
 * then displays the combined results on the search results screen.
 *
 * @param {string} channelId - The ID of the YouTube channel.
 * @param {string} channelTitle - The name of the YouTube channel.
 */
async function searchVideosByChannel(channelId, channelTitle) {
    if (!channelId) return;

    searchResultsContainer.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-center w-full text-white col-span-full">جاري تحميل الفيديوهات من ${channelTitle}...</h2>`;
    youtubeSuggestionsDiv.style.display = 'none';
    youtubeVideoListView.classList.add('hidden');
    youtubeSearchResultsView.classList.remove('hidden');
    activeMediaView = 'searchResults';

    try {
        // 1. جلب قائمة التحميلات (Uploads Playlist ID)
        const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`);
        if (!channelRes.ok) throw new Error("Failed to fetch channel details.");
        const channelData = await channelRes.json();
        const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        const channelThumbnail = channelData?.items?.[0]?.snippet?.thumbnails?.default?.url;

        if (!uploadsPlaylistId) {
             throw new Error("Could not find the uploads playlist for this channel.");
        }

        // 2. جلب مقاطع الفيديو العادية من قائمة التحميلات (Uploads Playlist)
        const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}&maxResults=15`);
        if (!playlistRes.ok) throw new Error("Failed to fetch videos from the channel's playlist.");
        const playlistData = await playlistRes.json();

        // استخراج IDs من القائمة
        let videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).filter(id => id);
        
        // 3. جلب مقاطع الفيديو المباشرة (Live Broadcasts) - الأولوية
        const liveRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${YOUTUBE_API_KEY}&maxResults=10`);
        const liveData = await liveRes.json();
        
        // استخراج IDs للفيديوهات المباشرة
        const liveVideoIds = liveData.items.map(item => item.id.videoId);

        // 4. دمج الـ IDs: نضع البث المباشر أولاً ثم المقاطع العادية (مع إزالة التكرارات)
        const combinedVideoIds = [...new Set([...liveVideoIds, ...videoIds])]; 
        
        if (combinedVideoIds.length === 0) {
            searchResultsContainer.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-center w-full text-white col-span-full">لا توجد فيديوهات متاحة حالياً في قناة ${channelTitle}</h2>`;
            // 🛑 FIX: تعيين حالة بحث القناة لتفعيل زر العودة
            lastSuccessfulSearchQuery = `CHANNEL_ID:${channelId}:${channelTitle}`;
            return;
        }

        // 5. جلب التفاصيل الكاملة (مدة، إحصائيات، إلخ)
        const videoDetails = await fetchVideosDetails(combinedVideoIds);

        searchResultsContainer.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-center w-full text-white col-span-full"> فيديوهات من ${channelTitle}</h2>`;

        videoDetails.forEach(video => {
            const isLive = video.snippet.liveBroadcastContent === 'live';
            const durationString = video.contentDetails?.duration;
            
            // تخطي المقاطع القصيرة جداً
            if (!isLive && (!durationString || durationString.match(/\d+/g)?.map(Number).reduce((acc, time, i, arr) => acc + time * (arr.length === 3 ? [3600, 60, 1][i] : (arr.length === 2 ? [60, 1][i] : 1)), 0) || 0) <= 61) return;

            const videoData = {
                id: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.medium.url,
                channelTitle: video.snippet.channelTitle,
                channelId: video.snippet.channelId,
                channelThumbnail: channelThumbnail,
                viewCount: formatViewCount(video.statistics?.viewCount || 0),
                publishedAt: formatTimeAgo(video.snippet.publishedAt),
                duration: isLive ? 'مباشر' : formatDuration(durationString)
            };
            searchResultsContainer.appendChild(createVideoCard(videoData));
        });

        // 🛑 CRITICAL FIX: تعيين حالة البحث الناجح للقناة لتمكين زر العودة
        lastSuccessfulSearchQuery = `CHANNEL_ID:${channelId}:${channelTitle}`; 

        // 6. تحديث الواجهة والتنقل
        lucide.createIcons();
        updateNavigableElements();
        backToPlaylistsBottomButton.style.display = 'none';
        backToPlaylistsBottomButtonSearch.style.display = 'flex';
        backToSearchFloatingButton.style.display = 'flex';
        previousItemButton.style.display = 'none';
        nextItemButton.style.display = 'none';
        setTimeout(() => { const firstResult = searchResultsContainer.querySelector('.grid-item'); if (firstResult) setFocus(firstResult); }, 100);
        
    } catch (err) {
        console.error('Error searching videos by channel:', err);
        searchResultsContainer.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-center w-full text-white col-span-full text-red-400">حدث خطأ أثناء تحميل فيديوهات القناة. قد تكون هناك مشكلة في الاتصال أو مفتاح API.</h2>`;
    }
}   

/**
 * Asynchronously loads and displays the YouTube video player in a floating popup window.
 * Complete Version with API Safety & JSONBINIO Bookmark Integration.
 */
async function showVideoPopup(videoId, startOverride = null) {
    // 1. تحديد نقطة بداية التشغيل (من السجل أو من الصفر)
    const start = startOverride !== null ? startOverride : (() => {
        const history = getWatchedHistory();
        const watchedInfo = history[videoId];
        // استئناف التشغيل فقط إذا تم مشاهدة أكثر من 5 ثوانٍ
        return (watchedInfo && watchedInfo.progress > 5) ? watchedInfo.progress : 0;
    })();
    
    // 2. إدارة حالة واجهة المستخدم والرسوم المتحركة الخلفية
    document.body.classList.add('animation-paused');
    const playIcon = pauseAnimationButton ? pauseAnimationButton.querySelector('[data-lucide="play"]') : null;
    const pauseIcon = pauseAnimationButton ? pauseAnimationButton.querySelector('[data-lucide="pause"]') : null;
    if (playIcon && pauseIcon) {
        playIcon.classList.remove('hidden'); 
        pauseIcon.classList.add('hidden');
    }

    // 3. التحقق من جاهزية YouTube API (مع حماية ضد التكرار اللانهائي)
    // نستخدم عداد محاولات (retryCount) كخاصية ثابتة للدالة أو نتحقق ببساطة
    if (!window.isYouTubeApiReady || !window.YT || !window.YT.Player) {
        // إذا لم تكن جاهزة، نحاول مرة واحدة بعد 200 ملي ثانية ثم نتوقف أو نظهر خطأ
        // لتجنب الحلقة المفرغة، نتحقق هل هذه "إعادة محاولة" أم لا
        if (!showVideoPopup.retries) showVideoPopup.retries = 0;
        
        if (showVideoPopup.retries < 10) {
            console.warn(`⏳ YouTube API not ready. Retrying (${showVideoPopup.retries}/10)...`);
            showVideoPopup.retries++;
            return setTimeout(() => showVideoPopup(videoId, startOverride), 200);
        } else {
            console.error("❌ YouTube API failed to load.");
            alert("فشل تحميل مشغل الفيديو. يرجى التحقق من الاتصال.");
            showVideoPopup.retries = 0; // تصفير العداد للمرات القادمة
            return;
        }
    }
    showVideoPopup.retries = 0; // تصفير العداد عند النجاح

    // 4. إظهار الحاوية وتجهيز المتغيرات
    currentPlayingVideoId = videoId;
    videoPopupContainer.style.display = 'flex'; 
    videoPopupContainer.classList.add('active');
    
    // إخفاء الكبسولة المصغرة إذا كانت نشطة
    if (floatingMinimizedVideoButton) floatingMinimizedVideoButton.style.display = 'none';
    appState.isVideoPlayerMinimized = false;

    // ============================================================
    // 💎 إعداد زر المارك بوك (ID جديد + وظيفة JSONBINIO القديمة)
    // ============================================================
    const controlsContainer = videoPopupCloseButton.parentElement;
    
    // البحث عن الزر بالـ ID المميز الجديد
    let bookmarkBtn = document.getElementById('video-popup-bookmark-button');
    
    if (!bookmarkBtn && controlsContainer) {
        bookmarkBtn = document.createElement('button');
        bookmarkBtn.id = 'video-popup-bookmark-button'; // ✅ ID فريد للبوب-أب
        
        // نفس الستايل الزجاجي
        bookmarkBtn.className = 'navigable grid-item p-3 rounded-full glass-surface glass-surface--svg hover:bg-white/20 transition-colors';
        bookmarkBtn.innerHTML = `<i data-lucide="bookmark" class="w-6 h-6"></i>`;
        bookmarkBtn.title = "Save to Favorites";
        bookmarkBtn.tabIndex = 0;
        
        // ✅ ربط الحدث بالوظيفة القديمة
        bookmarkBtn.onclick = (e) => {
             e.stopPropagation();
             e.preventDefault();

             // 1. تحضير بيانات الفيديو للكائن القديم
             // نحاول جلب العنوان الحقيقي من المشغل، أو نستخدم عنوان مؤقت
             const playerTitle = (popupPlayer && typeof popupPlayer.getVideoData === 'function') 
                                ? popupPlayer.getVideoData().title 
                                : ""; 
             
             // استخدام العنوان المخزن في الحالة إذا لم يتوفر في المشغل
             const finalTitle = playerTitle || appState.currentVideoTitle || "Unknown Video";

             const videoData = {
                 id: currentPlayingVideoId,
                 title: finalTitle,
                 thumbnail: `https://i.ytimg.com/vi/${currentPlayingVideoId}/mqdefault.jpg`
             };
             
             // 2. استدعاء القائمة القديمة (JSONBINIO Logic)
             // نمرر لها الزر الحالي (لضبط المكان) وبيانات الفيديو
             if (typeof showFavoritesMenu === 'function') {
                 showFavoritesMenu(bookmarkBtn, videoData);
             } else {
                 console.error("showFavoritesMenu function is missing!");
             }
        };
        
        // إضافته قبل زر الإغلاق
        controlsContainer.insertBefore(bookmarkBtn, videoPopupCloseButton);
    }
    
    // ربط زر التصغير (Minimize)
    const videoPopupMinimizeButton = document.getElementById('video-popup-minimize-button');
    if (videoPopupMinimizeButton) {
        videoPopupMinimizeButton.onclick = (e) => {
            e.stopPropagation();
            minimizeVideoPopup(); 
        };
    }

    // 5. تهيئة وتشغيل مشغل يوتيوب (YT.Player)
    if (popupPlayer && typeof popupPlayer.loadVideoById === 'function') { 
        // المشغل موجود مسبقاً -> تحميل الفيديو الجديد
        popupPlayer.loadVideoById({ videoId, startSeconds: start });
        // لا تنس إعادة ربط مستمع تغيير السرعة
        // popupPlayer.addEventListener('onPlaybackRateChange', handlePlaybackRateChange);
    } else {
        // المشغل غير موجود -> إنشاء جديد
        videoPopupPlayerContainer.innerHTML = '<div id="video-popup-player"></div>';
        
        window.popupPlayer = new YT.Player('video-popup-player', {
            height: '100%', 
            width: '100%', 
            videoId: videoId,
            playerVars: { 
                'autoplay': 1, 
                'controls': 1, 
                'start': Math.floor(start),
                'origin': window.location.origin, // حماية CORS
                'rel': 0, // منع الفيديوهات المقترحة الخارجية
                'modestbranding': 1
            },
            events: { 
                'onReady': (e) => {
                    e.target.playVideo();
                    // تطبيق آخر سرعة محفوظة إذا وجدت
                    // if (lastPlaybackRate) e.target.setPlaybackRate(lastPlaybackRate);
                },
                'onStateChange': onPlayerStateChange, 
                'onPlaybackRateChange': handlePlaybackRateChange 
            }
        });
    }

    // 6. نقل التركيز لزر الإغلاق (Accessibility) وتحديث الأيقونات
    setTimeout(() => {
        if (typeof setFocus === 'function') setFocus(videoPopupCloseButton);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
}

// ============================================================
// 📋 الوظيفة المتوقعة: قائمة الخيارات (سيارة، تلفاز، مفضلة)
// ============================================================
function showPopupBookmarkMenu(anchorBtn, videoId) {
    // 1. إغلاق أي قائمة مفتوحة سابقاً
    const existingMenu = document.getElementById('popup-options-menu');
    if (existingMenu) existingMenu.remove();

    // 2. إنشاء القائمة
    const menu = document.createElement('div');
    menu.id = 'popup-options-menu';
    
    // تنسيق القائمة لتكون فوق كل شيء (High Z-Index)
    Object.assign(menu.style, {
        position: 'fixed',
        zIndex: '2147483647', // أعلى طبقة ممكنة
        background: 'rgba(25, 25, 25, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '8px',
        minWidth: '220px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '4px',
        opacity: '0', transform: 'translateY(-10px)', transition: 'all 0.2s ease'
    });

    // 3. تعريف الخيارات المطلوبة
    const options = [
        { id: 'favorites', label: 'المفضلة (Favorites)', icon: '❤️' },
        { id: 'car',       label: 'المتابعة في السيارة', icon: '🚗' }, // ✅ الخيار المطلوب
        { id: 'tv',        label: 'المتابعة في التلفاز', icon: '📺' }, // ✅ الخيار المطلوب
        { id: 'watch_later', label: 'المشاهدة لاحقاً',   icon: '⏰' }
    ];

    // 4. بناء عناصر القائمة
    options.forEach(opt => {
        const item = document.createElement('div');
        Object.assign(item.style, {
            padding: '10px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.2s'
        });
        
        item.innerHTML = `<span>${opt.icon}</span> <span style="font-weight:500">${opt.label}</span>`;
        
        // تأثير التحويم
        item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.1)';
        item.onmouseleave = () => item.style.background = 'transparent';
        
        // عند الضغط
        item.onclick = (e) => {
            e.stopPropagation();
            // استدعاء دالة الحفظ الموجودة في نظامك
            if (typeof saveToPlaylist === 'function') {
                saveToPlaylist(opt.id, videoId); 
                console.log(`Saving to ${opt.id}`);
            } else {
                console.warn(`Function saveToPlaylist not found. Action: ${opt.id}`);
            }
            // إغلاق القائمة
            menu.style.opacity = '0';
            setTimeout(() => menu.remove(), 200);
        };
        
        menu.appendChild(item);
    });

    // 5. وضع القائمة في الصفحة (داخل Body لتجنب القص)
    document.body.appendChild(menu);

    // 6. حساب الموقع (Positioning Logic)
    const rect = anchorBtn.getBoundingClientRect();
    
    // الموقع الرأسي: أسفل الزر
    menu.style.top = (rect.bottom + 8) + 'px';
    
    // الموقع الأفقي: محاذاة لليسار، مع منع الخروج عن الشاشة
    if (rect.left + 230 > window.innerWidth) {
        menu.style.left = (window.innerWidth - 240) + 'px';
    } else {
        menu.style.left = rect.left + 'px';
    }

    // 7. أنيميشن الظهور
    requestAnimationFrame(() => {
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0)';
    });

    // 8. إغلاق عند النقر خارج القائمة
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== anchorBtn) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 100);
}

async function hideVideoPopup() {
    // 1. إيقاف تتبع التقدم
    if (progressInterval) clearInterval(progressInterval);

    let videoId, currentTime, duration;

    // 2. التحقق من صلاحية المشغل وإيقافه (بدلاً من تدميره)
    if (popupPlayer && typeof popupPlayer.pauseVideo === 'function') {
        popupPlayer.pauseVideo(); // إيقاف الفيديو
        
        // 3. حفظ حالة الفيديو
        const videoData = popupPlayer.getVideoData();
        videoId = videoData ? videoData.video_id : null;
        currentTime = popupPlayer.getCurrentTime();
        duration = popupPlayer.getDuration();
        
        // 4. تحديث التقدم في الذاكرة (localStorage/JSONBin)
        if (videoId) {
            await updateVideoProgress(videoId, currentTime, duration);
        }
        
    } else {
        // إذا كان المشغل غير متاح، نستخدم البيانات المخزنة إذا أمكن
        videoId = currentPlayingVideoId; 
    }
    
    // 🛑 CRITICAL FIX: لا نقوم بتدمير المشغل هنا، فقط نغير حالة الواجهة المرئية
    
    // 5. تحديث الواجهة المرئية
    document.body.classList.remove('animation-paused');
    const playIcon = pauseAnimationButton.querySelector('[data-lucide="play"]');
    const pauseIcon = pauseAnimationButton.querySelector('[data-lucide="pause"]');
    if (playIcon && pauseIcon) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
    
    videoPopupContainer.classList.remove('active');
    videoPopupContainer.style.display = 'none';
    floatingMinimizedVideoButton.style.display = 'none';
    appState.isVideoPlayerMinimized = false;

    // 6. تنظيف الـ DOM (إزالة زر الحفظ المؤقت)
    const bookmarkBtn = document.getElementById('video-popup-bookmark-button');
    if (bookmarkBtn) {
        bookmarkBtn.remove();
    }
    
    // 7. نقل التركيز
    const screen = document.querySelector('.app-screen.active');
    if (screen) {
        const item = screen.querySelector('.grid-item');
        if (item) setFocus(item);
    }
}
        
        // NEW: Functions to minimize and restore the video popup
       // ... (تعريف العناصر في البداية)
const minimizedPlayPauseBtn = document.getElementById('minimized-play-pause-btn');
const minimizedRestoreBtn = document.getElementById('minimized-restore-btn');
const minimizedPlaybackSpeed = document.getElementById('minimized-playback-speed');
// ...


/**
 * REPLACED & FINALIZED: Minimizes the active YouTube popup player into the 
 * floating audio capsule. Reduces playback quality to 'tiny' for resource saving.
 */
function minimizeVideoPopup() {
    if (!videoPopupContainer.classList.contains('active')) return;
    
    // 🛑 1. ضبط جودة التشغيل على أدنى حد للتركيز على الصوت وتوفير الموارد
    if (popupPlayer && typeof popupPlayer.setPlaybackQuality === 'function') {
        // نضبط الجودة على "Tiny" أو "Small" لإجبار المتصفح على التركيز على الصوت
        popupPlayer.setPlaybackQuality('tiny'); 
        
        // 💡 تلميح: إرسال أمر تشغيل Play إلى الـ iframe يدوياً يساعد في الخلفية
        const iframe = popupPlayer.getIframe();
        if (iframe && iframe.contentWindow) {
             iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
    } else {
        // إذا كان المشغل غير مهيأ، نحاول تشغيل الصوت (قد لا يعمل)
        console.warn("Cannot minimize: YouTube player is not ready for background mode.");
    }
    
    // 2. إخفاء المشغل الكبير وإظهار الكبسولة
    videoPopupContainer.style.display = 'none';
    floatingMinimizedVideoButton.style.display = 'flex';
    floatingMinimizedVideoButton.classList.add('active'); // تفعيل الكبسولة

    // 3. تحديث الحالة
    appState.isVideoPlayerMinimized = true;
    
    // 4. تحديث حالة أيقونات التشغيل والسرعة في الكبسولة
    updateMinimizedControlsState(); 

    // 5. تحديث عنوان الكبسولة
    const videoData = popupPlayer ? popupPlayer.getVideoData() : null;
    const titleElement = floatingMinimizedVideoButton.querySelector('.minimized-title');
    if(titleElement) titleElement.textContent = (videoData && videoData.title) ? videoData.title : 'الصوت يعمل...';
    
    // 6. نقل التركيز إلى الكبسولة
    setFocus(floatingMinimizedVideoButton);
}

function restoreVideoPopup() {
    // 1. شروط الأمان
    if (!appState.isVideoPlayerMinimized) return;
    
    // 2. تغيير حالة العرض
    videoPopupContainer.style.display = 'flex'; // 👈 إظهار المشغل الرئيسي (حل مشكلة الشاشة السوداء)
    floatingMinimizedVideoButton.style.display = 'none'; // إخفاء الكبسولة المصغرة
    floatingMinimizedVideoButton.classList.remove('active');
    
    // 3. تحديث الحالة
    appState.isVideoPlayerMinimized = false;
    
    // 🛑 FIX: استئناف التشغيل بالجودة المناسبة وضمان تحديث الـ iframe
    if (popupPlayer && typeof popupPlayer.playVideo === 'function') {
        // نطلب جودة متوسطة لإعادة تنشيط العرض
        popupPlayer.setPlaybackQuality('medium'); 
        popupPlayer.playVideo();
    }
    
    // 4. تحديد التركيز (Focus) 
    // نركز على زر الإغلاق في المشغل الرئيسي لتمكين التحكم بالريموت
    const videoPopupCloseButton = document.getElementById('video-popup-close-button'); 
    
    if (videoPopupCloseButton) {
        setFocus(videoPopupCloseButton);
    } else {
        setFocus(videoPopupContainer); 
    }
}

function updateMinimizedControlsState() {
    // 🛑 1. التحقق من وجود المشغل وتهيئته
    if (!popupPlayer || typeof popupPlayer.getPlayerState !== 'function') return; 

    // 2. جلب المراجع الحالية للعناصر
    const minimizedPlayPauseBtn = document.getElementById('minimized-play-pause-btn');
    const rateButtons = document.querySelectorAll('#playback-rates-group .rate-btn'); 
    
    if (!minimizedPlayPauseBtn || rateButtons.length === 0) return;

    const currentRate = popupPlayer.getPlaybackRate();
    // 💡 نستخدم toFixed(2) لضمان الدقة في الفاصلة العائمة والمقارنة
    const currentRateFixed = parseFloat(currentRate.toFixed(2));
    
    const playerState = popupPlayer.getPlayerState();
    const isPlaying = (playerState === YT.PlayerState.PLAYING);

    // --- 3. تطبيق التلوين (CRITICAL FIX) ---
    rateButtons.forEach(btn => {
        // الخطوة 1: إزالة الفئة النشطة من جميع الأزرار في كل تحديث
        btn.classList.remove('active-rate');
        
        // 💡 استخدام التحقق الدقيق من القيمة النصية للزر
        const btnRateString = parseFloat(btn.dataset.rate).toFixed(2);
        
        if (btnRateString === currentRateFixed.toFixed(2)) { // المقارنة بين النصوص الموحدة
            btn.classList.add('active-rate');
        }
    });

    // --- 4. تحديث أيقونات التشغيل/الإيقاف (Play/Pause Icons) ---
    const playIcon = minimizedPlayPauseBtn.querySelector('.play-icon');
    const pauseIcon = minimizedPlayPauseBtn.querySelector('.pause-icon');
    
    if (playIcon && pauseIcon) {
        playIcon.classList.toggle('hidden', isPlaying);
        pauseIcon.classList.toggle('hidden', !isPlaying);
    }
    
    // --- 5. تحديث قائمة السرعة المنسدلة في المشغل الكبير (للتزامن) ---
    const playbackSelect = document.getElementById('playback-rate-select');
    if (playbackSelect) {
         playbackSelect.value = currentRate.toFixed(1).toString(); 
    }
}
function onPlayerStateChange(event) {
    updateCarPlayDashboard();
    if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.BUFFERING) {
        forceUpdateCarPlayMedia(event.target);
    }

    if (event.data == YT.PlayerState.ENDED) {
        const videoData = popupPlayer.getVideoData();
        const videoId = videoData ? videoData.video_id : null;

        // ✅ 1. تسجيل الفيديو كـ "مكتمل" فور انتهائه لضمان عدم ظهوره مجدداً
        if (videoId) {
            let completed = JSON.parse(localStorage.getItem('completed_videos_ids') || '[]');
            if (!completed.includes(videoId)) {
                completed.push(videoId);
                localStorage.setItem('completed_videos_ids', JSON.stringify(completed));
                console.log(`✅ Video ${videoId} marked as completed.`);
            }
        }

        // 2. إذا كان وضع Shuffle مفعل
        if (window.isAutoPlayMode && window.currentSuggestedVideos) {
            const currentIndex = window.currentSuggestedVideos.findIndex(v => v.id === videoId);
            
            if (currentIndex > -1 && currentIndex < window.currentSuggestedVideos.length - 1) {
                // تشغيل الفيديو التالي
                const nextVideo = window.currentSuggestedVideos[currentIndex + 1];
                showVideoPopup(nextVideo.id, 0);
                return; 
            } else {
                // انتهاء القائمة العشوائية
                window.isAutoPlayMode = false;
                showMessageBox("انتهت قائمة التشغيل المتاحة");
            }
        }

        // 3. العودة للمقترحات العادية (ستقوم تلقائياً باستبعاد الفيديوهات المكتملة)
        if (popupPlayer) { 
            popupPlayer.destroy(); 
            popupPlayer = null; 
        }
        
        // إعادة رسم النافذة المنبثقة: ستقوم fetchSuggestedVideos الآن بفلترة الفيديو الذي انتهى للتو
        showDashboardSuggestionsInPopup(); 
    }
}

function createSimpleSuggestionCard(video, type) {
    const card = document.createElement('div');
    // إضافة الكلاسات التي تضمن البروز والتصميم المتفق عليه
    card.className = 'simple-suggestion-card flex flex-col gap-2 p-3 rounded-xl bg-white/10 cursor-pointer navigable grid-item flex-shrink-0';
    card.tabIndex = 0;
    card.setAttribute('tabindex', '0');
    card.dataset.videoId = video.id;

    card.innerHTML = `
        <div class="video-thumbnail-wrapper relative w-full h-[140px] overflow-hidden rounded-lg">
            <img src="${video.thumbnail}" class="w-full h-full object-cover">
            <span class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                ${video.duration || '00:00'}
            </span>
        </div>
        <div class="video-info flex flex-col gap-1">
            <h4 class="font-bold text-sm text-white line-clamp-2 leading-tight">${video.title}</h4>
            <p class="text-xs text-white/60 truncate">${video.channelTitle || ''}</p>
            <p class="text-[10px] text-white/40">${video.viewsDisplay || ''}</p>
        </div>
    `;
    return card;
}

function playAsShufflePlaylist() {
    const btn = document.querySelector('.playlist-shuffle-btn');
    
    if (window.isAutoPlayMode) {
        // حالة الإيقاف
        window.isAutoPlayMode = false;
        if (btn) {
            btn.innerHTML = `<i data-lucide="shuffle"></i> تشغيل الكل (Playlist)`;
            btn.style.background = "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)";
        }
    } else {
        // حالة التشغيل
        if (!window.allFetchedVideos30 || window.allFetchedVideos30.length === 0) return;
        
        window.isAutoPlayMode = true;
        window.currentSuggestedVideos = [...window.allFetchedVideos30].sort(() => 0.5 - Math.random());

        if (btn) {
            btn.innerHTML = `<i data-lucide="square"></i> إيقاف التشغيل التلقائي`;
            btn.style.background = "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)"; // لون أحمر للإيقاف
        }

        const firstVideo = window.currentSuggestedVideos[0];
        showVideoPopup(firstVideo.id, 0);
    }
    if (window.lucide) lucide.createIcons();
}
async function showDashboardSuggestionsInPopup() {
    const container = videoPopupPlayerContainer;
    
    // 1. إظهار مؤشر التحميل
    container.innerHTML = `
        <div class="p-8 text-center text-white flex flex-col items-center justify-center min-h-[200px]">
            <div class="animate-spin inline-block w-10 h-10 border-4 border-t-transparent border-purple-500 rounded-full mb-4"></div>
            <p class="text-lg font-medium">جاري جلب مقترحات ذكية...</p>
        </div>`;
    
    videoPopupContainer.style.display = 'flex';
    videoPopupContainer.classList.add('active');

    try {
        const suggestedVideos = await fetchSuggestedVideos();

        if (!suggestedVideos || suggestedVideos.length === 0) {
            container.innerHTML = `<p class="p-8 text-center text-white/70">لم نتمكن من العثور على مقترحات حالياً.</p>`;
            return;
        }

        const isAuto = window.isAutoPlayMode;
        const btnText = isAuto ? "إيقاف التشغيل التلقائي" : "تشغيل الكل (Playlist)";
        const btnIcon = isAuto ? "square" : "shuffle";
        const btnStyle = isAuto 
            ? "background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%) !important;" 
            : "background: linear-gradient(135deg, #9333ea 0%, #2563eb 100%) !important;";

        // 4. بناء الهيكل: 
        // أضفنا container خارجي بـ overflow-x: auto و container داخلي بـ overflow: visible
        let fullHTML = `
            <div class="suggestions-main-wrapper flex flex-col items-center gap-2 w-full h-full" style="overflow: hidden;">
                
                <button class="playlist-shuffle-btn navigable grid-item" 
                        onclick="playAsShufflePlaylist()" 
                        style="${btnStyle} z-index: 100; margin-bottom: 10px; flex-shrink: 0;">
                    <i data-lucide="${btnIcon}"></i> 
                    <span>${btnText}</span>
                </button>

                <div class="scroll-viewport w-full" style="overflow-x: auto; overflow-y: visible; padding: 20px 0; scroll-behavior: smooth; -webkit-overflow-scrolling: touch;">
                    
                    <div id="favorites-popup-grid" class="flex flex-row flex-nowrap gap-6 px-10" style="overflow: visible; width: max-content; min-width: 100%;">
        `;

        suggestedVideos.forEach(video => {
            const card = createSimpleSuggestionCard(video, 'SUGGEST');
            // التأكد من أن الكرت لا ينكمش ويسمح بالبروز
            card.style.flexShrink = "0";
            card.style.transition = "transform 0.3s ease"; 
            fullHTML += card.outerHTML;
        });

        fullHTML += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = fullHTML;

        if (window.lucide) lucide.createIcons();
        if (typeof updateNavigableElements === 'function') updateNavigableElements();

        // 8. ربط أحداث النقر
        container.querySelectorAll('.simple-suggestion-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const videoId = e.currentTarget.dataset.videoId;
                if (videoId) {
                    window.isAutoPlayMode = false;
                    showVideoPopup(videoId, 0); 
                }
            });
        });

        setTimeout(() => {
            const mainBtn = container.querySelector('.playlist-shuffle-btn');
            if (mainBtn) setFocus(mainBtn);
        }, 200);

    } catch (e) {
        console.error("Error in showDashboardSuggestionsInPopup:", e);
        container.innerHTML = `<p class="p-8 text-center text-red-500">حدث خطأ أثناء تحميل المقترحات.</p>`;
    }
}
        function handleFullScreenChange() {
            if (popupPlayer && typeof popupPlayer.getPlayerState === 'function' && popupPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                const isFullScreen = document.fullscreenElement === popupPlayer.getIframe() || document.webkitFullscreenElement === popupPlayer.getIframe();
                if (isFullScreen) {
                    popupPlayer.setPlaybackQuality('hd720');
                } else {
                    popupPlayer.setPlaybackQuality('large'); // 'large' for 480p
                }
            }
        }

        // This function is duplicated, removing one instance.
        
        // NEW: Function to handle next/previous navigation buttons
        function updateNavigationButtons(currentQuery) {
            // Reset and hide buttons by default
            previousItemButton.style.display = 'none';
            nextItemButton.style.display = 'none';
            previousItemButton.onclick = null;
            nextItemButton.onclick = null;

            // --- Case 1: Surah Navigation ---
            const surahMatch = currentQuery.match(/سورة (.+)/);
            if (surahMatch && surahMatch[1]) {
                const currentSurah = surahMatch[1].trim();
                const currentIndex = youtubeSurahSuggestions.indexOf(currentSurah);

                if (currentIndex !== -1) {
                    const baseQuery = currentQuery.substring(0, currentQuery.indexOf('سورة'));

                    // Previous Surah Button
                    if (currentIndex > 0) {
                        const prevSurah = youtubeSurahSuggestions[currentIndex - 1];
                        previousItemButton.innerHTML = `<i data-lucide="arrow-left"></i> ${prevSurah}`;
                        previousItemButton.style.display = 'flex';
                        previousItemButton.onclick = () => searchYouTubeVideos(`${baseQuery} سورة ${prevSurah}`);
                    }

                    // Next Surah Button
                    if (currentIndex < youtubeSurahSuggestions.length - 1) {
                        const nextSurah = youtubeSurahSuggestions[currentIndex + 1];
                        nextItemButton.innerHTML = `${nextSurah} <i data-lucide="arrow-right"></i>`;
                        nextItemButton.style.display = 'flex';
                        nextItemButton.onclick = () => searchYouTubeVideos(`${baseQuery} سورة ${nextSurah}`);
                    }
                    lucide.createIcons();
                    return;
                }
            }

            // --- Case 2: Juz Navigation ---
            const juzMatch = currentQuery.match(/الجزء (.+)/);
            if (juzMatch && juzMatch[1]) {
                const currentJuz = juzMatch[1].trim();
                const currentIndex = juzArabicNames.indexOf(currentJuz);

                if (currentIndex !== -1) {
                    const baseQuery = currentQuery.substring(0, currentQuery.indexOf('الجزء')).trim();

                    // Previous Juz Button
                    if (currentIndex > 0) {
                        const prevJuz = juzArabicNames[currentIndex - 1];
                        previousItemButton.innerHTML = `<i data-lucide="arrow-left"></i> الجزء ${prevJuz}`;
                        previousItemButton.style.display = 'flex';
                        previousItemButton.onclick = () => searchYouTubeVideos(`${baseQuery} الجزء ${prevJuz}`.trim());
                    }

                    // Next Juz Button
                    if (currentIndex < juzArabicNames.length - 1) {
                        const nextJuz = juzArabicNames[currentIndex + 1];
                        nextItemButton.innerHTML = `الجزء ${nextJuz} <i data-lucide="arrow-right"></i>`;
                        nextItemButton.style.display = 'flex';
                        nextItemButton.onclick = () => searchYouTubeVideos(`${baseQuery} الجزء ${nextJuz}`.trim());
                    }
                    lucide.createIcons();
                    return;
                }
            }

            // --- Case 3: Reciter-Only Navigation ---
            const reciters = youtubeReaderSuggestions.filter(r => r.name !== "ربط الآيات").map(r => r.name);
            const reciterIndex = reciters.indexOf(currentQuery.trim());

            if (reciterIndex !== -1) {
                // Previous Reciter Button
                if (reciterIndex > 0) {
                    const prevReciter = reciters[reciterIndex - 1];
                    previousItemButton.innerHTML = `<i data-lucide="arrow-left"></i> ${prevReciter}`;
                    previousItemButton.style.display = 'flex';
                    previousItemButton.onclick = () => {
                        searchMode = 'reciter_only'; // Preserve mode
                        searchYouTubeVideos(prevReciter);
                    };
                }

                // Next Reciter Button
                if (reciterIndex < reciters.length - 1) {
                    const nextReciter = reciters[reciterIndex + 1];
                    nextItemButton.innerHTML = `${nextReciter} <i data-lucide="arrow-right"></i>`;
                    nextItemButton.style.display = 'flex';
                    nextItemButton.onclick = () => {
                        searchMode = 'reciter_only'; // Preserve mode
                        searchYouTubeVideos(nextReciter);
                    };
                }
                lucide.createIcons();
                return;
            }
        }

         const youtubeReaderSuggestions = [             {"name":"الرقية", "image":"https://imgs.search.brave.com/afZfY6pdMu-EfuTtrt2hNKEW9TsUAnPOX2QnIlIFi1c/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YXJhYnNzdG9jay5j/b20vdXBsb2Fkcy92/ZWN0b3JzLzIzMDQx/L3J1cWF5YS1hbi1h/cmFiaWMtbmFtZS1m/b3ItcHJldmlldy0y/MzA0MS53ZWJw"},
{"name":"محمد ايوب","image":"https://dmusera.netlify.app/512px-Muhammad_Ayyub.webp"},{"name":"علي جابر","image":"https://dmusera.netlify.app/ali-jaber.webp"},{"name":"محمد الغزالي","image":"https://imgs.search.brave.com/QWUpKrFCLEvXilcNhgSRM6xKPjTlBtGA-BAsH9sN-Tc/rs:fit:200:200:1:0/g:ce/aHR0cHM6Ly9hci5p/c2xhbXdheS5uZXQv/dXBsb2Fkcy9hdXRo/b3JzLzUwNjEuanBn"},{"name":"مشاري العفاسي","image":"https://dmusera.netlify.app/512px-%D0%9C%D0%B8%D1%88%D0%B0%D1%80%D0%B8_%D0%A0%D0%B0%D1%88%D0%B8%D0%B4.webp"},{"name":"عبدالله القرافي","image":"https://yt3.googleusercontent.com/mHTg3RIX-a3NAR22lAnOvSq3-U_KBcL_Ax4FTNirc3flsb5OU8RWksKu6X8Ush9JhO0EOxxAwQY=s160-c-k-c0x00ffffff-no-rj"},{"name":"اسلام صبحي","image":"https://imgs.search.brave.com/Sq4qNywnl1HmDjSuxWTshlQ8yV9fplcVnUoiErGC-38/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS51bml0ZWRtdXNs/aW13b3JsZC5jb20v/aW1nLzIzLzEyLzIz/LzEyNDk1LmpwZw"},{"name":"احمد النفيس","image":"https://dmusera.netlify.app/ahmednafes.jpg"},{"name":"ياسر الدوسري","image":"https://dmusera.netlify.app/Yasser_Al-Dosari.jpg"},
{"name":"ربط الآيات","image":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bD MtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzIiLz48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcyLTEuNzIiLz48L3N2Zz4="}, {"name":"ربط الآيات","image":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bDMtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzIiLz48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcyLTEuNzIiLz48L3N2Zz4="}
        ];
          const youtubeReaderSuggestions2 = [
            {"name":"الرقية", "image":"https://imgs.search.brave.com/afZfY6pdMu-EfuTtrt2hNKEW9TsUAnPOX2QnIlIFi1c/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YXJhYnNzdG9jay5j/b20vdXBsb2Fkcy92/ZWN0b3JzLzIzMDQx/L3J1cWF5YS1hbi1h/cmFiaWMtbmFtZS1m/b3ItcHJldmlldy0y/MzA0MS53ZWJw", "channelid": "", "channeltitle": ""},
            {"name":"محفوف -BYMAHFOOF", "image":"https://yt3.googleusercontent.com/obc8dOfYmoZe50tvHCJNZgbLAnJAKb-YPSUnguahWqJ-Jm12At_lV8CjfPPuhAsM9i2K26QK=s160-c-k-c0x00ffffff-no-rj", "channelid": "UCABzsyFLLA-fKu05lR-49RA", "channeltitle": "محفوف"},
            {"name":"تلاوات ياسر الدوسري", "image":"https://yt3.googleusercontent.com/ytc/AIdro_k1n9v-3Z3x-v6Q2wY5kX1c8z-G4xQ6X1X5Xw=s176-c-k-c0x00ffffff-no-rj-mo", "channelid": "UClncV9OLPto_MinRzGfjr2g", "channeltitle": "تلاوات ياسر الدوسري إمام الحرم المكي"},
            {"name":"مزامير الفرقان - ياسر الدوسري", "image":"https://yt3.googleusercontent.com/ATOVX4RIsbt20_VS0Ly0bNkm5NPCoseg-S28jEEFsMBhHxBRUGXWW1dFOSuKG5p1_Sx8C8fMqFs=s160-c-k-c0x00ffffff-no-rj", "channelid": "UCCoB7Hf8gjQzpAyzhvx7Ktg", "channeltitle": "مزامير الفرقان - ياسر الدوسري"},
            {"name":"عبدالله الشحري", "image":"https://yt3.ggpht.com/KZblM_WDIfUaDyB0wmNZOfVDogOhHThprmFyzLL3AkvnLcKqFmhoJ00nsKHKCXizM94hGy1DSdo=s176-c-k-c0x00ffffff-no-rj-mo", "channelid": "UCyXm7QL-vmBIZcYCoPfmXgw", "channeltitle": "عبدالله الشحري"},
            {"name":"ترتيل-@TarteelArabic", "image":"https://yt3.googleusercontent.com/pUYEmNtUgk7zmyKXVwzTyYCfli0AavVRgAomZITpyh3i6HT0mk35CCJv32Ra79-gKk276qSeYfw=s900-c-k-c0x00ffffff-no-rj", "channelid": "UCHVX6sawuLNAuRbJdfruXVA", "channeltitle": "ترتيل"},
            {"name":"قناة اخضر", "image":"https://yt3.ggpht.com/CNJHtl9UOLJwzpGI6_8meaFK6-nWkaXABqu4cXfx2oZnTZmvYgHANXoOY-IpGlNk2U9I5nbIX9I=s176-c-k-c0x00ffffff-no-rj-mo", "channelid": "UCtUor2SqesPS3b_SMFtLT_w", "channeltitle": "أخضر"},
            {"name":"اذاعة مختلف", "image":"https://yt3.ggpht.com/73c3-iw_Lubnz8tI6uxN17s1p8kOvwwsF5tatPe3JYAw_SRKeJfjprdH2wxHGPz3UHBM9NDxzs0=s176-c-k-c0x00ffffff-no-rj-mo", "channelid": "UC8vdjzu_0QMQlG9qNT5D_AQ", "channeltitle": "إذاعة مختلف"},
            {"name":"Qtratel", "image":"https://yt3.googleusercontent.com/4op5oT580d20t3w4i4dWjZmfT1YkVSDok-MVlx-c1--EaYt-wZuw1tebFOc-iQ_XRMfUIO0gYA=s160-c-k-c0x00ffffff-no-rj", "channelid": "", "channeltitle": ""},
            {"name":"Mohamed abubakr", "image":"https://yt3.ggpht.com/yp7xPPh1JotsxKkOMos1KWumw7UFFibydMnoPzhP100gsUGWnDXRTAhdV88gd6coAPkXQ5n1Rw=s176-c-k-c0x00ffffff-no-rj-mo", "channelid": "UC9i6gCxiph_aBj68Xs9Iqng", "channeltitle": "Mohamed Aboubakr"},
            {"name":"بودكاست", "image":"https://yt3.googleusercontent.com/0Vs32Zwp0qjXovZuV0kCCxCkKkCdTpAn_9_tky7mxQUM69EIrWK_oJawKy_fKpzL1KZN0LG7=s160-c-k-c0x00ffffff-no-rj", "channelid": "", "channeltitle": ""},
            {"name":"ربط الآيات","image":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bDMtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzIiLz48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcyLTEuNzIiLz48L3N2Zz4=", "channelid": "", "channeltitle": ""}
        ];
        
        const youtubeSurahSuggestions = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","الانشقاق","المطففين","البروج","الطارق","الأعلى"];
        const surahToJuzMap = {"الفاتحة":1,"البقرة":1,"آل عمران":3,"النساء":4,"المائدة":6,"الأنعام":7,"الأعراف":8,"الأنفال":9,"التوبة":10,"يونس":11,"هود":11,"يوسف":12,"الرعد":13,"إبراهيم":13,"الحجر":14,"النحل":14,"الإسراء":15,"الكهف":15,"مريم":16,"طه":16,"الأنبياء":17,"الحج":17,"المؤمنون":18,"النور":18,"الفرقان":18,"الشعراء":19,"النمل":19,"القصص":20,"العنكبوت":20,"الروم":21,"لقمان":21,"السجدة":21,"الأحزاب":21,"سبأ":22,"فاطر":22,"يس":22,"الصافات":23,"ص":23,"الزمر":23,"غافر":24,"فصلت":24,"الشورى":25,"الزخرف":25,"الدخان":25,"الجاثية":25,"الأحقاف":26,"محمد":26,"الفتح":26,"الحجرات":26,"ق":26,"الذاريات":27,"الطور":27,"النجم":27,"القمر":27,"الرحمن":27,"الواقعة":27,"الحديد":27,"المجادلة":28,"الحشر":28,"الممتحنة":28,"الصف":28,"الجمعة":28,"المنافقون":28,"التغابن":28,"الطلاق":28,"التحريم":28,"الملك":29,"القلم":29,"الحاقة":29,"المعارج":29,"نوح":29,"الجن":29,"المزمل":29,"المدثر":29,"القيامة":29,"الإنسان":29,"المرسلات":29,"النبأ":30,"النازعات":30,"عبس":30,"التكوير":30,"الانفطار":30,"الانشقاق":30,"المطففين":30,"البروج":30,"الطارق":30,"الأعلى":30};
        const juzColors =  [
  // 🔵 Blues
  "#2563eb", // Strong Blue
  "#3b82f6", // Blue
  "#0ea5e9", // Sky Blue
  "#0891b2", // Deep Cyan
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#0d9488", // Dark Teal

  // 🟣 Purples / Violets
  "#6366f1", // Indigo
  "#4f46e5", // Deep Indigo
  "#6d28d9", // Royal Violet
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#9333ea", // Electric Purple
  "#c026d3", // Magenta
  "#d946ef", // Fuchsia

  // 🌸 Pinks / Rose
  "#ec4899", // Pink
  "#be185d", // Dark Pink
  "#f43f5e", // Rose
  "#fb7185", // Coral

  // 🔴 Reds
  "#ef4444", // Red
  "#dc2626", // Crimson

  // 🟠 Oranges
  "#ea580c", // Burnt Orange
  "#f97316", // Orange

  // 🟡 Yellows / Gold
  "#f59e0b", // Amber
  "#139c7e", // tealy
  "#c99716", // Gold
  "#7a6510", // dark gold
  "#ca8a04", // Dark Mustard

  // 🟢 Greens
  "#22c55e", // Green
  "#16a34a", // Strong Green
  "#10b981", // Emerald
  "#059669", // Dark Emerald

  // ⚫ Dark / Neutral
  "#1e293b", // Slate Dark
];
        function resetYoutubeSearchUI() {
            const suggestionsContent = document.getElementById('suggestions-content');
            if (suggestionsContent) {
                suggestionsContent.innerHTML = ''; // Clear old suggestions
                suggestionsContent.classList.remove('hidden'); //  تأكد من إظهاره مجدداً
            }
            
            // إصلاح: إزالة قسم السور بشكل صريح إذا كان موجوداً
            const existingSurahSection = document.getElementById('youtube-surah-section');
            if (existingSurahSection) {
                existingSurahSection.remove();
            }
            
            youtubeSuggestionsDiv.style.display = 'flex';
            selectedReaderName = '';
            youtubeSearchInput.value = '';

            if (lastSuccessfulSearchQuery) {
                backToSearchFloatingButton.style.display = 'flex';
            } else {
                backToSearchFloatingButton.style.display = 'none';
            }

            displayLastWatchedVideo(); // This will populate #last-watched-container
            populateYoutubeSuggestions(); // This will populate #suggestions-content
        }
        
        /**
 * UPDATED: Handles the click event for readers, channels, and special tools.
 * Applies specific formatting for the 'BALWASL' tool.
 */
function handleReaderOrToolClick(selection, tabContainer, tabsContentContainer) {
    let newInputValue = '';

    if (selection === "الكلمات الصعبة في") {
        selectedReaderName = '';
        newInputValue = 'الكلمات الصعبة في ';
    } else if (selection === "JUST_SURAH") {
        selectedReaderName = '';
        newInputValue = '';
    } else if (selection === "BALWASL") { // 🛑 NEW LOGIC FOR "بالوصل"
        selectedReaderName = 'بالوصل'; // نحفظ 'بالوصل' كقارئ ليتم استخدامها لاحقا
        newInputValue = 'بالوصل '; // السورة ستأتي قبل هذه الكلمة
    } else if (selection === "قصص" || selection === "أسباب النزول" || selection === "أحكام التجويد" || selection === "المتشابهات" || selection === "ربط الآيات") {
        selectedReaderName = selection;
        newInputValue = selection + ' '; // الأدوات العادية: اسم الأداة + مسافة
    } else {
        // إذا كان قارئاً عادياً
        selectedReaderName = selection;
        newInputValue = selection + ' ';
    }
    
    // تحديث حقل الإدخال
    youtubeSearchInput.value = newInputValue;

    // إخفاء التبويبات وإظهار السور (كما كان في الكود الأصلي)
    tabContainer.style.display = 'none';
    tabsContentContainer.style.display = 'none';
    showSurahSuggestions();
    
    setTimeout(() => {
        const firstSurahButton = document.querySelector('#youtube-surah-section .grid-item');
        if (firstSurahButton) setFocus(firstSurahButton);
    }, 100);
}

/**
 * NEW: Removes a reciter entry from the global cache and updates the JSONBin Reciters list.
 * @param {string} reciterName - The name of the reciter to remove.
 */
async function removeReciterFromList(reciterName) {
    if (!reciterName) return;

    try {
        // 1. تصفية القائمة محليًا لإزالة القارئ
        const updatedList = localRecitersCache.filter(r => r.name !== reciterName);
        
        // 2. إرسال القائمة المحدثة إلى JSONBin
        const success = await updateRecitersList(updatedList); // نفترض أن updateRecitersList تقوم بالتحديث على الخادم و localRecitersCache
        
        if (success) {
            showMessageBox(`تمت إزالة القارئ "${reciterName}" بنجاح.`);
            
            // 3. إعادة تحميل تبويب القراء لعرض التغيير
            const suggestionsContent = document.getElementById('suggestions-content');
            if(suggestionsContent) {
                // Clear and re-populate the suggestions tabs
                suggestionsContent.innerHTML = '';
                await populateYoutubeSuggestions();
                // إعادة التركيز على تبويب القراء
                document.getElementById('tab-reciters')?.click();
            }
        }
    } catch (error) {
        console.error("Error removing reciter:", error);
        showMessageBox(`حدث خطأ أثناء إزالة القارئ ${reciterName}.`);
    }
}
async function populateYoutubeSuggestions() {
    const suggestionsContent = document.getElementById('suggestions-content');
    if (!suggestionsContent) {
        console.error("suggestions-content element not found!");
        return;
    }
    console.log("[Debug] Starting populateYoutubeSuggestions...");

    suggestionsContent.innerHTML = '';
    suggestionsContent.className = 'flex flex-col gap-4 w-full';

    // 1. إنشاء هيكل التبويبات (Tab Structure)
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tabs-container flex p-1 rounded-full bg-black/20 self-center';

    const recitersTabButton = document.createElement('button');
    recitersTabButton.id = 'tab-reciters';
    recitersTabButton.className = 'tab-button active navigable grid-item';
    recitersTabButton.tabIndex = 0;
    recitersTabButton.textContent = 'القراء';

    const channTabButton = document.createElement('button');
    channTabButton.id = 'tab-channels';
    channTabButton.className = 'tab-button navigable grid-item';
    channTabButton.tabIndex = 0;
    channTabButton.textContent = 'قنوات';

    const toolsTabButton = document.createElement('button');
    toolsTabButton.id = 'tab-tools';
    toolsTabButton.className = 'tab-button navigable grid-item';
    toolsTabButton.tabIndex = 0;
    toolsTabButton.textContent = 'أدوات';

    const savedMTabButton = document.createElement('button');
    savedMTabButton.id = 'tab-saved-m';
    savedMTabButton.className = 'tab-button navigable grid-item';
    savedMTabButton.tabIndex = 0;
    savedMTabButton.textContent = 'المتابعة في التلفاز';

    const savedDTabButton = document.createElement('button');
    savedDTabButton.id = 'tab-saved-d';
    savedDTabButton.className = 'tab-button navigable grid-item';
    savedDTabButton.tabIndex = 0;
    savedDTabButton.textContent = 'متابعة في السيارة';

    tabContainer.appendChild(recitersTabButton);
    tabContainer.appendChild(channTabButton);
    tabContainer.appendChild(toolsTabButton);
    tabContainer.appendChild(savedMTabButton);
    tabContainer.appendChild(savedDTabButton);

    const tabsContentContainer = document.createElement('div');
    tabsContentContainer.id = 'tabs-content-container';
    tabsContentContainer.className = 'flex-grow w-full overflow-y-auto';

    // 2. إنشاء محتويات الألواح (Content Panels)
    const recitersContent = document.createElement('div');
    recitersContent.id = 'tab-content-reciters';
    recitersContent.className = 'tab-content';
    const readerButtonsContainer = document.createElement('div');
    readerButtonsContainer.className = 'reader-container';
    readerButtonsContainer.dir = 'rtl';
    recitersContent.appendChild(readerButtonsContainer);

    const channContent = document.createElement('div');
    channContent.id = 'tab-content-channels';
    channContent.className = 'tab-content hidden';
    const channButtonsContainer = document.createElement('div');
    channButtonsContainer.className = 'reader-container';
    channButtonsContainer.dir = 'rtl';
    channContent.appendChild(channButtonsContainer);

    const toolsContent = document.createElement('div');
    toolsContent.id = 'tab-content-tools';
    toolsContent.className = 'tab-content hidden';
    const toolsButtonsContainer = document.createElement('div');
    toolsButtonsContainer.className = 'reader-container';
    toolsContent.appendChild(toolsButtonsContainer);

    const savedDContent = document.createElement('div');
    savedDContent.id = 'tab-content-saved-d';
    savedDContent.className = 'tab-content hidden h-full';
    savedDContent.innerHTML = `<div id="favorites-d-grid" class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4"></div>`;

    const savedMContent = document.createElement('div');
    savedMContent.id = 'tab-content-saved-m';
    savedMContent.className = 'tab-content hidden h-full';
    savedMContent.innerHTML = `<div id="favorites-m-grid" class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4"></div>`;

    // 3. ملء المحتويات بالبيانات
    try {
        // -----------------------------------------------------
        // 🚀 تبويب القراء (Reciters) - الترتيب الثاني لزر الإضافة
        // -----------------------------------------------------
        let recitersList = localRecitersCache; 
        if (!recitersList || recitersList.length === 0) {
            recitersList = await fetchRecitersList();
        }
        
        if (Array.isArray(recitersList)) {
            recitersList.sort((a, b) => (parseInt(b?.clicksreciter, 10) || 0) - (parseInt(a?.clicksreciter, 10) || 0));
        } else {
            recitersList = [];
        }
        
        readerButtonsContainer.innerHTML = '';
        let displayElements = [];
        
        recitersList.forEach((reader, index) => {
            if (!reader || !reader.name) return;

            const card = document.createElement('div');
            card.className = 'youtube-reader-card navigable grid-item relative group';
            card.setAttribute('tabindex', '0');
            card.tabIndex = 0;
            // 💡 الترتيب: العنصر الأول يأخذ order: 1، والبقية تبدأ من 3 (لتفسح المجال لزر الإضافة)
            card.style.order = (index < 1) ? 1 : index + 2; 

            const imageUrl = reader.image || 'https://placehold.co/100x100/334155/ffffff?text=Q';

            card.innerHTML = `
                <button class="delete-channel-btn absolute bottom-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full transition-colors z-10 navigable grid-item" title="حذف القارئ" tabindex="0">
                    <i data-lucide="trash-2" class="w-4 h-4 text-white pointer-events-none"></i>
                </button>
                <h3>${reader.name}</h3>
                <img src="${imageUrl}" alt="${reader.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x100';">
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.delete-channel-btn')) return; 

                if (reader.name === "الرقية" || reader.name === "ربط الآيات") {
                    handleReaderOrToolClick(reader.name, tabContainer, tabsContentContainer);
                } else {
                    incrementReciterClick(reader.name);
                    handleReaderOrToolClick(reader.name, tabContainer, tabsContentContainer);
                }
            });
            
            const deleteBtn = card.querySelector('.delete-channel-btn');
            deleteBtn?.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                removeReciterFromList(reader.name); 
            });

            displayElements.push(card);
        });

        // 🛑 إنشاء زر "إضافة قارئ" ووضعه في الترتيب الثاني (order: 2)
        const addReciterCard = document.createElement('div');
        addReciterCard.className = 'youtube-reader-card navigable grid-item';
        addReciterCard.tabIndex = 0;
        addReciterCard.style.order = 2; // 👈 الترتيب الثاني: يظهر بعد العنصر ذي الترتيب 1
        addReciterCard.innerHTML = `<h3>إضافة قارئ</h3><div class="w-[100px] h-[100px] rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/20"><i data-lucide="plus" class="w-12 h-12 text-white/50"></i></div>`;
        addReciterCard.addEventListener('click', showAddReciterPrompt);
        
        displayElements.push(addReciterCard);
        
        // إضافة جميع العناصر المرتبة إلى الحاوية
        displayElements.forEach(el => readerButtonsContainer.appendChild(el));


        // -----------------------------------------------------
        // 🌐 تبويب القنوات (Channels) - الترتيب الثاني لزر الإضافة
        // -----------------------------------------------------
        let channList = localChannelsCache; 
        if (!channList || channList.length === 0) {
             channList = await fetchChannelsList(); 
        }

        if (Array.isArray(channList)) {
            channList.sort((a, b) => (parseInt(b?.clickschannel, 10) || 0) - (parseInt(a?.clickschannel, 10) || 0));
        } else {
            channList = [];
        }
        
        const channelIdsToFetch = channList.filter(r => r && r.channelid).map(r => r.channelid);
        const channelThumbnails = channelIdsToFetch.length > 0 ? await fetchChannelsDetails(channelIdsToFetch) : {};
        channButtonsContainer.innerHTML = '';
        
        let channelDisplayElements = [];

        channList.forEach((reader, index) => {
             if (!reader || typeof reader !== 'object') return;
             const card = document.createElement('div');
             card.className = 'youtube-reader-card navigable grid-item relative group';
             card.tabIndex = 0;
             card.style.order = (index < 1) ? 1 : index + 2; // 👈 الترتيب: 1، 3، 4، 5...
             const imageUrl = reader.channelid ? (channelThumbnails[reader.channelid] || 'https://placehold.co/100x100/334155/ffffff?text=?') : (reader.image || 'https://placehold.co/100x100/334155/ffffff?text=?');
             card.innerHTML = `
                 <button class="delete-channel-btn absolute bottom-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full transition-colors z-10 navigable grid-item" title="حذف القناة" tabindex="0"><i data-lucide="trash-2" class="w-4 h-4 text-white pointer-events-none"></i></button>
                 <h3>${reader.name}</h3>
                 <img src="${imageUrl}" alt="${reader.name}" onerror="this.onerror=null;this.src='https://placehold.co/64x64';">`;
             
             card.addEventListener('click', (e) => {
                 if (e.target.closest('.delete-channel-btn')) return;
                 if (reader.channelid && reader.channeltitle) {
                     incrementChannelClick(reader.channelid);
                     searchVideosByChannel(reader.channelid, reader.channeltitle);
                 } else {
                     handleReaderOrToolClick(reader.name, tabContainer, tabsContentContainer);
                 }
             });
             const deleteChannBtn = card.querySelector('.delete-channel-btn');
             deleteChannBtn?.addEventListener('click', (e) => { e.stopPropagation(); removeChannelFromList(reader.channelid, reader.name); });
             
             channelDisplayElements.push(card);
        });

        // زر إضافة قناة ووضعه في الترتيب الثاني
        const addChannelCard = document.createElement('div');
        addChannelCard.className = 'youtube-reader-card navigable grid-item';
        addChannelCard.tabIndex = 0;
        addChannelCard.style.order = 2; // 👈 الترتيب الثاني
        addChannelCard.innerHTML = `<h3>إضافة قناة</h3><div class="w-[100px] h-[100px] rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/20"><i data-lucide="plus" class="w-12 h-12 text-white/50"></i></div>`;
        addChannelCard.addEventListener('click', showAddChannelPrompt);
        
        channelDisplayElements.push(addChannelCard);
        
        channelDisplayElements.forEach(el => channButtonsContainer.appendChild(el)); // إضافة جميع العناصر

        // --- Populating Tools (Existing Logic) ---
        const tools = [
            { name: "ربط الآيات", icon: "link", action: "ربط الآيات" },
            { name: "قصص", icon: "book-open-check", action: "قصص" },
            { name: "أسباب النزول", icon: "feather", action: "أسباب النزول" },
            { name: "أحكام التجويد", icon: "volume-2", action: "أحكام التجويد" },
            { name: "المتشابهات", icon: "layers-3", action: "المتشابهات" },
            { name: "بالوصل", icon: "type", specialAction: "BALWASL" }, // 👈 الأداة ذات التنسيق الخاص
            { name: "فقط السورة", icon: "book-open", specialAction: "JUST_SURAH" }
        ];

        toolsButtonsContainer.innerHTML = '';

       tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'youtube-reader-card navigable grid-item';
            card.tabIndex = 0;
            
            // استخدام action أو specialAction لتحديد القيمة التي سيتم تمريرها
            const selectionValue = tool.specialAction || tool.action; 

            card.innerHTML = `<h3>${tool.name}</h3><div class="w-[100px] h-[100px] rounded-full border-2 border-white/30 flex items-center justify-center bg-black/20"><i data-lucide="${tool.icon}" class="w-12 h-12 text-white/50"></i></div>`;
            
            card.addEventListener('click', () => handleReaderOrToolClick(selectionValue, tabContainer, tabsContentContainer));
            toolsButtonsContainer.appendChild(card);
        });
        
        // --- Tab Switching Logic ---
        const tabs = [recitersTabButton, channTabButton, toolsTabButton, savedDTabButton, savedMTabButton];
        const contents = [recitersContent, channContent, toolsContent, savedDContent, savedMContent];

       tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        // 1. التبديل التقليدي بين التابات
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        contents[index].classList.remove('hidden');

        // 2. تحميل البيانات الخاصة بالمفضلة إذا لزم الأمر
        if (tab.id === 'tab-saved-d') { loadSavedVideos('D'); } 
        else if (tab.id === 'tab-saved-m') { loadSavedVideos('M'); }

        // 3. 🚀 التعديل الجوهري: استخدام setTimeout لضمان ظهور الكروت في الـ DOM
        setTimeout(() => {
            // تحديث قائمة العناصر القابلة للتنقل لتشمل الكروت الجديدة
            if (typeof updateNavigableElements === 'function') {
                updateNavigableElements();
            }

            // البحث عن أول كارت (grid-item) أو أي عنصر قابل للملاحة داخل المحتوى النشط
            const firstItem = contents[index].querySelector('.grid-item, .navigable');
            
            if (firstItem) {
                // سحب التركيز من التاب الجانبي إلى الكروت مباشرة
                setFocus(firstItem); 
                console.log("🎯 Focus moved to content: " + tab.textContent);
            } else {
                // إذا لم توجد كروت (قائمة فارغة)، ابقِ التركيز على التاب نفسه
                setFocus(tab);
            }
        }, 200); // 200 مللي ثانية كافية لرسم العناصر في CarPlay UI
    });
});

    } catch (error) {
        console.log("[Debug] Error in populating tabs:", error);
    }
    
    // 4. تجميع وإضافة العناصر إلى الشاشة
    suggestionsContent.appendChild(tabContainer);
    tabsContentContainer.appendChild(recitersContent);
    tabsContentContainer.appendChild(channContent);
    tabsContentContainer.appendChild(toolsContent);
    tabsContentContainer.appendChild(savedDContent);
    tabsContentContainer.appendChild(savedMContent);
    suggestionsContent.appendChild(tabsContentContainer);

    lucide.createIcons();
    updateNavigableElements();
}

async function handleSearchForReciterChannel() {
    // 🛑 نستخدم هنا المُعرّف الصحيح من نافذة القراء المنبثقة
    const inputEl = document.getElementById('new-reciter-name-input'); 
    const resultsContainer = document.getElementById('channel-search-results'); // نفس اسم حاوية النتائج
    const confirmBtn = document.getElementById('search-channel-confirm'); // نفس اسم زر البحث
    const query = inputEl.value.trim();

    if (!query) {
        showMessageBox("الرجاء إدخال اسم القارئ/القناة للبحث.");
        return;
    }
    // ... (بقية منطق التحميل والتأكد) ...
    // ... (بقية منطق التحميل والتأكد) ...

    try {
        // 🛑 API Call: Filtered for Channel Type and Arabic Relevance
        const API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${YOUTUBE_API_KEY}&maxResults=10&relevanceLanguage=ar`; 
        
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        displayReciterSearchResults(data.items);
        
    } catch (error) {
        // ... (بقية منطق الخطأ) ...
    } finally {
        // ... (بقية منطق التحميل) ...
    }
}

/**
 * NEW: Displays the search results (channels) inside the "Add Reciter" modal.
 * It creates cards with an "Add" button, which calls handleAddReciter.
 * @param {Array} channels - List of channel search results from YouTube API.
 */
function displayReciterSearchResults(channels) {
    const resultsContainer = document.getElementById('channel-search-results');
    resultsContainer.innerHTML = '';

    if (!channels || channels.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-white/70">لم يتم العثور على قنوات بهذا الاسم باللغة العربية.</p>';
        updateNavigableElements();
        return;
    }

    channels.forEach(channel => {
        const channelId = channel.id.channelId;
        const channelTitle = channel.snippet.title;
        const channelThumbnail = channel.snippet.thumbnails.default.url;
        
        // التحقق مما إذا كان القارئ (الاسم) موجوداً بالفعل في قائمة القراء
        const isSaved = localRecitersCache.some(r => r.name === channelTitle); 

        const resultCard = document.createElement('div');
        resultCard.className = 'flex items-center gap-4 p-3 rounded-xl bg-white/5 navigable grid-item';
        resultCard.tabIndex = 0; // لضمان التنقل بالريموت
        
        resultCard.innerHTML = `
            <img src="${channelThumbnail}" alt="${channelTitle}" class="w-16 h-16 rounded-full object-cover flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/64x64';">
            <div class="flex-grow min-w-0">
                <h4 class="font-bold truncate text-lg">${channelTitle}</h4>
                <p class="text-sm text-white/60 truncate">${channel.snippet.description || 'قناة يوتيوب'}</p>
            </div>
            <button 
                class="add-reciter-from-search-btn p-2 rounded-full transition-colors flex-shrink-0 navigable grid-item" 
                data-reciter-name="${channelTitle}" 
                data-reciter-image="${channelThumbnail}"
                ${isSaved ? 'disabled' : ''}
                tabindex="0"
                style="background-color: ${isSaved ? '#10B981' : '#9333ea'};"
            >
                <i data-lucide="${isSaved ? 'check' : 'plus'}" class="w-5 h-5 text-white"></i>
            </button>
        `;
        resultsContainer.appendChild(resultCard);

        // ربط حدث النقر على زر الإضافة
        if (!isSaved) {
            resultCard.querySelector('.add-reciter-from-search-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                const name = btn.dataset.reciterName;
                const image = btn.dataset.reciterImage;
                handleAddReciter(name, image, btn); 
            });
            // ربط النقر على البطاقة نفسها بفتح القناة (ميزة إضافية)
            resultCard.addEventListener('click', (e) => {
                if(e.target.closest('button')) return; // لا تفعل شيئًا إذا تم النقر على الزر
                showMessageBox(`لتشغيل فيديوهات القناة، انقر على زر الإضافة ثم ابحث باسم القارئ في الشاشة الرئيسية.`);
            });
        } else {
             // إذا كان محفوظًا، اجعل النقر على البطاقة يفتح نافذة "تمت الإضافة"
             resultCard.addEventListener('click', () => showMessageBox(`تمت إضافة القارئ "${channelTitle}" بالفعل. يمكنك الآن البحث به في شاشة الوسائط.`));
        }
    });
    
    lucide.createIcons();
    // 🛑 يجب تحديث العناصر القابلة للتنقل بعد إضافة النتائج
    updateNavigableElements();
    
    // نقل التركيز إلى أول نتيجة
    setTimeout(() => {
        const firstResult = resultsContainer.querySelector('.grid-item');
        if (firstResult) setFocus(firstResult);
    }, 50);
}

/**
 * RENAMED & REFINED: Handles the search action specifically for finding a Reciter Channel.
 * Applies strong filtering for 'type=channel' and 'relevanceLanguage=ar'.
 */
async function handleSearchForReciterChannel() {
    // 🛑 نستخدم هنا المُعرّف الصحيح من نافذة القراء المنبثقة
    const inputEl = document.getElementById('new-reciter-name-input'); 
    const resultsContainer = document.getElementById('channel-search-results'); // نفس اسم حاوية النتائج
    const confirmBtn = document.getElementById('search-channel-confirm'); // نفس اسم زر البحث
    const query = inputEl.value.trim();

    if (!query) {
        showMessageBox("الرجاء إدخال اسم القارئ/القناة للبحث.");
        return;
    }
    // ... (بقية منطق التحميل والتأكد) ...
    // ... (بقية منطق التحميل والتأكد) ...

    try {
        // 🛑 API Call: Filtered for Channel Type and Arabic Relevance
        const API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${YOUTUBE_API_KEY}&maxResults=10&relevanceLanguage=ar`; 
        
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        displayReciterSearchResults(data.items);
        
    } catch (error) {
        // ... (بقية منطق الخطأ) ...
    } finally {
        // ... (بقية منطق التحميل) ...
    }
}
/**
 * إعداد ماركر السيارة ثلاثي الأبعاد Lexus ES350
 * يدمج بين دقة الـ GPS وسلاسة الرسوميات
 */

// متغيرات التحكم العالمية لضمان السلاسة
// المتغيرات العالمية للتحكم
window.carOverlay = null; 
window.carModel = null;

async function setup3DCarMarker(map) {
    if (!map || window.carOverlay) return; // منع التكرار القاطع

    const loader = new window.GLTFLoader();
    const overlay = new google.maps.WebGLOverlayView();
    window.carOverlay = overlay;

    overlay.onAdd = () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        scene.add(new THREE.AmbientLight(0xffffff, 5.5));
        const sun = new THREE.DirectionalLight(0xffffff, 4.4);
        sun.position.set(10, 25, 10);
        scene.add(sun);

       loader.load('https://dmusera.netlify.app/ES350E.gltf', (gltf) => {
            window.carModel = gltf.scene;
            
            window.carModel.traverse(node => {
                if (node.isMesh) {
                    // 1. معالجة الألوان الأساسية لإظهار الطبقات الملونة
                    if (node.material) {
                        // منع الألوان من الانطفاء بسبب غياب الضوء المحيط
                        node.material.emissive = node.material.color.clone().multiplyScalar(0.2); 
                        
                        // 2. إصلاح مشكلة الأجزاء السوداء الناتجة عن المعدنية العالية
                        node.material.metalness = 0.4; // تقليل المعدنية لإظهار اللون الحقيقي
                        node.material.roughness = 0.5; // زيادة الخشونة لتقليل الانعكاسات السوداء

                        // 3. إجبار الطبقات على الظهور ومنع الشفافية الخاطئة
                        node.material.depthWrite = true;
                        node.material.transparent = false;
                        node.material.side = THREE.DoubleSide; // إظهار الأبواب والقطع من الداخل والخارج
                        
                        // تحديث المادة لإظهار التغييرات فوراً
                        node.material.needsUpdate = true;
                    }
                }
            });

            window.carModel.rotation.x = Math.PI / 2;
            scene.add(window.carModel);
        });
        overlay.scene = scene; overlay.camera = camera;
    };

    overlay.onContextRestored = ({ gl }) => {
        overlay.renderer = new THREE.WebGLRenderer({
            canvas: gl.canvas, context: gl, antialias: true, alpha: true,
        });
        overlay.renderer.autoClear = false;
    };

    
    overlay.setMap(map);
}

function displayReciterSearchResults(channels) {
    const resultsContainer = document.getElementById('channel-search-results');
    resultsContainer.innerHTML = '';

    if (!channels || channels.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-white/70">لم يتم العثور على قنوات بهذا الاسم باللغة العربية.</p>';
        updateNavigableElements();
        return;
    }

    channels.forEach(channel => {
        const channelId = channel.id.channelId;
        const channelTitle = channel.snippet.title;
        const channelThumbnail = channel.snippet.thumbnails.default.url;
        
        // التحقق مما إذا كان القارئ (الاسم) موجوداً بالفعل في قائمة القراء
        const isSaved = localRecitersCache.some(r => r.name === channelTitle); 

        const resultCard = document.createElement('div');
        resultCard.className = 'flex items-center gap-4 p-3 rounded-xl bg-white/5 navigable grid-item';
        resultCard.tabIndex = 0; // لضمان التنقل بالريموت
        
        resultCard.innerHTML = `
            <img src="${channelThumbnail}" alt="${channelTitle}" class="w-16 h-16 rounded-full object-cover flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/64x64';">
            <div class="flex-grow min-w-0">
                <h4 class="font-bold truncate text-lg">${channelTitle}</h4>
                <p class="text-sm text-white/60 truncate">${channel.snippet.description || 'قناة يوتيوب'}</p>
            </div>
            <button 
                class="add-reciter-from-search-btn p-2 rounded-full transition-colors flex-shrink-0 navigable grid-item" 
                data-reciter-name="${channelTitle}" 
                data-reciter-image="${channelThumbnail}"
                ${isSaved ? 'disabled' : ''}
                tabindex="0"
                style="background-color: ${isSaved ? '#10B981' : '#9333ea'};"
            >
                <i data-lucide="${isSaved ? 'check' : 'plus'}" class="w-5 h-5 text-white"></i>
            </button>
        `;
        resultsContainer.appendChild(resultCard);

        // ربط حدث النقر على زر الإضافة
        if (!isSaved) {
            resultCard.querySelector('.add-reciter-from-search-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                const name = btn.dataset.reciterName;
                const image = btn.dataset.reciterImage;
                handleAddReciter(name, image, btn); 
            });
            // ربط النقر على البطاقة نفسها بفتح القناة (ميزة إضافية)
            resultCard.addEventListener('click', (e) => {
                if(e.target.closest('button')) return; // لا تفعل شيئًا إذا تم النقر على الزر
                showMessageBox(`لتشغيل فيديوهات القناة، انقر على زر الإضافة ثم ابحث باسم القارئ في الشاشة الرئيسية.`);
            });
        } else {
             // إذا كان محفوظًا، اجعل النقر على البطاقة يفتح نافذة "تمت الإضافة"
             resultCard.addEventListener('click', () => showMessageBox(`تمت إضافة القارئ "${channelTitle}" بالفعل. يمكنك الآن البحث به في شاشة الوسائط.`));
        }
    });
    
    lucide.createIcons();
    // 🛑 يجب تحديث العناصر القابلة للتنقل بعد إضافة النتائج
    updateNavigableElements();
    
    // نقل التركيز إلى أول نتيجة
    setTimeout(() => {
        const firstResult = resultsContainer.querySelector('.grid-item');
        if (firstResult) setFocus(firstResult);
    }, 50);
}

        function showSurahSuggestions() {
            const existing = document.getElementById('youtube-surah-section');
            if (existing) existing.remove();

            const lastWatchedContainer = document.getElementById('last-watched-container');
            if (lastWatchedContainer) lastWatchedContainer.classList.add('hidden');

            // Hide the main suggestions content container to remove the top gap
            const suggestionsContent = document.getElementById('suggestions-content');
            if (suggestionsContent) suggestionsContent.classList.add('hidden');

            const surahSection = document.createElement('div');
            surahSection.id = 'youtube-surah-section';
            surahSection.className = 'flex flex-col gap-2 p-3 rounded-xl glass-surface glass-surface--svg w-full flex-grow';

            // 1. Create Tab Structure
            const tabContainer = document.createElement('div');
            tabContainer.className = 'tabs-container flex p-1 rounded-full bg-black/20 self-center mb-2';

            const surahTabButton = document.createElement('button');
            surahTabButton.id = 'tab-surah';
            surahTabButton.className = 'tab-button active navigable grid-item';
            surahTabButton.tabIndex = 0;
            surahTabButton.textContent = 'السورة';

            const juzTabButton = document.createElement('button');
            juzTabButton.id = 'tab-juz';
            juzTabButton.className = 'tab-button navigable grid-item';
            juzTabButton.tabIndex = 0;
            juzTabButton.textContent = 'الجزء';

            tabContainer.appendChild(surahTabButton);
            tabContainer.appendChild(juzTabButton);

            const tabsContentContainer = document.createElement('div');
            tabsContentContainer.id = 'tabs-content-container-surah';
            tabsContentContainer.className = 'flex-grow w-full overflow-hidden'; // Let inner container scroll

            // 2. Create Surah content panel
            const surahContent = document.createElement('div');
            surahContent.id = 'tab-content-surah';
            surahContent.className = 'tab-content h-full';
            
              const scrollableSurahContainer = document.createElement('div');
            scrollableSurahContainer.className = 'surah-buttons-scrollable h-full';
            const surahButtonsContainer = document.createElement('div');
            surahButtonsContainer.className = 'flex flex-wrap justify-center gap-2 w-full';
            
            youtubeSurahSuggestions.forEach(name => {
                const button = document.createElement('button');
                button.className = 'youtube-suggestion-button navigable grid-item';
                button.tabIndex = 0;
                button.innerHTML = `<span class="surah-name-text">${name}</span> <span class="juz-badge">${surahToJuzMap[name] || '?'}</span>`;
                button.style.backgroundColor = juzColors[(surahToJuzMap[name] || 1) - 1];
                // داخل دالة showSurahSuggestions()، في حلقة youtubeSurahSuggestions.forEach(name => { ...

button.addEventListener('click', () => {
    let query = '';
    const currentInput = youtubeSearchInput.value.trim();
    const surahName = name; // اسم السورة

    if (currentInput.includes('بالوصل')) { // 🛑 NEW: إذا كان الوضع هو 'بالوصل'
        // التنسيق: سورة {السورة} بالوصل
        query = `سورة ${surahName} بالوصل`; 
        
    } else if (youtubeSearchInput.value.startsWith('الكلمات الصعبة في')) {
        query = 'الكلمات الصعبة في سورة ' + surahName;
    } else if (currentInput === '') {
        query = 'سورة ' + surahName;
    } else {
        // التنسيق العادي: {القارئ/الأداة} سورة {السورة}
        query = selectedReaderName + ' سورة ' + surahName;
    }
    
    youtubeSearchInput.value = query;
    searchYouTubeVideos(query);
});
                surahButtonsContainer.appendChild(button);
            });
            scrollableSurahContainer.appendChild(surahButtonsContainer);
            surahContent.appendChild(scrollableSurahContainer);

            // 3. Create Juz content panel
            const juzContent = document.createElement('div');
            juzContent.id = 'tab-content-juz';
            juzContent.className = 'tab-content hidden h-full';

            const scrollableJuzContainer = document.createElement('div');
            scrollableJuzContainer.className = 'surah-buttons-scrollable h-full';
            const juzButtonsContainer = document.createElement('div');
            juzButtonsContainer.className = 'flex flex-wrap justify-center gap-2 w-full';

            for (let i = 1; i <= 30; i++) {
                const button = document.createElement('button');
                button.className = 'youtube-suggestion-button navigable grid-item';
                button.tabIndex = 0;
                button.style.backgroundColor = juzColors[(i % juzColors.length)];
                button.innerHTML = `الجزء ${i}`;
                button.addEventListener('click', () => {
                    const juzName = juzArabicNames[i - 1];
                    let query = '';
                    const currentSearch = youtubeSearchInput.value;
                    if (currentSearch.trim() && !currentSearch.startsWith('الكلمات الصعبة في')) {
                        query = currentSearch + `الجزء ${juzName}`;
                    } else {
                        query = `الجزء ${juzName}`;
                    }
                    youtubeSearchInput.value = query;
                    searchYouTubeVideos(query);
                });
                juzButtonsContainer.appendChild(button);
            }
            scrollableJuzContainer.appendChild(juzButtonsContainer);
            juzContent.appendChild(scrollableJuzContainer);

            // 4. Tab Switching Logic
            surahTabButton.addEventListener('click', () => {
                surahTabButton.classList.add('active');
                juzTabButton.classList.remove('active');
                surahContent.classList.remove('hidden');
                juzContent.classList.add('hidden');
                const firstItem = surahContent.querySelector('.grid-item');
                if (firstItem) setFocus(firstItem);
            });
            juzTabButton.addEventListener('click', () => {
                juzTabButton.classList.add('active');
                surahTabButton.classList.remove('active');
                juzContent.classList.remove('hidden');
                surahContent.classList.add('hidden');
                const firstItem = juzContent.querySelector('.grid-item');
                if (firstItem) setFocus(firstItem);
            });

            // 5. Append everything
            surahSection.appendChild(tabContainer);
            tabsContentContainer.appendChild(surahContent);
            tabsContentContainer.appendChild(juzContent);
            surahSection.appendChild(tabsContentContainer);
            youtubeSuggestionsDiv.appendChild(surahSection);
        }

        function navigateBackToMainSearch() { 
            youtubeVideoListView.classList.add('hidden'); 
            youtubeSearchResultsView.classList.add('hidden'); 
            youtubeSuggestionsDiv.style.display = 'flex'; 
            activeMediaView = 'suggestions'; 
            currentPlayingPlaylistId = ''; 
            backToPlaylistsBottomButton.style.display = 'none'; 
            backToPlaylistsBottomButtonSearch.style.display = 'none'; 
            
            // إصلاح: إزالة قسم السور بشكل صريح عند العودة
            const existingSurahSection = document.getElementById('youtube-surah-section');
            if (existingSurahSection) {
                existingSurahSection.remove();
            }
            
            resetYoutubeSearchUI(); 
            setTimeout(() => { const firstReader = youtubeSuggestionsDiv.querySelector('.grid-item'); if (firstReader) setFocus(firstReader); }, 100); 
        }

        // --- Google Map and Geolocation (REFACTORED FOR RELIABILITY) ---
       
        
        function showGeolocationErrorOnMap(message) {
            const overlay = document.getElementById('geolocation-error-overlay');
            const mapControls = document.querySelector('#dashboard-google-map ~ .absolute'); 

            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.classList.add('flex');
                if (message) {
                    const p = overlay.querySelector('p');
                    if (p) p.textContent = message;
                }
                lucide.createIcons();
            }
            if (mapControls) {
                mapControls.style.display = 'none';
            }
        }

        // --- Favorites (Bookmark) Functions ---
        function closeFavoritesMenu() {
            const existingMenu = document.querySelector('.favorites-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            // Remove the global click listener that was added to close the menu
             document.body.removeEventListener('click', closeFavoritesMenu);
        }

 function showFavoritesMenu(button, video) {
            closeFavoritesMenu(); // Close any existing menu first

            const menu = document.createElement('div');
            menu.className = 'favorites-menu';
            const rect = button.getBoundingClientRect();

            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            
            menu.innerHTML = `
                <button data-type="D" class="navigable grid-item" tabindex="0">
                     <i data-lucide="folder-plus" class="w-4 h-4 text-blue-400"></i> CAR LIST
                </button>
                <button data-type="M" class="navigable grid-item" tabindex="0">
                    <i data-lucide="folder-plus" class="w-4 h-4 text-pink-400"></i> TV LIST
                </button>
            `;

            document.body.appendChild(menu);
            menu.classList.add('show');

            menu.addEventListener('click', e => e.stopPropagation());

            menu.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const type = btn.dataset.type;
                    await saveVideoToFavorites(video, type);
                    closeFavoritesMenu();
                });
            });

            lucide.createIcons();
            setFocus(menu.querySelector('button'));

            setTimeout(() => {
                document.body.addEventListener('click', closeFavoritesMenu, { once: true });
            }, 0);
        }


async function addManualKeySwitcher() {
    // منع التكرار
    if (document.getElementById('manual-key-switcher')) return;

    // ============================================================
    // 1. الحاوية الرئيسية (نفس الستايل الأصلي تماماً)
    // ============================================================
    const container = document.createElement('div');
    container.id = 'manual-key-switcher';
    Object.assign(container.style, {
        position: 'fixed', 
        bottom: '150px', 
        left: '2rem', 
        transform: 'translateX(-50%)', 
        zIndex: '9999999', 
        display: 'flex', 
        gap: '15px', 
        padding: '12px 25px', 
        background: 'rgba(20, 20, 20, 0.8)', 
        borderRadius: '50px', 
        backdropFilter: 'blur(10px)', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
    });

    // ============================================================
    // 2. دالة بناء الزر (مبدئياً في حالة الفحص)
    // ============================================================
    const createVisualBtn = (label) => {
        const btn = document.createElement('button');
        btn.className = 'navigable';
        
        // الستايل الموحد (نفس الكود الخاص بك)
        Object.assign(btn.style, {
            border: 'none', cursor: 'pointer',
            padding: '10px 24px', borderRadius: '30px',
            fontSize: '13px', fontWeight: 'bold', fontFamily: 'sans-serif',
            color: '#fff', 
            background: '#f59e0b', // 🟡 أصفر (بداية الفحص)
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'all 0.3s ease', outline: 'none'
        });

        btn.innerHTML = `
            <span>${label}</span>
            <span class="status-badge" style="background:rgba(0,0,0,0.25); padding:2px 10px; border-radius:12px; font-size:11px;">
                ⏳ Scanning...
            </span>
        `;
        return btn;
    };

    const btn1 = createVisualBtn("KEY 1");
    const btn2 = createVisualBtn("KEY 2");

    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    // ============================================================
    // 3. منطق الفحص (Scanning Logic)
    // ============================================================
    
    // دالة اختبار مفتاح
    const testKey = async (key) => {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id&id=Ks-_Mh1QhMc&key=${key}`);
            return res.status === 200;
        } catch { return false; }
    };

    // دالة لتحديث الزر ليصبح "أخضر" وقابلاً للنقر (Manual Switcher)
    const activateButton = (btn, label, storageKey, otherStorageKey, foundIndex) => {
        // تحديث الشكل للأخضر (Active)
        btn.style.background = '#10b981';
        btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        btn.querySelector('.status-badge').innerText = `Idx: ${foundIndex}`;

        // إضافة تأثيرات الماوس
        btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1)';

        // 🟢 إضافة وظيفة التبديل اليدوي (عند الضغط)
        btn.onclick = () => {
            btn.style.background = '#f59e0b'; // عودة للأصفر
            btn.innerHTML = `<span>Switching...</span> ⌛`;

            // منطق التبديل اليدوي (نفس كودك السابق)
            let otherIndex = parseInt(localStorage.getItem(otherStorageKey)) || 0;
            let nextIndex = (foundIndex + 1) % window.YT_KEYS_POOL.length;

            if (nextIndex === otherIndex) {
                nextIndex = (nextIndex + 1) % window.YT_KEYS_POOL.length;
            }

            localStorage.setItem(storageKey, nextIndex);
            
            console.log(`✅ Manual Switch: ${label} -> Index ${nextIndex}`);
            setTimeout(() => location.reload(), 250);
        };
    };

    console.log("🚀 Starting Key Scan...");

    // ============================================================
    // 4. حلقة البحث عن المفاتيح
    // ============================================================
    let foundKeysCount = 0;

    for (let i = 0; i < window.YT_KEYS_POOL.length; i++) {
        // إذا وجدنا مفتاحين، نتوقف
        if (foundKeysCount >= 2) break;

        // تحديث النص في الزر الجاري فحصه
        const activeBtn = (foundKeysCount === 0) ? btn1 : btn2;
        activeBtn.querySelector('.status-badge').innerText = `Checking [${i}]...`;

        const isValid = await testKey(window.YT_KEYS_POOL[i]);

        if (isValid) {
            if (foundKeysCount === 0) {
                // تعيين المفتاح الأول
                window.YOUTUBE_API_KEY = window.YT_KEYS_POOL[i];
                localStorage.setItem('yt_idx_1', i);
                activateButton(btn1, "KEY 1", 'yt_idx_1', 'yt_idx_2', i);
                foundKeysCount++;
            } 
            else if (foundKeysCount === 1) {
                // تعيين المفتاح الثاني
                window.YOUTUBE_API_KEY2 = window.YT_KEYS_POOL[i];
                localStorage.setItem('yt_idx_2', i);
                activateButton(btn2, "KEY 2", 'yt_idx_2', 'yt_idx_1', i);
                foundKeysCount++;
            }
        }
    }

    // إذا فشل العثور على مفاتيح
    if (foundKeysCount === 0) {
        btn1.style.background = '#ef4444'; // أحمر
        btn1.innerHTML = `<span>FAILED</span> <span>❌</span>`;
    }
}

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', addManualKeySwitcher);


function handleMenuAction(action, videoId) {
    const menu = document.getElementById('fav-popup-menu');
    if (menu) menu.remove();

    if (action === 'ADD' && videoId) {
        if (typeof addToFavorites === 'function') {
            addToFavorites(videoId);
        } else {
            console.warn("addToFavorites function is missing!");
        }
    } else if (action === 'SHARE' && videoId) {
        const url = `https://youtu.be/${videoId}`;
        navigator.clipboard.writeText(url).then(() => {
            // يمكن استبدال هذا بـ showMessageBox
            alert("تم نسخ رابط الفيديو!");
        });
    }
}

        async function fetchFavorites(type) {
            const binId = type === 'D' ? JSONBIN_BIN_ID_FAV_D : JSONBIN_BIN_ID_FAV_M;
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                    headers: { 'X-Access-Key': JSONBIN_ACCESS_KEY_REMINDERS }
                });
                if (res.status === 404) return []; // Bin is new/empty
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                return Array.isArray(data.record) ? data.record : [];
            } catch (error) {
                console.error(`Error fetching favorites ${type}:`, error);
                return [];
            }
        }

        async function updateFavorites(type, newFavoritesList) {
            const binId = type === 'D' ? JSONBIN_BIN_ID_FAV_D : JSONBIN_BIN_ID_FAV_M;
            
            // If the list is empty, send a placeholder object to avoid API errors.
            const dataToSend = (Array.isArray(newFavoritesList) && newFavoritesList.length === 0)
                ? { _init: true } 
                : newFavoritesList;

            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY
                    },
                    body: JSON.stringify(dataToSend)
                });
                if (!res.ok) throw new Error(`Failed to update favorites: ${res.status}`);
                return true;
            } catch (error) {
                console.error(`Error updating favorites ${type}:`, error);
                showMessageBox(`حدث خطأ أثناء تحديث المفضلة ${type}`);
                return false;
            }
        }
// ============================================================
// 🧹 نظام مسح الكاش الذكي (Smart Cache Cleaner)
// يحمي الكوتا والقوائم المهمة من الحذف
// ============================================================

function clearAppCache() {
    // 1. قائمة المفاتيح المحمية (WhiteList)
    // هذه المفاتيح لن يتم حذفها أبداً
    const protectedKeys = [
        'suggestedVideosCache',
        // أ. بيانات المقترحات (لتوفير الكوتا)
        'dashboard_cached_data',       // الاسم الافتراضي لكاش الداشبورد
        'dashboard_cache_timestamp',   // وقت التحديث
        'suggested_videos_cache',      // كاش المقترحات الجانبية (إن وجد)
        
        // ب. مؤشرات API (مهم جداً عدم حذفها لكي لا يعود للصفر)
        'yt_idx_1',
        'yt_idx_2',
        
        // ج. القوائم الشخصية (اختياري - يفضل عدم حذف قوائم المستخدم)
        'playlist_car_mode',
        'playlist_tv_mode',
        'playlist_watch_later',
        'fav_dashboard_data',
        'favorites_simple'
    ];

    let deletedCount = 0;
    const totalKeys = localStorage.length;

    // 2. تجميع المفاتيح المراد حذفها
    // لا نحذف مباشرة داخل الحلقة لأن طول المصفوفة سيتغير
    const keysToRemove = [];

    for (let i = 0; i < totalKeys; i++) {
        const key = localStorage.key(i);
        
        // هل المفتاح موجود في القائمة المحمية؟
        if (!protectedKeys.includes(key)) {
            keysToRemove.push(key);
        }
    }

    // 3. تنفيذ الحذف
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
    });

    console.log(`🧹 Cache Cleaned: Removed ${deletedCount} items, Kept ${protectedKeys.length} important items.`);

    // 4. رسالة للمستخدم
    // نستخدم showMessageBox إذا كانت موجودة، أو alert
    const msg = `تم تنظيف الذاكرة المؤقتة (${deletedCount} ملفات).\nتم الحفاظ على الفيديوهات المقترحة لتوفير الكوتا.`;
    
    if (typeof showMessageBox === 'function') {
        showMessageBox("✅ " + msg);
    } else {
        alert("✅ " + msg);
    }

    // 5. تحديث الصفحة (اختياري)
    setTimeout(() => location.reload(), 1000);
}
        async function saveVideoToFavorites(rawVideoData, type) {
    const videoToSave = {
        id: rawVideoData.id,
        title: rawVideoData.title || rawVideoData.snippet?.title || 'Unknown Title',
        thumbnail: rawVideoData.thumbnail || rawVideoData.snippet?.thumbnails?.medium?.url || '',
        channelTitle: rawVideoData.channelTitle || rawVideoData.snippet?.channelTitle || 'Unknown Channel',
        channelId: rawVideoData.channelId || rawVideoData.snippet?.channelId || '',
        duration: rawVideoData.duration, 
        progress: rawVideoData.progress || 0 
    };

    let favoritesList = type === 'D' ? favoritesD : favoritesM;
    
    // هذا السطر يضيف الفيديو الجديد في المقدمة دون إزالة أي نسخ قديمة (يسمح بالتكرار).
    const updatedList = [videoToSave, ...favoritesList];
    
    if (updatedList.length > 50) {
        updatedList.pop();
    }

    const success = await updateFavorites(type, updatedList);

    if (success) {
        if (type === 'D') favoritesD = updatedList; else favoritesM = updatedList;
        showMessageBox(`تم حفظ الفيديو في المفضلة ${type}`);

        const bookmarkBtn = document.querySelector(`.bookmark-button[data-video-id="${videoToSave.id}"]`);
        if(bookmarkBtn) {
            bookmarkBtn.classList.remove('saved-d', 'saved-m', 'saved-both');
            const isD = favoritesD.some(fav => fav.id === videoToSave.id);
            const isM = favoritesM.some(fav => fav.id === videoToSave.id);
            if (isD && isM) bookmarkBtn.classList.add('saved-both');
            else if (isD) bookmarkBtn.classList.add('saved-d');
            else if (isM) bookmarkBtn.classList.add('saved-m');
        }

        const activeTab = document.querySelector('#screen-Media .tab-button.active')?.id;
        if ((type === 'D' && activeTab === 'tab-saved-d') || (type === 'M' && activeTab === 'tab-saved-m')) {
             loadSavedVideos(type);
        }
    }
}

        async function removeVideoFromFavorites(videoId, type) {
            const favoritesList = type === 'D' ? favoritesD : favoritesM;
            const updatedList = favoritesList.filter(fav => fav.id !== videoId);
            const success = await updateFavorites(type, updatedList);
            if (success) {
                if (type === 'D') favoritesD = updatedList; else favoritesM = updatedList;
                showMessageBox(`تمت إزالة الفيديو من المفضلة ${type}`);
                loadSavedVideos(); 
            }
        }

        // Replace the existing loadSavedVideos function
async function loadSavedVideos(type) { // Added 'type' parameter ('D', 'M', or undefined)
    console.log(`[Debug SavedVideos] Starting loadSavedVideos(${type || 'both'})...`);

    const gridD = document.getElementById('favorites-d-grid');
    const gridM = document.getElementById('favorites-m-grid');
    const savedDContent = document.getElementById('tab-content-saved-d');
    const savedMContent = document.getElementById('tab-content-saved-m');

    // Determine which grids/content areas to update
    const updateD = !type || type === 'D';
    const updateM = !type || type === 'M';

    if (updateD && !gridD) console.error("[Debug SavedVideos] favorites-d-grid not found!");
    if (updateM && !gridM) console.error("[Debug SavedVideos] favorites-m-grid not found!");

    // Show loading messages only in the relevant grids
    if (updateD && gridD) gridD.innerHTML = '<p class="text-white/70 text-center col-span-full">جاري تحميل قائمة السيارة...</p>';
    if (updateM && gridM) gridM.innerHTML = '<p class="text-white/70 text-center col-span-full">جاري تحميل قائمة التلفاز...</p>';

    try {
        let fetchedD = [], fetchedM = [];

        // Fetch only the necessary lists
        if (updateD && updateM) { // Fetch both if no type specified
             const results = await Promise.allSettled([fetchFavorites('D'), fetchFavorites('M')]);
             fetchedD = results[0].status === 'fulfilled' ? results[0].value : [];
             fetchedM = results[1].status === 'fulfilled' ? results[1].value : [];
             favoritesD = fetchedD; // Update global cache
             favoritesM = fetchedM; // Update global cache
        } else if (updateD) { // Fetch only D
             fetchedD = await fetchFavorites('D');
             favoritesD = fetchedD; // Update global cache
        } else if (updateM) { // Fetch only M
             fetchedM = await fetchFavorites('M');
             favoritesM = fetchedM; // Update global cache
        }

        console.log("[Debug SavedVideos] Fetched D:", fetchedD);
        console.log("[Debug SavedVideos] Fetched M:", fetchedM);

        // Render D list if needed
        if (updateD && gridD) {
            gridD.innerHTML = '';
            if (fetchedD.length > 0) {
                 fetchedD.forEach(video => {
                     const cardElement = createFavoriteVideoCard(video, 'D');
                     if (cardElement) gridD.appendChild(cardElement);
                 });
            } else {
                 gridD.innerHTML = '<p class="text-white/70 text-center col-span-full">لا توجد فيديوهات محفوظة هنا.</p>';
            }
        }

        // Render M list if needed
        if (updateM && gridM) {
             gridM.innerHTML = '';
             if (fetchedM.length > 0) {
                 fetchedM.forEach(video => {
                     const cardElement = createFavoriteVideoCard(video, 'M');
                     if (cardElement) gridM.appendChild(cardElement);
                 });
             } else {
                 gridM.innerHTML = '<p class="text-white/70 text-center col-span-full">لا توجد فيديوهات محفوظة هنا.</p>';
             }
        }

        lucide.createIcons();
        updateNavigableElements(); // Ensure focusable elements are updated after rendering
        console.log("[Debug SavedVideos] Finished rendering saved videos.");

    } catch (error) {
        console.error("[Debug SavedVideos] Error in loadSavedVideos:", error);
        if (updateD && gridD) gridD.innerHTML = '<p class="text-red-500 text-center col-span-full">خطأ في تحميل المفضلة.</p>';
        if (updateM && gridM) gridM.innerHTML = '<p class="text-red-500 text-center col-span-full">خطأ في تحميل المفضلة.</p>';
    }
}

        function createFavoriteVideoCard(video, type) {
            const card = document.createElement('div');
            card.className = 'glass-surface glass-surface--svg youtube-video-card navigable grid-item';
            card.tabIndex = 0;
            card.dataset.videoId = video.id;

            card.innerHTML = `
                <div class="video-details">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span>${video.channelTitle || ''}</span>
                    </div>
                </div>
                <div class="thumbnail-container relative">
                     <img src="${video.thumbnail}" alt="${video.title}" class="w-[180px] h-[101.25px] object-cover rounded-md ml-4 flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/180x101';">
                     <span class="video-duration">${video.duration || ''}</span>
                     <button class="remove-favorite-button" title="إزالة من المفضلة"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </div>
            `;
            // Ensure the progress value is treated as a number and passed to the video player
            const startProgress = parseFloat(video.progress || 0);
            card.addEventListener('click', () => showVideoPopup(video.id, startProgress));
            card.querySelector('.remove-favorite-button').addEventListener('click', (e) => {
                e.stopPropagation();
                removeVideoFromFavorites(video.id, type);
            });
            return card;
        }

function directionToDegrees(direction) {
    const directionsMap = {
        'N': 0,
        'NE': 45,
        'E': 90,
        'SE': 135,
        'S': 180,
        'SW': 225,
        'W': 270,
        'NW': 315
    };
    // استخدام 0 (الشمال) كقيمة افتراضية إذا لم يتم العثور على الاتجاه
    return directionsMap[direction.toUpperCase()] || 0; 
}

        // --- Google Map and Geolocation (REFACTORED FOR RELIABILITY) ---
        function loadGoogleMaps() {
            if (googleMapsPromise) return googleMapsPromise;

            googleMapsPromise = new Promise((resolve, reject) => {
                if (typeof google !== 'undefined' && google.maps) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
                script.async = true;
                script.defer = true;
                script.onload = () => resolve();
                script.onerror = () => reject('Failed to load Google Maps script.');
                document.head.appendChild(script);
            });

            return googleMapsPromise;
        }


let carplayGoogleMap;   // خريطة CarPlay المصغرة

let mapsInitialized = false;
async function initMaps() {
    // 1. 🛡️ الحل الجذري للخطأ 9335: تأمين appState فوراً لمنع انهيار onDraw
    window.appState = window.appState || {
        currentLocation: { lat: 17.021, lng: 54.110 }, // إحداثيات افتراضية (صلالة)
        car: { heading: 0 }
    };

    if (mapsInitialized) return;
    
    try {
        const mainMapElement = document.getElementById('dashboard-google-map');
        const miniMapElement = document.getElementById('carplay-mini-map');

        if (!mainMapElement) {
            console.error("❌ عنصر الخريطة الرئيسي غير موجود");
            return;
        }

        // 2. 🚀 الإعدادات المشتركة: زووم أبعد (17.5) لرؤية أوسع وتصحيح المنظور
        const commonConfigs = {
            center: window.appState.currentLocation,
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            renderingType: google.maps.RenderingType.VECTOR,
            headingInteractionEnabled: true,
            tiltInteractionEnabled: true,
            gestureHandling: 'greedy'
        };
 
        // 3. --- أ. خريطة الداشبورد (3D) ---
        window.dashboardGoogleMap = new google.maps.Map(mainMapElement, {
            ...commonConfigs,
            mapId: '6c6951a9289b612a97923702', 
            zoom: 17.5, // تقليل الزووم لرؤية أبعد كما طلبت
            tilt: 65,   
            heading: 0, disableDefaultUI: false
        });

        // 🚗 حقن نظام الـ 3D مع تصحيح الحجم والإزاحة لليسار
        setup3DCarSystem(window.dashboardGoogleMap);

        // إضافة طبقة المرور
        new google.maps.TrafficLayer().setMap(window.dashboardGoogleMap);

        // 4. --- ب. خريطة CarPlay (المصغرة) ---
        if (miniMapElement) {
            window.carplayGoogleMap = new google.maps.Map(miniMapElement, {
                ...commonConfigs,
                mapId: '6c6951a9289b612af6d86b8d',
                colorScheme: google.maps.ColorScheme.DARK,
                zoom: 17, // زووم أبعد قليلاً للخريطة المصغرة
                tilt: 45
            });

            new google.maps.TrafficLayer().setMap(window.carplayGoogleMap);
            
            window.carplayGoogleMarker = new google.maps.Marker({
                position: commonConfigs.center,
                map: window.carplayGoogleMap,
                icon: { 
                    url: 'https://dmusera.netlify.app/3606.png', 
                    scaledSize: new google.maps.Size(60, 70), // تصغير الماركر التقليدي
                    anchor: new google.maps.Point(30, 35)
                }
            });
        }

        mapsInitialized = true;
        console.log("✅ تم تشغيل كافة الخرائط وتصحيح أبعاد الرؤية والحجم.");
        
        // بدء التتبع الحي
        startContinuousLocationTracking();

    } catch (error) {
        console.error("❌ Map Init Error:", error);
    }
}
// التأكد من وجود كائن الخريطة قبل التعديل
if (window.dashboardGoogleMap) {
    window.dashboardGoogleMap.setOptions({
        disableDefaultUI: false,
        fullscreenControl: true,
        streetViewControl: true,
        fullscreenControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM // نقله لأسفل اليسار
    }
    });
} else {
    console.warn("⚠️ الخريطة لم تجهز بعد، سيتم المحاولة بعد ثانية...");
    setTimeout(() => { if(window.dashboardGoogleMap) window.dashboardGoogleMap.setOptions({disableDefaultUI: false}); }, 1000);
}
// --- 2. محرك الجرافيك المطور (إصلاح الحجم والإزاحة) ---
async function setup3DCarSystem(map) {
    if (!map || window.carOverlay) return;

    const overlay = new google.maps.WebGLOverlayView();
    window.carOverlay = overlay;

    overlay.onAdd = () => {
        const loader = new window.GLTFLoader();
        overlay.scene = new THREE.Scene();
        overlay.camera = new THREE.PerspectiveCamera();
        
        // 1. نظام إضاءة "الاستوديو" لإبراز اللمعة النقطية (Specular)
        overlay.scene.add(new THREE.AmbientLight(0xffffff, 0.65)); // ضوء محيطي متوازن
        
        // كشافات جانبية منخفضة لتركيز اللمعة على الجوانب وليس السقف
        const light1 = new THREE.DirectionalLight(0xffffff, 0.68);
        light1.position.set(25, 8, 15); 
        overlay.scene.add(light1);

        const light2 = new THREE.DirectionalLight(0xffffff, 0.75);
        light2.position.set(-25, 5, 15); 
        overlay.scene.add(light2);

        loader.load('https://dmusera.netlify.app/ES350E.gltf', (gltf) => {
            window.carModel = gltf.scene;
            
            window.carModel.traverse(node => {
                if (node.isMesh) {
                    const originalColor = node.material.color.clone();
                    const isTransparent = node.material.transparent || node.material.opacity < 0.9;
                    
                    // 2. منطق الفرز اللوني الذكي (عجلات وزجاج مقابل الهيكل)
                    const isNeutral = (originalColor.r === originalColor.g && originalColor.g === originalColor.b) || 
                                     (originalColor.r < 0.5 && originalColor.g < 0.5 && originalColor.b < 0.5);

                    if (isTransparent || isNeutral) {
                        // العجلات والزجاج: الحفاظ على التباين الداكن والشفافية
                        node.material = new THREE.MeshPhongMaterial({
                            color: isTransparent ? originalColor : 0x050505,
                            specular: 0x444444,
                            shininess: 100,
                            side: THREE.DoubleSide,
                            transparent: isTransparent,
                            opacity: node.material.opacity
                        });
                    } else {
                        // 3. الهيكل: الذهب الملكي العميق (القيم المثالية المعتمدة)
                        node.material = new THREE.MeshPhongMaterial({
                            color: 0xcccaac,       // ذهبي غني أغمق قليلاً لمنع البهتان
                            specular: 0x888888,    // رمادي خافت لتقليل وهج البياض
                            shininess: 2000,       // لمعة مركزة جداً ونقطية
                            emissive: 0x221100,    // توهج دافئ لعمق اللون
                            emissiveIntensity: 0.2,
                            side: THREE.DoubleSide,
                            flatShading: false
                        });
                    }
                    node.material.needsUpdate = true;
                }
            });

            window.carModel.rotation.x = Math.PI / 2;
            overlay.scene.add(window.carModel);
        });
    };

    overlay.onContextRestored = ({ gl }) => {
        overlay.renderer = new THREE.WebGLRenderer({
            canvas: gl.canvas, context: gl, antialias: true, alpha: true
        });
        overlay.renderer.autoClear = false;
    };

    overlay.onDraw = ({ transformer }) => {
        const { renderer, scene, camera } = overlay;
        if (!renderer || !window.carModel || !window.appState?.currentLocation) return;

        // إعادة ضبط الحالة لمنع تداخل الطبقات عند تحريك الكاميرا
        renderer.resetState();

        const pos = window.appState.currentLocation;
        const heading = window.appState.car.heading || 0;
        const zoom = window.dashboardGoogleMap.getZoom();

        // ربط السيارة بالإحداثيات والارتفاع الثابت
        const matrix = transformer.fromLatLngAltitude({ ...pos, altitude: 3.5 });
        camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

        // مزامنة الحجم والدوران
        const baseScale = window.tuner?.scale || 0.85; 
        const finalScale = baseScale * Math.pow(2, 20 - zoom); 
        
        window.carModel.scale.set(finalScale, finalScale, finalScale);
        window.carModel.rotation.y = -(heading * Math.PI) / 180 + Math.PI;

        renderer.render(scene, camera);
        overlay.requestRedraw(); 
    };

    overlay.setMap(map);
}
// 1. القيم المثالية التي اخترتها
window.tuner = {
    zoom: 19.5,
    tilt: 65,
    scale: 1.02,
    offset: 45
};

// 2. دالة التحديث التلقائي المستمر (Live Stream)
window.startLiveTracking = function() {
    if (navigator.geolocation) {
        // تنظيف أي مراقب قديم لتجنب تكرار العمليات واستهلاك البطارية
        if (window.locationWatchId) {
            navigator.geolocation.clearWatch(window.locationWatchId);
        }

        // تشغيل المراقب المستمر (watchPosition)
        window.locationWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                // نرسل الإحداثيات فوراً لدالة التحديث الرئيسية
                // وهي التي تتولى تحريك الكاميرا، تدوير الخريطة، وإزاحة السيارة
                if (typeof window.updateGoogleMapLocation === 'function') {
                    window.updateGoogleMapLocation(pos);
                }
            },
            (err) => {
                console.error("🚨 فشل التتبع التلقائي:", err.message);
            },
            {
                enableHighAccuracy: true, // استخدام أدق إشارة GPS ممكنة
                maximumAge: 0,            // جلب الموقع الحالي بدقة اللحظة
                timeout: 10000            // مهلة 10 ثوانٍ للتواصل مع الأقمار
            }
        );
        console.log("%c📡 نظام الملاحقة المستمرة نشط الآن...", "color: #00e676; font-weight: bold;");
    }
};

// تشغيل الدالة فور تحميل الصفحة لتبدأ الملاحقة فوراً
window.startLiveTracking();
// متغير لمنع التحديث التلقائي أثناء اللمس
let isUserInteracting = false;

// مستمعات الأحداث لاكتشاف التفاعل اليدوي
if (window.dashboardGoogleMap) {
    const map = window.dashboardGoogleMap;
    map.addListener('dragstart', () => isUserInteracting = true);
    map.addListener('zoom_changed', () => {
        if (isUserInteracting) {
            // تحديث قيم التونر فورياً عند تغيير الزوم بالأصابع
            window.tuner.zoom = map.getZoom();
        }
    });
}



// تشغيل النظام
startLiveTracking();

function stopDashboardLocationTracking() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}
        /**
 * REPLACED & FINALIZED: Gets the user's current geolocation (One-Time Fetch), 
 * centers the map, and immediately updates the traffic indicators. 
 * CRITICAL FIX: Uses a fallback location if permission is denied.
 */
async function centerMapOnUserLocation() { 
    if (navigator.geolocation) { 
        navigator.geolocation.getCurrentPosition(
            // 🛑 النجاح: تم الحصول على الموقع (pos)
            async (pos) => { 
                // 1. تحديث الخريطة ومتغيرات AppState (يجب أن يتم أولاً)
                updateGoogleMapLocation(pos); 
                
                // 2. الانتظار لتحديث مؤشرات الازدحام باستخدام الموقع الجديد
                await updateTrafficIndicators(); 
                
               
            }, 
            // 🛑 الفشل: خطأ في الوصول
            async (err) => { // 👈 يجب أن تكون الدالة async للتعامل مع await
                let msg = 'تعذر الحصول على موقعك الحالي. يرجى التحقق من الأذونات.';
                
                if (err.code === 1) { // PERMISSION_DENIED
                     msg = 'تم رفض إذن تحديد الموقع. سيتم عرض موقع افتراضي.';
                } else if (err.code === 2) {
                     msg = 'تعذر تحديد الموقع. سيتم عرض موقع افتراضي.';
                }
                
                // 1. 🚀 FIX: تعيين موقع افتراضي يدويًا (Fallback Logic)
                const FALLBACK_COORDS = { lat: 17.067330, lng: 54.160190 }; // HOME1_COORDS

                appState.currentLocation = FALLBACK_COORDS; // تعيين الموقع الافتراضي
                
                // 2. تحديث الخريطة بـ الموقع الافتراضي (لضمان عمل setCenter/setHeading)
                // يجب أن نرسل كائن 'pos' مبسط يحتوي على الإحداثيات الافتراضية للتعامل مع updateGoogleMapLocation
                const fallbackPos = {
                    coords: {
                        latitude: FALLBACK_COORDS.lat, 
                        longitude: FALLBACK_COORDS.lng, 
                        heading: 0 // Heading افتراضي (شمال)
                    }
                };
                updateGoogleMapLocation(fallbackPos);
                
                // 3. تحديث مؤشرات الازدحام باستخدام الموقع الافتراضي
                await updateTrafficIndicators(); 

                showMessageBox(msg); 
                console.error("Geolocation Error Code:", err.code);
            }, 
            { enableHighAccuracy: true } 
        ); 
    } else { 
        showGeolocationErrorOnMap('خدمة تحديد المواقع غير مدعومة في هذا المتصفح.');
    }
}

function parseDurationToSeconds(durationStr) {
    if (!durationStr || durationStr === "مباشر") return 9999; // قيمة عالية للمباشر
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2]; // H:M:S
    if (parts.length === 2) return (parts[0] * 60) + parts[1]; // M:S
    return 0;
}
        
        async function calculateAndDisplayRouteTo(destinationCoords) {
            if (!appState.currentLocation) {
                showMessageBox('لم يتم تحديد موقعك الحالي بعد. يرجى الانتظار أو تحديث الموقع.');
                return;
            }
            if (!directionsService || !directionsRenderer) {
                showMessageBox('خدمة التوجيهات غير جاهزة.');
                return;
            }
            
            const request = {
                origin: appState.currentLocation,
                destination: destinationCoords,
                travelMode: 'DRIVING'
            };

            try {
                const response = await directionsService.route(request);
                if (response.status === 'OK') {
                    directionsRenderer.setDirections(response);
                    const route = response.routes[0].legs[0];
                   
                    showMessageBox(`الطريق إلى وجهتك: ${route.distance.text}, الوقت المقدر: ${route.duration.text}`);
                } else {
                    showMessageBox('تعذر العثور على اتجاهات: ' + response.status);
                }
            } catch (err) {
                console.error('Error calculating directions:', err);
                
            }
        }


// -------------------------------------------------------------
// --- MODIFIED fetchWeatherData function (Fetches Weather + NASA Moon) ---
// -------------------------------------------------------------
async function fetchWeatherData() {
    const now = new Date(); // جلب الوقت الحالي لتمريره إلى API الطقس والقمر
    
    if (WEATHER_API_KEY.startsWith('YOUR_')) return showMessageBox('خطأ: لم يتم تعيين مفتاح WeatherAPI.');
    
    // 1. تحديد الموقع
    try {
        const locationQuery = appState.currentLocation ? `${appState.currentLocation.lat},${appState.currentLocation.lng}` : appState.weather.location.split(',')[0].trim();
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${locationQuery}&days=2&aqi=yes&alerts=no&lang=ar`);
        
        if (!res.ok) throw new Error(`خطأ HTTP! الحالة: ${res.status}`);
        const data = await res.json();
        
        // 2. تحديث حالة الطقس الرئيسية
        appState.weather.temperature = data.current.temp_c;
        appState.weather.description = data.current.condition.text;
        appState.weather.uvIndex = data.current.uv;
        appState.weather.iconUrl = `https:${data.current.condition.icon}`;
        appState.weather.location = `${data.location.name}, ${data.location.country}`;
        appState.weather.humidity = data.current.humidity; // ✅ تحديث قيمة الرطوبة

        // 3. جلب أيقونة القمر من NASA SVS (لا تحتاج مصادقة معقدة)
        // ✅ استخدام الدالة الجديدة التي ترجع رابط صورة مباشر
        const moonUrl = await fetchNasaMoonImage(now);
        if (moonUrl) {
            appState.dynamicMoonImageUrl = moonUrl;
        } else {
             // في حالة فشل جلب القمر، نستخدم أيقونة القمر الثابتة
            appState.dynamicMoonImageUrl = 'https://cdn.weatherapi.com/weather/64x64/night/113.png'; 
        }

        // 4. تحديث الواجهات المرئية
        const hourlyData = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1]?.hour || []];
        const currentHourData = {
            time: "الآن",
            temp_c: data.current.temp_c,
            condition: { icon: data.current.condition.icon }
        };
        const upcomingHours = hourlyData.filter(h => new Date(h.time_epoch * 1000) > now).slice(0, 6);
        const forecastToRender = [currentHourData, ...upcomingHours];
        
        renderHourlyForecast(forecastToRender);
        renderAdvancedWeatherCards(data);
        update3dMoonWidget();
        updateUI(); // 🛑 استدعاء تحديث الواجهة المرئية
        
    } catch (err) {
        console.error('Error fetching weather data:', err);
    }
}

/**
 * Generates the current date/time string in NASA SVS format (YYYY-MM-DDT HH:MM).
 */
/**
 * Generates the current date/time string in NASA SVS format (YYYY-MM-DDT HH:MM).
 * NASA API uses the hour/minute of the current system time for the comparison.
 */
/**
 * REPLACED: Generates the date string for NASA SVS API based on the current hour.
 * Ensures that if it's past 18:00 UTC, it fetches the next day's data (if needed).
 * Since the API updates at 18:00, we fetch the CURRENT date until 18:00 local time.
 */
function getNasaDateTime(date) {
    const hours = date.getHours();
    let targetDate = new Date(date);

    // 🛑 المنطق الحاسم: إذا كنا قبل 18:00 (وقت تحديث NASA)، نستخدم بيانات اليوم السابق
    // إذا كنا بعد 18:00، نبدأ في استخدام بيانات اليوم الحالي
    if (hours < 18) {
        // إذا كان الوقت قبل 6 مساءً، نرجع إلى تاريخ الأمس للحصول على "آخر صورة مستقرة"
        targetDate.setDate(targetDate.getDate() - 1);
    } 
    // ملاحظة: بما أن التحديث يخص الصورة ليوم كامل، سنستخدم بيانات الأمس حتى وقت التحديث.
    // (يجب أن يتم تعديلها حسب توقيت UTC إذا كانت NASA تستخدم UTC)

    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0'); 
    const day = targetDate.getDate().toString().padStart(2, '0');
    
    // سنستخدم 18:00 كـ Time Marker لضمان الحصول على صورة اليوم كاملاً
    const markerHours = 18; 
    const markerMinutes = 0; 

    // YYYY-MM-DDT 18:00 format (لضمان جلب الصورة النهائية لهذا اليوم)
    return `${year}-${month}-${day}T${markerHours.toString().padStart(2, '0')}:${markerMinutes.toString().padStart(2, '0')}`;
}


/**
 * Fetches the dynamic moon data object from the NASA SVS Dial-A-Moon API.
 * * @param {Date} dateObj - The current Date object.
 * @returns {Promise<object|null>} The moon data JSON object, or null if failed.
 */
async function fetchNasaMoonData(dateObj) {
    const nasaDateString = getNasaDateTime(dateObj); 
    const API_URL = `https://svs.gsfc.nasa.gov/api/dialamoon/${nasaDateString}`;

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            console.error(`NASA Dial-A-Moon API failed: Status ${response.status}.`);
            return null;
        }

        const data = await response.json();
        
        // نرجع كائن البيانات كاملاً للاستفادة من 'phase' و 'image.url'
        if (data && data.image && data.image.url) {
            console.log("NASA SVS data fetched successfully.");
            return data; 
        }
        
        return null;
        
    } catch (error) {
        console.error("Network error during NASA API call:", error);
        return null;
    }
}

/**
 * Fetches the dynamic moon image URL using the NASA SVS Dial-A-Moon API.
 */
async function fetchNasaMoonImage(dateObj) {
    const nasaDateString = getNasaDateTime(dateObj); 
    const API_URL = `https://svs.gsfc.nasa.gov/api/dialamoon/${nasaDateString}`;
    const FALLBACK_ICON = 'https://cdn.weatherapi.com/weather/64x64/night/113.png'; 

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            console.error(`NASA Dial-A-Moon API failed: Status ${response.status}.`);
            return FALLBACK_ICON;
        }

        const data = await response.json();
        
        // استخراج رابط الصورة من المسار المحدد: data.image.url
        if (data && data.image && data.image.url) {
            console.log("NASA SVS image URL fetched successfully.");
            return data.image.url; 
        }
        
        return FALLBACK_ICON;
        
    } catch (error) {
        console.error("Network error during NASA API call:", error);
        return FALLBACK_ICON;
    }
}
        /// -------------------------------------------------------------
// --- MODIFIED fetchWeatherData function (Fetches Weather + Dynamic Moon) ---
// -------------------------------------------------------------
// -------------------------------------------------------------
// --- MODIFIED fetchWeatherData function (Fetches Weather + NASA Moon) ---
// -------------------------------------------------------------
// -------------------------------------------------------------
// --- MODIFIED fetchWeatherData function (Fetches Weather + NASA Moon) ---
// -------------------------------------------------------------
async function fetchWeatherData() {
    const now = new Date(); 
    
    if (WEATHER_API_KEY.startsWith('YOUR_')) return showMessageBox('خطأ: لم يتم تعيين مفتاح WeatherAPI.');
    
    // 1. جلب بيانات الطقس
    try {
        const locationQuery = appState.currentLocation ? `${appState.currentLocation.lat},${appState.currentLocation.lng}` : appState.weather.location.split(',')[0].trim();
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${locationQuery}&days=2&aqi=yes&alerts=no&lang=ar`);
        
        if (!res.ok) throw new Error(`خطأ HTTP! الحالة: ${res.status}`);
        const data = await res.json();
        
        // 2. تحديث حالة الطقس الرئيسية
        appState.weather.temperature = data.current.temp_c;
        appState.weather.description = data.current.condition.text;
        appState.weather.uvIndex = data.current.uv;
        appState.weather.iconUrl = `https:${data.current.condition.icon}`;
        appState.weather.location = `${data.location.name}, ${data.location.country}`;
        appState.weather.humidity = data.current.humidity; 

        // 3. جلب بيانات القمر (Moon Data)
        const moonResult = await fetchNasaMoonData(now); // ✅ نطلب كائن البيانات كاملاً

        // 4. تحديث حالة القمر في AppState
        if (moonResult) {
    appState.dynamicMoonImageUrl = moonResult.image.url;
    appState.moonData = moonResult; // ✅ تخزين كائن البيانات للحصول على حقل 'phase'
    appState.moonData.fetchDate = new Date();
        } else {
            appState.dynamicMoonImageUrl = 'https://cdn.weatherapi.com/weather/64x64/night/113.png'; 
            appState.moonData = null;
        }

        // 5. تحديث الواجهات المرئية
        const hourlyData = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1]?.hour || []];
        const currentHourData = {
            time: "الآن",
            temp_c: data.current.temp_c,
            condition: { icon: data.current.condition.icon }
        };
        const upcomingHours = hourlyData.filter(h => new Date(h.time_epoch * 1000) > now).slice(0, 6);
        const forecastToRender = [currentHourData, ...upcomingHours];
        
        renderHourlyForecast(forecastToRender);
        renderAdvancedWeatherCards(data);
        updateUI(); // 🛑 استدعاء تحديث الواجهة المرئية
        
    } catch (err) {
        console.error('Error fetching weather data:', err);
    }
}

        function renderHourlyForecast(forecastData) {
            const container = document.getElementById('hourly-forecast-container');
            if (!container) return;
            container.innerHTML = '';
            forecastData.forEach(hour => {
                  const timeLabel = hour.time === "الآن"
                    ? "الآن"
                    : new Date(hour.time_epoch * 1000).toLocaleTimeString('ar-SA', { hour: 'numeric', hour12: true });

                const card = document.createElement('div');
                card.className = 'flex flex-col items-center justify-center p-1 rounded-lg';
                card.innerHTML = `
                    <span class="text-base font-medium text-white/80">${timeLabel}</span>
                    <img src="https:${hour.condition.icon}" alt="weather" class="w-8 h-8 my-1">
                    <span class="text-xl font-bold">${Math.round(hour.temp_c)}°</span>
                `;
                container.appendChild(card);
            });
        }

        function renderAdvancedWeatherCards(data) {
            const container = document.getElementById('location-temps-container');
            if (!container) return;
            container.innerHTML = '';
             // Change layout to a flex column to stack the cards vertically
            container.className = 'flex flex-col gap-4 w-full flex-grow';

            // Create a container for the top two cards (Humidity and Best Time)
            const topCardsContainer = document.createElement('div');
            topCardsContainer.className = 'grid grid-cols-2 gap-4 w-full flex-grow';
            container.appendChild(topCardsContainer); // Append this container first

            // Card 1: Humidity
            const humidity = data.current.humidity;
            let humidityColor = 'text-green-400';
            let humidityDesc = 'منخفضة';
            if (humidity >= 60 && humidity < 75) {
                humidityColor = 'text-yellow-400';
                humidityDesc = 'معتدلة';
            } else if (humidity >= 75 && humidity < 85) {
                humidityColor = 'text-orange-400';
                humidityDesc = 'مرتفعة';
            } else if (humidity >= 85) {
                humidityColor = 'text-red-400';
                humidityDesc = 'مرتفعة جداً';
            }

            const humidityCard = document.createElement('div');
            humidityCard.className = 'glass-surface glass-surface--svg p-4 rounded-3xl flex flex-col items-center justify-center text-center navigable grid-item';
            humidityCard.tabIndex = 0;
            humidityCard.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <i data-lucide="droplets" class="w-8 h-8 ${humidityColor}"></i>
                    <h3 class="text-xl font-bold">مستوى الرطوبة</h3>
                </div>
                <div class="text-6xl font-extrabold ${humidityColor}">${humidity}%</div>
                <div class="text-lg text-white/80 mt-2">${humidityDesc}</div>
            `;
            topCardsContainer.appendChild(humidityCard);

            // Card 2: Best Time to Go Out (with 30-min intervals for next 6 hours)
            const hourlyData = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1]?.hour || []];
            const now = new Date();
            const sixHoursFromNowEpoch = (now.getTime() / 1000) + (6 * 3600);

            // Get the next 7 hours to have enough data for interpolation
            const upcomingRawHours = hourlyData.filter(h => new Date(h.time_epoch * 1000) > now).slice(0, 7);
            
            const interpolatedSlots = [];
            // Create slots for every 30 mins over the next 6 hours
            if (upcomingRawHours.length > 1) {
                for (let i = 0; i < upcomingRawHours.length - 1; i++) {
                    const currentHour = upcomingRawHours[i];
                    const nextHour = upcomingRawHours[i+1];

                    // Add the current full hour
                    interpolatedSlots.push(currentHour);

                    // Create the half-hour slot
                    const halfHourSlot = {
                        time_epoch: currentHour.time_epoch + 1800,
                        temp_c: (currentHour.temp_c + nextHour.temp_c) / 2,
                        uv: (currentHour.uv + nextHour.uv) / 2,
                        humidity: (currentHour.humidity + nextHour.humidity) / 2
                    };
                    interpolatedSlots.push(halfHourSlot);
                }
            } else if (upcomingRawHours.length === 1) {
                interpolatedSlots.push(upcomingRawHours[0]);
            }

            // Filter the final list to be strictly within the next 6 hours
            const next6HourSlots = interpolatedSlots.filter(slot => slot.time_epoch <= sixHoursFromNowEpoch);

            let bestHour = null;
            let bestScore = Infinity;

            if (next6HourSlots.length > 0) {
                next6HourSlots.forEach(hour => {
                    // تحديث منطق حساب النقاط: الأولوية للرطوبة الأقل، ثم الحرارة الأقل، ثم الأشعة فوق البنفسجية الأقل
                    const score = (hour.humidity * 1000) + (hour.temp_c * 100) + hour.uv;
                    if (score < bestScore) {
                        bestScore = score;
                        bestHour = hour;
                    }
                });
            } else {
                 // Fallback if no data is available
                 bestHour = { time_epoch: Date.now()/1000 + 3600, temp_c: data.current.temp_c, uv: data.current.uv, humidity: data.current.humidity };
            }


            const bestTime = new Date(bestHour.time_epoch * 1000).toLocaleTimeString('ar-OM', { hour: 'numeric', minute: '2-digit', hour12: true });

            const bestTimeCard = document.createElement('div');
            bestTimeCard.className = 'glass-surface glass-surface--svg p-4 rounded-3xl flex flex-col items-center justify-center text-center navigable grid-item';
            bestTimeCard.tabIndex = 0;
            bestTimeCard.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                     <i data-lucide="walk" class="w-8 h-8 text-green-300"></i>
                    <h3 class="text-xl font-bold">أفضل وقت للخروج</h3>
                </div>
                <div class="text-4xl font-extrabold text-green-300 mb-3">${bestTime}</div>
                <div class="grid grid-cols-3 gap-2 text-sm w-full">
                    <div class="bg-black/20 p-2 rounded-lg text-center">
                        <div class="font-bold text-lg ${getTempTextColor(bestHour.temp_c)}">${Math.round(bestHour.temp_c)}°C</div>
                        <div class="text-xs opacity-90">الحرارة</div>
                    </div>
                    <div class="bg-black/20 p-2 rounded-lg text-center">
                        <div class="font-bold text-lg ${getUvTextColor(bestHour.uv)}">${Math.round(bestHour.uv)}</div>
                        <div class="text-xs opacity-90">UV</div>
                    </div>
                    <div class="bg-black/20 p-2 rounded-lg text-center">
                        <div class="font-bold text-lg ${getHumidityTextColor(bestHour.humidity)}">${bestHour.humidity}%</div>
                        <div class="text-xs opacity-90">الرطوبة</div>
                    </div>
                </div>
            `;
            topCardsContainer.appendChild(bestTimeCard);
            
            // NOW, create and append the horizontal card LAST to the main container
            const currentConditions = data.current;
            const aqi = currentConditions.air_quality ? currentConditions.air_quality['us-epa-index'] : null;

            const nowCard = document.createElement('div');
            nowCard.className = 'glass-surface glass-surface--svg p-4 rounded-3xl w-full flex justify-around items-center text-center navigable grid-item';
            nowCard.tabIndex = 0;
            nowCard.innerHTML = `
                <div class="flex flex-col items-center gap-2">
                    <h4 class="text-sm font-bold text-white/70">مؤشر UV</h4>
                    <div class="text-2xl font-bold px-4 py-1 rounded-lg ${getUvColor(currentConditions.uv)}">
                        ${currentConditions.uv || '--'}
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <h4 class="text-sm font-bold text-white/70">الحرارة الآن</h4>
                    <div class="text-2xl font-bold px-4 py-1 rounded-lg ${getTempColor(currentConditions.temp_c)}">
                        ${Math.round(currentConditions.temp_c)}°C
                    </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <h4 class="text-sm font-bold text-white/70">جودة الهواء</h4>
                    <div class="text-2xl font-bold px-4 py-1 rounded-lg ${getAqiColor(aqi)}">
                        ${aqi || '--'}
                    </div>
                </div>
            `;
            container.appendChild(nowCard);

            lucide.createIcons();
        }

        function getUvIndexColor(uv) { if (uv <= 2) return '#4ade80'; if (uv <= 5) return '#facc15'; if (uv <= 7) return '#fb923c'; if (uv <= 10) return '#f87171'; return '#c084fc'; }

        // --- NEW COLORING FUNCTIONS ---
        const getTempColor = (temp) => {
            const tempValue = parseFloat(temp);
            if (tempValue < 25) return 'bg-blue-500 text-white';
            if (tempValue <= 30) return 'bg-green-500 text-white';
            if (tempValue <= 35) return 'bg-yellow-400 text-black';
            return 'bg-red-500 text-white';
        };

        const getHumidityColorBestTime = (humidity) => {
            const humidityValue = parseInt(humidity);
            if (humidityValue < 60) return 'bg-cyan-500/90 text-white';
            if (humidityValue < 75) return 'bg-yellow-400/90 text-black';
            return 'bg-orange-500/90 text-white';
        };

        const getAqiColor = (aqi) => {
            const aqiValue = parseInt(aqi);
            if (aqiValue <= 1) return 'bg-green-500 text-white'; // US EPA Index 1-50 is 1
            if (aqiValue <= 2) return 'bg-yellow-400 text-black'; // 51-100 is 2
            if (aqiValue <= 3) return 'bg-orange-500 text-white'; // 101-150 is 3
            if (aqiValue <= 4) return 'bg-red-500 text-white'; // 151-200 is 4
            if (aqiValue <= 5) return 'bg-purple-500 text-white'; // 201-300 is 5
            return 'bg-red-800 text-white'; // > 300
        };

        const getUvColor = (uv) => {
            const uvValue = Math.round(uv);
            if (uvValue <= 2) return 'bg-green-500 text-white';
            if (uvValue <= 5) return 'bg-yellow-400 text-black';
            if (uvValue <= 7) return 'bg-orange-500 text-white';
            if (uvValue <= 10) return 'bg-red-500 text-white';
            return 'bg-purple-500 text-white';
        };

        // --- NEW TEXT COLORING FUNCTIONS ---
        const getTempTextColor = (temp) => {
            const tempValue = parseFloat(temp);
            if (tempValue < 25) return 'text-blue-400';
            if (tempValue <= 30) return 'text-green-400';
            if (tempValue <= 35) return 'text-yellow-400';
            return 'text-red-400';
        };

        const getHumidityTextColor = (humidity) => {
            const humidityValue = parseInt(humidity);
            if (humidityValue < 60) return 'text-cyan-400';
            if (humidityValue < 75) return 'text-yellow-400';
            return 'text-orange-400';
        };
        
        const getUvTextColor = (uv) => {
            const uvValue = Math.round(uv);
            if (uvValue <= 2) return 'text-green-400';
            if (uvValue <= 5) return 'text-yellow-400';
            if (uvValue <= 7) return 'text-orange-400';
            if (uvValue <= 10) return 'text-red-400';
            return 'text-purple-400';
        };


        // --- Simulated Car Data ---
        function simulateOtherCarData() { 
            
            appState.car.temp = (Math.random() * 30 + 70).toFixed(1); 
            update3dScreenWidgets(); 
        }
   
const prayerTimes = [
    {"date":"2026-02-01","day":"الأحد","fajr":"05:41","sunrise":"06:55","dhuhr":"12:42","asr":"15:59","maghrib":"18:24","isha":"19:34"},
    {"date":"2026-02-02","day":"الاثنين","fajr":"05:41","sunrise":"06:55","dhuhr":"12:42","asr":"15:59","maghrib":"18:25","isha":"19:34"},
    {"date":"2026-02-03","day":"الثلاثاء","fajr":"05:40","sunrise":"06:55","dhuhr":"12:42","asr":"15:59","maghrib":"18:25","isha":"19:34"},
    {"date":"2026-02-04","day":"الأربعاء","fajr":"05:40","sunrise":"06:54","dhuhr":"12:43","asr":"16:00","maghrib":"18:26","isha":"19:35"},
    {"date":"2026-02-05","day":"الخميس","fajr":"05:40","sunrise":"06:54","dhuhr":"12:43","asr":"16:00","maghrib":"18:26","isha":"19:35"},
    {"date":"2026-02-06","day":"الجمعة","fajr":"05:40","sunrise":"06:54","dhuhr":"12:43","asr":"16:00","maghrib":"18:27","isha":"19:36"},
    {"date":"2026-02-07","day":"السبت","fajr":"05:40","sunrise":"06:53","dhuhr":"12:43","asr":"16:01","maghrib":"18:27","isha":"19:36"},
    {"date":"2026-02-08","day":"الأحد","fajr":"05:39","sunrise":"06:53","dhuhr":"12:43","asr":"16:01","maghrib":"18:28","isha":"19:36"},
    {"date":"2026-02-09","day":"الاثنين","fajr":"05:39","sunrise":"06:53","dhuhr":"12:43","asr":"16:01","maghrib":"18:28","isha":"19:37"},
    {"date":"2026-02-10","day":"الثلاثاء","fajr":"05:39","sunrise":"06:52","dhuhr":"12:43","asr":"16:01","maghrib":"18:28","isha":"19:37"},
    {"date":"2026-02-11","day":"الأربعاء","fajr":"05:38","sunrise":"06:52","dhuhr":"12:43","asr":"16:01","maghrib":"18:29","isha":"19:37"},
    {"date":"2026-02-12","day":"الخميس","fajr":"05:38","sunrise":"06:51","dhuhr":"12:43","asr":"16:02","maghrib":"18:29","isha":"19:38"},
    {"date":"2026-02-13","day":"الجمعة","fajr":"05:38","sunrise":"06:51","dhuhr":"12:43","asr":"16:02","maghrib":"18:30","isha":"19:38"},
    {"date":"2026-02-14","day":"السبت","fajr":"05:37","sunrise":"06:51","dhuhr":"12:43","asr":"16:02","maghrib":"18:30","isha":"19:38"},
    {"date":"2026-02-15","day":"الأحد","fajr":"05:37","sunrise":"06:50","dhuhr":"12:43","asr":"16:02","maghrib":"18:30","isha":"19:39"},
    {"date":"2026-02-16","day":"الاثنين","fajr":"05:37","sunrise":"06:50","dhuhr":"12:43","asr":"16:02","maghrib":"18:31","isha":"19:39"},
    {"date":"2026-02-17","day":"الثلاثاء","fajr":"05:36","sunrise":"06:49","dhuhr":"12:43","asr":"16:02","maghrib":"18:31","isha":"19:39"},
    {"date":"2026-02-18","day":"الأربعاء","fajr":"05:36","sunrise":"06:49","dhuhr":"12:43","asr":"16:03","maghrib":"18:32","isha":"19:40"},
    {"date":"2026-02-19","day":"الخميس","fajr":"05:35","sunrise":"06:48","dhuhr":"12:43","asr":"16:03","maghrib":"18:32","isha":"19:40"},
    {"date":"2026-02-20","day":"الجمعة","fajr":"05:35","sunrise":"06:48","dhuhr":"12:42","asr":"16:03","maghrib":"18:32","isha":"19:40"},
    {"date":"2026-02-21","day":"السبت","fajr":"05:34","sunrise":"06:47","dhuhr":"12:42","asr":"16:03","maghrib":"18:33","isha":"19:40"},
    {"date":"2026-02-22","day":"الأحد","fajr":"05:34","sunrise":"06:46","dhuhr":"12:42","asr":"16:03","maghrib":"18:33","isha":"19:41"},
    {"date":"2026-02-23","day":"الاثنين","fajr":"05:33","sunrise":"06:46","dhuhr":"12:42","asr":"16:03","maghrib":"18:33","isha":"19:41"},
    {"date":"2026-02-24","day":"الثلاثاء","fajr":"05:33","sunrise":"06:45","dhuhr":"12:42","asr":"16:03","maghrib":"18:34","isha":"19:41"},
    {"date":"2026-02-25","day":"الأربعاء","fajr":"05:32","sunrise":"06:45","dhuhr":"12:42","asr":"16:03","maghrib":"18:34","isha":"19:41"},
    {"date":"2026-02-26","day":"الخميس","fajr":"05:32","sunrise":"06:44","dhuhr":"12:42","asr":"16:03","maghrib":"18:34","isha":"19:42"},
    {"date":"2026-02-27","day":"الجمعة","fajr":"05:31","sunrise":"06:43","dhuhr":"12:41","asr":"16:03","maghrib":"18:35","isha":"19:42"}
];
function convertTo12Hour(time24h) {
    if (!time24h || typeof time24h !== 'string' || time24h === '--:--') {
        return time24h; // Return as is if invalid or not loaded
    }

    // Split the time string into hours and minutes
    const [hours24, minutes] = time24h.split(':').map(str => parseInt(str, 10));

    // Convert hours from 24h to 12h format
    let hours12 = hours24 % 12;

    // The hour '0' (midnight) should be '12' in 12-hour format
    hours12 = hours12 ? hours12 : 12;

    // Return the formatted string (we don't pad the hour, but keep minutes padded)
    return `${hours12}:${minutes.toString().padStart(2, '0')}`;
}


        function loadPrayerTimes() {
            const today = new Date().toISOString().split('T')[0];
            const data = prayerTimes.find(p => p.date === today);
            if (data) {
                appState.prayerTimes = { ...appState.prayerTimes, Fajr: data.fajr, Dhuhr: data.dhuhr, Asr: data.asr, Maghrib: data.maghrib, Isha: data.isha };
                prayerTimesContainer.innerHTML = '';
               const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                const prayerNames = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
                const iqamaOffsets = { Fajr: 25, Dhuhr: 20, Asr: 20, Maghrib: 5, Isha: 20 };
                
                prayerOrder.forEach(key => {
                    const item = document.createElement('div');
                    item.className = 'prayer-time-item navigable grid-item';
                    item.tabIndex = 0;
                    
                    // 1. Get the 24-hour time
                    const time24h = data[key.toLowerCase()]; 
                    
                    // 2. Convert to 12-hour time (e.g., 3:30 م)
                    const time12hDisplay = convertTo12HourWithAmPm(time24h); // ✅ استخدام الدالة الجديدة
                    
                    // 3. Calculate Iqama time (24h format string)
                    const iqamaTime24h = addMinutes(time24h, iqamaOffsets[key]); 
                    
                    // 4. Convert Iqama time for display (e.g., 3:50 م)
                    const iqamaTime12hDisplay = convertTo12HourWithAmPm(iqamaTime24h); // ✅ استخدام الدالة الجديدة
                    
                    // 5. Update the inner HTML using the 12h format
                    item.innerHTML = `<span class="prayer-name">${prayerNames[key]}</span><span class="prayer-time">${time12hDisplay}</span><span class="prayer-iqama text-xs text-white/50">الإقامة: ${iqamaTime12hDisplay}</span>`;
                    
                    prayerTimesContainer.appendChild(item);
                });

                // Create a container for the action buttons
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex gap-2 mt-2 homebtn';

                // Ruqyah Button
                const ruqyahButton = document.createElement('button');
                ruqyahButton.id = 'ruqyah-tv-button';
                ruqyahButton.className = 'navigable grid-item w-1/2 bg-teal-500/50 hover:bg-teal-400/50 text-white font-bold p-2 rounded-lg shadow-lg text-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2';
                ruqyahButton.innerHTML = `<i data-lucide="shield-check" class="w-6 h-6"></i><span>الرقية الشرعية</span>`;
                ruqyahButton.tabIndex = 0;
                ruqyahButton.addEventListener('click', () => {
                setTimeout(() => searchYouTubeVideos('الرقية الشرعية النفيس'), 100);
                switchApp('Media');
                });
                
                // Adhkar Button
                const adhkarButton = document.createElement('button');
                adhkarButton.id = 'adhkar-tv-button';
                adhkarButton.className = 'navigable grid-item w-1/2 bg-sky-500/50 hover:bg-sky-400/50 text-white font-bold p-2 rounded-lg shadow-lg text-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2';
                adhkarButton.innerHTML = `<i data-lucide="sunrise" class="w-6 h-6"></i><span>الأذكار</span>`;
                adhkarButton.tabIndex = 0;
                adhkarButton.addEventListener('click', () => {
                    setTimeout(() => searchYouTubeVideos('أذكار الصباح والمساء'), 100);
                     switchApp('Media');
                });
                
                // Add buttons to their container, then add the container to the main prayer times area
                buttonContainer.appendChild(ruqyahButton);
                buttonContainer.appendChild(adhkarButton);
                prayerTimesContainer.appendChild(buttonContainer);

                lucide.createIcons();
                determineNextPrayer();
                updateDigitalClock();
            } else {
                prayerTimesContainer.innerHTML = `<p class="text-white/70 col-span-full">لا توجد أوقات صلاة لهذا اليوم.</p>`;
            }
        }
        function addMinutes(time, min) { const [h, m] = time.split(':').map(Number); const d = new Date(); d.setHours(h, m + min, 0, 0); return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
// -------------------------------------------------------------
// --- CORRECTED timeToDate function (Crucial for 24H -> Date conversion) ---
// -------------------------------------------------------------
// -------------------------------------------------------------
// --- CORRECTED timeToDate function (Uses CURRENT System Date) ---
// -------------------------------------------------------------
function timeToDate(time) {
    // 1. استخراج الساعات والدقائق (24-hour format)
    const [h, m] = time.split(':').map(Number);
    
    // 2. إنشاء كائن Date جديد من الوقت والتاريخ الحاليين للنظام
    const d = new Date();
    
    // 3. تعيين الساعات والدقائق
    // هذا يضمن أن التاريخ هو التاريخ الفعلي للنظام، لكن التوقيت هو توقيت الصلاة (مثل 15:30)
    d.setHours(h, m, 0, 0); 
    
    return d;
}

// -------------------------------------------------------------
// --- MODIFIED determineNextPrayer function (FINAL Time Context FIX) ---
// -------------------------------------------------------------
function determineNextPrayer() {
    const now = new Date();
    const todayTimings = appState.prayerTimes;
    if (!todayTimings.Fajr || todayTimings.Fajr === '--:--') return;

    // 1. Define constants
    const PRAYER_OFFSETS = { Fajr: 25, Dhuhr: 20, Asr: 20, Maghrib: 5, Isha: 15 };
    const PRAYER_GRACE = { Fajr: 5, Dhuhr: 15, Asr: 20, Maghrib: 20, Isha: 15 };
    const PRAYER_NAMES = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
    const ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const FIVE_MINUTES = 5 * 60 * 1000;

    let prayerEvents = [];
    
    // 2. Populate Events for TODAY
    ORDER.forEach(key => {
        const pTime = timeToDate(todayTimings[key]);
        const iqamaTime = new Date(pTime.getTime() + PRAYER_OFFSETS[key] * 60000);
        const graceEnd = new Date(iqamaTime.getTime() + PRAYER_GRACE[key] * 60000);

        prayerEvents.push({ 
            name: PRAYER_NAMES[key], 
            azan: pTime, 
            iqama: iqamaTime, 
            graceEnd: graceEnd 
        });
    });

    // 3. Prepare Tomorrow's Fajr (and Iqama)
    const fajrTomorrow = timeToDate(todayTimings.Fajr);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    
    prayerEvents.push({
        name: 'الفجر (غدًا)', azan: fajrTomorrow,
        iqama: new Date(fajrTomorrow.getTime() + PRAYER_OFFSETS.Fajr * 60000),
        graceEnd: new Date(fajrTomorrow.getTime() + PRAYER_OFFSETS.Fajr * 60000 + PRAYER_GRACE.Fajr * 60000)
    });


    // 4. Find CURRENT and NEXT States
    appState.prayerTimes.currentPrayer = null;
    appState.prayerTimes.currentPrayerIqamaTime = null;
    let nextEvent = null;
    let currentEvent = null;
    
    for (let i = prayerEvents.length - 1; i >= 0; i--) {
        const event = prayerEvents[i];
        if (now >= event.azan && now < event.graceEnd) {
              currentEvent = event;
              break;
        }
    }
    nextEvent = prayerEvents.find(event => event.azan > now);

    
    // 5. Set Final Application State
    if (currentEvent) {
        appState.prayerTimes.currentPrayer = currentEvent.name.replace(' (غدًا)', '');
        appState.prayerTimes.currentPrayerIqamaTime = currentEvent.iqama;

        if (now < currentEvent.iqama) {
            appState.prayerTimes.nextPrayer = appState.prayerTimes.currentPrayer;
            appState.prayerTimes.nextPrayerIqamaTime = currentEvent.iqama;
        } else if (nextEvent) {
            appState.prayerTimes.nextPrayer = nextEvent.name;
            appState.prayerTimes.nextPrayerIqamaTime = nextEvent.azan;
        }
    } else if (nextEvent) {
        appState.prayerTimes.nextPrayer = nextEvent.name;
        appState.prayerTimes.nextPrayerIqamaTime = nextEvent.azan;
    } else {
        appState.prayerTimes.nextPrayer = "الفجر (غدًا)";
        appState.prayerTimes.nextPrayerIqamaTime = fajrTomorrow;
    }

    // 🚀 CRITICAL FIX: تنبيه صوتي قبل 5 دقائق من وقت الإقامة
    if (nextEvent && nextEvent.iqama) {
        const diffToIqama = nextEvent.iqama.getTime() - now.getTime();
        
        // 🛑 إذا كان الوقت بين 0 و 5 دقائق (300,000 مللي ثانية)
        if (diffToIqama > 0 && diffToIqama <= FIVE_MINUTES) {
            const nextPrayerName = nextEvent.name.replace(' (غدًا)', '');
            const alertKey = `iqama_alert_${nextPrayerName}_${nextEvent.iqama.getHours()}`;
            
            // نستخدم localStorage لتتبع التنبيه وإطلاقه مرة واحدة فقط
            if (localStorage.getItem(alertKey) !== 'sent') {
                playSpeechAnnouncement(`تنبيه: تبقى أقل من خمس دقائق على إقامة صلاة ${nextPrayerName}.`);
                localStorage.setItem(alertKey, 'sent');
            }
        }
    }
    
    // 6. Render Updates
    renderPrayerTimesHighlights();
}

       function renderPrayerTimesHighlights() { if (!prayerTimesContainer) return; document.querySelectorAll('.prayer-time-item').forEach(i => i.classList.remove('current-prayer', 'next-prayer')); if (appState.prayerTimes.currentPrayer) { const item = Array.from(prayerTimesContainer.querySelectorAll('.prayer-name')).find(s => s.textContent === appState.prayerTimes.currentPrayer)?.parentElement; if (item) item.classList.add('current-prayer'); } if (appState.prayerTimes.nextPrayer && appState.prayerTimes.nextPrayer !== appState.prayerTimes.currentPrayer) { const nextPrayerName = appState.prayerTimes.nextPrayer.replace(' (غدًا)', ''); const item = Array.from(prayerTimesContainer.querySelectorAll('.prayer-name')).find(s => s.textContent === nextPrayerName)?.parentElement; if (item && !item.classList.contains('current-prayer')) item.classList.add('next-prayer'); } }
        
        // --- Digital Clock ---
        // --- Digital Clock ---
/**
 * Generates the current date string in YYYY-MM-DD format (e.g., 2025-11-03).
 * This is crucial for dynamic APIs that require date input.
 * @param {Date} date - The current Date object.
 * @returns {string} The formatted date string.
 */
function getTodayDateString(date) {
    const year = date.getFullYear();
    // getMonth() is 0-indexed, so we add 1.
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateDigitalClock() {
    // 1. Get current system time (Crucial for icon logic)
    const now = new Date();
    const h24 = now.getHours(); // 24-hour format (0-23)
    let h12 = h24;
    const m = now.getMinutes();
    const s = now.getSeconds();
    
    // Convert to 12-hour format for display
    h12 = h12 % 12;
    h12 = h12 ? h12 : 12;

    // 2. Update the Digital Display
    digitalHoursSpan.textContent = h12; 
    digitalMinutesSpan.textContent = m.toString().padStart(2, '0');
    
    if (digitalSecondsSpan) {
        digitalSecondsSpan.textContent = s.toString().padStart(2, '0');
    }
    
    // --- 3. Update the TIME ICON Container (#time-icon-container) ---
    // هذا الجزء يعرض أيقونات الشمس/الغيوم/القمر حسب التوقيت (كما طلبت في السابق)
    const iconContainer = document.getElementById('time-icon-container');
    if (iconContainer) {
        let iconSrc = '';
        
        // المنطق الزمني بناءً على الساعة 24 (h24)
        if ((h24 > 8 || (h24 === 8 && m >= 30)) && (h24 < 17)) { 
            iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/113.png'; // Sun Icon
        } else if ((h24 >= 18 && h24 < 19)) { 
            iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/1087.png'; // Sunset Icon
        } else if (h24 >= 19 || h24 < 6 || (h24 === 6 && m === 0)) {
            // Night Time: Use a fixed moon icon (NOT the dynamic one, for simplicity)
            iconSrc = 'https://cdn.weatherapi.com/weather/64x64/night/113.png'; 
        } else if (h24 === 6 && m > 0 && m <= 30) { 
            iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/1087.png'; // Sunrise Icon
        } else if ((h24 === 6 && m > 30) || (h24 === 7) || (h24 === 8 && m <= 30) || (h24 >= 17 && h24 < 18)) { 
            iconSrc = 'https://cdn.weatherapi.com/weather/64x64/day/116.png'; // Cloudy/Sun Icon
        }
        
        if (iconSrc) {
            iconContainer.innerHTML = `<img src="${iconSrc}" alt="Time Icon" class="w-8 h-8 inline-block ml-2" style="transform: translateY(4px);">`;
        } else {
            iconContainer.innerHTML = '';
        }
    }
    
    // 4. Trigger Next Prayer Logic Updates
    determineNextPrayer(now); 
}

        // --- 360 Camera ---
        function handleImageUpload(e) { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { appState.custom360Image = ev.target.result; localStorage.setItem('custom360Image', ev.target.result); updateUI(); }; reader.readAsDataURL(file); } }
        function resetImageToDefault() { appState.custom360Image = null; localStorage.removeItem('custom360Image'); updateUI(); }

        // --- NEW: 3D Screen Widgets Update ---
        /**
 * UPDATED & FINAL: Updates the informational widgets on the 3D Map/Screen-Map.
 * Ensures the Car data, Weather Temp, Moon widget, and Direction Buttons are synchronized.
 * CRITICAL FIX: Applies the current car direction (N, NE, etc.) as the heading
 * to the Google Map object in the Dashboard for an oriented view.
 */
function update3dScreenWidgets() {
    // مراجع عناصر ويدجت الشاشة 3D
    const weatherTempEl = document.getElementById('3d-screen-weather-temp');
    const nextPrayerEl = document.getElementById('3d-screen-next-prayer');
    const speedEl = document.getElementById('3d-screen-speed');
    const gearEl = document.getElementById('3d-screen-gear');
    const dirEl = document.getElementById('3d-screen-dir');

    // 1. تحديث معلومات القيادة والطقس (الجانب الأيسر والأيمن)
    
    // تحديث درجة الحرارة
    if (weatherTempEl) {
        const temp = appState.weather.temperature !== null ? Math.round(appState.weather.temperature) : '--';
        weatherTempEl.textContent = `${temp}°C`;
    }
    
    // تحديث معلومات القيادة
    const currentCarDirection = appState.car.direction; // N, NE, E, etc.
    
    if (nextPrayerEl) nextPrayerEl.textContent = appState.prayerTimes.nextPrayer || '--';
    if (speedEl) speedEl.textContent = `${appState.car.speed} km/h`;
    if (gearEl) gearEl.textContent = appState.car.gear;
    if (dirEl) dirEl.textContent = currentCarDirection; // لعرض الاتجاه الحرفي

    // --- 2. 🧭 تطبيق Heading على خريطة Dashboard ---
    if (dashboardGoogleMap) {
        // تحويل الاتجاه الحرفي (N, SW) إلى درجة رقمية (0-360)
        const numericHeading = directionToDegrees(currentCarDirection); 
        
        // 🛑 الخطوة الحاسمة: تطبيق Heading على الخريطة
        dashboardGoogleMap.setHeading(numericHeading); 
        
        // 💡 للحصول على تأثير أفضل، يجب أن تركز الخريطة على الموقع الحالي أيضاً
        if (appState.currentLocation) {
            dashboardGoogleMap.setCenter(appState.currentLocation);
        }
    }

    // --- 3. تحديث ويدجت البوصلة و القمر ---
    // تحديث أزرار البوصلة (Direction Buttons) لإضاءة الزر المناظر
    updateDirectionButtons(); 
    
    // تحديث ويدجت القمر (يظهر فقط ليلاً)
    update3dMoonWidget(); 
}
        /**
 * NEW: Updates the Moon Widget in the 3D screen using data from fetchWeatherData.
 */
/**
 * UPDATED: Updates the Moon Widget in the 3D screen (screen-Map).
 * It shows dynamic NASA Moon data ONLY during local nighttime (18:00 to 06:00).
 * Otherwise, it shows an inactive state.
 */
function update3dMoonWidget() {
    // 🛑 مراجع العناصر في شاشة screen-Map (الجانب الأيمن)
    const moonIcon = document.getElementById('3d-moon-icon');
    const moonPhase = document.getElementById('3d-moon-phase');
    const moonWidgetContainer = document.getElementById('3d-screen-moon-widget'); 

    if (!moonIcon || !moonPhase || !moonWidgetContainer) {
        // إذا لم يتم العثور على العناصر (قد تكون في شاشة أخرى)، لا تفعل شيئاً
        return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    
    // تحديد إذا كنا في فترة ليل (6 مساءً حتى 6 صباحاً)
    const isNightTime = (currentHour >= 9 || currentHour < 6);

    if (isNightTime && appState.moonData && appState.moonData.phase !== undefined) {
        // 1. الوضع الليلي (عرض البيانات الديناميكية)
        
        // يجب التأكد من أن مرحلة القمر (phase) تم تخزينها كـ رقم في fetchNasaMoonData
        const phaseValue = appState.moonData.phase ? appState.moonData.phase.toFixed(1) : '--';
        
        // الصورة يتم جلبها مسبقاً وتخزينها كـ appState.dynamicMoonImageUrl
        moonIcon.src = appState.dynamicMoonImageUrl || 'https://cdn.weatherapi.com/weather/64x64/night/113.png';
        moonPhase.textContent = `${phaseValue}%`; 
        
        // إظهار الويدجت بحالة نشطة
        moonWidgetContainer.style.opacity = '1';
        moonWidgetContainer.style.display = 'flex'; 

    } else {
        // 2. الوضع النهاري (عرض حالة الخمول/عدم النشاط)
        
        // عرض أيقونة قمر ثابتة (للتصنيف) مع بيانات فارغة
        moonIcon.src = 'https://cdn.weatherapi.com/weather/64x64/night/113.png'; 
        moonPhase.textContent = '--%';
        
        // 💡 إظهار الويدجت بشفافية منخفضة ليدل على أنه غير نشط الآن (ولكنه موجود في الـ Layout)
        moonWidgetContainer.style.opacity = '0.3'; 
        moonWidgetContainer.style.display = 'flex'; 
    }
}

        // --- Draggable/Resizable Popup Logic ---
        let isDragging = false;
        let offsetX, offsetY;
        videoPopupContainer.addEventListener('mousedown', (e) => {
            if (e.target === videoPopupContainer || e.target.closest('.video-popup-controls')) {
                isDragging = true;
                offsetX = e.clientX - videoPopupContainer.offsetLeft;
                offsetY = e.clientY - videoPopupContainer.offsetTop;
                videoPopupContainer.style.cursor = 'grabbing';
                videoPopupPlayerContainer.style.pointerEvents = 'none';
            }
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                videoPopupContainer.style.left = `${e.clientX - offsetX}px`;
                videoPopupContainer.style.top = `${e.clientY - offsetY}px`;
                videoPopupContainer.style.bottom = 'auto';
                videoPopupContainer.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            videoPopupContainer.style.cursor = 'grab';
            videoPopupPlayerContainer.style.pointerEvents = 'auto';
        });

        // --- Swipe Gesture Handling (NEW) ---
    

        // --- TV Remote / Keyboard Navigation ---
        let currentFocus = null;
        let navigableElements = []; // Global array for focusable items

        function updateNavigableElements() {
            // This function rebuilds the list of all currently visible, focusable elements.
            // It's called after the UI changes, like loading new search results or switching tabs.
            navigableElements = Array.from(
                document.querySelectorAll('.app-screen.active .navigable, nav .navigable, .video-popup-controls.grid-container .navigable, #bottom-left-controls .navigable, #floating-minimized-video-button.navigable')
            ).filter(el => el.offsetParent !== null && !el.closest('.hidden'));
        }

        function setFocus(el) { if (currentFocus) currentFocus.classList.remove('tv-focus'); if (el) { el.classList.add('tv-focus'); el.focus({ preventScroll: true }); currentFocus = el; el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } else { if (currentFocus) currentFocus.classList.remove('tv-focus'); currentFocus = null; } }
        
        // --- MASTER KEY HANDLER (REFACTORED) ---
        function handleRemoteControlInput(e) {
    const key = e.key.toLowerCase();
    const activeEl = document.activeElement;

    // --- الأولولية 1: إذا كان مشغل الفيديو نشطاً ---
    if (videoPopupContainer.classList.contains('active') || appState.isVideoPlayerMinimized) {
        const customHandledKeys = [
            'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
            'enter', 'ok', 'p',
            'b', 'stop', 'red', 'colorf0red', 'x',
            'yellow', 'colorf2yellow', '8',
            '9' 
        ];

        if (customHandledKeys.includes(key)) {
            e.preventDefault();

            if (key === 'yellow' || key === 'colorf2yellow' || key === '8') {
                if (appState.isVideoPlayerMinimized) restoreVideoPopup();
                else minimizeVideoPopup();
                return;
            }
            if (key === 'b' || key === 'stop' || key === 'red' || key === 'colorf0red' || key === 'x') {
                hideVideoPopup();
                return;
            }
            if (key === 'enter' || key === 'ok' || key === 'p') {
                const playerState = popupPlayer.getPlayerState();
                if (playerState === YT.PlayerState.PLAYING) popupPlayer.pauseVideo();
                else popupPlayer.playVideo();
                return;
            }
            if (key === '9') {
                toggleFullScreen();
                return;
            }
        }
        return;
    }

    // --- الأولولية 2: وضع الكتابة في حقل البحث ---
    const isTyping = !youtubeSearchInput.readOnly && activeEl === youtubeSearchInput;
    if (isTyping) {
        if (key === 'enter' || key === 'ok') {
            e.preventDefault();
            youtubeSearchButton.click();
        } else if (key.length === 1 || key === 'backspace') {
            // السماح بالكتابة العادية
        } else {
            handleNavigationLogic(e); // استخدام منطق التنقل للأزرار الأخرى
        }
        return;
    }

    // --- الأولولية 3: نظام التنقل الذكي (المحرك الجديد) ---
    handleNavigationLogic(e);
}

// دالة المحرك التي تختار طريقة التنقل بناءً على نوع الحاوية
function handleNavigationLogic(e) {
    const key = e.key.toLowerCase();
    const activeEl = document.activeElement;
    if (!activeEl) return;

    // فحص: هل العنصر داخل قائمة منزلقة أفقية؟
    const isHorizontalList = activeEl.closest('.favorites-dashboard-horizontal-scroll') || 
                             activeEl.closest('.scroll-viewport') ||
                             activeEl.closest('#favorites-popup-grid');

    if (isHorizontalList) {
        handleHorizontalMapping(key, activeEl);
    } else {
        handleGridMapping(key, activeEl);
    }
}

// التنقل في القوائم الأفقية (Dashboard & Suggestions)
function handleHorizontalMapping(key, el) {
    const parent = el.parentElement;
    const items = Array.from(parent.querySelectorAll('.grid-item'));
    const idx = items.indexOf(el);

    switch(key) {
        case 'arrowright': // في RTL السهم الأيمن يعود للخلف
            if (idx > 0) setFocus(items[idx - 1]);
            else setFocus(document.querySelector('nav .app-icon.active')); // الرجوع للسايدبار
            break;
        case 'arrowleft': // السهم الأيسر يتقدم للأمام
            if (idx < items.length - 1) setFocus(items[idx + 1]);
            break;
        case 'arrowup': // الخروج للأعلى
            setFocus(document.getElementById('youtube-search-input'));
            break;
    }
}

// التنقل في الجداول (Channels & Reciters Grid)
function handleGridMapping(key, el) {
    const container = el.closest('.grid-container') || el.closest('.reader-container') || el.closest('nav');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.grid-item')).filter(i => i.offsetParent !== null);
    const idx = items.indexOf(el);
    
    // حساب عدد الأعمدة بناءً على موضع العناصر في الصفحة
    const firstItemTop = items[0].getBoundingClientRect().top;
    const cols = items.filter(item => Math.abs(item.getBoundingClientRect().top - firstItemTop) < 10).length || 1;

    switch(key) {
        case 'arrowright': 
            if (idx % cols !== 0) setFocus(items[idx - 1]); 
            break;
        case 'arrowleft': 
            if ((idx + 1) % cols === 0 || idx === items.length - 1) {
                setFocus(document.querySelector('nav .app-icon.active')); // الذهاب للسايدبار عند نهاية الصف
            } else {
                setFocus(items[idx + 1]);
            }
            break;
        case 'arrowup': 
            if (idx >= cols) setFocus(items[idx - cols]); 
            break;
        case 'arrowdown': 
            if (idx + cols < items.length) setFocus(items[idx + cols]); 
            break;
        case 'enter': case 'ok': 
            el.click(); 
            break;
    }
}

       function handleNavSidebarNavigation(e, activeEl) {
    const icons = Array.from(document.querySelectorAll('nav .app-icon'));
    const idx = icons.indexOf(activeEl);
    let nextIdx = -1;
    
    const key = e.key.toLowerCase();

    switch (key) {
        case 'arrowup':
            nextIdx = idx > 0 ? idx - 1 : icons.length - 1;
            break;
        case 'arrowdown':
            nextIdx = idx < icons.length - 1 ? idx + 1 : 0;
            break;
        case 'arrowright': // 🚀 الحل هنا: الانتقال للمحتوى
            const activeScreen = document.querySelector('.app-screen.active');
            // البحث عن أول كارت أو زر داخل الشاشة
            const firstContentItem = activeScreen.querySelector('.navigable, .grid-item');
            if (firstContentItem) {
                setFocus(firstContentItem);
                return; // الخروج لمنع تغيير أيقونة التاب
            }
            break;
        case 'enter': case 'ok':
            activeEl.click();
            return;
    }
    if (nextIdx !== -1) setFocus(icons[nextIdx]);
}
        
        function handleMediaScreenNavigation(e, activeEl) {
            const searchRow = document.querySelector('#screen-Media .flex.flex-row.items-center.gap-2.grid-container');
            const readersContainer = document.querySelector('.reader-container');
            const surahContainer = document.querySelector('#youtube-surah-section');
            const videoListContainer = document.querySelector('#video-list-container');
            const searchResultsContainer = document.querySelector('#search-results-container');
            const inSearchRow = activeEl.closest('.flex.flex-row.items-center.gap-2.grid-container');
            const inReaders = activeEl.closest('.reader-container');

            if (e.key.toLowerCase() === 'arrowdown') {
                if (inSearchRow) {
                    const nextVisibleContainer = [readersContainer, surahContainer, videoListContainer, searchResultsContainer].find(c => c && c.offsetParent !== null);
                    if (nextVisibleContainer) {
                        const firstItem = nextVisibleContainer.querySelector('.grid-item');
                        if (firstItem) { setFocus(firstItem); return; }
                    }
                }
                if (inReaders) {
                    if (surahContainer && surahContainer.offsetParent !== null) {
                        const firstItem = surahContainer.querySelector('.grid-item');
                        if (firstItem) { setFocus(firstItem); return; }
                    }
                }
            }

            if (e.key.toLowerCase() === 'arrowup') {
                const currentContainer = activeEl.closest('.grid-container, .reader-container');
                if (currentContainer && currentContainer !== searchRow) {
                    const items = Array.from(currentContainer.querySelectorAll('.grid-item:not([style*="display: none"])')).filter(el => el.offsetParent !== null);
                    const idx = items.indexOf(activeEl);
                    if (idx !== -1) {
                        const firstItemTop = items[0].getBoundingClientRect().top;
                        let cols = items.filter(item => Math.abs(item.getBoundingClientRect().top - firstItemTop) < 20).length;
                        if (cols === 0) cols = 1;
                        if (idx < cols) { setFocus(youtubeSearchInput); return; }
                    }
                }
            }
            if (inReaders) {
                const items = Array.from(readersContainer.querySelectorAll('.grid-item'));
                const idx = items.indexOf(activeEl);
                if (e.key.toLowerCase() === 'arrowleft') { if (idx > 0) setFocus(items[idx - 1]); } 
                else if (e.key.toLowerCase() === 'arrowright') { if (idx < items.length - 1) setFocus(items[idx + 1]); } 
                else if (e.key.toLowerCase() === 'enter' || e.key.toLowerCase() === 'ok') { activeEl.click(); } 
                else if (e.key.toLowerCase() === 'arrowleft' && idx === 0) { const navIcon = document.querySelector('nav .app-icon.active'); if (navIcon) setFocus(navIcon); }
                return;
            }
            const container = activeEl.closest('.grid-container');
            if (container) { handleGenericGridNavigation(e, activeEl, container); }
        }

        function handleGenericGridNavigation(e, activeEl, container) {
            const items = Array.from(container.querySelectorAll('.grid-item:not([style*="display: none"])')).filter(el => el.offsetParent !== null);
            if (items.length === 0) return;
            const idx = items.indexOf(activeEl);
            if (idx === -1) return;
            const firstItemTop = items[0].getBoundingClientRect().top;
            let cols = items.filter(item => Math.abs(item.getBoundingClientRect().top - firstItemTop) < 20).length;
            if (cols === 0) cols = 1;
            const isTopRow = idx < cols;
            let nextIdx = -1;
            switch (e.key.toLowerCase()) {
                case 'arrowup': if (!isTopRow) { nextIdx = idx - cols; } break;
                case 'arrowdown': nextIdx = idx + cols; break;
                case 'arrowright': if (idx % cols !== 0) { nextIdx = idx - 1; } break;
                case 'arrowleft':
                    if ((idx + 1) % cols === 0 || idx === items.length - 1) {
                        const navIcon = document.querySelector('nav .app-icon.active');
                        if (navIcon) setFocus(navIcon);
                        return;
                    } else { nextIdx = idx + 1; }
                    break;
                case 'enter': case 'ok': activeEl.click(); return;
            }
            if (nextIdx >= 0 && nextIdx < items.length) { setFocus(items[nextIdx]); }
        }
        // دالة تحديث الرقم الهجري فوق القمر
function updateMoonHijriOverlay() {
    const today = new Date();
     const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);// الكود الخاص بك لجلب اليوم الهجري
    const hijriDay = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric'}).format(yesterday);
    
    // ربط القيمة بالعنصر في الواجهة
    const hijriOverlay = document.getElementById('hijri-moon-overlay');
    
    if (hijriOverlay) {
        hijriOverlay.innerText = hijriDay;
        console.log("🌙 تم تحديث اليوم الهجري فوق القمر إلى: " + hijriDay);
    }
}

// تشغيل التحديث فوراً
updateMoonHijriOverlay();
        // --- Welcome Voice Message ---
        function playWelcomeMessage() {
            const today = new Date();
            today.setFullYear(2026);
            const gregorianDate = new Intl.DateTimeFormat('en-UK', { month: 'long', day: 'numeric' }).format(today);
            const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { weekday: 'long'}).format(today);
            const hijriDay = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric'}).format(today);


            let welcomeText = '';
            let weatherText = '';

            const speak = (textToSpeak) => {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                    const voices = window.speechSynthesis.getVoices();
                    // Try to find a male Arabic voice, fallback to any Arabic voice
                    let arabicVoice = voices.find(voice => voice.lang.startsWith('ar') && voice.name.includes('Male'));
                    if (!arabicVoice) {
                        arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
                    }
                    if (arabicVoice) {
                        utterance.voice = arabicVoice;
                    }
                    utterance.lang = 'ar-SA';
                    utterance.rate = 0.9;
                    window.speechSynthesis.speak(utterance);
                } else {
                    console.log('Text-to-speech not supported in this browser.');
                }
            };

            const speakWithVoicesReady = (text) => {
                 if (window.speechSynthesis.getVoices().length === 0) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        speak(text);
                    };
                } else {
                    speak(text);
                }
            }
// 1. التحق



            
            // NEW/UPDATED: Event listener for the floating back button
            backToSearchFloatingButton.addEventListener('click', () => {
                // If we are on the suggestions screen AND we have a previous search to go back to...
                if (activeMediaView === 'suggestions' && lastSuccessfulSearchQuery) {
                    searchYouTubeVideos(lastSuccessfulSearchQuery); // ...then re-run that search.
                } else {
                    // Otherwise (i.e., we are on the search results screen), perform the original "back" action.
                    navigateBackToMainSearch();
                }
            });

            upload360ImageButton?.addEventListener('click', () => upload360ImageInput.click()); 
            upload360ImageInput?.addEventListener('change', handleImageUpload); 
            reset360ImageButton?.addEventListener('click', resetImageToDefault); 
            document.addEventListener('keydown', handleRemoteControlInput);
            document.addEventListener('fullscreenchange', handleFullScreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullScreenChange); // For Safari
            
            videoPopupCloseButton.addEventListener('click', hideVideoPopup);
            backToPlaylistsFromVideosButton.addEventListener('click', navigateBackToMainSearch);
            backToPlaylistsBottomButton.addEventListener('click', navigateBackToMainSearch);
            backToPlaylistsBottomButtonSearch.addEventListener('click', navigateBackToMainSearch);
            floatingKeyboardButton.addEventListener('click', () => { 
                youtubeSearchInput.readOnly = !youtubeSearchInput.readOnly; 
                if (!youtubeSearchInput.readOnly) {
                    youtubeSearchInput.focus(); 
                } else {
                    youtubeSearchInput.blur();
                    // Return focus to the search button after disabling keyboard
                    setFocus(youtubeSearchButton);
                }
                floatingKeyboardButton.classList.toggle('active-keyboard', !youtubeSearchInput.readOnly); 
                floatingKeyboardButton.classList.toggle('inactive-keyboard', youtubeSearchInput.readOnly); 
            });
            
            // UPDATED: Clear button logic
            clearSearchButton.addEventListener('click', () => {
                youtubeSearchInput.value = ''; // Clear input immediately
                lastSuccessfulSearchQuery = null; // NEW: Clear the last search memory
                navigateBackToMainSearch();
            });

            youtubeSearchInput.addEventListener('focus', () => { if (youtubeSearchInput.value.trim() === '') { resetYoutubeSearchUI(); } });
            youtubeSearchButton.addEventListener('click', () => { const query = youtubeSearchInput.value.trim(); if (query) searchYouTubeVideos(query); else showMessageBox('الرجاء إدخال كلمة للبحث.'); });
            
            // UPDATED: Auto-search for Tarteel channel with pre-click effect
            youtubeSearchInput.addEventListener('input', () => {
                const targetText = 'ترتيل-@TarteelArabic';
                const currentText = youtubeSearchInput.value;

                if (currentText.includes(targetText + ' ')) {
                    // If text with space is present, visually confirm and trigger the click
                    youtubeSearchButton.classList.add('tv-focus'); 
                    setTimeout(() => {
                        youtubeSearchButton.click();
                        // Optional: remove focus style after click to reset state
                        setTimeout(() => youtubeSearchButton.classList.remove('tv-focus'), 100);
                    }, 50);
                } else if (currentText.includes(targetText)) {
                    // If only the text (no space) is present, show pre-click effect
                    youtubeSearchButton.classList.add('tv-focus');
                } else {
                    // If the text is not present, remove the effect
                    youtubeSearchButton.classList.remove('tv-focus');
                }
            });

            // NEW Listeners for Animation and Zoom Controls
            pauseAnimationButton.addEventListener('click', () => {
                document.body.classList.toggle('animation-paused');
                const isPaused = document.body.classList.contains('animation-paused');
                const playIcon = pauseAnimationButton.querySelector('[data-lucide="play"]');
                const pauseIcon = pauseAnimationButton.querySelector('[data-lucide="pause"]');
                playIcon.classList.toggle('hidden', !isPaused);
                pauseIcon.classList.toggle('hidden', isPaused);
            });

            removeCacheButton.addEventListener('click', () => {
                localStorage.clear();
                showMessageBox('تم مسح ذاكرة التخزين المؤقت بنجاح. سيتم إعادة تحميل التطبيق.');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            });

            zoomInButton.addEventListener('click', () => {
                if (currentFontSize < maxFontSize) {
                    currentFontSize += fontSizeStep;
                    document.documentElement.style.fontSize = `${currentFontSize}px`;
                }
            });

            zoomOutButton.addEventListener('click', () => {
                if (currentFontSize > minFontSize) {
                    currentFontSize -= fontSizeStep;
                    document.documentElement.style.fontSize = `${currentFontSize}px`;
                }
            });


if (!window.hasInitializedWeatherSpeaker) {

    // 2. إذا لم يتم التشغيل من قبل، قم بتعيين الحارس فوراً
    window.hasInitializedWeatherSpeaker = true;
    
    // 3. الآن، ضع الكود الأصلي بالكامل هنا
    let hasSpokenWelcome = false; // هذا العلم سيعمل الآن بشكل صحيح

    const checkWeatherAndSpeak = () => {
        // نطق الترحيب مرة واحدة فقط
        if (!hasSpokenWelcome) {
            const welcomeText = `مرحبا، تاريخ اليوم ${hijriDate} الموافق ${gregorianDate}`;
            speakWithVoicesReady(welcomeText);
            hasSpokenWelcome = true;
        }

        // إذا كانت بيانات الطقس جاهزة، نطقها بعد تأخير
        if (appState.weather.temperature !== null) {
            setTimeout(() => {
                const weatherText = `حالة الطقس الآن ${appState.weather.temperature} درجة مئوية`;
                speakWithVoicesReady(weatherText);
            }, 7000);
        } else {
            // إذا لم تكن جاهزة، كرر المحاولة لاحقًا
            setTimeout(checkWeatherAndSpeak, 500);
        }
    };

    // 4. ابدأ التشغيل (سيحدث هذا مرة واحدة فقط)
    checkWeatherAndSpeak();
}
// 5. في المرة الثانية والثالثة التي يحاول فيها الكود العمل،
// سيفشل الشرط الأول (!window.hasInitializedWeatherSpeaker)
// وسيتم تخطي الكود بالكامل.

        }

        // --- Fullscreen Toggle ---
        function toggleFullScreen() {
            let elem;
            if (videoPopupContainer.classList.contains('active')) {
                elem = popupPlayer.getIframe();
            } else {
                elem = document.documentElement;
            }

            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }
switchApp('Dashboard');
updateTrafficIndicators();
renderFavoritesDashboard();


document.addEventListener('DOMContentLoaded', () => {
    // 1. **الجلب الأولي لبيانات JSONBin (ASYNCHRONOUS)**
    // يتم استخدام Promise.all لانتظار نتائج الجلب الرئيسية
const recitersIframe = document.getElementById('reciters-iframe');
const iframeSrcButtons = document.querySelectorAll('#screen-Reciters .iframe-src-button');

    if (recitersIframe && iframeSrcButtons.length > 0) {
        iframeSrcButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newSrc = button.dataset.src;
                if (newSrc && recitersIframe.src !== newSrc) {
                    console.log(`Changing iframe src to: ${newSrc}`);
                    recitersIframe.src = newSrc; // Change the iframe source

                    // Update active button state
                    iframeSrcButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                }
            });
        });
    }
window.initMap = function() { initMaps(); };
loadGoogleMaps().then(initMap);
loadPrayerTimes();
        // 3. تشغيل خدمات الخلفية
        fetchWeatherData();
  // 1. تشغيل جميع عمليات الجلب بالتوازي
    Promise.all([
        fetchRecitersList(),    // [0]
        fetchChannelsList(),    // [1]
        fetchFavorites('D'),    // [2] القائمة المرجعة من المتابعة في السيارة
        fetchFavorites('M'),    // [3] القائمة المرجعة من المتابعة في التلفاز
        fetchSuggestedVideos()  // [4] الـ 30 فيديو التي جلبناها من الـ 6 قنوات
    ]).then(results => {
        
        // ✅ التعيين الصحيح حسب الفهرس (Index)
        favoritesD      = results[2] || [];
        favoritesM      = results[3] || []; 
        suggestedVideos = results[4] || []; // تأكد أن الفهرس 4 هو لـ fetchSuggestedVideos
        
        console.log(`[System] Initialized: ${favoritesD.length} Car Favs, ${suggestedVideos.length} Suggestions.`);

        // 2. تحديث الكاش فوراً لضمان سرعة التحميل المرة القادمة (حماية الكوتا)
        if (suggestedVideos.length > 0) {
            localStorage.setItem('suggestedVideosCache', JSON.stringify(suggestedVideos));
            window.allFetchedVideos30 = suggestedVideos; // لتشغيل الكل (Shuffle)
        }
 
        populateYoutubeSuggestions();
        
        
        migrateChannelData();
        
        // 4. تشغيل المؤقتات
        startNextPrayerDetermination(); 
        startFullDateUpdates();         

        // 5. تهيئة واجهة المستخدم (UI)
        switchApp('Dashboard'); 
        renderFavoritesDashboard(); 
        centerMapOnUserLocation(); 
        updateTimerDisplay();
        renderDailyReminders();

        // 🚀 السطر الحاسم: عرض الفيديوهات المقترحة في لوحة القيادة
        // نستخدم suggestedVideos لأنها أصبحت تحتوي على الـ 30 فيديو
        renderSuggestedDashboard(suggestedVideos);

    }).catch(error => {
        console.error("Critical Initialization Failure:", error);
        // في حالة الفشل، نحاول قراءة الكاش القديم لكي لا تظهر الشاشة فارغة
        renderSuggestedDashboard(); 
    });

    // 6. **تفعيل المستمعات والأزرار (Listeners & Button Bindings)**
    
    // مراجع الأزرار الأساسية
    const getMyLocationButtonDashboard = document.getElementById('get-my-location-button-dashboard');
    const goToHome1Button = document.getElementById('go-to-home-1-button');
    const goToHome2Button = document.getElementById('go-to-home-2-button');
    const minimizedRestoreBtn = document.getElementById('minimized-restore-btn');
    const minimizedPlayPauseBtn = document.getElementById('minimized-play-pause-btn');
    const videoPopupMinimizeButton = document.getElementById('video-popup-minimize-button');
    const floatingMinimizedVideoButton = document.getElementById('floating-minimized-video-button');
    const floatingMicButton = document.getElementById('floating-mic-button'); // 🛑 الزر الجديد
    const addVideoByUrlBtn = document.getElementById('add-video-by-url-btn');

    // 🛑 ربط زر إضافة الفيديو بالرابط
    addVideoByUrlBtn?.addEventListener('click', promptAddVideoByUrl);

    // 💡 منطق تنظيف التنبيهات الصوتية
    const todayDate = new Date().toLocaleDateString('en-US');
    const lastReset = localStorage.getItem('lastPrayerAlertReset');

    if (lastReset !== todayDate) {
        for (const key in localStorage) {
            if (key.startsWith('iqama_alert_')) {
                localStorage.removeItem(key);
            }
        }
        localStorage.setItem('lastPrayerAlertReset', todayDate);
    }

    getMyLocationButtonDashboard?.addEventListener('click', centerMapOnUserLocation);
    floatingMediaButton?.addEventListener('click', () => switchApp('Media'));

    // 🛑 ربط أزرار الموقع الجديدة (لتعيين Marker وعرض الازدحام)
    goToHome1Button?.addEventListener('click', () => {
        displayLocationMarker(HOME1_COORDS, 'إشارات ق'); 
    });
    goToHome2Button?.addEventListener('click', () => {
        displayLocationMarker(HOME2_COORDS, 'تقاطع ش');
    });

    // 🛑 ربط أزرار التحكم في الكبسولة (Minimize/Restore Logic)
    minimizedRestoreBtn?.addEventListener('click', restoreVideoPopup); 
    floatingMinimizedVideoButton?.addEventListener('click', restoreVideoPopup);

    // Listener زر التصغير من المشغل المنبثق
    videoPopupMinimizeButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeVideoPopup();
    });
    
    // Listener زر التشغيل/الإيقاف المؤقت داخل الكبسولة (يمنع الاستعادة)
    minimizedPlayPauseBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (popupPlayer && typeof popupPlayer.getPlayerState === 'function') {
            const playerState = popupPlayer.getPlayerState();
            if (playerState === YT.PlayerState.PLAYING) {
                popupPlayer.pauseVideo();
            } else {
                popupPlayer.playVideo();
            }
        }
    });

    // 🚀 ربط أزرار السرعة المنفصلة (يتم استخدام data-rate في HTML)
    document.querySelectorAll('#playback-rates-group .rate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const rateValue = e.currentTarget.dataset.rate; 
            setSpecificPlaybackRate(rateValue); 
        });
    });
    
    // 💡 ربط أحداث النقر للتحكم في التذكيرات
    document.addEventListener('click', (e) => {
        const reminderItem = e.target.closest('.reminder-item');
        const dropdownButton = e.target.closest('.reminder-status-dropdown button');

        if (dropdownButton) return;

        if (!reminderItem && !e.target.closest('.reminder-status-dropdown')) {
            closeAllDropdowns();
            return;
        }

        if (!reminderItem) return;

        e.stopPropagation();

        const existingDropdown = reminderItem.querySelector('.reminder-status-dropdown');

        if (existingDropdown) {
            existingDropdown.remove();
        } else {
            closeAllDropdowns();
            const reminderId = reminderItem.dataset.reminderId;
            const iconWrapper = reminderItem.querySelector('.icon-wrapper');
            if (iconWrapper) {
                 createReminderDropdown(reminderId, iconWrapper);
            }
        }
    });

    // 🛑 ربط زر الميكروفون (الزر الجديد)
    floatingMicButton?.addEventListener('click', () => {
        if (currentAppIndex === appOrder.indexOf('Media')) {
            // نوقف التسجيل أولاً إذا كان نشطاً، وإلا نبدأه
            if (floatingMicButton.classList.contains('recording')) {
                stopVoiceToText();
            } else {
                startVoiceToText();
            }
        } else {
            // إذا لم نكن في شاشة الميديا، انتقل إليها ثم ابدأ التسجيل
            switchApp('Media');
            // نستخدم setTimeout لضمان اكتمال DOM Switch قبل بدء التسجيل
            setTimeout(startVoiceToText, 100); 
        }
    });

    // 7. **المؤقتات والإجراءات المتأخرة**
    
    // 💡 يجب تهيئة متحدث الطقس قبل التشغيل
    if (!window.hasInitializedWeatherSpeaker) {
        window.hasInitializedWeatherSpeaker = true;
        let hasSpokenWelcome = false;

        const checkWeatherAndSpeak = () => {
             const today = new Date();
             today.setFullYear(2026);
             const gregorianDate = new Intl.DateTimeFormat('en-UK', { month: 'long', day: 'numeric' }).format(today);
             const hijriDate = new Intl.DateTimeFormat('ar-OM-u-ca-islamic', { weekday: 'long'}).format(today);

            const speak = (textToSpeak) => {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                    const voices = window.speechSynthesis.getVoices();
                    let arabicVoice = voices.find(voice => voice.lang.startsWith('ar') && voice.name.includes('Male'));
                    if (!arabicVoice) {
                        arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
                    }
                    if (arabicVoice) {
                        utterance.voice = arabicVoice;
                    }
                    utterance.lang = 'ar-SA';
                    utterance.rate = 0.9;
                    window.speechSynthesis.speak(utterance);
                } else {
                    console.log('Text-to-speech not supported in this browser.');
                }
            };
            const speakWithVoicesReady = (text) => {
                 if (window.speechSynthesis.getVoices().length === 0) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        speak(text);
                    };
                } else {
                    speak(text);
                }
            }

            if (!hasSpokenWelcome) {
                const welcomeText = `مرحبا، تاريخ اليوم ${hijriDate} الموافق ${gregorianDate}`;
                speakWithVoicesReady(welcomeText);
                hasSpokenWelcome = true;
            }

            if (appState.weather.temperature !== null) {
                setTimeout(() => {
                    const weatherText = `حالة الطقس الآن ${appState.weather.temperature} درجة مئوية`;
                    speakWithVoicesReady(weatherText);
                }, 7000);
            } else {
                setTimeout(checkWeatherAndSpeak, 500);
            }
        };
        setTimeout(checkWeatherAndSpeak, 1500); 
    }


    upload360ImageButton?.addEventListener('click', () => upload360ImageInput.click()); 
    upload360ImageInput?.addEventListener('change', handleImageUpload); 
    reset360ImageButton?.addEventListener('click', resetImageToDefault); 
    document.addEventListener('keydown', handleRemoteControlInput);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange); 
    
    videoPopupCloseButton.addEventListener('click', hideVideoPopup);
    backToPlaylistsFromVideosButton.addEventListener('click', navigateBackToMainSearch);
    backToPlaylistsBottomButton.addEventListener('click', navigateBackToMainSearch);
    backToPlaylistsBottomButtonSearch.addEventListener('click', navigateBackToMainSearch);
    floatingKeyboardButton.addEventListener('click', () => { 
        youtubeSearchInput.readOnly = !youtubeSearchInput.readOnly; 
        if (!youtubeSearchInput.readOnly) {
            youtubeSearchInput.focus(); 
        } else {
            youtubeSearchInput.blur();
            setFocus(youtubeSearchButton);
        }
        floatingKeyboardButton.classList.toggle('active-keyboard', !youtubeSearchInput.readOnly); 
        floatingKeyboardButton.classList.toggle('inactive-keyboard', youtubeSearchInput.readOnly); 
    });
    
    // UPDATED: Clear button logic
    clearSearchButton.addEventListener('click', () => {
        youtubeSearchInput.value = ''; 
        lastSuccessfulSearchQuery = null; 
        navigateBackToMainSearch();
    });

    youtubeSearchInput.addEventListener('focus', () => { if (youtubeSearchInput.value.trim() === '') { resetYoutubeSearchUI(); } });
    youtubeSearchButton.addEventListener('click', () => { const query = youtubeSearchInput.value.trim(); if (query) searchYouTubeVideos(query); else showMessageBox('الرجاء إدخال كلمة للبحث.'); });
    
    // UPDATED: Auto-search for Tarteel channel with pre-click effect
    youtubeSearchInput.addEventListener('input', () => {
        const targetText = 'ترتيل-@TarteelArabic';
        const currentText = youtubeSearchInput.value;

        if (currentText.includes(targetText + ' ')) {
            youtubeSearchButton.classList.add('tv-focus'); 
            setTimeout(() => {
                youtubeSearchButton.click();
                setTimeout(() => youtubeSearchButton.classList.remove('tv-focus'), 100);
            }, 50);
        } else if (currentText.includes(targetText)) {
            youtubeSearchButton.classList.add('tv-focus');
        } else {
            youtubeSearchButton.classList.remove('tv-focus');
        }
    });

    // NEW Listeners for Animation and Zoom Controls
    pauseAnimationButton.addEventListener('click', () => {
        document.body.classList.toggle('animation-paused');
        const isPaused = document.body.classList.contains('animation-paused');
        const playIcon = pauseAnimationButton.querySelector('[data-lucide="play"]');
        const pauseIcon = pauseAnimationButton.querySelector('[data-lucide="pause"]');
        playIcon.classList.toggle('hidden', !isPaused);
        pauseIcon.classList.toggle('hidden', isPaused);
    });

    removeCacheButton.addEventListener('click', () => {
        const protectedKeys = [
        'dashboard_cached_data',     // 🛡️ كاش الفيديوهات المقترحة (أهم واحد لتوفير الكوتا)
        'dashboard_cache_timestamp', // ⏰ وقت التحديث
        'yt_idx_1',                  // 🔑 مؤشر المفتاح الأول
        'yt_idx_2',                  // 🔑 مؤشر المفتاح الثاني
        'playlist_car_mode',         // 🚗 قائمة السيارة
        'playlist_tv_mode',          // 📺 قائمة التلفاز
        'playlist_watch_later',      // ⏰ المشاهدة لاحقاً
        'fav_dashboard_data',        // ❤️ المفضلة
        'FAV_CATEGORIES'             // 📂 تصنيفات المفضلة
    ];

    let deletedCount = 0;

    // 2. تجميع المفاتيح التي يجب حذفها
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!protectedKeys.includes(key)) {
            keysToRemove.push(key);
        }
    }

    // 3. التنفيذ: حذف المفاتيح غير المحمية فقط
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
    });

    console.log(`🧹 Cache Cleanup: Removed ${deletedCount} items. Protected Dashboard & Keys.`);

    // 4. عرض الرسالة وإعادة التحميل
    showMessageBox(`تم تنظيف الذاكرة (${deletedCount} ملفات). تم الحفاظ على الكاش والمفضلة.`);
    
    setTimeout(() => {
        location.reload();
    }, 2000);
    });

    zoomInButton.addEventListener('click', () => {
        if (currentFontSize < maxFontSize) {
            currentFontSize += fontSizeStep;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
        }
    });

    zoomOutButton.addEventListener('click', () => {
        if (currentFontSize > minFontSize) {
            currentFontSize -= fontSizeStep;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
        }
    });
    
    // NEW/UPDATED: Event listener for the floating back button
    backToSearchFloatingButton.addEventListener('click', () => {
        if (activeMediaView === 'suggestions' && lastSuccessfulSearchQuery) {
            searchYouTubeVideos(lastSuccessfulSearchQuery); 
        } else {
            navigateBackToMainSearch();
        }
    });
});


async function getManualReminderStates() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_REMINDERS}/latest`, {
            headers: {
                'X-Access-Key': JSONBIN_ACCESS_KEY_REMINDERS
            }
        });
        if (!response.ok) {
            console.error('Failed to fetch reminder states:', response.statusText);
            return {};
        }
        const data = await response.json();
        const states = data.record || {};
        
        // If the only thing in the bin is our placeholder, return an empty object
        if (Object.keys(states).length === 1 && states._init) {
            return {};
        }
        return states;

    } catch (error) {
        if (error instanceof SyntaxError) {
             console.log("Bin is likely empty or invalid. Returning default state.");
             return {};
        }
        console.error('Error in getManualReminderStates:', error);
        return {};
    }
}

async function setManualReminderState(reminderId, state) {
    let currentStates = await getManualReminderStates();
    
    if (state === 'auto') {
        delete currentStates[reminderId];
    } else {
        currentStates[reminderId] = state;
    }

    // ✅ THE FIX: If the object becomes empty, add a placeholder
    if (Object.keys(currentStates).length === 0) {
        currentStates = { "_init": true };
    }

    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID_REMINDERS}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(currentStates)
        });
    } catch (error) {
        console.error('Error writing to JSONBin:', error);
        showMessageBox('حدث خطأ أثناء حفظ الحالة.');
    }
    
    // We pass the *real* state (without the placeholder) to the renderer
    if (currentStates._init) {
        renderDailyReminders({});
    } else {
        renderDailyReminders(currentStates);
    }
    closeAllDropdowns();
}

            // NEW: Function to create and manage the dropdown
            function createReminderDropdown(reminderId, parentElement) {
                closeAllDropdowns(); // Close any other open dropdowns first

                const dropdown = document.createElement('div');
                dropdown.className = 'reminder-status-dropdown show';
                dropdown.innerHTML = `
                    <button data-state="active" class="navigable grid-item" tabindex="0">حالي</button>
                    <button data-state="completed" class="navigable grid-item" tabindex="0">منتهي</button>
                    <button data-state="missed" class="navigable grid-item" tabindex="0">فائت</button>
                    <hr class="border-white/10 my-1">
                    <button data-state="auto" class="navigable grid-item" tabindex="0">تلقائي</button>
                `;
                parentElement.appendChild(dropdown);

                dropdown.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent the main click listener from firing again
                        const state = button.dataset.state;
                        setManualReminderState(reminderId, state);
                    });
                });
                 // Focus the first button in the dropdown
                const firstButton = dropdown.querySelector('button');
                if (firstButton) setFocus(firstButton);
            }

            function closeAllDropdowns() {
                document.querySelectorAll('.reminder-status-dropdown').forEach(d => d.remove());
            }

            // 1. تعريف قائمة الأذكار والعبادات مع الشروط الخاصة بها
            const dailyReminders = [
    { id: 'adhkar_morning', name: 'أذكار الصباح', icon: 'sunrise', isActive: (now, times) => now >= times.Fajr && now < times.Dhuhr, getStartTime: (now, times) => times.Fajr, getEndTime: (now, times) => times.Dhuhr, action: () => { switchApp('Media'); searchYouTubeVideos('أذكار الصباح كاملة'); } },
    { id: 'salat_duha', name: 'صلاة الضحى', icon: 'sun', isActive: (now, times) => { if (!times.Sunrise || !times.Dhuhr) return false; const sunriseTime = new Date(times.Sunrise.getTime() + 20 * 60000); const dhuhrTime = new Date(times.Dhuhr.getTime() - 10 * 60000); return now >= sunriseTime && now < dhuhrTime; }, getStartTime: (now, times) => { if (!times.Sunrise) return null; return new Date(times.Sunrise.getTime() + 20 * 60000); }, getEndTime: (now, times) => { if (!times.Dhuhr) return null; return new Date(times.Dhuhr.getTime() - 10 * 60000); }, action: () => showMessageBox('صلاة الضحى سنة مؤكدة، ووقتها من بعد شروق الشمس وارتفاعها قدر رمح إلى قبيل وقت صلاة الظهر.') },
    { id: 'sunan_rawatib', name: 'السنن الرواتب', icon: 'calendar-check', isActive: (now, times) => { if (!times.Fajr || !times.Dhuhr || !times.Maghrib || !times.Isha) return false; const tenMinutes = 10 * 60 * 1000; if (now < times.Fajr && (times.Fajr.getTime() - now.getTime()) <= tenMinutes) return true; if (now < times.Dhuhr && (times.Dhuhr.getTime() - now.getTime()) <= tenMinutes) return true; if (now > times.Dhuhr && (now.getTime() - times.Dhuhr.getTime()) <= tenMinutes) return true; if (now > times.Maghrib && (now.getTime() - times.Maghrib.getTime()) <= tenMinutes) return true; if (now > times.Isha && (now.getTime() - times.Isha.getTime()) <= tenMinutes) return true; return false; }, getStartTime: null, getEndTime: null, action: () => showMessageBox('السنن الرواتب: ركعتان قبل الفجر، أربع قبل الظهر، ركعتان بعده، ركعتان بعد المغرب، وركعتان بعد العشاء.') },
    { id: 'adhkar_evening', name: 'أذكار المساء', icon: 'sunset', isActive: (now, times) => now >= times.Asr && now.getHours() < 23, getStartTime: (now, times) => times.Asr, getEndTime: (now, times) => { const d = new Date(now); d.setHours(22, 59, 59, 999); return d; }, action: () => { switchApp('Media'); searchYouTubeVideos('أذكار المساء كاملة'); } },
    { id: 'wird_daily', name: 'الورد اليومي', icon: 'book-marked', isActive: (now, times) => true, getStartTime: null, getEndTime: null, action: () => switchApp('Quran') },
    { id: 'surah_mulk', name: 'سورة الملك', icon: 'moon', isActive: (now, times) => now >= times.Isha || now < times.Fajr, getStartTime: (now, times) => times.Isha, getEndTime: (now, times) => { if (now < times.Fajr) return times.Fajr; return new Date(times.Fajr.getTime() + 24 * 60 * 60 * 1000); }, action: () => { switchApp('Media'); searchYouTubeVideos('سورة الملك كاملة'); } },
                { id: 'salat_witr', name: 'صلاة الوتر', icon: 'star', isActive: (now, times) => now >= times.Isha || now < times.Fajr, getStartTime: (now, times) => times.Isha, getEndTime: (now, times) => { if (now < times.Fajr) return times.Fajr; return new Date(times.Fajr.getTime() + 24 * 60 * 60 * 1000); }, action: () => showMessageBox('صلاة الوتر سنة مؤكدة، وأقلها ركعة واحدة، ووقتها من بعد صلاة العشاء إلى طلوع الفجر.') },
                { id: 'adhkar_sleep', name: 'قيام الليل ', icon: 'bed', isActive: (now, times) => now.getHours() >= 23, getStartTime: (now, times) => { const d = new Date(now); d.setHours(23, 0, 0, 0); return d; }, getEndTime: (now, times) => { const d = new Date(now); d.setHours(23, 59, 59, 999); return d; }, action: () => { switchApp('Media'); searchYouTubeVideos('أذكار النوم'); } }
            ];

            // 2. دالة لإنشاء وعرض القائمة (MODIFIED)
         // ✅ Corrected Version of the function
async function renderDailyReminders(states) { // We added 'async' and 'states' here
    const container = document.getElementById('tv');
    if (!container || !appState.prayerTimes.Fajr || appState.prayerTimes.Fajr === '--:--') return;

    // If no states are passed in, fetch them. Otherwise, use the states that were passed.
    const manualStates = states || await getManualReminderStates(); // We added 'await' here

    const now = new Date();
    const prayerDateTimes = {
        Fajr: timeToDate(appState.prayerTimes.Fajr),
        Sunrise: timeToDate(appState.prayerTimes.Sunrise || '06:15'),
        Dhuhr: timeToDate(appState.prayerTimes.Dhuhr),
        Asr: timeToDate(appState.prayerTimes.Asr),
        Maghrib: timeToDate(appState.prayerTimes.Maghrib),
        Isha: timeToDate(appState.prayerTimes.Isha)
    };

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'reminders-grid grid-container'; // Added grid-container for navigation
    grid.id = 'reminders-grid-container';

    dailyReminders.forEach(reminder => {
        const manualState = manualStates[reminder.id];
        let classList = 'reminder-item navigable grid-item';
        let iconName = '';

        if (manualState) {
            classList += ` ${manualState}`;
            switch (manualState) {
                case 'active':    iconName = 'clock'; break;
                case 'completed': iconName = 'check-check'; break;
                case 'missed':    iconName = 'x-circle'; break;
            }
        } else {
            const isActive = reminder.isActive(now, prayerDateTimes);
            let isUpcoming = false;
            if (reminder.getStartTime && !isActive) {
                const startTime = reminder.getStartTime(now, prayerDateTimes);
                if (startTime && startTime > now) { isUpcoming = true; }
            }
            let isCompleted = false;
            if (!isActive && !isUpcoming && reminder.getEndTime) {
                const endTime = reminder.getEndTime(now, prayerDateTimes);
                if (endTime && now > endTime) { isCompleted = true; }
            }

            if (isActive) { classList += ' active'; iconName = 'play-circle'; } 
            else if (isUpcoming) { classList += ' upcoming'; iconName = 'bell'; } 
            else if (isCompleted) { classList += ' completed'; iconName = 'check-check'; } 
            else { iconName = 'circle'; }
        }

        const item = document.createElement('div');
        item.className = classList;
        item.dataset.reminderId = reminder.id;
        item.tabIndex = 0;

        item.innerHTML = `
            <div class="icon-wrapper relative">
                <i data-lucide="${iconName || 'circle'}" class="icon w-12 h-12"></i>
            </div>
            <span class="text">${reminder.name}</span>
        `;
        grid.appendChild(item);
    });

    container.appendChild(grid);
    lucide.createIcons();
}

document.addEventListener('click', (e) => {
    const reminderItem = e.target.closest('.reminder-item');
    const dropdownButton = e.target.closest('.reminder-status-dropdown button');

    // إذا تم النقر على زر داخل القائمة المنسدلة، دعه يعمل (المستمع الخاص به سيعمل)
    if (dropdownButton) {
        return;
    }

    // إذا تم النقر خارج عنصر تذكير وخارج قائمة منسدلة، أغلق جميع القوائم
    if (!reminderItem && !e.target.closest('.reminder-status-dropdown')) {
        closeAllDropdowns();
        return;
    }

    // إذا لم يتم النقر على عنصر تذكير، توقف هنا
    if (!reminderItem) return;

    // --- الجزء الرئيسي للتعديل ---
    // أوقف انتشار الحدث لمنع أي إجراءات افتراضية أخرى
    e.stopPropagation();

    const reminderId = reminderItem.dataset.reminderId;
    const iconWrapper = reminderItem.querySelector('.icon-wrapper'); // ابحث عن حاوية الأيقونة

    if (!iconWrapper) return; // تأكد من وجود حاوية الأيقونة

    // تحقق مما إذا كانت القائمة المنسدلة لهذا العنصر مفتوحة بالفعل
    const existingDropdown = reminderItem.querySelector('.reminder-status-dropdown');

    if (existingDropdown) {
        // إذا كانت مفتوحة، أغلقها
        existingDropdown.remove();
    } else {
        // إذا كانت مغلقة، أغلق أي قوائم أخرى وافتح هذه القائمة
        closeAllDropdowns(); // أغلق القوائم الأخرى أولاً
        createReminderDropdown(reminderId, iconWrapper); // افتح القائمة الجديدة بالنسبة لحاوية الأيقونة
    }
    // --- نهاية التعديل ---

    // تم إزالة الجزء الخاص بتنفيذ الإجراء الافتراضي (مثل البحث في يوتيوب)
});
            
          
            // --- الكود الجديد ---
// 3. إضافة مستمع نقر واحد للتعامل مع كل الأزرار (MODIFIED)

        // --- Athkar App Logic ---
        const tabSabah = document.getElementById('tab-sabah');
        const tabMasaa = document.getElementById('tab-masaa');
        const athkarSabahContent = document.getElementById('athkar-sabah-content');
        const athkarMasaaContent = document.getElementById('athkar-masaa-content');
        const tabMonthly = document.getElementById('tab-monthly');
        const athkarMonthlyContent = document.getElementById('athkar-monthly-content');

        if (tabSabah && tabMasaa && athkarSabahContent && athkarMasaaContent && tabMonthly && athkarMonthlyContent) {
            tabSabah.addEventListener('click', () => {
                tabSabah.classList.add('active');
                tabMasaa.classList.remove('active');
                tabMonthly.classList.remove('active');
                athkarSabahContent.classList.remove('hidden');
                athkarMasaaContent.classList.add('hidden');
                athkarMonthlyContent.classList.add('hidden');
                setFocus(tabSabah); // Keep focus on the active tab
            });

            tabMasaa.addEventListener('click', () => {
                tabMasaa.classList.add('active');
                tabSabah.classList.remove('active');
                tabMonthly.classList.remove('active');
                athkarMasaaContent.classList.remove('hidden');
                athkarSabahContent.classList.add('hidden');
                athkarMonthlyContent.classList.add('hidden');
                setFocus(tabMasaa); // Keep focus on the active tab
            });

            tabMonthly.addEventListener('click', () => {
                tabMonthly.classList.add('active');
                tabSabah.classList.remove('active');
                tabMasaa.classList.remove('active');
                athkarMonthlyContent.classList.remove('hidden');
                athkarSabahContent.classList.add('hidden');
                athkarMasaaContent.classList.add('hidden');
                setFocus(tabMonthly);
            });
        }
    

