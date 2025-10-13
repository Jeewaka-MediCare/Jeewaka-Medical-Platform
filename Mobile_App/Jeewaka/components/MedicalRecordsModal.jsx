import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import medicalRecordsService from '../services/medicalRecordsService';

export default function MedicalRecordsModal({ 
  visible, 
  onClose, 
  patient
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  
  // Form states
  const [newRecord, setNewRecord] = useState({
    title: '',
    description: '',
    content: '',
    tags: ''
  });

  // Load medical records when modal opens
  useEffect(() => {
    console.log('MedicalRecordsModal - Modal visible:', visible);
    console.log('MedicalRecordsModal - Patient data received:', patient);
    
    if (visible && patient?._id) {
      loadMedicalRecords();
    }
  }, [visible, patient]);

  const loadMedicalRecords = async () => {
    if (!patient?._id) return;
    
    setLoading(true);
    try {
      // Temporarily showing placeholder message instead of making API call
      console.log('Medical records temporarily disabled for patient:', patient._id);
      setRecords([]);
      
      // Show a user-friendly message
      setTimeout(() => {
        Alert.alert(
          'Medical Records', 
          'Medical records feature is being updated. This functionality will be available soon.',
          [{ text: 'OK' }]
        );
      }, 100);
      
      /* Temporarily disabled until backend compatibility is resolved
      const response = await medicalRecordsService.getPatientRecords(patient._id);
      console.log('Medical records response:', response);
      setRecords(response.records || []);
      */
    } catch (error) {
      console.error('Error loading medical records:', error);
      Alert.alert('Error', 'Failed to load medical records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMedicalRecords();
  };

  const handleCreateRecord = async () => {
    Alert.alert(
      'Feature Temporarily Unavailable', 
      'Medical records functionality is currently being updated. Please check back later.',
      [{ text: 'OK' }]
    );
    return;

    // Temporarily disabled until backend compatibility is resolved
    if (!newRecord.title.trim() || !newRecord.content.trim()) {
      Alert.alert('Validation Error', 'Please provide both title and content for the medical record.');
      return;
    }

    try {
      setLoading(true);
      const recordData = {
        title: newRecord.title.trim(),
        description: newRecord.description.trim(),
        content: newRecord.content.trim(),
        tags: newRecord.tags.trim().split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await medicalRecordsService.createRecord(patient._id, recordData);
      
      Alert.alert('Success', 'Medical record created successfully');
      setShowCreateForm(false);
      setNewRecord({ title: '', description: '', content: '', tags: '' });
      loadMedicalRecords();
    } catch (error) {
      console.error('Error creating medical record:', error);
      Alert.alert('Error', 'Failed to create medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = async (record) => {
    try {
      setLoading(true);
      const fullRecord = await medicalRecordsService.getRecord(record.recordId);
      setSelectedRecord(fullRecord.record);
      setShowRecordDetail(true);
    } catch (error) {
      console.error('Error loading record details:', error);
      Alert.alert('Error', 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const renderRecordsList = () => (
    <ScrollView 
      style={styles.recordsList}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>
          Patient: {patient?.name || 'Loading patient information...'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.createButton, styles.disabledButton]}
        onPress={() => Alert.alert('Coming Soon', 'Medical records creation will be available in the next update.')}
        disabled={true}
      >
        <Ionicons name="construct" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Feature Coming Soon</Text>
      </TouchableOpacity>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008080" />
          <Text style={styles.loadingText}>Loading medical records...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Medical Records Coming Soon</Text>
          <Text style={styles.emptyText}>
            The medical records feature is currently being updated to provide you with the best experience. 
            This functionality will be available in the next update.
          </Text>
        </View>
      ) : (
        records.map((record) => (
          <TouchableOpacity
            key={record._id}
            style={styles.recordCard}
            onPress={() => handleViewRecord(record)}
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{record.title}</Text>
              <Text style={styles.recordDate}>
                {format(parseISO(record.createdAt), 'MMM dd, yyyy')}
              </Text>
            </View>
            
            {record.description && (
              <Text style={styles.recordDescription} numberOfLines={2}>
                {record.description}
              </Text>
            )}
            
            <View style={styles.recordFooter}>
              <Text style={styles.recordCreatedBy}>
                By: {record.createdBy?.name || 'Doctor'}
              </Text>
              {record.tags && record.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {record.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {record.tags.length > 2 && (
                    <Text style={styles.moreTagsText}>+{record.tags.length - 2} more</Text>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.recordMeta}>
              <Ionicons name="eye-outline" size={16} color="#64748B" />
              <Text style={styles.viewText}>Tap to view details</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderCreateForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Medical Record</Text>
        <Text style={styles.headerSubtitle}>
          Patient: {patient?.name || 'Loading patient information...'}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={newRecord.title}
          onChangeText={(text) => setNewRecord(prev => ({ ...prev, title: text }))}
          placeholder="Enter record title (e.g., Follow-up Visit, Lab Results)"
          placeholderTextColor="#94A3B8"
          multiline={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={newRecord.description}
          onChangeText={(text) => setNewRecord(prev => ({ ...prev, description: text }))}
          placeholder="Brief description (optional)"
          placeholderTextColor="#94A3B8"
          multiline={true}
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Medical Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newRecord.content}
          onChangeText={(text) => setNewRecord(prev => ({ ...prev, content: text }))}
          placeholder="Enter detailed medical information, diagnosis, treatment notes, etc."
          placeholderTextColor="#94A3B8"
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tags (optional)</Text>
        <TextInput
          style={styles.input}
          value={newRecord.tags}
          onChangeText={(text) => setNewRecord(prev => ({ ...prev, tags: text }))}
          placeholder="Enter tags separated by commas (e.g., diabetes, follow-up, lab-results)"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setShowCreateForm(false);
            setNewRecord({ title: '', description: '', content: '', tags: '' });
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={handleCreateRecord}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Create Record</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRecordDetail = () => (
    <ScrollView style={styles.detailContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{selectedRecord?.title}</Text>
        <Text style={styles.headerSubtitle}>
          Created: {selectedRecord && format(parseISO(selectedRecord.createdAt), 'PPP')}
        </Text>
      </View>

      {selectedRecord?.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{selectedRecord.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Content</Text>
        <Text style={styles.sectionText}>
          {selectedRecord?.currentVersionId?.content || 'No content available'}
        </Text>
      </View>

      {selectedRecord?.tags && selectedRecord.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {selectedRecord.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record Information</Text>
        <Text style={styles.infoText}>Created by: {selectedRecord?.createdBy?.name || 'Doctor'}</Text>
        <Text style={styles.infoText}>Record ID: {selectedRecord?.recordId}</Text>
        <Text style={styles.infoText}>
          Last modified: {selectedRecord && format(parseISO(selectedRecord.updatedAt), 'PPP')}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.backButton]}
        onPress={() => setShowRecordDetail(false)}
      >
        <Text style={styles.backButtonText}>Back to Records</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          
          {showRecordDetail && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowRecordDetail(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          
          {showCreateForm && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowCreateForm(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>

        {showRecordDetail ? renderRecordDetail() : 
         showCreateForm ? renderCreateForm() : 
         renderRecordsList()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 5,
  },
  backButton: {
    padding: 5,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  recordsList: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008080',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  recordDate: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 18,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordCreatedBy: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#008080',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 4,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inputGroup: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 48,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    backgroundColor: '#008080',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008080',
  },
});