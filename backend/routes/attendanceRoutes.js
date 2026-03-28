import express from "express";
import { addAttendance, getAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/", addAttendance);
router.get("/:studentId", getAttendance);

export default router;