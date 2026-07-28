import { useState, useEffect } from 'react'
import {
  Plus, QrCode, Users,
  Merge, RefreshCw, CheckCircle2, Search, Trash2, X, Loader2,
  ShoppingCart, Copy, ExternalLink
} from 'lucide-react'
import { tableService } from '../services/tableService'
import type { RestaurantTable } from '../types/models'
import NewOrderModal from '../components/NewOrderModal'

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'

const statusConfig = {
  AVAILABLE: { label: 'Available', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)'  },
  OCCUPIED:  { label: 'Occupied',  color: '#FF8A00', bg: 'rgba(255,138,0,0.12)', border: 'rgba(255,138,0,0.25)'  },
  RESERVED:  { label: 'Reserved',  color: '#A855F7', bg: 'rgba(168,85,247,0.12)',border: 'rgba(168,85,247,0.25)' },
  CLEANING:  { label: 'Cleaning',  color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)'  },
}

export default function TablesPage() {
  const [tables, setTables]     = useState<RestaurantTable[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const [filter, setFilter]     = useState<TableStatus | 'all'>('all')
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [newOrderTableId, setNewOrderTableId] = useState<number | undefined>()

  // QR modal
  const [qrTable, setQrTable]   = useState<RestaurantTable | null>(null)
  // Merge modal
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeTarget, setMergeTarget] = useState<RestaurantTable | null>(null)

  const [form, setForm] = useState({ tableNumber: '', capacity: '', location: '' })

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const data = await tableService.findAll()
      setTables(data)
    } catch {
      notify('Failed to load tables', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const counts = {
    all:       tables.length,
    AVAILABLE: tables.filter(t => t.status === 'AVAILABLE').length,
    OCCUPIED:  tables.filter(t => t.status === 'OCCUPIED').length,
    RESERVED:  tables.filter(t => t.status === 'RESERVED').length,
    CLEANING:  tables.filter(t => t.status === 'CLEANING').length,
  }

  const filtered = tables.filter(t =>
    (filter === 'all' || t.status === filter) &&
    (search === '' || String(t.tableNumber).includes(search) || (t.location||'').toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!form.tableNumber || !form.capacity) return notify('Table number and capacity are required', 'error')
    try {
      setSaving(true)
      await tableService.create({
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
        location: form.location || undefined,
      })
      notify('Table added successfully')
      setShowAdd(false)
      setForm({ tableNumber: '', capacity: '', location: '' })
      load()
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Failed to add table', 'error')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (id: number, status: TableStatus) => {
    try {
      await tableService.updateStatus(id, status)
      setTables(ts => ts.map(t => t.id === id ? { ...t, status } : t))
      setSelected(s => s?.id === id ? { ...s, status } : s)
      notify(`Status updated to ${statusConfig[status].label}`)
    } catch {
      notify('Failed to update status', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this table?')) return
    try {
      await tableService.delete(id)
      setTables(ts => ts.filter(t => t.id !== id))
      setSelected(null)
      notify('Table deleted')
    } catch {
      notify('Failed to delete table', 'error')
    }
  }

  // QR link helpers
  const getQrUrl = (table: RestaurantTable) =>
    `${window.location.origin}/order/${table.publicToken}`

  const handleCopyQr = (table: RestaurantTable) => {
    navigator.clipboard.writeText(getQrUrl(table))
    notify('QR link copied to clipboard')
  }

  // Merge: combine two tables into one (update selected capacity, delete target)
  const handleMerge = async () => {
    if (!selected || !mergeTarget) return
    try {
      await tableService.update(selected.id, {
        tableNumber: selected.tableNumber,
        capacity: selected.capacity + mergeTarget.capacity,
        location: selected.location,
      })
      await tableService.delete(mergeTarget.id)
      notify(`T-${selected.tableNumber} merged with T-${mergeTarget.tableNumber}`)
      setMergeMode(false)
      setMergeTarget(null)
      setSelected(null)
      load()
    } catch {
      notify('Merge failed', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Floor Plan</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Real-time table management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { setNewOrderTableId(undefined); setShowNewOrder(true) }}
            className="btn-ghost flex items-center gap-2 text-sm" style={{ color: '#FF8A00', borderColor: 'rgba(255,138,0,0.3)' }}>
            <ShoppingCart size={14} /> New Order
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(['AVAILABLE','OCCUPIED','RESERVED','CLEANING'] as TableStatus[]).map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className="card p-4 text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: filter === s ? statusConfig[s].color : 'rgba(255,255,255,0.06)' }}>
            <div className="text-2xl font-bold" style={{ color: statusConfig[s].color }}>{counts[s]}</div>
            <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{statusConfig[s].label}</div>
          </button>
        ))}
      </div>

      {/* Search + merge mode banner */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input className="input-field pl-9 text-sm w-full" placeholder="Search table or location..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {mergeMode && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#A855F7' }}>
            <Merge size={14} />
            {mergeTarget
              ? `Merging T-${selected?.tableNumber} + T-${mergeTarget.tableNumber} — confirm?`
              : `Select a table to merge with T-${selected?.tableNumber}`}
            {mergeTarget && (
              <button onClick={handleMerge}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(168,85,247,0.2)', color: '#A855F7' }}>
                Confirm Merge
              </button>
            )}
            <button onClick={() => { setMergeMode(false); setMergeTarget(null) }} className="ml-1">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filtered.map(table => {
            const cfg = statusConfig[table.status]
            const isMergeTarget = mergeTarget?.id === table.id
            return (
              <div key={table.id}
                onClick={() => {
                  if (mergeMode && selected && table.id !== selected.id) {
                    setMergeTarget(table)
                    return
                  }
                  setSelected(selected?.id === table.id ? null : table)
                }}
                className="relative cursor-pointer rounded-2xl p-3 transition-all duration-200 hover:scale-105 select-none"
                style={{
                  background: isMergeTarget ? 'rgba(168,85,247,0.2)' : cfg.bg,
                  border: `1.5px solid ${isMergeTarget ? '#A855F7' : cfg.border}`,
                  boxShadow: selected?.id === table.id ? `0 0 0 2px ${cfg.color}` : undefined,
                }}>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: cfg.color }}>T-{table.tableNumber}</div>
                  <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    <Users size={10} className="inline mr-1" />{table.capacity}
                  </div>
                  {table.location && <div className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{table.location}</div>}
                </div>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🪑</div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No tables found</p>
        </div>
      )}

      {/* Detail panel */}
      {selected && !mergeMode && (
        <div className="fixed right-6 top-24 w-72 card p-5 z-30 shadow-2xl"
          style={{ border: `1px solid ${statusConfig[selected.status].border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold" style={{ color: '#F9FAFB' }}>Table {selected.tableNumber}</h3>
              <span className="badge mt-1 text-xs" style={{
                background: statusConfig[selected.status].bg,
                color: statusConfig[selected.status].color
              }}>{statusConfig[selected.status].label}</span>
            </div>
            <button onClick={() => setSelected(null)} className="btn-ghost px-2 py-1 text-xs">✕</button>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span style={{ color: '#9CA3AF' }}>Seats</span>
              <span style={{ color: '#F9FAFB' }}>{selected.capacity}</span>
            </div>
            {selected.location && (
              <div className="flex justify-between">
                <span style={{ color: '#9CA3AF' }}>Location</span>
                <span style={{ color: '#F9FAFB' }}>{selected.location}</span>
              </div>
            )}
          </div>

          {/* Status buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['AVAILABLE','OCCUPIED','RESERVED','CLEANING'] as TableStatus[]).map(s => (
              <button key={s} onClick={() => changeStatus(selected.id, s)}
                className="btn-ghost text-xs py-2 flex items-center justify-center gap-1"
                style={{ color: statusConfig[s].color, opacity: selected.status === s ? 0.4 : 1 }}>
                <CheckCircle2 size={12} /> {statusConfig[s].label}
              </button>
            ))}
          </div>

          {/* Take order for this table */}
          <button
            onClick={() => { setNewOrderTableId(selected.id); setShowNewOrder(true) }}
            className="btn-primary w-full text-xs flex items-center justify-center gap-2 mb-3">
            <ShoppingCart size={12} /> Take Order for T-{selected.tableNumber}
          </button>

          <div className="pt-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setQrTable(selected)}
              className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1">
              <QrCode size={12} /> QR
            </button>
            <button
              onClick={() => { setMergeMode(true); setMergeTarget(null) }}
              className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1"
              style={{ color: '#A855F7' }}>
              <Merge size={12} /> Merge
            </button>
            <button onClick={() => handleDelete(selected.id)}
              className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1"
              style={{ color: '#EF4444' }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-6 w-full max-w-sm shadow-2xl"
            style={{ border: '1px solid rgba(6,182,212,0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#F9FAFB' }}>
                QR Code — T-{qrTable.tableNumber}
              </h3>
              <button onClick={() => setQrTable(null)}><X size={18} style={{ color: '#9CA3AF' }} /></button>
            </div>

            {/* QR visual — use a free QR API */}
            <div className="flex justify-center mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQrUrl(qrTable))}`}
                alt="QR Code"
                className="rounded-xl"
                style={{ border: '4px solid white' }}
              />
            </div>

            <div className="text-center mb-4">
              <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Customer scan link</p>
              <p className="text-xs break-all px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#06B6D4', fontFamily: 'monospace' }}>
                {getQrUrl(qrTable)}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleCopyQr(qrTable)}
                className="btn-ghost flex-1 text-sm flex items-center justify-center gap-2">
                <Copy size={13} /> Copy Link
              </button>
              <a href={getQrUrl(qrTable)} target="_blank" rel="noreferrer"
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                <ExternalLink size={13} /> Open
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-6 w-full max-w-sm shadow-2xl" style={{ border: '1px solid rgba(255,138,0,0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#F9FAFB' }}>Add New Table</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} style={{ color: '#9CA3AF' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Table Number *</label>
                <input className="input-field w-full text-sm" type="number" placeholder="e.g. 21"
                  value={form.tableNumber} onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Capacity *</label>
                <input className="input-field w-full text-sm" type="number" placeholder="e.g. 4"
                  value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Location</label>
                <input className="input-field w-full text-sm" placeholder="e.g. Main Hall, Terrace"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <NewOrderModal
          preselectedTableId={newOrderTableId}
          onClose={() => setShowNewOrder(false)}
          onCreated={() => { notify('Order placed and sent to KOT'); load() }}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  )
}
