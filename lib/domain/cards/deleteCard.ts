import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { canDeleteCard, type OrgRole } from '@/lib/domain/auth/roles';

export type DeleteCardInput = {
  organizationId: string;
  cardId: string;
  actorId: string | null;
  role: OrgRole;
};

export class DeleteCardError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DeleteCardError';
  }
}

export async function deleteCard(client: SupabaseClient, input: DeleteCardInput): Promise<void> {
  if (!canDeleteCard(input.role)) {
    throw new DeleteCardError('Your role cannot delete cards.', 'FORBIDDEN');
  }

  const { data: card, error: fetchError } = await client
    .from('cards')
    .select('id, title')
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .single();

  if (fetchError || !card) {
    throw new DeleteCardError('Card not found.', 'NOT_FOUND');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'card',
    entityId: input.cardId,
    action: 'card.deleted',
    summary: `Deleted job "${card.title as string}"`,
    metadata: {},
  });

  const { error: deleteError } = await client
    .from('cards')
    .delete()
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId);

  if (deleteError) {
    throw new DeleteCardError(deleteError.message, 'INTERNAL');
  }
}
