import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Marks from "../models/Marks.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/dashboard", protect, async (req, res) => {
  const user = await User.findById(req.user.id);

  const marks = await Marks.findOne({ studentId: user.studentId });
  const attendance = await Attendance.findOne({ studentId: user.studentId });

  res.json({ marks, attendance });
});

export default router;