import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

function parsePartNumbers(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean)));
}

export default function AdminProductLookup() {
  const [rawInput, setRawInput] = useState("00F-4495-E0\n91324\n186005407\n81524\n00F-4622-E0\n00F-4601-E0");
  const [submitted, setSubmitted] = useState<string[]>([]);
  const partNumbers = useMemo(() => parsePartNumbers(rawInput), [rawInput]);
  const lookup = trpc.adminProductLookup.byPartNumbers.useQuery(
    { partNumbers: submitted },
    { enabled: submitted.length > 0, retry: false },
  );

  const runLookup = () => {
    if (partNumbers.length === 0 || partNumbers.length > 20) return;
    setSubmitted(partNumbers);
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin: Read-only Product Lookup</h1>
      <p className="mt-3 text-slate-600">
        This protected tool reads only exact product identity fields needed for reviewed SEO drafts.
        It never writes products, metadata, customer data, or product facts.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <strong>Read-only boundary:</strong> exact manufacturer part numbers only; maximum 20 per query;
        returned fields are <code>id</code>, <code>partNumber</code>, <code>brand</code>, and <code>status</code>.
      </div>
      <label className="mt-6 block text-sm font-semibold" htmlFor="part-numbers">
        Manufacturer part numbers
      </label>
      <textarea
        id="part-numbers"
        value={rawInput}
        onChange={(event) => setRawInput(event.target.value)}
        rows={8}
        className="mt-2 w-full rounded-md border border-slate-300 p-3 font-mono text-sm"
        placeholder="One part number per line"
      />
      <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
        <span>{partNumbers.length}/20 requested</span>
        <button
          type="button"
          onClick={runLookup}
          disabled={partNumbers.length === 0 || partNumbers.length > 20 || lookup.isFetching}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {lookup.isFetching ? "Reading…" : "Read exact identities"}
        </button>
      </div>
      {lookup.error && (
        <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {lookup.error.message}
        </pre>
      )}
      {lookup.data && (
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold">Found ({lookup.data.found.length})</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50">
                  <tr><th className="p-3">id</th><th className="p-3">partNumber</th><th className="p-3">brand</th><th className="p-3">status</th></tr>
                </thead>
                <tbody>
                  {lookup.data.found.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-3 font-mono">{row.id}</td>
                      <td className="p-3 font-mono">{row.partNumber}</td>
                      <td className="p-3">{row.brand}</td>
                      <td className="p-3">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Missing ({lookup.data.missing.length})</h2>
            {lookup.data.missing.length > 0 ? (
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm">
                {lookup.data.missing.join(", ")}
              </p>
            ) : <p className="mt-2 text-slate-600">None</p>}
          </section>
        </div>
      )}
    </main>
  );
}
