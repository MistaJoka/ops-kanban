import { Suspense } from 'react';

import { getAppContext, getAppDataClient } from '@/lib/domain/auth/appContext';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';

export const dynamic = 'force-dynamic';

function PipelineLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--text-secondary)]">
      Loading pipeline…
    </div>
  );
}

async function PipelineContent() {
  const app = await getAppContext();
  const { client, organizationId } = await getAppDataClient();
  const board = await getPrimaryBoard(client, organizationId);

  return <KanbanBoard initialBoard={board} role={app.role} organizationId={app.organizationId} userId={app.userId} />;
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<PipelineLoading />}>
      <PipelineContent />
    </Suspense>
  );
}
