import { describe, expect, it } from 'vitest';

import { updateOrganizationSettings } from '@/lib/domain/organization/updateOrganizationSettings';

describe('updateOrganizationSettings', () => {
  it('rejects empty organization name', async () => {
    const client = {} as never;
    await expect(
      updateOrganizationSettings(client, '00000000-0000-0000-0000-000000000001', { name: '   ' }),
    ).rejects.toThrow('Organization name cannot be empty.');
  });
});
