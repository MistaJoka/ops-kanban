# Provider matrix — build vs buy

Curated vendors for reliability and SMB pricing. Swap via adapter interface in code (`lib/integrations/{provider}/`).

| Capability    | Recommended                     | Alternative         | Native (no vendor)          |
| ------------- | ------------------------------- | ------------------- | --------------------------- |
| Payments      | **Stripe** Payment Links        | **PayPal** Checkout | Manual mark paid            |
| Email         | **Resend**                      | SendGrid, Postmark  | mailto: draft only          |
| SMS           | **Twilio**                      | —                   | Manual log                  |
| E-sign        | **Native portal approve**       | PDF download only   | —                           |
| Scheduling    | **Native book page**            | —                   | Card dates only             |
| Files         | **Supabase Storage**            | S3                  | —                           |
| PDF           | **@react-pdf/renderer**         | Puppeteer           | —                           |
| Accounting    | **Native ledger** (AR + income) | CSV export          | Invoices + payments on card |
| Maps (future) | Mapbox                          | Google Maps         | Address text only           |

**MVP:** Native + manual. **Wave 1:** Stripe (optional). **Wave 2:** Twilio + Resend (optional). **Wave 3+:** Native e-sign, files, native accounting ledger.

---

## Adapter interface (TypeScript)

```ts
export type IntegrationProvider = 'paypal' | 'stripe' | 'twilio' | 'resend' | 'native';

export interface PaymentAdapter {
  createPaymentLink(params: {
    invoiceId: string;
    amount: number;
    returnUrl: string;
  }): Promise<{ url: string; externalId: string }>;
  verifyWebhook(req: Request): Promise<WebhookEvent>;
}

// CommsAdapter for Twilio/Resend optional delivery pipes
```

Enables provider swap without changing card domain logic. Business primitives (accounting, e-sign, booking) live in `lib/domain/*`.
