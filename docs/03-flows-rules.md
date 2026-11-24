# 03 - Flows & Rules

> How users move through the app, the key rules in plain English (statuses, waiting time, edge cases), and a test checklist. Screen IDs (C1, S2...) come from `02-screens.md`. Values marked *default* are proposals to confirm with the salon.

## 1. Flows

### F1. Join online
1. Customer opens C1. The app checks the salon is open and shows the current wait.
2. Customer picks one or more services (C2).
3. Customer enters name and phone and confirms the OTP (C3).
4. If they already have an active token today, show that token instead (R2).
5. In **one transaction**: increase the day counter, create the entry as *waiting*, attach the services, calculate the wait (R1, R5).
6. Send the "joined" notification and show the live token page (C4).

*Exceptions:* salon closed; no stylist can do the combination; wrong or expired OTP.

### F2. Join at the kiosk
Same as F1. The kiosk then shows the token and a QR code that opens C4 on the customer's phone, and resets after 30 seconds.

### F3. Receptionist adds a walk-in
Receptionist enters name, phone and services on S3. Same checks as F1, but no OTP. They read out the token and wait time.

### F4. Live tracking and notifications
Every queue change is published on the salon's live channel. C4, D1 and S2 refresh within 2 seconds. A "near turn" message goes out when position is 2 or less; a "called" message when the customer is called. If the live connection drops, show a "Reconnecting..." banner and poll every 15 seconds as a last resort.

### F5. Call next and serve
1. Pick the lowest waiting token whose services a free stylist can do (R4).
2. Status becomes *called*; stylist assigned; `called_at` saved; "called" message sent; grace timer starts.
3. Customer arrives: tap *Start* -> *in service*, stylist *busy*.
4. Work done: tap *Complete* -> *completed*, stylist *available*, everyone's wait is recalculated.
5. The payment dialog opens (F8).

If the first waiting customer needs a skill no free stylist has, offer the next customer who can be served. The skipped customer keeps their place.

### F6. No-show
A job runs every minute. A *called* customer who has not arrived after the grace period becomes *no-show*, the stylist is released, a message is sent, and the next eligible customer is called. A no-show who turns up later must join again with a new token.

### F7. Cancel
Allowed only while *waiting* or *called*. The entry becomes *cancelled* and everyone behind gets a shorter wait. If the customer had been called, the stylist is released and F5 runs again.

### F8. Payment and feedback
After *Complete* the receptionist picks cash / UPI / card and confirms (one payment per visit). The customer gets a "completed" message with a feedback link and can rate 1-5 once.

### F9. Stylist availability
A stylist (or admin) sets available, on break or off duty. Every wait estimate is recalculated because the stylist count changed. A stylist cannot go on break or off duty while serving someone.

### F10. Day start and end
- A new date starts at token 1 (the counter is per salon per day; nothing is deleted).
- At closing time joining is disabled; people already in the queue are still served.
- When the admin closes the day, anything still waiting or called is marked cancelled with a note, and the daily summary is stored.

## 2. Statuses (plain English)

| Status | Meaning |
|--------|---------|
| waiting | In the queue, not yet called |
| called | Told to come to the chair; grace timer running |
| in_service | Service has started |
| completed | Service finished |
| no_show | Called but did not arrive in time |
| cancelled | Cancelled by the customer, staff or day-end |

**Allowed changes (everything else is rejected):**

| From | To | When |
|------|----|------|
| (new) | waiting | Customer joins |
| waiting | called | Staff calls next (skilled stylist assigned) |
| waiting | cancelled | Customer or staff cancels |
| called | in_service | Customer arrives, staff taps Start |
| called | no_show | Grace period ends |
| called | cancelled | Customer or staff cancels |
| in_service | completed | Staff taps Complete |

*Completed, no_show and cancelled are final.*

## 3. Rules in Plain English

| ID | Rule |
|----|------|
| R1 | Each token number is used once per salon per day. Two customers can never share one, even if they join at the same instant. |
| R2 | A customer can have only one live token (waiting, called or in service) per salon per day. |
| R3 | A status can only change along the table above. |
| R4 | A stylist is only called for a customer if the stylist can do **every** service that customer chose. |
| R5 | The wait time counts all services of everyone ahead, shared across the stylists who are working. |
| R6 | If a called customer does not arrive within the grace period, they become a no-show and the next person is called. |
| R7 | No orphan data: every record points to a real salon, customer and so on. Rating is 1-5. One payment and one feedback per visit. |

## 4. Waiting-Time Rules

