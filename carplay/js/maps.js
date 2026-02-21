// خرائط جوجل والموديل ثلاثي الأبعاد
// ملف: maps.js

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

