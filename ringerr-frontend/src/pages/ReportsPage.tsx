import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, ShoppingBag, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import api from '../api/axios'

// ── Types ────────────────────────────────────────────────────────────────────

interface RevenueReport {
  period: string
  from: string
  to: string
  revenue: number
  orderCount: number
}

interface BestSeller {
  menuItemId: number
  menuItemName: string
  totalQty: number
  totalRevenue: number
}

interface PeakHour {
  hour: number
  orderCount: number
}

type Period = 'daily' | 'weekly' | 'monthly'
type Tab = 'revenue' | 'best-sellers' | 'peak-hours'

// ── Sub-components ────────────────────────────────────────────────────────────

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
          style={{
            background: value === p ? 'rgba(255,138,0,0.15)' : 'transparent',
            color: value === p ? '#FF8A00' : '#9CA3AF',
            border: value === p ? '1px solid rgba(255,138,0,0.3)' : '1px solid transparent',
          }}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function RevenueTab({ period, onPeriodChange }: { period: Period; onPeriodChange: (p: Period) => void }) {
  const [data, setData] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<RevenueReport>(`/reports/revenue?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const res = await api.get(`/reports/export/${type}?period=${period}`, { responseType: 'blob' })
      const ext = type === 'excel' ? 'xlsx' : 'pdf'
      const mime = type === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
      const blob = new Blob([res.data], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ringerr-report-${period}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector value={period} onChange={onPeriodChange} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
          >
            <FileSpreadsheet size={14} />
            Download Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
          >
            <FileText size={14} />
            Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Revenue card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.2)' }}>
                <TrendingUp size={18} style={{ color: '#FF8A00' }} />
              </div>
              <span className="text-xs px-2 py-1 rounded-lg capitalize"
                style={{ background: 'rgba(255,138,0,0.1)', color: '#FF8A00' }}>
                {data.period}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#F9FAFB' }}>
              ₹{Number(data.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm" style={{ color: '#9CA3AF' }}>Total Revenue</div>
            <div className="mt-3 text-xs" style={{ color: '#6B7280' }}>
              {new Date(data.from).toLocaleDateString('en-IN')} — {new Date(data.to).toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* Order count card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <ShoppingBag size={18} style={{ color: '#22C55E' }} />
              </div>
              <span className="text-xs px-2 py-1 rounded-lg capitalize"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                Paid orders
              </span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#F9FAFB' }}>
              {data.orderCount.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: '#9CA3AF' }}>Orders Completed</div>
            <div className="mt-3 text-xs" style={{ color: '#6B7280' }}>
              Avg ₹{data.orderCount > 0
                ? Number(data.revenue / data.orderCount).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                : 0} per order
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <BarChart2 size={32} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No data available</p>
        </div>
      )}
    </div>
  )
}

function BestSellersTab() {
  const [data, setData] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<BestSeller[]>('/reports/best-sellers?limit=20')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxQty = data.length > 0 ? Math.max(...data.map(d => d.totalQty)) : 1

  return (
    <div className="card overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={32} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No sales data yet</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Rank', 'Item', 'Qty Sold', 'Revenue', 'Share'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#9CA3AF' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={item.menuItemId}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-6 py-4">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i === 0 ? 'rgba(255,138,0,0.18)' : i === 1 ? 'rgba(156,163,175,0.12)' : i === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                      color: i === 0 ? '#FF8A00' : i === 1 ? '#9CA3AF' : i === 2 ? '#F59E0B' : '#6B7280',
                    }}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{item.menuItemName}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold" style={{ color: '#06B6D4' }}>{item.totalQty.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold" style={{ color: '#22C55E' }}>
                    ₹{Number(item.totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-6 py-4 w-32">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.totalQty / maxQty) * 100}%`,
                          background: 'linear-gradient(90deg,#FF8A00,#FF8A0066)',
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: '#6B7280' }}>
                      {Math.round((item.totalQty / maxQty) * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function PeakHoursTab() {
  const [data, setData] = useState<PeakHour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<PeakHour[]>('/reports/peak-hours')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const max = data.length > 0 ? Math.max(...data.map(d => d.orderCount), 1) : 1
  const totalOrders = data.reduce((s, d) => s + d.orderCount, 0)

  const fmt12 = (h: number) => {
    if (h === 0)  return '12am'
    if (h === 12) return '12pm'
    return h < 12 ? `${h}am` : `${h - 12}pm`
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Order Volume by Hour</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Today's distribution — {totalOrders} total orders</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin" style={{ color: '#FF8A00' }} />
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="flex items-end gap-1 h-36 mb-3">
              {data.map(({ hour, orderCount }) => {
                const pct = max > 0 ? (orderCount / max) * 100 : 0
                const isHigh   = pct > 75
                const isMed    = pct > 40
                const barColor = isHigh
                  ? 'linear-gradient(180deg,#FF8A00,#FF6B0099)'
                  : isMed
                    ? 'linear-gradient(180deg,#F59E0B,#F59E0B66)'
                    : 'linear-gradient(180deg,#374151,#1F2937)'
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    {orderCount > 0 && (
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded whitespace-nowrap z-10"
                        style={{ background: '#1A1F2E', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {orderCount}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-sm transition-all duration-500 opacity-80 group-hover:opacity-100"
                      style={{
                        height: `${Math.max((pct / 100) * 128, 4)}px`,
                        background: barColor,
                        minHeight: 4,
                      }}
                    />
                    {hour % 3 === 0 && (
                      <span className="text-center leading-none" style={{ color: '#6B7280', fontSize: 8 }}>
                        {fmt12(hour)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Peak hour callout */}
            {totalOrders > 0 && (() => {
              const peak = data.reduce((a, b) => a.orderCount > b.orderCount ? a : b)
              return peak.orderCount > 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl mt-2"
                  style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
                  <BarChart2 size={16} style={{ color: '#FF8A00' }} />
                  <div>
                    <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>
                      Peak Hour: {fmt12(peak.hour)}
                    </span>
                    <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>
                      {peak.orderCount} orders
                    </span>
                  </div>
                </div>
              ) : null
            })()}
          </>
        )}
      </div>

      {/* Hour summary table */}
      {!loading && totalOrders > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Hourly Breakdown</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 divide-x divide-y"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {data.filter(d => d.orderCount > 0).map(({ hour, orderCount }) => (
              <div key={hour} className="p-3 text-center">
                <div className="text-xs" style={{ color: '#9CA3AF' }}>{fmt12(hour)}</div>
                <div className="text-lg font-bold mt-1" style={{ color: orderCount > 0 ? '#FF8A00' : '#374151' }}>
                  {orderCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('revenue')
  const [period, setPeriod] = useState<Period>('daily')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'revenue',      label: 'Revenue'      },
    { key: 'best-sellers', label: 'Best Sellers'  },
    { key: 'peak-hours',   label: 'Peak Hours'    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <BarChart2 size={18} style={{ color: '#FF8A00' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Reports</h1>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Revenue, best sellers, and hourly traffic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === key ? '#1A1F2E' : 'transparent',
              color: tab === key ? '#F9FAFB' : '#9CA3AF',
              border: tab === key ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'revenue'      && <RevenueTab period={period} onPeriodChange={setPeriod} />}
      {tab === 'best-sellers' && <BestSellersTab />}
      {tab === 'peak-hours'   && <PeakHoursTab />}
    </div>
  )
}
