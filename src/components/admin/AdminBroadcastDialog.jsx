import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_NEIGHBORHOODS } from '@/lib/mockData';
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
import { Checkbox } from '@/components/ui/checkbox';

const TARGET_OPTIONS = [
  { key: 'all', label: 'All Neighborhoods' },
  { key: 'specific', label: 'Specific Neighborhoods' },
  { key: 'captains', label: 'Captains Only' },
];

const MESSAGE_TYPES = [
  { key: 'general', label: 'General', activeClass: 'bg-primary text-primary-foreground' },
  { key: 'urgent', label: 'Urgent', activeClass: 'bg-amber-500 text-white' },
  { key: 'emergency', label: 'Emergency', activeClass: 'bg-[var(--color-status-alert)] text-white' },
];

export default function AdminBroadcastDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const [target, setTarget] = useState('all');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  const [messageType, setMessageType] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const recipientSummary = useMemo(() => {
    if (target === 'all') {
      const totalHouseholds = MOCK_NEIGHBORHOODS.reduce((s, n) => s + n.householdCount, 0);
      return { households: totalHouseholds, neighborhoods: MOCK_NEIGHBORHOODS.length };
    }
    if (target === 'captains') {
      const captainCount = MOCK_NEIGHBORHOODS.reduce((s, n) => s + n.captains.length, 0);
      return { households: captainCount, neighborhoods: MOCK_NEIGHBORHOODS.length, isCaptains: true };
    }
    // specific
    const selected = MOCK_NEIGHBORHOODS.filter((n) => selectedNeighborhoods.includes(n.id));
    const totalHouseholds = selected.reduce((s, n) => s + n.householdCount, 0);
    return { households: totalHouseholds, neighborhoods: selected.length };
  }, [target, selectedNeighborhoods]);

  function toggleNeighborhood(id) {
    setSelectedNeighborhoods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function resetForm() {
    setTarget('all');
    setSelectedNeighborhoods([]);
    setMessageType('general');
    setTitle('');
    setBody('');
  }

  function handleSend() {
    const label = recipientSummary.isCaptains
      ? `${recipientSummary.households} captains`
      : `${recipientSummary.households} households`;
    toast.success(`Broadcast sent to ${label} across ${recipientSummary.neighborhoods} neighborhoods`);
    resetForm();
    onOpenChange(false);
  }

  function handleCancel() {
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            City-Wide Broadcast
          </DialogTitle>
        </DialogHeader>

        {/* Target selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">Target</label>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setTarget(opt.key);
                  if (opt.key !== 'specific') setSelectedNeighborhoods([]);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  target === opt.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Neighborhood checkboxes (only when "specific" is selected) */}
        {target === 'specific' && (
          <div className="space-y-2 max-h-40 overflow-y-auto rounded border border-[var(--color-border-default)] p-3">
            {MOCK_NEIGHBORHOODS.map((n) => (
              <label key={n.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedNeighborhoods.includes(n.id)}
                  onCheckedChange={() => toggleNeighborhood(n.id)}
                />
                <span className="text-sm text-[var(--color-text-primary)]">{n.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* Message type pills */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">Message Type</label>
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
        </div>

        {/* Title */}
        <Input
          placeholder="Broadcast title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Body */}
        <Textarea
          placeholder="Broadcast message..."
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* Recipient summary */}
        <p className="text-sm text-muted-foreground">
          {recipientSummary.isCaptains
            ? `Will be sent to ${recipientSummary.households} captains across ${recipientSummary.neighborhoods} neighborhoods`
            : `Will be sent to ${recipientSummary.households} households across ${recipientSummary.neighborhoods} neighborhoods`}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!title.trim() || (target === 'specific' && selectedNeighborhoods.length === 0)}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
