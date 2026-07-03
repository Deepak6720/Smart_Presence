const express = require('express');
const router = express.Router();
const {
  getMyRiskPrediction,
  getPlatformRiskOverview,
  runAnomalyDetection,
  getAllAnomalies,
  triggerDailyCheck   
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/my-risk', authorizeRoles('student'), aiLimiter, getMyRiskPrediction);
router.post('/anomaly/:subjectId', authorizeRoles('teacher', 'admin'), aiLimiter, runAnomalyDetection);

router.get('/platform-risk', authorizeRoles('admin'), getPlatformRiskOverview);
router.get('/all-anomalies', authorizeRoles('admin'), getAllAnomalies);
router.post('/run-daily-check', authorizeRoles('admin'), triggerDailyCheck);

module.exports = router;