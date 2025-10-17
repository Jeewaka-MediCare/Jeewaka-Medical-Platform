import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { parseISO } from "date-fns";
import api from "../services/api";
import paymentService from "../services/paymentService";

export const useAppointments = (user, userRole) => {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [filteredUpcomingAppointments, setFilteredUpcomingAppointments] =
    useState([]);
  const [filteredPastAppointments, setFilteredPastAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [availableHospitals, setAvailableHospitals] = useState([]);

  // Fetch patient appointments
  const fetchAppointments = async () => {
    if (!user || !user._id) return;

    setAppointmentsLoading(true);
    try {
      console.log("Fetching appointments for patient:", user._id);
      const { data } = await api.get("/api/session");

      // Filter sessions that have appointments for this patient
      const patientSessions = (data || []).filter(
        (session) =>
          session.timeSlots &&
          session.timeSlots.some(
            (slot) => slot.patientId && slot.patientId === user._id
          )
      );

      // Transform session data into individual appointments
      const appointments = [];
      patientSessions.forEach((session) => {
        session.timeSlots.forEach((slot, originalSlotIndex) => {
          if (slot.patientId && slot.patientId === user._id) {
            appointments.push({
              _id: `${session._id}_${slot.startTime}_${slot.endTime}`,
              sessionId: session._id,
              slotIndex: originalSlotIndex,
              date: session.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: slot.status,
              appointmentStatus: slot.appointmentStatus,
              doctor: session.doctorId,
              hospital: session.hospital,
              meetingLink: session.meetingLink,
              type: session.type,
              paymentIntentId: slot.paymentIntentId,
              paymentAmount: slot.paymentAmount,
              paymentCurrency: slot.paymentCurrency,
              paymentDate: slot.paymentDate,
            });
          }
        });
      });

      console.log(
        "Appointments received:",
        appointments.length,
        "appointments"
      );

      // Filter appointments into upcoming and past
      const now = new Date();
      console.log("Current time:", now.toISOString());

      const upcoming = appointments.filter((apt) => {
        try {
          const dateOnly = apt.date.split("T")[0];
          const appointmentEndDate = parseISO(`${dateOnly}T${apt.endTime}`);
          console.log(
            `Appointment: ${dateOnly}T${apt.startTime}-${
              apt.endTime
            } -> End: ${appointmentEndDate.toISOString()}`
          );
          return appointmentEndDate > now;
        } catch (error) {
          console.error(
            "Error parsing appointment date:",
            apt.date,
            apt.endTime,
            error
          );
          return false;
        }
      });

      const past = appointments.filter((apt) => {
        try {
          const dateOnly = apt.date.split("T")[0];
          const appointmentEndDate = parseISO(`${dateOnly}T${apt.endTime}`);
          return appointmentEndDate <= now;
        } catch (error) {
          console.error(
            "Error parsing appointment date:",
            apt.date,
            apt.endTime,
            error
          );
          return false;
        }
      });

      console.log("Total appointments processed:", appointments.length);
      console.log("Upcoming appointments:", upcoming.length);
      console.log("Past appointments:", past.length);

      // Sort upcoming appointments: soonest first
      const sortedUpcoming = upcoming.sort((a, b) => {
        try {
          const dateOnlyA = a.date.split("T")[0];
          const dateOnlyB = b.date.split("T")[0];
          const startDateA = parseISO(`${dateOnlyA}T${a.startTime}`);
          const startDateB = parseISO(`${dateOnlyB}T${b.startTime}`);
          return startDateA.getTime() - startDateB.getTime();
        } catch (error) {
          console.error("Error sorting upcoming appointments:", error);
          return 0;
        }
      });

      // Sort past appointments: most recent first
      const sortedPast = past.sort((a, b) => {
        try {
          const dateOnlyA = a.date.split("T")[0];
          const dateOnlyB = b.date.split("T")[0];
          const endDateA = parseISO(`${dateOnlyA}T${a.endTime}`);
          const endDateB = parseISO(`${dateOnlyB}T${b.endTime}`);
          return endDateB.getTime() - endDateA.getTime();
        } catch (error) {
          console.error("Error sorting past appointments:", error);
          return 0;
        }
      });

      setUpcomingAppointments(sortedUpcoming);
      setPastAppointments(sortedPast);

      // Extract unique hospitals for filter dropdown
      const hospitals = [
        ...new Set(
          appointments
            .filter((apt) => {
              const isInPerson =
                apt.type === "in-person" || (apt.hospital && apt.hospital.name);
              return isInPerson && apt.hospital?.name;
            })
            .map((apt) => apt.hospital.name)
        ),
      ];
      setAvailableHospitals(hospitals);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setAppointmentsLoading(false);
      setRefreshing(false);
    }
  };

  // Filter appointments based on current filters
  const filterAppointments = (appointments, filters) => {
    return appointments.filter((appointment) => {
      // Doctor name filter
      if (filters.doctorName && filters.doctorName.trim()) {
        const doctorName = appointment.doctor?.name?.toLowerCase() || "";
        if (!doctorName.includes(filters.doctorName.toLowerCase())) {
          return false;
        }
      }

      // Hospital name filter
      if (filters.hospitalName && filters.hospitalName.trim()) {
        const hospitalName = appointment.hospital?.name?.toLowerCase() || "";
        if (!hospitalName.includes(filters.hospitalName.toLowerCase())) {
          return false;
        }
      }

      // Appointment type filter
      if (filters.appointmentType) {
        const isInPerson =
          appointment.type === "in-person" ||
          (appointment.hospital && appointment.hospital.name);
        const isVideo =
          appointment.type === "video" ||
          appointment.type === "online" ||
          !appointment.hospital ||
          !appointment.hospital.name;

        if (filters.appointmentType === "in-person" && !isInPerson) {
          return false;
        }
        if (filters.appointmentType === "video" && !isVideo) {
          return false;
        }
      }

      // Date filter
      if (filters.selectedDate) {
        try {
          const appointmentDate = parseISO(appointment.date.split("T")[0]);
          const filterDate = new Date(filters.selectedDate);

          appointmentDate.setHours(0, 0, 0, 0);
          filterDate.setHours(0, 0, 0, 0);

          if (appointmentDate.getTime() !== filterDate.getTime()) {
            return false;
          }
        } catch (error) {
          console.error("Error filtering by date:", error);
          return false;
        }
      }

      // Date range filter
      if (filters.startDate && filters.endDate) {
        try {
          const appointmentDate = parseISO(appointment.date.split("T")[0]);

          const startDate = new Date(filters.startDate);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);

          const normalizedAppointmentDate = new Date(appointmentDate);
          normalizedAppointmentDate.setHours(12, 0, 0, 0);

          if (
            normalizedAppointmentDate < startDate ||
            normalizedAppointmentDate > endDate
          ) {
            return false;
          }
        } catch (error) {
          console.error("Error filtering by date range:", error);
          return false;
        }
      }

      return true;
    });
  };

  // Handle filter changes
  const handleFiltersChange = (filters) => {
    setCurrentFilters(filters);
    setFilteredUpcomingAppointments(
      filterAppointments(upcomingAppointments, filters)
    );
    setFilteredPastAppointments(filterAppointments(pastAppointments, filters));
  };

  // Update filtered appointments when original appointments change
  useEffect(() => {
    setFilteredUpcomingAppointments(
      filterAppointments(upcomingAppointments, currentFilters)
    );
    setFilteredPastAppointments(
      filterAppointments(pastAppointments, currentFilters)
    );
  }, [upcomingAppointments, pastAppointments, currentFilters]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Fetch appointments when user is available
  useEffect(() => {
    if (user && userRole === "patient") {
      fetchAppointments();
    }
  }, [user, userRole]);

  // Helper function to check if appointment is currently ongoing
  const isAppointmentOngoing = (appointment) => {
    try {
      const now = new Date();
      const dateOnly = appointment.date.split("T")[0];
      const appointmentStartDate = parseISO(
        `${dateOnly}T${appointment.startTime}`
      );
      const appointmentEndDate = parseISO(`${dateOnly}T${appointment.endTime}`);

      return now >= appointmentStartDate && now <= appointmentEndDate;
    } catch (error) {
      console.error("Error checking if appointment is ongoing:", error);
      return false;
    }
  };

  // Handle view payment details
  const handleViewPayment = async (appointment) => {
    try {
      setLoadingPaymentId(appointment._id);
      console.log("Loading payment details for appointment:", appointment);

      if (!appointment.paymentIntentId) {
        Alert.alert(
          "No Payment Information",
          "No payment information found for this appointment. The payment may still be processing or this appointment may not require payment."
        );
        return;
      }

      const response = await paymentService.getPaymentDetails(
        appointment.paymentIntentId
      );

      if (response.success && response.payment) {
        console.log("Payment details loaded:", response.payment);
        setSelectedPayment(response.payment);
        setShowPaymentDetails(true);
      } else {
        const paymentFromAppointment = {
          id: appointment.paymentIntentId,
          amount: (appointment.paymentAmount || 0) * 100,
          currency: appointment.paymentCurrency || "lkr",
          status: "succeeded",
          date: appointment.paymentDate,
          created: appointment.paymentDate,
          doctorName: appointment.doctor?.name || "Unknown Doctor",
          doctorSpecialization: appointment.doctor?.specialization || "General",
          appointmentDate: appointment.date,
          appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
          appointmentStatus: appointment.appointmentStatus || "confirmed",
          doctor: {
            name: appointment.doctor?.name || "Unknown Doctor",
            specialization: appointment.doctor?.specialization || "General",
          },
          appointment: {
            date: appointment.date,
            time: `${appointment.startTime} - ${appointment.endTime}`,
            status: appointment.appointmentStatus || "confirmed",
          },
          sessionId: appointment.sessionId,
          slotIndex: appointment.slotIndex,
        };

        console.log(
          "Using payment data from appointment:",
          paymentFromAppointment
        );
        setSelectedPayment(paymentFromAppointment);
        setShowPaymentDetails(true);
      }
    } catch (error) {
      console.error("Error loading payment details:", error);

      if (appointment.paymentIntentId) {
        const paymentFromAppointment = {
          id: appointment.paymentIntentId,
          amount: (appointment.paymentAmount || 0) * 100,
          currency: appointment.paymentCurrency || "lkr",
          status: "succeeded",
          date: appointment.paymentDate,
          created: appointment.paymentDate,
          doctorName: appointment.doctor?.name || "Unknown Doctor",
          doctorSpecialization: appointment.doctor?.specialization || "General",
          appointmentDate: appointment.date,
          appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
          appointmentStatus: appointment.appointmentStatus || "confirmed",
          doctor: {
            name: appointment.doctor?.name || "Unknown Doctor",
            specialization: appointment.doctor?.specialization || "General",
          },
          appointment: {
            date: appointment.date,
            time: `${appointment.startTime} - ${appointment.endTime}`,
            status: appointment.appointmentStatus || "confirmed",
          },
          sessionId: appointment.sessionId,
          slotIndex: appointment.slotIndex,
        };

        console.log(
          "Using fallback payment data from appointment:",
          paymentFromAppointment
        );
        setSelectedPayment(paymentFromAppointment);
        setShowPaymentDetails(true);
      } else {
        Alert.alert(
          "Error",
          error.message ||
            "Failed to load payment information. Please try again."
        );
      }
    } finally {
      setLoadingPaymentId(null);
    }
  };

  return {
    upcomingAppointments,
    pastAppointments,
    filteredUpcomingAppointments,
    filteredPastAppointments,
    appointmentsLoading,
    refreshing,
    selectedPayment,
    showPaymentDetails,
    loadingPaymentId,
    currentFilters,
    availableHospitals,
    fetchAppointments,
    handleFiltersChange,
    onRefresh,
    isAppointmentOngoing,
    handleViewPayment,
    setShowPaymentDetails,
    setSelectedPayment,
  };
};
