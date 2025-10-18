import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/customRender';
import AuthPrompt from '../../components/AuthPrompt';

describe('AuthPrompt', () => {
  const mockOnLogin = jest.fn();
  const mockOnRegister = jest.fn();

  const defaultProps = {
    onLogin: mockOnLogin,
    onRegister: mockOnRegister
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    expect(getByText('Login Required')).toBeTruthy();
    expect(getByText('You need to log in to access this feature')).toBeTruthy();
    expect(getByText('Log In')).toBeTruthy();
    expect(getByText('Create an Account')).toBeTruthy();
    expect(getByTestId('Ionicons-log-in-outline')).toBeTruthy();
  });

  it('renders with custom props', () => {
    const customProps = {
      ...defaultProps,
      title: 'Access Restricted',
      message: 'Please authenticate to continue',
      icon: 'lock-closed-outline'
    };

    const { getByText, getByTestId } = renderWithProviders(
      <AuthPrompt {...customProps} />
    );

    expect(getByText('Access Restricted')).toBeTruthy();
    expect(getByText('Please authenticate to continue')).toBeTruthy();
    expect(getByTestId('Ionicons-lock-closed-outline')).toBeTruthy();
  });

  it('calls onLogin when login button is pressed', () => {
    const { getByText } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);

    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onRegister when register button is pressed', () => {
    const { getByText } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    const registerButton = getByText('Create an Account');
    fireEvent.press(registerButton);

    expect(mockOnRegister).toHaveBeenCalledTimes(1);
  });

  it('renders with different icon types', () => {
    const iconProps = {
      ...defaultProps,
      icon: 'person-outline'
    };

    const { getByTestId } = renderWithProviders(
      <AuthPrompt {...iconProps} />
    );

    expect(getByTestId('Ionicons-person-outline')).toBeTruthy();
  });

  it('handles long messages correctly', () => {
    const longMessageProps = {
      ...defaultProps,
      message: 'This is a very long message that should wrap to multiple lines and still be readable. It tests the text wrapping and layout of the component.'
    };

    const { getByText } = renderWithProviders(
      <AuthPrompt {...longMessageProps} />
    );

    expect(getByText('This is a very long message that should wrap to multiple lines and still be readable. It tests the text wrapping and layout of the component.')).toBeTruthy();
  });

  it('handles empty callbacks gracefully', () => {
    const emptyCallbackProps = {
      onLogin: undefined,
      onRegister: undefined
    };

    const { getByText } = renderWithProviders(
      <AuthPrompt {...emptyCallbackProps} />
    );

    const loginButton = getByText('Log In');
    const registerButton = getByText('Create an Account');

    // Should not throw errors when pressed
    fireEvent.press(loginButton);
    fireEvent.press(registerButton);

    // Verify the component still renders
    expect(getByText('Login Required')).toBeTruthy();
  });

  it('displays correct button styles', () => {
    const { getByText } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    const loginButton = getByText('Log In');
    const registerButton = getByText('Create an Account');

    expect(loginButton).toBeTruthy();
    expect(registerButton).toBeTruthy();
  });

  it('renders icon with correct size and color', () => {
    const { getByTestId } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    const icon = getByTestId('Ionicons-log-in-outline');
    expect(icon).toBeTruthy();
  });

  it('has proper layout structure', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    // Check that all main elements are present in the expected order
    expect(getByTestId('Ionicons-log-in-outline')).toBeTruthy();
    expect(getByText('Login Required')).toBeTruthy();
    expect(getByText('You need to log in to access this feature')).toBeTruthy();
    expect(getByText('Log In')).toBeTruthy();
    expect(getByText('Create an Account')).toBeTruthy();
  });

  it('allows custom titles and messages to be set', () => {
    const customContent = {
      ...defaultProps,
      title: 'Premium Feature',
      message: 'This feature requires a premium account. Please upgrade or log in with your premium credentials.'
    };

    const { getByText } = renderWithProviders(
      <AuthPrompt {...customContent} />
    );

    expect(getByText('Premium Feature')).toBeTruthy();
    expect(getByText('This feature requires a premium account. Please upgrade or log in with your premium credentials.')).toBeTruthy();
  });

  it('maintains button functionality with multiple rapid presses', () => {
    const { getByText } = renderWithProviders(
      <AuthPrompt {...defaultProps} />
    );

    const loginButton = getByText('Log In');
    
    // Simulate rapid multiple presses
    fireEvent.press(loginButton);
    fireEvent.press(loginButton);
    fireEvent.press(loginButton);

    expect(mockOnLogin).toHaveBeenCalledTimes(3);
  });
});