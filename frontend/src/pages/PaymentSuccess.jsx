"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import paymentService from "@/services/paymentService"
import useAuthStore from "@/store/authStore"

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [error, setError] = useState(null)
  const [bookingDetails, setBookingDetails] = useState(null)

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent')
        const sessionId = searchParams.get('session_id')
        const slotIndex = searchParams.get('slot_index')
        const patientId = searchParams.get('patient_id')

        if (!paymentIntentId || !sessionId || !slotIndex || !patientId) {
          throw new Error('Missing required payment parameters')
        }

        // Confirm the booking with payment details
        const result = await paymentService.handlePaymentSuccess(
          sessionId,
          paymentIntentId,
          slotIndex,
          patientId
        )

        setBookingDetails(result)
        setStatus('success')
      } catch (error) {
        console.error('Payment confirmation error:', error)
        setError(error.response?.data?.error || error.message || 'Failed to confirm booking')
        setStatus('error')
      }
    }

    handlePaymentSuccess()
  }, [searchParams])

  const handleContinue = () => {
    navigate('/appointments') // Redirect to appointments page
  }

  const { user, userRole } = useAuthStore();

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleReturnHome = () => {
    // Role-aware return: send logged-in users to their dashboards
    if (user && userRole) {
      if (userRole === 'patient') return navigate('/patient-dashboard')
      if (userRole === 'doctor') return navigate('/doctor-dashboard')
      if (userRole === 'admin') return navigate('/admin-dashboard')
    }
    // Fallback: go to root (login) if no authenticated user found
    navigate('/')
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Confirming Your Booking</h2>
                <p className="text-gray-600 mt-2">Please wait while we process your payment...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-900">Payment Error</CardTitle>
            </div>
            <CardDescription>
              There was an issue confirming your booking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleReturnHome} variant="outline" className="flex-1">
                Return Home
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-900">Booking Confirmed!</CardTitle>
          </div>
          <CardDescription>
            Your appointment has been successfully booked and payment processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingDetails && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Appointment Details</h3>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>
                          Session ID: {bookingDetails.session?._id || searchParams.get('session_id')}
                        </p>
                        <p>
                          Payment ID: {bookingDetails.payment?.intentId || searchParams.get('payment_intent')}
                        </p>
                        <p>
                          Status: {bookingDetails.payment?.status || bookingDetails.status || 'unknown'}
                        </p>
                        <p>
                          Time slot: {bookingDetails.slot && bookingDetails.session?.date 
                            ? `${formatDate(bookingDetails.session.date)} at ${bookingDetails.slot.startTime} - ${bookingDetails.slot.endTime}` 
                            : `Index ${searchParams.get('slot_index')}`}
                        </p>
                      </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              You will receive a confirmation email with your appointment details and a calendar invite.
            </AlertDescription>
          </Alert>

          <Button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700">
            View My Appointments
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
