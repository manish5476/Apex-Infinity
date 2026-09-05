// services/hrms.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

// Employee Master Interfaces
export interface EmployeePersonal {
  dateOfBirth?: Date | string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: string;
  secondaryPhone?: string;
}

export interface EmployeeEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface EmployeeAttendanceConfig {
  machineUserId?: string;
  shiftId?: string;
  shiftGroupId?: string;
  isAttendanceEnabled?: boolean;
  allowWebPunch?: boolean;
  allowMobilePunch?: boolean;
  enforceGeoFence?: boolean;
  geoFenceId?: string;
  geoFenceRadius?: number;
  biometricVerified?: boolean;
}

export interface EmployeeBankDetails {
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panCard?: string;
  uanNumber?: string;
  esiNumber?: string;
  pfNumber?: string;
}

export interface EmployeeCompensation {
  salaryStructureId?: string;
  payCycle?: 'monthly' | 'weekly' | 'daily';
  ctcAnnual?: number;
  currency?: string;
  bankDetails?: EmployeeBankDetails;
}

export interface Employee {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role?: string;
  } | null;
  organizationId: string;
  branchId?: string | { _id: string; name: string };
  firstName?: string;
  lastName?: string;
  displayName?: string;
  officialEmail?: string;
  phone?: string;
  employeeId: string;
  departmentId?: string | { _id: string; name: string; code?: string };
  designationId?: string | { _id: string; title: string; code?: string; level?: number };
  reportingManagerId?: string | { _id: string; name: string; email: string };
  employmentType: 'permanent' | 'contract' | 'intern' | 'probation' | 'consultant';
  workMode: 'office' | 'remote' | 'hybrid' | 'field';
  status: 'active' | 'probation' | 'notice_period' | 'relieved' | 'terminated' | 'inactive';
  dateOfJoining?: Date | string;
  probationEndDate?: Date | string;
  confirmationDate?: Date | string;
  dateOfExit?: Date | string;
  exitReason?: string;
  personal?: EmployeePersonal;
  emergencyContacts?: EmployeeEmergencyContact[];
  attendanceConfig?: EmployeeAttendanceConfig;
  compensation?: EmployeeCompensation;
  serviceYears?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateEmployeeDto {
  user?: string | null;
  branchId?: string;
  firstName: string;
  lastName?: string;
  officialEmail?: string;
  phone?: string;
  employeeId?: string;
  departmentId: string;
  designationId: string;
  reportingManagerId?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'probation' | 'consultant';
  workMode?: 'office' | 'remote' | 'hybrid' | 'field';
  status?: 'active' | 'probation' | 'notice_period' | 'relieved' | 'terminated' | 'inactive';
  dateOfJoining?: Date | string;
  probationEndDate?: Date | string;
  confirmationDate?: Date | string;
  personal?: EmployeePersonal;
  emergencyContacts?: EmployeeEmergencyContact[];
  attendanceConfig?: EmployeeAttendanceConfig;
  compensation?: EmployeeCompensation;
  createUser?: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    roleId?: string;
  };
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {}

export interface DeactivateEmployeeDto {
  dateOfExit?: Date | string;
  exitReason?: string;
  disableLoginAccess?: boolean;
}

export interface InviteUserDto {
  email: string;
  name: string;
  phone?: string;
  roleId?: string;
}

