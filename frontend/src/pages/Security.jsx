import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/Security.css';
import ConfirmModal from '../components/ConfirmModal';

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CFG = {
    super_user: { label: 'Super User', color: '#3b82f6', bg: 'rgba(59,130,246,0.13)', border: 'rgba(59,130,246,0.35)' },
    admin:      { label: 'Admin',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.35)' },
    user:       { label: 'User',       color: '#10b981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.35)' },
};

const ROLE_TABS = [
    { key: 'super_user', label: 'Super User' },
    { key: 'admin',      label: 'Admin' },
    { key: 'user',       label: 'User' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

const RoleIcon = ({ role, color, bg }) => {
    const style = { background: bg, color };
    if (role === 'super_user') return (
        <div className="sg-role-icon" style={style}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z"/>
            </svg>
        </div>
    );
    if (role === 'admin') return (
        <div className="sg-role-icon" style={style}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
        </div>
    );
    return (
        <div className="sg-role-icon" style={style}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
        </div>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Convert flat RLS array → dataset blocks grouped by table
const rlsToBlocks = (flatRLS) => {
    if (!flatRLS || flatRLS.length === 0) return [mkRLSBlock()];
    const map = {};
    flatRLS.forEach(r => {
        if (!map[r.table_name]) map[r.table_name] = [];
        map[r.table_name].push({ column_name: r.column_name, condition: r.condition || '' });
    });
    return Object.entries(map).map(([table_name, rules]) => ({ _id: Math.random(), table_name, rules }));
};

// Convert flat CLS array → dataset blocks grouped by table
const clsToBlocks = (flatCLS) => {
    if (!flatCLS || flatCLS.length === 0) return [mkCLSBlock()];
    const map = {};
    flatCLS.forEach(c => {
        if (!map[c.table_name]) map[c.table_name] = [];
        map[c.table_name].push({ column_name: c.column_name, is_masked: c.is_masked || false });
    });
    return Object.entries(map).map(([table_name, rules]) => ({ _id: Math.random(), table_name, rules }));
};

// Flatten dataset blocks back to flat array for API
const flattenRLS = (blocks) =>
    blocks.flatMap(b => b.rules
        .filter(r => r.column_name)
        .map(r => ({ table_name: b.table_name, column_name: r.column_name, condition: r.condition })));

const flattenCLS = (blocks) =>
    blocks.flatMap(b => b.rules
        .filter(c => c.column_name)
        .map(c => ({ table_name: b.table_name, column_name: c.column_name, is_masked: c.is_masked })));

const mkRLSBlock = () => ({ _id: Math.random(), table_name: '', rules: [{ column_name: '', condition: '' }] });
const mkCLSBlock = () => ({ _id: Math.random(), table_name: '', rules: [{ column_name: '', is_masked: false }] });
const EMPTY_SCOPE = () => ({ regions: [], domains: [], subdomains: [], business_units: [] });

// ── Modal wrapper ─────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children }) => (
    <div className="sg-modal-overlay" onClick={onClose}>
        <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
                <h3>{title}</h3>
                <button className="sg-modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="sg-modal-body">{children}</div>
        </div>
    </div>
);

// ── Group card ────────────────────────────────────────────────────────────────

const GroupCard = ({ group: g, expanded, onToggle, onEdit, onClone, onDelete }) => {
    const rc = ROLE_CFG[g.role] || ROLE_CFG['user'];
    const regions = Array.isArray(g.scope?.regions) ? g.scope.regions : [];
    const bus     = Array.isArray(g.scope?.business_units) ? g.scope.business_units : [];
    const domains = Array.isArray(g.scope?.domains) ? g.scope.domains : [];
    const subs    = Array.isArray(g.scope?.subdomains) ? g.scope.subdomains : [];

    return (
        <div className={`sg-card${expanded ? ' sg-card--open' : ''}`} style={{ borderColor: expanded ? rc.border : '' }}>

            {/* Header */}
            <div className="sg-card-header" onClick={onToggle}>
                <RoleIcon role={g.role} color={rc.color} bg={rc.bg} />
                <div className="sg-card-info">
                    <div className="sg-card-name">{g.name}</div>
                    {g.description
                        ? <div className="sg-card-desc">{g.description}</div>
                        : <div className="sg-card-badges">
                            <span className="sg-pill rls">{g.rls.length} RLS</span>
                            <span className="sg-pill cls">{g.cls.length} CLS</span>
                            {regions.length > 0 && <span className="sg-pill scope">{regions.length} region{regions.length > 1 ? 's' : ''}</span>}
                          </div>
                    }
                    {g.updated_at && (
                        <div className="sg-card-date">Updated {fmtDate(g.updated_at)}</div>
                    )}
                </div>
                <div className="sg-card-right">
                    <div className="sg-hdr-actions" onClick={e => e.stopPropagation()}>
                        <button className="sg-icon-btn" onClick={onClone} title="Clone group">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                            </svg>
                        </button>
                        <button className="sg-icon-btn" onClick={onEdit} title="Edit">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                        </button>
                        <button className="sg-icon-btn danger" onClick={onDelete} title="Delete">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <span className="sg-chevron-icon" style={{ color: rc.color }}>
                        {expanded ? '∧' : '∨'}
                    </span>
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div className="sg-card-body">

                    {/* ROW LEVEL SECURITY — grouped by table */}
                    <div className="sg-sec-block">
                        <div className="sg-sec-label" style={{ '--sec-color': rc.color }}>
                            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-6.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                            </svg>
                            ROW LEVEL SECURITY
                            <span className="sg-sec-count">{g.rls.length}</span>
                        </div>
                        {g.rls.length === 0
                            ? <p className="sg-hint">No RLS rules defined.</p>
                            : (() => {
                                // Group RLS by table for display
                                const map = {};
                                g.rls.forEach(r => {
                                    if (!map[r.table_name]) map[r.table_name] = [];
                                    map[r.table_name].push(r);
                                });
                                return Object.entries(map).map(([tbl, rows]) => (
                                    <div key={tbl} className="sg-display-block">
                                        <div className="sg-display-block-header" style={{ color: rc.color }}>
                                            <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                                                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"/>
                                            </svg>
                                            {tbl}
                                        </div>
                                        {rows.map(r => (
                                            <div key={r.id} className="sg-rule-card">
                                                <div className="sg-rls-field">
                                                    <span className="sg-rls-lbl">COLUMN</span>
                                                    <span className="sg-rls-val">{r.column_name}</span>
                                                </div>
                                                <div className="sg-rls-sep"/>
                                                <div className="sg-rls-field">
                                                    <span className="sg-rls-lbl">CONDITION</span>
                                                    <span className="sg-rls-val sg-condition" style={{ color: rc.color }}>
                                                        {r.condition || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ));
                              })()
                        }
                    </div>

                    {/* COLUMN LEVEL SECURITY — grouped by table */}
                    <div className="sg-sec-block">
                        <div className="sg-sec-label" style={{ '--sec-color': rc.color }}>
                            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                                <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h2v10H5V5zm4 0h2v10H9V5zm4 0h2v10h-2V5z"/>
                            </svg>
                            COLUMN LEVEL SECURITY
                            <span className="sg-sec-count">{g.cls.length}</span>
                        </div>
                        {g.cls.length === 0
                            ? <p className="sg-hint">No CLS rules defined.</p>
                            : (() => {
                                const map = {};
                                g.cls.forEach(c => {
                                    if (!map[c.table_name]) map[c.table_name] = [];
                                    map[c.table_name].push(c);
                                });
                                return Object.entries(map).map(([tbl, cols]) => (
                                    <div key={tbl} className="sg-display-block">
                                        <div className="sg-display-block-header" style={{ color: rc.color }}>
                                            <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                                                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"/>
                                            </svg>
                                            {tbl}
                                        </div>
                                        {cols.map(c => (
                                            <div key={c.id} className="sg-rule-card sg-cls-card">
                                                <div className="sg-cls-fields">
                                                    <div className="sg-cls-field">
                                                        <span className="sg-cls-lbl">COLUMN</span>
                                                        <span className="sg-cls-val">{c.column_name}</span>
                                                    </div>
                                                </div>
                                                {c.is_masked
                                                    ? <div className="sg-masked-pill">
                                                        MASKED
                                                        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                        </svg>
                                                      </div>
                                                    : <div className="sg-visible-pill">VISIBLE</div>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                ));
                              })()
                        }
                    </div>

                    {/* Scope summary */}
                    <div className="sg-scope-boxes">
                        <div className="sg-scope-box">
                            <div className="sg-scope-box-title">HIERARCHY</div>
                            <div className="sg-scope-row">
                                <span>Regions</span>
                                <strong>{regions.length ? regions.join(', ') : 'Global (All)'}</strong>
                            </div>
                            <div className="sg-scope-row">
                                <span>Domains</span>
                                <strong>{domains.length ? domains.join(', ') : '—'}</strong>
                            </div>
                        </div>
                        <div className="sg-scope-box">
                            <div className="sg-scope-box-title">BUSINESS</div>
                            <div className="sg-scope-row">
                                <span>Subdomains</span>
                                <strong>{subs.length ? subs.join(', ') : '—'}</strong>
                            </div>
                            <div className="sg-scope-row">
                                <span>Units</span>
                                <strong>{bus.length ? bus.join(', ') : '—'}</strong>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

// ── Dataset block — RLS ───────────────────────────────────────────────────────

const RLSDatasetBlock = ({ block, blockIdx, tableList, schema, onSetTable, onAddRule, onRemoveRule, onUpdateRule, onRemoveBlock, roleColor }) => (
    <div className="sg-dataset-block">
        <div className="sg-dataset-header">
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style={{ color: roleColor, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"/>
            </svg>
            <select
                className="sg-dataset-table-select"
                value={block.table_name}
                onChange={e => onSetTable(blockIdx, e.target.value)}
            >
                <option value="">— Select Dataset / Table —</option>
                {tableList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="sg-rm-btn" type="button" onClick={() => onRemoveBlock(blockIdx)} title="Remove dataset">✕</button>
        </div>

        {block.table_name && (
            <div className="sg-dataset-rules">
                {block.rules.map((r, ri) => (
                    <div key={ri} className="sg-dataset-rule-row">
                        <select
                            className="form-input"
                            value={r.column_name}
                            onChange={e => onUpdateRule(blockIdx, ri, 'column_name', e.target.value)}
                        >
                            <option value="">— Column —</option>
                            {(schema[block.table_name] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                            className="form-input"
                            placeholder="Condition (e.g. = 'APAC')"
                            value={r.condition}
                            onChange={e => onUpdateRule(blockIdx, ri, 'condition', e.target.value)}
                        />
                        <button className="sg-rm-btn" type="button" onClick={() => onRemoveRule(blockIdx, ri)} title="Remove rule">✕</button>
                    </div>
                ))}
                <div className="sg-dataset-footer">
                    <button className="sg-add-row-btn" type="button" onClick={() => onAddRule(blockIdx)}>
                        + Add Column Rule
                    </button>
                </div>
            </div>
        )}
        {!block.table_name && (
            <div className="sg-dataset-empty">Select a dataset above to add column rules.</div>
        )}
    </div>
);

// ── Dataset block — CLS ───────────────────────────────────────────────────────

const CLSDatasetBlock = ({ block, blockIdx, tableList, schema, onSetTable, onAddRule, onRemoveRule, onUpdateRule, onRemoveBlock, roleColor }) => (
    <div className="sg-dataset-block">
        <div className="sg-dataset-header">
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style={{ color: roleColor, flexShrink: 0 }}>
                <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h2v10H5V5zm4 0h2v10H9V5zm4 0h2v10h-2V5z"/>
            </svg>
            <select
                className="sg-dataset-table-select"
                value={block.table_name}
                onChange={e => onSetTable(blockIdx, e.target.value)}
            >
                <option value="">— Select Dataset / Table —</option>
                {tableList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="sg-rm-btn" type="button" onClick={() => onRemoveBlock(blockIdx)} title="Remove dataset">✕</button>
        </div>

        {block.table_name && (
            <div className="sg-dataset-rules">
                {block.rules.map((c, ri) => (
                    <div key={ri} className="sg-dataset-rule-row sg-cls-rule-row">
                        <select
                            className="form-input"
                            value={c.column_name}
                            onChange={e => onUpdateRule(blockIdx, ri, 'column_name', e.target.value)}
                        >
                            <option value="">— Column —</option>
                            {(schema[block.table_name] || []).map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        <label className="sg-mask-toggle">
                            <input type="checkbox" checked={c.is_masked}
                                onChange={e => onUpdateRule(blockIdx, ri, 'is_masked', e.target.checked)} />
                            <span>Mask</span>
                        </label>
                        <button className="sg-rm-btn" type="button" onClick={() => onRemoveRule(blockIdx, ri)}>✕</button>
                    </div>
                ))}
                <div className="sg-dataset-footer">
                    <button className="sg-add-row-btn" type="button" onClick={() => onAddRule(blockIdx)}>
                        + Add Column
                    </button>
                </div>
            </div>
        )}
        {!block.table_name && (
            <div className="sg-dataset-empty">Select a dataset above to add column restrictions.</div>
        )}
    </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const Security = () => {
    const [groups,     setGroups]    = useState([]);
    const [loading,    setLoading]   = useState(true);
    const [expanded,   setExpanded]  = useState(new Set());
    const [search,     setSearch]    = useState('');
    const [activeRole, setActiveRole] = useState('super_user');
    const [sortBy,     setSortBy]    = useState('name');   // 'name' | 'newest' | 'updated'
    const [modal,      setModal]     = useState(null);     // null | 'create' | group object

    const [master, setMaster] = useState({ geographies: [], domains: [], subdomains: [], business_units: [] });
    const [schema, setSchema] = useState({});

    // Form state
    const [formName,  setFormName]  = useState('');
    const [formDesc,  setFormDesc]  = useState('');
    const [formRole,  setFormRole]  = useState('');
    const [formRLS,   setFormRLS]   = useState([mkRLSBlock()]);
    const [formCLS,   setFormCLS]   = useState([mkCLSBlock()]);
    const [formScope, setFormScope] = useState(EMPTY_SCOPE());
    const [saving,    setSaving]    = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('security/groups/');
            setGroups(res.data);
        } catch { toast.error('Failed to load security groups'); }
        finally  { setLoading(false); }
    }, []);

    const fetchMaster = useCallback(async () => {
        try {
            const res = await API.get('users/master-data/');
            setMaster({
                geographies:    res.data.geographies    || [],
                domains:        res.data.domains        || [],
                subdomains:     res.data.subdomains     || [],
                business_units: res.data.business_units || [],
            });
        } catch { /* non-fatal */ }
    }, []);

    const fetchSchema = useCallback(async () => {
        try {
            const res = await API.get('security/schema/');
            setSchema(res.data);
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => {
        fetchGroups();
        fetchMaster();
        fetchSchema();
    }, [fetchGroups, fetchMaster, fetchSchema]);

    // ── Derived data ───────────────────────────────────────────────────────────

    const tabGroups = groups
        .filter(g => g.role === activeRole &&
            (g.name.toLowerCase().includes(search.toLowerCase()) ||
             (g.description || '').toLowerCase().includes(search.toLowerCase())))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'updated') return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
            return a.name.localeCompare(b.name);
        });

    const countFor = role => groups.filter(g => g.role === role).length;

    // ── Expand toggle ──────────────────────────────────────────────────────────

    const toggleExpand = id =>
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    // ── Modal helpers ──────────────────────────────────────────────────────────

    const openCreate = () => {
        setFormName(''); setFormDesc(''); setFormRole(activeRole);
        setFormRLS([mkRLSBlock()]);
        setFormCLS([mkCLSBlock()]);
        setFormScope(EMPTY_SCOPE());
        setModal('create');
    };

    const openEdit = g => {
        setFormName(g.name);
        setFormDesc(g.description || '');
        setFormRole(g.role || activeRole);
        setFormRLS(rlsToBlocks(g.rls));
        setFormCLS(clsToBlocks(g.cls));
        setFormScope({
            regions:        Array.isArray(g.scope?.regions)        ? g.scope.regions        : [],
            domains:        Array.isArray(g.scope?.domains)        ? g.scope.domains        : [],
            subdomains:     Array.isArray(g.scope?.subdomains)     ? g.scope.subdomains     : [],
            business_units: Array.isArray(g.scope?.business_units) ? g.scope.business_units : [],
        });
        setModal(g);
    };

    const closeModal = () => { setModal(null); setSaving(false); };

    // ── RLS dataset block helpers ──────────────────────────────────────────────

    const addRLSBlock    = () => setFormRLS(p => [...p, mkRLSBlock()]);
    const removeRLSBlock = bi => setFormRLS(p => p.length === 1 ? p : p.filter((_, i) => i !== bi));
    const setRLSTable    = (bi, tbl) => setFormRLS(p => p.map((b, i) => i !== bi ? b : { ...b, table_name: tbl, rules: [{ column_name: '', condition: '' }] }));
    const addRLSRule     = bi => setFormRLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: [...b.rules, { column_name: '', condition: '' }] }));
    const removeRLSRule  = (bi, ri) => setFormRLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: b.rules.filter((_, j) => j !== ri) }));
    const updateRLSRule  = (bi, ri, field, val) => setFormRLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: b.rules.map((r, j) => j !== ri ? r : { ...r, [field]: val }) }));

    // ── CLS dataset block helpers ──────────────────────────────────────────────

    const addCLSBlock    = () => setFormCLS(p => [...p, mkCLSBlock()]);
    const removeCLSBlock = bi => setFormCLS(p => p.length === 1 ? p : p.filter((_, i) => i !== bi));
    const setCLSTable    = (bi, tbl) => setFormCLS(p => p.map((b, i) => i !== bi ? b : { ...b, table_name: tbl, rules: [{ column_name: '', is_masked: false }] }));
    const addCLSRule     = bi => setFormCLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: [...b.rules, { column_name: '', is_masked: false }] }));
    const removeCLSRule  = (bi, ri) => setFormCLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: b.rules.filter((_, j) => j !== ri) }));
    const updateCLSRule  = (bi, ri, field, val) => setFormCLS(p => p.map((b, i) => i !== bi ? b : { ...b, rules: b.rules.map((c, j) => j !== ri ? c : { ...c, [field]: val }) }));

    // ── Scope chip toggles ─────────────────────────────────────────────────────

    const toggleRegion = name => setFormScope(p => ({
        ...p, regions: p.regions.includes(name) ? p.regions.filter(r => r !== name) : [...p.regions, name]
    }));

    const toggleBU = name => setFormScope(p => ({
        ...p, business_units: p.business_units.includes(name) ? p.business_units.filter(b => b !== name) : [...p.business_units, name]
    }));

    const toggleDomain = name =>
        setFormScope(p => {
            const domains   = p.domains.includes(name) ? p.domains.filter(d => d !== name) : [...p.domains, name];
            const validSubs = master.subdomains.filter(s => domains.includes(s.domain)).map(s => s.name);
            return { ...p, domains, subdomains: p.subdomains.filter(s => validSubs.includes(s)) };
        });

    const toggleSubdomain = name =>
        setFormScope(p => ({
            ...p, subdomains: p.subdomains.includes(name)
                ? p.subdomains.filter(s => s !== name)
                : [...p.subdomains, name],
        }));

    const availableSubdomains = formScope.domains.length > 0
        ? master.subdomains.filter(s => formScope.domains.includes(s.domain))
        : [];

    // ── Save ───────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Group name is required'); return; }
        if (!formRole)        { toast.error('Please select a role');   return; }

        const payload = {
            name:        formName.trim(),
            description: formDesc.trim(),
            role:        formRole,
            rls:         flattenRLS(formRLS),
            cls:         flattenCLS(formCLS),
            scope:       formScope,
        };
        setSaving(true);
        try {
            if (modal === 'create') {
                await API.post('security/groups/', payload);
                toast.success('Security group created');
                setActiveRole(formRole);
            } else {
                await API.put(`security/groups/${modal.id}/`, payload);
                toast.success('Security group updated');
            }
            fetchGroups();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    // ── Clone ──────────────────────────────────────────────────────────────────

    const handleClone = async (g) => {
        const newName = `${g.name} (Copy)`;
        const payload = {
            name:        newName,
            description: g.description,
            role:        g.role,
            rls:         g.rls.map(r => ({ table_name: r.table_name, column_name: r.column_name, condition: r.condition })),
            cls:         g.cls.map(c => ({ table_name: c.table_name, column_name: c.column_name, is_masked: c.is_masked })),
            scope: {
                regions:        g.scope?.regions        || [],
                domains:        g.scope?.domains        || [],
                subdomains:     g.scope?.subdomains     || [],
                business_units: g.scope?.business_units || [],
            },
        };
        try {
            await API.post('security/groups/', payload);
            toast.success(`Cloned as "${newName}"`);
            fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Clone failed');
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const { id, name } = confirmDelete;
        setConfirmDelete(null);
        try {
            await API.delete(`security/groups/${id}/`);
            toast.success(`"${name}" deleted`);
            fetchGroups();
        } catch { toast.error('Delete failed'); }
    };

    const tableList = Object.keys(schema);
    const rc        = ROLE_CFG[activeRole];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="sg-page">

            {/* ── Header ── */}
            <div className="sg-page-header">
                <div>
                    <p className="sg-infra-label">SECURITY INFRASTRUCTURE</p>
                    <h1 className="sg-page-title">Access Control</h1>
                </div>
                <div className="sg-header-controls">
                    <span className="sg-sort-label">Sort:</span>
                    {[
                        { key: 'name',    label: 'A–Z' },
                        { key: 'newest',  label: 'Newest' },
                        { key: 'updated', label: 'Updated' },
                    ].map(s => (
                        <button
                            key={s.key}
                            className={`sg-sort-btn${sortBy === s.key ? ' active' : ''}`}
                            onClick={() => setSortBy(s.key)}
                        >{s.label}</button>
                    ))}
                </div>
            </div>

            {/* ── Search ── */}
            <div className="sg-search-row">
                <div className="sg-search-wrap">
                    <svg className="sg-search-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                    </svg>
                    <input
                        className="sg-search-input"
                        placeholder={`Search ${rc?.label} groups…`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="sg-search-clear" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>
            </div>

            {/* ── Role Tabs ── */}
            <div className="sg-role-tabs">
                {ROLE_TABS.map(({ key, label }) => {
                    const trc   = ROLE_CFG[key];
                    const count = countFor(key);
                    const isActive = activeRole === key;
                    return (
                        <button
                            key={key}
                            className={`sg-role-tab${isActive ? ' active' : ''}`}
                            style={isActive ? { background: trc.bg, color: trc.color, borderColor: trc.border } : {}}
                            onClick={() => { setActiveRole(key); setSearch(''); setExpanded(new Set()); }}
                        >
                            <RoleIcon role={key} color={isActive ? trc.color : 'var(--text-secondary)'} bg="transparent" />
                            <span className="sg-tab-label">{label}</span>
                            {count > 0 && (
                                <span
                                    className="sg-tab-count"
                                    style={isActive ? { background: trc.color, color: '#fff' } : {}}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Groups list ── */}
            {loading ? (
                <div className="sg-empty-state"><div className="sg-spinner" /></div>
            ) : tabGroups.length === 0 ? (
                <div className="sg-empty-state">
                    <div className="sg-empty-icon" style={{ background: rc?.bg, color: rc?.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z"/>
                        </svg>
                    </div>
                    <p className="sg-empty-title">
                        {search ? `No ${rc?.label} groups match "${search}"` : `No ${rc?.label} groups yet`}
                    </p>
                    {!search && <p className="sg-empty-sub">Click the button below to create one.</p>}
                </div>
            ) : (
                <div className="sg-list">
                    {tabGroups.map(g => (
                        <GroupCard
                            key={g.id}
                            group={g}
                            expanded={expanded.has(g.id)}
                            onToggle={() => toggleExpand(g.id)}
                            onEdit={() => openEdit(g)}
                            onClone={() => handleClone(g)}
                            onDelete={() => setConfirmDelete({ id: g.id, name: g.name })}
                        />
                    ))}
                </div>
            )}

            {/* ── Create button ── */}
            <button
                className="sg-create-full-btn"
                style={{ background: rc?.color }}
                onClick={openCreate}
            >
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Create {rc?.label} Group
            </button>

            {/* ══════════════ MODAL ══════════════ */}
            {modal && (
                <Modal
                    title={modal === 'create'
                        ? `Create ${ROLE_CFG[formRole]?.label || ''} Group`
                        : `Edit — ${modal.name}`}
                    onClose={closeModal}
                >
                    {/* ── Name + Description ── */}
                    <div className="sg-form-grid-2">
                        <div className="sg-field">
                            <label className="form-label">
                                Group Name <span className="sg-req">*</span>
                            </label>
                            <input
                                className="form-input"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="e.g. Finance Analysts"
                                autoFocus
                            />
                        </div>
                        <div className="sg-field">
                            <label className="form-label">Description</label>
                            <input
                                className="form-input"
                                value={formDesc}
                                onChange={e => setFormDesc(e.target.value)}
                                placeholder="e.g. Global Access Profile"
                            />
                        </div>
                    </div>

                    {/* ── Role selector ── */}
                    <div className="sg-field">
                        <label className="form-label">Role <span className="sg-req">*</span></label>
                        <div className="sg-role-chips">
                            {ROLE_TABS.map(({ key, label }) => {
                                const trc    = ROLE_CFG[key];
                                const active = formRole === key;
                                return (
                                    <button key={key} type="button"
                                        className={`sg-role-chip${active ? ' active' : ''}`}
                                        style={active ? { background: trc.bg, borderColor: trc.color, color: trc.color } : {}}
                                        onClick={() => setFormRole(key)}
                                    >
                                        <RoleIcon role={key} color={active ? trc.color : 'var(--text-secondary)'} bg="transparent" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Access Scope ── */}
                    <div className="sg-subsection-title">Access Scope</div>

                    {/* Regions — multi-chip */}
                    <div className="sg-field">
                        <label className="form-label">
                            Regions
                            <span className="sg-multi-hint">select one or more (leave empty = all)</span>
                        </label>
                        {master.geographies.length === 0
                            ? <p className="sg-hint">No geographies defined yet.</p>
                            : <div className="sg-chips-wrap">
                                {master.geographies.map(g => (
                                    <button key={g.id} type="button"
                                        className={`sg-chip${formScope.regions.includes(g.name) ? ' active' : ''}`}
                                        onClick={() => toggleRegion(g.name)}
                                    >{g.name}</button>
                                ))}
                              </div>
                        }
                    </div>

                    {/* Business Units — multi-chip */}
                    <div className="sg-field">
                        <label className="form-label">
                            Business Units
                            <span className="sg-multi-hint">select one or more (leave empty = all)</span>
                        </label>
                        {master.business_units.length === 0
                            ? <p className="sg-hint">No business units defined yet.</p>
                            : <div className="sg-chips-wrap">
                                {master.business_units.map(b => (
                                    <button key={b.id} type="button"
                                        className={`sg-chip${formScope.business_units.includes(b.name) ? ' active' : ''}`}
                                        onClick={() => toggleBU(b.name)}
                                    >{b.name}</button>
                                ))}
                              </div>
                        }
                    </div>

                    {/* Domains */}
                    <div className="sg-field">
                        <label className="form-label">
                            Domains
                            <span className="sg-multi-hint">select one or more</span>
                        </label>
                        {master.domains.length === 0
                            ? <p className="sg-hint">No domains defined yet.</p>
                            : <div className="sg-chips-wrap">
                                {master.domains.map(d => (
                                    <button key={d.id} type="button"
                                        className={`sg-chip${formScope.domains.includes(d.name) ? ' active' : ''}`}
                                        onClick={() => toggleDomain(d.name)}
                                    >{d.name}</button>
                                ))}
                              </div>
                        }
                    </div>

                    {/* Subdomains */}
                    <div className="sg-field">
                        <label className="form-label">
                            Subdomains
                            <span className="sg-multi-hint">select one or more</span>
                        </label>
                        {availableSubdomains.length === 0
                            ? <p className="sg-hint">
                                {master.subdomains.length === 0
                                    ? 'No subdomains defined.'
                                    : formScope.domains.length === 0
                                        ? '← Select at least one domain above to see its subdomains.'
                                        : 'No subdomains for the selected domain(s).'}
                              </p>
                            : <div className="sg-chips-wrap">
                                {availableSubdomains.map(s => (
                                    <button key={s.id} type="button"
                                        className={`sg-chip${formScope.subdomains.includes(s.name) ? ' active' : ''}`}
                                        onClick={() => toggleSubdomain(s.name)}
                                    >{s.name}</button>
                                ))}
                              </div>
                        }
                    </div>

                    {/* ── ROW LEVEL SECURITY — Dataset blocks ── */}
                    <div className="sg-subsection-title">
                        Row Level Security
                        <span className="sg-rule-total">{flattenRLS(formRLS).length} rule{flattenRLS(formRLS).length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sg-dataset-list">
                        {formRLS.map((block, bi) => (
                            <RLSDatasetBlock
                                key={block._id}
                                block={block}
                                blockIdx={bi}
                                tableList={tableList}
                                schema={schema}
                                onSetTable={setRLSTable}
                                onAddRule={addRLSRule}
                                onRemoveRule={removeRLSRule}
                                onUpdateRule={updateRLSRule}
                                onRemoveBlock={removeRLSBlock}
                                roleColor={ROLE_CFG[formRole]?.color || '#6366f1'}
                            />
                        ))}
                    </div>
                    <button className="sg-add-dataset-btn" type="button" onClick={addRLSBlock}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                        </svg>
                        Add Dataset
                    </button>

                    {/* ── COLUMN LEVEL SECURITY — Dataset blocks ── */}
                    <div className="sg-subsection-title" style={{ marginTop: '1.125rem' }}>
                        Column Level Security
                        <span className="sg-rule-total">{flattenCLS(formCLS).length} rule{flattenCLS(formCLS).length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sg-dataset-list">
                        {formCLS.map((block, bi) => (
                            <CLSDatasetBlock
                                key={block._id}
                                block={block}
                                blockIdx={bi}
                                tableList={tableList}
                                schema={schema}
                                onSetTable={setCLSTable}
                                onAddRule={addCLSRule}
                                onRemoveRule={removeCLSRule}
                                onUpdateRule={updateCLSRule}
                                onRemoveBlock={removeCLSBlock}
                                roleColor={ROLE_CFG[formRole]?.color || '#6366f1'}
                            />
                        ))}
                    </div>
                    <button className="sg-add-dataset-btn" type="button" onClick={addCLSBlock}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                        </svg>
                        Add Dataset
                    </button>

                    {/* ── Footer ── */}
                    <div className="sg-modal-footer">
                        <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={formRole ? { background: ROLE_CFG[formRole]?.color } : {}}
                        >
                            {saving
                                ? <><span className="sg-save-spinner" /> Saving…</>
                                : modal === 'create' ? 'Create Group' : 'Save Changes'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Delete confirmation ── */}
            <ConfirmModal
                open={!!confirmDelete}
                title={`Delete "${confirmDelete?.name}"?`}
                message="This security group will be permanently removed. Users assigned to it will lose this access."
                confirmLabel="Delete Group"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default Security;
