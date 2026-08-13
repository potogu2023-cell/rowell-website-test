import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight, ChevronLeft, Loader2, FlaskConical,
  MessageCircle, Tag, Beaker, Hash
} from "lucide-react";
import CustomerMessageForm from "@/components/CustomerMessageForm";

interface StandardsProductDetailProps {
  params: { slug: string };
}

export default function StandardsProductDetail({ params }: StandardsProductDetailProps) {
  const { t } = useTranslation();

  const { data: product, isLoading } = trpc.standards.getBySlug.useQuery(params.slug);

  const { data: related } = trpc.standards.getRelated.useQuery(
    {
      categorySlug: product?.category_slug || "",
      excludeId: product?.id || 0,
      limit: 6,
    },
    { enabled: !!product?.category_slug && !!product?.id }
  );

  const handleInquiry = () => {
    const form = document.getElementById("standards-inquiry-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/standards">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("standards.back_to_standards")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-10 border-b">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/standards" className="hover:text-foreground transition-colors">
              {t("standards.nav_label")}
            </Link>
            {product.category_slug && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/standards/category/${product.category_slug}`} className="hover:text-foreground transition-colors">
                  {t(`standards.categories.${product.category_slug}`, { defaultValue: product.category_slug })}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-xs">{product.name_en}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl flex-shrink-0">
              <FlaskConical className="h-7 w-7 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {product.name_en}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {product.part_number}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  {product.brand}
                </Badge>
                {product.category_slug && (
                  <Badge variant="secondary">
                    {t(`standards.categories.${product.category_slug}`, { defaultValue: product.category_slug })}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("standards.product_detail_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Catalog Number */}
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {t("standards.catalog_number")}
                    </p>
                    <p className="font-mono font-semibold">{product.part_number}</p>
                  </div>
                </div>

                <Separator />

                {/* CAS Number */}
                {product.cas_number && (
                  <>
                    <div className="flex items-start gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          {t("standards.cas_number")}
                        </p>
                        <p className="font-mono font-semibold">{product.cas_number}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Specification */}
                {product.specification && (
                  <>
                    <div className="flex items-start gap-3">
                      <Beaker className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          {t("standards.specification")}
                        </p>
                        <p className="text-sm">{product.specification}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Brand */}
                <div className="flex items-start gap-3">
                  <FlaskConical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {t("standards.brand")}
                    </p>
                    <p className="font-semibold">{product.brand}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back buttons */}
            <div className="flex gap-3">
              {product.category_slug && (
                <Link href={`/standards/category/${product.category_slug}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t("standards.back_to_category")}
                  </Button>
                </Link>
              )}
              <Link href="/standards">
                <Button variant="ghost" size="sm">
                  {t("standards.back_to_standards")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing & Inquiry Sidebar */}
          <div className="space-y-4">
            <Card className="border-emerald-200">
              <CardContent className="pt-6 space-y-4">
                {/* Price */}
                <div className="text-center">
                  {product.price_usd ? (
                    <div>
                      <p className="text-3xl font-bold text-emerald-700">
                        ${parseFloat(product.price_usd).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">USD / unit</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground">
                        {t("standards.price_on_request")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact us for pricing
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Availability */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("standards.availability")}</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {t("standards.in_stock")}
                  </Badge>
                </div>

                {/* Request Quote button */}
                <Button
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  onClick={handleInquiry}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("standards.request_quote")}
                </Button>
              </CardContent>
            </Card>

            {/* Note */}
            <p className="text-xs text-muted-foreground text-center italic">
              {t("standards.note_product_name")}
            </p>
          </div>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">{t("standards.related_products")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link key={rel.id} href={`/standards/product/${rel.slug || rel.part_number}`}>
                  <Card className="hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer h-full">
                    <CardContent className="pt-4 pb-4">
                      <p className="font-mono text-xs text-emerald-700 mb-1">{rel.part_number}</p>
                      <p className="text-sm font-medium line-clamp-2">{rel.name_en}</p>
                      {rel.cas_number && (
                        <p className="text-xs text-muted-foreground mt-1">CAS: {rel.cas_number}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Inquiry Form */}
        <div id="standards-inquiry-form" className="mt-12">
          <CustomerMessageForm
            productId={String(product.id)}
            productName={`${product.part_number} - ${product.name_en}`}
            title={t("standards.request_quote")}
            description="Provide the information needed to review your reference-standard inquiry."
          />
        </div>
      </div>
    </div>
  );
}
