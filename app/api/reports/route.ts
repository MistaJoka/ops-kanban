import { jsonData } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { getReportsSummary } from '@/lib/domain/reports/getReports';

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const url = new URL(req.url);
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');

      const summary = await getReportsSummary(context.client, context.organizationId, {
        dateFrom,
        dateTo,
      });
      return jsonData(summary);
    },
    { route: '/api/reports' },
  );
}
