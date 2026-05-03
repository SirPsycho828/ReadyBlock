import { useTranslation } from 'react-i18next';
import { MapPin, Pencil, Package, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MOCK_PRIMARY_RALLY_POINT,
  MOCK_BACKUP_RALLY_POINT,
} from '@/lib/mockData';

function SuppliesList({ supplies }) {
  return (
    <div className="space-y-1">
      {supplies.map((supply) => (
        <div
          key={supply.name}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground">{supply.name}</span>
          <span className="font-medium text-foreground tabular-nums">
            {supply.quantity}
          </span>
        </div>
      ))}
    </div>
  );
}

function RallyPointCard({ rallyPoint, variant = 'primary' }) {
  const isPrimary = variant === 'primary';

  return (
    <Card className={`rounded-2xl ${isPrimary ? '' : 'opacity-90'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin
              className={`size-5 ${isPrimary ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <Badge variant={isPrimary ? 'default' : 'secondary'}>
              {isPrimary ? 'Primary' : 'Backup'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info('Rally point editor coming soon')}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
        <CardTitle className={isPrimary ? 'text-lg' : 'text-base'}>
          {rallyPoint.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{rallyPoint.description}</p>

        {/* Supplies Grid */}
        {rallyPoint.supplies?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Package className="size-3.5" />
              Supplies
            </div>
            <SuppliesList supplies={rallyPoint.supplies} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RallyPoints() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Rally Points</h1>
      </div>

      {/* Primary Rally Point */}
      <RallyPointCard rallyPoint={MOCK_PRIMARY_RALLY_POINT} variant="primary" />

      {/* Backup Rally Point */}
      <RallyPointCard rallyPoint={MOCK_BACKUP_RALLY_POINT} variant="backup" />

      {/* Map Preview Note */}
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Map className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Map preview available on the{' '}
            <Link to="/map" className="font-medium text-primary hover:underline">
              Map tab
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
