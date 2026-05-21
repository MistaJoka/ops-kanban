'use client';

import { useState } from 'react';

type Props = {
  context: {
    page: string;
    organizationId: string;
    userId: string;
    role: string;
    selectedCardId?: string;
    selectedCustomerId?: string;
  };
};

export function AiCommandBar({ context }: Props) {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitCommand() {
    if (!command.trim()) return;
    setLoading(true);
    setResponse('');

    const res = await fetch('/api/ai/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, context }),
    });

    const data = await res.json();
    setResponse(data.message ?? data.error ?? 'No response.');
    setLoading(false);
  }

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Ask AI to update, summarize, analyze, or prepare work..."
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitCommand();
          }}
        />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={submitCommand} disabled={loading}>
          {loading ? 'Thinking...' : 'Run'}
        </button>
      </div>
      {response ? <pre className="whitespace-pre-wrap text-xs">{response}</pre> : null}
    </div>
  );
}
