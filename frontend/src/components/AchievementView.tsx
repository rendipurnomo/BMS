import React, { useState, useEffect } from 'react';
import { backlogService, unitService } from '../services/api';
import { Award, CheckCircle2, AlertCircle, RefreshCw, BarChart2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

const getDamageCategory = (damageType: string = ''): string => {
  const dt = damageType.toLowerCase();
  if (
    dt.includes('engine') || 
    dt.includes('motor') || 
    dt.includes('exhaust') || 
    dt.includes('radiator') || 
    dt.includes('alternator') || 
    dt.includes('fan')
  ) {
    return 'Engine';
  }
  if (
    dt.includes('hydraulic') || 
    dt.includes('hose') || 
    dt.includes('leak') || 
    dt.includes('pump') || 
    dt.includes('valve') || 
    dt.includes('cylinder') || 
    dt.includes('fluid')
  ) {
    return 'Hydraulic System';
  }
  if (
    dt.includes('suspension') || 
    dt.includes('spring') || 
    dt.includes('shock') || 
    dt.includes('strut') || 
    dt.includes('damper') || 
    dt.includes('bushing')
  ) {
    return 'Suspension';
  }
  if (
    dt.includes('track') || 
    dt.includes('shoe') || 
    dt.includes('roller') || 
    dt.includes('idler') || 
    dt.includes('sprocket') || 
    dt.includes('tire') || 
    dt.includes('wheel')
  ) {
    return 'Undercarriage / Wheel';
  }
  return 'Others';
};

interface MetricStats {
  total: number;
  completed: number;
  active: number;
  rejected: number;
  completionRate: number;
  statuses: Record<string, number>;
  categories: Record<string, number>;
  units: Array<{ unitCode: string; count: number }>;
  priorities: Record<string, number>;
}

export const AchievementView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [allBacklogs, setAllBacklogs] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);

  // Monthly filter
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [stats, setStats] = useState<MetricStats>({
    total: 0,
    completed: 0,
    active: 0,
    rejected: 0,
    completionRate: 0,
    statuses: {},
    categories: { 'Engine': 0, 'Hydraulic System': 0, 'Suspension': 0, 'Undercarriage / Wheel': 0, 'Others': 0 },
    units: [],
    priorities: { 'P1': 0, 'P2': 0, 'P3': 0, 'P4': 0 }
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [backlogData, unitData] = await Promise.all([
        backlogService.list(1, 1000),
        unitService.list(1, 1000)
      ]);

      const blList = backlogData.backlogs || [];
      const uList = unitData.units || [];
      setAllBacklogs(blList);
      setAllUnits(uList);

      // Calculate with current month filter
      calculateStats(blList, uList, selectedMonth, selectedYear);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (blList: any[], uList: any[], month: number, year: number) => {
    // Filter backlogs by month/year based on createdAt
    const monthFiltered = blList.filter(b => {
      if (!b.createdAt) return false;
      const d = new Date(b.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const total = monthFiltered.length;
    const completed = monthFiltered.filter(b => b.status === 'COMPLETED').length;
    const rejected = monthFiltered.filter(b => b.status === 'REJECTED').length;
    const active = total - completed - rejected;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status distributions
    const statuses: Record<string, number> = {};
    const priorities: Record<string, number> = { 'P1': 0, 'P2': 0, 'P3': 0, 'P4': 0 };
    const categories: Record<string, number> = { 'Engine': 0, 'Hydraulic System': 0, 'Suspension': 0, 'Undercarriage / Wheel': 0, 'Others': 0 };
    const unitCounts: Record<string, number> = {};

    monthFiltered.forEach(bl => {
      // Status
      statuses[bl.status] = (statuses[bl.status] || 0) + 1;
      
      // Priorities
      if (bl.priority in priorities) {
        priorities[bl.priority]++;
      }

      // Damage Category
      const cat = getDamageCategory(bl.damageType);
      categories[cat]++;

      // Unit groupings
      const matchingUnit = uList.find(u => u._id === bl.unitId);
      const unitCode = matchingUnit ? matchingUnit.unitCode : 'Unknown Unit';
      unitCounts[unitCode] = (unitCounts[unitCode] || 0) + 1;
    });

    // Format top units array
    const sortedUnits = Object.entries(unitCounts)
      .map(([unitCode, count]) => ({ unitCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 units

    setStats({
      total,
      completed,
      active,
      rejected,
      completionRate,
      statuses,
      categories,
      units: sortedUnits,
      priorities
    });
  };

  // Recalculate when month changes
  useEffect(() => {
    if (allBacklogs.length > 0 || allUnits.length > 0) {
      calculateStats(allBacklogs, allUnits, selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // HSL colors mapping for damage categories
  const categoryColors: Record<string, string> = {
    'Engine': '#ef4444',             // Red
    'Hydraulic System': '#3b82f6',   // Blue
    'Suspension': '#a855f7',         // Purple
    'Undercarriage / Wheel': '#f97316', // Orange
    'Others': '#64748b'              // Slate
  };

  // Priority Colors
  const priorityColors: Record<string, string> = {
    'P1': 'var(--accent-red)',
    'P2': '#f97316',
    'P3': '#fbbf24',
    'P4': '#10b981'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <LoadingTruck imageUrl={truckImg} text="Loading achievements dashboard..." />
      </div>
    );
  }

  // Circular gauge config
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Monthly Achievements</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Backlog analytics scoped to selected month</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Month Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.3rem 0.5rem'
          }}>
            <button
              onClick={handlePrevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '0.25rem' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '130px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
              <Calendar size={14} color="var(--accent-orange)" />
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '0.25rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Summary Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Total card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Backlogs</span>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.total}</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <BarChart2 size={28} color="var(--text-muted)" />
          </div>
        </div>

        {/* Active card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Backlogs</span>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-orange)' }}>{stats.active}</h3>
          </div>
          <div style={{ background: 'rgba(255, 115, 0, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <AlertCircle size={28} color="var(--accent-orange)" />
          </div>
        </div>

        {/* Completed card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed</span>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-green)' }}>{stats.completed}</h3>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle2 size={28} color="var(--accent-green)" />
          </div>
        </div>

        {/* Completion Circular Progress card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem' }}>
          <svg width="100" height="100" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-color)" strokeWidth={strokeWidth} />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--accent-green)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="60" y="66" textAnchor="middle" fontSize="1.3rem" fontWeight="700" fill="#fff" fontFamily="inherit">
              {stats.completionRate}%
            </text>
          </svg>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} color="var(--accent-green)" /> Achievement
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: '1.3' }}>
              Ratio of completed backlogs vs total reports.
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left Card: Unit Damage trends */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Unit Damage Trends</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Top units experiencing the most backlog breakdowns</p>
          </div>

          {stats.units.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No unit data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {stats.units.map((u, idx) => {
                const maxCount = stats.units[0]?.count || 1;
                const percentage = Math.round((u.count / maxCount) * 100);
                return (
                  <div key={u.unitCode} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700 }}>
                        {idx + 1}. {u.unitCode}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{u.count} cases</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--accent-orange), #ff4500)',
                          borderRadius: 'var(--radius-full)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Card: Dynamic Damage Category distribution (engine, hydraulic, suspension) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Damage Categories Distribution</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failure categorization based on damage type text matching</p>
          </div>

          {stats.total === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No category data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Stacked segmented bar */}
              <div style={{
                width: '100%',
                height: '24px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid var(--border-color)'
              }}>
                {Object.entries(stats.categories).map(([cat, val]) => {
                  if (val === 0) return null;
                  const pct = (val / stats.total) * 100;
                  return (
                    <div
                      key={cat}
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: categoryColors[cat] || '#64748b',
                        transition: 'width 0.5s ease'
                      }}
                      title={`${cat}: ${val} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>

              {/* Categorized list items & legends */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(stats.categories).map(([cat, val]) => {
                  const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: categoryColors[cat]
                        }} />
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <strong>{val}</strong> ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left Card: Status breakdown progress */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Backlogs by Status</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current backlog reports grouped by state machine status</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '320px', overflowY: 'auto' }}>
            {['WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'PLANNING', 'ORDERING_PART', 'PARTIAL_SUPPLY', 'FULL_SUPPLY', 'INSTALLATION', 'COMPLETED'].map(statusName => {
              const val = stats.statuses[statusName] || 0;
              const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
              return (
                <div key={statusName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {statusName.toLowerCase().replace('_', ' ')}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{val} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: statusName === 'COMPLETED' ? 'var(--accent-green)' : statusName === 'REJECTED' ? 'var(--accent-red)' : 'var(--accent-orange)',
                      borderRadius: 'var(--radius-full)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Priorities distribution bar chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Backlogs by Priority</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distribution of reports based on priority severity level</p>
          </div>

          {stats.total === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No priority data available.</p>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '160px', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
              {Object.entries(stats.priorities).map(([pri, val]) => {
                const maxVal = Math.max(...Object.values(stats.priorities)) || 1;
                const barHeight = Math.max(10, Math.round((val / maxVal) * 120)); // min height 10px, max height 120px
                return (
                  <div key={pri} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '40px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{val}</span>
                    <div style={{
                      width: '20px',
                      height: `${barHeight}px`,
                      background: `linear-gradient(180deg, ${priorityColors[pri]}, rgba(255,255,255,0.02))`,
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.5s ease'
                    }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{pri}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
            <span>P1: Emergency</span>
            <span>P2: Urgent</span>
            <span>P3: Medium</span>
            <span>P4: Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};
