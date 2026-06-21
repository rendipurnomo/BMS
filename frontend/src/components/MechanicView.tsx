import React, { useState, useEffect, useRef } from 'react';
import { backlogService, unitService, workOrderService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/image';
import {
  Plus,
  Trash2,
  Camera,
  ChevronRight,
  Truck,
  ArrowLeft,
  History,
  CheckCircle2,
  User,
  Gauge,
  Search
} from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

interface PartItem {
  partName: string;
  partNumber: string;
  qty: number;
}

export const MechanicView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedBacklog, setSelectedBacklog] = useState<any | null>(null);

  // Form States for creating Backlog
  const [units, setUnits] = useState<any[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [parts, setParts] = useState<PartItem[]>([{ partName: '', partNumber: 'PN-' + Math.floor(100000 + Math.random() * 900000), qty: 1 }]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hourmeter, setHourmeter] = useState<number>(0);
  const [objectDown, setObjectDown] = useState<'SCHEDULE INSPECTION' | 'SERVICE' | 'BREAKDOWN'>('BREAKDOWN');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P1');
  const [damageType, setDamageType] = useState('');
  const [description, setDescription] = useState('');

  // States for sub-entities on detail view
  const [detailParts, setDetailParts] = useState<any[]>([]);
  const [detailPhotos, setDetailPhotos] = useState<any[]>([]);
  const [detailHistory, setDetailHistory] = useState<any[]>([]);
  const [detailCompletion, setDetailCompletion] = useState<any | null>(null);
  const [associatedWo, setAssociatedWo] = useState<any | null>(null);

  // Completion Form States
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionHourmeter, setCompletionHourmeter] = useState<number>(0);
  const [manpower, setManpower] = useState('');
  const [remarks, setRemarks] = useState('');
  const completionFileInputRef = useRef<HTMLInputElement>(null);
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<'ALL' | 'WAITING_APPROVAL' | 'APPROVED' | 'ON_PROGRESS' | 'FULL_SUPPLY' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, searchTerm]);

  const filteredBacklogs = backlogs.filter(bl => {
    if (statusTab !== 'ALL') {
      if (statusTab === 'ON_PROGRESS') {
        if (!['PLANNING', 'ORDERING_PART', 'PARTIAL_SUPPLY', 'INSTALLATION'].includes(bl.status)) return false;
      } else if (statusTab === 'COMPLETED') {
        if (bl.status !== 'COMPLETED' && bl.status !== 'REJECTED') return false;
      } else {
        if (bl.status !== statusTab) return false;
      }
    }
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const unitCode = (bl.unitCode || '').toLowerCase();
      const unitModel = (bl.unitModel || '').toLowerCase();
      const damageType = (bl.damageType || '').toLowerCase();
      const backlogNo = (bl.backlogNo || '').toLowerCase();
      if (!unitCode.includes(query) && !unitModel.includes(query) && !damageType.includes(query) && !backlogNo.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBacklogs.length / itemsPerPage);
  const paginatedBacklogs = filteredBacklogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchBacklogs = async () => {
    setLoading(true);
    try {
      const data = await backlogService.list(1, 100);
      setBacklogs(data.backlogs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await unitService.list(1, 100);
      setUnits(data.units || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBacklogs();
    fetchUnits();
  }, []);

  const handleOpenDetail = async (backlog: any) => {
    setSelectedBacklog(backlog);
    setView('detail');
    try {
      const [partsData, photosData, historyData, compData, woRes] = await Promise.all([
        backlogService.getParts(backlog._id),
        backlogService.getPhotos(backlog._id),
        backlogService.getHistory(backlog._id),
        backlog.status === 'COMPLETED' ? backlogService.getCompletion(backlog._id) : Promise.resolve(null),
        workOrderService.list(1, 1000)
      ]);
      setDetailParts(partsData?.parts || []);
      setDetailPhotos(photosData?.photos || []);
      setDetailHistory(historyData?.history || []);
      setDetailCompletion(compData?.completion || null);
      const matchingWo = (woRes.workOrders || []).find((w: any) => w.backlogId === backlog._id);
      setAssociatedWo(matchingWo || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPart = () => {
    setParts([...parts, { partName: '', partNumber: 'PN-' + Math.floor(100000 + Math.random() * 900000), qty: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: keyof PartItem, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const handleSimulatePhoto = () => {
    // Simulate photo upload by using the generated leak image with absolute path
    setPhotoUrl(window.location.origin + '/machinery_leak.png');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setPhotoUrl(compressed);
        } catch (err) {
          setPhotoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateCompletionPhoto = () => {
    setCompletionPhotoUrl(window.location.origin + '/machinery_leak.png');
  };

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setCompletionPhotoUrl(compressed);
        } catch (err) {
          setCompletionPhotoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitBacklog = async () => {
    if (!selectedUnit) {
      toast.warning('Please select a Unit');
      return;
    }
    if (!damageType) {
      toast.warning('Damage Type is required');
      return;
    }
    if (!photoUrl) {
      toast.warning('At least one Photo is required');
      return;
    }
    if (photoUrl && photoUrl.length * 0.75 > 15 * 1024 * 1024) {
      toast.error('Photo is too large. Please upload an image smaller than 15MB.');
      return;
    }

    setLoading(true);
    try {
      // Auto-generate backlog number
      const backlogNo = 'BL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const validParts = parts.filter(p => p.partName.trim() !== '');

      const payload = {
        backlogNo,
        unitId: selectedUnit._id,
        hourmeter,
        objectDown,
        priority,
        damageType,
        description: description || 'No extra details provided',
        site: user?.site || 'TAA',
        section: user?.section || 'TRACK',
        parts: validParts,
        photoUrl: photoUrl
      };

      // Create backlog atomically (includes parts and photoUrl)
      await backlogService.create(payload);
      toast.success('Backlog submitted successfully! Sent to GL for approval.');

      // Reset form
      setSelectedUnit(null);
      setParts([{ partName: '', partNumber: 'PN-' + Math.floor(100000 + Math.random() * 900000), qty: 1 }]);
      setPhotoUrl(null);
      setHourmeter(0);
      setDamageType('');
      setDescription('');
      
      // Refresh list
      await fetchBacklogs();
      setView('list');
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Failed to submit backlog';
      const validationErrors = e.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const details = validationErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        toast.error(`${errMsg}: ${details}`);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };



  const handleCompleteBacklog = async () => {
    if (!selectedBacklog) return;
    if (!manpower || !remarks) {
      toast.warning('Please fill in Manpower and Remarks');
      return;
    }
    if (!completionPhotoUrl) {
      toast.warning('Please attach a photo of the installed part');
      return;
    }
    if (completionHourmeter < selectedBacklog.hourmeter) {
      toast.error(`Completion Hourmeter must be greater than or equal to the backlog hourmeter (${selectedBacklog.hourmeter} Hrs)`);
      return;
    }
    if (completionPhotoUrl && completionPhotoUrl.length * 0.75 > 15 * 1024 * 1024) {
      toast.error('Completion photo is too large. Please upload an image smaller than 15MB.');
      return;
    }

    setLoading(true);
    try {
      // Submit completion records atomically (includes photoUrl)
      const updatedData = await backlogService.complete(selectedBacklog._id, {
        completionHourmeter,
        manpower,
        remarks,
        photoUrl: completionPhotoUrl
      });
      const updated = updatedData?.backlog || updatedData;
      toast.success('Backlog installation completed successfully!');
      setShowCompletionModal(false);
      setManpower('');
      setRemarks('');
      setCompletionPhotoUrl(null);
      await handleOpenDetail(updated);
      fetchBacklogs();
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Failed to complete backlog';
      const validationErrors = e.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const details = validationErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        toast.error(`${errMsg}: ${details}`);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 1. BACKLOG LIST VIEW */}
      {view === 'list' && (
        <div className="animate-fade">
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Backlog Reports</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scope: {user?.site} site</p>
            </div>
            <button className="btn btn-primary" onClick={() => setView('create')}>
              <Plus size={18} /> New Backlog
            </button>
          </div>

          {/* Filters and Search Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            justifyContent: 'space-between'
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'WAITING_APPROVAL', label: 'Pending' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'ON_PROGRESS', label: 'On Progress' },
                { key: 'FULL_SUPPLY', label: 'Full Supply' },
                { key: 'COMPLETED', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusTab(tab.key as any); }}
                  style={{
                    padding: '0.4rem 0.85rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: statusTab === tab.key ? 'var(--accent-orange)' : 'transparent',
                    color: statusTab === tab.key ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search unit (code, model)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', height: '34px', fontSize: '0.85rem', marginBottom: 0 }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingTruck imageUrl={truckImg} text="Loading backlogs..." />
            </div>
          ) : filteredBacklogs.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Truck size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No backlog reports found matching filters.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {paginatedBacklogs.map((bl) => (
                  <div
                    key={bl._id}
                    className="glass-card"
                    onClick={() => handleOpenDetail(bl)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{bl.backlogNo}</span>
                        <span className={`badge badge-${bl.status.toLowerCase()}`}>{bl.status.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Unit: <strong style={{ color: '#fff' }}>{bl.unitCode || 'DZ85-21'}</strong></span>
                        <span>Priority: <strong style={{ color: 'var(--accent-orange)' }}>{bl.priority}</strong></span>
                        <span>Hourmeter: <strong>{bl.hourmeter} Hrs</strong></span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                        Damage: {bl.damageType}
                      </div>
                    </div>
                    <ChevronRight size={20} color="var(--text-muted)" />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. CREATE BACKLOG VIEW (MATCHING MOCKUP SCREENSHOT) */}
      {view === 'create' && (
        <div className="animate-slide" style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <button
              onClick={() => setView('list')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={20} />
              New Backlog
            </button>
          </div>

          {/* Form Content */}
          <div>
            {/* Input fields for basics */}
            <div className="form-group">
              <label className="form-label">Damage Type / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Boom cylinder crack"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Hourmeter</label>
                <input
                  type="number"
                  className="form-input"
                  value={hourmeter}
                  onChange={(e) => setHourmeter(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                >
                  <option value="P1">P1 (Immediate)</option>
                  <option value="P2">P2 (Within 24h)</option>
                  <option value="P3">P3 (Scheduled)</option>
                  <option value="P4">P4 (Monitor)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Object Down Status</label>
              <select
                className="form-select"
                value={objectDown}
                onChange={(e: any) => setObjectDown(e.target.value)}
              >
                <option value="BREAKDOWN">BREAKDOWN</option>
                <option value="SERVICE">SERVICE</option>
                <option value="SCHEDULE INSPECTION">SCHEDULE INSPECTION</option>
              </select>
            </div>

            {/* Select Unit (Mockup Pictured Element) */}
            <div className="form-group">
              <label className="form-label">Select Unit</label>
              <div
                onClick={() => setShowUnitModal(true)}
                style={{
                  background: 'rgba(20,29,47,0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,115,0,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'rgba(255,115,0,0.1)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Truck size={20} color="var(--accent-orange)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: selectedUnit ? '#fff' : 'var(--text-secondary)' }}>
                      {selectedUnit ? `${selectedUnit.unitCode} (${selectedUnit.unitModel})` : 'Tap to select unit'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </div>

            {/* Parts Required Card (Mockup Pictured Element) */}
            <div style={{
              background: 'rgba(20,29,47,0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Parts Required</h3>
                <button
                  type="button"
                  onClick={handleAddPart}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-orange)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <Plus size={16} /> Add Part
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {parts.map((part, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(10,15,29,0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      position: 'relative',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Part #{index + 1}
                      </span>
                      {parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePart(index)}
                          style={{
                            background: '#fff',
                            border: '1px solid var(--accent-red)',
                            borderRadius: '4px',
                            color: 'var(--accent-red)',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter part name/description"
                        value={part.partName}
                        onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Part number"
                          value={part.partNumber}
                          onChange={(e) => handlePartChange(index, 'partNumber', e.target.value)}
                          style={{ fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Qty"
                          min={1}
                          value={part.qty}
                          onChange={(e) => handlePartChange(index, 'qty', parseInt(e.target.value) || 1)}
                          style={{ fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos (Required) (Mockup Pictured Element) */}
            <div className="form-group">
              <label className="form-label">Photos <span style={{ color: 'var(--text-muted)' }}>(Required)</span></label>
              
              {photoUrl ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img
                    src={photoUrl}
                    alt="Equipment damage"
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => setPhotoUrl(null)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'rgba(20,29,47,0.2)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <Camera size={32} color="var(--accent-orange)" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Add Photo
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={14} color="var(--accent-orange)" />
                  <span>Click box to select file</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimulatePhoto();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-orange)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Use Mock Photo
                </button>
              </div>
            </div>

            {/* Description (Optional) (Mockup Pictured Element) */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Description <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Add any additional details about the backlog..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Bottom Submit Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.8rem' }}
                onClick={() => setView('list')}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.8rem' }}
                onClick={handleSubmitBacklog}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>

          {/* Unit Selection Modal */}
          {showUnitModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
            }}>
              <div className="glass-panel animate-slide" style={{
                width: '100%',
                maxWidth: '400px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
              }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>Select Unit</h3>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search unit by code or model..."
                    value={unitSearchQuery}
                    onChange={(e) => setUnitSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {(() => {
                    const filtered = units.filter(unit => 
                      unit.unitCode.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
                      unit.unitModel.toLowerCase().includes(unitSearchQuery.toLowerCase())
                    );
                    if (filtered.length === 0) {
                      return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>No units found</div>;
                    }
                    return filtered.map((unit) => (
                      <div
                        key={unit._id}
                        onClick={() => {
                          setSelectedUnit(unit);
                          setShowUnitModal(false);
                          setUnitSearchQuery('');
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: 600 }}>{unit.unitCode}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{unit.unitModel} ({unit.section})</span>
                      </div>
                    ));
                  })()}
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { setShowUnitModal(false); setUnitSearchQuery(''); }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DETAIL VIEW */}
      {view === 'detail' && selectedBacklog && (
        <div className="animate-fade" style={{ maxWidth: '800px' }}>
          {/* Back to list button */}
          <button
            onClick={() => setView('list')}
            className="btn btn-secondary"
            style={{ marginBottom: '1.5rem' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            {/* Left Side: General Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{selectedBacklog.backlogNo}</h3>
                  <span className={`badge badge-${selectedBacklog.status.toLowerCase()}`}>
                    {selectedBacklog.status.replace('_', ' ')}
                  </span>
                </div>

                {associatedWo && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 700, marginBottom: '1rem', background: 'rgba(255, 115, 0, 0.05)', border: '1px solid rgba(255, 115, 0, 0.2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    Work Order: {associatedWo.woNumber}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Damage Type</span>
                    <p style={{ fontWeight: 600 }}>{selectedBacklog.damageType}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Priority</span>
                    <p style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{selectedBacklog.priority}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hourmeter</span>
                    <p style={{ fontWeight: 600 }}>{selectedBacklog.hourmeter} Hrs</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Object Down</span>
                    <p style={{ fontWeight: 600 }}>{selectedBacklog.objectDown}</p>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</span>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                    {selectedBacklog.description}
                  </p>
                </div>

                {/* Mechanic Actions */}
                {(selectedBacklog.status === 'FULL_SUPPLY' || selectedBacklog.status === 'INSTALLATION') && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <CheckCircle2 color="var(--accent-green)" />
                      <span>
                        {selectedBacklog.status === 'FULL_SUPPLY' 
                          ? `Spare parts are fully supplied for ${associatedWo ? associatedWo.woNumber : 'this Work Order'}!` 
                          : 'Installation in progress.'} Complete the work and submit records.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCompletionHourmeter(selectedBacklog.hourmeter + 10);
                        setCompletionPhotoUrl(null);
                        setShowCompletionModal(true);
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <CheckCircle2 size={18} /> Complete Installation
                    </button>
                  </div>
                )}
              </div>

              {/* Parts card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Parts List</h4>
                {detailParts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No parts listed for this backlog.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem' }}>Part Name</th>
                        <th style={{ padding: '0.5rem' }}>Part Number</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Supplied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailParts.map((part) => (
                        <tr key={part._id} style={{ borderBottom: '1px dotted rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{part.partName}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{part.partNumber}</td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{part.qty}</td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: part.supplyQty >= part.qty ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                            {part.supplyQty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Side: Photos, Completion, and Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Photo Display */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Photos</h4>
                {detailPhotos.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No photos uploaded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {detailPhotos.map((photo) => (
                      <div key={photo._id} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={photo.photoUrl} alt="Inspection" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                        <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{photo.photoType} Installation</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(photo.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion remarks card */}
              {selectedBacklog.status === 'COMPLETED' && detailCompletion && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-green)' }}>
                  <h4 style={{ marginBottom: '1rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> Completion Record
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completion Hourmeter</span>
                      <p style={{ fontWeight: 600 }}>{detailCompletion.completionHourmeter} Hrs</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manpower</span>
                      <p style={{ fontWeight: 600 }}>{detailCompletion.manpower}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remarks</span>
                      <p style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
                        {detailCompletion.remarks}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transition History / Status Timeline */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} /> Status History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
                  {/* Timeline bar */}
                  <div style={{
                    position: 'absolute',
                    left: '6px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    backgroundColor: 'var(--border-color)',
                  }}></div>

                  {detailHistory.map((hist, index) => (
                    <div key={hist._id} style={{ position: 'relative', fontSize: '0.85rem' }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-23px',
                        top: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: index === detailHistory.length - 1 ? 'var(--accent-orange)' : 'var(--text-muted)',
                        boxShadow: index === detailHistory.length - 1 ? '0 0 8px var(--accent-orange)' : 'none',
                      }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: index === detailHistory.length - 1 ? '#fff' : 'var(--text-secondary)' }}>
                          {hist.toStatus.replace('_', ' ')}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(hist.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {hist.fromStatus && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Transitioned from {hist.fromStatus.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Completion Form Modal */}
          {showCompletionModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
            }}>
              <div className="glass-panel animate-slide" style={{
                width: '100%',
                maxWidth: '380px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 color="var(--accent-green)" /> Submit Completion Records
                </h3>

                {/* Grid for side-by-side inputs */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Hourmeter (Hrs)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={completionHourmeter}
                        onChange={(e) => setCompletionHourmeter(parseInt(e.target.value) || 0)}
                        style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem' }}
                      />
                      <Gauge size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Manpower Team</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Team name"
                        value={manpower}
                        onChange={(e) => setManpower(e.target.value)}
                        style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem' }}
                      />
                      <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Installed Part Photo <span style={{ color: 'red' }}>*</span></label>
                  {completionPhotoUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '90px' }}>
                      <img
                        src={completionPhotoUrl}
                        alt="Installed Part"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setCompletionPhotoUrl(null)}
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          backgroundColor: 'rgba(255, 68, 68, 0.8)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => completionFileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        height: '90px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: 'rgba(20,29,47,0.2)',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <Camera size={24} color="var(--accent-orange)" style={{ marginBottom: '0.25rem' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Add Installed Part Photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={completionFileInputRef}
                    onChange={handleCompletionFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    marginTop: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Camera size={12} color="var(--accent-orange)" />
                      <span>Click to select file</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateCompletionPhoto();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-orange)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      Use Mock Photo
                    </button>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Remarks / Description of Work Done</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Describe work done..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setShowCompletionModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleCompleteBacklog} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
