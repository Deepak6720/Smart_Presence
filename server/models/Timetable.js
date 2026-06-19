const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
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
    
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    
    startTime: {
      type: String,
      required: true
    },
    
    endTime: {
      type: String,
      required: true
    },
    
    room: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;