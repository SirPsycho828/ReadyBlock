import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Clock, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_ADMIN_MESSAGES } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminBroadcastDialog from '@/components/admin/AdminBroadcastDialog';

const TYPE_STYLES = {
  emergency: { bg: 'bg-[var(--color-status-alert)]', text: 'text-white' },
  urgent: { bg: 'bg-[var(--color-status-caution)]', text: 'text-white' },
  info: { bg: 'bg-primary', text: 'text-primary-foreground' },
};

function formatTimestamp(date) {
  if (!date) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminMessages() {
  const { t } = useTranslation();
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Messages
        </h1>
        <Button onClick={() => setBroadcastOpen(true)}>
          <Megaphone size={16} />
          New Broadcast
        </Button>
      </div>

      {/* Message list */}
      <div className="space-y-4">
        {MOCK_ADMIN_MESSAGES.map((msg) => {
          const style = TYPE_STYLES[msg.type] || TYPE_STYLES.info;
          const ackPct = msg.recipientCount > 0
            ? Math.round((msg.acknowledgedCount / msg.recipientCount) * 100)
            : 0;

          return (
            <Card key={msg.id} className="gap-0 py-0 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Top row: badge + title */}
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${style.bg} ${style.text}`}
                    style={{ borderRadius: 'var(--radius-city)' }}
                  >
                    {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] flex-1">
                    {msg.title}
                  </span>
                </div>

                {/* Body (truncated) */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {msg.body}
                </p>

                {/* Footer row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Megaphone size={12} aria-hidden="true" />
                    {msg.sender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} aria-hidden="true" />
                    {formatTimestamp(msg.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} aria-hidden="true" />
                    {msg.targets}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} aria-hidden="true" />
                    {msg.acknowledgedCount} of {msg.recipientCount} acknowledged ({ackPct}%)
                  </span>
                </div>

                {/* Acknowledge progress bar */}
                <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-brand-primary)] rounded-full transition-all"
                    style={{ width: `${ackPct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {MOCK_ADMIN_MESSAGES.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
          No messages yet.
        </p>
      )}

      {/* Broadcast Dialog */}
      <AdminBroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </div>
  );
}
