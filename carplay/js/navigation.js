// نظام التنقل بالريموت والكيبورد
// ملف: navigation.js

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

