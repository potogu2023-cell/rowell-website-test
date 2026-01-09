import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    productId: "",
    quantity: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email using mailto (simple approach)
      const subject = `Product Inquiry from ${formData.name}`;
      const body = `
Name: ${formData.name}
Company: ${formData.company}
Email: ${formData.email}
Phone: ${formData.phone}
Product ID: ${formData.productId}
Quantity: ${formData.quantity}

Message:
${formData.message}
      `.trim();

      const mailtoLink = `mailto:info@rowellhplc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      toast.success("Opening email client...");
      
      // Reset form
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        productId: "",
        quantity: "",
        message: "",
      });
    } catch (error) {
      toast.error("Failed to send inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Information Cards */}
          <div className="space-y-6">
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

          {/* Quick Inquiry Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Inquiry</CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productId">Product ID</Label>
                      <Input
                        id="productId"
                        placeholder="e.g., SHIM-227..."
                        value={formData.productId}
                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Inquiry"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
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
