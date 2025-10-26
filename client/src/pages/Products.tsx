import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryNav from "@/components/CategoryNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const { data: products, isLoading } = trpc.products.list.useQuery();
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

  // Filter products based on search term, selected brand, and category
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = !selectedBrand || product.brand === selectedBrand;

    // 暂时简化处理：所有产品都属于HPLC Columns分类
    // TODO: 后续需要在数据库中建立产品与分类的关联
    const matchesCategory = !selectedCategoryId; // 目前所有产品都显示

    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Get unique brands
  const brands = Array.from(new Set(products?.map((p) => p.brand) || [])).sort();

  // Group products by brand for statistics
  const brandStats = products?.reduce(
    (acc, product) => {
      acc[product.brand] = (acc[product.brand] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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

      {/* Main Content with Sidebar */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Category Navigation */}
          <div className="lg:col-span-1">
            <CategoryNav 
              onCategorySelect={(categoryId, categoryName) => {
                setSelectedCategoryId(categoryId);
                setSelectedCategoryName(categoryName);
              }}
              selectedCategoryId={selectedCategoryId}
            />
          </div>

          {/* Right Content - Products */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Search by product ID, part number, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {(selectedBrand || selectedCategoryId) && (
                  <Button variant="outline" onClick={() => {
                    setSelectedBrand(null);
                    setSelectedCategoryId(null);
                    setSelectedCategoryName(null);
                  }}>
                    Clear Filter
                  </Button>
                )}
              </div>

              {/* Brand Filter */}
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Button
                    key={brand}
                    variant={selectedBrand === brand ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBrand(brand === selectedBrand ? null : brand)}
                  >
                    {brand} ({brandStats?.[brand] || 0})
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredProducts?.length || 0} of {products?.length || 0} products
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts?.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.productId}</CardTitle>
                      <Badge variant={product.status === "new" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{product.partNumber}</span>
                      </div>
                      
                      {product.name && (
                        <div>
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                        </div>
                      )}

                      {/* Technical Specifications */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {product.particleSize && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">粒径:</span>
                            <span className="font-medium">{product.particleSize} µm</span>
                          </div>
                        )}
                        {product.poreSize && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">孔径:</span>
                            <span className="font-medium">{product.poreSize} Å</span>
                          </div>
                        )}
                        {product.columnLength && product.innerDiameter && (
                          <div className="flex items-center gap-1 col-span-2">
                            <span className="text-muted-foreground">尺寸:</span>
                            <span className="font-medium">{product.columnLength} × {product.innerDiameter} mm</span>
                          </div>
                        )}
                        {product.phRange && (
                          <div className="flex items-center gap-1 col-span-2">
                            <span className="text-muted-foreground">pH范围:</span>
                            <span className="font-medium">{product.phRange}</span>
                          </div>
                        )}
                      </div>

                      {product.detailedDescription && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {product.detailedDescription}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Inquiry Button - Only visible to logged-in users */}
                    {isAuthenticated && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          className="w-full"
                          variant="default"
                          onClick={() => handleAddToInquiry(product.id)}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Inquiry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found matching your criteria.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchTerm("");
                  setSelectedBrand(null);
                }}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

