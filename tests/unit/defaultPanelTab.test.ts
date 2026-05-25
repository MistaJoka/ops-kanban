import { describe, expect, it } from 'vitest';

import { defaultPanelTabForState } from '@/lib/domain/cards/defaultPanelTab';

describe('defaultPanelTabForState', () => {
  it('opens estimate tab for estimating stages', () => {
    expect(defaultPanelTabForState('estimating')).toBe('estimate');
    expect(defaultPanelTabForState('estimate_sent')).toBe('estimate');
  });

  it('opens schedule tab for production stages', () => {
    expect(defaultPanelTabForState('scheduled')).toBe('schedule');
    expect(defaultPanelTabForState('on_site')).toBe('schedule');
  });

  it('opens money tab for billing stages', () => {
    expect(defaultPanelTabForState('complete')).toBe('money');
    expect(defaultPanelTabForState('invoice_sent')).toBe('money');
  });

  it('defaults to overview', () => {
    expect(defaultPanelTabForState('inquiry')).toBe('overview');
  });
});
