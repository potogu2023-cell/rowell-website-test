import { useState } from "react";
import { trpc } from "@/lib/trpc";

const reviewedBlogs = [
  {
    slug: "pfas-testing-water-food-sample-preparation-calibration-standards",
    title: "PFAS Testing in Water and Food: Sample Preparation and Calibration Planning",
  },
  {
    slug: "c18-spe-cartridge-selection-bed-mass-reservoir-volume-method-development",
    title: "C18 SPE Cartridge Selection: Bed Mass, Reservoir Volume, and Method Development",
  },
  {
    slug: "hplc-consumables-sample-preparation-qc-selection-checklist",
    title: "Choosing HPLC Consumables for Reliable Sample Preparation and Routine QC",
  },
] as const;

export default function AdminBlogPublish() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publishMutation = trpc.blogPublish.publishNovemberBatch.useMutation();

  const publish = async () => {
    setError(null);
    setResult(null);
    try {
      const response = await publishMutation.mutateAsync({
        confirmation: "PUBLISH_ROWELL_NOV_2026",
        editorialStatus: "approved",
        scheduleStatus: "scheduled",
        slugs: reviewedBlogs.map(blog => blog.slug),
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Publication failed");
    }
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin: Publish Reviewed Blogs</h1>
      <p className="mt-3 text-slate-600">
        This page publishes only the fixed, reviewed November batch. It never reads customer inquiries.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <strong>Approval gate:</strong> editorial status approved; schedule status scheduled; duplicate slugs are rejected.
      </div>
      <ol className="mt-6 space-y-3">
        {reviewedBlogs.map(blog => (
          <li key={blog.slug} className="rounded-lg border bg-white p-4">
            <div className="font-semibold">{blog.title}</div>
            <div className="mt-1 text-sm text-slate-500">/resources/{blog.slug}</div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={publish}
        disabled={publishMutation.isPending || Boolean(result)}
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {publishMutation.isPending ? "Publishing…" : result ? "Published" : "Publish reviewed batch"}
      </button>
      {error && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</pre>}
      {result && <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{result}</pre>}
    </main>
  );
}
