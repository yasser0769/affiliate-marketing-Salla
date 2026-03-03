# تطبيق شركاء سلة (Easy Mode) + زر شراء خارجي لكل منتج

هذا المشروع يبني تطبيق **Salla Partners App** جاهز للإنتاج باستخدام:
- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- Webhook-based authorization (Easy Mode)
- لوحة تحكم لإدارة زر خارجي لكل منتج
- Endpoint عام يقرأ الإعدادات لكل منتج
- Snippet للمتجر يضيف الزر أسفل زر الإضافة للسلة في **ثيم رائد**

## المتطلبات

1) Node.js 18+
2) PostgreSQL
3) حساب مطور سلة وتطبيق مفعّل

## تشغيل المشروع محليًا

```bash
npm i
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

افتح: `http://localhost:3000`

## إعداد المتغيرات البيئية

راجع `.env.example`:

- `DATABASE_URL`
- `APP_BASE_URL`
- `SALLA_WEBHOOK_SECRET`
- `SALLA_API_BASE=https://api.salla.dev`
- `SALLA_ACCOUNTS_BASE=https://accounts.salla.sa`
- `SALLA_CLIENT_ID`
- `SALLA_CLIENT_SECRET`
- `ENCRYPTION_KEY` (32+)

## Webhook Easy Mode (التفويض)

الاعتماد هنا بالكامل على Easy Mode:
- عند تثبيت التطبيق/تفويضه في سلة يصل webhook إلى:
  - `POST /api/webhooks/salla`
- يتم التحقق من HMAC عبر `SALLA_WEBHOOK_SECRET`
- يتم حفظ `store_id`, `access_token`, `refresh_token`, وتاريخ الانتهاء في قاعدة البيانات.

## تعريض السيرفر محليًا عبر ngrok

```bash
ngrok http 3000
```

استخدم الرابط الناتج كـ `APP_BASE_URL` في `.env`، وبعدها أعد التشغيل.

## أين أضع رابط الـ webhook في سلة؟

في إعدادات تطبيقك داخل منصة مطوري سلة:
- ضع رابط webhook إلى:
  - `https://YOUR_DOMAIN/api/webhooks/salla`
- اربط حدث Easy Mode الخاص بالتفويض (`app.store.authorize` أو ما يكافئه في واجهة سلة).

## لوحة التحكم

افتح:

`/dashboard?store_id=XXXX`

السلوك:
- يتحقق من أن `store_id` موجود ومفوض.
- إن لم يوجد: تظهر رسالة **Store not authorized yet**.
- زر **Sync Products** يسحب كل المنتجات من API سلة مع pagination + retry/backoff + delay.
- يمكنك تحديد:
  - `button_text`
  - `button_url` (http/https فقط)
  - `open_new_tab`
- حفظ صف واحد أو **Bulk Save**.

## API المتاحة

### 1) سحب جميع المنتجات
`GET /api/products?store_id=...&force=1`

- يسحب كل المنتجات بترقيم صفحات.
- Retry تلقائي على 429/5xx.
- تأخير 150ms بين الصفحات.

### 2) روابط الأزرار
- `GET /api/product-links?store_id=...`
- `POST /api/product-links/bulk`

Body:

```json
{
  "store_id": "12345",
  "items": [
    {
      "productId": "999",
      "buttonText": "اشترِ من أمازون",
      "buttonUrl": "https://amazon.sa/...",
      "openNewTab": true
    }
  ]
}
```

### 3) Endpoint عام للمتجر
`GET /public/external-button?store_id=...&product_id=...`

- إذا لا يوجد mapping أو الرابط فارغ/غير صحيح => `204`
- إذا موجود =>

```json
{
  "button_text": "اشترِ من أمازون",
  "button_url": "https://amazon.sa/...",
  "open_new_tab": true
}
```

- Rate limit: 60 طلب/دقيقة لكل IP
- `Cache-Control: public, max-age=60`
- CORS مفتوح لـ GET

## Snippet (انسخه في Salla App Snippet: Before </body>)

يمكنك استخدام الملف:

`public/snippets/external-buy-button.js`

أو انسخ الكود منه مباشرة داخل سلة.

> مهم:
> - عدّل `APP_BASE_URL` داخل السكربت إلى دومين التطبيق لديك.
> - إذا لم يتوفر `window.salla.config.store.id`، ضع `HARD_CODED_STORE_ID` يدويًا.

السكربت يقوم بـ:
- تحديد `product_id` من `input[name="id"]`
- تحديد `store_id`
- استدعاء endpoint العام
- إنشاء `<button type="button">`
- إدراج الزر **بعد**
  `salla-add-product-button.sticky-product-bar__btn`
  ثم fallback بعد `form.product-form`
- عند النقر: `window.open` أو `location.href`
- مع `preventDefault + stopPropagation` بنمط capture

## خطوات الاختبار الكاملة

1) شغل المشروع محليًا واضبط `.env`.
2) فعّل ngrok وحدّث `APP_BASE_URL`.
3) ضع webhook URL في إعدادات تطبيق سلة.
4) ثبّت التطبيق على متجر تجريبي.
5) تأكد أن webhook حفظ المتجر في قاعدة البيانات.
6) افتح `/dashboard?store_id=STORE_ID`.
7) اضغط **Sync Products**.
8) عدّل زر منتج محدد واحفظ.
9) أضف snippet في سلة (Before </body>) بعد تعديل `APP_BASE_URL`.
10) افتح صفحة المنتج على ثيم رائد وتأكد أن الزر يظهر تحت زر الإضافة للسلة ويفتح الرابط الخارجي بشكل صحيح.
