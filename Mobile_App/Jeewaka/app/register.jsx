import React, { useState } from 'react';
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
import useAuthStore from '../store/authStore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';

const initialLayout = { width: Dimensions.get('window').width };

export default function Register() {
  const { setUser, setUserRole } = useAuthStore();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Tab routes
  const [routes] = useState([
    { key: 'patient', title: 'Patient' },
    { key: 'doctor', title: 'Doctor' },
  ]);

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

  // Form validation
  const validatePatientForm = () => {
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
  };

  const validateDoctorForm = () => {
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
  };

  // Patient registration
  const handlePatientRegister = async () => {
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
        uuid: userCredential.user.uid,
        dob: patientForm.dob,
        sex: patientForm.gender
      });
      
      // Set user role in Firebase custom claims using auth endpoint
      const token = await userCredential.user.getIdToken();
      await api.post('/api/auth/role', {
        uid: userCredential.user.uid,
        role: 'patient'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Set user data and role in app state
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        uuid: data.uuid,
        profile: data.profile
      });
      setUserRole('patient');
      
      // Navigate to home
      router.replace('/');
      
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Failed to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Doctor registration
  const handleDoctorRegister = async () => {
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
      const token = await userCredential.user.getIdToken();
      await api.post('/api/auth/role', {
        uid: userCredential.user.uid,
        role: 'doctor'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Set user data and role in app state
      const doctor = data.doctor || data; // Handle different response formats
      setUser({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        uuid: doctor.uuid,
        profile: doctor.profile
      });
      setUserRole('doctor');
      
      // Navigate to doctor dashboard
      router.replace('/doctor-dashboard');
      
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Failed to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (index === 0) {
        setPatientForm({ ...patientForm, dob: selectedDate });
      } else {
        setDoctorForm({ ...doctorForm, dob: selectedDate });
      }
    }
  };

  // Tab scenes
  const PatientScene = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter your full name"
            value={patientForm.name}
            onChangeText={(text) => setPatientForm({ ...patientForm, name: text })}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Enter your email"
            value={patientForm.email}
            onChangeText={(text) => setPatientForm({ ...patientForm, email: text })}
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
            value={patientForm.phone}
            onChangeText={(text) => setPatientForm({ ...patientForm, phone: text })}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={patientForm.gender}
              onValueChange={(itemValue) => setPatientForm({ ...patientForm, gender: itemValue })}
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
            <Text>{format(patientForm.dob, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={patientForm.dob}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Create a password"
            value={patientForm.password}
            onChangeText={(text) => setPatientForm({ ...patientForm, password: text })}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm your password"
            value={patientForm.confirmPassword}
            onChangeText={(text) => setPatientForm({ ...patientForm, confirmPassword: text })}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const DoctorScene = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter your full name"
            value={doctorForm.name}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, name: text })}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Enter your email"
            value={doctorForm.email}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, email: text })}
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
            value={doctorForm.phone}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, phone: text })}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medical Registration Number</Text>
          <TextInput
            style={[styles.input, errors.regNo && styles.inputError]}
            placeholder="Enter your registration number"
            value={doctorForm.regNo}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, regNo: text })}
          />
          {errors.regNo && <Text style={styles.errorText}>{errors.regNo}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specialization</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={doctorForm.specialization}
              onValueChange={(itemValue) => setDoctorForm({ ...doctorForm, specialization: itemValue })}
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
              onValueChange={(itemValue) => setDoctorForm({ ...doctorForm, gender: itemValue })}
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
            <Text>{format(doctorForm.dob, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Create a password"
            value={doctorForm.password}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, password: text })}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm your password"
            value={doctorForm.confirmPassword}
            onChangeText={(text) => setDoctorForm({ ...doctorForm, confirmPassword: text })}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderScene = SceneMap({
    patient: PatientScene,
    doctor: DoctorScene,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#2563EB' }}
      style={{ backgroundColor: 'white' }}
      labelStyle={{ color: '#1E293B', fontWeight: '500' }}
      activeColor="#2563EB"
      inactiveColor="#64748B"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Jeewaka Medical Platform</Text>
      </View>
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={styles.tabView}
      />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  tabView: {
    flex: 1,
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
