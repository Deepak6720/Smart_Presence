const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    
    semester: {
      type: String,
      default: ''
    },
    
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
