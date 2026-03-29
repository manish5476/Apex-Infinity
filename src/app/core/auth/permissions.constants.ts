/**
 * RBAC Permission Constants
 * Single source of truth — mirrors backend PERMISSIONS_LIST exactly.
 * Never hardcode permission strings anywhere else in the app.
 *
 * Use in templates with `HasPermissionDirective`: `*hasPermission="PERMISSIONS.MODULE.KEY"` or
 * equivalent `*permission="..."`. The exported type `Permission` is the string value type; this
 * object is always named `PERMISSIONS` (nested keys, e.g. `PERMISSIONS.USER.MANAGE`).
 */
export const PERMISSIONS = {
  // ── System ────────────────────────────────────────────────────────
  USER: {
    READ: 'user:read',
    MANAGE: 'user:manage',
  },
  ROLE: {
    MANAGE: 'role:manage',
  },
  SESSION: {
    VIEW_ALL: 'session:view_all',
  },
  MASTER: {
    READ: 'master:read',
    MANAGE: 'master:manage',
  },
  LOGS: {
    VIEW: 'logs:view',
  },
  SYSTEM: {
    MANAGE: 'system:manage',
  },
  AUTOMATION: {
    READ: 'automation:read',
    WEBHOOK: 'automation:webhook',
    WORKFLOW: 'automation:workflow',
  },
  AI: {
    CHAT: 'ai:chat',
  },

  // ── Security & Settings ───────────────────────────────────────────
  AUTH: {
    MANAGE_SESSIONS: 'auth:manage_sessions',
  },
  ASSET: {
    READ: 'asset:read',
    DELETE: 'asset:delete',
  },

  // ── Organization ──────────────────────────────────────────────────
  ORG: {
    MANAGE: 'org:manage',
    MANAGE_MEMBERS: 'org:manage_members',
    MANAGE_PLATFORM: 'org:manage_platform',
    TRANSFER: 'org:transfer',
  },
  OWNERSHIP: {
    TRANSFER: 'ownership:transfer',
  },
  BRANCH: {
    READ: 'branch:read',
    MANAGE: 'branch:manage',
  },
  DEPARTMENT: {
    READ: 'department:read',
    MANAGE: 'department:manage',
  },
  DESIGNATION: {
    READ: 'designation:read',
    MANAGE: 'designation:manage',
  },

  // ── HR & Attendance ───────────────────────────────────────────────
  ATTENDANCE: {
    READ: 'attendance:read',
    MANAGE: 'attendance:manage',
    REGULARIZE: 'attendance:regularize',
    LOG_READ: 'attendance:log_read',
    LOG_MANAGE: 'attendance:log_manage',
    MACHINE_READ: 'attendance:machine_read',
    MACHINE_MANAGE: 'attendance:machine_manage',
    GEOFENCE_READ: 'attendance:geofence_read',
    GEOFENCE_MANAGE: 'attendance:geofence_manage',
  },
  HOLIDAY: {
    READ: 'holiday:read',
    MANAGE: 'holiday:manage',
  },
  SHIFT: {
    READ: 'shift:read',
    MANAGE: 'shift:manage',
    GROUP_READ: 'shift:group_read',
    GROUP_MANAGE: 'shift:group_manage',
  },
  LEAVE: {
    BALANCE_READ: 'leave:balance_read',
    BALANCE_MANAGE: 'leave:balance_manage',
    READ: 'leave:read',
    REQUEST: 'leave:request',
    APPROVE: 'leave:approve',
    ADMIN: 'leave:admin',
  },

  // ── Finance & Billing ─────────────────────────────────────────────
  STATEMENT: {
    READ: 'statement:read',
  },
  TRANSACTION: {
    READ: 'transaction:read',
  },

  RECONCILIATION: {
    READ: 'reconciliation:read',
    MANAGE: 'reconciliation:manage',
  },
  PAYMENT: {
    READ: 'payment:read',
    CREATE: 'payment:create',
    UPDATE: 'payment:update',
    DELETE: 'payment:delete',
  },
  LEDGER: {
    READ: 'ledger:read',
    DELETE: 'ledger:delete',
  },
  EMI: {
    READ: 'emi:read',
    CREATE: 'emi:create',
    PAY: 'emi:pay',
    MANAGE: 'emi:manage',
  },
  ACCOUNT: {
    READ: 'account:read',
    MANAGE: 'account:manage',
  },
  INVOICE: {
    READ: 'invoice:read',
    CREATE: 'invoice:create',
    UPDATE: 'invoice:update',
    DELETE: 'invoice:delete',
    DOWNLOAD: 'invoice:download',
    EXPORT: 'invoice:export',
  },

  // ── Inventory & Products ──────────────────────────────────────────
  STOCK: {
    READ: 'stock:read',
    MANAGE: 'stock:manage',
    LOW_STOCK: 'stock:low_stock',
    VALIDATE: 'stock:validate',
    WARNINGS: 'stock:warnings',
  },
  SUPPLIER: {
    READ: 'supplier:read',
    CREATE: 'supplier:create',
    UPDATE: 'supplier:update',
    DELETE: 'supplier:delete',
  },
  PRODUCT: {
    READ: 'product:read',
    CREATE: 'product:create',
    UPDATE: 'product:update',
    DELETE: 'product:delete',
    STOCK_ADJUST: 'product:stock_adjust',
  },

  // ── Sales & Purchase ──────────────────────────────────────────────
  SALES: {
    MANAGE: 'sales:manage',
    VIEW: 'sales:view',
  },
  SALES_RETURN: {
    READ: 'sales_return:read',
    MANAGE: 'sales_return:manage',
  },
  PURCHASE: {
    READ: 'purchase:read',
    CREATE: 'purchase:create',
    UPDATE: 'purchase:update',
    DELETE: 'purchase:delete',
    CANCEL: 'purchase:cancel',
    RETURN: 'purchase:return',
    CREATE_PAYMENT: 'purchase:create_payment',
    PAYMENT_VIEW: 'purchase:payment:view',
    PAYMENT_DELETE: 'purchase:payment:delete',
    STATUS_UPDATE: 'purchase:status:update',
    ATTACHMENT_UPLOAD: 'purchase:attachment:upload',
    ATTACHMENT_DELETE: 'purchase:attachment:delete',
    BULK_UPDATE: 'purchase:bulk:update',
    ANALYTICS_VIEW: 'purchase:analytics:view',
  },

  // ── CRM & Analytics ───────────────────────────────────────────────
  CUSTOMER: {
    READ: 'customer:read',
    CREATE: 'customer:create',
    UPDATE: 'customer:update',
    DELETE: 'customer:delete',
    CREDIT_LIMIT: 'customer:credit_limit',
  },
  ANALYTICS: {
    READ: 'analytics:read',
    EMI_READ: 'analytics:emi_read',
    EXPORT: 'analytics:export',
    VIEW_EXECUTIVE: 'analytics:view_executive',
    VIEW_FINANCIAL: 'analytics:view_financial',
    VIEW_BRANCH_COMPARISON: 'analytics:view_branch_comparison',
    VIEW_CUSTOMER_SEGMENTATION: 'analytics:view_customer_segmentation',
    VIEW_CUSTOMER_LTV: 'analytics:view_customer_ltv',
    VIEW_CHURN: 'analytics:view_churn',
    VIEW_INVENTORY: 'analytics:view_inventory',
    VIEW_STOCK_FORECAST: 'analytics:view_stock_forecast',
    VIEW_OPERATIONAL: 'analytics:view_operational',
    VIEW_STAFF_PERFORMANCE: 'analytics:view_staff_performance',
    VIEW_FORECAST: 'analytics:view_forecast',
    VIEW_ALERTS: 'analytics:view_alerts',
    VIEW_SECURITY_AUDIT: 'analytics:view_security_audit',
    EXPORT_DATA: 'analytics:export_data',
  },
  DASHBOARD: {
    VIEW: 'dashboard:view',
  },

  // ── Reports ───────────────────────────────────────────────────────
  REPORT: {
    PROFIT: 'report:profit',
    SALES: 'report:sales',
    TAX: 'report:tax',
    OUTSTANDING: 'report:outstanding',
  },

  // ── Communication & Collaboration ─────────────────────────────────
  NOTIFICATION: {
    READ: 'notification:read',
    MANAGE: 'notification:manage',
  },
  FEED: {
    READ: 'feed:read',
  },
  CHAT: {
    READ: 'chat:read',
    SEND: 'chat:send',
    DELETE: 'chat:delete',
    MANAGE_CHANNEL: 'chat:manage_channel',
  },
  ANNOUNCEMENT: {
    READ: 'announcement:read',
    MANAGE: 'announcement:manage',
  },
  MEETING: {
    SCHEDULE: 'meeting:schedule',
    READ: 'meeting:read',
    WRITE: 'meeting:write',
    RSVP: 'meeting:rsvp',
  },

  // ── Files, Notes & Tasks ──────────────────────────────────────────
  FILE: {
    UPLOAD: 'file:upload',
  },
  TASK: {
    CREATE: 'task:create',
  },
  NOTE: {
    READ: 'note:read',
    WRITE: 'note:write',
    DELETE: 'note:delete',
    VIEW_ANALYTICS: 'note:view_analytics',
    VIEW_CALENDAR: 'note:view_calendar',
    EXPORT_DATA: 'note:export_data',
    CREATE_TEMPLATE: 'note:create_template',
    USE_TEMPLATE: 'note:use_template',
    BULK_UPDATE: 'note:bulk_update',
    BULK_DELETE: 'note:bulk_delete',
    SHARE: 'note:share',
    MANAGE_SHARED: 'note:manage_shared',
    PIN: 'note:pin',
  },

  // ── Search ────────────────────────────────────────────────────────
  SEARCH: {
    GLOBAL: 'search:global',
  },

  // ── Wildcard (owner) ──────────────────────────────────────────────
  WILDCARD: '*',
} as const;

/** Union of all literal permission strings */
export type Permission = string;

/** Mode for checking multiple permissions */
export type PermissionMode = 'any' | 'all';
