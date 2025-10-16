import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import Markdown from 'react-native-markdown-display';
import { medicalRecordsService } from '../services/medicalRecordsService';

export default function MedicalRecordViewer({ 
  visible, 
  record, 
  onClose, 
  onEdit,
  onViewHistory,
  showModal = true 
}) {
  const [recordDetails, setRecordDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && record?.recordId) {
      loadRecordDetails();
    }
  }, [visible, record]);

  const loadRecordDetails = async () => {
    if (!record?.recordId) return;

    setLoading(true);
    try {
      const response = await medicalRecordsService.getRecord(record.recordId);
      // Combine record data with version content
      const recordWithVersion = {
        ...response.record,
        currentVersion: response.latestVersion
      };
      setRecordDetails(recordWithVersion);
    } catch (error) {
      console.error('Error loading record details:', error);
      Alert.alert('Error', 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM dd, yyyy');
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

  const formatDateTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy • hh:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008080" />
          <Text style={styles.loadingText}>Loading record...</Text>
        </View>
      );
    }

    if (!recordDetails) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load record details</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadRecordDetails}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{recordDetails.title}</Text>
          <Text style={styles.recordId}>ID: {recordDetails.recordId}</Text>
        </View>

        {/* Description */}
        {recordDetails.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{recordDetails.description}</Text>
          </View>
        )}

        {/* Medical Record Content */}
        {recordDetails.currentVersion?.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Record</Text>
            <View style={styles.contentContainer}>
              {/* Render content as Markdown */}
              <Markdown
                style={{
                  body: {
                    fontSize: 16,
                    lineHeight: 24,
                    color: '#1E293B',
                  },
                  heading1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#1E293B',
                    marginBottom: 16,
                    marginTop: 8,
                  },
                  heading2: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#1E293B',
                    marginBottom: 12,
                    marginTop: 8,
                  },
                  heading3: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#1E293B',
                    marginBottom: 10,
                    marginTop: 8,
                  },
                  paragraph: {
                    fontSize: 16,
                    lineHeight: 24,
                    color: '#1E293B',
                    marginBottom: 12,
                  },
                  strong: {
                    fontWeight: 'bold',
                    color: '#1E293B',
                  },
                  em: {
                    fontStyle: 'italic',
                  },
                  list_item: {
                    fontSize: 16,
                    lineHeight: 24,
                    color: '#1E293B',
                    marginBottom: 4,
                  },
                  bullet_list: {
                    marginBottom: 12,
                  },
                  ordered_list: {
                    marginBottom: 12,
                  },
                  code_inline: {
                    backgroundColor: '#F1F5F9',
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 14,
                  },
                  code_block: {
                    backgroundColor: '#F1F5F9',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    fontFamily: 'monospace',
                    fontSize: 14,
                  },
                  blockquote: {
                    borderLeftWidth: 4,
                    borderLeftColor: '#008080',
                    paddingLeft: 16,
                    marginBottom: 12,
                    backgroundColor: '#F8FAFC',
                    padding: 12,
                    borderRadius: 4,
                  },
                }}
              >
                {recordDetails.currentVersion.content}
              </Markdown>
            </View>
          </View>
        )}

        {/* Tags */}
        {recordDetails.tags && recordDetails.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {recordDetails.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Doctor Information */}
        {recordDetails.createdBy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <View style={styles.doctorCard}>
              <View style={styles.doctorInfo}>
                <Ionicons name="person-circle" size={40} color="#008080" />
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName}>
                    Dr. {recordDetails.createdBy.name || 'Unknown Doctor'}
                  </Text>
                  {recordDetails.createdBy.specialization && (
                    <Text style={styles.doctorSpecialization}>
                      {recordDetails.createdBy.specialization}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Information</Text>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created:</Text>
              <Text style={styles.metadataValue}>
                {formatDateTime(recordDetails.createdAt)}
              </Text>
            </View>
            
            {recordDetails.updatedAt !== recordDetails.createdAt && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Last Updated:</Text>
                <Text style={styles.metadataValue}>
                  {formatDateTime(recordDetails.updatedAt)}
                </Text>
              </View>
            )}

            {recordDetails.currentVersion && (
              <>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Version:</Text>
                  <Text style={styles.metadataValue}>
                    {recordDetails.currentVersion.versionNumber}
                  </Text>
                </View>
                
                {recordDetails.currentVersion.changeDescription && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Last Change:</Text>
                    <Text style={styles.metadataValue}>
                      {recordDetails.currentVersion.changeDescription}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Actions */}
        {(onEdit || onViewHistory) && (
          <View style={styles.section}>
            <View style={styles.actionButtonsContainer}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => onEdit(recordDetails)}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Edit Record</Text>
                </TouchableOpacity>
              )}
              
              {onViewHistory && recordDetails.currentVersion && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.historyButton]}
                  onPress={() => onViewHistory(recordDetails)}
                >
                  <Ionicons name="time-outline" size={20} color="#008080" />
                  <Text style={[styles.actionButtonText, styles.historyButtonText]}>
                    View History (v{recordDetails.currentVersion.versionNumber})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  if (!showModal) {
    // Render content directly without modal wrapper
    return (
      <View style={styles.container}>
        {renderContent()}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="document-text" size={24} color="#008080" />
            <Text style={styles.modalTitle}>Medical Record</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {renderContent()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 32,
  },
  recordId: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  tagText: {
    fontSize: 14,
    color: '#00695C',
    fontWeight: '500',
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#64748B',
  },
  metadataContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  metadataValue: {
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'right',
    flex: 2,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomSpacing: {
    height: 32,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#008080',
  },
  historyButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#008080',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  historyButtonText: {
    color: '#008080',
  },
});

// Markdown styles for better formatting
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginVertical: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginVertical: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    marginVertical: 4,
  },
  list_item: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  strong: {
    fontWeight: '700',
    color: '#1E293B',
  },
  em: {
    fontStyle: 'italic',
    color: '#1E293B',
  },
  code_inline: {
    backgroundColor: '#F1F5F9',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#1E293B',
  },
  code_block: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#1E293B',
    marginVertical: 8,
  },
  hr: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    fontWeight: '600',
  },
  td: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});