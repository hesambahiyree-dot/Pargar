# پرگار

نسخهٔ مستقل دسکتاپ و اندروید پرگار. برای اجرای این نسخه، سرور Vercel، Neon، Better Auth یا API خارجی لازم نیست؛ تخته و وضعیت آن روی خود دستگاه با localStorage نگه‌داری می‌شود.

## خروجی‌ها
- Windows: نصب‌کنندهٔ Electron
- Android: APK با Capacitor
- Web: پوشهٔ `dist/`

GitHub Actions با هر push روی `main` ابتدا typecheck و build وب را بررسی می‌کند و سپس خروجی Windows و Android را به‌صورت artifact می‌سازد.
