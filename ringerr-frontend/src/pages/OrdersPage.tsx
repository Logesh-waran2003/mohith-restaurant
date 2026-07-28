import { useState, useEffect } from 'react'
import {
  Clock, Bike, UtensilsCrossed, ShoppingBag, Home, Loader2, RefreshCw, Plus
} from 'lucide-react'
import { orderService } from '../services/orderService'
import type { Order, OrderStatus } from '../types/models'
import NewOrderModal from '../components/NewOrderModal'

type Platform = 'dine-in' | 'takeaway' | 'swiggy' | 'zomato'

const platformConfig = {
  'dine-in':  { label: 'Dine-In',  color: '#06B6D4', icon: UtensilsCrossed },
  'takeaway': { label: 'Takeaway', color: '#A855F7', icon: ShoppingBag },
  'swiggy':   { label: 'Swiggy',   color: '#FF6900', icon: Bike },
  'zomato':   { label: 'Zomato',   color: '#EF4444', icon: Home },
}

const colConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  PREPARING: { label: 'Preparing', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)'   },
  READY:     { label: 'Ready',     color: '#22C55E', bg: 'rgba(34,197,94,0.08)'   },
  SERVED:    { label: 'Served',    color: '#A855F7', bg: 'rgba(168,85,247,0.08)'  },
  PAID:      { label: 'Paid',      color: '#9CA3AF', bg: 'rgba(156,163,175,0.06)' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.06)'   },
}

const columns: OrderStatus[] = ['PENDING','PREPARING','READY','SERVED','PAID']
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PREPARING', PREPARING: 'READY', READY: 'SERVED', SERVED: 'PAID'
}
const actionLabel: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Start Cooking', PREPARING: 'Mark Ready', READY: 'Mark Served', SERVED: 'Mark Paid'
}

function ElapsedBadge({ createdAt, status }: { createdAt?: string; status: OrderStatus }) {
  if (!createdAt) return null
  const min = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  const urgent = min > 30 && status !== 'PAID' && status !== 'SERVED'
  const warn   = min > 15 && status !== 'PAID' && status !== 'SERVED'
  return (
    <span className="flex items-center gap-1 text-xs"
      style={{ color: urgent ? '#EF4444' : warn ? '#F59E0B' : '#9CA3AF' }}>
      <Clock size={10} />{min}m
    </span>
  )
}

function PlatformTag({ platform }: { platform: Platform }) {
  const cfg = platformConfig[platform]
  const Icon = cfg.icon
  return (
    <span className="flex items-center gap-1 badge text-xs"
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      <Icon size={9} /> {cfg.label}
    </span>
  )
}

function getPlatform(order: Order): Platform {
  const notes = order.notes?.toLowerCase() || ''
  if (notes.includes('swiggy')) return 'swiggy'
  if (notes.includes('zomato')) return 'zomato'
  if (notes.includes('takeaway')) return 'takeaway'
  return 'dine-in'
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const data = await orderService.findAll()
      setOrders(data)
    } catch {
      notify('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const advance = async (order: Order) => {
    const next = nextStatus[order.status]
    if (!next) return
    try {
      const updated = await orderService.updateStatus(order.id, next)
      setOrders(os => os.map(o => o.id === order.id ? updated : o))
      notify(`Order #${order.id} → ${colConfig[next].label}`)
    } catch {
      notify('Failed to update status', 'error')
    }
  }

  const cancel = async (order: Order) => {
    if (!confirm('Cancel this order?')) return
    try {
      await orderService.updateStatus(order.id, 'CANCELLED')
      setOrders(os => os.map(o => o.id === order.id ? { ...o, status: 'CANCELLED' } : o))
      notify(`Order #${order.id} cancelled`)
    } catch {
      notify('Failed to cancel order', 'error')
    }
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {orders.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED').length} active orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowNewOrder(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const cfg = colConfig[col]
            const colOrders = orders.filter(o => o.status === col)
            return (
              <div key={col} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-32">
                  {colOrders.map(order => (
                    <div key={order.id} className="card p-4 space-y-3"
                      style={{ borderLeft: `3px solid ${cfg.color}` }}>
                      {/* Top row */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>
                          #{order.id}
                        </span>
                        <ElapsedBadge createdAt={order.createdAt} status={order.status} />
                      </div>

                      {/* Table + platform */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#F9FAFB' }}>
                          T-{order.table?.tableNumber ?? '-'}
                        </span>
                        <PlatformTag platform={getPlatform(order)} />
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map(item => (
                          <div key={item.id} className="flex justify-between text-xs"
                            style={{ color: '#9CA3AF' }}>
                            <span className="truncate">{item.menuItemName} ×{item.quantity}</span>
                            <span style={{ color: '#F9FAFB' }}>₹{item.subtotal}</span>
                          </div>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <div className="text-xs" style={{ color: '#6B7280' }}>
                            +{order.items.length - 3} more
                          </div>
                        )}
                      </div>

                      {order.notes && (
                        <div className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}>
                          📝 {order.notes}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm font-bold" style={{ color: '#FF8A00' }}>
                          ₹{order.totalAmount}
                        </span>
                        <div className="flex items-center gap-1">
                          {order.status === 'PENDING' && (
                            <button onClick={() => cancel(order)}
                              className="text-xs px-2 py-1 rounded-lg transition-all"
                              style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                              Cancel
                            </button>
                          )}
                          {nextStatus[order.status] && (
                            <button onClick={() => advance(order)}
                              className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all hover:scale-105"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                              {actionLabel[order.status]}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 rounded-2xl"
                      style={{ border: '1px dashed rgba(255,255,255,0.08)', color: '#4B5563' }}>
                      <div className="text-2xl mb-1">—</div>
                      <div className="text-xs">No orders</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={() => { notify('Order placed and sent to KOT'); load() }}
        />
      )}
    </div>
  )
}
