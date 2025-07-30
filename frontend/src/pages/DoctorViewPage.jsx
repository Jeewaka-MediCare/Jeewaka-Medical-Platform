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
import { useLocation } from "react-router-dom";
import api from "../services/api";

export default function DoctorViewPage() {
  console.log(JSON.parse(localStorage.getItem("userData")));
  const [data, setData] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const location = useLocation();
  const passedData = location.state;

  // useEffect(() => {
  //   const user = JSON.parse(localStorage.getItem("userData"));
  //   console.log("Parsed userData:", user); // <- confirm _id is present
  //   setLoggedInUser(user);

  //   if (passedData) {
  //     console.log("passedData", passedData);
  //     setData({
  //       doctor: passedData.doctor,
  //       ratingSummary: passedData.ratingSummary,
  //       sessions: passedData.sessions,
  //       reviews: passedData.ratingSummary?.allRatings || [],
  //     });
  //   }
  // }, [passedData]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userData"));
    console.log("Parsed userData:", user); 
    setLoggedInUser(user);
    const getDoctorData = async () => {
      const res = await api.get(`/api/doctorCard/${passedData.doctor._id}`);
      console.log("docotocard details", res.data);
      setData({
        doctor: res.data.doctor,
        ratingSummary: res.data.ratingSummary,
        sessions: res.data.sessions,
        reviews: res.data.reviews
      });
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
    const user = JSON.parse(localStorage.getItem("userData"));
    console.log("User data:", user);
    const patientId = user._id;
    console.log("patientId", patientId);

    if (loggedInUser) {
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

  const handleSubmitReview = (reviewData) => {
    console.log("Review submitted:", {
      doctor: data.doctor._id,
      patient: "current-patient-id", // This should come from auth context
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
    });

    // Add the new review to local state
    const newReview = {
      rating: reviewData.rating,
      comment: reviewData.comment,
      patient: { name: "You" }, // This should come from auth context
      createdAt: new Date().toISOString(),
    };

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
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  const { doctor, sessions, reviews, ratingSummary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto py-8 px-4">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Doctors
          </Link>
        </div>

        {/* Profile section */}
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 mb-8 backdrop-blur-sm bg-white/95">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Doctor Image */}
            <div className="w-full lg:w-1/4">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src={doctor.profile || "/placeholder.svg"}
                  alt={doctor.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  {doctor.name}
                </h1>
                <p className="text-blue-600 text-xl font-semibold">
                  {doctor.specialization}
                </p>
                <p className="text-gray-600 text-sm">
                  Registration No: {doctor.regNo}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl shadow-lg">
                  <p className="text-2xl font-bold">
                    ${doctor.consultationFee}
                  </p>
                  <p className="text-blue-100 text-sm">Consultation Fee</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 fill-white" />
                    <span className="text-2xl font-bold">
                      {ratingSummary.avgRating || 0}
                    </span>
                  </div>
                  <p className="text-yellow-100 text-sm">
                    {ratingSummary.totalReviews} reviews
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6" />
                    <span className="text-2xl font-bold">
                      {doctor.yearsOfExperience}
                    </span>
                  </div>
                  <p className="text-green-100 text-sm">Years Experience</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">{doctor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">{doctor.email}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
                      Languages
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languagesSpoken?.map((lang) => (
                      <Badge
                        key={lang}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
                      Sub-specializations
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doctor.subSpecializations?.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
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
          <Card className="mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-gray-900">
                About Dr. {doctor.name.split(" ")[1] || doctor.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-lg">
                {doctor.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Sessions & Reviews */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-2 rounded-none">
              <TabsTrigger
                value="sessions"
                className="text-lg py-4 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                Available Sessions
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="text-lg py-4 data-[state=active]:bg-white data-[state=active]:shadow-md"
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
                <div className="grid gap-6">
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
        />
      </main>
    </div>
  );
}
