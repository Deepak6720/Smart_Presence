# SmartPresence

### AI-Powered Attendance & Analytics Platform

SmartPresence is an AI-powered attendance management platform that automates attendance tracking using face recognition and provides intelligent insights through AI-based risk prediction and anomaly detection. It provides dedicated features for administrators, teachers, and students.

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication
- Google OAuth 2.0 using Passport.js
- Bcrypt password hashing
- Role-based access control
- Zod input validation
- API rate limiting
- Production-ready CORS configuration

### 👑 Admin Portal

- Manage teachers and students
- Create and manage subjects
- Assign teachers and enroll students
- Manage weekly timetables
- Manage holidays
- Attendance analytics and reports
- Excel attendance export
- AI anomaly monitoring
- Real-time attendance statistics

### 👨‍🏫 Teacher Portal

- Real-time face recognition attendance
- Manual attendance marking
- Attendance history
- Subject-wise attendance reports
- Attendance charts and trends
- AI-powered anomaly detection
- Excel attendance export

### 🎓 Student Portal

- Overall and subject-wise attendance tracking
- Attendance calendar
- Weekly timetable
- Face registration
- AI-powered attendance risk prediction
- At-risk attendance calculation
- Attendance threshold monitoring

### 🤖 AI Features

- **Face Recognition** — Browser-based face detection and recognition using face-api.js and TensorFlow.js.
- **Risk Prediction** — Google Gemini analyzes attendance trends and predicts potential attendance risks.
- **Anomaly Detection** — Gemini identifies unusual attendance patterns from attendance data.

### 📧 Notifications

- Welcome email after account creation
- Attendance threshold alerts
- AI-based risk alert emails

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router

**Backend:** Node.js, Express.js

**Database:** MongoDB Atlas, Mongoose

**Authentication:** JWT, Bcrypt, Passport.js, Google OAuth 2.0

**Face Recognition:** face-api.js, TensorFlow.js

**AI:** Google Gemini

**Charts:** Recharts

**Email:** Nodemailer

**Validation:** Zod

**Excel Export:** SheetJS

**Deployment:** Vercel, Render, MongoDB Atlas

## 🏗️ Architecture

SmartPresence follows a client-server architecture. The React frontend provides separate interfaces for Admin, Teacher, and Student roles and communicates with the backend through Axios with JWT-based authentication.

The Express.js backend handles authentication, authorization, input validation, attendance management, user management, timetable operations, AI services, and email notifications.

MongoDB Atlas stores users, subjects, attendance records, timetables, holidays, AI predictions, and anomaly data.

Face recognition runs directly in the browser using the webcam and face-api.js. The system detects faces, generates 128-dimensional face descriptors, and compares them with registered student descriptors to identify students and mark attendance.

Google Gemini is used for attendance risk prediction and anomaly detection based on attendance data and trends.

## 🌐 Deployment

**Frontend:** Vercel

**Backend:** Render

**Database:** MongoDB Atlas

**AI Services:** Google Gemini API
