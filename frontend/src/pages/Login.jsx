import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { FileText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setLoading(true);
    try {
      await login(demoEmail, 'demo1234');
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card">
        <div style={styles.logo}>
          <div style={styles.logoIcon}><FileText size={22} color="#fff" /></div>
          <span style={styles.logoText}>DocEditor</span>
        </div>

        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.sub}>Use a demo account to explore the app</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@demo.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Sign in'}
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0' }} />

        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10, fontWeight: 500 }}>Demo accounts (password: demo1234)</p>
        <div style={styles.demos}>
          {['alice@demo.com', 'bob@demo.com', 'carol@demo.com'].map(e => (
            <button key={e} className="btn btn-secondary btn-sm" onClick={() => demoLogin(e)} disabled={loading}>
              {e.split('@')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--paper)',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 36,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 38, height: 38, background: 'var(--accent)',
    borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  logoText: { fontSize: 18, fontWeight: 600, color: 'var(--ink)' },
  title: { fontSize: 22, fontWeight: 600, marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--ink-3)', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' },
  demos: { display: 'flex', gap: 8, flexWrap: 'wrap' }
};
