import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useRunTrackerStore } from '../store/useRunTrackerStore';
import { calculateDistance, calculatePace, calculateSpeed, estimateCaloriesBurned } from '../utils/run';
import { runApi } from '../api/run';
import { enqueuePoints, syncPendingPoints } from '../utils/pointQueue';

export const LOCATION_TRACKING_TASK = 'background-location-tracking';

let backgroundLowSpeedSamples = 0;

/** Reset auto-pause counter (called on finish/cancel) */
export const clearBackgroundBatch = () => {
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
    } = useRunTrackerStore.getState();

    if (status !== 'IN_PROGRESS' || !sessionId) {
      if (status === 'PAUSED' || status === 'COMPLETED' || status === 'CANCELLED') {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      }
      return;
    }

    let currentDist = distanceMeters;
    let lastPoint = points.length > 0 ? points[points.length - 1] : null;

    // Wall-clock duration
    const segmentElapsed = segmentStartTime 
      ? Math.floor((Date.now() - segmentStartTime) / 1000) 
      : 0;
    const currentTotalDuration = accumulatedSeconds + segmentElapsed;

    // Collect points for queue
    const newPointsForQueue: any[] = [];

    for (const location of locations) {
      const { latitude, longitude, accuracy, speed, altitude, heading } = location.coords;
      const recordedAt = new Date(location.timestamp).toISOString();

      // Auto-pause detection
      if (autoPauseEnabled) {
        if (speed !== null && speed < 0.8) {
          backgroundLowSpeedSamples += 1;
          if (backgroundLowSpeedSamples >= 6) {
             backgroundLowSpeedSamples = 0;
             try {
               await runApi.pauseSession();
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
             return;
          }
        } else if (speed !== null && speed > 1.2) {
          backgroundLowSpeedSamples = 0;
        }
      }

      // Distance calculation
      if (lastPoint) {
        const delta = calculateDistance(lastPoint.lat, lastPoint.lng, latitude, longitude);
        if (accuracy && accuracy < 30 && delta > 2) {
          currentDist += delta;
        }
      }

      const newPoint = { lat: latitude, lng: longitude, recordedAt };
      addPoint(newPoint);

      // Metrics
      const newPace = calculatePace(currentTotalDuration, currentDist);
      const newSpeed = calculateSpeed(currentTotalDuration, currentDist);
      const newCalories = estimateCaloriesBurned(currentDist, userWeightKg);
      updateMetrics(currentDist, currentTotalDuration, newPace, speed || 0, newCalories, accuracy || undefined);

      // Collect for persistent queue
      newPointsForQueue.push({
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

    // Enqueue to persistent storage (dedup handled inside)
    if (newPointsForQueue.length > 0) {
      await enqueuePoints(sessionId, newPointsForQueue);
    }

    // Attempt to sync pending points to backend
    try {
      await syncPendingPoints();
    } catch (err) {
      // Network likely unavailable — points stay in queue for later
      console.log('[BackgroundLocationTask] Sync deferred, will retry later');
    }
  }
});
