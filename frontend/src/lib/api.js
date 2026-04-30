const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('doceditor_token');
}

async function req(method, path, body, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
    });
  } catch (err) {
    throw new Error('Cannot connect to server. Is the backend running on port 3001?');
  }

  // Guard against non-JSON responses (HTML error pages, proxy errors, etc.)
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
    throw new Error('Unexpected non-JSON response from server');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  logout: () => req('POST', '/auth/logout'),
  me: () => req('GET', '/auth/me'),
  users: () => req('GET', '/auth/users'),

  // Documents
  listDocuments: () => req('GET', '/documents'),
  createDocument: (data) => req('POST', '/documents', data),
  getDocument: (id) => req('GET', `/documents/${id}`),
  updateDocument: (id, data) => req('PUT', `/documents/${id}`, data),
  deleteDocument: (id) => req('DELETE', `/documents/${id}`),

  // Sharing
  shareDocument: (id, username, permission) =>
    req('POST', `/documents/${id}/share`, { username, permission }),
  removeShare: (docId, userId) =>
    req('DELETE', `/documents/${docId}/share/${userId}`),

  // Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return req('POST', '/upload', formData, true);
  }
};
