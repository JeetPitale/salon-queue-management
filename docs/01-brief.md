# 01 - Project Brief & Scope

**Project:** Salon Queue Management Website
**Version:** 1.0 | **Date:** 18 November 2026

> Read this first. It explains why the app exists and where its boundaries are. If a request is not covered here, do not build it without asking.

## 1. The Problem

- Customers wait in the salon without knowing how long it will take, and many walk away.
- Receptionists track turns on paper or by memory, which causes disputes and lost entries.
- Owners have no data on waiting time, no-shows, busy hours or revenue per service.
- Stylists are sometimes given customers for services they are not trained to do.

## 2. The Solution (one paragraph)

A responsive website where customers join a live queue online or at a kiosk, see their position and estimated wait in real time, and get notified when their turn is near. Staff run the queue from a simple console. The owner sets up services, staff, skills and opening hours, and reads daily reports.

## 3. Goals

| # | Goal | How we know it works |
|---|------|----------------------|
| G1 | Fair, transparent turns | One unique token per customer per day; no duplicates or skips |
| G2 | Less uncertainty | Estimated wait on every token, refreshed within 2 seconds |
| G3 | Fewer walk-aways and idle chairs | Near-turn alert; automatic no-show release |
| G4 | Simple staff work | Call, start and complete are one tap each |
| G5 | Useful owner data | Daily report of wait, no-shows, footfall, revenue, ratings |

## 4. Users

| Role | Who | Main needs |
|------|-----|-----------|
| Customer | Walk-in or online visitor, identified by phone + OTP | Join, track, cancel, rate |
| Receptionist | Front-desk staff | Add walk-ins, call next, mark no-show, record payment |
| Stylist | Service provider | See own customers, start/complete, set break status |
| Admin / Owner | Salon manager | Configure salon, services, staff, skills; view reports |

## 5. Must-Have Features (MVP)

1. Join the queue with one or more services and receive a daily token number.
2. Live position and estimated wait (WebSocket, with fallbacks).
3. Kiosk / QR check-in for walk-ins and a receptionist "Add walk-in" screen.
4. Staff console: Call next, Start, Complete, No-show, Cancel, availability toggle.
5. Skill-matched assignment: a stylist is only called for services they can do.
6. Automatic no-show release after the grace period.
7. Notifications: joined, near turn, called, no-show, completed.
8. Payment record (cash / UPI / card) and customer feedback (1-5 stars).
9. Admin: salon settings, services, staff and skills, reports.
10. Languages: English, Hindi, Gujarati. Installable PWA.

## 6. What NOT to Build (out of scope)

- Advance appointment booking with time slots.
- Online payment gateway, refunds, invoicing or tax filing.
- Loyalty points, discounts, memberships, coupons.
- Inventory and product sales.
- Staff payroll and attendance.
- Native iOS / Android apps (the PWA covers mobile).
- Cross-branch franchise dashboards (data model supports many salons; reporting stays per salon).

## 7. Assumptions and Constraints

- Customers have a phone that can get SMS, WhatsApp or web push.
- The salon has internet and a tablet or PC at the front desk.
- Service durations are admin-set averages; real time may vary.
- First release is piloted in one salon.
- Phone numbers are personal data: store securely, never show on public screens.
- Must work on low-end phones and slow networks.
- Budget, team size and the messaging provider are **to be confirmed** by the sponsor.

## 8. Suggested Timeline (estimates)

| Phase | Work | Estimate |
|-------|------|----------|
| 1 | Brief sign-off, wireframes, ER and API design | 1-2 weeks |
| 2 | Core queue: join, token, live status, staff console | 3-4 weeks |
| 3 | Admin and reports | 2 weeks |
| 4 | Notifications, payment records, feedback | 1-2 weeks |
| 5 | Testing, pilot, go-live | 2 weeks |

## 9. Main Risks

| Risk | Mitigation |
|------|-----------|
| Estimates are inaccurate | Refresh at every start/complete; admin tunes durations using reports |
| Duplicate tokens under load | Atomic counter + unique constraint (rule R1), concurrency test |
| Customers miss their turn | Near-turn alert + automatic no-show release |
| Staff find the console slow | One-tap actions, large buttons, pilot feedback |
| Messaging provider outage | Live page is the primary channel; messages are a supplement |
| Privacy complaints | Mask phone numbers on public screens; collect only name and phone |

## 10. Open Questions

1. SMS, WhatsApp or both?
2. How many salons and staff in the pilot?
3. Opening hours and default grace period?
4. Is a tablet/kiosk available at the entrance?
5. Who signs off scope and acceptance?
