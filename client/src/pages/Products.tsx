import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryNav from "@/components/CategoryNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;
  const { isAuthenticated } = useAuth();

  const queryParams = {
    categoryId: selectedCategoryId || undefined,
    page: currentPage,
    pageSize,
  };
  
  const { data, isLoading } = trpc.products.list.useQuery(queryParams);

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

  // Get unique brands from current page
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();

  // Group products by brand for statistics
  const brandStats = products.reduce(
    (acc, product) => {
      acc[product.brand] = (acc[product.brand] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
              <Input
                type="text"
                placeholder="Search by product ID, part number, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              {/* Brand Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Button
                    key={brand}
                    variant={selectedBrand === brand ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                  >
                    {brand} ({brandStats[brand] || 0})
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
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
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
                      onClick={() => handleAddToInquiry(product.id)}
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
    </div>
  );
}

