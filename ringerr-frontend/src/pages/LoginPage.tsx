import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Zap, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.token ?? data.accessToken ?? 'ok')
      nav('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#09090B' }}>

      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,138,0,0.06) 0%, transparent 70%)',
        }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#FF8A00,#FF6B00)', boxShadow: '0 8px 32px rgba(255,138,0,0.35)' }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Sign in to Ringerr ERP</p>
        </div>

        {/* Card */}
        <div className="card p-7">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>Email</label>
              <input
                type="email" required autoFocus
                className="input-field"
                placeholder="admin@ringerr.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-60">
                  {showPw ? <EyeOff size={15} style={{ color: '#9CA3AF' }} /> : <Eye size={15} style={{ color: '#9CA3AF' }} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#6B7280' }}>
          Don't have an account?{' '}
          <button onClick={() => nav('/register')} className="transition-colors hover:underline" style={{ color: '#FF8A00' }}>
            Create one
          </button>
        </p>
        <p className="text-center text-xs mt-2" style={{ color: '#374151' }}>
          Ringerr Restaurant ERP &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
