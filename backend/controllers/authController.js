import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
import User from "../models/User.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER (CREATE STUDENT + USER)
export const register = async (req, res) => {
  try {
    const { name, email, password, usn, className, section } = req.body;

    // check user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔥 CREATE STUDENT FIRST
    const student = await Student.create({
      name,
      usn,
      class: className,
      section
    });

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 CREATE USER LINKED TO STUDENT
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      studentId: student._id
    });

    res.status(201).json({
      message: "Account created successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN ✅ (THIS WAS MISSING OR WRONG)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};