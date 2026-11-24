# AI Coding Agent Prompts History (`prompts.md`)

This document contains the complete, chronological record of every prompt given to the AI coding agent throughout the entire development lifecycle of the **Salon Queue Management System**.

---

## 1. Initial Project Development

### Prompt #1 — Project Initiation & Architecture Analysis
* **Timestamp**: `2026-11-24T12:27:36Z` (`17:57:36 IST`)
* **Prompt**:
  ```text
  read all four files and make website
  ```
* **Intent**: Instructed the agent to read `AGENTS.md`, `01-brief.md`, `02-screens.md`, and `03-flows-rules.md`, understand all requirements, rules (R1–R5), screen specs (C1–C5, S1–S4, T1, M1–M4, D1, K1), and build the complete Next.js TypeScript application.
* **Result**: The agent set up Next.js 14 App Router, Prisma ORM schema with PostgreSQL, core rule engines, services, seed data, and foundational route structure.
* **Limitations / Follow-ups Needed**: The application had not yet been started or tested in runtime.

---

### Prompt #2 — Local Server Execution
* **Timestamp**: `2026-11-24T12:47:48Z` (`18:17:48 IST`)
* **Prompt**:
  ```text
  run
  ```
* **Intent**: Start the local development server and ensure dependencies, database, and dev servers were running.
* **Result**: Launched `npm run dev` and verified API endpoints and routes.
* **Issue Discovered**: The portals shared a generic staff login modal without strict role enforcement or isolated authentication endpoints for different staff types.

---

## 2. Authentication & Role Isolation

### Prompt #3 — Role-Isolated Staff Authentication
* **Timestamp**: `2026-11-24T12:54:38Z` (`18:24:38 IST`)
* **Prompt**:
  ```text
  make different and isolate each login
  ```
* **Intent**: Separate the staff authentication experience so that Admins, Receptionists, and Stylists have dedicated login portals (`/admin/login`, `/receptionist/login`, `/stylist/login`) with strict server-side validation preventing cross-role access (e.g. a stylist cannot access admin reports).
* **Result**:
  - Implemented `/admin/login` allowing only `ADMIN` roles.
  - Implemented `/receptionist/login` allowing only `RECEPTIONIST` roles.
  - Implemented `/stylist/login` allowing only `STYLIST` roles.
  - Added role verification tests in `tests/rules.test.ts`.

---

### Prompt #4 — Server Verification
* **Timestamp**: `2026-11-24T13:01:50Z` (`18:31:50 IST`)
* **Prompt**:
  ```text
  run
  ```
* **Intent**: Re-run and verify the updated isolated login routes.
* **Result**: Ran tests and confirmed separate role-isolated logins were functional.

---

## 3. Localization & Translation Improvements

### Prompt #5 — Comprehensive Translation Coverage
* **Timestamp**: `2026-11-24T13:13:18Z` (`18:43:18 IST`)
* **Prompt**:
  ```text
  fix translate issue not translate each and every thing
  ```
* **Intent**: The in-app language switcher (English, Hindi, Gujarati) left several headers, badges, and status labels in English.
* **Result**: Expanded the dictionary in `src/lib/i18n.ts` and `src/components/LanguageContext.tsx` to cover navigation titles, button states, service descriptions, and status badges.
* **Remaining Issue**: While static text was now translating, numeric figures (wait minutes, people counts, operating hours, prices) were still rendering as standard Western Arabic digits (`0–9`) rather than localized Indic numerals.

---

## 4. Responsive Design & Multi-Device Optimization

