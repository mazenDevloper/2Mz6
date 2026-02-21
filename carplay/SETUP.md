# دليل الإعداد السريع ⚡

## 1️⃣ الحصول على مفاتيح API

### YouTube Data API v3
1. اذهب إلى: https://console.cloud.google.com/
2. أنشئ مشروع جديد
3. فعّل YouTube Data API v3
4. أنشئ بيانات اعتماد (Credentials) → API Key
5. احصل على 2-3 مفاتيح مختلفة (للتناوب)

### Google Maps API
1. في نفس المشروع، فعّل:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
2. أنشئ مفتاح API جديد
3. قيّد المفتاح للنطاقات المسموحة

### OpenWeatherMap API
1. سجّل في: https://openweathermap.org/api
2. احصل على المفتاح المجاني
3. انتظر 10 دقائق حتى يتم تفعيله

### JSONBin.io (اختياري - للتخزين السحابي)
1. سجّل في: https://jsonbin.io/
2. أنشئ Bin جديد
3. احصل على API Key و Bin ID

## 2️⃣ تكوين المفاتيح

افتح ملف `js/config.js` وعدّل:

```javascript
// مفاتيح YouTube (ضع 2-3 مفاتيح)
window.YT_KEYS_POOL = [
    'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    'AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
];

// مفتاح Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// مفتاح الطقس
const WEATHER_API_KEY = 'abcdef1234567890abcdef1234567890';

// JSONBin (اختياري)
window.JSONBIN_BIN_ID = '6789abcdef123456789';
window.JSONBIN_API_KEY = '$2a$10$XXXXXXXXXXXXXXXXXXXXXXX';
```

## 3️⃣ التشغيل

### الطريقة الأولى: Python
```bash
cd carplay-project
python3 -m http.server 8000
```

افتح المتصفح: http://localhost:8000

### الطريقة الثانية: Node.js
```bash
npx serve
```

### الطريقة الثالثة: PHP
```bash
php -S localhost:8000
```

## 4️⃣ التأكد من عمل المشروع

✅ **الخرائط تظهر**: Maps API يعمل  
✅ **البحث في اليوتيوب يعمل**: YouTube API صحيح  
✅ **الطقس يتحدث**: Weather API نشط  
✅ **السيارة 3D تظهر**: Three.js محمّل  

## ⚠️ مشاكل شائعة

### المشكلة: الخرائط لا تظهر
**الحل**: 
- تأكد من تفعيل Maps JavaScript API
- راجع Console للأخطاء
- تحقق من القيود على المفتاح

### المشكلة: YouTube لا يعمل
**الحل**:
- تأكد من تفعيل YouTube Data API v3
- استخدم 2-3 مفاتيح مختلفة
- راجع حصة الاستخدام اليومية

### المشكلة: CORS Error
**الحل**:
- استخدم خادم محلي (لا تفتح الملف مباشرة)
- استخدم `python3 -m http.server` أو `npx serve`

### المشكلة: السيارة 3D لا تظهر
**الحل**:
- تأكد من وجود ملف `assets/models/ES350E.gltf`
- راجع Console للأخطاء في تحميل Three.js

## 🎯 التخصيص

### تغيير أوقات الصلاة
عدّل ملف `js/prayer.js` أو `data/prayer-times.json`

### تغيير الموقع الافتراضي
في `js/config.js`:
```javascript
const DEFAULT_LOCATION = {
    lat: 24.7136,  // الرياض
    lng: 46.6753
};
```

### تغيير الألوان
عدّل ملف `css/base.css`:
```css
:root {
    --primary-color: #0A84FF;
    --glass-bg: rgba(255, 255, 255, 0.1);
    /* ... */
}
```

## 📱 التجربة على TV

1. ارفع المشروع على استضافة (Netlify, Vercel, GitHub Pages)
2. افتح الرابط على متصفح التلفاز
3. استخدم الريموت للتنقل

## 🚀 نصائح للأداء

- **استخدم HTTPS**: للخصائص المتقدمة (Geolocation, PWA)
- **فعّل الكاش**: لتسريع التحميل
- **قلل الطلبات**: دمج الملفات في الإنتاج
- **استخدم CDN**: للمكتبات الخارجية

---

**جاهز للانطلاق! 🎉**
