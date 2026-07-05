import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "../components/UI/Sidebar";
import Navbar from "../components/UI/Navbar";
import StatsCard from "../components/UI/StatsCard";
import axiosInstance from "../utils/axiosInstance";
import { TrendingUp, BookOpen, AlertTriangle, Brain, Scan } from "lucide-react";

export const StudentHome = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRisk, setAiRisk] = useState(null);
  const [aiRiskLoading, setAiRiskLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/api/attendance/mine")
      .then((res) => setAttendanceData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axiosInstance
      .get("/api/ai/my-risk")
      .then((res) => {
        if (res.data.prediction) {
          setAiRisk(res.data.prediction.overallRisk);
        }
      })
      .catch(() => {})
      .finally(() => setAiRiskLoading(false));
  }, []);

  const atRiskCount =
    attendanceData?.attendance?.filter((a) => a.isAtRisk).length || 0;

  const enrolledCount = attendanceData?.attendance?.length || 0;

  const overallPercentage = attendanceData?.overall?.percentage;

  const stats = [
    {
      title: "Overall Attendance",
      value: loading
        ? "..."
        : overallPercentage !== undefined
        ? `${overallPercentage}%`
        : "—",
      subtitle: loading
        ? ""
        : attendanceData?.overall?.totalClasses
        ? `${attendanceData.overall.totalAttended}/${attendanceData.overall.totalClasses} classes`
        : "No sessions yet",
      icon: TrendingUp,
      color:
        overallPercentage >= 75
          ? "green"
          : overallPercentage > 0
          ? "red"
          : "green",
    },
    {
      title: "Enrolled Subjects",
      value: loading ? "..." : enrolledCount,
      subtitle:
        enrolledCount === 0
          ? "Admin assigns subjects"
          : `${enrolledCount} subject${enrolledCount !== 1 ? "s" : ""}`,
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Subjects at Risk",
      value: loading ? "..." : atRiskCount,
      subtitle: atRiskCount === 0 ? "All subjects safe" : "Below 75% threshold",
      icon: AlertTriangle,
      color: atRiskCount > 0 ? "red" : "green",
    },
    {
      title: "AI Risk Status",
      value: aiRiskLoading
        ? "..."
        : aiRisk
        ? aiRisk.charAt(0).toUpperCase() + aiRisk.slice(1)
        : "—",
      subtitle: aiRiskLoading
        ? ""
        : aiRisk
        ? "See AI Risk Prediction for details"
        : "Not enough data yet",
      icon: Brain,
      color:
        aiRisk === "critical" || aiRisk === "high"
          ? "red"
          : aiRisk === "safe"
          ? "green"
          : "purple",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Your Attendance Hub 🎓</h2>
        <p className="text-blue-100 text-sm max-w-lg">
          Track your attendance, get AI-powered risk predictions, and use face
          recognition for automatic marking.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            "Face Recognition",
            "AI Predictions",
            "Calender View",
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
          <h3 className="font-semibold text-gray-800 mb-4">
            Subject-wise Attendance
          </h3>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !attendanceData || attendanceData.attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <BookOpen className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                No subjects enrolled yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ask your admin to enroll you in subjects
              </p>
            </div>
          ) : attendanceData.overall.totalClasses === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <BookOpen className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                Enrolled in {attendanceData.attendance.length} subject
                {attendanceData.attendance.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Attendance will appear once your teacher marks sessions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceData.attendance.slice(0, 3).map((item) => (
                <div key={item.subject._id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate mr-2">
                      {item.subject.name}
                    </p>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        item.percentage >= 75
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        item.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {attendanceData.attendance.length > 3 && (
                <Link
                  to="/student/attendance"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View all {attendanceData.attendance.length} subjects →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800">AI Risk Prediction</h3>
          </div>
          {aiRiskLoading ? (
            <div className="h-28 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aiRisk ? (
            <div
              className={`rounded-xl p-4 border ${
                aiRisk === "safe"
                  ? "bg-green-50 border-green-200"
                  : aiRisk === "critical" || aiRisk === "high"
                  ? "bg-red-50 border-red-200"
                  : "bg-purple-50 border-purple-200"
              }`}
            >
              <p
                className={`text-sm font-bold capitalize mb-1 ${
                  aiRisk === "safe"
                    ? "text-green-700"
                    : aiRisk === "critical" || aiRisk === "high"
                    ? "text-red-700"
                    : "text-purple-700"
                }`}
              >
                Risk Level: {aiRisk}
              </p>
              <p className="text-xs text-gray-600">
                Powered by Gemini AI — based on your 30-day trend
              </p>
              <Link
                to="/student/risk"
                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
              >
                View full prediction
              </Link>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
              <Brain className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <p className="text-sm text-purple-700">Not enough data yet</p>
              <p className="text-xs text-purple-400 mt-1">
                Attend 5+ sessions to activate AI predictions
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Calendar", to: "/student/calendar" },
            { label: "My Attendance", to: "/student/attendance" },
            { label: "AI Prediction", to: "/student/risk" },
            { label: "Face Register", to: "/student/face-register" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-center text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 rounded-lg px-3 py-2.5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
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

export default StudentDashboard;
