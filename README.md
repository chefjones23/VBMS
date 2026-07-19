# VBMS — Vehicle Booking Management System

A role-based web app for requesting, approving, and dispatching company vehicles for travel.

**Flow:** Employee books a vehicle → HOD approves or rejects the request → Transporter assigns a vehicle (from the fleet list or entered manually) and driver details → Employee sees the vehicle number and driver contact for their trip.

## Roles

| Role | Can do |
|---|---|
| **Employee (user)** | Submit travel/vehicle requests, track status, cancel while pending/approved |
| **HOD** | Review all requests, approve or reject with a remark |
| **Transporter** | Assign a vehicle (from fleet or manual entry) to approved trips, manage the fleet, mark trips completed |
| **Admin** | Everything above, plus create every account (Employee/HOD/Transporter/Admin) from **User Accounts**, and see an overview |

> **No self-registration.** There is no public sign-up. Every login — including Employee accounts — is created by an Admin from the **User Accounts** screen. Give people their email + a starting password directly.

## Tech stack

- **Frontend:** React (Vite), React Router, plain CSS (no framework) — a "dispatch manifest" visual theme
- **Backend:** Node.js + Express, JWT auth, bcrypt password hashing
- **Database:** SQLite via `sql.js` (pure JS, no native build tools needed on Windows — same approach used in GEMS), persisted to `backend/db/vbms.sqlite`
- **Real-time:** WebSocket notifications (booking approved / rejected / assigned) pushed live to the browser

## Project structure

```
vbms/
  backend/          Express API + SQLite (sql.js) + WebSocket server
    db/database.js  Schema + query helpers
    routes/         auth, bookings, fleet, users
    middleware/auth.js
    server.js       Entry point
    seed.js         Creates demo accounts + sample fleet
  frontend/         React (Vite) app
    src/pages/       Login, Register, dashboards per role, booking form, fleet, staff
    src/components/  Layout (sidebar/topbar), BookingTicket, NotificationBell, icons
    src/api/client.js API + WebSocket client
    src/context/AuthContext.jsx
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET for anything beyond local testing
node seed.js               # creates demo accounts + sample fleet (safe to skip/re-run)
npm start                   # runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                 # runs on http://localhost:5173 (or similar)
```

Open the frontend URL in your browser.

### Demo logins (password: `password123`)

- `user@vbms.test` — Employee
- `hod@vbms.test` — HOD
- `transporter@vbms.test` — Transporter
- `admin@vbms.test` — Admin

## Notes on deployment (based on GEMS/MRMS experience)

- `sql.js` avoids native module compilation issues on Windows — same reasoning as GEMS.
- The SQLite file is written to `backend/db/vbms.sqlite` on every write; if deploying to a host with an ephemeral filesystem (e.g. Render's free tier), mount a persistent disk or switch to a hosted Postgres for production use.
- Set `JWT_SECRET` to a long random string before deploying anywhere public.
- CORS is currently open (`cors()` with no options) — restrict `origin` to your frontend's domain before going live.
- The WebSocket path is `/ws` on the same server/port as the API, so most hosts that support Express + WebSockets (Render, Railway, a VPS) will work without extra configuration.

## Extending it

- Self-registration is disabled entirely — every account, including Employees, is created from Admin → User Accounts.
- Vehicle numbers can come from a managed fleet list or be typed in manually at assignment time — both are supported in the Transporter dashboard.
- Booking codes are formatted `VBMS-<year>-<sequence>` and reset their sequence each year.
