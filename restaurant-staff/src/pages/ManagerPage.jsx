import React from 'react';
import ManagerDashboard from '../components/ManagerDashboard';

/**
 * Manager Page - General Manager Operations & Crew Payroll
 */
export const ManagerPage = ({ onBackToDashboard }) => {
  return (
    <div className="w-full">
      <ManagerDashboard onBackToDashboard={onBackToDashboard} />
    </div>
  );
};

export default ManagerPage;
