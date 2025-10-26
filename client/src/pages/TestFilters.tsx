import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function TestFilters() {
  const [testResult, setTestResult] = useState<string>("");

  const testDirectCall = async () => {
    const params = {
      particleSizeMin: 3,
      page: 1,
      pageSize: 24,
    };

    console.log("Testing with params:", params);
    setTestResult("Testing... check console");
  };

  // Test with tRPC hook
  const { data, isLoading, error } = trpc.products.list.useQuery({
    particleSizeMin: 3,
    page: 1,
    pageSize: 24,
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Filter Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">tRPC Hook Test</h2>
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Error: {error ? error.message : "None"}</p>
          <p>Total Products: {data?.total || 0}</p>
          <p>Products Count: {data?.products?.length || 0}</p>
        </div>

        <div>
          <button
            onClick={testDirectCall}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test Direct Call
          </button>
          <p>{testResult}</p>
        </div>

        <div>
          <h3 className="font-semibold">Query Params:</h3>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ particleSizeMin: 3, page: 1, pageSize: 24 }, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Response Data:</h3>
          <pre className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

