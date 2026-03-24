export interface HistoryItem {
  id: string;
  type: 'MEAL' | 'RUN';
  date: string;
  // Meal fields
  mealType?: string;
  foodName?: string;
  calories?: number;
  quantity?: number;
  // Running fields
  distanceKm?: number;
  durationMinutes?: number;
  caloriesBurned?: number;
  pace?: string;
  note?: string;
}

export interface HistoryDayGroup {
  date: string;
  summary: {
    caloriesIn: number;
    caloriesOut: number;
    netCalories: number;
    distance: number;
    mealCount: number;
    runCount: number;
  };
  data: HistoryItem[];
}
