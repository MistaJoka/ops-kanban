import { jsonData } from '@/lib/api/response';
import { withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { isAuthDisabled } from '@/lib/env/authBypass';

export async function GET() {
  return withApiRouteNoRequest(async (context) => {
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
  }, { route: '/api/app/context' });
}
