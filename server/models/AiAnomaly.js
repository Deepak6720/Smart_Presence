const mongoose = require('mongoose');

const aiAnomalySchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    unique: true
  },

  anomalies: {
    type: Array,
    default: []
  },

  summary: {
    type: String,
    default: ''
  },

  totalAnomaliesFound: {
    type: Number,
    default: 0
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

aiAnomalySchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AiAnomaly = mongoose.model('AiAnomaly', aiAnomalySchema);
module.exports = AiAnomaly;