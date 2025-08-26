import express from "express";
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientByUuid
} from "./patientController.js";

const patientRouter = express.Router();

patientRouter.post("/", createPatient);

patientRouter.get("/:id", getPatient);
patientRouter.get("/uuid/:uuid", getPatientByUuid); // Optional
patientRouter.put("/:id", updatePatient);
patientRouter.delete("/:id", deletePatient); // Optional

export default patientRouter;
