import {
  getUnpaidInvoicesList,
} from '@/lib/domain/customers/customerHistory';
import { listOrgMembers } from '@/lib/domain/organization/listMembers';
import { getReportsSummary } from '@/lib/domain/reports/getReports';
import { searchMembersByQuery } from '@/lib/ai/member-resolver';

import { type ToolHandler } from './toolHelpers';

export const reportToolHandlers: Record<string, ToolHandler> = {
  getUnpaidInvoices: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const minBalance = Number(input.minBalance ?? 0);
    const limit = Number(input.limit ?? 20);
    const rows = await getUnpaidInvoicesList(client, organizationId, minBalance, limit);
    const total = rows.reduce((sum, row) => sum + row.balanceDue, 0);

    return {
      message: rows.length
        ? `Unpaid ($${total.toFixed(2)}): ${rows.map((r) => `${r.jobTitle} $${r.balanceDue.toFixed(2)}`).join(', ')}`
        : 'No unpaid invoices.',
      data: rows,
    };
  },

  getRevenueSummary: async (_input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const summary =
      ctx.loadedContext.page === 'reports'
        ? ctx.loadedContext.summary
        : await getReportsSummary(client, organizationId);

    const topColumns = summary.conversionByColumn
      .slice(0, 5)
      .map((row) => `${row.stateKey}: ${row.count}`)
      .join(' · ');

    return {
      message: `Revenue $${summary.totalRevenue.toFixed(2)} · Unpaid $${summary.unpaidBalance.toFixed(2)} · Pipeline: ${topColumns}`,
      data: summary,
    };
  },

  searchMembers: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const members = await listOrgMembers(client, organizationId);
    const matches = searchMembersByQuery(members, String(input.query), Number(input.limit ?? 5));
    return {
      message: matches.length
        ? matches.map((m) => `${m.fullName ?? m.userId} (${m.role})`).join(', ')
        : `No members matched "${String(input.query)}".`,
      data: matches,
    };
  },
};
