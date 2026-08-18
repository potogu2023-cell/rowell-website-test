import { Link, useRoute } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { USP_LANDING_PROFILES } from "@shared/uspLandingContent";

export default function USPClassificationDetail() {
  const [, params] = useRoute("/usp/:code");
  const code = params?.code?.toLowerCase();
  const profile = code ? USP_LANDING_PROFILES[code] : undefined;

  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">USP Classification Not Found</h1>
        <p className="mt-4 text-slate-600">Browse ROWELL&apos;s recorded USP stationary-phase classifications and current chromatography catalog.</p>
        <Link href="/usp-standards" className="mt-6 inline-flex text-primary underline">Browse USP classifications</Link>
      </section>
    );
  }

  const catalogHref = `/products?usp=${encodeURIComponent(profile.code)}`;
  return (
    <div className="bg-white">
      <section className="border-b bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href="/" className="hover:text-primary hover:underline">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/usp-standards" className="hover:text-primary hover:underline">USP Column Classification</Link>
            <span aria-hidden="true"> / </span>
            <span>{profile.code}</span>
          </nav>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">USP stationary-phase classification</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">{profile.heading}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={catalogHref} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              Browse products recorded with {profile.code}<ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/usp-standards" className="inline-flex items-center rounded-md border border-slate-300 px-5 py-3 font-medium text-slate-800 hover:bg-slate-50">
              View all USP classifications
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.3fr_0.7fr] lg:py-20">
        <article>
          <h2 className="text-2xl font-semibold text-slate-950">How to use the {profile.code} classification</h2>
          <p className="mt-5 leading-8 text-slate-700">{profile.overview}</p>
          <ul className="mt-8 space-y-4">
            {profile.selectionPoints.map((point) => (
              <li key={point} className="flex gap-3 text-slate-700"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{point}</li>
            ))}
          </ul>
        </article>
        <aside className="space-y-5">
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-slate-950">Classification is not product certification</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">The USP L-code is a stationary-phase classification. It does not mean USP approval, endorsement, certification, or automatic suitability as a method replacement.</p>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-7">
            <h2 className="text-xl font-semibold text-slate-950">Review current catalog products</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">The catalog can include different product formats. Check the exact product type and part number before requesting a quote or starting method work.</p>
            <Link href={catalogHref} className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:underline">Open {profile.code} product filter <ArrowRight className="h-4 w-4" /></Link>
          </section>
        </aside>
      </main>

      <section className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <h2 className="text-2xl font-semibold text-slate-950">Frequently Asked Questions</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {profile.faq.map((item) => (
              <article key={item.question} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
