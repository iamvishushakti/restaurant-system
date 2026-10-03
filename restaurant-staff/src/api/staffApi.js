import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  const hostname = typeof window !== 'undefined' && window.location.hostname 
    ? window.location.hostname 
    : 'localhost';
  return `http://${hostname}:5000`;
};

export const BASE_URL = getBaseURL();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Staff Authentication & Passcode Recovery
export const resetStaffPinApi = async (email = '') => {
  const res = await api.post('/api/staff/reset-pin', { email });
  return res.data;
};

export const staffLoginApi = async (credentials) => {
  const res = await api.post('/api/staff/login', credentials);
  return res.data;
};

export const updateStaffProfileApi = async (profileData) => {
  const res = await api.put('/api/staff/profile', profileData);
  return res.data;
};

export const getStaffListApi = async () => {
  const res = await api.get('/api/staff/list');
  return res.data;
};

// Orders & KDS
export const getOrders = async (params = {}) => {
  const res = await api.get('/api/orders', { params });
  return res.data;
};

export const updateOrderStatus = async (orderId, status, chefName = 'Master Chef') => {
  const res = await api.put(`/api/orders/${orderId}/status`, { status, chefName });
  return res.data;
};

// Billing & Cashier Counter
export const getTableBill = async (tableNo) => {
  const res = await api.get(`/api/billing/table/${tableNo}`);
  return res.data;
};

export const getTableStatusApi = async () => {
  const res = await api.get('/api/tables/status');
  return res.data;
};

export const clearTableApi = async (tableNo) => {
  const res = await api.post(`/api/tables/clear/${tableNo}`);
  return res.data;
};

export const checkInTableApi = async (tableData) => {
  const res = await api.post('/api/tables/checkin', tableData);
  return res.data;
};

export const attendWaterApi = async (tableNo, staffName = 'Floor Server') => {
  const res = await api.post(`/api/tables/attend-water/${tableNo}`, { staffName });
  return res.data;
};

export const processPayment = async (paymentPayload) => {
  const res = await api.post('/api/billing/pay', paymentPayload);
  return res.data;
};

export const getBillingHistory = async () => {
  const res = await api.get('/api/billing/history');
  return res.data;
};

// Waiter Calls
export const getWaiterCalls = async () => {
  const res = await api.get('/api/waiter/calls');
  return res.data;
};

export const updateCallStatus = async (callId, status, staffName = 'Floor Server') => {
  const res = await api.put(`/api/waiter/calls/${callId}/status`, { status, staffName });
  return res.data;
};

// Patron Profile & Staff Override
export const getUserProfile = async (email) => {
  const res = await api.get('/api/user/profile', { params: { email } });
  return res.data;
};

export const staffOverrideProfile = async (profilePayload) => {
  const res = await api.post('/api/user/staff-override', profilePayload);
  return res.data;
};

// System, 5-Min Bulk Sync & Geofence
export const getSyncStatus = async () => {
  const res = await api.get('/api/system/sync-status');
  return res.data;
};

export const forceSync = async () => {
  const res = await api.post('/api/system/force-sync');
  return res.data;
};

export const verifyLocation = async (coords) => {
  const res = await api.post('/api/system/verify-location', coords);
  return res.data;
};

// Master Device Passcode Controls (For Table Number Locking)
export const getDevicePasscodeApi = async () => {
  const res = await api.get('/api/system/device-passcode');
  return res.data;
};

export const updateDevicePasscodeApi = async (newPasscode, managerEmail) => {
  const res = await api.put('/api/system/device-passcode', { newPasscode, managerEmail });
  return res.data;
};

export const verifyDevicePasscodeApi = async (passcode) => {
  const res = await api.post('/api/system/verify-device-passcode', { passcode });
  return res.data;
};

// Staff & System Purge
export const resetAllStaffApi = async () => {
  const res = await api.post('/api/staff/reset-all');
  return res.data;
};

// 👑 Root Executive Authority APIs (Managing General Managers & Salaries)
export const getRootStatusApi = async () => {
  const res = await api.get('/api/staff/root-status');
  return res.data;
};

export const setupRootAdminApi = async (rootData) => {
  const res = await api.post('/api/staff/root-setup', rootData);
  return res.data;
};

export const getManagersApi = async () => {
  const res = await api.get('/api/staff/managers');
  return res.data;
};

export const createManagerApi = async (managerData) => {
  const res = await api.post('/api/staff/managers', managerData);
  return res.data;
};

export const updateManagerSalaryApi = async (staffId, salary) => {
  const res = await api.put(`/api/staff/managers/${staffId}/salary`, { salary });
  return res.data;
};

export const payManagerSalaryApi = async (staffId, paymentData) => {
  const res = await api.post(`/api/staff/managers/${staffId}/pay-salary`, paymentData);
  return res.data;
};

export const deleteManagerApi = async (staffId) => {
  const res = await api.delete(`/api/staff/managers/${staffId}`);
  return res.data;
};

// 👨‍💼 General Manager Crew Recruitment & Payroll APIs (Managing Chef, Cashier, Waiter, Carrier)
export const getCrewMembersApi = async () => {
  const res = await api.get('/api/staff/crew');
  return res.data;
};

export const createCrewMemberApi = async (crewData) => {
  const res = await api.post('/api/staff/crew', crewData);
  return res.data;
};

export const updateCrewSalaryApi = async (staffId, salary) => {
  const res = await api.put(`/api/staff/crew/${staffId}/salary`, { salary });
  return res.data;
};

export const payCrewSalaryApi = async (staffId, paymentData) => {
  const res = await api.post(`/api/staff/crew/${staffId}/pay-salary`, paymentData);
  return res.data;
};

export const updateCrewStatusApi = async (staffId, isActive) => {
  const res = await api.put(`/api/staff/crew/${staffId}/status`, { isActive });
  return res.data;
};

export const deleteCrewMemberApi = async (staffId) => {
  const res = await api.delete(`/api/staff/crew/${staffId}`);
  return res.data;
};

// 🎟️ Dynamic Coupons & Offers Management APIs
export const getCouponsApi = async (activeOnly = false) => {
  const res = await api.get('/api/coupons', { params: { activeOnly } });
  return res.data;
};

export const createCouponApi = async (couponData) => {
  const res = await api.post('/api/coupons', couponData);
  return res.data;
};

export const updateCouponApi = async (id, updates) => {
  const res = await api.put(`/api/coupons/${id}`, updates);
  return res.data;
};

export const deleteCouponApi = async (id) => {
  const res = await api.delete(`/api/coupons/${id}`);
  return res.data;
};

export const applyCouponApi = async (code, orderAmount) => {
  const res = await api.post('/api/coupons/apply', { code, orderAmount });
  return res.data;
};

export default api;


