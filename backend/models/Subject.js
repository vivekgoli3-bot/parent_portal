import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  className: String,
  subjects: [String]
});

export default mongoose.model("Subject", subjectSchema);