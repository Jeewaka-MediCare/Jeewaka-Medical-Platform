import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicalRecordsService } from '../services/medicalRecordsService';
import useAuthStore from '../store/authStore';

export default function MedicalRecordEditor({ 
  visible, 
  patientId, 
  recordId = null, 
  onClose, 
  onSave 
}) {
  const { user } = useAuthStore();
  const contentInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode] = useState(!recordId); // Create mode if no recordId

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [],
    changeDescription: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    if (visible) {
      if (recordId) {
        loadRecord();
      } else {
        resetForm();
      }
    }
  }, [visible, recordId]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      tags: [],
      changeDescription: ''
    });
    setTagInput('');
  };

  const loadRecord = async () => {
    if (!recordId) return;

    setLoading(true);
    try {
      const response = await medicalRecordsService.getRecord(recordId);
      const { record, latestVersion } = response;
      
      const contentText = latestVersion?.content || '';
      
      setFormData({
        title: record.title || '',
        description: record.description || '',
        content: contentText,
        tags: record.tags || [],
        changeDescription: ''
      });
    } catch (error) {
      console.error('Error loading record:', error);
      Alert.alert('Error', 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the medical record');
      return false;
    }

    if (!formData.content.trim()) {
      Alert.alert('Validation Error', 'Please enter content for the medical record');
      return false;
    }

    // Change description is optional, like in the frontend
    // if (!isEditMode && !formData.changeDescription.trim()) {
    //   Alert.alert('Validation Error', 'Please provide a description of changes for this update');
    //   return false;
    // }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let response;
      
      if (isEditMode) {
        // Create new record
        response = await medicalRecordsService.createRecord(patientId, {
          title: formData.title,
          description: formData.description,
          content: formData.content, // Save as markdown directly
          tags: formData.tags
        });
      } else {
        // Update existing record (creates new version)
        response = await medicalRecordsService.updateRecord(recordId, {
          title: formData.title,
          description: formData.description,
          content: formData.content, // Save as markdown directly
          tags: formData.tags,
          changeDescription: formData.changeDescription || 'Updated record'
        });
      }

      Alert.alert(
        'Success',
        isEditMode ? 'Medical record created successfully' : 'Medical record updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              onSave?.(response);
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', 'Failed to save medical record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Markdown formatting helper functions
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const { start, end } = selection;
    const currentContent = formData.content;
    const selectedText = currentContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      currentContent.substring(0, start) +
      before + textToInsert + after +
      currentContent.substring(end);
    
    setFormData({ ...formData, content: newContent });
    
    // Update selection to be after the inserted text
    const newPosition = start + before.length + textToInsert.length + after.length;
    setSelection({ start: newPosition, end: newPosition });
    
    // Focus the input and set cursor position
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.focus();
        contentInputRef.current.setSelection(newPosition, newPosition);
      }
    }, 10);
  };

  const makeBold = () => insertMarkdown('**', '**', 'bold text');
  const makeItalic = () => insertMarkdown('*', '*', 'italic text');
  const makeHeading1 = () => insertMarkdown('# ', '', 'Heading 1');
  const makeHeading2 = () => insertMarkdown('## ', '', 'Heading 2');
  const makeHeading3 = () => insertMarkdown('### ', '', 'Heading 3');
  const makeBulletList = () => insertMarkdown('- ', '', 'List item');
  const makeNumberedList = () => insertMarkdown('1. ', '', 'List item');
  const makeCode = () => insertMarkdown('`', '`', 'code');

  const handleClose = () => {
    if (formData.title || formData.content) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Close', 
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Create Medical Record' : 'Edit Medical Record'}
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={saving}
            style={[styles.headerButton, saving && styles.disabledButton]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#008080" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008080" />
            <Text style={styles.loadingText}>Loading record...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(value) => handleInputChange('title', value)}
                  placeholder="Enter record title"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Enter brief description"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Content */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Medical Record Content *</Text>
                <Text style={styles.helperText}>Use Markdown formatting to structure your medical notes</Text>
                
                <View style={styles.markdownEditorContainer}>
                  {/* Markdown Toolbar */}
                  <View style={styles.markdownToolbar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeBold}>
                        <Text style={styles.toolbarButtonText}>**B**</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeItalic}>
                        <Text style={styles.toolbarButtonText}>*I*</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeHeading1}>
                        <Text style={styles.toolbarButtonText}>H1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeHeading2}>
                        <Text style={styles.toolbarButtonText}>H2</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeHeading3}>
                        <Text style={styles.toolbarButtonText}>H3</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeBulletList}>
                        <Ionicons name="list" size={16} color="#008080" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeNumberedList}>
                        <Text style={styles.toolbarButtonText}>1.</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton} onPress={makeCode}>
                        <Text style={styles.toolbarButtonText}>`</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                  
                  {/* Markdown Text Input */}
                  <TextInput
                    ref={contentInputRef}
                    style={styles.markdownInput}
                    value={formData.content}
                    onChangeText={(text) => setFormData({ ...formData, content: text })}
                    placeholder="Enter detailed medical record content using Markdown syntax...

Examples:
**Bold text**
*Italic text*
# Heading 1
## Heading 2
### Heading 3
- Bullet point
1. Numbered list
`inline code`"
                    multiline
                    textAlignVertical="top"
                    onSelectionChange={(event) => {
                      const { start, end } = event.nativeEvent.selection;
                      setSelection({ start, end });
                    }}
                  />
                </View>
              </View>

              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.tagInput]}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag"
                    placeholderTextColor="#94A3B8"
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    onPress={handleAddTag}
                    style={styles.addTagButton}
                    disabled={!tagInput.trim()}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                
                {formData.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {formData.tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.tag}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Text style={styles.tagText}>{tag}</Text>
                        <Ionicons name="close" size={16} color="#64748B" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Change Description (for updates only) */}
              {!isEditMode && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Change Description (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.changeDescription}
                    onChangeText={(value) => handleInputChange('changeDescription', value)}
                    placeholder="Describe what changes you made..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008080',
  },
  disabledButton: {
    opacity: 0.6,
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
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    paddingBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },
  contentArea: {
    minHeight: 200,
    maxHeight: 300,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  markdownEditorContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  markdownEditorContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  markdownToolbar: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toolbarButton: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '600',
  },
  markdownInput: {
    minHeight: 200,
    backgroundColor: 'white',
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#008080',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
});