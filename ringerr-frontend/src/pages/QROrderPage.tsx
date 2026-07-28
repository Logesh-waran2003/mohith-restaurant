import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Minus, Plus, ShoppingCart, CheckCircle2, Loader2, Zap, ChevronRight, Globe } from 'lucide-react'

interface TableInfo { id: number; tableNumber: number; capacity: number; status: string }
interface MenuItem  {
  id: number; name: string; description: string; price: number
  category: { id: number; name: string }; imageUrl: string; available: boolean; veg: boolean
}
interface CartItem  { menuItem: MenuItem; quantity: number; notes: string }

// Tamil / English translations
const i18n = {
  en: {
    loading: 'Loading menu...',
    invalidQR: 'Invalid QR code or table not found.',
    orderPlaced: 'Order Placed!',
    orderPlacedSub: 'Your order is with the kitchen. Sit back and relax.',
    orderMore: 'Order More',
    table: 'Table',
    all: 'All',
    placeOrder: 'Place Order',
    placing: 'Placing...',
    item: 'item',
    items: 'items',
    failedOrder: 'Failed to place order. Please try again.',
    payNow: 'Pay & Order',
    paying: 'Processing...',
    veg: 'Veg',
    nonveg: 'Non-Veg',
  },
  ta: {
    loading: 'மெனு ஏற்றுகிறது...',
    invalidQR: 'தவறான QR குறியீடு அல்லது மேசை கிடைக்கவில்லை.',
    orderPlaced: 'ஆர்டர் வந்தது!',
    orderPlacedSub: 'உங்கள் ஆர்டர் சமையலறைக்கு சென்றது. நிம்மதியாக இருங்கள்.',
    orderMore: 'மேலும் ஆர்டர் செய்',
    table: 'மேசை',
    all: 'அனைத்தும்',
    placeOrder: 'ஆர்டர் செய்',
    placing: 'அனுப்புகிறோம்...',
    item: 'பொருள்',
    items: 'பொருட்கள்',
    failedOrder: 'ஆர்டர் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    payNow: 'பணம் செலுத்து & ஆர்டர்',
    paying: 'செயலாக்குகிறோம்...',
    veg: 'சைவம்',
    nonveg: 'அசைவம்',
  }
}

