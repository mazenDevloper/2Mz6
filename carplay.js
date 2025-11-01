   // Initialize Lucide icons after they are loaded
        lucide.createIcons();

 
        // --- API Keys ---
        // IMPORTANT: REPLACE WITH YOUR ACTUAL YOUTUBE API KEY FROM GOOGLE CLOUD CONSOLE
        // إذا لم تقم بتعيين مفتاح YouTube API الخاص بك، فلن تعمل ميزات YouTube.
        // يرجى استبدال 'YOUR_YOUTUBE_API_KEY' بمفتاح API الخاص بك من Google Cloud Console.
        const YOUTUBE_API_KEY = 'AIzaSyDj4w1H3Is_rmTLhl40zER7AgYhT_tKASo'; 
        // IMPORTANT: REPLACE WITH YOUR ACTUAL GEMINI API KEY FROM GOOGLE AI STUDIO
        const AI_ASSISTANT_API_KEY = 'AIzaSyBMmtON9ww4dJxMHrl1wKyWTvI0ipJXJws'; 
        // IMPORTANT: REPLACE WITH YOUR ACTUAL WEATHERAPI.COM KEY TO RESOLVE 401 ERROR
        const WEATHER_API_KEY = '7acefc26deee4904a2393917252207'; 
        // GOOGLE MAPS API KEY IS INCLUDED IN THE SCRIPT TAG IN THE HEAD
        const GOOGLE_MAPS_API_KEY = 'AIzaSyBRqAHJ2elbE_Z7NXXYC50XZpqi6HbG6Rk'; // This is already in the script tag in the head


        // --- Global App State Management ---
        // Centralized state for various app functionalities
        let appState = {
            currentTime: '',
            mapLocation: { lat: 17.0151, lon: 54.0924, zoom: 17 }, // Default Salalah coordinates
            weather: {
                temperature: null, 
                feelsLike: null,
                description: null, 
                humidity: null,    
                wind: null,        
                pressure: null,
                visibility: null,
                uvIndex: null,
                lastUpdated: null, 
                iconUrl: '',
                location: 'Salalah, Oman'
            },
            car: { // Simulated car data, no longer controlled by settings UI
                speed: 0, 
                rpm: 0,   
                fuel: 0,  
                temp: 0,
                gear: 'P'
            },
            prayerTimes: { // This will now hold the current day's prayer times from the array
                Fajr: '--:--',
                Dhuhr: '--:--',
                Asr: '--:--',
                Maghrib: '--:--',
                Isha: '--:--',
                nextPrayer: null, // Changed from currentPrayer to nextPrayer
                nextPrayerIqamaTime: null, // Stores the Date object for the next prayer's iqama
                currentPrayer: null // Stores the name of the current prayer
            },
            hasShownGeolocationError: false, // New flag to control geolocation error message
            mapZoomChangedByUser: false, // New: Tracks if map zoom was manually changed
            dashboardReturnCounter: 0, // New: Counts returns to dashboard after map zoom change
            custom360Image: localStorage.getItem('custom360Image') || null, // Load custom 360 image from local storage
            currentLocation: null, // Stores the current user's location for directions
            destinationSet: false // New: Tracks if a destination has been set
        };

        // --- DOM Element References ---
        // Cache frequently accessed DOM elements for performance
        const timeElement = document.getElementById('current-time');
        const appButtons = document.querySelectorAll('button[data-app]');
        const appScreens = document.querySelectorAll('.app-screen');
        const sidebarIcons = document.querySelectorAll('.app-icon');
        const quranQuickAccess = document.getElementById('quran-quick-access'); // Moved to global scope

        // YouTube/Media specific elements
        const youtubeSearchInput = document.getElementById('youtube-search-input');
        const youtubeSearchButton = document.getElementById('youtube-search-button');
        const youtubeSuggestionsDiv = document.getElementById('youtube-suggestions'); // New
        const youtubePlaylistView = document.getElementById('youtube-playlist-view');
        const youtubeVideoListView = document.getElementById('youtube-video-list-view'); 
        const videoListContainer = document.getElementById('video-list-container'); 
        const youtubeSearchResultsView = document.getElementById('youtube-search-results-view');
        const searchResultsContainer = document.getElementById('search-results-container');
        const youtubePlayerView = document.getElementById('youtube-player-view');
        const youtubePlayerIframe = document.getElementById('youtube-player-iframe');
        const backToPlaylistsFromVideosButton = document.getElementById('back-to-playlists-from-videos'); 
        const backToPlaylistsBottomButton = document.getElementById('back-to-playlists-bottom-button');
        const backToPlaylistsBottomButtonSearch = document.getElementById('back-to-playlists-bottom-button-search');
        const minimizeVideoButton = document.getElementById('minimize-video-button');

        // Quran specific elements
        const quranSurahSelect = document.getElementById('quran-surah-select');
        const quranReaderSelect = document.getElementById('quran-reader-select');
        const quranGoButton = document.getElementById('quran-go-button');
        const quranIframe = document.getElementById('quran-iframe');

        // Floating UI elements
        const floatingFullscreenButton = document.getElementById('floating-fullscreen-button'); // For CarPlay app fullscreen
        const floatingMediaButton = document.getElementById('floating-media-button');
        const floatingKeyboardButton = document.getElementById('floating-keyboard-button'); // New keyboard button
        const clearSearchButton = document.getElementById('clear-search-button'); // New clear search button
        const startTripFloatingButton = document.getElementById('start-trip-floating-button'); // New: Floating Start Trip Button
        const videoPopupContainer = document.getElementById('video-popup-container');
        const videoPopupIframe = document.getElementById('video-popup-iframe');
        const videoPopupCloseButton = document.getElementById('video-popup-close-button');

        // AI Assistant elements
        const chatHistoryDiv = document.getElementById('chat-history');
        const aiInput = document.getElementById('ai-input');
        const aiSendButton = document.getElementById('ai-send-button');
        const aiMicButton = document.getElementById('ai-mic-button');
        const listeningIndicator = document.getElementById('listening-indicator');

        // Prayer Times elements
        const prayerTimesContainer = document.getElementById('prayer-times-container');
        // New elements for prayer times display
        const fajrTimeElement = document.getElementById('fajr-time');
        const dhuhrTimeElement = document.getElementById('dhuhr-time');
        const asrTimeElement = document.getElementById('asr-time');
        const maghribTimeElement = document.getElementById('maghrib-time');
        const ishaTimeElement = document.getElementById('isha-time');
        const fajrIqamaElement = document.getElementById('fajr-iqama');
        const dhuhrIqamaElement = document.getElementById('dhuhr-iqama');
        const asrIqamaElement = document.getElementById('asr-iqama');
        const maghribIqamaElement = document.getElementById('maghrib-iqama');
        const ishaIqamaElement = document.getElementById('isha-iqama');
      
        // Digital Clock elements for opacity control
        const digitalHoursSpan = document.querySelector('#digital-time .hours');
        const digitalMinutesSpan = document.querySelector('#digital-time .minutes');
        const digitalSecondsSpan = document.querySelector('#digital-time .seconds');
        const digitalDateLine1 = document.getElementById('digital-date-line1');
        const digitalDateLine2 = document.getElementById('digital-date-line2');
      
        // Google Map variables
        let dashboardGoogleMap; // For the map on the dashboard
        let fullGoogleMap;      // For the dedicated map screen
        let dashboardGoogleMarker;
        let fullGoogleMarker;
        let trafficLayerDashboard;
        let trafficLayerFullMap;
        let directionsService; // Google Maps Directions Service
        let directionsRenderer; // Google Maps Directions Renderer
        let autocomplete; // Google Maps Autocomplete for destination input
        let watchId; // To store the watchPosition ID for continuous tracking

        // Map Screen elements
        const destinationInput = document.getElementById('destination-input');
        const startDirectionsButton = document.getElementById('start-directions-button');
        const etaDisplay = document.getElementById('eta-display');
        const distanceDisplay = document.getElementById('distance-display');
        const getMyLocationButtonFullMap = document.getElementById('get-my-location-button-full-map');
        const toggleTrafficButton = document.getElementById('toggle-traffic-button'); // New traffic toggle button
        let isTrafficLayerEnabled = true; // State for traffic layer

        // 360 Camera elements
        const car360Image = document.getElementById('car-360-image');
        const upload360ImageInput = document.getElementById('upload-360-image-input');
        const upload360ImageButton = document.getElementById('upload-360-image-button');
        const reset360ImageButton = document.getElementById('reset-360-image-button');
        const default360ImageSrc = "https://dmusera.netlify.app/es350gb.png"; // Default image source

        // --- Global Variables for Media State ---
        let currentPlayingPlaylistId = ''; // Tracks the currently active playlist
        let activeMediaView = 'playlist'; // 'playlist', 'videoList', 'player', 'searchResults'
        let currentPlayingVideoId = ''; // Stores the ID of the currently playing video
        let isVideoPlayingInPopup = false; // True if video is in the floating pop-up

        // --- Utility Functions ---

        /**
         * Updates the current time in the top bar.
         */
        function updateTopBarTime() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');

            // Convert to 12-hour format without AM/PM
            hours = hours % 12;
            hours = hours ? hours : 12; // The hour '0' (midnight) should be '12'

            const timeString = `${hours}:${minutes}`; // Only hours and minutes for top bar
            timeElement.textContent = timeString;
            appState.currentTime = timeString; // Update state
        }

        /**
         * Displays a custom message box instead of native alert/confirm.
         * @param {string} message - The message to display.
         */
        function showMessageBox(message) {
            const messageBox = document.createElement('div');
            messageBox.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                text-align: center;
                max-width: 80%;
                font-size: 1.1rem;
            `;
            messageBox.innerHTML = `
                <p>${message}</p>
                <button style="margin-top: 15px; padding: 8px 15px; background-color: #9333ea; border: none; border-radius: 5px; color: white; cursor: pointer;">
                    إغلاق
                </button>
            `;
            document.body.appendChild(messageBox);

            messageBox.querySelector('button').addEventListener('click', () => {
                document.body.removeChild(messageBox);
            });
        }

        /**
         * Toggles the main CarPlay interface between normal and pseudo-fullscreen.
         */
        function togglePseudoFullscreen() {
            const carplayMainInterface = document.getElementById('carplay-main-interface');
            const topBar = document.querySelector('.top-bar');

            const isFullscreen = carplayMainInterface.classList.toggle('carplay-pseudo-fullscreen');

            if (isFullscreen) {
                floatingFullscreenButton.innerHTML = '<i data-lucide="minimize" class="w-6 h-6"></i> تصغير'; // Changed text to "تصغير"
                if (topBar) topBar.style.opacity = '0'; 
                document.body.style.overflow = 'hidden'; 
            } else {
                floatingFullscreenButton.innerHTML = '<i data-lucide="maximize" class="w-6 h-6"></i> تكبير'; // Changed text to "تكبير"
                if (topBar) topBar.style.opacity = '1';
                document.body.style.overflow = ''; 
            }
            lucide.createIcons(); // Re-render Lucide icons after DOM changes
        }

        /**
         * Updates the UI elements based on the current appState.
         */
        function updateUI() {
            // Update Dashboard Weather Widget
            document.getElementById('dashboard-weather-temp').textContent = appState.weather.temperature !== null ? `${appState.weather.temperature}°C` : '--°C';
            document.getElementById('dashboard-weather-desc').textContent = appState.weather.description !== null ? appState.weather.description : '--';
            const dashboardWeatherIconElement = document.getElementById('dashboard-weather-icon');
            if (dashboardWeatherIconElement) {
                dashboardWeatherIconElement.src = appState.weather.iconUrl || 'https://placehold.co/64x64/000000/FFFFFF?text=No+Icon';
                dashboardWeatherIconElement.alt = appState.weather.description || 'Weather Icon';
            }
            document.getElementById('dashboard-weather-location').textContent = appState.weather.location;

            // Update Weather Tab
            document.getElementById('weather-location').textContent = appState.weather.location; 
            document.getElementById('weather-temp').textContent = appState.weather.temperature !== null ? `${appState.weather.temperature}°C` : '--°C';
            document.getElementById('weather-desc').textContent = appState.weather.description !== null ? appState.weather.description : '--';
            document.getElementById('weather-feels-like').textContent = appState.weather.feelsLike !== null ? `الشعور كـ: ${appState.weather.feelsLike}°C` : 'الشعور كـ: --°C';
            document.getElementById('weather-humidity').textContent = appState.weather.humidity !== null ? `${appState.weather.humidity}%` : '--%';
            document.getElementById('weather-wind').textContent = appState.weather.wind !== null ? `${appState.weather.wind} كم/س` : '-- كم/س';
            document.getElementById('weather-pressure').textContent = appState.weather.pressure !== null ? `${appState.weather.pressure} mb` : '-- mb';
            document.getElementById('weather-visibility').textContent = appState.weather.visibility !== null ? `${appState.weather.visibility} كم` : '-- كم';
            appState.weather.uvIndex = appState.weather.uvIndex !== null ? appState.weather.uvIndex : '--'; // Ensure UV index is updated
            document.getElementById('weather-uv').textContent = appState.weather.uvIndex;
            appState.weather.lastUpdated = `آخر تحديث: ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}`;
            document.getElementById('weather-last-updated').textContent = appState.weather.lastUpdated !== null ? appState.weather.lastUpdated : '--';
            const weatherIconElement = document.getElementById('weather-icon');
            if (weatherIconElement) {
                weatherIconElement.src = appState.weather.iconUrl || 'https://placehold.co/96x96/000000/FFFFFF?text=No+Icon';
                weatherIconElement.alt = appState.weather.description || 'Weather Icon';
            }

            // Update Prayer Times
            loadPrayerTimes(); // Call loadPrayerTimes to update the display
            determineNextPrayer(); // Changed to determineNextPrayer
            renderPrayerTimes(); // Re-render to apply current prayer highlight
            
            // Update 360 Camera Image
            car360Image.src = appState.custom360Image || default360ImageSrc;

            // Update floating start trip button visibility
            if (appState.destinationSet) {
                startTripFloatingButton.style.display = 'flex';
            } else {
                startTripFloatingButton.style.display = 'none';
            }
        }

        // --- App Switching Logic ---

        /**
         * Switches the active application screen.
         * @param {string} appName - The ID of the app screen to activate (e.g., 'Dashboard', 'Media').
         */
        function switchApp(appName) {
            // Deactivate all screens and sidebar icons
            appScreens.forEach(screen => screen.classList.remove('active'));
            sidebarIcons.forEach(icon => {
                if(icon.tagName === 'BUTTON'){
                    icon.classList.remove('active', 'bg-purple-600/80', 'scale-110');
                }
            });

            // Activate the target screen and its sidebar icon
            const targetScreen = document.getElementById(`screen-${appName}`);
            if (targetScreen) targetScreen.classList.add('active');

            const targetIcon = document.querySelector(`.app-icon[data-app="${appName}"]`);
            if (targetIcon) targetIcon.classList.add('active'); // Active class now handles the new styling

            // Handle map zoom reset logic when returning to Dashboard
            if (appName === 'Dashboard') {
                if (appState.mapZoomChangedByUser) {
                    appState.dashboardReturnCounter++;
                    if (appState.dashboardReturnCounter >= 2 && dashboardGoogleMap) {
                        // Reset map zoom to default and clear flags
                        dashboardGoogleMap.setZoom(appState.mapLocation.zoom); // Reset to initial zoom
                        appState.mapZoomChangedByUser = false;
                        appState.dashboardReturnCounter = 0;
                        showMessageBox('تم إعادة تعيين تكبير الخريطة إلى الافتراضي.');
                    }
                }
            } else {
                // If navigating away from Dashboard, reset counter if map wasn't manually zoomed
                // This ensures the "second back" only counts if there was a zoom change *before* leaving.
                if (!appState.mapZoomChangedByUser) {
                    appState.dashboardReturnCounter = 0;
                }
            }

            // Handle Media (YouTube) view switching specifics
            handleMediaViewSwitch(appName);

            // Handle Quran app specific visibility
            if (appName === 'Quran') {
                // Ensure quranQuickAccess is defined before accessing its style property
                if (quranQuickAccess) {
                    quranQuickAccess.style.display = 'flex';
                }
            } else {
                if (quranQuickAccess) {
                    quranQuickAccess.style.display = 'none';
                }
            }

            // Handle Map app specific visibility for floating button
            if (appName === 'Map') {
                if (appState.destinationSet) {
                    startTripFloatingButton.style.display = 'flex';
                } else {
                    startTripFloatingButton.style.display = 'none';
                }
            } else {
                startTripFloatingButton.style.display = 'none';
            }

            updateUI(); // Update UI to reflect latest state
        }

        /**
         * Manages visibility and state for Media (YouTube) sub-views during app switching.
         * @param {string} currentAppName - The name of the app being switched to.
         */
        function handleMediaViewSwitch(currentAppName) {
            if (currentAppName === 'Media') {
                floatingMediaButton.style.display = 'none'; // Hide media button when already in media tab
                floatingKeyboardButton.style.display = 'flex'; // Show keyboard button
                clearSearchButton.style.display = 'flex'; // Always show clear search button in Media tab

                // Set initial keyboard button state based on search input readonly status
                if (youtubeSearchInput.readOnly) {
                    floatingKeyboardButton.classList.add('inactive-keyboard');
                    floatingKeyboardButton.classList.remove('active-keyboard');
                } else {
                    floatingKeyboardButton.classList.add('active-keyboard');
                    floatingKeyboardButton.classList.remove('inactive-keyboard');
                }

                // Hide all media sub-views initially
                youtubePlaylistView.classList.add('hidden');
                youtubePlaylistView.classList.remove('flex', 'flex-col');
                youtubeVideoListView.classList.add('hidden');
                youtubeVideoListView.classList.remove('flex', 'flex-col');
                youtubeSearchResultsView.classList.add('hidden'); 
                youtubeSearchResultsView.classList.remove('flex', 'flex-col'); 
                youtubePlayerView.classList.add('hidden');
                youtubePlayerView.classList.remove('flex', 'flex-col');
                youtubeSuggestionsDiv.classList.remove('hidden'); // Show suggestions

                if (isVideoPlayingInPopup && currentPlayingVideoId) {
                    // If video was playing in pop-up, keep it active
                    videoPopupContainer.classList.add('active'); 
                } else if (activeMediaView === 'videoList' && currentPlayingPlaylistId) {
                    youtubeVideoListView.classList.remove('hidden');
                    youtubeVideoListView.classList.add('flex', 'flex-col');
                    backToPlaylistsBottomButton.style.display = 'flex';
                    backToPlaylistsBottomButtonSearch.style.display = 'none';
                } else if (activeMediaView === 'searchResults') { 
                    youtubeSearchResultsView.classList.remove('hidden');
                    youtubeSearchResultsView.classList.add('flex', 'flex-col');
                    backToPlaylistsBottomButton.style.display = 'none';
                    backToPlaylistsBottomButtonSearch.style.display = 'flex';
                } else { // Default to playlist view
                    youtubePlaylistView.classList.remove('hidden');
                    youtubePlaylistView.classList.add('flex', 'flex-col');
                    backToPlaylistsBottomButton.style.display = 'none';
                    backToPlaylistsBottomButtonSearch.style.display = 'none';
                }
            } else {
                // If switching away from Media tab
                backToPlaylistsBottomButton.style.display = 'none';
                backToPlaylistsBottomButtonSearch.style.display = 'none';
                floatingMediaButton.style.display = 'flex'; // Show media button when not in media tab
                floatingKeyboardButton.style.display = 'none'; // Hide keyboard button
                clearSearchButton.style.display = 'none'; // Hide clear search button
                youtubeSuggestionsDiv.classList.add('hidden'); // Hide suggestions
                
                // If a video is playing in the main player, move it to pop-up
                if (activeMediaView === 'player' && currentPlayingVideoId && !isVideoPlayingInPopup) {
                    minimizeVideoToPopup(currentPlayingVideoId);
                } else if (isVideoPlayingInPopup && currentPlayingVideoId) {
                    // If video is already in pop-up, just ensure pop-up is active
                    videoPopupContainer.classList.add('active');
                } else {
                    // No video playing or pop-up not needed
                    videoPopupContainer.classList.remove('active');
                }
            }
        }

        // --- Event Listeners for App Buttons ---
        appButtons.forEach(button => {
            button.addEventListener('click', () => {
                const appName = button.dataset.app;
                switchApp(appName);
            });
        });
        
        // Apply common styles to sidebar app icons
        sidebarIcons.forEach(el => {
            el.classList.add('w-16', 'h-16', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'transition-all', 'duration-300', 'ease-in-out', 'focus:outline-none', 'focus:ring-4', 'focus:ring-purple-500/50', 'hover:bg-white/20', 'text-white');
            el.setAttribute('role', 'button');
        });
        
        // --- YouTube/Media Specific Functions and Event Handlers ---

        // YouTube playlist card click handler
        document.querySelectorAll('.youtube-channel-card').forEach(card => {
            card.addEventListener('click', () => {
                const playlistId = card.dataset.playlistId; 
                if (playlistId) {
                    currentPlayingPlaylistId = playlistId;
                    fetchPlaylistVideos(playlistId);
                }
            });
        });

        /**
         * Fetches videos for a given YouTube playlist and displays them.
         * @param {string} playlistId - The ID of the YouTube playlist.
         * @param {boolean} [updateActiveView=true] - Whether to update activeMediaView. Defaults to true.
         */
        async function fetchPlaylistVideos(playlistId, updateActiveView = true) {
            if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
                showMessageBox('خطأ: لم يتم تعيين مفتاح YouTube API. يرجى استبدال "YOUR_YOUTUBE_API_KEY" بمفتاحك الخاص.');
                console.error('YouTube API Key is not set.');
                return;
            }

            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=20`;

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    videoListContainer.innerHTML = ''; // Clear previous videos
                    videoListContainer.scrollTop = 0; // Scroll to top of the list
                    data.items.forEach(item => {
                        // Corrected path to videoId
                        const videoId = item.snippet.resourceId.videoId; 
                        const title = item.snippet.title;
                        const thumbnailUrl = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : 'https://placehold.co/120x90/000000/FFFFFF?text=No+Thumbnail';

                        const videoCard = document.createElement('div');
                        videoCard.classList.add('glass-surface', 'glass-surface--svg', 'youtube-video-card');
                        videoCard.dataset.videoId = videoId;
                        videoCard.innerHTML = `
                            <img src="${thumbnailUrl}" alt="${title}" onerror="this.onerror=null;this.src='https://placehold.co/120x90/000000/FFFFFF?text=No+Thumbnail';" />
                            <h3>${title}</h3>
                        `;
                        // Always show video in popup
                        videoCard.addEventListener('click', () => showVideoPopup(videoId));
                        videoListContainer.appendChild(videoCard);
                    });

                    // Update view visibility
                    youtubePlaylistView.classList.add('hidden');
                    youtubePlaylistView.classList.remove('flex', 'flex-col');
                    youtubeVideoListView.classList.remove('hidden');
                    youtubeVideoListView.classList.add('flex', 'flex-col');
                    youtubePlayerView.classList.add('hidden');
                    youtubePlayerView.classList.remove('flex', 'flex-col');
                    youtubeSearchResultsView.classList.add('hidden');
                    youtubeSearchResultsView.classList.remove('flex', 'flex-col');
                    youtubeSuggestionsDiv.classList.add('hidden'); // Hide suggestions

                    if (updateActiveView) {
                        activeMediaView = 'videoList';
                    }
                    backToPlaylistsBottomButton.style.display = 'flex';
                    backToPlaylistsBottomButtonSearch.style.display = 'none';
                } else {
                    showMessageBox('لم يتم العثور على فيديوهات في قائمة التشغيل هذه.');
                    console.warn('No videos found for playlist:', playlistId, data);
                }
            } catch (error) {
                console.error('Error fetching YouTube playlist videos:', error);
                showMessageBox('حدث خطأ أثناء جلب فيديوهات قائمة التشغيل.');
            }
        }

        /**
         * Shows the video in a pop-up window.
         * @param {string} videoId - The ID of the YouTube video.
         */
        function showVideoPopup(videoId) {
            // The `enablejsapi=1` and `origin` parameters are crucial for the iframe API
            // to allow communication between the parent window and the iframe.
            // This enables YouTube's internal suggestions to function within the pop-up.
            videoPopupIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.protocol}//${window.location.host}`;
            currentPlayingVideoId = videoId;
            isVideoPlayingInPopup = true;

            videoPopupContainer.classList.add('active');
            // Hide main media content when pop-up is active
            youtubePlaylistView.classList.add('hidden');
            youtubeVideoListView.classList.add('hidden');
            youtubeSearchResultsView.classList.add('hidden');
            youtubePlayerView.classList.add('hidden'); // Ensure main player is hidden
            youtubeSuggestionsDiv.classList.add('hidden'); // Hide suggestions
            
            activeMediaView = 'player'; // Still consider it 'player' view for media logic
            backToPlaylistsBottomButton.style.display = 'none';
            backToPlaylistsBottomButtonSearch.style.display = 'none';
        }

        /**
         * Hides the video pop-up and stops the video.
         */
        function hideVideoPopup() {
            videoPopupContainer.classList.remove('active');
            videoPopupIframe.src = ''; // Stop the video
            currentPlayingVideoId = '';
            isVideoPlayingInPopup = false;
        }

        /**
         * Minimizes the video from the main media player view to the pop-up.
         */
        function minimizeVideoToPopup(videoId) {
            if (videoId) {
                youtubePlayerIframe.src = ''; // Stop video in main player
                youtubePlayerView.classList.add('hidden');
                youtubePlayerView.classList.remove('flex', 'flex-col');

                showVideoPopup(videoId); // Show in pop-up
            }
        }

        // Event listeners for video pop-up controls
        videoPopupCloseButton.addEventListener('click', hideVideoPopup);
        minimizeVideoButton.addEventListener('click', () => {
            if (activeMediaView === 'player' && !isVideoPlayingInPopup) {
                minimizeVideoToPopup(currentPlayingVideoId);
                // After minimizing, return to the appropriate list view
                if (currentPlayingPlaylistId) {
                    fetchPlaylistVideos(currentPlayingPlaylistId, false);
                } else if (youtubeSearchInput.value.trim() !== '') {
                    searchYouTubeVideos(youtubeSearchInput.value.trim());
                } else {
                    navigateBackToPlaylists();
                }
            }
        });

        // Make video pop-up draggable
        let isDragging = false;
        let offsetX, offsetY;

        videoPopupContainer.addEventListener('mousedown', (e) => {
            // Only allow dragging from the container itself, not the iframe or controls
            if (e.target === videoPopupContainer) {
                isDragging = true;
                offsetX = e.clientX - videoPopupContainer.getBoundingClientRect().left;
                offsetY = e.clientY - videoPopupContainer.getBoundingClientRect().top;
                videoPopupContainer.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            videoPopupContainer.style.left = `${e.clientX - offsetX}px`;
            videoPopupContainer.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            videoPopupContainer.style.cursor = 'grab';
        });

        /**
         * Navigates back to the main YouTube playlists view.
         */
        function navigateBackToPlaylists() {
            youtubeVideoListView.classList.add('hidden');
            youtubeVideoListView.classList.remove('flex', 'flex-col');
            youtubeSearchResultsView.classList.add('hidden');
            youtubeSearchResultsView.classList.remove('flex', 'flex-col');

            youtubePlaylistView.classList.remove('hidden');
            youtubePlaylistView.classList.add('flex', 'flex-col');
            youtubeSuggestionsDiv.classList.remove('hidden'); // Show suggestions again
            
            currentPlayingPlaylistId = ''; // Reset selected playlist
            activeMediaView = 'playlist';
            backToPlaylistsBottomButton.style.display = 'none';
            backToPlayistsBottomButtonSearch.style.display = 'none'; 
        }

        // Event listeners for back buttons in Media tab
        backToPlaylistsFromVideosButton.addEventListener('click', navigateBackToPlaylists);
        backToPlaylistsBottomButton.addEventListener('click', navigateBackToPlaylists); 
        backToPlaylistsBottomButtonSearch.addEventListener('click', navigateBackToPlaylists); 

        // Keyboard button event listener
        floatingKeyboardButton.addEventListener('click', () => {
            youtubeSearchInput.readOnly = !youtubeSearchInput.readOnly; // Toggle readonly
            if (!youtubeSearchInput.readOnly) {
                youtubeSearchInput.focus();
                floatingKeyboardButton.classList.add('active-keyboard');
                floatingKeyboardButton.classList.remove('inactive-keyboard');
            } else {
                youtubeSearchInput.blur(); // Remove focus
                floatingKeyboardButton.classList.add('inactive-keyboard');
                floatingKeyboardButton.classList.remove('active-keyboard');
            }
        });

        // Clear search button event listener
        clearSearchButton.addEventListener('click', () => {
            youtubeSearchInput.value = ''; // Clear the input
            youtubeSearchInput.readOnly = true; // Set back to readonly
            floatingKeyboardButton.classList.add('inactive-keyboard'); // Set keyboard button to inactive
            floatingKeyboardButton.classList.remove('active-keyboard');
            navigateBackToPlaylists(); // Go back to playlists view
        });


        // YouTube Search Functionality
        const youtubeReaderSuggestions = ["فارس عنتر", "عبد الباسط عبد الصمد","ياسر الدوسري", "علي جابر", "محمد ايوب", "مشاري العفاسي", "عمر وهنا "];
        // Using the first 63 surahs for demonstration (9 rows x 7 columns)
        const youtubeSurahSuggestions = [
            "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
            "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
            "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
            "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
            "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
            "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
            "الصف", "الجمعة", "المنافقون"
        ];

        /**
         * Populates and displays YouTube search suggestions.
         */
        function populateYoutubeSuggestions() {
            youtubeSuggestionsDiv.innerHTML = ''; // Clear previous suggestions
            // Use flex-col for mobile stacking, and flex-row-reverse for desktop to put readers on the right
            youtubeSuggestionsDiv.classList.add('flex', 'flex-col', 'md:flex-row-reverse', 'gap-4', 'w-full'); 

            // Readers section (will appear on the right on desktop, top on mobile)
            const readersSection = document.createElement('div');
            // Adjusted classes for readers section to be a single column and take less width
            readersSection.classList.add('flex', 'flex-col', 'gap-2', 'p-3', 'rounded-xl', 'glass-surface', 'glass-surface--svg', 'md:w-1/5', 'flex-shrink-0'); 
            readersSection.innerHTML = '<span class="youtube-suggestion-category-tag bg-blue-600">للقراء</span>';
            youtubeReaderSuggestions.forEach(suggestion => {
                const button = document.createElement('button');
                button.classList.add('youtube-suggestion-button');
                button.textContent = suggestion;
                button.addEventListener('click', () => {
                    youtubeSearchInput.value += suggestion + ' '; // Append text and a space
                    youtubeSearchInput.focus();
                });
                readersSection.appendChild(button);
            });
            youtubeSuggestionsDiv.appendChild(readersSection);

            // Surahs section (will appear on the left on desktop, bottom on mobile)
            const surahsSection = document.createElement('div');
            // Adjusted classes for surahs section to take remaining width
            surahsSection.classList.add('flex', 'flex-col', 'gap-2', 'p-3', 'rounded-xl', 'glass-surface', 'glass-surface--svg', 'flex-grow'); 
            surahsSection.innerHTML = '<span class="youtube-suggestion-category-tag bg-green-600">للسور</span>';
            const surahButtonsContainer = document.createElement('div');
            // Changed grid-cols-4 to md:grid-cols-9 for 9 columns on medium and larger screens
            surahButtonsContainer.classList.add('grid', 'grid-cols-4', 'md:grid-cols-9', 'gap-2', 'w-full'); 

            youtubeSurahSuggestions.forEach(name => {
                const button = document.createElement('button');
                button.classList.add('youtube-suggestion-button');
                button.textContent = name;
                button.addEventListener('click', () => {
                    youtubeSearchInput.value += name + ' ';
                    youtubeSearchInput.focus();
                });
                surahButtonsContainer.appendChild(button);
            });
            surahsSection.appendChild(surahButtonsContainer);
            youtubeSuggestionsDiv.appendChild(surahsSection);
        }

        youtubeSearchInput.addEventListener('focus', () => {
            if (youtubeSearchInput.value.trim() === '') {
                populateYoutubeSuggestions();
                youtubeSuggestionsDiv.classList.remove('hidden');
            }
        });

        // Removed the conditional display of clearSearchButton based on input.value
        // youtubeSearchInput.addEventListener('input', () => {
        //     if (youtubeSearchInput.value.trim() === '') {
        //         youtubeSuggestionsDiv.classList.remove('hidden');
        //         populateYoutubeSuggestions(); // Repopulate to ensure all are there
        //     } else {
        //         youtubeSuggestionsDiv.classList.add('hidden');
        //     }
        // });

        youtubeSearchButton.addEventListener('click', () => {
            const query = youtubeSearchInput.value.trim();
            if (query) {
                searchYouTubeVideos(query);
            } else {
                showMessageBox('الرجاء إدخال كلمة للبحث.');
            }
        });

        /**
         * Searches YouTube for videos based on a query and displays results.
         * @param {string} query - The search query.
         */
        async function searchYouTubeVideos(query) {
            if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
                showMessageBox('خطأ: لم يتم تعيين مفتاح YouTube API. يرجى استبدال "YOUR_YOUTUBE_API_KEY" بمفتاحك الخاص.');
                console.error('YouTube API Key is not set.');
                return;
            }

            const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=20`;

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    searchResultsContainer.innerHTML = ''; // Clear previous search results
                    searchResultsContainer.scrollTop = 0; // Scroll to top of the search results
                    data.items.forEach(item => {
                        const videoId = item.id.videoId;
                        const title = item.snippet.title;
                        const thumbnailUrl = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : 'https://placehold.co/120x90/000000/FFFFFF?text=No+Thumbnail';

                        const videoCard = document.createElement('div');
                        videoCard.classList.add('glass-surface', 'glass-surface--svg', 'youtube-search-card');
                        videoCard.dataset.videoId = videoId;
                        videoCard.innerHTML = `
                            <img src="${thumbnailUrl}" alt="${title}" onerror="this.onerror=null;this.src='https://placehold.co/120x90/000000/FFFFFF?text=No+Thumbnail';" />
                            <h3>${title}</h3>
                        `;
                        // Always show video in popup
                        videoCard.addEventListener('click', () => showVideoPopup(videoId));
                        searchResultsContainer.appendChild(videoCard);
                    });

                    // Update view visibility
                    youtubePlaylistView.classList.add('hidden');
                    youtubePlaylistView.classList.remove('flex', 'flex-col');
                    youtubeVideoListView.classList.add('hidden');
                    youtubeVideoListView.classList.remove('flex', 'flex-col');
                    youtubePlayerView.classList.add('hidden');
                    youtubePlayerView.classList.remove('flex', 'flex-col');
                    youtubeSearchResultsView.classList.remove('hidden');
                    youtubeSearchResultsView.classList.add('flex', 'flex-col');
                    youtubeSuggestionsDiv.classList.add('hidden'); // Hide suggestions after search results are loaded
                    activeMediaView = 'searchResults';
                    backToPlaylistsBottomButton.style.display = 'none';
                    backToPlaylistsBottomButtonSearch.style.display = 'flex';
                } else {
                    showMessageBox('لم يتم العثور على نتائج بحث لـ: ' + query);
                    searchResultsContainer.innerHTML = '<p class="text-center text-white/70 col-span-full">لا توجد نتائج بحث.</p>';
                }
            } catch (error) {
                console.error('Error searching YouTube videos:', error);
                showMessageBox('حدث خطأ أثناء البحث في يوتيوب.');
            }
        }

        // --- AI Assistant Logic ---
        let recognition; // Speech recognition object
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false; // Listen for a single utterance
            recognition.interimResults = false; // Only return final results
            recognition.lang = 'ar-SA'; // Set language to Arabic (Saudi Arabia)

            recognition.onstart = function() {
                aiMicButton.classList.add('bg-red-500');
                listeningIndicator.classList.remove('hidden');
                aiInput.placeholder = 'جاري الاستماع...';
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                aiInput.value = transcript;
                sendAIAssistantMessage(); // Send message after speech is recognized
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                listeningIndicator.classList.add('hidden');
                aiMicButton.classList.remove('bg-red-500');
                aiInput.placeholder = 'اسألني أي شيء...';
                const errorMessageDiv = document.createElement('div');
                errorMessageDiv.classList.add('chat-message', 'ai');
                errorMessageDiv.textContent = 'عذرًا، لم أستطع فهمك. يرجى المحاولة مرة أخرى.';
                chatHistoryDiv.appendChild(errorMessageDiv);
                chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            };

            recognition.onend = function() {
                aiMicButton.classList.remove('bg-red-500');
                listeningIndicator.classList.add('hidden');
                aiInput.placeholder = 'اسألني أي شيء...';
            };
        } else {
            aiMicButton.style.display = 'none'; // Hide mic button if API not supported
            console.warn('Web Speech API is not supported in this browser.');
        }

        aiMicButton.addEventListener('click', () => {
            if (recognition) {
                recognition.start();
            }
        });

        let synth = window.speechSynthesis; // Speech synthesis object
        let arabicVoice = null; // Stores the preferred Arabic voice

        /**
         * Sets the preferred Arabic voice for speech synthesis.
         */
        function setArabicVoice() {
            if (synth) {
                const voices = synth.getVoices();
                arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
                if (arabicVoice) {
                    console.log('Arabic voice found:', arabicVoice.name);
                } else {
                    console.warn('Arabic voice not found. Speech synthesis for Arabic may use a default or not work as expected.');
                }
            }
        }
        if (synth) {
            synth.onvoiceschanged = setArabicVoice; // Listen for voice changes
            setArabicVoice(); // Call initially in case voices are already loaded
        }

        /**
         * Sends a message to the AI assistant and handles its response.
         * Includes simulated car data responses and actual Gemini API calls.
         */
        async function sendAIAssistantMessage() {
            const userMessageText = aiInput.value.trim();
            if (userMessageText === '') return;

            // Display user message in chat history
            const userMessageDiv = document.createElement('div');
            userMessageDiv.classList.add('chat-message', 'user');
            userMessageDiv.textContent = userMessageText;
            chatHistoryDiv.appendChild(userMessageDiv);
            aiInput.value = ''; // Clear input field

            // Display typing indicator for AI response
            const typingIndicatorDiv = document.createElement('div');
            typingIndicatorDiv.classList.add('chat-message', 'ai');
            typingIndicatorDiv.textContent = 'جاري الكتابة...';
            typingIndicatorDiv.id = 'typing-indicator';
            chatHistoryDiv.appendChild(typingIndicatorDiv);
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Scroll to bottom

            let aiResponseText = '';

            // --- AI Customization for Car Screen (Simulated Responses) ---
            const lowerCaseMessage = userMessageText.toLowerCase();
            if (lowerCaseMessage.includes('سرعة')) {
                aiResponseText = `سرعة السيارة الحالية هي ${appState.car.speed !== null ? appState.car.speed : '--'} كم/س.`;
            } else if (lowerCaseMessage.includes('وقود') || lowerCaseMessage.includes('بنزين')) {
                aiResponseText = `مستوى الوقود الحالي هو ${appState.car.fuel !== null ? appState.car.fuel : '--'}%.`;
            } else if (lowerCaseMessage.includes('rpm') || lowerCaseMessage.includes('دوران المحرك')) {
                aiResponseText = `عدد دورات المحرك (RPM) هو ${appState.car.rpm !== null ? appState.car.rpm : '--'}.`;
            } else if (lowerCaseMessage.includes('حرارة') || lowerCaseMessage.includes('درجة حرارة المحرك')) {
                aiResponseText = `درجة حرارة المحرك هي ${appState.car.temp !== null ? appState.car.temp : '--'}°C.`;
            } else if (lowerCaseMessage.includes('ترس') || lowerCaseMessage.includes('غيار')) {
                aiResponseText = `الترس الحالي هو ${appState.car.gear !== null ? appState.car.gear : '--'}.`;
            } else {
                // Original Gemini API call for general questions
                try {
                    if (AI_ASSISTANT_API_KEY === 'YOUR_GEMINI_API_KEY') {
                        aiResponseText = 'خطأ: لم يتم تعيين مفتاح Gemini API. يرجى استبدال "YOUR_GEMINI_API_KEY" بمفتاحك الخاص.';
                        console.error('Gemini API Key is not set.');
                    } else {
                        let chatHistory = [];
                        chatHistory.push({ role: "user", parts: [{ text: userMessageText }] });
                        const payload = { contents: chatHistory };
                        const apiKey = AI_ASSISTANT_API_KEY;
                        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; 

                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        const result = await response.json();

                        if (result.candidates && result.candidates.length > 0 &&
                            result.candidates[0].content && result.candidates[0].content.parts &&
                            result.candidates[0].content.parts.length > 0) {
                            aiResponseText = result.candidates[0].content.parts[0].text;
                        } else {
                            aiResponseText = 'عذرًا، حدث خطأ أثناء معالجة طلبك من Gemini. (استجابة غير متوقعة)';
                            console.error('Unexpected Gemini API response structure:', result);
                        }
                    }
                } catch (error) {
                    console.error('Error calling Gemini API:', error);
                    aiResponseText = 'عذرًا، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى التحقق من اتصالك بالإنترنت أو مفتاح API.';
                }
            }

            // Remove typing indicator and display AI response
            if (typingIndicatorDiv && typingIndicatorDiv.parentNode) {
                typingIndicatorDiv.parentNode.removeChild(typingIndicatorDiv);
            }

            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.classList.add('chat-message', 'ai');
            aiMessageDiv.textContent = aiResponseText;
            chatHistoryDiv.appendChild(aiMessageDiv);

            // Speak the AI response
            if (synth && aiResponseText) {
                const utterance = new SpeechSynthesisUtterance(aiResponseText);
                if (arabicVoice) {
                    utterance.voice = arabicVoice;
                }
                utterance.lang = 'ar-SA';
                synth.speak(utterance);
            }
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Scroll to bottom again
        }

        aiSendButton.addEventListener('click', sendAIAssistantMessage);

        // --- Google Map and Geolocation Functions ---
        /**
         * Initializes the Google Maps on the dashboard and the dedicated map screen.
         * This function is called by the Google Maps API script once loaded.
         */
        function initMap() {
            // Dashboard Map Initialization
            const dashboardMapContainer = document.getElementById('dashboard-google-map');
            if (dashboardMapContainer) {
                const dashboardMapOptions = {
                    center: { lat: appState.mapLocation.lat, lng: appState.mapLocation.lon },
                    zoom: appState.mapLocation.zoom,
                    disableDefaultUI: true,
                    zoomControl: true,
                    // Removed styles array for default (light) theme
                };
                dashboardGoogleMap = new google.maps.Map(dashboardMapContainer, dashboardMapOptions);
                dashboardGoogleMarker = new google.maps.Marker({
                    position: { lat: appState.mapLocation.lat, lng: appState.mapLocation.lon },
                    map: dashboardGoogleMap,
                    title: 'موقع صلالة الافتراضي',
                    icon: { // Custom map pin image
                        url: 'https://dmusera.netlify.app/3604.png',
                        scaledSize: new google.maps.Size(80, 80)
                    }
                });
                trafficLayerDashboard = new google.maps.TrafficLayer();
                trafficLayerDashboard.setMap(dashboardGoogleMap);

                dashboardGoogleMap.addListener('zoom_changed', () => {
                    if (dashboardGoogleMap.getZoom() !== appState.mapLocation.zoom) {
                        appState.mapZoomChangedByUser = true;
                    }
                });
            }

            // Full Map Initialization
            const fullMapContainer = document.getElementById('full-google-map');
            if (fullMapContainer) {
                const fullMapOptions = {
                    center: { lat: appState.mapLocation.lat, lng: appState.mapLocation.lon },
                    zoom: appState.mapLocation.zoom,
                    disableDefaultUI: true,
                    zoomControl: true,
                    // Removed styles array for default (light) theme
                };
                fullGoogleMap = new google.maps.Map(fullMapContainer, fullMapOptions);
                fullGoogleMarker = new google.maps.Marker({
                    position: { lat: appState.mapLocation.lat, lng: appState.mapLocation.lon },
                    map: fullGoogleMap,
                    title: 'موقع صلالة الافتراضي',
                    icon: { // Custom map pin image
                        url: 'https://dmusera.netlify.app/3604.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
                trafficLayerFullMap = new google.maps.TrafficLayer();
                trafficLayerFullMap.setMap(fullGoogleMap);

                // Initialize Directions Service and Renderer
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({ map: fullGoogleMap });

                // Initialize Autocomplete for destination input
                autocomplete = new google.maps.places.Autocomplete(destinationInput);
                autocomplete.bindTo('bounds', fullGoogleMap);

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry) {
                        showMessageBox("لم يتم العثور على تفاصيل للمدخل: '" + place.name + "'");
                        appState.destinationSet = false;
                        updateUI();
                        return;
                    }
                    // If the place has a geometry, then present it on a map.
                    if (place.geometry.viewport) {
                        fullGoogleMap.fitBounds(place.geometry.viewport);
                    } else {
                        fullGoogleMap.setCenter(place.geometry.location);
                        fullGoogleMap.setZoom(17);  // Set a high zoom level
                    }
                    fullGoogleMarker.setPosition(place.geometry.location);
                    fullGoogleMarker.setVisible(true);
                    appState.destinationSet = true;
                    updateUI();
                });

                // Listen for manual input changes to reset destinationSet
                destinationInput.addEventListener('input', () => {
                    if (destinationInput.value.trim() === '') {
                        appState.destinationSet = false;
                        directionsRenderer.setDirections({ routes: [] }); // Clear directions
                        etaDisplay.textContent = '--';
                        distanceDisplay.textContent = '--';
                    } else {
                        // If user types, assume they are setting a destination,
                        // but only confirm after autocomplete or explicit action.
                        // For now, keep it false until a valid place is selected/routed.
                    }
                    updateUI();
                });
            }
            startContinuousLocationTracking(); // Start continuous tracking after map init
        }

        /**
         * Updates the Google Map with the user's current location.
         * @param {GeolocationPosition} position - The geolocation position object.
         */
        function updateGoogleMapLocation(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const heading = position.coords.heading;

            appState.currentLocation = { lat: lat, lng: lon }; // Store current location

            const newLatLng = { lat: lat, lng: lon };

            // Update Dashboard Map
            if (dashboardGoogleMap && dashboardGoogleMarker) {
                dashboardGoogleMarker.setPosition(newLatLng);
                // Only adjust zoom if it hasn't been manually changed by the user on dashboard
                // If not manually changed, set to the default zoom (appState.mapLocation.zoom)
                if (!appState.mapZoomChangedByUser) {
                    dashboardGoogleMap.setCenter(newLatLng);
                    dashboardGoogleMap.setZoom(appState.mapLocation.zoom); // Use default zoom directly
                }
            }

            // Update Full Map
            if (fullGoogleMap && fullGoogleMarker) {
                fullGoogleMarker.setPosition(newLatLng);
                fullGoogleMap.setCenter(newLatLng);
                // fullGoogleMap.setZoom(appState.mapLocation.zoom); // Always use default zoom for full map
            }

            // Auto-rotate map if heading is available and valid
            if (typeof heading === 'number' && !isNaN(heading)) {
                if (dashboardGoogleMap) dashboardGoogleMap.setHeading(heading);
                if (fullGoogleMap) fullGoogleMap.setHeading(heading);
            }
        }

        /**
         * Starts continuous geolocation tracking and updates the map.
         */
        function startContinuousLocationTracking() {
            if (navigator.geolocation) {
                // IMPORTANT: If this application is embedded in an iframe, ensure the iframe
                // has the 'allow="geolocation"' attribute set for geolocation to work.
                // Example: <iframe src="your-app-url.html" allow="geolocation" ...></iframe>
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        updateGoogleMapLocation(position);
                        appState.hasShownGeolocationError = false; 
                    },
                    (error) => {
                        console.error('Geolocation watch error:', error);
                        console.error('Geolocation error code:', error.code);
                        console.error('Geolocation error message:', error.message);
                        let errorMessage = 'تعذر تتبع موقعك الحالي بشكل مستمر.';
                        if (error.code === error.PERMISSION_DENIED) {
                            errorMessage += ' يرجى منح الإذن للموقع في إعدادات متصفحك. إذا كان التطبيق يعمل داخل إطار (iframe)، فيرجى التأكد من أن الإطار يحتوي على السمة `allow="geolocation"` للسماح بالوصول إلى الموقع.';
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                            errorMessage += ' معلومات الموقع غير متوفرة.';
                        } else if (error.code === error.TIMEOUT) {
                            errorMessage += ' انتهت مهلة طلب الموقع.';
                        } else {
                            errorMessage += ' خطأ غير معروف.';
                        }
                        if (!appState.hasShownGeolocationError) {
                            showMessageBox(errorMessage);
                            appState.hasShownGeolocationError = true;
                        }
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
                console.log("Continuous geolocation tracking started.");
            } else {
                showMessageBox('الموقع الجغرافي غير مدعوم في هذا المتصفح.');
            }
        }

        /**
         * Centers the Google Map on the user's current location (one-time update).
         * This function is called when the "تحديث الموقع" button is clicked.
         */
        function centerMapOnUserLocation(mapType = 'dashboard') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        updateGoogleMapLocation(position);
                        showMessageBox(`تم تحديث الخريطة إلى موقعك الحالي.`);
                        appState.hasShownGeolocationError = false; 
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        let errorMessage = 'تعذر الحصول على موقعك الحالي.';
                        if (error.code === error.PERMISSION_DENIED) {
                            errorMessage += ' يرجى منح الإذن للموقع في إعدادات متصفحك. إذا كان التطبيق يعمل داخل إطار (iframe)، فيرجى التأكد من أن الإطار يحتوي على السمة `allow="geolocation"` للسماح بالوصول إلى الموقع.';
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                            errorMessage += ' معلومات الموقع غير متوفرة.';
                        } else if (error.code === error.TIMEOUT) {
                            errorMessage += ' انتهت مهلة طلب الموقع.';
                        } else {
                            errorMessage += ' خطأ غير معروف.';
                        }
                        showMessageBox(errorMessage);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                showMessageBox('الموقع الجغرافي غير مدعوم في هذا المتصفح.');
            }
        }

        /**
         * Parses a Google Maps URL and sets the destination input.
         * @param {string} url - The Google Maps URL.
         * @returns {object|null} An object with lat, lng, and/or query, or null if parsing fails.
         */
        function parseGoogleMapsUrl(url) {
            try {
                const urlObj = new URL(url);
                const path = urlObj.pathname;
                const params = urlObj.searchParams;

                // Handle coordinates (e.g., /@lat,lng,zoom)
                const coordMatch = path.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                if (coordMatch) {
                    const lat = parseFloat(coordMatch[1]);
                    const lng = parseFloat(coordMatch[2]);
                    return { lat: lat, lng: lng };
                }

                // Handle search queries (e.g., /search?q=place)
                if (path.startsWith('/search') && params.has('q')) {
                    return { query: params.get('q') };
                }

                // Handle place IDs (e.g., /place/Place+Name/@lat,lng)
                const placeIdMatch = path.match(/\/place\/[^/]+\/data=!3m1!1e3!4m2!3m1!1s([a-zA-Z0-9_-]+)/);
                if (placeIdMatch) {
                    // This is a complex case, often better handled by Autocomplete directly
                    // For simplicity, we can extract the name if available in the path
                    const namePart = path.split('/place/')[1]?.split('/')[0];
                    if (namePart) {
                        return { query: decodeURIComponent(namePart.replace(/\+/g, ' ')) };
                    }
                }

                // Handle directions (e.g., /dir/from/to)
                if (path.startsWith('/dir/')) {
                    // This is more complex to parse full directions, but we can take the last part as destination
                    const parts = path.split('/');
                    const destinationPart = parts[parts.length - 1];
                    if (destinationPart) {
                        return { query: decodeURIComponent(destinationPart.replace(/\+/g, ' ')) };
                    }
                }

            } catch (e) {
                console.error("Failed to parse Google Maps URL:", e);
            }
            return null;
        }

        /**
         * Calculates and displays directions on the full map.
         */
        async function calculateAndDisplayRoute() {
            if (!directionsService || !directionsRenderer) {
                showMessageBox('خدمة الاتجاهات غير مهيأة بعد.');
                return;
            }

            const destinationInputVal = destinationInput.value.trim();
            if (!destinationInputVal) {
                showMessageBox('الرجاء إدخال وجهة أو رابط Google Maps.');
                return;
            }

            let destination = destinationInputVal;
            const parsedUrl = parseGoogleMapsUrl(destinationInputVal);

            if (parsedUrl) {
                if (parsedUrl.lat && parsedUrl.lng) {
                    destination = new google.maps.LatLng(parsedUrl.lat, parsedUrl.lng);
                    destinationInput.value = `${parsedUrl.lat}, ${parsedUrl.lng}`; // Update input with coordinates
                } else if (parsedUrl.query) {
                    destination = parsedUrl.query;
                    destinationInput.value = parsedUrl.query; // Update input with parsed query
                }
            }

            let origin = appState.currentLocation;
            if (!origin) {
                // Fallback to Salalah if current location not available
                origin = { lat: 17.0151, lng: 54.0924 };
                showMessageBox('تعذر الحصول على موقعك الحالي، سيتم استخدام صلالة كنقطة بداية.');
            }

            const request = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            };

            try {
                const response = await directionsService.route(request);
                if (response.status === 'OK') {
                    directionsRenderer.setDirections(response);
                    appState.destinationSet = true; // Mark destination as set
                    updateUI(); // Update floating button visibility

                    const route = response.routes[0].legs[0];
                    etaDisplay.textContent = route.duration.text;
                    distanceDisplay.textContent = route.distance.text;
                } else {
                    showMessageBox('تعذر العثور على اتجاهات للوجهة المحددة: ' + response.status);
                    etaDisplay.textContent = '--';
                    distanceDisplay.textContent = '--';
                    appState.destinationSet = false; // Reset destination status
                    updateUI();
                }
            } catch (error) {
                console.error('Error calculating directions:', error);
                showMessageBox('حدث خطأ أثناء حساب الاتجاهات. يرجى التحقق من الوجهة.');
                etaDisplay.textContent = '--';
                distanceDisplay.textContent = '--';
                appState.destinationSet = false; // Reset destination status
                updateUI();
            }
        }

        /**
         * Toggles the visibility of the traffic layer on the full map.
         */
        function toggleTrafficLayer() {
            if (trafficLayerFullMap) {
                if (isTrafficLayerEnabled) {
                    trafficLayerFullMap.setMap(null); // Hide traffic layer
                    toggleTrafficButton.textContent = 'إظهار حركة المرور';
                    toggleTrafficButton.classList.remove('bg-blue-600');
                    toggleTrafficButton.classList.add('bg-gray-700');
                } else {
                    trafficLayerFullMap.setMap(fullGoogleMap); // Show traffic layer
                    toggleTrafficButton.textContent = 'إخفاء حركة المرور';
                    toggleTrafficButton.classList.remove('bg-gray-700');
                    toggleTrafficButton.classList.add('bg-blue-600');
                }
                isTrafficLayerEnabled = !isTrafficLayerEnabled;
                lucide.createIcons(); // Re-render Lucide icons
            }
        }
        
        // --- Weather API Integration ---

        /**
         * Fetches live weather data from WeatherAPI.com and updates appState.
         */
        async function fetchWeatherData() {
            if (WEATHER_API_KEY === 'YOUR_WEATHERAPI_KEY') {
                showMessageBox('خطأ: لم يتم تعيين مفتاح WeatherAPI. يرجى استبدال "YOUR_WEATHERAPI_KEY" بمفتاحك الخاص.');
                console.error('WeatherAPI Key is not set.');
                // Fallback to default or clear data on API key error
                appState.weather.temperature = '--';
                appState.weather.feelsLike = '--';
                appState.weather.description = 'خطأ في مفتاح API';
                appState.weather.humidity = '--';
                appState.weather.wind = '--';
                appState.weather.pressure = '--';
                appState.weather.visibility = '--';
                appState.weather.uvIndex = '--';
                appState.weather.iconUrl = '';
                appState.weather.lastUpdated = '--';
                updateUI();
                return;
            }

            const location = appState.weather.location.split(',')[0].trim();
            const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location}&lang=ar`; 

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    // Check for 401 specifically
                    if (response.status === 401) {
                        throw new Error(`خطأ في مصادقة API (401). يرجى التحقق من مفتاح WeatherAPI الخاص بك.`);
                    }
                    throw new Error(`خطأ HTTP! الحالة: ${response.status}`);
                }
                const data = await response.json();

                appState.weather.temperature = data.current.temp_c;
                appState.weather.feelsLike = data.current.feelslike_c;
                appState.weather.description = data.current.condition.text;
                appState.weather.humidity = data.current.humidity;
                appState.weather.wind = data.current.wind_kph;
                appState.weather.pressure = data.current.pressure_mb;
                appState.weather.visibility = data.current.vis_km; // Correctly assign here
                appState.weather.uvIndex = data.current.uv;
                // Correctly set the icon URL
                appState.weather.iconUrl = `https:${data.current.condition.icon}`; 
                
                const now = new Date();
                appState.weather.lastUpdated = `آخر تحديث: ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}`;
                appState.weather.location = `${data.location.name}, ${data.location.country}`;

            } catch (error) {
                console.error('Error fetching weather data:', error);
                showMessageBox(`تعذر جلب بيانات الطقس: ${error.message}. يرجى التحقق من مفتاح API والموقع.`);
                // Fallback to default or clear data on error
                appState.weather.temperature = '--';
                appState.weather.feelsLike = '--';
                appState.weather.description = 'خطأ في التحميل';
                appState.weather.humidity = '--';
                appState.weather.wind = '--';
                appState.weather.pressure = '--';
                appState.weather.visibility = '--';
                appState.weather.uvIndex = '--';
                appState.weather.iconUrl = '';
                appState.weather.lastUpdated = '--';
            } finally {
                updateUI(); // Always update UI, even on error
            }
        }

        // --- Simulated Car Data (for AI Assistant) ---
        /**
         * Generates random simulated car data.
         */
        function simulateCarData() {
            appState.car.speed = (Math.random() * 120).toFixed(0); // 0-120 km/h
            appState.car.rpm = (Math.random() * (5000 - 800) + 800).toFixed(0); // 800-5000 RPM
            appState.car.fuel = (Math.random() * 100).toFixed(0); // 0-100%
            appState.car.temp = (Math.random() * (100 - 70) + 70).toFixed(1); // 70-100 C
            const gears = ['P', 'R', 'N', 'D'];
            appState.car.gear = gears[Math.floor(Math.random() * gears.length)];
        }

        // --- Prayer Times Integration ---
        // Prayer times data provided by the user
        const prayerTimes = [
    {"date":"2025-11-01","day":"السبت","fajr":"05:08","sunrise":"06:22","dhuhr":"12:12","asr":"03:31","maghrib":"05:58","isha":"07:06"},
    {"date":"2025-11-02","day":"الأحد","fajr":"05:08","sunrise":"06:22","dhuhr":"12:12","asr":"03:30","maghrib":"05:57","isha":"07:06"},
    {"date":"2025-11-03","day":"الإثنين","fajr":"05:09","sunrise":"06:23","dhuhr":"12:12","asr":"03:30","maghrib":"05:57","isha":"07:06"},
    {"date":"2025-11-04","day":"الثلاثاء","fajr":"05:09","sunrise":"06:23","dhuhr":"12:12","asr":"03:30","maghrib":"05:57","isha":"07:05"},
    {"date":"2025-11-05","day":"الأربعاء","fajr":"05:09","sunrise":"06:23","dhuhr":"12:12","asr":"03:30","maghrib":"05:56","isha":"07:05"},
    {"date":"2025-11-06","day":"الخميس","fajr":"05:10","sunrise":"06:24","dhuhr":"12:12","asr":"03:30","maghrib":"05:56","isha":"07:05"},
    {"date":"2025-11-07","day":"الجمعة","fajr":"05:10","sunrise":"06:24","dhuhr":"12:12","asr":"03:29","maghrib":"05:55","isha":"07:04"},
    {"date":"2025-11-08","day":"السبت","fajr":"05:10","sunrise":"06:25","dhuhr":"12:12","asr":"03:29","maghrib":"05:55","isha":"07:04"},
    {"date":"2025-11-09","day":"الأحد","fajr":"05:11","sunrise":"06:25","dhuhr":"12:12","asr":"03:29","maghrib":"05:55","isha":"07:04"},
    {"date":"2025-11-10","day":"الإثنين","fajr":"05:11","sunrise":"06:26","dhuhr":"12:13","asr":"03:29","maghrib":"05:55","isha":"07:04"},
    {"date":"2025-11-11","day":"الثلاثاء","fajr":"05:12","sunrise":"06:26","dhuhr":"12:13","asr":"03:29","maghrib":"05:54","isha":"07:04"},
    {"date":"2025-11-12","day":"الأربعاء","fajr":"05:12","sunrise":"06:27","dhuhr":"12:13","asr":"03:29","maghrib":"05:54","isha":"07:04"},
    {"date":"2025-11-13","day":"الخميس","fajr":"05:12","sunrise":"06:27","dhuhr":"12:13","asr":"03:29","maghrib":"05:54","isha":"07:03"},
    {"date":"2025-11-14","day":"الجمعة","fajr":"05:13","sunrise":"06:28","dhuhr":"12:13","asr":"03:29","maghrib":"05:54","isha":"07:03"},
    {"date":"2025-11-15","day":"السبت","fajr":"05:13","sunrise":"06:28","dhuhr":"12:13","asr":"03:29","maghrib":"05:53","isha":"07:03"},
    {"date":"2025-11-16","day":"الأحد","fajr":"05:13","sunrise":"06:29","dhuhr":"12:13","asr":"03:29","maghrib":"05:53","isha":"07:03"},
    {"date":"2025-11-17","day":"الإثنين","fajr":"05:14","sunrise":"06:29","dhuhr":"12:14","asr":"03:28","maghrib":"05:53","isha":"07:03"},
    {"date":"2025-11-18","day":"الثلاثاء","fajr":"05:14","sunrise":"06:30","dhuhr":"12:14","asr":"03:28","maghrib":"05:53","isha":"07:03"},
    {"date":"2025-11-19","day":"الأربعاء","fajr":"05:15","sunrise":"06:30","dhuhr":"12:14","asr":"03:28","maghrib":"05:53","isha":"07:03"}
];


        /**
         * Adds minutes to a given time string.
         * @param {string} timeStr - The time string in "HH:MM" format.
         * @param {number} minutesToAdd - The number of minutes to add.
         * @returns {string} The new time string in "HH:MM" format.
         */
        function addMinutes(timeStr, minutesToAdd) {
            const [hour, minute] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(hour);
            date.setMinutes(minute + minutesToAdd);
            date.setSeconds(0); // Ensure seconds are 0 for consistent iqama time
            date.setMilliseconds(0); // Ensure milliseconds are 0
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        /**
         * Converts a time string (HH:MM) to a Date object for the current day.
         * @param {string} timeStr - The time string in "HH:MM" format.
         * @returns {Date} A Date object representing the time on the current day.
         */
        function timeToDate(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const now = new Date();
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
            return date;
        }

        /**
         * Loads prayer times for the current day from the local `prayerTimes` array.
         */
        function loadPrayerTimes() {
            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            const data = prayerTimes.find(p => p.date === today);

            if (data) {
                appState.prayerTimes.Fajr = data.fajr;
                appState.prayerTimes.Dhuhr = data.dhuhr;
                appState.prayerTimes.Asr = data.asr;
                appState.prayerTimes.Maghrib = data.maghrib;
                appState.prayerTimes.Isha = data.isha;

                // Update display elements
                fajrTimeElement.textContent = data.fajr;
                dhuhrTimeElement.textContent = data.dhuhr;
                asrTimeElement.textContent = data.asr;
                maghribTimeElement.textContent = data.maghrib;
                ishaTimeElement.textContent = data.isha;

                fajrIqamaElement.textContent = 'الإقامة: ' + addMinutes(data.fajr, 25); // 5 mins for Fajr
                dhuhrIqamaElement.textContent = 'الإقامة: ' + addMinutes(data.dhuhr, 20); // 5 mins for Dhuhr
                asrIqamaElement.textContent = 'الإقامة: ' + addMinutes(data.asr, 20); // 10 mins for Asr
                maghribIqamaElement.textContent = 'الإقامة: ' + addMinutes(data.maghrib, 5); // 5 mins for Maghrib
                ishaIqamaElement.textContent = 'الإقامة: ' + addMinutes(data.isha, 20); // 5 mins for Isha

            } else {
                console.warn('No prayer times found for today in the local data.');
                // Clear display if no data for today
                fajrTimeElement.textContent = '--:--';
                dhuhrTimeElement.textContent = '--:--';
                asrTimeElement.textContent = '--:--';
                maghribTimeElement.textContent = '--:--';
                ishaTimeElement.textContent = '--:--';
                fajrIqamaElement.textContent = '';
                dhuhrIqamaElement.textContent = '';
                asrIqamaElement.textContent = '';
                maghribIqamaElement.textContent = '';
                ishaIqamaElement.textContent = '';
            }
            determineNextPrayer(); // Re-determine next prayer after loading new times
            renderPrayerTimes(); // Always re-render to apply current prayer highlight
        }

        /**
         * Determines the next prayer time and updates appState.
         */
        function determineNextPrayer() {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const todayData = prayerTimes.find(p => p.date === today);

            if (!todayData) {
                appState.prayerTimes.nextPrayer = null;
                appState.prayerTimes.nextPrayerIqamaTime = null;
                appState.prayerTimes.currentPrayer = null;
                return;
            }

            const prayers = [
                { name: "الفجر", time: todayData.fajr, iqamaOffset: 25 },
                { name: "الظهر", time: todayData.dhuhr, iqamaOffset: 20 },
                { name: "العصر", time: todayData.asr, iqamaOffset: 20 },
                { name: "المغرب", time: todayData.maghrib, iqamaOffset: 5 },
                { name: "العشاء", time: todayData.isha, iqamaOffset: 20 }
            ];

            let nextPrayerFound = false;
            appState.prayerTimes.currentPrayer = null; // Reset current prayer

            for (let i = 0; i < prayers.length; i++) {
                const prayer = prayers[i];
                const prayerTimeDate = timeToDate(prayer.time);
                const iqamaTimeDate = timeToDate(addMinutes(prayer.time, prayer.iqamaOffset));

                // Check if current time is between prayer time and iqama time
                if (now >= prayerTimeDate && now < iqamaTimeDate) {
                    appState.prayerTimes.currentPrayer = prayer.name;
                    appState.prayerTimes.nextPrayer = prayer.name; // Next "event" is iqama for current prayer
                    appState.prayerTimes.nextPrayerIqamaTime = iqamaTimeDate;
                    nextPrayerFound = true;
                    break;
                }
                // Check if current time is between iqama time and (iqama time + grace period)
                const gracePeriod = (prayer.name === "العصر") ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10 mins for Asr, 5 for others
                const afterIqamaGracePeriod = new Date(iqamaTimeDate.getTime() + gracePeriod);

                if (now >= iqamaTimeDate && now < afterIqamaGracePeriod) {
                    appState.prayerTimes.currentPrayer = prayer.name; // Still current prayer
                    appState.prayerTimes.nextPrayer = prayer.name; // Next "event" is end of grace period
                    appState.prayerTimes.nextPrayerIqamaTime = afterIqamaGracePeriod; // Use grace period end as next event
                    nextPrayerFound = true;
                    break;
                }

                // If current time is before prayer time, this is the next prayer
                if (now < prayerTimeDate && !nextPrayerFound) {
                    appState.prayerTimes.nextPrayer = prayer.name;
                    appState.prayerTimes.nextPrayerIqamaTime = prayerTimeDate; // Next event is Azan time
                    nextPrayerFound = true;
                    break;
                }
            }

            // If no next prayer found for today (all passed), set next prayer to Fajr of next day
            if (!nextPrayerFound) {
                const nextDay = new Date(now);
                nextDay.setDate(now.getDate() + 1);
                const nextDayString = nextDay.toISOString().split('T')[0];
                const nextDayData = prayerTimes.find(p => p.date === nextDayString);

                if (nextDayData) {
                    const fajrTimeDate = timeToDate(nextDayData.fajr);
                    fajrTimeDate.setDate(nextDay.getDate()); // Ensure it's for the next day

                    appState.prayerTimes.nextPrayer = "الفجر (غدًا)";
                    appState.prayerTimes.nextPrayerIqamaTime = fajrTimeDate;
                    appState.prayerTimes.currentPrayer = null; // No current prayer if all passed
                } else {
                    // Fallback if next day's data is also not found
                    appState.prayerTimes.nextPrayer = null;
                    appState.prayerTimes.nextPrayerIqamaTime = null;
                    appState.prayerTimes.currentPrayer = null;
                }
            }
            renderPrayerTimes(); // Re-render to update highlight
        }

        /**
         * Renders the prayer times in the dashboard.
         */
        function renderPrayerTimes() {
            if (!prayerTimesContainer) return;

            // Clear previous highlights
            document.querySelectorAll('.prayer-time-item').forEach(item => {
                item.classList.remove('current-prayer', 'next-prayer');
            });

            // Mapping from English prayer names (in appState) to Arabic display names (in HTML)
            const prayerNameMap = {
                Fajr: 'الفجر',
                Dhuhr: 'الظهر',
                Asr: 'العصر',
                Maghrib: 'المغرب',
                Isha: 'العشاء',
                "الفجر (غدًا)": 'الفجر' // Special case for next day's Fajr
            };

            // Apply highlight to current prayer
            if (appState.prayerTimes.currentPrayer) {
                const currentPrayerArabicName = prayerNameMap[appState.prayerTimes.currentPrayer];
                if (currentPrayerArabicName) {
                    const prayerItems = document.querySelectorAll('.prayer-time-item');
                    prayerItems.forEach(item => {
                        const prayerNameSpan = item.querySelector('.prayer-name');
                        if (prayerNameSpan && prayerNameSpan.textContent.trim() === currentPrayerArabicName) {
                            item.classList.add('current-prayer');
                        }
                    });
                }
            }

            // Apply highlight to next prayer (if different from current, or if no current)
            if (appState.prayerTimes.nextPrayer && appState.prayerTimes.nextPrayer !== appState.prayerTimes.currentPrayer) {
                const nextPrayerArabicName = prayerNameMap[appState.prayerTimes.nextPrayer];
                if (nextPrayerArabicName) {
                    const prayerItems = document.querySelectorAll('.prayer-time-item');
                    prayerItems.forEach(item => {
                        const prayerNameSpan = item.querySelector('.prayer-name');
                        if (prayerNameSpan && prayerNameSpan.textContent.trim().startsWith(nextPrayerArabicName) && !item.classList.contains('current-prayer')) {
                            item.classList.add('next-prayer');
                        }
                    });
                }
            }
        }

        // --- Digital Clock JavaScript (Apple iOS 19 style) ---
        /**
         * Updates the digital clock and date display.
         */
        function updateDigitalClock() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');

            // Convert to 12-hour format without AM/PM
            hours = hours % 12;
            hours = hours ? hours : 12; // The hour '0' (midnight) should be '12'

            // Update digital time with opacity
            if (digitalHoursSpan && digitalMinutesSpan && digitalSecondsSpan) {
                digitalHoursSpan.textContent = hours.toString().padStart(2, '0');
                digitalMinutesSpan.textContent = minutes;
                digitalSecondsSpan.textContent = seconds;
            }

            // Update countdown for next prayer's Iqama
            if (digitalDateLine1 && digitalDateLine2) {
                // Clear previous highlights
                digitalDateLine1.classList.remove('countdown-highlight', 'countdown-medium-highlight');
                digitalDateLine2.classList.remove('countdown-highlight', 'countdown-medium-highlight');
                digitalDateLine1.style.color = 'white'; // Default to white
                digitalDateLine2.style.color = 'white'; // Default to white

                if (appState.prayerTimes.nextPrayerIqamaTime) {
                    const timeDiff = appState.prayerTimes.nextPrayerIqamaTime.getTime() - now.getTime(); // Time remaining in ms
                    const totalSeconds = Math.floor(timeDiff / 1000);

                    // Determine if it's an Azan time, Iqama time, or after Iqama
                    const today = now.toISOString().split('T')[0];
                    const todayData = prayerTimes.find(p => p.date === today);
                    let currentPrayerAzanTime = null;
                    let currentPrayerIqamaTime = null;
                    let gracePeriodDuration = 0;

                    if (appState.prayerTimes.currentPrayer && todayData) {
                        const prayerData = {
                            "الفجر": { time: todayData.fajr, iqamaOffset: 25, grace: 5 },
                            "الظهر": { time: todayData.dhuhr, iqamaOffset: 20, grace: 5 },
                            "العصر": { time: todayData.asr, iqamaOffset: 20, grace: 10 },
                            "المغرب": { time: todayData.maghrib, iqamaOffset: 5, grace: 5 },
                            "العشاء": { time: todayData.isha, iqamaOffset: 20, grace: 25 }
                        }[appState.prayerTimes.currentPrayer];

                        if (prayerData) {
                            currentPrayerAzanTime = timeToDate(prayerData.time);
                            currentPrayerIqamaTime = timeToDate(addMinutes(prayerData.time, prayerData.iqamaOffset));
                            gracePeriodDuration = prayerData.grace * 60 * 1000;
                        }
                    }

                    if (currentPrayerAzanTime && now >= currentPrayerAzanTime && now < currentPrayerIqamaTime) {
                        // After Azan, before Iqama (countdown to Iqama)
                        const remainingToIqama = Math.floor((currentPrayerIqamaTime.getTime() - now.getTime()) / 1000);
                        const displayMinutes = Math.floor(remainingToIqama / 60);
                        const displaySeconds = remainingToIqama % 60;
                        digitalDateLine1.textContent = `إقامة صلاة ${appState.prayerTimes.currentPrayer} في:`;
                        digitalDateLine2.textContent = `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                        digitalDateLine1.style.color = '#7eff7e'; // Chrome Green
                        digitalDateLine2.style.color = '#7eff7e'; // Chrome Green
                    } else if (currentPrayerIqamaTime && now >= currentPrayerIqamaTime && now < (currentPrayerIqamaTime.getTime() + gracePeriodDuration)) {
                        // After Iqama, during grace period (count up)
                        const elapsedSinceIqama = Math.floor((now.getTime() - currentPrayerIqamaTime.getTime()) / 1000);
                        const displayMinutes = Math.floor(elapsedSinceIqama / 60);
                        const displaySeconds = elapsedSinceIqama % 60;
                        digitalDateLine1.textContent = `انتهت إقامة صلاة ${appState.prayerTimes.currentPrayer} منذ:`;
                        digitalDateLine2.textContent = `+${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                        digitalDateLine1.style.color = '#7eff7e'; // Chrome Green
                        digitalDateLine2.style.color = '#7eff7e'; // Chrome Green
                    }
                    else if (totalSeconds <= 0) {
                        // If next prayer time has passed, re-determine next prayer
                        determineNextPrayer();
                    }
                    else {
                        // Counting down to next Azan
                        const displayHours = Math.floor(totalSeconds / 3600);
                        const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
                        const displaySeconds = totalSeconds % 60;

                        let countdownText = '';
                        if (displayHours > 0) {
                            countdownText = `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                        } else {
                            countdownText = `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                        }
                        
                        digitalDateLine1.textContent = `الأذان القادم: ${appState.prayerTimes.nextPrayer}`;
                        digitalDateLine2.textContent = ` ${countdownText}`;

                        // Apply highlight based on time remaining
                        if (totalSeconds < 60 * 60) { // Less than 1 hour
                            digitalDateLine1.style.color = '#FFA07A'; // Light Orange
                            digitalDateLine2.style.color = '#FFA07A'; // Light Orange
                        } else {
                            digitalDateLine1.style.color = 'white'; // White
                            digitalDateLine2.style.color = 'white'; // White
                        }
                    }
                } else {
                    digitalDateLine1.textContent = 'جاري تحميل أوقات الصلاة...';
                    digitalDateLine2.textContent = '';
                }
            }
        }

        // --- 360 Camera Image Upload Functions ---
        /**
         * Handles the file input change event to upload a new 360 camera image.
         */
        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    appState.custom360Image = e.target.result;
                    localStorage.setItem('custom360Image', e.target.result); // Save to local storage
                    updateUI(); // Update the image on the UI
                    showMessageBox('تم تحميل الصورة بنجاح!');
                };
                reader.onerror = () => {
                    showMessageBox('حدث خطأ أثناء قراءة الملف.');
                };
                reader.readAsDataURL(file);
            }
        }

        /**
         * Resets the 360 camera image to its default.
         */
        function resetImageToDefault() {
            appState.custom360Image = null; // Clear custom image from state
            localStorage.removeItem('custom360Image'); // Remove from local storage
            updateUI(); // Update the image on the UI
            showMessageBox('تم إعادة تعيين الصورة إلى الافتراضية.');
        }

        // --- Initial Setup and Event Listeners on DOM Load ---
        document.addEventListener('DOMContentLoaded', () => {
            // Get DOM element references that are only available after DOMContentLoaded
            const getMyLocationButtonDashboard = document.getElementById('get-my-location-button-dashboard');
            
            // Attach event listeners
            if (getMyLocationButtonDashboard) {
                getMyLocationButtonDashboard.addEventListener('click', () => centerMapOnUserLocation('dashboard'));
            }
            if (floatingFullscreenButton) {
                floatingFullscreenButton.addEventListener('click', togglePseudoFullscreen);
            }
            if (floatingMediaButton) {
                floatingMediaButton.addEventListener('click', () => switchApp('Media'));
            }

            // Map screen specific event listeners
            if (startDirectionsButton) {
                startDirectionsButton.addEventListener('click', calculateAndDisplayRoute);
            }
            if (getMyLocationButtonFullMap) {
                getMyLocationButtonFullMap.addEventListener('click', () => centerMapOnUserLocation('full'));
            }
            if (toggleTrafficButton) {
                toggleTrafficButton.addEventListener('click', toggleTrafficLayer);
            }
            if (startTripFloatingButton) {
                startTripFloatingButton.addEventListener('click', () => {
                    if (appState.destinationSet) {
                        calculateAndDisplayRoute(); // Re-calculate route if needed
                        showMessageBox('بدء الرحلة إلى الوجهة المحددة!');
                    } else {
                        showMessageBox('الرجاء تحديد وجهة أولاً لبدء الرحلة.');
                    }
                });
            }

            // 360 Camera Image Upload Listeners
            if (upload360ImageButton) {
                upload360ImageButton.addEventListener('click', () => upload360ImageInput.click());
            }
            if (upload360ImageInput) {
                upload360ImageInput.addEventListener('change', handleImageUpload);
            }
            if (reset360ImageButton) {
                reset360ImageButton.addEventListener('click', resetImageToDefault);
            }

            // Initial and periodic updates
            updateUI(); // This will call loadPrayerTimes etc.
            fetchWeatherData();
            setInterval(fetchWeatherData, 300000); // Update weather every 5 minutes (300,000 ms)
            setInterval(updateDigitalClock, 1000); // Update clock and countdown every second
            updateDigitalClock();
            loadPrayerTimes(); // Load prayer times from local array
            simulateCarData(); // Initial simulated car data
            setInterval(simulateCarData, 5000); // Update simulated car data every 5 seconds
            
            // Set initial app to Dashboard
            switchApp('Dashboard');

            // Google Map initialization is handled by the `callback=initMap` in the script tag
            // No need to call initMap() or startLocationTracking() here directly.
        });
