import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye, BookOpen } from "lucide-react";

export default function AuthorDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: author, isLoading: authorLoading } = trpc.learningCenter.authors.getBySlug.useQuery(
    slug,
    { enabled: !!slug }
  );

  const { data: articlesData, isLoading: articlesLoading } = trpc.learningCenter.articles.list.useQuery(
    { page: 1, pageSize: 100, authorSlug: slug },
    { enabled: !!slug }
  );

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

  if (authorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-96" />
            <div className="md:col-span-2">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Author Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The author you're looking for doesn't exist.
          </p>
          <Link href="/learning">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Center
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const articles = articlesData?.articles || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/learning">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Author Profile */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Author Card */}
            <div>
              <Card>
                <CardHeader className="text-center">
                  {author.photo_url && (
                    <img
                      src={author.photo_url}
                      alt={author.full_name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                    />
                  )}
                  <CardTitle className="text-2xl">{author.full_name}</CardTitle>
                  <CardDescription className="text-lg">{author.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {author.years_of_experience && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">
                          Experience
                        </div>
                        <div className="text-sm">
                          {author.years_of_experience} years in chromatography
                        </div>
                      </div>
                    )}
                    
                    {author.education && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">
                          Education
                        </div>
                        <div className="text-sm whitespace-pre-line">
                          {author.education}
                        </div>
                      </div>
                    )}
                    
                    {author.expertise && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">
                          Expertise
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {author.expertise.split(',').map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold">
                          {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Biography */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About {author.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {author.biography ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line leading-relaxed">
                        {author.biography}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No biography available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Articles by Author */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h2 className="text-3xl font-bold mb-8">
          Articles by {author.full_name}
        </h2>

        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(articles as any[]).map((article: any) => {
              const badge = getCategoryBadge(article.category);
              
              return (
                <Link key={article.id} href={`/learning/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <Badge variant="outline">{article.application_area}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.meta_description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.published_date)}</span>
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
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No articles published yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
