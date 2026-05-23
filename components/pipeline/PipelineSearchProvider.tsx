'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import type { PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

type PipelineSearchContextValue = {
  registerSearchInput: (el: HTMLInputElement | null) => void;
  focusSearch: () => void;
  registerNewJobHandler: (fn: (() => void) | null) => void;
  openNewJob: () => void;
  registerBoardScrollRef: (el: HTMLDivElement | null) => void;
  scrollToGroup: (key: PipelineGroupKey) => void;
  registerGroupRef: (key: PipelineGroupKey, el: HTMLDivElement | null) => void;
  registerGroupJumpHandler: (fn: ((direction: 1 | -1) => void) | null) => void;
  jumpGroup: (direction: 1 | -1) => void;
};

const PipelineSearchContext = createContext<PipelineSearchContextValue | null>(null);

export function PipelineSearchProvider({ children }: { children: ReactNode }) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const newJobHandlerRef = useRef<(() => void) | null>(null);
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const groupRefs = useRef<Partial<Record<PipelineGroupKey, HTMLDivElement | null>>>({});
  const groupJumpHandlerRef = useRef<((direction: 1 | -1) => void) | null>(null);

  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    searchInputRef.current = el;
  }, []);

  const focusSearch = useCallback(() => {
    const input = searchInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const registerNewJobHandler = useCallback((fn: (() => void) | null) => {
    newJobHandlerRef.current = fn;
  }, []);

  const openNewJob = useCallback(() => {
    newJobHandlerRef.current?.();
  }, []);

  const registerBoardScrollRef = useCallback((el: HTMLDivElement | null) => {
    boardScrollRef.current = el;
  }, []);

  const registerGroupRef = useCallback((key: PipelineGroupKey, el: HTMLDivElement | null) => {
    groupRefs.current[key] = el;
  }, []);

  const scrollToGroup = useCallback((key: PipelineGroupKey) => {
    const target = groupRefs.current[key];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  const registerGroupJumpHandler = useCallback((fn: ((direction: 1 | -1) => void) | null) => {
    groupJumpHandlerRef.current = fn;
  }, []);

  const jumpGroup = useCallback((direction: 1 | -1) => {
    groupJumpHandlerRef.current?.(direction);
  }, []);

  const value = useMemo(
    () => ({
      registerSearchInput,
      focusSearch,
      registerNewJobHandler,
      openNewJob,
      registerBoardScrollRef,
      scrollToGroup,
      registerGroupRef,
      registerGroupJumpHandler,
      jumpGroup,
    }),
    [
      focusSearch,
      jumpGroup,
      openNewJob,
      registerBoardScrollRef,
      registerGroupJumpHandler,
      registerGroupRef,
      registerNewJobHandler,
      registerSearchInput,
      scrollToGroup,
    ],
  );

  return <PipelineSearchContext.Provider value={value}>{children}</PipelineSearchContext.Provider>;
}

export function usePipelineSearch(): PipelineSearchContextValue | null {
  return useContext(PipelineSearchContext);
}
