import { Alert } from 'react-native';
import api from './api';

export const testConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await api.get('/');
    console.log('Connection test successful:', response.status);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    Alert.alert(
      'Connection Test Failed',
      `Unable to reach backend server.\nError: ${error.message}\n\nPlease check:\n1. Backend server is running\n2. Network connection\n3. Backend URL is correct`
    );
    return false;
  }
};

export const debugNetworkInfo = () => {
  console.log('=== Network Debug Info ===');
  console.log('API Base URL:', api.defaults.baseURL);
  console.log('Platform:', require('react-native').Platform.OS);
  console.log('Development mode:', __DEV__);
};
