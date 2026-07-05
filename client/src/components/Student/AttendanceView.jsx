import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";
import { BookOpen } from "lucide-react";

const AttendanceView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/api/attendance/mine")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) return <LoadingSkeleton type="card" rows={4} />;

  if (!data || data.attendance.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No attendance data yet"
        description="Your attendance will appear here once your teacher starts marking sessions"
      />
    );
  }

  const { overall } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Attendance</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your attendance across all enrolled subjects
        </p>
      </div>

      <div
        className={`rounded-xl p-6 text-white ${
          overall.percentage >= 75
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : "bg-gradient-to-r from-red-500 to-rose-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Overall Attendance</p>
            <p className="text-4xl font-bold mt-1">{overall.percentage}%</p>
            <p className="text-sm opacity-80 mt-1">
              {overall.totalAttended} of {overall.totalClasses} classes attended
            </p>
          </div>
          <div className="text-right">
            {overall.percentage >= 75 ? (
              <CheckCircle className="w-12 h-12 opacity-80" />
            ) : (
              <AlertTriangle className="w-12 h-12 opacity-80" />
            )}
            <p className="text-xs mt-2 opacity-80">
              {overall.percentage >= 75
                ? "You're on track! "
                : "Below 75% threshold "}
            </p>
          </div>
        </div>

        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div
            className="h-2 bg-white rounded-full"
            style={{ width: `${Math.min(overall.percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs mt-1 opacity-60">
          <span>0%</span>
          <span
            className="absolute"
            style={{ marginLeft: "75%", marginTop: "-8px" }}
          >
            75%
          </span>
          <span>100%</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Subject-wise Breakdown</h3>

        {data.attendance.map((item) => (
          <div
            key={item.subject._id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              onClick={() =>
                setExpandedSubject(
                  expandedSubject === item.subject._id ? null : item.subject._id
                )
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md">
                    {item.subject.code}
                  </span>
                  {item.isAtRisk && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      At Risk
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900">
                  {item.subject.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Teacher: {item.subject.teacher?.name || "Not assigned"} ·
                  {item.attended}/{item.totalSessions} attended
                </p>

                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.percentage >= 75
                        ? "bg-green-500"
                        : item.percentage >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {item.isAtRisk &&
                  item.totalSessions > 0 &&
                  (() => {
                    const needed = Math.ceil(
                      (0.75 * item.totalSessions - item.attended) / 0.25
                    );
                    return needed > 0 ? (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        Need {needed} consecutive present{needed > 1 ? "s" : ""}{" "}
                        to reach 75%
                      </p>
                    ) : null;
                  })()}
              </div>

              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <span
                  className={`text-xl font-bold ${
                    item.percentage >= 75 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.percentage}%
                </span>
                {expandedSubject === item.subject._id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedSubject === item.subject._id && (
              <div className="border-t border-gray-100">
                {item.records.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No records yet
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {item.records.map((record) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between px-5 py-2.5"
                      >
                        <p className="text-sm text-gray-600">
                          {formatDate(record.date)}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "late"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceView;
