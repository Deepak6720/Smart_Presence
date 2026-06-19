const express = require("express");
const router = express.Router();
const {
  getTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
  getHolidays,
  createHoliday,
  deleteHoliday,
} = require("../controllers/timetableController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/", getTimetable);

router.post("/", authorizeRoles("admin"), createTimetableEntry);

router.delete("/:id", authorizeRoles("admin"), deleteTimetableEntry);

router.get("/holidays", getHolidays);

router.post("/holidays", authorizeRoles("admin"), createHoliday);

router.delete("/holidays/:id", authorizeRoles("admin"), deleteHoliday);

module.exports = router;
