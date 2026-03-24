import api from './base';

export interface RunPointInput {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recordedAt: string;
}

export const runApi = {
  getCurrentSession: async () => {
    const response = await api.get('/run/current');
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get('/run/stats');
    return response.data.data;
  },

  startSession: async (note?: string) => {
    const response = await api.post('/run/start', { note });
    return response.data.data;
  },

  pauseSession: async () => {
    const response = await api.post('/run/pause');
    return response.data.data;
  },

  resumeSession: async () => {
    const response = await api.post('/run/resume');
    return response.data.data;
  },

  finishSession: async (sessionId: string, data: {
    distanceMeters: number;
    durationSeconds: number;
    caloriesBurned?: number;
    avgPace?: string;
    avgSpeedKmh?: number;
    note?: string;
  }) => {
    const response = await api.post(`/run/${sessionId}/finish`, data);
    return response.data.data;
  },

  getSessions: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/run', { params: { page, limit } });
    return response.data.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/run/${sessionId}`);
    return response.data.data;
  },

  getSessionPoints: async (sessionId: string) => {
    const response = await api.get(`/run/${sessionId}/points`);
    return response.data.data;
  },

  cancelSession: async () => {
    const response = await api.post('/run/cancel');
    return response.data.data;
  },

  addPoints: async (sessionId: string, points: RunPointInput[]) => {
    const response = await api.post(`/run/${sessionId}/points`, { points });
    return response.data.data;
  },

  getLeaderboard: async (period: string, category: string, limit: number = 10) => {
    const response = await api.get('/run/leaderboard', { params: { period, category, limit } });
    return response.data.data;
  },

  getMyRank: async (period: string, category: string) => {
    const response = await api.get('/run/leaderboard/me', { params: { period, category } });
    return response.data.data;
  },
};
