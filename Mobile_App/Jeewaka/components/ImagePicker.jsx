import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ImagePickerComponent = ({ 
  visible, 
  onClose, 
  onImageSelected, 
  currentImage,
  uploading = false,
  title = "Update Profile Image"
}) => {
 const pickImageFromLibrary = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Sorry, we need camera roll permissions to upload your image.',
      [{ text: 'OK' }]
    );
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduced quality to decrease file size
      base64: true,
    });

    console.log('Image picker result:', {
      canceled: result.canceled,
      assets: result.assets ? result.assets.length : 0,
      firstAsset: result.assets?.[0] ? {
        uri: result.assets[0].uri?.substring(0, 50) + '...',
        width: result.assets[0].width,
        height: result.assets[0].height,
        hasBase64: !!result.assets[0].base64
      } : null
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0]);
      onClose();
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
    console.error('Image picker error:', error);
  }
};

const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Sorry, we need camera permissions to take your photo.',
      [{ text: 'OK' }]
    );
    return;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduced quality to decrease file size
      base64: true,
    });

    console.log('Camera result:', {
      canceled: result.canceled,
      assets: result.assets ? result.assets.length : 0,
      firstAsset: result.assets?.[0] ? {
        uri: result.assets[0].uri?.substring(0, 50) + '...',
        width: result.assets[0].width,
        height: result.assets[0].height,
        hasBase64: !!result.assets[0].base64
      } : null
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0]);
      onClose();
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to take photo');
    console.error('Camera error:', error);
  }
};

  const removeImage = () => {
  Alert.alert(
    "Remove Image",
    "Are you sure you want to remove your profile image?",
    [
      { text: "Cancel", style: "cancel", onPress: onClose },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          console.log('Remove image confirmed');
          onImageSelected(null); // Pass null to indicate removal
          onClose();
        }
      }
    ]
  );
};

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {uploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#008080" />
              <Text style={styles.uploadingText}>Processing image...</Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalOption} 
                onPress={takePhoto}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="camera" size={24} color="#008080" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>Take Photo</Text>
                  <Text style={styles.modalOptionDescription}>Capture a new picture</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption} 
                onPress={pickImageFromLibrary}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="images" size={24} color="#008080" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                  <Text style={styles.modalOptionDescription}>Select from your photo library</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {currentImage && (
                <TouchableOpacity 
                  style={[styles.modalOption, styles.removeOption]} 
                  onPress={removeImage}
                >
                  <View style={styles.modalOptionIcon}>
                    <Ionicons name="trash" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.modalOptionText}>
                    <Text style={[styles.modalOptionTitle, styles.removeText]}>Remove Image</Text>
                    <Text style={styles.modalOptionDescription}>Remove your current image</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  modalContent: {
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  removeOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  removeText: {
    color: '#EF4444',
  },
});

export default ImagePickerComponent;