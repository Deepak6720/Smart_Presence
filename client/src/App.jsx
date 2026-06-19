import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AnomalyFlags from "./components/Admin/AnomalyFlags";
import TeacherAnomalyFlags from "./components/Teacher/TeacherAnomalyFlags";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard, { AdminHome } from "./pages/AdminDashboard";
import TeacherDashboard, { TeacherHome } from "./pages/TeacherDashboard";
import StudentDashboard, { StudentHome } from "./pages/StudentDashboard";
import UserManagement from "./components/Admin/UserManagement";
import SubjectManagement from "./components/Admin/SubjectManagement";
import TimetableManager from "./components/Admin/TimetableManager";
import HolidayManager from "./components/Admin/HolidayManager";
import ManualAttendance from "./components/Teacher/ManualAttendance";
import AttendanceHistory from "./components/Teacher/AttendanceHistory";
import AttendanceView from "./components/Student/AttendanceView";
import FaceRegistration from "./components/Student/FaceRegistration";
import FaceAttendance from "./components/Teacher/FaceAttendance";
import RiskPrediction from "./components/Student/RiskPrediction";
import StudentTimetable from "./components/Student/StudentTimetable";
import CalendarView from "./components/Student/CalendarView";
import Analytics from "./components/Admin/Analytics";
import AdminReports from "./components/Admin/Reports";
import TeacherReports from "./components/Teacher/Reports";


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) return <Navigate to={`/${user.role}`} replace />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={
          <RedirectIfAuthenticated>
            <Landing />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ADMIN NESTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="timetable" element={<TimetableManager />} />
        <Route path="holidays" element={<HolidayManager />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="anomalies" element={<AnomalyFlags />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* TEACHER NESTED ROUTES */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHome />} />
        <Route path="face-attendance" element={<FaceAttendance />} />
        <Route path="manual-attendance" element={<ManualAttendance />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="reports" element={<TeacherReports />} />
        <Route path="anomalies" element={<TeacherAnomalyFlags />} />
      </Route>

      {/* STUDENT NESTED ROUTES */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="attendance" element={<AttendanceView />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="risk" element={<RiskPrediction />} />
        <Route path="face-register" element={<FaceRegistration />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{ duration: 3000, style: { fontSize: "14px" } }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
