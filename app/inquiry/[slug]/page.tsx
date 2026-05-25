import { notFound } from 'next/navigation';

import { InquiryForm } from '@/app/inquiry/[slug]/InquiryForm';
import { getInquiryPageBySlug } from '@/lib/domain/intake/inquiryPages';
import { createServiceClient } from '@/lib/db/supabase/service';

export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string; campaign?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const service = createServiceClient();
  const page = await getInquiryPageBySlug(service, slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Request a quote</p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{page.title}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Tell us about your property and project — we will follow up to discuss scope and next steps.
      </p>
      <div className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-white p-6">
        <InquiryForm
          slug={slug}
          initialSource={query.src}
          initialCampaign={query.campaign}
        />
      </div>
    </main>
  );
}
