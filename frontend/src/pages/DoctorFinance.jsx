import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, FileText, Filter, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import api from "../services/api";

function DoctorFinance() {
  const [overview, setOverview] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Query parameters state
  const [months, setMonths] = useState(12);
  const [dateRange, setDateRange] = useState({
    from: "2025-01-01",
    to: "2025-12-31"
  });
  
  const doctorId = "68e274a18e7cf75f167a7f02";

  useEffect(() => {
    fetchFinanceData();
  }, [doctorId, months, dateRange]);

  async function fetchFinanceData() {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch overview with months query parameter
      const resOverview = await api.get(`/api/doctors/${doctorId}/finance/overview`, {
        params: { months }
      });
      setOverview(resOverview.data.data);

      // Fetch quick stats
      const resQuick = await api.get(`/api/doctors/${doctorId}/finance/quick`);
      setQuickStats(resQuick.data.data);

      // Fetch payments with date range query parameters
      const resPayments = await api.get(`/api/doctors/${doctorId}/finance/payments`, {
        params: {
          from: dateRange.from,
          to: dateRange.to
        }
      });
      setPayments(resPayments.data.data);
    } catch (error) {
      console.error("Finance data fetch error:", error);
      setError(error.message || "Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthName = (month) => {
    return new Date(2025, month - 1).toLocaleDateString('en-US', { month: 'short' });
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={fetchFinanceData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financial Dashboard</h1>
            <p className="text-slate-600 mt-1">Overview of your earnings and appointments</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Months selector for overview */}
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
              <option value={36}>Last 36 months</option>
              <option value={60}>Last 60 months</option>
            </select>
            
            <Button 
              variant="outline" 
              onClick={fetchFinanceData}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Date Range Filter for Payments */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Payment Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                onClick={fetchFinanceData}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>This Month Revenue</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {formatCurrency(quickStats?.thisMonthRevenue || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {quickStats?.incomeRatePctVsLastMonth !== null ? (
                  <>
                    {quickStats.incomeRatePctVsLastMonth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={quickStats.incomeRatePctVsLastMonth >= 0 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(quickStats.incomeRatePctVsLastMonth).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">No comparison data</span>
                )}
                <span className="text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Year to Date</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(quickStats?.yearToDateRevenue || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="w-4 h-4" />
                <span>{quickStats?.counts.ytdAppointments || 0} appointments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>This Month Appointments</CardDescription>
              <CardTitle className="text-3xl">
                {quickStats?.counts.thisMonthAppointments || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <span>Active patients</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Average Charge</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(overview?.allTime?.avgChargeAllTime || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4" />
                <span>Per appointment</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over last {months} months</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.monthlySeries?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overview.monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(m) => getMonthName(m)}
                      stroke="#64748b"
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(m) => getMonthName(m)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalRevenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Monthly appointment count</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.monthlySeries?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overview.monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(m) => getMonthName(m)}
                      stroke="#64748b"
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      labelFormatter={(m) => getMonthName(m)}
                    />
                    <Bar dataKey="appointments" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Showing {payments?.length || 0} payments from {dateRange.from} to {dateRange.to}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-700">{formatDate(payment.date)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {payment.startTime} - {payment.endTime}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.sessionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatCurrency(payment.paymentAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {payment.appointmentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {formatDate(payment.paymentDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No payments found for the selected date range
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Time Stats */}
        {overview?.allTime && (
          <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">All Time Performance</CardTitle>
              <CardDescription>Complete career statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(overview.allTime.totalRevenueAllTime || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Appointments</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {overview.allTime.totalAppointmentsAllTime || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Average per Session</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(overview.allTime.avgChargeAllTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DoctorFinance;