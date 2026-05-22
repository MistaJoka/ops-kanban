/**
 * Compact ↔ full pipeline state mapping (FULL_PIPELINE.md).
 */

export type ArchivedSplitContext = {
  balanceDue: number;
  invoicePaid: boolean;
  needsRetentionFollowUp?: boolean;
};

/** Split compact `archived` cards when upgrading to full pipeline mode. */
export function mapCompactArchivedToFull(
  ctx: ArchivedSplitContext,
): 'payment_pending' | 'paid' | 'retention' | 'archived' {
  if (ctx.balanceDue > 0) {
    return 'payment_pending';
  }
  if (ctx.needsRetentionFollowUp) {
    return 'retention';
  }
  if (ctx.invoicePaid) {
    return 'paid';
  }
  return 'archived';
}

/** Collapse full terminal columns back to compact `archived`. */
export function mapFullTerminalToCompact(fullStateKey: string): 'archived' | null {
  if (fullStateKey === 'paid' || fullStateKey === 'retention' || fullStateKey === 'archived') {
    return 'archived';
  }
  return null;
}
