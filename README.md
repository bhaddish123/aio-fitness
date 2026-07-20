# All In One Fitness — Booking Platform

Full-stack session booking platform for Everett Lee Fitness. Clients can browse session types, select availability, complete intake forms, and pay via Stripe. Everett manages bookings, schedule, and site content through a protected admin panel.

---

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Plain CSS (custom design system, no Tailwind)
- Stripe Checkout redirect flow

**Backend**
- Java 21 / Spring Boot 3.5
- Spring Security (JWT, stateless)
- PostgreSQL on AWS RDS
- Flyway (database migrations)
- JavaMailSender (Gmail SMTP)
- Google Calendar API (service account)
- Stripe Java SDK

---

## Project Structure

```
aio-fitness/
├── frontend/                  # React/Vite app
│   └── src/
│       ├── pages/             # Home, About, Booking, Coaching, FAQ, Admin...
│       ├── components/        # Navigation, Footer, StickySocialSidebar...
│       ├── services/          # bookingService, scheduleService (axios)
│       ├── styles/            # CSS design system (variables, components...)
│       └── utils/constants.js # API base URL, endpoints
│
└── backend/aio-fitness-backend/
    ├── src/main/java/com/aiofitness/
    │   ├── controller/        # REST endpoints
    │   ├── service/           # Business logic, email, Stripe, Calendar
    │   ├── model/             # JPA entities
    │   ├── dto/               # Request/response objects
    │   └── config/            # Security, JWT, Stripe, CORS
    └── src/main/resources/
        ├── application.yml    # App config (reads from env vars)
        └── db/migration/      # Flyway SQL migrations (V0–V7)
```

---

## Local Setup

### Prerequisites
- Node 18+
- Java 21
- Maven (via `./mvnw`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Backend

1. Create `backend/aio-fitness-backend/.env` with all required variables (see below)
2. Run:

```bash
cd backend/aio-fitness-backend
./start.sh
```

`start.sh` loads `.env` and starts Spring Boot. Flyway migrations run automatically on startup. Runs at `http://localhost:8080`.

---

## Environment Variables

Create `backend/aio-fitness-backend/.env`. Never commit this file — it is gitignored.

```
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<db>
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=

# Gmail SMTP (sends automated emails)
MAIL_USERNAME=
MAIL_PASSWORD=       # Gmail App Password — requires 2FA enabled on the account
NOTIFY_EMAIL=        # Where Everett receives inquiry notifications

# Stripe
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# JWT
JWT_SECRET=          # Any long random base64 string

# Admin login
ADMIN_USERNAME=
ADMIN_PASSWORD=

# App
APP_BASE_URL=http://localhost:5173

# Google Calendar (optional — skip to disable calendar sync)
GOOGLE_CALENDAR_ID=
GOOGLE_CALENDAR_CREDENTIALS_JSON=
```

---

## Booking Flow

1. Client picks a session type → selects an available slot
2. Fills out contact info + fitness intake form + waiver
3. Backend reserves the slot (15-min hold) + creates Stripe Checkout session
4. Client pays → Stripe webhook fires → booking confirmed
5. Confirmation email sent to client; slot blocked on Google Calendar

---

## Email Flow

All emails sent from `MAIL_USERNAME` via Gmail SMTP.

| Trigger | Recipient |
|---|---|
| Booking confirmed | Client |
| Booking cancelled | Client |
| 24-hour reminder | Client |
| 2-hour reminder | Client |
| Post-session follow-up | Client |
| Coaching inquiry submitted | `NOTIFY_EMAIL` + client confirmation |

---

## Admin Panel (`/admin`)

JWT-protected. Login at `/login`.

- **Bookings** — view all, update status, issue refunds
- **Schedule** — monthly calendar, per-day slot modal, add/block overrides
- **Content** — edit bio, testimonials (live on site immediately)

---

## Database Migrations

Flyway runs on startup. Never edit existing migration files — always add a new versioned file.

| Version | Description |
|---|---|
| V0 | Baseline schema |
| V1 | Client intake fields |
| V2 | Drop legacy unique constraint |
| V3 | Admin user table |
| V4 | Site content table |
| V5 | Google Calendar event ID column |
| V6 | Seed real session types + availability rules (Mon–Sat 7am–2pm) |
| V7 | Add Virtual Training Session type |

---

## Pending Before Launch

- [ ] Real Gmail App Password → `MAIL_PASSWORD` in `.env`
- [ ] Stripe live keys → swap `STRIPE_API_KEY` to `sk_live_...`
- [ ] Stripe webhook secret → from Stripe CLI or dashboard
- [ ] Google Calendar → share Everett's calendar with service account, add credentials to `.env`
- [ ] Professional photos from Everett → replace hero/about placeholders
- [ ] Testimonials → enter via admin panel → Content tab
- [ ] Deploy frontend → Vercel
- [ ] Deploy backend → Railway
- [ ] Connect custom domain
