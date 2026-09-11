import api from './api';
import { Client } from '../types';

export const clientService = {
  async getClients(search?: string) {
    const params = search ? { search } : {};
    const res = await api.get<{ success: boolean; data: { clients: Client[] } }>('/clients', {
      params,
    });
    return res.data.data.clients;
  },

  async getClientById(id: string) {
    const res = await api.get<{ success: boolean; data: { client: Client & { projects: any[]; invoices: any[] } } }>(
      `/clients/${id}`
    );
    return res.data.data.client;
  },

  async createClient(data: Partial<Client>) {
    const res = await api.post<{ success: boolean; data: { client: Client } }>('/clients', data);
    return res.data.data.client;
  },

  async updateClient(id: string, data: Partial<Client>) {
    const res = await api.put<{ success: boolean; data: { client: Client } }>(`/clients/${id}`, data);
    return res.data.data.client;
  },

  async deleteClient(id: string) {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/clients/${id}`);
    return res.data.data;
  },
};
