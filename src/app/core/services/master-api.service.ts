import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class MasterApiService extends BaseApiService {

  // ==========================================================================
  // 1. AUTHENTICATION & USERS (/v1/auth, /v1/users)
  // ==========================================================================

  login(data: any): Observable<any> {
    return this.post('/v1/auth/login', data, 'login');
  }

  signup(data: any): Observable<any> {
    return this.post('/v1/auth/signup', data, 'signup');
  }

  logout(): Observable<any> {
    return this.post('/v1/auth/logout', {}, 'logout');
  }

  refreshToken(): Observable<any> {
    return this.post('/v1/auth/refresh-token', {}, 'refreshToken');
  }

  forgotPassword(email: string): Observable<any> {
    return this.post('/v1/auth/forgotPassword', { email }, 'forgotPassword');
  }

  resetPassword(token: string, data: any): Observable<any> {
    return this.patch(`/v1/auth/resetPassword/${token}`, data, 'resetPassword');
  }

  verifyToken(): Observable<any> {
    return this.get('/v1/auth/verify-token', {}, 'verifyToken');
  }

  // --- User Management ---
  getMe(): Observable<any> {
    return this.get('/v1/users/me', {}, 'getMe');
  }

  updateMyProfile(data: any): Observable<any> {
    return this.patch('/v1/users/me', data, 'updateMyProfile');
  }

  updateMyPassword(data: any): Observable<any> {
    return this.patch('/v1/users/updateMyPassword', data, 'updateMyPassword');
  }

  uploadProfilePhoto(formData: FormData): Observable<any> {
    return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
  }

  // Admin User Management
  getAllUsers(params?: any): Observable<any> {
    return this.get('/v1/users', params, 'getAllUsers');
  }

  createUser(data: any): Observable<any> {
    return this.post('/v1/users', data, 'createUser');
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.patch(`/v1/users/${id}`, data, 'updateUser');
  }

  deleteUser(id: string): Observable<any> {
    return this.delete(`/v1/users/${id}`, 'deleteUser');
  }

  searchUsers(query: string): Observable<any> {
    return this.get('/v1/users/search', { q: query }, 'searchUsers');
  }

  activateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/activate`, {}, 'activateUser');
  }

  deactivateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/deactivate`, {}, 'deactivateUser');
  }

  getUserActivity(id: string): Observable<any> {
    return this.get(`/v1/users/${id}/activity`, {}, 'getUserActivity');
  }

  adminUpdateUserPassword(id: string, data: any): Observable<any> {
    return this.patch(`/v1/users/${id}/password`, data, 'adminUpdateUserPassword');
  }

  // ==========================================================================
  // 2. ORGANIZATION & BRANCHES (/v1/organization, /v1/branches)
  // ==========================================================================

  createOrganization(data: any): Observable<any> {
    return this.post('/v1/organization/create', data, 'createOrganization');
  }

  getMyOrganization(): Observable<any> {
    return this.get('/v1/organization/my-organization', {}, 'getMyOrganization');
  }

  updateMyOrganization(data: any): Observable<any> {
    return this.patch('/v1/organization/my-organization', data, 'updateMyOrganization');
  }

  getPendingMembers(): Observable<any> {
    return this.get('/v1/organization/pending-members', {}, 'getPendingMembers');
  }

  approveMember(data: any): Observable<any> {
    return this.post('/v1/organization/approve-member', data, 'approveMember');
  }

  // Extra Org Actions (Invites, Transfer)
  transferOwnership(data: any): Observable<any> {
    return this.patch('/v1/neworganization/transfer-ownership', data, 'transferOwnership');
  }

  inviteUser(data: any): Observable<any> {
    return this.post('/v1/neworganization/invite', data, 'inviteUser');
  }

  removeMember(memberId: string): Observable<any> {
    return this.delete(`/v1/neworganization/members/${memberId}`, 'removeMember');
  }

  getOrgActivityLog(): Observable<any> {
    return this.get('/v1/neworganization/activity-log', {}, 'getOrgActivityLog');
  }

  // Branches
  getAllBranches(params?: any): Observable<any> {
    return this.get('/v1/branches', params, 'getAllBranches');
  }

  getMyBranches(): Observable<any> {
    return this.get('/v1/branches/my-branches', {}, 'getMyBranches');
  }

  createBranch(data: any): Observable<any> {
    return this.post('/v1/branches', data, 'createBranch');
  }

  updateBranch(id: string, data: any): Observable<any> {
    return this.patch(`/v1/branches/${id}`, data, 'updateBranch');
  }

  deleteBranch(id: string): Observable<any> {
    return this.delete(`/v1/branches/${id}`, 'deleteBranch');
  }

  // ==========================================================================
  // 3. INVOICES & PAYMENTS (/v1/invoices, /v1/payments)
  // ==========================================================================

  getAllInvoices(params?: any): Observable<any> {
    return this.get('/v1/invoices', params, 'getAllInvoices');
  }

  createInvoice(data: any): Observable<any> {
    return this.post('/v1/invoices', data, 'createInvoice');
  }

  getInvoiceById(id: string): Observable<any> {
    return this.get(`/v1/invoices/${id}`, {}, 'getInvoiceById');
  }

  updateInvoice(id: string, data: any): Observable<any> {
    return this.patch(`/v1/invoices/${id}`, data, 'updateInvoice');
  }

  deleteInvoice(id: string): Observable<any> {
    return this.delete(`/v1/invoices/${id}`, 'deleteInvoice');
  }

  validateInvoiceNumber(number: string): Observable<any> {
    return this.get(`/v1/invoices/validate-number/${number}`, {}, 'validateInvoiceNumber');
  }

  bulkUpdateInvoiceStatus(data: { ids: string[], status: string }): Observable<any> {
    return this.patch('/v1/invoices/bulk-status', data, 'bulkUpdateInvoiceStatus');
  }

  getInvoiceProfitSummary(params?: any): Observable<any> {
    return this.get('/v1/invoices/profit-summary', params, 'getInvoiceProfitSummary');
  }

  getInvoiceHistory(id: string): Observable<any> {
    return this.get(`/v1/invoices/${id}/history`, {}, 'getInvoiceHistory');
  }

  // PDF & Email
  emailInvoice(id: string): Observable<any> {
    // Note: Route mounted at /v1/invoices/pdf/:id/email based on app.js
    return this.post(`/v1/invoices/pdf/${id}/email`, {}, 'emailInvoice');
  }

  downloadInvoice(id: string): Observable<Blob> {
    // Note: Route mounted at /v1/invoices/pdf/:id/download based on app.js
    return this.http.get(`${this.baseUrl}/v1/invoices/pdf/${id}/download`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  exportInvoices(params?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/invoices/export`, {
      params: this.createHttpParams(params),
      responseType: 'blob',
      withCredentials: true
    });
  }

  // Payments
  getAllPayments(params?: any): Observable<any> {
    return this.get('/v1/payments', params, 'getAllPayments');
  }

  createPayment(data: any): Observable<any> {
    return this.post('/v1/payments', data, 'createPayment');
  }

  getPaymentById(id: string): Observable<any> {
    return this.get(`/v1/payments/${id}`, {}, 'getPaymentById');
  }

  downloadPaymentReceipt(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/payments/${id}/receipt/download`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  // ==========================================================================
  // 4. CUSTOMERS & SUPPLIERS (/v1/customers, /v1/suppliers)
  // ==========================================================================

  getAllCustomers(params?: any): Observable<any> {
    return this.get('/v1/customers', params, 'getAllCustomers');
  }

  createCustomer(data: any): Observable<any> {
    return this.post('/v1/customers', data, 'createCustomer');
  }

  updateCustomer(id: string, data: any): Observable<any> {
    return this.patch(`/v1/customers/${id}`, data, 'updateCustomer');
  }

  deleteCustomer(id: string): Observable<any> {
    return this.delete(`/v1/customers/${id}`, 'deleteCustomer');
  }

  searchCustomers(query: string): Observable<any> {
    return this.get('/v1/customers/search', { q: query }, 'searchCustomers');
  }

  checkCustomerDuplicate(params: { email?: string, phone?: string, name?: string }): Observable<any> {
    return this.get('/v1/customers/check-duplicate', params, 'checkCustomerDuplicate');
  }

  uploadCustomerPhoto(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.patch(`/v1/customers/${id}/upload`, formData, 'uploadCustomerPhoto');
  }

  bulkUpdateCustomers(data: any): Observable<any> {
    return this.post('/v1/customers/bulk-update', data, 'bulkUpdateCustomers');
  }

  // Suppliers
  getAllSuppliers(params?: any): Observable<any> {
    return this.get('/v1/suppliers', params, 'getAllSuppliers');
  }

  createSupplier(data: any): Observable<any> {
    return this.post('/v1/suppliers', data, 'createSupplier');
  }

  updateSupplier(id: string, data: any): Observable<any> {
    return this.patch(`/v1/suppliers/${id}`, data, 'updateSupplier');
  }

  deleteSupplier(id: string): Observable<any> {
    return this.delete(`/v1/suppliers/${id}`, 'deleteSupplier');
  }

  searchSuppliers(query: string): Observable<any> {
    return this.get('/v1/suppliers/search', { q: query }, 'searchSuppliers');
  }

  // ==========================================================================
  // 5. PRODUCTS & INVENTORY (/v1/products)
  // ==========================================================================

  getAllProducts(params?: any): Observable<any> {
    return this.get('/v1/products', params, 'getAllProducts');
  }

  createProduct(data: any): Observable<any> {
    return this.post('/v1/products', data, 'createProduct');
  }

  getProductById(id: string): Observable<any> {
    return this.get(`/v1/products/${id}`, {}, 'getProductById');
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.patch(`/v1/products/${id}`, data, 'updateProduct');
  }

  deleteProduct(id: string): Observable<any> {
    return this.delete(`/v1/products/${id}`, 'deleteProduct');
  }

  searchProducts(query: string): Observable<any> {
    return this.get('/v1/products/search', { q: query }, 'searchProducts');
  }

  adjustStock(id: string, data: { type: 'add' | 'subtract', quantity: number, reason?: string }): Observable<any> {
    return this.post(`/v1/products/${id}/stock-adjust`, data, 'adjustStock');
  }

  uploadProductImages(id: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    return this.patch(`/v1/products/${id}/upload`, formData, 'uploadProductImages');
  }

  bulkImportProducts(data: any[]): Observable<any> {
    return this.post('/v1/products/bulk-import', data, 'bulkImportProducts');
  }

  // ==========================================================================
  // 6. ANALYTICS & REPORTS (/v1/analytics, /v1/statements, /v1/ledgers)
  // ==========================================================================

  getDashboardOverview(params?: any): Observable<any> {
    return this.get('/v1/analytics/dashboard', params, 'getDashboardOverview');
  }

  getFinancialReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/financials', params, 'getFinancialReport');
  }

  getSalesForecast(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/forecast', { branchId }, 'getSalesForecast');
  }

  exportAnalyticsData(type: string, params?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/analytics/export`, {
      params: this.createHttpParams({ type, ...params }),
      responseType: 'blob',
      withCredentials: true
    });
  }

  // Statements
  getProfitAndLoss(params?: any): Observable<any> {
    return this.get('/v1/statements/pl', params, 'getProfitAndLoss');
  }

  getBalanceSheet(params?: any): Observable<any> {
    return this.get('/v1/statements/balance-sheet', params, 'getBalanceSheet');
  }

  exportStatement(type: 'pl' | 'bs' | 'tb', params?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/statements/export`, {
      params: this.createHttpParams({ type, ...params }),
      responseType: 'blob',
      withCredentials: true
    });
  }

  // Ledgers
  getAllLedgers(params?: any): Observable<any> {
    return this.get('/v1/ledgers', params, 'getAllLedgers');
  }

  getCustomerLedger(customerId: string): Observable<any> {
    return this.get(`/v1/ledgers/customer/${customerId}`, {}, 'getCustomerLedger');
  }

  getSupplierLedger(supplierId: string): Observable<any> {
    return this.get(`/v1/ledgers/supplier/${supplierId}`, {}, 'getSupplierLedger');
  }

  exportLedgers(params?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/ledgers/export`, {
      params: this.createHttpParams(params),
      responseType: 'blob',
      withCredentials: true
    });
  }

  // ==========================================================================
  // 7. EXTRAS (Chat, Notes, EMI, Search, AI)
  // ==========================================================================

  // Global Search
  globalSearch(query: string): Observable<any> {
    return this.get('/v1/search/global', { q: query }, 'globalSearch');
  }

  // AI Agent
  chatWithAi(message: string, context?: any): Observable<any> {
    return this.post('/v1/ai-agent/chat', { message, ...context }, 'chatWithAi');
  }

  // Notes/Calendar
  getAllNotes(): Observable<any> {
    return this.get('/v1/notes', {}, 'getAllNotes');
  }

  createNote(data: any): Observable<any> {
    return this.post('/v1/notes', data, 'createNote');
  }

  getCalendarSummary(): Observable<any> {
    return this.get('/v1/notes/calendar-summary', {}, 'getCalendarSummary');
  }

  // EMI
  getAllEmis(params?: any): Observable<any> {
    return this.get('/v1/emi', params, 'getAllEmis');
  }

  createEmiPlan(data: any): Observable<any> {
    return this.post('/v1/emi', data, 'createEmiPlan');
  }

  payEmiInstallment(data: any): Observable<any> {
    return this.patch('/v1/emi/pay', data, 'payEmiInstallment');
  }

  // Chat
  createChannel(data: any): Observable<any> {
    return this.post('/v1/chat/channels', data, 'createChannel');
  }

  getChannels(): Observable<any> {
    return this.get('/v1/chat/channels', {}, 'getChannels');
  }

  getChannelMessages(channelId: string): Observable<any> {
    return this.get(`/v1/chat/channels/${channelId}/messages`, {}, 'getChannelMessages');
  }

  uploadChatFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post('/v1/chat/upload', formData, 'uploadChatFile');
  }

  // Master Lists (Roles, Categories, etc.)
  getMasterList(type?: string): Observable<any> {
    return this.get('/v1/master-list', { type }, 'getMasterList');
  }

  getRoles(): Observable<any> {
    return this.get('/v1/roles', {}, 'getRoles');
  }
  // ==========================================================================
  // 8. DEEP ANALYTICS (Granular Widgets)
  // ==========================================================================

  getProfitabilityReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/profitability', params, 'getProfitabilityReport');
  }

  getCashFlowReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/cash-flow', params, 'getCashFlowReport');
  }

  getDebtorAgingReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/debtor-aging', params, 'getDebtorAgingReport');
  }

  getTaxReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/tax-report', params, 'getTaxReport');
  }

  getStaffPerformance(params?: any): Observable<any> {
    return this.get('/v1/analytics/staff-performance', params, 'getStaffPerformance');
  }

  getPeakBusinessHours(params?: any): Observable<any> {
    return this.get('/v1/analytics/peak-hours', params, 'getPeakBusinessHours');
  }

  getDeadStockReport(params?: any): Observable<any> {
    return this.get('/v1/analytics/dead-stock', params, 'getDeadStockReport');
  }

  getStockPredictions(params?: any): Observable<any> {
    return this.get('/v1/analytics/stock-predictions', params, 'getStockPredictions');
  }

  getCustomerSegmentation(): Observable<any> {
    return this.get('/v1/analytics/customer-segmentation', {}, 'getCustomerSegmentation');
  }

  getSecurityAuditLog(params?: any): Observable<any> {
    return this.get('/v1/analytics/security-audit', params, 'getSecurityAuditLog');
  }

  // ==========================================================================
  // 9. SECURITY & SESSIONS (/v1/sessions)
  // ==========================================================================

  getMySessions(): Observable<any> {
    return this.get('/v1/sessions/me', {}, 'getMySessions');
  }

  getAllSessions(params?: any): Observable<any> {
    return this.get('/v1/sessions', params, 'getAllSessions');
  }

  revokeSession(sessionId: string): Observable<any> {
    return this.patch(`/v1/sessions/${sessionId}/revoke`, {}, 'revokeSession');
  }

  revokeAllOtherSessions(): Observable<any> {
    return this.patch('/v1/sessions/revoke-all', {}, 'revokeAllOtherSessions');
  }

  // ==========================================================================
  // 10. RECONCILIATION (/v1/reconciliation)
  // ==========================================================================

  getReconciliationTopMismatches(): Observable<any> {
    return this.get('/v1/reconciliation/top', {}, 'getReconciliationTopMismatches');
  }

  getReconciliationDetail(): Observable<any> {
    return this.get('/v1/reconciliation/detail', {}, 'getReconciliationDetail');
  }
}