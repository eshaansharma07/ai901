# EventIQ AI

EventIQ AI is a Next.js and MongoDB Atlas platform for discovering events, organizing them, registering for QR tickets, and checking attendees in. It includes a Gemini-powered event assistant, a location-aware finder, and an organizer planner.

## Run locally

1. Install Node.js 22 or later and run `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `MONGODB_URI` and `AUTH_SECRET`. The database defaults to `eventiq`; set `MONGODB_DB` to override it.
3. Run `npm run dev` and open [localhost:3000](http://localhost:3000).
4. Run `npm run build` to verify the production build.

The sign-in page includes a public, read-only demo. Sign up with your own account to publish events and manage check-ins.

## Deploy on Vercel

Connect the GitHub repository to a Vercel project and use `main` as the production branch. Configure environment variables in Vercel. Keep real values in Vercel or `.env.local`.

| Feature | Server-side variables |
| --- | --- |
| Database and organizer authentication | `MONGODB_URI`, `AUTH_SECRET`, optional `MONGODB_DB` |
| Gemini event chat | `GEMINI_API_KEY` |
| Ticket email via Gmail | `TICKET_GMAIL_ADDRESS`, `TICKET_GMAIL_APP_PASSWORD` |
| Ticket email via Resend | `RESEND_API_KEY`, `TICKET_EMAIL_FROM` |
| Optional cloud organizer planning | `AI_API_KEY`, optional `AI_BASE_URL` and `AI_MODEL` |

The organizer planner also supports an on-device model. Ticket registration produces a QR ticket on the site even if email delivery is unavailable.
