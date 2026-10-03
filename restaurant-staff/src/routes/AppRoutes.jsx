import React from 'react';
import DashboardPage from '../pages/DashboardPage';
import KitchenPage from '../pages/KitchenPage';
import CouponsPage from '../pages/CouponsPage';
import ManagerPage from '../pages/ManagerPage';
import RootConsolePage from '../pages/RootConsolePage';

/**
 * AppRoutes - Main view router based on active section
 */
export const AppRoutes = ({
  activeSection = 'main',
  orders = [],
  waiterCalls = [],
  tableSessions = [],
  onSelectTable,
  onSwitchSection,
  onOpenNotifications,
  onRefreshTables,
}) => {
  switch (activeSection) {
    case 'kitchen':
      return (
        <KitchenPage
          orders={orders}
          waiterCalls={waiterCalls}
          onRefresh={onRefreshTables}
        />
      );

    case 'coupons':
      return (
        <CouponsPage
          onBackToDashboard={() => onSwitchSection('main')}
        />
      );

    case 'manager':
      return (
        <ManagerPage
          onBackToDashboard={() => onSwitchSection('main')}
        />
      );

    case 'root':
      return (
        <RootConsolePage
          onBackToDashboard={() => onSwitchSection('main')}
        />
      );

    case 'main':
    default:
      return (
        <DashboardPage
          orders={orders}
          waiterCalls={waiterCalls}
          tableSessions={tableSessions}
          onSelectTable={onSelectTable}
          onSwitchSection={onSwitchSection}
          onOpenNotifications={onOpenNotifications}
          onRefreshTables={onRefreshTables}
        />
      );
  }
};

export default AppRoutes;
