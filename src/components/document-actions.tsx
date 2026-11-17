"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis, FileText, Share2, Trash2 } from "lucide-react";
import type { Document, UserId } from "@/lib/domain";

type Props = {
  document: Document;
  user: UserId;
  disabled: boolean;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => Promise<void>;
};

export default function DocumentActions({
  document: doc,
  user,
  disabled,
  onOpen,
  onShare,
  onDelete,
}: Props) {
  const menu = useRef<HTMLDetailsElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const owner = doc.owner_id === user;

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        menu.current
      )
        menu.current.open = false;
    }
    window.document.addEventListener("pointerdown", closeOutside);
    return () =>
      window.document.removeEventListener("pointerdown", closeOutside);
  }, []);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }
  function requestDelete() {
    closeMenu();
    setError("");
    dialog.current?.showModal();
    cancel.current?.focus();
  }
  function closeDialog() {
    if (pending) return;
    dialog.current?.close();
    menu.current?.querySelector("summary")?.focus();
  }
  async function confirmDelete() {
    if (!owner || pending || disabled) return;
    setPending(true);
    setError("");
    try {
      await onDelete();
      dialog.current?.close();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not delete the document. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <details
        className="document-actions"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeMenu();
            menu.current?.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          aria-label={`Actions for ${doc.title}`}
          title="Document actions"
          aria-disabled={disabled}
          onClick={(event) => {
            if (disabled) event.preventDefault();
          }}
        >
          <Ellipsis size={20} />
        </summary>
        <div className="document-actions-panel">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              closeMenu();
              onOpen();
            }}
          >
            <FileText size={15} /> Open document
          </button>
          {owner && (
            <>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  closeMenu();
                  onShare();
                }}
              >
                <Share2 size={15} /> Share document
              </button>
              <button
                type="button"
                className="delete-action"
                disabled={disabled}
                onClick={requestDelete}
              >
                <Trash2 size={15} /> Delete document
              </button>
            </>
          )}
        </div>
      </details>
      {owner && (
        <dialog
          ref={dialog}
          className="delete-dialog"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
        >
          <span className="delete-dialog-icon">
            <Trash2 size={23} />
          </span>
          <h2 id={titleId}>Delete document?</h2>
          <p id={descriptionId}>
            Permanently delete <strong>“{doc.title}”</strong>? Collaborators
            will also lose access. This cannot be undone.
          </p>
          {error && (
            <p className="modal-error" role="alert">
              {error}
            </p>
          )}
          <div className="delete-dialog-actions">
            <button
              ref={cancel}
              type="button"
              className="secondary"
              disabled={pending}
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={pending || disabled}
              onClick={() => void confirmDelete()}
            >
              {pending ? "Deleting…" : "Delete document"}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
