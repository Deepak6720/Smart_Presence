import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  History,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";

const AttendanceHistory = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    axiosInstance
      .get("/api/subjects/mine")
      .then((res) => {
        setSubjects(res.data.subjects);
        if (res.data.subjects.length === 1) {
          setSelectedSubjectId(res.data.subjects[0]._id);
        }
      })
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setLoading(true);
    setReportData(null);

    axiosInstance
      .get(`/api/attendance/subject/${selectedSubjectId}`)
      .then((res) => setReportData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSubjectId]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loadingSubjects) return <LoadingSkeleton type="card" rows={2} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Attendance History & Reports
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          View student-wise stats and session history
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Subject
        </label>
        {subjects.length === 0 ? (
          <p className="text-sm text-orange-600">No subjects assigned yet</p>
        ) : (
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select a subject —</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedSubjectId &&
        (loading ? (
          <LoadingSkeleton type="table" rows={6} />
        ) : !reportData ? null : reportData.totalSessions === 0 ? (
          <EmptyState
            icon={History}
            title="No attendance marked yet"
            description="Start marking attendance using the Manual Attendance page"
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total Sessions",
                  value: reportData.totalSessions,
                  color: "bg-blue-50 text-blue-700",
                },
                {
                  label: "Students Enrolled",
                  value: reportData.studentStats.length,
                  color: "bg-purple-50 text-purple-700",
                },
                {
                  label: "At Risk",
                  value: reportData.studentStats.filter((s) => s.isAtRisk)
                    .length,
                  color: "bg-red-50 text-red-700",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl p-4 text-center ${card.color}`}
                >
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs font-medium mt-1 opacity-80">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              {["students", "sessions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "students" ? "Student Report" : "Session History"}
                </button>
              ))}
            </div>
            {activeTab === "students" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Attendance — sorted by risk
                  </p>
                </div>
                {reportData.studentStats.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No students enrolled
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reportData.studentStats.map(
                      ({
                        student,
                        attended,
                        absent,
                        totalSessions,
                        percentage,
                        isAtRisk,
                      }) => (
                        <div key={student._id} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  student.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  {student.name}
                                  {isAtRisk && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      At Risk
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {attended}/{totalSessions} classes attended
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-lg font-bold ${
                                percentage >= 75
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                percentage >= 75
                                  ? "bg-green-500"
                                  : percentage >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="relative h-0">
                            <div
                              className="absolute top-[-8px] w-0.5 h-4 bg-gray-400 opacity-40"
                              style={{ left: "75%" }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="space-y-3">
                {reportData.sessions.map((session) => (
                  <div
                    key={session.date}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedSession(
                          expandedSession === session.date ? null : session.date
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(session.date)}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600 font-medium">
                            {session.present} present
                          </span>
                          <span className="text-red-500">
                            {session.absent} absent
                          </span>
                          {session.late > 0 && (
                            <span className="text-yellow-600">
                              {session.late} late
                            </span>
                          )}
                        </div>
                      </div>
                      {expandedSession === session.date ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {expandedSession === session.date && (
                      <div className="border-t border-gray-100 divide-y divide-gray-100">
                        {session.records.map((record) => (
                          <div
                            key={record._id}
                            className="flex items-center justify-between px-5 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs">
                                {record.student?.name?.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm text-gray-700">
                                {record.student?.name}
                              </p>
                            </div>
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
                ))}
              </div>
            )}
          </>
        ))}
    </div>
  );
};

export default AttendanceHistory;
