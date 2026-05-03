import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Flag, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { getNeighborhood } from '@/services/neighborhood.service';
import { getHousehold } from '@/services/household.service';
import localDb from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NeighborhoodMap from '@/components/map/NeighborhoodMap';

export default function MapView() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const storeNeighborhood = useNeighborhoodStore((s) => s.neighborhood);
  const households = useNeighborhoodStore((s) => s.households);
  const setNeighborhood = useNeighborhoodStore((s) => s.setNeighborhood);
  const setHouseholds = useNeighborhoodStore((s) => s.setHouseholds);
  const [neighborhood, setLocalNeighborhood] = useState(storeNeighborhood);
  const [userHousehold, setUserHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('households');

  useEffect(() => {
    async function load() {
      if (!user?.uid) { setLoading(false); return; }

      // Load user's household
      const res = await getHousehold(user.uid);
      const hh = res.success ? res.data : null;
      const nhId = hh?.neighborhoodId;

      if (nhId) {
        // User has an assigned neighborhood
        const nhRes = await getNeighborhood(nhId);
        if (nhRes.success) {
          const nhData = nhRes.data;
          setLocalNeighborhood(nhData);
          setNeighborhood(nhData);

          // Use real household coordinates when available, centroid only if missing
          if (hh && (!hh.lat || !hh.lng) && nhData.centroidLat) {
            setUserHousehold({ ...hh, lat: nhData.centroidLat, lng: nhData.centroidLng });
          } else {
            setUserHousehold(hh);
          }

          // Load households if store is empty
          if (households.length === 0) {
            try {
              const snap = await getDocs(
                query(collection(db, 'households'), where('neighborhoodId', '==', nhId)),
              );
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setHouseholds(list);
              for (const h of list) await localDb.households.put(h);
            } catch {
              // Offline: fall back to local cache
              const cached = await localDb.households.where('neighborhoodId').equals(nhId).toArray();
              if (cached.length) setHouseholds(cached);
            }
          }
        } else {
          setUserHousehold(hh);
        }
      } else {
        setUserHousehold(hh);
        // User not assigned — try to show nearest neighborhood from cache
        const allNh = await localDb.neighborhoods.toArray();
        if (allNh.length > 0) {
          const userLat = hh?.lat;
          const userLng = hh?.lng;
          if (userLat && userLng) {
            let nearest = allNh[0];
            let minDist = Infinity;
            for (const nh of allNh) {
              if (!nh.centroidLat) continue;
              const d = Math.hypot(nh.centroidLat - userLat, nh.centroidLng - userLng);
              if (d < minDist) { minDist = d; nearest = nh; }
            }
            setLocalNeighborhood(nearest);
          } else {
            setLocalNeighborhood(allNh[0]);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!neighborhood?.boundary) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          {t('nav.map')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin size={48} className="text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground text-center">
              {userHousehold?.assignmentStatus === 'unassigned'
                ? t('map.unassigned')
                : t('map.loading')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2 pb-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
        {neighborhood.name || t('nav.map')}
      </h1>

      {/* Map */}
      <Card className="overflow-hidden p-0">
        <NeighborhoodMap
          boundary={neighborhood.boundary}
          households={households}
          userHousehold={userHousehold}
          primaryRallyPoint={neighborhood.primaryRallyPoint}
          backupRallyPoint={neighborhood.backupRallyPoint}
          activeLayer={activeLayer}
        />
      </Card>

      {/* Layer toggle */}
      <Tabs value={activeLayer} onValueChange={setActiveLayer}>
        <TabsList className="w-full">
          <TabsTrigger value="households" className="flex-1">
            {t('map.layer_households')}
          </TabsTrigger>
          <TabsTrigger value="rallyPoints" className="flex-1">
            {t('map.layer_rallyPoints')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p
                className="text-2xl font-bold text-primary"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {neighborhood.registeredCount || households.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.households')}</p>
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold text-primary"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {neighborhood.preparednessScore || 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.readiness')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
          <Badge variant="outline" className="text-xs font-normal">You</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary opacity-70" />
          <Badge variant="outline" className="text-xs font-normal">Neighbor</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-0 border-l-[6px] border-r-[6px] border-b-10 border-l-transparent border-r-transparent border-b-destructive" />
          <Badge variant="outline" className="text-xs font-normal">Rally point</Badge>
        </div>
      </div>

      {/* Rally point info */}
      {neighborhood.primaryRallyPoint && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Flag size={16} className="text-destructive" aria-hidden="true" />
              {t('plans.rallyPoints')}
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-primary font-medium">{t('plans.primary')}:</span>{' '}
                <span>{neighborhood.primaryRallyPoint.name}</span>
                {neighborhood.primaryRallyPoint.description && (
                  <p className="text-muted-foreground text-xs mt-0.5">{neighborhood.primaryRallyPoint.description}</p>
                )}
              </div>
              {neighborhood.backupRallyPoint && (
                <div>
                  <span className="text-muted-foreground font-medium">{t('plans.backup')}:</span>{' '}
                  <span>{neighborhood.backupRallyPoint.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
