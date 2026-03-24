export interface RunningLog {
  id: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  caloriesBurned: number;
  note?: string;
  pace: number;
  paceUnit: string;
}

export interface CreateRunningLogInput {
  date: string;
  distanceKm: number;
  durationMinutes: number;
  caloriesBurned: number;
  note?: string;
}

export interface UpdateRunningLogInput {
  date?: string;
  distanceKm?: number;
  durationMinutes?: number;
  caloriesBurned?: number;
  note?: string;
}
