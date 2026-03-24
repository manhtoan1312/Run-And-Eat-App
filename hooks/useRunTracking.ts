import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useRunTrackerStore } from '../store/useRunTrackerStore';
import { runApi } from '../api/run';
import { calculateDistance, calculatePace, calculateSpeed, estimateCaloriesBurned } from '../utils/run';
import { profileApi } from '../api/profile';
import { LOCATION_TRACKING_TASK, clearBackgroundBatch } from '../tasks/locationTask';
import { syncPendingPoints, clearSessionPoints } from '../utils/pointQueue';
import {
  requestNotificationPermission,
  setupRunNotificationChannel,
  schedulePauseReminder,
  cancelPauseReminder,
  notifyRunSummary,
} from '../utils/notifications';

/**
 * Timer Architecture (wall-clock based):
 *
 * Store has TWO duration fields:
 *   - accumulatedSeconds: frozen base from all past segments (only updated on pause/stop/finish)
 *   - segmentStartTime:   wall-clock ms when the current segment started (null when paused)
 *   - durationSeconds:    display-only value, computed each tick via:
 *                         accumulatedSeconds + (Date.now() - segmentStartTime) / 1000
 *
 * The timer reads accumulatedSeconds + segmentStartTime every second and writes
 * the computed value to durationSeconds for the UI. It NEVER uses durationSeconds
 * as input (no feedback loop, no compounding).
 *
 * As a result, even if the timer fires late (throttled in background), waking up
 * naturally corrects itself: the next tick uses the real wall clock.
 */

