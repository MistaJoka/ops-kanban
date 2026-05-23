import { jsonData } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { isAuthDisabled } from '@/lib/env/authBypass';

export async function GET() {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const authDisabled = isAuthDisabled();

  if (!context.userId) {
    return jsonData({
      organizationId: context.organizationId,
      userId: null,
      role: context.role,
      authDisabled,
    });
  }

  return jsonData({
    organizationId: context.organizationId,
    userId: context.userId,
    role: context.role,
    authDisabled,
  });
}
