import React from 'react';
import StaffLogin from '../components/StaffLogin';

/**
 * Login Page - Staff Authentication, Role Access & PIN Recovery
 */
export const LoginPage = ({ onLoginSuccess }) => {
  return (
    <div className="w-full">
      <StaffLogin onLoginSuccess={onLoginSuccess} />
    </div>
  );
};

export default LoginPage;
