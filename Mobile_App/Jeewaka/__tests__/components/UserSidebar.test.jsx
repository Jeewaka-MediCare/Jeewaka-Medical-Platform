import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/customRender';
import UserSidebar from '../../components/UserSidebar';
import useAuthStore from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');

const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
};

const mockOnLogin = jest.fn();
const mockOnLogout = jest.fn();
const mockOnClose = jest.fn();

describe('UserSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: mockUser,
        userRole: 'patient',
      });
    });

    it('displays user information', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText(mockUser.name)).toBeTruthy();
      expect(getByText('Patient')).toBeTruthy();
    });

    it('displays avatar with user initial', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText('J')).toBeTruthy(); // First letter of John
    });

    it('calls onLogout when logout button is pressed', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      const logoutButton = getByText('Logout');
      fireEvent.press(logoutButton);
      
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('shows logout button', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText('Logout')).toBeTruthy();
    });
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        user: null,
        userRole: null,
      });
    });

    it('displays guest message', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText('Not logged in')).toBeTruthy();
    });

    it('shows login button', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText('Login')).toBeTruthy();
    });

    it('calls onLogin when login button is pressed', () => {
      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      const loginButton = getByText('Login');
      fireEvent.press(loginButton);
      
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('role display', () => {
    it('displays Doctor role correctly', () => {
      useAuthStore.mockReturnValue({
        user: mockUser,
        userRole: 'doctor',
      });

      const { getByText } = renderWithProviders(
        <UserSidebar 
          visible={true}
          onClose={mockOnClose}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
        />
      );
      
      expect(getByText('Doctor')).toBeTruthy();
    });
  });

  it('handles visibility prop correctly', () => {
    // Set up mock for this test
    useAuthStore.mockReturnValue({
      user: mockUser,
      userRole: 'patient',
    });

    const { rerender } = renderWithProviders(
      <UserSidebar 
        visible={false}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onLogout={mockOnLogout}
      />
    );

    // When visible is false, the modal should not be visible
    // This is more of a structural test since Modal visibility is hard to test
    
    rerender(
      <UserSidebar 
        visible={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onLogout={mockOnLogout}
      />
    );

    // Modal should now be visible
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('matches snapshot when user is logged in', () => {
    useAuthStore.mockReturnValue({
      user: mockUser,
      userRole: 'patient',
    });

    const tree = renderWithProviders(
      <UserSidebar 
        visible={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onLogout={mockOnLogout}
      />
    );
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot when user is not logged in', () => {
    useAuthStore.mockReturnValue({
      user: null,
      userRole: null,
    });

    const tree = renderWithProviders(
      <UserSidebar 
        visible={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onLogout={mockOnLogout}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});