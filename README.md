# TaskFlow — AI-Powered Task Management Application

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-059669?style=for-the-badge&logo=vercel&logoColor=white)](https://taskflow-eight-gold-52.vercel.app)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/MUI%20v6-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Zustand](https://img.shields.io/badge/Zustand-443e38?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

TaskFlow is a modern, full-featured productivity and project management web application built with **React 18**, **TypeScript**, **Material UI (MUI v6)**, and **Vite**. It pairs intuitive Kanban workflows and monthly calendar scheduling with **Google Gemini AI** to deliver an intelligent assistant and daily smart planner.

🔗 **Live Application:** [https://taskflow-eight-gold-52.vercel.app](https://taskflow-eight-gold-52.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots & UI Showcase](#screenshots--ui-showcase)
- [Technology Stack](#technology-stack)
- [Project Architecture & Structure](#project-architecture--structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [What I Learned](#what-i-learned)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

TaskFlow bridges the gap between daily task execution and strategic planning. Rather than serving as just another static to-do list, TaskFlow actively assists users by:
1. Visualizing workloads across an accessible drag-and-drop **Kanban Board** and a responsive **Monthly Calendar**.
2. Using **Google Gemini API** to analyze pending tasks, deadlines, and priorities into actionable, sequenced **Daily Smart Plans**.
3. Providing real-time **Analytics & Velocity Metrics** to track progress, completion trends, and priority distribution.
4. Ensuring high reliability with **Cloud Firestore synchronization**, automated offline fallback (`localStorage`), and zero data loss.

---

## Key Features

### 1. Interactive Kanban Workspace
- **Drag-and-Drop Columns**: Smooth drag-and-drop task movements across `To do`, `In progress`, and `Done` powered by `@dnd-kit`.
- **Advanced Filtering & Sorting**: Filter tasks by priority (High, Medium, Low), custom colored labels, and due dates (Today, This Week, Overdue). Sort by newest, priority rank, or due date.
- **Bulk Actions**: Multi-select tasks to move status, reassign priority, or delete in batches.
- **History & Undo/Redo**: Instant undo/redo support for board actions and accidental task deletions.
- **Fast Search & Keyboard Shortcuts**: Instant search filtering (`/` hotkey), quick new task modal (`N`), shortcuts dialog (`?`), and a global Command Palette (`⌘K` / `Ctrl+K`).

### 2. Intelligent Calendar View
- **Monthly Grid Alignment**: Correct weekday alignment (Sunday through Saturday) adapting to varying month lengths and leap years.
- **Date Navigation**: Previous, Next, and Today controls with localized month/year headers.
- **Visual Deadline Highlighting**: Current date highlighted with active accent badges; overdue tasks clearly signaled.
- **Click-to-Create & Edit**: Click any day cell or its quick `+` button to create a task with the date automatically pre-filled into `dueDate`. Click existing task chips to view and edit.
- **Unscheduled Tasks Tray**: Dedicated section for tasks without due dates, enabling quick scheduling directly from the calendar.

### 3. AI Smart Planner (Powered by Google Gemini)
- **One-Click Dashboard Planning**: Click the dedicated **"AI Smart Planner"** button on the Kanban board to trigger a context-aware workload analysis.
- **Structured 4-Section Plan**:
  1. **Today’s Priorities**: Identifies the top 2–3 critical items based on urgency and priority.
  2. **Recommended Task Order**: Provides an optimized, sequential execution roadmap with practical reasoning.
  3. **Deadline Warnings**: Proactively highlights overdue items, deadlines due today, and approaching targets.
  4. **Suggested Next Steps**: Micro-steps for complex tasks (leveraging checklist subtasks), realistic schedules if estimated times exist, and low-priority items that can be postponed to prevent burnout.
- **Safety & Factual Grounding**: Strictly advisory; does not invent deadlines, hallucinate missing data, or mutate user tasks.
- **Export & Refresh**: 1-click clipboard copy (`Copy Plan`) and dynamic regeneration (`Refresh Plan`).

### 4. Integrated AI Assistant Chat
- **Floating Interactive Widget**: Collapsible AI companion accessible anywhere on the board.
- **Quick Smart Prompts**: 1-tap suggestion chips (*"Plan my day"*, *"What should I do first?"*, *"Analyze my pending tasks"*, *"Make a plan for my overdue tasks"*).
- **Formatted Markdown Bubbles**: Renders bold text, headers, and bullet points cleanly inside chat messages.
- **Resilient Request Lifecycle**: Built-in 20-second `AbortController` cancellation, error handling, and 1-click retry.

### 5. Detailed Task Management
- **Rich Task Metadata**: Title, description, status, priority, ISO due dates, estimated time, and notes.
- **Checklist Subtasks**: Interactive subtasks with live progress bar and completion percentage.
- **Custom Tagging**: Multi-color label tagging system with preset and custom labels.

### 6. Analytics & Productivity Insights
- **Visual Metrics (Recharts)**: Completion rate progress, priority distribution pie charts, task velocity, and weekly completion trends.
- **Today's Agenda Widget**: Compact collapsible view of immediate priorities, overdue tasks, and items due today.

### 7. Cloud Synchronization & Portability
- **Firebase Authentication**: Sign in with Google OAuth or Email/Password, plus an instant Guest/Demo workspace option.
- **Firestore Real-time Sync**: Automatic two-way cloud persistence for authenticated users with offline fallback to browser storage.
- **Multi-Board Management**: Create, rename, switch, and delete multiple boards per account.
- **Import & Export**: Backup boards as JSON files or export tasks into CSV format.

### 8. Personalization & Accessibility
- **Theming**: Dark mode, light mode, and system preference detection.
- **Accent Colors & Density**: Curated accent color options (Indigo, Purple, Emerald, Rose, Amber) and comfortable vs. compact spacing.
- **Bilingual Support**: Full English and Hindi (`hi-IN`) localization powered by `i18next`.

---

## Screenshots & UI Showcase

| Kanban Board & Today Widget | AI Smart Planner Dialog |
| :---: | :---: |
| ![Kanban Board View](https://via.placeholder.com/600x340/1e293b/ffffff?text=TaskFlow+Kanban+Board) | ![AI Smart Planner](https://via.placeholder.com/600x340/1e293b/ffffff?text=AI+Smart+Planner+Modal) |
| *Drag-and-drop workflow with column filtering* | *4-part structured daily plan generated by Gemini* |

| Monthly Calendar View | Analytics Dashboard |
| :---: | :---: |
| ![Calendar View](https://via.placeholder.com/600x340/1e293b/ffffff?text=TaskFlow+Monthly+Calendar) | ![Analytics Dashboard](https://via.placeholder.com/600x340/1e293b/ffffff?text=TaskFlow+Analytics+Metrics) |
| *Month grid with deadline highlights and date click-to-create* | *Completion ratios, priority charts, and productivity metrics* |

---

## Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite](https://vitejs.dev/) |
| **UI Components & Styling** | [Material UI (MUI v6)](https://mui.com/), [Emotion](https://emotion.sh/), [Framer Motion](https://www.framer.com/motion/) |
| **Typography** | `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/dm-sans`, `@fontsource/noto-sans-devanagari` |
| **State Management** | [Zustand v5](https://github.com/pmndrs/zustand) with persistence and custom undo/redo history middleware |
| **Drag & Drop** | [`@dnd-kit/core`](https://dndkit.com/), `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Data Visualization** | [Recharts v3](https://recharts.org/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) |
| **Internationalization** | [i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/) (English & Hindi) |
| **AI Integration** | [Google Gen AI SDK (`@google/genai`)](https://www.npmjs.com/package/@google/genai) |
| **Backend / Serverless** | Vercel Serverless Function (`/api/assistant.ts`) with local Vite proxy |
| **Auth & Database** | [Firebase v13](https://firebase.google.com/) (Firebase Authentication & Cloud Firestore) |

---

## Project Architecture & Structure

```
taskflow/
├── api/
│   └── assistant.ts          # Serverless endpoint: sanitizes task context and calls Gemini API
├── public/                   # Static assets, favicon, and manifests
├── src/
│   ├── components/           # Reusable UI & domain components
│   │   ├── AIAssistant.tsx         # Floating Gemini AI chat widget with quick suggestion chips
│   │   ├── BoardModal.tsx          # Board create / rename dialog
│   │   ├── BulkActionBar.tsx       # Floating toolbar for bulk task mutations
│   │   ├── Column.tsx              # Kanban column with drag-and-drop drop-target
│   │   ├── CommandPalette.tsx      # Global ⌘K command palette
│   │   ├── ErrorBoundary.tsx       # Application crash recovery boundary
│   │   ├── Header.tsx              # Top navigation, search bar, sync indicator, and user menu
│   │   ├── Layout.tsx              # Main layout, sidebar navigation, keyboard listeners
│   │   ├── PageSkeleton.tsx        # Lazy-load suspense fallback
│   │   ├── ProtectedRoute.tsx      # Authentication route guard
│   │   ├── ShortcutsDialog.tsx     # Keyboard shortcut cheatsheet modal
│   │   ├── SmartPlannerDialog.tsx  # AI Smart Planner 4-part structured modal
│   │   ├── StatsBar.tsx            # High-level task progress banner
│   │   ├── TaskCard.tsx            # Kanban task card with priority strip and subtask toggle
│   │   ├── TaskDialog.tsx          # Add / Edit task modal (Zod validated form)
│   │   └── TodayWidget.tsx         # Dashboard quick agenda widget for today/overdue
│   ├── context/
│   │   └── AuthContext.tsx         # Firebase Auth state & guest mode provider
│   ├── hooks/
│   │   ├── useAuth.ts              # Authentication state hook
│   │   ├── useFirestoreSync.ts     # Two-way Firestore workspace synchronization hook
│   │   └── useLocalStorage.ts      # LocalStorage helper hook
│   ├── lib/
│   │   ├── dataTools.ts            # JSON import/export and CSV export utilities
│   │   ├── firebase.ts             # Firebase app, auth, and firestore initialization
│   │   ├── i18n.ts                 # i18next translation resources (English & Hindi)
│   │   ├── theme.ts                # MUI dynamic theme builder (mode, accent, density)
│   │   └── utils.ts                # Priority ranks, date formatters, and status metadata
│   ├── pages/
│   │   ├── AnalyticsPage.tsx       # Charts, velocity, and productivity metrics
│   │   ├── BoardPage.tsx           # Main Kanban board dashboard with Smart Planner button
│   │   ├── CalendarPage.tsx        # Responsive monthly calendar view
│   │   ├── LoginPage.tsx           # Auth screen (Google, Email/Password, Guest mode)
│   │   ├── NotFoundPage.tsx        # 404 handler
│   │   └── SettingsPage.tsx        # Preferences, density, language, data management
│   ├── store/
│   │   └── useTaskStore.ts         # Zustand central state: tasks, boards, dialogs, undo/redo
│   ├── types.ts                    # Core TypeScript definitions (Task, Board, Priority, Status)
│   ├── App.tsx                     # Route registration, theme provider, auth wrapper
│   └── main.tsx                    # Application entry point
├── .env.example              # Template for local environment variables
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # Strict TypeScript configuration
├── vercel.json               # Vercel deployment rewrites and API routing
└── vite.config.ts            # Vite setup with local API dev server middleware
```

---

## Getting Started

### Prerequisites

Make sure you have installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)
- **Git**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rishabh7275/taskflow.git
   cd taskflow
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Environment Variables

TaskFlow uses environment variables for Firebase Authentication, Cloud Firestore, and the Google Gemini API.

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your configuration:

```env
# Google Gemini API Key (Required for AI Assistant and AI Smart Planner)
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web App Configuration (Required for cloud sync & authentication)
# Obtain these from the Firebase Console -> Project Settings -> General -> Your apps
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

> **Security Note:** Never commit your `.env.local` file or expose your API keys in frontend code. The Gemini API key is executed securely on the server via `api/assistant.ts` and Vite's local development middleware.

### Running the Application

Use the scripts defined in `package.json`:

| Script | Command | Description |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Starts Vite dev server with integrated API middleware at `http://localhost:5173` |
| **Type Check & Build** | `npm run build` | Runs strict TypeScript verification (`tsc --noEmit`) and builds for production |
| **Preview** | `npm run preview` | Locally previews the production build bundle |
| **Vercel Dev** | `npm run dev:vercel` | Runs local server using the Vercel CLI |

Start the development server:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Deployment

TaskFlow is configured for instant deployment on **Vercel**.

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy TaskFlow"
   git push origin main
   ```
2. Import the repository in the [Vercel Dashboard](https://vercel.com).
3. Add the environment variables in **Project Settings → Environment Variables**:
   * `GEMINI_API_KEY`
   * `VITE_FIREBASE_API_KEY`
   * `VITE_FIREBASE_AUTH_DOMAIN`
   * `VITE_FIREBASE_PROJECT_ID`
   * `VITE_FIREBASE_STORAGE_BUCKET`
   * `VITE_FIREBASE_MESSAGING_SENDER_ID`
   * `VITE_FIREBASE_APP_ID`
4. Deploy! Vercel will build the frontend via `npm run build` and automatically host `/api/assistant.ts` as a serverless function.

---

## What I Learned

Building TaskFlow provided practical experience in delivering a complete, production-grade web application:

* **State Architecture with Zustand**: Implemented complex state orchestration including multi-board task filtering, active dialog states, undo/redo history stacks, and automated local persistence without the boilerplate of Redux.
* **Effective LLM Grounding**: Engineered prompts for Google Gemini to deliver structured, deterministic 4-part daily plans. Solved real-world LLM challenges such as date injection, strict factual adherence, and preventing task hallucination.
* **Offline-First Synchronization**: Designed a synchronization engine linking Zustand with Firebase Cloud Firestore. Implemented seamless fallback to `localStorage` for unauthenticated or offline users so the app remains fully functional without cloud connectivity.
* **Component-Driven Drag and Drop**: Solved collision detection, keyboard navigation, and responsive touch constraints across complex Kanban board columns using `@dnd-kit`.
* **Production-Grade TypeScript**: Maintained strict type safety throughout data models, API payloads, and MUI v6 custom themes, avoiding `any` assertions.

---

## Future Improvements

- [ ] **Collaborative Shared Boards**: Real-time multi-user cursor tracking and shared workspace permissions.
- [ ] **Recurring Tasks**: Automated recurrence rules (daily, weekly, monthly sprints).
- [ ] **Export to PDF & Markdown**: Formatted PDF report export for weekly reviews and sprint summaries.
- [ ] **Web Push Notifications**: Browser push notifications for approaching deadlines and overdue tasks.
- [ ] **Time Tracking Timer**: Built-in Pomodoro timer logging actual time spent against task estimates.

---

## License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it for personal and commercial projects.
