import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useTranslation } from 'react-i18next';

interface ProductInquiryButtonProps {
  productId: string;
  productName: string;
  productPartNumber?: string;
}

export default function ProductInquiryButton({ 
  productId, 
  productName,
  productPartNumber 
}: ProductInquiryButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const createInquiryMutation = trpc.customerMessage.create.useMutation({
    onSuccess: (data) => {
      toast.success(t('contact.inquiry_success'));
      setOpen(false);
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
      toast.error(error.message || t('contact.inquiry_error'));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('contact.required_fields'));
      return;
    }

    createInquiryMutation.mutate({
      type: 'inquiry',
      name: formData.name,
      email: formData.email,
      company: formData.company,
      phone: formData.phone,
      productId: productId,
      productName: productName,
      productPartNumber: productPartNumber,
      message: formData.message,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <DollarSign className="w-4 h-4 mr-2" />
          {t('productInquiry.request_quote')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('productInquiry.inquiry_title')}</DialogTitle>
          <DialogDescription>
            {t('productInquiry.inquiry_description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 产品信息显示 */}
          <div className="p-3 bg-blue-50 rounded-md text-sm">
            <div className="font-medium text-blue-900 mb-1">{t('productInquiry.product_info')}:</div>
            <div className="text-blue-700">
              {productPartNumber && <div className="font-mono">{productPartNumber}</div>}
              <div>{productName}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inquiry-name">{t('contact.name_label')}</Label>
              <Input
                id="inquiry-name"
                type="text"
                placeholder={t('contact.name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="inquiry-email">{t('contact.email_label')}</Label>
              <Input
                id="inquiry-email"
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
              <Label htmlFor="inquiry-company">{t('contact.company_label')}</Label>
              <Input
                id="inquiry-company"
                type="text"
                placeholder={t('contact.company_placeholder')}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="inquiry-phone">{t('contact.phone_label')}</Label>
              <Input
                id="inquiry-phone"
                type="tel"
                placeholder={t('contact.phone_placeholder')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="inquiry-message">{t('productInquiry.inquiry_message_label')}</Label>
            <Textarea
              id="inquiry-message"
              placeholder={t('productInquiry.inquiry_message_placeholder')}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* 友情提示 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-medium">💡 {t('contact.reminder_title')}:</span> {t('contact.reminder_message')}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createInquiryMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {createInquiryMutation.isPending ? t('contact.sending') : t('contact.send_button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
