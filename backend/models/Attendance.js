import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  totalClasses: Number,
  attendedClasses: Number
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);