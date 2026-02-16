import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Eye, User, ArrowLeft, Share2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: article, isLoading } = trpc.learningCenter.articles.bySlug.useQuery(
    { slug },
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist.
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

  const badge = getCategoryBadge(article.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/learning">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-4">
            <Badge variant={badge.variant} className="mb-2">
              {badge.label}
            </Badge>
            <Badge variant="outline" className="ml-2">
              {article.application_area}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {article.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {article.meta_description}
          </p>

          {/* Author Info */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {article.author_slug ? (
            <Link href={`/learning/authors/${article.author_slug}`}>
              <div className="flex items-center gap-2 hover:text-primary cursor-pointer">
                {article.author_photo && (
                  <img
                    src={article.author_photo}
                    alt={article.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-foreground">{article.author_name}</div>
                  <div className="text-xs">{article.author_title}</div>
                </div>
              </div>
            </Link>
            ) : (
            <div className="flex items-center gap-2">
              {article.author_photo && (
                <img
                  src={article.author_photo}
                  alt={article.author_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-medium text-foreground">{article.author_name}</div>
                <div className="text-xs">{article.author_title}</div>
              </div>
            </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.published_date)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{article.view_count} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
              li: ({ node, ...props }) => <li className="ml-4" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />
              ),
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                ) : (
                  <code className="block bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm" {...props} />
                ),
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-300" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold text-left" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 px-4 py-2" {...props} />
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Keywords */}
        {article.keywords && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.split(',').map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {keyword.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Author Card */}
        <Card className="mt-12">
          <CardHeader>
            <div className="flex items-start gap-4">
              {article.author_photo && (
                <img
                  src={article.author_photo}
                  alt={article.author_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{article.author_name}</h3>
                <p className="text-muted-foreground mb-3">{article.author_title}</p>
                <Link href={`/learning/authors/${article.author_slug}`}>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
