import { useParams, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, FlaskConical, CheckCircle, BookOpen, ChevronRight } from "lucide-react";

// Industry configuration
const INDUSTRIES = {
  pharmaceutical: {
    slug: "pharmaceutical",
    icon: "💊",
    color: "blue",
    gradientFrom: "from-blue-50",
    gradientTo: "to-white",
    badgeColor: "bg-blue-100 text-blue-800",
    accentColor: "text-blue-700",
    borderColor: "border-blue-200",
    bgLight: "bg-blue-50",
    searchQuery: "pharmaceutical",
  },
  "food-safety": {
    slug: "food-safety",
    icon: "🍎",
    color: "orange",
    gradientFrom: "from-orange-50",
    gradientTo: "to-white",
    badgeColor: "bg-orange-100 text-orange-800",
    accentColor: "text-orange-700",
    borderColor: "border-orange-200",
    bgLight: "bg-orange-50",
    searchQuery: "food",
  },
  environmental: {
    slug: "environmental",
    icon: "🌿",
    color: "green",
    gradientFrom: "from-green-50",
    gradientTo: "to-white",
    badgeColor: "bg-green-100 text-green-800",
    accentColor: "text-green-700",
    borderColor: "border-green-200",
    bgLight: "bg-green-50",
    searchQuery: "environmental",
  },
  biopharmaceutical: {
    slug: "biopharmaceutical",
    icon: "🧬",
    color: "purple",
    gradientFrom: "from-purple-50",
    gradientTo: "to-white",
    badgeColor: "bg-purple-100 text-purple-800",
    accentColor: "text-purple-700",
    borderColor: "border-purple-200",
    bgLight: "bg-purple-50",
    searchQuery: "biopharmaceutical",
  },
};

export default function IndustryApplication() {
  const params = useParams<{ industry: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const industrySlug = params.industry || "pharmaceutical";
  const config = INDUSTRIES[industrySlug as keyof typeof INDUSTRIES] || INDUSTRIES.pharmaceutical;

  // Get translation key mapping
  const translationKey = industrySlug === "food-safety" ? "food_beverage" : industrySlug;
  const industryData = t(`applications.${translationKey}`, { returnObjects: true }) as any;

  if (!industryData || typeof industryData === "string") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Industry Not Found</h2>
          <Button onClick={() => setLocation("/applications")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  const title = industryData.title || industrySlug;
  const description = industryData.description || "";
  const analysisItems = industryData.analysisItems || [];
  const columns = industryData.columns || [];
  const cases = industryData.cases || [];
  const challenges = industryData.challenges || [];
  const standards = industryData.standards || [];

  const metaTitle = `${title} HPLC Solutions | ROWELL`;
  const metaDescription = `${title} HPLC chromatography solutions from ROWELL. Expert column selection, application notes, and global supply for ${title.toLowerCase()} labs. Request a quote today.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        url={`/applications/${industrySlug}`}
      />

      {/* Hero Section */}
      <div className={`bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo} py-16`}>
        <div className="container">
          <Button
            variant="ghost"
            onClick={() => setLocation("/applications")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Applications
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{config.icon}</span>
            <div>
              <Badge className={`${config.badgeColor} mb-2`}>Industry Solution</Badge>
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mt-4">
            {description}
          </p>
          <div className="flex gap-3 mt-8">
            <Button
              onClick={() => setLocation(`/products?search=${config.searchQuery}`)}
              size="lg"
            >
              Browse {title} Columns
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/contact")}
            >
              Request Expert Consultation
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-12 space-y-16">

        {/* Analysis Applications */}
        {analysisItems.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <FlaskConical className={`w-6 h-6 ${config.accentColor}`} />
              <h2 className="text-2xl font-bold">Key Analysis Applications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border ${config.borderColor} ${config.bgLight}`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.accentColor}`} />
                    <div>
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Columns */}
        {columns.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className={`w-6 h-6 ${config.accentColor}`} />
              <h2 className="text-2xl font-bold">Recommended HPLC Columns</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${config.bgLight} border-b ${config.borderColor}`}>
                    <th className="text-left p-4 font-semibold">Column Type</th>
                    <th className="text-left p-4 font-semibold">USP Code</th>
                    <th className="text-left p-4 font-semibold">Particle Size</th>
                    <th className="text-left p-4 font-semibold">Dimensions</th>
                    <th className="text-left p-4 font-semibold">Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((col: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">{col.type}</td>
                      <td className="p-4">
                        <Badge variant="outline">{col.usp}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{col.particleSize}</td>
                      <td className="p-4 text-muted-foreground">{col.dimensions}</td>
                      <td className="p-4 text-sm text-muted-foreground">{col.applications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setLocation(`/products?search=${config.searchQuery}`)}
              >
                View All {title} Columns in Our Catalog
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        )}

        {/* Application Cases */}
        {cases.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8">Application Case Studies</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cases.map((c: any, idx: number) => (
                <Card key={idx} className={`border ${config.borderColor}`}>
                  <CardHeader className={`${config.bgLight} rounded-t-lg`}>
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{c.goal}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sample</span>
                        <p className="text-sm mt-1">{c.sample}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Column</span>
                        <p className="text-sm mt-1 font-medium">{c.column}</p>
                      </div>
                      {c.parameters && (
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conditions</span>
                          <div className="mt-1 grid grid-cols-2 gap-1">
                            {Object.entries(c.parameters).map(([key, val]: [string, any]) => (
                              <div key={key} className="text-xs">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                                <span>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Challenges & Solutions */}
        {challenges.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8">Common Challenges & Solutions</h2>
            <div className="space-y-4">
              {challenges.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-lg border border-gray-200 bg-white">
                  <div>
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Challenge</span>
                    <p className="text-sm mt-1 font-medium">{item.challenge}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Solution</span>
                    <p className="text-sm mt-1 text-muted-foreground">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regulatory Standards */}
        {standards.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8">Relevant Regulatory Standards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {standards.map((std: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-4 rounded-lg border border-gray-200">
                  <Badge className={`${config.badgeColor} self-start flex-shrink-0`}>{std.standard}</Badge>
                  <p className="text-sm text-muted-foreground">{std.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className={`rounded-2xl ${config.bgLight} border ${config.borderColor} p-10 text-center`}>
          <h2 className="text-2xl font-bold mb-3">Ready to Optimize Your {title} Workflow?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our chromatography experts are ready to help you select the right column and method for your specific application. Global shipping available to 50+ countries.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => setLocation("/contact")}>
              Get Expert Consultation
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation(`/products?search=${config.searchQuery}`)}>
              Browse {title} Products
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
