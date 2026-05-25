import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { createCustomer } from '@/lib/domain/customers/createCustomer';
import { listCustomers } from '@/lib/domain/customers/listCustomers';

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  return withApiRoute(
    request,
    async (context) => {
      const customers = await listCustomers(context.client, context.organizationId);
      return jsonData(customers);
    },
    { route: '/api/customers' },
  );
}

export async function POST(request: Request) {
  return withApiRoute(
    request,
    async (context, req) => {
      const parsed = await parseJsonBody(req, createCustomerSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      const customer = await createCustomer(context.client, {
        organizationId: context.organizationId,
        actorId: context.userId,
        role: context.role,
        ...parsed.data,
      });
      return jsonData(customer, 201);
    },
    { route: '/api/customers' },
  );
}
