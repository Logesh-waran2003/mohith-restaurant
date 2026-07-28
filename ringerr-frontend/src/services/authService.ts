import api from '../api/axios'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth'

const STORAGE_KEY = 'ringerr_user'

export const authService = {
  async login(data: LoginRequest): Promise<AuthUser> {
    const res = await api.post('/auth/login', data)
    const user: AuthUser = {
      token: res.data.token,
      email: res.data.email,
      fullName: res.data.fullName,
      roles: res.data.roles,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  async register(data: RegisterRequest): Promise<AuthUser> {
    const res = await api.post('/auth/register', data)
    const user: AuthUser = {
      token: res.data.token,
      email: res.data.email,
      fullName: res.data.fullName,
      roles: res.data.roles,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return this.getUser() !== null
  },
}
