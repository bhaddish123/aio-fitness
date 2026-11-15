# All In One Fitness — Booking Platform

Full-stack session booking platform built for Everett Lee Fitness. Clients browse session types, pick an available slot, complete an intake form, and pay with Stripe Checkout. The coach manages bookings, the weekly schedule, and site content from a JWT-protected admin panel.

**Live site:** [everettleecoaching.com](https://everettleecoaching.com)

> This repo is the product I shipped and still maintain as sole developer (infrastructure, backend, frontend, and ongoing support). An earlier iteration lives in [`a3fit`](https://github.com/bhaddish123/a3fit).

---

## Tech stack

| Layer | Choices in this repo |
|---|---|
| Frontend | React 18, Vite, React Router v6, plain CSS (no Tailwind), axios, date-fns, react-big-calendar, framer-motion |
| Backend | Java 21, Spring Boot 3.5, Spring Security (stateless JWT), Bean Validation |
| Data | PostgreSQL (AWS RDS in production), Flyway migrations (`V0`–`V12`) |
| Payments | Stripe Checkout + webhooks (`stripe-java`) |
| Email | JavaMailSender via Gmail SMTP (confirmation, reminders, cancellation, inquiries) |
| Calendar | Google Calendar API via a service account (optional — booking still works if unset) |
| Hosting | Frontend on Vercel (`frontend/vercel.json` SPA rewrites). Production API is served at `https://api.everettleecoaching.com`. |

---

## Architecture

```
Browser (everettleecoaching.com)
    │  axios
    ▼
Spring Boot API
    ├── Public: session types, availability, reserve, checkout, cancel-by-token,
    │           site content, coaching inquiries, Stripe webhook
    ├── Admin (JWT): bookings, refunds, availability rules, schedule overrides, content
    ├── PostgreSQL + Flyway
    ├── Stripe Checkout / refunds / webhook signature check
    └── Google Calendar (create / delete events, FreeBusy for slot filtering)
```

### Booking flow

1. Client chooses a session type and an available slot (slots are generated from weekly availability rules for the next 30 days, plus admin overrides). Slots must be at least 6 hours in the future. Google Calendar busy intervals are subtracted from the list when Calendar is configured.
2. Client submits contact info, a fitness intake form, and a waiver.
3. The backend creates a `RESERVED` booking and holds the slot for **5 minutes** (`reservedUntil = now + 300s`). A scheduled job deletes expired reservations once a minute.
4. For paid sessions, the client is sent to Stripe Checkout. A `checkout.session.completed` webhook confirms the booking, sends email, and creates a Calendar event.
5. Free sessions (price `0`, e.g. a complimentary consultation) skip Stripe and are confirmed immediately.
6. Confirmation, 24-hour and 2-hour reminders, and a post-session follow-up are sent by a scheduler. Clients can cancel with a unique token (no refund if cancelled within 24 hours of the session).

---

## Project structure

```
aio-fitness/
├── frontend/                         # React + Vite app
│   └── src/
│       ├── pages/                    # Home, About, FAQ, Booking, Coaching, Results,
│       │                             # Login, Success, Cancel, Admin (dashboard, bookings,
│       │                             # schedule, content)
│       ├── components/               # Navigation, Footer, ProtectedRoute, …
│       ├── services/                 # axios API clients
│       ├── styles/                   # CSS design system
│       └── utils/constants.js        # API_BASE_URL and route helpers
└── backend/aio-fitness-backend/
    ├── start.sh                      # sources .env, then ./mvnw spring-boot:run
    ├── src/main/java/com/aiofitness/
    │   ├── controller/               # REST endpoints
    │   ├── service/                  # Booking, availability, email, calendar, cleanup
    │   ├── model/                    # JPA entities
    │   ├── dto/                      # Request/response objects
    │   └── config/                   # Security, JWT, Stripe, CORS, exception handler
    └── src/main/resources/
        ├── application.yml           # Config from environment variables
        └── db/migration/             # Flyway SQL (V0–V12)
```

---

## Running locally

**Prerequisites:** Node 18+, Java 21, PostgreSQL, and the [Stripe CLI](https://stripe.com/docs/stripe-cli) if you want to test webhooks.

### Backend

`application.yml` reads these variable names (this is what Spring Boot actually binds). Create `backend/aio-fitness-backend/.env` — it is gitignored — and start with `./start.sh`, which `source`s that file.

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aio_fitness
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=

# Gmail SMTP
MAIL_USERNAME=
MAIL_PASSWORD=          # Gmail App Password
NOTIFY_EMAIL=           # where inquiry / booking notifications go

# Stripe
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=  # required in any environment that receives live webhooks

# JWT and admin login
JWT_SECRET=             # long random Base64 string (HS256 key material)
ADMIN_USERNAME=
ADMIN_PASSWORD=

# Frontend origin, used in Stripe success/cancel URLs
APP_BASE_URL=http://localhost:5173

# Google Calendar (optional — leave blank to skip sync)
GOOGLE_CALENDAR_ID=
GOOGLE_CALENDAR_CREDENTIALS_JSON=   # full service-account JSON, one line
```

```bash
cd backend/aio-fitness-backend
./start.sh
```

The API listens on `http://localhost:8080`. Flyway runs on startup (`ddl-auto: validate`).

> Note: `.env.example` currently uses `DB_URL` / `DB_USERNAME` / `DB_PASSWORD`. Those names are **not** the ones in `application.yml`. Use the `SPRING_DATASOURCE_*` names above, or the datasource will not be configured.

To forward Stripe webhooks locally:

```bash
stripe listen --forward-to localhost:8080/webhook/stripe
```

### Frontend

```bash
cd frontend
npm install
# optional: echo 'VITE_API_BASE_URL=http://localhost:8080' > .env
npm run dev
```

The app runs at `http://localhost:5173`. If `VITE_API_BASE_URL` is unset, it defaults to `http://localhost:8080`. The production build is configured to call `https://api.everettleecoaching.com`.

CORS on the API allows `http://localhost:5173`, `https://everettleecoaching.com`, and `https://www.everettleecoaching.com`.

---

## Admin panel

Sign in at `/login`. Routes under `/admin/*` are wrapped in a frontend `ProtectedRoute` and require a Bearer JWT from `POST /admin/login`.

- **Dashboard / bookings** — list bookings, update status, issue refunds
- **Schedule** — monthly calendar, per-day slots, add or block overrides (blocks can also be written to Google Calendar)
- **Content** — edit site copy stored in `site_content`

Login attempts are rate-limited in memory (5 failures / 15 minutes per username).

---

## Highlights that are in the code

- Availability is computed from recurring weekly rules, not a static table of slots. Admin overrides can block a slot or add a one-off slot outside the rules.
- Reservations are short-lived; a cleanup scheduler removes expired `RESERVED` rows.
- Stripe webhooks are signature-checked and the confirm path is idempotent if the booking is already `CONFIRMED`.
- Client-supplied strings in HTML email bodies are passed through `HtmlUtils.htmlEscape`.
- Google Calendar failures are logged and must not roll back a confirmed, paid booking.
- Intake data (age, experience, goals, etc.) is stored on the booking and validated with Bean Validation / DB check constraints.

---

## License

Private client work. Ask before reusing.
