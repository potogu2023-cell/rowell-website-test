import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Applications() {
  const applications = [
    {
      title: "Pharmaceutical Analysis",
      description: "Drug purity testing, impurity profiling, and stability studies",
      icon: "💊"
    },
    {
      title: "Environmental Testing",
      description: "Water quality analysis, pesticide residue detection",
      icon: "🌍"
    },
    {
      title: "Food & Beverage",
      description: "Additive analysis, contaminant detection, quality control",
      icon: "🍎"
    },
    {
      title: "Biochemistry",
      description: "Protein analysis, peptide mapping, amino acid analysis",
      icon: "🧬"
    },
    {
      title: "Clinical Research",
      description: "Biomarker discovery, metabolomics, drug metabolism studies",
      icon: "🔬"
    },
    {
      title: "Chemical Industry",
      description: "Polymer analysis, petrochemical testing, quality assurance",
      icon: "⚗️"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">Applications</h1>
          <p className="text-lg text-muted-foreground">
            HPLC solutions for diverse analytical needs across industries
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Our HPLC columns serve a wide range of applications across pharmaceutical, environmental, 
            food, and research sectors. With over 10 years of experience, we provide technical support 
            to help you select the right column for your specific analytical needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <Card key={app.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">{app.icon}</div>
                <CardTitle>{app.title}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
