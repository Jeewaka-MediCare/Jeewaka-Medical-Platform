import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Building2, Video, MapPin, Award, RefreshCw, Filter, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminInsightsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    granularity: 'monthly',
    topN: 5,
    fromYear: new Date().getFullYear(),
    fromMonth: 1,
    toYear: new Date().getFullYear(),
    toMonth: new Date().getMonth() + 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sample data for initial render
  const sampleData = {
    "granularity": "monthly",
    "periodBoundsUTC": {
      "from": "2025-01-01T00:00:00.000Z",
      "to": "2025-11-01T00:00:00.000Z"
    },
    "summary": {
      "revenue": 99260,
      "appointments": 19,
      "avgCharge": 5224.21,
      "revenuePerAppointment": 5224.21
    },
    "changeVsPrev": {
      "revenue": {
        "current": 99260,
        "previous": 0,
        "delta": 99260,
        "deltaPct": null
      },
      "appointments": {
        "current": 19,
        "previous": 0,
        "delta": 19,
        "deltaPct": null
      }
    },
    "series": [
      {
        "totalRevenue": 260,
        "appointments": 6,
        "avgCharge": 43.33,
        "year": 2025,
        "month": 8
      },
      {
        "totalRevenue": 99000,
        "appointments": 13,
        "avgCharge": 7615.38,
        "year": 2025,
        "month": 10
      }
    ],
    "mixByType": [
      {
        "revenue": 50260,
        "appointments": 12,
        "type": "in-person"
      },
      {
        "revenue": 49000,
        "appointments": 7,
        "type": "video"
      }
    ],
    "leaderboards": {
      "topDoctors": [
        {
          "revenue": 67500,
          "appointments": 9,
          "avgCharge": 7500,
          "doctor": {
            "_id": "68e274a18e7cf75f167a7f02",
            "name": "Dr. Priya Dayawansha",
            "email": "priya@gmail.com"
          },
          "doctorId": "68e274a18e7cf75f167a7f02"
        },
        {
          "revenue": 30000,
          "appointments": 3,
          "avgCharge": 10000,
          "doctor": {
            "_id": "68dff7dc90e86efd87236594",
            "name": "Dr. Sunimal Dissanayaka",
            "email": "sunimal@gmail.com"
          },
          "doctorId": "68dff7dc90e86efd87236594"
        }
      ],
      "topHospitals": [
        {
          "revenue": 20000,
          "appointments": 2,
          "hospitalId": "687d163066f108143c4e075a"
        },
        {
          "revenue": 15000,
          "appointments": 2,
          "hospitalId": "687d161666f108143c4e0756"
        }
      ]
    },
    "context": {
      "allTime": {
        "totalRevenueAllTime": 99260,
        "totalAppointmentsAllTime": 19,
        "avgChargeAllTime": 5224.21
      }
    }
  };

  useEffect(() => {
    setData(sampleData);
    // Uncomment to fetch real data on mount
    // fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        granularity: filters.granularity,
        top: filters.topN.toString(),
        fromYear: filters.fromYear.toString(),
        fromMonth: filters.fromMonth.toString(),
        toYear: filters.toYear.toString(),
        toMonth: filters.toMonth.toString(),
      });

      const response = await fetch(`/admin/finance/insights?${params}`);
      const result = await response.json();
      
      if (result.ok) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('LKR', 'Rs');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const formatPeriodLabel = (item) => {
    if (filters.granularity === 'yearly') {
      return item.year.toString();
    } else if (filters.granularity === 'quarterly') {
      return `Q${item.quarter} ${item.year}`;
    } else {
      return `${getMonthName(item.month)} ${item.year}`;
    }
  };

  const renderTrendIndicator = (change) => {
    if (change.deltaPct === null) {
      return <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700 border-teal-200">New Period</Badge>;
    }
    
    const isPositive = change.deltaPct >= 0;
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-sm font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {Math.abs(change.deltaPct).toFixed(1)}%
        </span>
      </div>
    );
  };

  // <CHANGE> Updated colors to medical green/teal theme
  const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0891b2', '#059669'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* <CHANGE> Enhanced header with medical theme and better styling */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-teal-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                Business Insights
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                {formatDate(data.periodBoundsUTC.from)} - {formatDate(data.periodBoundsUTC.to)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* <CHANGE> Enhanced filter panel with modern styling */}
        {showFilters && (
          <Card className="border-teal-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
              <CardTitle className="text-lg text-teal-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">Granularity</Label>
                  <Select
                    value={filters.granularity}
                    onValueChange={(value) => setFilters({ ...filters, granularity: value })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">Top N</Label>
                  <Select
                    value={filters.topN.toString()}
                    onValueChange={(value) => setFilters({ ...filters, topN: Number(value) })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                      <SelectItem value="25">Top 25</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">From Year</Label>
                  <Select
                    value={filters.fromYear.toString()}
                    onValueChange={(value) => setFilters({ ...filters, fromYear: Number(value) })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">From Month</Label>
                  <Select
                    value={filters.fromMonth.toString()}
                    onValueChange={(value) => setFilters({ ...filters, fromMonth: Number(value) })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">To Year</Label>
                  <Select
                    value={filters.toYear.toString()}
                    onValueChange={(value) => setFilters({ ...filters, toYear: Number(value) })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-teal-900 font-medium">To Month</Label>
                  <Select
                    value={filters.toMonth.toString()}
                    onValueChange={(value) => setFilters({ ...filters, toMonth: Number(value) })}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={fetchData} 
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* <CHANGE> Enhanced badges with medical theme */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
            {filters.granularity.charAt(0).toUpperCase() + filters.granularity.slice(1)} View
          </Badge>
          <Badge variant="outline" className="text-sm bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
            Showing Top {filters.topN}
          </Badge>
        </div>

        {/* <CHANGE> Enhanced key metrics cards with gradients and better styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-teal-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-transparent rounded-bl-full opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-600">Total Revenue</CardTitle>
              <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-teal-900">{formatCurrency(data.summary.revenue)}</div>
              <div className="flex items-center gap-2 mt-3">
                {renderTrendIndicator(data.changeVsPrev.revenue)}
                <span className="text-xs text-gray-500">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-bl-full opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-600">Appointments</CardTitle>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-emerald-900">{data.summary.appointments}</div>
              <div className="flex items-center gap-2 mt-3">
                {renderTrendIndicator(data.changeVsPrev.appointments)}
                <span className="text-xs text-gray-500">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-100 to-transparent rounded-bl-full opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-600">Avg Charge</CardTitle>
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-cyan-900">{formatCurrency(data.summary.avgCharge)}</div>
              <p className="text-xs text-gray-500 mt-3">Per appointment</p>
            </CardContent>
          </Card>

          <Card className="border-teal-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-bl-full opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-gray-600">All-Time Revenue</CardTitle>
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
                <Award className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-amber-900">{formatCurrency(data.context.allTime.totalRevenueAllTime)}</div>
              <p className="text-xs text-gray-500 mt-3">{data.context.allTime.totalAppointmentsAllTime} total appointments</p>
            </CardContent>
          </Card>
        </div>

        {/* <CHANGE> Enhanced charts section with better card styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="border-teal-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
              <CardTitle className="text-teal-900">Revenue Trend</CardTitle>
              <CardDescription className="text-teal-700">{filters.granularity.charAt(0).toUpperCase() + filters.granularity.slice(1)} revenue and appointments</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis 
                    dataKey={(item) => formatPeriodLabel(item)}
                    tick={{ fontSize: 12, fill: '#0f766e' }}
                  />
                  <YAxis tick={{ fill: '#0f766e' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                      if (name === 'appointments') return [value, 'Appointments'];
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: '#f0fdfa', border: '1px solid #5eead4', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#14b8a6" strokeWidth={3} name="Revenue" dot={{ fill: '#14b8a6', r: 4 }} />
                  <Line type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={3} name="Appointments" dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Type Mix */}
          <Card className="border-teal-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-teal-100">
              <CardTitle className="text-teal-900">Session Type Distribution</CardTitle>
              <CardDescription className="text-teal-700">Revenue by appointment type</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.mixByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {data.mixByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#f0fdfa', border: '1px solid #5eead4', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {data.mixByType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS[index]}20` }}>
                        {type.type === 'in-person' ? (
                          <MapPin className="w-5 h-5" style={{ color: COLORS[index] }} />
                        ) : (
                          <Video className="w-5 h-5" style={{ color: COLORS[index] }} />
                        )}
                      </div>
                      <span className="capitalize font-medium text-teal-900">{type.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-900">{formatCurrency(type.revenue)}</div>
                      <div className="text-xs text-teal-600">{type.appointments} appointments</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* <CHANGE> Enhanced leaderboards with modern tabs and styling */}
        <Tabs defaultValue="doctors" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-teal-50 border border-teal-200">
            <TabsTrigger 
              value="doctors"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Top Doctors
            </TabsTrigger>
            <TabsTrigger 
              value="hospitals"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Top Hospitals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">
            <Card className="border-teal-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                <CardTitle className="text-teal-900">Top {filters.topN} Performing Doctors</CardTitle>
                <CardDescription className="text-teal-700">Ranked by total revenue generated</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {data.leaderboards.topDoctors.map((doctor, index) => (
                    <div key={doctor.doctorId} className="flex items-center gap-4 p-5 border-2 border-teal-100 rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-200 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-lg shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-teal-900 text-lg">
                          {doctor.doctor?.name || `Doctor #${doctor.doctorId.slice(-6)}`}
                        </div>
                        {doctor.doctor?.email && (
                          <div className="text-sm text-teal-600 mt-1">{doctor.doctor.email}</div>
                        )}
                        {doctor.doctor?.specialty && (
                          <Badge variant="secondary" className="mt-2 text-xs bg-teal-100 text-teal-700 border-teal-200">{doctor.doctor.specialty}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-teal-900">{formatCurrency(doctor.revenue)}</div>
                        <div className="text-sm text-teal-600 mt-1">
                          {doctor.appointments} appointments • {formatCurrency(doctor.avgCharge)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hospitals">
            <Card className="border-teal-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-teal-100">
                <CardTitle className="text-teal-900">Top {filters.topN} Performing Hospitals</CardTitle>
                <CardDescription className="text-teal-700">In-person appointments only</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {data.leaderboards.topHospitals.map((hospital, index) => (
                    <div key={hospital.hospitalId} className="flex items-center gap-4 p-5 border-2 border-emerald-100 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-200 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-md">
                        {index + 1}
                      </div>
                      <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
                        <Building2 className="w-8 h-8 text-emerald-700" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-emerald-900 text-lg">Hospital #{hospital.hospitalId.slice(-6)}</div>
                        <div className="text-sm text-emerald-600 mt-1">{hospital.appointments} appointments</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-emerald-900">{formatCurrency(hospital.revenue)}</div>
                        <div className="text-sm text-emerald-600 mt-1">
                          {formatCurrency(hospital.revenue / hospital.appointments)} per appointment
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* <CHANGE> Enhanced average charge chart with medical theme */}
        <Card className="border-teal-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
            <CardTitle className="text-teal-900">Average Charge Analysis</CardTitle>
            <CardDescription className="text-teal-700">Average charge per appointment by {filters.granularity} period</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis 
                  dataKey={(item) => formatPeriodLabel(item)}
                  tick={{ fontSize: 12, fill: '#0f766e' }}
                />
                <YAxis tick={{ fill: '#0f766e' }} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Avg Charge']}
                  contentStyle={{ backgroundColor: '#f0fdfa', border: '1px solid #5eead4', borderRadius: '8px' }}
                />
                <Bar dataKey="avgCharge" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInsightsDashboard;