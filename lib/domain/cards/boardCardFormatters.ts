export function truncateText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function formatMoneyCompact(amount: number | null | undefined): string | null {
  if (amount == null || amount <= 0) {
    return null;
  }

  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions >= 10 ? Math.round(millions) : Number(millions.toFixed(1));
    return `$${formatted}M`;
  }

  if (amount >= 10_000) {
    return `$${Math.round(amount / 1000)}k`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatScheduleShortDate(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatScheduleLabel(scheduledStart: string, now = new Date()): string {
  const scheduled = new Date(scheduledStart);
  const dayDiff = Math.round(
    (startOfLocalDay(scheduled).getTime() - startOfLocalDay(now).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return 'Today';
  }

  if (dayDiff === 1) {
    return 'Tomorrow';
  }

  return formatScheduleShortDate(scheduled);
}

export function formatDueLabel(dueDate: string, now = new Date()): string {
  const due = new Date(dueDate);
  const dayDiff = Math.round(
    (startOfLocalDay(due).getTime() - startOfLocalDay(now).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff < 0) {
    return 'Overdue';
  }

  if (dayDiff === 0) {
    return 'Due today';
  }

  if (dayDiff === 1) {
    return 'Due tomorrow';
  }

  return `Due ${formatScheduleShortDate(due)}`;
}

export function isDueSoon(dueDate: string, now = new Date(), withinDays = 3): boolean {
  const due = startOfLocalDay(new Date(dueDate));
  const today = startOfLocalDay(now);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= withinDays;
}

export function getAssigneeInitials(name: string | null | undefined): string | null {
  if (!name?.trim()) {
    return null;
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function formatPropertyLineWithoutJobType(
  customerAddress: string | null | undefined,
  customerName: string | null | undefined,
  max = 32,
): string | null {
  const property = customerAddress ?? customerName ?? null;
  if (!property) {
    return null;
  }

  return truncateText(property, max);
}

const JOB_TYPE_PROPERTY_LABEL: Record<string, string> = {
  maintenance: 'maintenance',
  install: 'install',
  hardscape: 'hardscape',
  cleanup: 'cleanup',
  irrigation: 'irrigation',
  other: 'other',
};

export function formatJobTypeForProperty(jobType: string | null | undefined): string | null {
  if (!jobType?.trim()) {
    return null;
  }

  return JOB_TYPE_PROPERTY_LABEL[jobType] ?? jobType.replace(/_/g, ' ');
}

export function formatBoardCardPropertyLine(
  customerAddress: string | null | undefined,
  customerName: string | null | undefined,
  jobType: string | null | undefined,
  max = 36,
): string | null {
  const property = formatPropertyLineWithoutJobType(customerAddress, customerName, max);
  const jobLabel = formatJobTypeForProperty(jobType);

  if (property && jobLabel) {
    return truncateText(`${property} · ${jobLabel}`, max);
  }

  return property ?? jobLabel;
}
