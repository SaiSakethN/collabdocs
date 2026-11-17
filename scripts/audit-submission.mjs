// Read-only credential audit. Never prints secret values or matching text snippets.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";

const root = process.cwd();
const checkOnly = process.argv.includes("--check-only");
const sourceOnly = process.argv.includes("--source-only");
const values = [];
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!match || !/(KEY|TOKEN|SECRET|PASSWORD)/.test(match[1])) continue;
    const value = match[2].replace(/^['"]|['"]$/g, "");
    if (value.length >= 12 && !value.startsWith("YOUR_"))
      values.push(Buffer.from(value));
  }
}
const patterns =
  /sb_secret_[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/;
const findings = [];
function inspect(bytes, location) {
  if (
    values.some((value) => bytes.includes(value)) ||
    patterns.test(bytes.toString("utf8"))
  )
    findings.push(location);
}
const excluded =
  /(^|\/)(node_modules|\.next|\.git|\.vercel|ajaia-submission|coverage|test-results|playwright-report|\.cache|\.agents|\.codex|\.aws)(\/|$)|\.tsbuildinfo$|\.log$|\.(pem|key|pfx|p12|zip)$|(^|\/)(credentials|secrets)(\.|\/|$)/;
function forbidden(name) {
  return (
    excluded.test(name) || (/(^|\/)\.env/.test(name) && name !== ".env.example")
  );
}
const sourceFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((name) => !forbidden(name));
for (const name of sourceFiles)
  if (fs.existsSync(name)) inspect(fs.readFileSync(name), `source:${name}`);
const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/);
let historyBlobs = 0;
for (const object of objects) {
  const separator = object.indexOf(" ");
  const sha = separator === -1 ? object : object.slice(0, separator);
  if (
    execFileSync("git", ["cat-file", "-t", sha], {
      encoding: "utf8",
    }).trim() !== "blob"
  )
    continue;
  historyBlobs++;
  inspect(execFileSync("git", ["cat-file", "blob", sha]), `history:${sha}`);
}
let frontendFiles = 0;
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else {
      frontendFiles++;
      inspect(fs.readFileSync(file), `frontend:${path.relative(root, file)}`);
    }
  }
}
walk(".next/static");

let archiveEntries = 0;
let forbiddenArchiveEntries = 0;
if (!sourceOnly) {
  const zip = fs.readFileSync("ajaia-submission/source-code.zip");
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("ZIP end record missing");
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("Invalid ZIP directory");
    const method = zip.readUInt16LE(cursor + 10);
    const size = zip.readUInt32LE(cursor + 20);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    const local = zip.readUInt32LE(cursor + 42);
    const name = zip
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString("utf8")
      .replaceAll("\\", "/");
    archiveEntries++;
    if (forbidden(name)) {
      forbiddenArchiveEntries++;
      findings.push(`excluded-file-in-zip:${name}`);
    }
    const start =
      local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const compressed = zip.subarray(start, start + size);
    if (method !== 0 && method !== 8)
      throw new Error("Unsupported ZIP compression");
    inspect(
      method === 8 ? inflateRawSync(compressed) : compressed,
      `archive:${name}`,
    );
    cursor += 46 + nameLength + extraLength + commentLength;
  }
}
const result = {
  status: findings.length ? "FAIL" : "PASS",
  sourceFiles: sourceFiles.length,
  historyBlobs,
  frontendFiles,
  archiveEntries,
  forbiddenArchiveEntries,
  detectedLocations: findings,
};
if (!checkOnly) {
  const report = `# Final credential audit\n\nAudit date: November 17, 2026. No secret values or matched text snippets are printed.\n\n| Scope | Scanned | Detected credential matches |\n| --- | --- | --- |\n| Included source files | ${sourceFiles.length} | ${findings.filter((f) => f.startsWith("source:")).length} |\n| Git history blobs (all local refs) | ${historyBlobs} | ${findings.filter((f) => f.startsWith("history:")).length} |\n| Frontend build files | ${frontendFiles} | ${findings.filter((f) => f.startsWith("frontend:")).length} |\n| Source ZIP entries | ${sourceOnly ? "Pending archive rebuild" : archiveEntries} | ${sourceOnly ? "Not yet scanned" : findings.filter((f) => f.startsWith("archive:")).length} |\n\nForbidden archive entries: ${forbiddenArchiveEntries}. Status: **${result.status}**${sourceOnly ? " for source/history/frontend; archive check follows packaging" : ""}.\n\nThe audit compares locally configured secret values without displaying them and checks common Supabase, JWT, GitHub, and API-key patterns. .env.example contains names/placeholders only. Actual environment files, private-key files, credentials files, dependencies, build output, browser test artifacts, caches, and Git internals are excluded by the packaging script. AI_WORKFLOW.md is preserved unchanged.\n\nThe six supplied screenshots were visually inspected without a visible credential being found. This is not an exhaustive OCR or entropy-based security audit. The video was not watched end-to-end and is not covered by the screenshot review.\n\nEarlier confirmed exposure remains in the Codex conversation: the user pasted a key, and a shell tool call used it to write local configuration. The local environment file and Vercel server environment intentionally hold configuration. No claim is made that conversation history was erased or the key was rotated. Rotate it and update server configuration if that has not already been done. Earlier available deployment-log checks found no key pattern; retained runtime-log coverage was limited.\n\n${findings.length ? "Detected locations (values withheld):\n" + findings.map((f) => "- " + f).join("\n") : "No credential match was found in the audited source/history/frontend/archive scopes."}\n`;
  fs.writeFileSync("SECRET_AUDIT.md", report);
}
console.log(JSON.stringify(result));
if (findings.length) process.exitCode = 1;
