
# خطة تحديث الهيدر والهيرو سيكشن لمطابقة تصميم الريبو المرجعي

## ملخص التغييرات
سأقوم بتحديث تصميم الهيدر (Navbar) والهيرو سيكشن ليتطابق مع التصميم الموجود في الريبو المرجعي `MR7PRO/WekiCode-Platform`، مع الحفاظ على جميع الوظائف الحالية.

---

## التغييرات المطلوبة

### 1. تحديث نص "WekiCode" بتدرج لوني (Gradient Text)

**في الهيدر (`Navbar.tsx`):**
- تغيير "Weki" من لون ثابت إلى تدرج أزرق: `from-sky-300 via-blue-500 to-blue-700`
- تغيير "Code" من لون ثابت إلى تدرج برتقالي: `from-amber-300 via-orange-500 to-orange-700`
- تطبيق `bg-clip-text text-transparent` لإظهار التدرج

**في الهيرو سيكشن (`HeroSection.tsx`):**
- نفس التدرجات اللونية للنص

### 2. إصلاح حجم الشعار في الهيدر
- تكبير الشعار من `w-8 h-8` إلى `w-11 h-11` (نفس حجم الريبو المرجعي)
- إضافة تأثير ظل توهج عند الهوفر: `group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]`

### 3. تحسين تأثير التوهج عند الهوفر
- توهج أزرق لكلمة "Weki": `drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]`
- توهج برتقالي لكلمة "Code": `drop-shadow-[0_0_20px_rgba(249,115,22,0.7)]`

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|------------|
| `src/components/layout/Navbar.tsx` | تحديث ستايل الشعار والنص |
| `src/components/home/HeroSection.tsx` | تحديث ستايل النص الرئيسي |

---

## التفاصيل التقنية

### Navbar.tsx - التغييرات:

```tsx
// الشعار - تكبير الحجم
<img 
  src={wekicodeLogo} 
  alt="WekiCode Logo" 
  className="w-11 h-11 object-contain group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-300"
/>

// النص - تدرج لوني مع توهج
<span className="text-xl font-bold italic transition-all duration-300">
  <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]">
    Weki
  </span>
  <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.7)]">
    Code
  </span>
</span>
```

### HeroSection.tsx - التغييرات:

```tsx
<h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up">
  <span className="text-foreground">منصة </span>
  <span className="inline-block italic font-bold transition-all duration-300 cursor-default group">
    <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.7)]">
      Weki
    </span>
    <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]">
      Code
    </span>
  </span>
  <br />
  <span className="text-foreground">لمستقبل المبرمجين</span>
</h1>
```

---

## النتيجة المتوقعة

- الشعار سيظهر بحجم مناسب ومتناسق كأيقونة
- كلمة "Weki" ستظهر بتدرج أزرق جميل (من السماوي للأزرق الداكن)
- كلمة "Code" ستظهر بتدرج برتقالي (من الكهرماني للبرتقالي الداكن)
- تأثير توهج ملون عند تمرير الفأرة على النص
- مطابقة تامة للتصميم في الريبو المرجعي
