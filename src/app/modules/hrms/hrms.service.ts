// services/hrms.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

export interface Department {
  _id?: string;
  name: string;
  budgetCode: string,
  contactEmail: string,
  contactPhone: string,
  location: string,
  code: string;
  description?: string;
  parentDepartment?: string;
  headOfDepartment?: string;
  assistantHOD?: string;
  costCenter?: string;
  employeeCount?: number;
  isActive?: boolean;
  path?: string;
  level?: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata: {
    establishedDate: undefined,
    division: string,
    region: string
  }
}

export interface DepartmentTree extends Department {
  children: DepartmentTree[];
}

// Designation Interfaces
export interface Designation {
  _id?: string;
  title: string;
  code: string;
  description?: string;
  level: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  nextDesignation?: string;
  promotionAfterYears?: number;
  jobFamily?: string;
  salaryBand?: {
    min: number;
    max: number;
    currency: string;
  };
  reportsTo?: string[];
  isActive?: boolean;
  metadata?: {
    isManager: boolean;
    isExecutive: boolean;
    requiresApproval: boolean;
  };
}

export interface SalaryBand {
  level: number;
  grade: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  designations: { title: string; code: string }[];
}

// Shift Interfaces
export interface Shift {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  startTime: string;
  endTime: string;
  breakDurationMins: number;
  breaks?: Array<{
    name: string;
    startTime: string;
    endTime: string;
    isPaid: boolean;
  }>;
  gracePeriodMins: number;
  lateThresholdMins: number;
  halfDayThresholdHrs: number;
  minFullDayHrs: number;
  shiftType: 'fixed' | 'rotating' | 'flexi' | 'split' | 'night';
  isNightShift: boolean;
  weeklyOffs: number[];
  overtimeRules?: {
    enabled: boolean;
    multiplier: number;
    afterHours: number;
    doubleAfterHours: number;
    holidayMultiplier: number;
  };
  isActive?: boolean;
}

export interface ShiftGroup {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  shifts: Array<{
    shiftId: string;
    sequence: number;
    color?: string;
  }>;
  rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  rotationPattern?: Array<{
    dayOffset: number;
    shiftId: string;
  }>;
  applicableDepartments?: string[];
  applicableDesignations?: string[];
  isActive?: boolean;
}

export interface ShiftAssignment {
  _id?: string;
  user: string;
  shiftId: string;
  shiftGroupId?: string;
  startDate: Date;
  endDate?: Date;
  isTemporary: boolean;
  status: 'active' | 'expired' | 'cancelled';
  assignedBy: string;
}

// Leave Management Interfaces
export interface LeaveRequest {
  _id?: string;
  leaveRequestId?: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'compensatory' | 'paid' | 'unpaid' | 'marriage' | 'paternity' | 'maternity' | 'bereavement';
  startDate: Date;
  endDate: Date;
  daysCount: number;
  reason: string;
  additionalNotes?: string;
  attachments?: Array<{
    url: string;
    fileName: string;
  }>;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  handoverTo?: string;
  handoverNotes?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  approvalFlow?: Array<{
    approver: string;
    level: number;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    actionAt?: Date;
  }>;
  rejectionReason?: string;
}

export interface LeaveBalance {
  _id?: string;
  financialYear: string;
  casualLeave: { total: number; used: number };
  sickLeave: { total: number; used: number };
  earnedLeave: { total: number; used: number };
  compensatoryOff: { total: number; used: number };
  paidLeave: { total: number; used: number };
  unpaidLeave: { used: number };
  transactions: Array<{
    date: Date;
    leaveType: string;
    changeType: 'credited' | 'debited' | 'adjusted' | 'expired' | 'carry_forward';
    amount: number;
    runningBalance: number;
    referenceId?: string;
    description: string;
  }>;
}

export interface LeaveBalanceSummary {
  financialYear: string;
  balance: {
    casual: { total: number; used: number; available: number };
    sick: { total: number; used: number; available: number };
    earned: { total: number; used: number; available: number };
  };
  upcomingLeaves: any[];
  recentLeaves: any[];
  transactions: any[];
}

// Attendance Interfaces
export interface AttendanceLog {
  _id?: string;
  source: 'machine' | 'web' | 'mobile' | 'admin_manual' | 'api';
  machineId?: string;
  user: string;
  timestamp: Date;
  type: 'in' | 'out' | 'break_start' | 'break_end' | 'remote_in' | 'remote_out';
  ipAddress?: string;
  userAgent?: string;
  location?: {
    coordinates: [number, number];
    accuracy?: number;
    geofenceStatus?: 'inside' | 'outside' | 'disabled';
    geofenceId?: string;
  };
  isVerified?: boolean;
  processingStatus?: 'pending' | 'processed' | 'flagged' | 'rejected' | 'corrected';
}

export interface AttendanceDaily {
  _id?: string;
  user: string;
  date: Date;
  firstIn?: Date;
  lastOut?: Date;
  totalWorkHours: number;
  breakHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'week_off' | 'holiday' | 'work_from_home';
  isLate: boolean;
  isHalfDay: boolean;
  isRegularized?: boolean;
  shiftId?: string;
  leaveRequestId?: string;
  holidayId?: string;
  logs: string[];
}

