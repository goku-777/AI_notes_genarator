# AI Notes Generator

AI Notes Generator converts meeting recordings into organized, AI-powered notes. Upload a recording or record live in your browser, get an accurate transcript, and let Gemini AI extract a structured summary, action items, decisions, risks, and next steps — all editable, searchable, exportable, and shareable.

This is a full-stack, production-structured monorepo:

```
ai-notes-generator/
├── backend/     Node.js + Express + TypeScript REST API, MongoDB, JWT auth, AI integration
├── frontend/    React 19 + TypeScript + Vite + TailwindCSS v4 SPA
└── README.md    This file
```

---

## 1. Folder Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/         # env loader, MongoDB connection, Cloudinary config
│   ├── controllers/     # Route handlers (auth, meetings, recordings, transcripts, summaries, action items, notes, export, search, users)
│   ├── middleware/      # JWT auth guard, error handler, validation, rate limiting, file upload
│   ├── models/          # Mongoose schemas: User, Meeting, Recording, Transcript, Summary, ActionItem, Notes
│   ├── routes/          # Express routers, one per resource
│   ├── services/        # Gemini AI, Whisper, Cloudinary, email, PDF/DOCX export
│   ├── utils/           # JWT helpers, ApiError, response wrapper, validators
│   ├── app.ts            # Express app wiring (middleware + routes)
│   └── server.ts         # Entry point: connects DB, starts server, graceful shutdown
├── .env.example
├── package.json
└── tsconfig.json
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Input, Card, Modal, ConfirmDialog, Badge, Spinner, Toaster
│   │   ├── layout/        # Sidebar, Topbar, DashboardLayout, AuthLayout, ProtectedRoute
│   │   ├── dashboard/      # MeetingCard
│   │   ├── notes/          # ActionItemCard, ExportModal, ShareModal
│   │   └── recording/      # AudioPlayer
│   ├── pages/             # Landing, Login, Register, Forgot/Reset Password, Dashboard, Upload,
│   │                       # Live Recording, Meeting Detail, History, Profile, Settings, Shared Notes, 404
│   ├── hooks/              # useMeetings, useMeetingDetail, useDashboardStats, useMediaRecorder
│   ├── services/            # Axios API client + one service module per backend resource
│   ├── context/             # AuthContext (global auth state)
│   ├── types/                # Shared TypeScript types mirroring backend models
│   └── lib/                   # cn() class-merge utility
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.app.json
```

---

## 2. Installation Steps

### Prerequisites
- Node.js 18+ and npm
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- An [OpenAI API key](https://platform.openai.com/api-keys) (for Whisper transcription)
- A [Cloudinary account](https://cloudinary.com) (free tier is enough)
- An SMTP account for password-reset emails (Gmail App Password works fine)

### Clone & install
```bash
# from the project root
cd backend && npm install
cd ../frontend && npm install
```

---

## 3. Environment Variables

### Backend — copy `backend/.env.example` to `backend/.env`
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/ai-notes-generator

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace_with_another_long_random_string
JWT_REFRESH_EXPIRES_IN=30d

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

OPENAI_API_KEY=your_openai_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=AI Notes Generator <no-reply@ainotes.com>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

Generate strong secrets quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend — copy `frontend/.env.example` to `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 4. Backend Commands
```bash
cd backend
npm run dev      # Start with hot-reload (ts-node + nodemon) on http://localhost:5000
npm run build     # Compile TypeScript to dist/
npm start          # Run the compiled build (for production)
```

## 5. Frontend Commands
```bash
cd frontend
npm run dev       # Start Vite dev server on http://localhost:5173
npm run build      # Type-check and build to dist/
npm run preview     # Preview the production build locally
```

---

## 6. MongoDB Setup

**Option A — Local MongoDB**
```bash
# Install MongoDB Community Edition, then:
mongod --dbpath /path/to/data
```
Use `MONGODB_URI=mongodb://localhost:27017/ai-notes-generator`.

