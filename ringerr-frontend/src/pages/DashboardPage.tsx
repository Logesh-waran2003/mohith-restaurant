import { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingBag, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, Flame, Activity,
  ChefHat, Table2, Loader2
} from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { orderService } from '../services/orderService'

const useCounter = (target: number, duration = 1200) => {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return val
}

const peakHours = [
  { h: '8am', v: 20 }, { h: '9am', v: 35 }, { h: '10am', v: 28 },
  { h: '11am', v: 45 }, { h: '12pm', v: 90 }, { h: '1pm', v: 100 },
  { h: '2pm', v: 72 }, { h: '3pm', v: 38 }, { h: '4pm', v: 30 },
  { h: '5pm', v: 42 }, { h: '6pm', v: 65 }, { h: '7pm', v: 88 },
  { h: '8pm', v: 95 }, { h: '9pm', v: 78 }, { h: '10pm', v: 50 },
]

function KpiCard({ label, value, prefix, suffix, delta, up, color, icon: Icon }: any) {
  const count = useCounter(value)
  return (
    <div className="stat-card card-hover" style={{ '--glow': color } as any}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1A`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className={`badge ${up ? 'badge-success' : 'badge-danger'} flex items-center gap-1`}>
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {delta}%
        </span>
      </div>
      <div className="text-2xl font-bold animate-counter" style={{ color: '#F9FAFB' }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</div>
      <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((value / (value * 1.2)) * 100, 85)}%`, background: `linear-gradient(90deg,${color},${color}99)` }} />
      </div>
    </div>
  )
}

function PeakChart() {
  const max = Math.max(...peakHours.map(p => p.v))
  return (
    <div className="flex items-end gap-1.5 h-24">
      {peakHours.map((p, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 opacity-80"
            style={{
              height: `${(p.v / max) * 80}px`,
              background: p.v > 80
                ? 'linear-gradient(180deg,#FF8A00,#FF6B0099)'
                : p.v > 50
                  ? 'linear-gradient(180deg,#F59E0B,#F59E0B66)'
                  : 'linear-gradient(180deg,#374151,#1F2937)',
              minHeight: 4,
            }} />
          <span className="text-xs" style={{ color: '#6B7280', fontSize: 9 }}>{p.h}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [stats, setStats] = useState<any>(null)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      orderService.findAll(),
    ]).then(([s, orders]) => {
      setStats(s)
      const pending = orders
        .filter((o: any) => o.status === 'PENDING' || o.status === 'PREPARING')
        .slice(0, 3)
        .map((o: any, i: number) => ({
          id: `KOT#${o.id}`,
          table: `T-${o.tableId || o.table?.tableNumber || '?'}`,
          items: o.items?.map((it: any) => `${it.menuItemName} x${it.quantity}`) || [],
          time: Math.floor((Date.now() - new Date(o.createdAt || Date.now()).getTime()) / 60000),
          urgency: i === 0 ? 'normal' : i === 1 ? 'warn' : 'alert',
        }))
      setPendingOrders(pending)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: "Today's Revenue",  value: Number(stats.todayRevenue || 0), prefix: '₹', suffix: '', delta: 0, up: true,  color: '#FF8A00', icon: DollarSign },
    { label: 'Orders Today',     value: stats.todayOrders || 0,          prefix: '',  suffix: '', delta: 0, up: true,  color: '#22C55E', icon: ShoppingBag },
    { label: 'Active Tables',    value: stats.occupiedTables || 0,       prefix: '',  suffix: `/${stats.totalTables}`, delta: 0, up: true, color: '#06B6D4', icon: Table2 },
    { label: 'Menu Items',       value: stats.totalMenuItems || 0,       prefix: '',  suffix: '', delta: 0, up: true,  color: '#A855F7', icon: TrendingUp },
  ] : []

  const occupancyPct = stats
    ? Math.round((stats.occupiedTables / (stats.totalTables || 1)) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>
            {greeting}, Admin 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
            <span className="text-xs font-medium" style={{ color: '#22C55E' }}>Restaurant Open</span>
          </div>
          <a href="/orders" className="btn-primary text-sm">+ New Order</a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Peak Hours</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Order volume by hour</p>
                </div>
                <span className="badge badge-primary">Today</span>
              </div>
              <PeakChart />
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-sm mb-4" style={{ color: '#F9FAFB' }}>Occupancy</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#FF8A00" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 38 * (occupancyPct / 100)} ${2 * Math.PI * 38}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{occupancyPct}%</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{stats?.occupiedTables}/{stats?.totalTables}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Occupied',  count: stats?.occupiedTables,  color: '#FF8A00' },
                  { label: 'Available', count: stats?.availableTables, color: '#22C55E' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span style={{ color: '#9CA3AF' }}>{label}</span>
                    </div>
                    <span className="font-semibold" style={{ color: '#F9FAFB' }}>{count ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pending KOTs */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Pending Kitchen</h3>
                <span className="badge badge-warning">{stats?.pendingOrders ?? 0}</span>
              </div>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-6">
                  <ChefHat size={24} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((kot, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{
                        background: kot.urgency === 'alert' ? 'rgba(239,68,68,0.06)' : kot.urgency === 'warn' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${kot.urgency === 'alert' ? 'rgba(239,68,68,0.15)' : kot.urgency === 'warn' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      <ChefHat size={14} className="mt-0.5 flex-shrink-0"
                        style={{ color: kot.urgency === 'alert' ? '#EF4444' : kot.urgency === 'warn' ? '#F59E0B' : '#9CA3AF' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{kot.id}</span>
                          <span className="badge badge-info text-xs">{kot.table}</span>
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{kot.items[0] || 'No items'}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock size={11} style={{ color: kot.urgency === 'alert' ? '#EF4444' : '#9CA3AF' }} />
                        <span className="text-xs font-medium"
                          style={{ color: kot.urgency === 'alert' ? '#EF4444' : kot.urgency === 'warn' ? '#F59E0B' : '#9CA3AF' }}>
                          {kot.time}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats summary */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Kitchen Status</h3>
                <Flame size={15} style={{ color: '#FF8A00' }} />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Pending',   value: stats?.pendingOrders,   color: '#F59E0B' },
                  { label: 'Preparing', value: stats?.preparingOrders, color: '#06B6D4' },
                  { label: 'Staff',     value: stats?.totalStaff,      color: '#A855F7' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
                    <span className="text-2xl font-bold" style={{ color }}>{value ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Quick Stats</h3>
                <Activity size={14} style={{ color: '#9CA3AF' }} />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Total Tables',    val: stats?.totalTables,    color: '#06B6D4' },
                  { label: 'Available Tables',val: stats?.availableTables, color: '#22C55E' },
                  { label: 'Menu Items',      val: stats?.totalMenuItems,  color: '#A855F7' },
                  { label: "Today's Orders",  val: stats?.todayOrders,     color: '#FF8A00' },
                  { label: "Today's Revenue", val: `₹${Number(stats?.todayRevenue || 0).toLocaleString()}`, color: '#22C55E' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span style={{ color: '#9CA3AF' }}>{r.label}</span>
                    <span className="font-bold" style={{ color: r.color }}>{r.val ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
