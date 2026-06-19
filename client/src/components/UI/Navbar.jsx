import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell } from "lucide-react";

const pageTitles = {
  "/admin": "Administration Overview",
  "/admin/users": "User Management",
  "/admin/subjects": "Subject Management",
  "/admin/timetable": "Timetable",
  "/admin/holidays": "Holiday Manager",
  "/admin/reports": "Attendance Reports",
  "/admin/anomalies": "Anomaly Flags",
  "/admin/analytics": "Analytics",
  "/teacher": "Teaching Overview",
  "/teacher/face-attendance": "Face Recognition Attendance",
  "/teacher/manual-attendance": "Manual Attendance",
  "/teacher/history": "Attendance History",
  "/teacher/reports": "Reports",
  "/teacher/anomalies": "Anomaly Flags",
  "/student": "Attendance Overview",
  "/student/attendance": "My Attendance",
  "/student/timetable": "Timetable",
  "/student/calendar": "Calendar View",
  "/student/risk": "AI Risk Prediction",
  "/student/face-register": "Face Registration",
};

const roleBadgeColors = {
  admin: "bg-purple-100 text-purple-700",
  teacher: "bg-green-100 text-green-700",
  student: "bg-blue-100 text-blue-700",
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const badgeColor = roleBadgeColors[user?.role] || "bg-gray-100 text-gray-700";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        <p className="text-xs text-gray-400">
          SmartPresence — AI-Powered Attendance & Analytics
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeColor}`}
            >
              {user?.role}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
