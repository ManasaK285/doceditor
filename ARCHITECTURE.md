# Architecture Note

## Stack Choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast HMR, small bundle, well-understood ecosystem |
| Editor | TipTap v2 | Best OSS rich-text editor; ProseMirror-based, schema-driven, solid extension API |
| Backend | Node.js + Express | Lightweight, ESM-native, straightforward to deploy |
| Database | lowdb (JSON file store) | Zero-config persistence, no external service, no native compilation - reviewers run it immediately |
| Auth | Session tokens in DB | No JWT secret required, sessions are auditable, store is directly readable |
| Deploy | Vercel (frontend) + Railway (backend) | Both free tier; Railway supports persistent file storage |

---

## What I Prioritized

**Editing experience first.** TipTap gives a keyboard-aware, coherent editing surface out of the box. The toolbar covers all required formatting plus extras (highlight, text alignment) without meaningful complexity cost. Getting this right was the core of the product.

**A sharing model that actually works.** The sharing feature is demoed with real users and real sessions, not mocked states. Log in as alice, share with bob, log in as bob - it works end to end. View-only enforcement is real: the toolbar does not render for viewers.

**Autosave with manual override.** Documents autosave two seconds after the last keystroke (debounced). A manual Save button is also present. This matches real product behavior and prevents data loss without being annoying.

**Reviewer convenience over production realism.** Several decisions were made specifically to make this easy to run and evaluate: lowdb over Postgres, session tokens over JWT, seeded users over registration. In a production system these would change. For a submission being reviewed by a human in a limited time window, reducing setup friction is the right call.

---

## Deliberate Scope Cuts

**No real-time collaboration.** Requires WebSockets and a CRDT library (Yjs or Automerge). The right production approach would be Hocuspocus wrapping TipTap, but that is a 6-8 hour addition. Autosave covers the persistence requirement within the timebox.

**No .docx import.** Reliable .docx parsing requires mammoth.js and significant content normalization work. `.txt` and `.md` cover the use case cleanly with less surface area for edge case bugs.

**Seeded users instead of registration.** A registration flow with email verification would add roughly an hour. Seeded demo accounts let reviewers reach the sharing feature immediately.

**No role-based permissions beyond view/edit.** Owner, editor, and viewer is the right cut for this scope. Commenter and admin roles exist in mature products but add UI complexity without changing the underlying architecture.

---

## Data Model

```
users              (id, username, email, password_hash, created_at)
documents          (id, title, content, owner_id, created_at, updated_at)
document_shares    (id, document_id, shared_with_user_id, permission, created_at)
sessions           (id, user_id, expires_at, created_at)
```

Document `content` is stored as a TipTap/ProseMirror JSON blob. This preserves full formatting fidelity across reloads without serializing to HTML, which loses structural information.

Sharing uses an upsert pattern: sharing the same user twice updates their permission rather than creating a duplicate or erroring.

---

## Error Handling

Every API route returns structured JSON errors with appropriate HTTP status codes:

- `400` - missing or invalid input
- `401` - unauthenticated or wrong credentials
- `403` - authenticated but not authorized (e.g. non-owner trying to delete)
- `404` - resource not found
- `500` - caught by global error handler, logged server-side

The frontend API client checks the response content-type before parsing, catches network failures with readable messages, and surfaces all errors via a toast notification system.

---

## What I Would Build Next (2-4 hours)

1. **Export to Markdown or PDF** - TipTap's JSON can be serialized via prosemirror-markdown; PDF via puppeteer
2. **Document version history** - append-only versions table, UI to browse and restore
3. **Real-time presence** - Hocuspocus server + TipTap collaboration extension
4. **Comment threads** - annotation marks + sidebar panel