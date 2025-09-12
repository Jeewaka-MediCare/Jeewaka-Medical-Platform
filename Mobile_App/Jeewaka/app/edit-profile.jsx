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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function EditProfile() {
  const { user, userRole, updateUser } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    yearsOfExperience: '',
    consultationFee: '',
    specialization: '',
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
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
      };

      // Add doctor-specific fields if user is a doctor
      if (userRole === 'doctor') {
        if (formData.yearsOfExperience) {
          updateData.yearsOfExperience = parseInt(formData.yearsOfExperience) || 0;
        }
        if (formData.consultationFee) {
          updateData.consultationFee = parseInt(formData.consultationFee) || 0;
        }
        if (formData.specialization) {
          updateData.specialization = formData.specialization;
        }
      }

      const endpoint = userRole === 'doctor' ? `/api/doctor/${user._id}` : `/api/patient/${user._id}`;
      const response = await api.put(endpoint, updateData);

      if (response.data) {
        // Update the user in the auth store
        updateUser(response.data.doctor || response.data.patient);
        Alert.alert('Success', 'Profile updated successfully!');
        router.back();
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
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
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
          
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(value) => setFormData({...formData, name: value})}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Email address"
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
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bio</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => setFormData({...formData, bio: value})}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          {userRole === 'doctor' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specialization</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.specialization}
                  onChangeText={(value) => setFormData({...formData, specialization: value})}
                  placeholder="Enter your specialization"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Years of Experience</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.yearsOfExperience}
                  onChangeText={(value) => setFormData({...formData, yearsOfExperience: value})}
                  placeholder="Enter years of experience"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consultation Fee ($)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.consultationFee}
                  onChangeText={(value) => setFormData({...formData, consultationFee: value})}
                  placeholder="Enter consultation fee"
                  keyboardType="number-pad"
                />
              </View>
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
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  changePhotoText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
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
  },
  saveButton: {
    backgroundColor: '#2563EB',
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
});