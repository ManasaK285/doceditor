# DocEditor

A lightweight collaborative document editor built for the Ajaia LLC Technical Program Manager assessment.

## Live Demo

> Frontend: https://doceditor-taxu.onrender.com
> Backend: https://doceditor-v2xu.onrender.com

**Demo Accounts** (all use password `demo1234`):
| Username | Email |
|----------|-------|
| alice | alice@demo.com |
| bob | bob@demo.com |
| carol | carol@demo.com |

To test sharing: log in as `alice`, open a document, click **Share**, grant `bob` access. Then open a new browser window, log in as `bob`, and see the shared document appear in the sidebar under "Shared with Me."

---

## Local Setup

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm 9+

> **Important:** The backend and frontend must run in two separate terminal windows at the same time.

---

### Terminal 1 - Backend

```bash
cd backend
npm install
node index.js
```

You should see:
```
✓ Database ready
✓ DocEditor API running on http://localhost:3001
```

Leave this terminal open and running. Do not close it.

The database is created automatically at `backend/data/db.json` on first run. Three demo users and one sample document are seeded automatically.

---

### Terminal 2 - Frontend

Open a new terminal window, then:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
Local: http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

### Run Tests

In the backend terminal (or a third terminal):

```bash
cd backend
node --experimental-vm-modules node_modules/.bin/jest --testEnvironment node --forceExit
```

Expected output: **11 tests passing**

---

## Supported File Types for Import

- `.txt` - plain text files
- `.md` - Markdown files (headings `#`, `##`, `###` are parsed into rich text)

Files up to 5MB. DOCX is not supported (see Architecture Note for reasoning).

---

## Environment Variables

**Backend** (optional - defaults work for local dev):
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** (optional):
```
VITE_API_URL=http://localhost:3001/api
```

For production, set `VITE_API_URL` to your deployed backend URL.

---

## Project Structure

```
doceditor/
├── backend/
│   ├── db/index.js            # JSON database, seed data
│   ├── middleware/auth.js     # Session auth middleware
│   ├── routes/
│   │   ├── auth.js            # Login, logout, user listing
│   │   ├── documents.js       # CRUD + sharing endpoints
│   │   └── upload.js          # File import
│   ├── __tests__/api.test.js  # Jest test suite (11 tests)
│   └── index.js               # Express server
└── frontend/
    └── src/
        ├── components/        # Sidebar, ShareModal, Toast
        ├── hooks/             # useAuth context
        ├── lib/api.js         # Typed API client
        ├── pages/             # Login, Home, Editor
        └── styles/            # Global CSS, editor prose styles
```

---

## What Is and Is Not Implemented

### Working
- Document creation, rename, edit, delete
- Rich text formatting: bold, italic, underline, strikethrough, highlight, H1-H3, bullet and numbered lists, text alignment
- Autosave (2 second debounce) and manual save
- File import (.txt and .md)
- Sharing: owner grants view or edit access by username
- Shared documents visible in sidebar with role badge
- View-only enforcement for viewers (no toolbar rendered)
- Session-based auth with seeded demo users
- Full persistence across browser reloads

### Not Implemented
- Real-time collaboration (would require WebSockets + CRDT)
- .docx file import
- User registration (replaced with seeded accounts for reviewer convenience)
- Export to PDF or Markdown

### Would Build Next (2-4 hours)
- Export to Markdown or PDF
- Document version history with restore
- Real-time presence indicators
