# Interactive Onboarding Tour Guide

This document describes the interactive user onboarding tour system implemented in the **Salon Queue Management System** (`Velvet & Blade Salon`).

---

## 1. Overview & Purpose

The onboarding tour provides first-time visitors with an interactive, friendly walkthrough of the application's core capabilities. It removes cognitive load and helps new users immediately understand:
- How live waiting times are calculated.
- How to pick services and join the virtual queue.
- How to switch languages with full numeral transliteration.
- How staff and admin stations operate.

---

## 2. Walkthroughs by User Role

The system provides separate walkthroughs tailored to the user's role:

### A. Customer Walkthrough (Route: `/`)
- **Step 1: Real-Time Wait Time (`#tour-wait-card`)**: Explains the dynamic wait calculation formula ($Wait = \lceil \frac{\text{Total Service Minutes Ahead}}{\text{Working Stylists}} \rceil$).
- **Step 2: Queue Status & Operating Hours (`#tour-info-cards`)**: Shows live queue depth, active stylists on duty, and daily operating hours.
- **Step 3: Join the Virtual Line (`#tour-join-btn`)**: Highlights the primary CTA for service selection, sticky summary cart, and phone OTP verification.
- **Step 4: Trilingual Localization (`#tour-header-lang`)**: Demonstrates live instant switching between English, Hindi, and Gujarati with automatic numeral transliteration (`0–9`, `०–९`, and `૦–૯`).
- **Step 5: Salon Display & Staff Consoles (`#tour-header-portals`)**: Introduces the waiting area Salon TV Display board, entrance kiosk, and staff station access.

### B. Staff Walkthrough (Route: `/staff/queue`)
- **Step 1: Live Queue Overview (`#tour-staff-stats`)**: Explains active waiting, in-service, and completed ticket counters.
- **Step 2: Customer Queue Roster (`#tour-staff-list`)**: Explains customer entries, requested services, estimated wait times, and 10-minute grace timers.
- **Step 3: Skill-Matched Dispatching (`#tour-staff-call-btn`)**: Explains the rule-based dispatch algorithm that validates stylist skills against all requested services.
- **Step 4: Walk-In Counter & Payments (`#tour-staff-actions`)**: Shows how to issue walk-in tokens and collect UPI/Cash payments to unlock customer reviews.

### C. Admin Walkthrough (Route: `/admin/reports`)
- **Step 1: Salon Performance KPIs (`#tour-admin-metrics`)**: Tracks daily footfall, average waiting times, no-show percentages, and gross revenue.
- **Step 2: Management Console (`#tour-admin-nav`)**: Navigates between Staff management, Services catalog, and Salon settings.
- **Step 3: CSV Export (`#tour-admin-export`)**: Explains daily CSV bookkeeping exports.

---

## 3. How to Use & Restart the Tour

### First-Time Visitors
1. When visiting the site for the first time, a welcome introduction modal automatically appears after 600ms.
2. Clicking **"Start Interactive Tour"** begins the step-by-step walkthrough.
3. Users can navigate using **Previous**, **Next**, or **Skip Tour** at any time.
4. On the final step, clicking **"Finish Tour"** displays a celebratory **"You're All Set!"** dialog.

### Returning Visitors & Restarting the Tour
The tour never repeatedly forces itself on returning users once completed (`localStorage` persistence). Users can restart the tour at any time via:
1. **Desktop Header**: Click the **"Tour"** button in the navigation bar.
2. **Mobile Menu Drawer**: Tap the mobile hamburger menu and select **"Explore Website Tour"**.
3. **Floating Action Trigger**: Click the discreet **"Take a Tour"** floating button in the bottom right corner of the screen.

Programmatically, any component can trigger the tour using:
```typescript
import { restartSalonTour } from "@/components/OnboardingTour";

// Restart customer tour
restartSalonTour("customer");

// Restart staff tour
restartSalonTour("staff");

// Restart admin tour
restartSalonTour("admin");
```

---

## 4. Responsive & Mobile Design

- **Mobile Viewports (320px – 450px)**: Tooltips automatically align to the screen width with generous gutters, preventing any horizontal overflow or clipping.
- **Scroll Alignment**: Highlights smoothly scroll into the center of the viewport via `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- **Spotlight Ring**: Highlights the active target element with a glowing golden border (`ring-4 ring-accent`) and backdrop overlay cutout.
- **Trilingual Support**: All tour titles, descriptions, buttons, and step indicators are fully localized in English, Hindi, and Gujarati.
