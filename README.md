# Mall Parking Management System

A full-stack Next.js 15 application for managing multi-mall parking operations with real-time slot tracking, dynamic surge pricing, online reservations, and comprehensive analytics.

Built with TypeScript, TailwindCSS 4, Prisma ORM, and SQLite — designed for production-ready deployment with role-based access, audit logging, and JWT authentication.

## Features

### Core Parking Operations
- **Vehicle Entry/Exit** — Record vehicle entry with auto slot assignment and process exit with automatic bill calculation
- **Smart Slot Assignment** — Auto-assigns Regular, Compact, EV, and Handicap slots based on vehicle type
- **Visual Parking Map** — Interactive floor-by-floor map showing slot status (Available/Occupied/Maintenance) with click-to-exit flow
- **Slot Management** — Mark slots for maintenance, view real-time occupancy per floor

### Dynamic Surge Pricing Engine
- **Peak Hour Rules** — Configure time-of-day and day-of-week multipliers (e.g., weekends 11AM–8PM → 1.5x)
- **Holiday Calendar** — Set holiday dates with custom surge multipliers (e.g., Diwali, New Year → 2x)
- **Occupancy-Based Triggers** — Auto-activate surge pricing when occupancy exceeds configurable thresholds (e.g., >70% full → 1.2x)
- **Real-Time Display** — Entry form shows current effective rate with surge badge and reason (Peak hours / Holiday / High occupancy)
- **Priority Evaluation** — Rules evaluated in priority order, highest matching multiplier applied

### Online Reservation & Public Booking Portal
- **3-Step Booking Flow** — Select mall → Choose vehicle type & date/time → Enter contact details → Instant QR confirmation
- **Phone-Based Registration** — Customers auto-register via phone number (no password needed)
- **Slot Availability Check** — Real-time availability verification before booking confirmation
- **QR Code Generation** — Each booking gets a unique QR code for check-in at the mall
- **Admin Booking Management** — View all reservations with status filter, check-in customers (auto-creates parking session), cancel bookings
- **Confirmation Page** — Print-friendly confirmation with booking ID, amount, entry/exit times

### Multi-Mall / Branch Support
- **4 City Malls** — Pre-seeded: City Mall (Delhi), Galaxy Mall (Noida), Metro Mall (Bangalore), Central Plaza (New Delhi)
- **Mall Switcher** — Dropdown in sidebar to switch between malls
- **Scoped Dashboard** — All stats, sessions, slots, and analytics filtered to selected mall
- **Branch Management** — Superadmin can create new malls with auto-seeded pricing rates and slots
- **Independent Configuration** — Each mall has its own pricing rates, pricing rules, holidays, operators, and slots

### Billing System
- **Hourly Slab Pricing** — Configurable via DB (default: ₹50/0–1h, ₹100/1–3h, ₹150/3–6h, ₹200/6h+)
- **Day Pass** — Flat rate charged at entry (default: ₹150)
- **Printable Receipt** — Modal with full billing breakdown, pricing slab details, and print button
- **Time Edit** — Admins can adjust entry/exit times for edge cases (audit logged)

### Analytics & Reporting
- **Real-Time Dashboard** — Live slot counts, floor occupancy bars, active sessions
- **Revenue Tracking** — Today's revenue with hourly vs. day pass breakdown, date range picker with presets (Today/Week/Month)
- **CSV Export** — Download revenue reports and session history as CSV files
- **Audit Log** — Comprehensive action log with operator names, action filters, and pagination

