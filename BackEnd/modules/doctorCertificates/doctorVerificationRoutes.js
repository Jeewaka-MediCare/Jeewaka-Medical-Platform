import experss from "express";
import { createVerification , updateVerificationStatus , getAllVerifications } from "./doctorVerificationControllers.js";

const adminVerificationRouter = experss.Router();
adminVerificationRouter.post('/', createVerification);
adminVerificationRouter.get('/', getAllVerifications);
adminVerificationRouter.put('/:doctorId', updateVerificationStatus);
export default adminVerificationRouter;

