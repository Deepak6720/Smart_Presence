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
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "🎭",
  },
  systematic_absence: {
    label: "Systematic Absence",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "📅",
  },
  mass_absence: {
    label: "Mass Absence",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "👥",
  },
  sudden_drop: {
    label: "Sudden Drop",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "📉",
  },
  selective_attendance: {
    label: "Selective Attendance",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🎯",
  },
  other: {
    label: "Other Anomaly",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "⚠️",
  },
};

const SEVERITY_CONFIG = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const AnomalyCard = ({ anomaly }) => {
  const [expanded, setExpanded] = useState(false);
  const typeConfig =
    ANOMALY_TYPE_CONFIG[anomaly.type] || ANOMALY_TYPE_CONFIG.other;

  return (
    <div className={`border rounded-xl overflow-hidden ${typeConfig.color}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-xl flex-shrink-0">{typeConfig.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${typeConfig.color}`}
                >
                  {typeConfig.label}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                    SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.low
                  }`}
                >
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {anomaly.description}
              </p>
              {anomaly.studentsInvolved?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">
                    {anomaly.studentsInvolved.join(", ")}
                  </span>
                </div>
              )}
              {anomaly.dates?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    {anomaly.dates.slice(0, 3).join(", ")}
                    {anomaly.dates.length > 3 &&
                      ` +${anomaly.dates.length - 3} more`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-3 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? "Hide details" : "View evidence & recommendation"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-current border-opacity-20 p-4 bg-white space-y-3">
          {anomaly.evidence && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                📊 Evidence
              </p>
              <p className="text-sm text-gray-700">{anomaly.evidence}</p>
            </div>
          )}
          {anomaly.recommendation && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-1">
                📌 Recommended Action
              </p>
              <p className="text-sm text-blue-800">{anomaly.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnomalyFlags = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  useEffect(() => {
    fetchAllAnomalies();
  }, []);

  const fetchAllAnomalies = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/ai/all-anomalies");
      setData(res.data);
    } catch {
      toast.error("Failed to load anomaly data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId);
      return next;
    });
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading)
    return (
      <div className="space-y-4">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="card" rows={3} />
      </div>
    );

  const subjectsWithAnomalies =
    data?.subjects?.filter((s) => s.totalAnomaliesFound > 0) || [];

  const totalAnomalies = data?.totalAnomaliesAcrossPlatform || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Anomaly Flags</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-detected suspicious patterns — powered by Gemini
          </p>
        </div>
        <button
          onClick={fetchAllAnomalies}
          className="flex items-center gap-2 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {data?.totalSubjectsScanned || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Subjects Scanned</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center ${
            totalAnomalies > 0
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              totalAnomalies > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {totalAnomalies}
          </p>
          <p
            className={`text-xs mt-1 ${
              totalAnomalies > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Total Anomalies
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {subjectsWithAnomalies.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Subjects Flagged</p>
        </div>
      </div>

      {data?.totalSubjectsScanned === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 text-sm">
                No anomaly scans yet
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Teachers run anomaly detection from their "Anomaly Flags" page.
                Results appear here automatically after each scan.
              </p>
            </div>
          </div>
        </div>
      )}

      {data?.totalSubjectsScanned > 0 && totalAnomalies === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-green-800">All Clear</p>
          <p className="text-sm text-green-600 mt-1">
            No anomalies detected across {data.totalSubjectsScanned} subject
            {data.totalSubjectsScanned > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {subjectsWithAnomalies.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Flagged Subjects</h3>
          {subjectsWithAnomalies.map((subjectData) => {
            const isExpanded = expandedSubjects.has(subjectData.subject?._id);
            return (
              <div
                key={subjectData.subject?._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleSubject(subjectData.subject?._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          subjectData.totalAnomaliesFound > 0
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {subjectData.totalAnomaliesFound}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {subjectData.subject?.name}
                        <span className="text-xs text-gray-400 ml-2">
                          {subjectData.subject?.code}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {subjectData.totalAnomaliesFound} anomal
                        {subjectData.totalAnomaliesFound > 1 ? "ies" : "y"}{" "}
                        detected
                        {subjectData.generatedAt &&
                          ` · ${timeAgo(subjectData.generatedAt)}`}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {subjectData.summary && (
                  <div className="px-5 pb-3 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">
                      {subjectData.summary}
                    </p>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {subjectData.anomalies.map((anomaly, i) => (
                      <AnomalyCard key={i} anomaly={anomaly} />
                    ))}
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
          <strong>AI Disclaimer:</strong> Anomaly flags are AI-generated
          suggestions, not definitive proof of misconduct. Always investigate
          manually before taking action. AI analysis is based on attendance
          patterns only — not student circumstances.
        </p>
      </div>
    </div>
  );
};

export default AnomalyFlags;
