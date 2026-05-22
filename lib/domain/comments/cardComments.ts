import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import type { CardCommentView } from '@/lib/domain/cards/cardDetail';

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

export async function createCardComment(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  authorId: string | null,
  body: string,
): Promise<CardCommentView> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty.');
  }

  const { data, error } = await client
    .from('comments')
    .insert({
      organization_id: organizationId,
      card_id: cardId,
      author_id: authorId,
      body: trimmed,
    })
    .select('id, body, created_at, profiles:author_id(full_name)')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create comment.');
  }

  await logActivity(client, {
    organizationId,
    actorId: authorId,
    entityType: 'card',
    entityId: cardId,
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
