import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import EmptyState from '../UI/EmptyState';

const COLORS = { present: '#10B981', late: '#F59E0B', absent: '#EF4444' };

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/attendance/analytics')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDateTick = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (loading) return (
    <div className="space-y-4">
      <LoadingSkeleton type="stats" />
      <LoadingSkeleton type="card" rows={2} />
    </div>
  );

  if (!data || data.trend.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide attendance trends</p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No attendance data yet"
          description="Charts will appear once teachers start marking attendance"
        />
      </div>
    );
  }

  const { trend, subjectBreakdown, statusDistribution } = data;

  const pieData = [
    { name: 'Present', value: statusDistribution.present, color: COLORS.present },
    { name: 'Late',    value: statusDistribution.late,    color: COLORS.late },
    { name: 'Absent',  value: statusDistribution.absent,  color: COLORS.absent },
  ].filter(d => d.value > 0);

  const totalRecords = statusDistribution.present + statusDistribution.late + statusDistribution.absent;
  const overallPercentage = totalRecords > 0
    ? Math.round(((statusDistribution.present + statusDistribution.late) / totalRecords) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide attendance trends — last 30 days</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
          <p className="text-xs text-gray-500 mt-1">Records (30 days)</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{overallPercentage}%</p>
          <p className="text-xs text-green-600 mt-1">Overall Attendance</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{subjectBreakdown.length}</p>
          <p className="text-xs text-blue-600 mt-1">Subjects Tracked</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">30-Day Attendance Trend</h3>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                labelFormatter={formatDateTick}
                formatter={(value) => [`${value}%`, 'Attendance']}
              />
              <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '75% threshold', fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }} />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Attendance by Subject</h3>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={subjectBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="subjectCode" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(value, _name, props) => [`${value}%`, props.payload.subjectName]} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>

                  {subjectBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.percentage >= 75 ? COLORS.present : COLORS.absent} />
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
    </div>
  );
};

export default Analytics;