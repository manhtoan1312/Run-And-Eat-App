export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

export interface MealLog {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  quantity: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealLogInput {
  date: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  quantity: number;
  note?: string;
}

export interface UpdateMealLogInput extends Partial<CreateMealLogInput> {}