### Prompt #6 — Full-Spectrum Responsive UI/UX Refactoring
* **Timestamp**: `2026-11-24T13:19:03Z` (`18:49:03 IST`)
* **Prompt**:
  ```text
  Act as a Senior Frontend Engineer and Responsive UI/UX Specialist.

  Your task is to make my entire existing website fully responsive across all screen sizes and devices, including mobile phones, tablets, laptops, desktops, and ultra-wide monitors.

  ### 1. Responsive Breakpoints
  Ensure the website works perfectly at these viewport widths:

  - 320px – Small mobile
  - 375px – Standard mobile
  - 425px – Large mobile
  - 576px – Small tablet
  - 768px – Tablet
  - 1024px – Small laptop
  - 1280px – Standard laptop
  - 1440px – Desktop
  - 1920px – Large desktop
  - 2560px – Ultra-wide display

  Do not optimize only for these exact widths. The layout must adapt smoothly to every intermediate screen size.

  ### 2. Responsive Design Requirements

  Layout & Containers
  - Eliminate unwanted horizontal scrolling.
  - Use fluid layouts instead of fixed widths.
  - Apply CSS Grid, Flexbox, and responsive sizing where appropriate.
  - Use clamp(), min(), max(), and percentage-based sizing when useful.
  - Maintain consistent spacing and alignment.

  Navigation
  - Convert desktop navigation into a mobile-friendly hamburger menu.
  - Ensure menus open and close correctly.
  - Prevent navigation items from overflowing.
  - Make dropdowns and navigation interactions touch-friendly.

  Typography
  - Scale headings, paragraphs, and buttons according to screen size.
  - Prevent text clipping, overlapping, and awkward wrapping.
  - Maintain proper line height and readability.

  Images & Media
  - Ensure images resize proportionally.
  - Use max-width: 100% and height: auto where appropriate.
  - Prevent image stretching and overflow.
  - Make videos, banners, and background images responsive.

  Sections & Components
  - Make every section responsive, including hero sections, cards, grids, forms, tables, buttons, footers, modals, and sidebars.
  - Stack multi-column layouts vertically on smaller screens when necessary.
  - Maintain appropriate padding and margins.
  - Ensure cards fit naturally without overflowing.

  Interactive Elements
  - Make buttons and clickable elements touch-friendly.
  - Ensure forms and input fields fit mobile screens.
  - Check modals, dropdowns, sliders, tabs, and animations.
  - Preserve all existing interactions and functionality.

  ### 3. Design Preservation
  IMPORTANT:
  - Do NOT redesign my website.
  - Do NOT change the existing color palette, branding, typography style, visual identity, or overall design language.
  - Do NOT remove existing sections, content, animations, or features.
  - Maintain the current desktop design as closely as possible.
  - Only make changes necessary to improve responsiveness and usability.

  ### 4. Technical Requirements
  - First inspect the entire project structure and identify the framework and styling system.
  - Review all pages, components, layouts, and existing CSS.
  - Reuse existing components and styling conventions.
  - Avoid unnecessary dependencies.
  - Avoid duplicate CSS and excessive media queries.
  - Fix conflicting styles and hardcoded dimensions where necessary.
  - Ensure responsive behavior does not break existing desktop layouts.

  ### 5. Testing & Quality Assurance
  After implementation:
  - Test every page at the specified viewport widths.
  - Identify and fix horizontal scrolling.
  - Check overlapping elements, broken layouts, text clipping, and image distortion.
  - Verify navigation and interactive components.
  - Check both portrait and landscape orientations.
  - Ensure the website works in Chrome, Safari, Firefox, and Edge.

  ### 6. Final Objective
  Deliver a production-ready, fully responsive website that provides a consistent and polished user experience on every device.

  Do not just provide suggestions or a report. Directly inspect, modify, implement, and test the actual project files.

  At the end, provide a short summary of:
  1. Files modified.
  2. Responsiveness improvements made.
  3. Issues discovered and fixed.
  4. Any remaining limitations.
  ```
* **Intent**: Comprehensive overhaul of all CSS layouts, navigation, tables, and modals to support fluid scaling from 320px up to 2560px without horizontal scroll or layout clipping.
* **Result**:
  - Refactored `Header.tsx` with mobile hamburger sheet drawer.
  - Refactored `AdminNav.tsx` with collapsible mobile drawer and responsive icon pills.
  - Made `QueueBoard`, `StylistQueue`, `ReportsDashboard`, `KioskCheckIn`, and `PublicDisplayBoard` fluid.
  - Built headless Chrome test suite verifying 120 viewport/page combinations with 0 horizontal overflow issues.

---

## 5. Domain Inquiries & Bug Fixes

### Prompt #7 — Kiosk vs. Online Queue Clarification
* **Timestamp**: `2026-11-24T13:35:01Z` (`19:05:01 IST`)
* **Prompt**:
  ```text
  what is the difference between self kiosk and join queue feature
  ```
* **Intent**: User requested a clear conceptual and behavioral comparison between the customer mobile `/join` flow and the on-premise entrance tablet `/kiosk` flow.
* **Result**: Clarified that `/join` is for remote customers on their personal devices, while `/kiosk` is a physical touch terminal (K1) that auto-resets after 30 seconds of inactivity and generates a mobile tracking QR code.

---

### Prompt #8 — Numeral Localization Bug Fix
* **Timestamp**: `2026-11-24T13:49:01Z` (`19:19:01 IST`)
* **Prompt**:
  ```text
  number is not translating when i am using inbuilt translate of website
  [Attachment: image/png showing Gujarati homepage with "139 મિનિટ", "13 રાહ જોતા લોકો", "09:00 - 21:00", "3 હાજર"]
  ```
* **Intent**: Fixed the issue where text translated into Gujarati and Hindi, but digits (`139`, `13`, `09:00 - 21:00`, `3`) remained in English.
* **Result**:
  - Implemented `formatLocalizedNumber()` in `src/lib/i18n.ts` and exposed `tNumber()` in `LanguageContext.tsx`.
  - Gujarati transliterates to `[૦, ૧, ૨, ૩, ૪, ૫, ૬, ૭, ૮, ૯]`.
  - Hindi transliterates to `[०, १, २, ३, ४, ५, ६, ७, ८, ९]`.
  - Wrapped all count, duration, time, currency, and token interpolations across all screens.
  - Added unit test suite `tests/i18n-numbers.test.ts` (18/18 tests passing).

