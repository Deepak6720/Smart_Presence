import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import LoadingSkeleton from '../UI/LoadingSkeleton';
import EmptyState from '../UI/EmptyState';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLE = {
  present:    'bg-green-500 text-white',
  absent:     'bg-red-500 text-white',
  late:       'bg-yellow-500 text-white',
  mixed:      'bg-orange-500 text-white',
  holiday:    'bg-gray-200 text-gray-500',
  'no-class': 'bg-white text-gray-300 border border-gray-100',
  future:     'bg-white text-gray-300 border border-dashed border-gray-200'
};

const toDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const recordDateKey = (dateStr) => new Date(dateStr).toISOString().split('T')[0];

const CalendarView = () => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [recordsByDate, setRecordsByDate] = useState({});
  const [holidaysByDate, setHolidaysByDate] = useState({});
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [attendanceRes, holidaysRes] = await Promise.all([
          axiosInstance.get('/api/attendance/mine'),
          axiosInstance.get('/api/timetable/holidays'),
        ]);

        const attendanceData = attendanceRes.data.attendance || [];
        setSubjects(attendanceData.map(s => s.subject));
        const map = {};
        attendanceData.forEach(({ subject, records }) => {
          records.forEach(record => {
            const key = recordDateKey(record.date);
            if (!map[key]) map[key] = [];
            map[key].push({
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.name,
              status: record.status
            });
          });
        });
        setRecordsByDate(map);

        const holidayMap = {};
        (holidaysRes.data.holidays || []).forEach(h => {
          holidayMap[recordDateKey(h.date)] = h.name;
        });
        setHolidaysByDate(holidayMap);

      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const calendarCells = useMemo(() => {
    const { year, month } = currentMonth;
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ blank: true, key: `blank-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = toDateKey(year, month, day);
      const cellDate = new Date(year, month, day);
      const holidayName = holidaysByDate[dateKey];

      let dayRecords = recordsByDate[dateKey] || [];
      if (subjectFilter !== 'all') {
        dayRecords = dayRecords.filter(r => r.subjectId === subjectFilter);
      }

      let status;
      if (holidayName) {
        status = 'holiday';
      } else if (dayRecords.length === 0) {
        status = cellDate > today ? 'future' : 'no-class';
      } else {
        const presentCount = dayRecords.filter(r => r.status === 'present').length;
        const lateCount = dayRecords.filter(r => r.status === 'late').length;
        const absentCount = dayRecords.filter(r => r.status === 'absent').length;

        if (absentCount === dayRecords.length) status = 'absent';
        else if (presentCount === dayRecords.length) status = 'present';
        else if (lateCount === dayRecords.length) status = 'late';
        else status = 'mixed';
      }

      cells.push({
        blank: false,
        key: dateKey,
        day,
        dateKey,
        status,
        holidayName,
        records: dayRecords,
        isToday: cellDate.getTime() === today.getTime()
      });
    }

    return cells;
  }, [currentMonth, recordsByDate, holidaysByDate, subjectFilter]);

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric'
  });

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const month = prev.month === 0 ? 11 : prev.month - 1;
      const year = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year, month };
    });
    setSelectedDateKey(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const month = prev.month === 11 ? 0 : prev.month + 1;
      const year = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year, month };
    });
    setSelectedDateKey(null);
  };

  const now = new Date();
  const isCurrentMonth = currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth();
  const monthStats = useMemo(() => {
    const relevant = calendarCells.filter(
      c => !c.blank && ['present', 'absent', 'late', 'mixed'].includes(c.status)
    );
    return {
      totalDays: relevant.length,
      presentDays: relevant.filter(c => c.status === 'present' || c.status === 'late').length,
      absentDays: relevant.filter(c => c.status === 'absent').length
    };
  }, [calendarCells]);

  const selectedCell = calendarCells.find(c => c.dateKey === selectedDateKey);

  if (loading) return <LoadingSkeleton type="card" rows={3} />;

  if (subjects.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendar View</h2>
          <p className="text-sm text-gray-500 mt-0.5">Day-by-day attendance history</p>
        </div>
        <EmptyState
          icon={CalendarDays}
          title="No attendance data yet"
          description="Your calendar fills in once you're enrolled in subjects and attendance starts being marked"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Calendar View</h2>
        <p className="text-sm text-gray-500 mt-0.5">Day-by-day attendance history</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={subjectFilter}
          onChange={e => { setSubjectFilter(e.target.value); setSelectedDateKey(null); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-32 text-center">{monthLabel}</span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{monthStats.totalDays}</p>
          <p className="text-xs text-gray-500 mt-1">Class Days</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{monthStats.presentDays}</p>
          <p className="text-xs text-green-600 mt-1">Present</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{monthStats.absentDays}</p>
          <p className="text-xs text-red-600 mt-1">Absent</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAY_LABELS.map(label => (
            <div key={label} className="text-center text-xs font-semibold text-gray-400 py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map(cell => {
            if (cell.blank) return <div key={cell.key} />;

            const clickable = cell.status !== 'future';

            return (
              <button
                key={cell.key}
                disabled={!clickable}
                onClick={() => clickable && setSelectedDateKey(
                  selectedDateKey === cell.dateKey ? null : cell.dateKey
                )}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  STATUS_STYLE[cell.status]
                } ${cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${
                  selectedDateKey === cell.dateKey ? 'scale-110 shadow-md' : ''
                } ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
          {[
            { label: 'Present', color: 'bg-green-500' },
            { label: 'Absent', color: 'bg-red-500' },
            { label: 'Late', color: 'bg-yellow-500' },
            { label: 'Mixed', color: 'bg-orange-500' },
            { label: 'Holiday', color: 'bg-gray-200' },
            { label: 'No Class', color: 'bg-white border border-gray-200' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-3 h-3 rounded ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {selectedCell && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">
          {(() => {
            const [y, m, d] = selectedCell.dateKey.split('-').map(Number);
             return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
           weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            })()}
          </p>

          {selectedCell.holidayName ? (
            <p className="text-sm text-gray-600">
              Holiday — <span className="font-medium">{selectedCell.holidayName}</span>
            </p>
          ) : selectedCell.records.length === 0 ? (
            <p className="text-sm text-gray-400">No class session recorded on this date</p>
          ) : (
            <div className="space-y-2">
              {selectedCell.records.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">
                    {r.subjectName}
                    <span className="text-xs text-gray-400 ml-2">{r.subjectCode}</span>
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    r.status === 'present' ? 'bg-green-100 text-green-700' :
                    r.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;