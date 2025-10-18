"use client";

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Star,
  GraduationCap,
  Languages,
  Clock,
  Award,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionItem } from "@/components/session-item";
import { ReviewItem } from "@/components/review-item";
import { BookingConfirmationDialog } from "@/components/booking-confirmation-dialog";
import { WriteReviewDialog } from "@/components/write-review-dialog";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/authStore";

export default function DoctorViewPage() {
  // Use Zustand auth store instead of localStorage
  const { user, userRole } = useAuthStore();
  console.log('🔐 DoctorViewPage - Component rendered');
  console.log('🔐 DoctorViewPage - authStore state:', { user: user?._id, userRole });

  const [data, setData] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const passedData = location.state;

  useEffect(() => {
    console.log('🔐 DoctorViewPage - useEffect triggered');
    console.log('🔐 DoctorViewPage - authStore user data:', { 
      userId: user?._id, 
      userName: user?.name, 
      userRole 
    });

    const doctorIdFromState = passedData && passedData.doctor && passedData.doctor._id;
    const doctorId = doctorIdFromState || params.id;
    console.log('🔐 DoctorViewPage - Determined doctorId:', doctorId);

    if (!doctorId) {
      console.error('🔐 DoctorViewPage - No doctor id provided via state or route param');
      // Navigate back to doctors list or show an error page
      navigate('/patient-dashboard');
      return;
    }

    const getDoctorData = async () => {
      try {
        const res = await api.get(`/api/doctorCard/${doctorId}`);
        console.log("docotocard details", res.data);
        setData({
          doctor: res.data.doctor,
          ratingSummary: res.data.ratingSummary,
          sessions: res.data.sessions,
          reviews: res.data.reviews
        });
      } catch (err) {
        console.error('🔐 DoctorViewPage - Error fetching doctor data:', err);
        navigate('/patient-dashboard');
      }
    };
    getDoctorData();
  }, []);

  const handleTimeSlotSelect = (
    sessionId,
    timeSlotIndex,
    timeSlot,
    session
  ) => {
    setSelectedBooking({
      sessionId,
      timeSlotIndex,
      timeSlot,
      session,
      doctor: data.doctor,
    });
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    const { sessionId, timeSlotIndex, timeSlot } = selectedBooking;

    console.log('🔐 DoctorViewPage - Booking attempt - authStore state:', {
      userId: user?._id,
      userRole: userRole
    });

    console.log("🔐 DoctorViewPage - User data for booking:", user);
    const patientId = user._id;
    console.log("🔐 DoctorViewPage - patientId for booking:", patientId);

    if (user) {
      const payload = {
        patientId: patientId,
        status: "booked",
        appointmentStatus: "upcoming",
      };

      console.log("payload", payload);
      const res = await api.put(
        `/api/session/${sessionId}/timeslot/${timeSlotIndex}`,
        payload
      );
      if (res.data.success) {
        alert(res.data.message);
        // Update the local state to reflect the booking
        setData((prevData) => ({
          ...prevData,
          sessions: prevData.sessions.map((session) => {
            if (session._id === sessionId) {
              const updatedTimeSlots = [...session.timeSlots];
              updatedTimeSlots[timeSlotIndex] = {
                ...updatedTimeSlots[timeSlotIndex],
                status: "booked",
                appointmentStatus: "booked",
              };
              return {
                ...session,
                timeSlots: updatedTimeSlots,
              };
            }
            return session;
          }),
        }));
        setShowBookingDialog(false);
        setSelectedBooking(null);
      }
    } else {
      console.log("error");
    }

    console.log("Time Slot ID:", `${sessionId}-${timeSlotIndex}`);
    console.log("Session ID:", sessionId);
    console.log("Appointment Status:", "booked");
  };

  const handleSubmitReview = async(reviewData) => {
    try{
    setLoading(true);

    const  review_object = {
      doctor: data.doctor._id,
      patient: user._id, // This should come from auth context
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
    }
    console.log("review_object",review_object);
    //todo: please add zuzstang login user id for current patient id
    

    const res = await api.post('/api/rating', review_object);
    if(res.data.succuess){
      setLoading(false);
      const newReview = res.data.review;
      setData((prevData) => ({
      ...prevData,
      reviews: [newReview, ...prevData.reviews],
      ratingSummary: {
        ...prevData.ratingSummary,
        totalReviews: prevData.ratingSummary.totalReviews + 1,
        avgRating:
          (prevData.ratingSummary.avgRating *
            prevData.ratingSummary.totalReviews +
            reviewData.rating) /
          (prevData.ratingSummary.totalReviews + 1),
      },
    }));

    setShowReviewDialog(false);
    }else{
      setLoading(false);
      alert("Failed to submit review. Please try again.");
    }
    }catch(error){
      setLoading(false);
      console.error("Error submitting review:", error);
      alert("An error occurred while submitting your review. Please try again.");
    }
    

    

    
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  const { doctor, sessions, reviews, ratingSummary } = data;

  return (
    <div className="min-h-screen bg-background">
  <main className="container mx-auto py-8 px-6 max-w-6xl">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center text-primary hover:opacity-90 font-medium transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Doctors
          </Link>
        </div>

        {/* Profile section */}
  <div className="bg-card/95 rounded-md shadow-md border-0 p-8 mb-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Doctor Image */}
            <div className="w-full lg:w-1/4">
              <div className="relative aspect-square rounded-md overflow-hidden shadow-md border-2 border-border">
                <img
                  src={doctor.profile || "/placeholder.svg"}
                  alt={doctor.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {doctor.name}
                </h1>
                <p className="text-primary text-lg font-semibold">
                  {doctor.specialization}
                </p>
                <p className="text-muted-foreground text-sm">
                  Registration No: {doctor.regNo}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary text-primary-foreground px-6 py-4 rounded-md shadow">
                  <p className="text-xl font-semibold">LKR {doctor.consultationFee}</p>
                  <p className="text-primary-foreground text-sm">Consultation Fee</p>
                </div>
                <div className="bg-accent text-accent-foreground px-6 py-4 rounded-md shadow">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <span className="text-xl font-semibold">{ratingSummary.avgRating || 0}</span>
                  </div>
                  <p className="text-accent-foreground text-sm">{ratingSummary.totalReviews} reviews</p>
                </div>
                <div className="bg-secondary text-secondary-foreground px-6 py-4 rounded-md shadow">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-xl font-semibold">{doctor.yearsOfExperience}</span>
                  </div>
                  <p className="text-secondary-foreground text-sm">Years Experience</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-muted rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{doctor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{doctor.email}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
          <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
                      Languages
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languagesSpoken?.map((lang) => (
                      <Badge
                        key={lang}
            variant="secondary"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
                      Sub-specializations
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doctor.subSpecializations?.map((s) => (
                      <Badge
                        key={s}
            variant="secondary"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
                      Qualifications
                    </span>
                  </div>
                  <div className="space-y-1">
                    {doctor.qualifications?.map((q, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
            className="block w-fit"
                      >
                        {q}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Bio */}
        {doctor.bio && (
          <Card className="mb-6 shadow-sm border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-foreground">
                About Dr. {doctor.name.split(" ")[1] || doctor.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-base">
                {doctor.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Sessions & Reviews */}
        <div className="bg-card/95 backdrop-blur-sm rounded-md shadow-md border-0 overflow-hidden">
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-2 rounded-none">
              <TabsTrigger
                value="sessions"
                className="text-base py-3 data-[state=active]:bg-card data-[state=active]:shadow"
              >
                Available Sessions
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="text-base py-3 data-[state=active]:bg-card data-[state=active]:shadow"
              >
                Patient Reviews
              </TabsTrigger>
            </TabsList>

            {/* Sessions */}
            <TabsContent value="sessions" className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upcoming Sessions
                </h2>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  View All Sessions
                </Button>
              </div>
              {sessions && sessions.length > 0 ? (
                <div className="p-4 md:p-6 space-y-4">
                  {sessions.map((session) => (
                    <SessionItem
                      key={session._id}
                      session={session}
                      onTimeSlotSelect={handleTimeSlotSelect}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Clock className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="text-xl text-gray-500">
                      No sessions available at the moment
                    </p>
                    <p className="text-gray-400 mt-2">
                      Please check back later for new appointments
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Patient Reviews
                </h2>
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg"
                >
                  Write a Review
                </Button>
              </div>
              {reviews && reviews.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.map((review, i) => (
                    <ReviewItem key={i} review={review} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Star className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="text-xl text-gray-500">No reviews yet</p>
                    <p className="text-gray-400 mt-2">
                      Be the first to share your experience
                    </p>
                    <Button
                      onClick={() => setShowReviewDialog(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Write the First Review
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <BookingConfirmationDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          booking={selectedBooking}
          onConfirm={handleConfirmBooking}
        />

        <WriteReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          doctor={doctor}
          onSubmit={handleSubmitReview}
          loading={loading}
        />
      </main>
    </div>
  );
}
