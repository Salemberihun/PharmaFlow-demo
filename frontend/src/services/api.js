const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Medicines (Inventory)
  getMedicines: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.include_batches) query.append('include_batches', 'true');
    const queryString = query.toString();
    return request(`/medicines${queryString ? `?${queryString}` : ''}`);
  },
  getMedicine: (id) => request(`/medicines/${id}`),
  createMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),

  // Batches (Receiving stock)
  getBatches: (params = {}) => {
    const query = new URLSearchParams();
    if (params.medicine_id) query.append('medicine_id', params.medicine_id);
    if (params.expiring_soon) query.append('expiring_soon', 'true');
    const queryString = query.toString();
    return request(`/batches${queryString ? `?${queryString}` : ''}`);
  },
  receiveBatch: (data) => request('/batches', { method: 'POST', body: JSON.stringify(data) }),

  // Dispensing
  getDispensingHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.date) query.append('date', params.date);
    const queryString = query.toString();
    return request(`/dispensing${queryString ? `?${queryString}` : ''}`);
  },
  dispenseMedicine: (data) => request('/dispensing', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getDailyReport: (date) => request(`/reports/daily${date ? `?date=${date}` : ''}`),
  getInventoryReport: () => request('/reports/inventory'),
  getExpiringReport: (days = 180) => request(`/reports/expiring?days=${days}`),

  // Users & Staff
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Categories & Suppliers
  getCategories: () => request('/categories'),
  getSuppliers: () => request('/suppliers'),
};
