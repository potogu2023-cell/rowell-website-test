import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/lib/categoryTranslations";

export function BrandNav() {
  const [location, setLocation] = useLocation();
  const { i18n } = useTranslation();
  const { data: brands, isLoading } = trpc.brand.getWithProductCount.useQuery();

  // Parse current brand from URL
  const searchParams = new URLSearchParams(window.location.search);
  const currentBrand = searchParams.get("brand");

  const handleBrandClick = (brand: string) => {
    const params = new URLSearchParams(window.location.search);
    
    if (currentBrand === brand) {
      // If clicking the same brand, remove the filter
      params.delete("brand");
    } else {
      // Set new brand filter
      params.set("brand", brand);
    }
    
    // Remove page parameter when changing filters
    params.delete("page");
    
    const newUrl = params.toString() ? `/products?${params.toString()}` : "/products";
    setLocation(newUrl);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 mb-3">{translateCategory('品牌筛选', i18n.language)}</h3>
      <div className="space-y-1">
        {brands.map((brand: any) => (
          <div
            key={brand.brand}
            onClick={() => handleBrandClick(brand.brand)}
            className={`
              flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
              ${
                currentBrand === brand.brand
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }
            `}
          >
            <span className="text-sm">{brand.brand}</span>
            <span className="text-xs text-gray-500 ml-2">{brand.productCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
