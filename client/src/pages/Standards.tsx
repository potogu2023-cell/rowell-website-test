import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FlaskConical, Loader2, ArrowRight, ChevronRight } from "lucide-react";

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  "pesticide-residue": "🌾",
  "veterinary-drug": "🐄",
  "mycotoxin": "🍄",
  "food-additive": "🍱",
  "pahs-pops": "🏭",
  "environmental": "🌍",
  "pharmaceutical": "💊",
  "isotope-labeled": "⚛️",
  "natural-products": "🌿",
  "cosmetic": "✨",
  "other-chemical": "🧪",
};

export default function Standards() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: catLoading } = trpc.standards.listCategories.useQuery();
  const { data: stats } = trpc.standards.getStats.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/standards/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 py-16 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{t("standards.nav_label")}</span>
          </nav>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FlaskConical className="h-8 w-8 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {t("standards.page_title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                {t("standards.page_subtitle")}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {stats ? stats.total.toLocaleString() : "18,000+"}
              </span>
              <span className="text-sm text-muted-foreground">{t("standards.hero_stat_products")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {stats ? stats.categories : "11"}
              </span>
              <span className="text-sm text-muted-foreground">{t("standards.hero_stat_categories")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-700">ANPEL</span>
              <span className="text-sm text-muted-foreground">{t("standards.hero_stat_brands")}</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("standards.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-white"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 bg-emerald-700 hover:bg-emerald-800">
              {t("standards.search_button")}
            </Button>
          </form>

          {/* Online Catalog Banner */}
          <div className="mt-6 max-w-2xl">
            <a
              href="https://rowellcatalogmigration.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 px-5 py-4 bg-white border border-emerald-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {t("standards.catalog_link_title", "Browse Full Online Catalog")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("standards.catalog_link_desc", "18,000+ reference standards · Searchable · Instant access")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-medium text-sm flex-shrink-0">
                {t("standards.catalog_link_cta", "Open Catalog")}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">{t("standards.browse_by_category")}</h2>

        {catLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-muted-foreground">{t("standards.loading")}</span>
          </div>
        )}

        {categories && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/standards/category/${cat.slug}`}>
                <Card className="h-full hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" role="img" aria-label={cat.name_en}>
                          {CATEGORY_ICONS[cat.slug] || "🧪"}
                        </span>
                        <div>
                          <CardTitle className="text-base leading-tight group-hover:text-emerald-700 transition-colors">
                            {t(`standards.categories.${cat.slug}`, { defaultValue: cat.name_en })}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {t("standards.products_count", { count: cat.product_count.toLocaleString() })}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  {cat.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {cat.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Note about product names */}
        <p className="mt-8 text-sm text-muted-foreground text-center italic">
          {t("standards.note_product_name")}
        </p>
      </div>
    </div>
  );
}
