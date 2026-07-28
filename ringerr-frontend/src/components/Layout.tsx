import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, ChefHat,
  Users, TableProperties, Bell, Search, ChevronLeft,
  ChevronRight, LogOut, Settings, Store, Zap
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tables',    icon: TableProperties, label: 'Tables'    },
  { to: '/menu',      icon: UtensilsCrossed, label: 'Menu'      },
  { to: '/orders',    icon: ClipboardList,   label: 'Orders'    },
  { to: '/kitchen',   icon: ChefHat,         label: 'Kitchen'   },
  { to: '/staff',     icon: Users,           label: 'Staff'     },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState(false)
  
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#09090B' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col glass z-40 transition-all duration-300 ease-in-out flex-shrink-0"
        style={{ width: collapsed ? 68 : 220, borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#FF8A00,#FF6B00)', boxShadow: '0 4px 14px rgba(255,138,0,0.35)' }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm leading-none" style={{ color: '#F9FAFB' }}>Ringerr</div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Restaurant ERP</div>
            </div>
          )}
        </div>

        {/* Restaurant selector */}
        {!collapsed && (
          <div className="mx-3 mb-3 px-3 py-2 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Store size={13} style={{ color: '#9CA3AF' }} />
              <span className="text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>Main Branch</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-0.5">
          <div className={`sidebar-item ${collapsed ? 'justify-center' : ''}`}>
            <Settings size={17} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </div>
          <div className={`sidebar-item ${collapsed ? 'justify-center' : ''}`}
            style={{ color: '#EF4444' }}
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}>
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110"
          style={{ background: '#1A1F2E', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearch(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
              <Search size={14} />
              <span>Search anything...</span>
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)' }}>⌘K</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <Bell size={16} style={{ color: '#9CA3AF' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#FF8A00' }} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer pl-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#FF8A00,#A855F7)', color: '#fff' }}>A</div>
              {!collapsed && <div className="hidden sm:block">
                <div className="text-sm font-medium leading-none" style={{ color: '#F9FAFB' }}>Admin</div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Manager</div>
              </div>}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#09090B' }}>
          {children}
        </main>
      </div>

      {/* Command palette overlay */}
      {search && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSearch(false)}>
          <div className="w-full max-w-xl glass rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Search size={16} style={{ color: '#9CA3AF' }} />
              <input autoFocus className="flex-1 bg-transparent text-sm outline-none" placeholder="Search pages, orders, tables..."
                style={{ color: '#F9FAFB' }} onKeyDown={e => e.key === 'Escape' && setSearch(false)} />
            </div>
            <div className="p-3 space-y-1">
              {nav.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setSearch(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5">
                  <Icon size={15} style={{ color: '#9CA3AF' }} />
                  <span style={{ color: '#F9FAFB' }}>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
