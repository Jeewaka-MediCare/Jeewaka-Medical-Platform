import {removeAdminRole,addAdminRole,getAdminUsers}from "./adminCotroller.js";
import express from "express";

const adminRouter = express.Router();
adminRouter.get("/", getAdminUsers);
adminRouter.post("/add-role", addAdminRole);
adminRouter.post("/remove-role", removeAdminRole);

export default adminRouter;