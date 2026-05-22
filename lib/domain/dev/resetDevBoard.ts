import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  resetOrganizationBoardData,
  type ResetDevBoardResult,
} from '@/lib/domain/dev/resetDevBoardData';
import { isAuthDisabled } from '@/lib/env/authBypass';

export type { ResetDevBoardResult };

export class DevResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevResetError';
  }
}

export async function resetDevBoard(
  client: SupabaseClient,
  organizationId: string,
): Promise<ResetDevBoardResult> {
  if (!isAuthDisabled()) {
    throw new DevResetError('Dev board reset is only available when auth bypass is enabled.');
  }

  try {
    return await resetOrganizationBoardData(client, organizationId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset dev board.';
    throw new DevResetError(message);
  }
}
