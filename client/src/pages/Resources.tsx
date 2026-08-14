import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, Eye } from "lucide-react";
import { APP_TITLE } from "@/const";
// import { useTranslation } from "react-i18next";

export default function Resources() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  // const { i18n } = useTranslation();

  // Get current language code (e.g., 'en', 'zh', 'ru')
  // Extract language prefix to match database format (e.g., 'en-US' -> 'en')
  // const currentLanguage = (i18n.language || 'en').split('-')[0];

  const { data, isLoading } = trpc.resources.list.useQuery({
    page,
    pageSize: 12,
    search: search || undefined,
    category: selectedCategory,
    // Remove language filter to show all languages (en, ru, es, etc.)
    // language: currentLanguage,
  });

  const { data: categories } = trpc.resources.listCategories.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                {APP_TITLE}
              </a>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/products">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </a>
              </Link>
              <Link href="/resources">
                <a className="text-sm font-medium text-foreground">
                  Resources
                </a>
              </Link>
              <Link href="/contact">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Resource Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Technical articles, tutorials, and guides for chromatography professionals
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Categories Filter */}
          {categories && categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Categories:</span>
              <Badge
                variant={selectedCategory === undefined ? "secondary" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => { setSelectedCategory(undefined); setPage(1); }}
              >
                All
              </Badge>
              {categories.filter((category): category is string => typeof category === "string" && category.length > 0).map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => { setSelectedCategory(category); setPage(1); }}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((article) => (
                  <Link key={article.id} href={`/resources/${article.slug}`}>
                    <a>
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                          {article.excerpt && (
                            <CardDescription className="line-clamp-3">
                              {article.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            {article.publishedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{article.views ?? 0}</span>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    </a>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {Math.ceil(data.total / data.pageSize) > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(data.total / data.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(Math.ceil(data.total / data.pageSize), p + 1))}
                    disabled={page === Math.ceil(data.total / data.pageSize)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {search ? `No articles found for "${search}"` : "No articles available yet"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
