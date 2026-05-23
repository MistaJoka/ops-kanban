import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import {
  deleteCardAttachment,
  listCardAttachments,
  uploadCardAttachment,
} from '@/lib/domain/documents/attachments';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  const { id } = await params;

  try {
    const attachments = await listCardAttachments(context.client, context.organizationId, id);
    return jsonData(attachments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load attachments.';
    return jsonError(message, 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot upload files.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return jsonError('A file is required.', 400, 'VALIDATION_ERROR');
    }

    if (file.size > 10 * 1024 * 1024) {
      return jsonError('File must be 10 MB or smaller.', 400, 'VALIDATION_ERROR');
    }

    const attachment = await uploadCardAttachment(context.client, {
      organizationId: context.organizationId,
      cardId: id,
      actorId: context.userId,
      file,
    });

    return jsonData(attachment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot delete files.', 403, 'FORBIDDEN');
  }

  const { id } = await params;
  const attachmentId = new URL(request.url).searchParams.get('attachmentId');

  if (!attachmentId) {
    return jsonError('attachmentId is required.', 400, 'VALIDATION_ERROR');
  }

  try {
    await deleteCardAttachment(
      context.client,
      context.organizationId,
      id,
      attachmentId,
      context.userId,
    );
    return jsonData({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed.';
    return jsonError(message, 400, 'VALIDATION_ERROR');
  }
}
