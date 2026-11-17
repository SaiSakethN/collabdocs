# Actual AI workflow

## Tools used

OpenAI Codex assisted in the existing local repository using shell commands, file patches, connected GitHub/Vercel read tools, and attempted Windows/browser UI tools. No delegated agents were used. No other AI tools are claimed.

## Work accelerated

Codex read the supplied assessment brief, inspected the starter and installed Next.js documentation, then implemented the dashboard, Tiptap editor, server routes, Supabase SQL, import conversion, permission validation, tests, and submission documents. It created a script to exercise the actual API rather than equating a successful build with a working database.

## Decomposition and decisions

Work followed the brief's priority order: core persistence and editor, sharing/import, validation, deployment preparation, and documentation. Implementation decisions included server-only database credentials, a clearly labeled demo identity header, safe Markdown-to-JSON conversion, and conditional save versions. The existing application and dependencies were retained. No secure authentication or real-time collaboration was claimed.

## Review and corrections actually made

- Read the installed Next.js route-handler and forms guides before implementing server endpoints.
- Applied the React best-practices checklist after editing components.
- Corrected lint failures for an effect's synchronous updates and an internal HTML anchor.
- Corrected Windows text encoding after the production parser rejected a non-UTF-8 layout file.
- Corrected Markdown token TypeScript annotations found by the production build.
- Used Vitest 4 after the current Vitest release conflicted with the starter's Node 20 types.
- Added version checks and unsaved navigation warnings to reduce silent data loss.
- Formatted source for review with Prettier.
- Checked actual Tiptap schema serialization, discovered its numbered-list type attribute, and added a regression test before publication.
- Pushed the public GitHub repository and deployed to Vercel after explicit user approval. The live API verification suite passed all 15 checks.
- Vercel's default sign-in protection required a separate approval after automatic review rejected removing it under the general publication approval. It was disabled for this project only after the user specifically approved.

## Verification

See `VERIFICATION.md` and `verification-results.json` for the actual results. Unit tests, lint, and production build were run rather than assumed. Supabase connectivity was tested, and its initial missing-schema error was reported. The user subsequently confirmed running the schema. Browser automation was attempted but ended because the computer-use policy guard could not reliably identify Chrome's current URL; browser flows and screenshots must not be described as verified on that basis.

## Human involvement and independent judgment

The user supplied the product requirements, existing project, Supabase configuration, and confirmation that the SQL was run. The user retains final review, publishing approval, video recording, and assessment submission. No claim is made that the user has already independently reviewed every generated line. They should review the architecture and permission limitations and run the documented walkthrough before submission.