export interface AttendanceDashboard {
  date: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    onLeave: number;
    onHoliday: number;
    late: number;
    attendancePercentage: number;
  };
  departmentWise: any[];
  recentActivity: any[];
}

export interface AttendanceReport {
  period: { from: string; to: string };
  summary: {
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
  };
  report: any[];
}

// Machine Interfaces
export interface AttendanceMachine {
  _id?: string;
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  branchId: string;
  providerType: 'generic' | 'zkteco' | 'hikvision' | 'essl' | 'bioenable';
  ipAddress?: string;
  connectionProtocol?: 'tcp' | 'http' | 'websocket' | 'mqtt';
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  connectionStatus?: 'online' | 'offline';
  lastSyncAt?: Date;
  lastPingAt?: Date;
  capabilities?: {
    faceRecognition: boolean;
    fingerprint: boolean;
    rfid: boolean;
    temperature: boolean;
  };
  apiKey?: string; // Only returned on creation
}

export interface MachineStatus {
  machine: {
    _id: string;
    name: string;
    serialNumber: string;
    status: string;
    connectionStatus: string;
    isOnline: boolean;
  };
  stats: {
    totalLogs: number;
    todayLogs: number;
    recentErrors: number;
    lastSyncAt: Date;
    lastPingAt: Date;
    uptime: string;
  };
}

// GeoFence Interfaces
export interface GeoFence {
  _id?: string;
  name: string;
  code: string;
  type: 'circle' | 'polygon' | 'building';
  center?: {
    coordinates: [number, number];
  };
  radius?: number;
  polygon?: any;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  applicableToAll?: boolean;
  applicableUsers?: string[];
  applicableDepartments?: string[];
  isActive?: boolean;
}

export interface GeoFenceCheck {
  isInside: boolean;
  distance: string | null;
  geofence: {
    _id: string;
    name: string;
  };
}

// Holiday Interfaces
export interface Holiday {
  _id?: string;
  name: string;
  date: Date;
  year: number;
  description?: string;
  holidayType: 'national' | 'state' | 'festival' | 'company' | 'restricted';
  isOptional: boolean;
  branchId?: string;
  recurring?: {
    isRecurring: boolean;
    frequency: 'yearly' | 'monthly';
  };
  isActive?: boolean;
}

export interface HolidayCalendar {
  year: number;
  calendar: Array<{
    date: string;
    dayOfWeek: number;
    isHoliday: boolean;
    holidays: Holiday[];
  }>;
}

// ======================================================
// HRMS SERVICE
// ======================================================

@Injectable({
  providedIn: 'root'
})
export class HRMSService extends BaseApiService {

  // ======================================================
  // DEPARTMENT ENDPOINTS
  // ======================================================

  /**
   * Get all departments
   */
  getDepartments(params?: any): Observable<{ status: string; data: { departments: Department[] } }> {
    return this.get<{ status: string; data: { departments: Department[] } }>('/v1/hrms/departments', params);
  }

  /**
   * Get department hierarchy tree
   */
  getDepartmentHierarchy(): Observable<{ status: string; data: { hierarchy: DepartmentTree[] } }> {
    return this.get<{ status: string; data: { hierarchy: DepartmentTree[] } }>('/v1/hrms/departments/hierarchy');
  }

  /**
   * Get department tree view
   */
  getDepartmentTree(): Observable<{ status: string; data: { departments: DepartmentTree[] } }> {
    return this.get<{ status: string; data: { departments: DepartmentTree[] } }>('/v1/hrms/departments?tree=true');
  }

  /**
   * Get department statistics
   */
  getDepartmentStats(): Observable<{ status: string; data: { stats: any } }> {
    return this.get<{ status: string; data: { stats: any } }>('/v1/hrms/departments/stats/summary');
  }

  /**
   * Get single department
   */
  getDepartment(id: string): Observable<{ status: string; data: { department: Department } }> {
    return this.get<{ status: string; data: { department: Department } }>(`/v1/hrms/departments/${id}`);
  }

  /**
   * Create department
   */
  createDepartment(data: Partial<Department>): Observable<{ status: string; data: { department: Department } }> {
    return this.post<{ status: string; data: { department: Department } }>('/v1/hrms/departments', data);
  }

  /**
   * Update department
   */
  updateDepartment(id: string, data: Partial<Department>): Observable<{ status: string; data: { department: Department } }> {
    return this.patch<{ status: string; data: { department: Department } }>(`/v1/hrms/departments/${id}`, data);
  }

