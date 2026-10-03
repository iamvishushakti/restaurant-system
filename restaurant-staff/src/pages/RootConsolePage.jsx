import React from 'react';
import RootExecutiveConsole from '../components/RootExecutiveConsole';

/**
 * Root Console Page - Executive Authority & General Manager Hierarchy
 */
export const RootConsolePage = ({ onBackToDashboard }) => {
  return (
    <div className="w-full">
      <RootExecutiveConsole onBackToDashboard={onBackToDashboard} />
    </div>
  );
};

export default RootConsolePage;
