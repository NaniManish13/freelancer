import api from './api';
import { TimeLog } from '../types';

export const timeLogService = {
  async getTimeLogs(filters?: { project?: string; isBilled?: boolean | string; startDate?: string; endDate?: string }) {
    const res = await api.get<{ success: boolean; data: { timeLogs: TimeLog[] } }>('/time-logs', {
      params: filters,
    });
    return res.data.data.timeLogs;
  },

  async getUnbilledLogs(clientId: string, startDate?: string, endDate?: string) {
    const res = await api.get<{ success: boolean; data: { timeLogs: TimeLog[] } }>('/time-logs/unbilled', {
      params: { clientId, startDate, endDate },
    });
    return res.data.data.timeLogs;
  },

  async createTimeLog(data: {
    projectId: string;
    taskId?: string;
    startTime: string | Date;
    endTime: string | Date;
    description?: string;
    hourlyRate?: number;
  }) {
    const res = await api.post<{ success: boolean; data: { timeLog: TimeLog } }>('/time-logs', data);
    return res.data.data.timeLog;
  },

  async updateTimeLog(id: string, data: Partial<TimeLog> & { projectId?: string; taskId?: string }) {
    const res = await api.put<{ success: boolean; data: { timeLog: TimeLog } }>(`/time-logs/${id}`, data);
    return res.data.data.timeLog;
  },

  async deleteTimeLog(id: string) {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/time-logs/${id}`);
    return res.data.data;
  },
};
