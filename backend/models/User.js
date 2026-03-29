import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

  role: {
    type: String,
    enum: ["parent", "admin"],
    default: "parent"
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },

  resetToken: String,
  resetTokenExpiry: Date

}, { timestamps: true });

export default mongoose.model("User", userSchema);