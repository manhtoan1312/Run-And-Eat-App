export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  gender?: string | null;
  birthDate?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  createdAt: string;
  updatedAt: string;
  bmi?: number | null;
  bmiCategory?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
}
