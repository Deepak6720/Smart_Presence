import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../UI/EmptyState';
import LoadingSkeleton from '../UI/LoadingSkeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManager = () => {
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
  
  useEffect(() => {
    const fetch = async () => {
      try {
        const [ttRes, subRes] = await Promise.all([
          axiosInstance.get('/api/timetable'),
          axiosInstance.get('/api/subjects'),
        ]);
        setTimetable(ttRes.data.timetable);
        setSubjects(subRes.data.subjects.filter(s => s.teacher));
      } catch {
        toast.error('Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/api/timetable', form);
      setTimetable(prev => [...prev, res.data.entry]);
      toast.success('Class added to timetable!');
      setShowModal(false);
      setForm({ subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add entry');
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/timetable/${id}`);
      setTimetable(prev => prev.filter(e => e._id !== id));
      toast.success('Entry removed');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(e => e.dayOfWeek === day);
    return acc;
  }, {});
  
  if (loading) return <LoadingSkeleton type="card" rows={3} />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Timetable</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assign subjects to days and time slots</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>
      
      {timetable.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Timetable is empty"
          description="Add subjects to the timetable. Make sure subjects have a teacher assigned first."
          action={{ label: 'Add Class', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => {
            const entries = groupedByDay[day];
            if (entries.length === 0) return null;
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 text-sm">{day}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {entries.map(entry => (
                    <div key={entry._id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-semibold text-gray-900">{entry.startTime}</p>
                          <p className="text-xs text-gray-400">to {entry.endTime}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {entry.subject?.name}
                            <span className="text-xs text-gray-400 ml-2">{entry.subject?.code}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.teacher?.name}
                            {entry.room && ` · ${entry.room}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(entry._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Class to Timetable</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={e => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code}) — {s.teacher?.name}</option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">Assign teachers to subjects first before adding to timetable</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
                <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                  placeholder="Lab 3, Room 201"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleAdd} disabled={!form.subjectId}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  Add to Timetable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManager;