import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, DollarSign, Wrench, Star, Bot, MessageCircle, Lightbulb, Target, Zap, Rocket } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  
  const brands = [
    {
      name: "Waters",
      prefix: "WTS-",
      category: "HPLC Columns",
      series: "ACQUITY Premier, XBridge, CORTECS series",
      count: "50+",
      color: "blue"
    },
    {
      name: "Agilent",
      prefix: "AGIL-",
      category: "HPLC Columns",
      series: "InfinityLab Poroshell, ZORBAX series",
      count: "50+",
      color: "green"
    },
    {
      name: "Thermo Fisher Scientific",
      prefix: "THER-",
      category: "HPLC Columns",
      series: "Hypersil GOLD, Accucore series",
      count: "50+",
      color: "orange"
    },
    {
      name: "Phenomenex",
      prefix: "PHEN-",
      category: "HPLC Columns",
      series: "Kinetex, Luna Omega, Gemini series",
      count: "50+",
      color: "purple"
    },
    {
      name: "Shimadzu",
      prefix: "SHIM-",
      category: "HPLC Columns",
      series: "Shim-pack Arata, Scepter, Velox series",
      count: "50+",
      color: "gray"
    },
    {
      name: "YMC",
      prefix: "YMC-",
      category: "HPLC Columns",
      series: "YMC-Triart, Pack Pro, Actus series",
      count: "50+",
      color: "gray"
    },
    {
      name: "Daicel",
      prefix: "DAIC-",
      category: "Chiral Columns",
      series: "CHIRALPAK, CHIRALCEL, CROWNPAK series",
      count: "50+",
      color: "gray"
    },
    {
      name: "Tosoh",
      prefix: "TOSO-",
      category: "HPLC Columns",
      series: "TSKgel ODS, Super-ODS, ODS-140HTP series",
      count: "50+",
      color: "gray"
    },
    {
      name: "Avantor",
      prefix: "AVAN-",
      category: "HPLC Columns",
      series: "ACE, NUCLEODUR, NUCLEOSHELL series",
      count: "50+",
      color: "gray"
    },
    {
      name: "TSKgel",
      prefix: "TSK-",
      category: "HPLC Columns",
      series: "Super-ODS, ODS-140HTP, HILIC series",
      count: "40+",
      color: "gray"
    },
    {
      name: "Merck",
      prefix: "MERC-",
      category: "HPLC Columns",
      series: "Chromolith, LiChroCART, Purospher series",
      count: "35+",
      color: "gray"
    }
  ];

  const uspStandards = [
    { code: "L1", name: "Octadecylsilane (C18)", description: t('home.usp_l1_desc') || "Most common reversed-phase packing", count: "200+" },
    { code: "L7", name: "Octylsilane (C8)", description: t('home.usp_l7_desc') || "Intermediate hydrophobicity", count: "150+" },
    { code: "L11", name: "Phenylsilane", description: t('home.usp_l11_desc') || "Aromatic selectivity", count: "100+" },
    { code: "L60", name: "HILIC", description: t('home.usp_l60_desc') || "Polar compound separation", count: "50+" }
  ];

  const testimonials = [
    {
      name: t('home.testimonial_1_name'),
      role: t('home.testimonial_1_role'),
      initials: "JL",
      rating: 5,
      text: t('home.testimonial_1_text')
    },
    {
      name: t('home.testimonial_2_name'),
      role: t('home.testimonial_2_role'),
      initials: "MS",
      rating: 5,
      text: t('home.testimonial_2_text')
    },
    {
      name: t('home.testimonial_3_name'),
      role: t('home.testimonial_3_role'),
      initials: "SA",
      rating: 5,
      text: t('home.testimonial_3_text')
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section - AI-Powered */}
      <section className="bg-gradient-to-b from-blue-50 via-purple-50 to-white py-20">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            {t('home.ai_powered_badge')}
          </div>
          <h1 className="text-5xl font-bold mb-4">
            {t('home.hero_title') || 'Smart Chromatography Solutions'}
          </h1>
          <p className="text-xl text-primary mb-6 font-semibold">
            {t('home.hero_subtitle')}
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('home.hero_description')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('home.ask_ai_advisor')}
            </Button>
            <Button size="lg" asChild>
              <Link href="/products">
                <a>{t('home.browse_products') || 'Browse Products'}</a>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                <a>{t('home.contact_us') || 'Contact Us'}</a>
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>{t('home.response_time')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <span>{t('home.accuracy_rate')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span>{t('home.labs_served')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ROWELL - AI-Powered Advantages */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.why_choose_title')}</h2>
            <p className="text-muted-foreground">{t('home.why_choose_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Advantage 1: AI-Powered Technical Support */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t('home.advantage_1_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('home.advantage_1_desc')}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{t('home.advantage_1_feature_1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{t('home.advantage_1_feature_2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{t('home.advantage_1_feature_3')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advantage 2: Multi-Brand Solution */}
            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('home.advantage_2_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('home.advantage_2_desc')}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{t('home.advantage_2_feature_1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{t('home.advantage_2_feature_2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{t('home.advantage_2_feature_3')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advantage 3: Professional Service */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{t('home.advantage_3_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('home.advantage_3_desc')}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{t('home.advantage_3_feature_1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{t('home.advantage_3_feature_2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{t('home.advantage_3_feature_3')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Portfolio */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.product_portfolio')}</h2>
            <p className="text-muted-foreground">{t('home.product_portfolio_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Card key={brand.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{brand.name}</CardTitle>
                      <CardDescription>{brand.category}</CardDescription>
                    </div>
                    <span className={`brand-badge brand-badge-${brand.color}`}>
                      {brand.prefix}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{brand.series}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{brand.count} {t('common.products') || 'Products'}</span>
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/products?brand=${brand.name}`}>
                        <a>{t('home.view_products')} →</a>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/products">
                <a>{t('home.browse_all')}</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About ROWELL */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">{t('home.about_title')}</h2>
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-muted-foreground text-center mb-6">
                {t('home.about_description')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{t('home.about_milestone_1_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_1_title')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{t('home.about_milestone_2_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_2_title')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{t('home.about_milestone_3_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_3_title')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">1</span>
                    {t('home.about_value_1_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_1_desc')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">2</span>
                    {t('home.about_value_2_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_2_desc')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">3</span>
                    {t('home.about_value_3_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_3_desc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* USP Standards Reference */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.usp_title')}</h2>
            <p className="text-muted-foreground">{t('home.usp_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uspStandards.map((standard) => (
              <Card key={standard.code} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary">{standard.code}</CardTitle>
                  <CardDescription className="text-base">{standard.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{standard.description}</p>
                  <p className="text-sm font-medium">{standard.count} {t('common.products') || 'Products'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" asChild>
              <Link href="/usp-standards">
                <a>{t('home.view_all_standards')}</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What Our Customers Say */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.testimonials_title')}</h2>
            <p className="text-muted-foreground">{t('home.testimonials_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{testimonial.initials}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <CardDescription className="text-sm">{testimonial.role}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{testimonial.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-lg">{t('home.stats_customers')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <p className="text-lg">{t('home.stats_satisfaction')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <p className="text-lg">{t('home.stats_countries')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.contact_title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('home.contact_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('home.contact_email_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t('home.contact_email_desc')}</p>
                <p className="text-sm font-medium">info@rowellhplc.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('home.contact_phone_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t('home.contact_phone_desc')}</p>
                <p className="text-sm font-medium">+86 021 57852663</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('home.contact_whatsapp_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t('home.contact_whatsapp_desc')}</p>
                <p className="text-sm font-medium">QR Code</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('home.contact_address_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t('home.contact_address_desc')}</p>
                <p className="text-sm font-medium">{t('home.contact_address')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
