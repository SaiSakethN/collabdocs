// Exercises the real application API and database. Leaves clearly labeled demo documents.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const base = process.env.VERIFY_BASE_URL || "http://localhost:3002";
const results = [];
async function request(path, user, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(user ? { "x-demo-user": user } : {}),
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
  return { status: response.status, data: await response.json() };
}
function passed(name) {
  results.push({ name, status: "PASS" });
  console.log("PASS", name);
}
try {
  assert.equal((await fetch(base)).status, 200);
  passed("Homepage responds");
  assert.equal((await request("/api/documents")).status, 401);
  assert.equal((await request("/api/documents", "mallory")).status, 401);
  passed("Missing and invalid identities rejected");
  const created = await request("/api/documents", "alice", "POST", {
    title: "Verification — collaboration notes",
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  let doc = created.data;
  const path = `/api/documents/${doc.id}`;
  passed("Create document");
  assert.equal((await request(path, "bob")).status, 403);
  passed("Unshared document access rejected");
  assert.equal(
    (
      await request(path, "bob", "PATCH", {
        title: "Unauthorized",
        content: doc.content,
        version: doc.version,
      })
    ).status,
    403,
  );
  passed("Unshared edit rejected");
  const content = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Team notes" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Formatted and persisted",
            marks: [
              { type: "bold" },
              { type: "italic" },
              { type: "underline" },
            ],
          },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "One useful idea" }],
              },
            ],
          },
        ],
      },
    ],
  };
  const updated = await request(path, "alice", "PATCH", {
    title: "Verification — saved rich text",
    content,
    version: doc.version,
  });
  assert.equal(updated.status, 200);
  doc = updated.data;
  const reopened = await request(path, "alice");
  assert.equal(reopened.data.title, doc.title);
  assert.deepEqual(reopened.data.content, content);
  passed("Rename, save, reopen, and rich-text persistence");
  assert.equal(
    (
      await request(path, "alice", "PATCH", {
        title: "Stale overwrite",
        content,
        version: 1,
      })
    ).status,
    409,
  );
  passed("Stale updates rejected");
  assert.equal(
    (await request(path + "/shares", "alice", "POST", { recipient: "mallory" }))
      .status,
    400,
  );
  assert.equal(
    (await request(path + "/shares", "alice", "POST", { recipient: "alice" }))
      .status,
    400,
  );
  passed("Invalid recipient and self-share rejected");
  assert.equal(
    (await request(path + "/shares", "alice", "POST", { recipient: "bob" }))
      .status,
    201,
  );
  assert.equal(
    (await request(path + "/shares", "alice", "POST", { recipient: "bob" }))
      .status,
    409,
  );
  passed("Share and duplicate prevention");
  const bobList = await request("/api/documents", "bob");
  assert.ok(bobList.data.some((d) => d.id === doc.id));
  assert.equal((await request(path, "bob")).status, 200);
  passed("Recipient document listing and access");
  assert.equal(
    (await request(path + "/shares", "bob", "POST", { recipient: "alice" }))
      .status,
    403,
  );
  assert.equal((await request(path + "/shares", "bob")).status, 403);
  passed("Recipient cannot manage sharing");
  assert.equal(
    (
      await request(path, "bob", "PATCH", {
        title: "Verification — edited by Bob",
        content,
        version: doc.version,
      })
    ).status,
    200,
  );
  passed("Shared editor saves");
  for (const [name, text] of [
    ["Verification.txt", "A text import\nSecond paragraph"],
    [
      "Verification.md",
      "# Imported heading\n\n**Bold words**\n\n- A list item",
    ],
  ]) {
    const form = new FormData();
    form.set("file", new File([text], name, { type: "text/plain" }));
    const imported = await request("/api/import", "alice", "POST", form);
    assert.equal(imported.status, 201, JSON.stringify(imported.data));
    const again = await request("/api/documents/" + imported.data.id, "alice");
    assert.deepEqual(again.data.content, imported.data.content);
    passed(`${name} import persists`);
  }
  for (const [name, bytes, expected] of [
    ["bad.html", "<p>bad</p>", 400],
    ["empty.txt", " ", 400],
    ["large.txt", "x".repeat(1048577), 413],
  ]) {
    const form = new FormData();
    form.set("file", new File([bytes], name));
    assert.equal(
      (await request("/api/import", "alice", "POST", form)).status,
      expected,
    );
  }
  passed("Invalid extension, empty, and oversized imports rejected");
} catch (error) {
  results.push({ name: error.message, status: "FAIL" });
  console.error(error.message);
  process.exitCode = 1;
}
writeFileSync(
  "verification-results.json",
  JSON.stringify(
    { base, verifiedAt: new Date().toISOString(), results },
    null,
    2,
  ) + "\n",
);
