import api from './api';
import { Project } from '../types';

export const projectService = {
  async getProjects(filters?: { status?: string; client?: string; search?: string }) {
    const res = await api.get<{ success: boolean; data: { projects: Project[] } }>('/projects', {
      params: filters,
    });
    return res.data.data.projects;
  },

  async getProjectById(id: string) {
    const res = await api.get<{ success: boolean; data: { project: Project & { tasks: any[]; timeLogs: any[] } } }>(
      `/projects/${id}`
    );
    return res.data.data.project;
  },

  async createProject(data: Partial<Project>) {
    const res = await api.post<{ success: boolean; data: { project: Project } }>('/projects', data);
    return res.data.data.project;
  },

  async updateProject(id: string, data: Partial<Project>) {
    const res = await api.put<{ success: boolean; data: { project: Project } }>(`/projects/${id}`, data);
    return res.data.data.project;
  },

  async deleteProject(id: string) {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/projects/${id}`);
    return res.data.data;
  },
};
