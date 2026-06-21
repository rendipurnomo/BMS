import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (msg: string, dur?: number) => showToast('success', msg, dur),
    error: (msg: string, dur?: number) => showToast('error', msg, dur),
    info: (msg: string, dur?: number) => showToast('info', msg, dur),
    warning: (msg: string, dur?: number) => showToast('warning', msg, dur),
  }), [showToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200); // Wait for fade-out/slide-out animation
  };

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={20} color="#10b981" />,
          borderColor: 'rgba(16, 185, 129, 0.4)',
          glowColor: 'rgba(16, 185, 129, 0.15)',
          barColor: '#10b981',
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} color="#ef4444" />,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          glowColor: 'rgba(239, 68, 68, 0.15)',
          barColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} color="#fb923c" />,
          borderColor: 'rgba(249, 115, 22, 0.4)',
          glowColor: 'rgba(249, 115, 22, 0.15)',
          barColor: '#fb923c',
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} color="#3b82f6" />,
          borderColor: 'rgba(59, 130, 246, 0.4)',
          glowColor: 'rgba(59, 130, 246, 0.15)',
          barColor: '#3b82f6',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(20, 29, 47, 0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.borderColor}`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.35), 0 0 15px ${theme.glowColor}`,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        animation: isClosing ? 'toastSlideOut 0.2s ease forwards' : 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{theme.icon}</div>
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4, paddingRight: '1rem' }}>
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          marginLeft: 'auto',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={16} />
      </button>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: theme.barColor,
          width: '100%',
          transformOrigin: 'left',
          animation: `toastProgress ${toast.duration || 4000}ms linear forwards`,
        }}
      />
    </div>
  );
};
