import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import api from '../services/api';

// Array Input Component for handling dynamic lists
const ArrayInput = ({ label, items, onAddItem, onRemoveItem, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = () => {
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <View style={styles.arrayInputContainer}>
      <Text style={styles.formLabel}>{label}</Text>
      
      {/* Input field for adding new item */}
      <View style={styles.addItemContainer}>
        <TextInput
          style={[styles.formInput, styles.arrayTextInput]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddItem}
          disabled={!inputValue.trim()}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* List of existing items */}
      {items.length > 0 && (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveItem(index)}
              >
                <Ionicons name="close" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {items.length === 0 && (
        <Text style={styles.emptyText}>No {label.toLowerCase()} added yet</Text>
      )}
    </View>
  );
};

export default function EditProfile() {
  const { user, userRole, updateUser } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    yearsOfExperience: '',
    consultationFee: '',
    specialization: '',
    subSpecializations: [],
    qualifications: [],
    languagesSpoken: [],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        yearsOfExperience: user.yearsOfExperience?.toString() || '',
        consultationFee: user.consultationFee?.toString() || '',
        specialization: user.specialization || '',
        subSpecializations: user.subSpecializations || [],
        qualifications: user.qualifications || [],
        languagesSpoken: user.languagesSpoken || [],
      });
    }
    
    // Fetch specializations if user is a doctor
    if (userRole === 'doctor') {
      fetchSpecializations();
    }

    // Fetch latest user data from server to ensure we have all fields
    if (user && user.uuid) {
      fetchLatestUserData();
    }
  }, [user, userRole]);

  const fetchLatestUserData = async () => {
    try {
      if (!user || !user.uuid) return;
      
      const endpoint = userRole === 'doctor' 
        ? `/api/doctor/uuid/${user.uuid}` 
        : `/api/patient/uuid/${user.uuid}`;
      
      const response = await api.get(endpoint);
      if (response.data) {
        const latestUserData = response.data;
        
        // Update the form data with the latest server data
        setFormData({
          name: latestUserData.name || '',
          email: latestUserData.email || '',
          phone: latestUserData.phone || '',
          bio: latestUserData.bio || '',
          yearsOfExperience: latestUserData.yearsOfExperience?.toString() || '',
          consultationFee: latestUserData.consultationFee?.toString() || '',
          specialization: latestUserData.specialization || '',
          subSpecializations: latestUserData.subSpecializations || [],
          qualifications: latestUserData.qualifications || [],
          languagesSpoken: latestUserData.languagesSpoken || [],
        });
        
        // Also update the stored user data with missing fields if needed
        if (!user.phone && latestUserData.phone) {
          updateUser({ ...user, phone: latestUserData.phone });
        }
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
      // Don't show error to user, just log it - form will still work with stored data
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await api.get('/api/doctor/filter-options');
      if (response.data && response.data.data) {
        setSpecializations(response.data.data.specializations || []);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  // Array management functions
  const handleAddToArray = (fieldName, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: [...prevData[fieldName], value]
    }));
  };

  const handleRemoveFromArray = (fieldName, index) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: prevData[fieldName].filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
      };

      // Add doctor-specific fields if user is a doctor
      if (userRole === 'doctor') {
        if (formData.bio) {
          updateData.bio = formData.bio;
        }
        if (formData.yearsOfExperience) {
          updateData.yearsOfExperience = parseInt(formData.yearsOfExperience) || 0;
        }
        if (formData.consultationFee) {
          updateData.consultationFee = parseInt(formData.consultationFee) || 0;
        }
        if (formData.specialization) {
          updateData.specialization = formData.specialization;
        }
        // Add array fields
        updateData.subSpecializations = formData.subSpecializations || [];
        updateData.qualifications = formData.qualifications || [];
        updateData.languagesSpoken = formData.languagesSpoken || [];
      }

      const endpoint = userRole === 'doctor' ? `/api/doctor/${user._id}` : `/api/patient/${user._id}`;
      const response = await api.put(endpoint, updateData);

      if (response.data) {
        // Handle different response formats from backend
        let updatedUserData;
        if (userRole === 'doctor') {
          // Doctor endpoint returns { success: true, doctor: {...} }
          updatedUserData = response.data.doctor;
        } else {
          // Patient endpoint returns the patient object directly
          updatedUserData = response.data;
        }

        if (updatedUserData) {
          // Merge with existing user data to preserve all fields (especially auth-related ones)
          const mergedUserData = { ...user, ...updatedUserData };
          updateUser(mergedUserData);
          Alert.alert('Success', 'Profile updated successfully!');
          router.back();
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Edit Profile',
            headerShown: true,
          }}
        />
        <View style={styles.center}>
          <Text>Please log in to edit your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E293B',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
          headerBackTitleVisible: false,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.profile ? (
              <Image 
                source={{ uri: user.profile }} 
                style={styles.avatar} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
          </View>
        </View> */}

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(value) => setFormData({...formData, name: value})}
              placeholder="Enter your name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.formInput}
              value={formData.phone}
              onChangeText={(value) => setFormData({...formData, phone: value})}
              placeholder="Enter your phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          {userRole === 'doctor' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.bio}
                  onChangeText={(value) => setFormData({...formData, bio: value})}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specialization</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setShowSpecializationPicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.specialization && styles.placeholderText]}>
                    {formData.specialization || 'Select your specialization'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Years of Experience</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.yearsOfExperience}
                  onChangeText={(value) => setFormData({...formData, yearsOfExperience: value})}
                  placeholder="Enter years of experience"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consultation Fee (LKR)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.consultationFee}
                  onChangeText={(value) => setFormData({...formData, consultationFee: value})}
                  placeholder="Enter consultation fee"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
              </View>

              {/* Sub-Specializations Array Input */}
              <ArrayInput
                label="Sub-Specializations"
                items={formData.subSpecializations}
                onAddItem={(item) => handleAddToArray('subSpecializations', item)}
                onRemoveItem={(index) => handleRemoveFromArray('subSpecializations', index)}
                placeholder="Add a sub-specialization"
              />

              {/* Qualifications Array Input */}
              <ArrayInput
                label="Qualifications"
                items={formData.qualifications}
                onAddItem={(item) => handleAddToArray('qualifications', item)}
                onRemoveItem={(index) => handleRemoveFromArray('qualifications', index)}
                placeholder="Add a qualification (e.g., MBBS, MD)"
              />

              {/* Languages Spoken Array Input */}
              <ArrayInput
                label="Languages Spoken"
                items={formData.languagesSpoken}
                onAddItem={(item) => handleAddToArray('languagesSpoken', item)}
                onRemoveItem={(index) => handleRemoveFromArray('languagesSpoken', index)}
                placeholder="Add a language"
              />
            </>
          )}
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Updating...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Specialization Picker Modal */}
      <Modal
        visible={showSpecializationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecializationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialization</Text>
              <TouchableOpacity 
                onPress={() => setShowSpecializationPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={true}>
              {specializations.map((spec, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    formData.specialization === spec && styles.selectedOption
                  ]}
                  onPress={() => {
                    setFormData({...formData, specialization: spec});
                    setShowSpecializationPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    formData.specialization === spec && styles.selectedOptionText
                  ]}>
                    {spec}
                  </Text>
                  {formData.specialization === spec && (
                    <Ionicons name="checkmark" size={20} color="#008080" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#64748B',
  },
  formSection: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  buttonSection: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#008080',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedOption: {
    backgroundColor: '#F0F9FF',
    borderColor: '#008080',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#008080',
    fontWeight: '600',
  },
  // Array Input Styles
  arrayInputContainer: {
    marginBottom: 24,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrayTextInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
});