import { useState, useEffect } from 'react'
import {
  Search, Plus,
  ToggleLeft, ToggleRight, Edit3, X, Loader2, Trash2, Save
} from 'lucide-react'
import { menuItemService, categoryService } from '../services/menuService'
import type { MenuItem, Category } from '../types/models'

export default function MenuPage() {
  const [items, setItems]           = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [vegFilter, setVegFilter]   = useState<'all'|'veg'|'nonveg'>('all')
  const [toast, setToast]           = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  // Add / Edit modal
  const [showModal, setShowModal]   = useState(false)
  const [editItem, setEditItem]     = useState<MenuItem | null>(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', price: '', categoryId: '', available: true
  })

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const [itemsData, catsData] = await Promise.all([
        menuItemService.findAll(),
        categoryService.findAll(),
      ])
      setItems(itemsData)
      setCategories(catsData)
    } catch {
      notify('Failed to load menu', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(item =>
    (activeCategory === 'all' || item.category?.id === activeCategory) &&
    (search === '' || item.name.toLowerCase().includes(search.toLowerCase())) 
  )

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', description: '', price: '', categoryId: categories[0]?.id?.toString() || '', available: true })
    setShowModal(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      categoryId: String(item.category?.id || ''),
      available: item.available,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) return notify('Name, price and category are required', 'error')
    try {
      setSaving(true)
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        available: form.available,
      }
      if (editItem) {
        const updated = await menuItemService.update(editItem.id, payload)
        setItems(is => is.map(i => i.id === editItem.id ? updated : i))
        notify('Item updated')
      } else {
        const created = await menuItemService.create(payload)
        setItems(is => [...is, created])
        notify('Item added')
      }
      setShowModal(false)
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Failed to save item', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await menuItemService.update(item.id, {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.category?.id,
        available: !item.available,
      })
      setItems(is => is.map(i => i.id === item.id ? updated : i))
    } catch {
      notify('Failed to update availability', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this menu item?')) return
    try {
      await menuItemService.delete(id)
      setItems(is => is.filter(i => i.id !== id))
      notify('Item deleted')
    } catch {
      notify('Failed to delete item', 'error')
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
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Menu</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{items.length} items across {categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input className="input-field pl-9 text-sm" placeholder="Search menu items..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['all','veg','nonveg'] as const).map(v => (
            <button key={v} onClick={() => setVegFilter(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: vegFilter === v ? (v === 'veg' ? 'rgba(34,197,94,0.15)' : v === 'nonveg' ? 'rgba(239,68,68,0.15)' : 'rgba(255,138,0,0.15)') : 'transparent',
                color: vegFilter === v ? (v === 'veg' ? '#22C55E' : v === 'nonveg' ? '#EF4444' : '#FF8A00') : '#9CA3AF',
              }}>
              {v === 'all' ? 'All' : v === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveCategory('all')}
          className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all"
          style={{
            background: activeCategory === 'all' ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeCategory === 'all' ? '#FF8A00' : '#9CA3AF',
            border: `1px solid ${activeCategory === 'all' ? 'rgba(255,138,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
          }}>
          All <span className="ml-2 text-xs opacity-60">{items.length}</span>
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: activeCategory === cat.id ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat.id ? '#FF8A00' : '#9CA3AF',
              border: `1px solid ${activeCategory === cat.id ? 'rgba(255,138,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}>
            {cat.name}
            <span className="ml-2 text-xs opacity-60">
              {items.filter(i => i.category?.id === cat.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#FF8A00' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card card-hover flex flex-col overflow-hidden"
              style={{ opacity: item.available ? 1 : 0.6 }}>
              {/* Image placeholder */}
              <div className="relative h-36 flex items-center justify-center rounded-t-xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg,rgba(255,138,0,0.08),rgba(168,85,247,0.08))' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  : <span className="text-5xl">🍽️</span>
                }
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {item.available
                    ? <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Available</span>
                    : <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Unavailable</span>
                  }
                </div>
                <button onClick={() => openEdit(item)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <Edit3 size={12} style={{ color: '#F9FAFB' }} />
                </button>
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: '#F9FAFB' }}>{item.name}</h3>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: '#FF8A00' }}>₹{item.price}</span>
                </div>
                {item.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9CA3AF' }}>{item.description}</p>
                )}
                <div className="text-xs mt-2" style={{ color: '#6B7280' }}>
                  {item.category?.name}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-xs flex items-center gap-1 transition-all hover:text-red-400"
                    style={{ color: '#6B7280' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                  <button onClick={() => toggleAvailability(item)} className="transition-all hover:scale-110">
                    {item.available
                      ? <ToggleRight size={22} style={{ color: '#22C55E' }} />
                      : <ToggleLeft size={22} style={{ color: '#6B7280' }} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No items found</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-6 w-full max-w-md shadow-2xl" style={{ border: '1px solid rgba(255,138,0,0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#F9FAFB' }}>
                {editItem ? 'Edit Item' : 'Add Menu Item'}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: '#9CA3AF' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Name *</label>
                <input className="input-field w-full text-sm" placeholder="e.g. Butter Chicken"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Description</label>
                <textarea className="input-field w-full text-sm resize-none" rows={2} placeholder="Short description..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Price (₹) *</label>
                  <input className="input-field w-full text-sm" type="number" placeholder="0.00"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Category *</label>
                  <select className="input-field w-full text-sm"
                    value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, available: !f.available }))} className="transition-all">
                  {form.available
                    ? <ToggleRight size={24} style={{ color: '#22C55E' }} />
                    : <ToggleLeft size={24} style={{ color: '#6B7280' }} />}
                </button>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>
                  {form.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
