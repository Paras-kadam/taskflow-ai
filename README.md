# TaskFlow AI — Enterprise-Grade Productivity Platform

TaskFlow AI is a modern, high-performance To-Do and productivity SaaS web application built with a full-stack TypeScript architecture. It pairs an intuitive, distraction-free interface with powerful productivity tools: multi-view task management, interactive Kanban boards, scheduling calendars, Pomodoro focus sessions, detailed analytics, recurring task automations, and intelligent AI task breakdown.

---

## 🚀 Key Features

### 1. Multi-View Task Management
- **Inbox**: Rapid capture with inline creation, keyboard shortcuts (`N`), and instant tag/project assignments.
- **Today**: Filtered view for tasks due today, with smart overdue alerts and completion tracking.
- **Upcoming**: Chronologically grouped tasks (Tomorrow, This Week, Next Week, Later).
- **All Tasks & Completed**: Full-catalog management with search, multi-column sorting (Priority, Due Date, Order, Title), and batch archival.
- **Subtasks**: Interactive checklist with inline progress indicators and instant completion states.
- **Task Dependencies**: Prerequisite task linking, automated blocked status computation (`isBlocked` badge), and graph DFS cycle detection preventing circular dependency loops.
- **Task Duplication & Archiving**: One-click duplication (cloning subtasks and metadata) and soft-archival support.
- **Recurring Tasks**: Automated recurrence schedules (Daily, Weekdays, Weekly, Monthly, Yearly) with automatic generation of next cycle upon completion.

### 2. Time Tracking & Pomodoro Focus
- **Live Stopwatch**: Per-task timer in the detail drawer tracking real-time work sessions.
- **Session History**: Historical time sessions recorded with start/end stamps, durations, and task rollups.
- **Pomodoro Timer**: 25 min Focus, 5 min Short Break, 15 min Long Break intervals with circular SVG progress.
- **Task Linkage**: Direct association of Pomodoro focus sessions with selected tasks.
- **Audio Alerts**: Synthesized Web Audio chimes upon session completion.

### 3. Interactive Kanban Board
- Visual status columns: **Inbox**, **To Do**, **In Progress**, and **Completed**.
- Fluid drag-and-drop powered by `@dnd-kit/core` with instant backend status synchronization.
- Inline card creation per column and real-time column item counters.

### 4. Comprehensive Calendar
- **Month View**: Complete monthly grid with visual task chips, priority coloring, and date selection.
- **Week View**: Time-blocked 7-day schedule with hourly breakdowns and drag-free navigation.
- **Day View**: Single-day focus with granular hourly timeline and immediate task details.

### 5. Productivity Analytics & Streak Tracker
- **14-Day Productivity Trend**: Visual completion velocity graph built with Recharts.
- **Productivity Score**: Dynamic rating based on completion ratios, timeliness, and focus velocity.
- **Active Streaks**: Current streak and longest streak calculations with daily streak incentives.
- **Breakdowns**: Visual priority and project distribution metrics.
- **Proactive AI Insights**: Intelligent suggestions on overdue remediation, priority focus, and habit momentum.

### 6. AI Productivity Engine
- **Natural Language Parsing**: Type natural phrases like *"Submit Q3 financial report tomorrow at 5pm urgent #finance"* and the AI parser automatically extracts title, due date, due time, priority (`urgent`), and tags.
- **AI Task Breakdown**: Domain-specific subtask checklists generated with zero configuration.
- **Smart Prioritization**: Multi-factor scoring weighting priority flags, deadline urgency, blocking power (critical path), and duration.
- **Smart Schedule Optimizer**: Automated day-by-day task distribution balancing daily workload against user focus capacity.
- **Proactive Recommendations**: Real-time contextual advice embedded directly in the analytics dashboard.

### 7. PWA & Mobile-First Experience
- **Progressive Web App**: Offline app shell caching, Web App Manifest (`manifest.webmanifest`), standalone display mode, and shortcut actions.
- **Mobile Navigation**: 5-slot bottom bar (Home, Today, elevated `+ Add`, Focus, More bottom-sheet drawer).
- **Safe Area Insets**: Full support for device notches and home indicators (`env(safe-area-inset-bottom)`).
- **Responsive Down to 320px**: Tested on small phones (iPhone SE, Galaxy S8) without horizontal viewport overflow.