  /**
   * Delete department
   */
  deleteDepartment(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/departments/${id}`);
  }

  /**
   * Get department employees
   */
  getDepartmentEmployees(id: string, params?: any): Observable<{ status: string; data: { employees: any[] } }> {
    return this.get<{ status: string; data: { employees: any[] } }>(`/v1/hrms/departments/${id}/employees`, params);
  }

  /**
   * Bulk update departments
   */
  bulkUpdateDepartments(operations: any[]): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/departments/bulk', { operations });
  }

  // ======================================================
  // DESIGNATION ENDPOINTS
  // ======================================================

  /**
   * Get all designations
   */
  getDesignations(params?: any): Observable<any> {
    return this.get<{ status: string; data: { designations: Designation[] } }>('/v1/hrms/designations', params);
  }

  /**
   * Get designation hierarchy
   */
  getDesignationHierarchy(): Observable<{ status: string; data: any }> {
    return this.get<{ status: string; data: any }>('/v1/hrms/designations/hierarchy');
  }

  /**
   * Get salary bands
   */
  getSalaryBands(): Observable<{ status: string; data: { internal: SalaryBand[]; marketRates: any } }> {
    return this.get<{ status: string; data: { internal: SalaryBand[]; marketRates: any } }>('/v1/hrms/designations/salary-bands');
  }

  /**
   * Get promotion eligible employees
   */
  getPromotionEligible(designationId: string, years?: number): Observable<{ status: string; data: any }> {
    const params = { designationId, years: years || 2 };
    return this.get<{ status: string; data: any }>('/v1/hrms/designations/promotion-eligible', params);
  }

  /**
   * Get single designation
   */
  getDesignation(id: string): Observable<{ status: string; data: { designation: Designation } }> {
    return this.get<{ status: string; data: { designation: Designation } }>(`/v1/hrms/designations/${id}`);
  }

  /**
   * Get career path
   */
  getCareerPath(id: string): Observable<{ status: string; data: any }> {
    return this.get<{ status: string; data: any }>(`/v1/hrms/designations/career-path/${id}`);
  }

  // ---------------- pending
  /**
   * Get designation employees
   */
  getDesignationEmployees(id: string, params?: any): Observable<{ status: string; data: { employees: any[] } }> {
    return this.get<{ status: string; data: { employees: any[] } }>(`/v1/hrms/designations/${id}/employees`, params);
  }

  /**
   * Create designation
   */
  createDesignation(data: Partial<Designation>): Observable<{ status: string; data: { designation: Designation } }> {
    return this.post<{ status: string; data: { designation: Designation } }>('/v1/hrms/designations', data);
  }

  /**
   * Update designation
   */
  updateDesignation(id: string, data: Partial<Designation>): Observable<{ status: string; data: { designation: Designation } }> {
    return this.patch<{ status: string; data: { designation: Designation } }>(`/v1/hrms/designations/${id}`, data);
  }

  /**
   * Delete designation
   */
  deleteDesignation(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/designations/${id}`);
  }
  // ---------------- pending

  /**
   * Bulk create designations
   */
  bulkCreateDesignations(designations: Partial<Designation>[]): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/designations/bulk', { designations });
  }

  // ======================================================
  // SHIFT ENDPOINTS
  // ======================================================

  /**
   * Get all shifts
   */
  getShifts(params?: any): Observable<{ status: string; data: { shifts: Shift[] } }> {
    return this.get<{ status: string; data: { shifts: Shift[] } }>('/v1/hrms/shifts', params);
  }

  /**
   * Get shift coverage
   */
  getShiftCoverage(date?: Date): Observable<{ status: string; data: { coverage: any[] } }> {
    const params = date ? { date: date.toISOString().split('T')[0] } : {};
    return this.get<{ status: string; data: { coverage: any[] } }>('/v1/hrms/shifts/coverage', params);
  }

  /**
   * Get shift timeline
   */
  getShiftTimeline(date?: any): Observable<{ status: string; data: { timeline: any[] } }> {
    // const params = date ;
    return this.get<{ status: string; data: { timeline: any[] } }>('/v1/hrms/shifts/timeline', date);
  }

  /**
   * Calculate shift hours
   */
  calculateShiftHours(data: { startTime: string; endTime: string; breaks?: any[] }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/shifts/calculate-hours', data);
  }

  // -------------- pending
  /**
   * Validate shift assignment
   */
  validateShiftAssignment(data: { shiftId: string; userId: string; date?: Date }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/shifts/validate-assignment', data);
  }

  /**
   * Get single shift
   */
  getShift(id: any): Observable<{ status: string; data: { shift: Shift } }> {
    return this.get<{ status: string; data: { shift: Shift } }>(`/v1/hrms/shifts/${id}`);
  }

  /**
   * Get shift assignments
   */
  getShiftAssignments(id: string, params?: any): Observable<{ status: string; data: { users: any[] } }> {
    return this.get<{ status: string; data: { users: any[] } }>(`/v1/hrms/shifts/${id}/assignments`, params);
  }

  /**
   * Create shift
   */
  createShift(data: Partial<Shift>): Observable<{ status: string; data: { shift: Shift } }> {
    return this.post<{ status: string; data: { shift: Shift } }>('/v1/hrms/shifts', data);
  }

  /**
   * Update shift
   */
  updateShift(id: string, data: Partial<Shift>): Observable<{ status: string; data: { shift: Shift } }> {
    return this.patch<{ status: string; data: { shift: Shift } }>(`/v1/hrms/shifts/${id}`, data);
  }

  /**
   * Delete shift
   */
  deleteShift(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/shifts/${id}`);
  }

  /**
   * Clone shift
   */
  cloneShift(id: string): Observable<{ status: string; data: { shift: Shift } }> {
    return this.post<{ status: string; data: { shift: Shift } }>(`/v1/hrms/shifts/${id}/clone`, {});
  }

  // ======================================================
  // SHIFT GROUP ENDPOINTS
  // ======================================================

  /**
   * Get all shift groups
   */
  getShiftGroups(params?: any): Observable<{ status: string; data: { shiftGroups: ShiftGroup[] } }> {
    return this.get<{ status: string; data: { shiftGroups: ShiftGroup[] } }>('/v1/hrms/shift-groups', params);
  }

  /**
   * Get single shift group
   */
  getShiftGroup(id: string): Observable<{ status: string; data: { shiftGroup: ShiftGroup } }> {
    return this.get<{ status: string; data: { shiftGroup: ShiftGroup } }>(`/v1/hrms/shift-groups/${id}`);
  }

  /**
   * Create shift group
   */
  createShiftGroup(data: Partial<ShiftGroup>): Observable<{ status: string; data: { shiftGroup: ShiftGroup } }> {
    return this.post<{ status: string; data: { shiftGroup: ShiftGroup } }>('/v1/hrms/shift-groups', data);
  }

  /**
   * Update shift group
   */
  updateShiftGroup(id: string, data: Partial<ShiftGroup>): Observable<{ status: string; data: { shiftGroup: ShiftGroup } }> {
    return this.patch<{ status: string; data: { shiftGroup: ShiftGroup } }>(`/v1/hrms/shift-groups/${id}`, data);
  }

  /**
   * Delete shift group
   */
  deleteShiftGroup(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/shift-groups/${id}`);
  }

  /**
   * Generate rotation schedule
   */
  generateRotationSchedule(id: string, data: { startDate: Date; endDate: Date; userIds?: string[] }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>(`/v1/hrms/shift-groups/${id}/generate-schedule`, data);
  }

  /**
   * Assign group to users
   */
  assignGroupToUsers(id: string, data: { userIds: string[]; startDate: Date; endDate?: Date }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>(`/v1/hrms/shift-groups/${id}/assign`, data);
  }

  /**
   * Get group assignments
   */
  getGroupAssignments(id: string): Observable<{ status: string; data: { assignments: ShiftAssignment[] } }> {
    return this.get<{ status: string; data: { assignments: ShiftAssignment[] } }>(`/v1/hrms/shift-groups/${id}/assignments`);
  }

  // ======================================================
  // LEAVE REQUEST ENDPOINTS
  // ======================================================

  /**
   * Get all leave requests
   */
  getLeaveRequests(params?: any): Observable<{ status: string; data: { leaveRequests: LeaveRequest[] } }> {
    return this.get<{ status: string; data: { leaveRequests: LeaveRequest[] } }>('/v1/hrms/leave-requests', params);
  }

  /**
   * Get my leave requests
   */
  getMyLeaveRequests(params?: any): Observable<{ status: string; data: { leaveRequests: LeaveRequest[] } }> {
    return this.get<{ status: string; data: { leaveRequests: LeaveRequest[] } }>('/v1/hrms/leave-requests/my-requests', params);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): Observable<{ status: string; data: any }> {
    return this.get<{ status: string; data: any }>('/v1/hrms/leave-requests/pending-approvals');
  }

  /**
   * Get leave balance summary
   */
  getLeaveBalanceSummary(financialYear?: string): Observable<{ status: string; data: LeaveBalanceSummary }> {
    const params = financialYear ? { financialYear } : {};
    return this.get<{ status: string; data: LeaveBalanceSummary }>('/v1/hrms/leave-requests/balance-summary', params);
  }

  /**
   * Get team leave calendar
   */
  getTeamLeaveCalendar(month?: number, year?: number): Observable<{ status: string; data: any }> {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    return this.get<{ status: string; data: any }>('/v1/hrms/leave-requests/team-calendar', params);
  }

  /**
   * Get leave analytics
   */
  getLeaveAnalytics(financialYear?: string, departmentId?: string): Observable<{ status: string; data: any }> {
    const params: any = {};
    if (financialYear) params.financialYear = financialYear;
    if (departmentId) params.departmentId = departmentId;
    return this.get<{ status: string; data: any }>('/v1/hrms/leave-requests/analytics', params);
  }

  /**
   * Get single leave request
   */
  getLeaveRequest(id: string): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.get<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}`);
  }

  /**
   * Create leave request
   */
  createLeaveRequest(data: Partial<LeaveRequest>): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.post<{ status: string; data: { leaveRequest: LeaveRequest } }>('/v1/hrms/leave-requests', data);
  }

  /**
   * Update leave request
   */
  updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.patch<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}`, data);
  }

  /**
   * Cancel leave request
   */
  cancelLeaveRequest(id: string): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.delete<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}`);
  }

  /**
   * Approve leave request
   */
  approveLeaveRequest(id: string, comments?: string): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.patch<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}/approve`, { comments });
  }

  /**
   * Reject leave request
   */
  rejectLeaveRequest(id: string, reason: string): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.patch<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}/reject`, { reason });
  }

  /**
   * Escalate leave request
   */
  escalateLeaveRequest(id: string, data: { reason: string; escalateTo: string }): Observable<{ status: string; data: { leaveRequest: LeaveRequest } }> {
    return this.patch<{ status: string; data: { leaveRequest: LeaveRequest } }>(`/v1/hrms/leave-requests/${id}/escalate`, data);
  }

  /**
   * Bulk approve leave requests
   */
  bulkApproveLeaves(requestIds: string[], comments?: string): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/leave-requests/bulk-approve', { requestIds, comments });
  }

  // ======================================================
  // LEAVE BALANCE ENDPOINTS
  // ======================================================

  /**
   * Get all leave balances (admin)
   */
  getAllLeaveBalances(params?: any): Observable<{ status: string; data: { leaveBalances: LeaveBalance[] } }> {
    return this.get<{ status: string; data: { leaveBalances: LeaveBalance[] } }>('/v1/hrms/leave-balances', params);
  }

  /**
   * Get my leave balance
   */
  getMyLeaveBalance(financialYear?: string): Observable<{ status: string; data: LeaveBalance }> {
    const params = financialYear ? { financialYear } : {};
    return this.get<{ status: string; data: LeaveBalance }>('/v1/hrms/leave-balances/my-balance', params);
  }

  /**
   * Get leave balance report
   */
  getLeaveBalanceReport(financialYear?: string, departmentId?: string): Observable<{ status: string; data: any }> {
    const params: any = {};
    if (financialYear) params.financialYear = financialYear;
    if (departmentId) params.departmentId = departmentId;
    return this.get<{ status: string; data: any }>('/v1/hrms/leave-balances/report', params);
  }

  /**
   * Get utilization trends
   */
  getUtilizationTrends(years?: number): Observable<{ status: string; data: any }> {
    const params = years ? { years } : {};
    return this.get<{ status: string; data: any }>('/v1/hrms/leave-balances/utilization-trends', params);
  }

  /**
   * Get single leave balance
   */
  getLeaveBalance(id: string): Observable<{ status: string; data: { leaveBalance: LeaveBalance } }> {
    return this.get<{ status: string; data: { leaveBalance: LeaveBalance } }>(`/v1/hrms/leave-balances/${id}`);
  }

  /**
   * Update leave balance (admin)
   */
  updateLeaveBalance(id: string, data: any): Observable<{ status: string; data: { leaveBalance: LeaveBalance } }> {
    return this.patch<{ status: string; data: { leaveBalance: LeaveBalance } }>(`/v1/hrms/leave-balances/${id}`, data);
  }

  /**
   * Initialize leave balance
   */
  initializeLeaveBalance(userId: string, financialYear?: string): Observable<{ status: string; data: { leaveBalance: LeaveBalance } }> {
    return this.post<{ status: string; data: { leaveBalance: LeaveBalance } }>('/v1/hrms/leave-balances/initialize', { userId, financialYear });
  }

  /**
   * Bulk initialize leave balances
   */
  bulkInitializeLeaveBalances(financialYear: string, carryForward?: boolean): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/leave-balances/bulk-initialize', { financialYear, carryForward });
  }

  // ======================================================
  // ATTENDANCE LOG ENDPOINTS
  // ======================================================

  /**
   * Get all attendance logs (admin)
   */
  getAttendanceLogs(params?: any): Observable<{ status: string; data: { logs: AttendanceLog[] } }> {
    return this.get<{ status: string; data: { logs: AttendanceLog[] } }>('/v1/hrms/attendance/logs', params);
  }

  /**
   * Get my logs
   */
  getMyLogs(params?: any): Observable<{ status: string; data: { logs: AttendanceLog[]; summary: any } }> {
    return this.get<{ status: string; data: { logs: AttendanceLog[]; summary: any } }>('/v1/hrms/attendance/logs/my-logs', params);
  }

  /**
   * Get user logs (admin)
   */
  getUserLogs(userId: string, params?: any): Observable<{ status: string; data: { logs: AttendanceLog[] } }> {
    return this.get<{ status: string; data: { logs: AttendanceLog[] } }>(`/v1/hrms/attendance/logs/user/${userId}`, params);
  }

  /**
   * Get log stats
   */
  getLogStats(fromDate?: Date, toDate?: Date): Observable<{ status: string; data: any }> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate.toISOString().split('T')[0];
    if (toDate) params.toDate = toDate.toISOString().split('T')[0];
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/logs/stats', params);
  }

  /**
   * Get realtime feed
   */
  getRealtimeFeed(limit?: number): Observable<{ status: string; data: any }> {
    const params = limit ? { limit } : {};
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/logs/realtime-feed', params);
  }

  /**
   * Create attendance log (punch in/out)
   */
  createAttendanceLog(data: Partial<AttendanceLog>): Observable<{ status: string; data: { log: AttendanceLog; daily: any } }> {
    return this.post<{ status: string; data: { log: AttendanceLog; daily: any } }>('/v1/hrms/attendance/logs', data);
  }

  /**
   * Get single log
   */
  getAttendanceLog(id: string): Observable<{ status: string; data: { log: AttendanceLog } }> {
    return this.get<{ status: string; data: { log: AttendanceLog } }>(`/v1/hrms/attendance/logs/${id}`);
  }

  /**
   * Verify log
   */
  verifyLog(id: string): Observable<{ status: string; data: { log: AttendanceLog } }> {
    return this.patch<{ status: string; data: { log: AttendanceLog } }>(`/v1/hrms/attendance/logs/${id}/verify`, {});
  }

  /**
   * Flag log
   */
  flagLog(id: string, reason: string): Observable<{ status: string; data: { log: AttendanceLog } }> {
    return this.patch<{ status: string; data: { log: AttendanceLog } }>(`/v1/hrms/attendance/logs/${id}/flag`, { reason });
  }

  /**
   * Correct log
   */
  correctLog(id: string, data: { timestamp: Date; type: string; reason: string }): Observable<{ status: string; data: any }> {
    return this.patch<{ status: string; data: any }>(`/v1/hrms/attendance/logs/${id}/correct`, data);
  }

  // ======================================================
  // ATTENDANCE DAILY ENDPOINTS
  // ======================================================

  /**
   * Get all daily attendance (admin)
   */
  getAllDailyAttendance(params?: any): Observable<{ status: string; data: { records: AttendanceDaily[] } }> {
    return this.get<{ status: string; data: { records: AttendanceDaily[] } }>('/v1/hrms/attendance/daily', params);
  }

  /**
   * Get my attendance
   */
  getMyAttendance(params?: any): Observable<{ status: string; data: { records: AttendanceDaily[]; summary: any } }> {
    return this.get<{ status: string; data: { records: AttendanceDaily[]; summary: any } }>('/v1/hrms/attendance/daily/my-attendance', params);
  }

  /**
   * Get today's attendance
   */
  getTodayAttendance(): Observable<{ status: string; data: AttendanceDaily & { todaysLogs: AttendanceLog[] } }> {
    return this.get<{ status: string; data: AttendanceDaily & { todaysLogs: AttendanceLog[] } }>('/v1/hrms/attendance/daily/today');
  }

  /**
   * Get attendance dashboard
   */
  getAttendanceDashboard(date?: Date): Observable<{ status: string; data: AttendanceDashboard }> {
    const params = date ? { date: date.toISOString().split('T')[0] } : {};
    return this.get<{ status: string; data: AttendanceDashboard }>('/v1/hrms/attendance/daily/dashboard', params);
  }

  /**
   * Get attendance report
   */
  getAttendanceReport(params: { fromDate: Date; toDate: Date; departmentId?: string; userId?: string }): Observable<{ status: string; data: AttendanceReport }> {
    const queryParams: any = {
      fromDate: params.fromDate.toISOString().split('T')[0],
      toDate: params.toDate.toISOString().split('T')[0]
    };
    if (params.departmentId) queryParams.departmentId = params.departmentId;
    if (params.userId) queryParams.userId = params.userId;
    return this.get<{ status: string; data: AttendanceReport }>('/v1/hrms/attendance/daily/report', queryParams);
  }

  /**
   * Get attendance trends
   */
  getAttendanceTrends(months?: number): Observable<{ status: string; data: any }> {
    const params = months ? { months } : {};
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/daily/trends', params);
  }

  /**
   * Export attendance
   */
  exportAttendance(params: { fromDate: Date; toDate: Date; format?: 'json' | 'csv' }): Observable<any> {
    const queryParams: any = {
      fromDate: params.fromDate.toISOString().split('T')[0],
      toDate: params.toDate.toISOString().split('T')[0],
      format: params.format || 'json'
    };
    return this.get<any>('/v1/hrms/attendance/daily/export', queryParams);
  }

  /**
   * Get single daily record
   */
  getDailyAttendance(id: string): Observable<{ status: string; data: { daily: AttendanceDaily } }> {
    return this.get<{ status: string; data: { daily: AttendanceDaily } }>(`/v1/hrms/attendance/daily/${id}`);
  }

  /**
   * Regularize attendance
   */
  regularizeAttendance(id: string, data: { firstIn?: Date; lastOut?: Date; status?: string; reason: string }): Observable<{ status: string; data: { daily: AttendanceDaily } }> {
    return this.patch<{ status: string; data: { daily: AttendanceDaily } }>(`/v1/hrms/attendance/daily/${id}/regularize`, data);
  }

  /**
   * Bulk update attendance
   */
  bulkUpdateAttendance(updates: any[]): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/daily/bulk-update', { updates });
  }

  /**
   * Recalculate daily attendance
   */
  recalculateDaily(date: Date): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/daily/recalculate', { date });
  }

  // ======================================================
  // ATTENDANCE MACHINE ENDPOINTS
  // ======================================================

  /**
   * Get all machines
   */
  getMachines(params?: any): Observable<{ status: string; data: { machines: AttendanceMachine[] } }> {
    return this.get<{ status: string; data: { machines: AttendanceMachine[] } }>('/v1/hrms/attendance/machines', params);
  }

  /**
   * Get machine analytics
   */
  getMachineAnalytics(days?: number): Observable<{ status: string; data: any }> {
    const params = days ? { days } : {};
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/machines/analytics', params);
  }

  /**
   * Get unmapped users
   */
  getUnmappedUsers(): Observable<{ status: string; data: { users: any[] } }> {
    return this.get<{ status: string; data: { users: any[] } }>('/v1/hrms/attendance/machines/unmapped-users');
  }

  /**
   * Get single machine
   */
  getMachine(id: string): Observable<{ status: string; data: { machine: AttendanceMachine } }> {
    return this.get<{ status: string; data: { machine: AttendanceMachine } }>(`/v1/hrms/attendance/machines/${id}`);
  }

  /**
   * Get machine status
   */
  getMachineStatus(id: string): Observable<{ status: string; data: MachineStatus }> {
    return this.get<{ status: string; data: MachineStatus }>(`/v1/hrms/attendance/machines/${id}/status`);
  }

  /**
   * Get machine logs
   */
  getMachineLogs(id: string, params?: any): Observable<{ status: string; data: { logs: AttendanceLog[] } }> {
    return this.get<{ status: string; data: { logs: AttendanceLog[] } }>(`/v1/hrms/attendance/machines/${id}/logs`, params);
  }

  /**
   * Create machine
   */
  createMachine(data: Partial<AttendanceMachine>): Observable<{ status: string; data: { machine: AttendanceMachine; apiKey: string } }> {
    return this.post<{ status: string; data: { machine: AttendanceMachine; apiKey: string } }>('/v1/hrms/attendance/machines', data);
  }

  /**
   * Update machine
   */
  updateMachine(id: string, data: Partial<AttendanceMachine>): Observable<{ status: string; data: { machine: AttendanceMachine } }> {
    return this.patch<{ status: string; data: { machine: AttendanceMachine } }>(`/v1/hrms/attendance/machines/${id}`, data);
  }

  /**
   * Delete machine
   */
  deleteMachine(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/attendance/machines/${id}`);
  }

  /**
   * Test machine connection
   */
  testMachineConnection(id: string): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>(`/v1/hrms/attendance/machines/${id}/test-connection`, {});
  }

  /**
   * Regenerate API key
   */
  regenerateMachineApiKey(id: string): Observable<{ status: string; data: { machine: any; apiKey: string } }> {
    return this.post<{ status: string; data: { machine: any; apiKey: string } }>(`/v1/hrms/attendance/machines/${id}/regenerate-key`, {});
  }

  /**
   * Map user to machine
   */
  mapUserToMachine(data: { userId: string; machineUserId: string }): Observable<{ status: string; data: { user: any } }> {
    return this.post<{ status: string; data: { user: any } }>('/v1/hrms/attendance/machines/map-user', data);
  }

  /**
   * Bulk map users
   */
  bulkMapUsers(mappings: Array<{ userId: string; machineUserId: string }>, deviceId?: string): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/machines/bulk-map', { mappings, deviceId });
  }

  /**
   * Bulk update machine status
   */
  bulkUpdateMachineStatus(data: { machineIds: string[]; status: string; reason?: string }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/machines/bulk-status', data);
  }

  // ======================================================
  // GEO FENCE ENDPOINTS
  // ======================================================

  /**
   * Get all geofences
   */
  getGeoFences(params?: any): Observable<{ status: string; data: { geofences: GeoFence[] } }> {
    return this.get<{ status: string; data: { geofences: GeoFence[] } }>('/v1/hrms/attendance/geofences', params);
  }

  /**
   * Get violation reports
   */
  getGeoFenceViolations(params?: { fromDate?: Date; toDate?: Date; userId?: string }): Observable<{ status: string; data: any }> {
    const queryParams: any = {};
    if (params?.fromDate) queryParams.fromDate = params.fromDate.toISOString().split('T')[0];
    if (params?.toDate) queryParams.toDate = params.toDate.toISOString().split('T')[0];
    if (params?.userId) queryParams.userId = params.userId;
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/geofences/violations', queryParams);
  }

  /**
   * Find nearby geofences
   */
  findNearbyGeofences(coordinates: [number, number], radius?: number): Observable<{ status: string; data: { geofences: any[] } }> {
    return this.post<{ status: string; data: { geofences: any[] } }>('/v1/hrms/attendance/geofences/nearby', {
      longitude: coordinates[0],
      latitude: coordinates[1],
      radius: radius || 1000
    });
  }

  /**
   * Get single geofence
   */
  getGeoFence(id: string): Observable<{ status: string; data: { geofence: GeoFence } }> {
    return this.get<{ status: string; data: { geofence: GeoFence } }>(`/v1/hrms/attendance/geofences/${id}`);
  }

  /**
   * Get geofence stats
   */
  getGeoFenceStats(id: string, days?: number): Observable<{ status: string; data: any }> {
    const params = days ? { days } : {};
    return this.get<{ status: string; data: any }>(`/v1/hrms/attendance/geofences/${id}/stats`, params);
  }

  /**
   * Check if point is inside geofence
   */
  checkGeoFencePoint(id: string, coordinates: [number, number]): Observable<{ status: string; data: GeoFenceCheck }> {
    return this.post<{ status: string; data: GeoFenceCheck }>(`/v1/hrms/attendance/geofences/${id}/check-point`, {
      longitude: coordinates[0],
      latitude: coordinates[1]
    });
  }

  /**
   * Create geofence
   */
  createGeoFence(data: Partial<GeoFence>): Observable<{ status: string; data: { geofence: GeoFence } }> {
    return this.post<{ status: string; data: { geofence: GeoFence } }>('/v1/hrms/attendance/geofences', data);
  }

  /**
   * Update geofence
   */
  updateGeoFence(id: string, data: Partial<GeoFence>): Observable<{ status: string; data: { geofence: GeoFence } }> {
    return this.patch<{ status: string; data: { geofence: GeoFence } }>(`/v1/hrms/attendance/geofences/${id}`, data);
  }

  /**
   * Delete geofence
   */
  deleteGeoFence(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/attendance/geofences/${id}`);
  }

  /**
   * Assign geofence to users
   */
  assignGeoFenceToUsers(id: string, userIds: string[]): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>(`/v1/hrms/attendance/geofences/${id}/assign-users`, { userIds });
  }

  /**
   * Assign geofence to departments
   */
  assignGeoFenceToDepartments(id: string, departmentIds: string[]): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>(`/v1/hrms/attendance/geofences/${id}/assign-departments`, { departmentIds });
  }

  // ======================================================
  // HOLIDAY ENDPOINTS
  // ======================================================

  /**
   * Get all holidays
   */
  getHolidays(params?: any): Observable<{ status: string; data: { holidays: Holiday[] } }> {
    return this.get<{ status: string; data: { holidays: Holiday[] } }>('/v1/hrms/attendance/holidays', params);
  }

  /**
   * Get holidays by year
   */
  getHolidaysByYear(year: number, branchId?: string): Observable<{ status: string; data: { holidays: Holiday[]; byMonth: any } }> {
    const params = branchId ? { branchId } : {};
    return this.get<{ status: string; data: { holidays: Holiday[]; byMonth: any } }>(`/v1/hrms/attendance/holidays/year/${year}`, params);
  }

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays(limit?: number): Observable<{ status: string; data: { holidays: Holiday[] } }> {
    const params = limit ? { limit } : {};
    return this.get<{ status: string; data: { holidays: Holiday[] } }>('/v1/hrms/attendance/holidays/upcoming', params);
  }

  /**
   * Get holiday stats
   */
  getHolidayStats(year?: number): Observable<{ status: string; data: any }> {
    const params = year ? { year } : {};
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/holidays/stats', params);
  }

  /**
   * Export holiday calendar
   */
  exportHolidayCalendar(year?: number, branchId?: string, format?: 'json' | 'calendar'): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    if (branchId) params.branchId = branchId;
    if (format) params.format = format;
    return this.get<any>('/v1/hrms/attendance/holidays/export', params);
  }

  /**
   * Check if date is holiday
   */
  checkHoliday(date: Date, branchId?: string): Observable<{ status: string; data: { isHoliday: boolean; holiday: Holiday | null } }> {
    return this.post<{ status: string; data: { isHoliday: boolean; holiday: Holiday | null } }>('/v1/hrms/attendance/holidays/check-date', {
      date: date.toISOString().split('T')[0],
      branchId
    });
  }

  /**
   * Get single holiday
   */
  getHoliday(id: string): Observable<{ status: string; data: { holiday: Holiday } }> {
    return this.get<{ status: string; data: { holiday: Holiday } }>(`/v1/hrms/attendance/holidays/${id}`);
  }

  /**
   * Create holiday
   */
  createHoliday(data: Partial<Holiday>): Observable<{ status: string; data: { holiday: Holiday } }> {
    return this.post<{ status: string; data: { holiday: Holiday } }>('/v1/hrms/attendance/holidays', data);
  }

  /**
   * Update holiday
   */
  updateHoliday(id: string, data: Partial<Holiday>): Observable<{ status: string; data: { holiday: Holiday } }> {
    return this.patch<{ status: string; data: { holiday: Holiday } }>(`/v1/hrms/attendance/holidays/${id}`, data);
  }

  /**
   * Delete holiday
   */
  deleteHoliday(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/attendance/holidays/${id}`);
  }

  /**
   * Bulk create holidays
   */
  bulkCreateHolidays(holidays: Partial<Holiday>[], year?: number): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/holidays/bulk', { holidays, year });
  }

  /**
   * Copy holidays from previous year
   */
  copyHolidaysFromYear(fromYear: number, toYear: number, branchId?: string): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/attendance/holidays/copy-year', { fromYear, toYear, branchId });
  }
}