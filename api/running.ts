import api from './base';
import { RunningLog, CreateRunningLogInput, UpdateRunningLogInput } from '../types/running';

export const runningApi = {
  getAll: async (dateFrom?: string, dateTo?: string): Promise<RunningLog[]> => {
    const response = await api.get('/running-logs', {
      params: { dateFrom, dateTo },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<RunningLog> => {
    const response = await api.get(`/running-logs/${id}`);
    return response.data.data;
  },

  create: async (data: CreateRunningLogInput): Promise<RunningLog> => {
    const response = await api.post('/running-logs', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateRunningLogInput): Promise<RunningLog> => {
    const response = await api.patch(`/running-logs/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/running-logs/${id}`);
    return response.data;
  },
};
