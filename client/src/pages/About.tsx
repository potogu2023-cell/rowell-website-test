import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">About ROWELL</h1>
          <p className="text-lg text-muted-foreground">
            Connecting brands with users, building pathways in global trade
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-4">
                ROWELL's brand design concept originates from the pronunciation of "roadwell", symbolizing the connection 
                between brand manufacturers and users, establishing a communication bridge for products, and serving as a 
                pathway builder in global trade.
              </p>
              <p className="text-muted-foreground mb-4">
                Shanghai Luweimei E-commerce Co., Ltd. was established in 2020. Over the past 5 years, our team has been 
                preparing and accumulating expertise. Our personnel have over 10 years of experience in the HPLC field. 
                We specialize in the global sales of HPLC columns and related consumables.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Providing high-quality HPLC columns from trusted manufacturers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Global Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connecting customers worldwide with reliable chromatography solutions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Technical Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Leveraging 10+ years of HPLC expertise for customer success
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Company Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">2020</div>
                <p className="text-muted-foreground">Established with rich professional experience</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">11</div>
                <p className="text-muted-foreground">Globally renowned brand product lines</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">4</div>
                <p className="text-muted-foreground">Major regions served worldwide</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
