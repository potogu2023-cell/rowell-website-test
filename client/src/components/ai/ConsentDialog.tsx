import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ConsentDialogProps {
  onConsent: (mode: 'standard' | 'privacy') => void;
  onSkip: () => void;
}

export default function ConsentDialog({ onConsent, onSkip }: ConsentDialogProps) {
  const [selectedMode, setSelectedMode] = useState<'standard' | 'privacy'>('standard');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Privacy & Data Storage
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to use the AI Product Advisor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as 'standard' | 'privacy')}>
            {/* Standard Mode */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="standard" id="standard" />
              <Label htmlFor="standard" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Standard Mode (Recommended)
                </div>
                <p className="text-sm text-gray-600">
                  Your conversations are encrypted and stored for 120 days to provide personalized recommendations 
                  and improve service quality. You can delete your data anytime.
                </p>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>✅ Conversation history</div>
                  <div>✅ Personalized recommendations</div>
                  <div>✅ AES-256 encryption</div>
                  <div>✅ Self-service deletion</div>
                </div>
              </Label>
            </div>

            {/* Privacy Mode */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="privacy" id="privacy" />
              <Label htmlFor="privacy" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <EyeOff className="w-4 h-4 text-green-600" />
                  Privacy Mode
                </div>
                <p className="text-sm text-gray-600">
                  Your conversations are NOT stored. Each session is independent with no history. 
                  Maximum privacy but limited personalization.
                </p>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>✅ Zero data storage</div>
                  <div>✅ Maximum privacy</div>
                  <div>⚠️ No conversation history</div>
                  <div>⚠️ Limited personalization</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Show Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showDetails ? 'Hide details' : 'Show technical details'}
          </button>

          {/* Technical Details */}
          {showDetails && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Data Protection & Compliance
              </h4>
              
              <div className="space-y-2 text-gray-700">
                <p><strong>Encryption:</strong> AES-256-CBC encryption for all stored messages</p>
                <p><strong>Retention:</strong> Standard mode: 120 days, then auto-deleted</p>
                <p><strong>Access Control:</strong> Only you can access your conversation history</p>
                <p><strong>GDPR Compliant:</strong> Full compliance with EU data protection regulations</p>
                <p><strong>Your Rights:</strong> View, export, or delete your data anytime</p>
                <p><strong>No Sharing:</strong> Your conversations are never shared with third parties</p>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-600">
                  <strong>Disclaimer:</strong> AI suggestions are for reference only. 
                  For pricing, ordering, and commercial inquiries, please contact Oscar directly 
                  at oscar@rowellhplc.com or WhatsApp +86 180 1705 0064.
                </p>
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-gray-700">
            <p className="font-semibold mb-1">⚠️ Important Legal Notice</p>
            <p>
              The AI advisor provides technical suggestions only and does not guarantee product performance, 
              suitability, or results. ROWELL is not liable for decisions made based on AI recommendations. 
              Always consult with qualified professionals for critical applications.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-gray-600"
          >
            Skip (Use Privacy Mode)
          </Button>
          <Button
            onClick={() => onConsent(selectedMode)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue with {selectedMode === 'standard' ? 'Standard' : 'Privacy'} Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
