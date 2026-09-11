const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('swiftship_token');
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (!isForm) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    if (contentType.includes('application/json')) {
      const errBody = await res.json().catch(() => null);
      if (errBody?.error) errMsg = errBody.error;
    }
    throw new Error(errMsg);
  }

  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

// Download a PDF (returns blob + suggested filename)
async function downloadFile(path) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download file');
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename=([^;]+)/);
  const filename = match ? match[1].trim() : 'download.pdf';
  const blob = await res.blob();
  return { blob, filename };
}

export const api = {
  // auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  // estimator
  estimate: (data) => request('/estimate', { method: 'POST', body: data }),
  geocode: (q) => request(`/geocode?q=${encodeURIComponent(q)}`),

  // public tracking
  track: (trackingId) => request(`/track/${encodeURIComponent(trackingId)}`),

  // shipments
  createShipment: (data) => request('/shipments', { method: 'POST', body: data }),
  getShipments: () => request('/shipments'),
  getShipment: (id) => request(`/shipments/${id}`),
  updateStatus: (id, status, note) => request(`/shipments/${id}/status`, { method: 'PATCH', body: { status, note } }),
  assignDriver: (id, driver_id) => request(`/shipments/${id}/assign-driver`, { method: 'PATCH', body: { driver_id } }),

  // driver
  driverUpdateStatus: (id, status) => request(`/shipments/${id}/driver-status`, { method: 'PATCH', body: { status } }),
  podSignature: (id, signature) => request(`/shipments/${id}/pod/signature`, { method: 'POST', body: { signature } }),
  podPhoto: (id, formData) => request(`/shipments/${id}/pod/photo`, { method: 'POST', body: formData, isForm: true }),

  // admin
  getDrivers: () => request('/drivers'),
  getAnalytics: () => request('/analytics'),

  // pdfs
  downloadInvoice: (id) => downloadFile(`/shipments/${id}/invoice`),
  downloadWaybill: (id) => downloadFile(`/shipments/${id}/waybill`),
};

export function setToken(token) {
  if (token) localStorage.setItem('swiftship_token', token);
  else localStorage.removeItem('swiftship_token');
}

export function getStoredToken() {
  return getToken();
}

const UPLOADS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
export function uploadUrl(path) {
  if (!path) return null;
  return `${UPLOADS_BASE}${path}`;
}
