import { Link, useRoute } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CATEGORY_LANDING_PROFILES } from "@shared/categoryLandingContent";

export default function CategoryLanding() {
  const [, params] = useRoute("/categories/:slug");
  const profile = params?.slug ? CATEGORY_LANDING_PROFILES[params.slug] : undefined;

  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Category Not Found</h1>
        <p className="mt-4 text-slate-600">Browse ROWELL's current chromatography product catalog.</p>
        <Link href="/products" className="mt-6 inline-flex text-primary underline">Browse products</Link>
      </section>
    );
  }

  const catalogHref = profile.catalogHref ?? `/products?category=${encodeURIComponent(profile.catalogSlug)}`;
  return (
    <div className="bg-white">
      <section className="border-b bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{profile.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">{profile.heading}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={catalogHref} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              Browse {profile.name}<ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/resources" className="inline-flex items-center rounded-md border border-slate-300 px-5 py-3 font-medium text-slate-800 hover:bg-slate-50">
              Explore Technical Resources
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.3fr_0.7fr] lg:py-20">
        <article>
          <h2 className="text-2xl font-semibold text-slate-950">Selection Considerations</h2>
          <p className="mt-5 leading-8 text-slate-700">{profile.overview}</p>
          <ul className="mt-8 space-y-4">
            {profile.selectionPoints.map((point) => (
              <li key={point} className="flex gap-3 text-slate-700"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{point}</li>
            ))}
          </ul>
        </article>
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="text-xl font-semibold text-slate-950">Find Compatible Products</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Use the catalog to review current products, compare available specifications, and request sourcing support for your method.</p>
          <Link href={catalogHref} className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:underline">Open {profile.name} catalog <ArrowRight className="h-4 w-4" /></Link>
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
