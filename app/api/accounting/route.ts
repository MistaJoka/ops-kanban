import { jsonData, jsonError } from '@/lib/api/response';
import { getArRegister, summarizeArAging } from '@/lib/domain/accounting/getArRegister';
import { listAccountingTransactions } from '@/lib/domain/accounting/listTransactions';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';

export async function GET(request: Request) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot view accounting data.', 403, 'FORBIDDEN');
  }

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const [arRegister, transactions] = await Promise.all([
    getArRegister(context.client, context.organizationId),
    listAccountingTransactions(context.client, context.organizationId, {
      dateFrom,
      dateTo,
      limit: 100,
    }),
  ]);

  return jsonData({
    arRegister,
    arAging: summarizeArAging(arRegister),
    transactions,
  });
}
