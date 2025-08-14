import React, { useState, useEffect, useRef, useCallback } from 'react';

// This component injects the necessary global styles into the document head.
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(-45deg, #000000 0%, #000000 30%, #00FFFF 35%, #000000 60%, #4B0082 65%, #8A2BE2 70%, #FF00FF 75%, #000000 100%);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          transition: background-image 0.5s ease;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
      }
      @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      .glass-surface {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 0.26s ease-out;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      }
      .navigable:focus, .navigable.tv-focus {
          outline: 3px solid #0A84FF !important;
          box-shadow: 0 0 20px rgba(10, 132, 255, 0.7) !important;
          transform: scale(1.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .app-screen { display: none; animation: fadeIn 0.5s ease-in-out; width: 100%; height: 100%; flex-direction: column; border-radius: 1.5rem; }
      .app-screen.active { display: flex; }
      @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      .full-iframe { width: 100%; height: 100%; border: none; border-radius: 1.5rem; }
      .app-icon { color: white; }
      .app-icon.active { background-color: #6b22ff; color: white; transform: scale(1.1); }
      #digital-time { font-size: 2.2rem; font-weight: 800; color: white; margin-bottom: 0.5rem; display: flex; align-items: baseline; gap: 0.2rem; direction: ltr; }
      #digital-time span { transition: opacity 0.3s ease; }
      #digital-time .hours { opacity: 1; }
      #digital-time .minutes { opacity: 0.8; }
      #digital-time .seconds { opacity: 0.4; }
      #digital-date { font-size: 1.2rem; color: rgb(255 255 255 / 99%); font-weight: bold; text-align: center; line-height: 1.4; }
      #digital-date.countdown-highlight { font-size: 1.7rem; color: #90EE90; font-weight: bold; }
      #digital-date.countdown-medium-highlight { font-size: 1.7rem; color: #FFA07A; font-weight: bold; }
      .prayer-times-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; width: 100%; margin-top: 1rem; }
      .prayer-time-item { display: flex; flex-direction: column; align-items: center; padding: 0.5rem 0.75rem; background-color: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; font-size: 0.9rem; min-width: 80px; text-align: center; transition: background-color 0.3s ease; }
      .prayer-time-item.current-prayer { background-color: rgba(16, 185, 129, 0.4); font-weight: bold; border: 1px solid #10B981; }
      .prayer-time-item.next-prayer { background-color: rgba(251, 146, 60, 0.3); border: 1px solid #fb923c; }
      .prayer-name { color: rgba(255, 255, 255, 0.7); font-size: 0.8rem; margin-bottom: 0.2rem; }
      .prayer-time { color: white; font-size: 1rem; }
      .youtube-channel-card { cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.4rem; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; aspect-ratio: 1 / 1; width: 100%; box-sizing: border-box; }
      .youtube-channel-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
      .youtube-channel-card img { width: 85%; height: 85%; object-fit: cover; border-radius: 1rem; margin-bottom: 0.4rem; border: 2px solid rgba(255,255,255,0.3); }
      .youtube-channel-card h2 { font-size: 0.8rem; font-weight: 600; color: white; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95%; }
      .youtube-video-card { cursor: pointer; display: flex; flex-direction: row; align-items: center; padding: 0.5rem; border-radius: 0.75rem; background-color: rgba(255, 255, 255, 0.05); transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out; width: 100%; box-sizing: border-box; }
      .youtube-video-card:hover { background-color: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
      .youtube-video-card img { width: 100px; height: 56.25px; object-fit: cover; border-radius: 0.5rem; margin-left: 0.75rem; flex-shrink: 0; }
      .youtube-video-card h3 { font-size: 0.9rem; font-weight: 500; color: white; line-height: 1.3; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .reader-container { display: flex; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 1rem; gap: 0.75rem; direction: ltr; }
      .reader-container::-webkit-scrollbar { display: none; }
      .youtube-reader-card { cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5rem; transition: all 0.2s ease-in-out; border-radius: 1rem; background-color: rgba(255, 255, 255, 0.05); flex-shrink: 0; }
      .youtube-reader-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); background-color: rgba(255, 255, 255, 0.1); }
      .youtube-reader-card img { width: 64px; height: 64px; object-fit: cover; border-radius: 50%; margin-bottom: 0.5rem; border: 2px solid rgba(255,255,255,0.3); }
      .youtube-reader-card h3 { font-size: 0.8rem; font-weight: 600; color: white; text-align: center; }
      .youtube-reader-card.selected { background-color: #9333ea !important; box-shadow: 0 0 15px rgba(147, 51, 234, 0.8); transform: translateY(-5px) scale(1.05); }
      .youtube-suggestion-button { color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.85rem; font-weight: bold; transition: all 0.2s ease; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; }
      .youtube-suggestion-button:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
      .youtube-suggestion-category-tag { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; color: white; margin-bottom: 0.5rem; align-self: flex-start; }
      #video-popup-container { position: fixed; bottom: 6rem; right: 1rem; width: 320px; height: 180px; background-color: rgba(0, 0, 0, 0.9); border-radius: 1rem; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); z-index: 110; display: none; flex-direction: column; overflow: hidden; }
      #video-popup-container.active { display: flex; }
      .video-popup-controls { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.5rem; z-index: 120; }
      .video-popup-controls button { background-color: rgba(0, 0, 0, 0.6); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; cursor: pointer; transition: background-color 0.2s; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
};

// --- Helper Components ---
const Icon = ({ name, className }) => {
    const icons = {
        'layout-grid': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>,
        'music': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>,
        'radio': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path></svg>,
        'users': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        'cloud-sun': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M20 12h2"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M12 20v2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="M4 12H2"></path><path d="m6.34 6.34-1.41-1.41"></path><path d="M16 20a4 4 0 0 0-8 0"></path><path d="M12 12a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4Z"></path></svg>,
        'book-open': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
        'search': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
        'x': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
        'wifi': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>,
        'map-pin': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
        'upload': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
        'rotate-ccw': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
        'thermometer': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path></svg>,
        'sun': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>,
        'sparkles': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 21l1.9-5.8 5.8-1.9-5.8-1.9L12 3z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>,
    };
    return <span className={className}>{icons[name]}</span>;
};

const AppIcon = ({ appName, icon, activeApp, onSwitch }) => {
    const isActive = activeApp === appName;
    return (
        <button
            data-app={appName}
            onClick={() => onSwitch(appName)}
            className={`app-icon navigable w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out ${isActive ? 'active' : ''}`}
            tabIndex="0"
        >
            {appName === 'Map' ? (
                 <img src="https://dmusera.netlify.app/Lexus-Logo.wine.svg" alt="Lexus" className="w-12 h-12" style={{ filter: 'invert(1) brightness(2)' }}/>
            ) : (
                <Icon name={icon} />
            )}
        </button>
    );
};

const DigitalClock = ({ prayerTimes }) => { /* ... */ };
const VideoPopup = ({ videoId, onClose }) => { /* ... */ };

// --- Screen Components ---
const DashboardScreen = ({ weather, prayerTimes }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (window.google && mapRef.current && !mapInstance.current) {
            const mapOptions = { center: { lat: 17.0151, lng: 54.0924 }, zoom: 17, disableDefaultUI: true, zoomControl: true };
            mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);
            new window.google.maps.Marker({ position: mapOptions.center, map: mapInstance.current, icon: { url: 'https://dmusera.netlify.app/3605.png', scaledSize: new window.google.maps.Size(90, 90) } });
        }
    }, []);

    return (
        <section className="p-4 md:p-6 flex-col h-full w-full">
            <div className="dashboard-main-grid grid grid-cols-1 md:grid-cols-3 grid-rows-[80%_20%] gap-4 md:gap-6 h-full w-full grid-container">
                <div className="glass-surface rounded-3xl p-1 col-span-1 row-start-1 navigable" tabIndex="0">
                    <div ref={mapRef} className="full-iframe"></div>
                    <button className="absolute bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors duration-200 flex items-center gap-2 text-sm navigable" tabIndex="0">
                        <Icon name="map-pin" className="w-6 h-6" /> تحديث الموقع
                    </button>
                </div>
                <div className="glass-surface p-2 flex-col items-center justify-center text-center col-span-1 row-start-1 navigable" tabIndex="0">
                    <img src="https://dmusera.netlify.app/es350gb.png" alt="Car 360 View" className="w-full h-full object-contain rounded-lg opacity-80" />
                    <div className="absolute bottom-4 flex gap-2">
                         <button className="navigable bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1" tabIndex="0"><Icon name="upload" className="w-4 h-4" /> تحميل صورة</button>
                         <button className="navigable bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1" tabIndex="0"><Icon name="rotate-ccw" className="w-4 h-4" /> إعادة تعيين</button>
                    </div>
                </div>
                <div className="flex flex-col gap-4 md:gap-6 col-span-1 row-start-1 grid-container">
                    <div className="glass-surface p-4 flex-grow flex-col items-center justify-center text-center navigable" tabIndex="0">
                        <h2 className="text-xl font-bold mb-1">الطقس</h2>
                        <img src={weather.iconUrl || 'https://placehold.co/64x64/000000/FFFFFF?text=X'} alt="Weather" className="w-16 h-16 mb-2" />
                        <p className="text-3xl font-extrabold mb-1">{weather.temperature ? `${Math.round(weather.temperature)}°C` : '--°C'}</p>
                        <p className="text-lg text-white/70 mb-2">{weather.description || '--'}</p>
                        <p className="text-sm text-white/50">{weather.location}</p>
                    </div>
                    <div className="glass-surface p-4 flex-grow flex-col items-center justify-center text-center navigable" tabIndex="0">
                        <DigitalClock prayerTimes={prayerTimes} />
                    </div>
                </div>
                <div className="glass-surface p-4 flex-col items-center justify-center text-center col-span-full row-start-2 navigable" tabIndex="0">
                    <div className="prayer-times-row grid-container">
                        {prayerTimes.Fajr !== '--:--' ? (
                            ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => {
                                const prayerNames = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
                                const isCurrent = prayerTimes.currentPrayer === prayerNames[p];
                                const isNext = prayerTimes.nextPrayer === prayerNames[p] && !isCurrent;
                                return (
                                    <div key={p} className={`prayer-time-item ${isCurrent ? 'current-prayer' : ''} ${isNext ? 'next-prayer' : ''}`}>
                                        <span className="prayer-name">{prayerNames[p]}</span>
                                        <span className="prayer-time">{prayerTimes[p]}</span>
                                    </div>
                                );
                            })
                        ) : <p className="text-white/70">جاري تحميل أوقات الصلاة...</p>}
                    </div>
                </div>
            </div>
        </section>
    );
};

const MediaScreen = ({ showVideoPopup }) => {
    const [view, setView] = useState('main'); // 'main', 'videoList', 'searchResults'
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [playlistTitle, setPlaylistTitle] = useState('');
    const [selectedReader, setSelectedReader] = useState('');

    const YOUTUBE_API_KEY = 'AIzaSyDj4w1H3Is_rmTLhl40zER7AgYhT_tKASo';

    const playlists = [
        { id: 'UUlncV9OLPto_MinRzGfjr2g', title: 'تلاوات ياسر الدوسري', img: 'https://yt3.googleusercontent.com/ZpoYv5FstgResXDeuqEhkce079N0fM3UC5cmjGFBbKSPQI7tDXfl5W_vib_X2Q_hy5ipbZl4Fw=s160-c-k-c0x00ffffff-no-rj' },
        { id: 'UUFPqvE8BYiiUeN1AUXa3lbA', title: 'الشيخ محمد ايوب', img: 'https://imgs.search.brave.com/-WtPBvI7AmvUdQ2X1oZpk6wlNV-PlUSktoA9JVVQL3o/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMuc3VyYXRtcDMu/Y29tL3BpY3MvcmVj/aXRlcnMvdGh1bWJz/LzM3XzE2MF8xNjAu/anBn' },
        { id: 'UUy0WYogELm9hEjulWPeYOJg', title: 'مزامير القرآن', img: 'https://yt3.googleusercontent.com/jE4NSU3a46l5ZI5rTvaq2Jvk_TWWS3GtPhs4qchBQagGTeypLWC1V3ewrcE1xbMOgkZaHGGNWA=s160-c-k-c0x00ffffff-no-rj' },
    ];
    
    const youtubeReaderSuggestions = [{"name":"محمد ايوب","image":"https://dmusera.netlify.app/512px-Muhammad_Ayyub.webp"},{"name":"فارس عنتر","image":"https://dmusera.netlify.app/faresantar.jpg"},{"name":"علي جابر","image":"https://dmusera.netlify.app/ali-jaber.webp"},{"name":"عبد الباسط عبد الصمد","image":"https://dmusera.netlify.app/abdulbaset-abdulsamad.jpeg"},{"name":"مشاري العفاسي","image":"https://dmusera.netlify.app/512px-%D0%9C%D0%B8%D1%88%D0%B0%D1%80%D0%B8_%D0%A0%D0%B0%D1%88%D0%B8%D0%B4.webp"},{"name":"احمد النفيس","image":"https://dmusera.netlify.app/ahmednafes.jpg"},{"name":"ياسر الدوسري","image":"https://dmusera.netlify.app/Yasser_Al-Dosari.jpg"}];
    const youtubeSurahSuggestions = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","جزء عم"];

    const fetchVideos = useCallback(async (playlistId) => {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=20`);
            const data = await res.json();
            setVideos(data.items.map(item => ({ id: item.snippet.resourceId.videoId, title: item.snippet.title, thumb: item.snippet.thumbnails.medium?.url })));
            setView('videoList');
        } catch (error) { console.error("Failed to fetch playlist videos:", error); }
    }, []);

    const searchVideos = useCallback(async (query) => {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=20`);
            const data = await res.json();
            setVideos(data.items.map(item => ({ id: item.id.videoId, title: item.snippet.title, thumb: item.snippet.thumbnails.medium?.url })));
            setView('searchResults');
        } catch (error) { console.error("Failed to search YouTube videos:", error); }
    }, []);

    const handleSearch = () => { if (searchQuery.trim()) searchVideos(searchQuery); };
    const resetView = () => { setView('main'); setSearchQuery(''); setSelectedReader(''); setVideos([]); };
    const handleReaderSelect = (readerName) => { setSelectedReader(readerName); setSearchQuery(readerName + ' '); };
    const handleSurahSelect = (surahName) => { const finalQuery = `${selectedReader} سورة ${surahName}`; setSearchQuery(finalQuery); searchVideos(finalQuery); };

    return (
        <section className="p-4 md:p-6 flex-col h-full relative w-full">
            <div className="w-full flex flex-col gap-4">
                <div className="w-full flex flex-row items-center gap-2 grid-container">
                    <button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full navigable"><Icon name="search" /></button>
                    <button onClick={resetView} className="navigable" style={{ background: 'rgba(220, 38, 38, 0.6)', padding: '0.75rem', borderRadius: '9999px' }}><Icon name="x" className="w-5 h-5" /></button>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} placeholder="ابحث في يوتيوب..." className="flex-grow p-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 navigable" />
                </div>

                {view === 'main' && (
                    <>
                        <div id="youtube-suggestions" className="flex flex-col gap-4 w-full">
                            <div className="glass-surface flex-col gap-2 p-3 rounded-xl w-full">
                                <span className="youtube-suggestion-category-tag bg-blue-600">اختر القارئ</span>
                                <div className="reader-container">
                                    {youtubeReaderSuggestions.map(reader => (
                                        <div key={reader.name} className={`youtube-reader-card navigable ${selectedReader === reader.name ? 'selected' : ''}`} onClick={() => handleReaderSelect(reader.name)}>
                                            <img src={reader.image} alt={reader.name} /><h3>{reader.name}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedReader && (
                                <div className="glass-surface flex-col gap-2 p-3 rounded-xl w-full mt-4">
                                    <span className="youtube-suggestion-category-tag bg-green-600">اختر السورة</span>
                                    <div className="grid grid-cols-9 gap-2 w-full">
                                        {youtubeSurahSuggestions.map(surah => (<button key={surah} onClick={() => handleSurahSelect(surah)} className="youtube-suggestion-button navigable">{surah}</button>))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div id="youtube-playlist-view" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full flex-grow overflow-y-auto grid-container">
                            {playlists.map(p => (
                                <div key={p.id} className="glass-surface youtube-channel-card navigable" onClick={() => { setPlaylistTitle(p.title); fetchVideos(p.id); }}>
                                    <img src={p.img} alt={p.title} /><h2>{p.title}</h2>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {(view === 'videoList' || view === 'searchResults') && (
                    <div className="flex flex-col w-full flex-grow overflow-y-auto">
                        <button onClick={resetView} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full mb-4 self-start navigable"><Icon name="arrow-left" className="inline-block ml-2" /> العودة</button>
                        <h2 className="text-2xl font-bold mb-4">{view === 'videoList' ? playlistTitle : 'نتائج البحث'}</h2>
                        <div className="flex flex-col gap-4">
                            {videos.map(v => (
                                <div key={v.id} className="youtube-video-card navigable" onClick={() => showVideoPopup(v.id)}>
                                    <img src={v.thumb || 'https://placehold.co/100x56'} alt={v.title} /><h3>{v.title}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


const RadioScreen = () => <section className="items-center justify-center h-full w-full p-4 flex"><iframe className="full-iframe" title="Quran Radio" src="https://quran.com/radio" style={{ zoom: 0.58 }}></iframe></section>;
const RecitersScreen = () => <section className="items-center justify-center h-full w-full p-4 flex"><iframe className="full-iframe" title="Quran Reciters" src="https://quran.com/reciters" style={{ zoom: 0.58 }}></iframe></section>;
const QuranScreen = () => <section className="p-4 flex flex-col h-full w-full"><div className="w-full h-full glass-surface p-4 rounded-xl flex-grow"><iframe className="full-iframe" src="https://quran.com/?lang=ar" title="القرآن الكريم"></iframe></div></section>;
const MapScreen = () => <section className="p-4 h-full w-full"></section>;
const WeatherScreen = ({ weatherData, onGetSummary, summaryText, weather }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current && weatherData && window.Chart) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new window.Chart(ctx, {
                type: 'bar',
                data: { labels: weatherData.labels, datasets: [{ label: 'درجة الحرارة', data: weatherData.temps, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1, borderRadius: 5 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'white', callback: (v) => v + '°C' } }, x: { grid: { display: false }, ticks: { color: 'white' } } } }
            });
        }
    }, [weatherData]);

    return (
        <section className="p-4 md:p-6 flex-col items-center justify-start h-full w-full">
            <h1 className="text-4xl font-bold mb-4">الطقس <Icon name="cloud-sun"/></h1>
            <div className="w-full h-full flex flex-col gap-4 flex-grow">
                <div className="w-full max-w-3xl mx-auto">
                    <button onClick={onGetSummary} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-bold w-full navigable" tabIndex="0">
                        <Icon name="sparkles" className="w-5 h-5" /> ✨ الحصول على ملخص وتوصية
                    </button>
                    <div className="glass-surface p-4 rounded-3xl text-center min-h-[60px] flex items-center justify-center mt-2">
                        <p className="text-lg text-white/90">{summaryText || 'اضغط على الزر للحصول على ملخص للطقس.'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 w-full">
                    <div className="glass-surface p-4 rounded-3xl text-center flex flex-col items-center justify-center navigable" tabIndex="0">
                        <Icon name="thermometer" className="w-10 h-10 text-red-400 mb-2" />
                        <span className="text-2xl font-bold">{weather.temperature ? `${Math.round(weather.temperature)}°C` : '--°C'}</span>
                        <span className="text-sm text-white/50">الحرارة</span>
                    </div>
                    <div className="glass-surface p-4 rounded-3xl text-center flex flex-col items-center justify-center navigable" tabIndex="0">
                        <Icon name="sun" className="w-10 h-10 text-orange-300 mb-2" />
                        <span className="text-2xl font-bold">{weather.uvIndex || '--'}</span>
                        <span className="text-sm text-white/50">مؤشر الأشعة فوق البنفسجية</span>
                    </div>
                </div>
                <div className="glass-surface p-4 rounded-3xl mt-4 w-full col-span-full flex-grow navigable" tabIndex="0">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
        </section>
    );
};

// --- Main App Component ---
export default function App() {
    const [activeApp, setActiveApp] = useState('Dashboard');
    const [currentTime, setCurrentTime] = useState('00:00');
    const [weather, setWeather] = useState({ temperature: null, description: null, iconUrl: '', location: 'Salalah, Oman', uvIndex: null });
    const [hourlyWeatherData, setHourlyWeatherData] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState({ Fajr: '--:--', Dhuhr: '--:--', Asr: '--:--', Maghrib: '--:--', Isha: '--:--', nextPrayer: null, currentPrayer: null, nextPrayerIqamaTime: null });
    const [videoPopup, setVideoPopup] = useState({ visible: false, videoId: null });
    const [weatherSummary, setWeatherSummary] = useState('');
    
    const WEATHER_API_KEY = '7acefc26deee4904a2393917252207';
    const AI_ASSISTANT_API_KEY = ''; // Add your Gemini API Key here if you have one

    const fetchWeatherData = useCallback(async () => {
        try {
            const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=Salalah&days=2&aqi=no&alerts=no&lang=ar`);
            if (!res.ok) throw new Error('Weather API fetch failed');
            const data = await res.json();
            setWeather({ temperature: data.current.temp_c, description: data.current.condition.text, iconUrl: `https:${data.current.condition.icon}`, location: `${data.location.name}, ${data.location.country}`, uvIndex: data.current.uv });
            const hourlyData = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1]?.hour || []];
            const now = new Date();
            const upcomingHours = hourlyData.filter(h => new Date(h.time_epoch * 1000) >= now).slice(0, 6);
            setHourlyWeatherData({
                labels: upcomingHours.map(h => new Date(h.time_epoch * 1000).toLocaleTimeString('ar-SA', { hour: 'numeric', hour12: true })),
                temps: upcomingHours.map(h => h.temp_c)
            });
        } catch (error) { console.error("Failed to fetch weather data:", error); }
    }, []);

    const processPrayerTimes = useCallback(() => {
        const prayerData = [{"date":"2025-07-27","fajr":"04:44","dhuhr":"12:35","asr":"15:49","maghrib":"19:03","isha":"20:17"},{"date":"2025-07-28","fajr":"04:44","dhuhr":"12:35","asr":"15:49","maghrib":"19:03","isha":"20:16"},{"date":"2025-07-29","fajr":"04:44","dhuhr":"12:35","asr":"15:48","maghrib":"19:03","isha":"20:16"},{"date":"2025-07-30","fajr":"04:45","dhuhr":"12:35","asr":"15:48","maghrib":"19:02","isha":"20:15"},{"date":"2025-07-31","fajr":"04:45","dhuhr":"12:35","asr":"15:47","maghrib":"19:02","isha":"20:15"},{"date":"2025-08-01","fajr":"04:46","dhuhr":"12:35","asr":"15:46","maghrib":"19:02","isha":"20:14"},{"date":"2025-08-02","fajr":"04:46","dhuhr":"12:35","asr":"15:46","maghrib":"19:01","isha":"20:14"},{"date":"2025-08-03","fajr":"04:47","dhuhr":"12:35","asr":"15:45","maghrib":"19:01","isha":"20:13"},{"date":"2025-08-04","fajr":"04:47","dhuhr":"12:35","asr":"15:44","maghrib":"19:00","isha":"20:13"},{"date":"2025-08-05","fajr":"04:48","dhuhr":"12:35","asr":"15:44","maghrib":"19:00","isha":"20:12"},{"date":"2025-08-06","fajr":"04:48","dhuhr":"12:35","asr":"15:44","maghrib":"18:59","isha":"20:11"},{"date":"2025-08-07","fajr":"04:48","dhuhr":"12:35","asr":"15:44","maghrib":"18:59","isha":"20:11"},{"date":"2025-08-08","fajr":"04:49","dhuhr":"12:34","asr":"15:45","maghrib":"18:58","isha":"20:10"},{"date":"2025-08-09","fajr":"04:49","dhuhr":"12:34","asr":"15:45","maghrib":"18:58","isha":"20:09"},{"date":"2025-08-10","fajr":"04:50","dhuhr":"12:34","asr":"15:45","maghrib":"18:57","isha":"20:09"},{"date":"2025-08-11","fajr":"04:50","dhuhr":"12:34","asr":"15:46","maghrib":"18:57","isha":"20:08"},{"date":"2025-08-12","fajr":"04:50","dhuhr":"12:34","asr":"15:46","maghrib":"18:56","isha":"20:07"}];
        const iqamaOffsets = { Fajr: 25, Dhuhr: 20, Asr: 20, Maghrib: 5, Isha: 20 };
        const prayerNames = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        
        // Find today's prayer times, or use the last available date as a fallback
        let todayTimings = prayerData.find(p => p.date === todayStr) || prayerData[prayerData.length - 1];

        const timeToDate = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
        };

        let nextPrayerName = null;
        let currentPrayerName = null;
        let nextIqamaTime = null;
        
        const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        for (const prayerKey of prayerOrder) {
            const prayerTime = timeToDate(todayTimings[prayerKey.toLowerCase()]);
            const iqamaTime = new Date(prayerTime.getTime() + iqamaOffsets[prayerKey] * 60000);

            if (now >= prayerTime && now < iqamaTime) {
                currentPrayerName = prayerNames[prayerKey];
            }
            if (prayerTime > now && !nextPrayerName) {
                nextPrayerName = prayerNames[prayerKey];
                nextIqamaTime = prayerTime;
                break;
            }
        }

        if (!nextPrayerName) {
            nextPrayerName = "الفجر (غدًا)";
        }

        setPrayerTimes({ 
            Fajr: todayTimings.fajr, 
            Dhuhr: todayTimings.dhuhr, 
            Asr: todayTimings.asr, 
            Maghrib: todayTimings.maghrib, 
            Isha: todayTimings.isha, 
            nextPrayer: nextPrayerName, 
            currentPrayer: currentPrayerName, 
            nextPrayerIqamaTime: nextIqamaTime 
        });
    }, []);

    const handleGetWeatherSummary = useCallback(async () => {
        if (!weather.temperature) return;
        setWeatherSummary('✨ جاري إنشاء الملخص...');
        const prompt = `You are a friendly car assistant. The current weather in ${weather.location} is ${weather.temperature}°C with ${weather.description} and a UV index of ${weather.uvIndex}. Provide a short, conversational summary (one sentence) and a simple clothing recommendation (one sentence). Respond in Arabic.`;
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${AI_ASSISTANT_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('API call failed');
            const result = await res.json();
            const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;
            setWeatherSummary(summary || 'فشل في الحصول على الملخص.');
        } catch (err) {
            console.error('Error fetching weather summary:', err);
            setWeatherSummary('فشل في الحصول على الملخص. حاول مرة أخرى.');
        }
    }, [weather]);

    useEffect(() => {
        const timeUpdater = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })), 1000);
        
        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        fetchWeatherData();
        processPrayerTimes();
        const weatherUpdater = setInterval(fetchWeatherData, 300000);
        const prayerUpdater = setInterval(processPrayerTimes, 60000);
        return () => { clearInterval(timeUpdater); clearInterval(weatherUpdater); clearInterval(prayerUpdater); };
    }, [fetchWeatherData, processPrayerTimes]);
    
    const showVideoPopup = useCallback((videoId) => setVideoPopup({ visible: true, videoId }), []);
    const hideVideoPopup = useCallback(() => setVideoPopup({ visible: false, videoId: null }), []);

    return (
        <>
            <GlobalStyles />
            <div className="w-full h-screen flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-7xl flex justify-between items-center text-white/80 text-sm px-4 py-2 absolute top-4 left-1/2 -translate-x-1/2 z-10 top-bar">
                    <div className="flex items-center gap-2"><Icon name="wifi" /><span>5G</span></div>
                    <div>{currentTime}</div>
                </div>
                <img src="https://dmusera.netlify.app/Lexus-Logo.wine.svg" alt="Lexus Logo" className="fixed top-2 left-1/2 -translate-x-1/2 h-12 z-[1000] opacity-80" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }} />
                <div id="carplay-main-interface" className="flex flex-row shadow-2xl rounded-3xl overflow-hidden bg-black/20 border border-white/10" style={{width: '90vw', height: '90vh'}}>
                    <nav className="w-20 sm:w-24 bg-black/20 flex flex-col items-center justify-start pt-8 p-2 space-y-4 border-r border-white/10 flex-shrink-0 grid-container">
                        {['Dashboard', 'Media', 'Radio', 'Reciters', 'Weather', 'Map', 'Quran'].map(app => (
                            <AppIcon key={app} appName={app} icon={{ Dashboard: 'layout-grid', Media: 'music', Radio: 'radio', Reciters: 'users', Weather: 'cloud-sun', Map: 'map', Quran: 'book-open' }[app]} activeApp={activeApp} onSwitch={setActiveApp} />
                        ))}
                    </nav>
                    <main className="flex-1 flex flex-col h-full">
                        <div className={`app-screen ${activeApp === 'Dashboard' ? 'active' : ''}`}><DashboardScreen weather={weather} prayerTimes={prayerTimes} /></div>
                        <div className={`app-screen ${activeApp === 'Media' ? 'active' : ''}`}><MediaScreen showVideoPopup={showVideoPopup} /></div>
                        <div className={`app-screen ${activeApp === 'Radio' ? 'active' : ''}`}><RadioScreen /></div>
                        <div className={`app-screen ${activeApp === 'Reciters' ? 'active' : ''}`}><RecitersScreen /></div>
                        <div className={`app-screen ${activeApp === 'Weather' ? 'active' : ''}`}><WeatherScreen weatherData={hourlyWeatherData} onGetSummary={handleGetWeatherSummary} summaryText={weatherSummary} weather={weather} /></div>
                        <div className={`app-screen ${activeApp === 'Map' ? 'active' : ''}`}><MapScreen /></div>
                        <div className={`app-screen ${activeApp === 'Quran' ? 'active' : ''}`}><QuranScreen /></div>
                    </main>
                </div>
            </div>
            {videoPopup.visible && <VideoPopup videoId={videoPopup.videoId} onClose={hideVideoPopup} />}
        </>
    );
}
