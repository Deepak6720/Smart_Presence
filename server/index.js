const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors'); 
const { generalLimiter } = require('./middleware/rateLimiter');
const session = require('express-session');
const passport = require('passport');
const { startCronJobs } = require('./utils/cronJobs');
const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const aiRoutes = require('./routes/aiRoutes');

connectDB();
startCronJobs();
const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());

app.use('/api', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Attendance API is running!' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production' && process.env.SERVER_URL) {
  const https = require('https');
  setInterval(() => {
    https.get(`${process.env.SERVER_URL}/`, (res) => {
      console.log(`Keep-alive ping: ${res.statusCode}`);
    }).on('error', () => {
    
    });
  }, 14 * 60 * 1000); 
  console.log('Keep-alive ping started (Render free tier)');
}


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});