- **Token number:** next number for that salon and date, starting at 1 each day. Numbers are not reused, even after a cancellation.
- **Position:** the number of people with a lower token who are still waiting, called or in service, plus one.
- **Estimated wait (minutes):** total service minutes of everyone ahead, divided by the number of stylists who are not off duty, rounded **up**.
  - *Example:* 3 customers ahead, each with a haircut (30) and beard trim (15) = 135 minutes. 2 stylists: 135 / 2 = 67.5, rounded up to **68 minutes**.
- **Near-turn alert:** sent once when position is 2 or less (*default*).
- **Grace period:** from salon settings, *default* 10 minutes, counted from the moment of the call.
- Estimates refresh at every start, completion, cancellation and stylist status change.

## 5. Notifications

| Event | To | When | Content |
|-------|----|------|---------|
| joined | Customer | Token created | Token, wait, live link |
| near_turn | Customer | Position <= 2 | Come to the salon now |
| called | Customer | Status = called | Token, stylist, grace period |
| no_show | Customer | Status = no_show | Token released, how to rejoin |
| completed | Customer | Status = completed | Thanks, feedback link |

Each message is stored with channel (sms / whatsapp / email / push), status (queued / sent / failed) and time. Failed messages retry up to 3 times (*default*). The live page is always the main channel.

## 6. Validation

| Field | Rule |
|-------|------|
| Name | Required, 2-60 characters |
| Mobile number | Required, valid format |
| OTP | 6 digits, valid 5 minutes, max 3 attempts (*defaults*) |
| Services | At least one active service |
| Rating | Whole number 1-5 |
| Payment method | cash, upi or card |
| Join / OTP requests | Rate-limited per phone and device |

## 7. Permissions

| Action | Customer | Receptionist | Stylist | Admin |
|--------|----------|--------------|---------|-------|
| Join, view own token | Yes | Yes (walk-ins) | No | No |
| Cancel | Own | Any | No | Any |
| Call next | No | Yes | Yes | Yes |
| Start / complete / no-show | No | Yes | Own customers | Yes |
| Record payment | No | Yes | No | Yes |
| See phone numbers | Own | Yes | Yes | Yes |
| Manage services, staff, settings, reports | No | No | No | Yes |

## 8. Edge Cases

| Situation | Behaviour |
|-----------|-----------|
| Two staff tap *Call next* together | One succeeds; the other gets a clear "already called" message |
| Only stylist for a service goes off duty | Those customers stay queued; show a warning on the wait and alert staff |
| Customer closes the page | Token stays valid; the message link reopens C4 |
| Customer wants another service after joining | Not in MVP: cancel and rejoin |
| Wait estimate was wrong | Refreshes at each start/complete; admin adjusts durations using reports |
| Salon internet lost | Staff console shows an offline banner and blocks actions; no silent local changes |
| Same customer tries to join twice | Show the existing token (R2) |

## 9. Test Checklist

**Data and rules (automated)**
- [ ] T1 - 10 customers join at the same moment: all get different tokens (R1)
- [ ] T2 - An invalid status value is rejected (R3)
- [ ] T3 - A finished entry cannot go back to waiting (R3)
- [ ] T4 - A customer cannot hold two live tokens in one salon on one day (R2)
- [ ] T5 - One visit can contain several services
- [ ] T6 - Calling a stylist who lacks a requested skill is rejected (R4)
- [ ] T7 - Wait for the 4th customer in the example above is 68 minutes (R5)
- [ ] T8 - A called customer is marked no-show after the grace period (R6)
- [ ] T9 - Rating 9 is rejected (R7)
- [ ] T10 - An entry for a non-existent salon is rejected (R7)

**Flows (UI / end to end)**
- [ ] Join online with 2 services: token, wait and joined message appear (F1)
- [ ] Kiosk join shows token + QR, then resets after 30 seconds (F2)
- [ ] Receptionist adds a walk-in without OTP (F3)
- [ ] Live page updates within 2 seconds when someone ahead is served (F4)
- [ ] Call next -> Start -> Complete -> payment dialog -> feedback link (F5, F8)
- [ ] Not arriving within the grace period releases the slot and calls the next customer (F6)
- [ ] Cancelling a waiting token shortens waits behind it (F7)
- [ ] Setting a stylist off duty recalculates every wait (F9)
- [ ] Joining is disabled at closing time but the queue is still served (F10)

**Screens, look and access**
- [ ] Display board never shows phone numbers
- [ ] Status badges show text as well as colour
- [ ] All customer screens work at 360 px width
- [ ] English, Hindi and Gujarati switch correctly
- [ ] Each role sees only the actions in the permissions table

## 10. Open Questions

1. May a no-show re-enter once and keep their place?
2. How many times may a customer be skipped for a missing skill before priority applies?
3. Should the near-turn threshold be configurable per salon?
4. How long are phone numbers and message logs kept?
