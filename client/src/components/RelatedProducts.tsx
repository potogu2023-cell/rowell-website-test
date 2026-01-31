import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface RelatedProductsProps {
  productId: string;
  limit?: number;
}

export default function RelatedProducts({ productId, limit = 6 }: RelatedProductsProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: relatedProducts, isLoading } = trpc.products.getRelated.useQuery({
    productId,
    limit,
  });

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">相关产品推荐</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">相关产品推荐</h2>
        <Badge variant="secondary" className="ml-2">
          基于相似规格和品牌
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedProducts.map((product) => (
          <Card
            key={product.id}
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => setLocation(`/products/${product.productId}`)}
          >
            {/* Product Image */}
            <div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={product.imageUrl || "/images/hplc-column-placeholder.png"}
                alt={product.name || product.productId}
                className="max-w-full max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "/images/hplc-column-placeholder.png";
                }}
              />
            </div>

            <CardContent className="p-4">
              {/* Brand Badge */}
              <Badge className="mb-2">{product.brand}</Badge>

              {/* Product ID */}
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {product.productId}
              </h3>

              {/* Product Name */}
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.name}
              </p>

              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                {product.particleSize && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-muted-foreground">粒径:</span>
                    <span className="font-medium">{product.particleSize}</span>
                  </div>
                )}
                {product.poreSize && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-muted-foreground">孔径:</span>
                    <span className="font-medium">{product.poreSize}</span>
                  </div>
                )}
                {product.columnLength && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-muted-foreground">尺寸:</span>
                    <span className="font-medium">{product.columnLength} × {product.innerDiameter}</span>
                  </div>
                )}
              </div>

              {/* View Details Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/products/${product.productId}`);
                }}
              >
                查看详情
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      {relatedProducts.length >= limit && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation("/products")}
          >
            浏览更多产品
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
