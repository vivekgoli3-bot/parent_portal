import express from "express";
import { addStudent, getStudents } from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
router.get("/", getStudents);

export default router;