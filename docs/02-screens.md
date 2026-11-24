# 02 - Screens & Features

> The heart of the project. For every screen: what is on it, how it behaves, and how it should look. Build the UI from this file. Rules and statuses live in `03-flows-rules.md`.

## 1. Screen Inventory

| ID | Screen | Route | Role | Priority |
|----|--------|-------|------|----------|
| C1 | Salon Home / Live Status | `/` | Customer | MVP |
| C2 | Join Queue (pick services) | `/join` | Customer | MVP |
| C3 | Phone OTP Verification | `/verify` | Customer | MVP |
| C4 | My Token / Live Tracking | `/track/:entryId` | Customer | MVP |
| C5 | Feedback | `/feedback/:entryId` | Customer | MVP |
| K1 | Kiosk Check-in | `/kiosk` | Walk-in customer | MVP |
| D1 | Public Display Board | `/display` | Everyone in salon | MVP |
| S1 | Staff Login | `/staff/login` | Staff | MVP |
| S2 | Queue Board | `/staff/queue` | Receptionist, Stylist | MVP |
| S3 | Add Walk-in | `/staff/walk-in` | Receptionist | MVP |
| S4 | Payment Dialog | modal on S2 | Receptionist | MVP |
| S5 | Today's History | `/staff/history` | Receptionist, Stylist | MVP |
| A1 | Salon Settings | `/admin/settings` | Admin | MVP |
| A2 | Services Manager | `/admin/services` | Admin | MVP |
| A3 | Staff & Skills Manager | `/admin/staff` | Admin | MVP |
| A4 | Reports Dashboard | `/admin/reports` | Admin | MVP |
| A5 | Notification Templates | `/admin/notifications` | Admin | Later |

## 2. Look and Feel (applies to every screen)

**Mood:** clean, calm, friendly. A modern salon, not a hospital waiting room. Lots of white space, one strong accent, big readable numbers.

**Colour tokens**

| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#1F3A5F` | Headers, primary buttons, links |
| `--accent` | `#C97B63` | Highlights, token badge, call-to-action emphasis |
| `--bg` | `#FAF8F5` | Page background |
| `--surface` | `#FFFFFF` | Cards, dialogs |
| `--text` | `#1B1B1F` | Body text |
| `--muted` | `#6B6F76` | Secondary text |
| `--border` | `#E4E1DC` | Dividers, card borders |

**Status colours (used the same way on every screen)**

| Status | Colour | Badge text |
|--------|--------|-----------|
| waiting | Amber `#B45F06` on `#FCE5CD` | Waiting |
| called | Blue `#1F5FA8` on `#DCE9F7` | Called |
| in_service | Violet `#6B3FA0` on `#EADCF5` | In service |
| completed | Green `#2D6A1F` on `#D9EAD3` | Done |
| no_show | Red `#8B1A1A` on `#F4CCCC` | No-show |
| cancelled | Grey `#555555` on `#E8E8E8` | Cancelled |

**Typography:** Inter (fallback system sans). Body 16 px; token number 64 px bold on mobile; headings 24 / 20 / 18 px. Never below 14 px on customer screens.

**Layout and components**
- Mobile first: design at 360 px wide. Staff and admin scale up to tablet and desktop.
- 8 px spacing grid; cards with 12 px radius and a light border (no heavy shadows).
- Primary button: filled `--primary`, 48 px tall minimum, full width on mobile. Secondary: outlined.
- Kiosk and display board use 1.5x type and 64 px touch targets.
- Status always shown as a coloured **badge with text** (never colour alone).
- Dark mode is optional and Later.
- Accessibility: WCAG AA contrast, visible focus ring, screen-reader labels on status changes, keyboard navigation on staff/admin.
- Motion: subtle (150-200 ms). The only attention animation is a pulse on the "Called" banner.

## 3. Customer Screens

### C1. Salon Home / Live Status
**On the screen:** salon name, open/closed pill, opening hours, "People waiting" count, "Estimated wait" in minutes, language switch.
**Primary button:** *Join Queue*. If the customer already has an active token today it becomes *View My Token* (rule R2).
**Behaviour:** counts refresh live. When closed, the button is disabled and the opening time is shown.
**Look:** hero card with the wait time in large type; accent-coloured button.

### C2. Join Queue
**On the screen:** list of active services (name, duration, price) with checkboxes; sticky footer showing total price, total time and a *Continue* button.
**Behaviour:** at least one service is required. Inactive services are hidden. If no stylist can do the chosen combination, show a clear message and keep the user on the page.
**Look:** service rows as tappable cards; selected cards get an accent border and a check icon.

### C3. Phone OTP Verification
**On the screen:** name, mobile number, then a 6-digit OTP field with a resend countdown.
**Behaviour:** limited attempts; on success the token is created atomically (R1) and the user goes to C4.
**Look:** one question per step, big inputs, number keypad on mobile.