**Option B — MongoDB Atlas (recommended for deployment)**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add your IP (or `0.0.0.0/0` for cloud deployments) to the Network Access list
3. Create a database user
4. Copy the connection string into `MONGODB_URI`, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai-notes-generator`

Collections (`users`, `meetings`, `recordings`, `transcripts`, `summaries`, `actionitems`, `notes`) are created automatically by Mongoose on first write — no manual schema setup needed.

---

## 7. AI API Setup

### Google Gemini (summary generation)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key
3. Set `GEMINI_API_KEY` in `backend/.env`
4. `GEMINI_MODEL` defaults to `gemini-1.5-flash` (fast, cheap); use `gemini-1.5-pro` for higher-quality summaries

### OpenAI Whisper (speech-to-text)
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an API key (requires billing enabled on the OpenAI account)
3. Set `OPENAI_API_KEY` in `backend/.env`

### Cloudinary (audio/video storage)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. From the dashboard, copy Cloud Name, API Key, and API Secret into `backend/.env`

---

## 8. Deployment Guide

### Backend (Render, Railway, or any Node host)
1. Push the `backend/` folder as its own service (or use a monorepo-aware host)
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set all variables from `backend/.env.example` in the host's environment variable settings
5. Set `CLIENT_URL` to your deployed frontend URL (for CORS)
6. Set `MONGODB_URI` to your Atlas connection string

### Frontend (Vercel, Netlify, or any static host)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set `VITE_API_BASE_URL` to your deployed backend URL + `/api` (e.g. `https://your-api.onrender.com/api`)
4. For client-side routing (React Router), add a rewrite/fallback rule so all paths serve `index.html`:
   - **Vercel**: add a `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
   - **Netlify**: add a `_redirects` file in `public/` with `/* /index.html 200`

### Quick VPS deployment (PM2 + Nginx)
```bash
# Backend
cd backend && npm install && npm run build
pm2 start dist/server.js --name ai-notes-backend

# Frontend
cd frontend && npm install && npm run build
# Serve dist/ via Nginx, proxying /api to the backend port
```

---

## 9. Testing Instructions

### Manual smoke test (recommended path through the app)
1. Start backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`)
2. Visit `http://localhost:5173` → Landing page should load
3. Click **Get started free** → Register a new account
4. You should land on `/dashboard` with empty stats
5. Go to **Upload Recording**, upload an MP3/WAV file → should redirect to the meeting detail page
6. Click **Generate Transcript** → Whisper transcribes the audio (requires a valid `OPENAI_API_KEY`)
7. Click **Generate Summary** → Gemini generates the structured summary, action items, and initial notes (requires a valid `GEMINI_API_KEY`)
8. Check the **Summary** tab for decisions/action items, and the **Notes** tab for the editable note (autosaves)
9. Try **Export** (PDF/DOCX/TXT/MD) and **Share** (generate link, open it in an incognito window to confirm the public `/shared/:token` route works without auth)
10. Go to **History**, search for the meeting, delete it, then check **View trash** to restore it
11. Go to **Profile**, update your name, upload a profile picture, change your password

### API smoke test (curl)
```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Automated testing
The project doesn't ship with a test suite — to add one, place backend tests under `backend/src/__tests__` using Jest + Supertest, and frontend tests with Vitest + React Testing Library. Ask if you'd like these scaffolded.

---

## 10. Building an Android APK (Capacitor)

The frontend is wrapped with [Capacitor](https://capacitorjs.com), which packages the React/Vite web app into a real native Android shell. This repo already includes:

- `frontend/capacitor.config.ts` — the Capacitor config (`appId: com.ainotesgenerator.app`)
- `frontend/android/` — a fully generated native Android project with the built web app already copied into it
- Helper scripts in `frontend/package.json`: `android:sync`, `android:open`, `android:build`

**What's already done for you:** Capacitor is installed, the config is valid, the native Android project structure exists, and the web build is correctly bundled into `android/app/src/main/assets/public/`. All of this was generated and verified.

**What you still need to do, and why:** the final compile step (`gradlew assembleDebug`) needs to download Gradle and Android SDK components from `services.gradle.org` and Google's Maven repos. That step has to run on your own machine or a CI runner with normal internet access and the Android SDK installed — it's not something that can be pre-built and handed to you as a static file, since the APK has to be compiled against the actual Android toolchain.

### Prerequisites (one-time setup on your machine)
1. Install [Android Studio](https://developer.android.com/studio) (this also installs the Android SDK and a JDK)
2. Open Android Studio once and let it finish its initial SDK component download

### Build the APK
```bash
cd frontend

# Rebuilds the web app and copies it into the native Android project
npm run android:sync

# Open in Android Studio (recommended for your first build — lets you
# pick a device/emulator, see logs, and handles signing for you)
npm run android:open
```
From Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK will appear at `android/app/build/outputs/apk/debug/app-debug.apk`.

**Or, fully from the command line** (after Android Studio's SDK has been installed at least once):
```bash
npm run android:build
# equivalent to: npm run android:sync && cd android && ./gradlew assembleDebug
```

### Before you ship a real release build
- Set `VITE_API_BASE_URL` in `frontend/.env` to your **deployed** backend URL (not `localhost`) before running `android:sync`, since the APK won't have access to your dev machine's localhost.
- For a signed release APK (vs. the debug one above), follow Android's [app signing guide](https://developer.android.com/studio/publish/app-signing) — this requires generating a keystore, which is a one-time step you do locally and keep private.
- Update the app icon and splash screen via `npx cap` plugins like `@capacitor/assets` if you want custom branding beyond the default Capacitor icon.

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Frontend framework | React 19, TypeScript, Vite |
| Styling | TailwindCSS v4, custom glassmorphism design system |
| Animation | Framer Motion |
| Routing | React Router v7 |
| HTTP client | Axios (with auto token-refresh interceptor) |
| Icons | lucide-react |
| Notifications | react-hot-toast |
| Backend framework | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcrypt |
| AI summary | Google Gemini |
| Speech-to-text | OpenAI Whisper |
| File storage | Cloudinary |
| Export | pdfkit (PDF), docx (Word) |
| Security | helmet, CORS, express-rate-limit, express-validator |

---

## Design System

The UI follows a "glossy white / matte black / glassmorphism" theme (Apple × Notion × ChatGPT inspiration), defined as CSS custom properties in `frontend/src/index.css`:

- **Surfaces**: white (`#FFFFFF`), soft off-white (`#FAFAFA`)
- **Ink**: black (`#000000`), charcoal (`#1E1E1E`), graphite (`#2A2A2A`)
- **Silver**: `#B0B0B0` / `#E4E4E4`
- **Accent**: indigo `#4F46E5`
- No gradients; soft diffuse shadows, generous border radii, backdrop-blur glass surfaces, button ripple effects, and skeleton loading shimmer.
