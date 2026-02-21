# 🚗 CarPlay Web Application

> تطبيق ويب متطور يحاكي واجهة CarPlay مع دعم كامل للتحكم بالريموت والكيبورد

## 📋 نظرة عامة

تطبيق ويب شامل يجمع بين:
- 🗺️ **خرائط جوجل** مع موديل سيارة ثلاثي الأبعاد (3D)
- 📺 **مشغل يوتيوب** متكامل مع إدارة ذكية لـ API
- 🌤️ **بيانات الطقس** اللحظية من OpenWeatherMap
- 🌙 **صورة القمر** من NASA
- 🕌 **أوقات الصلاة** مع العد التنازلي
- 📻 **راديو وميديا** مع دعم الملفات المحلية

## 📁 بنية المشروع

```
carplay-project/
├── 📄 index.html              # الملف الرئيسي للتطبيق
├── 📄 index_original.html     # النسخة الأصلية (للمرجع)
│
├── 🎨 css/                    # ملفات التنسيق
│   ├── styles.css            # نقطة الدخول الرئيسية (يستورد كل شيء)
│   ├── base.css              # التنسيقات الأساسية والخطوط
│   ├── animations.css        # الحركات والتأثيرات البصرية
│   ├── glass-effects.css     # تأثيرات الزجاج والشفافية
│   ├── navigation.css        # تنسيقات التنقل بالريموت
│   ├── components.css        # تنسيقات المكونات (الكروت، الأزرار)
│   ├── dashboard.css         # تنسيقات لوحة القيادة
│   ├── utilities.css         # أدوات مساعدة
│   ├── responsive.css        # التنسيقات المتجاوبة
│   └── main.css              # النسخة الموحدة (احتياطية)
│
├── 💻 js/                     # ملفات JavaScript
│   ├── app-loader.js         # محمل الوحدات الرئيسي
│   ├── config.js             # الإعدادات والمتغيرات العامة
│   ├── navigation.js         # نظام التنقل بالريموت والكيبورد
│   ├── maps.js               # خرائط جوجل والموديل ثلاثي الأبعاد
│   ├── youtube.js            # مشغل اليوتيوب وإدارة API
│   ├── weather.js            # بيانات الطقس وصورة القمر
│   ├── prayer.js             # أوقات الصلاة والتذكيرات
│   ├── storage.js            # إدارة التخزين المحلي والسحابي
│   └── app.js                # النسخة الموحدة (احتياطية)
│
├── 🖼️ assets/                # الموارد الثابتة
│   ├── models/               # ملفات 3D (GLTF/GLB)
│   │   └── ES350E.gltf      # موديل سيارة لكزس
│   └── img/                  # الصور والأيقونات
│       └── lexus-logo.png   # شعار لكزس
│
├── 📊 data/                   # البيانات الثابتة
│   └── prayer-times.json    # جدول أوقات الصلاة
│
└── 🛠️ scripts/               # سكربتات التطوير
    ├── extract_code.py      # استخراج CSS و JS من HTML
    ├── split_js.py          # تقسيم JavaScript إلى وحدات
    └── split_css.py         # تقسيم CSS إلى ملفات منطقية
```

## 🚀 كيفية الاستخدام

### 1️⃣ التشغيل المباشر
```bash
# افتح الملف مباشرة في المتصفح
open index.html
```

### 2️⃣ استخدام خادم محلي (موصى به)
```bash
# باستخدام Python
python3 -m http.server 8000

# أو باستخدام Node.js
npx serve
```

ثم افتح المتصفح على: `http://localhost:8000`

## 🎮 التحكم

### لوحة المفاتيح:
- **↑ ↓ ← →**: التنقل بين العناصر
- **Enter**: اختيار
- **ESC**: الرجوع/إلغاء
- **Space**: تشغيل/إيقاف مؤقت (في مشغل الفيديو)

### الريموت كنترول:
- يدعم التطبيق أجهزة التلفاز الذكية والريموتات التي تدعم معيار TV Remote API

## 📦 التبعيات الخارجية (CDN)

- **Tailwind CSS**: `https://cdn.tailwindcss.com`
- **Lucide Icons**: `https://unpkg.com/lucide@latest`
- **Font Awesome**: `cdnjs.cloudflare.com`
- **Chart.js**: `cdn.jsdelivr.net/npm/chart.js`
- **Three.js**: `unpkg.com/three@0.152.0`
- **Google Fonts**: Amiri, Inter

## 🔧 الإعدادات المطلوبة

### مفاتيح API (في `js/config.js`):

```javascript
// مفاتيح YouTube Data API v3
window.YT_KEYS_POOL = [
    'YOUR_KEY_1',
    'YOUR_KEY_2',
    'YOUR_KEY_3'
];

// مفتاح Google Maps API
const GOOGLE_MAPS_API_KEY = 'YOUR_MAPS_KEY';

// مفتاح OpenWeatherMap
const WEATHER_API_KEY = 'YOUR_WEATHER_KEY';

// مفتاح JSONBin (للتخزين السحابي)
window.JSONBIN_BIN_ID = 'YOUR_BIN_ID';
window.JSONBIN_API_KEY = 'YOUR_JSONBIN_KEY';
```

## 🌟 المميزات

✅ **واجهة CarPlay أصلية**: تصميم يحاكي تجربة Apple CarPlay  
✅ **دعم RTL كامل**: مثالي للغة العربية  
✅ **تأثيرات زجاجية**: Glass Morphism مع Backdrop Blur  
✅ **تنقل سلس**: دعم كامل للريموت والكيبورد  
✅ **مشغل فيديو منبثق**: Picture-in-Picture mode  
✅ **خرائط 3D تفاعلية**: موديل سيارة متحرك  
✅ **أوقات صلاة دقيقة**: مع العد التنازلي  
✅ **طقس لحظي**: بيانات من OpenWeatherMap  

## 📝 ملاحظات التطوير

### تعديل التنسيقات:
- افتح `css/styles.css` لاستيراد/إزالة ملفات CSS
- كل ملف CSS مستقل ويمكن تعديله بدون التأثير على الباقي

### تعديل الوظائف:
- الوظائف مقسمة في `js/` حسب المسؤولية
- استخدم `app-loader.js` لتحديد ترتيب التحميل

### إضافة موارد جديدة:
- ضع الصور في `assets/img/`
- ضع موديلات 3D في `assets/models/`
- ضع البيانات الثابتة في `data/`

## 🐛 الأخطاء الشائعة

| المشكلة | الحل |
|---------|------|
| الخرائط لا تظهر | تأكد من مفتاح Google Maps API |
| الفيديوهات لا تعمل | تحقق من مفاتيح YouTube API |
| الطقس لا يتحدث | راجع مفتاح OpenWeatherMap |
| السيارة 3D لا تظهر | تأكد من وجود ملف `ES350E.gltf` |

## 📄 الترخيص

هذا المشروع للاستخدام التعليمي والشخصي.

## 👨‍💻 المطور

تم تطوير هذا التطبيق باستخدام:
- HTML5, CSS3, JavaScript (ES6+)
- Google Maps API
- YouTube IFrame API
- OpenWeatherMap API
- Three.js for 3D rendering

---

**ملاحظة**: للحصول على أفضل تجربة، استخدم متصفح Chrome أو Edge على شاشة كبيرة (TV أو Desktop).
