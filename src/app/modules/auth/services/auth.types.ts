// src/app/modules/auth/services/auth.types.ts



export interface Branch {
  _id: string;
  name: string;
  address: any;
  isMainBranch: boolean;
}

export interface AttendanceConfig {
  machineUserId?: string;
  shiftId?: string | any;
  shiftGroupId?: string | any;
  isAttendanceEnabled: boolean;
  allowWebPunch: boolean;
  allowMobilePunch: boolean;
  enforceGeoFence: boolean;
  geoFenceId?: string | any;
  biometricVerified: boolean;
}

export interface Employee {
  _id?: string;
  employeeId?: string;
  departmentId?: string | any;
  designationId?: string | any;
  reportingManagerId?: string | any;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'probation' | 'consultant';
  workMode?: 'office' | 'remote' | 'hybrid' | 'field';
  status?: string;
  dateOfJoining?: Date;
  personal?: {
    dateOfBirth?: Date;
    gender?: string;
    maritalStatus?: string;
    bloodGroup?: string;
    secondaryPhone?: string;
  };
  guarantorDetails?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  attendanceConfig?: AttendanceConfig;
}

export interface Device {
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'tablet';
  lastActive: Date;
  userAgent: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  organizationId: string;
  branchId?: string;
  role?: string;
  permissions?: string[];
  themeId?: string;
  isOwner: boolean;
  isSuperAdmin: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'inactive' | 'suspended';
  isActive: boolean;
  isLoginBlocked: boolean;
  emailVerified: boolean;
  employee?: Employee;
  devices?: Device[];
  preferences?: {
    theme: 'light' | 'dark';
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface Session {
  _id: string;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface LoginResponse {
  status: string;
  token: string;
  data: {
    user: User;
    session: Session;
    organization: {
      id: string;
      name: string;
      uniqueShopId: string;
    };
  };
}

export interface SignupResponse {
  status: string;
  message: string;
  data: {
    email: string;
    name: string;
    status: string;
  };
}

export interface VerifyTokenResponse {
  status: string;
  data: {
    user: User;
    session: Session;
  };
}
