import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EnhancedSearch from "@/components/EnhancedSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryNav from "@/components/CategoryNav";
import { BrandNav } from "@/components/BrandNav";

import { ShoppingCart, ChevronLeft, ChevronRight, Filter, Bot, MessageCircle, Lightbulb } from "lucide-react";
import { AdvancedFilters, AdvancedFiltersState } from "@/components/AdvancedFilters";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { translateCategory } from '@/lib/categoryTranslations';

export default function Products() {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({});
  const [selectedUSP, setSelectedUSP] = useState<string | null>(null);
  const pageSize = 24;


  // Get all categories
  const { data: categoriesData } = trpc.category.getWithProductCount.useQuery();
  const categories = categoriesData || [];

  // Read category, brand, and page from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Read page parameter
    const pageParam = params.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
    
    // Read category parameter
    const categoryParam = params.get('category');
    if (categoryParam && categories.length > 0) {
      // Try to parse as number first (for backward compatibility)
      const categoryId = parseInt(categoryParam, 10);
      if (!isNaN(categoryId)) {
        setSelectedCategoryId(categoryId);
        const category = categories.find((c: any) => c.id === categoryId);
        if (category) {
          setSelectedCategoryName(category.name);
        }
      } else {
        // Try to find by slug
        const category = categories.find((c: any) => c.slug === categoryParam);
        if (category) {
          setSelectedCategoryId(category.id);
          setSelectedCategoryName(category.name);
        }
      }
    }
    
    // Read brand parameter
    const brandParam = params.get('brand');
    if (brandParam) {
      setSelectedBrand(brandParam);
    }
    
    // Read USP parameter
    const uspParam = params.get('usp');
    if (uspParam) {
      setSelectedUSP(uspParam);
    }
  }, [categories]);

  // Listen to URL changes and update filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Update page from URL
    const pageParam = params.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
    
    // Update brand from URL
    const brandParam = params.get('brand');
    setSelectedBrand(brandParam);
    
    // Update USP from URL
    const uspParam = params.get('usp');
    setSelectedUSP(uspParam);
    
    // Update category from URL
    const categoryParam = params.get('category');
    if (categoryParam && categories.length > 0) {
      const categoryId = parseInt(categoryParam, 10);
      if (!isNaN(categoryId)) {
        setSelectedCategoryId(categoryId);
        const category = categories.find((c: any) => c.id === categoryId);
        if (category) {
          setSelectedCategoryName(category.name);
        }
      } else {
        const category = categories.find((c: any) => c.slug === categoryParam);
        if (category) {
          setSelectedCategoryId(category.id);
          setSelectedCategoryName(category.name);
        }
      }
    } else if (!categoryParam) {
      // Clear category selection if no category in URL
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    }
  }, [location, categories]);

  // Use useMemo to ensure queryParams is recalculated when dependencies change
  const queryParams = useMemo(() => ({
    categoryId: selectedCategoryId || undefined,
    brand: selectedBrand || undefined,
    search: searchTerm || undefined,
    usp: selectedUSP || undefined,
    ...advancedFilters,
    page: currentPage,
    pageSize,
  }), [selectedCategoryId, selectedBrand, searchTerm, selectedUSP, advancedFilters, currentPage, pageSize]);
  
  console.log('[Products] Query params:', queryParams);
  
  const { data, isLoading } = trpc.products.list.useQuery(queryParams);
  
  // Get all brands for the current category (or all brands if no category selected)
  const { data: brandStats } = trpc.products.getBrandStats.useQuery({
    categoryId: selectedCategoryId || undefined,
  }) as { data: Record<string, number> | undefined };

  const handleContactWhatsApp = (productId: string) => {
    const message = encodeURIComponent(`Hi, I'm interested in product: ${productId}`);
    window.open(`https://wa.me/8613816548816?text=${message}`, '_blank');
  };

  // Reset to page 1 when category changes
  const handleCategorySelect = (categoryId: number | null, categoryName: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setCurrentPage(1);
    
    // Update URL parameter
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    if (categoryId) {
      params.set('category', categoryId.toString());
    } else {
      params.delete('category');
    }
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleAdvancedFiltersChange = (filters: AdvancedFiltersState) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
    
    // Update URL parameter
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({});
    setSelectedBrand(null);
    setSearchTerm("");
    setCurrentPage(1);
    
    // Update URL parameter
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const hasActiveFilters = Object.keys(advancedFilters).length > 0 || selectedBrand || searchTerm;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('products.loading')}</p>
        </div>
      </div>
    );
  }

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Use products from backend API directly (filtering is done on server-side)
  const filteredProducts = products;

  // Get unique brands from brand stats API (all brands, not just current page)
  const brands = brandStats ? Object.keys(brandStats).sort() : [];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    
    // Update URL parameter
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">{t('products.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <CategoryNav 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
            />
            
            <div className="border-t pt-6">
              <BrandNav />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <EnhancedSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder={t('products.search_placeholder')}
                />
                <Button
                  onClick={() => setShowAdvancedFilters(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t('products.advanced_filters')}
                </Button>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="ghost"
                  >
                    {t('products.clear_filters')}
                  </Button>
                )}
              </div>


              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">{t('products.current_filters')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBrand && (
                      <Badge variant="secondary">{t('products.brand')}: {selectedBrand}</Badge>
                    )}
                    {selectedUSP && (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => {
                          setSelectedUSP(null);
                          setCurrentPage(1);
                          const params = new URLSearchParams(window.location.search);
                          params.delete('usp');
                          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                        }}
                      >
                        USP: {selectedUSP}
                        <span className="ml-1">×</span>
                      </Badge>
                    )}
                    {advancedFilters.particleSizeMin && (
                      <Badge variant="secondary">{t('products.particle_size_min')} {advancedFilters.particleSizeMin} µm</Badge>
                    )}
                    {advancedFilters.particleSizeMax && (
                      <Badge variant="secondary">{t('products.particle_size_max')} {advancedFilters.particleSizeMax} µm</Badge>
                    )}
                    {advancedFilters.poreSizeMin && (
                      <Badge variant="secondary">{t('products.pore_size_min')} {advancedFilters.poreSizeMin} Å</Badge>
                    )}
                    {advancedFilters.poreSizeMax && (
                      <Badge variant="secondary">{t('products.pore_size_max')} {advancedFilters.poreSizeMax} Å</Badge>
                    )}
                    {advancedFilters.columnLengthMin && (
                      <Badge variant="secondary">{t('products.column_length_min')} {advancedFilters.columnLengthMin} mm</Badge>
                    )}
                    {advancedFilters.columnLengthMax && (
                      <Badge variant="secondary">{t('products.column_length_max')} {advancedFilters.columnLengthMax} mm</Badge>
                    )}
                    {advancedFilters.innerDiameterMin && (
                      <Badge variant="secondary">{t('products.inner_diameter_min')} {advancedFilters.innerDiameterMin} mm</Badge>
                    )}
                    {advancedFilters.innerDiameterMax && (
                      <Badge variant="secondary">{t('products.inner_diameter_max')} {advancedFilters.innerDiameterMax} mm</Badge>
                    )}
                    {advancedFilters.phaseTypes && advancedFilters.phaseTypes.length > 0 && (
                      <Badge variant="secondary">{t('products.phase_types')}: {advancedFilters.phaseTypes.join(', ')}</Badge>
                    )}
                    {advancedFilters.phMin && (
                      <Badge variant="secondary">pH ≥ {advancedFilters.phMin}</Badge>
                    )}
                    {advancedFilters.phMax && (
                      <Badge variant="secondary">pH ≤ {advancedFilters.phMax}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Brand Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Button
                    key={brand}
                    variant={selectedBrand === brand ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedBrand(selectedBrand === brand ? null : brand);
                      setSearchTerm(""); // Clear search term when selecting brand
                    }}
                  >
                    {brand} ({brandStats?.[brand] || 0})
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              {t('products.showing_results')} {filteredProducts.length} {t('products.of')} {total} {t('products.products_count')}
              {selectedCategoryName && ` ${t('products.in_category')} ${translateCategory(selectedCategoryName, i18n.language)}`}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/products/${product.productId}`)}
                >
                  {/* Product Image */}
                  <div className="aspect-square w-full overflow-hidden bg-gray-50">
                    <img 
                      src={product.imageUrl || "/images/hplc-column-placeholder.png"}
                      alt={product.name || product.productId}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        e.currentTarget.src = "/images/hplc-column-placeholder.png";
                      }}
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{product.status}</Badge>
                      <Badge>{product.brand}</Badge>
                    </div>
                    <CardTitle className="text-lg">{product.productId}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.partNumber}</p>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-3 line-clamp-2">{product.name}</h3>
                    
                    {/* Technical Specifications */}
                    <div className="space-y-2 mb-4 text-sm">
                      {/* Always show Particle Size for HPLC products */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('products.particle_size')}:</span>
                        <span className="font-medium">{product.particleSize || 'N/A'}</span>
                      </div>
                      
                      {/* Always show Pore Size for HPLC products */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('products.pore_size')}:</span>
                        <span className="font-medium">{product.poreSize || 'N/A'}</span>
                      </div>
                      
                      {/* Always show Dimensions */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('products.dimensions')}:</span>
                        <span className="font-medium">
                          {(product.columnLength && product.innerDiameter) 
                            ? `${product.columnLength} × ${product.innerDiameter}`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Detailed Description */}
                    {product.detailedDescription && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {product.detailedDescription}
                      </p>
                    )}

                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleContactWhatsApp(product.productId);
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t('products.contact_whatsapp')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('products.previous')}
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('products.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <AdvancedFilters
          onFiltersChange={handleAdvancedFiltersChange}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}
    </div>
  );
}

