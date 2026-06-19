import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/UI/Sidebar";
import Navbar from "../components/UI/Navbar";
import StatsCard from "../components/UI/StatsCard";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  Camera,
  Brain,
  History,
  AlertTriangle,
} from "lucide-react";

export const TeacherHome = () => {
  const [subjects, setSubjects] = useState([]);
  const [todayClasses, setTodayClasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsRes, timetableRes] = await Promise.all([
          axiosInstance.get("/api/subjects/mine"),
          axiosInstance.get("/api/timetable"),
        ]);

        setSubjects(subjectsRes.data.subjects);
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        const todayName = days[new Date().getDay()];

        const todayEntries = timetableRes.data.timetable.filter(
          (e) => e.dayOfWeek === todayName
        );

        setTodayClasses(todayEntries.length);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const totalStudents = subjects.reduce(
    (acc, subject) => acc + (subject.students?.length || 0),
    0
  );

  const stats = [
    {
      title: "Assigned Subjects",
      value: loading ? "..." : subjects.length,
      subtitle: "Your subjects",
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Total Students",
      value: loading ? "..." : totalStudents,
      subtitle: "Across all your classes",
      icon: Users,
      color: "green",
    },
    {
      title: "Today's Classes",
      value: loading ? "..." : todayClasses,
      subtitle: "Scheduled for today",
      icon: Clock,
      color: "purple",
    },
    {
      title: "Avg Attendance",
      value: "—",
      subtitle: "Available after Day 6-7",
      icon: TrendingUp,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">
          SmartPresence Teaching Portal{" "}
        </h2>
        <p className="text-green-100 text-sm max-w-lg">
          Mark attendance automatically with AI face recognition or manually.
          Monitor your class with AI anomaly detection and Gemini-powered
          reports.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            "Face Recognition",
            "Manual Attendance",
            "Anomaly Detection",
            "Reports & Export",
            "Email Alerts",
          ].map((b) => (
            <span
              key={b}
              className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Your Tools</h3>
          <div className="space-y-2">
            {[
              {
                icon: Camera,
                label: "Face Recognition Attendance",
                to: "/teacher/face-attendance",
                color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
              },
              {
                icon: BookOpen,
                label: "Manual Attendance",
                to: "/teacher/manual-attendance",
                color: "bg-green-50 text-green-700 hover:bg-green-100",
              },
              {
                icon: TrendingUp,
                label: "Reports & Charts",
                to: "/teacher/reports",
                color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
              },
              {
                icon: AlertTriangle,
                label: "AI Anomaly Detection",
                to: "/teacher/anomalies",
                color: "bg-red-50 text-red-700 hover:bg-red-100",
              },
              {
                icon: History,
                label: "Attendance History",
                to: "/teacher/history",
                color: "bg-gray-50 text-gray-700 hover:bg-gray-100",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.color}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Today's Schedule</h3>
          {loading ? (
            <div className="h-36 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayClasses === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <Clock className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500 font-medium">
                No classes today
              </p>
              <a
                href="/teacher/manual-attendance"
                className="text-xs text-blue-600 hover:underline mt-2"
              >
                Mark attendance for another date
              </a>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {todayClasses}
              </p>
              <p className="text-sm text-green-700 font-medium">
                class{todayClasses > 1 ? "es" : ""} today
              </p>
              <a
                href="/teacher/face-attendance"
                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
              >
                Open Face Attendance →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
