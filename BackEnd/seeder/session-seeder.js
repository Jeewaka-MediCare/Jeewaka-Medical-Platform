import "dotenv/config";
import { connectDB } from "../shared/database.js";
import Session from "../modules/session/sessionModel.js";
import { v4 as uuidv4 } from "uuid";

// --- Doctor ID ---
const doctorId = "68e274a18e7cf75f167a7f02";

// --- Hospital IDs ---
const hospitalIds = [
  "687d15b966f108143c4e0750",
  "687d15c666f108143c4e0752",
  "687d15e866f108143c4e0754"
];

// --- Patient IDs ---
const patientIds = [
  "687c898e5b9997e7b8128e33",
  "6889928b891731fb0df4815a",
  "68a02441f31a201b3060ef66",
  "68a02999b6c0f1d633b1d945",
  "68a0332c85d006b25b054264",
  "68add19d1b7f5c084928b563",
  "68af5da6cb921f595de9a783",
];

// --- Helper to create booked time slots ---
const createBookedSlot = (start, end, patientId) => ({
  startTime: start,
  endTime: end,
  status: "booked",
  appointmentStatus: "upcoming",
  patientId,
  meetingId: `meet_${uuidv4().slice(0, 8)}`,
  paymentIntentId: `pi_${uuidv4().slice(0, 10)}`,
  paymentAmount: 2500,
  paymentCurrency: "LKR",
  paymentDate: new Date(),
});

// --- Sample session documents ---
const sessionDocs = [
  {
    doctorId,
    date: new Date("2025-10-12"),
    type: "in-person",
    hospital: hospitalIds[0],
    meetingLink: "",
    meetingId: null,
    timeSlots: [
      createBookedSlot("09:00", "09:15", patientIds[0]),
      createBookedSlot("09:15", "09:30", patientIds[1]),
      createBookedSlot("09:30", "09:45", patientIds[2]),
    ],
  },
  {
    doctorId,
    date: new Date("2025-10-13"),
    type: "in-person",
    hospital: hospitalIds[1],
    meetingLink: "",
    meetingId: null,
    timeSlots: [
      createBookedSlot("10:00", "10:15", patientIds[3]),
      createBookedSlot("10:15", "10:30", patientIds[4]),
      createBookedSlot("10:30", "10:45", patientIds[5]),
    ],
  },
  {
    doctorId,
    date: new Date("2025-10-14"),
    type: "in-person",
    hospital: hospitalIds[2],
    meetingLink: "",
    meetingId: null,
    timeSlots: [
      createBookedSlot("11:00", "11:15", patientIds[6]),
      createBookedSlot("11:15", "11:30", patientIds[0]),
      createBookedSlot("11:30", "11:45", patientIds[1]),
    ],
  },
];

// --- Seeder Execution ---
const seedSessions = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to DB");

    await Session.deleteMany();
    console.log("🧹 Cleared previous sessions for the doctor");

    await Session.insertMany(sessionDocs);
    console.log(`✅ Inserted ${sessionDocs.length} sessions with booked time slots`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Session seeding failed:", error);
    process.exit(1);
  }
};

seedSessions();
