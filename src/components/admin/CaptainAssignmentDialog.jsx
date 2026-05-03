import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Trash2, Search, UserPlus, Mail } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const MOCK_SEARCH_RESULT = {
  uid: 'user-99',
  displayName: 'Jordan Rivera',
  email: 'jordan.r@email.com',
};

export default function CaptainAssignmentDialog({ open, onOpenChange, neighborhood }) {
  const { t } = useTranslation();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  if (!neighborhood) return null;

  function handleRemoveCaptain(captain) {
    toast.success(`Removed ${captain.displayName} as captain of ${neighborhood.name}`);
  }

  function handleSearch() {
    if (!searchEmail.trim()) return;
    // Mock: always return a result
    setSearchResult(MOCK_SEARCH_RESULT);
  }

  function handleAssign() {
    if (!searchResult) return;
    toast.success(`${searchResult.displayName} assigned as captain of ${neighborhood.name}`);
    setSearchEmail('');
    setSearchResult(null);
  }

  function handleClose() {
    setSearchEmail('');
    setSearchResult(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Manage Captains &mdash; {neighborhood.name}
          </DialogTitle>
        </DialogHeader>

        {/* Current captains */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Current Captains
          </label>

          {neighborhood.captains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No captains assigned
            </p>
          ) : (
            <div className="space-y-2">
              {neighborhood.captains.map((cap) => (
                <div
                  key={cap.uid}
                  className="flex items-center justify-between rounded border border-[var(--color-border-default)] px-3 py-2"
                  style={{ borderRadius: 'var(--radius-city)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {cap.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail size={10} aria-hidden="true" />
                      {cap.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveCaptain(cap)}
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Add captain section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Add Captain
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch} disabled={!searchEmail.trim()}>
              <Search size={14} />
              Search
            </Button>
          </div>

          {/* Search result */}
          {searchResult && (
            <Card className="gap-0 py-0 overflow-hidden border-[var(--color-brand-primary)]/30">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {searchResult.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                </div>
                <Button size="sm" onClick={handleAssign}>
                  <UserPlus size={14} />
                  Assign as Captain
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
