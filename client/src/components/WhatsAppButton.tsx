import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_CHAT_URL, WHATSAPP_QR_CODE_SRC } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function WhatsAppButton() {

  return (
    <>
      {/* Floating WhatsApp Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40 bg-green-500 hover:bg-green-600"
            aria-label="Contact us on WhatsApp"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact us on WhatsApp</DialogTitle>
            <DialogDescription>
              Scan the QR code or click the button below to start a conversation with us on WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* WhatsApp QR Code */}
            <img
              src={WHATSAPP_QR_CODE_SRC}
              alt="WhatsApp QR Code"
              className="w-64 h-64 object-contain"
            />
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with your phone to chat with us on WhatsApp
            </p>
            <Button
              onClick={() => window.open(WHATSAPP_CHAT_URL, '_blank', 'noopener,noreferrer')}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

