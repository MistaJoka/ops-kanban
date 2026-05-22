import { describe, expect, it } from 'vitest';

import { executeApprovedToolCall, executeToolCall } from '@/lib/ai/tool-executor';
import { assertOrgScope } from '@/lib/ai/command-handler';
import { loadAiContext } from '@/lib/ai/context-loader';
import { createCard } from '@/lib/domain/cards/createCard';
import { getToolCall } from '@/lib/domain/ai/persistToolCall';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied } from '@/tests/helpers/migrate';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());

describe.skipIf(!integrationReady)('INT-API AI command', () => {
  it('INT-API-002: summarize intent executes without approval', async () => {
    const user = await createTestUser('ai-summarize');
    const service = createServiceClient();

    try {
      const columnId = (
        await service
          .from('columns')
          .select('id')
          .eq('board_id', user.boardId)
          .eq('state_key', 'inquiry')
          .single()
      ).data!.id;

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId,
        title: 'AI summarize target',
        actorId: user.id,
        role: 'owner',
      });

      const loadedContext = await loadAiContext(service, {
        page: 'card',
        organizationId: user.organizationId,
        userId: user.id,
        role: 'owner',
        selectedCardId: card.id,
      });

      const result = await executeToolCall({
        toolName: 'summarizeCard',
        input: { cardId: card.id },
        context: {
          client: service,
          organizationId: user.organizationId,
          userId: user.id,
          role: 'owner',
          loadedContext,
        },
      });

      expect(result.status).toBe('executed');
      if (result.status === 'executed') {
        expect(result.message).toContain('AI summarize target');
      }
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-API-003: moveCard requires approval', async () => {
    const user = await createTestUser('ai-move-approval');
    const service = createServiceClient();

    try {
      const columnId = (
        await service
          .from('columns')
          .select('id')
          .eq('board_id', user.boardId)
          .eq('state_key', 'inquiry')
          .single()
      ).data!.id;

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId,
        title: 'AI move target',
        actorId: user.id,
        role: 'owner',
      });

      const loadedContext = await loadAiContext(service, {
        page: 'card',
        organizationId: user.organizationId,
        userId: user.id,
        role: 'owner',
        selectedCardId: card.id,
      });

      const pending = await executeToolCall({
        toolName: 'moveCard',
        input: { cardId: card.id, columnStateKey: 'site_visit' },
        context: {
          client: service,
          organizationId: user.organizationId,
          userId: user.id,
          role: 'owner',
          loadedContext,
        },
      });

      expect(pending.status).toBe('approval_required');
      if (pending.status !== 'approval_required') return;

      const executed = await executeApprovedToolCall({
        client: service,
        organizationId: user.organizationId,
        userId: user.id,
        role: 'owner',
        loadedContext,
        toolName: 'moveCard',
        input: { cardId: card.id, columnStateKey: 'site_visit' },
        toolCallId: pending.toolCallId,
      });

      expect(executed.status).toBe('executed');

      const toolCall = await getToolCall(service, user.organizationId, pending.toolCallId);
      expect(toolCall?.status).toBe('executed');
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-API-004: viewer cannot move via tool executor', async () => {
    const user = await createTestUser('ai-viewer');
    const service = createServiceClient();

    try {
      const columnId = (
        await service
          .from('columns')
          .select('id')
          .eq('board_id', user.boardId)
          .eq('state_key', 'inquiry')
          .single()
      ).data!.id;

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId,
        title: 'Viewer move block',
        actorId: user.id,
        role: 'owner',
      });

      const loadedContext = await loadAiContext(service, {
        page: 'card',
        organizationId: user.organizationId,
        userId: user.id,
        role: 'viewer',
        selectedCardId: card.id,
      });

      await expect(
        executeToolCall({
          toolName: 'moveCard',
          input: { cardId: card.id, columnStateKey: 'site_visit' },
          context: {
            client: service,
            organizationId: user.organizationId,
            userId: user.id,
            role: 'viewer',
            loadedContext,
          },
        }),
      ).rejects.toThrow(/cannot use moveCard/);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-API-005: handleAiCommand rejects wrong org in context', async () => {
    const user = await createTestUser('ai-org-mismatch');
    const service = createServiceClient();

    try {
      const loadedContext = await loadAiContext(service, {
        page: 'board',
        organizationId: user.organizationId,
        userId: user.id,
        role: 'owner',
      });

      expect(() =>
        assertOrgScope(
          {
            ...loadedContext,
            organizationId: '00000000-0000-4000-8000-000000000099',
          },
          user.organizationId,
        ),
      ).toThrow(/Organization mismatch/);
    } finally {
      await deleteTestUser(user);
    }
  });
});