### Security & UX
- **JWT Authentication** — Secure login with bcrypt password hashing, rate-limited login endpoint
- **Role-Based Access** — Operator and admin roles with permission checks
- **Input Validation** — Zod schemas on all API routes
- **IP Rate Limiting** — Prevents brute-force login attacks
- **Dark Mode** — Toggle in sidebar with localStorage persistence
- **Keyboard Shortcuts** — Ctrl+E (Entry), Ctrl+X (Exit), Ctrl+F (Slots)
- **Responsive Design** — Mobile-friendly with collapsible sidebar
- **Loading Skeletons** — Animated placeholders during data fetching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | TailwindCSS 4, Lucide React icons |
| **Backend** | Next.js API Routes (REST) |
| **Database** | SQLite via Prisma ORM 6 |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Validation** | Zod |
| **Timezone** | Asia/Kolkata (IST) |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/         # Authenticated routes
│   │   ├── audit-log/       # Audit log viewer
│   │   ├── bookings/        # Admin booking management
│   │   ├── dashboard/       # Main dashboard (stats, entry, exit, slots)
│   │   ├── history/         # Parking session history
│   │   ├── parking-map/     # Visual floor map
│   │   ├── pricing/         # Surge pricing rules & holidays
│   │   ├── settings/        # Operators, pricing rates, malls
│   │   └── layout.tsx       # Dashboard layout (Sidebar + MallProvider)
│   ├── (portal)/            # Public routes
│   │   ├── book/            # 3-step booking form
│   │   │   └── confirm/[id] # Booking confirmation page
│   │   └── layout.tsx       # Public portal layout
│   ├── api/                 # REST API routes
│   │   ├── auth/            # Login/logout/check
│   │   ├── bookings/        # CRUD + listing
│   │   ├── customers/       # Customer upsert
│   │   ├── dashboard/       # Stats + CSV export
│   │   ├── holidays/        # Holiday CRUD
│   │   ├── malls/           # Mall CRUD
│   │   ├── operators/       # Operator CRUD
│   │   ├── parking/         # Entry/exit
│   │   ├── pricing-rules/   # Rule CRUD
│   │   ├── sessions/        # History + CSV export
│   │   ├── settings/        # Pricing rates
│   │   └── slots/           # Slot management + time edit
│   ├── globals.css          # Global styles (dark mode, print, animations)
│   ├── layout.tsx           # Root layout (ThemeProvider)
│   └── page.tsx             # Login page with public booking link
├── components/
│   ├── ActiveSessions.tsx
│   ├── ConfirmDialog.tsx
│   ├── EntryForm.tsx        # Entry form with surge pricing badge
│   ├── ExitForm.tsx
│   ├── MallSwitcher.tsx     # Mall dropdown in sidebar
│   ├── Notification.tsx
│   ├── ParkingHistory.tsx
│   ├── ReceiptModal.tsx     # Printable receipt
│   ├── RevenueCard.tsx      # Revenue with date presets + export
│   ├── Sidebar.tsx          # Navigation + mall switcher + dark mode
│   ├── Skeleton.tsx         # Loading skeletons
│   ├── SlotGrid.tsx
│   ├── StatsCards.tsx       # Stats with floor occupancy bars
│   └── TimeEditModal.tsx
├── context/
│   ├── MallContext.tsx      # Active mall state + localStorage
│   └── ThemeContext.tsx     # Dark mode state
└── lib/
    ├── auth.ts              # JWT + bcrypt helpers
    ├── db-pricing.ts        # DB-backed pricing rate fetching
    ├── db.ts                # Prisma client singleton
    ├── dynamic-pricing.ts   # Surge pricing engine
    ├── pricing.ts           # Original hardcoded pricing (fallback)
    ├── rate-limit.ts        # IP-based rate limiting
    ├── time-utils.ts        # IST timezone utilities
    └── validation.ts        # Zod schemas

prisma/
├── schema.prisma            # Full database schema
├── seed.ts                  # Seeder (4 malls, 960 slots, pricing rates)
└── migrations/              # Migration history
```

## Database Schema

### Models

| Model | Description |
|-------|-------------|
| **Mall** | Multi-branch support (name, location, timezone) |
| **Vehicle** | Registered vehicles by number plate and type |
| **ParkingSlot** | 240 slots per mall (3 floors × 4 sections × 20 slots) |
| **ParkingSession** | Entry/exit records with billing |
| **Operator** | Staff accounts with role-based access |
| **AuditLog** | Immutable action trail |
| **ParkingRate** | Configurable hourly slabs and day pass rates |
| **PricingRule** | Surge pricing rules (peak, holiday, occupancy) |
| **Holiday** | Calendar of holidays with multipliers |
| **Customer** | Booking portal customers (phone-based) |
| **Booking** | Online reservations with QR and status workflow |

### Slot Naming Convention
```
{Section}{Floor}-{Number}
  A1-01, B2-15, C3-20, D1-08
