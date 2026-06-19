const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  prediction: {
    type: Object,
    required: true
  },

  generatedAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    required: true
  }
});

aiPredictionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AiPrediction = mongoose.model('AiPrediction', aiPredictionSchema);
module.exports = AiPrediction;