import { Link } from "react-router-dom";
import {
  Brain,
  Camera,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  BookOpen,
  Shield,
  GraduationCap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    color: "bg-blue-100 text-blue-600",
    title: "Face Recognition Attendance",
    description:
      "Teacher opens webcam — AI identifies every enrolled student in frame and marks them present in real time. No roll calls. No manual entry.",
  },
  {
    icon: Brain,
    color: "bg-purple-100 text-purple-600",
    title: "AI Risk Predictor",
    description:
      'Gemini AI analyzes 30-day attendance trends and predicts "this student will drop below 75% in 8 days" — even when they\'re currently at 79%.',
  },
  {
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-600",
    title: "Anomaly Detection",
    description:
      "Catches suspicious patterns a rule can't: sudden 100% after weeks at 40%, same-day systematic absence, whole class absent on a non-holiday.",
  },
  {
    icon: TrendingUp,
    color: "bg-green-100 text-green-600",
    title: "Charts & Analytics",
    description:
      "Line, bar, and pie charts for attendance trends. Subject-wise breakdown, platform-wide dashboards, and Excel export with one click.",
  },
  {
    icon: Shield,
    color: "bg-red-100 text-red-600",
    title: "Role-based Access",
    description:
      "Three separate portals — Admin, Teacher, Student — each seeing exactly what they need and nothing they don't.",
  },
  {
    icon: CheckCircle,
    color: "bg-teal-100 text-teal-600",
    title: "Automated Email Alerts",
    description:
      "Threshold alerts when attendance drops below 75%. AI risk alerts when Gemini flags a student as high or critical risk.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">SmartPresence</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Attendance that thinks
          <span className="text-blue-600"> before you do</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          Face recognition automates attendance, AI identifies students at
          attendance risk, and anomaly detection reveals patterns hidden in the
          data.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free
          </Link>
          <Link
            to="/login"
            className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Three AI integrations that go beyond traditional attendance systems
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Face recognition, predictive risk analysis, and anomaly detection
            solve problems that traditional software simply can't.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            One platform, three portals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                role: "Admin",
                color: "border-purple-200 bg-purple-50",
                badge: "bg-purple-100 text-purple-700",
                icon: Shield,
                items: [
                  "Manage teachers & students",
                  "Create subjects & timetable",
                  "Platform analytics",
                  "Anomaly flags overview",
                ],
              },
              {
                role: "Teacher",
                color: "border-green-200 bg-green-50",
                badge: "bg-green-100 text-green-700",
                icon: Users,
                items: [
                  "Face recognition attendance",
                  "Manual attendance fallback",
                  "Student reports & charts",
                  "AI anomaly detection",
                ],
              },
              {
                role: "Student",
                color: "border-blue-200 bg-blue-50",
                badge: "bg-blue-100 text-blue-700",
                icon: GraduationCap,
                items: [
                  "View attendance calendar",
                  "Subject-wise breakdown",
                  "AI risk prediction",
                  "One-time face registration",
                ],
              },
            ].map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.role}
                  className={`rounded-xl border p-5 ${portal.color}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-4 h-4" />
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${portal.badge}`}
                    >
                      {portal.role}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {portal.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to make attendance intelligent?
        </h2>
        <p className="text-gray-500 mb-8">
          Create an account in 30 seconds. No credit card required.
        </p>
        <Link
          to="/register"
          className="inline-block bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg"
        >
          Get Started Free
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">
          SmartPresence — AI-Powered Attendance & Analytics Platform
        </p>
      </footer>
    </div>
  );
};

export default Landing;
