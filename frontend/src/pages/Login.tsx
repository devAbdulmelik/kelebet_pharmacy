import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import brandLogo from '../components/assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    console.log("Trying to login with:", username, password); // For debugging
    await login(username, password);
    navigate('/dashboard');
  } catch (err: any) {
    console.error("Login Error:", err);   // ← This will show in console
    const msg = err?.response?.data?.detail 
             || err?.response?.data?.non_field_errors?.[0]
             || err?.message 
             || 'Invalid credentials. Please try again.';
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'linear-gradient(135deg, #0f4a26 0%, #1a6b3a 40%, #2d9e58 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="w-100" style={{ maxWidth: 420, position: 'relative', zIndex: 1, animation: 'slideInUp 0.5s ease' }}>
        <div className="text-center mb-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ 
              width: 108, 
              height: 108, 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              animation: 'slideInDown 0.6s ease',
            }}
          >
            <img
              src={brandLogo}
              alt="Kelebet Pharmacy logo"
              style={{ width: 82, height: 82, objectFit: 'contain' }}
            />
          </div>
          <h1 className="fw-bold text-white mb-2" style={{ fontSize: 32, letterSpacing: '-1px', fontWeight: 800 }}>
            Kelebet Pharmacy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 500 }}>
            Pharmacy Management System
          </p>
        </div>

        <div
          className="card border-0 shadow-xl"
          style={{ 
            borderRadius: 16, 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideInUp 0.6s ease 0.1s both',
          }}
        >
          <div className="card-body p-5">
            <h5 className="fw-bold mb-2" style={{ color: '#1a6b3a', fontSize: 20 }}>
              Welcome back
            </h5>
            <p className="text-muted mb-4" style={{ fontSize: 14, marginBottom: 24 }}>
              Sign in to manage stock, reporting, and daily pharmacy operations
            </p>

            {error && (
              <div
                className="d-flex align-items-center gap-2 mb-4 p-3"
                style={{
                  background: '#fff0ed',
                  border: '1px solid rgba(204, 51, 0, 0.2)',
                  borderRadius: 12,
                  color: '#cc3300',
                  fontSize: 13,
                  fontWeight: 500,
                  animation: 'slideInDown 0.3s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label" style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700 }}>
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="form-label" style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700 }}>
                  Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control pe-5"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      borderRadius: 10,
                      padding: '11px 14px',
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm position-absolute top-50 end-0 translate-middle-y border-0 pe-3"
                    onClick={() => setShowPass(!showPass)}
                    style={{ 
                      background: 'none', 
                      color: '#999',
                      transition: 'color 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1a6b3a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 fw-bold"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #1a6b3a 0%, #2d9e58 100%)',
                  color: 'white',
                  borderRadius: 10,
                  padding: '12px',
                  fontSize: 15,
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(26,107,58,0.3)',
                  transition: 'all 0.2s ease',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,107,58,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(26,107,58,0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-5" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }}>
          &copy; {new Date().getFullYear()} Kelebet Pharmacy Management System
        </p>
      </div>
    </div>
  );
}
