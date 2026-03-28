import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  usn: {
    type: String,
    unique: true
  },
  class: String,
  section: String
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);