import api from './api';
import { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string) {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>(
      '/auth/register',
      { name, email, password }
    );
    return res.data.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>(
      '/auth/login',
      { email, password }
    );
    return res.data.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },

  async updateProfile(data: { name?: string }) {
    const res = await api.put<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    return res.data.data.user;
  },

  async updatePlan(plan: 'FREE' | 'PRO') {
    const res = await api.put<{ success: boolean; data: { user: User } }>('/auth/plan', { plan });
    return res.data.data.user;
  },
};
