import { createCustomer } from '@/lib/domain/customers/createCustomer';
import { summarizeCustomerHistoryText } from '@/lib/domain/customers/customerHistory';
import { listCustomers } from '@/lib/domain/customers/listCustomers';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

import { type ToolHandler } from './toolHelpers';

export const customerToolHandlers: Record<string, ToolHandler> = {
  updateCustomer: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail?.customer?.id) {
      throw new Error('This job has no linked customer to update.');
    }

    const patch: Record<string, string> = {};
    if (input.name) patch.name = String(input.name);
    if (input.phone) patch.phone = String(input.phone);
    if (input.email) patch.email = String(input.email);
    if (input.address) patch.address = String(input.address);
    if (input.notes) patch.notes = String(input.notes);

    const { error } = await client
      .from('customers')
      .update(patch)
      .eq('id', detail.customer.id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: `Updated customer for “${detail.title}”.`,
      data: patch,
      cardId,
    };
  },

  summarizeCustomerHistory: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const customerId = String(input.customerId);
    const summary = await summarizeCustomerHistoryText(client, organizationId, customerId);
    return { message: summary, data: { summary }, cardId: null };
  },

  searchCustomers: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const customers = await listCustomers(client, organizationId);
    const query = String(input.query).toLowerCase();
    const limit = Number(input.limit ?? 5);
    const matches = customers
      .filter((customer) =>
        [customer.name, customer.phone, customer.email, customer.address]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
      .slice(0, limit);

    return {
      message: matches.length
        ? matches.map((c) => `${c.name} (${c.jobCount} jobs)`).join(', ')
        : `No customers matched "${String(input.query)}".`,
      data: matches,
    };
  },

  createCustomer: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const customer = await createCustomer(client, {
      organizationId,
      actorId: userId,
      role,
      name: String(input.name),
      phone: input.phone ? String(input.phone) : null,
      email: input.email ? String(input.email) : null,
      address: input.address ? String(input.address) : null,
      notes: input.notes ? String(input.notes) : null,
    });

    return {
      message: `Created customer "${customer.name}".`,
      data: customer,
      cardId: null,
    };
  },
};
