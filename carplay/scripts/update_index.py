#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تحديث index.html لاستخدام الملفات المنفصلة
"""

from bs4 import BeautifulSoup

# قراءة الملف الحالي
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

# الحصول على <head>
head = soup.find('head')

# إزالة أي روابط CSS قديمة
for link in head.find_all('link', rel='stylesheet'):
    if 'main.css' in str(link.get('href', '')):
        link.decompose()

# إضافة رابط CSS الجديد (styles.css)
css_link = soup.new_tag('link', rel='stylesheet', href='css/styles.css')
head.append(css_link)

# تحديث رابط manifest.json
manifest_link = soup.find('link', rel='manifest')
if manifest_link:
    manifest_link['href'] = 'manifest.json'

# الحصول على <body>
body = soup.find('body')

# إزالة أي سكربتات قديمة من app.js
for script in body.find_all('script', src=True):
    if 'app.js' in script.get('src', ''):
        script.decompose()

# إضافة السكربتات الجديدة بالترتيب الصحيح
scripts = [
    'js/config.js',
    'js/storage.js',
    'js/navigation.js',
    'js/maps.js',
    'js/youtube.js',
    'js/weather.js',
    'js/prayer.js',
]

# إضافة تعليق توضيحي
comment = soup.new_string('\n<!-- تحميل وحدات JavaScript بالترتيب الصحيح -->\n')
body.append(comment)

for script_src in scripts:
    script_tag = soup.new_tag('script', src=script_src)
    body.append(script_tag)
    body.append(soup.new_string('\n'))

# إضافة تعليق في النهاية
final_comment = soup.new_string('\n<!-- جميع الوحدات تم تحميلها ✅ -->\n')
body.append(final_comment)

# حفظ الملف النهائي
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(soup.prettify())

print("✅ تم تحديث index.html")
print("\n📋 الملفات المحملة:")
print("   CSS: css/styles.css")
print("   JS Modules:")
for script in scripts:
    print(f"      - {script}")

print("\n🎉 المشروع جاهز للاستخدام!")
