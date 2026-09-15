# SmartPresence

### AI-Powered Attendance & Analytics Platform

SmartPresence is an AI-powered attendance management platform that automates attendance using **face recognition** and provides intelligent insights through **AI-based risk prediction and anomaly detection**.

## ✨ Features

### 🔐 Authentication & Security

* JWT + Google OAuth 2.0
* Bcrypt password hashing
* Role-based access control
* Zod input validation
* API rate limiting

### 👑 Admin Portal

* Manage teachers and students
* Subject management
* Timetable and holiday management
* Attendance analytics and reports
* Excel export
* AI anomaly monitoring

### 👨‍🏫 Teacher Portal

* Real-time face recognition attendance
* Manual attendance marking
* Attendance history
* Subject-wise reports and charts
* AI anomaly detection
* Excel export

### 🎓 Student Portal

* Overall and subject-wise attendance
* Attendance calendar
* Weekly timetable
* Face registration
* AI attendance risk prediction
* At-risk attendance calculation

### 🤖 AI Features

* **Face Recognition** — face-api.js with TensorFlow.js
* **Risk Prediction** — Gemini-powered attendance risk analysis
* **Anomaly Detection** — AI-powered detection of unusual attendance patterns

### 📧 Notifications

* Welcome emails
* Attendance threshold alerts
* AI risk alerts

## 🛠️ Tech Stack

| Category         | Technologies                            |
| ---------------- | --------------------------------------- |
| Frontend         | React, Vite, Tailwind CSS, React Router |
| Backend          | Node.js, Express.js                     |
| Database         | MongoDB Atlas, Mongoose                 |
| Authentication   | JWT, Bcrypt, Passport.js, Google OAuth  |
| Face Recognition | face-api.js, TensorFlow.js              |
| AI               | Google Gemini                           |
| Charts           | Recharts                                |
| Email            | Nodemailer                              |
| Validation       | Zod                                     |
| Excel Export     | SheetJS                                 |
| Deployment       | Vercel, Render, MongoDB Atlas           |

## 🏗️ Architecture

```text
                 React Frontend
                       │
                  Axios + JWT
                       │
                       ▼
                 Express API
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     MongoDB Atlas   Gemini AI   Nodemailer
          │
          ▼
    Attendance Data


    Face Recognition
           │
           ▼
     Browser Webcam
           │
       face-api.js
           │
           ▼
   Face Detection
           ↓
   Face Recognition
           ↓
      Attendance
```

## 🌐 Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas
* **AI:** Google Gemini API
