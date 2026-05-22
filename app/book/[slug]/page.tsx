import { notFound } from 'next/navigation';

import { BookingForm } from '@/app/book/[slug]/BookingForm';
import { getBookingPageBySlug } from '@/lib/domain/booking/bookingPages';
import { createServiceClient } from '@/lib/db/supabase/service';

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = createServiceClient();
  const page = await getBookingPageBySlug(service, slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Online booking</p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{page.title}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Pick a service and time — we will create your job request immediately.
      </p>
      <div className="mt-8 rounded-xl border border-[var(--topbar-border)] bg-white p-6">
        <BookingForm slug={slug} />
      </div>
    </main>
  );
}
