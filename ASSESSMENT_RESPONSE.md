# CollabDocs

A document workspace built for the Ajaia assessment, with rich-text editing, persistent saving, safe file import, sharing, and owner-only deletion.

## Deliverables

- **Live app:** https://collabdocs-ten-iota.vercel.app
- **GitHub:** https://github.com/SaiSakethN/collabdocs
- **Google Drive package:** https://drive.google.com/drive/folders/1fFJWe1o6CcWE30YC5T1YsLHBpNgYN2Ir
- **Final video:** https://drive.google.com/file/d/1bdiY5RR4Znl2j3Cx58X0S2Q2AsiLtpQN/view?usp=sharing
- **Screenshots:** https://drive.google.com/drive/folders/1wj_vQgtaIv6WjgEnfmU9TgKhCTzDI1vs

The submission folder has Anyone with the link - Viewer permission. Signed-out video access returned HTTP 206 and video/mp4 content; the connector did not expose the exact video permission list. The human-recorded walkthrough is supplied; its duration/content were not independently reviewed by Codex.

## Demo identities

Use the sidebar DEMO MODE switcher: Alice (alice@collabdocs.demo) or Bob (bob@collabdocs.demo). No passwords are required. Open Product Launch Plan as Alice, or choose Bob and Shared with me to inspect granted documents.

**Demo identity switching is not secure authentication. Anyone can select either identity; use sample content only.**

## Implemented features

- Dashboard search, owned/shared views, owners, modification dates, and loading/empty/error states.
- Tiptap editing, renaming, bold/italic/underline, headings, lists, and structured JSON storage.
- Debounced autosave, explicit save, visible failures, unsaved warnings, and version conflict detection.
- TXT/Markdown import with UTF-8, extension, size, and emptiness validation; no untrusted HTML injection.
- Owner/editor sharing with recipient validation, duplicate prevention, and server-side checks.
- **Delete Document:** top-right three-dot menu on each card, visible Delete action for owners only, explicit permanent-deletion confirmation, and server-side ownership enforcement. Failed requests retain the card; deletion also removes sharing rows. Shared editors cannot delete.
- Durable Supabase PostgreSQL storage across deployments.

## Engineering decisions

One existing Next.js App Router application uses TypeScript, React, Tiptap, Lucide, Tailwind/custom CSS, and Supabase. Server routes validate input and enforce the documented demo permission model. A server-only database client keeps credentials out of frontend code. PostgreSQL stores JSONB content, owners, versions, and unique sharing records. Conditional version updates reject stale saves. Markdown tokens become supported rich-text nodes rather than arbitrary HTML.

## Setup

1. Install Node 22 or 24 and run npm ci.
2. Copy .env.example to .env.local; configure SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY.
3. Run supabase/schema.sql in Supabase SQL Editor; identities are seeded there, with supabase/seed.sql also supplied.
4. Run npm run dev and open localhost:3000 (or pass an available port).
5. Run npm test, npm run lint, and npm run build. For browser checks, start production on port 3010 and run npm run test:e2e. See README.md for live-test environment variables.

## Actual checks and manual evidence

Final checks on November 17, 2026: **17 Vitest tests passed; lint passed; production build passed; all 5 Playwright checks passed against the public application.** Four browser checks use intercepted synthetic data; the real-data test opens/cancels confirmation, checks shared-user restrictions, and confirms document IDs remain unchanged. No existing production document was deleted during testing.

The earlier 15 real API/Supabase integration checks passed and are preserved in verification-results.json; they were not rerun during final packaging. Six user-uploaded screenshots were inspected. The linked manual video walkthrough is supplied as human presentation evidence, not an assertion that every browser edge case was independently tested. Automated toolbar interactions and autosave timing do not have exhaustive browser coverage.

The final source/history/archive audit is recorded in SECRET_AUDIT.md; no credential values are printed. AI_WORKFLOW.md is preserved as the truthful historical record. VERIFICATION.md and DELETE_VERIFICATION.md describe later validation.

## AI workflow

Codex accelerated implementation, test cases, troubleshooting, documentation, and packaging. It read installed Next.js guides, corrected issues found by actual lint/type/build runs, and tested the owner-only delete flow with mocked database mutations and an isolated browser. The user supplied requirements, configuration, manual screenshots, and the final recorded walkthrough, and retains final review and submission responsibility.

## Limitations and next improvements

Demo identities are client-selected and impersonable. Editing is asynchronous; conflict recovery is manual and unsaved drafts are in memory. No real-time synchronization, comments, history, sharing revocation, pagination, PDF export, or deletion undo is claimed. Next work: verified sessions/user-scoped RLS, recovery drafts, conflict comparison, and broader browser coverage.

## Handoff

The Drive package includes the clean source ZIP, setup guide, architecture, preserved AI workflow, actual verification evidence, screenshots, final video link, and checksum. Before submitting, play the video from a signed-out browser and confirm its duration meets the assessment's 3-5 minute requirement. Review this Markdown and submit it with the video URL yourself. The assessment portal has not been submitted automatically.
