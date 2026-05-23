import { describe, expect, it } from 'vitest';

import { computeInsertPosition } from '@/lib/domain/cards/cardPosition';

describe('computeInsertPosition', () => {
  it('returns 0 for an empty column', () => {
    expect(computeInsertPosition([], 0)).toBe(0);
    expect(computeInsertPosition([], 5)).toBe(0);
  });

  it('inserts before the first card', () => {
    expect(computeInsertPosition([{ position: 10 }, { position: 20 }], 0)).toBe(9);
  });

  it('inserts after the last card', () => {
    expect(computeInsertPosition([{ position: 10 }, { position: 20 }], 2)).toBe(21);
    expect(computeInsertPosition([{ position: 10 }, { position: 20 }], 99)).toBe(21);
  });

  it('inserts between cards using midpoint', () => {
    expect(computeInsertPosition([{ position: 10 }, { position: 30 }], 1)).toBe(20);
  });

  it('falls back to index when positions collide', () => {
    expect(computeInsertPosition([{ position: 5 }, { position: 5 }], 1)).toBe(1);
  });

  it('clamps negative indices to the start', () => {
    expect(computeInsertPosition([{ position: 4 }], -3)).toBe(3);
  });

  it('sorts cards by position before computing', () => {
    expect(computeInsertPosition([{ position: 30 }, { position: 10 }, { position: 20 }], 1)).toBe(
      15,
    );
  });
});
