import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2 } from 'lucide-react';
import { httpsCallable, getFunctions } from 'firebase/functions';

export default function AdminReports() {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(type) {
    setGenerating(true);
    try {
      const fn = httpsCallable(getFunctions(), 'generatePreparednessReport');
      const result = await fn({ type });
      if (result.data?.reportUrl) {
        window.open(result.data.reportUrl, '_blank');
      }
    } catch {
      // Handle error
    }
    setGenerating(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('nav.reports')}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <ReportCard
          icon={FileText}
          title={t('admin.preparednessReport')}
          description={t('admin.preparednessReportDesc')}
          onGenerate={() => handleGenerate('preparedness')}
          generating={generating}
        />
        <ReportCard
          icon={Download}
          title={t('admin.dataExport')}
          description={t('admin.dataExportDesc')}
          onGenerate={() => handleGenerate('export')}
          generating={generating}
        />
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, title, description, onGenerate, generating }) {
  const { t } = useTranslation();

  return (
    <div
      className="rounded bg-[var(--color-surface-primary)] p-6 shadow-sm"
      style={{ borderRadius: 'var(--radius-city)' }}
    >
      <Icon size={24} className="text-[var(--color-brand-primary)] mb-3" aria-hidden="true" />
      <h2 className="font-bold text-[var(--color-text-primary)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">{description}</p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="rounded bg-[var(--color-brand-primary)] px-4 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
        style={{ minHeight: 44, borderRadius: 'var(--radius-city)' }}
      >
        {generating ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Download size={16} aria-hidden="true" />
        )}
        {t('admin.generate')}
      </button>
    </div>
  );
}
