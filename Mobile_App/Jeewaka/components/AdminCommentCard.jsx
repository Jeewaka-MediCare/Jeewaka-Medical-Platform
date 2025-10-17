import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminCommentCard({ doctorData }) {
  if (doctorData.commentFromAdmin) {
    return (
      <View style={styles.commentCard}>
        <Text style={styles.commentTitle}>Message from Admin</Text>
        <Text style={styles.commentText}>{doctorData.commentFromAdmin}</Text>
      </View>
    );
  }

  return (
    <View style={styles.noCommentCard}>
      <Text style={styles.noCommentText}>No comments from admin yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  commentCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#008080',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#008080',
    lineHeight: 20,
  },
  noCommentCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#d5eeeeff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#008080',
  },
  noCommentText: {
    fontSize: 14,
    color: '#64748B',
  },
});