'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { CustomerCreateModal } from '@/components/pipeline/CustomerCreateModal';
import {
  canCreateCard,
  canManageMoney,
  type OrgRole,
} from '@/lib/domain/auth/roles';
import { cn } from '@/lib/utils';

type CreateMenuItem = {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void | Promise<void>;
};

type CreateMenuSection = {
  label: string;
  items: CreateMenuItem[];
};

export function CreateMenu({
  role,
  onCreateJob,
  disabled = false,
  className,
}: {
  role: OrgRole;
  onCreateJob: (columnId?: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerPending, setCustomerPending] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const sections = useMemo(() => {
    const next: CreateMenuSection[] = [];

    if (canCreateCard(role)) {
      next.push({
        label: 'Jobs',
        items: [
          {
            id: 'job',
            label: 'New job',
            description: 'Add to inquiry column',
            onSelect: () => onCreateJob(),
          },
          {
            id: 'customer',
            label: 'New customer',
            description: 'Property owner record',
            onSelect: () => {
              setCustomerError(null);
              setCustomerModalOpen(true);
            },
          },
        ],
      });
    }

    if (canManageMoney(role)) {
      next.push({
        label: 'Setup',
        items: [
          {
            id: 'automation',
            label: 'Automation',
            description: 'Column or payment trigger',
            onSelect: () => router.push('/settings/automations'),
          },
          {
            id: 'template',
            label: 'Message template',
            description: 'SMS or email copy',
            onSelect: () => router.push('/settings/templates'),
          },
          {
            id: 'contract',
            label: 'Recurring contract',
            description: 'Scheduled repeat jobs',
            onSelect: () => router.push('/settings/contracts'),
          },
        ],
      });
    }

    return next;
  }, [onCreateJob, role, router]);

  const itemCount = sections.reduce((count, section) => count + section.items.length, 0);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  if (itemCount === 0) {
    return null;
  }

  const runItem = async (item: CreateMenuItem) => {
    setOpen(false);
    if (item.id === 'customer') {
      await item.onSelect();
      return;
    }

    setPending(true);
    try {
      await item.onSelect();
    } finally {
      setPending(false);
    }
  };

  const createCustomer = async (values: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }) => {
    setCustomerPending(true);
    setCustomerError(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          notes: values.notes || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create customer.');
      }

      setCustomerModalOpen(false);
      router.push('/customers');
    } catch (createError) {
      setCustomerError(
        createError instanceof Error ? createError.message : 'Failed to create customer.',
      );
    } finally {
      setCustomerPending(false);
    }
  };

  return (
    <div ref={rootRef} className={cn('ops-dropdown', className)}>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setOpen((value) => !value)}
        className="ops-btn-primary flex size-9 shrink-0 items-center justify-center px-0"
        aria-label="Create"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Create"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div role="menu" className="ops-menu right-0 min-w-[220px]">
          {sections.map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 ? (
                <div
                  className="my-1 border-t"
                  style={{ borderColor: 'var(--topbar-border)' }}
                  aria-hidden
                />
              ) : null}
              <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {section.label}
              </p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => void runItem(item)}
                  className="ops-menu-item"
                >
                  <span className="block font-medium">{item.label}</span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
                      {item.description}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
          <div
            className="my-1 border-t"
            style={{ borderColor: 'var(--topbar-border)' }}
            aria-hidden
          />
          <Link
            href="/support/help"
            role="menuitem"
            className="ops-menu-item block text-xs text-[var(--text-tertiary)]"
            onClick={() => setOpen(false)}
          >
            Estimates, invoices, and files are created inside a job.
          </Link>
        </div>
      ) : null}

      {customerModalOpen ? (
        <CustomerCreateModal
          pending={customerPending}
          error={customerError}
          onClose={() => {
            if (!customerPending) {
              setCustomerModalOpen(false);
              setCustomerError(null);
            }
          }}
          onSubmit={createCustomer}
        />
      ) : null}
    </div>
  );
}
