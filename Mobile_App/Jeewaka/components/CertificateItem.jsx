import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CertificateItem({ item, onRemove, formatDate }) {
  return (
    <View style={styles.certificateItem}>
      <View style={styles.certificateInfo}>
        <Text style={styles.certificateName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.certificateDate}>
          Uploaded: {formatDate(item.uploadedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onRemove(item.id)}
      >
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    backgroundColor: '#c35252ff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});