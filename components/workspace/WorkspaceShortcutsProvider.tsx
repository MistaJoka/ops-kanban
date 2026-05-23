'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import { KeyboardShortcutsModal } from '@/components/workspace/KeyboardShortcutsModal';
import { isEditableTarget, isShortcutModifier, matchShortcut } from '@/lib/utils/keyboard';

type PipelineShortcutHandlers = {
  focusSearch?: () => void;
  openNewJob?: () => void;
  jumpGroup?: (direction: 1 | -1) => void;
  handleEscape?: () => boolean;
};

type WorkspaceShortcutsContextValue = {
  openShortcuts: () => void;
  closeShortcuts: () => void;
  shortcutsOpen: boolean;
  registerPipelineHandlers: (handlers: PipelineShortcutHandlers | null) => void;
};

const WorkspaceShortcutsContext = createContext<WorkspaceShortcutsContextValue | null>(null);

export function useWorkspaceShortcuts(): WorkspaceShortcutsContextValue {
  const value = useContext(WorkspaceShortcutsContext);
  if (!value) {
    throw new Error('useWorkspaceShortcuts must be used within WorkspaceShortcutsProvider');
  }
  return value;
}

export function useWorkspaceShortcutsOptional() {
  return useContext(WorkspaceShortcutsContext);
}

export function WorkspaceShortcutsProvider({
  children,
  onToggleSidebar,
}: {
  children: ReactNode;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const pipelineHandlersRef = useRef<PipelineShortcutHandlers | null>(null);

  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  const registerPipelineHandlers = useCallback((handlers: PipelineShortcutHandlers | null) => {
    pipelineHandlersRef.current = handlers;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const onPipeline = pathname === '/pipeline' || pathname.startsWith('/pipeline/');

      if (
        onPipeline &&
        event.key === '/' &&
        !event.shiftKey &&
        !isShortcutModifier(event) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        pipelineHandlersRef.current?.focusSearch?.();
        document.getElementById('pipeline-job-search')?.focus();
        return;
      }

      if (event.defaultPrevented) return;

      if (shortcutsOpen && event.key === 'Escape') {
        event.preventDefault();
        closeShortcuts();
        return;
      }

      if (isEditableTarget(event.target) && event.key !== 'Escape') {
        return;
      }

      if (event.key === 'Escape') {
        if (pipelineHandlersRef.current?.handleEscape?.()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === '?' && !event.shiftKey && !isShortcutModifier(event)) {
        event.preventDefault();
        openShortcuts();
        return;
      }

      if (event.key === '`' && !isShortcutModifier(event)) {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      if (onPipeline && matchShortcut(event, 'k', { meta: true })) {
        event.preventDefault();
        pipelineHandlersRef.current?.focusSearch?.();
        return;
      }

      if (onPipeline && matchShortcut(event, 'n')) {
        event.preventDefault();
        pipelineHandlersRef.current?.openNewJob?.();
        return;
      }

      if (
        onPipeline &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        !isShortcutModifier(event)
      ) {
        pipelineHandlersRef.current?.jumpGroup?.(event.key === 'ArrowRight' ? 1 : -1);
      }
    };

    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [closeShortcuts, onToggleSidebar, openShortcuts, pathname, shortcutsOpen]);

  const value = useMemo(
    () => ({
      openShortcuts,
      closeShortcuts,
      shortcutsOpen,
      registerPipelineHandlers,
    }),
    [closeShortcuts, openShortcuts, registerPipelineHandlers, shortcutsOpen],
  );

  return (
    <WorkspaceShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
    </WorkspaceShortcutsContext.Provider>
  );
}
