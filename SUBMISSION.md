# CollabDocs — Ajaia assessment

A focused workspace for writing, importing, saving, and sharing rich-text documents with a teammate.

## Links

- Live application: **PENDING — deployment not yet published**
- GitHub repository: **PENDING — repository creation/publication approval required**
- Walkthrough video: **PENDING — user will record and upload**
- Google Drive folder: **PENDING — upload/sharing approval required**

## Implemented

Responsive dashboard, search, owned/shared views, rich-text editor, renaming, JSON storage, debounced and manual saves, visible error status, unsaved warnings, version conflict detection, validated TXT/Markdown import, Supabase persistence, and owner/editor sharing. Server routes check demo identities, document access, recipients, and duplicate shares.

## Demo identities

Use the sidebar DEMO MODE switcher. Alice is alice@collabdocs.demo; Bob is bob@collabdocs.demo. There are no passwords. **This is publicly selectable demo identity, not secure authentication.** Use sample documents only.

## Local setup

Install Node 22 or 24. Run npm ci. Copy .env.example to .env.local and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run supabase/schema.sql in Supabase SQL Editor, then npm run dev. Open localhost:3000, or use an available port. Full instructions are in README.md.

## Validation

- PASS: 11 Vitest tests, ESLint, and production build.
- PASS: 15 integration checks against the actual local production API and Supabase.
- NOT TESTED: browser formatting interactions, autosave timing, responsive visual quality, and live deployment flows.
- Browser automation ended at its URL policy guard; no successful browser test or screenshot is claimed.

See VERIFICATION.md and verification-results.json for evidence and the manual checklist.

## Limitations and next improvements

Client-selected demo identities can be impersonated. Next steps are verified sessions and user-scoped database policies, browser regression coverage, recovery drafts, conflict resolution, pagination, and sharing revocation. Real-time collaboration, comments, history, and PDF export were intentionally omitted. No completed video, cloud folder, or public deployment is claimed until a verified link is added.

## Submitted files

The upload-ready directory contains source-code.zip, README.md, ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md, VERIFICATION.md, verification-results.json, ASSESSMENT_RESPONSE.md, VIDEO_SCRIPT.md, walkthrough-video.txt, live-product-url.txt, github-repository-url.txt, FILE_MANIFEST.txt, and screenshots/README.md.

The source ZIP includes application components, API routes, domain/import/database modules, SQL schema and seed records, tests, examples, verification and packaging scripts, .env.example, .gitignore, package.json, the dependency lockfile, Next/TypeScript/ESLint configuration, public assets, AGENTS.md, and submission documents. FILE_MANIFEST.txt lists every archived source file. Secrets, node_modules, .next, Git internals, and the submission directory itself are excluded.
