# AI Workflow Note

## Summary

I used AI as a speed multiplier for implementation while retaining full ownership of product decisions, architecture, and correctness. AI helped reduce low-value setup and syntax work, allowing me to focus on editing UX, sharing logic, and ensuring the product behaves correctly in a real environment.

---

## Tools Used

- **Claude (Anthropic)** – primary coding assistant  
- **GitHub Copilot** – inline completions during editing  

---

## How I Approached This Build

This assessment asked for AI-native execution, so I treated AI as a core part of my workflow rather than an occasional shortcut. I used it the same way a senior engineer would use a capable but junior collaborator: give it clear direction, review everything it produces, and apply judgment on the decisions it cannot make.

AI accelerates implementation, but it does not replace product judgment, system design decisions, or validation in a real runtime environment. Those responsibilities remained entirely mine.

---

## Where AI Added Value

**Speed on boilerplate.** Express setup, route structure, and database schema were generated quickly and mostly correctly. This reduced setup time by ~80–90%, allowing me to focus on document editing UX and sharing logic.

**TipTap toolbar focus handling.** AI correctly identified the need to use `onMouseDown` with `e.preventDefault()` to prevent editor focus loss—a subtle UX issue that is not immediately obvious without documentation digging.

**Lowdb async patterns and middleware ordering.** These were correctly structured in the first pass, reducing debugging time during backend wiring.

---

## Decisions I Made That AI Did Not

**Database choice.** AI suggested Supabase. I chose lowdb to keep the project fully local and frictionless for reviewers, avoiding external setup dependencies.

**Authentication approach.** Instead of JWT + secrets, I used simple session tokens stored in the database. This keeps the system inspectable via `data/db.json` and removes environment setup complexity.

**Styling approach.** I avoided Tailwind and used plain CSS variables and classes to reduce build tooling overhead and improve readability.

**File import scope.** AI proposed a full Markdown parser. I reduced scope to basic heading extraction, prioritizing reliability and time constraints over feature completeness.

**User onboarding.** I replaced registration flows with seeded demo users so reviewers can immediately test sharing and access control.

---

## Bugs I Found and Fixed

**1. Server initialization race condition**
The backend used static ES module imports, causing route handlers to initialize before `initDb()` completed. This created a race condition where login requests hit an uninitialized store and crashed intermittently in live mode but not in tests. I fixed this by restructuring startup to ensure `await initDb()` completes before route initialization.

**2. JSON parsing crash on failed API calls**
Frontend fetch logic assumed JSON responses even when backend was down, causing crashes when HTML error pages were returned. I fixed this by validating `content-type` before parsing and adding error handling for non-JSON responses.

---

## How I Verified the Output

- Jest test suite (11 tests) validated core backend routes
- Manual testing of full document lifecycle: create → edit → save → reload
- Sharing tested with seeded users (owner vs shared permissions)
- File upload tested with `.txt` and `.md` inputs
- Persistence verified via browser refresh and direct DB inspection

I focused validation on critical user flows rather than exhaustive edge cases due to time constraints.

---

## Where AI Was Not Helpful

- Debugging runtime vs test environment differences in async initialization
- Determining correct product scope boundaries (AI tended to overbuild features)
- Validating real UX behavior in the browser (AI cannot observe runtime interaction)

These required direct manual reasoning and testing.

---

## What I Would Improve Next (With More Time)

I would use AI more effectively to help design a structured document model (e.g., version history or operational transforms), where correctness constraints are more complex and require careful validation beyond simple CRUD behavior.

---

## What I Take Away

The productivity gain from AI in this build came primarily from eliminating low-value implementation work, not from replacing engineering judgment. Every meaningful product and architecture decision remained human-driven.

That balance—AI for speed, human for correctness—is what “AI-native development” looks like in practice.
