import api from './api';

export const sampleDataService = {
  async seedSampleData() {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string; alreadyPopulated?: boolean } }>(
      '/sample-data'
    );
    return res.data.data;
  },

  async loadSampleData() {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string; alreadyPopulated?: boolean } }>(
      '/sample-data'
    );
    return res.data.data;
  },

  async clearSampleData() {
    const res = await api.delete<{ success: boolean; data: { success: boolean; message: string } }>(
      '/sample-data'
    );
    return res.data.data;
  },
};
