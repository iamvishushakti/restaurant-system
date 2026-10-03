import React from 'react';
import CouponManager from '../components/CouponManager';

/**
 * Coupons Page - Dynamic Discount Codes & Perpetual Offers Management
 */
export const CouponsPage = ({ onBackToDashboard }) => {
  return (
    <div className="w-full">
      <CouponManager onBackToDashboard={onBackToDashboard} />
    </div>
  );
};

export default CouponsPage;
