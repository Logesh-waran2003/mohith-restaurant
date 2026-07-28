export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  email: string
  fullName: string
  roles: string[]
}

export interface AuthUser {
  token: string
  email: string
  fullName: string
  roles: string[]
}
