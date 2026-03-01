import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, ChevronRight, ChevronLeft,
  ChevronRight as ChevronRightIcon, MessageCircle
} from "lucide-react";
import CustomerMessageForm from "@/components/CustomerMessageForm";
import { toast } from "sonner";

export default function StandardsSearch() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Parse query from URL
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const initialQuery = urlParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; partNumber: string } | null>(null);
  const PAGE_SIZE = 20;

  const { data: results, isLoading } = trpc.standards.search.useQuery(
    { query: activeQuery, page, pageSize: PAGE_SIZE },
    { enabled: activeQuery.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      setActiveQuery(q);
      setPage(1);
      navigate(`/standards/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleInquiry = (product: { id: string; name: string; partNumber: string }) => {
    setSelectedProduct(product);
    setTimeout(() => {
      const form = document.getElementById("standards-inquiry-form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        toast.success("Product added to inquiry form");
      }
    }, 100);
  };

  const totalPages = results ? Math.ceil(results.total / PAGE_SIZE) : 0;
  const fromItem = results ? (page - 1) * PAGE_SIZE + 1 : 0;
  const toItem = results ? Math.min(page * PAGE_SIZE, results.total) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-10 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/standards" className="hover:text-foreground transition-colors">
              {t("standards.nav_label")}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{t("standards.search_button")}</span>
          </nav>

          <h1 className="text-2xl font-bold mb-4">{t("standards.hero_search_title")}</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("standards.search_placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-12 text-base bg-white"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 bg-emerald-700 hover:bg-emerald-800">
              {t("standards.search_button")}
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-muted-foreground">{t("standards.loading")}</span>
          </div>
        )}

        {/* No query */}
        {!activeQuery && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("standards.search_placeholder")}</p>
          </div>
        )}

        {/* No Results */}
        {results && results.items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">{t("standards.no_results")}</p>
            <p className="text-sm text-muted-foreground mt-2">{t("standards.no_results_hint")}</p>
            <Link href="/standards">
              <Button variant="outline" className="mt-4">
                {t("standards.browse_by_category")}
              </Button>
            </Link>
          </div>
        )}

        {/* Results count */}
        {results && results.items.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t("standards.showing_results", {
                from: fromItem,
                to: toItem,
                total: results.total.toLocaleString(),
              })}
            </p>

            {/* Products Table */}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t("standards.catalog_number")}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Product Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t("standards.cas_number")}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t("standards.specification")}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t("standards.price_label")}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.items.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Link href={`/standards/product/${product.slug || product.part_number}`}>
                          <span className="font-mono text-xs text-emerald-700 hover:underline cursor-pointer">
                            {product.part_number}
                          </span>
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link href={`/standards/product/${product.slug || product.part_number}`}>
                          <span className="font-medium hover:text-emerald-700 cursor-pointer line-clamp-2 max-w-xs">
                            {product.name_en}
                          </span>
                        </Link>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {product.cas_number || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs max-w-xs">
                        {product.specification || "—"}
                      </td>
                      <td className="p-3">
                        {product.category_slug && (
                          <Link href={`/standards/category/${product.category_slug}`}>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:border-emerald-400">
                              {t(`standards.categories.${product.category_slug}`, { defaultValue: product.category_slug })}
                            </Badge>
                          </Link>
                        )}
                      </td>
                      <td className="p-3">
                        {product.price_usd ? (
                          <span className="font-semibold text-emerald-700">
                            ${parseFloat(product.price_usd).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("standards.price_on_request")}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleInquiry({
                            id: String(product.id),
                            name: product.name_en,
                            partNumber: product.part_number,
                          })}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {t("standards.add_to_inquiry")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("standards.prev_page")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("standards.page_of", { page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t("standards.next_page")}
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Inquiry Form */}
        <div id="standards-inquiry-form" className="mt-12">
          <CustomerMessageForm
            productId={selectedProduct?.id}
            productName={selectedProduct ? `${selectedProduct.partNumber} - ${selectedProduct.name}` : undefined}
            title={t("standards.request_quote")}
            description="Please provide your contact information and we will send you a quote within 24 hours."
          />
        </div>
      </div>
    </div>
  );
}
