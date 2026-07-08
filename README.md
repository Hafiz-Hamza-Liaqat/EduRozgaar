# EduRozgaar – Pakistan Job & Education E-Portal

A production-ready platform to **help students, provide job & education alerts, and reduce unemployment** in Pakistan. Monetization is secondary; the focus is on impact, scalability, and future-ready architecture.

## Vision

- **Primary**: Student support, job & education alerts, reducing unemployment.
- **Secondary**: Scalable foundation for ads, paid features, or premium content later.

## Tech Stack

| Layer    | Stack                          |
| -------- | ------------------------------ |
| Frontend | React.js, Vite, TailwindCSS, React Router, Axios |
| Backend  | Node.js, Express.js            |
| Database | MongoDB with Mongoose          |
| Auth     | JWT / OAuth / role-based (Phase-2) |

## Project Structure (Monorepo)

```
root/
├── client/          # React frontend
│   └── src/
│       ├── assets/
│       ├── components/   (common, layout, ui)
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       ├── utils/
│       ├── layouts/
│       └── constants/
├── server/          # Node backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── utils/
│       └── validators/
├── docs/            # Documentation
├── DEPLOYMENT.md    # Full setup, DB, env, deploy
└── README.md
```

## Installation

1. **Clone and install dependencies**

   ```bash
   cd EDU-E-Portal
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

2. **Environment & database**

   For **full step-by-step setup** (MongoDB, env vars, seeding, production), see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

   **Quick env setup:** Use the root **`.env.template`** — copy its SERVER section into `server/.env` and CLIENT section into `client/.env`; then set `MONGO_URI` and `JWT_SECRET` in `server/.env`.

3. **MongoDB**

   Start MongoDB locally or use MongoDB Atlas; set `MONGO_URI` in `server/.env`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for install and connection strings.

## Running the Project

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start React dev server (Vite)  |
| `npm run client`  | Same as dev (from root)        |
| `npm run server`  | Start Express API server (from root) |
| **`npm run dev:all`** / **`npm run dev-all`** | **Run backend + frontend in one terminal** |
| `npm run build`   | Build frontend for production  |
| `npm run start:server` | Run backend in production |

### Quick start (one-command dev)

**Step 1 — Start MongoDB** (required once; Cursor cannot start system services for you)

- **Windows:** `net start MongoDB`
- **Mac/Linux:** `mongod` or `sudo systemctl start mongod`

**Step 2 — Run the app** (from project root)

```bash
npm run dev:all
```

This starts the API and the React app in one terminal. If MongoDB is not running, the backend will exit with a clear message telling you to start it.

- **Backend:** http://localhost:5000  
- **Frontend:** http://localhost:5173  
- **API health check:** http://localhost:5000/api/health  

**Or use two terminals:** Terminal 1: `npm run server` · Terminal 2: `npm run dev`

Frontend is configured to call `http://localhost:5000/api` via Axios.

**Seed data:** From `server/` run (in order if starting fresh):
- `npm run seed:users` – 5 students + 1 admin (e.g. `admin@edurozgaar.pk` / `Admin1234`).
- `npm run seed:phase4` – 50 jobs, 30 scholarships, 20 admissions, 20 blogs, 10 foreign studies, 10 notifications. Use `SEED_FORCE=1` to clear and reseed.
- `npm run seed:phase5` – Newsletter subscribers, user bookmarks, recently viewed, and view counts for trending (run after seed:users + seed:phase4).
- `npm run seed:phase7` – Analytics events, preferred language and channel preferences for sample users (run after seed:phase5). From `server/`: `node src/scripts/seedPhase7.js`.
- `npm run seed:phase8` – Sample scraped jobs/admissions, auto-generated blogs, newsletter logs (run after seed:phase4). From `server/`: `node src/scripts/seedPhase8.js`.
- **Mobile app**: `cd mobile && npm install && npm start`. Set `EXPO_PUBLIC_API_URL` to your API base (e.g. `http://localhost:5000/api/v1`).
- **Exam prep seed**: `cd server && npm run seed:exam-prep` — creates PPSC, FPSC, NTS, Punjab Police, WAPDA exams with sample syllabus, past papers, and practice quizzes.
- **Phase 9 seed**: `cd server && npm run seed:phase9` — 20 internships, 5 webinars, 15 international scholarships, 5 universities, 10 badge definitions, and sample leaderboard points.

## Docker (Phase 6)

**Production** (internal DB/API only, port 80 exposed):

```bash
cp .env.template .env   # set JWT_SECRET, SITE_URL, VITE_APP_URL
bash deploy/deploy.sh
```

See **[DEPLOYMENT.md §10](./DEPLOYMENT.md)** and **[docs/POST_LAUNCH.md](./docs/POST_LAUNCH.md)** for VPS setup, HTTPS (Caddy), seeding, and post-launch SEO.

**Local Docker debug** (exposes MongoDB 27017, backend 5000):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Smoke test after deploy:** `SITE_URL=https://yourdomain.com npm run smoke-test`

## Future Roadmap

- **Phase 5 (done)**: Viral growth — trending listings, dashboard, notifications, newsletter, SEO, toast alerts.
- **Phase 6 (done)**: Monetization (ads, featured/sponsored), FCM tokens, AI job generator, resume analyzer, Redis cache, Docker, security hardening.
- **Phase 7 (done)**: Investor-grade — AI recommendations API (`/api/v1/recommendations/me`), multi-channel alerts (Telegram/WhatsApp placeholders), Mobile API v1, English/Urdu i18n, SEO landing pages (`/jobs/province/:slug`, `/jobs/category/:slug`), analytics dashboard, schema markup.
- **Phase 8 (done)**: 10X growth — AI job scraper (cron every 6h), auto SEO blog generation, daily newsletter with logging, Admin Growth Dashboard, scraped “New” badges on Jobs/Admissions, React Native (Expo) mobile app in `mobile/`.
- **Ultimate Power (done)**: AI resume scanner (scan history, suggestions, Redis cache), Government exam preparation (PPSC, FPSC, NTS, Punjab Police, WAPDA — syllabus, past papers, MCQs, timed quizzes, badges, leaderboard), dashboard and nav integration.
- **Phase 9 (done)**: Internships & Trainings portal (filters, apply, save), AI cover letter generator (from job detail + resume_scans), Career counseling chatbot (dashboard, history), Live webinars & workshops (upcoming, register, recorded), International scholarships (filters, save, universities), Gamified badges & leaderboard (points, rank, badges on dashboard), Dashboard integration for all; monetization (paid postings via paidUntil, sponsored exam content via isSponsored on Exam).

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Syed Daniyal Abbas. See [LICENSE](LICENSE) for the full text.
