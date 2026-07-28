import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Zap, Eye, EyeOff, ArrowRight, Loader2, User, Mail, Lock } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await axios.post('/api/auth/register', form)
      nav('/login')
    } catch {
      setError('Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#09090B' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 600px 400px at 50% 25%, rgba(255,138,0,0.05) 0%, transparent 70%)'
      }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#FF8A00,#FF6B00)', boxShadow: '0 8px 32px rgba(255,138,0,0.35)' }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Join Ringerr ERP</p>
        </div>

        <div className="card p-7">
          <form onSubmit={submit} className="space-y-4">
            {[
              { key: 'name',     label: 'Full Name', type: 'text',     icon: User,  placeholder: 'John Doe'           },
              { key: 'email',    label: 'Email',     type: 'email',    icon: Mail,  placeholder: 'you@restaurant.com' },
            ].map(({ key, label, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
                  <input type={type} required className="input-field pl-9" placeholder={placeholder}
                    value={(form as any)[key]} onChange={set(key)} />
                </div>
              </div>
            ))}

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9CA3AF' }}>Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
                <input type={showPw ? 'text' : 'password'} required className="input-field pl-9 pr-10"
                  placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: '#6B7280' }}>
            Already have an account?{' '}
            <button onClick={() => nav('/login')} className="transition-colors hover:underline" style={{ color: '#FF8A00' }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
