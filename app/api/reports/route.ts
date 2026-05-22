import { jsonData } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { getReportsSummary } from '@/lib/domain/reports/getReports';

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const summary = await getReportsSummary(context.client, context.organizationId, {
    dateFrom,
    dateTo,
  });
  return jsonData(summary);
}
