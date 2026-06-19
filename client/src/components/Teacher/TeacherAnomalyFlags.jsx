import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  AlertTriangle,
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Zap,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";

const ANOMALY_TYPE_CONFIG = {
  proxy_suspicion: {
    label: "Proxy Suspicion",
    icon: "🎭",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  systematic_absence: {
    label: "Systematic Absence",
    icon: "📅",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  mass_absence: {
    label: "Mass Absence",
    icon: "👥",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  sudden_drop: {
    label: "Sudden Drop",
    icon: "📉",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  selective_attendance: {
    label: "Selective Attendance",
    icon: "🎯",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  other: {
    label: "Other",
    icon: "⚠️",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const SEVERITY_CONFIG = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const TeacherAnomalyFlags = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [expandedAnomalies, setExpandedAnomalies] = useState(new Set());

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
    if (selectedSubjectId) runDetection(false);
  }, [selectedSubjectId]);

  const runDetection = async (forceRefresh = false) => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const url = `/api/ai/anomaly/${selectedSubjectId}${
        forceRefresh ? "?refresh=true" : ""
      }`;
      const res = await axiosInstance.post(url);
      setResult(res.data);
      if (forceRefresh) toast.success("Anomaly scan complete!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Anomaly detection failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnomaly = (index) => {
    setExpandedAnomalies((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff} minute${diff > 1 ? "s" : ""} ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} day${
      Math.floor(hours / 24) > 1 ? "s" : ""
    } ago`;
  };

  if (loadingSubjects) return <LoadingSkeleton type="card" rows={2} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Anomaly Flags</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          AI detects suspicious attendance patterns — powered by Gemini
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject
            </label>
            {subjects.length === 0 ? (
              <p className="text-sm text-orange-600">
                No subjects assigned yet
              </p>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setResult(null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select Subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={() => runDetection(true)}
            disabled={!selectedSubjectId || loading}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Brain className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Scanning..." : "Run AI Scan"}
          </button>
        </div>
      </div>
      {selectedSubjectId &&
        (loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-pulse" />
            <p className="font-semibold text-gray-800 mb-1">
              Gemini AI is scanning for anomalies...
            </p>
            <p className="text-sm text-gray-500">
              Analyzing attendance matrix, detecting suspicious patterns
            </p>
          </div>
        ) : (
          result && (
            <>
              <div
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium ${
                  result.fromCache
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {result.fromCache
                    ? `Cached scan — run ${timeAgo(result.generatedAt)}`
                    : "Fresh scan just completed"}
                </div>
                <button
                  onClick={() => runDetection(true)}
                  className="flex items-center gap-1 opacity-70 hover:opacity-100"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-scan
                </button>
              </div>

              {result.totalAnomaliesFound === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-800">
                    No Anomalies Detected
                  </p>
                  <p className="text-sm text-green-600 mt-2 max-w-sm mx-auto">
                    {result.summary}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 text-sm">
                        {result.totalAnomaliesFound} Anomal
                        {result.totalAnomaliesFound > 1 ? "ies" : "y"} Detected
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {result.summary}
                      </p>
                    </div>
                  </div>

                  {result.anomalies.map((anomaly, index) => {
                    const typeConfig =
                      ANOMALY_TYPE_CONFIG[anomaly.type] ||
                      ANOMALY_TYPE_CONFIG.other;
                    const isExpanded = expandedAnomalies.has(index);
                    return (
                      <div
                        key={index}
                        className={`rounded-xl border overflow-hidden ${typeConfig.color}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">
                              {typeConfig.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${typeConfig.color}`}
                                >
                                  {typeConfig.label}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                                    SEVERITY_CONFIG[anomaly.severity] ||
                                    SEVERITY_CONFIG.low
                                  }`}
                                >
                                  {anomaly.severity}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {anomaly.description}
                              </p>
                              {anomaly.studentsInvolved?.length > 0 && (
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {anomaly.studentsInvolved.join(", ")}
                                </p>
                              )}
                              {anomaly.dates?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {anomaly.dates.slice(0, 3).join(", ")}
                                  {anomaly.dates.length > 3 &&
                                    ` +${anomaly.dates.length - 3} more`}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleAnomaly(index)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-3"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                            {isExpanded
                              ? "Hide details"
                              : "View evidence & recommendation"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-current border-opacity-20 p-4 bg-white space-y-3">
                            {anomaly.evidence && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  📊 Evidence
                                </p>
                                <p className="text-sm text-gray-700">
                                  {anomaly.evidence}
                                </p>
                              </div>
                            )}
                            {anomaly.recommendation && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                  📌 Recommended Action
                                </p>
                                <p className="text-sm text-blue-800">
                                  {anomaly.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  <Brain className="w-3.5 h-3.5 inline mr-1" />
                  <strong>Note:</strong> These are AI-detected patterns, not
                  proven violations. Always verify manually before taking action
                  against any student.
                </p>
              </div>
            </>
          )
        ))}

      {!selectedSubjectId && subjects.length > 0 && (
        <EmptyState
          icon={Brain}
          title="Select a subject to scan"
          description="Choose a subject above to run Gemini AI anomaly detection on its attendance patterns"
        />
      )}
    </div>
  );
};

export default TeacherAnomalyFlags;
