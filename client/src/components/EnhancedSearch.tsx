import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function EnhancedSearch({ value, onChange, placeholder }: EnhancedSearchProps) {
  const [, setLocation] = useLocation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [localValue, setLocalValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const searchRef = useRef<HTMLDivElement>(null);

  // Popular searches (could be fetched from backend in the future)
  const popularSearches = ["Agilent", "Waters", "C18", "HILIC", "Phenomenex", "2.7 µm"];

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce local value and call onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [localValue]);

  // Get search suggestions
  const { data: suggestions } = trpc.products.list.useQuery(
    {
      search: debouncedValue,
      pageSize: 5,
    },
    {
      enabled: value.length >= 2 && showSuggestions,
    }
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (term: string) => {
    onChange(term);
    saveToHistory(term);
    setShowSuggestions(false);
  };

  const handleSelectProduct = (productId: string) => {
    setShowSuggestions(false);
    setLocation(`/products/${productId}`);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const handleRemoveHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== term);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  return (
    <div ref={searchRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              saveToHistory(value);
              setShowSuggestions(false);
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-4 space-y-4">
            {/* Search History */}
            {searchHistory.length > 0 && !value && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    最近搜索
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-6 text-xs"
                  >
                    清除
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((term, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
                      onClick={() => handleSelectSuggestion(term)}
                    >
                      <span className="text-sm">{term}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleRemoveHistoryItem(term, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {!value && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  热门搜索
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                      onClick={() => handleSelectSuggestion(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product Suggestions */}
            {value.length >= 2 && suggestions && suggestions.products.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  产品建议 ({suggestions.total} 个结果)
                </div>
                <div className="space-y-1">
                  {suggestions.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleSelectProduct(product.productId)}
                    >
                      <img
                        src={product.imageUrl || "/images/hplc-column-placeholder.png"}
                        alt={product.name || product.productId}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/images/hplc-column-placeholder.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {product.productId}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {suggestions.total > 5 && (
                  <div className="text-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        saveToHistory(value);
                        setShowSuggestions(false);
                      }}
                    >
                      查看全部 {suggestions.total} 个结果
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {value.length >= 2 && suggestions && suggestions.products.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                未找到匹配的产品
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
