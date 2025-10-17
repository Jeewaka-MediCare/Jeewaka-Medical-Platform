import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import useAdminVerification from '../hooks/useAdminVerification';
import LoadingState from '../components/LoadingState';
import VerificationHeader from '../components/VerificationHeader';
import DoctorInfoCard from '../components/DoctorInfoCard';
import VerificationProcessCard from '../components/VerificationProcessCard';
import AdminCommentCard from '../components/AdminCommentCard';
import CertificateUploadSection from '../components/CertificateUploadSection';
import VerificationActionButtons from '../components/VerificationActionButtons';

export default function AdminVerificationPending() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const params = useLocalSearchParams();
  
  const {
    doctorData,
    setDoctorData,
    uploadedFiles,
    uploading,
    loading,
    checkingStatus,
    hasSavedCertificates,
    handleFileUpload,
    removeFile,
    handleSaveCertificates,
    checkVerificationStatus,
    handleLogout,
    formatDate
  } = useAdminVerification(user, params, router, logout);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: ' ',
            headerStyle: { backgroundColor: '#1E293B' },
            headerTintColor: '#fff',
          }}
        />
        <LoadingState text="Loading verification data..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: ' ',
          headerStyle: { backgroundColor: '#1E293B' },
          headerShown: true,
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <VerificationHeader doctorData={doctorData} />
        <DoctorInfoCard doctorData={doctorData} />
        <VerificationProcessCard />
        <AdminCommentCard doctorData={doctorData} />
        
        <CertificateUploadSection
          doctorData={doctorData}
          setDoctorData={setDoctorData}
          uploadedFiles={uploadedFiles}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          removeFile={removeFile}
          formatDate={formatDate}
        >
          <VerificationActionButtons
            checkingStatus={checkingStatus}
            hasSavedCertificates={hasSavedCertificates}
            doctorData={doctorData}
            uploading={uploading}
            onCheckStatus={checkVerificationStatus}
            onSaveCertificates={handleSaveCertificates}
            onLogout={handleLogout}
          />
        </CertificateUploadSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
});