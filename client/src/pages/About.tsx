import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">{t('about.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-6">{t('about.our_story')}</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-4">
                {t('home.about_description')}
              </p>
              <p className="text-muted-foreground mb-4">
                Shanghai Luweimei E-commerce Co., Ltd. was established in 2020. Over the past 5 years, our team has been 
                preparing and accumulating expertise. Our personnel have over 10 years of experience in the HPLC field. 
                We specialize in the global sales of HPLC columns and related consumables.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">{t('about.our_mission')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('home.about_value_1_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_1_desc')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('home.about_value_2_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_2_desc')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('home.about_value_3_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('home.about_value_3_desc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">{t('about.company_highlights')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">{t('home.about_milestone_1_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_1_title')}</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">{t('home.about_milestone_2_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_2_title')}</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">{t('home.about_milestone_3_year')}</div>
                <p className="text-muted-foreground">{t('home.about_milestone_3_title')}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
