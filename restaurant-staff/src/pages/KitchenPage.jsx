import React from 'react';
import FoodControl from '../components/FoodControl';

/**
 * Kitchen Page - Live Kitchen Display System (KDS) & Floor Delivery Center
 */
export const KitchenPage = ({
  orders,
  waiterCalls,
  onRefresh,
}) => {
  return (
    <div className="w-full">
      <FoodControl
        orders={orders}
        waiterCalls={waiterCalls}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default KitchenPage;
