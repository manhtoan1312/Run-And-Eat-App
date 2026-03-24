import api from './base';

export const runningLogApi = {
  getLogs: async () => {
    const response = await api.get('/running-logs');
    return response.data.data;
  },
  createLog: async (data: any) => {
    const response = await api.post('/running-logs', data);
    return response.data;
  },
  deleteLog: async (id: string) => {
    const response = await api.delete(`/running-logs/${id}`);
    return response.data;
  },
};
