import { jsonError } from '@/lib/api/response';
import { exportAccountingCsv } from '@/lib/domain/accounting/exportCsv';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot export accounting data.', 403, 'FORBIDDEN');
  }

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const csv = await exportAccountingCsv(context.client, context.organizationId, {
    dateFrom,
    dateTo,
  });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="opsboard-accounting.csv"',
    },
  });
}
