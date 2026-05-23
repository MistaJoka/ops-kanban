'use client';

import { useEffect, useRef, useState } from 'react';

import type { AttachmentView } from '@/lib/domain/documents/attachments';

export function FilesTab({
  cardId,
  canManage,
  onCopyPortalLink,
}: {
  cardId: string;
  canManage: boolean;
  onCopyPortalLink?: () => Promise<void>;
}) {
  const [attachments, setAttachments] = useState<AttachmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copyingPortal, setCopyingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const response = await fetch(`/api/cards/${cardId}/attachments`);
    const payload = await response.json();
    if (payload.data) {
      setAttachments(payload.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [cardId]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/cards/${cardId}/attachments`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Upload failed.');
      }
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (attachmentId: string) => {
    setError(null);
    const response = await fetch(
      `/api/cards/${cardId}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
      { method: 'DELETE' },
    );
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? 'Delete failed.');
      return;
    }
    await load();
  };

  const copyPortalLink = async () => {
    if (!onCopyPortalLink) return;
    setCopyingPortal(true);
    setError(null);
    try {
      await onCopyPortalLink();
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Failed to copy portal link.');
    } finally {
      setCopyingPortal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Files & signatures</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Photos, permits, and signed estimate documents. Customers approve estimates via the portal
          link (native e-sign with name + IP audit).
        </p>
      </div>

      {canManage && onCopyPortalLink ? (
        <button
          type="button"
          disabled={copyingPortal}
          onClick={() => void copyPortalLink()}
          className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)] disabled:opacity-60"
        >
          {copyingPortal ? 'Copying…' : 'Copy portal link for estimate approval'}
        </button>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading files…</p>
      ) : attachments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--topbar-border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No files yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--topbar-border)] px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                {attachment.downloadUrl ? (
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-[var(--accent)] underline"
                  >
                    {attachment.filename}
                  </a>
                ) : (
                  <span className="truncate font-medium">{attachment.filename}</span>
                )}
                <p className="text-xs text-[var(--text-secondary)]">
                  {(attachment.sizeBytes / 1024).toFixed(1)} KB ·{' '}
                  {new Date(attachment.createdAt).toLocaleString()}
                </p>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => void remove(attachment.id)}
                  className="rounded-lg border border-[var(--topbar-border)] px-2 py-1 text-xs"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[var(--urgent)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
