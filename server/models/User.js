const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,  
      trim: true      
    },
    
    email: {
      type: String,
      required: true,
      unique: true,    
      lowercase: true, 
      trim: true
    },
    
    password: {
      type: String
    },
    
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student'
    },
    
    avatar: {
      type: String,
      default: ''
    },
    
    googleId: {
      type: String,
      default: null
    },
    
    faceDescriptor: {
      type: [Number],
      default: null
    }
  },
  
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;