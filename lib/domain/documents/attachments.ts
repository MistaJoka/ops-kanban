import { randomUUID } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';

export type AttachmentView = {
  id: string;
  cardId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  downloadUrl: string | null;
  createdAt: string;
};

const BUCKET = 'card-attachments';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function listCardAttachments(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<AttachmentView[]> {
  const { data, error } = await client
    .from('attachments')
    .select('id, card_id, filename, mime_type, size_bytes, storage_path, created_at')
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  const attachments = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await client.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 3600);

      return {
        id: row.id,
        cardId: row.card_id,
        filename: row.filename,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        storagePath: row.storage_path,
        downloadUrl: signed?.signedUrl ?? null,
        createdAt: row.created_at,
      };
    }),
  );

  return attachments;
}

export async function uploadCardAttachment(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    actorId: string | null;
    file: File;
  },
): Promise<AttachmentView> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select('id')
    .eq('id', params.cardId)
    .eq('organization_id', params.organizationId)
    .maybeSingle();

  if (cardError || !card) {
    throw new Error('Card not found.');
  }

  const safeName = sanitizeFilename(params.file.name || 'upload.bin');
  const storagePath = `${params.organizationId}/${params.cardId}/${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  const { error: uploadError } = await client.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: params.file.type || 'application/octet-stream',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: row, error: insertError } = await client
    .from('attachments')
    .insert({
      organization_id: params.organizationId,
      card_id: params.cardId,
      storage_path: storagePath,
      filename: safeName,
      mime_type: params.file.type || 'application/octet-stream',
      size_bytes: params.file.size,
      uploaded_by: params.actorId,
    })
    .select('id, card_id, filename, mime_type, size_bytes, storage_path, created_at')
    .single();

  if (insertError || !row) {
    throw new Error(insertError?.message ?? 'Failed to save attachment metadata.');
  }

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: params.cardId,
    action: 'attachment.uploaded',
    summary: `Uploaded file "${safeName}"`,
    metadata: { attachment_id: row.id, filename: safeName },
  });

  const { data: signed } = await client.storage.from(BUCKET).createSignedUrl(storagePath, 3600);

  return {
    id: row.id,
    cardId: row.card_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storagePath: row.storage_path,
    downloadUrl: signed?.signedUrl ?? null,
    createdAt: row.created_at,
  };
}

export async function deleteCardAttachment(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  attachmentId: string,
  actorId: string | null,
): Promise<void> {
  const { data: row, error } = await client
    .from('attachments')
    .select('id, storage_path, filename')
    .eq('id', attachmentId)
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .maybeSingle();

  if (error || !row) {
    throw new Error('Attachment not found.');
  }

  await client.storage.from(BUCKET).remove([row.storage_path]);

  const { error: deleteError } = await client
    .from('attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'card',
    entityId: cardId,
    action: 'attachment.deleted',
    summary: `Removed file "${row.filename}"`,
    metadata: { attachment_id: attachmentId },
  });
}
