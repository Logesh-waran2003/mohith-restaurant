import api from '../api/axios'
import type { DashboardStats } from '../types/models'

export const dashboardService = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
}
