import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';

export default function EarningsSection({
  earningsData,
  chartLoading,
  totalEarnings,
  selectedTimeRange,
  showTimeRangePicker,
  selectedMonth,
  selectedYear,
  showMonthPicker,
  showYearPicker,
  timeRangeOptions,
  monthOptions,
  yearOptions,
  handleViewEarnings,
  getSelectedTimeRangeLabel,
  getSelectedMonthLabel,
  toggleTimeRangePicker,
  handleTimeRangeSelect,
  toggleMonthPicker,
  handleMonthSelect,
  toggleYearPicker,
  handleYearSelect,
}) {
  const renderChart = () => {
    if (chartLoading) {
      return (
        <View style={styles.chartLoadingContainer}>
          <ActivityIndicator size="large" color="#4DB6AC" />
          <Text style={styles.chartLoadingText}>Loading chart data...</Text>
        </View>
      );
    }

    const screenWidth = Dimensions.get('window').width;
    const containerWidth = screenWidth - 120; 
    const dataLength = earningsData.chartData.length;
    
    // Calculate optimal chart width for scrollability
    let chartWidth, spacing;
    if (selectedTimeRange === 'monthly' || dataLength >= 15) {
      const minSpacing = selectedTimeRange === 'monthly' ? 20 : 15;
      chartWidth = Math.max(containerWidth, dataLength * minSpacing + 100);
      spacing = Math.max(minSpacing, (chartWidth - 100) / dataLength);
    } else {
      chartWidth = containerWidth;
      spacing = dataLength > 1 ? Math.max(30, (chartWidth - 80) / (dataLength - 1)) : 50;
    }
    
    // Calculate Y-axis labels with improved scaling
    const maxEarnings = Math.max(...earningsData.chartData.map(d => Math.max(d.earnings / 100, 0)));
    
    let maxValue;
    if (maxEarnings <= 100) {
      maxValue = Math.ceil(maxEarnings * 1.2 / 10) * 10;
    } else if (maxEarnings <= 1000) {
      maxValue = Math.ceil(maxEarnings * 1.2 / 100) * 100;
    } else {
      maxValue = Math.ceil(maxEarnings * 1.2 / 1000) * 1000;
    }
    
    maxValue = Math.max(1000, maxValue);
    
    const yAxisLabels = [];
    for (let i = 0; i <= 6; i++) {
      const value = (maxValue / 6) * i;
      if (value >= 1000000) {
        yAxisLabels.push(`${(value / 1000000).toFixed(1)}M`);
      } else if (value >= 1000) {
        yAxisLabels.push(`${(value / 1000).toFixed(0)}k`);
      } else {
        yAxisLabels.push(value.toFixed(0));
      }
    }
    
    const isScrollable = chartWidth > containerWidth;
    
    return (
      <ScrollView
        horizontal={isScrollable}
        showsHorizontalScrollIndicator={isScrollable}
        style={{ flex: 1 }}
        contentContainerStyle={{ minWidth: chartWidth }}
      >
        {/* Week Separators for Multi-Week Views */}
        {(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') && (
          <View style={[styles.weekSeparatorsContainer, { width: chartWidth }]}>
            {selectedTimeRange === '4weeks-daily' ? (
              [1, 2, 3, 4].map((week, index) => (
                <View key={week} style={[
                  styles.weekSeparator,
                  {
                    left: 70 + (index * (chartWidth - 120) / 4),
                    width: (chartWidth - 120) / 4,
                  }
                ]}>
                  <Text style={styles.weekSeparatorText}>Week {week}</Text>
                </View>
              ))
            ) : (
              <View style={[
                styles.weekSeparator,
                {
                  left: 70 + ((chartWidth - 120) / 2) - 25,
                  width: 50,
                }
              ]}>
                <Text style={styles.weekSeparatorText}>Last 7 Days</Text>
              </View>
            )}
          </View>
        )}
        
        {earningsData.chartData.length > 0 ? (
          <LineChart
            areaChart
            data={earningsData.chartData.map((item, index) => ({
              value: Math.max(item.earnings / 100, 0),
              label: item.label,
              date: item.date,
              dayOfWeek: item.dayOfWeek,
              dayOfMonth: item.dayOfMonth,
              index: index,
            }))}
            width={chartWidth}
            height={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 280 : 240}
            spacing={spacing}
            initialSpacing={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 20 : 40}
            endSpacing={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 20 : 40}
            adjustToWidth={false}
            color="#4DB6AC"
            thickness={selectedTimeRange === '4weeks-daily' ? 2 : 3}
            startFillColor="#008080"
            endFillColor="rgba(147, 197, 253, 0.1)"
            startOpacity={0.4}
            endOpacity={0.1}
            noOfSections={6}
            maxValue={maxValue}
            minValue={0}
            yAxisOffset={0}
            hideOrigin={false}
            yAxisLabelTexts={yAxisLabels}
            yAxisColor="#E5E7EB"
            xAxisColor="#E5E7EB"
            yAxisThickness={1}
            xAxisThickness={1}
            yAxisLabelWidth={50}
            rulesType="solid"
            rulesColor="#F3F4F6"
            rulesThickness={1}
            yAxisTextStyle={{
              color: '#374151',
              fontSize: 11,
              fontWeight: '500',
            }}
            showYAxisIndices={true}
            yAxisLabelSuffix=""
            xAxisLabelTextStyle={{
              color: '#6B7280',
              fontSize: (selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 9 : 11,
              fontWeight: '500',
            }}
            showVerticalLines={selectedTimeRange === '4weeks-daily'}
            verticalLinesColor="#E5E7EB"
            verticalLinesThickness={1}
            verticalLinesZIndex={0}
            verticalLinesUptoDataPoint={true}
            noOfVerticalLines={selectedTimeRange === '4weeks-daily' ? 3 : 0}
            curved={false}
            isAnimated={true}
            animationDuration={1500}
            animateOnDataChange={true}
            onDataChangeAnimationDuration={800}
            hideDataPoints={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week')}
            dataPointsHeight={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 6 : 8}
            dataPointsWidth={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 6 : 8}
            dataPointsColor="#008080"
            dataPointsRadius={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 3 : 4}
            focusEnabled={true}
            showStripOnFocus={true}
            stripColor="#E5E7EB"
            stripOpacity={0.5}
            stripWidth={2}
            showTextOnFocus={true}
            focusedDataPointColor="#1D4ED8"
            focusedDataPointRadius={(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') ? 5 : 6}
            textShiftY={-8}
            textShiftX={0}
            textColor="#1F2937"
            textFontSize={12}
            pointerConfig={{
              hidePointer1: true,
              showPointerStrip: false,
            }}
          />
        ) : (
          <View style={styles.emptyChartContainer}>
            <MaterialCommunityIcons name="chart-line" size={48} color="#E5E7EB" />
            <Text style={styles.emptyChartText}>
              {selectedTimeRange === 'monthly' ? 'No data available for this month' : 'No earnings data available'}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.earningsSection}>
      {/* Earnings Header Row */}
      <View style={styles.earningsHeaderRow}>
        <Text style={styles.sectionTitle}>Your Earnings</Text>
        <TouchableOpacity 
          style={styles.viewEarningsButton}
          onPress={handleViewEarnings}
        >
          <MaterialCommunityIcons name="eye" size={16} color="#008080" />
          <Text style={styles.viewEarningsText}>View Earnings</Text>
        </TouchableOpacity>
      </View>
          
      <View style={styles.earningsStatsRow}>
        <View style={styles.earningsCard}>
          <MaterialCommunityIcons name="calendar-today" size={20} color="#F59E0B" />
          <Text style={styles.earningsValue}>LKR {(earningsData.todayEarnings / 100).toLocaleString()}</Text>
          <Text style={styles.earningsLabel}>Today</Text>
        </View>
        <View style={styles.earningsCard}>
          <MaterialCommunityIcons 
            name="calendar-week" 
            size={20} 
            color="#10B981" 
          />
          <Text style={styles.earningsValue}>LKR {(earningsData.weeklyEarnings / 100).toLocaleString()}</Text>
          <Text style={styles.earningsLabel}>This Week</Text>
        </View>
      </View>
      
      <View style={styles.totalEarningsRow}>
        <MaterialCommunityIcons name="cash-multiple" size={20} color="#008080" />
        <Text style={styles.totalEarningsLabel}>
          Total Earnings (
          {selectedTimeRange === 'monthly' 
            ? `${getSelectedMonthLabel()} ${selectedYear}` 
            : getSelectedTimeRangeLabel()
          }): 
        </Text>
        <Text style={styles.totalEarningsValue}>LKR {(totalEarnings / 100).toLocaleString()}</Text>
      </View>
      
      {/* Earnings Chart with Time Range Selector */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {selectedTimeRange === 'monthly' 
              ? `Daily Earnings - ${getSelectedMonthLabel()} ${selectedYear}` 
              : 'Daily Earnings Trend'
            }
          </Text>
          <TouchableOpacity 
            style={styles.timeRangeButton}
            onPress={toggleTimeRangePicker}
          >
            <Text style={styles.timeRangeText}>{getSelectedTimeRangeLabel()}</Text>
            <MaterialCommunityIcons 
              name={showTimeRangePicker ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Time Range Picker Dropdown */}
        {showTimeRangePicker && (
          <View style={styles.timeRangeDropdown}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeRangeOption,
                  selectedTimeRange === option.value && styles.selectedTimeRangeOption
                ]}
                onPress={() => handleTimeRangeSelect(option.value)}
              >
                <Text style={[
                  styles.timeRangeOptionText,
                  selectedTimeRange === option.value && styles.selectedTimeRangeOptionText
                ]}>
                  {option.label}
                </Text>
                {selectedTimeRange === option.value && (
                  <MaterialCommunityIcons name="check" size={16} color="#059669" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Month/Year Picker for Monthly View */}
        {selectedTimeRange === 'monthly' && (
          <View style={styles.monthYearPickerRow}>
            {/* Month Picker */}
            <View style={styles.monthYearPickerContainer}>
              <TouchableOpacity 
                style={styles.monthYearButton}
                onPress={toggleMonthPicker}
              >
                <Text style={styles.monthYearText}>{getSelectedMonthLabel()}</Text>
                <MaterialCommunityIcons 
                  name={showMonthPicker ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              
              {/* Month Dropdown */}
              {showMonthPicker && (
                <View style={styles.monthYearDropdown}>
                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={styles.dropdownScrollView}
                  >
                    {monthOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.monthYearOption,
                          selectedMonth === option.value && styles.selectedMonthYearOption
                        ]}
                        onPress={() => handleMonthSelect(option.value)}
                      >
                        <Text style={[
                          styles.monthYearOptionText,
                          selectedMonth === option.value && styles.selectedMonthYearOptionText
                        ]}>
                          {option.label}
                        </Text>
                        {selectedMonth === option.value && (
                          <MaterialCommunityIcons name="check" size={14} color="#059669" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Year Picker */}
            <View style={styles.monthYearPickerContainer}>
              <TouchableOpacity 
                style={styles.monthYearButton}
                onPress={toggleYearPicker}
              >
                <Text style={styles.monthYearText}>{selectedYear}</Text>
                <MaterialCommunityIcons 
                  name={showYearPicker ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              
              {/* Year Dropdown */}
              {showYearPicker && (
                <View style={styles.monthYearDropdown}>
                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={styles.dropdownScrollView}
                  >
                    {yearOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.monthYearOption,
                          selectedYear === option.value && styles.selectedMonthYearOption
                        ]}
                        onPress={() => handleYearSelect(option.value)}
                      >
                        <Text style={[
                          styles.monthYearOptionText,
                          selectedYear === option.value && styles.selectedMonthYearOptionText
                        ]}>
                          {option.label}
                        </Text>
                        {selectedYear === option.value && (
                          <MaterialCommunityIcons name="check" size={14} color="#059669" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.chartWrapper}
          activeOpacity={1}
        >
          {renderChart()}
        </TouchableOpacity>
        
        {/* Chart Statistics */}
        <View style={styles.chartStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons 
                name={earningsData.chartData.length > 1 && 
                     earningsData.chartData[earningsData.chartData.length - 1].earnings > earningsData.chartData[0].earnings
                     ? "trending-up" : "trending-down"} 
                size={16} 
                color={earningsData.chartData.length > 1 && 
                      earningsData.chartData[earningsData.chartData.length - 1].earnings > earningsData.chartData[0].earnings
                      ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.statLabel, {
                color: earningsData.chartData.length > 1 && 
                       earningsData.chartData[earningsData.chartData.length - 1].earnings > earningsData.chartData[0].earnings
                       ? "#10B981" : "#EF4444"
              }]}>
                {earningsData.chartData.length > 1 ? 
                  (earningsData.chartData[earningsData.chartData.length - 1].earnings > earningsData.chartData[0].earnings ? 
                    'Trending up' : 'Trending down') 
                  : 'Stable'}
              </Text>
            </View>
            <View style={styles.chartInfoItem}>
              <Text style={styles.chartInfoLabel}>
                {earningsData.chartData.length} days
              </Text>
              <Text style={styles.periodLabel}>
                {selectedTimeRange === 'monthly' 
                  ? `${getSelectedMonthLabel()} ${selectedYear}` 
                  : selectedTimeRange === 'last-week'
                  ? 'Last 7 Days'
                  : 'Last 4 Weeks'
                }
              </Text>
            </View>
          </View>
          
          {/* Additional daily stats */}
          {(selectedTimeRange === '4weeks-daily' || selectedTimeRange === 'last-week') && earningsData.chartData.length > 0 && (
            <View style={styles.dailyStatsRow}>
              <View style={styles.dailyStatItem}>
                <Text style={styles.dailyStatValue}>
                  {Math.round(totalEarnings / 100 / earningsData.chartData.length)}
                </Text>
                <Text style={styles.dailyStatLabel}>Avg/Day (LKR)</Text>
              </View>
              <View style={styles.dailyStatItem}>
                <Text style={styles.dailyStatValue}>
                  {Math.max(...earningsData.chartData.map(d => Math.round(d.earnings / 100)))}
                </Text>
                <Text style={styles.dailyStatLabel}>Best Day (LKR)</Text>
              </View>
              <View style={styles.dailyStatItem}>
                <Text style={styles.dailyStatValue}>
                  {earningsData.chartData.filter(d => d.earnings > 0).length}
                </Text>
                <Text style={styles.dailyStatLabel}>Active Days</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Earnings Section Styles
  earningsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  earningsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  totalEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  totalEarningsValue: {
    fontSize: 16,
    color: '#008080',
    fontWeight: 'bold',
  },
  viewEarningsButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0F2F1',
  },
  viewEarningsText: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '500',
  },
  // Chart styles
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 16,
    marginHorizontal: 4,
    position: 'relative',
    overflow: 'visible',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
    justifyContent: 'center',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  timeRangeDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedTimeRangeOption: {
    backgroundColor: '#F0FDF4',
  },
  timeRangeOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
  },
  selectedTimeRangeOptionText: {
    color: '#059669',
    fontWeight: '500',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    width: '100%',
  },
  chartStats: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  periodLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  // Month/Year Picker Styles
  monthYearPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
  monthYearPickerContainer: {
    flex: 1,
    position: 'relative',
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 36,
  },
  monthYearText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  monthYearDropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 150,
  },
  dropdownScrollView: {
    maxHeight: 148,
  },
  monthYearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedMonthYearOption: {
    backgroundColor: '#F0FDF4',
  },
  monthYearOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '400',
  },
  selectedMonthYearOptionText: {
    color: '#059669',
    fontWeight: '500',
  },
  // Additional Chart Statistics Styles
  chartInfoItem: {
    alignItems: 'flex-end',
  },
  chartInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  dailyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dailyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  dailyStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  dailyStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Week Separators Styles
  weekSeparatorsContainer: {
    position: 'absolute',
    top: -25,
    height: 20,
    flexDirection: 'row',
    zIndex: 10,
  },
  weekSeparator: {
    position: 'absolute',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekSeparatorText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  // Chart Loading Styles
  chartLoadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginVertical: 10,
  },
  chartLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Empty Chart Styles
  emptyChartContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});