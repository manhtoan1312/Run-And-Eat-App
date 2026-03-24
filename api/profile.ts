import api from './base';
import { Profile, UpdateProfileInput } from '../types/profile';

export const profileApi = {
  getProfile: async (): Promise<Profile> => {
    const response = await api.get('/profile');
    return response.data.data;
  },
  updateProfile: async (data: UpdateProfileInput): Promise<Profile> => {
    const response = await api.patch('/profile', data);
    return response.data.data;
  },
};
