// routes/finance.routes.js
import { Router } from "express";
import {
  getAllDoctorsMonthlyIncome,

  getDoctorFinancialOverview,
  getDoctorQuickAccountStats,
  getDoctorPayments,
  getAdminBusinessInsights
} from "./financeControllers.js";
// Optional validators
const validateInsightsQuery = (req, res, next) => {
  const { granularity, fromYear, fromMonth, toYear, toMonth, from, to, top } = req.query;
  if (granularity && !["monthly", "quarterly", "yearly"].includes(granularity.toLowerCase())) {
    return res.status(400).json({ ok: false, error: "granularity must be monthly | quarterly | yearly" });
  }
  const haveYM = fromYear && fromMonth && toYear && toMonth;
  const haveISO = from || to;
  if (haveYM && haveISO) {
    return res.status(400).json({ ok: false, error: "Provide either (fromYear,fromMonth,toYear,toMonth) OR (from,to), not both." });
  }
  if (haveYM) {
    const fy = Number(fromYear), fm = Number(fromMonth), ty = Number(toYear), tm = Number(toMonth);
    if ([fy,fm,ty,tm].some(Number.isNaN)) {
      return res.status(400).json({ ok: false, error: "fromYear/fromMonth/toYear/toMonth must be numbers." });
    }
    if (fm < 1 || fm > 12 || tm < 1 || tm > 12) {
      return res.status(400).json({ ok: false, error: "fromMonth/toMonth must be in 1..12." });
    }
  }
  if (haveISO) {
    if (from && isNaN(Date.parse(from))) return res.status(400).json({ ok: false, error: "Invalid 'from' date." });
    if (to && isNaN(Date.parse(to))) return res.status(400).json({ ok: false, error: "Invalid 'to' date." });
  }
  if (top && (isNaN(Number(top)) || Number(top) < 1)) {
    return res.status(400).json({ ok: false, error: "top must be a positive integer" });
  }
  next();
};



const r = Router();

/**
 * ADMIN ROUTES
 * Base path suggestion: /api/admin/finance
 */
r.get("/admin/finance/doctors/monthly", getAllDoctorsMonthlyIncome);


r.get("/admin/finance/insights",validateInsightsQuery, getAdminBusinessInsights);


/**
 * DOCTOR ROUTES (self/individual)
 * Base path suggestion: /api/doctors/:doctorId/finance
 */
r.get("/doctors/:doctorId/finance/overview",getDoctorFinancialOverview);
/**
 * Query params:
 *   - months?: number (default 12, max 60)
 */

r.get("/doctors/:doctorId/finance/quick",getDoctorQuickAccountStats);

r.get("/doctors/:doctorId/finance/payments",  getDoctorPayments);
/**
 * Query params:
 *   - from?: ISO date (e.g., 2025-01-01)
 *   - to?:   ISO date (e.g., 2025-12-31)
 */

export default r;
