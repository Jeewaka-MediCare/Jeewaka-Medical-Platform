import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import useDoctorDashboard from '../hooks/useDoctorDashboard';
import LoadingState from './LoadingState';
import WelcomeSection from './WelcomeSection';
import DoctorStatsCards from './DoctorStatsCards';
import EarningsSection from './EarningsSection';
import ReviewsSection from './ReviewsSection';
import ProfileCompletionCard from './ProfileCompletionCard';
import ProfessionalInfoSection from './ProfessionalInfoSection';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const {
    // State
    doctorData,
    loading,
    refreshing,
    chartLoading,
    earningsData,
    selectedTimeRange,
    showTimeRangePicker,
    selectedMonth,
    selectedYear,
    showMonthPicker,
    showYearPicker,
    totalEarnings,
    fadeAnim,
    slideAnim,
    scrollAnim,
    recentReviews,
    
    // Data options
    timeRangeOptions,
    monthOptions,
    yearOptions,
    
    // Handlers
    handleTimeRangeSelect,
    handleMonthSelect,
    handleYearSelect,
    toggleTimeRangePicker,
    toggleMonthPicker,
    toggleYearPicker,
    getSelectedTimeRangeLabel,
    getSelectedMonthLabel,
    onRefresh,
    handleViewReviews,
    handleViewEarnings,
    getGreeting,
    calculateProfileCompletion,
    navigateToProfile,
    
    // Computed values
    avgRating,
    totalReviews,
  } = useDoctorDashboard(user, router);

  if (loading && !doctorData) {
    return (
      <View style={styles.container}>
        <LoadingState text="Loading your dashboard..." />
      </View>
    );
  }

  const profileCompletion = calculateProfileCompletion(doctorData);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <WelcomeSection 
          greeting={getGreeting()}
          doctorName={doctorData?.name}
          profileImage={doctorData?.profile}
        />

        <DoctorStatsCards 
          avgRating={avgRating}
          totalReviews={totalReviews}
          yearsOfExperience={doctorData?.yearsOfExperience}
        />

        <EarningsSection
          earningsData={earningsData}
          chartLoading={chartLoading}
          totalEarnings={totalEarnings}
          selectedTimeRange={selectedTimeRange}
          showTimeRangePicker={showTimeRangePicker}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          showMonthPicker={showMonthPicker}
          showYearPicker={showYearPicker}
          timeRangeOptions={timeRangeOptions}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          handleViewEarnings={handleViewEarnings}
          getSelectedTimeRangeLabel={getSelectedTimeRangeLabel}
          getSelectedMonthLabel={getSelectedMonthLabel}
          toggleTimeRangePicker={toggleTimeRangePicker}
          handleTimeRangeSelect={handleTimeRangeSelect}
          toggleMonthPicker={toggleMonthPicker}
          handleMonthSelect={handleMonthSelect}
          toggleYearPicker={toggleYearPicker}
          handleYearSelect={handleYearSelect}
        />

        <ReviewsSection
          recentReviews={recentReviews}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          scrollAnim={scrollAnim}
          handleViewReviews={handleViewReviews}
        />

        <ProfileCompletionCard
          percentage={profileCompletion.percentage}
          missingFields={profileCompletion.missingFields}
          navigateToProfile={navigateToProfile}
        />

        <ProfessionalInfoSection doctorData={doctorData} />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});