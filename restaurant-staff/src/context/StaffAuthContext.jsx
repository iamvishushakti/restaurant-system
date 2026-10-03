import React, { createContext, useContext, useState, useEffect } from 'react';
import { staffLoginApi } from '../api/staffApi';

const StaffAuthContext = createContext(null);

export const StaffAuthProvider = ({ children }) => {
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chronicle_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('chronicle_staff_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const loginStaff = async ({ email, passcode, role }) => {
    setLoading(true);
    try {
      const res = await staffLoginApi({ email, passcode, role });
      if (res?.success && res.staff) {
        setStaffUser(res.staff);
        setToken(res.token);
        localStorage.setItem('chronicle_staff_user', JSON.stringify(res.staff));
        localStorage.setItem('chronicle_staff_token', res.token);
        return { success: true, staff: res.staff };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (error) {
      const msg = error?.response?.data?.message || 'Invalid staff credentials';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateStaffUserProfile = (updatedStaffData) => {
    setStaffUser((prev) => {
      const merged = { ...prev, ...updatedStaffData };
      localStorage.setItem('chronicle_staff_user', JSON.stringify(merged));
      return merged;
    });
  };

  const logoutStaff = () => {
    setStaffUser(null);
    setToken(null);
    localStorage.removeItem('chronicle_staff_user');
    localStorage.removeItem('chronicle_staff_token');
  };

  return (
    <StaffAuthContext.Provider
      value={{
        staffUser,
        token,
        isAuthenticated: !!staffUser,
        loginStaff,
        updateStaffUserProfile,
        logoutStaff,
        loading,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};

export default StaffAuthContext;
