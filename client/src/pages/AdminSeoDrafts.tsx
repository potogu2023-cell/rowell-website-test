import { useState } from "react";
import { trpc } from "@/lib/trpc";

const reviewedDraft = {
  batchId: "rowell-gsc-low-ctr-2026-11-15-01",
  items: [
    {
      id: 60130,
      slug: "993967-902",
      brand: "Agilent",
      partNumber: "993967-902",
      sourceQuery: "993967-902",
      impressions: 27,
      clicks: 0,
      ctr: 0,
      position: 15.6,
      currentMetaTitle: "Agilent ZORBAX Eclipse XDB-C18 5um 4.6x150mm 993967-902 | ROWELL",
      currentMetaDescription: "Agilent ZORBAX Eclipse XDB-C18, 5 um, 4.6 x 150 mm (993967-902) at ROWELL. Review listed specifications and request availability or a quote.",
      draftMetaTitle: "Agilent 993967-902 ZORBAX XDB-C18 4.6 x 150 mm | ROWELL",
      draftMetaDescription: "Review Agilent 993967-902 ZORBAX XDB-C18 specifications, including 5 µm particles and 4.6 x 150 mm format. Submit an RFQ to ROWELL.",
      evidence: { name: "ZORBAX Eclipse XDB-C18, 4.6 × 150 mm, 5 µm", poreSize: "80 Å", columnLength: "150mm", innerDiameter: "4.6mm", usp: "L1" },
    },
    {
      id: 120001,
      slug: "186002353",
      brand: "Waters",
      partNumber: "186002353",
      sourceQuery: "186002353",
      impressions: 26,
      clicks: 0,
      ctr: 0,
      position: 8.7,
      currentMetaTitle: "Waters ACQUITY BEH C18 2.1mm x 150mm 1.7µm 186002353 | ROWELL",
      currentMetaDescription: "Waters ACQUITY UPLC BEH C18 column, 130 Å, 1.7µm, 2.1mm x 150mm (186002353). Review listed specifications and request a quote.",
      draftMetaTitle: "Waters 186002353 ACQUITY BEH C18 UPLC Column | ROWELL",
      draftMetaDescription: "Review Waters 186002353 ACQUITY UPLC BEH C18 specifications: 130 Å, 1.7 µm, and 2.1 x 150 mm. Submit an RFQ to ROWELL.",
      evidence: { name: "ACQUITY UPLC BEH C18 Column, 130Å, 1.7µm, 2.1mm × 150mm", poreSize: "130 Å", particleSize: "1.7µm", columnLength: "150mm", innerDiameter: "2.1mm", usp: "L1" },
    },
    {
      id: 60033,
      slug: "00g-4601-e0",
      brand: "Phenomenex",
      partNumber: "00G-4601-E0",
      sourceQuery: "00g-4601-e0",
      impressions: 17,
      clicks: 0,
      ctr: 0,
      position: 7.1,
      currentMetaTitle: "Phenomenex 00G-4601-E0 Column - RFQ | ROWELL",
      currentMetaDescription: "Request product information for Phenomenex 00G-4601-E0 LC column. Review listed specifications and submit an RFQ to ROWELL for laboratory requirements.",
      draftMetaTitle: "Phenomenex 00G-4601-E0 Kinetex C18 LC Column | ROWELL",
      draftMetaDescription: "Review Phenomenex 00G-4601-E0 Kinetex C18 specifications: 5 µm particles, 100 Å, and 250 x 4.6 mm. Submit an RFQ to ROWELL.",
      evidence: { name: "Kinetex 5 µm C18 100 Å, LC Column 250 x 4.6 mm", poreSize: "100A", particleSize: "5um", columnLength: "250mm", innerDiameter: "4.6mm", usp: "L1" },
    },
    {
      id: 90150,
      slug: "ace-121-1546",
      brand: "Avantor",
      partNumber: "ACE-121-1546",
      sourceQuery: "ace-121-1546",
      impressions: 7,
      clicks: 0,
      ctr: 0,
      position: 14.3,
      currentMetaTitle: "Avantor ACE 5 C18, 150 x 4.6 mm ACE-121-1546 | ROWELL",
      currentMetaDescription: "Avantor ACE 5 C18, 150 x 4.6 mm (ACE-121-1546) at ROWELL. Review listed specifications and request availability or a quote.",
      draftMetaTitle: "Avantor ACE-121-1546 ACE 5 C18 HPLC Column | ROWELL",
      draftMetaDescription: "Review Avantor ACE-121-1546 ACE 5 C18 specifications: 5 µm particles, 100 Å, and 150 x 4.6 mm. Submit an RFQ to ROWELL.",
      evidence: { name: "ACE 5 C18, 150 x 4.6 mm", poreSize: "100A", particleSize: "5um", columnLength: "150mm", innerDiameter: "4.6mm", phRange: "2-8", usp: "L1" },
    },
  ],
} as const;

export default function AdminSeoDrafts() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const registerMutation = trpc.seoDrafts.registerManualBatch.useMutation();
  const publishMutation = trpc.seoDrafts.publishApprovedBatch.useMutation();

  const publish = async () => {
    setError(null);
    setResult(null);
    try {
      const registered = await registerMutation.mutateAsync({
        ...reviewedDraft,
        items: [...reviewedDraft.items],
      });
      const published = await publishMutation.mutateAsync({
        draftIds: registered.draftIds,
        items: [...reviewedDraft.items],
      });
      setResult(JSON.stringify({ registered, published }, null, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SEO publication failed");
    }
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin: SEO Metadata Drafts</h1>
      <p className="mt-3 text-slate-600">
        This protected page handles only the four approved GSC low-CTR drafts. It never reads customer inquiries and never changes URLs, product facts, images, status, structured data, price, or inventory.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <strong>Controlled publication:</strong> each product is checked by id, slug, brand, part number, active status, and current metadata inside one database transaction. The protected experiment URLs are excluded.
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50"><tr><th className="p-3">Product</th><th className="p-3">Current title</th><th className="p-3">Approved title</th></tr></thead>
          <tbody>{reviewedDraft.items.map(item => <tr key={item.id} className="border-b last:border-0"><td className="p-3 font-semibold">{item.brand} {item.partNumber}</td><td className="max-w-sm p-3 text-slate-600">{item.currentMetaTitle}</td><td className="max-w-sm p-3">{item.draftMetaTitle}</td></tr>)}</tbody>
        </table>
      </div>
      <button type="button" onClick={publish} disabled={registerMutation.isPending || publishMutation.isPending || Boolean(result)} className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        {registerMutation.isPending || publishMutation.isPending ? "Publishing…" : result ? "Published" : "Publish approved four-page batch"}
      </button>
      {error && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</pre>}
      {result && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{result}</pre>}
    </main>
  );
}
