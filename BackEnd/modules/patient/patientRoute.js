import express from "express";
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientByUuid,
  getAllPatients,
  getPatientAppointments
} from "./patientController.js";

const patientRouter = express.Router();

patientRouter.get("/", getAllPatients);
patientRouter.get("/:patientId/appointments", getPatientAppointments);

patientRouter.post("/", createPatient);

patientRouter.get("/:id", getPatient);
patientRouter.get("/uuid/:uuid", getPatientByUuid); // Optional
patientRouter.put("/:id", updatePatient);
patientRouter.delete("/:id", deletePatient); // Optional

export default patientRouter;
