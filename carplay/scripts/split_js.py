#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تقسيم ملف JavaScript الكبير إلى ملفات وظيفية منفصلة
"""

import re

# قراءة ملف JavaScript الكامل
with open('js/app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# تعريف الأنماط لاستخراج الأقسام المختلفة
sections = {
    'config.js': {
        'patterns': [
            r'const isRTL.*?;',
            r'window\.YT_KEYS_POOL\s*=.*?\];',
            r'window\.JSONBIN_.*?;',
            r'let currentApiKey.*?;',
        ],
        'description': 'إعدادات التطبيق والمتغيرات العامة'
    },
    'navigation.js': {
        'patterns': [
            r'function handleSpatialNav\(.*?\n\}',
            r'function findNextFocus\(.*?\n\}',
            r'let currentFocusIndex.*?;',
            r'document\.addEventListener\(["\']keydown["\'].*?\}\);',
        ],
        'description': 'نظام التنقل بالريموت والكيبورد'
    },
    'maps.js': {
        'patterns': [
            r'async function initMaps\(\).*?\n\}',
            r'function init3DCarMarker\(.*?\n\}',
            r'let map3D.*?;',
            r'let carMarker.*?;',
        ],
        'description': 'خرائط جوجل والموديل ثلاثي الأبعاد'
    },
    'youtube.js': {
        'patterns': [
            r'function searchYouTube\(.*?\n\}',
            r'function showVideoPopup\(.*?\n\}',
            r'function loadYouTubePlayer\(.*?\n\}',
            r'function rotateApiKey\(.*?\n\}',
            r'let player.*?;',
        ],
        'description': 'مشغل اليوتيوب وإدارة API'
    },
    'weather.js': {
        'patterns': [
            r'async function fetchWeather\(.*?\n\}',
            r'async function fetchMoonImage\(.*?\n\}',
            r'function updateWeatherWidget\(.*?\n\}',
        ],
        'description': 'بيانات الطقس وصورة القمر من NASA'
    },
    'prayer.js': {
        'patterns': [
            r'const prayerTimes\s*=.*?\];',
            r'function updatePrayerTimes\(.*?\n\}',
            r'function calculateCountdown\(.*?\n\}',
        ],
        'description': 'أوقات الصلاة والتذكيرات'
    },
    'storage.js': {
        'patterns': [
            r'function saveToLocalStorage\(.*?\n\}',
            r'function loadFromLocalStorage\(.*?\n\}',
            r'async function syncWithJSONBin\(.*?\n\}',
        ],
        'description': 'إدارة التخزين المحلي والسحابي'
    }
}

# استخراج وحفظ كل قسم
extracted_files = []

for filename, config in sections.items():
    content_parts = [f"// {config['description']}\n"]
    content_parts.append(f"// ملف: {filename}\n\n")
    
    found_count = 0
    for pattern in config['patterns']:
        matches = re.findall(pattern, js_content, re.DOTALL | re.MULTILINE)
        for match in matches:
            content_parts.append(match)
            content_parts.append("\n\n")
            found_count += len(matches)
    
    if found_count > 0:
        file_path = f'js/{filename}'
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(''.join(content_parts))
        
        extracted_files.append({
            'name': filename,
            'count': found_count,
            'desc': config['description']
        })
        print(f"✅ {filename}: {found_count} أقسام")

# إنشاء ملف app.js جديد يستورد كل الملفات
loader_content = """// ملف التحميل الرئيسي
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
"""

with open('js/app-loader.js', 'w', encoding='utf-8') as f:
    f.write(loader_content)

print("\n📦 الملفات المستخرجة:")
for item in extracted_files:
    print(f"   - {item['name']}: {item['desc']}")

print("\n✅ تم إنشاء js/app-loader.js لتحميل جميع الوحدات")
