import { FileText, Plus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Home({ docs }) {
  const navigate = useNavigate();
  const toast = useToast();

  const recent = [...docs.owned, ...docs.shared]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6);

  const createDoc = async () => {
    try {
      const data = await api.createDocument({ title: 'Untitled Document' });
      navigate(`/doc/${data.document.id}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Documents</h1>
            <p style={styles.sub}>{docs.owned.length + docs.shared.length} total • {docs.shared.length} shared with you</p>
          </div>
          <button className="btn btn-primary" onClick={createDoc}>
            <Plus size={15} /> New Document
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={styles.empty}>
            <FileText size={40} color="var(--ink-4)" />
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink-2)' }}>No documents yet</p>
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>Create your first document to get started</p>
            <button className="btn btn-primary" onClick={createDoc} style={{ marginTop: 8 }}>
              <Plus size={14} /> Create Document
            </button>
          </div>
        ) : (
          <>
            <div style={styles.sectionLabel}>
              <Clock size={13} /> Recent
            </div>
            <div style={styles.grid}>
              {recent.map(doc => (
                <button
                  key={doc.id}
                  style={styles.docCard}
                  className="card"
                  onClick={() => navigate(`/doc/${doc.id}`)}
                >
                  <div style={styles.docIcon}>
                    <FileText size={20} color="var(--accent)" />
                  </div>
                  <div style={styles.docMeta}>
                    <p style={styles.docTitle}>{doc.title}</p>
                    <p style={styles.docSub}>{fmt(doc.updated_at)}</p>
                  </div>
                  <span className={`badge ${doc.role === 'owner' ? 'badge-owner' : doc.role === 'edit' ? 'badge-edit' : 'badge-view'}`}
                    style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
                    {doc.role}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, overflowY: 'auto', padding: '32px 40px' },
  inner: { maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 },
  title: { fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--ink-3)' },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, color: 'var(--ink-3)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  docCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    cursor: 'pointer', background: 'none', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', textAlign: 'left',
    transition: 'box-shadow 0.15s, border-color 0.15s',
    fontFamily: 'var(--font-body)',
  },
  docIcon: {
    width: 40, height: 40, background: 'var(--accent-light)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  docMeta: { flex: 1, minWidth: 0 },
  docTitle: { fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 },
  docSub: { fontSize: 12, color: 'var(--ink-4)' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: '80px 20px', color: 'var(--ink-3)',
  },
};
