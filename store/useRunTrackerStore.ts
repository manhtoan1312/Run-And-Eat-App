import { create } from 'zustand';

export type RunStatus = 'IDLE' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

interface RunPoint {
  lat: number;
  lng: number;
  recordedAt: string;
}

interface RunTrackerState {
  sessionId: string | null;
  status: RunStatus;
  distanceMeters: number;
  // durationSeconds is the live UI display value (updated by timer every second)
  durationSeconds: number;
  // accumulatedSeconds is the frozen base from all past segments (updated only on pause/stop)
  accumulatedSeconds: number;
  // segmentStartTime is wall-clock ms when the current run segment started (null when paused)
  segmentStartTime: number | null;
  avgPace: string;
  currentSpeed: number;
  currentAccuracy: number | null;
  caloriesBurned: number;
  autoPauseEnabled: boolean;
  points: RunPoint[];
  isInitializing: boolean;
  hasInitialized: boolean;
  userWeightKg: number;
  
  // Actions
  setSession: (sessionId: string | null) => void;
  setStatus: (status: RunStatus) => void;
  setSegmentStartTime: (time: number | null) => void;
  setAccumulatedSeconds: (secs: number) => void;
  updateMetrics: (distance: number, duration: number, pace: string, speed: number, calories: number, accuracy?: number) => void;
  setAutoPause: (enabled: boolean) => void;
  addPoint: (point: RunPoint) => void;
  setWeight: (weight: number) => void;
  setIsInitializing: (initializing: boolean) => void;
  setHasInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useRunTrackerStore = create<RunTrackerState>((set) => ({
  sessionId: null,
  status: 'IDLE',
  distanceMeters: 0,
  durationSeconds: 0,
  accumulatedSeconds: 0,
  segmentStartTime: null,
  avgPace: '0:00',
  currentSpeed: 0,
  currentAccuracy: null,
  caloriesBurned: 0,
  autoPauseEnabled: false,
  points: [],
  isInitializing: false,
  hasInitialized: false,
  userWeightKg: 70,

  setSession: (sessionId) => set({ sessionId }),
  setStatus: (status) => set({ status }),
  setSegmentStartTime: (segmentStartTime) => set({ segmentStartTime }),
  setAccumulatedSeconds: (accumulatedSeconds) => set({ accumulatedSeconds }),
  updateMetrics: (distance, duration, pace, speed, calories, accuracy) => 
    set({ 
      distanceMeters: distance, 
      durationSeconds: duration, 
      avgPace: pace, 
      currentSpeed: speed,
      caloriesBurned: calories,
      currentAccuracy: accuracy === undefined ? null : accuracy
    }),
  setAutoPause: (enabled) => set({ autoPauseEnabled: enabled }),
  addPoint: (point) => set((state) => ({ points: [...state.points, point] })),
  setWeight: (weight) => set({ userWeightKg: weight }),
  setIsInitializing: (initializing) => set({ isInitializing: initializing }),
  setHasInitialized: (initialized) => set({ hasInitialized: initialized }),
  reset: () => set((state) => ({
    sessionId: null,
    status: 'IDLE',
    distanceMeters: 0,
    durationSeconds: 0,
    accumulatedSeconds: 0,
    segmentStartTime: null,
    avgPace: '0:00',
    currentSpeed: 0,
    currentAccuracy: null,
    caloriesBurned: 0,
    autoPauseEnabled: false,
    points: [],
    isInitializing: false,
    hasInitialized: false,
    userWeightKg: state.userWeightKg,
  })),
}));
