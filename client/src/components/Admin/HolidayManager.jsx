import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { CalendarX, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../UI/EmptyState";
import LoadingSkeleton from "../UI/LoadingSkeleton";

const HolidayManager = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/api/timetable/holidays")
      .then((res) => setHolidays(res.data.holidays))
      .catch(() => toast.error("Failed to load holidays"))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/api/timetable/holidays", form);
      setHolidays((prev) =>
        [...prev, res.data.holiday].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );
      toast.success("Holiday added!");
      setShowModal(false);
      setForm({ name: "", date: "", description: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add holiday");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/timetable/holidays/${id}`);
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      toast.success("Holiday removed");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete holiday");
    }
  };

  const isPast = (dateStr) => new Date(dateStr) < new Date();

  if (loading) return <LoadingSkeleton type="table" rows={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Holiday Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Attendance is not taken on holiday dates
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      {holidays.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No holidays added"
          description="Add public holidays and college closures. Attendance won't be tracked on these days."
          action={{ label: "Add Holiday", onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {holidays.map((holiday) => (
              <div
                key={holiday._id}
                className={`flex items-center justify-between px-5 py-4 ${
                  isPast(holiday.date) ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <p className="text-xs text-red-400 font-medium uppercase">
                      {new Date(holiday.date).toLocaleString("en-IN", {
                        month: "short",
                      })}
                    </p>
                    <p className="text-lg font-bold text-red-600 leading-none">
                      {new Date(holiday.date).getDate()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{holiday.name}</p>
                    {holiday.description && (
                      <p className="text-sm text-gray-400">
                        {holiday.description}
                      </p>
                    )}
                    {isPast(holiday.date) && (
                      <span className="text-xs text-gray-400">
                        Past holiday
                      </span>
                    )}
                  </div>
                </div>

                {deleteConfirm === holiday._id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(holiday._id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs border text-gray-600 px-2 py-1 rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(holiday._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Holiday</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Diwali, Republic Day..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="National holiday, college closed"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.name || !form.date}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayManager;