---

## 6. Git & GitHub Deployment

### Prompt #9 — GitHub Profile Inquiry
* **Timestamp**: `2026-11-24T13:53:22Z` (`19:23:22 IST`)
* **Prompt**:
  ```text
  on which github profile you are uploading
  ```
* **Intent**: Inquired which GitHub user profile was connected to the local development environment.
* **Result**: Checked `gh auth status` and reported that the CLI is authenticated to `@JeetPitale` (`jeetdipakpitale1107@gmail.com`), but no remote was yet configured.

---

### Prompt #10 — Repository Creation & Push Request
* **Timestamp**: `2026-11-24T14:06:46Z` (`19:36:46 IST`)
* **Prompt**:
  ```text
  not showing on github
  ```
* **Intent**: Clarified that code had not been uploaded yet because it had only been committed locally.
* **Result**: Created public repository `JeetPitale/salon-queue-management` on GitHub and pushed all local commits.

---

## 7. Cloud Deployment Troubleshooting

### Prompt #11 — Vercel Build Error Troubleshooting
* **Timestamp**: `2026-11-24T14:25:32Z` (`19:55:32 IST`)
* **Prompt**:
  ```text
  [Attachment: screenshot of Vercel deployment log]
  Error: Failed to collect page data for /api/auth/otp/send
  clientVersion: '5.22.0'
  Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
  ```
* **Intent**: Troubleshoot and resolve the Vercel cloud build failure.
* **Result**:
  - Identified that `package.json` had `"build": "next build"` without `prisma generate`, causing Prisma engine binaries to be missing on Linux.
  - Discovered API routes lacked `export const dynamic = "force-dynamic"`, triggering static evaluation during build.
  - Added `"build": "prisma generate && next build"` and `"postinstall": "prisma generate"`.
  - Added Linux engine targets (`rhel-openssl-1.0.x`, `rhel-openssl-3.0.x`, `debian-openssl-3.0.x`) to `schema.prisma`.
  - Provisioned and migrated a live cloud PostgreSQL database on Neon, pushing schema and seed data.
  - Committed and pushed fixes to GitHub.

---

## 8. Final Documentation & Submission Audit

### Prompt #12 — Project Audit, Documentation & Submission Preparation
* **Timestamp**: `2026-11-24T14:35:12Z` (`20:05:12 IST`)
* **Prompt**:
  ```text
  Act as a Senior Software Engineer, Project Auditor, and Submission Documentation Specialist.

  I need to prepare my existing project for final submission. Your job is to thoroughly inspect my entire project, compare it against the requirements below, identify everything that is missing or incomplete, and implement the necessary changes...
  ```
* **Intent**: Comprehensive final audit, creation of structured `README.md`, `prompts.md`, `reflection.md`, 3-minute demo video recording plan, and final submission checklist.
* **Result**: Project verified, documented, secrets un-tracked, test suites passing, and submission artifacts finalized.

---

## 9. Professional Mobile Demo Video Creation

### Prompt #13 — 3-Minute Vertical Mobile Demo Video
* **Timestamp**: `2026-11-24T15:45:00Z` (`21:15:00 IST`)
* **Prompt**:
  ```text
  create an video for me 
  Act as a Professional Product Demo Video Creator and UI/UX Motion Designer.
  I want you to create a 3-minute professional demo video of my existing website, showcasing its complete functionality in mobile view.
  ...
  - Duration: Approximately 3 minutes.
  - Orientation: Vertical (9:16), optimized for mobile viewing.
  - Resolution: 1080 × 1920 (Full HD).
  - Deliverable: Create an actual MP4 demo video showing my website's complete main workflow in mobile view, ready for submission.
  ```
* **Intent**: Programmatically create an actual 1080×1920 (9:16) vertical MP4 video file demonstrating the real application end-to-end on a mobile viewport, with speech narration and UI caption cards.
* **Result**:
  - Authored headless Chrome automated capture script `scripts/create-demo-video.mjs` using Chrome DevTools Protocol at 450×800 @ 2.4 device scale factor (`1080×1920`).
  - Synthesized speech narration audio for all 6 scenes using macOS TTS (`Rishi` voice) and encoded 44.1 kHz stereo audio tracks with ffmpeg.
  - Injected crisp in-browser lower-third overlay badges and titles for each scene and state transition.
  - Recorded 6 scenes:
    1. Introduction & Landing
    2. Homepage & Trilingual Numeral Transliteration
    3. Primary Customer Journey (Join, Cart, OTP Verification, Live Turn SSE Tracking)
    4. Staff Console & Waiting Area Salon TV Display
    5. End-to-End Workflow (Walk-in, UPI Checkout, 5-Star Feedback Form)
    6. Entrance Touch Kiosk, Admin Reports & Project Submission Conclusion
  - Encoded and concatenated final Full HD vertical MP4 video: `demo-video.mp4` (root) and `public/demo-video.mp4` (147.2s, 1080×1920, 12.84 MB).
