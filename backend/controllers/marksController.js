import Marks from "../models/Marks.js";

// Add marks
export const addMarks = async (req, res) => {
  try {
    const marks = await Marks.create(req.body);
    res.status(201).json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get marks by studentId
export const getMarks = async (req, res) => {
  try {
    const data = await Marks.findOne({
      studentId: req.params.studentId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};