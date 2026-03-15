# Sylla — AI Syllabus Tracker

A full-stack AI-powered study tracker with PDF syllabus parsing, smart study plans, Razorpay subscriptions, and Redis-backed reminders.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB Atlas + Prisma ORM |
| Auth | JWT + bcrypt |
| AI | Google Gemini (gemini-1.5-flash) |
| Cache/Queue | Upstash Redis |
| Payments | Razorpay |
| File Upload | Multer + pdfjs-dist |

---

## Project Structure

```
sylla/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # Route pages
│       ├── components/ # Reusable UI
│       ├── store/     # Zustand stores
│       ├── hooks/     # Custom hooks
│       ├── lib/       # API client, utils
│       └── types/     # TypeScript types
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # AI, Redis worker
│   │   ├── middleware/ # Auth, error handling
│   │   └── lib/       # Prisma, Redis clients
│   └── prisma/
│       └── schema.prisma
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google AI Studio API key (Gemini)
- Razorpay account (test keys)

### 2. Clone & Install

```bash
git clone <repo>
cd sylla

# Install frontend
cd frontend
npm install

# Install backend
cd ../backend
npm install
```

### 3. Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-secret"
GOOGLE_AI_API_KEY="AIza..."
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Run Dev Servers

```bash
cd backend && npm run dev   # http://localhost:3001
cd frontend && npm run dev  # http://localhost:5173
```

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Subjects
| Method | Route | Description |
|---|---|---|
| GET | `/api/subjects` | List subjects with progress |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |

### Topics
| Method | Route | Description |
|---|---|---|
| GET | `/api/topics?subjectId=` | List topics |
| POST | `/api/topics` | Create topic |
| POST | `/api/topics/bulk` | Bulk create (from AI) |
| PATCH | `/api/topics/:id/status` | Update status |
| PUT | `/api/topics/:id` | Update topic |
| DELETE | `/api/topics/:id` | Delete topic |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/parse-syllabus` | Upload PDF → parse topics |
| POST | `/api/ai/study-plan` | Generate AI study plan |
| GET | `/api/ai/recommendations/:subjectId` | Smart topic suggestions |
| POST | `/api/ai/chat` | Chat with AI assistant |

### Sessions
| Method | Route | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start study session |
| PATCH | `/api/sessions/:id/end` | End session |
| GET | `/api/sessions/streak` | Get study streak |
| GET | `/api/sessions/weekly` | Weekly study hours |

### Payments
| Method | Route | Description |
|---|---|---|
| GET | `/api/payments/plans` | Get plan info |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment + upgrade |
| POST | `/api/payments/webhook` | Razorpay webhook |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard` | Full dashboard data |

---

## Features

### Free Plan
- Up to 3 subjects
- Up to 50 topics
- Basic progress tracking
- 7-day streak tracking

### Pro Plan (₹199/month via Razorpay)
- Unlimited subjects & topics
- AI PDF syllabus parsing (Gemini)
- AI study plan generation
- Smart topic recommendations
- Advanced charts & analytics
- Redis-backed reminders & alerts

---

## Redis Usage

Upstash Redis is used for:
- **Reminder scheduling** — sorted set `reminders:scheduled` (score = Unix timestamp)
- **Cron worker** — checks every minute, fires due reminders
- **Notification inbox** — `notifications:{userId}` list, last 50
- **AI cache** — topic recommendations cached 1 hour

---

## Deployment

### Backend
```bash
cd backend
npm run build
node dist/index.js
```

### Frontend
```bash
cd frontend
npm run build
# serve /dist with nginx or any static host
```

### Redis
Configure Upstash:
```env
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

---

## Design System

- **Theme**: Dark monochromatic (black/white/gray)
- **Accent**: Green (`hsl(142 70% 45%)`)
- **Fonts**: IBM Plex Mono (labels, values) + DM Sans (body)
- **Motion**: Framer Motion fade/slide transitions
