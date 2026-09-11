import api from './api';
import { Task } from '../types';

export const taskService = {
  async getTasks(filters?: { project?: string; status?: string; priority?: string; search?: string }) {
    const res = await api.get<{ success: boolean; data: { tasks: Task[] } }>('/tasks', {
      params: filters,
    });
    return res.data.data.tasks;
  },

  async getTaskById(id: string) {
    const res = await api.get<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`);
    return res.data.data.task;
  },

  async createTask(data: Partial<Task>) {
    const res = await api.post<{ success: boolean; data: { task: Task } }>('/tasks', data);
    return res.data.data.task;
  },

  async updateTask(id: string, data: Partial<Task>) {
    const res = await api.put<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`, data);
    return res.data.data.task;
  },

  async deleteTask(id: string) {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/tasks/${id}`);
    return res.data.data;
  },
};