```
- Sections: A, B, C, D (20 slots each)
- Floors: 1, 2, 3
- Floor extracted via regex `[A-Z](\d)-`

### Booking Status Workflow
```
Pending → Confirmed → CheckedIn → Completed
                  ↘ Cancelled
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abhay-2108/Mall-Parking-Management-System.git
cd Mall-Parking-Management-System

# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema and seed data
npx prisma db push
npm run seed
```

### Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- **Username:** `admin`
- **Password:** `admin123`

### Public Booking Portal
Navigate to [http://localhost:3000/book](http://localhost:3000/book) to make a reservation without authentication.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT signing | `mall-parking-secret-key-2025` |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Operator login (rate limited) |
| POST | `/api/auth/logout` | Operator logout |
| GET | `/api/auth/check` | Verify authentication status |

### Parking Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parking/entry` | Record vehicle entry (with audit) |
| POST | `/api/parking/exit` | Process exit, calculate bill, return receipt |
| GET | `/api/slots` | List slots with filters (mallId, type, status) |
| PATCH | `/api/slots` | Update slot status (with audit) |
| PATCH | `/api/slots/update-time` | Adjust entry/exit time (with audit) |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Stats, floor occupancy, revenue, rate info |
| GET | `/api/dashboard/export` | CSV export of revenue data |
| GET | `/api/sessions` | Paginated session history |
| GET | `/api/sessions/export` | CSV export of sessions |

### Mall Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/malls` | List all malls |
| POST | `/api/malls` | Create mall (superadmin, auto-seeds rates) |
| PUT | `/api/malls/[id]` | Update mall details |
| DELETE | `/api/malls/[id]` | Delete mall (superadmin only) |

### Surge Pricing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing-rules` | List rules for a mall |
| POST | `/api/pricing-rules` | Create pricing rule |
| PUT | `/api/pricing-rules/[id]` | Update rule |
| DELETE | `/api/pricing-rules/[id]` | Delete rule |

### Holidays
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays` | List holidays for a mall |
| POST | `/api/holidays` | Add holiday date |
| DELETE | `/api/holidays/[id]` | Remove holiday |

### Online Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings or lookup by id/qrCode |
| POST | `/api/bookings` | Create booking with slot check |
| PATCH | `/api/bookings/[id]` | Update booking status / link session |
| DELETE | `/api/bookings/[id]` | Cancel booking |

### Settings & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/operators` | List / create operators |
| PUT/DELETE | `/api/operators/[id]` | Update / delete operator |
| GET/PUT | `/api/settings/rates` | Get / update pricing rates |
| GET | `/api/audit-logs` | Paginated audit logs with action filter |
| POST | `/api/customers` | Upsert customer by phone |

## Seeded Data

| Entity | Count | Details |
|--------|-------|---------|
| **Malls** | 4 | City Mall, Galaxy Mall, Metro Mall, Central Plaza |
| **Slots** | 960 | 240 per mall (3 floors, 4 sections, 20 slots each) |
| **Operators** | 1 | admin / admin123 |
| **Pricing Rates** | 20 | 5 rates × 4 malls (hourly slabs + day pass) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run seed` | Seed database with default data |
| `npx prisma studio` | Open Prisma Studio GUI |
| `npx prisma db push` | Push schema without migration |
| `npx prisma migrate dev` | Create and apply migration |

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For production:
- Use a cloud-hosted PostgreSQL or MySQL database
- Set a strong `JWT_SECRET` via environment variable
- Configure proper CORS, CSP, and security headers
- Run behind a reverse proxy (NGINX, Caddy)

## License

MIT

---

**Built with Next.js 15, TypeScript, TailwindCSS 4, and Prisma.**
