import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  subjects: [
    {
      name: String,
      marks: Number
    }
  ]
});

export default mongoose.model("Marks", marksSchema);