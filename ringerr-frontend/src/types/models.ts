export interface Category {
  id: number
  name: string
  description?: string
  active: boolean
  createdAt?: string
}

export interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  category: Category
  imageUrl?: string
  available: boolean
  createdAt?: string
}

export interface RestaurantTable {
  id: number
  tableNumber: number
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  location?: string
  publicToken?: string
}

export interface Staff {
  id: number
  userId: number
  fullName: string
  email: string
  position: string
  phone?: string
  hireDate?: string
  active: boolean
}

export interface OrderItem {
  id: number
  menuItemId: number
  menuItemName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED'

export interface Order {
  id: number
  table: RestaurantTable
  staff?: Staff
  status: OrderStatus
  totalAmount: number
  notes?: string
  items: OrderItem[]
  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  totalTables: number
  availableTables: number
  occupiedTables: number
  totalMenuItems: number
  pendingOrders: number
  preparingOrders: number
  todayOrders: number
  todayRevenue: number
  totalStaff: number
}
