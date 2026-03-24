import api from './base';
import { DashboardSummary } from '../types/dashboard';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard');
    return response.data.data;
  },
};
