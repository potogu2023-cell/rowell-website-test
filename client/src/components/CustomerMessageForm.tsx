import { useState } from "react";
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
  description = "Have questions? Send us a message and we'll get back to you soon."
}: CustomerMessageFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
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
        message: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CustomerMessageForm] Form submitted', formData);
    
    if (!formData.name || !formData.email || !formData.message) {
      console.log('[CustomerMessageForm] Validation failed');
      toast.error("Please fill in all required fields");
      return;
    }
    
    console.log('[CustomerMessageForm] Validation passed, calling API...');

    createMessageMutation.mutate({
      type: 'message',
      name: formData.name,
      email: formData.email,
      company: formData.company,
      phone: formData.phone,
      productId: productId,
      productName: productName,
      message: formData.message,
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
              <Label htmlFor="name">{t('contact.name_label')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('contact.name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">{t('contact.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('contact.email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">{t('contact.company_label')}</Label>
              <Input
                id="company"
                type="text"
                placeholder={t('contact.company_placeholder')}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">{t('contact.phone_label')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('contact.phone_placeholder')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">{t('contact.message_label')}</Label>
            <Textarea
              id="message"
              placeholder={t('contact.message_placeholder')}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
            />
          </div>

          {/* 友情提示 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">💡 {t('contact.reminder_title')}:</span> {t('contact.reminder_message')}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createMessageMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {createMessageMutation.isPending ? t('contact.sending') : t('contact.send_button')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
