"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Share2,
  Check,
  LoaderCircle,
} from "lucide-react";
import { type Document, type UserId } from "@/lib/domain";
type Props = {
  document: Document;
  user: UserId;
  api: (url: string, init?: RequestInit) => Promise<Document>;
  onBack: () => void;
  onShare: () => void;
  onDirty: (dirty: boolean) => void;
  onSaved: (doc: Document) => void;
};
export default function DocumentEditor({
  document,
  user,
  api,
  onBack,
  onShare,
  onDirty,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(document.title);
  const [status, setStatus] = useState("Saved");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const version = useRef(document.version);
  const latestTitle = useRef(title);
  const changes = useRef(0);
  const saved = useRef(0);
  const saving = useRef(false);
  const conflicted = useRef(false);
  const markDirty = useCallback(() => {
    changes.current++;
    setRevision((r) => r + 1);
    setStatus("Unsaved changes");
    onDirty(true);
  }, [onDirty]);
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false })],
    content: document.content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: markDirty,
    editorProps: {
      attributes: {
        "aria-label": "Document content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });
  const persist = useCallback(async () => {
    if (
      !editor ||
      saving.current ||
      saved.current === changes.current ||
      conflicted.current
    )
      return;
    saving.current = true;
    const snapshot = changes.current;
    setStatus("Saving");
    setError("");
    try {
      const result = await api(`/api/documents/${document.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: latestTitle.current,
          content: editor.getJSON(),
          version: version.current,
        }),
      });
      version.current = result.version;
      saved.current = snapshot;
      onSaved(result);
      if (snapshot === changes.current) {
        setStatus("Saved");
        onDirty(false);
      } else {
        setStatus("Unsaved changes");
        setRevision((r) => r + 1);
      }
    } catch (e) {
      const message = (e as Error).message;
      conflicted.current = message.includes("Another editor");
      setError(message);
      setStatus("Error");
    } finally {
      saving.current = false;
    }
  }, [editor, api, document.id, onSaved, onDirty]);
  useEffect(() => {
    if (!revision) return;
    const timer = setTimeout(() => void persist(), 850);
    return () => clearTimeout(timer);
  }, [revision, persist]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (changes.current !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void persist();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persist]);
  const tools = [
    {
      label: "Bold",
      icon: Bold,
      active: editor?.isActive("bold"),
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor?.isActive("italic"),
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: Underline,
      active: editor?.isActive("underline"),
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor?.isActive("bulletList"),
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor?.isActive("orderedList"),
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Undo",
      icon: Undo2,
      run: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: Redo2,
      run: () => editor?.chain().focus().redo().run(),
    },
  ];
  return (
    <div className="editor-workspace">
      <div className="editor-heading">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> Documents
        </button>
        <div className="editor-actions">
          <span
            className={`save-status ${status === "Error" ? "save-error" : ""}`}
            role="status"
          >
            {status === "Saved" ? (
              <Check size={15} />
            ) : status === "Saving" ? (
              <LoaderCircle className="spin" size={15} />
            ) : null}
            {status}
          </span>
          <button
            className="secondary"
            onClick={() => void persist()}
            disabled={status === "Saving" || status === "Saved"}
          >
            Save now
          </button>
          {document.owner_id === user && (
            <button className="primary" onClick={onShare}>
              <Share2 size={16} /> Share
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error} Your edits remain on this page. Copy them before leaving.
        </div>
      )}
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <select
          aria-label="Heading style"
          value={
            editor?.isActive("heading", { level: 1 })
              ? "1"
              : editor?.isActive("heading", { level: 2 })
                ? "2"
                : editor?.isActive("heading", { level: 3 })
                  ? "3"
                  : "0"
          }
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level)
              editor
                ?.chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run();
            else editor?.chain().focus().setParagraph().run();
          }}
        >
          <option value="0">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <span className="toolbar-divider" />
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            aria-label={t.label}
            title={t.label}
            aria-pressed={t.active ?? false}
            className={t.active ? "active" : ""}
            onClick={t.run}
          >
            <t.icon size={18} />
          </button>
        ))}
      </div>
      <article className="editor-paper">
        <div className="editor-document-label">
          {document.owner_id === user
            ? "YOUR DOCUMENT"
            : "SHARED DOCUMENT · EDITOR ACCESS"}
        </div>
        <input
          className="document-title"
          aria-label="Document title"
          maxLength={160}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            latestTitle.current = e.target.value;
            markDirty();
          }}
        />
        <EditorContent editor={editor} />
      </article>
      <p className="editor-bottom">
        Changes save automatically · Ctrl / ⌘ + S to save · One idea at a time
      </p>
    </div>
  );
}
