import { getAdminById ,getAdminByUid , createAdmin ,deleteAdmin , updateAdmin } from "./adminCotroller.js";
import express from "express";
const adminRouter = express.Router();

adminRouter.post("/", createAdmin);
adminRouter.get("/", getAdminById);
adminRouter.get("/uuid/:uuid", getAdminByUid);
adminRouter.put("/:id", updateAdmin);   
adminRouter.delete("/:id", deleteAdmin);

export default adminRouter;