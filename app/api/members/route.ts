import { jsonData } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { listOrgMembers } from '@/lib/domain/organization/listMembers';

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context) => {
      const members = await listOrgMembers(context.client, context.organizationId);
      return jsonData(members);
    },
    { route: '/api/members' },
  );
}
