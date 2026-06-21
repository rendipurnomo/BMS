import React, { useState, useEffect } from 'react';
import { userService, unitService, backlogService, workOrderService } from '../services/api';
import {
  Users,
  HardDrive,
  Plus,
  Edit,
  Trash2,
  Lock,
  UserCheck,
  Building,
  FileCode,
  Tag,
  Database
} from 'lucide-react';
import LoadingTruck from './LoadingTruck';
import truckImg from '../assets/truck.png';

interface AdminViewProps {
  initialTab?: 'users' | 'units';
}

import { useToast } from '../context/ToastContext';

export const AdminView: React.FC<AdminViewProps> = ({ initialTab }) => {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'units'>(initialTab || 'users');

  // Backup Modal States
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // User Form States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nrp, setNrp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PLANNER' | 'GL' | 'MEKANIK'>('MEKANIK');
  const [site, setSite] = useState('TAA');
  const [section, setSection] = useState<'WHEEL' | 'TRACK' | 'SUPPORT'>('TRACK');

  // Unit Form States
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [unitModel, setUnitModel] = useState('');
  const [unitSite, setUnitSite] = useState('TAA');
  const [unitSection, setUnitSection] = useState('TRACK');

  // Pagination States
  const [usersPage, setUsersPage] = useState(1);
  const [unitsPage, setUnitsPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchUsers = async () => {
    try {
      const data = await userService.list(1, 100);
      setUsers(data.users || data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await unitService.list(1, 100);
      setUnits(data.units || data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchUnits()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // User Actions
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setNrp('');
    setName('');
    setPassword('');
    setRole('MEKANIK');
    setSite('TAA');
    setSection('TRACK');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUserId(u._id);
    setNrp(u.nrp);
    setName(u.name);
    setPassword(''); // Leave password empty unless updating
    setRole(u.role);
    setSite(u.site);
    setSection(u.section);
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrp || !name || (!editingUserId && !password)) {
      toast.warning('NRP, Name and Password are required');
      return;
    }

    setLoading(true);
    try {
      if (editingUserId) {
        // Update user
        const payload: any = { nrp, name, role, site: site.trim().toUpperCase(), section };
        if (password) payload.password = password;
        await userService.update(editingUserId, payload);
        toast.success(`User ${name} updated successfully!`);
      } else {
        // Create user
        await userService.create({ nrp, name, password, role, site: site.trim().toUpperCase(), section });
        toast.success(`User ${name} created successfully!`);
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to save user account';
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const details = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errMsg}: ${details}`);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    setLoading(true);
    try {
      await userService.delete(id);
      toast.success('User deactivated successfully.');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Unit Actions
  const handleOpenCreateUnit = () => {
    setEditingUnitId(null);
    setUnitCode('');
    setUnitModel('');
    setUnitSite('TAA');
    setUnitSection('TRACK');
    setShowUnitModal(true);
  };

  const handleOpenEditUnit = (u: any) => {
    setEditingUnitId(u._id);
    setUnitCode(u.unitCode);
    setUnitModel(u.unitModel);
    setUnitSite(u.site);
    setUnitSection(u.section);
    setShowUnitModal(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode || !unitModel || !unitSite || !unitSection) {
      toast.warning('All unit details are required');
      return;
    }

    setLoading(true);
    try {
      if (editingUnitId) {
        await unitService.update(editingUnitId, { unitCode: unitCode.trim(), unitModel: unitModel.trim(), site: unitSite.trim().toUpperCase(), section: unitSection });
        toast.success(`Unit ${unitCode.trim()} updated successfully!`);
      } else {
        await unitService.create({ unitCode: unitCode.trim(), unitModel: unitModel.trim(), site: unitSite.trim().toUpperCase(), section: unitSection });
        toast.success(`Unit ${unitCode.trim()} registered successfully!`);
      }
      setShowUnitModal(false);
      fetchUnits();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to save unit';
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const details = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errMsg}: ${details}`);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete/deactivate this unit?')) return;
    setLoading(true);
    try {
      await unitService.delete(id);
      toast.success('Unit deactivated successfully.');
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      {/* Tab Selectors */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Administration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure users and machinery assets</p>
        </div>

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
              onClick={() => setActiveSubTab('users')}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: activeSubTab === 'users' ? 'var(--accent-orange)' : 'transparent',
                color: activeSubTab === 'users' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Users size={16} /> User Accounts
            </button>
            <button
              onClick={() => setActiveSubTab('units')}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: activeSubTab === 'units' ? 'var(--accent-orange)' : 'transparent',
                color: activeSubTab === 'units' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <HardDrive size={16} /> Machinery Units
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <LoadingTruck imageUrl={truckImg} text="Loading administrative data..." />
        </div>
      ) : activeSubTab === 'users' ? (
        /* USERS SUBTAB */
        <div>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active User Accounts</h3>
            <button className="btn btn-primary" onClick={handleOpenCreateUser} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add User
            </button>
          </div>

          <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>NRP</th>
                  <th style={{ padding: '1rem' }}>Full Name</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Site Scope</th>
                  <th style={{ padding: '1rem' }}>Section</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage).map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{u.nrp}</td>
                    <td style={{ padding: '1rem' }}>{u.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255,115,0,0.15)',
                        color: 'var(--accent-orange)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{u.site}</td>
                    <td style={{ padding: '1rem' }}>{u.section}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleOpenEditUser(u)} style={{ padding: '4px 8px' }}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(u._id)} style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Math.ceil(users.length / itemsPerPage) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setUsersPage(p => Math.max(p - 1, 1))} disabled={usersPage === 1} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Previous</button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {usersPage} of {Math.ceil(users.length / itemsPerPage)}</span>
              <button type="button" className="btn btn-secondary" onClick={() => setUsersPage(p => Math.min(p + 1, Math.ceil(users.length / itemsPerPage)))} disabled={usersPage === Math.ceil(users.length / itemsPerPage)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Next</button>
            </div>
          )}
        </div>
      ) : (
        /* UNITS SUBTAB */
        <div>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Machinery Units Catalog</h3>
            <button className="btn btn-primary" onClick={handleOpenCreateUnit} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Unit
            </button>
          </div>

          <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Unit Code</th>
                  <th style={{ padding: '1rem' }}>Model</th>
                  <th style={{ padding: '1rem' }}>Site</th>
                  <th style={{ padding: '1rem' }}>Section Area</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.slice((unitsPage - 1) * itemsPerPage, unitsPage * itemsPerPage).map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{u.unitCode}</td>
                    <td style={{ padding: '1rem' }}>{u.unitModel}</td>
                    <td style={{ padding: '1rem' }}>{u.site}</td>
                    <td style={{ padding: '1rem' }}>{u.section}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleOpenEditUnit(u)} style={{ padding: '4px 8px' }}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteUnit(u._id)} style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Math.ceil(units.length / itemsPerPage) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setUnitsPage(p => Math.max(p - 1, 1))} disabled={unitsPage === 1} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Previous</button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {unitsPage} of {Math.ceil(units.length / itemsPerPage)}</span>
              <button type="button" className="btn btn-secondary" onClick={() => setUnitsPage(p => Math.min(p + 1, Math.ceil(units.length / itemsPerPage)))} disabled={unitsPage === Math.ceil(units.length / itemsPerPage)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* User Add/Edit Modal */}
      {showUserModal && (
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
          <form onSubmit={handleUserSubmit} className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck color="var(--accent-orange)" /> {editingUserId ? 'Edit User Account' : 'Add User Account'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">NRP Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={nrp}
                    onChange={(e) => setNrp(e.target.value)}
                    disabled={!!editingUserId}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password {editingUserId && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Leave empty to keep current)</span>}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e: any) => setRole(e.target.value)}>
                <option value="MEKANIK">MEKANIK (Mechanic)</option>
                <option value="GL">GL (Group Leader)</option>
                <option value="PLANNER">PLANNER (Planning Team)</option>
                <option value="ADMIN">ADMIN (System Admin)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Site</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={site}
                    onChange={(e) => setSite(e.target.value.toUpperCase())}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Building size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Section Area</label>
                <select className="form-select" value={section} onChange={(e: any) => setSection(e.target.value)}>
                  <option value="TRACK">TRACK (Track units)</option>
                  <option value="WHEEL">WHEEL (Wheel loaders/trucks)</option>
                  <option value="SUPPORT">SUPPORT (Others)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowUserModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unit Add/Edit Modal */}
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
          <form onSubmit={handleUnitSubmit} className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive color="var(--accent-orange)" /> {editingUnitId ? 'Edit Machinery Unit' : 'Add Machinery Unit'}
            </h3>

            <div className="form-group">
              <label className="form-label">Unit Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. EX3600-6"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <FileCode size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Model Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. EX3600"
                  value={unitModel}
                  onChange={(e) => setUnitModel(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Tag size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Site</label>
                <input
                  type="text"
                  className="form-input"
                  value={unitSite}
                  onChange={(e) => setUnitSite(e.target.value.toUpperCase())}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Section Area</label>
                <select className="form-select" value={unitSection} onChange={(e: any) => setUnitSection(e.target.value)}>
                  <option value="TRACK">TRACK (Track units)</option>
                  <option value="WHEEL">WHEEL (Wheel loaders/trucks)</option>
                  <option value="SUPPORT">SUPPORT (Others)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowUnitModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Unit'}
              </button>
            </div>
          </form>
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
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            border: '1px solid var(--border-color)',
            textAlign: 'left',
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database color="var(--accent-orange)" /> System Data Backup
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Export system tables (Users, Units, Backlogs, and Work Orders) to protect and restore data. Choose your preferred backup format below:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <button
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
