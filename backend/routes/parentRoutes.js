import express from "express";
import { getParentDashboard } from "../controllers/parentController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route
router.get("/dashboard", auth, getParentDashboard);

export default router;