import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const UserDropdown = ({ visible, onClose, onLogin, onLogout }) => {
  const { user, userRole } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const getDisplayName = () => {
    const nameOptions = [
      user?.name,
      user?.fullName,
      user?.firstName,
      user?.email
    ];
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        return nameOption.trim();
      }
    }
    
    return userRole === 'doctor' ? 'Doctor' : 'Patient';
  };

  const getAvatarInitial = () => {
    const nameOptions = [
      user?.name,
      user?.fullName, 
      user?.firstName,
      user?.email?.charAt(0)
    ];
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        return nameOption.charAt(0).toUpperCase();
      }
    }
    
    return userRole === 'doctor' ? 'D' : 'P';
  };

  const getRoleDisplay = () => {
    return userRole === 'doctor' ? 'Doctor' : 'Patient';
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.dropdown,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }
            ]}
          >
            {user ? (
              // Logged in user content
              <>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={styles.userName}>{getDisplayName()}</Text>
                    <Text style={styles.userRole}>{getRoleDisplay()}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={onLogout}
                >
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Not logged in content
              <>
                <View style={styles.guestInfo}>
                  <Ionicons name="person-circle-outline" size={24} color="#64748B" />
                  <Text style={styles.guestText}>Not logged in</Text>
                </View>
                
                <View style={styles.divider} />
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={onLogin}
                >
                  <Ionicons name="log-in-outline" size={18} color="#008080" />
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Account for header height
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  loginText: {
    fontSize: 14,
    color: '#008080',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default UserDropdown;