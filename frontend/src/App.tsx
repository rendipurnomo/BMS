import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { DashboardLayout } from './components/DashboardLayout';
import { MechanicView } from './components/MechanicView';
import { GlView } from './components/GlView';
import { PlannerView } from './components/PlannerView';
import { AdminView } from './components/AdminView';
import { HistoryView } from './components/HistoryView';
import { AchievementView } from './components/AchievementView';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('');

  // Auto-set the active tab based on user's role on login
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'MEKANIK':
          setActiveTab('backlogs');
          break;
        case 'GL':
          setActiveTab('backlog_approvals');
          break;
        case 'PLANNER':
          setActiveTab('work_orders');
          break;
        case 'ADMIN':
          setActiveTab('admin_users');
          break;
        default:
          setActiveTab('');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0f1d',
        color: '#fff',
        fontSize: '1.25rem',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(255,115,0,0.1)',
            borderTop: '4px solid #ff7300',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          Loading BMS session...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => {}} />;
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'backlogs' && <MechanicView />}
      {activeTab === 'backlog_approvals' && <GlView />}
      {activeTab === 'work_orders' && <PlannerView />}
      {activeTab === 'admin_users' && <AdminView initialTab="users" />}
      {activeTab === 'admin_units' && <AdminView initialTab="units" />}
      {activeTab === 'backlog_history' && <HistoryView />}
      {activeTab === 'backlog_achievements' && <AchievementView />}
    </DashboardLayout>
  );
};

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
