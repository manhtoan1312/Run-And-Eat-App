export interface DashboardSummary {
  today: {
    caloriesIn: number;
    caloriesOut: number;
    netCalories: number;
    totalDistance: number;
    goalCalories: number;
    calorieDeviation: number;
  };
  weekly: {
    totalCaloriesIn: number;
    totalCaloriesOut: number;
    totalDistance: number;
    goalWeeklyDistance: number;
  };
  dailyHistory: Array<{
    date: string;
    label: string;
    caloriesIn: number;
    distance: number;
  }>;
}
