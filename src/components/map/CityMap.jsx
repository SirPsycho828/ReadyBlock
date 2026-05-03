import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    bg: '#0D2B2B',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    bg: '#FAF7F2',
  },
};

const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const SCORE_COLORS = {
  low: '#E05C3A',
  medium: '#E8A830',
  high: '#4DB8A0',
};

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function scoreColor(score) {
  if (score >= 67) return SCORE_COLORS.high;
  if (score >= 34) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

/**
 * City-wide Leaflet map showing all neighborhood zones as circle overlays.
 *
 * Props:
 *  - neighborhoods: Array<{ id, name, centroidLat, centroidLng, preparednessScore, emergencyMode }>
 *  - onNeighborhoodClick: (neighborhood) => void
 */
export default function CityMap({ neighborhoods, onNeighborhoodClick }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);

  // ── Initialize map ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const dark = isDark();
    const tile = dark ? TILES.dark : TILES.light;

    const map = L.map(containerRef.current, {
      center: [35.595, -82.555],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer(tile.url, {
      attribution: TILE_ATTR,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    map.getContainer().style.background = tile.bg;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Neighborhood circle markers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers
    for (const layer of layersRef.current) {
      map.removeLayer(layer);
    }
    layersRef.current = [];

    if (!neighborhoods?.length) return;

    const added = [];

    for (const n of neighborhoods) {
      if (!n.centroidLat || !n.centroidLng) continue;

      const color = scoreColor(n.preparednessScore ?? 0);
      const isEmergency = !!n.emergencyMode;
      const radius = isEmergency ? 1200 : 800;

      const circle = L.circle([n.centroidLat, n.centroidLng], {
        radius,
        color: isEmergency ? SCORE_COLORS.low : color,
        weight: isEmergency ? 3 : 2,
        fillColor: color,
        fillOpacity: isEmergency ? 0.35 : 0.25,
        dashArray: isEmergency ? '6 4' : undefined,
      }).addTo(map);

      circle.bindTooltip(
        `<strong>${n.name}</strong><br/>Score: ${n.preparednessScore ?? 0}`,
        { direction: 'top', offset: [0, -8] },
      );

      circle.on('click', () => {
        if (onNeighborhoodClick) onNeighborhoodClick(n);
      });

      added.push(circle);

      // Extra pulsing ring for emergency neighborhoods
      if (isEmergency) {
        const ring = L.circle([n.centroidLat, n.centroidLng], {
          radius: radius + 300,
          color: SCORE_COLORS.low,
          weight: 2,
          fillOpacity: 0,
          opacity: 0.45,
          dashArray: '4 6',
          className: 'pulse-marker',
        }).addTo(map);
        added.push(ring);
      }
    }

    layersRef.current = added;
  }, [neighborhoods, onNeighborhoodClick]);

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-lg"
        style={{ height: 400, minHeight: 300 }}
      />

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 z-[1000] rounded px-3 py-2 text-xs space-y-1"
        style={{
          background: isDark() ? 'rgba(13,43,43,0.85)' : 'rgba(255,255,255,0.9)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          borderRadius: 'var(--radius-city)',
        }}
      >
        <div className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Preparedness
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SCORE_COLORS.high }} />
          <span>High (67+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SCORE_COLORS.medium }} />
          <span>Medium (34-66)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SCORE_COLORS.low }} />
          <span>Low (&lt;34)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ border: `2px solid ${SCORE_COLORS.low}`, background: 'transparent' }}
          />
          <span>Emergency</span>
        </div>
      </div>
    </div>
  );
}
