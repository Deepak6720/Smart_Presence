const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const Holiday = require("../models/Holiday");
const normalizeDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const markAttendance = async (req, res) => {
  try {
    const { subjectId, date, records, markedBy } = req.body;

    if (!subjectId || !date || !records || records.length === 0) {
      return res
        .status(400)
        .json({ message: "subjectId, date, and records are required" });
    }

    const attendanceDate = normalizeDate(date);

    const nextDay = new Date(attendanceDate.getTime() + 86400000);

    const holiday = await Holiday.findOne({
      date: { $gte: attendanceDate, $lt: nextDay },
    });

    if (holiday) {
      return res.status(400).json({
        message: `Cannot mark attendance on a holiday: ${holiday.name}`,
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      teacher: req.user.id,
    });

    if (!subject) {
      return res.status(403).json({
        message: "You are not assigned to this subject",
      });
    }

    const operations = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: {
          student: studentId,
          subject: subjectId,
          date: attendanceDate,
        },
        update: {
          $set: {
            student: studentId,
            subject: subjectId,
            teacher: req.user.id,
            date: attendanceDate,
            status: status || "absent",
            markedBy:
              markedBy === "face-recognition" ? "face-recognition" : "manual",
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    res.status(200).json({
      message: `Attendance marked for ${records.length} students`,
      date: attendanceDate,
      count: records.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const { subjectId, date } = req.query;

    if (!subjectId || !date) {
      return res
        .status(400)
        .json({ message: "subjectId and date are required" });
    }

    const attendanceDate = normalizeDate(date);
    const nextDay = new Date(attendanceDate.getTime() + 86400000);

    const records = await Attendance.find({
      subject: subjectId,
      date: { $gte: attendanceDate, $lt: nextDay },
    }).populate("student", "name email avatar");

    res.status(200).json({ records, exists: records.length > 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const editRecord = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["present", "absent", "late"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be present, absent, or late" });
    }

    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const recordDate = new Date(record.date);
    recordDate.setUTCHours(0, 0, 0, 0);

    if (recordDate.getTime() !== today.getTime()) {
      return res.status(403).json({
        message: "Attendance can only be edited on the same day it was marked",
      });
    }

    if (record.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only edit attendance records you created",
      });
    }

    record.status = status;
    await record.save();

    res.status(200).json({ message: "Record updated", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubjectRecords = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId)
      .populate("students", "name email avatar")
      .populate("teacher", "name");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (
      req.user.role === "teacher" &&
      (!subject.teacher || subject.teacher._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        message: "Access denied — not your subject",
      });
    }

    const allRecords = await Attendance.find({ subject: subjectId })
      .populate("student", "name email avatar")
      .sort({ date: -1 });

    const sessionsMap = {};
    allRecords.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().split("T")[0];

      if (!sessionsMap[dateKey]) {
        sessionsMap[dateKey] = {
          date: dateKey,
          records: [],
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
        };
      }

      sessionsMap[dateKey].records.push(record);
      sessionsMap[dateKey].total++;
      sessionsMap[dateKey][record.status]++;
    });

    const sessions = Object.values(sessionsMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const totalSessions = sessions.length;

    const studentStats = subject.students.map((student) => {
      const studentRecords = allRecords.filter(
        (r) => r.student && r.student._id.toString() === student._id.toString()
      );

      const attended = studentRecords.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;

      const percentage =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      return {
        student,
        attended,
        absent: totalSessions - attended,
        totalSessions,
        percentage,
        isAtRisk: percentage < 75 && totalSessions >= 3,
      };
    });

    studentStats.sort((a, b) => a.percentage - b.percentage);

    res.status(200).json({
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        teacher: subject.teacher,
      },
      totalSessions,
      studentStats,
      sessions,
    });
  } catch (error) {
    console.error("getSubjectRecords error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const subjects = await Subject.find({ students: studentId }).populate(
      "teacher",
      "name"
    );

    if (subjects.length === 0) {
      return res
        .status(200)
        .json({ attendance: [], overall: { percentage: 0, totalClasses: 0 } });
    }

    const attendanceData = await Promise.all(
      subjects.map(async (subject) => {
        const records = await Attendance.find({
          student: studentId,
          subject: subject._id,
        }).sort({ date: -1 });

        const totalSessions = records.length;
        const attended = records.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;

        const percentage =
          totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

        return {
          subject: {
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            teacher: subject.teacher,
          },
          records,
          totalSessions,
          attended,
          absent: totalSessions - attended,
          percentage,
          isAtRisk: percentage < 75 && totalSessions > 0,
        };
      })
    );

    const totalClasses = attendanceData.reduce(
      (sum, s) => sum + s.totalSessions,
      0
    );
    const totalAttended = attendanceData.reduce(
      (sum, s) => sum + s.attended,
      0
    );
    const overallPercentage =
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    res.status(200).json({
      attendance: attendanceData,
      overall: {
        totalClasses,
        totalAttended,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAdminReport = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate("teacher", "name");

    const report = await Promise.all(
      subjects.map(async (subject) => {
        const records = await Attendance.find({ subject: subject._id });

        const uniqueDates = [
          ...new Set(
            records.map((r) => new Date(r.date).toISOString().split("T")[0])
          ),
        ];

        const totalSessions = uniqueDates.length;
        const totalRecords = records.length;
        const presentCount = records.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;

        const overallPercentage =
          totalRecords > 0
            ? Math.round((presentCount / totalRecords) * 100)
            : 0;

        return {
          subject: {
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            teacher: subject.teacher,
          },
          totalSessions,
          totalRecords,
          overallPercentage,
        };
      })
    );

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTodayCount = async (req, res) => {
  try {
    const todayStart = normalizeDate(new Date().toISOString().split("T")[0]);
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const count = await Attendance.countDocuments({
      date: { $gte: todayStart, $lt: todayEnd },
      status: "present",
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const records = await Attendance.find({
      date: { $gte: thirtyDaysAgo },
    });

    const trendMap = {};
    records.forEach((r) => {
      const dateKey = new Date(r.date).toISOString().split("T")[0];
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      trendMap[dateKey][r.status]++;
      trendMap[dateKey].total++;
    });

    const trend = Object.values(trendMap)
      .map((day) => ({
        ...day,
        percentage:
          day.total > 0
            ? Math.round(((day.present + day.late) / day.total) * 100)
            : 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const subjects = await Subject.find({});
    const subjectBreakdown = await Promise.all(
      subjects.map(async (subject) => {
        const subjectRecords = await Attendance.find({ subject: subject._id });
        const present = subjectRecords.filter(
          (r) => r.status === "present"
        ).length;
        const late = subjectRecords.filter((r) => r.status === "late").length;
        const absent = subjectRecords.filter(
          (r) => r.status === "absent"
        ).length;
        const total = subjectRecords.length;

        return {
          subjectName: subject.name,
          subjectCode: subject.code,
          present,
          late,
          absent,
          total,
          percentage:
            total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        };
      })
    );

    const statusDistribution = {
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      absent: records.filter((r) => r.status === "absent").length,
    };

    res.status(200).json({ trend, subjectBreakdown, statusDistribution });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  markAttendance,
  getSession,
  editRecord,
  getSubjectRecords,
  getMyAttendance,
  getAdminReport,
  getTodayCount,
  getPlatformAnalytics,
};
