import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// ✅ CREATE ADMIN
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if admin already exists
    const existing = await User.findOne({ email });

    if (existing) {
      return res.json({ message: "Admin already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create admin
    await User.create({
      name: "Admin",
      email,
      password: hashedPassword,
      role: "admin"
    });

    res.json({ message: "Admin created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;