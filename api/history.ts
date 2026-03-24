import api from './base';
import { HistoryDayGroup } from '../types/history';

export const historyApi = {
  getHistory: async (params: { startDate?: string; endDate?: string; type?: string }): Promise<HistoryDayGroup[]> => {
    const response = await api.get('/history', { params });
    return response.data.data;
  },
};
