import React from 'react';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock Firebase Auth - used by components for authentication
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  getReactNativePersistence: jest.fn(() => 'mockPersistence'),
  initializeAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

// Modal mocks - only mock if the module exists
try {
  jest.mock('react-native-modal', () => 'Modal');
} catch (e) {
  // Module doesn't exist, skip mock
}

// Mock react-native-gifted-charts - used by components for charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: jest.fn(({ children, ...props }) => null),
  BarChart: jest.fn(({ children, ...props }) => null),
  PieChart: jest.fn(({ children, ...props }) => null),
}));

// Mock date-fns
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn((date, formatStr) => {
      // Return appropriate format based on format string
      if (formatStr && formatStr.includes('EEE')) {
        return 'Thu, Feb 15, 2024';
      }
      return '2024-02-15';
    }),
    parseISO: jest.fn((dateString) => {
      return new Date(dateString);
    }),
    isValid: jest.fn(() => true),
  };
});

// Mock VideoSDK
jest.mock('@videosdk.live/react-native-sdk', () => ({
  MeetingProvider: ({ children }) => children,
  useMeeting: () => ({
    join: jest.fn(),
    leave: jest.fn(),
    end: jest.fn(),
    meetingId: 'test-meeting-id',
  }),
  useParticipant: () => ({
    displayName: 'Test User',
  }),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }) => children,
  useStripe: () => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
  }),
}));

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: ({ children, ...props }) => children || null,
  },
  Tabs: {
    Screen: ({ children, ...props }) => children || null,
  },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock React Native Alert globally
global.Alert = {
  alert: jest.fn(),
};

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock Vector Icons - this handles all icon families used by components
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  
  const createMockIcon = (iconFamily) => {
    const MockIcon = (props) => 
      React.createElement(Text, { testID: `${iconFamily}-${props.name || 'icon'}` }, props.name || 'Icon');
    MockIcon.displayName = iconFamily;
    return MockIcon;
  };

  return {
    Ionicons: createMockIcon('Ionicons'),
    MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
    MaterialIcons: createMockIcon('MaterialIcons'),
    Feather: createMockIcon('Feather'),
    FontAwesome: createMockIcon('FontAwesome'),
    FontAwesome5: createMockIcon('FontAwesome5'),
    AntDesign: createMockIcon('AntDesign'),
    Entypo: createMockIcon('Entypo'),
    EvilIcons: createMockIcon('EvilIcons'),
    Foundation: createMockIcon('Foundation'),
    Octicons: createMockIcon('Octicons'),
    SimpleLineIcons: createMockIcon('SimpleLineIcons'),
    Zocial: createMockIcon('Zocial'),
  };
});

// Silence the warning about act() not being wrapped
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Global test timeout
jest.setTimeout(10000);