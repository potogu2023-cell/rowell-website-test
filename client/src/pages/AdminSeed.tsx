import { useState } from 'react';
import { trpc } from '../lib/trpc';

export default function AdminSeed() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedMutation = trpc.seedArticles.execute.useMutation();

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await seedMutation.mutateAsync();
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to seed articles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin: Seed Learning Center Articles</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Warning:</strong> This operation will import 18 articles and 4 author profiles into the database.
          Articles with duplicate slugs will be skipped.
        </p>
      </div>

      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Seeding...' : 'Seed Articles'}
      </button>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <pre className="text-red-700 text-sm">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-green-800 font-semibold mb-4">Seeding Complete!</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Authors:</strong>
              <ul className="ml-4 mt-1">
                <li>✓ Created: {result.authorsCreated}</li>
                <li>- Already existed: {result.authorsExisted}</li>
              </ul>
            </div>
            <div>
              <strong>Articles:</strong>
              <ul className="ml-4 mt-1">
                <li>✓ Created: {result.articlesCreated}</li>
                <li>- Already existed: {result.articlesExisted}</li>
                <li>✗ Errors: {result.articlesError}</li>
                <li>📊 Total processed: {result.totalArticles}</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-300">
            <a
              href="/learning"
              className="text-green-700 hover:text-green-900 underline"
            >
              → View Learning Center
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
