export const SALES_COLLECTIONS = {
  SALES: 'sales',
  SALE_ITEMS: 'saleItems',
  INVENTORY: 'medicines',
  MEDICINES: 'medicines',
  INVENTORY_LOGS: 'inventoryLogs',
  ACTIVITY_LOGS: 'activityLogs',
  NOTIFICATIONS: 'notifications'
};

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card'
};

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS.CASH;

export const SALE_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
};

export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  EXPIRY: 'EXPIRY',
  SALE: 'SALE'
};

export const ACTION_TYPES = {
  SALE_CREATED: 'SALE_CREATED',
  SALE_CANCELLED: 'SALE_CANCELLED',
  SALE_RETURNED: 'SALE_RETURNED',
  STOCK_DEDUCTED: 'STOCK_DEDUCTED'
};

export const MODULES = {
  SALES: 'Sales',
  INVENTORY: 'Inventory'
};
