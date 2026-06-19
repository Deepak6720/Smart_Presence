const Subject = require("../models/Subject");
const User = require("../models/User");
const Timetable = require("../models/Timetable");

const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({})
      .populate("teacher", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ subjects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMySubjects = async (req, res) => {
  try {
    let subjects;

    if (req.user.role === "teacher") {
      subjects = await Subject.find({ teacher: req.user.id }).populate(
        "students",
        "name email"
      );
    } else if (req.user.role === "student") {
      subjects = await Subject.find({ students: req.user.id }).populate(
        "teacher",
        "name email"
      );
    } else {
      subjects = await Subject.find({})
        .populate("teacher", "name email")
        .populate("students", "name email");
    }

    res.status(200).json({ subjects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code, semester } = req.body;
    if (!name || !code) {
      return res
        .status(400)
        .json({ message: "Subject name and code are required" });
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res
        .status(400)
        .json({ message: `Subject code ${code.toUpperCase()} already exists` });
    }

    const subject = await Subject.create({
      name,
      code,
      semester: semester || "",
    });

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (teacherId) {
      const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
      if (!teacher) {
        return res.status(400).json({ message: "Teacher not found" });
      }
    }

    subject.teacher = teacherId || null;
    await subject.save();

    const updated = await Subject.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("students", "name email");

    res
      .status(200)
      .json({ message: "Teacher assigned successfully", subject: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateEnrollment = async (req, res) => {
  try {
    const { studentIds } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: "student",
    });

    if (validStudents.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more student IDs are invalid" });
    }

    subject.students = studentIds;
    await subject.save();

    const updated = await Subject.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.status(200).json({ message: "Enrollment updated", subject: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    await Timetable.deleteMany({ subject: req.params.id });

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllSubjects,
  getMySubjects,
  createSubject,
  assignTeacher,
  updateEnrollment,
  deleteSubject,
};
