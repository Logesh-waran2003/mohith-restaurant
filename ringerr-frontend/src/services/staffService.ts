import api from '../api/axios'
import type { Staff } from '../types/models'

export const staffService = {
  findAll: () => api.get<Staff[]>('/staff').then(r => r.data),
  findActive: () => api.get<Staff[]>('/staff/active').then(r => r.data),
  create: (data: { userId: number; position: string; phone?: string; hireDate?: string }) =>
    api.post<Staff>('/staff', data).then(r => r.data),
  update: (id: number, data: { userId: number; position: string; phone?: string; hireDate?: string }) =>
    api.put<Staff>(`/staff/${id}`, data).then(r => r.data),
  deactivate: (id: number) => api.patch<Staff>(`/staff/${id}/deactivate`).then(r => r.data),
  delete: (id: number) => api.delete(`/staff/${id}`),
}
