# AIO Fitness

Booking and payments platform for a fitness coaching business, live at [https://everettleecoaching.com](https://everettleecoaching.com). Clients browse the public site, reserve a session, and pay with Stripe Checkout (a session priced at 0 is confirmed without Stripe). The coach uses a JWT admin panel to manage bookings, the weekly schedule, and site content.

Clients do not have accounts. A booking is cancelled with a one-time token, and there is a single admin login from `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Coaching applications are emailed to the coach; the app does not bill subscriptions or deliver training programs. The public contact form is a `mailto:` link and is not stored.

## Features

**Clients**

- Public pages: home, about, FAQ, client results, and online coaching.
- Booking: pick an active session type, pick a slot, submit contact details and a fitness intake form, and accept a waiver.
- Slots are generated from weekly availability rules for the next 30 days in `America/New_York`, plus admin overrides. A slot must start at least 6 hours out. When Google Calendar is configured, busy intervals are removed from the list.
- Reserving a slot creates a `RESERVED` booking held for 5 minutes (`reservedUntil` is now plus 300 seconds). A scheduled job deletes expired reservations every minute.
- Paid sessions redirect to Stripe Checkout. The `checkout.session.completed` webhook confirms the booking, sends email, and creates a calendar event. If the hold has already expired, the payment is refunded and the booking is not confirmed. A price of 0 skips Stripe and is confirmed immediately.
- Email to the client: confirmation, a reminder about 24 hours before the start, a reminder about 2 hours before, and a follow-up once the start time is 30 minutes in the past. Cancelling with the token issues a Stripe refund only when the session is more than 24 hours away.
- The results page shows transformation photos and videos stored as site content. The coaching apply form posts to `/inquiries`.

**Admin** (`/login`, then `/admin/*`)

- Dashboard with booking counts and a recent list.
- Bookings: list, change status, and cancel with a Stripe refund (same 24-hour refund rule as the client token).
- Schedule: edit weekly availability rules, and add or block individual slots. A block is also written to Google Calendar when calendar credentials are set.
- Content: about copy and photo, home hero photo and video, a focus photo, FAQ entries, and transformation media (crop and trim in the browser).
- Login attempts are limited in memory to 5 failures per username in 15 minutes.

## Tech Stack

### Frontend

- React 18, Vite 5, React Router 6
- axios, date-fns, framer-motion, lucide-react, react-big-calendar, react-easy-crop
- Plain CSS
- ESLint (`npm run lint`)

### Backend

- Java 21, Spring Boot 3.5
- Spring Security with stateless JWT (jjwt)
- Spring Data JPA, Hibernate `ddl-auto: validate`, Bean Validation
- PostgreSQL and Flyway migrations `V0` through `V12`
- Stripe (`stripe-java`) and Gmail SMTP (`JavaMailSender`)
- Google Calendar API via a service account (optional; booking still works if unset)
- Scheduled jobs for reservation cleanup and reminder email

### Infrastructure

- The API listens on port 8080. CORS allows `http://localhost:5173`, `https://everettleecoaching.com`, and `https://www.everettleecoaching.com`.
- `frontend/vercel.json` rewrites every path to `index.html`.
- The frontend reads `VITE_API_BASE_URL`. If it is unset, `frontend/src/utils/constants.js` uses `http://localhost:8080`.

## Project Structure

```txt
aio-fitness/
├── frontend/
│   ├── vercel.json                 # SPA rewrite
│   └── src/
│       ├── pages/                  # public pages, booking, admin
│       ├── components/
│       ├── services/               # axios clients
│       └── utils/constants.js      # API_BASE_URL
└── backend/aio-fitness-backend/
    ├── start.sh                    # source .env, then ./mvnw spring-boot:run
    ├── pom.xml
    └── src/
        ├── main/java/com/aiofitness/    # controllers, services, models
        ├── main/resources/
        │   ├── application.yml
        │   └── db/migration/       # Flyway V0–V12
        └── test/java/com/aiofitness/
```

## Run locally

Needs Java 21, Node and npm, and PostgreSQL. `application.yml` binds the names below. `./start.sh` sources `backend/aio-fitness-backend/.env`, which is gitignored.

`.env.example` lists `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Those names are not in `application.yml`.

Required:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `STRIPE_API_KEY`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Optional (a default is set in `application.yml`, or the feature is skipped when blank):

- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `NOTIFY_EMAIL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_CREDENTIALS_JSON`
- `VITE_API_BASE_URL` (frontend)

```bash
cd backend/aio-fitness-backend
./start.sh
```

Flyway runs on startup. The API is at `http://localhost:8080`.

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server is at `http://localhost:5173`.

To forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:8080/webhook/stripe
```

## Test

The frontend `package.json` has no test script. Backend:

```bash
cd backend/aio-fitness-backend
./mvnw test
```

`LoginAttemptServiceTest` does not start Spring. `AioFitnessBackendApplicationTests` loads the application context, so the datasource variables must point at a reachable database.
