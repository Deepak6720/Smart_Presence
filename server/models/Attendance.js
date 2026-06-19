const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    date: {
      type: Date,
      required: true
    },
    
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'absent'
    },
    
    markedBy: {
      type: String,
      enum: ['manual', 'face-recognition'],
      default: 'manual'
    }
  },
  { timestamps: true }
);

attendanceSchema.index(
  { student: 1, subject: 1, date: 1 },
  { unique: true }
);

attendanceSchema.index({ subject: 1, date: 1 });

attendanceSchema.index({ student: 1, subject: 1 });

attendanceSchema.index({ teacher: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;  