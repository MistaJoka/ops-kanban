import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { exportAccountingCsv } from '@/lib/domain/accounting/exportCsv';
import { canManageMoney } from '@/lib/domain/auth/roles';

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot export accounting data.', 403, 'FORBIDDEN');
      }

      const url = new URL(req.url);
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');

      const csv = await exportAccountingCsv(context.client, context.organizationId, {
        dateFrom,
        dateTo,
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="opsboard-accounting.csv"',
        },
      });
    },
    { route: '/api/accounting/export' },
  );
}
