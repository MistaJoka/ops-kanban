import type { OrgRole } from '@/lib/domain/auth/roles';
import {
  ADMIN_ROLES,
  canCreateCard,
  canManageMoney,
  canMoveCard,
} from '@/lib/domain/auth/roles';

export type CardAuthContext = {
  assignedTo: string | null;
};

export type CardPatchFields = {
  title?: string;
  description?: string | null;
  priority?: string;
  jobType?: string | null;
  nextAction?: string | null;
  dueDate?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  assignedTo?: string | null;
  checklist?: unknown;
  customerId?: string | null;
};

const WORKER_EDITABLE_FIELDS = new Set([
  'description',
  'nextAction',
  'dueDate',
  'scheduledStart',
  'scheduledEnd',
  'checklist',
]);

export class CardAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'FORBIDDEN',
  ) {
    super(message);
    this.name = 'CardAuthorizationError';
  }
}

export function canEditCard(
  role: OrgRole,
  patch: CardPatchFields,
  card: CardAuthContext,
  actorId: string | null,
): boolean {
  if (role === 'viewer') {
    return false;
  }

  if (ADMIN_ROLES.includes(role)) {
    return true;
  }

  if (role === 'worker') {
    if (!isWorkerAssignedToCard(card.assignedTo, actorId)) {
      return false;
    }

    return Object.keys(patch).every((field) => WORKER_EDITABLE_FIELDS.has(field));
  }

  return false;
}

export function assertCanEditCard(
  role: OrgRole,
  patch: CardPatchFields,
  card: CardAuthContext,
  actorId: string | null,
): void {
  if (!canEditCard(role, patch, card, actorId)) {
    throw new CardAuthorizationError('Your role cannot edit this job.', 'FORBIDDEN');
  }
}

export function canMoveCardOnBoard(
  role: OrgRole,
  card: CardAuthContext,
  actorId: string | null,
): boolean {
  if (!canMoveCard(role)) {
    return false;
  }

  if (role === 'worker') {
    return isWorkerAssignedToCard(card.assignedTo, actorId);
  }

  return true;
}

export function canCommentOnCard(
  role: OrgRole,
  card: CardAuthContext,
  actorId: string | null,
): boolean {
  if (role === 'viewer') {
    return false;
  }

  if (ADMIN_ROLES.includes(role)) {
    return true;
  }

  if (role === 'worker') {
    return isWorkerAssignedToCard(card.assignedTo, actorId);
  }

  return false;
}

export function canEditCardCustomer(role: OrgRole): boolean {
  return canManageMoney(role);
}

export function canCreateCardComment(role: OrgRole): boolean {
  return canCreateCard(role);
}

function isWorkerAssignedToCard(assignedTo: string | null, actorId: string | null): boolean {
  if (!assignedTo) {
    return true;
  }

  return Boolean(actorId && assignedTo === actorId);
}
