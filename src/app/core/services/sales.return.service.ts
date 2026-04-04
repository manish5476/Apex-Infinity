// =============================================================================
// routes/salesReturn.routes.js
// =============================================================================
'use strict';

const express = require('express');
const router = express.Router();

const salesReturnController = require('../../modules/inventory/core/salesReturn.controller');
const authController = require('../../modules/auth/core/auth.controller');
const { checkPermission } = require('../../core/middleware/permission.middleware');
const { PERMISSIONS } = require('../../config/permissions');

// ─────────────────────────────────────────────
//  All routes require authentication
// ─────────────────────────────────────────────
router.use(authController.protect);

// ============================================================
//  COLLECTION ROUTES
// ============================================================

/**
 * POST /
 * Creates a new return in PENDING status.
 * * @payload {
 * invoiceId* (required): string,
 * reason* (required): string,
 * notes: string,
 * items* (required): Array<{
 * productId*: string,
 * quantity*: number (min 1)
 * }>
 * }
 * Note: Financials (refundAmount, tax, etc.) are intentionally omitted 
 * from the payload as they are auto-calculated by the backend schema.
 */
router.post(
  '/',
  checkPermission(PERMISSIONS.SALES_RETURN.MANAGE),
  salesReturnController.createReturn
);

/**
 * GET /
 * List all returns with optional filters and pagination.
 * * @query {
 * page: number,
 * limit: number,
 * status: 'pending' | 'approved' | 'rejected',
 * customerId: string,
 * invoiceId: string,
 * startDate: string (ISO),
 * endDate: string (ISO)
 * }
 */
router.get(
  '/',
  checkPermission(PERMISSIONS.SALES_RETURN.READ),
  salesReturnController.getReturns
);

// ============================================================
//  APPROVAL WORKFLOW ACTIONS
//  Must be defined BEFORE /:id to avoid route collisions
// ============================================================

/**
 * PATCH /:id/approve
 * Approves a pending return.
 * Triggers: stock restoration, COGS reversal, credit note journal, customer balance update.
 * * @params { id }
 * @payload {} (Empty body required by standard PATCH requests)
 */
router.patch(
  '/:id/approve',
  checkPermission(PERMISSIONS.SALES_RETURN.MANAGE),
  salesReturnController.approveReturn
);

/**
 * PATCH /:id/reject
 * Rejects a pending return. No stock or ledger changes.
 * * @params { id }
 * @payload { 
 * rejectionReason* (required): string 
 * }
 */
router.patch(
  '/:id/reject',
  checkPermission(PERMISSIONS.SALES_RETURN.MANAGE),
  salesReturnController.rejectReturn
);

// ============================================================
//  ITEM ROUTES
// ============================================================

/**
 * GET /:id
 * Get full details of a single return including populated items,
 * customer, invoice, and audit fields (approvedBy, rejectedBy).
 * * @params { id }
 * @payload none
 */
router.get(
  '/:id',
  checkPermission(PERMISSIONS.SALES_RETURN.READ),
  salesReturnController.getReturn
);

module.exports = router;  