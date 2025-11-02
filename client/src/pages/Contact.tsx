import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">{t('home.contact_title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('home.contact_subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>{t('home.contact_email_title')}</CardTitle>
              <CardDescription>{t('home.contact_email_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:info@rowellhplc.com" className="text-primary font-medium hover:underline">
                info@rowellhplc.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>{t('home.contact_phone_title')}</CardTitle>
              <CardDescription>{t('home.contact_phone_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="tel:+862157852663" className="text-primary font-medium hover:underline">
                +86 021 57852663
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>{t('home.contact_whatsapp_title')}</CardTitle>
              <CardDescription>{t('home.contact_whatsapp_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Scan QR code or contact us via WhatsApp</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>{t('home.contact_address_title')}</CardTitle>
              <CardDescription>{t('home.contact_address_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-primary font-medium">{t('home.contact_address')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 6:00 PM (GMT+8)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday - Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
