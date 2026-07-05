import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { exportToExcel } from '../../utils/exportExcel';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Download, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import EmptyState from '../UI/EmptyState';

const COLORS = { present: '#10B981', late: '#F59E0B', absent: '#EF4444' };

const TeacherReports = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/subjects/mine')
      .then(res => {
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
    axiosInstance.get(`/api/attendance/subject/${selectedSubjectId}`)
      .then(res => setReportData(res.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [selectedSubjectId]);

  const chronologicalSessions = useMemo(() => {
    if (!reportData?.sessions) return [];
    return [...reportData.sessions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        ...s,
        percentage: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0
      }));
  }, [reportData]);

  const pieData = useMemo(() => {
    if (!reportData?.sessions) return [];
    const totals = reportData.sessions.reduce(
      (acc, s) => ({
        present: acc.present + s.present,
        late: acc.late + s.late,
        absent: acc.absent + s.absent
      }),
      { present: 0, late: 0, absent: 0 }
    );
    return [
      { name: 'Present', value: totals.present, color: COLORS.present },
      { name: 'Late',    value: totals.late,    color: COLORS.late },
      { name: 'Absent',  value: totals.absent,  color: COLORS.absent },
    ].filter(d => d.value > 0);
  }, [reportData]);

  const handleExport = () => {
    if (!reportData?.studentStats) return;
    const rows = reportData.studentStats.map(s => ({
      'Student Name': s.student.name,
      'Email': s.student.email,
      'Attended': s.attended,
      'Total Sessions': s.totalSessions,
      'Percentage': s.percentage,
      'At Risk': s.isAtRisk ? 'Yes' : 'No'
    }));
    const success = exportToExcel(
      rows,
      `${reportData.subject.code}_Attendance_Report`,
      reportData.subject.code
    );
    if (success) toast.success('Excel file downloaded!');
  };

  const formatDateTick = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (loadingSubjects) return <LoadingSkeleton type="card" rows={2} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visual attendance breakdown for your subjects</p>
        </div>
        {reportData && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
        {subjects.length === 0 ? (
          <p className="text-sm text-orange-600">No subjects assigned yet</p>
        ) : (
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select a subject —</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        )}
      </div>

      {selectedSubjectId && (
        loading ? (
          <LoadingSkeleton type="card" rows={2} />
        ) : reportData?.totalSessions === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No attendance marked yet"
            description="Charts will appear once you start marking attendance for this subject"
          />
        ) : reportData && (
          <>
            {/* Line chart — class average over time */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Class Attendance Trend</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={chronologicalSessions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip labelFormatter={formatDateTick} formatter={(v) => [`${v}%`, 'Class Average']} />
                    <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">Student-wise Attendance</h3>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={reportData.studentStats.map(s => ({name: (s.student?.name || 'Unknown').split(' ')[0],percentage: s.percentage}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                      <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" />
                      <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                        {reportData.studentStats.map((s, index) => (
                          <Cell key={index} fill={s.percentage >= 75 ? COLORS.present : COLORS.absent} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieIcon className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">Status Distribution</h3>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} records`]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {!selectedSubjectId && subjects.length > 0 && (
        <EmptyState
          icon={BarChart3}
          title="Select a subject to view reports"
          description="Choose a subject above to see attendance charts and export options"
        />
      )}
    </div>
  );
};

export default TeacherReports;