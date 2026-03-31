import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },
  role: {
    type: String,
    enum: ["admin", "parent"],
    default: "parent"
  }
});

export default mongoose.model("User", userSchema);