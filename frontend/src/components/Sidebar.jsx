import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Plus, Upload, LogOut, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { api } from '../lib/api';

export default function Sidebar({ docs, onDocCreated, onFileUploaded }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [ownedOpen, setOwnedOpen] = useState(true);
  const [sharedOpen, setSharedOpen] = useState(true);

  const createDoc = async () => {
    try {
      const data = await api.createDocument({ title: 'Untitled Document' });
      onDocCreated(data.document);
      navigate(`/doc/${data.document.id}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadFile(file);
      onFileUploaded(data.document);
      navigate(`/doc/${data.document.id}`);
      toast('File imported successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (id) => location.pathname === `/doc/${id}`;

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}><FileText size={16} color="#fff" /></div>
        <span style={styles.logoText}>DocEditor</span>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={createDoc}>
          <Plus size={14} /> New
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading
            ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
            : <><Upload size={14} /> Import</>
          }
        </button>
        <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      <p style={styles.hint}>Supports .txt and .md files</p>

      {/* Document list */}
      <div style={styles.docList}>
        {/* Owned */}
        <button style={styles.sectionHeader} onClick={() => setOwnedOpen(o => !o)}>
          {ownedOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span>My Documents</span>
          <span style={styles.count}>{docs.owned.length}</span>
        </button>
        {ownedOpen && docs.owned.map(doc => (
          <DocItem key={doc.id} doc={doc} active={isActive(doc.id)} badge="owner" onClick={() => navigate(`/doc/${doc.id}`)} />
        ))}
        {ownedOpen && docs.owned.length === 0 && (
          <p style={styles.empty}>No documents yet</p>
        )}

        <div style={{ height: 12 }} />

        {/* Shared */}
        <button style={styles.sectionHeader} onClick={() => setSharedOpen(o => !o)}>
          {sharedOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span>Shared with Me</span>
          <span style={styles.count}>{docs.shared.length}</span>
        </button>
        {sharedOpen && docs.shared.map(doc => (
          <DocItem key={doc.id} doc={doc} active={isActive(doc.id)} badge={doc.role} onClick={() => navigate(`/doc/${doc.id}`)} />
        ))}
        {sharedOpen && docs.shared.length === 0 && (
          <p style={styles.empty}>Nothing shared yet</p>
        )}
      </div>

      {/* User footer */}
      <div style={styles.userFooter}>
        <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
        <div style={styles.userInfo}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{user?.username}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{user?.email}</span>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

function DocItem({ doc, active, badge, onClick }) {
  const badgeLabels = { owner: '●', edit: 'edit', view: 'view' };
  return (
    <button
      style={{ ...styles.docItem, ...(active ? styles.docItemActive : {}) }}
      onClick={onClick}
    >
      <FileText size={13} style={{ flexShrink: 0, color: active ? 'var(--accent)' : 'var(--ink-4)' }} />
      <span style={styles.docTitle}>{doc.title}</span>
      {badge !== 'owner' && (
        <span style={{ ...styles.roleDot, background: badge === 'edit' ? '#dbeafe' : 'var(--paper-3)', color: badge === 'edit' ? '#1d4ed8' : 'var(--ink-4)' }}>
          {badge}
        </span>
      )}
    </button>
  );
}

const styles = {
  sidebar: {
    width: 240,
    minWidth: 240,
    height: '100vh',
    background: 'var(--paper-2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: 28, height: 28, background: 'var(--accent)',
    borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { fontSize: 15, fontWeight: 600 },
  actions: { display: 'flex', gap: 6, padding: '12px 12px 4px' },
  hint: { fontSize: 11, color: 'var(--ink-4)', padding: '0 14px 8px', fontFamily: 'var(--font-mono)' },
  docList: { flex: 1, overflowY: 'auto', padding: '4px 0' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 5,
    width: '100%', padding: '4px 14px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    fontFamily: 'var(--font-body)',
  },
  count: {
    marginLeft: 'auto',
    background: 'var(--paper-3)', borderRadius: 10,
    padding: '0 6px', fontSize: 10, color: 'var(--ink-3)',
  },
  docItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '6px 14px',
    background: 'none', border: 'none', cursor: 'pointer',
    textAlign: 'left', borderRadius: 0,
    transition: 'background 0.1s',
    fontFamily: 'var(--font-body)',
  },
  docItemActive: { background: 'var(--accent-light)' },
  docTitle: { flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  roleDot: { fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, flexShrink: 0 },
  empty: { fontSize: 12, color: 'var(--ink-4)', padding: '4px 14px' },
  userFooter: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 12px',
    borderTop: '1px solid var(--border)',
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
};
