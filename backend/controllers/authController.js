import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
import { sendOTP } from "../utils/sendEmail.js";

let otpStore = {}; // temporary storage

export const sendOtpForRegister = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = otp;

    await sendOTP(email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// VERIFY OTP + CREATE ACCOUNT
export const verifyOtpAndRegister = async (req, res) => {
  try {
    const { name, email, password, usn, className, section, otp } = req.body;

    if (otpStore[email] != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // create student
    const student = await Student.create({
      name,
      usn,
      class: className,
      section
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    await User.create({
      name,
      email,
      password: hashedPassword,
      studentId: student._id
    });

    delete otpStore[email];

    res.json({ message: "Account created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
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

import crypto from "crypto";

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save();

    const resetLink = `https://your-netlify-app.netlify.app/reset.html?token=${token}`;

    await sendOTP(email, `Reset your password: ${resetLink}`);

    res.json({ message: "Reset link sent to email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};