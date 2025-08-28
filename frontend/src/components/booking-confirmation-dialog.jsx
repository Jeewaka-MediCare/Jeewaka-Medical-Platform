"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Video, Users, DollarSign, CreditCard, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import paymentService from "@/services/paymentService"
import useAuthStore from "@/store/authStore"


export function BookingConfirmationDialog({ open, onOpenChange, booking, onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentStep, setPaymentStep] = useState(false) // false = confirmation, true = payment

  const { user, loading } = useAuthStore()

  if (!booking) return null

  const { session, timeSlot, doctor } = booking

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handlePayment = async () => {
    // Check if auth is still loading
    if (loading) {
      setPaymentError('Authentication is loading. Please wait...')
      return
    }

    // Check if user is authenticated
    if (!user) {
      setPaymentError('Please log in to proceed with payment.')
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      console.log('Doctor data:', doctor);
      console.log('Consultation fee:', doctor.consultationFee);
      console.log('Session data:', session);
      console.log('Time slot data:', timeSlot);
      console.log('User data:', user);

      // Validate consultation fee
      const consultationFee = doctor.consultationFee || 100; // Default to $1.00 if not set
      if (isNaN(consultationFee) || consultationFee <= 0) {
        throw new Error('Invalid consultation fee. Please contact support.');
      }

  // Validate user authentication
  // Prefer backend patient _id when available (stored after login merge), fall back to Firebase uid
  const patientId = user?._id || user?.uid || user?.id || 'guest-user';
      if (!patientId || patientId === 'guest-user') {
        throw new Error('Please log in to proceed with payment.');
      }

      // Find the slot index in the session's timeSlots array
      const slotIndex = session.timeSlots ? session.timeSlots.findIndex(slot =>
        slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
      ) : 0;

      console.log('Calculated slotIndex:', slotIndex);

      const paymentData = {
        amount: consultationFee,
        currency: 'usd',
        metadata: {
          sessionId: session._id || session.id, // Use id if _id is not available
          slotIndex: slotIndex,
          patientId: patientId,
          doctorName: doctor.name,
          appointmentDate: `${formatDate(session.date)} at ${timeSlot.startTime} - ${timeSlot.endTime}`
        }
      }

      console.log('Payment data to send:', paymentData);

      const bookingData = {
        slotIndex: timeSlot.index || 0,
        // Use backend patient id if available, otherwise fallback to firebase uid
        patientId: user?._id || user?.uid || user?.id || 'guest-user',
        paymentIntentId: '' // Will be filled after payment
      }

      await paymentService.processPaymentAndBooking(paymentData, bookingData)
      // If successful, Stripe will redirect to success page
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error.response?.data?.error || error.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmBooking = () => {
    setPaymentStep(true)
  }

  const handleBookNow = () => {
    // Check if auth is still loading
    if (loading) {
      setPaymentError('Authentication is loading. Please wait...')
      return
    }

    // Check if user is authenticated
    if (!user) {
      setPaymentError('Please log in to book an appointment.')
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Call onConfirm directly without payment processing
      onConfirm({
        sessionId: session._id,
        slotIndex: timeSlot.index || 0,
        patientId: user?.uid || user?.id || 'guest-user',
        paymentIntentId: null, // No payment for free booking
        isFreeBooking: true
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Booking error:', error)
      setPaymentError(error.message || 'Booking failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToConfirmation = () => {
    setPaymentStep(false)
    setPaymentError(null)
  }

  if (paymentStep) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Complete Payment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Secure payment for your appointment booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Consultation Fee</span>
                <span className="font-bold text-lg text-green-600">${doctor.consultationFee}</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{timeSlot.startTime} - {timeSlot.endTime}</span>
                </div>
              </div>
            </div>

            {/* Payment Error */}
            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {/* Payment Info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Secure Payment via Stripe</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                You'll be redirected to Stripe's secure checkout page to complete your payment.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleBackToConfirmation} disabled={isProcessing}>
              Back
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${doctor.consultationFee}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Confirm Appointment</DialogTitle>
          <DialogDescription className="text-gray-600">
            Please review your appointment details before proceeding to payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Doctor Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <img
              src={doctor.profile || "/placeholder.svg"}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-blue-600">{doctor.specialization}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{formatDate(session.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>
                {timeSlot.startTime} - {timeSlot.endTime}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>
                {session.hospital.name}, {session.hospital.location}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {session.type === "online" ? (
                <Video className="h-4 w-4 text-green-600" />
              ) : (
                <Users className="h-4 w-4 text-blue-600" />
              )}
              <Badge variant={session.type === "online" ? "default" : "secondary"} className="text-xs">
                {session.type === "online" ? "Online Consultation" : "In-Person Visit"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700">Consultation Fee: ${doctor.consultationFee}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBookNow}
            disabled={isProcessing}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Book Now (Free)'
            )}
          </Button>
          <Button onClick={handleConfirmBooking} className="bg-blue-600 hover:bg-blue-700">
            Proceed to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
