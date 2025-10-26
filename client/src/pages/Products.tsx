import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryNav from "@/components/CategoryNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { AdvancedFilters, AdvancedFiltersState } from "@/components/AdvancedFilters";
import { toast } from "sonner";

export default function Products() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({});
  const pageSize = 24;
  const { isAuthenticated } = useAuth();

  // Read category from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      const categoryId = parseInt(categoryParam, 10);
      if (!isNaN(categoryId)) {
        setSelectedCategoryId(categoryId);
      }
    }
  }, []);

  const queryParams = {
    categoryId: selectedCategoryId || undefined,
    brand: selectedBrand || undefined,
    ...advancedFilters,
    page: currentPage,
    pageSize,
  };
  
  const { data, isLoading } = trpc.products.list.useQuery(queryParams);
  
  // Get all brands for the current category (or all brands if no category selected)
  const { data: brandStats } = trpc.products.getBrandStats.useQuery({
    categoryId: selectedCategoryId || undefined,
  }) as { data: Record<string, number> | undefined };

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Product added to inquiry cart!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const handleAddToInquiry = (productId: number) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  // Reset to page 1 when category changes
  const handleCategorySelect = (categoryId: number | null, categoryName: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setCurrentPage(1);
  };

  const handleAdvancedFiltersChange = (filters: AdvancedFiltersState) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({});
    setSelectedBrand(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.keys(advancedFilters).length > 0 || selectedBrand || searchTerm;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Filter products based on search term and selected brand (client-side filtering)
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = !selectedBrand || product.brand === selectedBrand;

    return matchesSearch && matchesBrand;
  });

  // Get unique brands from brand stats API (all brands, not just current page)
  const brands = brandStats ? Object.keys(brandStats).sort() : [];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">HPLC Products</h1>
          <p className="text-lg text-muted-foreground">
            Browse our comprehensive collection of high-quality HPLC columns from leading manufacturers
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategoryNav 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Search by product ID, part number, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {/* 高级筛选功能暂时禁用 - 等产品数据更丰富后再启用 */}
                {/* <Button
                  onClick={() => setShowAdvancedFilters(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  高级筛选
                </Button> */}
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="ghost"
                  >
                    清除筛选
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">当前筛选条件：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBrand && (
                      <Badge variant="secondary">品牌: {selectedBrand}</Badge>
                    )}
                    {advancedFilters.particleSizeMin && (
                      <Badge variant="secondary">粒径 ≥ {advancedFilters.particleSizeMin} µm</Badge>
                    )}
                    {advancedFilters.particleSizeMax && (
                      <Badge variant="secondary">粒径 ≤ {advancedFilters.particleSizeMax} µm</Badge>
                    )}
                    {advancedFilters.poreSizeMin && (
                      <Badge variant="secondary">孔径 ≥ {advancedFilters.poreSizeMin} Å</Badge>
                    )}
                    {advancedFilters.poreSizeMax && (
                      <Badge variant="secondary">孔径 ≤ {advancedFilters.poreSizeMax} Å</Badge>
                    )}
                    {advancedFilters.columnLengthMin && (
                      <Badge variant="secondary">柱长 ≥ {advancedFilters.columnLengthMin} mm</Badge>
                    )}
                    {advancedFilters.columnLengthMax && (
                      <Badge variant="secondary">柱长 ≤ {advancedFilters.columnLengthMax} mm</Badge>
                    )}
                    {advancedFilters.innerDiameterMin && (
                      <Badge variant="secondary">内径 ≥ {advancedFilters.innerDiameterMin} mm</Badge>
                    )}
                    {advancedFilters.innerDiameterMax && (
                      <Badge variant="secondary">内径 ≤ {advancedFilters.innerDiameterMax} mm</Badge>
                    )}
                    {advancedFilters.phaseTypes && advancedFilters.phaseTypes.length > 0 && (
                      <Badge variant="secondary">填料: {advancedFilters.phaseTypes.join(', ')}</Badge>
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
                    onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                  >
                    {brand} ({brandStats?.[brand] || 0})
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {total} products
              {selectedCategoryName && ` in ${selectedCategoryName}`}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/products/${product.id}`)}
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
                      {product.particleSize && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">粒径:</span>
                          <span className="font-medium">{product.particleSize}</span>
                        </div>
                      )}
                      {product.poreSize && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">孔径:</span>
                          <span className="font-medium">{product.poreSize}</span>
                        </div>
                      )}
                      {(product.columnLength && product.innerDiameter) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">尺寸:</span>
                          <span className="font-medium">{product.columnLength} × {product.innerDiameter}</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Description */}
                    {product.detailedDescription && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {product.detailedDescription}
                      </p>
                    )}

                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleAddToInquiry(product.id);
                      }}
                      disabled={!isAuthenticated || addToCartMutation.isPending}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Inquiry
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
                  Previous
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
                  Next
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

