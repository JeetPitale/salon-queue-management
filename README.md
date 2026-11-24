# Salon Queue Management System
*Live demo:* https://velvet-and-blade.vercel.app *(Alternative Vercel domain: https://salon-queue-management.vercel.app)*  
*Hosted on:* Vercel (Frontend & Serverless API) + Neon (Cloud PostgreSQL)  
*Mobile Demo Video (1080×1920 Full HD MP4):* [demo-video.mp4](demo-video.mp4) *(GitHub Release Download: https://github.com/JeetPitale/salon-queue-management/releases/download/v1.0.0/demo-video.mp4)*

---

### Staff & Test Login Credentials

| Portal / Screen | Route | Role / Identifier | Password / Code | Capabilities |
|---|---|---|---|---|
| **Admin Console** | `/admin/login` | `admin` | `password123` | Analytics, revenue, service management, salon settings, staff roster |
| **Receptionist Desk** | `/receptionist/login` | `receptionist` | `password123` | Live queue board, walk-in creation, customer calling, payment recording |
| **Stylist Station** | `/stylist/login` | `aarav` | `password123` | Active chair management, service timer, skill-matched customer queue |
| **Stylist Station** | `/stylist/login` | `priya` | `password123` | Active chair management, hair coloring, spa & facial services |
| **Stylist Station** | `/stylist/login` | `kabir` | `password123` | Active chair management, haircut & beard services |
| **Customer Phone OTP** | `/verify` | Any 10-digit mobile | `123456` | Verified queue entry & live token generation |

> **Public Screen Shortcuts:**
> - **Customer Entry & Live Queue:** `/`
> - **Self-Check-In Kiosk:** `/kiosk` (Full-screen touch terminal with mobile QR code sync)
> - **Live Salon TV Display Board:** `/display` (High-visibility waiting area display with audio chimes)

---

## About

**Salon Queue Management System** is a mobile-first, real-time web application built for modern single-location salons and barbershops. It replaces chaotic waiting areas and paper registers with an automated, transparent queueing experience for walk-ins, online customers, stylists, receptionists, and salon owners.

Customers can view live estimated wait times, pick services, join the virtual line from their mobile phone or an entrance kiosk, and track their turn in real-time. Receptionists can call customers, stylists can manage their chairs according to their qualified service skills, and owners can monitor revenue, footfall, and no-show metrics in real-time.

---

## Key Features

### 1. Customer & Public Experience
- **Real-Time Queue Transparency (C1)**: Live estimated wait time calculation ($Wait = \lceil \frac{\text{Minutes Ahead}}{\text{Working Stylists}} \rceil$), working stylist count, and salon hours.
- **Service Selection & Instant Totals (C2)**: Multi-service cart showing real-time combined duration and cost.
- **Fraud-Resistant Mobile Verification (C3)**: 6-digit OTP verification preventing ghost entries and duplicates.
- **Live Turn Tracking & Grace Timer (C4)**: Real-time Server-Sent Events (SSE) updates under 2 seconds. When called, a 10-minute pulsing grace countdown keeps customers alert.
- **Post-Service Star Feedback (C5)**: 1 to 5-star customer review collection.
- **Entrance Touchscreen Kiosk (K1)**: Self-service kiosk generating dynamic QR codes allowing customers to transfer tracking to their phone.
- **Live Salon TV Display Board (D1)**: Privacy-conscious waiting area screen (first names only, masked numbers), audio chime alerts, "Now Serving" chairs, and "Next Up" ticker.
- **Trilingual Localization & Numeral Transliteration**: Complete English, Hindi, and Gujarati translations, including automatic digit transliteration (`0–9`, `०–९`, and `૦–૯`).

### 2. Staff & Management Workflows
- **Role-Isolated Security**: Strictly segregated authentication guards (`/admin/login`, `/receptionist/login`, `/stylist/login`) preventing cross-role access.
- **Live Queue Management Board (S2)**: Auto-call next customer, manual chair assignment, status progression (`WAITING` $\rightarrow$ `CALLED` $\rightarrow$ `IN_SERVICE` $\rightarrow$ `COMPLETED`), and integrated Cash/UPI/Card payment recording.
- **Walk-in Counter Dispatch (S3)**: Receptionist walk-in entry allocating sequential per-day tokens.
- **Stylist Station Console (T1)**: Dedicated seat view showing currently served customer, service timers, and upcoming skill-matched clients.
- **Executive Analytics Dashboard (M1)**: Real-time footfall, no-show rate, gross revenue, average ratings, and CSV report exports.
- **Catalog & Roster Controls (M2–M4)**: Manage operating hours, grace period, stylist skill tags, and service catalog.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Dynamic API Routes)
- **Language**: TypeScript (Strict typing, no `any`)
- **Styling**: Tailwind CSS (Mobile-first responsive architecture: 320px to 2560px viewports)
- **Database**: PostgreSQL (Prisma ORM 5.22.0)
- **Cloud Database**: Neon Serverless PostgreSQL
- **Real-Time Updates**: Server-Sent Events (SSE) with automatic reconnection and 15s polling fallback
- **Testing**: Vitest (18 automated tests passing for data invariants, wait maths, and role isolation)
- **Deployment**: Vercel (Edge/Serverless Platform)

---

## Local Setup & Development Instructions

### Prerequisites
- Node.js 18.17+ or 20+
- PostgreSQL database (Local or Cloud like Neon)

### 1. Clone Repository
```bash
git clone https://github.com/JeetPitale/salon-queue-management.git
cd salon-queue-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salon_queue"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Seed
Push the Prisma schema to create tables and seed default staff and services:
```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Test Suite
```bash
npm test
```

---

## Deployment Configuration

### Vercel Deployment
1. Import repository `JeetPitale/salon-queue-management` in Vercel.
2. In **Environment Variables**, add:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string (e.g. from Neon).
   - `NEXT_PUBLIC_APP_URL`: Your Vercel production URL (e.g. `https://velvet-and-blade.vercel.app`).
3. Deploy! The `package.json` build command automatically executes `prisma generate && next build`.
