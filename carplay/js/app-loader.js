// ملف التحميل الرئيسي
// يتم تحميل جميع الوحدات بالترتيب الصحيح

// 1. الإعدادات أولاً
import './config.js';

// 2. الخدمات الأساسية
import './storage.js';
import './navigation.js';

// 3. وظائف التطبيق
import './maps.js';
import './youtube.js';
import './weather.js';
import './prayer.js';

console.log('✅ تم تحميل جميع وحدات التطبيق');
