#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استخراج CSS و JavaScript من ملف HTML وتقسيمه إلى ملفات منفصلة
"""

from bs4 import BeautifulSoup
import re

# قراءة الملف الأصلي
with open('index_original.html', 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

# ============================================
# 1. استخراج CSS
# ============================================
css_content = []
style_tags = soup.find_all('style')

print(f"✅ تم العثور على {len(style_tags)} وسم <style>")

for idx, style in enumerate(style_tags):
    css_text = style.string
    if css_text:
        css_content.append(f"/* ===== CSS Block {idx+1} ===== */\n")
        css_content.append(css_text)
        css_content.append("\n\n")
        # حذف الوسم من HTML
        style.decompose()

# حفظ ملف CSS
with open('css/main.css', 'w', encoding='utf-8') as f:
    f.write(''.join(css_content))

print(f"✅ تم حفظ {len(css_content)} قسم CSS في css/main.css")

# ============================================
# 2. استخراج JavaScript
# ============================================
js_content = []
script_tags = soup.find_all('script', src=False)  # فقط السكربتات الداخلية (ليس CDN)

print(f"✅ تم العثور على {len(script_tags)} وسم <script> داخلي")

for idx, script in enumerate(script_tags):
    js_text = script.string
    if js_text and len(js_text.strip()) > 50:  # تجاهل السكربتات الصغيرة جداً
        js_content.append(f"// ===== JavaScript Block {idx+1} ===== \n")
        js_content.append(js_text)
        js_content.append("\n\n")
        # حذف الوسم من HTML
        script.decompose()

# حفظ ملف JavaScript
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(''.join(js_content))

print(f"✅ تم حفظ {len(js_content)} قسم JavaScript في js/app.js")

# ============================================
# 3. إنشاء index.html جديد مع الروابط
# ============================================

# إضافة روابط CSS و JS إلى <head>
head = soup.find('head')
if head:
    # إضافة رابط CSS
    css_link = soup.new_tag('link', rel='stylesheet', href='css/main.css')
    head.append(css_link)

# إضافة رابط JS قبل </body>
body = soup.find('body')
if body:
    js_script = soup.new_tag('script', src='js/app.js')
    body.append(js_script)

# حفظ الملف الجديد
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(soup.prettify())

print("✅ تم إنشاء index.html الجديد مع الروابط")

print("\n📦 بنية المشروع النهائية:")
print("""
carplay-project/
├── index.html          (ملف HTML نظيف مع الروابط)
├── css/
│   └── main.css       (جميع التنسيقات)
├── js/
│   └── app.js         (جميع الأكواد البرمجية)
├── assets/
│   ├── models/        (ملفات 3D)
│   └── img/           (الصور)
└── data/              (البيانات الثابتة)
""")
