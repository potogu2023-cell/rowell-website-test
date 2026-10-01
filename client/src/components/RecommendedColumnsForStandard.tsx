import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Columns3 } from "lucide-react";
import { recommendedColumnPath } from "@shared/crossLinking";

interface RecommendedColumnsForStandardProps {
  standardCategorySlug?: string | null;
}

export default function RecommendedColumnsForStandard({
  standardCategorySlug,
}: RecommendedColumnsForStandardProps) {
  const { data: columns, isLoading } = trpc.products.getRecommendedForStandard.useQuery({
    standardCategorySlug: standardCategorySlug || undefined,
    limit: 4,
  });

  if (isLoading || !columns || columns.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="recommended-columns-heading">
      <div className="flex items-center gap-3 mb-6">
        <Columns3 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 id="recommended-columns-heading" className="text-xl font-bold">
            Recommended Chromatography Columns
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Related Analytical Consumables for routine method development and reference-standard analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <a
            key={column.id}
            href={recommendedColumnPath(column.slug)}
            className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg"
          >
            <Card className="h-full hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-lg">
                <img
                  src={column.imageUrl || "/images/hplc-column-placeholder.png"}
                  alt={column.name || column.productId}
                  className="max-w-full max-h-full object-contain p-3"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = "/images/hplc-column-placeholder.png";
                  }}
                />
              </div>
              <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2">{column.productType}</Badge>
                <p className="font-mono text-xs text-emerald-700 mb-1">{column.productId}</p>
                <h3 className="font-semibold text-sm line-clamp-2 min-h-10">{column.name || column.productId}</h3>
                {column.phaseType && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{column.phaseType}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-medium mt-3">
                  View column <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
