export const USERS = [
  { id: "alice", name: "Alice", email: "alice@collabdocs.demo" },
  { id: "bob", name: "Bob", email: "bob@collabdocs.demo" },
] as const;
export type UserId = (typeof USERS)[number]["id"];
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
  content?: RichNode[];
};
export type Document = {
  id: string;
  title: string;
  owner_id: UserId;
  content: RichNode;
  updated_at: string;
  created_at: string;
  version: number;
};
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function identity(value: string | null): UserId {
  if (!USERS.some((u) => u.id === value))
    throw new AppError("Select a valid demo identity.", 401);
  return value as UserId;
}
export function canEdit(owner: string, user: string, recipients: string[]) {
  return owner === user || recipients.includes(user);
}
export function validateShare(
  owner: string,
  actor: string,
  recipient: unknown,
  existing: string[],
) {
  if (owner !== actor)
    throw new AppError("Only the owner can manage sharing.", 403);
  if (typeof recipient !== "string" || !USERS.some((u) => u.id === recipient))
    throw new AppError("Choose a valid recipient.");
  if (owner === recipient) throw new AppError("You already own this document.");
  if (existing.includes(recipient))
    throw new AppError(
      "This document is already shared with that person.",
      409,
    );
}
export function titleOf(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 160)
    throw new AppError("Title must contain 1–160 characters.");
  return value.trim();
}
export const emptyContent: RichNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
export function validateContent(value: unknown): RichNode {
  if (!value || typeof value !== "object")
    throw new AppError("Invalid document structure.");
  const allowed = new Set([
    "doc",
    "paragraph",
    "text",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "codeBlock",
    "hardBreak",
    "horizontalRule",
  ]);
  let count = 0;
  function walk(v: unknown, depth: number): void {
    if (++count > 50000 || depth > 30 || !v || typeof v !== "object")
      throw new AppError("Invalid document structure.");
    const n = v as RichNode;
    if (
      !allowed.has(n.type) ||
      (n.text !== undefined && typeof n.text !== "string")
    )
      throw new AppError("Unsupported document content.");
    if (
      n.marks &&
      (!Array.isArray(n.marks) ||
        n.marks.some(
          (m) =>
            !m ||
            typeof m !== "object" ||
            !["bold", "italic", "underline", "strike", "code"].includes(m.type),
        ))
    )
      throw new AppError("Unsupported formatting.");
    if (
      n.attrs &&
      (typeof n.attrs !== "object" ||
        Object.keys(n.attrs).some(
          (k) => !["level", "start", "language"].includes(k),
        ))
    )
      throw new AppError("Unsupported attributes.");
    if (
      n.type === "heading" &&
      ![1, 2, 3, 4, 5, 6].includes(Number(n.attrs?.level))
    )
      throw new AppError("Invalid heading.");
    if (n.content) {
      if (!Array.isArray(n.content)) throw new AppError("Invalid content.");
      n.content.forEach((c) => walk(c, depth + 1));
    }
  }
  if (JSON.stringify(value).length > 2_000_000)
    throw new AppError("Document is too large.", 413);
  walk(value, 0);
  if ((value as RichNode).type !== "doc")
    throw new AppError("Expected a rich-text document.");
  return value as RichNode;
}
export function validateImport(name: string, size: number, text: string) {
  if (!/\.(txt|md)$/i.test(name))
    throw new AppError("Supported file types: .txt and .md.");
  if (size > 1024 * 1024) throw new AppError("Maximum file size is 1 MB.", 413);
  if (!text.trim()) throw new AppError("The file is empty.");
  if (text.includes("\u0000") || text.includes("\ufffd"))
    throw new AppError("Use a readable UTF-8 text file.");
}
