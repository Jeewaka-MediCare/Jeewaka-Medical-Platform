# Authentication Routes Documentation

This module handles user role management and Firebase custom claims.

## Base URL
```
/api/auth
```

---

## Routes

### 1. Set User Role (Registration) - PUBLIC

**Endpoint:** `POST /api/auth/role`

**Purpose:** Set initial user role during registration. This is called immediately after creating a Firebase user account.

**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "uid": "firebase-user-uid",
  "role": "patient" // or "doctor"
}
```

**Allowed Roles:** Only `patient` and `doctor` (admin roles cannot be set through this endpoint)

**Success Response (200):**
```json
{
  "message": "Role set successfully",
  "role": "patient"
}
```

**Error Responses:**

400 - Invalid request:
```json
{
  "error": "uid and role are required"
}
```

400 - Invalid role:
```json
{
  "error": "Invalid role",
  "message": "Only patient and doctor roles can be set during registration"
}
```

**Usage Example:**
```javascript
// During registration, after creating Firebase user
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const uid = userCredential.user.uid;

// Set role in Firebase custom claims
await api.post('/api/auth/role', { 
  uid, 
  role: userType // 'patient' or 'doctor'
});
```

---

### 2. Get User Role - AUTHENTICATED

**Endpoint:** `GET /api/auth/users/:uid/role`

**Purpose:** Retrieve a user's role and custom claims from Firebase.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `uid` - Firebase user ID

**Success Response (200):**
```json
{
  "uid": "firebase-user-uid",
  "email": "user@example.com",
  "customClaims": {
    "role": "patient"
  },
  "role": "patient"
}
```

**Error Responses:**

401 - Not authenticated:
```json
{
  "error": "Authentication required"
}
```

404 - User not found:
```json
{
  "error": "User not found"
}
```

**Usage Example:**
```javascript
// Get current user's role
const response = await api.get(`/api/auth/users/${currentUser.uid}/role`);
console.log(response.data.role); // 'patient', 'doctor', or 'admin'
```

---

### 3. Update User Role - ADMIN ONLY

**Endpoint:** `PUT /api/auth/users/:uid/role`

**Purpose:** Admin-only endpoint to change any user's role. Includes protection against self-demotion.

**Authentication:** Required (Bearer token)

**Authorization:** Admin role only

**Path Parameters:**
- `uid` - Firebase user ID of the user to update

**Request Body:**
```json
{
  "uid": "firebase-user-uid",
  "role": "admin" // or "patient" or "doctor"
}
```

**Success Response (200):**
```json
{
  "message": "Role updated successfully",
  "uid": "firebase-user-uid",
  "role": "admin",
  "updatedBy": "admin-uid"
}
```

**Error Responses:**

401 - Not authenticated:
```json
{
  "error": "Authentication required"
}
```

403 - Not authorized (non-admin):
```json
{
  "error": "Forbidden",
  "message": "This resource requires one of the following roles: admin"
}
```

403 - Self-demotion attempt:
```json
{
  "error": "Cannot demote yourself",
  "message": "Admins cannot remove their own admin role"
}
```

400 - Invalid role:
```json
{
  "error": "Invalid role",
  "message": "Role must be one of: patient, doctor, admin"
}
```

**Usage Example:**
```javascript
// Admin promoting a user to doctor
await api.put(`/api/auth/users/${userId}/role`, {
  uid: userId,
  role: 'doctor'
});
```

---

## Security Notes

### Public Endpoint (`POST /api/auth/role`)
- **Purpose:** Allow new users to set their initial role during registration
- **Limitation:** Can only set `patient` or `doctor` roles
- **Risk Mitigation:** Admin roles can only be granted through the admin-protected endpoint
- **Why Public?** During registration, the user doesn't have a Firebase token yet (they just created the account)

### Admin Endpoint (`PUT /api/auth/users/:uid/role`)
- **Purpose:** Allow admins to manage user roles
- **Protection:** Requires authentication AND admin role
- **Self-Demotion Protection:** Admins cannot demote themselves to prevent losing access
- **Audit Trail:** Logs who performed the role change

### Best Practices
1. ✅ Always call `POST /api/auth/role` immediately after Firebase user creation
2. ✅ Store role in Firebase custom claims (server-side verification)
3. ✅ Refresh Firebase token after role changes to get updated claims
4. ✅ Use admin endpoint for any role modifications after initial setup
5. ⚠️ Never store role only in your database - use Firebase custom claims for security

---

## Integration Flow

### Registration Flow
```
1. Create Firebase user (createUserWithEmailAndPassword)
   ↓
2. Get Firebase UID
   ↓
3. Call POST /api/auth/role with UID and desired role
   ↓
4. Firebase custom claims are set
   ↓
5. Create user profile in backend database
   ↓
6. User can now login and access role-specific features
```

### Role Verification Flow (Middleware)
```
1. Client sends request with Firebase token
   ↓
2. Backend verifies token (authMiddleware)
   ↓
3. Extracts role from custom claims
   ↓
4. Sets req.user with role information
   ↓
5. requireRole middleware checks if user has required role
   ↓
6. Request proceeds or 403 Forbidden returned
```

---

## Frontend Integration

### During Registration
```javascript
try {
  // 1. Create Firebase user
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    email, 
    password
  );
  const uuid = userCredential.user.uid;

  // 2. Set role in Firebase
  await api.post("/api/auth/role", { 
    uid: uuid, 
    role: userType // 'patient' or 'doctor'
  });

  // 3. Create backend profile
  if (userType === 'patient') {
    await api.post("/api/patient", { ...patientData, uuid });
  } else if (userType === 'doctor') {
    await api.post("/api/doctor", { ...doctorData, uuid });
  }

  // 4. User can now login
  navigate('/login');
} catch (error) {
  console.error('Registration failed:', error);
}
```

### Admin Role Management
```javascript
// Admin dashboard - promote user to doctor
const promoteToDoctor = async (userId) => {
  try {
    await api.put(`/api/auth/users/${userId}/role`, {
      uid: userId,
      role: 'doctor'
    });
    
    // Ask user to logout and login again to refresh token
    alert('Role updated. Please ask the user to logout and login again.');
  } catch (error) {
    console.error('Failed to update role:', error);
  }
};
```

---

## Migration Notes

### Previous Implementation
- ❌ Single endpoint with no security
- ❌ Any role could be set at any time
- ❌ No admin-only controls

### New Implementation
- ✅ Separate endpoints for registration vs admin management
- ✅ Role restrictions on public endpoint (patient/doctor only)
- ✅ Admin-only endpoint for role changes
- ✅ Self-demotion protection
- ✅ Comprehensive error handling
- ✅ Audit logging

### Breaking Changes
- None! The public `POST /api/auth/role` endpoint maintains backward compatibility
- New endpoints are additions, not modifications
