"use client";

import { useState, useEffect } from "react";
import { Calendar, Search, Filter, Download, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

export default function PaymentsPage() {
  const { user, userRole } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

    return (
      <Dialog open={!!payment} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Payment ID: {payment.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="font-semibold">LKR {(payment.amount / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(payment.status)}
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Doctor</label>
              <p className="font-medium">
                {payment.doctor?.name || payment.doctorName || 'Unknown Doctor'}
                {payment.doctor?.specialization && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({payment.doctor.specialization})
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Appointment</label>
              <p className="font-medium">
                {payment.appointment?.date ? formatDate(payment.appointment.date) : 'N/A'}
                {payment.appointment?.time && ` at ${formatTimeRange(payment.appointment.time)}`}
              </p>
              {payment.appointment?.status && (
                <p className="text-sm text-gray-500">
                  Status: {payment.appointment.status}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Payment Date</label>
              <p>{formatDateTime(payment.date || payment.created)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Currency</label>
              <p className="uppercase">{payment.currency}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-gray-600">Track and manage your medical consultation payments</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">LKR {stats.totalAmount.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by doctor name, payment ID, amount, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No payments found matching your search.' : 'No payments found.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.id.slice(-8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.doctorName || payment.doctor?.name || 'Unknown'}</p>
                        {payment.doctorSpecialization && (
                          <p className="text-sm text-gray-500">{payment.doctorSpecialization}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      LKR {(payment.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(payment.date || payment.created)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
  );
}
