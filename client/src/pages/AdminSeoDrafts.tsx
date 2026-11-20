import { useState } from "react";
import { trpc } from "@/lib/trpc";

const reviewedDraft = {
  batchId: "rowell-gsc-low-ctr-2026-11-19-01-and-02",
  items: [
    {
      "id": 60101,
      "slug": "00f-4495-e0",
      "brand": "Phenomenex",
      "partNumber": "00F-4495-E0",
      "sourceQuery": "00f-4495-e0",
      "impressions": 103,
      "clicks": 0,
      "ctr": 0,
      "position": 6.7,
      "currentMetaTitle": "Phenomenex Kinetex 2.6 µm Phenyl-Hexyl 100 Å, 00F-4495-E0 | ROWELL",
      "currentMetaDescription": "Phenomenex Kinetex 2.6 µm Phenyl-Hexyl 100 Å, LC Column 250 x 4.6 mm (00F-4495-E0) at ROWELL. Review listed specifications and request availability or a quote.",
      "draftMetaTitle": "Phenomenex 00F-4495-E0 Kinetex Phenyl-Hexyl Column | ROWELL",
      "draftMetaDescription": "Review Phenomenex 00F-4495-E0 Kinetex Phenyl-Hexyl specifications: 2.6 µm, 100 Å, and 250 x 4.6 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "Kinetex 2.6 µm Phenyl-Hexyl 100 Å, LC Column 250 x 4.6 mm"
      }
    },
    {
      "id": 150484,
      "slug": "daicel-91324",
      "brand": "Daicel",
      "partNumber": "91324",
      "sourceQuery": "daicel-91324",
      "impressions": 28,
      "clicks": 0,
      "ctr": 0,
      "position": 6.2,
      "currentMetaTitle": "Daicel CHIRALPAK® IK Analytical column 91324 | ROWELL",
      "currentMetaDescription": "Daicel CHIRALPAK® IK Analytical column (91324) at ROWELL. Review listed specifications and request availability or a quote",
      "draftMetaTitle": "Daicel 91324 CHIRALPAK IK Analytical Column | ROWELL",
      "draftMetaDescription": "Review Daicel 91324 CHIRALPAK IK analytical column specifications, including 4.6 x 150 mm and 5 µm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "CHIRALPAK IK Analytical column",
        "format": "4.6 x 150 mm",
        "particleSize": "5 µm"
      }
    },
    {
      "id": 120010,
      "slug": "186005407",
      "brand": "Waters",
      "partNumber": "186005407",
      "sourceQuery": "186005407",
      "impressions": 26,
      "clicks": 0,
      "ctr": 0,
      "position": 10.5,
      "currentMetaTitle": "Waters CSH Phenyl-Hexyl 2.1x100mm 1.7µm 186005407",
      "currentMetaDescription": "Waters ACQUITY UPLC CSH Phenyl-Hexyl column, 130 Å, 1.7µm, 2.1mm x 100mm (186005407). Review listed specifications and request a quote.",
      "draftMetaTitle": "Waters 186005407 CSH Phenyl-Hexyl UPLC Column | ROWELL",
      "draftMetaDescription": "Review Waters 186005407 CSH Phenyl-Hexyl UPLC column specifications: 130 Å, 1.7 µm, and 2.1 x 100 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "ACQUITY UPLC CSH Phenyl-Hexyl Column",
        "poreSize": "130 Å",
        "particleSize": "1.7 µm",
        "format": "2.1 x 100 mm"
      }
    },
    {
      "id": 90103,
      "slug": "81524",
      "brand": "Daicel",
      "partNumber": "81524",
      "sourceQuery": "81524",
      "impressions": 25,
      "clicks": 0,
      "ctr": 0,
      "position": 9.0,
      "currentMetaTitle": "Daicel CHIRALPAK IB-3 4.6 x 150 mm 3 um 81524 | ROWELL",
      "currentMetaDescription": "Daicel CHIRALPAK IB-3 analytical column, 4.6 x 150 mm, 3 um (81524). Review listed specifications and request a quote.",
      "draftMetaTitle": "Daicel 81524 CHIRALPAK IB-3 Analytical Column | ROWELL",
      "draftMetaDescription": "Review Daicel 81524 CHIRALPAK IB-3 column specifications: 3 µm particles and 4.6 x 150 mm format. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "CHIRALPAK IB-3",
        "format": "4.6 x 150 mm",
        "particleSize": "3 µm"
      }
    },
    {
      "id": 60047,
      "slug": "00f-4622-e0",
      "brand": "Phenomenex",
      "partNumber": "00F-4622-E0",
      "sourceQuery": "00f-4622-e0",
      "impressions": 21,
      "clicks": 0,
      "ctr": 0,
      "position": 7.4,
      "currentMetaTitle": "Phenomenex Kinetex Biphenyl HPLC Column 150 × 4.6 mm | ROWELL",
      "currentMetaDescription": "Phenomenex Kinetex 2.6 µm Biphenyl 100 Å HPLC column, 150 × 4.6 mm (00F-4622-E0). Review verified specifications and request a quote.",
      "draftMetaTitle": "Phenomenex 00F-4622-E0 Kinetex Biphenyl LC Column | ROWELL",
      "draftMetaDescription": "Review Phenomenex 00F-4622-E0 Kinetex Biphenyl specifications: 2.6 µm, 100 Å, and 150 x 4.6 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "Kinetex 2.6 µm Biphenyl 100 Å, LC Column 150 x 4.6 mm"
      }
    },
    {
      "id": 60031,
      "slug": "00f-4601-e0",
      "brand": "Phenomenex",
      "partNumber": "00F-4601-E0",
      "sourceQuery": "00f-4601-e0",
      "impressions": 19,
      "clicks": 0,
      "ctr": 0,
      "position": 9.1,
      "currentMetaTitle": "Phenomenex Kinetex 5 µm C18 100 Å, LC Column 00F-4601-E0 | ROWELL",
      "currentMetaDescription": "Phenomenex Kinetex 5 µm C18 100 Å, LC Column 250 x 4.6 mm (00F-4601-E0) at ROWELL. Review listed specifications and request availability or a quote.",
      "draftMetaTitle": "Phenomenex 00F-4601-E0 Kinetex C18 LC Column | ROWELL",
      "draftMetaDescription": "Review Phenomenex 00F-4601-E0 Kinetex C18 specifications: 5 µm, 100 Å, and 250 x 4.6 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "Kinetex 5 µm C18 100 Å, LC Column 250 x 4.6 mm"
      }
    },
    {
      "id": 60131,
      "slug": "990967-902",
      "brand": "Agilent",
      "partNumber": "990967-902",
      "sourceQuery": "990967-902",
      "impressions": 19,
      "clicks": 0,
      "ctr": 0,
      "position": 7.6,
      "currentMetaTitle": "Agilent ZORBAX Eclipse XDB-C18, 5 um, 4.6 x 250 mm 990967-902 | ROWELL",
      "currentMetaDescription": "Agilent ZORBAX Eclipse XDB-C18, 5 um, 4.6 x 250 mm (990967-902) at ROWELL. Review listed specifications and request availability or a quote.",
      "draftMetaTitle": "Agilent 990967-902 ZORBAX Eclipse C18 Column | ROWELL",
      "draftMetaDescription": "Review Agilent 990967-902 ZORBAX Eclipse XDB-C18 specifications: 5 µm and 4.6 x 250 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "ZORBAX Eclipse XDB-C18, 4.6 × 250 mm, 5 µm",
        "mpn": "990967-902",
        "sku": "990967-902"
      }
    },
    {
      "id": 150452,
      "slug": "daicel-89324",
      "brand": "Daicel",
      "partNumber": "89324",
      "sourceQuery": "daicel-89324",
      "impressions": 19,
      "clicks": 0,
      "ctr": 0,
      "position": 6.3,
      "currentMetaTitle": "Daicel CHIRALPAK® IH Analytical column 89324 | ROWELL",
      "currentMetaDescription": "Daicel CHIRALPAK® IH Analytical column (89324) at ROWELL. Review listed specifications and request availability or a quote",
      "draftMetaTitle": "Daicel 89324 CHIRALPAK IH Analytical Column | ROWELL",
      "draftMetaDescription": "Review Daicel 89324 CHIRALPAK IH analytical column details and request technical information. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "CHIRALPAK® IH Analytical column",
        "mpn": "89324",
        "sku": "89324"
      }
    },
    {
      "id": 60008,
      "slug": "00b-4462-an",
      "brand": "Phenomenex",
      "partNumber": "00B-4462-AN",
      "sourceQuery": "00b-4462-an",
      "impressions": 18,
      "clicks": 0,
      "ctr": 0,
      "position": 16.2,
      "currentMetaTitle": "Phenomenex Kinetex C18 50 x 2.1 mm 00B-4462-AN | ROWELL",
      "currentMetaDescription": "Phenomenex Kinetex C18 100 Å LC column, 50 x 2.1 mm, 2.6 µm (00B-4462-AN). Review listed specifications and request a quote.",
      "draftMetaTitle": "Phenomenex 00B-4462-AN Kinetex C18 Column | ROWELL",
      "draftMetaDescription": "Review Phenomenex 00B-4462-AN Kinetex C18 specifications: 2.6 µm, 100 Å, and 50 x 2.1 mm. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "Kinetex 2.6 µm C18 100 Å, LC Column 50 × 2.1 mm",
        "mpn": "00B-4462-AN",
        "sku": "00B-4462-AN"
      }
    },
    {
      "id": 150373,
      "slug": "daicel-83525",
      "brand": "Daicel",
      "partNumber": "83525",
      "sourceQuery": "daicel-83525",
      "impressions": 14,
      "clicks": 0,
      "ctr": 0,
      "position": 8.2,
      "currentMetaTitle": "Daicel CHIRALPAK® IC-3 Analytical column 83525 | ROWELL",
      "currentMetaDescription": "Daicel CHIRALPAK® IC-3 Analytical column (83525) at ROWELL. Review listed specifications and request availability or a quote",
      "draftMetaTitle": "Daicel 83525 CHIRALPAK IC-3 Analytical Column | ROWELL",
      "draftMetaDescription": "Review Daicel 83525 CHIRALPAK IC-3 analytical column details and request technical information. Submit an RFQ to ROWELL.",
      "evidence": {
        "source": "public SSR Product JSON-LD",
        "name": "CHIRALPAK® IC-3 Analytical column",
        "mpn": "83525",
        "sku": "83525"
      }
    }
  ]
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
        This protected page handles the two approved GSC low-CTR batches (10 products total). It never reads customer inquiries and never changes URLs, product facts, images, status, structured data, price, or inventory.
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
        {registerMutation.isPending || publishMutation.isPending ? "Publishing…" : result ? "Published" : "Publish approved ten-page batch"}
      </button>
      {error && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</pre>}
      {result && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{result}</pre>}
    </main>
  );
}