export interface CompanyAsset {
  _id: string;
  organizationId: string;
  assetTag: string;
  name: string;
  category: 'laptop' | 'desktop' | 'mobile' | 'sim' | 'vehicle' | 'access_card' | 'key' | 'furniture' | 'other';
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: Date | string;
  purchaseCost?: number;
  warrantyExpiry?: Date | string;
  condition: 'new' | 'good' | 'fair' | 'damaged' | 'disposed';
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired' | 'lost';
  assignedTo?: {
    employeeId: string | { _id: string; employeeId: string; displayName?: string; firstName?: string; lastName?: string };
    assignedAt: Date | string;
    assignedBy?: string;
    notes?: string;
  } | null;
  history?: Array<{
    action: string;
    employeeId?: string;
    date: Date | string;
    notes?: string;
  }>;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EmployeeDocument {
  _id: string;
  organizationId: string;
  employeeId: string | { _id: string; employeeId: string; displayName?: string; firstName?: string; lastName?: string };
  documentType: 'aadhar' | 'pan' | 'passport' | 'voter_id' | 'driving_license' | 'offer_letter' | 'appointment_letter' | 'resignation_letter' | 'relieving_letter' | 'experience_letter' | 'education_certificate' | 'payslip' | 'medical_record' | 'nda' | 'other';
  title: string;
  documentNumber?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  expiryDate?: Date | string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  verificationNotes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EmployeeWorkspace360 {
  employee: Employee;
  todayAttendance: any;
  leaveBalances: any[];
  assignedAssets: CompanyAsset[];
  documents: EmployeeDocument[];
  recentPunches: any[];
  isConfidentialViewer: boolean;
}

export interface SalaryComponent {
  name: string;
  code: string;
  category: 'earning' | 'deduction' | 'benefit' | 'reimbursement';
  calculationType: 'fixed' | 'percentage';
  amount: number;
  percentageOf?: string;
  taxable?: boolean;
  affectsPF?: boolean;
  affectsESI?: boolean;
  isVariable?: boolean;
}

export interface SalaryStructure {
  _id: string;
  structureCode?: string;
  title: string;
  currency: string;
  payFrequency: 'monthly' | 'weekly' | 'daily';
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  status: 'draft' | 'active' | 'superseded' | 'archived';
  components: SalaryComponent[];
  grossMonthly?: number;
  fixedDeductionsMonthly?: number;
  netFixedMonthly?: number;
  user?: any;
  employeeId?: any;
  createdAt?: Date | string;
}

export interface Payslip {
  _id: string;
  payslipNumber: string;
  month: number;
  year: number;
  periodStart: Date | string;
  periodEnd: Date | string;
  attendanceSnapshot: {
    paidDays: number;
    presentDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
    lateCount: number;
  };
  earnings: Array<{ code: string; name: string; amount: number; taxable?: boolean }>;
  deductions: Array<{ code: string; name: string; amount: number }>;
  reimbursements: Array<{ code: string; name: string; amount: number }>;
  grossPay: number;
  deductionTotal: number;
  reimbursementTotal: number;
  netPay: number;
  currency: string;
  payment?: {
    status: 'pending' | 'processing' | 'paid' | 'failed' | 'on_hold';
    paidAt?: Date | string;
    paymentMode?: string;
    referenceNo?: string;
  };
  status: 'draft' | 'approved' | 'locked' | 'paid' | 'cancelled';
  user?: any;
  employeeId?: any;
  createdAt?: Date | string;
}

export interface ExpenseClaim {
  _id: string;
  claimNumber: string;
  title: string;
  items: Array<{
    category: 'travel' | 'food' | 'lodging' | 'fuel' | 'phone' | 'office' | 'client' | 'other';
    description?: string;
    expenseDate: Date | string;
    amount: number;
    taxAmount?: number;
  }>;
  totalAmount: number;
  approvedAmount?: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'partially_approved' | 'rejected' | 'reimbursed' | 'cancelled';
  user?: any;
  employeeId?: any;
  submittedAt?: Date | string;
  approvedBy?: any;
  approvedAt?: Date | string;
  createdAt?: Date | string;
}

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
  source: 'machine' | 'web' | 'mobile' | 'admin_manual' | 'api' | 'biometric' | 'rfid';
  machineId?: string;
  user: string;
  timestamp: Date;
  type: 'in' | 'out' | 'break_start' | 'break_end' | 'remote_in' | 'remote_out' | 'overtime_in' | 'overtime_out';
  ipAddress?: string;
  userAgent?: string;
  location?: {
    geoJson?: {
      type: 'Point';
      coordinates: [number, number];
    };
    coordinates?: [number, number];
    accuracy?: number;
    geofenceStatus?: 'inside' | 'outside' | 'disabled';
    geofenceId?: string;
  };
  isVerified?: boolean;
  processingStatus?: 'pending' | 'processed' | 'flagged' | 'rejected' | 'corrected' | 'duplicate';
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
  status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'week_off' | 'holiday' | 'work_from_home' | 'on_duty';
  isLate: boolean;
  isEarlyDeparture?: boolean;
  isOvertime?: boolean;
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
  providerType: 'generic' | 'zkteco' | 'hikvision' | 'essl' | 'bioenable' | 'suprema';
  ipAddress?: string;
  macAddress?: string;
  connectionProtocol?: 'tcp' | 'http' | 'websocket' | 'mqtt' | 'usb';
  port?: number;
  timeout?: number;
  status: 'active' | 'inactive' | 'maintenance' | 'offline' | 'error';
  connectionStatus?: 'online' | 'offline' | 'connecting' | 'disconnected';
  lastSyncAt?: Date;
  lastPingAt?: Date;
  lastError?: string;
  capabilities?: {
    faceRecognition: boolean;
    fingerprint: boolean;
    rfid: boolean;
    temperature: boolean;
    maskDetection?: boolean;
  };
  config?: {
    timezone?: string;
    syncInterval?: number;
    retryAttempts?: number;
    autoSync?: boolean;
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
  type: 'circle' | 'polygon' | 'building' | 'custom';
  center?: {
    type?: 'Point';
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
  allowedEntryTypes?: 'in' | 'out' | 'both';
  timeRestrictions?: Array<{
    dayOfWeek: number[];
    startTime?: string;
    endTime?: string;
    allowed: boolean;
  }>;
  applicableToAll?: boolean;
  applicableUsers?: string[];
  applicableDepartments?: string[];
  applicableDesignations?: string[];
  isActive?: boolean;
}

export interface GeoFenceCheck {
  isInside: boolean;
  distance: string | null;
  geofence: string;
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
  private normalizeMachineAnalytics(data: any): any {
    const summary = data?.summary?.[0] || {};
    const machines = Array.isArray(data?.machines) ? data.machines : [];
    const byStatus = Array.isArray(data?.byStatus) ? data.byStatus : [];

    const offlineByStatus = byStatus
      .filter((item: any) => ['offline', 'error', 'inactive'].includes(item?._id))
      .reduce((acc: number, item: any) => acc + (item?.count || 0), 0);

    const offlineByConnection = machines.filter(
      (m: any) => m?.connectionStatus !== 'online' || ['offline', 'error', 'inactive'].includes(m?.status),
    );

    const successfulReads = machines.reduce((acc: number, m: any) => acc + (m?.stats?.successfulReads || 0), 0);
    const failedReads = machines.reduce((acc: number, m: any) => acc + (m?.stats?.failedReads || 0), 0);

    return {
      ...data,
      totalMachines: summary.totalMachines || 0,
      onlineMachines: summary.onlineMachines || 0,
      offlineMachines: Math.max(
        offlineByStatus,
        offlineByConnection.length,
        (summary.totalMachines || 0) - (summary.onlineMachines || 0),
      ),
      transactions24h: summary.totalLogs || 0,
      totalActiveMachines: summary.activeMachines || 0,
      totalTransactions: summary.totalLogs || 0,
      successfulReads,
      failedReads,
      offlineDeviceList: offlineByConnection,
    };
  }

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
    const params = date ? { date: date instanceof Date ? date.toISOString().split('T')[0] : date } : {};
    return this.get<{ status: string; data: { timeline: any[] } }>('/v1/hrms/shifts/timeline', params);
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
  getGroupAssignments(id: string, params?: any): Observable<{ status: string; data: { assignments: ShiftAssignment[] } }> {
    return this.get<{ status: string; data: { assignments: ShiftAssignment[] } }>(`/v1/hrms/shift-groups/${id}/assignments`, params);
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

  /**
   * Trigger monthly leave accrual
   */
  accrueMonthlyLeave(data: { financialYear?: string; month?: number; userIds?: string[]; departmentId?: string } = {}): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/leave-balances/accrue-monthly', data);
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
    return this.get<{ status: string; data: any }>('/v1/hrms/attendance/machines/analytics', params).pipe(
      map((res: any) => ({
        ...res,
        data: this.normalizeMachineAnalytics(res?.data),
      })),
    );
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

  // ======================================================
  // EMPLOYEE MASTER & WORKSPACE ENDPOINTS
  // ======================================================

  /**
   * Get paginated employees list with filters
   */
  getEmployees(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { employees: Employee[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { employees: Employee[] } }>('/v1/hrms/employees', params);
  }

  /**
   * Get single employee by ID
   */
  getEmployee(id: string): Observable<{ status: string; data: { employee: Employee } }> {
    return this.get<{ status: string; data: { employee: Employee } }>(`/v1/hrms/employees/${id}`);
  }

  /**
   * Get employee by User ID
   */
  getEmployeeByUser(userId: string): Observable<{ status: string; data: { employee: Employee } }> {
    return this.get<{ status: string; data: { employee: Employee } }>(`/v1/hrms/employees/by-user/${userId}`);
  }

  /**
   * Get authenticated user's own employee profile
   */
  getMyEmployeeProfile(): Observable<{ status: string; data: { employee: Employee } }> {
    return this.get<{ status: string; data: { employee: Employee } }>('/v1/hrms/employees/me/profile');
  }

  /**
   * Create new employee (with optional user creation or user linking)
   */
  createEmployee(dto: CreateEmployeeDto): Observable<{ status: string; data: { employee: Employee } }> {
    return this.post<{ status: string; data: { employee: Employee } }>('/v1/hrms/employees', dto);
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, dto: UpdateEmployeeDto): Observable<{ status: string; data: { employee: Employee } }> {
    return this.patch<{ status: string; data: { employee: Employee } }>(`/v1/hrms/employees/${id}`, dto);
  }

  /**
   * Deactivate/offboard employee
   */
  deactivateEmployee(id: string, payload: DeactivateEmployeeDto): Observable<{ status: string; message: string; data: { employee: Employee } }> {
    return this.patch<{ status: string; message: string; data: { employee: Employee } }>(`/v1/hrms/employees/${id}/deactivate`, payload);
  }

  /**
   * Provision/invite user account for unlinked employee
   */
  inviteUserForEmployee(id: string, dto: InviteUserDto): Observable<{ status: string; message: string; data: { employee: Employee } }> {
    return this.post<{ status: string; message: string; data: { employee: Employee } }>(`/v1/hrms/employees/${id}/invite-user`, dto);
  }

  /**
   * Get 360-degree Employee Workspace Cockpit
   */
  getEmployeeWorkspace(id: string): Observable<{ status: string; data: EmployeeWorkspace360 }> {
    return this.get<{ status: string; data: EmployeeWorkspace360 }>(`/v1/hrms/employees/workspace/${id}`);
  }

  // ======================================================
  // COMPANY ASSETS ENDPOINTS
  // ======================================================

  /**
   * Get paginated company assets
   */
  getCompanyAssets(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { assets: CompanyAsset[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { assets: CompanyAsset[] } }>('/v1/hrms/assets', params);
  }

  /**
   * Get single asset by ID
   */
  getCompanyAsset(id: string): Observable<{ status: string; data: { asset: CompanyAsset } }> {
    return this.get<{ status: string; data: { asset: CompanyAsset } }>(`/v1/hrms/assets/${id}`);
  }

  /**
   * Create new company asset
   */
  createCompanyAsset(dto: Partial<CompanyAsset>): Observable<{ status: string; data: { asset: CompanyAsset } }> {
    return this.post<{ status: string; data: { asset: CompanyAsset } }>('/v1/hrms/assets', dto);
  }

  /**
   * Update company asset
   */
  updateCompanyAsset(id: string, dto: Partial<CompanyAsset>): Observable<{ status: string; data: { asset: CompanyAsset } }> {
    return this.patch<{ status: string; data: { asset: CompanyAsset } }>(`/v1/hrms/assets/${id}`, dto);
  }

  /**
   * Assign asset to employee
   */
  assignCompanyAsset(id: string, payload: { employeeId: string; notes?: string }): Observable<{ status: string; data: { asset: CompanyAsset } }> {
    return this.post<{ status: string; data: { asset: CompanyAsset } }>(`/v1/hrms/assets/${id}/assign`, payload);
  }

  /**
   * Return asset from employee
   */
  returnCompanyAsset(id: string, payload: { conditionAfter?: string; notes?: string }): Observable<{ status: string; data: { asset: CompanyAsset } }> {
    return this.post<{ status: string; data: { asset: CompanyAsset } }>(`/v1/hrms/assets/${id}/return`, payload);
  }

  // ======================================================
  // EMPLOYEE COMPLIANCE DOCUMENTS ENDPOINTS
  // ======================================================

  /**
   * Get employee compliance documents
   */
  getEmployeeDocuments(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { documents: EmployeeDocument[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { documents: EmployeeDocument[] } }>('/v1/hrms/documents', params);
  }

  /**
   * Get single compliance document
   */
  getEmployeeDocument(id: string): Observable<{ status: string; data: { document: EmployeeDocument } }> {
    return this.get<{ status: string; data: { document: EmployeeDocument } }>(`/v1/hrms/documents/${id}`);
  }

  /**
   * Upload/create compliance document
   */
  uploadEmployeeDocument(dto: Partial<EmployeeDocument>): Observable<{ status: string; data: { document: EmployeeDocument } }> {
    return this.post<{ status: string; data: { document: EmployeeDocument } }>('/v1/hrms/documents', dto);
  }

  /**
   * Verify or reject compliance document
   */
  verifyEmployeeDocument(id: string, payload: { status: 'verified' | 'rejected'; verificationNotes?: string }): Observable<{ status: string; data: { document: EmployeeDocument } }> {
    return this.patch<{ status: string; data: { document: EmployeeDocument } }>(`/v1/hrms/documents/${id}/verify`, payload);
  }

  /**
   * Delete compliance document
   */
  deleteEmployeeDocument(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/documents/${id}`);
  }

  // ======================================================
  // SALARY STRUCTURE & COMPENSATION ENDPOINTS
  // ======================================================

  getSalaryStructures(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { salaryStructures: SalaryStructure[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { salaryStructures: SalaryStructure[] } }>('/v1/hrms/salary-structures', params);
  }

  getSalaryStructure(id: string): Observable<{ status: string; data: { salaryStructure: SalaryStructure } }> {
    return this.get<{ status: string; data: { salaryStructure: SalaryStructure } }>(`/v1/hrms/salary-structures/${id}`);
  }

  createSalaryStructure(dto: Partial<SalaryStructure>): Observable<{ status: string; data: { salaryStructure: SalaryStructure } }> {
    return this.post<{ status: string; data: { salaryStructure: SalaryStructure } }>('/v1/hrms/salary-structures', dto);
  }

  updateSalaryStructure(id: string, dto: Partial<SalaryStructure>): Observable<{ status: string; data: { salaryStructure: SalaryStructure } }> {
    return this.patch<{ status: string; data: { salaryStructure: SalaryStructure } }>(`/v1/hrms/salary-structures/${id}`, dto);
  }

  deleteSalaryStructure(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/salary-structures/${id}`);
  }

  // ======================================================
  // PAYROLL & PAYSLIP ENDPOINTS
  // ======================================================

  runMonthlyPayroll(payload: { month: number; year: number; branchId?: string }): Observable<{ status: string; data: any }> {
    return this.post<{ status: string; data: any }>('/v1/hrms/payroll/runs', payload);
  }

  getPayslips(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { payslips: Payslip[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { payslips: Payslip[] } }>('/v1/hrms/payroll/payslips', params);
  }

  getMyPayslips(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { payslips: Payslip[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { payslips: Payslip[] } }>('/v1/hrms/payroll/my-payslips', params);
  }

  getPayslip(id: string): Observable<{ status: string; data: { payslip: Payslip } }> {
    return this.get<{ status: string; data: { payslip: Payslip } }>(`/v1/hrms/payroll/payslips/${id}`);
  }

  updatePayslipStatus(id: string, payload: { status: string; paymentMode?: string; referenceNo?: string }): Observable<{ status: string; data: { payslip: Payslip } }> {
    return this.patch<{ status: string; data: { payslip: Payslip } }>(`/v1/hrms/payroll/payslips/${id}`, payload);
  }

  bulkUpdatePayslipStatus(payload: { ids: string[]; status: string; paymentMode?: string }): Observable<{ status: string; data: any }> {
    return this.patch<{ status: string; data: any }>('/v1/hrms/payroll/payslips/bulk-status', payload);
  }

  // ======================================================
  // EXPENSE CLAIM ENDPOINTS
  // ======================================================

  getExpenseClaims(params?: Record<string, unknown>): Observable<{ status: string; results: number; pagination: any; data: { expenseClaims: ExpenseClaim[] } }> {
    return this.get<{ status: string; results: number; pagination: any; data: { expenseClaims: ExpenseClaim[] } }>('/v1/hrms/expenses', params);
  }

  getExpenseClaim(id: string): Observable<{ status: string; data: { expenseClaim: ExpenseClaim } }> {
    return this.get<{ status: string; data: { expenseClaim: ExpenseClaim } }>(`/v1/hrms/expenses/${id}`);
  }

  createExpenseClaim(dto: Partial<ExpenseClaim>): Observable<{ status: string; data: { expenseClaim: ExpenseClaim } }> {
    return this.post<{ status: string; data: { expenseClaim: ExpenseClaim } }>('/v1/hrms/expenses', dto);
  }

  updateExpenseClaim(id: string, dto: Partial<ExpenseClaim>): Observable<{ status: string; data: { expenseClaim: ExpenseClaim } }> {
    return this.patch<{ status: string; data: { expenseClaim: ExpenseClaim } }>(`/v1/hrms/expenses/${id}`, dto);
  }

  approveExpenseClaim(id: string, payload: { approvedAmount?: number; comments?: string }): Observable<{ status: string; data: { expenseClaim: ExpenseClaim } }> {
    return this.patch<{ status: string; data: { expenseClaim: ExpenseClaim } }>(`/v1/hrms/expenses/${id}/approve`, payload);
  }

  rejectExpenseClaim(id: string, payload: { comments?: string }): Observable<{ status: string; data: { expenseClaim: ExpenseClaim } }> {
    return this.patch<{ status: string; data: { expenseClaim: ExpenseClaim } }>(`/v1/hrms/expenses/${id}/reject`, payload);
  }

  deleteExpenseClaim(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`/v1/hrms/expenses/${id}`);
  }
}