// Veg/Non-veg indicator dot (FSSAI style)
function VegDot({ veg }: { veg: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{
        width: 16, height: 16,
        border: `2px solid ${veg ? '#22C55E' : '#EF4444'}`,
        borderRadius: 2,
      }}
    >
      <span
        style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: veg ? '#22C55E' : '#EF4444',
          display: 'inline-block',
        }}
      />
    </span>
  )
}

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function QROrderPage() {
  const { token } = useParams<{ token: string }>()
  const [lang, setLang] = useState<'en' | 'ta'>('en')
  const t = i18n[lang]

  const [table, setTable]             = useState<TableInfo | null>(null)
  const [menuItems, setMenuItems]     = useState<MenuItem[]>([])
  const [cart, setCart]               = useState<CartItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placing, setPlacing]         = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [vegFilter, setVegFilter]     = useState<'all' | 'veg' | 'nonveg'>('all')

  useEffect(() => {
    Promise.all([
      axios.get(`/api/public/tables/${token}`),
      axios.get('/api/public/menu'),
    ]).then(([t, m]) => {
      setTable(t.data); setMenuItems(m.data); setLoading(false)
    }).catch(() => { setError(i18n.en.invalidQR); setLoading(false) })
  }, [token])

  const categories = [t.all, ...Array.from(new Set(menuItems.map(i => i.category.name)))]
  const filtered   = menuItems
    .filter(i => i.available)
    .filter(i => activeCategory === t.all || activeCategory === 'All' || i.category.name === activeCategory)
    .filter(i => vegFilter === 'all' || (vegFilter === 'veg' ? i.veg : !i.veg))

  const total    = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0)

  const addToCart = (item: MenuItem) =>
    setCart(p => {
      const ex = p.find(c => c.menuItem.id === item.id)
      return ex ? p.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
                : [...p, { menuItem: item, quantity: 1, notes: '' }]
    })

  const updateQty = (id: number, qty: number) =>
    qty <= 0 ? setCart(p => p.filter(c => c.menuItem.id !== id))
             : setCart(p => p.map(c => c.menuItem.id === id ? { ...c, quantity: qty } : c))

  const submitOrder = async () => {
    if (!table || !cart.length) return
    await axios.post('/api/public/orders', {
      tableId: table.id,
      items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })),
    })
    setOrderPlaced(true)
    setCart([])
  }

  const handlePayAndOrder = async () => {
    if (!table || !cart.length) return
    setPlacing(true)
    try {
      // Step 1 — create server-side Razorpay order
      let razorpayOrderData: any = null
      try {
        const res = await axios.post('/api/razorpay/create-order', {
          amount: total,
          receipt: `tbl_${table.id}_${Date.now()}`,
        })
        razorpayOrderData = res.data
      } catch {
        // Razorpay not configured — fall back to direct order (cash/demo mode)
        await submitOrder()
        setPlacing(false)
        return
      }

      // Placeholder key means Razorpay not configured
      if (!razorpayOrderData?.keyId || razorpayOrderData.keyId === 'rzp_test_placeholder') {
        await submitOrder()
        setPlacing(false)
        return
      }

      // Step 2 — load SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        await submitOrder()
        setPlacing(false)
        return
      }

      // Step 3 — open checkout
      const options = {
        key: razorpayOrderData.keyId,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency,
        order_id: razorpayOrderData.orderId,
        name: 'Ringerr',
        description: `Table ${table.tableNumber} — ${totalQty} ${totalQty > 1 ? t.items : t.item}`,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            // Step 4 — verify signature server-side
            const verifyRes = await axios.post('/api/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (verifyRes.data?.verified) {
              // Step 5 — place the order
              await submitOrder()
            } else {
              setError('Payment verification failed. Please contact staff.')
            }
          } catch {
            setError(t.failedOrder)
          }
          setPlacing(false)
        },
        prefill: { contact: '' },
        theme: { color: '#FF8A00' },
        modal: {
          ondismiss: () => { setPlacing(false) }
        }
      }
      new (window as any).Razorpay(options).open()
    } catch {
      try { await submitOrder() } catch { setError(t.failedOrder) }
      setPlacing(false)
    }
  }

  // States
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090B' }}>
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#FF8A00' }} />
        <p className="text-sm" style={{ color: '#9CA3AF' }}>{t.loading}</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#09090B' }}>
      <div className="card p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
      </div>
    </div>
  )

  if (orderPlaced) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#09090B' }}>
      <div className="card p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle2 size={32} style={{ color: '#22C55E' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{t.orderPlaced}</h2>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{t.orderPlacedSub}</p>
        <button onClick={() => setOrderPlaced(false)} className="btn-primary w-full py-3">{t.orderMore}</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#09090B' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4"
        style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#FF8A00,#FF6B00)' }}>
              <Zap size={15} color="#fff" fill="#fff" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Ringerr</span>
              <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{t.table} {table?.tableNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => {
                const next = lang === 'en' ? 'ta' : 'en'
                setLang(next)
                setActiveCategory(next === 'en' ? 'All' : i18n.ta.all)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>
              <Globe size={12} />
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            {totalQty > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,138,0,0.15)', border: '1px solid rgba(255,138,0,0.25)' }}>
                <ShoppingCart size={14} style={{ color: '#FF8A00' }} />
                <span className="text-sm font-bold" style={{ color: '#FF8A00' }}>{totalQty}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-40">
        {/* Category + veg filter row */}
        <div className="flex items-center gap-3 pt-4 pb-2">
          {/* Veg / Non-Veg filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['all', 'veg', 'nonveg'] as const).map(v => (
              <button key={v} onClick={() => setVegFilter(v)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: vegFilter === v
                    ? (v === 'veg' ? 'rgba(34,197,94,0.15)' : v === 'nonveg' ? 'rgba(239,68,68,0.15)' : 'rgba(255,138,0,0.12)')
                    : 'transparent',
                  color: vegFilter === v
                    ? (v === 'veg' ? '#22C55E' : v === 'nonveg' ? '#EF4444' : '#FF8A00')
                    : '#9CA3AF',
                }}>
                {v === 'all' ? 'All' : v === 'veg' ? `🟢 ${t.veg}` : `🔴 ${t.nonveg}`}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeCategory === cat ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === cat ? '#FF8A00' : '#9CA3AF',
                border: `1px solid ${activeCategory === cat ? 'rgba(255,138,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="space-y-3">
          {filtered.map(item => {
            const ci = cart.find(c => c.menuItem.id === item.id)
            return (
              <div key={item.id} className="card p-4 flex items-center gap-4 card-hover">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <VegDot veg={item.veg} />
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: '#F9FAFB' }}>{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="text-xs mt-0.5 line-clamp-1 pl-6" style={{ color: '#9CA3AF' }}>{item.description}</p>
                  )}
                  <p className="text-sm font-bold mt-1.5 pl-6" style={{ color: '#FF8A00' }}>₹{item.price}</p>
                </div>
                {/* Right: qty controls */}
                {ci ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, ci.quantity - 1)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(255,138,0,0.15)', border: '1px solid rgba(255,138,0,0.25)', color: '#FF8A00' }}>
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center font-bold text-sm" style={{ color: '#F9FAFB' }}>{ci.quantity}</span>
                    <button onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(255,138,0,0.15)', border: '1px solid rgba(255,138,0,0.25)', color: '#FF8A00' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#FF8A00,#FF6B00)', boxShadow: '0 2px 8px rgba(255,138,0,0.3)' }}>
                    <Plus size={15} color="#fff" />
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
          style={{ background: 'linear-gradient(to top, #09090B 60%, transparent)', zIndex: 30 }}>
          <div className="max-w-2xl mx-auto">
            <button onClick={handlePayAndOrder} disabled={placing}
              className="btn-primary w-full py-4 flex items-center justify-between px-5 text-base"
              style={{ borderRadius: 16 }}>
              <span className="flex items-center gap-2">
                {placing ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                {placing ? t.paying : `${totalQty} ${totalQty > 1 ? t.items : t.item}`}
              </span>
              <span className="flex items-center gap-1.5">
                ₹{total.toFixed(0)}
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
