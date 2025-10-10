// controllers/finance.controller.js
import mongoose from "mongoose";
import Session from "../session/sessionModel.js";// adjust the path
// If you have a Doctor model and want doctor meta in admin views:
import Doctor from "../doctor/doctorModel.js";// optional (for $lookup)

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/** Utility: month boundaries (UTC; MongoDB stores Date in UTC) */
function monthBoundaries(date = new Date()) {
  const startOfThisMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const startOfNextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  const startOfLastMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const endOfLastMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)); // exclusive
  return { startOfThisMonth, startOfNextMonth, startOfLastMonth, endOfLastMonth };
}

/** Base match for paid/completed time slots */
function paidSlotMatch(extra = {}) {
  return {
    ...extra,
    "timeSlots.paymentAmount": { $ne: null },
    "timeSlots.paymentDate": { $ne: null },
    // If you want to ensure only completed/attended are counted, uncomment:
    // "timeSlots.appointmentStatus": "completed",
    // "timeSlots.status": "booked",
  };
}

/**
 * ADMIN: Monthly income per doctor (optionally filter by year)
 * GET /admin/finance/doctors/monthly?year=2025
 */
export const getAllDoctorsMonthlyIncome = async (req, res, next) => {
  try {
    const yearFilter = req.query.year ? Number(req.query.year) : null;

    const pipeline = [
      { $unwind: "$timeSlots" },
      { $match: paidSlotMatch() },
      ...(yearFilter
        ? [
            {
              $match: {
                $expr: { $eq: [{ $year: "$timeSlots.paymentDate" }, yearFilter] },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: {
            doctorId: "$doctorId",
            year: { $year: "$timeSlots.paymentDate" },
            month: { $month: "$timeSlots.paymentDate" },
          },
          totalRevenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
          avgCharge: { $avg: "$timeSlots.paymentAmount" },
        },
      },
      {
        $group: {
          _id: "$_id.doctorId",
          months: {
            $push: {
              year: "$_id.year",
              month: "$_id.month",
              totalRevenue: "$totalRevenue",
              appointments: "$appointments",
              avgCharge: "$avgCharge",
            },
          },
          totalRevenueAllTime: { $sum: "$totalRevenue" },
          totalAppointmentsAllTime: { $sum: "$appointments" },
        },
      },
      // OPTIONAL: enrich with doctor meta (name, specialty)
      {
        $lookup: {
          from: Doctor.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          doctorId: "$_id",
          _id: 0,
          doctor: { _id: 1, name: 1, email: 1, specialty: 1 },
          totalRevenueAllTime: 1,
          totalAppointmentsAllTime: 1,
          months: 1,
        },
      },
      // sort by total revenue (desc) or name — pick one:
      { $sort: { totalRevenueAllTime: -1 } },
    ];

    const data = await Session.aggregate(pipeline);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN: Overall revenue summary (all doctors) + month-over-month
 * GET /admin/finance/summary
 */
/**
 * ADMIN: Overall revenue summary (all doctors)
 * Supports flexible date range:
 *   A) ?fromYear=2024&fromMonth=3&toYear=2025&toMonth=8
 *   B) ?from=2024-03-01&to=2025-08-31  (ISO)
 * If no range provided, falls back to: allTime + lastMonth + thisMonth + MoM
 *
 * GET /admin/finance/summary[?fromYear=&fromMonth=&toYear=&toMonth=]
 * GET /admin/finance/summary[?from=&to=]
 */
// controllers/finance.controller.js (append below your current exports)

/**
 * ADMIN: Business insights for decision-making
 * KPIs + trend series with monthly/quarterly/yearly granularity and flexible date range.
 *
 * GET /admin/finance/insights
 * Query:
 *   - granularity?: "monthly" | "quarterly" | "yearly" (default: "monthly")
 *   - fromYear, fromMonth, toYear, toMonth   (1..12)  // OR
 *   - from, to  (ISO dates; e.g., 2024-03-01 & 2025-08-31)
 *   - top?: number  (limit for leaderboards; default: 5)
 */
export const getAdminBusinessInsights = async (req, res, next) => {
  try {
    const granularity = (req.query.granularity || "monthly").toLowerCase();
    const topN = Math.max(1, Math.min(Number(req.query.top) || 5, 25));

    // ---------- Range parsing (same conventions as summary) ----------
    const parseYearMonthRange = (q) => {
      const fy = q.fromYear ? Number(q.fromYear) : null;
      const fm = q.fromMonth ? Number(q.fromMonth) : null; // 1..12
      const ty = q.toYear ? Number(q.toYear) : null;
      const tm = q.toMonth ? Number(q.toMonth) : null;     // 1..12
      if (fy && fm && ty && tm) {
        const from = new Date(Date.UTC(fy, fm - 1, 1, 0, 0, 0, 0));
        const to = new Date(Date.UTC(ty, tm, 1, 0, 0, 0, 0)); // exclusive
        return { from, to };
      }
      return null;
    };

    const parseIsoRange = (q) => {
      if (!q.from && !q.to) return null;
      const from = q.from ? new Date(q.from) : new Date("1970-01-01T00:00:00Z");
      let to = q.to ? new Date(q.to) : new Date(Date.now() + 365 * 24 * 3600 * 1000);
      if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
        to = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1, 0, 0, 0, 0));
      }
      return { from, to };
    };

    const range = parseYearMonthRange(req.query) || parseIsoRange(req.query) || (() => {
      // Default: current calendar year to date
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
      return { from, to };
    })();

    const { from, to } = range;

    // ---------- Base pipeline pieces ----------
    const basePaid = [
      { $unwind: "$timeSlots" },
      {
        $match: {
          "timeSlots.paymentAmount": { $ne: null },
          "timeSlots.paymentDate": { $ne: null, $gte: from, $lt: to },
        },
      },
    ];

    // ---------- Summary for selected range ----------
    const [rangeSummary] = await Session.aggregate([
      ...basePaid,
      {
        $group: {
          _id: null,
          revenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
          avgCharge: { $avg: "$timeSlots.paymentAmount" },
        },
      },
    ]);

    // ---------- Previous (comparable) period for growth % ----------
    const durationMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - durationMs);
    const prevTo = new Date(from.getTime());

    const [prevSummary] = await Session.aggregate([
      { $unwind: "$timeSlots" },
      {
        $match: {
          "timeSlots.paymentAmount": { $ne: null },
          "timeSlots.paymentDate": { $ne: null, $gte: prevFrom, $lt: prevTo },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
        },
      },
    ]);

    const rev = rangeSummary?.revenue || 0;
    const revPrev = prevSummary?.revenue || 0;
    const appts = rangeSummary?.appointments || 0;
    const apptsPrev = prevSummary?.appointments || 0;

    const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? null : 0));

    const changeVsPrev = {
      revenue: {
        current: rev,
        previous: revPrev,
        delta: rev - revPrev,
        deltaPct: pct(rev, revPrev), // null when prev==0 and current>0 to avoid misleading inf%
      },
      appointments: {
        current: appts,
        previous: apptsPrev,
        delta: appts - apptsPrev,
        deltaPct: pct(appts, apptsPrev),
      },
    };

    // ---------- Series by granularity ----------
    let groupId;
    if (granularity === "yearly") {
      groupId = { year: { $year: "$timeSlots.paymentDate" } };
    } else if (granularity === "quarterly") {
      groupId = {
        year: { $year: "$timeSlots.paymentDate" },
        quarter: {
          $ceil: { $divide: [{ $month: "$timeSlots.paymentDate" }, 3] },
        },
      };
    } else {
      // monthly (default)
      groupId = {
        year: { $year: "$timeSlots.paymentDate" },
        month: { $month: "$timeSlots.paymentDate" },
      };
    }

    const series = await Session.aggregate([
      ...basePaid,
      {
        $group: {
          _id: groupId,
          totalRevenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
          avgCharge: { $avg: "$timeSlots.paymentAmount" },
        },
      },
      {
        $sort:
          granularity === "yearly"
            ? { "_id.year": 1 }
            : granularity === "quarterly"
              ? { "_id.year": 1, "_id.quarter": 1 }
              : { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: granularity === "monthly" ? "$_id.month" : undefined,
          quarter: granularity === "quarterly" ? "$_id.quarter" : undefined,
          totalRevenue: 1,
          appointments: 1,
          avgCharge: 1,
        },
      },
    ]);

    // ---------- Mix by session type (in-person vs online) ----------
    const byType = await Session.aggregate([
      ...basePaid,
      {
        $group: {
          _id: "$type", // e.g., "in-person" | "online"
          revenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
        },
      },
      { $project: { _id: 0, type: "$_id", revenue: 1, appointments: 1 } },
      { $sort: { revenue: -1 } },
    ]);

    // ---------- Top doctors within range ----------
    const topDoctors = await Session.aggregate([
      ...basePaid,
      {
        $group: {
          _id: "$doctorId",
          revenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
          avgCharge: { $avg: "$timeSlots.paymentAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: topN },
      // Optional doctor details if you have the model:
      {
        $lookup: {
          from: Doctor.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          doctorId: "$_id",
          _id: 0,
          revenue: 1,
          appointments: 1,
          avgCharge: 1,
          doctor: { _id: 1, name: 1, email: 1, specialty: 1 },
        },
      },
    ]);

    // ---------- Top hospitals (in-person only) ----------
    const topHospitals = await Session.aggregate([
      ...basePaid,
      { $match: { type: "in-person", hospital: { $ne: null } } },
      {
        $group: {
          _id: "$hospital",
          revenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: topN },
      // Optionally $lookup Hospital model here if you have it:
      // {
      //   $lookup: { from: "hospitals", localField: "_id", foreignField: "_id", as: "hospital" }
      // },
      // { $unwind: { path: "$hospital", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          hospitalId: "$_id",
          _id: 0,
          revenue: 1,
          appointments: 1,
          // hospital: { _id: 1, name: 1, city: 1 } // after lookup
        },
      },
    ]);

    // ---------- All-time (for context at the top) ----------
    const [allTime] = await Session.aggregate([
      { $unwind: "$timeSlots" },
      {
        $match: {
          "timeSlots.paymentAmount": { $ne: null },
          "timeSlots.paymentDate": { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenueAllTime: { $sum: "$timeSlots.paymentAmount" },
          totalAppointmentsAllTime: { $sum: 1 },
          avgChargeAllTime: { $avg: "$timeSlots.paymentAmount" },
        },
      },
    ]);

    // ---------- Shape response ----------
    const revenuePerAppointment = appts > 0 ? rev / appts : null;

    return res.json({
      ok: true,
      data: {
        granularity,                      // monthly | quarterly | yearly
        periodBoundsUTC: { from, to },    // exclusive end
        summary: {
          revenue: rev,
          appointments: appts,
          avgCharge: rangeSummary?.avgCharge || null,
          revenuePerAppointment,
        },
        changeVsPrev,                     // deltas vs immediately previous comparable window
        series,                           // trend by selected granularity
        mixByType: byType,                // in-person vs online, etc.
        leaderboards: {
          topDoctors,
          topHospitals,
        },
        context: {
          allTime: allTime || { totalRevenueAllTime: 0, totalAppointmentsAllTime: 0, avgChargeAllTime: null },
          previousPeriodBoundsUTC: { from: prevFrom, to: prevTo },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};



/**
 * PER-DOCTOR: History (monthly buckets) + this month, last month, MoM
 * GET /doctors/:doctorId/finance/overview?months=12
 */
export const getDoctorFinancialOverview = async (req, res, next) => {
  try {
    const doctorId = toObjectId(req.params.doctorId);
    const months = Math.max(1, Math.min(Number(req.query.months) || 12, 60));
    const now = new Date();
    const { startOfThisMonth, startOfNextMonth, startOfLastMonth, endOfLastMonth } = monthBoundaries(now);

    const base = [
      { $match: { doctorId } },
      { $unwind: "$timeSlots" },
      { $match: paidSlotMatch() },
    ];

    // Monthly series (last N months including current)
    const startForSeries = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0));

    const monthlySeries = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startForSeries, $lt: startOfNextMonth } } },
      {
        $group: {
          _id: {
            year: { $year: "$timeSlots.paymentDate" },
            month: { $month: "$timeSlots.paymentDate" },
          },
          totalRevenue: { $sum: "$timeSlots.paymentAmount" },
          appointments: { $sum: 1 },
          avgCharge: { $avg: "$timeSlots.paymentAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: 1,
          appointments: 1,
          avgCharge: 1,
        },
      },
    ]);

    // Last month
    const [lastMonth] = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startOfLastMonth, $lt: endOfLastMonth } } },
      { $group: { _id: null, revenue: { $sum: "$timeSlots.paymentAmount" }, appointments: { $sum: 1 } } },
    ]);

    // This month (MTD)
    const [thisMonth] = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startOfThisMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, revenue: { $sum: "$timeSlots.paymentAmount" }, appointments: { $sum: 1 } } },
    ]);

    const last = lastMonth?.revenue || 0;
    const curr = thisMonth?.revenue || 0;
    const momRate = last > 0 ? ((curr - last) / last) * 100 : null;

    // All-time stats for this doctor
    const [allTime] = await Session.aggregate([
      ...base,
      { $group: {
        _id: null,
        totalRevenueAllTime: { $sum: "$timeSlots.paymentAmount" },
        totalAppointmentsAllTime: { $sum: 1 },
        avgChargeAllTime: { $avg: "$timeSlots.paymentAmount" },
      }},
    ]);

    res.json({
      ok: true,
      data: {
        doctorId,
        seriesMonths: months,
        monthlySeries,
        lastMonth: { revenue: last, appointments: lastMonth?.appointments || 0 },
        thisMonth: { revenue: curr, appointments: thisMonth?.appointments || 0 },
        monthOverMonthRatePct: momRate,
        allTime: allTime || { totalRevenueAllTime: 0, totalAppointmentsAllTime: 0, avgChargeAllTime: null },
        periodBoundsUTC: {
          startOfLastMonth,
          endOfLastMonth,
          startOfThisMonth,
          startOfNextMonth,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PER-DOCTOR: Quick numbers for the “account” page (past month, this month, rate, YTD)
 * GET /doctors/:doctorId/finance/quick
 */
export const getDoctorQuickAccountStats = async (req, res, next) => {
  try {
    const doctorId = toObjectId(req.params.doctorId);
    const now = new Date();
    const { startOfThisMonth, startOfNextMonth, startOfLastMonth, endOfLastMonth } = monthBoundaries(now);
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));

    const base = [
      { $match: { doctorId } },
      { $unwind: "$timeSlots" },
      { $match: paidSlotMatch() },
    ];

    const [lastMonth] = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startOfLastMonth, $lt: endOfLastMonth } } },
      { $group: { _id: null, revenue: { $sum: "$timeSlots.paymentAmount" }, count: { $sum: 1 } } },
    ]);
    const [thisMonth] = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startOfThisMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, revenue: { $sum: "$timeSlots.paymentAmount" }, count: { $sum: 1 } } },
    ]);
    const [ytd] = await Session.aggregate([
      ...base,
      { $match: { "timeSlots.paymentDate": { $gte: startOfYear, $lt: startOfNextMonth } } },
      { $group: { _id: null, revenue: { $sum: "$timeSlots.paymentAmount" }, count: { $sum: 1 } } },
    ]);

    const last = lastMonth?.revenue || 0;
    const curr = thisMonth?.revenue || 0;
    const rate = last > 0 ? ((curr - last) / last) * 100 : null;

    res.json({
      ok: true,
      data: {
        lastMonthIncome: last,
        thisMonthRevenue: curr,           // MTD
        incomeRatePctVsLastMonth: rate,   // growth %
        yearToDateRevenue: ytd?.revenue || 0,
        counts: {
          lastMonthAppointments: lastMonth?.count || 0,
          thisMonthAppointments: thisMonth?.count || 0,
          ytdAppointments: ytd?.count || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * OPTIONAL: Per-doctor list of paid appointments with payments (for drill-down tables)
 * GET /doctors/:doctorId/finance/payments?from=2025-01-01&to=2025-12-31
 */
export const getDoctorPayments = async (req, res, next) => {
  try {
    const doctorId = toObjectId(req.params.doctorId);
    const from = req.query.from ? new Date(req.query.from) : new Date("1970-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 365 * 24 * 3600 * 1000); // far future

    const data = await Session.aggregate([
      { $match: { doctorId } },
      { $unwind: "$timeSlots" },
      { $match: paidSlotMatch({ "timeSlots.paymentDate": { $gte: from, $lt: to } }) },
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          date: "$date",
          startTime: "$timeSlots.startTime",
          endTime: "$timeSlots.endTime",
          patientId: "$timeSlots.patientId",
          paymentAmount: "$timeSlots.paymentAmount",
          paymentCurrency: "$timeSlots.paymentCurrency",
          paymentDate: "$timeSlots.paymentDate",
          paymentIntentId: "$timeSlots.paymentIntentId",
          appointmentStatus: "$timeSlots.appointmentStatus",
          status: "$timeSlots.status",
          meetingId: "$timeSlots.meetingId",
          meetingLink: "$meetingLink",
          sessionType: "$type",
          hospital: "$hospital",
        },
      },
      { $sort: { paymentDate: -1 } },
    ]);

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};
