import express from "express";
import { addMarks, getMarks } from "../controllers/marksController.js";

const router = express.Router();

// Add marks
router.post("/", addMarks);

// Get marks by studentId
router.get("/:studentId", getMarks);

export default router;