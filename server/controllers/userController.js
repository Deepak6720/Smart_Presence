const User = require("../models/User");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const bcrypt = require("bcryptjs");
const Attendance = require("../models/Attendance");
const sendEmail = require("../utils/sendEmail");
const { accountCreatedTemplate } = require("../utils/emailTemplates");

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role && ["teacher", "student"].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [studentCount, teacherCount, subjectCount, todayAttendance] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher" }),
        Subject.countDocuments({}),
        Attendance.countDocuments({
          date: { $gte: todayStart, $lt: todayEnd },
          status: "present",
        }),
      ]);

    res.status(200).json({
      students: studentCount,
      teachers: teacherCount,
      subjects: subjectCount,
      todayAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["teacher", "student"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be teacher or student" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: `${role} account created successfully`,
      user: userResponse,
    });

    sendEmail({
      to: user.email,
      subject: "Your SmartPresence Account Is Ready",
      html: accountCreatedTemplate({
        name: user.name,
        role: user.role,
        email: user.email,
      }),
    }).catch(() => {});
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }

    if (user.role === "teacher") {
      await Subject.updateMany({ teacher: id }, { $set: { teacher: null } });
    }

    if (user.role === "student") {
      await Subject.updateMany({ students: id }, { $pull: { students: id } });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFaceStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "faceDescriptor updatedAt"
    );

    const registered = !!(
      user.faceDescriptor && user.faceDescriptor.length === 128
    );

    res.status(200).json({
      registered,
      registeredAt: registered ? user.updatedAt : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const saveFaceDescriptor = async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (
      !descriptor ||
      !Array.isArray(descriptor) ||
      descriptor.length !== 128
    ) {
      return res.status(400).json({
        message:
          "Invalid face descriptor — must be an array of exactly 128 numbers",
      });
    }

    const allNumbers = descriptor.every(
      (v) => typeof v === "number" && !isNaN(v)
    );
    if (!allNumbers) {
      return res
        .status(400)
        .json({ message: "Descriptor contains invalid values" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      faceDescriptor: descriptor,
    });

    res.status(200).json({ message: "Face registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubjectFaceDescriptors = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId).populate({
      path: "students",
      select: "name email avatar faceDescriptor",
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (
      req.user.role === "teacher" &&
      subject.teacher?.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this subject" });
    }

    const students = subject.students.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      hasFaceRegistered: !!(
        s.faceDescriptor && s.faceDescriptor.length === 128
      ),
      faceDescriptor: s.faceDescriptor || null,
    }));

    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getStats,
  createUser,
  deleteUser,
  getFaceStatus,
  saveFaceDescriptor,
  getSubjectFaceDescriptors,
};
