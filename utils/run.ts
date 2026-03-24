/**
 * Calculates distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates current pace in minutes per kilometer
 */
export function calculatePace(durationSeconds: number, distanceMeters: number): string {
  if (distanceMeters <= 0 || durationSeconds <= 0) return '-:--';
  const km = distanceMeters / 1000;
  const paceSecondsPerKm = durationSeconds / km;
  
  // Cap pace at 30 min/km (walking speed) to avoid weird numbers when standing still
  if (paceSecondsPerKm > 1800) return '30:00+';
  
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Calculates speed in km/h
 */
export function calculateSpeed(durationSeconds: number, distanceMeters: number): number {
  if (durationSeconds <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const hours = durationSeconds / 3600;
  return distanceKm / hours;
}

/**
 * Estimates calories burned based on body weight and distance
 * Formula: 1.036 * weightKg * distanceKm
 */
export function estimateCaloriesBurned(distanceMeters: number, weightKg: number = 70): number {
  const distanceKm = distanceMeters / 1000;
  return 1.036 * weightKg * distanceKm;
}

/**
 * Formats duration seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
