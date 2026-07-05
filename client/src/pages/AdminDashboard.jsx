import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";
import Sidebar from "../components/UI/Sidebar";
import Navbar from "../components/UI/Navbar";
import StatsCard from "../components/UI/StatsCard";
import {
  Users,
  GraduationCap,  
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Plus,
} from "lucide-react";

export const AdminHome = () => {
  const [stats, setStats] = useState({
    students: null,
    teachers: null,
    subjects: null,
    todayAttendance: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/api/users/stats")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: loading ? "..." : stats.students,
      subtitle: "Registered in the system",
      icon: GraduationCap,
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: loading ? "..." : stats.teachers,
      subtitle: "Active faculty members",
      icon: Users,
      color: "green",
    },
    {
      title: "Active Subjects",
      value: loading ? "..." : stats.subjects,
      subtitle: "Created subjects",
      icon: BookOpen,
      color: "purple",
    },
    {
      title: "Today's Attendance",
      value: loading ? "..." : stats.todayAttendance,
      subtitle: "Records marked today",
      icon: TrendingUp,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">SmartPresence Administration</h2>
        <p className="text-blue-100 text-sm max-w-lg">
          Manage users, subjects, schedules, attendance analytics, and
          AI-powered insights from one place.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            "User Management",
            "Subjects",
            "Timetable",
            "AI Insights",
            "Charts & Reports",
            "Email Alerts",
          ].map((badge) => (
            <span
              key={badge}
              className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              {
                label: "Add Teacher or Student",
                color: "bg-green-50 text-green-700 hover:bg-green-100",
                to: "/admin/users",
              },
              {
                label: "Create or Manage Subjects",
                color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
                to: "/admin/subjects",
              },
              {
                label: "Set Up Timetable",
                color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
                to: "/admin/timetable",
              },
              {
                label: "Manage Holidays",
                color: "bg-orange-50 text-orange-700 hover:bg-orange-100",
                to: "/admin/holidays",
              },
              {
                label: "View Analytics",
                color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                to: "/admin/analytics",
              },
              {
                label: "Run Daily Email Check",
                color: "bg-gray-50 text-gray-700 hover:bg-gray-100",
                isButton: true,
              },
            ].map((action) =>
              action.isButton ? (
                <button
                  key={action.label}
                  onClick={async () => {
                    try {
                      const res = await axiosInstance.post(
                        "/api/ai/run-daily-check"
                      );
                      toast.success(res.data.message);
                    } catch {
                      toast.error("Failed to trigger check");
                    }
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                >
                  ⚡ {action.label}
                </button>
              ) : (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                >
                  {action.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Platform Status</h3>
          <div className="space-y-2">
            {[
              { label: "Authentication + Google OAuth", status: "Live" },
              { label: "Face Recognition (face-api.js)", status: "Live" },
              { label: "At-Risk Predictor (Gemini)", status: "Live" },
              { label: "Anomaly Detection (Gemini)", status: "Live" },
              { label: "Email Notifications (Nodemailer)", status: "Live" },
              { label: "Daily Cron Job", status: "Live" },
              { label: "Charts & Excel Export", status: "Live" },
              { label: "Security (Zod + Rate Limits)", status: "Live" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <p className="text-xs font-medium text-gray-700">
                  {item.label}
                </p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
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

export default AdminDashboard;
