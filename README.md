# Meetings Module — Frontend

A production-grade Next.js booking interface for Smart Logics Solution, built to replicate a Calendly-style experience. Clients can browse available slots, select a meeting purpose, optionally provide context, and book a Google Meet call — all in one seamless flow.

---

## Features

- **Interactive Calendar** — month navigation with available/unavailable day states, weekends disabled
- **Real-time Slot Loading** — fetches available 30-minute slots from the backend on date selection
- **Purpose-Aware Booking Form** — dropdown with 6 meeting types, each with a tailored textarea and placeholder
- **Gemini AI Enhancement** — optional context field processed by Gemini before booking is saved
- **Confirmation Modal** — displays Google Meet link after successful booking
- **Admin Dashboard** — password-protected panel to manage all meetings, update statuses, send reminders, and view AI-generated context
- **WhatsApp Integration** — direct contact button pre-filled with meeting details
- **Responsive Design** — clean split-view layout built for desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Inline styles + CSS-in-JS |
| Fonts | Playfair Display + DM Sans (Google Fonts) |
| Deployment | Vercel |

---

## Project Structure

```
smart-logics-booking/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Client booking page (/)
│   ├── favicon.ico
│   └── admin/
│       └── page.tsx        # Admin dashboard (/admin)
├── public/                 # Static assets
├── .env.local              # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

For production on Vercel:
```env
NEXT_PUBLIC_API_URL=https://your-ec2-ip-or-domain:8001
```

---

## Installation

```bash
# Create a new Next.js project
npx create-next-app@latest smart-logics-booking

# Answer prompts:
# TypeScript → Yes
# ESLint → Yes
# Tailwind → No
# src/ directory → No
# App Router → Yes
# Import alias → No

cd smart-logics-booking

# Replace app/page.tsx with the booking page
# Replace app/layout.tsx with the provided layout
# Create app/admin/page.tsx with the admin dashboard

# Create environment file
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL

# Run development server
npm run dev
```

App runs at: `http://localhost:3000`

---

## Pages

### `/` — Client Booking Page

The main public-facing booking interface.

**Layout:** Split view — calendar on the left, slots + form on the right.

**Booking flow:**
1. User navigates the calendar and clicks an available date
2. Available 30-minute slots load on the right panel
3. User selects a time slot
4. Booking form appears with the following fields:
   - **Full Name** — required
   - **Email Address** — required
   - **Purpose of Meeting** — required dropdown
   - **Context Textarea** — optional, AI-enhanced, label and placeholder change per purpose
5. User clicks **Confirm** — backend books the meeting, Gemini processes the context, confirmation email is sent
6. Success modal appears with the Google Meet link

**Calendar behavior:**
- Past dates are disabled and greyed out
- Weekends (Saturday & Sunday) are always disabled
- Selected date is highlighted in brand blue
- Today's date has a border indicator
- Slots refresh automatically after a booking to remove the booked time

**Purpose options and their context labels:**

| Purpose | Context Label | Placeholder |
|---|---|---|
| Client Consultation | Project Info | Describe project goals, tech stack, timeline... |
| Technical Interview | Position & Requirements | Job position, required skills, experience level... |
| HR Interview | Notes (optional) | Any notes about the candidate or role... |
| General Discussion | Context (optional) | What would you like to discuss? |
| Support Call | Problem Description | Describe the problem, what you tried... |
| Sales Demo / Partnership Discussion | Service / Context | Describe the service being presented... |

---

### `/admin` — Admin Dashboard

Password-protected management panel for Smart Logics Solution staff.

**Password:** `smartlogics123`

**Features:**

- **Stats bar** — total, upcoming, completed, and canceled meeting counts
- **Filter tabs** — filter meetings by status with live counts
- **Search** — filter by client name, email, or purpose
- **Per-meeting actions:**
  - 📹 **Join Meet** — opens Google Meet link directly
  - 💬 **WhatsApp** — opens WhatsApp with a pre-filled message containing meeting details
  - 🔔 **Send Reminder** — triggers a reminder email via Make.com webhook
  - ✦ **AI Context** — opens a modal showing the Gemini-generated markdown notes
  - **Status dropdown** — inline update between `upcoming`, `completed`, `canceled`
- **AI Context Modal** — renders markdown with proper headings, bullets, and bold text. Includes a "Share via WhatsApp" button
- **Toast notifications** — bottom-right feedback for all actions
- **Refresh button** — manually re-fetches all meetings
- **Live API status** — pulse indicator in the sidebar

**Password gate behavior:**
- Shakes and shows error on wrong password
- Supports Enter key to submit
- Session resets on page refresh (no persistent auth)

---

## API Integration

The frontend communicates with the FastAPI backend via these endpoints:

| Endpoint | Method | Used By |
|---|---|---|
| `/calendar/available?day=YYYY-MM-DD` | GET | Load available slots |
| `/calendar/book` | POST | Submit booking |
| `/meetings/getAll` | GET | Admin — fetch all meetings |
| `/meetings/updateStatus` | POST | Admin — change meeting status |
| `/meetings/sendReminder` | POST | Admin — trigger reminder email |

All requests use the base URL from `NEXT_PUBLIC_API_URL`.

---

## Design System

**Colors:**
| Token | Hex | Usage |
|---|---|---|
| Primary | `#1b3e5c` | Headings, sidebar, buttons |
| Accent | `#2b7aab` | Interactive elements, links, badges |
| Background | `#ffffff` | Page background |
| Surface | `#f0f4f8` | Admin page background |
| Subtext | `#7a8fa0` | Labels, secondary text |
| Border | `#e2eaf2` | Card borders, dividers |

**Typography:**
- **Display:** Playfair Display (headings, brand name)
- **Body:** DM Sans (all UI text, labels, buttons)

**Component patterns:**
- Cards with `border-radius: 16px` and subtle box shadows
- Pill-shaped status badges with dot indicators
- Circular calendar day buttons
- Smooth `0.15s ease` transitions on all interactive elements
- Slide-up animation on modals and forms

---

## Deployment on Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/smart-logics-booking.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — no build config needed

### Step 3 — Add Environment Variable
In **Vercel Dashboard → Project → Settings → Environment Variables:**
```
NEXT_PUBLIC_API_URL = http://your-ec2-ip:8001
```

### Step 4 — Deploy
Click **Deploy**. Your app will be live at `https://your-project.vercel.app`.

---

## CORS Requirement

Make sure your FastAPI backend allows requests from your Vercel domain. In `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-project.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Important Notes
- The frontend does not store any state between sessions — all data is fetched fresh from the backend
- WhatsApp links use `wa.me` with pre-filled text — no WhatsApp Business API required
- The markdown renderer in the AI Context modal is a lightweight custom implementation, no external library needed
