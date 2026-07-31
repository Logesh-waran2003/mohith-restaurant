import api from '../api/axios'
import type { Order, OrderStatus } from '../types/models'

export const orderService = {
  findAll: () => api.get<Order[]>('/orders').then(r => r.data),
  findActive: () => api.get<Order[]>('/orders/active').then(r => r.data),
  findByStatus: (status: OrderStatus) => api.get<Order[]>(`/orders/status/${status}`).then(r => r.data),
  findById: (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  create: (data: {
    tableId: number; staffId?: number; notes?: string; orderType?: 'DINE_IN' | 'TAKEAWAY';
    items: { menuItemId: number; quantity: number; notes?: string }[]
  }) => api.post<Order>('/orders', data).then(r => r.data),
  updateStatus: (id: number, status: OrderStatus) =>
    api.patch<Order>(`/orders/${id}/status?status=${status}`).then(r => r.data),
  delete: (id: number) => api.delete(`/orders/${id}`),
}
