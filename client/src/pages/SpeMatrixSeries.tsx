import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Check, ImageOff, MessageCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SEOHead } from "@/components/SEOHead";
import CustomerMessageForm from "@/components/CustomerMessageForm";
import { getSpeMatrixSeries } from "@shared/speMatrixData";
import { buildMatrixInquiryContext } from "@shared/speMatrix";

function displayValue(value: string | null | undefined) {
  return value && !/^(?:n\/a|n\/|none|null|-)$/i.test(value.trim()) ? value : "—";
}

export default function SpeMatrixSeries() {
  const { seriesSlug = "" } = useParams<{ seriesSlug: string }>();
  const [, setLocation] = useLocation();
  const series = getSpeMatrixSeries(seriesSlug);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [imageFailed, setImageFailed] = useState(false);

  const selectedVariants = useMemo(
    () => series?.variants.filter((variant) => selectedIds.includes(variant.id)) || [],
    [series, selectedIds],
  );
  const selectedSummary = useMemo(
    () => series ? buildMatrixInquiryContext(series.seriesName, selectedVariants) : "",
    [series, selectedVariants],
  );
  const representative = series?.variants.find((variant) => Boolean(variant.imageUrl));
  const sharedParticleSize = series?.variants.every((variant) => variant.particleSize === series.variants[0]?.particleSize)
    ? series.variants[0]?.particleSize
    : null;
  const sharedPoreSize = series?.variants.every((variant) => variant.poreSize === series.variants[0]?.poreSize)
    ? series.variants[0]?.poreSize
    : null;

  if (!series) {
    return (
      <main className="container py-16">
        <SEOHead title="SPE Matrix Not Found | ROWELL" description="The requested SPE cartridge matrix could not be found." url={`/products/matrix/${seriesSlug}`} />
        <Card className="mx-auto max-w-xl text-center">
          <CardHeader>
            <CardTitle>Series matrix not found</CardTitle>
            <CardDescription>This series is not available in the current local matrix catalog.</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => setLocation("/products")}><ArrowLeft className="mr-2 h-4 w-4" />Back to products</Button></CardContent>
        </Card>
      </main>
    );
  }

  const toggleVariant = (id: number) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const selectAll = () => setSelectedIds(selectedIds.length === series.variants.length ? [] : series.variants.map((variant) => variant.id));
  const focusInquiry = () => {
    if (!selectedVariants.length) {
      toast.error("Select at least one variant before requesting a quote.");
      return;
    }
    document.getElementById("matrix-inquiry-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success(`${selectedVariants.length} variant${selectedVariants.length === 1 ? "" : "s"} added to the inquiry context.`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title={`${series.seriesName} SPE Cartridges | ROWELL`}
        description={`Compare ${series.skuCount} ${series.seriesName} SPE cartridge variants by bed mass, volume, particle size, and P/N. Request a quote from ROWELL.`}
        url={`/products/matrix/${seriesSlug}`}
        image={representative?.imageUrl || undefined}
      />
      <div className="container py-8">
        <Link href="/products" className="mb-6 inline-flex items-center text-sm font-medium text-slate-600 hover:text-emerald-700">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to product catalog
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]" aria-labelledby="matrix-series-title">
          <div>
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-700">SPE Matrix</Badge>
                  <Badge variant="outline">{series.skuCount} variants</Badge>
                </div>
                <h1 id="matrix-series-title" className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{series.seriesName}</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Compare available SPE cartridge configurations and select one or more variants for a consolidated laboratory quote.</p>
              </div>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Variant Matrix</CardTitle>
                    <CardDescription>Choose individual rows or select the complete series.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll} data-testid="matrix-select-all">
                    <Check className="mr-2 h-4 w-4" />{selectedIds.length === series.variants.length ? "Clear all" : "Select all"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm" data-testid="matrix-variant-table">
                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="w-12 px-5 py-4"><span className="sr-only">Select</span></th>
                        <th className="px-3 py-4">Part Number</th>
                        <th className="px-3 py-4">Bed Mass</th>
                        <th className="px-3 py-4">Volume</th>
                        <th className="px-3 py-4">Particle Size</th>
                        <th className="px-3 py-4">Pore Size</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {series.variants.map((variant) => {
                        const selected = selectedIds.includes(variant.id);
                        return (
                          <tr key={variant.id} className={`transition-colors ${selected ? "bg-emerald-50" : "bg-white hover:bg-slate-50"}`} data-testid={`matrix-row-${variant.id}`}>
                            <td className="px-5 py-4 align-middle"><Checkbox checked={selected} onCheckedChange={() => toggleVariant(variant.id)} aria-label={`Select ${variant.partNumber || variant.name}`} /></td>
                            <td className="px-3 py-4 align-middle"><div className="font-semibold text-slate-950">{displayValue(variant.partNumber)}</div><div className="mt-1 max-w-[260px] text-xs text-slate-500">{variant.name}</div></td>
                            <td className="px-3 py-4 align-middle font-medium text-slate-700">{displayValue(variant.bedMass)}</td>
                            <td className="px-3 py-4 align-middle font-medium text-slate-700">{displayValue(variant.volume)}</td>
                            <td className="px-3 py-4 align-middle text-slate-700">{displayValue(variant.particleSize)}</td>
                            <td className="px-3 py-4 align-middle text-slate-700">{displayValue(variant.poreSize)}</td>
                            <td className="px-5 py-4 text-right align-middle"><Button variant="ghost" size="sm" onClick={() => { setSelectedIds([variant.id]); setTimeout(focusInquiry, 0); }}><MessageCircle className="mr-1.5 h-4 w-4" />Quote</Button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-sm text-slate-600"><strong className="text-slate-950">{selectedVariants.length}</strong> variant{selectedVariants.length === 1 ? "" : "s"} selected</p>
                  <Button onClick={focusInquiry} disabled={!selectedVariants.length} data-testid="matrix-request-quote"><MessageCircle className="mr-2 h-4 w-4" />Request quote for selected</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div className="flex aspect-square items-center justify-center bg-white p-6">
                {representative?.imageUrl && !imageFailed ? <img src={representative.imageUrl} alt={`${series.seriesName} SPE cartridge`} className="max-h-full max-w-full object-contain" onError={() => setImageFailed(true)} /> : <ImageOff className="h-12 w-12 text-slate-300" aria-label="Product image unavailable" />}
              </div>
              <CardHeader><CardTitle className="text-lg">Series information</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-0 text-sm">
                <div className="flex items-center gap-2 text-slate-700"><PackageCheck className="h-4 w-4 text-emerald-700" /><span>Brand: <strong>{representative?.brand || "—"}</strong></span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Particle size</div><div className="mt-1 font-semibold text-slate-900">{sharedParticleSize ? displayValue(sharedParticleSize) : "Multiple"}</div></div>
                  <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Pore size</div><div className="mt-1 font-semibold text-slate-900">{sharedPoreSize ? displayValue(sharedPoreSize) : "Multiple"}</div></div>
                </div>
                <p className="text-xs leading-5 text-slate-500">Common series attributes are shown here; confirm the selected row’s exact specification before purchase.</p>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section id="matrix-inquiry-form" className="mx-auto mt-10 max-w-4xl scroll-mt-8" aria-labelledby="matrix-inquiry-title">
          <CustomerMessageForm
            productId={`matrix:${seriesSlug}`}
            productName={series.seriesName}
            productPartNumber={selectedVariants.map((variant) => variant.partNumber || variant.productId || "P/N pending").join(", ") || undefined}
            specification={selectedSummary || "Select one or more matrix variants above to prefill this inquiry."}
            title="Request a quote for matrix variants"
            description="Selected P/Ns and variant specifications are prefilled below. Add your quantity and application details."
          />
          <p id="matrix-inquiry-title" className="mt-3 text-center text-xs text-slate-500">{selectedVariants.length ? `${selectedVariants.length} selected variant${selectedVariants.length === 1 ? "" : "s"} will be included in the inquiry context.` : "Select a matrix row to prepare an inquiry."}</p>
        </section>
      </div>
    </div>
  );
}
