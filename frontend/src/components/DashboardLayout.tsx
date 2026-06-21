import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { LogOut, Bell, User as UserIcon, Shield, ListTodo, Wrench, Users, HardDrive, History, BarChart3, Sun, Moon } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface INotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };

    if (showNotifMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifMenu]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.list();
      const list = data?.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: any) => !n.isRead).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds to simulate real-time updates
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = async (notif: INotificationItem) => {
    // 1. Mark as read on the backend if it is unread
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error('Failed to mark notification as read:', e);
      }
    }

    // 2. Navigation logic
    let targetTab = '';
    const title = notif.title;
    if (title === 'Backlog Baru Menunggu Approval') {
      targetTab = 'backlog_approvals';
    } else if (title === 'Backlog Approved') {
      targetTab = 'work_orders';
    } else if (title === 'Backlog Completed') {
      targetTab = 'backlog_history';
    } else if (title === 'Full Supply') {
      targetTab = 'backlogs';
    }

    if (targetTab) {
      const navItems = getNavItems();
      const hasAccess = navItems.some(item => item.id === targetTab);
      if (hasAccess) {
        setActiveTab(targetTab);
      }
    }

    // 3. Close the notification dropdown
    setShowNotifMenu(false);
  };

  if (!user) return null;

  // Determine navigation tabs based on user role
  const getNavItems = () => {
    let items: Array<{ id: string; label: string; icon: React.ReactNode }> = [];
    switch (user.role) {
      case 'MEKANIK':
        items = [
          { id: 'backlogs', label: 'Backlogs', icon: <ListTodo size={18} /> }
        ];
        break;
      case 'GL':
        items = [
          { id: 'backlog_approvals', label: 'Approvals', icon: <Shield size={18} /> }
        ];
        break;
      case 'PLANNER':
        items = [
          { id: 'work_orders', label: 'Work Orders', icon: <Wrench size={18} /> }
        ];
        break;
      case 'ADMIN':
        items = [
          { id: 'admin_users', label: 'Manage Users', icon: <Users size={18} /> },
          { id: 'admin_units', label: 'Manage Units', icon: <HardDrive size={18} /> }
        ];
        break;
      default:
        items = [];
    }
    // All roles can see Backlog History & Achievements
    items.push({ id: 'backlog_history', label: 'History', icon: <History size={18} /> });
    items.push({ id: 'backlog_achievements', label: 'Achievements', icon: <BarChart3 size={18} /> });
    return items;
  };

  const navItems = getNavItems();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <header className="glass-panel" style={{
        height: '70px',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 4px 8px rgba(250, 204, 21, 0.25))',
          }}>
            <svg viewBox="0 0 64 64" width="42" height="42" className="komatsu-logo" style={{ overflow: 'visible' }}>
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
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            <span className="brand-text-full">BMS Dashboard</span>
            <span className="brand-text-short">BMS</span>
          </span>
        </div>

        {/* Right Info Controls */}
        <div className="header-controls-container" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* Notifications Panel */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} color={unreadCount > 0 ? 'var(--accent-orange)' : 'var(--text-primary)'} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--accent-orange)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(255, 115, 0, 0.5)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="glass-panel notification-dropdown">
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 600 }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unreadCount} unread</span>
                </div>
                <div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className="notification-item"
                        style={{
                          backgroundColor: notif.isRead ? 'transparent' : 'rgba(255, 115, 0, 0.03)',
                        }}
                      >
                        {!notif.isRead && (
                          <div style={{
                            position: 'absolute',
                            left: '8px',
                            top: '18px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-orange)',
                          }}></div>
                        )}
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: notif.isRead ? 500 : 700,
                          paddingLeft: notif.isRead ? 0 : '8px',
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.2rem',
                          paddingLeft: notif.isRead ? 0 : '8px',
                        }}>
                          {notif.message}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.4rem',
                          paddingLeft: notif.isRead ? 0 : '8px',
                        }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserIcon size={18} color="var(--text-secondary)" />
            </div>
            <div className="user-meta-text">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 700 }}>
                {user.role} • {user.site}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Navigation Sidebar */}
        {navItems.length > 1 && (
          <aside className="glass-panel desktop-sidebar" style={{
            width: '240px',
            borderRight: '1px solid var(--border-color)',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                  backgroundColor: activeTab === item.id ? 'var(--accent-orange)' : 'transparent',
                  color: activeTab === item.id ? '#fff' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </aside>
        )}

        {/* Content Box */}
        <main className="main-content-layout" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navbar */}
      {navItems.length > 1 && (
        <nav className="mobile-bottom-navbar" style={{ display: 'none' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === item.id ? 'var(--accent-orange)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                gap: '4px',
                flex: 1,
                padding: '4px',
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
