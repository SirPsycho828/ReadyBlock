import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  CloudOff,
} from 'lucide-react';
import { useSyncStore } from '@/stores/syncStore';

const STATUS_CONFIG = {
  synced: {
    icon: CheckCircle,
    colorClass: 'text-[var(--color-status-confirmed)]',
    i18nKey: null, // hidden when synced
  },
  syncing: {
    icon: Loader2,
    colorClass: 'text-[var(--color-brand-primary)]',
    i18nKey: 'sync.syncing',
    spin: true,
  },
  failed: {
    icon: AlertCircle,
    colorClass: 'text-[var(--color-status-alert)]',
    i18nKey: 'sync.failed',
    interactive: true,
  },
  offline: {
    icon: WifiOff,
    colorClass: 'text-[var(--color-status-neutral)]',
    i18nKey: 'sync.offline',
  },
  stale: {
    icon: AlertTriangle,
    colorClass: 'text-[var(--color-status-caution)]',
    i18nKey: 'sync.stale',
    banner: true,
  },
  'never-synced': {
    icon: CloudOff,
    colorClass: 'text-[var(--color-status-alert)]',
    i18nKey: 'sync.neverSynced',
    banner: true,
    critical: true,
  },
  reconnecting: {
    icon: RefreshCw,
    colorClass: 'text-[var(--color-brand-primary)]',
    i18nKey: 'sync.reconnecting',
    spin: true,
  },
  'queue-pending': {
    icon: Loader2,
    colorClass: 'text-[var(--color-status-caution)]',
    i18nKey: 'sync.queuePending',
  },
};

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SyncStatusIndicator() {
  const { t } = useTranslation();
  const { status, lastSynced, queueCount } = useSyncStore();

  // Don't show anything when fully synced
  if (status === 'synced') return null;

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const timeStr = formatRelativeTime(lastSynced);
  const message = config.i18nKey
    ? t(config.i18nKey, { time: timeStr, count: queueCount })
    : null;

  if (config.banner) {
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 text-sm ${
          config.critical
            ? 'bg-[var(--color-status-alert-bg)] text-white'
            : 'bg-[var(--color-status-caution)] text-[var(--color-text-primary)]'
        }`}
        role="status"
        aria-live="polite"
      >
        <Icon
          size={16}
          className={config.spin ? 'animate-spin' : ''}
          aria-hidden="true"
        />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${config.colorClass}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        size={14}
        className={config.spin ? 'animate-spin' : ''}
        aria-hidden="true"
      />
      {message && <span>{message}</span>}
      {status === 'queue-pending' && (
        <button
          className="underline ml-1 font-medium"
          style={{ minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          {t('sync.viewQueue')}
        </button>
      )}
    </div>
  );
}
