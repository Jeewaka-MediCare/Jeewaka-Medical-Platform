// Mock data for testing

export const mockDoctor = {
  _id: '507f1f77bcf86cd799439011',
  uid: 'doctor-uid-123',
  name: 'Dr. John Smith',
  email: 'john.smith@example.com',
  specialization: 'Cardiology',
  subSpecializations: ['Interventional Cardiology', 'Heart Surgery'],
  yearsOfExperience: 15,
  qualifications: ['MBBS', 'MD Cardiology', 'FRCPC'],
  hospitalAffiliation: 'General Hospital',
  consultationFee: 150,
  avgRating: 4.5,
  totalRatings: 120,
  profilePicture: 'https://example.com/doctor.jpg',
  bio: 'Experienced cardiologist with 15 years of practice.',
  isAvailable: true,
  gender: 'Male',
  languages: ['English', 'Spanish'],
  phoneNumber: '+1234567890',
  address: '123 Medical St, City, State 12345',
  dateOfBirth: '1975-05-15',
  licenseNumber: 'MD12345',
  isVerified: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockPatient = {
  _id: '507f1f77bcf86cd799439012',
  uid: 'patient-uid-123',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phoneNumber: '+1234567891',
  dateOfBirth: '1990-03-20',
  gender: 'Female',
  address: '456 Patient Ave, City, State 12345',
  emergencyContact: {
    name: 'John Doe',
    relationship: 'Spouse',
    phoneNumber: '+1234567892',
  },
  medicalHistory: ['Diabetes', 'Hypertension'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin', 'Lisinopril'],
  insuranceInfo: {
    provider: 'Health Insurance Co',
    policyNumber: 'POL123456',
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockAppointment = {
  _id: '507f1f77bcf86cd799439013',
  patientId: mockPatient._id,
  doctorId: mockDoctor._id,
  date: '2024-02-15T10:00:00.000Z',
  duration: 30,
  type: 'consultation',
  status: 'confirmed',
  consultationFee: 150,
  paymentStatus: 'paid',
  notes: 'Regular checkup',
  sessionId: 'session-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockPayment = {
  _id: '507f1f77bcf86cd799439014',
  appointmentId: mockAppointment._id,
  patientId: mockPatient._id,
  doctorId: mockDoctor._id,
  amount: 150,
  currency: 'USD',
  paymentMethod: 'card',
  stripePaymentIntentId: 'pi_test_123',
  status: 'succeeded',
  paidAt: '2024-01-01T12:00:00.000Z',
  createdAt: '2024-01-01T12:00:00.000Z',
};

export const mockReview = {
  _id: '507f1f77bcf86cd799439015',
  patientId: mockPatient._id,
  doctorId: mockDoctor._id,
  appointmentId: mockAppointment._id,
  rating: 5,
  comment: 'Excellent doctor, very professional and caring.',
  createdAt: '2024-01-02T00:00:00.000Z',
};

export const mockDoctorsList = [
  mockDoctor,
  {
    ...mockDoctor,
    _id: '507f1f77bcf86cd799439016',
    uid: 'doctor-uid-456',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    specialization: 'Dermatology',
    subSpecializations: ['Cosmetic Dermatology', 'Pediatric Dermatology'],
    consultationFee: 120,
    avgRating: 4.8,
    totalRatings: 95,
  },
  {
    ...mockDoctor,
    _id: '507f1f77bcf86cd799439017',
    uid: 'doctor-uid-789',
    name: 'Dr. Michael Brown',
    email: 'michael.brown@example.com',
    specialization: 'Pediatrics',
    subSpecializations: ['Neonatology', 'Pediatric Cardiology'],
    consultationFee: 100,
    avgRating: 4.6,
    totalRatings: 87,
  },
];

export const mockApiResponse = {
  success: true,
  data: mockDoctorsList,
  message: 'Doctors fetched successfully',
};

export const mockApiError = {
  success: false,
  error: 'Network error',
  message: 'Failed to fetch data',
};

export const mockAuthUser = {
  uid: 'user-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  getIdToken: jest.fn(() => Promise.resolve('mock-token')),
  getIdTokenResult: jest.fn(() => Promise.resolve({
    claims: { role: 'patient' }
  })),
};

export const mockNavigationProps = {
  navigation: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  },
  route: {
    params: {},
  },
};