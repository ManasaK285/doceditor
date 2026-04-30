# SUBMISSION.md

**Candidate:** Kondapi Manasanjani  
**Role:** Technical Program and Project Manager, AI Delivery  
**Company:** Ajaia LLC

---

## Contents of This Submission

| File/Folder | Description |
|-------------|-------------|
| `backend/` | Node.js + Express API server |
| `frontend/` | React + Vite frontend |
| `README.md` | Local setup and run instructions |
| `ARCHITECTURE.md` | Architecture decisions and tradeoffs |
| `AI_WORKFLOW.md` | AI tools used, what was changed/rejected, verification approach |
| `SUBMISSION.md` | This file |
| `VIDEO.txt` | Walkthrough video URL |

## Video Note
A screen recording walkthrough is included. Audio was not recorded 
due to microphone issues. The video covers all core functionality 
end to end. Happy to walk through implementation decisions on a 
live call if needed.

---

## Live Deployment

- **Frontend:** https://doceditor-taxu.onrender.com
- **Backend API:** https://doceditor-v2xu.onrender.com

---

## Test Credentials

| Username | Email | Password |
|----------|-------|----------|
| alice | alice@demo.com | demo1234 |
| bob | bob@demo.com | demo1234 |
| carol | carol@demo.com | demo1234 |

---

## Feature Status

### ✅ Fully Working
- Document creation, renaming, editing (rich text)
- Rich text formatting: bold, italic, underline, strikethrough, highlight
- Headings (H1, H2, H3), bullet lists, numbered lists, text alignment
- Autosave (2s debounce) + manual save
- Persistent storage in SQLite (survives refresh)
- File upload and import (.txt, .md → new editable document with heading parsing)
- Sharing: owner can grant view or edit access to other users
- Shared documents visible in sidebar under "Shared with Me" with role badge
- View-only enforcement for viewers (no toolbar, editor non-editable)
- Document deletion (owner only)
- Session-based auth with demo user seeding

### ⚠️ Partial / Known Limitations
- File import: .docx not supported (only .txt, .md) — stated in UI and README
- No real-time multi-user collaboration — changes from different sessions require refresh
- No user registration — only seeded demo users supported

### 🔲 Would Build Next (2–4 hours)
- Export to PDF or Markdown
- Document version history with restore
- Real-time presence (Hocuspocus + TipTap collaboration)
- Comment threads

---

## Running Locally (Quick Start)

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev
```

Visit `http://localhost:5173` and log in with any demo account.
