// master-lists.ts
// Centralized master data for the eCommerce application

// -----------------------------
// Product Types / Categories
// -----------------------------
export const PRODUCT_TYPES = [
  { label: 'Smartphone', value: 'smartphone' },
  { label: 'Laptop', value: 'laptop' },
  { label: 'Tablet', value: 'tablet' },
  { label: 'Desktop Computer', value: 'desktop_computer' },
  { label: 'Smartwatch', value: 'smartwatch' },
  { label: 'Headphones', value: 'headphones' },
  { label: 'Speakers', value: 'speakers' },
  { label: 'Soundbar', value: 'soundbar' },
  { label: 'Home Theater System', value: 'home_theater_system' },
  { label: 'Television', value: 'television' },
  { label: 'LED TV', value: 'led_tv' },
  { label: 'OLED TV', value: 'oled_tv' },
  { label: 'Projector', value: 'projector' },
  { label: 'Refrigerator', value: 'refrigerator' },
  { label: 'Washing Machine', value: 'washing_machine' },
  { label: 'Dryer', value: 'dryer' },
  { label: 'Microwave Oven', value: 'microwave_oven' },
  { label: 'Air Conditioner', value: 'air_conditioner' },
  { label: 'Heater', value: 'heater' },
  { label: 'Fan', value: 'fan' },
  { label: 'Vacuum Cleaner', value: 'vacuum_cleaner' },
  { label: 'Blender', value: 'blender' },
  { label: 'Mixer Grinder', value: 'mixer_grinder' },
  { label: 'Juicer', value: 'juicer' },
  { label: 'Coffee Maker', value: 'coffee_maker' },
  { label: 'Toaster', value: 'toaster' },
  { label: 'Electric Kettle', value: 'electric_kettle' },
  { label: 'Induction Cooktop', value: 'induction_cooktop' },
  { label: 'Water Purifier', value: 'water_purifier' },
  { label: 'Iron', value: 'iron' },
  { label: 'Hair Dryer', value: 'hair_dryer' },
  { label: 'Shaver', value: 'shaver' },
  { label: 'Electric Toothbrush', value: 'electric_toothbrush' },
  { label: 'Camera', value: 'camera' },
  { label: 'DSLR', value: 'dslr' },
  { label: 'Mirrorless Camera', value: 'mirrorless_camera' },
  { label: 'Camcorder', value: 'camcorder' },
  { label: 'Router', value: 'router' },
  { label: 'Modem', value: 'modem' },
  { label: 'Smart Home Device', value: 'smart_home_device' },
  { label: 'Power Bank', value: 'power_bank' },
  { label: 'Charger', value: 'charger' },
  { label: 'USB Cable', value: 'usb_cable' },
  { label: 'Gaming Console', value: 'gaming_console' },
  { label: 'VR Headset', value: 'vr_headset' },
  { label: 'Drone', value: 'drone' },
  { label: 'Projector Screen', value: 'projector_screen' },
  { label: 'Electric Scooter', value: 'electric_scooter' },
  { label: 'Smart Light', value: 'smart_light' },
  { label: 'Smart Plug', value: 'smart_plug' }
];

// -----------------------------
// Payment Status
// -----------------------------
export const PAYMENT_STATUS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Processing', value: 'processing' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Authorized', value: 'authorized' }
];

// -----------------------------
// Product Brands
// -----------------------------
export const PRODUCT_BRANDS = [
  { label: 'Samsung', value: 'samsung' },
  { label: 'Apple', value: 'apple' },
  { label: 'Sony', value: 'sony' },
  { label: 'LG', value: 'lg' },
  { label: 'HP', value: 'hp' },
  { label: 'Dell', value: 'dell' },
  { label: 'Lenovo', value: 'lenovo' },
  { label: 'Bose', value: 'bose' },
  { label: 'JBL', value: 'jbl' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Canon', value: 'canon' }
];

// -----------------------------
// Product Condition / Status
// -----------------------------
export const PRODUCT_STATUS = [
  { label: 'New', value: 'new' },
  { label: 'Refurbished', value: 'refurbished' },
  { label: 'Used', value: 'used' },
  { label: 'Damaged', value: 'damaged' }
];

// -----------------------------
// Order Status
// -----------------------------
export const ORDER_STATUS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' }
];

// -----------------------------
// Delivery / Shipment Status
// -----------------------------
export const DELIVERY_STATUS = [
  { label: 'Not Dispatched', value: 'not_dispatched' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Returned', value: 'returned' }
];

// -----------------------------
// Stock Status
// -----------------------------
export const STOCK_STATUS = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Discontinued', value: 'discontinued' }
];

// -----------------------------
// Customer Types
// -----------------------------
export const CUSTOMER_TYPES = [
  { label: 'Retail', value: 'retail' },
  { label: 'Wholesale', value: 'wholesale' },
  { label: 'VIP', value: 'vip' },
  { label: 'Guest', value: 'guest' }
];

// -----------------------------
// User Roles
// -----------------------------
export const USER_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'superAdmin', value: 'superAdmin' },
  { label: 'staff', value: 'staff' },
  { label: 'Manager', value: 'manager' },
  { label: 'Sales Executive', value: 'sales_exec' },
  { label: 'Customer', value: 'customer' }
];

// -----------------------------
// Shipping Methods
// -----------------------------
export const SHIPPING_METHODS = [
  { label: 'Standard', value: 'standard' },
  { label: 'Express', value: 'express' },
  { label: 'Overnight', value: 'overnight' },
  { label: 'Pickup', value: 'pickup' }
];

// -----------------------------
// Ratings
// -----------------------------
export const RATINGS = [
  { label: '1 Star', value: 1 },
  { label: '2 Stars', value: 2 },
  { label: '3 Stars', value: 3 },
  { label: '4 Stars', value: 4 },
  { label: '5 Stars', value: 5 }
];
