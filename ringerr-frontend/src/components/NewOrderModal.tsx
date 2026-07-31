import { useState, useEffect } from 'react'
import { X, Search, Plus, Minus, ShoppingCart, Loader2, ChefHat } from 'lucide-react'
import { tableService } from '../services/tableService'
import { menuItemService, categoryService } from '../services/menuService'
import { orderService } from '../services/orderService'
import type { RestaurantTable, MenuItem, Category } from '../types/models'

interface CartEntry { item: MenuItem; qty: number; notes: string }

interface Props {
  onClose: () => void
  onCreated: () => void
  preselectedTableId?: number
}

export default function NewOrderModal({ onClose, onCreated, preselectedTableId }: Props) {
  const [tables, setTables]         = useState<RestaurantTable[]>([])
  const [items, setItems]           = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [placing, setPlacing]       = useState(false)
  const [error, setError]           = useState('')

  const [tableId, setTableId]         = useState<number | ''>(preselectedTableId ?? '')
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [search, setSearch]           = useState('')
  const [cart, setCart]               = useState<CartEntry[]>([])
  const [notes, setNotes]             = useState('')
  const [platform, setPlatform]       = useState<'dine-in' | 'takeaway' | 'swiggy' | 'zomato'>('dine-in')

  useEffect(() => {
    Promise.all([
      tableService.findAll(),
      menuItemService.findAll(),
      categoryService.findAll(),
    ]).then(([t, m, c]) => {
      setTables(t)
      setItems(m.filter((i: MenuItem) => i.available))
      setCategories(c)
      if (preselectedTableId) setTableId(preselectedTableId)
    }).finally(() => setLoading(false))
  }, [preselectedTableId])

  const filtered = items.filter(i =>
    (activeCategory === 'all' || i.category?.id === activeCategory) &&
    (search === '' || i.name.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (item: MenuItem) => {
    setCart(c => {
      const ex = c.find(e => e.item.id === item.id)
      return ex
        ? c.map(e => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e)
        : [...c, { item, qty: 1, notes: '' }]
    })
  }

  const changeQty = (id: number, delta: number) => {
    setCart(c => {
      const updated = c.map(e => e.item.id === id ? { ...e, qty: e.qty + delta } : e)
      return updated.filter(e => e.qty > 0)
    })
  }

  const total = cart.reduce((s, e) => s + e.item.price * e.qty, 0)
  const totalQty = cart.reduce((s, e) => s + e.qty, 0)

  const handlePlace = async () => {
    if (!tableId) return setError('Select a table')
    if (cart.length === 0) return setError('Add at least one item')
    setError('')
    try {
      setPlacing(true)
      const platformNote = platform !== 'dine-in' ? platform : ''
      const fullNotes = [platformNote, notes].filter(Boolean).join(' | ')
      await orderService.create({
        tableId: Number(tableId),
        notes: fullNotes || undefined,
        orderType: platform === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN',
        items: cart.map(e => ({ menuItemId: e.item.id, quantity: e.qty, notes: e.notes || undefined })),
      })
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  const platformColors: Record<string, string> = {
    'dine-in': '#06B6D4', takeaway: '#A855F7', swiggy: '#FF6900', zomato: '#EF4444'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="flex w-full max-w-4xl h-[88vh] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#111827', border: '1px solid rgba(255,138,0,0.25)' }}>

        {/* LEFT — Menu browser */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <ChefHat size={18} style={{ color: '#FF8A00' }} />
              <h2 className="font-bold text-base" style={{ color: '#F9FAFB' }}>New Order</h2>
            </div>
            <button onClick={onClose}><X size={18} style={{ color: '#9CA3AF' }} /></button>
          </div>

          {/* Table + Platform selectors */}
          <div className="px-5 py-3 flex gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Table *</label>
              <select className="input-field w-full text-sm" value={tableId}
                onChange={e => setTableId(Number(e.target.value))}>
                <option value="">Select table...</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    T-{t.tableNumber} ({t.capacity} seats) — {t.status}{t.location ? ` • ${t.location}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Platform</label>
              <div className="flex gap-1">
                {(['dine-in','takeaway','swiggy','zomato'] as const).map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                    style={{
                      background: platform === p ? `${platformColors[p]}20` : 'rgba(255,255,255,0.04)',
                      color: platform === p ? platformColors[p] : '#6B7280',
                      border: `1px solid ${platform === p ? platformColors[p] + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {p === 'dine-in' ? 'Dine-In' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <input className="input-field w-full pl-9 text-sm" placeholder="Search menu items..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 px-5 py-2 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={() => setActiveCategory('all')}
              className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: activeCategory === 'all' ? 'rgba(255,138,0,0.15)' : 'transparent',
                color: activeCategory === 'all' ? '#FF8A00' : '#9CA3AF',
              }}>
              All
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: activeCategory === c.id ? 'rgba(255,138,0,0.15)' : 'transparent',
                  color: activeCategory === c.id ? '#FF8A00' : '#9CA3AF',
                }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Items grid */}
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 size={28} className="animate-spin" style={{ color: '#FF8A00' }} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-3 content-start">
              {filtered.map(item => {
                const inCart = cart.find(e => e.item.id === item.id)
                return (
                  <div key={item.id}
                    className="card p-3 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] transition-all"
                    onClick={() => addToCart(item)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{item.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.category?.name}</div>
                      <div className="text-sm font-bold mt-1" style={{ color: '#FF8A00' }}>₹{item.price}</div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => changeQty(item.id, -1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                          <Minus size={10} />
                        </button>
                        <span className="w-5 text-center text-sm font-bold" style={{ color: '#F9FAFB' }}>
                          {inCart.qty}
                        </span>
                        <button onClick={() => changeQty(item.id, 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                          <Plus size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,138,0,0.15)', color: '#FF8A00' }}>
                        <Plus size={14} />
                      </div>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center py-10" style={{ color: '#4B5563' }}>No items found</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Cart */}
        <div className="w-72 flex flex-col flex-shrink-0"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0D1117' }}>
          <div className="px-4 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <ShoppingCart size={15} style={{ color: '#FF8A00' }} />
            <span className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>Order</span>
            {totalQty > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(255,138,0,0.2)', color: '#FF8A00' }}>
                {totalQty}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={32} style={{ color: '#374151', margin: '0 auto 8px' }} />
                <p className="text-xs" style={{ color: '#4B5563' }}>Add items from the menu</p>
              </div>
            ) : (
              cart.map(entry => (
                <div key={entry.item.id} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium flex-1 leading-snug" style={{ color: '#F9FAFB' }}>
                      {entry.item.name}
                    </span>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: '#FF8A00' }}>
                      ₹{(entry.item.price * entry.qty).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(entry.item.id, -1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                        <Minus size={9} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold" style={{ color: '#F9FAFB' }}>
                        {entry.qty}
                      </span>
                      <button onClick={() => changeQty(entry.item.id, 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                        <Plus size={9} />
                      </button>
                    </div>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      ₹{entry.item.price} each
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div className="px-4 pb-3">
            <textarea
              className="input-field w-full text-xs resize-none"
              rows={2}
              placeholder="Order notes (optional)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Total + Place */}
          <div className="px-4 pb-5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Total</span>
              <span className="text-lg font-bold" style={{ color: '#FF8A00' }}>₹{total.toFixed(2)}</span>
            </div>
            {error && (
              <div className="text-xs mb-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <button
              onClick={handlePlace}
              disabled={placing || cart.length === 0 || !tableId}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              style={{ opacity: (placing || cart.length === 0 || !tableId) ? 0.5 : 1 }}>
              {placing ? <Loader2 size={14} className="animate-spin" /> : <ChefHat size={14} />}
              {placing ? 'Placing...' : 'Place Order → KOT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
