import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { diffLines } from 'diff';
import Markdown from 'react-native-markdown-display';
import MedicalRecordsList from './MedicalRecordsList';
import MedicalRecordViewer from './MedicalRecordViewer';
import MedicalRecordEditor from './MedicalRecordEditor';
import useAuthStore from '../store/authStore';
import { medicalRecordsService } from '../services/medicalRecordsService';

export default function MedicalRecordsModal({ 
  visible, 
  onClose, 
  patient,
  initialView = 'list'
}) {
  const { userRole } = useAuthStore();
  const isDoctor = userRole === 'doctor';
  
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentView(initialView);
      setSelectedRecord(null);
    }
  }, [visible, initialView]);

  const handleClose = () => {
    setCurrentView('list');
    setSelectedRecord(null);
    onClose();
  };

  const handleRecordPress = (record) => {
    setSelectedRecord(record);
    setCurrentView('view');
  };

  const handleCreateRecord = () => {
    setSelectedRecord(null);
    setCurrentView('edit');
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedRecord(null);
  };

  const handleSaveRecord = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('list');
    setSelectedRecord(null);
  };

  const handleViewHistory = async (record) => {
    setSelectedRecord(record);
    setVersionHistoryVisible(true);
    setLoadingVersions(true);
    
    try {
      const response = await medicalRecordsService.getRecordVersions(record.recordId);
      setVersions(response.versions || []);
    } catch (error) {
      console.error('Error loading version history:', error);
      Alert.alert('Error', 'Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  };

  const renderDiffText = (version, index) => {
    if (index === versions.length - 1) {
      // First version, no diff to show
      return null;
    }

    const previousVersion = versions[index + 1];
    const diff = diffLines(previousVersion.content || '', version.content || '');
    
    return (
      <View style={styles.diffContainer}>
        <Text style={styles.diffHeader}>What was updated:</Text>
        {diff.map((part, partIndex) => {
          if (part.added) {
            return (
              <View key={partIndex} style={styles.diffAddedContainer}>
                <Markdown
                  style={{
                    body: {
                      color: '#059669',
                      fontSize: 13,
                      margin: 0,
                      padding: 4,
                    },
                    paragraph: {
                      color: '#059669',
                      fontSize: 13,
                      margin: 0,
                    },
                    strong: {
                      color: '#059669',
                      fontWeight: 'bold',
                    },
                    heading1: {
                      color: '#059669',
                      fontSize: 16,
                      fontWeight: 'bold',
                      margin: 0,
                    },
                    heading2: {
                      color: '#059669',
                      fontSize: 15,
                      fontWeight: 'bold',
                      margin: 0,
                    },
                    heading3: {
                      color: '#059669',
                      fontSize: 14,
                      fontWeight: 'bold',
                      margin: 0,
                    },
                  }}
                >
                  {part.value.trim()}
                </Markdown>
              </View>
            );
          } else if (part.removed) {
            return (
              <View key={partIndex} style={styles.diffRemovedContainer}>
                <Markdown
                  style={{
                    body: {
                      color: '#DC2626',
                      fontSize: 13,
                      margin: 0,
                      padding: 4,
                      textDecorationLine: 'line-through',
                    },
                    paragraph: {
                      color: '#DC2626',
                      fontSize: 13,
                      margin: 0,
                      textDecorationLine: 'line-through',
                    },
                    strong: {
                      color: '#DC2626',
                      fontWeight: 'bold',
                      textDecorationLine: 'line-through',
                    },
                    heading1: {
                      color: '#DC2626',
                      fontSize: 16,
                      fontWeight: 'bold',
                      margin: 0,
                      textDecorationLine: 'line-through',
                    },
                    heading2: {
                      color: '#DC2626',
                      fontSize: 15,
                      fontWeight: 'bold',
                      margin: 0,
                      textDecorationLine: 'line-through',
                    },
                    heading3: {
                      color: '#DC2626',
                      fontSize: 14,
                      fontWeight: 'bold',
                      margin: 0,
                      textDecorationLine: 'line-through',
                    },
                  }}
                >
                  {part.value.trim()}
                </Markdown>
              </View>
            );
          }
          return null; // Don't show unchanged parts for brevity
        })}
      </View>
    );
  };

  const renderHeader = () => {
    let title = 'Medical Records';
    let showBack = false;
    
    if (currentView === 'view') {
      title = 'Medical Record';
      showBack = true;
    } else if (currentView === 'edit') {
      title = selectedRecord ? 'Edit Record' : 'Create Record';
      showBack = true;
    }

    return (
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={handleBackToList} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#008080" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <View style={styles.content}>
          {currentView === 'list' && (
            <MedicalRecordsList
              patientId={patient?._id}
              onRecordPress={handleRecordPress}
              onCreateRecord={isDoctor ? handleCreateRecord : null}
              userRole={userRole}
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {currentView === 'view' && selectedRecord && (
            <MedicalRecordViewer
              visible={true}
              record={selectedRecord}
              onClose={handleBackToList}
              onEdit={isDoctor ? () => handleEditRecord(selectedRecord) : null}
              onViewHistory={handleViewHistory}
              showModal={false}
            />
          )}
          
          {currentView === 'edit' && (
            <MedicalRecordEditor
              visible={true}
              patientId={patient?._id}
              recordId={selectedRecord?.recordId}
              onClose={handleBackToList}
              onSave={handleSaveRecord}
            />
          )}
        </View>
      </SafeAreaView>
      
      {/* Version History Modal */}
      <Modal
        visible={versionHistoryVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVersionHistoryVisible(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => setVersionHistoryVisible(false)} 
              style={styles.headerButton}
            >
              <Ionicons name="chevron-back" size={24} color="#008080" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Version History</Text>
            
            <TouchableOpacity 
              onPress={() => setVersionHistoryVisible(false)} 
              style={styles.headerButton}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {loadingVersions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#008080" />
                <Text style={styles.loadingText}>Loading version history...</Text>
              </View>
            ) : versions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No version history found</Text>
              </View>
            ) : (
              versions.map((version, index) => (
                <View key={version._id} style={styles.versionCard}>
                  <View style={styles.versionHeader}>
                    <View>
                      <Text style={styles.versionNumber}>Version {version.versionNumber}</Text>
                      <Text style={styles.versionDate}>
                        {format(parseISO(version.createdAt), 'MMM dd, yyyy • HH:mm')}
                      </Text>
                    </View>
                    {version.createdBy && (
                      <Text style={styles.versionAuthor}>
                        {version.createdBy.name}
                      </Text>
                    )}
                  </View>
                  
                  {version.changeDescription && (
                    <Text style={styles.versionChange}>{version.changeDescription}</Text>
                  )}

                  {/* Show diff for non-initial versions */}
                  {renderDiffText(version, index)}
                  
                  <View style={styles.versionContentContainer}>
                    <Markdown
                      style={{
                        body: {
                          color: '#64748B',
                          fontSize: 14,
                          lineHeight: 20,
                          margin: 0,
                          padding: 0,
                        },
                        paragraph: {
                          color: '#64748B',
                          fontSize: 14,
                          lineHeight: 20,
                          marginBottom: 8,
                        },
                        heading1: {
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: '#64748B',
                          marginBottom: 8,
                        },
                        heading2: {
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: '#64748B',
                          marginBottom: 6,
                        },
                        heading3: {
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: '#64748B',
                          marginBottom: 4,
                        },
                        strong: {
                          fontWeight: 'bold',
                          color: '#64748B',
                        },
                        em: {
                          fontStyle: 'italic',
                          color: '#64748B',
                        },
                        list_item: {
                          color: '#64748B',
                          fontSize: 14,
                        },
                      }}
                    >
                      {version.content || ''}
                    </Markdown>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#008080',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  versionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  versionDate: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  versionAuthor: {
    fontSize: 14,
    color: '#008080',
    fontWeight: '500',
  },
  versionChange: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  versionContentContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 120,
    overflow: 'hidden',
  },
  diffContainer: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  diffHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  diffAdded: {
    fontSize: 13,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    padding: 4,
    marginVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  diffRemoved: {
    fontSize: 13,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: 4,
    marginVertical: 2,
    borderRadius: 4,
    textDecorationLine: 'line-through',
    fontFamily: 'monospace',
  },
});