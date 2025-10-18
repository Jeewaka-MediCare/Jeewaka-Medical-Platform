import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { medicalRecordsService } from '../services/medicalRecordsService';

export default function MedicalRecordsList({ 
  patientId, 
  onRecordPress, 
  onCreateRecord,
  userRole = 'patient',
  refreshTrigger 
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      const response = await medicalRecordsService.getPatientRecords(patientId);
      setRecords(response.records || []);
    } catch (error) {
      console.error('Error loading medical records:', error);
      Alert.alert('Error', 'Failed to load medical records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'hh:mm a');
    } catch (error) {
      return '';
    }
  };

  const renderRecordCard = (record) => (
    <TouchableOpacity
      key={record._id}
      style={styles.recordCard}
      onPress={() => onRecordPress?.(record)}
      activeOpacity={0.7}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleContainer}>
          <Ionicons name="document-text" size={20} color="#008080" />
          <Text style={styles.recordTitle} numberOfLines={1}>
            {record.title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>

      {record.description && (
        <Text style={styles.recordDescription} numberOfLines={2}>
          {record.description}
        </Text>
      )}

      <View style={styles.recordMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.metaText}>
            {formatDate(record.createdAt)}
          </Text>
        </View>
        
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.metaText}>
            {formatTime(record.createdAt)}
          </Text>
        </View>
      </View>

      {record.createdBy && (
        <View style={styles.doctorInfo}>
          <Ionicons name="person-outline" size={16} color="#64748B" />
          <Text style={styles.doctorName}>
            Dr. {record.createdBy.name || 'Unknown Doctor'}
          </Text>
        </View>
      )}

      {record.tags && record.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {record.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {record.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{record.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Version indicator */}
      <View style={styles.versionInfo}>
        <Ionicons name="layers-outline" size={14} color="#64748B" />
        <Text style={styles.versionText}>
          Version {record.currentVersionId?.versionNumber || 1}
        </Text>
        {record.lastModifiedBy && record.lastModifiedBy._id !== record.createdBy?._id && (
          <Text style={styles.lastModifiedText}>
            • Updated by Dr. {record.lastModifiedBy.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.recordsCount}>
          {records.length} Record{records.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {userRole === 'doctor' && onCreateRecord && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={onCreateRecord}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={80} color="#94A3B8" />
      <Text style={styles.emptyTitle}>No Medical Records</Text>
      <Text style={styles.emptyMessage}>
        {userRole === 'doctor' 
          ? 'Create the first medical record for this patient.'
          : 'Your medical records will appear here when they are created by your doctors.'
        }
      </Text>
      {userRole === 'doctor' && onCreateRecord && (
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={onCreateRecord}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.emptyActionButtonText}>Create Medical Record</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator testID="activity-indicator" size="large" color="#008080" />
        <Text style={styles.loadingText}>Loading medical records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {records.length > 0 && renderHeader()}
      
      <ScrollView
        testID="medical-records-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#008080']}
            tintColor="#008080"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {records.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.recordsList}>
            {records.map(renderRecordCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
  },
  recordsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  recordDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  recordMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#64748B',
  },
  lastModifiedText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});