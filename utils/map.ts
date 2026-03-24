import { LatLng } from 'react-native-maps';

export interface RunPoint {
  lat: number;
  lng: number;
}

/**
 * Converts RunPoint array to LatLng array for Google Maps/Apple Maps
 */
export function pointsToPolyline(points: RunPoint[]): LatLng[] {
  return points.map(p => ({
    latitude: p.lat,
    longitude: p.lng,
  }));
}

/**
 * Calculates a region that fits all points with some padding
 */
export function getMapRegionForPoints(points: RunPoint[], padding: number = 0.1) {
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  points.forEach(p => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  });

  const latDelta = (maxLat - minLat) * (1 + padding);
  const lngDelta = (maxLng - minLng) * (1 + padding);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.005),
    longitudeDelta: Math.max(lngDelta, 0.005),
  };
}
