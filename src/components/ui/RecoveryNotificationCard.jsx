import { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { MOCK_RECOVERY_NOTIFICATION } from '@/lib/mockData';

export function RecoveryNotificationCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { title, body, sender, timestamp } = MOCK_RECOVERY_NOTIFICATION;

  return (
    <div className="relative rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg shadow-amber-100/50">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 rounded-full p-1 text-amber-500/60 hover:text-amber-600 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Megaphone size={20} className="text-amber-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 pr-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            {sender}
          </p>
          <p className="font-bold text-foreground mt-0.5 leading-tight">{title}</p>
          <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{body}</p>
          <p className="text-xs text-amber-500/60 mt-2">
            {timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
