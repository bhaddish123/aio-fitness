# A3 Fitness — Session Booking Platform

A full-stack web application for a personal training studio. Clients can browse session types, book appointments, and pay online. The trainer has a dedicated admin dashboard to manage the schedule, view bookings, and handle availability.

---

## Features

### Client-Facing
- Browse session types (30-min, 60-min, etc.)
- Interactive calendar showing real-time availability
- Stripe-powered checkout with secure payment processing
- Booking confirmation email with cancellation link
- Automated reminder emails (24h and 2h before session)
- Post-session follow-up email

### Admin Dashboard
- JWT-secured login
- Monthly calendar view with color-coded slot status (confirmed, reserved, available, blocked)
- Per-day slot modal — view, edit, block, and add time slots
- Manage all bookings with status updates
- Schedule override system — block individual slots or add one-off availability outside of recurring rules

---

## Tech Stack

**Frontend**
- React 18, React Router v6
- Vite
- Custom CSS design system (Apple-inspired)

**Backend**
- Java 21, Spring Boot 3
- Spring Security with stateless JWT authentication
- Spring Data JPA / Hibernate
- PostgreSQL (AWS RDS)
- Stripe API (payments + webhooks)
- JavaMailSender with Gmail SMTP
- Spring `@Scheduled` for automated email reminders

---

## Architecture

```
frontend/          React SPA (Vite)
backend/
  └── a3fit-backend/   Spring Boot REST API
        ├── controller/   REST endpoints (auth, bookings, availability, admin)
        ├── service/      Business logic, email, scheduling
        ├── model/        JPA entities (Booking, SessionType, AvailabilityRule, ScheduleOverride)
        └── repository/   Spring Data repositories
```

**Booking flow:**
1. Client selects session type → picks available slot on calendar
2. Backend reserves slot (15-min hold) → creates Stripe Checkout session
3. Client completes payment → Stripe webhook confirms booking
4. Confirmation email sent → reminders scheduled automatically

---

## Running Locally

### Prerequisites
- Java 21
- Node 18+
- PostgreSQL
- Stripe CLI (for webhook testing)

### Backend

Set the following environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/a3fit_backend
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_db_password
export JWT_SECRET=your_jwt_secret
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=your_admin_password
export MAIL_USERNAME=your_gmail@gmail.com
export MAIL_PASSWORD=your_gmail_app_password
export STRIPE_API_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
```

```bash
cd backend/a3fit-backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:8080`.

---

## Key Implementation Details

- **Availability rules** — recurring weekly schedule stored in DB; slots computed dynamically for the next 30 days
- **Schedule overrides** — admin can block individual slots or add one-off slots outside of rules; both reflected immediately in client-facing availability
- **Reservation expiry** — slots are held for 15 minutes during checkout; a cleanup scheduler releases unpaid reservations automatically
- **Idempotent webhooks** — Stripe webhook handler checks existing booking status before processing to avoid duplicate confirmations
