import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { exportToExcel } from '../../utils/exportExcel';
import { FileSpreadsheet, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import EmptyState from '../UI/EmptyState';

const AdminReports = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/attendance/report')
      .then(res => setReport(res.data.report))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    const rows = report.map(r => ({
      'Subject Code': r.subject.code,
      'Subject Name': r.subject.name,
      'Teacher': r.subject.teacher?.name || 'Unassigned',
      'Total Sessions': r.totalSessions,
      'Total Records': r.totalRecords,
      'Overall %': r.overallPercentage
    }));

    const success = exportToExcel(rows, 'SmartPresence_Attendance_Report', 'Report');
    if (success) toast.success('Excel file downloaded!');
    else toast.error('Nothing to export yet');
  };

  if (loading) return <LoadingSkeleton type="table" rows={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Subject-wise attendance summary</p>
        </div>
        <button
          onClick={handleExport}
          disabled={report.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {report.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No data to report yet"
          description="Create subjects and mark attendance to see reports here"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessions</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Records</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.map((r) => (
                <tr key={r.subject._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{r.subject.name}</p>
                    <p className="text-xs text-gray-400">{r.subject.code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {r.subject.teacher?.name || <span className="text-orange-500">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{r.totalSessions}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{r.totalRecords}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${
                      r.overallPercentage >= 75 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {r.overallPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReports;