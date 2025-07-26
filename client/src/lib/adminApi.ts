// Admin API client functions

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
};

// Sessions API
const adminSessions = {
  list: () => apiRequest('/api/admin/sessions'),
  get: (id: string) => apiRequest(`/api/admin/sessions/${id}`),
  create: (data: any) => apiRequest('/api/admin/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/api/admin/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/api/admin/sessions/${id}`, {
    method: 'DELETE',
  }),
};

// Payments API
const adminPayments = {
  list: (status?: string) => apiRequest(`/api/admin/payments${status ? `?status=${status}` : ''}`),
  confirm: (signupId: string) => apiRequest(`/api/admin/payments/${signupId}/mark-paid`, {
    method: 'POST',
  }),
  refund: (paymentId: string) => apiRequest(`/api/admin/payments/${paymentId}/refund`, {
    method: 'POST',
  }),
};

// Players API
const adminPlayers = {
  list: () => apiRequest('/api/admin/players'),
  get: (id: string) => apiRequest(`/api/admin/players/${id}`),
  update: (id: string, data: any) => apiRequest(`/api/admin/players/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// Analytics API
const adminAnalytics = {
  get: () => apiRequest('/api/admin/analytics'),
};

// Help Requests API
const adminHelpRequests = {
  list: () => apiRequest('/api/admin/help-requests'),
  get: (id: string) => apiRequest(`/api/admin/help-requests/${id}`),
  markResolved: (id: string) => apiRequest(`/api/admin/help-requests/${id}/resolve`, {
    method: 'POST',
  }),
  reply: (id: string, message: string) => apiRequest(`/api/admin/help-requests/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};

// Settings API
const adminSettings = {
  get: () => apiRequest('/api/admin/settings'),
  update: (data: any) => apiRequest('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// Imports API
const adminImports = {
  uploadSessions: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/admin/imports/sessions', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },
  uploadPlayers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/admin/imports/players', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },
};

const adminParents = {
  list: () => fetch('/api/admin/parents', { credentials: 'include' }).then(res => res.json()),
  update: (id: string, data: any) => fetch(`/api/admin/parents/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  delete: (id: string) => fetch(`/api/admin/parents/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json())
};

export { adminSessions, adminPlayers, adminPayments, adminAnalytics, adminHelpRequests, adminParents, adminSettings, adminImports };