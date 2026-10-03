import api from "./axios";

/**
 * Send OTP to user's email
 * @param {string} email
 */
export const sendOtp = async (email) => {
    const response = await api.post("/api/user/send-otp", { email });
    return response.data;
};

/**
 * Verify OTP
 * @param {string} email
 * @param {string} otp
 */
export const verifyOtp = async (email, otp) => {
    const response = await api.post("/api/user/verify-otp", { email, otp });
    return response.data;
};

/**
 * Fetch current user profile
 * @param {string} email
 */
export const getUserProfile = async (email) => {
    const params = email ? { email } : {};
    const response = await api.get("/api/user/profile", { params });
    return response.data;
};

/**
 * Update user profile (name, phone, dob, anniversaryDate)
 * @param {Object} profileData
 */
export const updateUserProfile = async (profileData) => {
    const response = await api.put("/api/user/update-profile", profileData);
    return response.data;
};

/**
 * Call Waiter / Service Staff
 * @param {Object} callData
 */
export const callWaiterApi = async (callData) => {
    const response = await api.post("/api/waiter/call", callData);
    return response.data;
};

/**
 * Check-in Table upon login or table selection
 * @param {Object} tableData
 */
export const checkInTableApi = async (tableData) => {
    const response = await api.post("/api/tables/checkin", tableData);
    return response.data;
};

/**
 * Fetch Redis Cart
 * @param {string} tableNo
 * @param {string} email
 */
export const getCartApi = async (tableNo, email) => {
    const response = await api.get("/api/cart", { params: { tableNo, email } });
    return response.data;
};

/**
 * Sync Cart to Redis (5-min bulk DB persistence)
 * @param {Object} cartData
 */
export const syncCartApi = async (cartData) => {
    const response = await api.post("/api/cart/sync", cartData);
    return response.data;
};

/**
 * Place Order to Kitchen Brigade
 * @param {Object} orderData
 */
export const placeOrderApi = async (orderData) => {
    const response = await api.post("/api/orders/place", orderData);
    return response.data;
};

/**
 * Get Table Active Orders
 * @param {string} tableNo
 */
export const getOrdersApi = async (tableNo) => {
    const response = await api.get("/api/orders", { params: { tableNo } });
    return response.data;
};

/**
 * Get Table Bill preview
 * @param {string} tableNo
 */
export const getTableBillApi = async (tableNo) => {
    const response = await api.get(`/api/billing/table/${tableNo}`);
    return response.data;
};

/**
 * Verify In-Restaurant Dining Location
 * @param {Object} coords
 */
export const verifyLocationApi = async (coords) => {
    const response = await api.post("/api/system/verify-location", coords);
    return response.data;
};

/**
 * Verify Master Device Passcode to Unlock Table Number
 * @param {string} passcode
 */
export const verifyDevicePasscodeApi = async (passcode) => {
    const response = await api.post("/api/system/verify-device-passcode", { passcode });
    return response.data;
};

/**
 * Fetch all available dynamic coupons and offers
 */
export const getCouponsApi = async () => {
    const response = await api.get("/api/coupons", { params: { activeOnly: true } });
    return response.data;
};

/**
 * Validate and apply coupon code
 */
export const applyCouponApi = async (code, orderAmount) => {
    const response = await api.post("/api/coupons/apply", { code, orderAmount });
    return response.data;
};

