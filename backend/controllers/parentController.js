import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";

export const getParentDashboard = async (req, res) => {
  try {
    // Get logged-in user
    const user = await User.findById(req.user.id);

    // Get student data
    const studentId = user.studentId;

    // Fetch attendance & marks
    const attendance = await Attendance.findOne({ studentId });
    const marks = await Marks.findOne({ studentId });

    res.json({
      studentId,
      attendance,
      marks
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};