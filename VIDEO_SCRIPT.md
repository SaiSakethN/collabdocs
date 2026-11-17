# CollabDocs walkthrough — approximately 4 minutes

Record only after completing the live manual checklist. Do not describe pending deployment or browser behavior as verified. Replace or omit any demonstration that fails in the recording environment.

## 0:00–0:30 — Introduction

“Hi, I'm Sai Saketh. This is CollabDocs, a small workspace for creating documents and sharing them with a teammate. I focused on the complete writing workflow: create, format, save, reopen, import, and share. This assessment uses Alice and Bob as demonstration identities. The switcher is labeled demo mode; it is not a secure login.”

## 0:30–1:45 — Writing workflow

Show the dashboard and choose Create document. Rename it to Launch notes. Type a short paragraph, select a phrase, and apply bold, italic, and underline. Add a heading and a bulleted or numbered list.

“The editor uses Tiptap, and the database stores its structured JSON so formatting survives reopening. Saving is debounced, with visible save status. There is also an explicit Save now action and a keyboard shortcut.”

Wait for Saved. Return to the dashboard, search for Launch notes, reopen it, and refresh. Point to retained formatting. If this has not been verified, complete the check before recording this claim.

## 1:45–2:30 — Import and sharing

Import `examples/team-notes.md`. Show its heading and list. Open Share and grant Bob editor access. Switch to Bob, select Shared with me, open the document, and add a sentence. Wait for Saved.

“Owners manage sharing. Recipients can edit but cannot change sharing permissions. Duplicate shares and unknown recipients are rejected. The API checks access on the server, within the documented demo identity model.”

## 2:30–3:15 — Architecture

Show the architecture diagram and SQL briefly.

“This is one Next.js App Router application. Route handlers validate input and check ownership or a share before using a server-only Supabase client. PostgreSQL stores documents and sharing records across deployments. Uploads are limited to UTF-8 text and Markdown under one megabyte. Markdown is converted to supported rich-text nodes, and raw HTML is displayed as literal text.”

“Save requests include a document version. A stale write receives a conflict rather than silently replacing someone else's newer changes.”

## 3:15–3:45 — AI workflow

“I used Codex to accelerate implementation, test cases, and documentation. The workflow included reading the installed Next.js guides and running tests, lint, and a production build. Those checks caught concrete issues including TypeScript token types and a Windows encoding problem, which were fixed. The workflow note distinguishes automated results from checks that still need manual review.”

Show the actual current verification report. Mention API checks only if the report records successful execution.

## 3:45–4:15 — Tradeoffs

“I prioritized a durable writing and sharing workflow over real-time editing, comments, and version history. The main limitation is demo authentication: anyone can choose either identity. My next steps would be verified sessions and per-user database policies, browser regression tests, and recovery and conflict resolution. Thanks for taking a look.”

The user records and uploads the video. Add the real public link to walkthrough-video.txt, SUBMISSION.md, and ASSESSMENT_RESPONSE.md afterwards.
