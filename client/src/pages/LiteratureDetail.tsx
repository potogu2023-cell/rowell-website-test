import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Calendar, Eye, BookOpen, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function LiteratureDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params.slug as string;

  const { data: literature, isLoading } = trpc.learningCenter.literature.bySlug.useQuery(slug);

  const getAreaBadgeColor = (area: string) => {
    const colors: Record<string, string> = {
      'pharmaceutical': 'bg-blue-100 text-blue-700',
      'environmental': 'bg-green-100 text-green-700',
      'food-safety': 'bg-orange-100 text-orange-700',
      'clinical': 'bg-purple-100 text-purple-700',
      'biopharmaceutical': 'bg-pink-100 text-pink-700',
      'chemical': 'bg-cyan-100 text-cyan-700',
    };
    return colors[area] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!literature) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-3xl font-bold mb-4">{t('common.notFound')}</h1>
          <Link href="/learning-center">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToLearningCenter')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/learning-center">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToLearningCenter')}
            </Button>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <Badge className={getAreaBadgeColor(literature.applicationArea)}>
              {t(`learningCenter.applicationAreas.${literature.applicationArea}`)}
            </Badge>
            <Badge variant="outline">
              <Calendar className="mr-1 h-3 w-3" />
              {literature.year}
            </Badge>
            <Badge variant="outline">
              <Eye className="mr-1 h-3 w-3" />
              {literature.viewCount} {t('common.views')}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            {literature.title}
          </h1>

          <div className="flex items-center gap-4 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">{literature.authors}</span>
            </div>
            <div className="text-sm">
              {literature.journal}
            </div>
          </div>

          {literature.originalPaperUrl && (
            <a 
              href={literature.originalPaperUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="mb-6">
                <FileText className="mr-2 h-4 w-4" />
                {t('literature.readFullPaper')}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('literature.summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <ReactMarkdown>{literature.summary}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Key Findings */}
          {literature.keyFindings && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('literature.keyFindings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <ReactMarkdown>{literature.keyFindings}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relevance to ROWELL */}
          {literature.relevance && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('literature.relevanceToRowell')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <ReactMarkdown>{literature.relevance}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>{t('literature.publicationDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-semibold text-gray-700">{t('literature.doi')}</dt>
                  <dd className="text-gray-600">{literature.doi || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">{t('literature.year')}</dt>
                  <dd className="text-gray-600">{literature.year}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-semibold text-gray-700">{t('literature.journal')}</dt>
                  <dd className="text-gray-600">{literature.journal}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
