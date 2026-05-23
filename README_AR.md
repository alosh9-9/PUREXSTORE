# PUREX STORE Manager API v3

نسخة عربية خاصة لإدارة دخول Discord والمشتركين لإضافة PUREX STORE.

## على Render

- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: اتركه فارغ إذا رفعت الملفات مباشرة في GitHub.

## Environment Variables

ضع هذه القيم في Render:

```text
BRAND_NAME=PUREX STORE
DISCORD_CLIENT_ID=1507511509339607060
EXTENSION_ID=bicngpoijkcigllgeeocfoifegobhkfj
SUPPORT_URL=https://discord.gg/a99
ALLOWED_DISCORD_IDS=Discord User ID مالك
```

لإضافة أكثر من مشترك:

```text
ALLOWED_DISCORD_IDS=111111111111111111,222222222222222222
```

أو استخدم `SUBSCRIBERS_JSON` لإضافة خطط وانتهاء اشتراك.
