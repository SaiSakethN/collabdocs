# CollabDocs

CollabDocs is a document workspace built for the Ajaia assessment. It supports rich-text writing, durable saving, safe file import, and sharing with a teammate.

## Deliverable links

| Deliverable                    | URL                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Google Drive submission folder | https://drive.google.com/drive/folders/1fFJWe1o6CcWE30YC5T1YsLHBpNgYN2Ir (Anyone with the link — Viewer verified) |
| Live application               | https://collabdocs-ten-iota.vercel.app                                                                            |
| GitHub repository              | https://github.com/SaiSakethN/collabdocs                                                                          |
| Video walkthrough              | **PENDING — user recording and upload required**                                                                  |

## Demo instructions

Use the DEMO MODE identity switcher to choose Alice (alice@collabdocs.demo) or Bob (bob@collabdocs.demo). No passwords are required. Create a document as Alice, share it with Bob, then switch to Bob and select Shared with me.

**Identity switching demonstrates the product but is not secure authentication. Anyone can choose either user. Do not store sensitive information.**

## Implemented features

- Responsive dashboard with search, owned/shared document sections, owner names, timestamps, and loading/empty/error states.
- Tiptap rich-text editor with title changes, bold, italic, underline, headings, lists, and undo/redo.
- Structured JSON persistence in Supabase PostgreSQL, debounced autosave, manual save, error indicators, and unsaved-change warnings.
- Owner/editor sharing, recipient validation, duplicate prevention, and server-side permission checks.
- TXT and Markdown import with file type, size, emptiness, and UTF-8 validation.
- Versioned conditional saves reject stale writes rather than overwriting newer edits.

## Engineering decisions

The existing Next.js App Router project was retained. Route handlers are the trust boundary for validation and demo permission checks. A server-only Supabase client accesses PostgreSQL; no browser-only or ephemeral filesystem persistence is used. The SQL provides keys, indexes, timestamps, and uniqueness constraints. Tiptap JSON preserves rich text. Markdown is parsed into supported nodes without injecting raw HTML. Production authentication and real-time collaboration were intentionally deprioritized and are explicitly documented.

## Setup

1. Install Node 22 or 24 and run npm ci.
2. Copy .env.example to .env.local. Configure SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY.
3. Run supabase/schema.sql in Supabase SQL Editor to create and seed the tables.
4. Run npm run dev and open localhost:3000.
5. Run npm test, npm run lint, and npm run build. For real API checks, start production on port 3002 and run node scripts/verify-api.mjs.

## AI workflow

Codex accelerated code generation, test cases, troubleshooting, and documentation. It inspected installed Next.js documentation, retained the starter architecture, and corrected issues discovered by actual lint/type/build runs. AI_WORKFLOW.md records the tools, decisions, and human involvement without claiming independent review that has not occurred. The user retains final review and submission.

## Tests and verification

- **PASS:** 11 Vitest tests for permission logic, sharing validation, imports, safe conversion, titles, and content validation.
- **PASS:** ESLint and the Next.js production build.
- **PASS:** 15 real API integration checks on the public deployment covering database persistence, formatting JSON, import, sharing, access denial, duplicate shares, and version conflicts.
- **NOT TESTED:** Browser toolbar interactions, autosave timing, and responsive visual checks.

Browser automation was attempted but stopped at a computer-use URL policy guard. See VERIFICATION.md for the manual checklist. Live API checks passed; browser interaction and screenshots remain pending.

## Limitations and planned improvements

Demo identity is client selected and impersonable. Conflict recovery is manual, unsaved edits are held in memory, and the Markdown conversion supports a safe subset. There is no real-time synchronization, comments, history, PDF export, pagination, or sharing revocation. Another 2–4 hours would go toward verified sessions and RLS, browser regression tests, recovery drafts, and conflict comparison.

The prepared package includes the source ZIP, setup instructions, architecture, actual AI workflow, verification evidence, and video script. The user will record the 3–5 minute video, add the real links, review this response, and submit the assessment personally.
