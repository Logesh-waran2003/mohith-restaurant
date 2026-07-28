import { useState, useEffect } from 'react'
import {
  Plus, Search, Phone, Mail,
  CheckCircle2, Clock, XCircle, UserCheck, X, Loader2, Trash2, Save
} from 'lucide-react'
import { staffService } from '../services/staffService'
import api from '../api/axios'
import type { Staff } from '../types/models'

const statusCfg = {
  true:  { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Active',   icon: CheckCircle2 },
  false: { color: '#6B7280', bg: 'rgba(107,114,128,0.12)',label: 'Inactive', icon: XCircle      },
}

const positions = ['Manager','Chef','Waiter','Cashier','Helper','Bartender']

export default function StaffPage() {
  const [staff, setStaff]     = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [posFilter, setPosFilter] = useState<string>('All')
  const [toast, setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    position: 'Waiter', phone: '', hireDate: ''
  })

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    try {
      setLoading(true)
      setStaff(await staffService.findAll())
    } catch {
      notify('Failed to load staff', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = staff.filter(s =>
    (posFilter === 'All' || s.position === posFilter) &&
    (search === '' ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!form.fullName || !form.email || !form.password || !form.position)
      return notify('Name, email, password and position are required', 'error')
    if (form.password.length < 8)
      return notify('Password must be at least 8 characters', 'error')
    try {
      setSaving(true)
      // Step 1: register the user
      const regRes = await api.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      })
      const userId = regRes.data.userId || regRes.data.id
      if (!userId) throw new Error('Registration did not return a user ID')
      // Step 2: create staff record linked to that user
      const created = await staffService.create({
        userId: Number(userId),
        position: form.position,
        phone: form.phone || undefined,
        hireDate: form.hireDate || undefined,
      })
      setStaff(s => [...s, created])
      notify(`${form.fullName} added as ${form.position}`)
      setShowModal(false)
      setForm({ fullName: '', email: '', password: '', position: 'Waiter', phone: '', hireDate: '' })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to add staff'
      notify(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this staff member?')) return
    try {
      const updated = await staffService.deactivate(id)
      setStaff(s => s.map(m => m.id === id ? updated : m))
      notify('Staff deactivated')
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Failed to deactivate', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this staff member permanently?')) return
    try {
      await staffService.delete(id)
      setStaff(s => s.filter(m => m.id !== id))
      notify('Staff deleted')
    } catch {
      notify('Failed to delete', 'error')
    }
  }

  const avatarColors = ['#FF8A00','#A855F7','#06B6D4','#22C55E','#EF4444','#F59E0B']
  const initials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444' }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Staff</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {staff.filter(s => s.active).length} active · {staff.length} total
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Add Staff
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input className="input-field pl-9 text-sm" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['All', ...positions]).map(p => (
            <button key={p} onClick={() => setPosFilter(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: posFilter === p ? 'rgba(255,138,0,0.15)' : 'transparent',
                color: posFilter === p ? '#FF8A00' : '#9CA3AF',
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {positions.slice(0,4).map(pos => (
          <div key={pos} className="card p-4">
            <div className="text-2xl font-bold" style={{ color: '#FF8A00' }}>
              {staff.filter(s => s.position === pos).length}
            </div>
            <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{pos}s</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, idx) => {
            const cfg = statusCfg[String(member.active) as 'true'|'false']
            const Icon = cfg.icon
            const color = avatarColors[idx % avatarColors.length]
            return (
              <div key={member.id} className="card card-hover p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${color}20`, color, border: `1.5px solid ${color}40` }}>
                    {initials(member.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#F9FAFB' }}>{member.fullName}</div>
                    <div className="text-xs mt-0.5" style={{ color }}>{member.position}</div>
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </div>
                <div className="space-y-2">
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Mail size={11} /><span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Phone size={11} /><span>{member.phone}</span>
                    </div>
                  )}
                  {member.hireDate && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Clock size={11} /><span>Since {member.hireDate}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {member.active && (
                    <button onClick={() => handleDeactivate(member.id)}
                      className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1">
                      <UserCheck size={11} /> Deactivate
                    </button>
                  )}
                  <button onClick={() => handleDelete(member.id)}
                    className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1"
                    style={{ color: '#EF4444' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No staff found</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-6 w-full max-w-sm shadow-2xl" style={{ border: '1px solid rgba(255,138,0,0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#F9FAFB' }}>Add Staff Member</h3>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: '#9CA3AF' }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Full Name *</label>
                <input className="input-field w-full text-sm" placeholder="e.g. Ravi Kumar"
                  value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Email *</label>
                <input className="input-field w-full text-sm" type="email" placeholder="e.g. ravi@ringerr.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Password *</label>
                <input className="input-field w-full text-sm" type="password" placeholder="Min 8 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Position *</label>
                <select className="input-field w-full text-sm"
                  value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Phone</label>
                <input className="input-field w-full text-sm" placeholder="e.g. 9876543210"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Hire Date</label>
                <input className="input-field w-full text-sm" type="date"
                  value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
