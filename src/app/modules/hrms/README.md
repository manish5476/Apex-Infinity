# 💼 Human Resource Management System (HRMS)

The **HRMS Module** is a comprehensive workforce management solution designed to handle the entire employee lifecycle, from organizational structure to real-time attendance and leave management.

---

## 🚀 Key Features

### 🏢 Organizational Structure
- **Department Management**: full CRUD operations with support for hierarchical tree views.
- **Designation & Career Paths**: Track employee growth, salary bands, and promotion eligibility.
- **Hierarchy Visualization**: Real-time tree view of the organization's reporting structure.

### 📅 Shift & Workforce Planning
- **Flexible Shift Types**: Support for Fixed, Rotating, Flexi, Split, and Night shifts.
- **Shift Groups & Rotations**: Automate complex roster patterns (Daily, Weekly, Monthly).
- **Grace Periods**: Configurable thresholds for late arrivals and early departures.

### 📍 Geo-Fencing & Attendance
- **Machine Integration**: Native support for biometric devices (ZK Teco, Hikvision, Bioenable) via TCP/Websocket.
- **Smart Geo-Fencing**: Define 'Safe Zones' using Circles, Polygons, or Building footprints.
- **Real-time Logs**: Live feed of attendance events with GPS verification.
- **Daily Timesheets**: Automated calculation of work hours, breaks, and overtime.

### 🏖️ Leave Management
- **Request Workflows**: Multi-level approval system for Casual, Sick, Earned, and special leaves.
- **Balance Tracking**: Automated credits and carry-forward logic.
- **Team Calendar**: Unified view of workforce availability.
- **Analytics**: Deep insights into absenteeism and leave trends.

---

## 🛠️ Technical Overview

### Core Components
- `GeofenceHubComponent`: Map-based interface for managing attendance boundaries.
- `MachineHubComponent`: Dashboard for monitoring biometric device health and sync status.
- `LeaveAdminHubComponent`: Centralized panel for HR administrators to manage global requests.

### Service Layer
The `HRMSService` integrates with the following backend domains:
- `/v1/hrms/departments`
- `/v1/hrms/designations`
- `/v1/hrms/shifts`
- `/v1/hrms/attendance`
- `/v1/hrms/geofences`

### Mapping Integration
Uses **Leaflet.js** for interactive geofence definition and employee location verification.

---

## 📂 Directory Structure

```text
src/app/modules/hrms/
├── core/                # Business logic components
│   ├── attendence/      # Daily timesheet UI
│   ├── attendenceLog/   # Raw log management
│   ├── geoFencing/      # Map-based boundary tools
│   ├── machine/         # Biometric device management
│   └── ...              # Leaves, Shifts, Departments
├── hrms.routes.ts       # Module internal routing
└── hrms.service.ts      # Main HRMS data service
```

---

*Part of the Apex Infinity ERP Suite*
