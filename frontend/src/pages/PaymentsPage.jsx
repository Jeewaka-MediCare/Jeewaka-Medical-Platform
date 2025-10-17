"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Search, Filter, Download, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import useAuthStore from "../store/authStore";
import paymentService from "../services/paymentService";
import pdfExportService from "../services/pdfExportService";

export default function PaymentsPage() {
  const { user, userRole } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });

  // Fetch payment history
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await paymentService.getPaymentHistory();
        console.log('💰 Payment response:', response);
        
        if (response.success) {
          const paymentsData = response.payments || [];
          setPayments(paymentsData);
          setFilteredPayments(paymentsData);
          
          // Calculate stats
          const newStats = {
            total: paymentsData.length,
            successful: paymentsData.filter(p => p.status === 'succeeded').length,
            pending: paymentsData.filter(p => p.status === 'pending').length,
            failed: paymentsData.filter(p => p.status === 'failed').length,
            totalAmount: paymentsData.reduce((sum, p) => sum + (p.amount / 100), 0)
          };
          setStats(newStats);
        } else {
          setError(response.error || 'Failed to fetch payments');
        }
      } catch (err) {
        console.error('❌ Error fetching payments:', err);
        setError('Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPayments();
    }
  }, [user]);

  // Filter payments based on search and status
  useEffect(() => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(payment => {
        const doctorMatch = payment.doctorName?.toLowerCase().includes(searchLower);
        const paymentIdMatch = payment.id?.toLowerCase().includes(searchLower);
        const amountMatch = (payment.amount / 100).toString().includes(searchLower);
        const statusMatch = payment.status?.toLowerCase().includes(searchLower);
        return doctorMatch || paymentIdMatch || amountMatch || statusMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => 
        payment.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  // Export payments to PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const result = await pdfExportService.exportPaymentsPDF(
        filteredPayments,
        stats,
        user,
        {
          searchTerm,
          statusFilter
        }
      );

      if (result.success) {
        console.log('✅ PDF exported successfully:', result.filename);
        // You could show a toast notification here
      } else {
        console.error('❌ PDF export failed:', result.message);
        alert('Failed to export PDF: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return 'N/A';
    }
  };

  const formatTimeRange = (timeRange) => {
    if (!timeRange) return 'N/A';
    
    try {
      // Split the time range (e.g., "19:00 - 19:30")
      const [startTime, endTime] = timeRange.split(' - ');
      
      // Function to convert 24-hour to 12-hour format
      const convertTo12Hour = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
        return `${hour12}:${minutes} ${ampm}`;
      };
      
      return `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`;
    } catch (error) {
      console.error('Time formatting error:', error);
      return timeRange; // Return original if formatting fails
    }
  };

  const PaymentDetailsModal = ({ payment, onClose }) => {
    if (!payment) return null;

    const handleExportSinglePayment = async () => {
      try {
        const result = await pdfExportService.exportPaymentDetailsPDF(payment, user);
        if (result.success) {
          console.log('✅ Payment receipt exported:', result.filename);
        } else {
          console.error('❌ Receipt export failed:', result.message);
          alert('Failed to export receipt: ' + result.message);
        }
      } catch (error) {
        console.error('❌ Export error:', error);
        alert('Failed to export receipt. Please try again.');
      }
    };

    return (
      <Dialog open={!!payment} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[500px] bg-white border-teal-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                Payment Details
              </span>
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Payment ID: <span className="font-mono text-teal-700">{payment.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <label className="text-sm font-semibold text-teal-700 mb-1 block">Amount</label>
                <p className="text-2xl font-bold text-teal-900">LKR {(payment.amount / 100).toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <label className="text-sm font-semibold text-teal-700 mb-2 block">Status</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(payment.status)}
                  <Badge className={`${getStatusColor(payment.status)} font-semibold`}>
                    {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-600" />
                Doctor Information
              </label>
              <p className="font-semibold text-gray-900 text-lg">
                {payment.doctor?.name || payment.doctorName || 'Unknown Doctor'}
              </p>
              {payment.doctor?.specialization && (
                <p className="text-sm text-gray-600 mt-1">
                  {payment.doctor.specialization}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                Appointment Details
              </label>
              <p className="font-semibold text-gray-900">
                {payment.appointment?.date ? formatDate(payment.appointment.date) : 'N/A'}
                {payment.appointment?.time && (
                  <span className="text-teal-700 ml-2">
                    {formatTimeRange(payment.appointment.time)}
                  </span>
                )}
              </p>
              {payment.appointment?.status && (
                <p className="text-sm text-gray-600 mt-1">
                  Status: <span className="font-medium">{payment.appointment.status}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600" />
                  Payment Date
                </label>
                <p className="text-gray-900 font-medium">{formatDateTime(payment.date || payment.created)}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  Currency
                </label>
                <p className="text-gray-900 font-bold text-lg">LKR</p>
              </div>
            </div>
          </div>

          {/* Export Receipt Button */}
          <div className="flex justify-end pt-4 border-t border-teal-100">
            <Button
              onClick={handleExportSinglePayment}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 animate-pulse shadow-lg">
                <CreditCard className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Loading payment history...</h2>
              <p className="text-gray-600">Please wait while we fetch your transactions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Payments</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            to="/patient-dashboard" 
            className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                Payment History
              </h1>
              <p className="text-gray-600 mt-1">Track and manage your medical consultation payments</p>
            </div>
          </div>
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting || filteredPayments.length === 0}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-teal-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Total Payments</p>
                  <p className="text-3xl font-bold text-teal-700">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-emerald-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-green-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Successful</p>
                  <p className="text-3xl font-bold text-emerald-700">{stats.successful}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-md">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-teal-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-teal-700">LKR {stats.totalAmount.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="border-teal-100 bg-white/80 backdrop-blur-sm shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600 h-5 w-5" />
                  <Input
                    placeholder="Search by doctor name, payment ID, amount, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 border-teal-200 focus:border-teal-500 focus:ring-teal-500 text-base"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="succeeded">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Table */}
        <Card className="border-teal-100 bg-white/80 backdrop-blur-sm shadow-md">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
            <CardTitle className="text-2xl text-teal-800">Recent Payments</CardTitle>
            <CardDescription className="text-base text-teal-700">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-50 mb-4">
                  <CreditCard className="h-10 w-10 text-teal-400" />
                </div>
                <p className="text-gray-600 font-medium text-lg">
                  {searchTerm ? 'No payments found matching your search.' : 'No payments found.'}
                </p>
                <p className="text-gray-500 mt-2">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-700">Payment ID</TableHead>
                      <TableHead className="font-bold text-gray-700">Doctor</TableHead>
                      <TableHead className="font-bold text-gray-700">Amount</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Date</TableHead>
                      <TableHead className="font-bold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-teal-50/50 transition-colors">
                        <TableCell className="font-mono text-sm text-teal-700 font-medium">
                          {payment.id.slice(-8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.doctorName || payment.doctor?.name || 'Unknown'}</p>
                            {payment.doctorSpecialization && (
                              <p className="text-sm text-gray-600">{payment.doctorSpecialization}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-teal-700 text-base">
                          LKR {(payment.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <Badge className={`${getStatusColor(payment.status)} font-semibold`}>
                              {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">
                          {formatDate(payment.date || payment.created)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400 font-medium"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Modal */}
        {selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </div>
    </div>
  );
}