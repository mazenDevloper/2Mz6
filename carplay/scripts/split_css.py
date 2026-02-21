#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تقسيم CSS إلى ملفات منطقية حسب الوظيفة
"""

# قراءة ملف CSS الكامل
with open('css/main.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

# تقسيم CSS حسب التعليقات والأنماط
css_sections = {
    'base.css': {
        'keywords': ['@import', 'body', 'html', ':root', 'font-family'],
        'description': 'التنسيقات الأساسية والخطوط'
    },
    'animations.css': {
        'keywords': ['@keyframes', 'animation', 'transition', 'transform'],
        'description': 'الحركات والتأثيرات البصرية'
    },
    'glass-effects.css': {
        'keywords': ['glass-surface', 'backdrop-filter', 'blur', 'rgba'],
        'description': 'تأثيرات الزجاج والشفافية'
    },
    'navigation.css': {
        'keywords': ['navigable', ':focus', 'tv-focus', 'grid-item'],
        'description': 'تنسيقات التنقل بالريموت'
    },
    'components.css': {
        'keywords': ['carousel', 'card', 'button', 'popup', 'widget'],
        'description': 'تنسيقات المكونات (الكروت، الأزرار، الخ)'
    },
    'dashboard.css': {
        'keywords': ['dashboard', 'screen-Dashboard', 'grid-cols'],
        'description': 'تنسيقات لوحة القيادة'
    },
    'responsive.css': {
        'keywords': ['@media', 'max-width', 'min-width'],
        'description': 'التنسيقات المتجاوبة'
    }
}

# استخراج الأقسام
lines = css_content.split('\n')
categorized = {key: [] for key in css_sections.keys()}
uncategorized = []

current_rule = []
for line in lines:
    current_rule.append(line)
    
    # إذا وصلنا لنهاية قاعدة CSS (سطر يحتوي على })
    if '}' in line and not line.strip().startswith('/*'):
        rule_text = '\n'.join(current_rule)
        matched = False
        
        # محاولة تصنيف القاعدة
        for css_file, config in css_sections.items():
            if any(keyword in rule_text for keyword in config['keywords']):
                categorized[css_file].append(rule_text)
                matched = True
                break
        
        if not matched:
            uncategorized.append(rule_text)
        
        current_rule = []

# حفظ الملفات
saved_files = []
for filename, rules in categorized.items():
    if rules:
        file_path = f'css/{filename}'
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"/* {css_sections[filename]['description']} */\n\n")
            f.write('\n\n'.join(rules))
        
        saved_files.append(filename)
        print(f"✅ {filename}: {len(rules)} قاعدة CSS")

# حفظ القواعد غير المصنفة
if uncategorized:
    with open('css/utilities.css', 'w', encoding='utf-8') as f:
        f.write("/* تنسيقات إضافية وأدوات مساعدة */\n\n")
        f.write('\n\n'.join(uncategorized))
    print(f"✅ utilities.css: {len(uncategorized)} قاعدة غير مصنفة")

# إنشاء ملف CSS رئيسي يستورد كل شيء
main_imports = """/* ملف CSS الرئيسي - يستورد جميع الملفات الفرعية */

/* 1. الأساسيات */
@import url('base.css');

/* 2. التأثيرات */
@import url('glass-effects.css');
@import url('animations.css');

/* 3. التنقل */
@import url('navigation.css');

/* 4. المكونات */
@import url('components.css');
@import url('dashboard.css');

/* 5. الأدوات المساعدة */
@import url('utilities.css');

/* 6. التجاوب */
@import url('responsive.css');
"""

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(main_imports)

print("\n✅ تم إنشاء css/styles.css كنقطة دخول رئيسية")
print("\n📦 الملفات المحفوظة:", ', '.join(saved_files))
