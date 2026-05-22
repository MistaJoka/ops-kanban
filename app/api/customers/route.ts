import { jsonData } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { listCustomers } from '@/lib/domain/customers/listCustomers';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const customers = await listCustomers(context.client, context.organizationId);
  return jsonData(customers);
}
