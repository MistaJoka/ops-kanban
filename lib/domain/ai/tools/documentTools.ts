import { analyzeAttachmentImage } from '@/lib/ai/vision-analyze';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { getAttachmentBytes } from '@/lib/domain/documents/attachments';

import { type ToolHandler } from './toolHelpers';

export const documentToolHandlers: Record<string, ToolHandler> = {
  analyzeAttachment: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const cardId = String(input.cardId);
    const attachmentId = String(input.attachmentId);

    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail) {
      throw new Error('Card not found.');
    }

    const bytes = await getAttachmentBytes(client, organizationId, cardId, attachmentId);
    if (!bytes) {
      throw new Error('Attachment not found or could not be downloaded.');
    }

    if (!bytes.mimeType.startsWith('image/')) {
      throw new Error('Vision analysis supports image attachments only.');
    }

    const analysis = await analyzeAttachmentImage({
      mimeType: bytes.mimeType,
      base64: bytes.base64,
      jobTitle: detail.title,
    });

    if (!analysis) {
      throw new Error('Vision analysis unavailable — check GEMINI_API_KEY.');
    }

    return {
      message: analysis.summary,
      data: analysis,
      cardId,
    };
  },
};
