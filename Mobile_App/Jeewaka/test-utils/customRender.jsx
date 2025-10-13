import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => {
    return (
      <NavigationContainer>
        {children}
      </NavigationContainer>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { renderWithProviders as render };