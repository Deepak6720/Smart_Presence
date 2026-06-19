const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getSession,
  editRecord,
  getSubjectRecords,
  getMyAttendance,
  getAdminReport,
  getTodayCount,
  getPlatformAnalytics,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { validate, markAttendanceSchema } = require('../middleware/validateInput');

router.use(protect);

router.get("/session", getSession);

router.get("/mine", authorizeRoles("student"), getMyAttendance);
router.get("/report", authorizeRoles("admin"), getAdminReport);
router.get("/analytics", authorizeRoles("admin"), getPlatformAnalytics);

router.get("/today-count", authorizeRoles("admin", "teacher"), getTodayCount);

router.post('/', authorizeRoles('teacher'), validate(markAttendanceSchema), markAttendance);
router.put("/:id", authorizeRoles("teacher"), editRecord);

router.get(
  "/subject/:subjectId",
  authorizeRoles("admin", "teacher"),
  getSubjectRecords
);

module.exports = router;
