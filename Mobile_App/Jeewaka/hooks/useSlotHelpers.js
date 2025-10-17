import { useCallback } from "react";
import { Alert } from "react-native";
import { parseISO } from "date-fns";

export const useSlotHelpers = (
  setSelectedPatient,
  setMedicalRecordsVisible
) => {
  // Helper function to check if slot is currently ongoing
  const isSlotOngoing = useCallback((slot) => {
    if (!slot.isBooked) return false;

    try {
      const now = new Date();
      const dateOnly = slot.sessionDate.split("T")[0];
      const slotStartDate = parseISO(`${dateOnly}T${slot.startTime}`);
      const slotEndDate = parseISO(`${dateOnly}T${slot.endTime}`);

      return now >= slotStartDate && now <= slotEndDate;
    } catch (error) {
      console.error("Error checking if slot is ongoing:", error);
      return false;
    }
  }, []);

  // Helper function to extract patient name from slot data
  const getPatientName = useCallback((slot) => {
    console.log("Getting patient name for slot:", slot);
    console.log("slot.patient:", slot.patient);
    console.log("slot.patientId:", slot.patientId);

    // Try different possible data structures
    if (slot.patient?.name) {
      console.log(
        "Found patient name in slot.patient.name:",
        slot.patient.name
      );
      return slot.patient.name;
    }

    if (slot.patientId?.name) {
      console.log(
        "Found patient name in slot.patientId.name:",
        slot.patientId.name
      );
      return slot.patientId.name;
    }

    if (slot.patientId?.firstName && slot.patientId?.lastName) {
      const fullName = `${slot.patientId.firstName} ${slot.patientId.lastName}`;
      console.log("Found patient name from firstName + lastName:", fullName);
      return fullName;
    }

    if (slot.patientId?.firstName) {
      console.log("Found patient firstName only:", slot.patientId.firstName);
      return slot.patientId.firstName;
    }

    // Log what we actually have for debugging
    console.log("Could not find patient name. Available data:");
    console.log(
      "- slot.patient keys:",
      slot.patient ? Object.keys(slot.patient) : "null"
    );
    console.log(
      "- slot.patientId keys:",
      slot.patientId ? Object.keys(slot.patientId) : "null"
    );
    console.log("- slot.patientId type:", typeof slot.patientId);
    console.log("- slot.patientId value:", slot.patientId);

    return "Unknown";
  }, []);

  // Helper function to check if slot is in the past
  const isSlotPast = useCallback((slot) => {
    try {
      const now = new Date();
      const dateOnly = slot.sessionDate.split("T")[0];
      const slotEndDate = parseISO(`${dateOnly}T${slot.endTime}`);

      return slotEndDate <= now;
    } catch (error) {
      console.error("Error checking if slot is past:", error);
      return false;
    }
  }, []);

  // Handle viewing medical records
  const handleViewMedicalRecords = useCallback(
    async (slot) => {
      if (!slot.patient && !slot.patientId) {
        Alert.alert(
          "Error",
          "No patient information available for this appointment."
        );
        return;
      }

      console.log("Slot data for medical records:", slot);
      console.log("Patient data:", slot.patient);
      console.log("PatientId data:", slot.patientId);

      // Use patient data if available, otherwise use patientId info
      let patientInfo;

      if (slot.patient) {
        patientInfo = {
          _id: slot.patient._id,
          name: slot.patient.name,
          email: slot.patient.email || "No email available",
        };
      } else if (slot.patientId) {
        // Handle different possible structures of patientId
        const patientIdData = slot.patientId;
        const patientName = getPatientName(slot);

        patientInfo = {
          _id:
            typeof patientIdData === "object"
              ? patientIdData._id
              : patientIdData,
          name: patientName,
          email:
            (typeof patientIdData === "object" ? patientIdData.email : null) ||
            "No email available",
        };
      }

      console.log("Final patient info for medical records:", patientInfo);
      console.log("Patient _id type:", typeof patientInfo._id);
      console.log("Patient _id value:", patientInfo._id);
      console.log("Patient _id length:", patientInfo._id?.length);
      console.log(
        "Is valid ObjectId format:",
        /^[0-9a-fA-F]{24}$/.test(patientInfo._id)
      );

      setSelectedPatient(patientInfo);
      setMedicalRecordsVisible(true);
    },
    [getPatientName, setSelectedPatient, setMedicalRecordsVisible]
  );

  return {
    isSlotOngoing,
    getPatientName,
    isSlotPast,
    handleViewMedicalRecords,
  };
};
