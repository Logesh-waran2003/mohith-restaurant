import { useState, useEffect, useRef } from 'react'
import {
  ClipboardList, DollarSign, CheckCircle2, Loader2,
  RefreshCw, Zap, TrendingUp, Clock, X, Banknote, CreditCard
} from 'lucide-react'
import { orderService } from '../services/orderService'
import type { Order, OrderStatus } from '../types/models'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  PREPARING: { label: 'Preparing', color: '#06B6D4', bg: 'rgba(6,182,212,0.10)'   },
  READY:     { label: 'Ready',     color: '#22C55E', bg: 'rgba(34,197,94,0.10)'   },
  SERVED:    { label: 'Served',    color: '#A855F7', bg: 'rgba(168,85,247,0.10)'  },
  PAID:      { label: 'Paid',      color: '#9CA3AF', bg: 'rgba(156,163,175,0.06)' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.06)'   },
}

function ElapsedBadge({ createdAt }: { createdAt?: string }) {
  const [min, setMin] = useState(0)
  useEffect(() => {
    if (!createdAt) return
    const calc = () => setMin(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [createdAt])
  const urgent = min > 30
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: urgent ? '#EF4444' : '#9CA3AF' }}>
      <Clock size={10} />{min}m
    </span>
  )
}

interface SettleModalProps {
  order: Order
  onClose: () => void
  onSettled: (orderId: number) => void
}

