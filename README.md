# NHS SLT Pediatric Job Monitor

Automated job monitor for NHS Band 5 Speech & Language Therapist positions in pediatric settings.

## What it does

- Fetches all Band 5 SLT jobs from NHS Jobs API
- Filters to jobs with "speech" or "language" in the title
- Checks full job descriptions for pediatric keywords (children, paediatric, early years, etc.)
- Calculates driving distances from Birmingham and Nottingham
- Sends email notifications when new pediatric jobs are found

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run once
npm start

# Run on schedule
npm run start:schedule
```

## Configuration

Create a `.env` file:

```env
# Email (Gmail with App Password)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=email1@gmail.com,email2@hotmail.com

# Schedule (cron expression)
# Default: twice daily at 9am and 6pm
CRON_EXPRESSION=0 9,18 * * *
```

### Getting a Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

## Deployment

### Render (Recommended)

1. Push code to GitHub
2. Create a Web Service on Render
3. Set environment variables in the dashboard
4. Build command: `npm run build`
5. Start command: `node dist/index.js schedule`

### Local Development

```bash
# Run once
npm run dev

# Run with schedule
npm run dev:schedule
```

## Cron Schedule Examples

| Frequency | Expression |
|-----------|------------|
| Every 15 min | `*/15 * * * *` |
| Hourly | `0 * * * *` |
| Twice daily (9am & 6pm) | `0 9,18 * * *` |
| Once daily (9am) | `0 9 * * *` |

## Database

Jobs are stored in `data/jobs.db` (JSON file). The database tracks:
- All seen jobs
- Which ones are pediatric
- Which ones have been notified

To reset:
```bash
npm run reset:db
```

## License

ISC
