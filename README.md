# CollabDocs

A focused collaborative document workspace: write a draft, import your notes, and invite a teammate to edit. Built in the existing Next.js application for the Ajaia assessment.

## Final deliverables

- Live: https://collabdocs-ten-iota.vercel.app
- Source: https://github.com/SaiSakethN/collabdocs
- Submission: https://drive.google.com/drive/folders/1fFJWe1o6CcWE30YC5T1YsLHBpNgYN2Ir
- Human-recorded walkthrough: https://drive.google.com/file/d/1bdiY5RR4Znl2j3Cx58X0S2Q2AsiLtpQN/view?usp=sharing
- Screenshots: https://drive.google.com/drive/folders/1wj_vQgtaIv6WjgEnfmU9TgKhCTzDI1vs

Folder Viewer permission is confirmed in metadata. A signed-out request returned partial MP4 video content; the connector does not expose the exact video permission list. Video duration and end-to-end playback were not independently checked.

## Features

- Responsive dashboard with search, owned documents, shared documents, owner names, and modification dates.
- Tiptap editor: bold, italic, underline, headings, bullets, numbered lists, undo/redo, and structured JSON persistence.
- Renaming, debounced autosave, manual save, visible failures, and unsaved navigation warnings.
- UTF-8 TXT and Markdown import, 1 MiB limit, server validation, safe token-to-JSON conversion.
- Owner/editor sharing with validated recipients and duplicate prevention.
- A visible three-dot menu at the top-right of every document card. Owners can select Delete document and confirm permanent deletion; shared editors do not see Delete.
- Durable Supabase PostgreSQL storage and conditional versions that reject stale updates.
- Explicit DEMO MODE switcher for Alice and Bob.

**Demo mode is not secure authentication. Anyone can choose either identity. Use sample content only.** The server checks permissions for the supplied identity; a production version must derive identity from a verified session.

## Stack and prerequisites

Next.js 16 App Router, React 19, TypeScript, Tiptap 3, Lucide React, Tailwind/custom CSS, Supabase PostgreSQL, Marked, and Vitest 4. Use Node.js 22 or 24, npm, and a Supabase project. Dependencies are locked in package-lock.json.

## Setup

```sh
npm ci
```

Copy `.env.example` to `.env.local` and configure:

| Variable                  | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| SUPABASE_URL              | Supabase project URL                                  |
| SUPABASE_SERVICE_ROLE_KEY | Server-only service role or compatible secret API key |

Never prefix the secret with NEXT_PUBLIC, commit it, paste it into a public submission, or put it in client code. `.env.local` is ignored. If a key was shared in chat, rotate it before public release.

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates tables, foreign keys, indexes, unique sharing constraints, timestamps, and the Alice/Bob seed records. It enables RLS and revokes browser roles' direct table access; server routes use the service role after checking demo authorization. Rerunning it preserves documents.

```sh
npm run dev
```

Open http://localhost:3000. If that port is occupied, use `npm run dev -- -p 3002`. In Windows PowerShell with restricted script execution, use `npm.cmd` in place of `npm`.

## Demo users

Choose the identity in the sidebar's DEMO MODE switcher:

- Alice: alice@collabdocs.demo
- Bob: bob@collabdocs.demo

No password is required. Create as Alice, share with Bob, then switch to Bob and open Shared with me. Bob can edit but cannot change sharing. Switching identities resets the current document, with a warning if edits are unsaved.

## Verification commands

```sh
npm run lint
npm test
npm run build
npm run start -- -p 3002
node scripts/verify-api.mjs
```

The API script defaults to http://localhost:3002. Set VERIFY_BASE_URL to test another origin. It writes `verification-results.json` and leaves clearly labeled verification documents in the demo database. It checks persistence, import, sharing, forbidden access, duplicate shares, and stale updates against real routes. A successful API check does not prove browser toolbar or debounce behavior. See `VERIFICATION.md` for actual results and the manual checklist.

## Deploy to Vercel

1. Review the code and approve publication. Create the public `SaiSakethN/collabdocs` repository without adding a separate starter.
2. Push the local main branch, preserving existing remote history.
3. Import that repository into Vercel as a Next.js project, or deploy the included source through the Vercel API.
4. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as server-side environment variables in the intended environment. Use a rotated secret.
5. Deploy, then test the actual public HTTPS origin. Run the API script with VERIFY_BASE_URL set to that URL and complete the browser checklist.
6. Record verified links in the URL text files, SUBMISSION.md, and ASSESSMENT_RESPONSE.md. Public reviewers must be able to access the production URL without paying or signing into Vercel.

Verified publication: https://collabdocs-ten-iota.vercel.app and https://github.com/SaiSakethN/collabdocs. All 15 API checks also passed on the public Vercel deployment. The Drive package is uploaded with public Viewer permission verified. The final user-recorded walkthrough and six screenshots are supplied. Current checks passed: 17 Vitest tests, lint, production build, and 5 production browser checks focused on owner-only deletion. See VERIFICATION.md for the boundary between automated and manual evidence.

## Limitations

Demo identities can be impersonated; real-time synchronization and automatic merge are out of scope. A conflict preserves edits in the open page but requires manual copy/reopen. Unsaved drafts do not survive a forced close or crash. Markdown supports common headings, paragraphs, emphasis, lists, quotes, and code; HTML is literal, links become text, and tables/images are not rendered as rich objects. There is no sharing revocation, document version history, pagination, or undo for permanent deletion. The original computer-use attempt was blocked, but later isolated Playwright coverage passed for owner-only deletion. Six user-provided screenshots were inspected and packaged. Exhaustive automated toolbar and autosave-timing coverage is not claimed.

## Submission

See ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md, VIDEO_SCRIPT.md, VERIFICATION.md, and ASSESSMENT_RESPONSE.md. The final human-recorded walkthrough is linked above. The user reviews and submits the assessment; the portal has not been submitted automatically. AI_WORKFLOW.md is preserved as the original historical record, with later evidence in VERIFICATION.md and DELETE_VERIFICATION.md. `scripts/package-submission.ps1` creates an upload-ready `ajaia-submission` directory and source ZIP without secrets, dependencies, caches, or Git internals.

### Delete verification without deleting existing data

Start the app on port 3010, then run `npm run test:e2e`. Playwright uses installed Chrome with an isolated headless profile. Four tests intercept synthetic documents and delete requests; no database record is deleted. Set PLAYWRIGHT_BASE_URL to another origin. Set VERIFY_LIVE=1 to enable a fifth check: read Alice and Bob documents, open and cancel confirmation, verify shared editors lack Delete, and confirm all document IDs remain unchanged. The live check aborts all browser DELETE requests as an additional safeguard.
