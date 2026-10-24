import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";

const title = "C18 SPE Cartridge Selection: Bed Mass & Volume | ROWELL";
const description = "A practical C18 SPE method-development guide covering bed mass, reservoir volume, loading, washing, elution, and verification boundaries.";

export default function C18SpeGuide() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead title={title} description={description} url="/guides/c18-spe-cartridge-selection" />
      <article className="container max-w-4xl py-10 text-slate-800">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
          <Link href="/resources">Technical Resources</Link> <span aria-hidden="true">/</span>{" "}
          <span>C18 SPE Cartridge Selection</span>
        </nav>
        <header className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">Technical Guide</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">C18 SPE Cartridge Selection: Bed Mass &amp; Volume</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">A practical method-development framework for comparing bed mass, reservoir volume, loading, washing, elution, and verification boundaries.</p>
          <p className="mt-3 text-sm text-slate-500">Prepared by ROWELL Technical Editorial. This guide is general selection information and does not replace manufacturer documentation or laboratory validation.</p>
        </header>

        <div className="space-y-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <section>
            <h2 className="text-2xl font-semibold text-slate-950">Start with the method question</h2>
            <p className="mt-4 leading-7">Define the analyte group, sample matrix, loading objective, and cleanup requirement before selecting a cartridge configuration. A catalog dimension is a starting point for method development, not evidence of a guaranteed result.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950">Bed mass and reservoir volume</h2>
            <p className="mt-4 leading-7">Bed mass is one of the variables to evaluate when a method may be limited by sorbent capacity or matrix loading. Reservoir volume affects handling and loading workflow. The relationship between dimensions and method performance must be checked with the selected product, representative samples, and the intended solvent system.</p>
            <p className="mt-4 leading-7">A larger format is not automatically a better format. It can change solvent use, evaporation workload, sample handling, and the practical way a laboratory controls loading and elution. Record these trade-offs during screening rather than inferring performance from size alone.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950">Recorded series references</h2>
            <p className="mt-4 leading-7">The following ROWELL Matrix pages summarize recorded catalog variants. Review the exact part number and the manufacturer documentation before using any record in a method.</p>
            <ul className="mt-4 space-y-3 list-disc pl-6">
              <li><Link className="font-medium text-emerald-700 hover:underline" href="/products/matrix/hypersep-c18">HyperSep C18 recorded matrix</Link></li>
              <li><Link className="font-medium text-emerald-700 hover:underline" href="/products/matrix/bond-elut-c18">Bond Elut C18 recorded matrix</Link></li>
              <li><Link className="font-medium text-emerald-700 hover:underline" href="/products/matrix/bakerbond-c18">BAKERBOND C18 recorded matrix</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950">A practical verification checklist</h2>
            <ol className="mt-4 space-y-3 list-decimal pl-6 leading-7">
              <li>Confirm the exact part number, recorded dimensions, sorbent description, and manufacturer instructions.</li>
              <li>Define conditioning, loading, washing, and elution steps before comparing configurations.</li>
              <li>Check blanks and background signals using the same materials and handling path as the intended method.</li>
              <li>Evaluate breakthrough, recovery, repeatability, and matrix effects with representative samples.</li>
              <li>Document the selected configuration and the evidence supporting the final method choice.</li>
            </ol>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-semibold text-slate-950">Technical inquiry</h2>
            <p className="mt-4 leading-7">For a technical product inquiry, provide the exact part number, sample matrix, analyte group, and intended workflow so the catalog record can be reviewed accurately.</p>
            <Link href="/contact" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">Contact ROWELL</Link>
          </section>
        </div>
      </article>
    </div>
  );
}
