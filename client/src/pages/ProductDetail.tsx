import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params.id;
  const productId = id ? parseInt(id) : 0;

  const { data: product, isLoading } = trpc.products.getById.useQuery(productId, {
    enabled: productId > 0,
  });

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Product added to inquiry cart!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const handleAddToInquiry = () => {
    if (product) {
      addToCartMutation.mutate({ productId: product.id, quantity: 1 });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/products")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Product Info */}
          <div className="lg:col-span-2">
            <Card>
              {/* Product Image */}
              <div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.imageUrl || "/images/hplc-column-placeholder.png"}
                  alt={product.name || product.productId}
                  className="max-w-full max-h-full object-contain p-8"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hplc-column-placeholder.png";
                  }}
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{product.status}</Badge>
                    <CardTitle className="text-3xl">{product.productId}</CardTitle>
                    <p className="text-lg text-muted-foreground mt-2">{product.partNumber}</p>
                  </div>
                  <Badge className="text-lg px-4 py-2">{product.brand}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>
                
                {/* Product Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Product Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.particleSize && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Particle Size (粒径):</span>
                        <span className="font-medium">{product.particleSize} µm</span>
                      </div>
                    )}
                    {product.poreSize && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Pore Size (孔径):</span>
                        <span className="font-medium">{product.poreSize} Å</span>
                      </div>
                    )}
                    {product.columnLength && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Column Length (柱长):</span>
                        <span className="font-medium">{product.columnLength} mm</span>
                      </div>
                    )}
                    {product.innerDiameter && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Inner Diameter (内径):</span>
                        <span className="font-medium">{product.innerDiameter} mm</span>
                      </div>
                    )}
                    {product.phaseType && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Phase Type (填料类型):</span>
                        <span className="font-medium">{product.phaseType}</span>
                      </div>
                    )}
                    {product.phMin && product.phMax && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">pH Range (pH范围):</span>
                        <span className="font-medium">{product.phMin} - {product.phMax}</span>
                      </div>
                    )}
                    {product.phRange && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">pH Range (pH范围):</span>
                        <span className="font-medium">{product.phRange}</span>
                      </div>
                    )}
                    {product.maxPressure && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Max Pressure (最大压力):</span>
                        <span className="font-medium">{product.maxPressure}</span>
                      </div>
                    )}
                    {product.maxTemperature && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">Max Temperature (最高温度):</span>
                        <span className="font-medium">{product.maxTemperature}</span>
                      </div>
                    )}
                    {product.usp && (
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-muted-foreground">USP Classification:</span>
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
                <CardTitle>Product Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleAddToInquiry}
                  className="w-full"
                  size="lg"
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Inquiry Cart"}
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product ID:</span>
                      <span className="font-medium">{product.productId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Part Number:</span>
                      <span className="font-medium">{product.partNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{product.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Need Help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contact our technical support team for product recommendations and technical assistance.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setLocation("/contact")}>
                    Contact Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

