import api from '../api/axios'
import type { Category, MenuItem } from '../types/models'

export const categoryService = {
  findAll: () => api.get<Category[]>('/categories').then(r => r.data),
  findActive: () => api.get<Category[]>('/categories/active').then(r => r.data),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data).then(r => r.data),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

export const menuItemService = {
  findAll: () => api.get<MenuItem[]>('/menu-items').then(r => r.data),
  findAvailable: () => api.get<MenuItem[]>('/menu-items/available').then(r => r.data),
  findByCategory: (categoryId: number) => api.get<MenuItem[]>(`/menu-items/category/${categoryId}`).then(r => r.data),
  create: (data: {
    name: string; description?: string; price: number;
    categoryId: number; imageUrl?: string; available: boolean
  }) => api.post<MenuItem>('/menu-items', data).then(r => r.data),
  update: (id: number, data: {
    name: string; description?: string; price: number;
    categoryId: number; imageUrl?: string; available: boolean
  }) => api.put<MenuItem>(`/menu-items/${id}`, data).then(r => r.data),
  toggleAvailability: (id: number) => api.patch<MenuItem>(`/menu-items/${id}/toggle-availability`).then(r => r.data),
  delete: (id: number) => api.delete(`/menu-items/${id}`),
}
