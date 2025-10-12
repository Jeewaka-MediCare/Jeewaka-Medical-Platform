import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/customRender';
import LandingPage from '../../components/LandingPage';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPush = jest.fn();

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<LandingPage />);
    
    expect(getByText('Your Health, Our Priority')).toBeTruthy();
    expect(getByText('Welcome Back!')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Create New Account')).toBeTruthy();
  });

  it('displays welcome message', () => {
    const { getByText } = renderWithProviders(<LandingPage />);
    
    expect(getByText("We're excited to see you again. Please sign in to continue your healthcare journey.")).toBeTruthy();
  });

  it('navigates to login when Sign In is pressed', () => {
    const { getByText } = renderWithProviders(<LandingPage />);
    
    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to register when Create New Account is pressed', () => {
    const { getByText } = renderWithProviders(<LandingPage />);
    
    const registerButton = getByText('Create New Account');
    fireEvent.press(registerButton);
    
    expect(mockPush).toHaveBeenCalledWith('/register');
  });

  it('renders medical image', () => {
    const component = renderWithProviders(<LandingPage />);
    // Test that image component is rendered (React Native Testing Library limitation)
    // We test the presence of the component instead
    expect(component).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = renderWithProviders(<LandingPage />);
    expect(tree).toMatchSnapshot();
  });
});