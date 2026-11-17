import { describe, expect, it } from "vitest";
import {
  canEdit,
  identity,
  validateShare,
  validateImport,
  validateContent,
  titleOf,
  emptyContent,
} from "../src/lib/domain";
import { importContent } from "../src/lib/import";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
describe("document permissions", () => {
  it("allows the owner and explicitly shared editors only", () => {
    expect(canEdit("alice", "alice", [])).toBe(true);
    expect(canEdit("alice", "bob", [])).toBe(false);
    expect(canEdit("alice", "bob", ["bob"])).toBe(true);
  });
  it("rejects missing and forged demo identities", () => {
    expect(() => identity(null)).toThrow();
    expect(() => identity("mallory")).toThrow();
    expect(identity("alice")).toBe("alice");
  });
});
describe("sharing validation", () => {
  it("allows owners to grant editor access", () =>
    expect(() => validateShare("alice", "alice", "bob", [])).not.toThrow());
  it("rejects non-owner sharing", () =>
    expect(() => validateShare("alice", "bob", "alice", [])).toThrow(
      "Only the owner",
    ));
  it("rejects duplicates, self-sharing, and unknown recipients", () => {
    expect(() => validateShare("alice", "alice", "bob", ["bob"])).toThrow(
      "already shared",
    );
    expect(() => validateShare("alice", "alice", "alice", [])).toThrow(
      "already own",
    );
    expect(() => validateShare("alice", "alice", "mallory", [])).toThrow(
      "valid recipient",
    );
  });
});
describe("file import", () => {
  it("allows text and Markdown case-insensitively", () => {
    expect(() => validateImport("notes.TXT", 4, "text")).not.toThrow();
    expect(() => validateImport("notes.md", 4, "text")).not.toThrow();
  });
  it("rejects unsupported, empty, oversized and binary files", () => {
    expect(() => validateImport("x.html", 1, "x")).toThrow("Supported");
    expect(() => validateImport("x.txt", 2, "  ")).toThrow("empty");
    expect(() => validateImport("x.txt", 1048577, "text")).toThrow("1 MB");
    expect(() => validateImport("x.txt", 2, "a\0")).toThrow("UTF-8");
  });
  it("preserves paragraphs and Markdown marks and lists", () => {
    expect(importContent("x.txt", 3, "a\nb").content).toHaveLength(2);
    const doc = importContent(
      "x.md",
      40,
      "# Heading\n\n**Bold** and *italic*\n\n- Item",
    );
    expect(doc.content?.[0].type).toBe("heading");
    expect(doc.content?.[1].content?.[0].marks).toEqual([{ type: "bold" }]);
    expect(doc.content?.[2].type).toBe("bulletList");
    expect(() => validateContent(doc)).not.toThrow();
  });
  it("keeps untrusted HTML as literal text with no executable nodes", () => {
    const doc = importContent("x.md", 50, "<script>alert(1)</script>");
    expect(doc.content?.[0].content?.[0]).toEqual({
      type: "text",
      text: "<script>alert(1)</script>",
    });
    expect(() => validateContent(doc)).not.toThrow();
  });
});
describe("document validation", () => {
  it("accepts actual Tiptap numbered-list serialization", () => {
    const schema = getSchema([StarterKit.configure({ link: false })]);
    const node = schema.nodeFromJSON(
      importContent("list.md", 20, "1. First\n2. Second"),
    );
    node.check();
    expect(node.toJSON().content[0].attrs).toEqual({ start: 1, type: null });
    expect(() => validateContent(node.toJSON())).not.toThrow();
  });
  it("validates titles and rich-text structure", () => {
    expect(titleOf("  Draft  ")).toBe("Draft");
    expect(() => titleOf("")).toThrow();
    expect(() => titleOf("a".repeat(161))).toThrow();
    expect(validateContent(emptyContent)).toEqual(emptyContent);
    expect(() => validateContent({ type: "iframe" })).toThrow();
    expect(() =>
      validateContent({
        type: "doc",
        content: [{ type: "text", text: "x", marks: [{ type: "link" }] }],
      }),
    ).toThrow();
  });
});
