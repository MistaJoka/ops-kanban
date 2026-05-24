import { formatMemberDisambiguation, searchMembersByQuery } from '@/lib/ai/member-resolver';
import { createCard } from '@/lib/domain/cards/createCard';
import { getCardDetail, updateCard } from '@/lib/domain/cards/cardDetail';
import { deleteCard, DeleteCardError } from '@/lib/domain/cards/deleteCard';
import { moveCard, MoveCardError } from '@/lib/domain/cards/moveCard';
import { listOrgMembers } from '@/lib/domain/organization/listMembers';

import { resolveColumnId, type ToolHandler } from './toolHelpers';

export const cardToolHandlers: Record<string, ToolHandler> = {
  createCard: async (input, ctx, { board }) => {
    const { client, organizationId, userId, role } = ctx;
    const boardId = board.boardId;
    const stateKey = String(input.columnStateKey ?? 'inquiry');
    const columnId = input.columnId
      ? String(input.columnId)
      : await resolveColumnId(client, organizationId, boardId, stateKey);

    const card = await createCard(client, {
      organizationId,
      boardId,
      columnId,
      title: String(input.title),
      description: input.description ? String(input.description) : undefined,
      actorId: userId,
      role,
    });

    return {
      message: `Created job "${card.title}" in ${stateKey.replace(/_/g, ' ')}.`,
      data: card,
      cardId: card.id,
    };
  },

  moveCard: async (input, ctx, { board }) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const boardId = board.boardId;
    const targetColumnId = input.targetColumnId
      ? String(input.targetColumnId)
      : await resolveColumnId(
          client,
          organizationId,
          boardId,
          String(input.columnStateKey ?? 'inquiry'),
        );

    try {
      const card = await moveCard(client, {
        organizationId,
        cardId,
        targetColumnId,
        actorId: userId,
        role,
        reason: input.reason ? String(input.reason) : undefined,
      });

      return {
        message: `Moved "${card.title}" to ${card.stateKey.replace(/_/g, ' ')}.`,
        data: card,
        cardId: card.id,
      };
    } catch (error) {
      if (error instanceof MoveCardError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  updateCard: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const detail = await updateCard(client, {
      organizationId,
      cardId,
      actorId: userId,
      role,
      patch: {
        nextAction: input.nextAction ? String(input.nextAction) : undefined,
        dueDate: input.dueDate ? String(input.dueDate) : undefined,
        scheduledStart: input.scheduledStart ? String(input.scheduledStart) : undefined,
        scheduledEnd: input.scheduledEnd ? String(input.scheduledEnd) : undefined,
        priority: input.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      },
    });

    return {
      message: `Updated job "${detail.title}".`,
      data: detail,
      cardId: detail.id,
    };
  },

  assignCard: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    let assigneeId = input.assigneeId ? String(input.assigneeId) : null;

    if (!assigneeId && input.assigneeName) {
      const members = await listOrgMembers(client, organizationId);
      const matches = searchMembersByQuery(members, String(input.assigneeName), 5);
      if (matches.length === 1) {
        assigneeId = matches[0].userId;
      } else if (matches.length > 1) {
        throw new Error(formatMemberDisambiguation(matches));
      } else {
        throw new Error(`No team member matched "${String(input.assigneeName)}".`);
      }
    }

    if (!assigneeId) {
      throw new Error('assigneeId or assigneeName is required.');
    }

    const detail = await updateCard(client, {
      organizationId,
      cardId,
      actorId: userId,
      role,
      patch: { assignedTo: assigneeId },
    });

    return {
      message: `Assigned job "${detail.title}".`,
      data: detail,
      cardId: detail.id,
    };
  },

  archiveCard: async (input, ctx, { board }) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const boardId = board.boardId;
    const archivedColumnId = await resolveColumnId(client, organizationId, boardId, 'archived');

    try {
      const card = await moveCard(client, {
        organizationId,
        cardId,
        targetColumnId: archivedColumnId,
        actorId: userId,
        role,
        reason: input.reason ? String(input.reason) : 'Archived via AI copilot',
      });

      return {
        message: `Archived “${card.title}”.`,
        data: card,
        cardId: card.id,
      };
    } catch (error) {
      if (error instanceof MoveCardError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  deleteCard: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    const title = detail?.title ?? 'job';

    try {
      await deleteCard(client, {
        organizationId,
        cardId,
        actorId: userId,
        role,
      });

      return {
        message: `Deleted “${title}”.`,
        data: { cardId, title },
        cardId,
      };
    } catch (error) {
      if (error instanceof DeleteCardError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
