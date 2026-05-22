import 'server-only';

import { createHmac } from 'node:crypto';

import type { CommsAdapter, CommsWebhookEvent } from '@/lib/integrations/types';

function getTwilioAuthToken(): string {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) {
    throw new Error('Twilio is not configured. Set TWILIO_AUTH_TOKEN.');
  }
  return token;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER),
  );
}

function getFromNumberOrService(): { from?: string; messagingServiceSid?: string } {
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    return { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID };
  }

  if (process.env.TWILIO_PHONE_NUMBER) {
    return { from: process.env.TWILIO_PHONE_NUMBER };
  }

  throw new Error('Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER.');
}

function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const digest = createHmac('sha1', getTwilioAuthToken()).update(sorted).digest('base64');
  return digest === signature;
}

export const twilioCommsAdapter: CommsAdapter = {
  async sendSms({ to, body }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    if (!accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID is not configured.');
    }

    const sender = getFromNumberOrService();
    const payload = new URLSearchParams({
      To: to,
      Body: body,
      ...(sender.from ? { From: sender.from } : {}),
      ...(sender.messagingServiceSid ? { MessagingServiceSid: sender.messagingServiceSid } : {}),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${getTwilioAuthToken()}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Twilio send failed: ${detail}`);
    }

    const data = (await response.json()) as { sid?: string };
    return { externalId: data.sid ?? `twilio_${Date.now()}` };
  },

  async verifyWebhook(request: Request, url: string) {
    const signature = request.headers.get('x-twilio-signature');
    if (!signature) {
      return null;
    }

    const form = await request.formData();
    const params: Record<string, string> = {};
    form.forEach((value, key) => {
      params[key] = String(value);
    });

    if (!validateTwilioSignature(url, params, signature)) {
      return null;
    }

    const organizationId = process.env.TWILIO_DEFAULT_ORGANIZATION_ID;
    if (!organizationId) {
      return null;
    }

    const messageSid = params.MessageSid;
    const fromPhone = params.From;
    const toPhone = params.To;
    const body = params.Body;

    if (!messageSid || !fromPhone || !body) {
      return null;
    }

    return {
      provider: 'twilio',
      eventType: 'sms.received',
      externalId: messageSid,
      organizationId,
      fromPhone,
      toPhone: toPhone ?? '',
      body,
      raw: params,
    } satisfies CommsWebhookEvent;
  },
};

export function parseTwilioWebhookParams(
  params: Record<string, string>,
  organizationId: string,
): CommsWebhookEvent | null {
  const messageSid = params.MessageSid;
  const fromPhone = params.From;
  const toPhone = params.To;
  const body = params.Body;

  if (!messageSid || !fromPhone || !body) {
    return null;
  }

  return {
    provider: 'twilio',
    eventType: 'sms.received',
    externalId: messageSid,
    organizationId,
    fromPhone,
    toPhone: toPhone ?? '',
    body,
    raw: params,
  };
}
