import Attendance from "../models/Attendance.js";

// Add attendance
export const addAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance by studentId
export const getAttendance = async (req, res) => {
  try {
    const data = await Attendance.findOne({
      studentId: req.params.studentId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};