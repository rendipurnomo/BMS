import React, { useState, useEffect } from 'react';
import { backlogService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Check, X, AlertTriangle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

export const GlView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBacklog, setSelectedBacklog] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail states
  const [parts, setParts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchPendingBacklogs = async () => {
    setLoading(true);
    try {
      const data = await backlogService.list(1, 100);
      // Filter strictly for WAITING_APPROVAL
      const pending = (data.backlogs || []).filter((bl: any) => bl.status === 'WAITING_APPROVAL');
      setBacklogs(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBacklogs();
  }, []);

  const handleOpenDetail = async (backlog: any) => {
    setSelectedBacklog(backlog);
    try {
      const [partsData, photosData] = await Promise.all([
        backlogService.getParts(backlog._id),
        backlogService.getPhotos(backlog._id)
      ]);
      setParts(partsData?.parts || []);
      setPhotos(photosData?.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!selectedBacklog) return;
    setLoading(true);
    try {
      await backlogService.approve(selectedBacklog._id);
      toast.success('Backlog approved successfully!');
      setSelectedBacklog(null);
      fetchPendingBacklogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to approve backlog');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBacklog) return;
    setLoading(true);
    try {
      await backlogService.reject(selectedBacklog._id);
      toast.success('Backlog rejected successfully.');
      setSelectedBacklog(null);
      fetchPendingBacklogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reject backlog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      {!selectedBacklog ? (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Backlog Review Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Pending approvals for Site: <strong style={{ color: '#fff' }}>{user?.site}</strong> | Section: <strong style={{ color: '#fff' }}>{user?.section}</strong>
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingTruck imageUrl={truckImg} text="Loading pending reports..." />
            </div>
          ) : backlogs.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <ShieldAlert size={48} color="var(--accent-green)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Good job! No backlogs are currently waiting for approval.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {backlogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((bl) => (
                  <div
                    key={bl._id}
                    className="glass-card"
                    onClick={() => handleOpenDetail(bl)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid var(--accent-orange)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{bl.backlogNo}</span>
                        <span className="badge badge-waiting_approval">WAITING APPROVAL</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Unit: <strong style={{ color: '#fff' }}>{bl.unitCode}</strong></span>
                        <span>Priority: <strong style={{ color: 'var(--accent-orange)' }}>{bl.priority}</strong></span>
                        <span>Hourmeter: <strong>{bl.hourmeter} Hrs</strong></span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                        Damage: {bl.damageType}
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>Review</button>
                  </div>
                ))}
              </div>
              {Math.ceil(backlogs.length / itemsPerPage) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Previous</button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {currentPage} of {Math.ceil(backlogs.length / itemsPerPage)}</span>
                  <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(backlogs.length / itemsPerPage)))} disabled={currentPage === Math.ceil(backlogs.length / itemsPerPage)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <button onClick={() => setSelectedBacklog(null)} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to Approvals
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            {/* Left Box */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Review Backlog: {selectedBacklog.backlogNo}</h3>
                <span className="badge badge-waiting_approval">Pending Approval</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unit Code</span>
                  <p style={{ fontWeight: 600 }}>{selectedBacklog.unitCode}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority</span>
                  <p style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{selectedBacklog.priority}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hourmeter</span>
                  <p style={{ fontWeight: 600 }}>{selectedBacklog.hourmeter} Hrs</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Damage Title</span>
                  <p style={{ fontWeight: 600 }}>{selectedBacklog.damageType}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description / Damage Details</span>
                <p style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                  {selectedBacklog.description}
                </p>
              </div>

              {/* Parts */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Parts Requested</h4>
                {parts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No parts listed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {parts.map(part => (
                      <div key={part._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px dotted rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <span>{part.partName} <span style={{ color: 'var(--text-muted)' }}>({part.partNumber})</span></span>
                        <strong style={{ color: 'var(--accent-orange)' }}>Qty: {part.qty}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Decision Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleReject} className="btn btn-danger" style={{ flex: 1, padding: '0.85rem' }} disabled={loading}>
                  <X size={18} /> Reject Backlog
                </button>
                <button onClick={handleApprove} className="btn btn-primary" style={{ flex: 1, padding: '0.85rem', backgroundColor: 'var(--accent-green)' }} disabled={loading}>
                  <Check size={18} /> Approve & Release
                </button>
              </div>
            </div>

            {/* Right Box (Damage Photo) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={18} /> Damage Photo
                </h4>
                {photos.length === 0 ? (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                    No photos uploaded.
                  </div>
                ) : (
                  photos.map(photo => (
                    <div key={photo._id} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={photo.photoUrl} alt="Damage evidence" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                      <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }}>
                        Uploaded by Mekanik
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255, 115, 0, 0.05)', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
                <AlertTriangle size={20} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--accent-orange)' }}>GL Review Checklist:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <li>Verify damage match photo</li>
                    <li>Verify correct priority rating</li>
                    <li>Ensure unit code is correct</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
