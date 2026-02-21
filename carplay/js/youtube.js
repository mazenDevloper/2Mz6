// مشغل اليوتيوب وإدارة API
// ملف: youtube.js

function showVideoPopup(videoId, startOverride = null) {
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

