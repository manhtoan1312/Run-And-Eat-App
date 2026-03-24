import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useRunTrackerStore } from '../store/useRunTrackerStore';
import { calculateDistance, calculatePace, calculateSpeed, estimateCaloriesBurned } from '../utils/run';
import { runApi } from '../api/run';

export const LOCATION_TRACKING_TASK = 'background-location-tracking';

// Batch for background sync
let backgroundPointsBatch: any[] = [];
let backgroundLowSpeedSamples = 0;

/** Call this when finishing or cancelling a run to discard unsynced background points */
export const clearBackgroundBatch = () => {
  backgroundPointsBatch = [];
  backgroundLowSpeedSamples = 0;
};

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const { 
      status, 
      sessionId, 
      points, 
      distanceMeters, 
      accumulatedSeconds,
      segmentStartTime,
      autoPauseEnabled,
      userWeightKg,
      updateMetrics,
      addPoint,
      setStatus
    } = useRunTrackerStore.getState();

    if (status !== 'IN_PROGRESS' || !sessionId) {
      if (status === 'PAUSED' || status === 'COMPLETED' || status === 'CANCELLED') {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      }
      return;
    }

    let currentDist = distanceMeters;
    let lastPoint = points.length > 0 ? points[points.length - 1] : null;

    // Compute current total duration using wall-clock math (same logic as foreground timer)
    const segmentElapsed = segmentStartTime 
      ? Math.floor((Date.now() - segmentStartTime) / 1000) 
      : 0;
    const currentTotalDuration = accumulatedSeconds + segmentElapsed;

    for (const location of locations) {
      const { latitude, longitude, accuracy, speed, altitude, heading } = location.coords;
      const recordedAt = new Date(location.timestamp).toISOString();

      // Auto-pause detection
      if (autoPauseEnabled) {
        if (speed !== null && speed < 0.8) {
          backgroundLowSpeedSamples += 1;
          if (backgroundLowSpeedSamples >= 6) {
             console.log('[BackgroundLocationTask] Auto-pausing...');
             backgroundLowSpeedSamples = 0;
             try {
               await runApi.pauseSession();
               
               // Correctly freeze duration when auto-pausing in background
               const now = Date.now();
               const finalElapsed = segmentStartTime ? Math.floor((now - segmentStartTime) / 1000) : 0;
               
               useRunTrackerStore.setState({ 
                 status: 'PAUSED',
                 accumulatedSeconds: accumulatedSeconds + finalElapsed,
                 segmentStartTime: null,
               });
               
               await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
             } catch (e) {
               console.error('[BackgroundLocationTask] Pause failed:', e);
             }
             return; // Stop processing further locations
          }
        } else if (speed !== null && speed > 1.2) {
          backgroundLowSpeedSamples = 0;
        }
      }

      // Calculate distance if we have a previous point
      if (lastPoint) {
        const delta = calculateDistance(lastPoint.lat, lastPoint.lng, latitude, longitude);
        // Anti-drift logic
        if (accuracy && accuracy < 30 && delta > 2) {
          currentDist += delta;
        }
      }

      const newPoint = { lat: latitude, lng: longitude, recordedAt };
      
      // Update store
      addPoint(newPoint);
      
      // Update metrics
      const newPace = calculatePace(currentTotalDuration, currentDist);
      const newSpeed = calculateSpeed(currentTotalDuration, currentDist);
      const newCalories = estimateCaloriesBurned(currentDist, userWeightKg);
      
      updateMetrics(currentDist, currentTotalDuration, newPace, speed || 0, newCalories, accuracy || undefined);

      // Prepare for backend sync
      backgroundPointsBatch.push({
        lat: latitude,
        lng: longitude,
        altitude: altitude || undefined,
        accuracy: accuracy || undefined,
        speed: speed || undefined,
        heading: heading || undefined,
        recordedAt,
      });

      lastPoint = newPoint;
    }

    // Sync with backend if batch is large enough, and session is still active
    const currentStatus = useRunTrackerStore.getState().status;
    if (backgroundPointsBatch.length >= 5 && sessionId && 
        (currentStatus === 'IN_PROGRESS' || currentStatus === 'PAUSED')) {
      const toSync = [...backgroundPointsBatch];
      backgroundPointsBatch = [];
      try {
        await runApi.addPoints(sessionId, toSync);
      } catch (err: any) {
        // 400 means session is no longer active — discard the batch silently
        if (err?.response?.status === 400 || err?.response?.status === 404) {
          console.log('[BackgroundLocationTask] Session no longer active, discarding batch');
          backgroundPointsBatch = []; // discard, don't re-queue
        } else {
          console.error('[BackgroundLocationTask] Sync failed:', err);
          backgroundPointsBatch = [...toSync, ...backgroundPointsBatch]; // re-queue only on network error
        }
      }
    }
  }
});
