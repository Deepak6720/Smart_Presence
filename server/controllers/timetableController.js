const Timetable = require("../models/Timetable");
const Holiday = require("../models/Holiday");
const Subject = require("../models/Subject");

const getTimetable = async (req, res) => {
  try {
    let entries;

    if (req.user.role === "admin") {
      entries = await Timetable.find({})
        .populate("subject", "name code")
        .populate("teacher", "name");
    } else if (req.user.role === "teacher") {
      entries = await Timetable.find({ teacher: req.user.id }).populate(
        "subject",
        "name code"
      );
    } else {
      const mySubjects = await Subject.find({ students: req.user.id }, "_id");
      const subjectIds = mySubjects.map((s) => s._id);
      entries = await Timetable.find({ subject: { $in: subjectIds } })
        .populate("subject", "name code")
        .populate("teacher", "name");
    }

    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    entries.sort((a, b) => {
      if (dayOrder[a.dayOfWeek] !== dayOrder[b.dayOfWeek]) {
        return dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      }
      return a.startTime.localeCompare(b.startTime);
    });

    res.status(200).json({ timetable: entries });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const { subjectId, dayOfWeek, startTime, endTime, room } = req.body;

    if (!subjectId || !dayOfWeek || !startTime || !endTime) {
      return res
        .status(400)
        .json({
          message: "Subject, day, start time and end time are required",
        });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (!subject.teacher) {
      return res
        .status(400)
        .json({
          message:
            "Assign a teacher to this subject before adding it to the timetable",
        });
    }

    const entry = await Timetable.create({
      subject: subjectId,
      teacher: subject.teacher,
      dayOfWeek,
      startTime,
      endTime,
      room: room || "",
    });

    const populated = await Timetable.findById(entry._id)
      .populate("subject", "name code")
      .populate("teacher", "name");

    res
      .status(201)
      .json({ message: "Timetable entry added", entry: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }
    res.status(200).json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.status(200).json({ holidays });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { name, date, description } = req.body;

    if (!name || !date) {
      return res
        .status(400)
        .json({ message: "Holiday name and date are required" });
    }

    const existing = await Holiday.findOne({ date: new Date(date) });
    if (existing) {
      return res
        .status(400)
        .json({
          message: `A holiday already exists on this date: ${existing.name}`,
        });
    }

    const holiday = await Holiday.create({
      name,
      date: new Date(date),
      description,
    });
    res.status(201).json({ message: "Holiday added", holiday });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json({ message: "Holiday deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
  getHolidays,
  createHoliday,
  deleteHoliday,
};
