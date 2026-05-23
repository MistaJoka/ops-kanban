'use client';

import { useEffect, useState } from 'react';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';

export function ChecklistTab({
  card,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [items, setItems] = useState(card.checklist);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setItems(card.checklist);
  }, [card.checklist]);

  const persist = (next: typeof items) => {
    setItems(next);
    void onPatch({ checklist: next });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No checklist items yet.</p>
      ) : (
        items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={item.done}
              disabled={saving}
              onChange={(event) => {
                persist(
                  items.map((entry) =>
                    entry.id === item.id ? { ...entry, done: event.target.checked } : entry,
                  ),
                );
              }}
            />
            <span className={item.done ? 'line-through text-[var(--text-secondary)]' : ''}>
              {item.text}
            </span>
          </label>
        ))
      )}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder="Add checklist item"
          className="field-input"
        />
        <button
          type="button"
          disabled={!newItem.trim() || saving}
          onClick={() => {
            persist([...items, { id: crypto.randomUUID(), text: newItem.trim(), done: false }]);
            setNewItem('');
          }}
          className="ops-btn-secondary shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}
