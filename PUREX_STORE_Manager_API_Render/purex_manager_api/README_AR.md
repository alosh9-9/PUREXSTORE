# PUREX STORE Manager API

هذا سيرفر API خاص لإضافة PUREX STORE حتى لا تبقى مربوطة برابط AKS.

## القيم الجاهزة

- Discord OAuth Client ID: `1507511509339607060`
- Extension ID: `bicngpoijkcigllgeeocfoifegobhkfj`

## متغيرات Render المطلوبة

ضع هذه القيم في Environment Variables داخل Render:

```text
BRAND_NAME=PUREX STORE
DISCORD_CLIENT_ID=1507511509339607060
EXTENSION_ID=bicngpoijkcigllgeeocfoifegobhkfj
SUPPORT_URL=https://discord.gg/a99
ALLOWED_DISCORD_IDS=ضع Discord User ID الخاص بحسابك هنا
```

مهم: `ALLOWED_DISCORD_IDS` يحتاج Discord User ID الخاص بحسابك، وليس Client ID.

## أوامر Render

Build Command:

```text
npm install
```

Start Command:

```text
npm start
```

## اختبار السيرفر

بعد النشر افتح رابط Render. إذا ظهر JSON فيه `ok: true` فالسيرفر يعمل.

بعدها ضع رابط Render داخل الإضافة في خانة:

```text
MANAGER API URL
```

مثال:

```text
https://purex-store-manager.onrender.com
```

بدون `/` في النهاية.
