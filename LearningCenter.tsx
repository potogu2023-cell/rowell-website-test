import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Eye, User, BookOpen, Microscope, FlaskConical, Leaf, Apple, Pill, Dna } from "lucide-react";

export default function LearningCenter() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [area, setArea] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = trpc.learningCenter.articles.list.useQuery({
    page,
    pageSize: 12,
    category,
    area,
  });

  const { data: stats } = trpc.learningCenter.stats.useQuery();
  const { data: authors } = trpc.learningCenter.authors.list.useQuery();

  const applicationAreas = [
    { value: 'pharmaceutical', label: 'Pharmaceutical', icon: Pill, color: 'bg-blue-100 text-blue-700' },
    { value: 'environmental', label: 'Environmental', icon: Leaf, color: 'bg-green-100 text-green-700' },
    { value: 'food-safety', label: 'Food Safety', icon: Apple, color: 'bg-orange-100 text-orange-700' },
    { value: 'clinical', label: 'Clinical', icon: Microscope, color: 'bg-purple-100 text-purple-700' },
    { value: 'biopharmaceutical', label: 'Biopharmaceutical', icon: Dna, color: 'bg-pink-100 text-pink-700' },
    { value: 'chemical', label: 'Chemical', icon: FlaskConical, color: 'bg-cyan-100 text-cyan-700' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryBadge = (cat: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      'application-notes': { label: 'Application Note', variant: 'default' },
      'technical-guides': { label: 'Technical Guide', variant: 'secondary' },
      'industry-trends': { label: 'Industry Trend', variant: 'outline' },
      'literature-reviews': { label: 'Literature Review', variant: 'outline' },
    };
    return badges[cat] || { label: cat, variant: 'outline' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4 text-gray-900">
              Learning Center
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Expert insights, technical guides, and application notes for chromatography professionals
            </p>
            
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_articles}</div>
                  <div className="text-sm text-muted-foreground">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_authors}</div>
                  <div className="text-sm text-muted-foreground">Expert Authors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_views?.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Application Areas */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Browse by Application Area</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {applicationAreas.map((appArea) => {
              const Icon = appArea.icon;
              return (
                <button
                  key={appArea.value}
                  onClick={() => {
                    setArea(area === appArea.value ? undefined : appArea.value);
                    setPage(1);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    area === appArea.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${appArea.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-medium text-center">{appArea.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Category Tabs */}
          <Tabs value={category || 'all'} onValueChange={(value) => {
            setCategory(value === 'all' ? undefined : value);
            setPage(1);
          }} className="mb-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              <TabsTrigger value="all">All Articles</TabsTrigger>
              <TabsTrigger value="application-notes">Applications</TabsTrigger>
              <TabsTrigger value="technical-guides">Guides</TabsTrigger>
              <TabsTrigger value="industry-trends">Trends</TabsTrigger>
              <TabsTrigger value="literature-reviews">Reviews</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data && data.articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {(data.articles as any[]).map((article: any) => {
                  const badge = getCategoryBadge(article.category);
                  const appArea = applicationAreas.find(a => a.value === article.application_area);
                  
                  return (
                    <Link key={article.id} href={`/learning/${article.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            {appArea && (
                              <Badge variant="outline" className={appArea.color}>
                                {appArea.label}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                          <CardDescription className="line-clamp-3">
                            {article.meta_description}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{article.author_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(article.published_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.view_count}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later for new content.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Authors Section */}
      {authors && authors.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Our Expert Authors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(authors as any[]).map((author: any) => (
                <Link key={author.id} href={`/learning/authors/${author.slug}`}>
                  <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      {author.photo_url && (
                        <img
                          src={author.photo_url}
                          alt={author.full_name}
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        />
                      )}
                      <CardTitle className="text-lg">{author.full_name}</CardTitle>
                      <CardDescription>{author.title}</CardDescription>
                      <div className="text-sm text-muted-foreground mt-2">
                        {author.article_count} {author.article_count === 1 ? 'article' : 'articles'}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
