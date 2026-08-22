import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useTranslation } from 'react-i18next';

interface CustomerMessageFormProps {
  productId?: string;
  productName?: string;
  title?: string;
  description?: string;
}

export default function CustomerMessageForm({ 
  productId, 
  productName,
  title = "Leave a Message",
  description = "Use this form to send your product or technical inquiry."
}: CustomerMessageFormProps) {
  const { t } = useTranslation();
  const formId = useId();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    destinationCountry: "",
    message: "",
  });

  const createMessageMutation = trpc.messages.create.useMutation({
    onSuccess: (data) => {
      toast.success(t('contact.message_success'));
      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        destinationCountry: "",
        message: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.destinationCountry.trim() || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const normalizedDestination = formData.destinationCountry.trim().toLowerCase().replace(/\s+/g, " ");
    const mainlandChinaDestinations = new Set(["china", "mainland china", "people's republic of china", "prc", "中国", "中国大陆"]);
    if (mainlandChinaDestinations.has(normalizedDestination)) {
      toast.error("ROWELL does not serve mainland China.");
      return;
    }

    createMessageMutation.mutate({
      type: 'message',
      name: formData.name,
      email: formData.email,
      company: formData.company,
      phone: formData.phone,
      productId: productId,
      productName: productName,
      message: `${formData.message}\n\nDestination country/region: ${formData.destinationCountry.trim()}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {productId && (
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              <span className="font-medium">Product: </span>
              <span className="text-muted-foreground">
                {productId}{productName && ` - ${productName}`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${formId}-name`}>{t('contact.name_label')}</Label>
              <Input
                id={`${formId}-name`}
                type="text"
                autoComplete="name"
                placeholder={t('contact.name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor={`${formId}-email`}>{t('contact.email_label')}</Label>
              <Input
                id={`${formId}-email`}
                type="email"
                autoComplete="email"
                placeholder={t('contact.email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${formId}-company`}>{t('contact.company_label')}</Label>
              <Input
                id={`${formId}-company`}
                type="text"
                autoComplete="organization"
                placeholder={t('contact.company_placeholder')}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor={`${formId}-phone`}>{t('contact.phone_label')}</Label>
              <Input
                id={`${formId}-phone`}
                type="tel"
                autoComplete="tel"
                placeholder={t('contact.phone_placeholder')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`${formId}-destination`}>Destination country/region *</Label>
            <Input
              id={`${formId}-destination`}
              type="text"
              autoComplete="country-name"
              placeholder="Country or region where the products will be used"
              value={formData.destinationCountry}
              onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-message`}>{t('contact.message_label')}</Label>
            <Textarea
              id={`${formId}-message`}
              placeholder={t('contact.message_placeholder')}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{t('contact.reminder_title')}:</span> {t('contact.reminder_message')}
            </p>
            <p className="mt-1 text-xs text-blue-800">Do not include sensitive personal, payment, or instrument-login information.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createMessageMutation.isPending}
            data-conversion-action="general_inquiry_submit"
          >
            <Send className="w-4 h-4 mr-2" />
            {createMessageMutation.isPending ? t('contact.sending') : t('contact.send_button')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