### 8. Alarm-Style Notifications & Dedicated Ringtone System
- **8 Built-In Ringtones & Completion Chime**: High-fidelity notification ringtones (`Classic Bell`, `Digital Beep`, `Soft Chime`, `Morning Bell`, `Urgent Alarm`, `Double Beep`, `Focus Alert`, `Gentle Reminder`, and `Task Complete`) with Web Audio synthesis fallback.
- **Ringtone Customizer & Volume Slider**: Dedicated settings page allowing previewing of each sound, volume control (0–100%), and event-specific custom sound assignment.
- **Alarm Mode**: High-prominence visual modal with vibrating bell animations and repeating sound bursts that persist until acknowledged or snoozed.
- **Snooze Engine**: Quick snooze options (`5m`, `10m`, `15m`, `30m`, `1h`) that reschedule reminders and clear active notifications.
- **Autoplay Handling**: Proactive audio context unlock upon user interaction and non-intrusive setup banner.
- **Background Scheduler & Idempotency**: 60-second autonomous worker checking overdue tasks and pending reminders with atomic single-claim deduplication (`reminderSent: false`).
- **In-App Notification Center**: Unread badge counter, notification dropdown, and mark-as-read controls.
- **Browser Push & Service Worker**: Web Push API integration with desktop notifications.
- **Offline Banner**: Automatic `navigator.onLine` listener displaying connection status alerts.

### 9. Keyboard Shortcuts & Accessibility
- Global search modal accessible via `/` or `Ctrl+K` / `⌘K`.
- Two-key navigation chords:
  - `G` then `I` → Inbox
  - `G` then `T` → Today
  - `G` then `U` → Upcoming
  - `G` then `C` → Calendar
  - `G` then `K` → Kanban Board
  - `G` then `F` → Focus Mode
  - `G` then `A` → Analytics
  - `G` then `S` → Settings
- Quick shortcuts modal toggle via `?`.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite 5 with Rollup code-splitting
- **Styling**: Tailwind CSS with custom slate-950 dark palette
- **State Management**: Zustand (Auth, Theme, UI)
- **Data Fetching**: TanStack Query (React Query) v5 with optimistic updates and cache invalidation
- **Visuals & Charts**: Recharts & Lucide React
- **Drag-and-Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Dates**: `date-fns`

### Backend
- **Runtime**: Node.js & Express with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT stored in secure HTTP-only cookies with bcryptjs password hashing
- **Security**: Helmet headers, express-rate-limit, CORS credentials validation, express-validator sanitization
- **Background Jobs**: Node interval-based task scheduler

---

## 📁 Project Architecture

```
to-do/
├── client/                     # Frontend application
│   ├── public/                 # Static assets & sw.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── calendar/       # Month, Week, Day calendar components
│   │   │   ├── common/         # Offline banner, Shortcuts modal
│   │   │   ├── layout/         # Header, Sidebar, MobileNav, Layout
│   │   │   ├── notifications/  # NotificationBell and dropdown
│   │   │   ├── projects/       # ProjectCard, ProjectForm
│   │   │   ├── search/         # SearchModal (Ctrl+K)
│   │   │   ├── tasks/          # TaskCard, TaskList, QuickAddTask, TaskDetails
│   │   │   └── ui/             # Button, Input, Modal, Badge, Toast, etc.
│   │   ├── pages/              # Inbox, Today, Upcoming, Kanban, Focus, Analytics, etc.
│   │   ├── services/           # Axios API client & browser notifications
│   │   ├── stores/             # Zustand stores (authStore, themeStore, uiStore)
│   │   └── types/              # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── server/                     # Backend API server
│   ├── src/
│   │   ├── config/             # Environment variables & MongoDB connection
│   │   ├── controllers/        # Express request controllers
│   │   ├── middleware/         # Auth, validation, error handler, rate limiter
│   │   ├── models/             # Mongoose schemas (User, Task, Project, Tag, Focus)
│   │   ├── routes/             # Express API route declarations
│   │   ├── services/           # AI NLP parser & Reminder scheduler
│   │   └── utils/              # JWT & cookie helpers
│   ├── package.json
│   └── tsconfig.json
├── package.json                # Root orchestration package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB instance (local or MongoDB Atlas)

### 1. Environment Configuration

Create a `.env` file in `server/` (or copy `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Installation

