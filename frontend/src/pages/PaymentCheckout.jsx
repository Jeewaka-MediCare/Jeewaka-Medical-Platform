"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import paymentService from "@/services/paymentService"

// We'll resolve the stripe promise at runtime and handle failures gracefully

function CheckoutForm({ paymentData, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage('')

    try {
      // Ensure the PaymentElement is mounted. Sometimes Elements and elements exist
      // but the PaymentElement iframe hasn't fully mounted, causing confirmPayment to fail.
      const getPaymentElement = () => elements.getElement(PaymentElement)

      if (!getPaymentElement()) {
        // Retry briefly for transient mount timing issues
        let retries = 0
        const maxRetries = 10
        while (!getPaymentElement() && retries < maxRetries) {
          await new Promise(r => setTimeout(r, 100))
          retries++
        }
      }

      const paymentElementMounted = getPaymentElement()
      if (!paymentElementMounted) {
        const err = new Error('Payment form not ready. Please try again.')
        setMessage(err.message)
        onError(err)
        setIsProcessing(false)
        return
      }

      const returnUrl = `${window.location.origin}/payment-success?session_id=${paymentData.sessionId}&payment_intent=${paymentData.paymentIntentId}&slot_index=${paymentData.slotIndex}&patient_id=${paymentData.patientId}`;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      })

      if (result.error) {
        // Handle unexpected state where the PaymentIntent was processed server-side
        const err = result.error;
        console.warn('Stripe confirmPayment returned error:', err);

        if (err.type === 'invalid_request_error' && err.code === 'payment_intent_unexpected_state') {
          // Attempt to retrieve the PaymentIntent status using the client secret
          try {
            const retrieved = await stripe.retrievePaymentIntent(paymentData.clientSecret);
            const pi = retrieved && (retrieved.paymentIntent || retrieved.payment_intent || retrieved.intent || retrieved);
            console.log('Retrieved payment intent after unexpected_state:', pi);
            if (pi && (pi.status === 'succeeded' || pi.status === 'requires_capture')) {
              setMessage('Payment already processed. Confirming booking...');
              console.log('CheckoutForm - payment intent already succeeded, forcing navigation to returnUrl to complete booking', returnUrl, pi);
              // Ensure the booking confirmation flow runs (Stripe may not redirect in this error state).
              try {
                // Remove local payment session and navigate to the payment success page which performs booking confirmation.
                sessionStorage.removeItem('paymentSession');
                window.location.href = returnUrl;
                // Call onSuccess for any additional handling
                onSuccess({ paymentIntent: pi });
                return;
              } catch (navErr) {
                console.error('Error navigating to returnUrl after retrieving succeeded PaymentIntent:', navErr);
              }
            } else if (pi && pi.status === 'processing') {
              setMessage('Payment is still processing. Please wait a moment and check your appointments.');
              onError(err);
            } else {
              setMessage(err.message || 'Payment processing error.');
              onError(err);
            }
          } catch (retrieveErr) {
            console.error('Error retrieving payment intent after unexpected state:', retrieveErr);
            setMessage(err.message || 'A processing error occurred.');
            onError(err);
          }
        } else {
          setMessage(err.message)
          onError(err)
        }
      } else {
        setMessage('Payment succeeded!')
        onSuccess(result)
      }
    } catch (error) {
      setMessage('An unexpected error occurred.')
      onError(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs'
        }}
      />

      {message && (
        <Alert variant={message.includes('succeeded') ? 'default' : 'destructive'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay LKR {paymentData.amount}
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentCheckout() {
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stripeInstance, setStripeInstance] = useState(null)
  const [stripeInitError, setStripeInitError] = useState(null)

  useEffect(() => {
    // Retrieve payment session data
    const sessionData = sessionStorage.getItem('paymentSession')
    if (!sessionData) {
      setError('No payment session found. Please start the booking process again.')
      setLoading(false)
      return
    }

    try {
      const data = JSON.parse(sessionData)
      setPaymentData(data)
      setLoading(false)
    } catch (err) {
      setError('Invalid payment session data.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Resolve the stripe promise and handle any load errors
    let mounted = true
    const initStripe = async () => {
      try {
        const stripe = await paymentService.getStripe()
        if (!mounted) return
        if (!stripe) {
          console.error('Stripe initialization returned null - check publishable key')
          setStripeInitError('Stripe failed to initialize. Check your publishable key and network.')
          return
        }
        setStripeInstance(stripe)
      } catch (err) {
        console.error('Error initializing Stripe:', err)
        setStripeInitError('Stripe failed to initialize. Check console for details.')
      }
    }

    initStripe()
    return () => { mounted = false }
  }, [])

  const handlePaymentSuccess = (result) => {
    // Clear payment session data
    sessionStorage.removeItem('paymentSession')
    // Redirect will be handled by Stripe's return_url
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
  }

  const handleBack = () => {
    sessionStorage.removeItem('paymentSession')
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Loading Payment</h2>
                <p className="text-gray-600 mt-2">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-900">Payment Error</CardTitle>
            <CardDescription>
              {error || 'Unable to load payment information.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const options = paymentData?.clientSecret ? {
    clientSecret: paymentData.clientSecret,
    appearance: { theme: 'stripe' }
  } : null

  if (stripeInitError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-900">Payment Error</CardTitle>
            <CardDescription>
              {stripeInitError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl text-gray-900">Complete Payment</CardTitle>
          </div>
          <CardDescription>
            Secure payment for your medical consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Appointment Summary</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Doctor:</span>
                <span className="font-medium">{paymentData.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span>Appointment:</span>
                <span>{paymentData.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-bold text-lg">LKR {paymentData.amount}</span>
              </div>
            </div>
          </div>

          {/* Stripe Elements Form - only render when stripe is initialized and we have a clientSecret */}
          {(!options || !paymentData.clientSecret) ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertDescription>
                  Unable to load payment form: missing payment configuration. Please start the booking flow again.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            stripeInstance ? (
              <Elements stripe={stripeInstance} options={options}>
                <CheckoutForm
                  paymentData={paymentData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            ) : (
              <div className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-3 text-sm text-gray-600">Initializing payment provider...</p>
              </div>
            )
          )}

          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
