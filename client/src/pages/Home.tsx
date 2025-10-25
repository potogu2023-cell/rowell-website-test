import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, DollarSign, Wrench, Star } from "lucide-react";

export default function Home() {
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
    { code: "L1", name: "Octadecylsilane (C18)", description: "Most common reversed-phase packing", count: "200+" },
    { code: "L7", name: "Octylsilane (C8)", description: "Intermediate hydrophobicity", count: "150+" },
    { code: "L11", name: "Phenylsilane", description: "Aromatic selectivity", count: "100+" },
    { code: "L60", name: "HILIC", description: "Polar compound separation", count: "50+" }
  ];

  const testimonials = [
    {
      name: "Dr. Jennifer Liu",
      role: "Senior Analytical Chemist, BioPharm Research",
      initials: "JL",
      rating: 5,
      text: "ROWELL has been our go-to supplier for HPLC columns for over 3 years. Their competitive pricing and reliable delivery have helped us maintain our research budget while ensuring consistent analytical results. The technical support team is knowledgeable and responsive."
    },
    {
      name: "Michael Schmidt",
      role: "QC Manager, Pharmaceutical Manufacturing",
      initials: "MS",
      rating: 5,
      text: "The quality of columns from ROWELL matches that of original manufacturers at a fraction of the cost. We have successfully validated multiple methods using their columns, and the reproducibility has been excellent. Highly recommend for any analytical laboratory."
    },
    {
      name: "Dr. Sarah Ahmed",
      role: "Research Director, Environmental Testing Lab",
      initials: "SA",
      rating: 5,
      text: "Working with ROWELL has streamlined our procurement process significantly. Their wide selection of brands and fast quotation turnaround allows us to focus on our analytical work rather than sourcing challenges. Professional service from start to finish."
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-4">Global HPLC Solutions</h1>
          <p className="text-xl text-primary mb-6">
            Professional · Reliable · Efficient
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            ROWELL is dedicated to providing high-quality HPLC columns and consumables to customers worldwide, 
            with competitive pricing and professional technical support, connecting brands with users globally.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                <a>Browse Products</a>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                <a>Contact Us</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose ROWELL */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose ROWELL</h2>
            <p className="text-muted-foreground">Our core advantages make your research more efficient</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Global Service Capability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Serving major markets worldwide, with professional services in Asia, Americas, Middle East, and CIS regions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Competitive Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Through optimized procurement channels, we offer more competitive pricing advantages than brand manufacturers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Expert Technical Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Over 10 years of HPLC industry experience, providing professional technical support and USP standard references
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Portfolio */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Product Portfolio</h2>
            <p className="text-muted-foreground">High-quality HPLC columns from 11 globally renowned brands</p>
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
                    <span className="text-sm font-medium">{brand.count} Products</span>
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/products?brand=${brand.name}`}>
                        <a>View Products →</a>
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
                <a>Browse All Products (600+)</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About ROWELL */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">About ROWELL</h2>
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-muted-foreground text-center mb-6">
                ROWELL's brand design concept originates from the pronunciation of "roadwell", symbolizing the connection 
                between brand manufacturers and users, establishing a communication bridge for products, and serving as a 
                pathway builder in global trade.
              </p>
              <p className="text-muted-foreground text-center">
                Shanghai Luweimei E-commerce Co., Ltd. was established in 2020. Over the past 5 years, our team has been 
                preparing and accumulating expertise. Our personnel have over 10 years of experience in the HPLC field. 
                We specialize in the global sales of HPLC columns and related consumables.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">2020</div>
                <p className="text-muted-foreground">Established in 2020, with rich professional experience</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">11</div>
                <p className="text-muted-foreground">Globally renowned brand product lines</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">4</div>
                <p className="text-muted-foreground">Serving Asia, Americas, Middle East, and CIS regions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">1</span>
                    Quality Assurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Providing high-quality HPLC columns from trusted manufacturers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">2</span>
                    Global Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connecting customers worldwide with reliable chromatography solutions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">3</span>
                    Technical Excellence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Leveraging 10+ years of HPLC expertise for customer success
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
            <h2 className="text-3xl font-bold mb-4">USP Standards Reference</h2>
            <p className="text-muted-foreground">Professional USP standard matching for your analytical needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uspStandards.map((usp) => (
              <Card key={usp.code}>
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{usp.code}</CardTitle>
                  <CardDescription className="font-semibold">{usp.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{usp.description}</p>
                  <p className="text-sm font-medium">{usp.count} Products</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/usp-standards">
                <a>View All USP Standards</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground">Trusted by researchers and laboratories worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">{testimonial.initials}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <CardDescription className="text-xs">{testimonial.role}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Satisfied Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Customer Satisfaction</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Countries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">Ready to provide professional chromatography solutions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Contact</CardTitle>
                <CardDescription>Send us an email for product information and quotations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-primary">info@rowellhplc.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phone Consultation</CardTitle>
                <CardDescription>Professional team providing technical support</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-primary">+86 021 57852663</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">WhatsApp Contact</CardTitle>
                <CardDescription>Scan QR code for WhatsApp contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">QR Code</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Address</CardTitle>
                <CardDescription>Welcome to visit and communicate</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-primary">Shanghai, China</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

