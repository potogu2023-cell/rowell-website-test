import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { clearInquiryList, readInquiryList, removeFromInquiryList, type InquiryListItem } from "@/lib/inquiryList";

export default function InquiryList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<InquiryListItem[]>([]);
  const [destinationCountry, setDestinationCountry] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const mutation = trpc.messages.create.useMutation({
    onSuccess: () => {
      toast.success(t("contact.inquiry_success"));
      clearInquiryList();
      setItems([]);
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
      setDestinationCountry("");
    },
    onError: (error) => toast.error(error.message || t("contact.inquiry_error")),
  });

  useEffect(() => {
    const sync = () => setItems(readInquiryList());
    sync();
    window.addEventListener("rowell:inquiry-list-updated", sync);
    return () => window.removeEventListener("rowell:inquiry-list-updated", sync);
  }, []);

  const productSummary = useMemo(() => items.map((item, index) => {
    const identifier = item.productPartNumber || item.productId;
    return `${index + 1}. ${identifier} — ${item.productName}${item.specification ? ` (${item.specification})` : ""}`;
  }).join("\n"), [items]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!items.length || !formData.name.trim() || !formData.email.trim() || !destinationCountry.trim()) {
      toast.error(t("contact.required_fields"));
      return;
    }
    const normalized = destinationCountry.trim().toLowerCase().replace(/\s+/g, " ");
    if (["china", "mainland china", "people's republic of china", "prc", "中国", "中国大陆"].includes(normalized)) {
      toast.error("ROWELL does not serve mainland China.");
      return;
    }
    mutation.mutate({
      type: "inquiry",
      name: formData.name.trim(),
      email: formData.email.trim(),
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      productId: items[0].productId,
      productName: items.length === 1 ? items[0].productName : `${items.length} products from inquiry list`,
      productPartNumber: items.length === 1 ? items[0].productPartNumber : undefined,
      message: `${formData.message.trim() || "Please review the selected products and advise on current specifications."}\n\nSelected products:\n${productSummary}\n\nDestination country/region: ${destinationCountry.trim()}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("inquiry.cart_title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("inquiry.cart_subtitle")}</p>
      </div>
      {!items.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">{t("inquiry.cart_empty")}</p>
            <p className="mt-2 text-muted-foreground">{t("inquiry.cart_empty_message")}</p>
            <Button asChild className="mt-6"><Link href="/products">{t("inquiry.browse_products")}</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader><CardTitle>{t("inquiry.product")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">{item.productPartNumber || item.productId}</p>
                    <p className="text-sm text-muted-foreground">{item.productName}</p>
                    {item.specification && <p className="mt-1 text-xs text-muted-foreground">{item.specification}</p>}
                  </div>
                  <Button variant="ghost" size="icon" aria-label={t("inquiry.remove")} onClick={() => setItems(removeFromInquiryList(item.productId))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => { clearInquiryList(); setItems([]); }}>{t("inquiry.remove")} all</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("inquiry.submit_inquiry")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4" aria-busy={mutation.isPending}>
                <div><Label htmlFor="inquiry-name">{t("contact.name_label")}</Label><Input id="inquiry-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div><Label htmlFor="inquiry-email">{t("contact.email_label")}</Label><Input id="inquiry-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                <div><Label htmlFor="inquiry-company">{t("contact.company_label")}</Label><Input id="inquiry-company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
                <div><Label htmlFor="inquiry-country">Destination country/region *</Label><Input id="inquiry-country" autoComplete="country-name" value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} required /></div>
                <div><Label htmlFor="inquiry-phone">{t("contact.phone_label")}</Label><Input id="inquiry-phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label htmlFor="inquiry-message">{t("inquiry.application_notes_optional")}</Label><Textarea id="inquiry-message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} maxLength={700} /></div>
                <Button type="submit" className="w-full" disabled={mutation.isPending} data-conversion-action="inquiry_list_submit"><Send className="mr-2 h-4 w-4" />{mutation.isPending ? t("contact.sending") : t("inquiry.submit_inquiry")}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
