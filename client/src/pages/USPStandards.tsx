import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function USPStandards() {
  const uspStandards = [
    { code: "L1", name: "Octadecylsilane (C18)", description: "Most common reversed-phase packing", details: "The most widely used HPLC stationary phase for reversed-phase separations." },
    { code: "L7", name: "Octylsilane (C8)", description: "Intermediate hydrophobicity", details: "Shorter alkyl chain than C18, providing different selectivity." },
    { code: "L11", name: "Phenylsilane", description: "Aromatic selectivity", details: "Provides π-π interactions for aromatic compounds." },
    { code: "L60", name: "HILIC", description: "Polar compound separation", details: "Hydrophilic interaction chromatography for polar analytes." },
    { code: "L10", name: "Nitrile", description: "Polar interactions", details: "Cyano-bonded phase for unique selectivity." },
    { code: "L3", name: "Porous silica", description: "Normal phase", details: "Unmodified silica for normal-phase separations." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">USP Standards Reference</h1>
          <p className="text-lg text-muted-foreground">
            Professional USP standard matching for your analytical needs
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8">
          <p className="text-muted-foreground">
            The United States Pharmacopeia (USP) provides standardized column classifications to ensure 
            consistency in analytical methods. Our products are categorized according to USP standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uspStandards.map((usp) => (
            <Card key={usp.code}>
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{usp.code}</CardTitle>
                <CardDescription className="font-semibold text-lg">{usp.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{usp.description}</p>
                <p className="text-sm">{usp.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
