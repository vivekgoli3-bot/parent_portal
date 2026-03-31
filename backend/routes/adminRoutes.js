import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Marks from "../models/Marks.js";
import Subject from "../models/Subject.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// CREATE CLASS SUBJECTS
router.post("/subjects", protect, isAdmin, async (req, res) => {
  const { className, subjects } = req.body;

  let data = await Subject.findOne({ className });

  if (data) {
    data.subjects = subjects;
    await data.save();
  } else {
    await Subject.create({ className, subjects });
  }

  res.json({ message: "Subjects saved" });
});

// CREATE STUDENT
router.post("/create-student", protect, isAdmin, async (req, res) => {
  const { name, email, password, usn, className, section } = req.body;

  const student = await Student.create({
    name, usn, className, section
  });

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name, email, password: hashed,
    studentId: student._id,
    role: "parent"
  });

  res.json({ message: "Student created" });
});

// ADD / EDIT MARKS
router.post("/marks", protect, isAdmin, async (req, res) => {
  const { studentId, subjects } = req.body;

  let marks = await Marks.findOne({ studentId });

  if (marks) {
    marks.subjects = subjects;
    await marks.save();
  } else {
    await Marks.create({ studentId, subjects });
  }

  res.json({ message: "Marks saved" });
});

// GET SUBJECTS BY CLASS
router.get("/subjects/:className", protect, isAdmin, async (req, res) => {
  const data = await Subject.findOne({ className: req.params.className });
  res.json(data);
});

// GET STUDENTS
router.get("/students", protect, isAdmin, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

export default router;