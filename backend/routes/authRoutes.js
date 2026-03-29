import express from "express";
import {
  login,
  sendOtpForRegister,
  verifyOtpAndRegister,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

// 🔐 LOGIN
router.post("/login", login);

// 🔑 OTP REGISTER
router.post("/send-otp", sendOtpForRegister);
router.post("/verify-otp", verifyOtpAndRegister);

// 🔁 FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;