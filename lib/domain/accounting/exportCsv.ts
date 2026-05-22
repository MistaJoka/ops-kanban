import type { SupabaseClient } from '@supabase/supabase-js';

import { getArRegister } from '@/lib/domain/accounting/getArRegister';
import { listAccountingTransactions } from '@/lib/domain/accounting/listTransactions';

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportAccountingCsv(
  client: SupabaseClient,
  organizationId: string,
  filter: { dateFrom?: string | null; dateTo?: string | null } = {},
): Promise<string> {
  const [transactions, arRows] = await Promise.all([
    listAccountingTransactions(client, organizationId, { ...filter, limit: 5000 }),
    getArRegister(client, organizationId),
  ]);

  const lines: string[] = [];

  lines.push('=== Income Ledger ===');
  lines.push('Date,Type,Amount,Customer,Job,Description');
  for (const row of transactions) {
    lines.push(
      [
        escapeCsv(row.occurredAt.slice(0, 10)),
        escapeCsv(row.entryType),
        escapeCsv(row.amount.toFixed(2)),
        escapeCsv(row.customerName),
        escapeCsv(row.cardTitle),
        escapeCsv(row.description),
      ].join(','),
    );
  }

  lines.push('');
  lines.push('=== AR Register ===');
  lines.push('Customer,Job,Balance Due,Total,Due Date,Aging Bucket,Status');
  for (const row of arRows) {
    lines.push(
      [
        escapeCsv(row.customerName),
        escapeCsv(row.cardTitle),
        escapeCsv(row.balanceDue.toFixed(2)),
        escapeCsv(row.total.toFixed(2)),
        escapeCsv(row.dueDate),
        escapeCsv(row.agingBucket),
        escapeCsv(row.status),
      ].join(','),
    );
  }

  return `${lines.join('\n')}\n`;
}
