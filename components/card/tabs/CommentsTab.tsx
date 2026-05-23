'use client';

import type { CardCommentView } from '@/lib/domain/cards/cardDetail';

export function CommentsTab({
  comments,
  draft,
  onDraftChange,
  onSubmit,
  saving,
}: {
  comments: CardCommentView[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="ops-section-card bg-[var(--surface-rail)] p-3">
              <p className="text-sm text-[var(--text-primary)]">{comment.body}</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {comment.authorName ?? 'Team'} · {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        rows={3}
        placeholder="Add a comment…"
        className="field-input"
      />
      <button
        type="button"
        disabled={saving || !draft.trim()}
        onClick={() => void onSubmit()}
        className="ops-btn-primary"
      >
        Post comment
      </button>
    </div>
  );
}
