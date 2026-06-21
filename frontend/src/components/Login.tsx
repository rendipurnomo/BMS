import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, UserSquare, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrp || !password) {
      setError('NRP and Password are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(nrp, password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid NRP or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleNrp: string, rolePass: string) => {
    setLoading(true);
    setError('');
    try {
      await login(roleNrp, rolePass);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { title: 'Mekanik Udin', nrp: 'MK1122', pass: 'secretpassword', role: 'MEKANIK', desc: 'Create backlog, start installation, complete' },
    { title: 'GL Budi', nrp: 'GL3344', pass: 'secretpassword', role: 'GL', desc: 'Approve or reject backlog reports' },
    { title: 'Planner Cici', nrp: 'PL5566', pass: 'secretpassword', role: 'PLANNER', desc: 'Create Work Order, update ordering supply' },
    { title: 'Admin', nrp: 'ADMIN01', pass: 'admin123', role: 'ADMIN', desc: 'Manage User Accounts and Unit Master' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at center, #0f1c30 0%, #060a13 100%)',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25)',
            filter: 'drop-shadow(0 4px 8px rgba(250, 204, 21, 0.2))'
          }}>
            <svg viewBox="0 0 64 64" width="60" height="60" className="komatsu-logo" style={{ overflow: 'visible' }}>
              {/* Dump Bed (Yellow/Komatsu Yellow) */}
              <path 
                d="M 12 16 L 42 16 L 36 38 L 12 38 Z" 
                fill="#facc15" 
                stroke="#eab308" 
                strokeWidth="2.5" 
                style={{ transformOrigin: '36px 38px', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                className="truck-bed"
              />
              {/* Cab (Yellow) */}
              <path 
                d="M 40 24 L 50 24 L 52 38 L 36 38 Z" 
                fill="#eab308" 
                stroke="#ca8a04" 
                strokeWidth="2.5" 
              />
              {/* Cab window (Dark Slate) */}
              <path 
                d="M 44 26 L 49 26 L 50 31 L 44 31 Z" 
                fill="#0f172a" 
              />
              {/* Chassis (Gray) */}
              <rect x="10" y="38" width="44" height="6" rx="2" fill="#475569" />
              {/* Mudguards */}
              <path d="M 46 38 A 6 6 0 0 1 54 44" stroke="#334155" strokeWidth="2.5" fill="none" />
              <path d="M 14 38 A 6 6 0 0 1 22 44" stroke="#334155" strokeWidth="2.5" fill="none" />
              {/* Rear wheel */}
              <g className="truck-wheel" style={{ transformOrigin: '18px 44px', transition: 'transform 0.1s linear' }}>
                <circle cx="18" cy="44" r="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="18" cy="44" r="3" fill="#64748b" />
                <line x1="18" y1="36" x2="18" y2="39" stroke="#64748b" strokeWidth="1.5" />
                <line x1="18" y1="49" x2="18" y2="52" stroke="#64748b" strokeWidth="1.5" />
                <line x1="10" y1="44" x2="13" y2="44" stroke="#64748b" strokeWidth="1.5" />
                <line x1="23" y1="44" x2="26" y2="44" stroke="#64748b" strokeWidth="1.5" />
              </g>
              {/* Front wheel */}
              <g className="truck-wheel" style={{ transformOrigin: '46px 44px', transition: 'transform 0.1s linear' }}>
                <circle cx="46" cy="44" r="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="46" cy="44" r="3" fill="#64748b" />
                <line x1="46" y1="36" x2="46" y2="39" stroke="#64748b" strokeWidth="1.5" />
                <line x1="46" y1="49" x2="46" y2="52" stroke="#64748b" strokeWidth="1.5" />
                <line x1="38" y1="44" x2="41" y2="44" stroke="#64748b" strokeWidth="1.5" />
                <line x1="51" y1="44" x2="54" y2="44" stroke="#64748b" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>BMS Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Backlog Management System
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nrp">NRP Number</label>
            <div style={{ position: 'relative' }}>
              <input
                id="nrp"
                type="text"
                className="form-input"
                placeholder="e.g. MK1122"
                value={nrp}
                onChange={(e) => setNrp(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '2.5rem' }}
              />
              <UserSquare size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <KeyRound size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', display: 'flex', gap: '0.5rem', fontSize: '1rem' }}
          >
            {loading ? 'Logging in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Preset accounts divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '2rem 0 1.5rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem' }}>QUICK TESTING ACCESS</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* Preset Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {presets.map((preset) => (
            <div
              key={preset.nrp}
              onClick={() => !loading && handleQuickLogin(preset.nrp, preset.pass)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,115,0,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,115,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {preset.title}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: preset.role === 'ADMIN' ? 'rgba(16,185,129,0.15)' : 'rgba(255,115,0,0.15)',
                  color: preset.role === 'ADMIN' ? 'var(--accent-green)' : 'var(--accent-orange)',
                  fontWeight: 700,
                }}>
                  {preset.role}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.2' }}>
                {preset.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
