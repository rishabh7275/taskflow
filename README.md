# TaskFlow

A clean Kanban-style task manager built with **TypeScript, React 18, MUI v6 and Vite**.

## Features
- Three columns (To do, In progress, Done) with drag and drop, plus a "Move to" menu
- Add, edit and delete tasks, with Undo after delete
- Priority (colour stripe and tinted chip), due dates and overdue highlighting
- Live search and priority filter
- Progress stats at the top
- Light mode by default, with a dark mode toggle (your choice is remembered)
- Tasks are saved in the browser (localStorage)
- Responsive layout for phone, tablet and desktop

## Getting started
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```
Open http://localhost:5173

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Project structure
```
src/
  App.tsx              state, filters, handlers
  theme.ts             MUI light/dark theme and fonts
  types.ts, utils.ts   types, labels, date helpers
  seed.ts              starter tasks
  hooks/useLocalStorage.ts
  components/
    Header.tsx  StatsBar.tsx  Column.tsx  TaskCard.tsx  TaskDialog.tsx
```

## Tech stack
React 18, TypeScript, MUI v6, Emotion, Vite, Fontsource (Bricolage Grotesque, DM Sans)
