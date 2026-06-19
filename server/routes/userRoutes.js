const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getStats,
  createUser,
  deleteUser,
  getFaceStatus,
  saveFaceDescriptor,
  getSubjectFaceDescriptors,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { validate, createUserSchema, saveFaceDescriptorSchema } = require('../middleware/validateInput');


router.use(protect);

router.get("/face-status", authorizeRoles("student"), getFaceStatus);
router.put('/face-descriptor', authorizeRoles('student'), validate(saveFaceDescriptorSchema), saveFaceDescriptor);
router.get(
  "/face-descriptors/:subjectId",
  authorizeRoles("teacher", "admin"),
  getSubjectFaceDescriptors
);

router.get("/stats", authorizeRoles("admin"), getStats);

router.get("/", authorizeRoles("admin"), getAllUsers);
router.post('/', authorizeRoles('admin'), validate(createUserSchema), createUser);
router.delete("/:id", authorizeRoles("admin"), deleteUser);

module.exports = router;
