import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Eye, Edit2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';

export default function ShareModal({ docId, onClose, onSharesChanged }) {
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState('view');
  const [shares, setShares] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    api.getDocument(docId).then(d => setShares(d.shares));
    api.users().then(d => setUsers(d.users));
  }, [docId]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const data = await api.shareDocument(docId, username.trim(), permission);
      setShares(data.shares);
      setUsername('');
      onSharesChanged?.();
      toast(`Shared with ${username}`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId, uname) => {
    try {
      await api.removeShare(docId, userId);
      setShares(prev => prev.filter(s => s.shared_with_user_id !== userId));
      onSharesChanged?.();
      toast(`Removed ${uname}'s access`, 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const suggestedUsers = users.filter(u =>
    !shares.find(s => s.shared_with_user_id === u.id) &&
    (username === '' || u.username.toLowerCase().includes(username.toLowerCase()))
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} className="card" onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Share Document</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleShare} style={styles.form}>
          <div style={styles.inputRow}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                className="input"
                placeholder="Username (e.g. bob)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
              {username && suggestedUsers.length > 0 && (
                <div style={styles.suggestions}>
                  {suggestedUsers.slice(0, 3).map(u => (
                    <button key={u.id} type="button" style={styles.suggestion} onClick={() => setUsername(u.username)}>
                      <span style={styles.suggAvatar}>{u.username[0].toUpperCase()}</span>
                      <span>{u.username}</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              className="input"
              value={permission}
              onChange={e => setPermission(e.target.value)}
              style={{ width: 110 }}
            >
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
            <button className="btn btn-primary" type="submit" disabled={loading || !username.trim()}>
              <UserPlus size={14} /> Share
            </button>
          </div>
        </form>

        <div className="divider" />

        <div style={styles.shareList}>
          <p style={styles.sectionLabel}>People with access</p>

          {/* Owner row */}
          <div style={styles.shareRow}>
            <span style={styles.shareAvatar}>{user?.username?.[0]?.toUpperCase()}</span>
            <div style={styles.shareInfo}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{user?.username} (you)</span>
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{user?.email}</span>
            </div>
            <span className="badge badge-owner">Owner</span>
          </div>

          {shares.map(s => (
            <div key={s.id} style={styles.shareRow}>
              <span style={styles.shareAvatar}>{s.username[0].toUpperCase()}</span>
              <div style={styles.shareInfo}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{s.username}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{s.email}</span>
              </div>
              <span className={`badge ${s.permission === 'edit' ? 'badge-edit' : 'badge-view'}`}>
                {s.permission === 'edit' ? <Edit2 size={9} /> : <Eye size={9} />}
                {s.permission}
              </span>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => handleRemove(s.shared_with_user_id, s.username)}
                title="Remove access"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {shares.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--ink-4)', padding: '8px 0' }}>
              Not shared with anyone yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: { width: '100%', maxWidth: 520, padding: 24, position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600 },
  form: { marginBottom: 12 },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  suggestions: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)',
    marginTop: 2, overflow: 'hidden',
  },
  suggestion: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px',
    background: 'none', border: 'none', cursor: 'pointer',
    textAlign: 'left', fontFamily: 'var(--font-body)',
    fontSize: 13,
  },
  suggAvatar: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, flexShrink: 0,
  },
  sectionLabel: { fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' },
  shareList: { display: 'flex', flexDirection: 'column', gap: 6 },
  shareRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' },
  shareAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--paper-3)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, flexShrink: 0, color: 'var(--ink-2)',
  },
  shareInfo: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
};
