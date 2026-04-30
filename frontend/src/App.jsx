import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Login from './pages/Login';
import { api } from './lib/api';
import { useToast } from './components/Toast';

function ProtectedLayout() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [docs, setDocs] = useState({ owned: [], shared: [] });

  useEffect(() => {
    if (!user) return;
    api.listDocuments()
      .then(data => setDocs(data))
      .catch(err => toast(err.message, 'error'));
  }, [user]);

  const handleDocCreated = (doc) => {
    setDocs(prev => ({ ...prev, owned: [{ ...doc, role: 'owner', owner_username: user.username }, ...prev.owned] }));
  };

  const handleFileUploaded = (doc) => {
    setDocs(prev => ({ ...prev, owned: [{ ...doc, role: 'owner', owner_username: user.username }, ...prev.owned] }));
  };

  const handleDocUpdated = (update) => {
    setDocs(prev => ({
      owned: prev.owned.map(d => d.id === update.id ? { ...d, ...update } : d),
      shared: prev.shared.map(d => d.id === update.id ? { ...d, ...update } : d),
    }));
  };

  const handleDocDeleted = (id) => {
    setDocs(prev => ({
      owned: prev.owned.filter(d => d.id !== id),
      shared: prev.shared.filter(d => d.id !== id),
    }));
    navigate('/');
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        docs={docs}
        onDocCreated={handleDocCreated}
        onFileUploaded={handleFileUploaded}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home docs={docs} />} />
          <Route
            path="/doc/:id"
            element={
              <Editor
                onDocUpdated={handleDocUpdated}
                onDocDeleted={handleDocDeleted}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginGuard />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function LoginGuard() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
