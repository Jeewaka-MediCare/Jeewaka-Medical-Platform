import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthPrompt({ 
  title = 'Login Required',
  message = 'You need to log in to access this feature',
  onLogin,
  onRegister,
  icon = 'log-in-outline'
}) {
  return (
    <View style={styles.content}>
      <Ionicons name={icon} size={80} color="#94A3B8" style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={onLogin}
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.registerButton} 
        onPress={onRegister}
      >
        <Text style={styles.registerButtonText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#008080',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#008080',
  },
  registerButtonText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '600',
  },
});