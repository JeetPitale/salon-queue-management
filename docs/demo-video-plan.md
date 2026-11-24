# 3-Minute Demo Video Recording Plan (`docs/demo-video-plan.md`)

*Recording Mode: Mobile phone screen recording or Chrome DevTools Device Mode (iPhone 14 / 390×844)*  
*Total Target Duration: Exactly 3:00 minutes (180 seconds)*

---

### Segment 1: Introduction & Problem Context (0:00 – 0:20)
* **Screen**: Customer Home Page (`/`) in Mobile View
* **Visual Actions**:
  - Start on the salon home screen showing the clean header, brand icon, and hero wait card.
  - Show the top status pill ("Open / 09:00 - 21:00") and the wait time badge.
* **Spoken Narration**:
  > *"Hello! Today I'm presenting the Salon Queue Management System, a mobile-first, real-time web application built for single-location salons. In traditional salons, walk-ins face unpredictable wait times and crowded waiting areas. Our system solves this with transparent live queue tracking, automated skill-based stylist dispatching, and digital check-ins."*

---

### Segment 2: Main Customer Interface & Localization (0:20 – 0:50)
* **Screen**: Customer Home Page (`/`)
* **Visual Actions**:
  - Highlight the estimated wait time calculation ($139$ minutes) and people waiting count ($13$ people).
  - Tap the language toggle in the navbar: switch from **EN** $\rightarrow$ **हिं** $\rightarrow$ **ગુ**.
  - Show how both the text and the numeric digits instantly transliterate into Gujarati numerals (`૧૩૯ મિનિટ`, `૧૩ રાહ જોતા લોકો`, `૦૯:૦૦ - ૨૧:૦૦`).
  - Switch back to English or keep Gujarati to demonstrate flexibility.
* **Spoken Narration**:
  > *"Here on the home screen, customers immediately see the live estimated wait time, calculated using our strict queue formula: total service minutes ahead divided by active working stylists. Notice our complete multilingual engine—switching to Hindi or Gujarati localizes not just the text, but all dynamic numerals and time slots."*

---

### Segment 3: Primary Customer Journey — Join, Verify & Live Track (0:50 – 1:40)
* **Screens**:
  1. `/join` (Service Selection)
  2. `/verify` (OTP Verification)
  3. `/track/[entryId]` (Live Turn Tracking)
* **Visual Actions**:
  - **At 0:50**: Tap the primary button **"Join Queue"** $\rightarrow$ opens `/join`.
  - **At 0:55**: Select "Haircut" (30 mins, ₹350) and "Beard Trim" (15 mins, ₹150). Notice the sticky summary card updates instantly to 45 mins and ₹500.
  - **At 1:05**: Tap **"Continue"** $\rightarrow$ opens `/verify`.
  - **At 1:10**: Enter customer name (`Rahul Sharma`) and mobile number (`9876543210`). Tap "Send Code". Enter the demo OTP `123456` and tap **"Verify & Get Token"**.
  - **At 1:25**: Redirects to the live tracking screen (`/track/[entryId]`). Show the large token number circle (`#14`), position in line, people ahead, and the live status badge `WAITING`.
* **Spoken Narration**:
  > *"Let's join the queue. I pick Haircut and Beard Trim—the summary calculates our combined duration and total cost. Next, we verify via a 6-digit OTP to prevent spam tokens. Once verified, our ticket is generated in a single database transaction. Our live tracking page connects via Server-Sent Events, updating in under two seconds whenever queue positions shift."*

---

### Segment 4: Staff & Receptionist Workflow (1:40 – 2:20)
* **Screens**:
  1. `/receptionist/login` $\rightarrow$ `/staff/queue` (Receptionist Live Board)
  2. `/display` (Salon TV Display Board)
* **Visual Actions**:
  - **At 1:40**: Open Portals from the header $\rightarrow$ Receptionist Portal (`/receptionist/login`).
  - **At 1:45**: Login with `receptionist` / `password123`.
  - **At 1:50**: On the Live Queue Board, find our customer. Tap **"Call Customer"** $\rightarrow$ status turns blue (`CALLED`) with assigned stylist Aarav.
  - **At 2:00**: Briefly switch to `/display` (TV Board) to show customer name appear under **"Now Serving"** with a live audio chime.
  - **At 2:05**: Back on customer tracking page, show the pulsing banner: *"Please proceed to chair!"* with the 10-minute active grace countdown timer ticking down.
  - **At 2:12**: In the staff board, transition customer to `IN_SERVICE`, then click **"Complete"** $\rightarrow$ opens the payment modal. Select **UPI**, click **"Record Payment"**.
* **Spoken Narration**:
  > *"Now switching to the receptionist console. The staff dashboard lets receptionists manage walk-ins, assign chairs, and call customers. When we call Rahul, our system checks stylist skills to ensure Aarav can perform both requested services. Instantly, the salon's TV display rings a chime, and the customer's mobile screen pulses with a grace period countdown. Once the service finishes, the staff records a UPI payment."*

---

### Segment 5: Entrance Kiosk & Admin Intelligence (2:20 – 2:45)
* **Screens**:
  1. `/kiosk` (Self-Check-In Kiosk)
  2. `/admin/reports` (Executive Dashboard)
* **Visual Actions**:
  - **At 2:20**: Open `/kiosk`. Tap **"Tap to Check In"**, select services, and show the final token slip with the auto-generated QR code for phone scanning.
  - **At 2:32**: Switch to Admin Portal (`/admin/login` $\rightarrow$ `/admin/reports`). Show real-time Footfall metrics, No-Show Rate, Gross Revenue, and Stylist Productivity breakdown.
* **Spoken Narration**:
  > *"For walk-ins arriving at the door, our full-screen Kiosk mode allows self check-in and prints a dynamic QR code that customers scan to continue tracking on their phone. Meanwhile, the salon owner has full visibility via the Admin Reports dashboard—tracking daily revenue, no-show rates, and individual stylist output."*

---

### Segment 6: Conclusion & Value Summary (2:45 – 3:00)
* **Screen**: Customer Home Page (`/`) in Mobile View
* **Visual Actions**:
  - Return to the clean home screen. Scroll smoothly down and back up to demonstrate fluid mobile responsiveness.
* **Spoken Narration**:
  > *"With responsive support across every device from small mobile screens to large TV monitors, automated wait calculation, and role-isolated security, the Salon Queue Management System eliminates waiting anxiety and streamlines salon operations. Thank you!"*
