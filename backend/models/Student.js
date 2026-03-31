import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: String,
  usn: String,
  className: String,
  section: String
});

export default mongoose.model("Student", studentSchema);