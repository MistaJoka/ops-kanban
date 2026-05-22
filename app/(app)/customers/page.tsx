'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileText, Users } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  jobCount: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch('/api/customers');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to load customers.');
        setLoading(false);
        return;
      }
      setCustomers(payload.data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter((customer) => {
    if (!query.trim()) return true;
    const haystack = [customer.name, customer.email, customer.phone, customer.address]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <main className="ops-page-shell">
      <header>
        <h1 className="ops-page-title text-2xl">Customers</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Property owners linked to jobs on your board.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customers…"
        className="ops-control mt-6 w-full max-w-md"
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : filtered.length ? (
        <ul className="mt-6 space-y-2">
          {filtered.map((customer) => (
            <li key={customer.id} className="ops-list-row">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight text-[var(--text-primary)]">
                    {customer.name}
                  </p>
                  {customer.address ?? customer.email ?? customer.phone ? (
                    <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                      {customer.address ?? customer.email ?? customer.phone}
                    </p>
                  ) : null}
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Users className="size-3" strokeWidth={2} />
                    {customer.jobCount} job{customer.jobCount === 1 ? '' : 's'}
                  </p>
                </div>
                <Link
                  href={`/settings/contracts?customerId=${customer.id}`}
                  className="ops-link shrink-0"
                >
                  <FileText className="size-3.5" />
                  New contract
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ops-empty-state mt-8">
          No customers yet. Add property details on a job card to create one.
        </p>
      )}
    </main>
  );
}
