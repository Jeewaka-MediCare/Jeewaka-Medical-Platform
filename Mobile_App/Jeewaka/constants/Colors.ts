/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#008080'; // Teal color
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Teal-based color palette for consistent theming
export const TealTheme = {
  primary: '#008080',      // Main teal
  primaryLight: '#4DB8B8', // Lighter teal
  primaryDark: '#005A5A',  // Darker teal
  secondary: '#20B2AA',    // Light sea green
  accent: '#48CCCC',       // Bright teal
  background: '#F0FDFF',   // Very light teal background
  surface: '#E6FFFE',      // Light teal surface
  error: '#EF4444',        // Red for errors
  warning: '#F59E0B',      // Amber for warnings
  success: '#10B981',      // Emerald for success
  info: '#00B2B2',         // Teal info color
  text: {
    primary: '#1E293B',    // Dark slate
    secondary: '#64748B',  // Slate
    light: '#94A3B8',      // Light slate
    white: '#FFFFFF',
  },
  border: '#E2E8F0',       // Light gray border
  disabled: '#D1D5DB',     // Gray for disabled states
};