### C4. My Token / Live Tracking
**On the screen:** huge token number, "People ahead", "Estimated wait", selected services, status badge, *Cancel* button (waiting or called only).
**Behaviour:** updates live without refresh and reconnects after a network drop (show a small "Reconnecting..." banner). When **called**, show a pulsing banner with the stylist name and a grace-period countdown. When **completed**, show a summary and a link to feedback.
**Look:** centred token inside an accent-coloured circle; status badge directly under it.

### C5. Feedback
**On the screen:** 1-5 star rating, optional comment, *Submit*.
**Behaviour:** one submission per visit; thank-you message afterwards.

## 4. Walk-in and Display Screens

### K1. Kiosk Check-in
**On the screen:** *Start* button, language buttons, the same service and OTP steps as C2/C3, final token with a QR code to open C4 on the phone.
**Behaviour:** resets after 30 seconds of inactivity.
**Look:** very large buttons, minimal text, high contrast.

### D1. Public Display Board
**On the screen:** "Now serving" tokens, "Next up" tokens, average wait, salon name and clock.
**Behaviour:** token numbers and first names only, **never phone numbers**. Soft chime and highlight when a customer is called.
**Look:** full-screen, dark-on-light or light-on-dark high contrast, readable from 5 metres.

## 5. Staff Screens

### S1. Staff Login
Username and password. Receptionist and stylist land on S2; admin lands on A4.

### S2. Queue Board
**On the screen:** left: waiting list in token order (token, name, services, wait so far, assigned stylist, status badge). Right: stylist panel (available / busy / on break / off duty). Action buttons per row: *Call next*, *Start*, *Complete*, *No-show*, *Cancel*.
**Behaviour:** buttons appear only when the status flow allows them (R3). *Call next* offers only stylists skilled in every requested service (R4). A called customer shows a grace countdown and is released automatically (R6). Stylists see only their own customers.
**Look:** dense but clear table; the next action for each row is the single filled button.

### S3. Add Walk-in
Name, phone, services; same checks as online joining (no OTP). Shows token and estimated wait to read aloud.

### S4. Payment Dialog
Opens after *Complete*. Shows services and total; choose cash / UPI / card; one payment per visit (R7). No online gateway.

### S5. Today's History
Completed, cancelled and no-show entries with times, services, stylist, payment status. Search by token or phone.

## 6. Admin Screens

### A1. Salon Settings
Name, address, phone, opening and closing time, grace period in minutes (default 10).

### A2. Services Manager
Add, edit, deactivate services (name, duration minutes, price). Deactivate instead of delete so history stays intact.

### A3. Staff & Skills Manager
Add staff, set role and status. Skill matrix: tick which services each stylist can perform (drives R4 and R5).

### A4. Reports Dashboard
Date range filter; cards for footfall, average wait, no-show rate, revenue, average rating. Charts: customers per hour, revenue by service, wait-time trend. CSV export.

### A5. Notification Templates (Later)
Edit message text for the five notification types.

## 7. Feature-to-Screen Map

| Feature | Screens | Priority |
|---------|---------|----------|
| Join with one or many services | C2, K1, S3 | MVP |
| Unique daily token | C3, K1, S3 | MVP |
| One active token per customer | C1, C2 | MVP |
| Cancel own token | C4 | MVP |
| Live position and wait | C1, C4, D1 | MVP |
| Call next / start / complete | S2 | MVP |
| Skill-matched assignment | S2, A3 | MVP |
| Automatic no-show release | S2, C4 | MVP |
| Notifications (5 types) | C4 + SMS/WhatsApp/push | MVP |
| Payment record | S4 | MVP |
| Feedback | C5 | MVP |
| Salon settings, services, staff, skills | A1-A3 | MVP |
| Reports | A4 | MVP |
| English / Hindi / Gujarati | All | MVP |
| Installable PWA | C1, C4 | MVP |
| Editable notification templates | A5 | Later |

## 8. Navigation

- **Customer:** C1 -> C2 -> C3 -> C4 -> C5.
- **Walk-in:** K1 or S3 -> token slip/QR -> D1 or C4.
- **Staff:** S1 -> S2 (S4 as a modal, S5 as a tab).
- **Admin:** S1 -> A4, with A1, A2, A3 in the side menu.

## 9. Empty and Error States

- Empty queue: "No one is waiting. Walk in anytime." with the Join button.
- No services configured (admin): explain and link to A2.
- No history today (S5): short explanation.
- Errors with plain messages: network lost, OTP expired, salon closed, duplicate token, action not allowed.

## 10. Open Questions

1. Can customers join from outside the salon, or only on site (QR / location check)?
2. Is a token slip printer available at the kiosk?
3. Can a customer add a service after joining?
4. Do stylists have their own logins or share one desk console?
