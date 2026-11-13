# Smart Complaint Portal

A full-stack campus grievance and complaint management system built with React, TypeScript, Express, Tailwind CSS, and optional Gemini AI-assisted triage.

## Features

- **Student Authentication & Roster Verification:** USN + password verification backed by persistent JSON storage (`db_students.json`).
- **Automated Department Routing:** Complaints are automatically routed to the appropriate campus office (`Hostel Office`, `IT Support Staff`, `Library Staff`, `Anti-Ragging Cell`, `Academic Dean Office`, `Estate & Maintenance`, or `Director Office` on escalation).
- **Community Upvoting & Status Tracking:** Students can upvote public complaints, track ticket resolution stages, and submit feedback ratings once resolved.
- **Admin Console & Analytics:** Interactive charts (`recharts`), department filters, manual reassignment, student roster management, and AI-assisted resolution drafts.
- **Dark Mode & Responsive UI:** Smooth animations with `motion` and full light/dark theme support.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion, Recharts
- **Backend:** Node.js, Express, Vite Middleware (dev) / Static Bundle (prod)
- **AI Integration:** `@google/genai` (automatically falls back to built-in simulated advice if `GEMINI_API_KEY` is not set)

## Running Locally in VS Code

### Prerequisites

- **Node.js** (v18 or higher recommended) and **npm**

### 1. Install Dependencies

Open the project folder in VS Code, open the terminal (`Ctrl + ~`), and run:

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Copy `.env.example` to `.env` if you want live Gemini AI advice:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` inside `.env`. If omitted, the app still runs normally using simulated AI responses.

### 3. Start the Development Server

```bash
npm run dev
```

Once started, open **http://localhost:3000** in your browser.

> If port `3000` is already in use on your machine, stop the other process or start with another port:
> - **Windows PowerShell:** `$env:PORT=3001; npm run dev`
> - **macOS / Linux:** `PORT=3001 npm run dev`

## Production Build

```bash
npm run build
npm start
```

## Type Checking

```bash
npm run lint
```
