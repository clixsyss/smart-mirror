import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import VirtualKeyboard from './VirtualKeyboard'
// import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (error) {
      console.error('Login error:', error)
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address')
          break
        case 'auth/wrong-password':
          setError('Incorrect password')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later')
          break
        default:
          setError('Login failed. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputFocus = (inputType) => {
    setActiveInput(inputType)
    setShowKeyboard(true)
  }

  const handleKeyboardInput = (value) => {
    if (activeInput === 'email') {
      setEmail(value)
    } else if (activeInput === 'password') {
      setPassword(value)
    }
  }

  const handleKeyboardClose = () => {
    setShowKeyboard(false)
    setActiveInput(null)
  }

  const getCurrentInputRef = () => {
    return activeInput === 'email' ? emailRef : passwordRef
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#ffffff', fontWeight: '300' }}>Clixsys Smart Mirror</h1>
          <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>Smart Home Control Center</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
            <input
              type="email"
              id="email"
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                handleInputFocus('email');
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              required
              disabled={loading}
              placeholder="Enter your email"
              style={{
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.3s ease',
                direction: 'ltr',
                textAlign: 'left'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <input
              type="password"
              id="password"
              ref={passwordRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                handleInputFocus('password');
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              required
              disabled={loading}
              placeholder="Enter your password"
              style={{
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.3s ease',
                direction: 'ltr',
                textAlign: 'left'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Access your smart home devices and mirror functions</p>
        </div>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        isVisible={showKeyboard}
        onClose={handleKeyboardClose}
        onInput={handleKeyboardInput}
        inputRef={getCurrentInputRef()}
        currentValue={activeInput === 'email' ? email : password}
      />
    </div>
  )
}

export default Login