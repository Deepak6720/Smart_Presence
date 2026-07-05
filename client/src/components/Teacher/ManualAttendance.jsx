import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";

const STATUS_CYCLE = { absent: "present", present: "late", late: "absent" };

const STATUS_CONFIG = {
  present: {
    label: "Present",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    dot: "bg-green-500",
  },
  absent: {
    label: "Absent",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    dot: "bg-red-500",
  },
  late: {
    label: "Late",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
    dot: "bg-yellow-500",
  },
};

const ManualAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sessionExists, setSessionExists] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/api/subjects/mine")
      .then((res) => {
        setSubjects(res.data.subjects);
        if (res.data.subjects.length === 1) {
          setSelectedSubjectId(res.data.subjects[0]._id);
        }
      })
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;

    const loadSession = async () => {
      setLoadingSession(true);
      setStudents([]);
      setAttendance({});

      try {
        const subjectRes = await axiosInstance.get("/api/subjects/mine");
        const subject = subjectRes.data.subjects.find(
          (s) => s._id === selectedSubjectId
        );

        if (!subject || !subject.students) {
          setLoadingSession(false);
          return;
        }
        const enrolledStudents = subject.students;
        setStudents(enrolledStudents);
        const initialAttendance = {};
        enrolledStudents.forEach((s) => {
          initialAttendance[s._id] = "absent";
        });

        const sessionRes = await axiosInstance.get(
          `/api/attendance/session?subjectId=${selectedSubjectId}&date=${selectedDate}`
        );

        if (sessionRes.data.exists) {
          setSessionExists(true);
          sessionRes.data.records.forEach((record) => {
            if (record.student) {
              initialAttendance[record.student._id] = record.status;
            }
          });
        } else {
          setSessionExists(false);
        }

        setAttendance(initialAttendance);
      } catch (error) {
        console.log(error);
        toast.error("Failed to load session data");
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [selectedSubjectId, selectedDate]);

  const toggleStudent = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: STATUS_CYCLE[prev[studentId] || "absent"],
    }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s._id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (students.length === 0)
      return toast.error("No students enrolled in this subject");

    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendance[s._id] || "absent",
      }));

      await axiosInstance.post("/api/attendance", {
        subjectId: selectedSubjectId,
        date: selectedDate,
        records,
      });

      toast.success(
        sessionExists
          ? "Attendance updated!"
          : "Attendance marked successfully!"
      );
      setSessionExists(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(
    (s) => s === "present" || s === "late"
  ).length;
  const absentCount = Object.values(attendance).filter(
    (s) => s === "absent"
  ).length;
  const lateCount = Object.values(attendance).filter(
    (s) => s === "late"
  ).length;
  const totalCount = students.length;

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  if (loadingSubjects) return <LoadingSkeleton type="card" rows={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Manual Attendance</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a subject and date, then mark each student
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            {subjects.length === 0 ? (
              <p className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                No subjects assigned to you yet. Ask admin to assign subjects.
              </p>
            ) : (
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">— Select Subject —</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isToday && (
              <p className="text-xs text-orange-500 mt-1">
                You're marking attendance for a past date
              </p>
            )}
          </div>
        </div>

        {selectedSubjectId && !loadingSession && (
          <div
            className={`mt-3 text-xs px-3 py-2 rounded-lg font-medium ${
              sessionExists
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-gray-50 text-gray-600 border border-gray-200"
            }`}
          >
            {sessionExists
              ? "✏️ Attendance already marked for this date — submitting will update existing records"
              : "📋 No attendance marked yet for this date — this will be a new session"}
          </div>
        )}
      </div>

      {selectedSubjectId &&
        (loadingSession ? (
          <LoadingSkeleton type="table" rows={5} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students enrolled"
            description="Ask admin to enroll students in this subject from Subject Management"
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {presentCount} Present
                </span>
                {lateCount > 0 && (
                  <span className="flex items-center gap-1.5 text-yellow-600 font-medium">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    {lateCount} Late
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {absentCount} Absent
                </span>
                <span className="text-gray-400">/ {totalCount} total</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => markAll("present")}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
                >
                  All Present
                </button>
                <button
                  onClick={() => markAll("absent")}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {students.map((student, index) => {
                const status = attendance[student._id] || "absent";
                const config = STATUS_CONFIG[status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={student._id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleStudent(student._id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-6 text-right">
                        {index + 1}
                      </span>

                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{student.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold select-none ${config.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Click any student to cycle: Absent → Present → Late
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || students.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                {submitting
                  ? "Saving..."
                  : sessionExists
                  ? "Update Attendance"
                  : "Submit Attendance"}
              </button>
            </div>
          </div>
        ))}

      {!selectedSubjectId && subjects.length > 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Select a subject to begin"
          description="Choose a subject from the dropdown above, then pick a date to mark attendance"
        />
      )}
    </div>
  );
};

export default ManualAttendance;
