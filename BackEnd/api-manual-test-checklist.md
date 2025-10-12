# Backend API Manual Testing Checklist

## How to Use
- For each endpoint, test all main scenarios (success, error, edge cases)
- Mark with [x] when tested, add notes for issues or questions
- Use Postman/Insomnia for requests, save examples for future automation

---

## Auth
- [ ] **POST** `/api/auth/role` — Set user role
- [ ] **GET** `/api/auth/users/:uid/role` — Get user role
- [ ] **PUT** `/api/auth/users/:uid/role` — Update user role

## Patients
- [ ] **POST** `/api/patient/` — Create patient
- [ ] **GET** `/api/patient/uuid/:uuid` — Get patient by UUID
- [ ] **GET** `/api/patient/:patientId/appointments` — Get patient appointments
- [ ] **GET** `/api/patient/:id` — Get patient by ID
- [ ] **PUT** `/api/patient/:id` — Update patient
- [ ] **GET** `/api/patient/` — List all patients
- [ ] **DELETE** `/api/patient/:id` — Delete patient

## Doctors
- [ ] **GET** `/api/doctor/` — List all doctors
- [ ] **GET** `/api/doctor/:id` — Get doctor by ID
- [ ] **PUT** `/api/doctor/:id` — Update doctor
- [ ] **DELETE** `/api/doctor/:id` — Delete doctor

## Hospitals
- [ ] **GET** `/api/hospital/` — List hospitals
- [ ] **GET** `/api/hospital/:hospitalId` — Get hospital by ID
- [ ] **POST** `/api/hospital/` — Create hospital
- [ ] **PUT** `/api/hospital/:hospitalId` — Update hospital
- [ ] **DELETE** `/api/hospital/:hospitalId` — Delete hospital

## Sessions
- [ ] **GET** `/api/session/` — List sessions
- [ ] **GET** `/api/session/doctor/:doctorId/statistics` — Doctor stats
- [ ] **GET** `/api/session/doctor/:doctorId` — Doctor sessions
- [ ] **GET** `/api/session/:sessionId` — Get session by ID
- [ ] **POST** `/api/session/:sessionId/book` — Book session
- [ ] **POST** `/api/session/` — Create session
- [ ] **PATCH** `/api/session/:sessionId` — Update session
- [ ] **PATCH** `/api/session/:sessionId/meeting-id` — Update meeting ID
- [ ] **PATCH** `/api/session/:sessionId/status` — Update session status
- [ ] **DELETE** `/api/session/:sessionId` — Delete session
- [ ] **POST** `/api/session/:sessionId/timeslot` — Add timeslot
- [ ] **PUT** `/api/session/:sessionId/timeslot/:slotIndex` — Update timeslot
- [ ] **DELETE** `/api/session/:sessionId/timeslot/:slotIndex` — Delete timeslot

## Medical Records
- [ ] **POST** `/api/medical-records/patients/:patientId/records` — Create record
- [ ] **GET** `/api/medical-records/patients/:patientId/records` — List records for patient
- [ ] **GET** `/api/medical-records/records/:recordId` — Get record by ID
- [ ] **PUT** `/api/medical-records/records/:recordId` — Update record
- [ ] **DELETE** `/api/medical-records/records/:recordId` — Delete record
- [ ] **GET** `/api/medical-records/records/:recordId/versions` — List record versions
- [ ] **GET** `/api/medical-records/records/:recordId/versions/:versionNumber` — Get version content
- [ ] **GET** `/api/medical-records/records/:recordId/audit` — Get record audit trail
- [ ] **GET** `/api/medical-records/patients/:patientId/audit` — Get patient audit trail
- [ ] **GET** `/api/medical-records/doctors/:doctorId/activity` — Get doctor activity
- [ ] **POST** `/api/medical-records/records/:recordId/backup` — Backup record
- [ ] **GET** `/api/medical-records/patients/:patientId/backups` — List patient backups
- [ ] **POST** `/api/medical-records/patients/:patientId/export` — Export patient records
- [ ] **GET** `/api/medical-records/admin/backup-stats/:patientId` — Admin backup stats

## Ratings
- [ ] **GET** `/api/ratings/doctor/:doctorId` — Get doctor reviews
- [ ] **GET** `/api/ratings/doctor/:doctorId/average` — Get doctor average rating
- [ ] **GET** `/api/ratings/` — List all ratings
- [ ] **POST** `/api/ratings/` — Create/update review

## Payments
- [ ] **POST** `/api/payments/create-intent` — Create payment intent
- [ ] **GET** `/api/payments/history` — Get payment history
- [ ] **GET** `/api/payments/earnings` — Get doctor earnings
- [ ] **GET** `/api/payments/earnings/stats` — Get earnings stats
- [ ] **GET** `/api/payments/:paymentId` — Get payment details

## Admin
- [ ] **GET** `/api/admin/` — List admins
- [ ] **POST** `/api/admin/add-role` — Add admin role
- [ ] **POST** `/api/admin/remove-role` — Remove admin role

## Doctor Card
- [ ] **GET** `/api/doctorCard/` — List doctor cards
- [ ] **GET** `/api/doctorCard/:doctorId` — Get doctor card by ID

## Doctor Verification
- [ ] **POST** `/api/admin-verification/` — Submit verification
- [ ] **GET** `/api/admin-verification/` — List verifications
- [ ] **PUT** `/api/admin-verification/:doctorId` — Update verification
- [ ] **POST** `/api/admin-verification/documents/:doctorId` — Upload document
- [ ] **GET** `/api/admin-verification/documents/:doctorId` — List documents
- [ ] **DELETE** `/api/admin-verification/documents/:doctorId/:filename` — Delete document

---

Add notes, edge cases, and results as you test each endpoint.
