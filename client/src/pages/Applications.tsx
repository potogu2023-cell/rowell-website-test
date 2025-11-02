import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

export default function Applications() {
  const { t } = useTranslation();
  
  const applications = [
    {
      title: t('applications.pharmaceutical.title'),
      description: t('applications.pharmaceutical.description'),
      icon: "💊"
    },
    {
      title: t('applications.environmental.title'),
      description: t('applications.environmental.description'),
      icon: "🌍"
    },
    {
      title: t('applications.food.title'),
      description: t('applications.food.description'),
      icon: "🍎"
    },
    {
      title: t('applications.biochemistry.title'),
      description: t('applications.biochemistry.description'),
      icon: "🧬"
    },
    {
      title: t('applications.clinical.title'),
      description: t('applications.clinical.description'),
      icon: "🔬"
    },
    {
      title: t('applications.chemical.title'),
      description: t('applications.chemical.description'),
      icon: "⚗️"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">{t('applications.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('applications.subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8">
          <p className="text-muted-foreground">
            {t('applications.intro')}
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
