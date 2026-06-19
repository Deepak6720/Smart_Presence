const express = require("express");
const router = express.Router();
const {
  getAllSubjects,
  getMySubjects,
  createSubject,
  assignTeacher,
  updateEnrollment,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { validate, createSubjectSchema } = require('../middleware/validateInput');

router.use(protect);

router.get("/mine", getMySubjects);

router.get("/", authorizeRoles("admin"), getAllSubjects);

router.post('/', authorizeRoles('admin'), validate(createSubjectSchema), createSubject);

router.put("/:id/assign-teacher", authorizeRoles("admin"), assignTeacher);

router.put("/:id/enroll", authorizeRoles("admin"), updateEnrollment);

router.delete("/:id", authorizeRoles("admin"), deleteSubject);

module.exports = router;
