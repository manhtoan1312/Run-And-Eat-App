import api from './base';
import { MealLog, CreateMealLogInput, UpdateMealLogInput } from '../types/meal';

export const mealApi = {
  getAll: async (dateFrom?: string, dateTo?: string): Promise<MealLog[]> => {
    const response = await api.get('/meal-logs', {
      params: { dateFrom, dateTo },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<MealLog> => {
    const response = await api.get(`/meal-logs/${id}`);
    return response.data.data;
  },

  create: async (data: CreateMealLogInput): Promise<MealLog> => {
    const response = await api.post('/meal-logs', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateMealLogInput): Promise<MealLog> => {
    const response = await api.patch(`/meal-logs/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/meal-logs/${id}`);
    return response.data;
  },
};
