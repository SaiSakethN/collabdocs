"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutGrid,
  LoaderCircle,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { USERS, type Document, type UserId } from "@/lib/domain";
import dynamic from "next/dynamic";
import Link from "next/link";
import DocumentActions from "./document-actions";
const DocumentEditor = dynamic(() => import("./document-editor"), {
  loading: () => <div className="empty">Opening your document…</div>,
});
export default function Workspace() {
  const [user, setUser] = useState<UserId>("alice");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [active, setActive] = useState<Document | null>(null);
  const [section, setSection] = useState<"all" | "mine" | "shared">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const [sharing, setSharing] = useState<Document | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const person = USERS.find((u) => u.id === user)!;
  const handleSaved = useCallback((doc: Document) => {
    setDocuments((ds) => ds.map((d) => (d.id === doc.id ? doc : d)));
    setActive(doc);
  }, []);
  const api = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...(init.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          "x-demo-user": user,
          ...init.headers,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed.");
      return result;
    },
    [user],
  );
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDocuments(await api("/api/documents"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    let cancelled = false;
    api("/api/documents")
      .then((result) => {
        if (!cancelled) setDocuments(result);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  function leave() {
    if (
      dirty &&
      !window.confirm("You have unsaved changes. Leave and discard them?")
    )
      return false;
    setActive(null);
    setDirty(false);
    return true;
  }
  async function create() {
    setBusy(true);
    setError("");
    try {
      setActive(
        await api("/api/documents", {
          method: "POST",
          body: JSON.stringify({ title: "Untitled document" }),
        }),
      );
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function open(doc: Document) {
    setBusy(true);
    try {
      setActive(await api(`/api/documents/${doc.id}`));
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      setActive(await api("/api/import", { method: "POST", body: form }));
      setImporting(false);
      setNotice("Document imported. Make it your own.");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function showSharing(doc: Document) {
    setSharing(doc);
    setShareLoading(true);
    setRecipients([]);
    setError("");
    try {
      setRecipients(await api(`/api/documents/${doc.id}/shares`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setShareLoading(false);
    }
  }
  async function share(recipient: string) {
    if (!sharing) return;
    setBusy(true);
    try {
      await api(`/api/documents/${sharing.id}/shares`, {
        method: "POST",
        body: JSON.stringify({ recipient }),
      });
      setRecipients((r) => [...r, recipient]);
      setNotice("Shared. Your teammate can now open and edit this document.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteDocument(doc: Document) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      setDocuments((current) => current.filter((item) => item.id !== doc.id));
      setNotice(`Deleted “${doc.title}”.`);
    } finally {
      setBusy(false);
    }
  }
  const owned = documents.filter((d) => d.owner_id === user);
  const shared = documents.filter((d) => d.owner_id !== user);
  const visible = (
    section === "mine" ? owned : section === "shared" ? shared : documents
  ).filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link
          href="/"
          className="brand"
          onClick={(e) => {
            if (active) {
              e.preventDefault();
              leave();
            }
          }}
        >
          <span className="brand-icon">
            <FileText size={23} />
          </span>
          CollabDocs<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          YOUR WORKSPACE <span>PERSONAL</span>
        </div>
        <nav aria-label="Document navigation">
          {(
            [
              {
                key: "all",
                name: "All documents",
                icon: LayoutGrid,
                count: documents.length,
              },
              {
                key: "mine",
                name: "My documents",
                icon: FolderOpen,
                count: owned.length,
              },
              {
                key: "shared",
                name: "Shared with me",
                icon: Users,
                count: shared.length,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              className={`nav-item ${section === item.key && !active ? "selected" : ""}`}
              onClick={() => {
                if (!active || leave()) setSection(item.key);
              }}
            >
              <item.icon size={18} />
              {item.name}
              <span>{item.count}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol">✦</span>
          <h3>Good ideas start here.</h3>
          <p>A little space to write, think, and build something together.</p>
          <button
            onClick={() => {
              if (!active || leave()) void create();
            }}
            disabled={busy}
          >
            Start a document <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="demo-info">
          <ShieldCheck size={16} />
          <span>
            DEMO MODE · Identity switching
            <br />
            <small>Demonstration without secure login.</small>
          </span>
        </div>
        <label className="user-picker">
          <span className={`avatar ${user}`}>{person.name[0]}</span>
          <span>
            <strong>{person.name}</strong>
            <small>{person.email}</small>
          </span>
          <ChevronDown size={16} />
          <select
            aria-label="DEMO MODE user switcher"
            disabled={busy}
            value={user}
            onChange={(e) => {
              if (!active || leave()) {
                setLoading(true);
                setError("");
                setDocuments([]);
                setUser(e.target.value as UserId);
                setSharing(null);
              }
            }}
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — DEMO MODE
              </option>
            ))}
          </select>
        </label>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>
              {active
                ? "Editor"
                : section === "shared"
                  ? "Shared with me"
                  : "Documents"}
            </strong>
          </span>
          <span className="topbar-right">
            <span className="status-dot" /> A space for your best ideas{" "}
            <span className={`avatar small ${user}`}>{person.name[0]}</span>
          </span>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {active ? (
          <DocumentEditor
            key={`${user}-${active.id}`}
            document={active}
            api={api}
            onDirty={setDirty}
            onBack={() => {
              if (leave()) void reload();
            }}
            onSaved={handleSaved}
            onShare={() => void showSharing(active)}
            user={user}
          />
        ) : (
          <div className="dashboard">
            <div className="heading-row">
              <div>
                <div className="eyebrow">
                  A LITTLE CLARITY. A LOT OF POSSIBILITY.
                </div>
                <h1>
                  {section === "shared"
                    ? "Better, together."
                    : section === "mine"
                      ? "Your words. Your space."
                      : "Your ideas, in good company."}
                </h1>
                <p>
                  Create a first draft. Bring a teammate. Make something great.
                </p>
              </div>
              <button
                className="primary"
                disabled={busy}
                onClick={() => void create()}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Plus size={18} />
                )}{" "}
                Create document
              </button>
            </div>
            <div className="welcome-card">
              <div>
                <span className="pill">ROOM TO THINK</span>
                <h2>
                  From a blank page
                  <br />
                  to your next big thing.
                </h2>
                <p>
                  Write freely. Keep everything in one place.
                  <br />
                  Invite someone to move the idea forward.
                </p>
                <button onClick={() => setImporting(true)}>
                  Bring your own words <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="paper-scene" aria-hidden="true">
                <div className="paper back-paper" />
                <div className="paper front-paper">
                  <div className="paper-tag">THE NEXT BIG IDEA</div>
                  <div className="paper-title">
                    It starts with
                    <br />a thought<span>.</span>
                  </div>
                  <i />
                  <i />
                  <i className="short" />
                  <div className="paper-avatars">
                    <b>A</b>
                    <b>B</b>
                    <span>Made better together</span>
                  </div>
                </div>
                <div className="floating-badge">
                  <Check size={14} /> All ideas welcome
                </div>
                <span className="sparkle">✦</span>
              </div>
            </div>
            <section className="documents-section">
              <div className="documents-heading">
                <div>
                  <h2>
                    {section === "mine"
                      ? "My documents"
                      : section === "shared"
                        ? "Shared with me"
                        : "All documents"}{" "}
                    <span>{visible.length}</span>
                  </h2>
                  <p>Your latest thinking, right where you left it.</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setImporting(true)}
                >
                  <Upload size={16} /> Import document
                </button>
              </div>
              <div className="filter-row">
                <div className="tabs" aria-label="Filter documents">
                  {(["all", "mine", "shared"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={section === tab ? "active" : ""}
                      onClick={() => setSection(tab)}
                    >
                      {tab === "all"
                        ? "All documents"
                        : tab === "mine"
                          ? "Owned by me"
                          : "Shared with me"}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search documents"
                    placeholder="Search documents…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {loading ? (
                <div className="empty">
                  <LoaderCircle className="spin" />
                  <h3>Gathering your documents…</h3>
                </div>
              ) : error && !documents.length ? (
                <div className="empty">
                  <ShieldCheck />
                  <h3>Let’s connect your workspace</h3>
                  <p>
                    Configure Supabase to create and save documents.
                    <br />
                    Setup instructions are in the project README.
                  </p>
                  <button className="secondary" onClick={() => void reload()}>
                    Retry connection
                  </button>
                </div>
              ) : !visible.length ? (
                <div className="empty">
                  <span className="empty-icon">
                    <FileText size={27} />
                  </span>
                  <h3>
                    {query
                      ? "No matching documents"
                      : section === "shared"
                        ? "Good work is better shared"
                        : "A fresh page is waiting"}
                  </h3>
                  <p>
                    {query
                      ? "Try a different search."
                      : section === "shared"
                        ? "Documents shared with you will appear here."
                        : "Create a document or import a file to get started."}
                  </p>
                  {!query && section !== "shared" && (
                    <button
                      className="primary"
                      onClick={() => void create()}
                      disabled={busy}
                    >
                      <Plus size={16} /> Create your first document
                    </button>
                  )}
                </div>
              ) : (
                <div className="document-grid">
                  {visible.map((doc) => (
                    <article className="document-card" key={doc.id}>
                      <DocumentActions
                        document={doc}
                        user={user}
                        disabled={busy}
                        onOpen={() => void open(doc)}
                        onShare={() => void showSharing(doc)}
                        onDelete={() => deleteDocument(doc)}
                      />
                      <button
                        className="document-open"
                        onClick={() => void open(doc)}
                        disabled={busy}
                      >
                        <div className="card-preview">
                          <FileText size={24} />
                          <span>
                            {doc.content.content
                              ?.flatMap(
                                (n) =>
                                  n.content?.map((c) => c.text ?? "") ?? [],
                              )
                              .join(" ")
                              .slice(0, 130) ||
                              "Every great idea starts with a first word."}
                          </span>
                        </div>
                        <h3>{doc.title}</h3>
                        <div className="card-meta">
                          <span className={`avatar tiny ${doc.owner_id}`}>
                            {doc.owner_id[0].toUpperCase()}
                          </span>
                          {USERS.find((u) => u.id === doc.owner_id)?.name}
                          <span
                            className={`ownership ${doc.owner_id !== user ? "shared" : ""}`}
                          >
                            {doc.owner_id === user
                              ? "Owned by you"
                              : "Shared with you"}
                          </span>
                        </div>
                      </button>
                      <div className="card-footer">
                        <time dateTime={doc.updated_at}>
                          Edited{" "}
                          {new Date(doc.updated_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </time>
                        {doc.owner_id === user && (
                          <button
                            aria-label={`Share ${doc.title}`}
                            onClick={() => void showSharing(doc)}
                          >
                            <Share2 size={15} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <footer className="dashboard-footer">
              <span>
                <FileText size={14} /> A home for every idea.
              </span>
              <span>CollabDocs · Write. Share. Move forward.</span>
            </footer>
          </div>
        )}
      </main>
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      {(importing || sharing) && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="modal"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const items = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
                  ),
                );
                const first = items[0],
                  last = items[items.length - 1];
                if (e.shiftKey && window.document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (
                  !e.shiftKey &&
                  window.document.activeElement === last
                ) {
                  e.preventDefault();
                  first?.focus();
                }
              }
              if (e.key === "Escape") {
                setImporting(false);
                setSharing(null);
              }
            }}
          >
            <button
              autoFocus
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => {
                setImporting(false);
                setSharing(null);
              }}
            >
              <X size={20} />
            </button>
            {importing ? (
              <>
                <span className="modal-icon">
                  <Upload />
                </span>
                <h2 id="dialog-title">Bring your words along.</h2>
                <p>Turn a text or Markdown file into an editable document.</p>
                <label className="upload-area">
                  <Upload size={30} />
                  <strong>
                    {busy ? "Importing…" : "Choose a file to import"}
                  </strong>
                  <span>.txt or .md · UTF-8 · up to 1 MB</span>
                  <input
                    ref={input}
                    disabled={busy}
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => void importFile(e.target.files?.[0])}
                  />
                </label>
              </>
            ) : (
              <>
                <span className="modal-icon">
                  <Users />
                </span>
                <h2 id="dialog-title">Make room for a teammate.</h2>
                <p>Share “{sharing?.title}”. Teammates can read and edit.</p>
                <div className="share-person">
                  <span className={`avatar ${user}`}>{person.name[0]}</span>
                  <div>
                    <strong>{person.name} (you)</strong>
                    <small>{person.email}</small>
                  </div>
                  <span>Owner</span>
                </div>
                {USERS.filter((u) => u.id !== user).map((u) => (
                  <div className="share-person" key={u.id}>
                    <span className={`avatar ${u.id}`}>{u.name[0]}</span>
                    <div>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </div>
                    <button
                      className={
                        recipients.includes(u.id) ? "secondary" : "primary"
                      }
                      disabled={
                        busy || shareLoading || recipients.includes(u.id)
                      }
                      onClick={() => void share(u.id)}
                    >
                      {shareLoading
                        ? "Loading…"
                        : recipients.includes(u.id)
                          ? "Editor ✓"
                          : "Share"}
                    </button>
                  </div>
                ))}
                <p className="modal-footnote">
                  Demo identities are publicly selectable. This demonstrates
                  sharing, not secure authentication.
                </p>
              </>
            )}
            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
