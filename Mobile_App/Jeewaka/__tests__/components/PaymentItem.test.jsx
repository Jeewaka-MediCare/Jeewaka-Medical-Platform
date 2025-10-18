import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/customRender';
import PaymentItem from '../../components/PaymentItem';
import { mockPayment, mockDoctor } from '../../test-utils/mockData';

describe('PaymentItem', () => {
  const mockOnViewMore = jest.fn();
  const mockFormatDate = jest.fn((date) => 'Jan 01, 2024');
  
  // Try a different approach - define as a regular function that returns a value
  const mockFormatAmount = (amount) => `LKR${amount}`;

  const defaultProps = {
    payment: mockPayment,
    onViewMore: mockOnViewMore,
    formatDate: mockFormatDate,
    formatAmount: mockFormatAmount
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment information correctly', () => {
    const { getByText } = renderWithProviders(
      <PaymentItem {...defaultProps} />
    );

    expect(getByText('Dr. John Smith')).toBeTruthy();
    expect(getByText('Cardiology')).toBeTruthy();
    expect(getByText(/Paid on/)).toBeTruthy(); // formatDate is called separately
    expect(getByText('LKR150')).toBeTruthy(); // Now the amount should appear
  });

  it('calls formatDate with correct date', () => {
    renderWithProviders(<PaymentItem {...defaultProps} />);
    
    expect(mockFormatDate).toHaveBeenCalledWith(mockPayment.date);
  });

  it('calls formatAmount with correct amount', () => {
    // Convert to a spy for this test
    const spiedFormatAmount = jest.fn(mockFormatAmount);
    const propsWithSpy = { ...defaultProps, formatAmount: spiedFormatAmount };
    
    renderWithProviders(<PaymentItem {...propsWithSpy} />);
    
    expect(spiedFormatAmount).toHaveBeenCalledWith(mockPayment.amount);
  });

  it('handles missing doctor name gracefully', () => {
    const paymentWithoutDoctorName = {
      ...mockPayment,
      doctorName: undefined,
      doctorSpecialization: undefined,
      doctor: undefined
    };

    const propsWithoutDoctor = {
      ...defaultProps,
      payment: paymentWithoutDoctorName
    };

    const { getByText } = renderWithProviders(
      <PaymentItem {...propsWithoutDoctor} />
    );

    expect(getByText('Unknown Doctor')).toBeTruthy();
    expect(getByText('General')).toBeTruthy();
  });

  it('uses doctor object data when doctorName is not available', () => {
    const paymentWithDoctorObj = {
      ...mockPayment,
      doctorName: undefined,
      doctorSpecialization: undefined,
      doctor: mockDoctor
    };

    const propsWithDoctorObj = {
      ...defaultProps,
      payment: paymentWithDoctorObj
    };

    const { getByText } = renderWithProviders(
      <PaymentItem {...propsWithDoctorObj} />
    );

    expect(getByText('Dr. John Smith')).toBeTruthy();
    expect(getByText('Cardiology')).toBeTruthy();
  });

  it('calls onViewMore when View More button is pressed', () => {
    const { getByText } = renderWithProviders(
      <PaymentItem {...defaultProps} />
    );

    const viewMoreButton = getByText('View More');
    fireEvent.press(viewMoreButton);

    expect(mockOnViewMore).toHaveBeenCalledWith(mockPayment);
  });

  it('displays chevron forward icon in view more button', () => {
    const { getByTestId } = renderWithProviders(
      <PaymentItem {...defaultProps} />
    );

    expect(getByTestId('Ionicons-chevron-forward')).toBeTruthy();
  });

  it('handles payment with created date fallback', () => {
    const paymentWithCreatedDate = {
      ...mockPayment,
      date: undefined,
      created: '2024-01-15T12:00:00.000Z'
    };

    const propsWithCreatedDate = {
      ...defaultProps,
      payment: paymentWithCreatedDate
    };

    renderWithProviders(<PaymentItem {...propsWithCreatedDate} />);

    expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15T12:00:00.000Z');
  });

  it('renders view more button with correct styling', () => {
    const { getByText } = renderWithProviders(
      <PaymentItem {...defaultProps} />
    );

    const viewMoreButton = getByText('View More');
    expect(viewMoreButton).toBeTruthy();
    
    // Test that the button is touchable by checking for press handler
    fireEvent.press(viewMoreButton);
    expect(mockOnViewMore).toHaveBeenCalled();
  });

  it('handles complex payment amounts correctly', () => {
    const paymentWithComplexAmount = {
      ...mockPayment,
      amount: 2500.75
    };

    const complexFormatAmount = jest.fn((amount) => `LKR${amount.toFixed(2)}`);

    const propsWithComplexAmount = {
      ...defaultProps,
      payment: paymentWithComplexAmount,
      formatAmount: complexFormatAmount
    };

    const { getByText } = renderWithProviders(<PaymentItem {...propsWithComplexAmount} />);

    expect(complexFormatAmount).toHaveBeenCalledWith(2500.75);
    expect(getByText('LKR2500.75')).toBeTruthy();
  });

  it('renders all required UI elements', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <PaymentItem {...defaultProps} />
    );

    // Check all text elements are present
    expect(getByText('Dr. John Smith')).toBeTruthy();
    expect(getByText('Cardiology')).toBeTruthy();
    expect(getByText(/Paid on/)).toBeTruthy(); // formatDate is called separately  
    expect(getByText('LKR150')).toBeTruthy(); // formatAmount result
    expect(getByText('View More')).toBeTruthy();

    // Check icon is present
    expect(getByTestId('Ionicons-chevron-forward')).toBeTruthy();
  });
});