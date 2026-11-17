# CollabDocs - Ajaia assessment submission

CollabDocs is a lightweight workspace for creating, editing, importing, saving, sharing, and deleting rich-text documents.

## Final links

- Live application: https://collabdocs-ten-iota.vercel.app
- GitHub: https://github.com/SaiSakethN/collabdocs
- Submission folder: https://drive.google.com/drive/folders/1fFJWe1o6CcWE30YC5T1YsLHBpNgYN2Ir
- Final human-recorded walkthrough: https://drive.google.com/file/d/1bdiY5RR4Znl2j3Cx58X0S2Q2AsiLtpQN/view?usp=sharing
- Screenshots: https://drive.google.com/drive/folders/1wj_vQgtaIv6WjgEnfmU9TgKhCTzDI1vs

Folder permission metadata confirms Anyone with the link - Viewer. The video exists as Video presentation.mp4; a signed-out request returned HTTP 206 with video/mp4 bytes. The connector does not expose the video's exact permission list. Video content, duration, and complete playback have not been independently reviewed by Codex.

## Implemented features

- Responsive dashboard with search, owned/shared sections, owners, timestamps, and loading/empty/error states.
- Tiptap editing: title changes, bold, italic, underline, headings, lists, undo/redo, and JSON persistence.
- Debounced autosave, manual save, visible failures, unsaved-change warnings, and stale-write conflict detection.
- Safe UTF-8 TXT/Markdown import with a 1 MiB limit and server-side validation.
- Owner/editor sharing, validated recipients, duplicate prevention, and server-side permission checks.
- Owner-only Delete document at the top-right three-dot menu on each card. A named confirmation dialog warns that deletion is permanent. Shared editors do not see Delete. The server independently checks ownership and filters the database mutation by ID and owner; sharing rows cascade.
- Supabase PostgreSQL persistence across application deployments.

## Demo instructions

Choose Alice (alice@collabdocs.demo) or Bob (bob@collabdocs.demo) in the DEMO MODE sidebar switcher. No passwords are required. Product Launch Plan is an Alice-owned demonstration document. Alice can share documents; Bob can open/edit granted documents in Shared with me. Only the owner can delete.

**Demo identity switching is not secure authentication. Anyone can select either identity. Use sample content only.**

## Local setup

Use Node 22 or 24. Run npm ci. Copy .env.example to .env.local and configure SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY. Run supabase/schema.sql in Supabase SQL Editor (it includes the two demo identities); supabase/seed.sql is also supplied. Run npm run dev and open localhost:3000, or pass an available port. See README.md for full instructions.

## Actual verification

Final packaging checks on November 17, 2026:

- PASS: npm test - 17 tests in 2 files.
- PASS: npm run lint - exit code 0.
- PASS: npm run build - compiled, type-checked, and generated all routes.
- PASS: 5 Playwright checks against the live origin: four intercepted synthetic-data tests and one real-data read/cancel check. Real documents were not deleted.
- Prior PASS: 15 real API/Supabase integration checks, preserved in verification-results.json. These were not rerun during final packaging because they create demo records.
- Manual evidence: user-recorded final video and six uploaded screenshots; screenshot files were listed, downloaded into the local package, and visually inspected.

The automated browser suite focuses on the card menu, owner restriction, confirmation/cancellation, synthetic deletion, error handling, and unchanged real document IDs. It does not constitute exhaustive browser coverage of every formatting control or autosave timing. The human walkthrough is manual evidence, not a fabricated automated test result. See VERIFICATION.md and DELETE_VERIFICATION.md.

## AI workflow and limitations

AI_WORKFLOW.md is preserved byte-for-byte as the actual historical development record. Later owner-only deletion tests, screenshots, and final packaging results are recorded in VERIFICATION.md and DELETE_VERIFICATION.md rather than rewriting that history.

Demo identities are impersonable. Collaboration is asynchronous, with manual conflict recovery. There is no real-time synchronization, comments, history, sharing revocation, pagination, or PDF export. Permanent deletion has no undo. Next improvements would be verified sessions and user-scoped RLS, recovery drafts, conflict comparison, and broader browser regression coverage.

## Package contents

The local ajaia-submission directory and existing Drive folder contain source-code.zip, README.md, ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md, ASSESSMENT_RESPONSE.md, VERIFICATION.md, DELETE_VERIFICATION.md, SECRET_AUDIT.md, FINAL_CHECKS.json, verification-results.json, VIDEO_SCRIPT.md, DRIVE_UPLOAD.md, walkthrough-video.txt, live-product-url.txt, github-repository-url.txt, FILE_MANIFEST.txt, PACKAGE_SHA256.txt, and screenshots/.

The source ZIP includes source code, API routes, owner-only deletion, SQL schema/seeds, tests, examples, configuration, dependency lockfile, documentation, and screenshots. It excludes secrets, actual environment files, dependencies, build output, browser test artifacts, caches, and Git internals. The video is linked, not embedded in the source ZIP. No assessment portal submission has been made.
