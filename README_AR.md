# PUREX STORE Manager API v4

سيرفر خاص لإضافة PUREX STORE، عربي بالكامل، ويدعم:

- تسجيل دخول Discord
- تحقق من المشتركين
- حالة الاشتراك والخطة وتاريخ الانتهاء
- إعدادات عامة للإضافة
- قائمة Streamers افتراضية
- مسارات Manager متعددة حتى لا تظهر أخطاء route غير موجود
- رسائل عربية

## التشغيل على Render

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

Environment Variables المطلوبة:

```env
BRAND_NAME=PUREX STORE
DISCORD_CLIENT_ID=1507511509339607060
EXTENSION_ID=bicngpoijkcigllgeeocfoifegobhkfj
SUPPORT_URL=https://discord.gg/a99
ALLOWED_DISCORD_IDS=Discord_User_ID_مالك
DEFAULT_STREAMERS=kick,adinross,xqc
```

لإضافة أكثر من مشترك:

```env
ALLOWED_DISCORD_IDS=111111111111111111,222222222222222222
```

لإضافة معلومات اشتراك كاملة:

```env
SUBSCRIBERS_JSON={"111111111111111111":{"name":"Ali","plan":"vip","expiresAt":"2099-12-31","status":"active"}}
```
