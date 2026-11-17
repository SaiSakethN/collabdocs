# Owner-only document deletion

## Change

The previously deployed dashboard had 11 document cards, zero three-dot menus, and zero Delete buttons when inspected in an isolated browser. Each card now has a visible three-dot control in its top-right corner. Open it and choose **Delete document** (owners only). A modal names the document, explains permanent removal and collaborator access loss, focuses **Cancel**, and requires explicit confirmation. Cancel and Escape leave the document untouched. Failures keep the card visible and display an error.

The DELETE route validates the demo identity, checks access and ownership, and scopes the database mutation by both ID and owner. Foreign-key cascade removes sharing records. Shared editors cannot delete. The existing demo identity model remains impersonable; this change does not introduce secure authentication.

## Executed local checks

- PASS: 17 Vitest tests, including six mocked DELETE-handler tests (owner, shared editor, unknown identity, access denial, missing record, database failure).
- PASS: ESLint.
- PASS: Next.js production build.
- PASS: four isolated Chrome UI tests covering menu visibility, owner restriction, cancellation without a request, successful synthetic deletion, and failed deletion preserving the card.

No existing document was deleted in these tests. Unit tests mock the database. Browser mutation tests intercept synthetic documents and requests; they do not reach Supabase.

## Production verification

Pending deployment of this change. The opt-in live browser test opens and cancels confirmation, verifies Bob lacks Delete on Alice-owned shared documents, compares Alice's document IDs before and after, and blocks all browser DELETE requests. It does not perform a real deletion.

Run against the public deployment with PLAYWRIGHT_BASE_URL=https://collabdocs-ten-iota.vercel.app and VERIFY_LIVE=1, then `npm run test:e2e`.