function SettleModal({ order, onClose, onSettled }: SettleModalProps) {
  const [method, setMethod] = useState<'cash' | 'upi' | 'card'>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [settling, setSettling] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const total = Number(order.totalAmount) || 0
  const change = method === 'cash' && cashGiven ? Math.max(0, Number(cashGiven) - total) : 0

  const handleSettle = async () => {
    setSettling(true)
    try {
      await orderService.updateStatus(order.id, 'PAID')
      onSettled(order.id)
      onClose()
    } catch {
      setToast('Failed to settle order')
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSettling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <Banknote size={18} style={{ color: '#22C55E' }} />
            <span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>
              Settle Order #{order.id} — T{order.table?.tableNumber}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
            <X size={14} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Items summary */}
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span style={{ color: '#9CA3AF' }}>{item.menuItemName} × {item.quantity}</span>
                <span style={{ color: '#F9FAFB' }}>₹{Number(item.subtotal).toFixed(0)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#F9FAFB' }}>
              <span>Total</span>
              <span style={{ color: '#22C55E' }}>₹{total.toFixed(0)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all capitalize"
                  style={{
                    background: method === m ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                    color: method === m ? '#22C55E' : '#9CA3AF',
                    border: `1px solid ${method === m ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {m === 'cash' && <Banknote size={13} className="inline mr-1" />}
                  {m === 'card' && <CreditCard size={13} className="inline mr-1" />}
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cash tendered */}
          {method === 'cash' && (
            <div>
              <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Cash Given</p>
              <input
                type="number"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
                placeholder={`₹${total.toFixed(0)} or more`}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F9FAFB',
                }}
              />
              {cashGiven && Number(cashGiven) >= total && (
                <div className="flex justify-between mt-2 px-1 text-sm font-bold">
                  <span style={{ color: '#9CA3AF' }}>Change</span>
                  <span style={{ color: '#22C55E' }}>₹{change.toFixed(0)}</span>
                </div>
              )}
            </div>
          )}

          {toast && (
            <div className="text-xs px-3 py-2 rounded-lg text-center"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {toast}
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleSettle}
            disabled={settling || (method === 'cash' && cashGiven !== '' && Number(cashGiven) < total)}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg,#22C55E,#16A34A)',
              color: '#fff',
              opacity: settling ? 0.7 : 1,
            }}>
            {settling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {settling ? 'Settling...' : 'Confirm Settlement'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReceptionistPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [settle, setSettle]   = useState<Order | null>(null)
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const stompRef = useRef<Client | null>(null)

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    try {
      setLoading(true)
      const data = await orderService.findActive()
      setOrders(data)
    } catch {
      notify('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true)
        client.subscribe('/topic/orders', msg => {
          const order: Order = JSON.parse(msg.body)
          setOrders(prev => {
            const exists = prev.find(o => o.id === order.id)
            if (order.status === 'PAID' || order.status === 'CANCELLED') {
              return prev.filter(o => o.id !== order.id)
            }
            return exists
              ? prev.map(o => o.id === order.id ? order : o)
              : [order, ...prev]
          })
        })
      },
      onDisconnect: () => setWsConnected(false),
    })
    client.activate()
    stompRef.current = client
    return () => { client.deactivate() }
  }, [])

  // Today's shift stats
  const todayRevenue = orders
    .filter(o => o.status === 'PAID')
    .reduce((s, o) => s + Number(o.totalAmount), 0)

  const activeOrders = orders.filter(o => !['PAID','CANCELLED'].includes(o.status))
  const readyOrders  = orders.filter(o => o.status === 'READY')

  const statusGroups: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
          {toast.msg}
        </div>
      )}

      {/* Settle modal */}
      {settle && (
        <SettleModal
          order={settle}
          onClose={() => setSettle(null)}
          onSettled={id => {
            setOrders(prev => prev.filter(o => o.id !== id))
            notify(`Order #${id} settled`)
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <ClipboardList size={18} style={{ color: '#A855F7' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Reception</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Live orders · cash settlement · shift summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: wsConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: wsConnected ? '#22C55E' : '#EF4444', border: `1px solid ${wsConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: wsConnected ? '#22C55E' : '#EF4444' }} />
            {wsConnected ? 'Live' : 'Offline'}
          </div>
          <button onClick={load}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <RefreshCw size={14} style={{ color: '#9CA3AF' }} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Orders',  val: activeOrders.length, color: '#FF8A00', icon: ClipboardList },
          { label: 'Ready to Serve', val: readyOrders.length,  color: '#22C55E', icon: CheckCircle2  },
          { label: 'Today Revenue',  val: `₹${todayRevenue.toLocaleString()}`, color: '#A855F7', icon: TrendingUp },
          { label: 'Awaiting Payment', val: orders.filter(o => o.status === 'SERVED').length, color: '#06B6D4', icon: DollarSign },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} style={{ color }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <>
          {/* Ready for pickup alert */}
          {readyOrders.length > 0 && (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Zap size={18} style={{ color: '#22C55E' }} />
              <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>
                {readyOrders.length} order{readyOrders.length > 1 ? 's' : ''} ready —
                Tables: {readyOrders.map(o => `T${o.table?.tableNumber}`).join(', ')}
              </span>
            </div>
          )}

          {/* Order columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {statusGroups.map(status => {
              const cfg = statusCfg[status]
              const cols = orders.filter(o => o.status === status)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: cfg.bg, color: cfg.color }}>{cols.length}</span>
                  </div>
                  <div className="space-y-3">
                    {cols.length === 0 ? (
                      <div className="card p-4 text-center">
                        <p className="text-xs" style={{ color: '#6B7280' }}>No orders</p>
                      </div>
                    ) : cols.map(order => (
                      <div key={order.id} className="card p-4 space-y-3"
                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>#{order.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(255,138,0,0.12)', color: '#FF8A00' }}>
                                T{order.table?.tableNumber}
                              </span>
                              {order.orderType === 'TAKEAWAY' && (
                                <span className="px-2 py-0.5 rounded-full text-xs"
                                  style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>Takeaway</span>
                              )}
                            </div>
                            <p className="text-xs mt-1 truncate" style={{ color: '#9CA3AF' }}>
                              {order.items?.map(i => i.menuItemName).join(', ')}
                            </p>
                          </div>
                          <ElapsedBadge createdAt={order.createdAt} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: '#22C55E' }}>
                            ₹{Number(order.totalAmount).toFixed(0)}
                          </span>
                          {status === 'SERVED' && (
                            <button
                              onClick={() => setSettle(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                              style={{
                                background: 'rgba(34,197,94,0.15)',
                                color: '#22C55E',
                                border: '1px solid rgba(34,197,94,0.25)',
                              }}>
                              <Banknote size={12} /> Collect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Shift summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: '#FF8A00' }} />
              <span className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Shift Summary</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Orders',  val: orders.length },
                { label: 'Pending',       val: orders.filter(o => o.status === 'PENDING').length },
                { label: 'Preparing',     val: orders.filter(o => o.status === 'PREPARING').length },
                { label: 'Ready',         val: readyOrders.length },
              ].map(({ label, val }) => (
                <div key={label} className="text-center p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{val}</div>
                  <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
