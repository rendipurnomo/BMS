import React, { useState, useEffect } from 'react';
import { backlogService, workOrderService, userService, unitService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Wrench,
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders,
  Calendar,
  AlertCircle,
  Truck,
  Plus,
  Database,
  Search
} from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

import { useToast } from '../context/ToastContext';

export const PlannerView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'approved' | 'wos'>('approved');
  const [selectedBacklog, setSelectedBacklog] = useState<any | null>(null);
  const [selectedWo, setSelectedWo] = useState<any | null>(null);

  // Backup Modal States
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  // Create WO Form States
  const [showWoModal, setShowWoModal] = useState(false);
  const [woNumber, setWoNumber] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [installationPlan, setInstallationPlan] = useState('');
  const [estimatedFullSupply, setEstimatedFullSupply] = useState('');

  // WO Filter States
  const [woSearchQuery, setWoSearchQuery] = useState('');
  const [woProgressFilter, setWoProgressFilter] = useState<'ALL' | 'IN_PROGRESS' | 'FULL_SUPPLY'>('ALL');

  // Pagination States
  const [backlogsPage, setBacklogsPage] = useState(1);
  const [wosPage, setWosPage] = useState(1);
  const itemsPerPage = 10;

  // Update Ordering States
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [woParts, setWoParts] = useState<any[]>([]);

  const handleExportBackup = async (format: 'csv' | 'sql' | 'json') => {
    setIsBackupLoading(true);
    try {
      // Fetch all tables
      const [usersRes, unitsRes, backlogsRes, wosRes] = await Promise.all([
        userService.list(1, 10000).catch(() => ({ users: [] })),
        unitService.list(1, 10000).catch(() => ({ units: [] })),
        backlogService.list(1, 10000).catch(() => ({ backlogs: [] })),
        workOrderService.list(1, 10000).catch(() => ({ workOrders: [] }))
      ]);

      const users = usersRes.users || (Array.isArray(usersRes) ? usersRes : []);
      const units = unitsRes.units || (Array.isArray(unitsRes) ? unitsRes : []);
      const backlogs = backlogsRes.backlogs || (Array.isArray(backlogsRes) ? backlogsRes : []);
      const wos = wosRes.workOrders || (Array.isArray(wosRes) ? wosRes : []);

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        const jsonString = JSON.stringify({ users, units, backlogs, workOrders: wos }, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bms_backup_${timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Fetch parts for all backlogs in parallel
        const partsPromises = backlogs.map((bl: any) => 
          backlogService.getParts(bl._id).catch(() => ({ parts: [] }))
        );
        const partsResults = await Promise.all(partsPromises);
        
        const headers = [
          'Backlog No',
          'Status',
          'Unit Code',
          'Priority',
          'Hourmeter',
          'Object Down',
          'Damage Type',
          'Description',
          'Site',
          'Section',
          'Parts Required',
          'WO Number',
          'WO Target Date',
          'WO Est Full Supply',
          'WO Ordering Progress',
          'Created At'
        ];

        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return '';
          let str = String(val);
          str = str.replace(/"/g, '""');
          return `"${str}"`;
        };

        const csvRows = [headers.join(',')];

        backlogs.forEach((bl: any, index: number) => {
          const associatedWo = wos.find((w: any) => w.backlogId === bl._id);
          const unit = units.find((u: any) => u._id === bl.unitId);
          const unitCode = bl.unitCode || unit?.unitCode || 'N/A';

          const partsList = partsResults[index]?.parts || [];
          const partsStr = partsList
            .map((p: any) => `${p.partName} (${p.partNumber}) x${p.qty}`)
            .join('; ');

          const row = [
            escapeCSV(bl.backlogNo),
            escapeCSV(bl.status),
            escapeCSV(unitCode),
            escapeCSV(bl.priority),
            escapeCSV(bl.hourmeter),
            escapeCSV(bl.objectDown),
            escapeCSV(bl.damageType),
            escapeCSV(bl.description),
            escapeCSV(bl.site),
            escapeCSV(bl.section),
            escapeCSV(partsStr),
            escapeCSV(associatedWo?.woNumber || ''),
            escapeCSV(associatedWo?.targetDate ? new Date(associatedWo.targetDate).toLocaleDateString() : ''),
            escapeCSV(associatedWo?.estimatedFullSupply ? new Date(associatedWo.estimatedFullSupply).toLocaleDateString() : ''),
            escapeCSV(associatedWo?.orderingProgress !== undefined ? `${associatedWo.orderingProgress}%` : ''),
            escapeCSV(bl.createdAt ? new Date(bl.createdAt).toLocaleString() : '')
          ];
          csvRows.push(row.join(','));
        });

        // Add UTF-8 BOM so Excel opens it with proper formatting
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bms_backlogs_report_${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'sql') {
        const escapeSQL = (val: any) => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? '1' : '0';
          if (typeof val === 'number') return String(val);
          const str = String(val).replace(/'/g, "''");
          return `'${str}'`;
        };

        let sql = `-- BMS Backup SQL Dump\n`;
        sql += `-- Generated on ${new Date().toISOString()}\n\n`;
        sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        // 1. Users Table
        sql += `-- Table structure and inserts for users\n`;
        sql += `CREATE TABLE IF NOT EXISTS \`users\` (\n`;
        sql += `  \`_id\` varchar(24) NOT NULL,\n`;
        sql += `  \`nrp\` varchar(255) NOT NULL UNIQUE,\n`;
        sql += `  \`name\` varchar(255) NOT NULL,\n`;
        sql += `  \`password\` varchar(255) NOT NULL,\n`;
        sql += `  \`role\` varchar(255) NOT NULL,\n`;
        sql += `  \`site\` varchar(255) NOT NULL,\n`;
        sql += `  \`section\` varchar(255) NOT NULL,\n`;
        sql += `  \`isActive\` tinyint(1) NOT NULL DEFAULT '1',\n`;
        sql += `  \`createdAt\` datetime NOT NULL,\n`;
        sql += `  \`updatedAt\` datetime NOT NULL,\n`;
        sql += `  PRIMARY KEY (\`_id\`)\n`;
        sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

        if (users.length > 0) {
          sql += `INSERT INTO \`users\` (\`_id\`, \`nrp\`, \`name\`, \`password\`, \`role\`, \`site\`, \`section\`, \`isActive\`, \`createdAt\`, \`updatedAt\`) VALUES\n`;
          sql += users.map((u: any) => `  (${escapeSQL(u._id)}, ${escapeSQL(u.nrp)}, ${escapeSQL(u.name)}, ${escapeSQL(u.password)}, ${escapeSQL(u.role)}, ${escapeSQL(u.site)}, ${escapeSQL(u.section)}, ${u.isActive ? 1 : 0}, ${escapeSQL(u.createdAt)}, ${escapeSQL(u.updatedAt)})`).join(',\n') + ';\n\n';
        }

        // 2. Units Table
        sql += `-- Table structure and inserts for units\n`;
        sql += `CREATE TABLE IF NOT EXISTS \`units\` (\n`;
        sql += `  \`_id\` varchar(24) NOT NULL,\n`;
        sql += `  \`unitCode\` varchar(255) NOT NULL,\n`;
        sql += `  \`unitModel\` varchar(255) NOT NULL,\n`;
        sql += `  \`site\` varchar(255) NOT NULL,\n`;
        sql += `  \`section\` varchar(255) NOT NULL,\n`;
        sql += `  \`isActive\` tinyint(1) NOT NULL DEFAULT '1',\n`;
        sql += `  \`createdAt\` datetime NOT NULL,\n`;
        sql += `  \`updatedAt\` datetime NOT NULL,\n`;
        sql += `  PRIMARY KEY (\`_id\`)\n`;
        sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

        if (units.length > 0) {
          sql += `INSERT INTO \`units\` (\`_id\`, \`unitCode\`, \`unitModel\`, \`site\`, \`section\`, \`isActive\`, \`createdAt\`, \`updatedAt\`) VALUES\n`;
          sql += units.map((u: any) => `  (${escapeSQL(u._id)}, ${escapeSQL(u.unitCode)}, ${escapeSQL(u.unitModel)}, ${escapeSQL(u.site)}, ${escapeSQL(u.section)}, ${u.isActive ? 1 : 0}, ${escapeSQL(u.createdAt)}, ${escapeSQL(u.updatedAt)})`).join(',\n') + ';\n\n';
        }

        // 3. Backlogs Table
        sql += `-- Table structure and inserts for backlogs\n`;
        sql += `CREATE TABLE IF NOT EXISTS \`backlogs\` (\n`;
        sql += `  \`_id\` varchar(24) NOT NULL,\n`;
        sql += `  \`backlogNo\` varchar(255) NOT NULL UNIQUE,\n`;
        sql += `  \`unitId\` varchar(24) NOT NULL,\n`;
        sql += `  \`site\` varchar(255) NOT NULL,\n`;
        sql += `  \`section\` varchar(255) NOT NULL,\n`;
        sql += `  \`hourmeter\` int(11) NOT NULL,\n`;
        sql += `  \`objectDown\` varchar(255) NOT NULL,\n`;
        sql += `  \`priority\` varchar(255) NOT NULL,\n`;
        sql += `  \`damageType\` varchar(255) NOT NULL,\n`;
        sql += `  \`description\` text NOT NULL,\n`;
        sql += `  \`status\` varchar(255) NOT NULL,\n`;
        sql += `  \`createdBy\` varchar(24) NOT NULL,\n`;
        sql += `  \`isActive\` tinyint(1) NOT NULL DEFAULT '1',\n`;
        sql += `  \`createdAt\` datetime NOT NULL,\n`;
        sql += `  \`updatedAt\` datetime NOT NULL,\n`;
        sql += `  PRIMARY KEY (\`_id\`)\n`;
        sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

        if (backlogs.length > 0) {
          sql += `INSERT INTO \`backlogs\` (\`_id\`, \`backlogNo\`, \`unitId\`, \`site\`, \`section\`, \`hourmeter\`, \`objectDown\`, \`priority\`, \`damageType\`, \`description\`, \`status\`, \`createdBy\`, \`isActive\`, \`createdAt\`, \`updatedAt\`) VALUES\n`;
          sql += backlogs.map((b: any) => `  (${escapeSQL(b._id)}, ${escapeSQL(b.backlogNo)}, ${escapeSQL(b.unitId)}, ${escapeSQL(b.site)}, ${escapeSQL(b.section)}, ${b.hourmeter}, ${escapeSQL(b.objectDown)}, ${escapeSQL(b.priority)}, ${escapeSQL(b.damageType)}, ${escapeSQL(b.description)}, ${escapeSQL(b.status)}, ${escapeSQL(b.createdBy)}, ${b.isActive ? 1 : 0}, ${escapeSQL(b.createdAt)}, ${escapeSQL(b.updatedAt)})`).join(',\n') + ';\n\n';
        }

        // 4. Work Orders Table
        sql += `-- Table structure and inserts for work_orders\n`;
        sql += `CREATE TABLE IF NOT EXISTS \`work_orders\` (\n`;
        sql += `  \`_id\` varchar(24) NOT NULL,\n`;
        sql += `  \`backlogId\` varchar(24) NOT NULL,\n`;
        sql += `  \`woNumber\` varchar(255) NOT NULL,\n`;
        sql += `  \`targetDate\` datetime NOT NULL,\n`;
        sql += `  \`installationPlan\` text NOT NULL,\n`;
        sql += `  \`estimatedFullSupply\` datetime NOT NULL,\n`;
        sql += `  \`orderingProgress\` int(11) NOT NULL DEFAULT '0',\n`;
        sql += `  \`isActive\` tinyint(1) NOT NULL DEFAULT '1',\n`;
        sql += `  \`createdAt\` datetime NOT NULL,\n`;
        sql += `  \`updatedAt\` datetime NOT NULL,\n`;
        sql += `  PRIMARY KEY (\`_id\`)\n`;
        sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

        if (wos.length > 0) {
          sql += `INSERT INTO \`work_orders\` (\`_id\`, \`backlogId\`, \`woNumber\`, \`targetDate\`, \`installationPlan\`, \`estimatedFullSupply\`, \`orderingProgress\`, \`isActive\`, \`createdAt\`, \`updatedAt\`) VALUES\n`;
          sql += wos.map((w: any) => `  (${escapeSQL(w._id)}, ${escapeSQL(w.backlogId)}, ${escapeSQL(w.woNumber)}, ${escapeSQL(w.targetDate)}, ${escapeSQL(w.installationPlan)}, ${escapeSQL(w.estimatedFullSupply)}, ${w.orderingProgress}, ${w.isActive ? 1 : 0}, ${escapeSQL(w.createdAt)}, ${escapeSQL(w.updatedAt)})`).join(',\n') + ';\n\n';
        }

        sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bms_database_dump_${timestamp}.sql`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success('Database backup SQL generated and downloaded successfully!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate backup: ' + (err.message || err));
    } finally {
      setIsBackupLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [backlogData, woData] = await Promise.all([
        backlogService.list(1, 100),
        workOrderService.list(1, 100)
      ]);
      setBacklogs(backlogData.backlogs || []);
      setWorkOrders(woData.workOrders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateWo = (backlog: any) => {
    setSelectedBacklog(backlog);
    setWoNumber('');
    setTargetDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 7 days from now
    setEstimatedFullSupply(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 4 days from now
    setInstallationPlan('');
    setShowWoModal(true);
  };

  const handleCreateWoSubmit = async () => {
    if (!selectedBacklog || !woNumber || !targetDate || !installationPlan || !estimatedFullSupply) {
      toast.warning('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await workOrderService.create({
        backlogId: selectedBacklog._id,
        woNumber: woNumber.trim(),
        targetDate: new Date(targetDate),
        installationPlan,
        estimatedFullSupply: new Date(estimatedFullSupply)
      });
      toast.success(`Work Order ${woNumber.trim()} created successfully!`);
      setShowWoModal(false);
      setSelectedBacklog(null);
      await fetchData();
      setActiveSubTab('wos');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create Work Order');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWoDetails = async (wo: any) => {
    setSelectedWo(wo);
    setSliderVal(wo.orderingProgress);
    try {
      const partsData = await backlogService.getParts(wo.backlogId);
      setWoParts(partsData?.parts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedWo) return;
    setLoading(true);
    try {
      // 1. Update ordering progress in WO
      const updatedData = await workOrderService.updateOrdering(selectedWo._id, sliderVal);
      const updated = updatedData?.workOrder || updatedData;
      
      // 2. Mock updating parts supply count in DB matching the progress
      // If progress is 100%, set all parts supplyQty to their full quantity.
      for (const part of woParts) {
        const supplyQty = sliderVal === 100 ? part.qty : Math.floor(part.qty * (sliderVal / 100));
        await backlogService.addPart(selectedWo.backlogId, {
          _id: part._id,
          partName: part.partName,
          partNumber: part.partNumber,
          qty: part.qty,
          supplyQty: supplyQty
        });
      }

      // If progress is 100%, trigger Full Supply transition
      if (sliderVal === 100) {
        await workOrderService.setFullSupply(selectedWo._id);
      }

      // Refresh data
      await handleOpenWoDetails(updated);
      fetchData();
      toast.success('Ordering progress and parts list updated successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update ordering progress');
    } finally {
      setLoading(false);
    }
  };

  // Filter approved backlogs that don't have work orders yet
  const approvedBacklogs = backlogs.filter(bl => 
    bl.status === 'APPROVED' && 
    !workOrders.some(wo => wo.backlogId === bl._id)
  );

  // Paginate approved backlogs
  const approvedTotalPages = Math.ceil(approvedBacklogs.length / itemsPerPage);
  const paginatedApproved = approvedBacklogs.slice((backlogsPage - 1) * itemsPerPage, backlogsPage * itemsPerPage);

  // Filter and paginate work orders
  const filteredWos = workOrders.filter(wo => {
    const matchingBl = backlogs.find(b => b._id === wo.backlogId);
    // Progress filter
    if (woProgressFilter === 'IN_PROGRESS' && wo.orderingProgress >= 100) return false;
    if (woProgressFilter === 'FULL_SUPPLY' && wo.orderingProgress < 100) return false;
    // Search filter
    if (woSearchQuery.trim()) {
      const q = woSearchQuery.toLowerCase();
      const woNum = (wo.woNumber || '').toLowerCase();
      const blNo = (matchingBl?.backlogNo || '').toLowerCase();
      const unitCode = (matchingBl?.unitCode || '').toLowerCase();
      if (!woNum.includes(q) && !blNo.includes(q) && !unitCode.includes(q)) return false;
    }
    return true;
  });
  const wosTotalPages = Math.ceil(filteredWos.length / itemsPerPage);
  const paginatedWos = filteredWos.slice((wosPage - 1) * itemsPerPage, wosPage * itemsPerPage);

  return (
    <div className="animate-fade">
      {/* Detail Panel Selector */}
      {!selectedWo ? (
        <div>
          {/* Header */}
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Planning & Work Orders</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scope: {user?.site} site</p>
            </div>
            
            {/* Toggle tabs and Backup */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowBackupModal(true)}
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <Database size={16} /> Backup Data
              </button>

              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
              }}>
                <button
                  onClick={() => setActiveSubTab('approved')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    backgroundColor: activeSubTab === 'approved' ? 'var(--accent-orange)' : 'transparent',
                    color: activeSubTab === 'approved' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Released Backlogs ({approvedBacklogs.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('wos')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    backgroundColor: activeSubTab === 'wos' ? 'var(--accent-orange)' : 'transparent',
                    color: activeSubTab === 'wos' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Work Orders ({workOrders.length})
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingTruck imageUrl={truckImg} text="Loading planning data..." />
            </div>
          ) : activeSubTab === 'approved' ? (
            /* Tab 1: Released Backlogs */
            approvedBacklogs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Layers size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <p style={{ color: 'var(--text-secondary)' }}>No newly approved backlogs waiting for planning.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {paginatedApproved.map(bl => (
                    <div
                      key={bl._id}
                      className="glass-card"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{bl.backlogNo}</span>
                          <span className="badge badge-approved">Approved</span>
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
                      <button
                        onClick={() => handleOpenCreateWo(bl)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <Plus size={16} /> Create WO
                      </button>
                    </div>
                  ))}
                </div>
                {approvedTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setBacklogsPage(p => Math.max(p - 1, 1))} disabled={backlogsPage === 1} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Previous</button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {backlogsPage} of {approvedTotalPages}</span>
                    <button type="button" className="btn btn-secondary" onClick={() => setBacklogsPage(p => Math.min(p + 1, approvedTotalPages))} disabled={backlogsPage === approvedTotalPages} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Next</button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Tab 2: Work Orders List */
            <div>
              {/* WO Filters */}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'IN_PROGRESS', label: 'In Progress' },
                    { key: 'FULL_SUPPLY', label: 'Full Supply' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setWoProgressFilter(tab.key as any); setWosPage(1); }}
                      style={{
                        padding: '0.4rem 0.85rem',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: woProgressFilter === tab.key ? 'var(--accent-orange)' : 'transparent',
                        color: woProgressFilter === tab.key ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: '260px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search WO, unit, backlog..."
                    value={woSearchQuery}
                    onChange={(e) => { setWoSearchQuery(e.target.value); setWosPage(1); }}
                    style={{ paddingLeft: '2.25rem', height: '34px', fontSize: '0.85rem', marginBottom: 0 }}
                  />
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {filteredWos.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No Work Orders found matching filters.</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paginatedWos.map(wo => {
                      const matchingBl = backlogs.find(b => b._id === wo.backlogId);
                      return (
                        <div
                          key={wo._id}
                          className="glass-card"
                          onClick={() => handleOpenWoDetails(wo)}
                          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-orange)' }}>
                                {wo.woNumber}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Backlog: {matchingBl?.backlogNo || 'N/A'}
                              </span>
                              {matchingBl && (
                                <span className={`badge badge-${matchingBl.status.toLowerCase()}`}>
                                  {matchingBl.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                              <span>Unit: <strong style={{ color: '#fff' }}>{matchingBl?.unitCode || 'N/A'}</strong></span>
                              <span>Target Date: <strong>{new Date(wo.targetDate).toLocaleDateString()}</strong></span>
                            </div>
                            {/* Progress Bar */}
                            <div style={{ width: '220px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${wo.orderingProgress}%`, height: '100%', backgroundColor: wo.orderingProgress === 100 ? 'var(--accent-green)' : 'var(--accent-orange)' }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{wo.orderingProgress}% Supply</span>
                            </div>
                          </div>
                          <ArrowRight size={20} color="var(--text-muted)" />
                        </div>
                      );
                    })}
                  </div>
                  {wosTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setWosPage(p => Math.max(p - 1, 1))} disabled={wosPage === 1} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Previous</button>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {wosPage} of {wosTotalPages}</span>
                      <button type="button" className="btn btn-secondary" onClick={() => setWosPage(p => Math.min(p + 1, wosTotalPages))} disabled={wosPage === wosTotalPages} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Next</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create WO Modal */}
          {showWoModal && selectedBacklog && (
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
                maxWidth: '460px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
              }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench color="var(--accent-orange)" /> Create Work Order
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Assigning Work Order for Backlog: <strong>{selectedBacklog.backlogNo}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Work Order (WO) Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. WO-2026-9021"
                    value={woNumber}
                    onChange={(e) => setWoNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Plan Target Date</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Full Supply Date</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={estimatedFullSupply}
                      onChange={(e) => setEstimatedFullSupply(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Installation / Work Description Plan</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Describe how the installation is planned (manpower, tooling etc.)"
                    value={installationPlan}
                    onChange={(e) => setInstallationPlan(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowWoModal(false); setSelectedBacklog(null); }}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateWoSubmit} disabled={loading}>
                    {loading ? 'Creating...' : 'Create WO'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 3. WORK ORDER DETAIL PANEL */
        <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setSelectedWo(null)} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
            Back to Planning
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            {/* Left Box */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
                  Work Order: {selectedWo.woNumber}
                </h3>
                <span className="badge badge-planning">PLANNED</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Installation Date</span>
                  <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    {new Date(selectedWo.targetDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Est Full Supply Date</span>
                  <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    {new Date(selectedWo.estimatedFullSupply).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Installation Plan Details</span>
                <p style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                  {selectedWo.installationPlan}
                </p>
              </div>

              {/* Toggle buttons for updating progress */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={18} /> Update Ordering Progress
                </h4>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button 
                    type="button"
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      backgroundColor: sliderVal > 0 && sliderVal < 100 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      opacity: sliderVal > 0 && sliderVal < 100 ? 1 : 0.6,
                      fontWeight: 600,
                      padding: '0.75rem'
                    }} 
                    onClick={() => setSliderVal(30)}
                  >
                    Ordering Part
                  </button>
                  <button 
                    type="button"
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      backgroundColor: sliderVal === 100 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      opacity: sliderVal === 100 ? 1 : 0.6,
                      fontWeight: 600,
                      padding: '0.75rem'
                    }} 
                    onClick={() => setSliderVal(100)}
                  >
                    Full Supply
                  </button>
                </div>

                <button onClick={handleUpdateProgress} className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  <TrendingUp size={18} /> Save Progress & Sync Parts
                </button>
              </div>
            </div>

            {/* Right Box (Parts Supply List) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={18} /> Parts Supply Tracker
                </h4>
                {woParts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No parts listed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {woParts.map(part => {
                      const percentage = Math.round((part.supplyQty / part.qty) * 100);
                      return (
                        <div key={part._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem', fontSize: '0.85rem' }}>
                          <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600 }}>{part.partName}</span>
                            <span style={{ color: part.supplyQty >= part.qty ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                              {part.supplyQty} / {part.qty}
                            </span>
                          </div>
                          {/* Part mini progress bar */}
                          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: percentage === 100 ? 'var(--accent-green)' : 'var(--accent-orange)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <AlertCircle size={20} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                  Updating the progress updates the spare parts supply count automatically. Once progress hits 100%, status will transition to <strong>FULL SUPPLY</strong> notifying the Mechanic.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Data Modal */}
      {showBackupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database color="var(--accent-orange)" /> System Data Backup
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Export system tables (Users, Units, Backlogs, and Work Orders) to protect and restore data. Choose your preferred backup format below:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <button
                onClick={() => handleExportBackup('csv')}
                disabled={isBackupLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(255, 115, 0, 0.05)',
                  border: '1px solid rgba(255, 115, 0, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 115, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent-orange)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 115, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 115, 0, 0.2)';
                }}
              >
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Excel Spreadsheet (CSV)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Ideal for reporting and viewing backlogs data in MS Excel.
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)' }}>.CSV</span>
              </button>

              <button
                onClick={() => handleExportBackup('sql')}
                disabled={isBackupLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(0, 168, 204, 0.05)',
                  border: '1px solid rgba(0, 168, 204, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 168, 204, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 168, 204, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 168, 204, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0, 168, 204, 0.2)';
                }}
              >
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>MySQL Dump Script (SQL)</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Contains structured CREATE TABLE & INSERT statements to import into MySQL.
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(0, 168, 204, 1)' }}>.SQL</span>
              </button>

              <button
                onClick={() => handleExportBackup('json')}
                disabled={isBackupLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Consolidated JSON Dump</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Raw JSON representation of all data collections.
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>.JSON</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
                onClick={() => setShowBackupModal(false)}
                disabled={isBackupLoading}
              >
                {isBackupLoading ? 'Exporting...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
