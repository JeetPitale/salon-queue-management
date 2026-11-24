# AGENTS.md - Salon Queue Management Website

## Read first (always)
Before writing any code, read these in order:
1. `docs/01-brief.md` - why we are building this and what NOT to build
2. `docs/02-screens.md` - every screen, its behaviour and its look
3. `docs/03-flows-rules.md` - flows, statuses, rules, waiting-time maths, test checklist

If something is missing or two files disagree, **ask before guessing**. Do not build anything listed under "What NOT to Build".

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS; Inter font
- React Query for server data; WebSocket for live updates (SSE fallback)
- Node.js API (REST); PostgreSQL
- PWA enabled; i18n for English, Hindi, Gujarati

## Style
- Mobile first (360 px). Use the colour, status and type tokens in `docs/02-screens.md`.
- Status is always a coloured badge **with text**.
- Never show phone numbers on public screens (display board, kiosk).
- Small, typed components; no `any`. Keep files short and named after the screen ID (e.g. `QueueBoard` for S2).

## Rules you must not break
- Token numbers are unique per salon per day and allocated in one transaction (R1).
- Only the status changes listed in `docs/03-flows-rules.md` are allowed (R3).
- A stylist is called only if skilled in every requested service (R4).
- Wait time = total minutes ahead / working stylists, rounded up (R5).

## How to work
- Build one screen at a time, in the order of the inventory, and show it running before moving on.
- Tick off the test checklist in `docs/03-flows-rules.md` as each item passes.
- Keep commits small and describe which screen or rule they touch.
