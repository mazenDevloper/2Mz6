 <script>
let dmaccDiv = document.getElementById('dmacc');
if (!dmaccDiv) {
  dmaccDiv = document.createElement('div');
  dmaccDiv.id = 'dmacc';
  document.body.appendChild(dmaccDiv); // هذا الأمر يضيفه إلى الـ <body>
}

fetch('https://dmusera.netlify.app/dmacc.html')
  .then(res => res.text())
  .then(data => {
    dmaccDiv.innerHTML = data;

    // العثور على السكريبتات داخل المحتوى المحمل وتنفيذها
    const scripts = dmaccDiv.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      // نسخ السمات (مثل src للسكريبتات الخارجية)
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // نسخ محتوى السكريبت المضمن
      if (script.textContent) {
        newScript.textContent = script.textContent;
      }
      // إضافة السكريبت الجديد وتشغيله
      dmaccDiv.appendChild(newScript);
    });

    // إذا كانت هناك دوال تهيئة محددة للنوافذ المنبثقة، استدعِها هنا
    // على سبيل المثال، إذا كان ملف dmacc.html يحتوي على دالة مثل initPopup()، فاستدعها كالتالي:
    // if (typeof initPopup === 'function') {
    //    initPopup();
    // }

  })
  .catch(err => console.error('فشل في التحميل:', err));
</script>
