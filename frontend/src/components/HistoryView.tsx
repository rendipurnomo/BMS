import React, { useState, useEffect } from 'react';
import { backlogService, unitService, userService, workOrderService } from '../services/api';
import {
  History,
  Calendar,
  Search,
  SlidersHorizontal,
  X,
  Layers,
  Wrench,
  CheckCircle2,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

const calculateAging = (startDateStr: string | Date, endDateStr: string | Date) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
  const diffMins = Math.floor(diffTime / (1000 * 60));
  return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
};

export const HistoryView: React.FC = () => {
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Criteria
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [unitId, setUnitId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [priority, setPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Backlog Detail Modal
  const [selectedBacklog, setSelectedBacklog] = useState<any | null>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [completion, setCompletion] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [backlogsRes, unitsRes, usersRes, woRes] = await Promise.all([
        backlogService.list(1, 1000), // Large limit to query all client-side
        unitService.list(1, 1000),
        userService.list(1, 1000),
        workOrderService.list(1, 1000)
      ]);
      setBacklogs(backlogsRes.backlogs || []);
      setUnits(unitsRes.units || []);
      setUsers(usersRes.users || []);
      setWorkOrders(woRes.workOrders || []);
    } catch (e) {
      console.error('Failed to fetch history data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = async (backlog: any) => {
    setSelectedBacklog(backlog);
    setLoadingDetail(true);
    try {
      const [partsData, photosData, historyData, compData] = await Promise.all([
        backlogService.getParts(backlog._id),
        backlogService.getPhotos(backlog._id),
        backlogService.getHistory(backlog._id),
        backlog.status === 'COMPLETED' ? backlogService.getCompletion(backlog._id) : Promise.resolve(null)
      ]);
      setParts(partsData?.parts || []);
      setPhotos(photosData?.photos || []);
      setHistory(historyData?.history || []);
      setCompletion(compData?.completion || null);
    } catch (e) {
      console.error('Failed to load backlog details:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('');
    setUnitId('');
    setCreatedBy('');
    setPriority('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredBacklogs = backlogs.filter((bl) => {
    // 1. Date Range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const blDate = new Date(bl.createdAt);
      if (blDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const blDate = new Date(bl.createdAt);
      if (blDate > end) return false;
    }

    // 2. Status
    if (status && bl.status !== status) return false;

    // 3. Unit Code
    if (unitId && bl.unitId !== unitId) return false;

    // 4. Mechanic (CreatedBy)
    if (createdBy && bl.createdBy !== createdBy) return false;

    // 5. Priority
    if (priority && bl.priority !== priority) return false;

    // 6. Search Query (Backlog No, Damage Type, Description, resolved Unit details or Creator details)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const backlogNo = (bl.backlogNo || '').toLowerCase();
      const damageType = (bl.damageType || '').toLowerCase();
      const description = (bl.description || '').toLowerCase();
      
      const matchingUnit = units.find((u) => u._id === bl.unitId);
      const unitCode = matchingUnit ? matchingUnit.unitCode.toLowerCase() : '';
      const unitModel = matchingUnit ? matchingUnit.unitModel.toLowerCase() : '';

      const matchingCreator = users.find((u) => u._id === bl.createdBy);
      const creatorName = matchingCreator ? matchingCreator.name.toLowerCase() : '';
      const creatorNrp = matchingCreator ? matchingCreator.nrp.toLowerCase() : '';

      const matchingWo = workOrders.find((w) => w.backlogId === bl._id);
      const woNumber = matchingWo ? matchingWo.woNumber.toLowerCase() : '';

      if (
        !backlogNo.includes(query) &&
        !damageType.includes(query) &&
        !description.includes(query) &&
        !unitCode.includes(query) &&
        !unitModel.includes(query) &&
        !creatorName.includes(query) &&
        !creatorNrp.includes(query) &&
        !woNumber.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  // Pagination calculations
  const totalItems = filteredBacklogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBacklogs = filteredBacklogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History color="var(--accent-orange)" /> Backlog History & Archive
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Browse, search, and filter all backlog reports generated across sites.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <SlidersHorizontal size={16} color="var(--accent-orange)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Search Filters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {/* Text Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="No, damage, unit, creator..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Date Range Start */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Date Range End */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Progress Status</label>
            <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}>
              <option value="">All Statuses</option>
              <option value="WAITING_APPROVAL">Waiting Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PLANNING">Planning</option>
              <option value="ORDERING_PART">Ordering Part</option>
              <option value="PARTIAL_SUPPLY">Partial Supply</option>
              <option value="FULL_SUPPLY">Full Supply</option>
              <option value="INSTALLATION">Installation</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Unit Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Machinery Unit</label>
            <select className="form-select" value={unitId} onChange={(e) => { setUnitId(e.target.value); setCurrentPage(1); }}>
              <option value="">All Units</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitCode} ({u.unitModel})
                </option>
              ))}
            </select>
          </div>

          {/* Mechanic/Creator Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Created By (Mechanic)</label>
            <select className="form-select" value={createdBy} onChange={(e) => { setCreatedBy(e.target.value); setCurrentPage(1); }}>
              <option value="">All Staff</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={(e) => { setPriority(e.target.value); setCurrentPage(1); }}>
              <option value="">All Priorities</option>
              <option value="P1">P1 (Immediate)</option>
              <option value="P2">P2 (Within 24h)</option>
              <option value="P3">P3 (Scheduled)</option>
              <option value="P4">P4 (Monitor)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={handleResetFilters} className="btn btn-secondary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem', display: 'flex', gap: '0.25rem' }}>
            <X size={14} /> Clear All Filters
          </button>
        </div>
      </div>

      {/* Backlogs Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <LoadingTruck imageUrl={truckImg} text="Loading archive history..." />
        </div>
      ) : filteredBacklogs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Layers size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No historical backlog reports match the selected filters.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} matches
            </span>
          </div>

          {/* Table Container */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Backlog No</th>
                  <th style={{ padding: '1rem' }}>WO Number</th>
                  <th style={{ padding: '1rem' }}>Date Created</th>
                  <th style={{ padding: '1rem' }}>Unit</th>
                  <th style={{ padding: '1rem' }}>Damage Description</th>
                  <th style={{ padding: '1rem' }}>Priority</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Aging Order</th>
                  <th style={{ padding: '1rem' }}>Aging WO</th>
                  <th style={{ padding: '1rem' }}>Reporter</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBacklogs.map((bl) => {
                  const unit = units.find((u) => u._id === bl.unitId);
                  const creator = users.find((u) => u._id === bl.createdBy);
                  const wo = workOrders.find((w) => w.backlogId === bl._id);
                  
                  let agingOrder = '-';
                  let agingWo = '-';
                  
                  if (wo) {
                    const orderEnd = wo.orderingProgress === 100 ? wo.updatedAt : new Date();
                    agingOrder = calculateAging(wo.createdAt, orderEnd);
                    
                    const woEnd = bl.status === 'COMPLETED' ? bl.updatedAt : new Date();
                    agingWo = calculateAging(wo.createdAt, woEnd);
                  }
                  
                  return (
                    <tr key={bl._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{bl.backlogNo}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        {wo?.woNumber || (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {new Date(bl.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{unit?.unitCode || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unit?.unitModel || ''}</div>
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bl.damageType}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bl.description}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: bl.priority === 'P1' ? 'var(--accent-red)' : bl.priority === 'P2' ? 'var(--accent-orange)' : 'var(--accent-blue)'
                        }}>
                          {bl.priority}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge badge-${bl.status.toLowerCase()}`}>
                          {bl.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{agingOrder}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{agingWo}</td>
                      <td style={{ padding: '1rem' }}>
                        <div>{creator?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{creator?.nrp || ''}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => handleOpenDetail(bl)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedBacklog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedBacklog(null)}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '1.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
            >
              <X size={16} />
            </button>

            {loadingDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <LoadingTruck imageUrl={truckImg} text="Loading backlog complete record..." />
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Archive Detail: {selectedBacklog.backlogNo}</h3>
                  <span className={`badge badge-${selectedBacklog.status.toLowerCase()}`}>
                    {selectedBacklog.status.replace('_', ' ')}
                  </span>
                </div>

                {(() => {
                  const matchingWo = workOrders.find((w) => w.backlogId === selectedBacklog._id);
                  if (!matchingWo) return null;
                  
                  const orderEnd = matchingWo.orderingProgress === 100 ? matchingWo.updatedAt : new Date();
                  const agingOrder = calculateAging(matchingWo.createdAt, orderEnd);
                  
                  const woEnd = selectedBacklog.status === 'COMPLETED' ? selectedBacklog.updatedAt : new Date();
                  const agingWo = calculateAging(matchingWo.createdAt, woEnd);
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 700, background: 'rgba(255, 115, 0, 0.05)', border: '1px solid rgba(255, 115, 0, 0.2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                        Associated Work Order: {matchingWo.woNumber}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Aging Order (Part Procurement)</span>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--accent-orange)' }}>{agingOrder}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Aging WO (Job Execution)</span>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--accent-orange)' }}>{agingWo}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                  {/* Left Column (Metadata & Details) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* General Metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Site Location</span>
                        <p style={{ fontWeight: 600 }}>{selectedBacklog.site}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Section Area</span>
                        <p style={{ fontWeight: 600 }}>{selectedBacklog.section}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hourmeter</span>
                        <p style={{ fontWeight: 600 }}>{selectedBacklog.hourmeter} Hrs</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Object Down Status</span>
                        <p style={{ fontWeight: 600 }}>{selectedBacklog.objectDown}</p>
                      </div>
                    </div>

                    {/* Damage & Description */}
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Damage Type</span>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0.2rem 0 0.5rem 0' }}>{selectedBacklog.damageType}</p>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Damage Details / Comments</span>
                      <p style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                        {selectedBacklog.description}
                      </p>
                    </div>

                    {/* Parts List */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wrench size={16} /> Parts Supply Checklist
                      </h4>
                      {parts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No parts were requested for this backlog.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {parts.map((part) => (
                            <div key={part._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px dotted rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                              <span>{part.partName} <span style={{ color: 'var(--text-muted)' }}>({part.partNumber})</span></span>
                              <strong style={{ color: 'var(--accent-orange)' }}>
                                Supplied: {part.supplyQty} / {part.qty}
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completion Record */}
                    {selectedBacklog.status === 'COMPLETED' && completion && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)' }}>
                          <CheckCircle2 size={16} /> Completion Records
                        </h4>
                        <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Completion Hourmeter</span>
                            <p style={{ fontWeight: 600 }}>{completion.completionHourmeter} Hrs</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Manpower Crew</span>
                            <p style={{ fontWeight: 600 }}>{completion.manpower}</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Closure Remarks</span>
                            <p style={{ color: '#fff', marginTop: '0.2rem' }}>{completion.remarks}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Photos & Status Timeline) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Photo Display */}
                    <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={16} /> Attached Evidence
                      </h4>
                      {photos.length === 0 ? (
                        <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No photos uploaded.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {photos.map((photo) => (
                            <div key={photo._id} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                              <img src={photo.photoUrl} alt="Backlog evidence" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                              <div style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                <span style={{ fontWeight: 600 }}>{photo.photoType}</span>
                                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timeline History */}
                    <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} /> Status Timeline
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '1.25rem' }}>
                        <div style={{
                          position: 'absolute',
                          left: '5px',
                          top: '6px',
                          bottom: '6px',
                          width: '2px',
                          backgroundColor: 'var(--border-color)',
                        }}></div>

                        {history.map((hist, index) => {
                          const actionUser = users.find((u) => u._id === hist.actionBy);
                          return (
                            <div key={hist._id} style={{ position: 'relative', fontSize: '0.8rem' }}>
                              <div style={{
                                position: 'absolute',
                                left: '-18px',
                                top: '4px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: index === history.length - 1 ? 'var(--accent-orange)' : 'var(--text-muted)'
                              }}></div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span style={{ color: index === history.length - 1 ? '#fff' : 'var(--text-secondary)' }}>
                                  {hist.toStatus.replace('_', ' ')}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                  {new Date(hist.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                By {actionUser?.name || 'System'} ({actionUser?.role || ''})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
