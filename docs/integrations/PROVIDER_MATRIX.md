# Provider matrix — build vs buy

Curated vendors for reliability and SMB pricing. Swap via adapter interface in code (`lib/integrations/{provider}/`).

| Capability | Recommended | Alternative | Native (no vendor) |
|------------|-------------|-------------|-------------------|
| Payments | **Stripe** Payment Links | **PayPal** Checkout | Manual mark paid |
| Email | **Resend** | SendGrid, Postmark | mailto: draft only |
| SMS | **Twilio** | — | Manual log |
| E-sign | **Native portal approve** | **DocuSign**, Dropbox Sign | PDF download only |
| Scheduling | **Native book page** | **Calendly** webhook | Card dates only |
| Files | **Supabase Storage** | S3 | — |
| PDF | **@react-pdf/renderer** | Puppeteer | — |
| Accounting | **QuickBooks Online** | Xero | CSV export |
| Maps (future) | Mapbox | Google Maps | Address text only |

**MVP:** Native + manual. **Wave 1:** Stripe or PayPal (pick one primary, one secondary). **Wave 2:** Twilio + Resend. **Wave 3:** DocuSign optional.

---

## Adapter interface (TypeScript)

```ts
export type IntegrationProvider =
  | 'paypal' | 'stripe' | 'twilio' | 'resend' | 'docusign' | 'calendly' | 'quickbooks' | 'native';

export interface PaymentAdapter {
  createPaymentLink(params: { invoiceId: string; amount: number; returnUrl: string }): Promise<{ url: string; externalId: string }>;
  verifyWebhook(req: Request): Promise<WebhookEvent>;
}

// Similar: CommsAdapter, SignAdapter, BookingAdapter, AccountingAdapter
```

Enables provider swap without changing card domain logic.
