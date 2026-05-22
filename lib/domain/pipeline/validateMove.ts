import type { OrgRole } from '@/lib/domain/auth/roles';
import { canMoveCard } from '@/lib/domain/auth/roles';
import {
  type StateKey,
  isStateKey,
  stateKeyIndex,
} from '@/lib/domain/pipeline/types';

export type MoveValidationContext = {
  role: OrgRole;
  fromStateKey: string;
  toStateKey: string;
  scheduledStart: string | null;
  quoteTotal: number;
  balanceDue: number;
  hasCustomer: boolean;
  hasTitle: boolean;
  pipelineMode?: 'compact' | 'full';
};

export type MoveValidationResult = {
  allowed: boolean;
  code?: 'FORBIDDEN' | 'INVALID_STATE' | 'SKIP_DENIED' | 'SCHEDULE_REQUIRED' | 'ESTIMATE_REQUIRED';
  message?: string;
  requiresReason?: boolean;
  setArchivedAt?: boolean;
};

const OWNER_MANAGER_SKIPS: Array<[StateKey, StateKey]> = [
  ['inquiry', 'estimating'],
  ['estimate_sent', 'approved'],
  ['on_site', 'complete'],
  ['complete', 'archived'],
];

function isAllowedSkip(from: StateKey, to: StateKey): boolean {
  return OWNER_MANAGER_SKIPS.some(([fromKey, toKey]) => fromKey === from && toKey === to);
}

function isRoleAllowedTransition(
  role: OrgRole,
  fromIndex: number,
  toIndex: number,
  from: StateKey,
  to: StateKey,
): { allowed: boolean; requiresReason?: boolean } {
  if (fromIndex === toIndex) {
    return { allowed: true };
  }

  if (role === 'worker') {
    return { allowed: toIndex === fromIndex + 1 };
  }

  if (role === 'owner' || role === 'manager') {
    if (toIndex === fromIndex + 1 || toIndex < fromIndex) {
      return { allowed: true };
    }

    if (isAllowedSkip(from, to)) {
      return { allowed: true, requiresReason: true };
    }

    return { allowed: false };
  }

  return { allowed: false };
}

export function validateMove(context: MoveValidationContext): MoveValidationResult {
  const pipelineMode = context.pipelineMode ?? 'compact';

  if (!canMoveCard(context.role)) {
    return {
      allowed: false,
      code: 'FORBIDDEN',
      message: 'Your role cannot move cards.',
    };
  }

  if (!isStateKey(context.fromStateKey, pipelineMode) || !isStateKey(context.toStateKey, pipelineMode)) {
    return {
      allowed: false,
      code: 'INVALID_STATE',
      message: 'Unknown pipeline state.',
    };
  }

  const from = context.fromStateKey;
  const to = context.toStateKey;
  const fromIndex = stateKeyIndex(from, pipelineMode);
  const toIndex = stateKeyIndex(to, pipelineMode);

  const transition = isRoleAllowedTransition(context.role, fromIndex, toIndex, from, to);

  if (!transition.allowed) {
    return {
      allowed: false,
      code: 'SKIP_DENIED',
      message:
        context.role === 'worker'
          ? 'Workers can only move cards to the next column.'
          : 'This column skip is not allowed.',
    };
  }

  if (to === 'estimating' && !context.hasCustomer && !context.hasTitle) {
    return {
      allowed: false,
      code: 'INVALID_STATE',
      message: 'Add a customer or descriptive title before estimating.',
    };
  }

  if (to === 'estimate_sent' && context.quoteTotal <= 0) {
    return {
      allowed: false,
      code: 'ESTIMATE_REQUIRED',
      message: 'Add estimate line items before moving to Estimate sent.',
    };
  }

  const scheduleStates = pipelineMode === 'full' ? ['scheduling', 'ready'] : ['scheduled'];
  if (scheduleStates.includes(to) && !context.scheduledStart) {
    return {
      allowed: false,
      code: 'SCHEDULE_REQUIRED',
      message: 'Set a scheduled start date before moving to a scheduled column.',
    };
  }

  if (to === 'paid') {
    return { allowed: true, requiresReason: transition.requiresReason };
  }

  if (to === 'archived') {
    const needsBalanceReason = context.balanceDue > 0;

    return {
      allowed: true,
      setArchivedAt: true,
      requiresReason: needsBalanceReason || transition.requiresReason === true,
      message: needsBalanceReason
        ? `Outstanding balance of $${context.balanceDue.toFixed(2)}. Document why you are archiving without payment.`
        : undefined,
    };
  }

  return {
    allowed: true,
    requiresReason: transition.requiresReason,
  };
}
