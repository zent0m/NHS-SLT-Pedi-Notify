# NHS SLT Pediatric Job Monitor

Monitors NHS Jobs for Band 5 Speech & Language Therapist positions in pediatrics.

## Setup

```bash
npm install
npm run build
```

## Config (.env)

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com
CRON_EXPRESSION=0 9,18 * * *
```

Get Gmail app password at: https://myaccount.google.com/apppasswords

## Run

```bash
npm start           # run once
npm run start:schedule  # run on cron schedule
npm run reset:db   # clear database
```

## Deploy

Push to GitHub → Deploy on Render as Web Service.

---

Built with AI assistance (vibecoded).