export const useRunTracking = () => {
  const { 
    sessionId, setSession, 
    status, setStatus,
    distanceMeters, durationSeconds,
    points,
    userWeightKg, setWeight,
    isInitializing, setIsInitializing,
    hasInitialized, setHasInitialized,
    reset,
    setSegmentStartTime,
    setAccumulatedSeconds,
    updateMetrics,
  } = useRunTrackerStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseNotifIdRef = useRef<string | null>(null);
  const syncTickCounter = useRef(0); // sync every N ticks

  const requestPermissions = async () => {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    return bgStatus === 'granted';
  };

  const startTracking = useCallback(async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (hasStarted) return;
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 5,
      timeInterval: 5000,
      deferredUpdatesInterval: 10000,
      foregroundService: {
        notificationTitle: 'Run & Eat đang theo dõi',
        notificationBody: 'Chuyến chạy của bạn đang được ghi lại.',
        notificationColor: '#FF6F61',
      },
      pausesUpdatesAutomatically: true,
    });
  }, []);

  const stopTracking = useCallback(async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize: Check for active session on mount
  useEffect(() => {
    if (hasInitialized) {
      if (status === 'IN_PROGRESS') startTracking();
      return; 
    }

    const init = async () => {
      setIsInitializing(true);
      try {
        // Setup notifications on first init
        await setupRunNotificationChannel();
        await requestNotificationPermission();

        const [activeSession, profile] = await Promise.all([
          runApi.getCurrentSession(),
          profileApi.getProfile()
        ]);

        if (profile?.weightKg) setWeight(profile.weightKg);

        if (activeSession) {
          setSession(activeSession.id);
          setStatus(activeSession.status);
          // Restore metrics from server
          useRunTrackerStore.setState({
            distanceMeters: activeSession.distanceMeters,
            accumulatedSeconds: activeSession.durationSeconds,
            durationSeconds: activeSession.durationSeconds,
            avgPace: activeSession.avgPace || '0:00',
            currentSpeed: activeSession.avgSpeedKmh || 0,
            caloriesBurned: activeSession.caloriesBurned || 0,
          });

          if (activeSession.status === 'IN_PROGRESS') {
            // Start segment timer from "now" (we don't know exact server start,
            // so accumulated = server duration and segment starts fresh)
            setSegmentStartTime(Date.now());
            await startTracking();
          }
        }
        setHasInitialized(true);
      } catch (err) {
        console.error('Failed to init run tracking:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [hasInitialized, status, startTracking, setIsInitializing, setHasInitialized, setSession, setStatus, setWeight, setSegmentStartTime]);

  // Timer: wall-clock based. Reads accumulatedSeconds + segmentStartTime
  // Writes durationSeconds (display only). NEVER reads durationSeconds as input.
  useEffect(() => {
    if (status === 'IN_PROGRESS') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const { 
          accumulatedSeconds,
          segmentStartTime,
          distanceMeters: dist,
          userWeightKg: w,
        } = useRunTrackerStore.getState();

        if (!segmentStartTime) return; // Paused or not started

        // Wall-clock elapsed since segment start
        const segmentElapsed = Math.floor((Date.now() - segmentStartTime) / 1000);
        const totalDisplay = accumulatedSeconds + segmentElapsed;

        const newPace = calculatePace(totalDisplay, dist);
        const newSpeed = calculateSpeed(totalDisplay, dist);
        const newCalories = estimateCaloriesBurned(dist, w);

        // Write display value. accumulatedSeconds and segmentStartTime stay frozen.
        useRunTrackerStore.setState({
          durationSeconds: totalDisplay,
          avgPace: newPace,
          currentSpeed: newSpeed,
          caloriesBurned: newCalories,
        });

        // Periodic queue sync every ~15 seconds
        syncTickCounter.current += 1;
        if (syncTickCounter.current >= 15) {
          syncTickCounter.current = 0;
          syncPendingPoints().catch(() => {});
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const startRun = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      throw new Error('Cần quyền truy cập vị trí "Luôn luôn" để theo dõi khi tắt màn hình.');
    }

    reset();
    const session = await runApi.startSession();
    setSession(session.id);
    // Set segment start time; accumulatedSeconds starts at 0 (from reset)
    setSegmentStartTime(Date.now());
    setStatus('IN_PROGRESS');
    setHasInitialized(true);
    await startTracking();
  };

  const pauseRun = async () => {
    await runApi.pauseSession();
    
    // Freeze the current display duration into accumulatedSeconds
    const { accumulatedSeconds, segmentStartTime } = useRunTrackerStore.getState();
    const segmentElapsed = segmentStartTime 
      ? Math.floor((Date.now() - segmentStartTime) / 1000) 
      : 0;
    
    useRunTrackerStore.setState({ 
      accumulatedSeconds: accumulatedSeconds + segmentElapsed,
      segmentStartTime: null,
      status: 'PAUSED'
    });
    
    await stopTracking();

    // Schedule a nudge notification if user forgets to resume
    schedulePauseReminder(5).then(id => {
      pauseNotifIdRef.current = id;
    }).catch(() => {});
  };

  const resumeRun = async () => {
    // Cancel the pause reminder now that user resumed
    if (pauseNotifIdRef.current) {
      cancelPauseReminder(pauseNotifIdRef.current).catch(() => {});
      pauseNotifIdRef.current = null;
    }
    await runApi.resumeSession();
    setSegmentStartTime(Date.now());
    setStatus('IN_PROGRESS');
    await startTracking();
  };

  const finishRun = async () => {
    const { sessionId: currentSid, accumulatedSeconds, segmentStartTime, distanceMeters: d, userWeightKg: w } = useRunTrackerStore.getState();
    // Clear any pending background points before stopping — prevents stale 400 errors
    clearBackgroundBatch();
    await stopTracking();
    
    if (!currentSid) return;

    const segmentElapsed = segmentStartTime 
      ? Math.floor((Date.now() - segmentStartTime) / 1000) 
      : 0;
    const finalDuration = accumulatedSeconds + segmentElapsed;

    // Final sync: flush any remaining queued points
    await syncPendingPoints().catch(() => {});

    await runApi.finishSession(currentSid, {
      distanceMeters: d,
      durationSeconds: finalDuration,
      avgPace: calculatePace(finalDuration, d),
      avgSpeedKmh: calculateSpeed(finalDuration, d),
      caloriesBurned: estimateCaloriesBurned(d, w)
    });

    // Cancel any pending pause reminder
    if (pauseNotifIdRef.current) {
      cancelPauseReminder(pauseNotifIdRef.current).catch(() => {});
      pauseNotifIdRef.current = null;
    }

    // Send run summary notification
    notifyRunSummary({
      durationSeconds: finalDuration,
      distanceMeters: d,
      caloriesBurned: estimateCaloriesBurned(d, w),
    }).catch(() => {});

    // Clean up queue for this session
    await clearSessionPoints(currentSid).catch(() => {});

    // Reset immediately so dashboard is clean
    reset();
  };

  const cancelRun = async () => {
    clearBackgroundBatch();
    await stopTracking();
    const currentSid = useRunTrackerStore.getState().sessionId;
    try {
      await runApi.cancelSession();
    } catch (e) {}
    // Discard all queued points for this cancelled session
    if (currentSid) {
      await clearSessionPoints(currentSid).catch(() => {});
    }
    reset();
  };

  return {
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    cancelRun,
    status,
    distanceMeters,
    durationSeconds,
    isLoading: isInitializing,
  };
};
