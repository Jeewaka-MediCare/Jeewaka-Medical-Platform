import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Building2, Video, MapPin, Award, RefreshCw, Filter } from 'lucide-react';
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
      return <Badge variant="secondary" className="text-xs">New Period</Badge>;
    }
    
    const isPositive = change.deltaPct >= 0;
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {Math.abs(change.deltaPct).toFixed(1)}%
        </span>
      </div>
    );
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Insights</h1>
            <p className="text-gray-500 mt-1">
              {formatDate(data.periodBoundsUTC.from)} - {formatDate(data.periodBoundsUTC.to)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={fetchData}
              disabled={loading}
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

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Granularity</Label>
                  <Select
                    value={filters.granularity}
                    onValueChange={(value) => setFilters({ ...filters, granularity: value })}
                  >
                    <SelectTrigger>
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
                  <Label>Top N</Label>
                  <Select
                    value={filters.topN.toString()}
                    onValueChange={(value) => setFilters({ ...filters, topN: Number(value) })}
                  >
                    <SelectTrigger>
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
                  <Label>From Year</Label>
                  <Select
                    value={filters.fromYear.toString()}
                    onValueChange={(value) => setFilters({ ...filters, fromYear: Number(value) })}
                  >
                    <SelectTrigger>
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
                  <Label>From Month</Label>
                  <Select
                    value={filters.fromMonth.toString()}
                    onValueChange={(value) => setFilters({ ...filters, fromMonth: Number(value) })}
                  >
                    <SelectTrigger>
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
                  <Label>To Year</Label>
                  <Select
                    value={filters.toYear.toString()}
                    onValueChange={(value) => setFilters({ ...filters, toYear: Number(value) })}
                  >
                    <SelectTrigger>
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
                  <Label>To Month</Label>
                  <Select
                    value={filters.toMonth.toString()}
                    onValueChange={(value) => setFilters({ ...filters, toMonth: Number(value) })}
                  >
                    <SelectTrigger>
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

              <div className="flex justify-end mt-4">
                <Button onClick={fetchData} disabled={loading}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current View Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filters.granularity.charAt(0).toUpperCase() + filters.granularity.slice(1)} View
          </Badge>
          <Badge variant="outline" className="text-sm">
            Showing Top {filters.topN}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.revenue)}</div>
              <div className="flex items-center gap-2 mt-2">
                {renderTrendIndicator(data.changeVsPrev.revenue)}
                <span className="text-xs text-gray-500">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
              <Calendar className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.appointments}</div>
              <div className="flex items-center gap-2 mt-2">
                {renderTrendIndicator(data.changeVsPrev.appointments)}
                <span className="text-xs text-gray-500">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Charge</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.avgCharge)}</div>
              <p className="text-xs text-gray-500 mt-2">Per appointment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">All-Time Revenue</CardTitle>
              <Award className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.context.allTime.totalRevenueAllTime)}</div>
              <p className="text-xs text-gray-500 mt-2">{data.context.allTime.totalAppointmentsAllTime} total appointments</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>{filters.granularity.charAt(0).toUpperCase() + filters.granularity.slice(1)} revenue and appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={(item) => formatPeriodLabel(item)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                      if (name === 'appointments') return [value, 'Appointments'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={2} name="Appointments" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Type Mix */}
          <Card>
            <CardHeader>
              <CardTitle>Session Type Distribution</CardTitle>
              <CardDescription>Revenue by appointment type</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.mixByType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {type.type === 'in-person' ? (
                        <MapPin className="w-4 h-4" style={{ color: COLORS[index] }} />
                      ) : (
                        <Video className="w-4 h-4" style={{ color: COLORS[index] }} />
                      )}
                      <span className="capitalize">{type.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(type.revenue)}</div>
                      <div className="text-xs text-gray-500">{type.appointments} appointments</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboards */}
        <Tabs defaultValue="doctors" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="doctors">Top Doctors</TabsTrigger>
            <TabsTrigger value="hospitals">Top Hospitals</TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>Top {filters.topN} Performing Doctors</CardTitle>
                <CardDescription>Ranked by total revenue generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.leaderboards.topDoctors.map((doctor, index) => (
                    <div key={doctor.doctorId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {doctor.doctor?.name || `Doctor #${doctor.doctorId.slice(-6)}`}
                        </div>
                        {doctor.doctor?.email && (
                          <div className="text-sm text-gray-500">{doctor.doctor.email}</div>
                        )}
                        {doctor.doctor?.specialty && (
                          <Badge variant="secondary" className="mt-1 text-xs">{doctor.doctor.specialty}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(doctor.revenue)}</div>
                        <div className="text-sm text-gray-500">
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
            <Card>
              <CardHeader>
                <CardTitle>Top {filters.topN} Performing Hospitals</CardTitle>
                <CardDescription>In-person appointments only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.leaderboards.topHospitals.map((hospital, index) => (
                    <div key={hospital.hospitalId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        {index + 1}
                      </div>
                      <Building2 className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Hospital #{hospital.hospitalId.slice(-6)}</div>
                        <div className="text-sm text-gray-500">{hospital.appointments} appointments</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(hospital.revenue)}</div>
                        <div className="text-sm text-gray-500">
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

        {/* Average Charge by Period */}
        <Card>
          <CardHeader>
            <CardTitle>Average Charge Analysis</CardTitle>
            <CardDescription>Average charge per appointment by {filters.granularity} period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={(item) => formatPeriodLabel(item)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Avg Charge']}
                />
                <Bar dataKey="avgCharge" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInsightsDashboard;