import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import CustomerMessageForm from "@/components/CustomerMessageForm";
import RelatedProducts from "@/components/RelatedProducts";
import ProductInquiryButton from "@/components/ProductInquiryButton";
import ProductMessageButton from "@/components/ProductMessageButton";
import { SEOHead } from "@/components/SEOHead";

function withParticleUnit(value: string) {
  const normalized = value.trim();
  return /(?:µm|um)$/i.test(normalized)
    ? normalized.replace(/um$/i, "µm")
    : `${normalized} µm`;
}

function withPoreUnit(value: string) {
  const normalized = value.trim();
  return /(?:Å|A)$/i.test(normalized)
    ? normalized.replace(/(?:Å|A)$/i, " Å")
    : `${normalized} Å`;
}

function hasCatalogValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length > 0 && !/^(?:n\/?a|n\/|not available|none|null|-)$/i.test(normalized);
}

export default function ProductDetail() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const slug = params.id || "";

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(slug, {
    enabled: slug.length > 0,
  });
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailedImageUrl(null);
  }, [product?.imageUrl]);

  // NOTE: Product Schema (JSON-LD) is injected server-side via seo-meta-injection.ts
  // and vite.ts for SSR/pre-rendering. Client-side injection was removed to prevent
  // duplicate structured data (which caused 3x Product schemas on the same page).

  const handleAddToInquiry = () => {
    // Scroll to the message form at the bottom of the page
    const messageForm = document.getElementById('product-message-form');
    if (messageForm) {
      messageForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast.success(t('productDetail.scroll_to_inquiry'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('productDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('productDetail.not_found')}</h2>
          <p className="text-muted-foreground mb-6">{t('productDetail.not_found_message')}</p>
          <Button onClick={() => setLocation("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('productDetail.back_to_products')}
          </Button>
        </div>
      </div>
    );
  }

  if (product.status !== 'active') {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-4 text-slate-950">Content No Longer Available</h1>
          <p className="text-muted-foreground mb-6">
            This catalog record is no longer active. Browse the active catalog for current product information.
          </p>
          <Button onClick={() => setLocation('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('productDetail.back_to_products')}
          </Button>
        </div>
      </main>
    );
  }

  const isCartridgeVolume = hasCatalogValue(product.columnLength)
    && /\b(?:spe|cartridge)\b/i.test(`${product.productType || ""} ${product.category || ""} ${product.name || ""}`)
    && /^\d+(?:\.\d+)?\s*mL$/i.test(product.columnLength.trim());
  const isGcCapillary = hasCatalogValue(product.columnLength)
    && /^G\d+$/i.test(String(product.usp || '').trim())
    && /^\d+(?:\.\d+)?\s*m$/i.test(product.columnLength.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic SEO Meta Tags */}
      <SEOHead
        title={product.metaTitle || `${product.brand} ${product.name} ${product.partNumber}`}
        description={product.metaDescription || `${product.brand} ${product.name} (${product.partNumber}). Review catalog specifications and submit an inquiry to confirm product details for your application.`}
        url={`/products/${product.slug || product.productId}`}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/products")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('productDetail.back_to_products')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Product Info */}
          <div className="lg:col-span-2">
            <Card>
              {/* Product Image */}
              <div className="flex min-h-[320px] w-full items-center justify-center overflow-hidden bg-gray-50 sm:min-h-[400px]">
                {product.imageUrl && product.imageUrl !== failedImageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={`${product.brand} ${product.name} (${product.partNumber}) product image`}
                    className="block object-contain p-8"
                    style={{ height: 'auto', maxHeight: '400px', maxWidth: '100%', width: 'auto' }}
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                    onError={() => setFailedImageUrl(product.imageUrl)}
                  />
                ) : (
                  <p className="max-w-md px-6 text-center text-sm text-muted-foreground" role="status">
                    Product image pending verification.
                  </p>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Part number: {product.partNumber}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{product.name || product.productId}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Catalog ID: {product.productId}</p>
                  </div>
                  <Badge className="shrink-0 text-base px-3 py-1.5">{product.brand}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Review the catalog information below, then use the inquiry form to confirm current product details and suitability for your application.
                </div>

                {/* Product Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{t('productDetail.product_description')}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || t('productDetail.no_description')}
                  </p>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('productDetail.technical_specs')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasCatalogValue(product.particleSize) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.particle_size')}:</span>
                        <span className="font-medium">{withParticleUnit(product.particleSize)}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.poreSize) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.pore_size')}:</span>
                        <span className="font-medium">{withPoreUnit(product.poreSize)}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.columnLength) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{isCartridgeVolume ? 'Cartridge volume' : isGcCapillary ? 'GC capillary length' : t('productDetail.column_length')}:</span>
                        <span className="font-medium">{product.columnLength}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.innerDiameter) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.inner_diameter')}:</span>
                        <span className="font-medium">{product.innerDiameter}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.phaseType) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.phase_type')}:</span>
                        <span className="font-medium">{product.phaseType}</span>
                      </div>
                    )}
                    {((product.phMin !== null && product.phMin !== undefined && product.phMax !== null && product.phMax !== undefined) || hasCatalogValue(product.phRange)) ? (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.ph_range')}:</span>
                        <span className="font-medium">
                          {product.phMin !== null && product.phMin !== undefined && product.phMax !== null && product.phMax !== undefined ? `${product.phMin} - ${product.phMax}` : product.phRange}
                        </span>
                      </div>
                    ) : null}
                    {hasCatalogValue(product.maxPressure) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.max_pressure')}:</span>
                        <span className="font-medium">{product.maxPressure}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.maxTemperature) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.max_temperature')}:</span>
                        <span className="font-medium">{product.maxTemperature}</span>
                      </div>
                    )}
                    {hasCatalogValue(product.usp) && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{t('productDetail.usp_classification')}:</span>
                        <span className="font-medium">{product.usp}</span>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Action Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>{t('productDetail.product_actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 询价按钮 */}
                <ProductInquiryButton 
                  productId={product.productId}
                  productName={product.name || product.productId}
                  productPartNumber={product.partNumber}
                />
                
                {/* 留言按钮 */}
                <ProductMessageButton 
                  productId={product.productId}
                  productName={product.name || product.productId}
                  productPartNumber={product.partNumber}
                />

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">{t('productDetail.product_information')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('productDetail.product_id')}:</span>
                      <span className="font-medium">{product.productId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('productDetail.part_number')}:</span>
                      <span className="font-medium">{product.partNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('productDetail.brand')}:</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('productDetail.status')}:</span>
                      <Badge variant="outline">{product.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">{t('productDetail.need_help')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('productDetail.need_help_message')}
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setLocation("/contact")}>
                    {t('productDetail.contact_us')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts productId={product.productId} limit={6} />

        {/* Customer Message Form */}
        <div id="product-message-form" className="mt-12 max-w-4xl mx-auto">
          <CustomerMessageForm 
            productId={product.productId}
            productName={product.name || undefined}
            title="Have Questions About This Product?"
            description="Send your product question and contact details for review."
          />
        </div>
      </div>
    </div>
  );
}

