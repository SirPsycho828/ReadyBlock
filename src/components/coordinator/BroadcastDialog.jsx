import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MESSAGE_TYPES = [
  { key: 'general', label: 'General', activeClass: 'bg-primary text-primary-foreground' },
  { key: 'urgent', label: 'Urgent', activeClass: 'bg-amber-500 text-white' },
  { key: 'emergency', label: 'Emergency', activeClass: 'bg-[#FF6B6B] text-white' },
];

const BADGE_VARIANT_MAP = {
  general: 'default',
  urgent: 'outline',
  emergency: 'destructive',
};

export default function BroadcastDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const [messageType, setMessageType] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function handleSend() {
    toast.success('Alert sent to 42 households');
    setTitle('');
    setBody('');
    setMessageType('general');
    onOpenChange(false);
  }

  function handleCancel() {
    setTitle('');
    setBody('');
    setMessageType('general');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            Send Alert
          </DialogTitle>
        </DialogHeader>

        {/* Message Type Pills */}
        <div className="flex gap-2">
          {MESSAGE_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setMessageType(type.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                messageType === type.key
                  ? type.activeClass
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Title Input */}
        <Input
          placeholder="Alert title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Body Textarea */}
        <Textarea
          placeholder="Message to your neighborhood..."
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* Preview Card */}
        {(title || body) && (
          <Card className="border-border bg-card/50">
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center gap-2">
                <Badge variant={BADGE_VARIANT_MAP[messageType]}>
                  {MESSAGE_TYPES.find((t) => t.key === messageType)?.label}
                </Badge>
                {title && (
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                )}
              </div>
              {body && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
              )}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!title.trim()}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
