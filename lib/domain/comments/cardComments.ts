import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { canCommentOnCard } from '@/lib/domain/cards/authorizeCardMutation';
import type { CardCommentView } from '@/lib/domain/cards/cardDetail';
import { DomainError } from '@/lib/domain/errors';

export async function listCardComments(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<CardCommentView[]> {
  const { data, error } = await client
    .from('comments')
    .select('id, body, created_at, profiles:author_id(full_name)')
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      body: row.body,
      authorName: profile?.full_name ?? null,
      createdAt: row.created_at,
    };
  });
}

export type CreateCardCommentInput = {
  organizationId: string;
  cardId: string;
  authorId: string | null;
  role: OrgRole;
  body: string;
};

export async function createCardComment(
  client: SupabaseClient,
  input: CreateCardCommentInput,
): Promise<CardCommentView> {
  const trimmed = input.body.trim();
  if (!trimmed) {
    throw new DomainError('Comment cannot be empty.', 'VALIDATION_ERROR');
  }

  const { data: cardRow, error: cardError } = await client
    .from('cards')
    .select('assigned_to')
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .maybeSingle();

  if (cardError) {
    throw new Error(cardError.message);
  }

  if (!cardRow) {
    throw new DomainError('Card not found.', 'NOT_FOUND');
  }

  if (
    !canCommentOnCard(
      input.role,
      { assignedTo: (cardRow.assigned_to as string | null) ?? null },
      input.authorId,
    )
  ) {
    throw new DomainError('Your role cannot comment on this job.', 'FORBIDDEN');
  }

  const { data, error } = await client
    .from('comments')
    .insert({
      organization_id: input.organizationId,
      card_id: input.cardId,
      author_id: input.authorId,
      body: trimmed,
    })
    .select('id, body, created_at, profiles:author_id(full_name)')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create comment.');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.authorId,
    entityType: 'card',
    entityId: input.cardId,
    action: 'comment.created',
    summary: 'Added a comment',
    metadata: { comment_id: data.id },
  });

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return {
    id: data.id,
    body: data.body,
    authorName: profile?.full_name ?? null,
    createdAt: data.created_at,
  };
}
