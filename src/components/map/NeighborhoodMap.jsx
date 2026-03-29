import { useEffect, useRef, useCallback } from 'react';
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

const COLORS = {
  boundary: { dark: '#4DB8A0', light: '#1D5C5C' },
  user: '#E8A830',
  neighbor: { dark: '#4DB8A0', light: '#1D5C5C' },
  stroke: { dark: '#0D2B2B', light: '#FFFFFF' },
  rallyPrimary: '#E05C3A',
  rallyBackup: '#E8A830',
};

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function makeTriangleIcon(color, size = 24) {
  const half = size / 2;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<polygon points="${half},2 3,${size - 2} ${size - 3},${size - 2}" ` +
    `fill="${color}" stroke="${isDark() ? COLORS.stroke.dark : COLORS.stroke.light}" stroke-width="2"/>` +
    `</svg>`;
  return L.divIcon({ className: '', html: svg, iconSize: [size, size], iconAnchor: [half, size - 2] });
}

/**
 * Interactive Leaflet map for a neighborhood.
 *
 * Props:
 *  - boundary: Array<{lat, lng}> — neighborhood polygon
 *  - households: Array<{id, lat, lng, displayName?, ...}>
 *  - userHousehold: {id, lat, lng, ...} | null
 *  - primaryRallyPoint: {name, lat, lng} | null
 *  - backupRallyPoint: {name, lat, lng} | null
 *  - activeLayer: 'households' | 'rallyPoints'
 */
export default function NeighborhoodMap({
  boundary,
  households,
  userHousehold,
  primaryRallyPoint,
  backupRallyPoint,
  activeLayer,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ boundary: null, households: [], rally: [], user: [] });

  // ── Initialize map ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const dark = isDark();
    const tile = dark ? TILES.dark : TILES.light;

    const map = L.map(containerRef.current, {
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

  // ── Boundary polygon ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundary?.length || boundary.length < 3) return;

    if (layersRef.current.boundary) map.removeLayer(layersRef.current.boundary);

    const dark = isDark();
    const color = dark ? COLORS.boundary.dark : COLORS.boundary.light;
    const latlngs = boundary.map((p) => [p.lat, p.lng]);
    const polygon = L.polygon(latlngs, {
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.08,
    }).addTo(map);

    layersRef.current.boundary = polygon;
    map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
  }, [boundary]);

  // ── Helper: clear a layer group ──
  const clearLayers = useCallback((key) => {
    const map = mapRef.current;
    if (!map) return;
    for (const layer of layersRef.current[key]) map.removeLayer(layer);
    layersRef.current[key] = [];
  }, []);

  // ── Household markers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clearLayers('households');
    clearLayers('user');

    if (activeLayer !== 'households') return;

    const dark = isDark();
    const added = [];

    for (const h of households) {
      if (!h.lat || !h.lng) continue;
      const isUser = h.id === userHousehold?.id;
      if (isUser) continue; // render user separately below

      const m = L.circleMarker([h.lat, h.lng], {
        radius: 5,
        fillColor: dark ? COLORS.neighbor.dark : COLORS.neighbor.light,
        fillOpacity: 0.7,
        color: dark ? COLORS.stroke.dark : COLORS.stroke.light,
        weight: 1,
      }).addTo(map);

      if (h.displayName) m.bindTooltip(h.displayName);
      added.push(m);
    }
    layersRef.current.households = added;

    // User marker (always on top)
    const uLat = userHousehold?.lat;
    const uLng = userHousehold?.lng;
    if (uLat && uLng) {
      const dot = L.circleMarker([uLat, uLng], {
        radius: 8,
        fillColor: COLORS.user,
        fillOpacity: 1,
        color: dark ? COLORS.stroke.dark : COLORS.stroke.light,
        weight: 2,
      }).addTo(map);
      dot.bindTooltip('You', { direction: 'top', offset: [0, -10] });

      const glow = L.circleMarker([uLat, uLng], {
        radius: 14,
        fillOpacity: 0,
        color: COLORS.user,
        weight: 2,
        opacity: 0.4,
      }).addTo(map);

      layersRef.current.user = [dot, glow];
    }
  }, [households, userHousehold, activeLayer, clearLayers]);

  // ── Rally point markers (visible on BOTH tabs) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clearLayers('rally');

    const added = [];

    if (primaryRallyPoint?.lat && primaryRallyPoint?.lng) {
      const m = L.marker([primaryRallyPoint.lat, primaryRallyPoint.lng], {
        icon: makeTriangleIcon(COLORS.rallyPrimary, 24),
      }).addTo(map);
      m.bindTooltip(primaryRallyPoint.name, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 4],
        className: 'rb-rally-label',
      });
      added.push(m);
    }

    if (backupRallyPoint?.lat && backupRallyPoint?.lng) {
      const m = L.marker([backupRallyPoint.lat, backupRallyPoint.lng], {
        icon: makeTriangleIcon(COLORS.rallyBackup, 20),
      }).addTo(map);
      m.bindTooltip(backupRallyPoint.name, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 4],
        className: 'rb-rally-label',
      });
      added.push(m);
    }

    layersRef.current.rally = added;
  }, [primaryRallyPoint, backupRallyPoint, clearLayers]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg"
      style={{ aspectRatio: '1/1', maxHeight: 400, minHeight: 300 }}
    />
  );
}
