# 🔐 Authentication & Security

The **Auth Module** provides the security foundation for Apex Infinity, handling user login, registration, session management, and multi-tenant access control.

---

## 🚀 Key Features

### 🛡️ Secure Access
- **JWT Authentication**: Token-based security with automatic silent refresh.
- **Session Management**: Track active logins and force logouts for security.
- **Multi-Tenant Login**: Organization-aware authentication flow.

### 🛠️ Technical Overview
- **Service**: `AuthService` is a global singleton managing tokens and current user state.
- **Guards**: Integrates with `authGuard` to protect secure application routes.
- **Routing**: Handle Login, Register, and Session views via `auth.routes.ts`.

---

*Part of the Apex Infinity Core Security*
