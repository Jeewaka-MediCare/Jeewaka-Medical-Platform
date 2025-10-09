import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import useAuthStore from '../store/authStore';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function Register() {
  const { setUser, setUserRole } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('patient'); // Changed from index to simple string
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dob: new Date(),
  });

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    regNo: '',
    dob: new Date(),
    specialization: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Memoized form update functions
  const updatePatientForm = useCallback((field, value) => {
    setPatientForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateDoctorForm = useCallback((field, value) => {
    setDoctorForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Form validation
  const validatePatientForm = useCallback(() => {
    const newErrors = {};
    
    if (!patientForm.name) newErrors.name = 'Name is required';
    if (!patientForm.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(patientForm.email)) newErrors.email = 'Email is invalid';
    if (!patientForm.phone) newErrors.phone = 'Phone number is required';
    if (!patientForm.password) newErrors.password = 'Password is required';
    else if (patientForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (patientForm.password !== patientForm.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [patientForm]);

  const validateDoctorForm = useCallback(() => {
    const newErrors = {};
    
    if (!doctorForm.name) newErrors.name = 'Name is required';
    if (!doctorForm.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(doctorForm.email)) newErrors.email = 'Email is invalid';
    if (!doctorForm.phone) newErrors.phone = 'Phone number is required';
    if (!doctorForm.regNo) newErrors.regNo = 'Registration number is required';
    if (!doctorForm.specialization) newErrors.specialization = 'Specialization is required';
    if (!doctorForm.password) newErrors.password = 'Password is required';
    else if (doctorForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (doctorForm.password !== doctorForm.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [doctorForm]);

  // Patient registration
  const handlePatientRegister = useCallback(async () => {
    if (!validatePatientForm()) return;
    
    setLoading(true);
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        patientForm.email,
        patientForm.password
      );
      
      // Register patient in backend using existing patient endpoint
      const { data } = await api.post('/api/patient/', {
        name: patientForm.name,
        email: patientForm.email,
        phone: patientForm.phone,
        uuid: userCredential.user.uid,
        dob: patientForm.dob,
        sex: patientForm.gender
      });
      
      // Set user role in Firebase custom claims using auth endpoint
      await api.post('/api/auth/role', {
        uid: userCredential.user.uid,
        role: 'patient'
      });
      
      // Set user data and role in app state
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        uuid: data.uuid,
        profile: data.profile
      });
      setUserRole('patient');
      
      // Navigate to home
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Patient registration error:', error);
      Alert.alert(
        'Registration Failed',
        getErrorMessage(error, 'Failed to register patient. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [validatePatientForm, patientForm, setUser, setUserRole, router]);

  // Doctor registration
  const handleDoctorRegister = useCallback(async () => {
    if (!validateDoctorForm()) return;
    
    setLoading(true);
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        doctorForm.email,
        doctorForm.password
      );
      
      // Register doctor in backend using existing doctor endpoint
      const { data } = await api.post('/api/doctor/', {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone,
        uuid: userCredential.user.uid,
        gender: doctorForm.gender,
        dob: doctorForm.dob,
        regNo: doctorForm.regNo,
        specialization: doctorForm.specialization
      });
      
      // Set user role in Firebase custom claims using auth endpoint
      await api.post('/api/auth/role', {
        uid: userCredential.user.uid,
        role: 'doctor'
      });
      
      // Set user data and role in app state
      const doctor = data.doctor || data; // Handle different response formats
      setUser({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        uuid: doctor.uuid,
        profile: doctor.profile
      });
      setUserRole('doctor');
      
      // Navigate to appointments tab (where dashboard functionality now resides)
      router.replace('/(tabs)/appointments');
      
    } catch (error) {
      console.error('Doctor registration error:', error);
      Alert.alert(
        'Registration Failed',
        getErrorMessage(error, 'Failed to register doctor. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [validateDoctorForm, doctorForm, setUser, setUserRole, router]);

  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (activeTab === 'patient') {
        updatePatientForm('dob', selectedDate);
      } else {
        updateDoctorForm('dob', selectedDate);
      }
    }
  }, [activeTab, updatePatientForm, updateDoctorForm]);

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Sign Up',
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Jeewaka Medical Platform</Text>
        </View>
      
      {/* Custom Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'patient' && styles.activeTab]}
          onPress={() => setActiveTab('patient')}
        >
          <Text style={[styles.tabText, activeTab === 'patient' && styles.activeTabText]}>
            Patient
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'doctor' && styles.activeTab]}
          onPress={() => setActiveTab('doctor')}
        >
          <Text style={[styles.tabText, activeTab === 'doctor' && styles.activeTabText]}>
            Doctor
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Content - No TabView wrapper */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'patient' ? (
            // Patient Form
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={patientForm.name}
                  onChangeText={(text) => updatePatientForm('name', text)}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={patientForm.email}
                  onChangeText={(text) => updatePatientForm('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94A3B8"
                  value={patientForm.phone}
                  onChangeText={(text) => updatePatientForm('phone', text)}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={patientForm.gender}
                    onValueChange={(itemValue) => updatePatientForm('gender', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{format(patientForm.dob, 'dd/MM/yyyy')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Create a password"
                  placeholderTextColor="#94A3B8"
                  value={patientForm.password}
                  onChangeText={(text) => updatePatientForm('password', text)}
                  secureTextEntry
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  value={patientForm.confirmPassword}
                  onChangeText={(text) => updatePatientForm('confirmPassword', text)}
                  secureTextEntry
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
              
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePatientRegister}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Registering...</Text>
                ) : (
                  <Text style={styles.buttonText}>Register as Patient</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // Doctor Form
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.name}
                  onChangeText={(text) => updateDoctorForm('name', text)}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.email}
                  onChangeText={(text) => updateDoctorForm('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.phone}
                  onChangeText={(text) => updateDoctorForm('phone', text)}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical Registration Number</Text>
                <TextInput
                  style={[styles.input, errors.regNo && styles.inputError]}
                  placeholder="Enter your registration number"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.regNo}
                  onChangeText={(text) => updateDoctorForm('regNo', text)}
                />
                {errors.regNo && <Text style={styles.errorText}>{errors.regNo}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={doctorForm.specialization}
                    onValueChange={(itemValue) => updateDoctorForm('specialization', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Specialization" value="" />
                    <Picker.Item label="Cardiologist" value="Cardiologist" />
                    <Picker.Item label="Dermatologist" value="Dermatologist" />
                    <Picker.Item label="Neurologist" value="Neurologist" />
                    <Picker.Item label="Pediatrician" value="Pediatrician" />
                    <Picker.Item label="Psychiatrist" value="Psychiatrist" />
                    <Picker.Item label="Orthopedic Surgeon" value="Orthopedic Surgeon" />
                  </Picker>
                </View>
                {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={doctorForm.gender}
                    onValueChange={(itemValue) => updateDoctorForm('gender', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{format(doctorForm.dob, 'dd/MM/yyyy')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Create a password"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.password}
                  onChangeText={(text) => updateDoctorForm('password', text)}
                  secureTextEntry
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  value={doctorForm.confirmPassword}
                  onChangeText={(text) => updateDoctorForm('confirmPassword', text)}
                  secureTextEntry
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
              
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleDoctorRegister}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Registering...</Text>
                ) : (
                  <Text style={styles.buttonText}>Register as Doctor</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker - Outside any wrapper */}
      {showDatePicker && (
        <DateTimePicker
          value={activeTab === 'patient' ? patientForm.dob : doctorForm.dob}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  picker: {
    height: 50,
    color: '#1E293B',
  },
  dateButton: {
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
});
