import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  subjects: [
    {
      name: String,
      marks: Number
    }
  ]
}, { timestamps: true });

export default mongoose.model("Marks", marksSchema);