import { describe, expect, it } from 'vitest';

import {
  formatBoardCardPropertyLine,
  formatDueLabel,
  formatJobTypeForProperty,
  formatMoneyCompact,
  formatPropertyLineWithoutJobType,
  formatScheduleLabel,
  getAssigneeInitials,
  truncateText,
} from '@/lib/domain/cards/boardCardFormatters';

describe('boardCardFormatters', () => {
  it('formats compact money amounts', () => {
    expect(formatMoneyCompact(0)).toBeNull();
    expect(formatMoneyCompact(1240)).toBe('$1,240');
    expect(formatMoneyCompact(15000)).toBe('$15k');
    expect(formatMoneyCompact(2_500_000)).toBe('$2.5M');
  });

  it('formats schedule labels for today, tomorrow, and short date', () => {
    const now = new Date('2026-05-22T15:00:00.000Z');
    expect(formatScheduleLabel('2026-05-22T09:00:00.000Z', now)).toBe('Today');
    expect(formatScheduleLabel('2026-05-23T09:00:00.000Z', now)).toBe('Tomorrow');
    expect(formatScheduleLabel('2026-05-25T09:00:00.000Z', now)).toMatch(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}\/\d{1,2}$/,
    );
  });

  it('formats due labels', () => {
    const now = new Date('2026-05-22T12:00:00.000Z');
    expect(formatDueLabel('2026-05-21T12:00:00.000Z', now)).toBe('Overdue');
    expect(formatDueLabel('2026-05-22T12:00:00.000Z', now)).toBe('Due today');
  });

  it('derives assignee initials from full names', () => {
    expect(getAssigneeInitials(null)).toBeNull();
    expect(getAssigneeInitials('Maria')).toBe('MA');
    expect(getAssigneeInitials('J. Torres')).toBe('JT');
    expect(getAssigneeInitials('Alex Kim Lee')).toBe('AL');
  });

  it('formats property line without job type', () => {
    expect(formatPropertyLineWithoutJobType(null, null)).toBeNull();
    expect(formatPropertyLineWithoutJobType('142 Oak Lane', 'Rivera')).toBe('142 Oak Lane');
    expect(formatPropertyLineWithoutJobType(null, 'Rivera')).toBe('Rivera');
    expect(truncateText('abcdefghijklmnopqrstuvwxyz', 10)).toBe('abcdefghi…');
  });

  it('formats job type labels for property line', () => {
    expect(formatJobTypeForProperty('maintenance')).toBe('maintenance');
    expect(formatJobTypeForProperty(null)).toBeNull();
  });

  it('combines address and job type on board property line', () => {
    expect(formatBoardCardPropertyLine('142 Oak Lane', 'Rivera', 'maintenance')).toBe(
      '142 Oak Lane · maintenance',
    );
    expect(formatBoardCardPropertyLine(null, null, 'install')).toBe('install');
  });
});
