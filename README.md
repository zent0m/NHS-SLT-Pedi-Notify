# NHS SLT Pediatric Job Monitor

An automated job monitoring service that checks NHS Jobs for Band 5 Speech & Language Therapist positions in pediatric settings.

## How it works

The app fetches all Band 5 SLT jobs from the NHS Jobs API, filters for positions involving children (by scanning job descriptions for keywords like "children", "paediatric", "early years", etc.), calculates driving distances from Birmingham and Nottingham, and sends email notifications when new pediatric roles appear.

## Features

- Fetches jobs from NHS Jobs API (all pages)
- Filters for SLT roles with pediatric focus
- Calculates real distances using OpenStreetMap/OSRM
- Caches geocoding results for performance
- Sends email to multiple recipients
- Persists job history to avoid duplicate notifications
- Configurable cron schedule

## Tech Stack

- TypeScript / Node.js
- SQLite-like JSON file storage
- Nominatim + OSRM for geocoding & routing
- Nodemailer for emails
- node-cron for scheduling

---

Built with AI assistance (vibecoded).
