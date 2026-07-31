import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, RefreshCw, Loader2, ChefHat, CheckCircle2, Zap } from 'lucide-react'
import { orderService } from '../services/orderService'
import type { Order, OrderStatus } from '../types/models'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

type KDSCol = 'PENDING' | 'PREPARING' | 'READY'

const colConfig: Record<KDSCol, { label: string; color: string; bg: string; border: string; action: string; next: OrderStatus | null }> = {
  PENDING:   { label: 'New Orders', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)',  action: 'Start Cooking', next: 'PREPARING' },
  PREPARING: { label: 'Cooking',    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', action: 'Mark Ready',    next: 'READY'     },
  READY:     { label: 'Ready',      color: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  action: 'Mark Served ✓', next: 'SERVED'    },
}

// Web Audio API beep for new PENDING orders
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* AudioContext not available */ }
}

function ElapsedTimer({ createdAt, status }: { createdAt?: string; status: KDSCol }) {
  const [min, setMin] = useState(0)
  useEffect(() => {
    if (!createdAt) return
    const calc = () => setMin(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [createdAt])

  const max = status === 'PENDING' ? 10 : status === 'PREPARING' ? 25 : 40
  const pct = Math.min((min / max) * 100, 100)
  const color = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#22C55E'
  const urgent = pct > 80

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-sm font-bold"
          style={{ color: urgent ? '#EF4444' : '#9CA3AF' }}>
          <Clock size={12} /> {min}m
        </span>
        {urgent && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            <Zap size={10} /> RUSH
          </span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function KOTPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const stompRef   = useRef<Client | null>(null)
  const seenIdsRef = useRef<Set<number>>(new Set())

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const all = await orderService.findAll()
      const active = all.filter((o: Order) => ['PENDING','PREPARING','READY'].includes(o.status))
      // Seed seenIdsRef so first WS message doesn't beep for already-loaded orders
      active.forEach((o: Order) => seenIdsRef.current.add(o.id))
      setOrders(active)
    } catch {
      notify('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // WebSocket real-time updates
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true)
        client.subscribe('/topic/orders', (msg) => {
          try {
            const order: Order = JSON.parse(msg.body)

            // Play beep only for brand-new PENDING orders
            if (order.status === 'PENDING' && !seenIdsRef.current.has(order.id)) {
              playBeep()
            }
            seenIdsRef.current.add(order.id)

            setOrders(prev => {
              const filtered = prev.filter(o => o.id !== order.id)
              if (['PENDING','PREPARING','READY'].includes(order.status)) {
                return [...filtered, order]
              }
              return filtered
            })
          } catch { /* ignore parse errors */ }
        })
      },
      onDisconnect: () => setWsConnected(false),
    })
    client.activate()
    stompRef.current = client
    return () => { client.deactivate() }
  }, [])

  useEffect(() => { load() }, [load])

  const advance = async (order: Order, next: OrderStatus) => {
    try {
      await orderService.updateStatus(order.id, next)
      setOrders(prev => {
        const updated = prev.filter(o => o.id !== order.id)
        if (['PENDING','PREPARING','READY'].includes(next)) {
          return [...updated, { ...order, status: next }]
        }
        return updated
      })
      notify(next === 'SERVED' ? 'Order marked served!' : 'Status updated')
    } catch {
      notify('Failed to update status', 'error')
    }
  }

  const kdsCols: KDSCol[] = ['PENDING', 'PREPARING', 'READY']

  return (
    <div className="flex flex-col h-full" style={{ background: '#09090B' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <ChefHat size={20} style={{ color: '#FF8A00' }} />
          <h1 className="font-bold text-lg" style={{ color: '#F9FAFB' }}>Kitchen Display</h1>
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${wsConnected ? '' : 'opacity-50'}`}
            style={{
              background: wsConnected ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: wsConnected ? '#22C55E' : '#EF4444'
            }}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
              style={{ background: wsConnected ? '#22C55E' : '#EF4444' }} />
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {kdsCols.map(col => (
            <span key={col} className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: colConfig[col].bg, color: colConfig[col].color, border: `1px solid ${colConfig[col].border}` }}>
              {colConfig[col].label}: {orders.filter(o => o.status === col).length}
            </span>
          ))}
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-xs px-3 py-2">
            <RefreshCw size={13} />Refresh
          </button>
        </div>
      </div>

      {/* KDS Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-4 p-6 overflow-hidden">
          {kdsCols.map(col => {
            const cfg = colConfig[col]
            const colOrders = orders
              .filter(o => o.status === col)
              .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
            return (
              <div key={col} className="flex flex-col overflow-hidden rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${cfg.border}` }}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
                  <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${cfg.color}25`, color: cfg.color }}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 opacity-30">
                      <CheckCircle2 size={24} style={{ color: cfg.color }} />
                      <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>All clear</p>
                    </div>
                  ) : colOrders.map(order => (
                    <div key={order.id} className="card p-4 rounded-xl"
                      style={{ borderLeft: `4px solid ${cfg.color}` }}>
                      {/* Order ID + table */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>
                            #{String(order.id).padStart(3, '0')}
                          </span>
                          {order.table && (
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(255,138,0,0.12)', color: '#FF8A00' }}>
                              T-{order.table.tableNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Elapsed timer */}
                      <div className="mb-3">
                        <ElapsedTimer createdAt={order.createdAt} status={col} />
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 mb-3">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span style={{ color: '#F9FAFB' }}>{item.menuItemName}</span>
                            <span className="font-bold ml-2 flex-shrink-0"
                              style={{ color: cfg.color }}>×{item.quantity}</span>
                          </div>
                        ))}
                        {order.notes && (
                          <p className="text-xs mt-1 italic" style={{ color: '#9CA3AF' }}>
                            Note: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Action button */}
                      {cfg.next && (
                        <button
                          onClick={() => advance(order, cfg.next!)}
                          className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium z-50"
          style={{
            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
