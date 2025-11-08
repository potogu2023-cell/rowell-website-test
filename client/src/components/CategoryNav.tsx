import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Category {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  parentId: number | null;
  level: number;
  displayOrder: number | null;
  isVisible: number;
  description: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
}

interface CategoryNavProps {
  onCategorySelect?: (categoryId: number | null, categoryName: string | null) => void;
  selectedCategoryId?: number | null;
}

export default function CategoryNav({ onCategorySelect, selectedCategoryId }: CategoryNavProps) {
  const [, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([1])); // 默认展开"色谱柱"
  
  const { data: allCategories, isLoading } = trpc.category.getWithProductCount.useQuery();
  
  // Get top level categories from all categories
  const topCategories = allCategories?.filter((cat: Category) => cat.parentId === null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getChildCategories = (parentId: number): Category[] => {
    if (!allCategories) return [];
    return allCategories.filter((cat: Category) => cat.parentId === parentId);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildCategories(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors ${
            selectedCategoryId === category.id
              ? 'bg-blue-100 text-blue-900 font-medium'
              : level === 0
              ? 'hover:bg-blue-50 font-medium text-gray-900'
              : level === 1
              ? 'hover:bg-gray-50 text-gray-700'
              : 'hover:bg-gray-50 text-gray-600 text-sm'
          }`}
          onClick={(e) => {
            if (hasChildren) {
              toggleCategory(category.id);
            }
            // 如果是叶子节点，更新URL并触发选择事件
            if (!hasChildren) {
              // 更新URL参数
              setLocation(`/products?category=${category.slug}`);
              // 同时触发回调（如果有）
              if (onCategorySelect) {
                onCategorySelect(category.id, category.name);
              }
            }
            e.stopPropagation();
          }}
        >
          {hasChildren && (
            <span className="mr-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-6"></span>}
          <span className="flex-1">{category.name}</span>
          {category.nameEn && (
            <span className="ml-2 text-xs text-gray-400">
              {category.nameEn}
            </span>
          )}
          {category.productCount !== undefined && category.productCount > 0 && (
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {category.productCount}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">产品分类</h3>
      <div className="space-y-1">
        {topCategories?.map((category) => renderCategory(category as Category))}
      </div>
    </div>
  );
}

