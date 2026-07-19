const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

function getToken() {
  return localStorage.getItem('vbms_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
  changePassword: (current_password, new_password) => request('/auth/change-password', { method: 'PATCH', body: { current_password, new_password } }),

  listBookings: () => request('/bookings'),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  approveBooking: (id, remarks) => request(`/bookings/${id}/approve`, { method: 'PATCH', body: { remarks } }),
  rejectBooking: (id, remarks) => request(`/bookings/${id}/reject`, { method: 'PATCH', body: { remarks } }),
  assignVehicle: (id, payload) => request(`/bookings/${id}/assign`, { method: 'PATCH', body: payload }),
  completeBooking: (id) => request(`/bookings/${id}/complete`, { method: 'PATCH' }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),

  listFleet: (status) => request(`/fleet${status ? `?status=${status}` : ''}`),
  addVehicle: (payload) => request('/fleet', { method: 'POST', body: payload }),
  updateVehicle: (id, payload) => request(`/fleet/${id}`, { method: 'PATCH', body: payload }),
  deleteVehicle: (id) => request(`/fleet/${id}`, { method: 'DELETE' }),

  listUsers: () => request('/users'),
  createStaff: (payload) => request('/users', { method: 'POST', body: payload }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  myNotifications: () => request('/users/me/notifications'),
  markNotificationRead: (id) => request(`/users/me/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/users/me/notifications/read-all', { method: 'PATCH' })
};

export function connectNotificationSocket(onMessage) {
  const token = getToken();
  if (!token) return null;
  const ws = new WebSocket(`${WS_BASE}?token=${token}`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      /* ignore malformed message */
    }
  };
  return ws;
}

export { getToken };
