'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function BoardScrollAffordance({
  children,
  className,
  setScrollRef,
}: {
  children: ReactNode;
  className?: string;
  setScrollRef?: (element: HTMLDivElement | null) => void;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const updateEdges = useCallback(() => {
    const node = innerRef.current;
    if (!node) return;

    const maxScroll = node.scrollWidth - node.clientWidth;
    if (maxScroll <= 4) {
      setEdges({ start: false, end: false });
      return;
    }

    setEdges({
      start: node.scrollLeft > 4,
      end: node.scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    updateEdges();
    node.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [updateEdges]);

  const assignRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      setScrollRef?.(node);
    },
    [setScrollRef],
  );

  return (
    <div
      className={cn(
        'ops-board-scroll-wrap',
        edges.start && 'ops-board-scroll-wrap--start',
        edges.end && 'ops-board-scroll-wrap--end',
        className,
      )}
    >
      <div ref={assignRef} className={cn('ops-board-surface', className)}>
        {children}
      </div>
    </div>
  );
}