Install dependencies across root, server, and client:

```bash
npm run install:all
```

Or individually:

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Development Server

Start both the backend API and frontend Vite dev server concurrently:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 4. Production Build

To compile both frontend and backend for production:

```bash
npm run build
```

- Server is compiled to `server/dist/`
- Client is bundled to `client/dist/`

To start the production server:

```bash
npm start
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
- `POST /register` — Register a new account
- `POST /login` — Log in and receive HTTP-only JWT cookie
- `POST /logout` — Clear session cookie
- `GET /me` — Get current authenticated user profile
- `PUT /profile` — Update user profile & notification preferences

### Tasks (`/api/tasks`)
- `GET /` — List tasks with filters (`status`, `priority`, `projectId`, `tag`, `search`, `dueDate`)
- `POST /` — Create a new task
- `GET /:id` — Get single task with subtasks, dependencies, and `isBlocked` status
- `PUT /:id` — Update task fields
- `DELETE /:id` — Delete task
- `PATCH /:id/toggle` — Toggle task completion status
- `PATCH /reorder` — Reorder tasks
- `POST /:id/duplicate` — Duplicate task and its subtasks
- `PATCH /:id/archive` — Toggle task archive state
- `PATCH /:id/dependencies` — Set task dependencies with circular cycle detection
- `POST /:id/snooze` — Snooze task reminder (5m, 10m, 15m, 30m, 1h) and mark current notification read

### Time Tracking (`/api/time`)
- `POST /start` — Start tracking session for a task
- `POST /stop` — Stop active tracking session, record duration, and update task `actualDuration`
- `GET /task/:taskId` — Retrieve session history for a specific task
- `GET /stats` — Retrieve aggregated stats (today, weekly, total minutes)

### Projects (`/api/projects`)
- `GET /` — List user projects with task completion metrics
- `POST /` — Create a new project
- `GET /:id` — Get project details
- `PUT /:id` — Update project
- `DELETE /:id` — Delete project

### Tags (`/api/tags`)
- `GET /` — List user tags with associated task count
- `POST /` — Create tag
- `DELETE /:id` — Delete tag

### Notifications (`/api/notifications`)
- `GET /` — Get user notifications
- `PATCH /:id/read` — Mark notification as read
- `PATCH /read-all` — Mark all notifications as read
- `POST /subscribe` — Register Web Push subscription
- `DELETE /unsubscribe` — Unsubscribe from Web Push

### Focus & Analytics
- `POST /api/focus` — Log a completed Pomodoro session
- `GET /api/focus/stats` — Get total focus minutes and session counts
- `GET /api/analytics/dashboard` — Get 14-day history, streaks, and productivity score

### AI Productivity Engine (`/api/ai`)
- `POST /parse` — Parse natural language task strings into structured metadata (date, time, priority, tags)
- `POST /breakdown` — Generate structured subtask breakdown for a task
- `POST /prioritize` — Multi-factor task scoring based on urgency, priority, blocking status, and duration
- `POST /schedule` — Day-by-day smart schedule optimizer balancing daily focus capacity
- `GET /suggestions` — Proactive productivity suggestions (overdue warnings, streak nudges, focus prompts)

---

## 🔒 Security & Best Practices
- **Strict HTTP-Only Cookies**: JWT tokens are never exposed to browser JavaScript, preventing XSS token theft.
- **CSRF & SameSite**: Cookies are signed with `SameSite: Lax` and `httpOnly: true`.
- **Brute Force Protection**: Rate limiting enabled on sensitive authentication routes (`express-rate-limit`).
- **Data Validation**: Strict validation and sanitization using `express-validator`.
- **Helmet Security Headers**: Standard HTTP security headers enabled via `helmet`.
- **Zero TypeScript Errors**: Both frontend and backend compile under strict TypeScript checks.

---

## 📄 License
This project is licensed under the MIT License.
