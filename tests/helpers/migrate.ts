import { createServiceClient } from '@/tests/helpers/supabase';

export async function hasMigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('organization_members').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasWave1MigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('payments').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasWave2MigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('messages').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasWave3MigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('attachments').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasWave4MigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('automations').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasInquiryMigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('inquiry_pages').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function hasNativeAccountingMigrationsApplied(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('accounting_transactions').select('id').limit(1);

    if (!error) {
      return true;
    }

    return !error.message.includes('schema cache') && !error.message.includes('does not exist');
  } catch {
    return false;
  }
}
