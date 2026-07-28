import api from '../api/axios'
import type { RestaurantTable } from '../types/models'

export const tableService = {
  findAll: () => api.get<RestaurantTable[]>('/tables').then(r => r.data),
  create: (data: { tableNumber: number; capacity: number; location?: string }) =>
    api.post<RestaurantTable>('/tables', data).then(r => r.data),
  update: (id: number, data: { tableNumber: number; capacity: number; location?: string }) =>
    api.put<RestaurantTable>(`/tables/${id}`, data).then(r => r.data),
  updateStatus: (id: number, status: string) =>
    api.patch<RestaurantTable>(`/tables/${id}/status?status=${status}`).then(r => r.data),
  delete: (id: number) => api.delete(`/tables/${id}`),
}
