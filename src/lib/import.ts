import { Lexer, type Token, type Tokens } from "marked";
import { type RichNode, validateImport } from "./domain";
function inline(tokens: Token[] = []): RichNode[] {
  return tokens.flatMap((token): RichNode[] => {
    if (token.type === "strong" || token.type === "em" || token.type === "del")
      return inline(token.tokens).map((n) => ({
        ...n,
        marks: [
          ...(n.marks ?? []),
          {
            type:
              token.type === "strong"
                ? "bold"
                : token.type === "em"
                  ? "italic"
                  : "strike",
          },
        ],
      }));
    if (token.type === "br") return [{ type: "hardBreak" }];
    if (token.type === "link") return inline(token.tokens);
    if (token.type === "codespan")
      return [{ type: "text", text: token.text, marks: [{ type: "code" }] }];
    const text = "text" in token ? String(token.text) : token.raw;
    return text ? [{ type: "text", text }] : [];
  });
}
function blocks(tokens: Token[]): RichNode[] {
  return tokens.flatMap((token): RichNode[] => {
    if (token.type === "space") return [];
    if (token.type === "heading")
      return [
        {
          type: "heading",
          attrs: { level: token.depth },
          content: inline(token.tokens),
        },
      ];
    if (token.type === "list") {
      const list = token as Tokens.List;
      return [
        {
          type: list.ordered ? "orderedList" : "bulletList",
          ...(list.ordered ? { attrs: { start: list.start } } : {}),
          content: list.items.map((item) => ({
            type: "listItem",
            content: blocks(item.tokens),
          })),
        },
      ];
    }
    if (token.type === "blockquote")
      return [{ type: "blockquote", content: blocks(token.tokens ?? []) }];
    if (token.type === "code")
      return [
        {
          type: "codeBlock",
          content: token.text ? [{ type: "text", text: token.text }] : [],
        },
      ];
    if (token.type === "hr") return [{ type: "horizontalRule" }];
    if (token.type === "paragraph" || token.type === "text")
      return [
        {
          type: "paragraph",
          content: token.tokens
            ? inline(token.tokens)
            : [{ type: "text", text: token.text }],
        },
      ];
    // HTML, images and unsupported blocks become literal text; no HTML is injected.
    return [
      { type: "paragraph", content: [{ type: "text", text: token.raw }] },
    ];
  });
}
export function importContent(
  name: string,
  size: number,
  text: string,
): RichNode {
  validateImport(name, size, text);
  return {
    type: "doc",
    content: /\.md$/i.test(name)
      ? blocks(Lexer.lex(text))
      : text.split(/\r?\n/).map((line) => ({
          type: "paragraph",
          ...(line ? { content: [{ type: "text", text: line }] } : {}),
        })),
  };
}
