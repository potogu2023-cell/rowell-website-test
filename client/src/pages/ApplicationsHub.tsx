import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { ChevronRight, Globe, Award, Zap } from "lucide-react";

const INDUSTRY_CARDS = [
  {
    slug: "pharmaceutical",
    icon: "💊",
    color: "blue",
    badgeColor: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-200",
    bgLight: "bg-blue-50",
    highlights: ["API Assay", "Impurity Profiling", "Stability Testing", "Chiral Separation"],
  },
  {
    slug: "food-safety",
    icon: "🍎",
    color: "orange",
    badgeColor: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-200",
    bgLight: "bg-orange-50",
    highlights: ["Vitamin Analysis", "Mycotoxin Detection", "Preservative Testing", "Sweetener Analysis"],
  },
  {
    slug: "environmental",
    icon: "🌿",
    color: "green",
    badgeColor: "bg-green-100 text-green-800",
    borderColor: "border-green-200",
    bgLight: "bg-green-50",
    highlights: ["Pesticide Residues", "PAH Analysis", "Heavy Metals", "Water Quality"],
  },
  {
    slug: "biopharmaceutical",
    icon: "🧬",
    color: "purple",
    badgeColor: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-200",
    bgLight: "bg-purple-50",
    highlights: ["Protein Analysis", "mAb Characterization", "Peptide Mapping", "Biosimilar Testing"],
  },
];

export default function ApplicationsHub() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="HPLC Applications by Industry | Pharmaceutical, Food Safety, Environmental - ROWELL"
        description="Expert HPLC chromatography solutions for pharmaceutical, food safety, environmental, and biopharmaceutical industries. Application notes, column selection guides, and global supply from ROWELL."
        url="/applications"
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container text-center">
          <Badge className="bg-slate-100 text-slate-700 mb-4">Industry Solutions</Badge>
          <h1 className="text-4xl font-bold mb-4">
            HPLC Solutions for Every Industry
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From pharmaceutical quality control to environmental monitoring, ROWELL provides
            expert chromatography solutions tailored to your industry's specific regulatory
            requirements and analytical challenges.
          </p>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="border-y border-gray-100 bg-white py-6">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Global Shipping to 50+ Countries</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">13 Premium Brands, 2,500+ Products</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Expert Technical Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Cards */}
      <div className="container py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Select Your Industry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDUSTRY_CARDS.map((industry) => {
            const translationKey = industry.slug === "food-safety" ? "food_beverage" : industry.slug;
            const industryData = t(`applications.${translationKey}`, { returnObjects: true }) as any;
            const title = typeof industryData === "object" ? industryData.title : industry.slug;
            const description = typeof industryData === "object" ? industryData.description?.slice(0, 180) + "..." : "";

            return (
              <Card
                key={industry.slug}
                className={`border ${industry.borderColor} hover:shadow-lg transition-all cursor-pointer group`}
                onClick={() => setLocation(`/applications/${industry.slug}`)}
              >
                <CardHeader className={`${industry.bgLight} rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{industry.icon}</span>
                      <div>
                        <Badge className={industry.badgeColor}>Industry Solution</Badge>
                        <CardTitle className="mt-1 text-xl">{title}</CardTitle>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription className="text-sm leading-relaxed mb-4">
                    {description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {industry.highlights.map((h) => (
                      <Badge key={h} variant="outline" className="text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    className="mt-5 w-full"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/applications/${industry.slug}`);
                    }}
                  >
                    View {title} Solutions
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Can't Find Your Application?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Our technical team has expertise across all areas of chromatography. Contact us for a custom solution tailored to your specific analytical needs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setLocation("/contact")}
            >
              Contact Our Experts
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => setLocation("/products")}
            >
              Browse All Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
