import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const { data: products, isLoading } = trpc.products.list.useQuery();

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

  // Filter products based on search term and selected brand
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = !selectedBrand || product.brand === selectedBrand;

    return matchesSearch && matchesBrand;
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary">ROWELL HPLC</a>
            </Link>
            <nav className="flex gap-6">
              <Link href="/">
                <a className="text-muted-foreground hover:text-foreground">Home</a>
              </Link>
              <Link href="/products">
                <a className="text-foreground font-medium">Products</a>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">HPLC Products</h1>
          <p className="text-muted-foreground">
            Browse our collection of {products?.length || 0} HPLC columns and consumables
          </p>
        </div>

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
            {selectedBrand && (
              <Button variant="outline" onClick={() => setSelectedBrand(null)}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Brand:</span>
                    <p className="text-sm">{product.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Part Number:</span>
                    <p className="text-sm font-mono">{product.partNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Prefix:</span>
                    <p className="text-sm">
                      <Badge variant="outline">{product.prefix}</Badge>
                    </p>
                  </div>
                  {product.name && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Name:</span>
                      <p className="text-sm">{product.name}</p>
                    </div>
                  )}
                  {product.description && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Description:
                      </span>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
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
      </main>
    </div>
  );
}

