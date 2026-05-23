import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardSyncHandlers, MoveCardResult } from '@/components/pipeline/useBoardState';
import type { EnqueueSidecar } from '@/components/pipeline/useOutboundSync';
import type { CardPayload } from '@/components/card/useCardDetail';

export type CardTabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

export type CardAiContext = {
  page: 'card';
  organizationId: string;
  userId: string;
  role: string;
  selectedCardId: string;
};

export type CardMutationsDeps = {
  cardId: string;
  columns: BoardColumnView[];
  role: string;
  organizationId: string;
  userId: string | null;
  onClose: () => void;
  boardSync: BoardSyncHandlers;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
    sidecar?: EnqueueSidecar,
  ) => Promise<MoveCardResult>;
  payload: CardPayload | null;
  setPayload: React.Dispatch<React.SetStateAction<CardPayload | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadCard: (syncBoard?: boolean) => Promise<void>;
  setTab: React.Dispatch<React.SetStateAction<CardTabKey>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmAction: React.Dispatch<
    React.SetStateAction<{
      title: string;
      message: string;
      confirmLabel: string;
      confirmVariant?: 'primary' | 'danger';
      onConfirm: () => Promise<void>;
    } | null>
  >;
};

export type { CardDetailView };
