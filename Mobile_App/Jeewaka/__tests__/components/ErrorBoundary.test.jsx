import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(getByText('No error')).toBeTruthy();
  });

  it('renders error UI when there is an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Error: Test error')).toBeTruthy();
  });

  it('catches and logs errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('has correct initial state', () => {
    const errorBoundary = new ErrorBoundary({});
    expect(errorBoundary.state).toEqual({ hasError: false, error: null });
  });

  it('updates state when error occurs', () => {
    const error = new Error('Test error');
    const newState = ErrorBoundary.getDerivedStateFromError(error);
    
    expect(newState).toEqual({ hasError: true, error: error });
  });
});