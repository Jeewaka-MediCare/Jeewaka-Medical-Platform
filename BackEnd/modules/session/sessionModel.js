import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "available",
    },
    appointmentStatus: {
      type: String,
      default: "upcoming",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },

    // ------------------------new----------------------------
    meetingId: {
      type: String,
      default: null,
    },
    // -------------------------------------------------------

    // Payment-related fields
    paymentIntentId: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number,
      default: null,
    },
    paymentCurrency: {
      type: String,
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: function () {
        return this.type === "in-person";
      },
    },
    // ------------------------new----------------------------
    fee: {
      type: Number,
      default: 0,
    },
    // -------------------------------------------------------

    meetingLink: {
      type: String,
      default: "",
    },

    // ------------------------new----------------------------
    meetingId: {
      type: String,
      default: null,
    },
    // -------------------------------------------------------

    type: {
      type: String,
      required: true,
    },

    timeSlots: [timeSlotSchema],
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
