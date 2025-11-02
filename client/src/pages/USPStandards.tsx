import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

export default function USPStandards() {
  const { t } = useTranslation();
  
  const uspStandards = [
    { code: "L1", name: "Octadecylsilane (C18)", description: t('usp.standards.L1.description'), details: t('usp.standards.L1.details') },
    { code: "L7", name: "Octylsilane (C8)", description: t('usp.standards.L7.description'), details: t('usp.standards.L7.details') },
    { code: "L11", name: "Phenylsilane", description: t('usp.standards.L11.description'), details: t('usp.standards.L11.details') },
    { code: "L60", name: "HILIC", description: t('usp.standards.L60.description'), details: t('usp.standards.L60.details') },
    { code: "L10", name: "Nitrile", description: t('usp.standards.L10.description'), details: t('usp.standards.L10.details') },
    { code: "L3", name: "Porous silica", description: t('usp.standards.L3.description'), details: t('usp.standards.L3.details') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">{t('usp.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('usp.subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8">
          <p className="text-muted-foreground">
            {t('usp.intro')}
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
