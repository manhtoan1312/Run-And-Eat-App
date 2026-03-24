export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

export enum LeaderboardCategory {
  DISTANCE = 'totalDistanceMeters',
  DURATION = 'totalDurationSeconds',
  CALORIES = 'totalCaloriesBurned',
  RUNS = 'totalRuns',
}

export interface LeaderboardEntry {
  rank: string;
  userId: string;
  fullName: string;
  avatar: string | null;
  totalDistanceMeters: number;
  totalRuns: number;
  totalCaloriesBurned: number;
  totalDurationSeconds: number;
}

export const PERIOD_OPTIONS = [
  { label: 'Ngày', value: LeaderboardPeriod.DAILY },
  { label: 'Tuần', value: LeaderboardPeriod.WEEKLY },
  { label: 'Tháng', value: LeaderboardPeriod.MONTHLY },
  { label: 'Tất cả', value: LeaderboardPeriod.ALL_TIME },
];

export const CATEGORY_OPTIONS = [
  { label: 'Quãng đường', value: LeaderboardCategory.DISTANCE, icon: 'map-outline' },
  { label: 'Buổi chạy', value: LeaderboardCategory.RUNS, icon: 'walk-outline' },
  { label: 'Calo', value: LeaderboardCategory.CALORIES, icon: 'flame-outline' },
];
